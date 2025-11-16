import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { getDbInstance } from '../services/firebase';
import { MedicationEvent } from '../types';
import { getCache, setCache } from '../utils/cache';

interface UseLatestMedicationEventOptions {
  patientId?: string;
  caregiverId?: string;
  enabled?: boolean;
}

interface UseLatestMedicationEventResult {
  event: MedicationEvent | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch the latest medication event for a patient
 * 
 * This hook queries the medicationEvents collection to find the most recent event
 * for a specific patient and/or caregiver.
 * 
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Caching with AsyncStorage for instant rendering
 * - Error handling with retry capability
 * - Loading states
 * - Optimized query with proper indexing
 * 
 * @param options - Hook configuration
 * @returns Latest event data, loading state, error, and refetch function
 */
export function useLatestMedicationEvent({
  patientId,
  caregiverId,
  enabled = true,
}: UseLatestMedicationEventOptions): UseLatestMedicationEventResult {
  const [event, setEvent] = useState<MedicationEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Memoize cache key to prevent unnecessary re-fetches
   */
  const cacheKey = useMemo(() => {
    if (patientId) return `latest_event:${patientId}`;
    if (caregiverId) return `latest_event:caregiver:${caregiverId}`;
    return null;
  }, [patientId, caregiverId]);

  /**
   * Fetch the latest medication event
   * Optimized with caching for instant rendering
   */
  const fetchLatestEvent = useCallback(async () => {
    if (!enabled || (!patientId && !caregiverId)) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to load from cache first for instant rendering
      if (cacheKey) {
        const cached = await getCache<MedicationEvent>(cacheKey);
        if (cached) {
          setEvent(cached);
          setIsLoading(false); // Show cached data immediately
          console.log('[useLatestMedicationEvent] Loaded from cache');
        }
      }

      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore not available');
      }

      // Build query constraints
      const constraints: QueryConstraint[] = [];

      if (caregiverId) {
        constraints.push(where('caregiverId', '==', caregiverId));
      }

      if (patientId) {
        constraints.push(where('patientId', '==', patientId));
      }

      // If no filters provided, we can't query
      if (constraints.length === 0) {
        setEvent(null);
        setIsLoading(false);
        return;
      }

      constraints.push(orderBy('timestamp', 'desc'));
      constraints.push(limit(1));

      const eventsQuery = query(
        collection(db, 'medicationEvents'),
        ...constraints
      );

      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(
        eventsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();

            const eventData: MedicationEvent = {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate?.() || data.timestamp,
            } as MedicationEvent;

            setEvent(eventData);

            // Cache the result for next time
            if (cacheKey) {
              setCache(cacheKey, eventData).catch(err => {
                console.error('[useLatestMedicationEvent] Cache error:', err);
              });
            }

            console.log('[useLatestMedicationEvent] Fetched latest event:', eventData.id);
          } else {
            setEvent(null);
            console.log('[useLatestMedicationEvent] No events found');
          }

          setIsLoading(false);
        },
        (err) => {
          console.error('[useLatestMedicationEvent] Listener error:', err);
          setError(err as Error);
          setIsLoading(false);
        }
      );

      // Return unsubscribe function
      return unsubscribe;
    } catch (err: any) {
      console.error('[useLatestMedicationEvent] Error fetching event:', err);
      setError(err);
      setIsLoading(false);
    }
  }, [patientId, caregiverId, enabled, cacheKey]);

  /**
   * Set up real-time listener
   */
  useEffect(() => {
    if (!enabled || (!patientId && !caregiverId)) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const setupListener = async () => {
      try {
        const db = await getDbInstance();
        if (!db) {
          throw new Error('Firestore not available');
        }

        // Build query constraints
        const constraints: QueryConstraint[] = [];

        if (caregiverId) {
          constraints.push(where('caregiverId', '==', caregiverId));
        }

        if (patientId) {
          constraints.push(where('patientId', '==', patientId));
        }

        // If no filters provided, we can't query
        if (constraints.length === 0) {
          if (mounted) {
            setEvent(null);
            setIsLoading(false);
          }
          return;
        }

        constraints.push(orderBy('timestamp', 'desc'));
        constraints.push(limit(1));

        const eventsQuery = query(
          collection(db, 'medicationEvents'),
          ...constraints
        );

        // Set up real-time listener
        unsubscribe = onSnapshot(
          eventsQuery,
          (snapshot) => {
            if (!mounted) return;

            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              const data = doc.data();

              const eventData: MedicationEvent = {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate?.() || data.timestamp,
              } as MedicationEvent;

              setEvent(eventData);

              // Cache the result
              if (cacheKey) {
                setCache(cacheKey, eventData).catch(err => {
                  console.error('[useLatestMedicationEvent] Cache error:', err);
                });
              }

              console.log('[useLatestMedicationEvent] Event updated:', eventData.id);
            } else {
              setEvent(null);
              console.log('[useLatestMedicationEvent] No events found');
            }

            setIsLoading(false);
          },
          (err) => {
            if (!mounted) return;
            console.error('[useLatestMedicationEvent] Listener error:', err);
            setError(err as Error);
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        console.error('[useLatestMedicationEvent] Setup error:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [patientId, caregiverId, enabled, cacheKey]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    await fetchLatestEvent();
  }, [fetchLatestEvent]);

  return {
    event,
    isLoading,
    error,
    refetch,
  };
}

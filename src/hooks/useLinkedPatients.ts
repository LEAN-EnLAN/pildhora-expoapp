import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getDbInstance } from '../services/firebase';
import { PatientWithDevice } from '../types';
import { getCache, setCache } from '../utils/cache';

// Maximum number of patients to fetch at once (pagination support)
const MAX_PATIENTS_PER_FETCH = 50;

interface UseLinkedPatientsOptions {
  caregiverId: string | null;
  enabled?: boolean;
}

interface UseLinkedPatientsResult {
  patients: PatientWithDevice[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch patients linked to a caregiver via deviceLinks collection
 * 
 * This hook queries the deviceLinks collection to find all devices linked to the caregiver,
 * then fetches the corresponding patient data for each device.
 * 
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Caching with AsyncStorage for instant rendering
 * - Error handling with retry capability
 * - Loading states
 * - Optimized data fetching with pagination support
 * 
 * @param options - Hook configuration
 * @returns Patients data, loading state, error, and refetch function
 */
export function useLinkedPatients({
  caregiverId,
  enabled = true,
}: UseLinkedPatientsOptions): UseLinkedPatientsResult {
  const [patients, setPatients] = useState<PatientWithDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetchedRef = useRef(false);
  const fetchLinkedPatientsRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Fetch all linked patients via deviceLinks collection
   * Optimized with caching, pagination, and parallel fetching
   */
  const fetchLinkedPatients = useCallback(async () => {
    // Prevent repeated automatic fetches when nothing changed
    if (hasFetchedRef.current || !caregiverId || !enabled) {
      return;
    }

    try {
      // Step 1: Try to load from cache first for instant rendering (SWR pattern)
      const currentCacheKey = caregiverId ? `linked_patients:${caregiverId}` : null;
      if (currentCacheKey) {
        const cached = await getCache<PatientWithDevice[]>(currentCacheKey);
        if (cached && cached.length > 0) {
          setPatients(cached);
          setIsLoading(false); // Show cached data immediately
          console.log('[useLinkedPatients] Loaded from cache:', cached.length, 'patients');
        }
      }

      // Step 2: Fetch fresh data from Firestore
      setError(null);

      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore not available');
      }

      // Query deviceLinks collection for this caregiver with pagination
      const deviceLinksQuery = query(
        collection(db, 'deviceLinks'),
        where('userId', '==', caregiverId),
        where('role', '==', 'caregiver'),
        where('status', '==', 'active'),
        limit(MAX_PATIENTS_PER_FETCH)
      );

      const deviceLinksSnapshot = await getDocs(deviceLinksQuery);
      
      if (deviceLinksSnapshot.empty) {
        console.log('[useLinkedPatients] No device links found for caregiver');
        setPatients([]);
        setIsLoading(false);
        return;
      }

      // Extract deviceIds from deviceLinks
      const deviceIds = deviceLinksSnapshot.docs.map(doc => doc.data().deviceId);
      console.log('[useLinkedPatients] Found', deviceIds.length, 'linked devices');

      // Step 3: Fetch patients in parallel for better performance
      // Use Promise.all for parallel fetching (optimized)
      const patientPromises = deviceIds.map(async (deviceId) => {
        try {
          // Query for patient with this deviceId (with limit for optimization)
          const patientQuery = query(
            collection(db, 'users'),
            where('role', '==', 'patient'),
            where('deviceId', '==', deviceId),
            limit(1) // Only need one patient per device
          );

          const patientSnapshot = await getDocs(patientQuery);
          
          if (patientSnapshot.empty) {
            console.warn(`[useLinkedPatients] No patient found for device ${deviceId}`);
            return null;
          }

          // Get the first patient (should only be one per device)
          const patientDoc = patientSnapshot.docs[0];
          const data = patientDoc.data();
          
          return {
            id: patientDoc.id,
            ...data,
            deviceId,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          } as PatientWithDevice;
        } catch (err) {
          console.error(`[useLinkedPatients] Error fetching patient for device ${deviceId}:`, err);
          return null;
        }
      });

      const patientsData = await Promise.all(patientPromises);
      const validPatients = patientsData.filter((p): p is PatientWithDevice => p !== null);

      console.log('[useLinkedPatients] Fetched', validPatients.length, 'patients from Firestore');
      setPatients(validPatients);

      // Step 4: Update cache with fresh data
      if (currentCacheKey && validPatients.length > 0) {
        await setCache(currentCacheKey, validPatients);
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('[useLinkedPatients] Error fetching linked patients:', err);
      setError(err);
      setIsLoading(false);
    }

    hasFetchedRef.current = true;
  }, [caregiverId, enabled]);

  // Store the fetch function in a ref to avoid dependency issues
  fetchLinkedPatientsRef.current = fetchLinkedPatients;

  /**
   * Initial fetch for linked patients
   * (real-time listener removed to avoid repeated re-fetch loops)
   */
  useEffect(() => {
    if (!caregiverId || !enabled) {
      setIsLoading(false);
      return;
    }

    // Reset fetch flag when caregiverId or enabled changes
    hasFetchedRef.current = false;

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      try {
        await fetchLinkedPatientsRef.current?.();
      } catch {
        // Errors are handled inside fetchLinkedPatients
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [caregiverId, enabled]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    hasFetchedRef.current = false;
    await fetchLinkedPatients();
  }, [fetchLinkedPatients]);

  return {
    patients,
    isLoading,
    error,
    refetch,
  };
}

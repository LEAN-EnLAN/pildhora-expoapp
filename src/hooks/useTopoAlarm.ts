/**
 * useTopoAlarm Hook
 * 
 * Monitors the topo state in Firebase RTDB and triggers alarm overlay
 * when topo becomes true. Handles both supervised and autonomous modes.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { getDeviceRdbInstance } from '../services/firebase';
import { Medication } from '../types';

export interface TopoAlarmState {
  /** Whether topo is currently active */
  isActive: boolean;
  /** The medication that triggered the alarm (based on current time) */
  activeMedication: Medication | null;
  /** Timestamp when topo became active */
  activatedAt: Date | null;
  /** Whether we're loading the initial state */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

export interface UseTopoAlarmOptions {
  /** Device ID to monitor */
  deviceId?: string;
  /** Whether monitoring is enabled */
  enabled?: boolean;
  /** List of today's medications to match against */
  todayMedications?: Medication[];
  /** Timeout in milliseconds before marking as missed (default: 5 minutes) */
  timeoutMs?: number;
}

export interface UseTopoAlarmResult extends TopoAlarmState {
  /** Dismiss the alarm and set topo to false */
  dismissAlarm: () => Promise<void>;
  /** Check if alarm has timed out */
  hasTimedOut: boolean;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Find the medication that's closest to the current time
 */
function findCurrentMedication(medications: Medication[]): Medication | null {
  if (!medications || medications.length === 0) return null;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeDecimal = currentHour + currentMinute / 60;

  let closestMed: Medication | null = null;
  let closestDiff = Infinity;

  for (const med of medications) {
    if (!med.times || med.times.length === 0) continue;

    for (const time of med.times) {
      const [hh, mm] = time.split(':').map(Number);
      if (isNaN(hh)) continue;
      
      const timeDecimal = hh + (mm || 0) / 60;
      const diff = Math.abs(timeDecimal - currentTimeDecimal);

      // Consider medications within 2 hours of current time to account for late alarms/drifts
      if (diff < 2.0 && diff < closestDiff) {
        closestDiff = diff;
        closestMed = med;
      }
    }
  }

  if (!closestMed && medications.length > 0) {
     console.warn('[useTopoAlarm] No medication found within 2 hours window. Closest diff:', closestDiff);
  }

  return closestMed;
}

export function useTopoAlarm({
  deviceId,
  enabled = true,
  todayMedications = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: UseTopoAlarmOptions): UseTopoAlarmResult {
  const [state, setState] = useState<TopoAlarmState>({
    isActive: false,
    activeMedication: null,
    activatedAt: null,
    isLoading: true,
    error: null,
  });

  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTopoRef = useRef<boolean | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Monitor topo state
  useEffect(() => {
    if (!deviceId || !enabled) {
      setState(prev => ({ ...prev, isLoading: false, isActive: false }));
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupListener = async () => {
      try {
        // Validate device ID for RTDB compatibility
        // RTDB paths cannot contain ".", "#", "$", "[", or "]"
        if (deviceId.includes('#') || deviceId.includes('.') || deviceId.includes('$') || deviceId.includes('[') || deviceId.includes(']')) {
          console.warn(`[useTopoAlarm] Invalid device ID for RTDB: ${deviceId}. Skipping listener setup.`);
          setState(prev => ({ ...prev, isLoading: false, isActive: false, error: null }));
          return;
        }

        const rdb = await getDeviceRdbInstance();
        if (!rdb || !mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const topoRef = ref(rdb, `devices/${deviceId}/commands/topo`);

        unsubscribe = onValue(
          topoRef,
          (snapshot) => {
            if (!mounted) return;

            const topoValue = snapshot.val();
            const isTopoActive = topoValue === true;

            console.log('[useTopoAlarm] Topo state changed:', {
              deviceId,
              isTopoActive,
              previousValue: previousTopoRef.current,
            });

            // Detect transition from false/null to true
            if (isTopoActive && previousTopoRef.current !== true) {
              const activeMedication = findCurrentMedication(todayMedications);
              
              setState({
                isActive: true,
                activeMedication,
                activatedAt: new Date(),
                isLoading: false,
                error: null,
              });

              setHasTimedOut(false);

              // Start timeout timer
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              timeoutRef.current = setTimeout(() => {
                if (mounted) {
                  console.log('[useTopoAlarm] Alarm timed out');
                  setHasTimedOut(true);
                }
              }, timeoutMs);
            }
            // Detect transition from true to false
            else if (!isTopoActive && previousTopoRef.current === true) {
              // Clear timeout
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }

              setState(prev => ({
                ...prev,
                isActive: false,
                isLoading: false,
              }));
            }
            else {
              setState(prev => ({
                ...prev,
                isActive: isTopoActive,
                isLoading: false,
              }));
            }

            previousTopoRef.current = isTopoActive;
          },
          (error) => {
            if (!mounted) return;
            console.error('[useTopoAlarm] RTDB listener error:', error);
            setState(prev => ({
              ...prev,
              error: error as Error,
              isLoading: false,
            }));
          }
        );
      } catch (error) {
        if (!mounted) return;
        console.error('[useTopoAlarm] Setup error:', error);
        setState(prev => ({
          ...prev,
          error: error as Error,
          isLoading: false,
        }));
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [deviceId, enabled, timeoutMs, todayMedications]);

  // Dismiss alarm by setting topo to false
  const dismissAlarm = useCallback(async () => {
    if (!deviceId) return;

    try {
      const rdb = await getDeviceRdbInstance();
      if (!rdb) {
        throw new Error('RTDB not initialized');
      }

      const topoRef = ref(rdb, `devices/${deviceId}/commands/topo`);
      await set(topoRef, false);

      console.log('[useTopoAlarm] Alarm dismissed, topo set to false');
    } catch (error) {
      console.error('[useTopoAlarm] Error dismissing alarm:', error);
      throw error;
    }
  }, [deviceId]);

  return {
    ...state,
    dismissAlarm,
    hasTimedOut,
  };
}

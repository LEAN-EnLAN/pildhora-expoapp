import { useEffect, useState, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDeviceRdbInstance } from '../services/firebase';
import { DeviceState } from '../types';

interface UseDeviceStateOptions {
  deviceId?: string;
  enabled?: boolean;
}

interface UseDeviceStateResult {
  deviceState: DeviceState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch device state from Firebase Realtime Database
 * 
 * This hook sets up a real-time listener for device state changes in RTDB.
 * It automatically updates when the device state changes.
 * 
 * Features:
 * - Real-time updates via RTDB onValue
 * - Error handling
 * - Loading states
 * - Automatic cleanup on unmount
 * 
 * @param options - Hook configuration
 * @returns Device state data, loading state, error, and refetch function
 */
export function useDeviceState({
  deviceId,
  enabled = true,
}: UseDeviceStateOptions): UseDeviceStateResult {
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  /**
   * Set up RTDB listener for device state
   */
  useEffect(() => {
    if (!deviceId || !enabled) {
      setIsLoading(false);
      setDeviceState(null);
      setError(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupListener = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const rtdb = await getDeviceRdbInstance();
        if (!rtdb) {
          throw new Error('Firebase Realtime Database not initialized');
        }

        const deviceRef = ref(rtdb, `devices/${deviceId}/state`);

        unsubscribe = onValue(
          deviceRef,
          (snapshot) => {
            if (!mounted) return;

            const data = snapshot.val() as DeviceState | null;
            setDeviceState(data);
            setIsLoading(false);
            setError(null);

            console.log('[useDeviceState] Device state updated:', {
              deviceId,
              isOnline: data?.is_online,
              batteryLevel: data?.battery_level,
            });
          },
          (err) => {
            if (!mounted) return;

            console.error('[useDeviceState] RTDB listener error:', err);
            setError(err as Error);
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;

        console.error('[useDeviceState] Setup error:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [deviceId, enabled, refreshToggle]);

  /**
   * Manual refetch function (triggers re-setup of listener)
   */
  const refetch = useCallback(() => {
    setRefreshToggle(prev => !prev);
  }, []);

  return {
    deviceState,
    isLoading,
    error,
    refetch,
  };
}

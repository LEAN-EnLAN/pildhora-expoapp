/**
 * usePastilleroStatus Hook
 * 
 * Custom hook to listen to pastillero device status in real-time from Firebase RTDB.
 * Provides online status, last dispense timestamp, and schedule commands.
 * 
 * Features:
 * - Real-time updates via RTDB onValue listeners
 * - Listens to both /devices/{deviceId}/state and /devices/{deviceId}/commands
 * - Automatic cleanup on unmount
 * - Error handling with graceful fallbacks
 */

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDeviceRdbInstance } from '../services/firebase';

/**
 * Result object returned by usePastilleroStatus hook
 */
export interface UsePastilleroStatusResult {
  /** Unix timestamp of last dispense event, null if unavailable */
  ultimoDispense: number | null;
  /** Whether the device is currently online */
  online: boolean;
  /** Whether the hook is still loading initial data */
  loading: boolean;
  /** Current schedule commands from RTDB, null if unavailable */
  commands: Record<string, boolean> | null;
}

/**
 * Options for configuring the usePastilleroStatus hook
 */
export interface UsePastilleroStatusOptions {
  /** Device ID to listen to */
  deviceId: string;
  /** Whether to enable the listeners (default: true) */
  enabled?: boolean;
}

/**
 * Custom hook to listen to pastillero device status in real-time.
 * 
 * Listens to:
 * - `/devices/{deviceId}/state` for online status and last_event_at
 * - `/devices/{deviceId}/commands` for schedule data
 * 
 * @param options - Hook configuration with deviceId and enabled flag
 * @returns Object with ultimoDispense, online, loading, and commands
 * 
 * @example
 * ```tsx
 * const { ultimoDispense, online, loading, commands } = usePastilleroStatus({
 *   deviceId: 'my-device-id',
 *   enabled: true,
 * });
 * ```
 */
export function usePastilleroStatus({
  deviceId,
  enabled = true,
}: UsePastilleroStatusOptions): UsePastilleroStatusResult {
  const [ultimoDispense, setUltimoDispense] = useState<number | null>(null);
  const [online, setOnline] = useState(false);
  const [commands, setCommands] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no deviceId or disabled, reset state and return early
    if (!deviceId || !enabled) {
      setLoading(false);
      setUltimoDispense(null);
      setOnline(false);
      setCommands(null);
      return;
    }

    let unsubState: (() => void) | null = null;
    let unsubCommands: (() => void) | null = null;
    let mounted = true;
    let stateLoaded = false;
    let commandsLoaded = false;

    const checkLoadingComplete = () => {
      if (stateLoaded && commandsLoaded && mounted) {
        setLoading(false);
      }
    };

    const setupListeners = async () => {
      try {
        const rtdb = await getDeviceRdbInstance();
        if (!rtdb || !mounted) {
          setLoading(false);
          return;
        }

        // Listener for device state (online status and last_event_at)
        const stateRef = ref(rtdb, `/devices/${deviceId}/state`);
        unsubState = onValue(
          stateRef,
          (snapshot) => {
            if (!mounted) return;

            const data = snapshot.val();
            setOnline(data?.is_online ?? false);
            setUltimoDispense(data?.last_event_at ?? null);
            stateLoaded = true;
            checkLoadingComplete();

            console.log('[usePastilleroStatus] State updated:', {
              deviceId,
              isOnline: data?.is_online,
              lastEventAt: data?.last_event_at,
            });
          },
          (error) => {
            if (!mounted) return;

            console.error('[usePastilleroStatus] State listener error:', error);
            setOnline(false);
            setUltimoDispense(null);
            stateLoaded = true;
            checkLoadingComplete();
          }
        );

        // Listener for device commands (schedule data)
        const commandsRef = ref(rtdb, `/devices/${deviceId}/commands`);
        unsubCommands = onValue(
          commandsRef,
          (snapshot) => {
            if (!mounted) return;

            const data = snapshot.val();
            setCommands(data ?? null);
            commandsLoaded = true;
            checkLoadingComplete();

            console.log('[usePastilleroStatus] Commands updated:', {
              deviceId,
              hasCommands: !!data,
            });
          },
          (error) => {
            if (!mounted) return;

            console.error('[usePastilleroStatus] Commands listener error:', error);
            setCommands(null);
            commandsLoaded = true;
            checkLoadingComplete();
          }
        );
      } catch (error) {
        if (!mounted) return;

        console.error('[usePastilleroStatus] Setup error:', error);
        setLoading(false);
        setOnline(false);
        setUltimoDispense(null);
        setCommands(null);
      }
    };

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      mounted = false;
      if (unsubState) {
        unsubState();
      }
      if (unsubCommands) {
        unsubCommands();
      }
    };
  }, [deviceId, enabled]);

  return { ultimoDispense, online, loading, commands };
}

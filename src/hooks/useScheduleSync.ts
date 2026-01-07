/**
 * useScheduleSync Hook
 * 
 * Hook to sync medication schedules to Firebase RTDB.
 * Automatically syncs when medications change.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { syncScheduleToRtdb, getScheduleSummary } from '../services/scheduleSync';

interface UseScheduleSyncOptions {
  /** Device ID to sync to */
  deviceId: string | undefined;
  /** Whether to enable auto-sync (default: true) */
  autoSync?: boolean;
}

interface UseScheduleSyncResult {
  /** Whether sync is in progress */
  syncing: boolean;
  /** Last sync error, if any */
  error: Error | null;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Active turnos after last sync */
  activeTurnos: string[];
  /** Manually trigger a sync */
  sync: () => Promise<void>;
}

/**
 * Hook to sync medication schedules to RTDB.
 * 
 * @example
 * ```tsx
 * const { syncing, error, activeTurnos, sync } = useScheduleSync({
 *   deviceId: user?.deviceId,
 *   autoSync: true,
 * });
 * ```
 */
export function useScheduleSync({
  deviceId,
  autoSync = true,
}: UseScheduleSyncOptions): UseScheduleSyncResult {
  const { medications } = useSelector((state: RootState) => state.medications);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [activeTurnos, setActiveTurnos] = useState<string[]>([]);

  const sync = useCallback(async () => {
    if (!deviceId || medications.length === 0) {
      console.log('[useScheduleSync] Skipping sync - no deviceId or medications');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      await syncScheduleToRtdb(deviceId, medications);
      
      const summary = getScheduleSummary(medications);
      setActiveTurnos(summary.activeTurnos);
      setLastSyncAt(new Date());
      
      console.log('[useScheduleSync] Sync complete:', summary);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed');
      setError(error);
      console.error('[useScheduleSync] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [deviceId, medications]);

  // Auto-sync when medications change
  useEffect(() => {
    if (autoSync && deviceId && medications.length > 0) {
      sync();
    }
  }, [autoSync, deviceId, medications, sync]);

  return {
    syncing,
    error,
    lastSyncAt,
    activeTurnos,
    sync,
  };
}

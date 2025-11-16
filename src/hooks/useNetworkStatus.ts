/**
 * useNetworkStatus Hook
 * 
 * Provides real-time network connectivity status
 * Integrates with offline queue manager for sync status
 */

import { useEffect, useState } from 'react';
import { offlineQueueManager } from '../services/offlineQueueManager';

// NetInfo types (will be available when package is installed)
type NetInfoState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
};

// Dynamic import for NetInfo (optional dependency)
let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo');
} catch (error) {
  console.warn('[useNetworkStatus] NetInfo not available, using fallback network detection');
}

export interface NetworkStatus {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  queueStatus: {
    pending: number;
    processing: number;
    failed: number;
  };
}

/**
 * Hook to monitor network connectivity and offline queue status
 * 
 * @returns Network status and queue information
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);
  const [queueStatus, setQueueStatus] = useState(offlineQueueManager.getQueueStatus());

  // Monitor network status
  useEffect(() => {
    if (!NetInfo) {
      // Fallback: assume online
      setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
      });
      return;
    }

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkState(state);
    });

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState(state);
      console.log('[useNetworkStatus] Network changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Monitor queue status
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueStatus(offlineQueueManager.getQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isOnline: networkState?.isConnected ?? true,
    isInternetReachable: networkState?.isInternetReachable ?? null,
    type: networkState?.type ?? null,
    queueStatus: {
      pending: queueStatus.pending,
      processing: queueStatus.processing,
      failed: queueStatus.failed,
    },
  };
}

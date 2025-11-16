/**
 * Offline Queue Manager
 * 
 * Manages offline operations and syncs them when network is available.
 * Provides a unified interface for queuing operations that require network connectivity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import {
  withRetry,
  handleError,
} from '../utils/errorHandling';

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
  console.warn('[OfflineQueueManager] NetInfo not available, using fallback network detection');
}

// Queue item interface
export interface QueueItem {
  id: string;
  type: 'medication_create' | 'medication_update' | 'medication_delete' | 'intake_record' | 'inventory_update';
  operation: () => Promise<any>;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Storage key
const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_QUEUE_SIZE = 500;
const MAX_RETRY_COUNT = 5;

/**
 * Offline Queue Manager class
 */
export class OfflineQueueManager {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private isOnline: boolean = true;
  private netInfoUnsubscribe: (() => void) | null = null;
  private appStateSubscription: any = null;
  private syncCallbacks: Set<(success: boolean) => void> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the queue manager
   */
  private async initialize(): Promise<void> {
    try {
      // Load queue from storage
      await this.loadQueue();

      // Setup network listener
      this.setupNetworkListener();

      // Setup app state listener
      this.setupAppStateListener();

      // Check initial network status
      if (NetInfo) {
        const netState = await NetInfo.fetch();
        this.isOnline = netState.isConnected ?? false;
        
        console.log('[OfflineQueueManager] Initial network status:', {
          isConnected: netState.isConnected,
          type: netState.type,
        });
      } else {
        // Fallback: assume online
        this.isOnline = true;
        console.log('[OfflineQueueManager] Using fallback network detection (assumed online)');
      }

      // Process queue if online
      if (this.isOnline) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[OfflineQueueManager] Initialization error:', error);
    }
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueData) {
        const parsed = JSON.parse(queueData);
        // Convert timestamp strings back to Date objects
        this.queue = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          // Don't restore the operation function, it will be re-added when needed
          operation: null,
        }));
        console.log('[OfflineQueueManager] Loaded queue with', this.queue.length, 'items');
      }
    } catch (error) {
      console.error('[OfflineQueueManager] Error loading queue:', error);
    }
  }

  /**
   * Persist queue to AsyncStorage
   */
  private async persistQueue(): Promise<void> {
    try {
      // Remove operation functions before serializing
      const serializableQueue = this.queue.map(item => ({
        ...item,
        operation: undefined, // Can't serialize functions
      }));
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(serializableQueue));
      console.log('[OfflineQueueManager] Persisted queue with', this.queue.length, 'items');
    } catch (error) {
      console.error('[OfflineQueueManager] Error persisting queue:', error);
    }
  }

  /**
   * Setup network connectivity listener using NetInfo
   */
  private setupNetworkListener(): void {
    if (!NetInfo) {
      console.log('[OfflineQueueManager] NetInfo not available, skipping network listener setup');
      return;
    }

    this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      console.log('[OfflineQueueManager] Network status changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
      
      // Process queue when coming back online
      if (wasOffline && this.isOnline) {
        console.log('[OfflineQueueManager] Back online, processing queue');
        this.processQueue();
      }
    });
    
    console.log('[OfflineQueueManager] Network listener setup complete');
  }

  /**
   * Setup app state listener
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active' && this.isOnline) {
      console.log('[OfflineQueueManager] App came to foreground, processing queue');
      this.processQueue();
    }
  };

  /**
   * Generate a unique ID for queue items
   */
  private generateId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Add an operation to the queue
   */
  async enqueue(
    type: QueueItem['type'],
    operation: () => Promise<any>,
    data: any,
    maxRetries: number = MAX_RETRY_COUNT
  ): Promise<string> {
    try {
      // Check queue size limit
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        // Remove oldest completed or failed items
        this.queue = this.queue.filter(
          item => item.status === 'pending' || item.status === 'processing'
        );

        // If still too large, remove oldest items
        if (this.queue.length >= MAX_QUEUE_SIZE) {
          this.queue = this.queue.slice(-MAX_QUEUE_SIZE + 1);
        }
      }

      const item: QueueItem = {
        id: this.generateId(),
        type,
        operation,
        data,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries,
        status: 'pending',
      };

      this.queue.push(item);
      await this.persistQueue();

      console.log('[OfflineQueueManager] Enqueued item:', {
        id: item.id,
        type: item.type,
      });

      // Try to process immediately if online
      if (this.isOnline) {
        this.processQueue();
      }

      return item.id;
    } catch (error: any) {
      const appError = await handleError(
        error,
        { operation: 'enqueue', type },
        false
      );
      console.error('[OfflineQueueManager] Error enqueueing item:', appError.message);
      throw appError;
    }
  }

  /**
   * Process the queue
   */
  async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[OfflineQueueManager] Queue processing already in progress');
      return;
    }

    // Don't process if offline
    if (!this.isOnline) {
      console.log('[OfflineQueueManager] Offline, deferring queue processing');
      return;
    }

    this.isProcessing = true;
    let successCount = 0;
    let failureCount = 0;

    try {
      const pendingItems = this.queue.filter(item => item.status === 'pending');

      if (pendingItems.length === 0) {
        console.log('[OfflineQueueManager] No pending items to process');
        return;
      }

      console.log('[OfflineQueueManager] Processing', pendingItems.length, 'pending items');

      for (const item of pendingItems) {
        // Skip if operation is not available (happens after reload from storage)
        if (!item.operation) {
          console.warn('[OfflineQueueManager] Skipping item without operation:', item.id);
          item.status = 'failed';
          item.error = 'Operation not available after reload';
          failureCount++;
          continue;
        }

        try {
          item.status = 'processing';

          // Execute the operation with retry logic
          await withRetry(
            item.operation,
            {
              maxAttempts: item.maxRetries - item.retryCount,
              initialDelayMs: 1000,
              backoffMultiplier: 2,
            },
            { queueItemId: item.id, type: item.type }
          );

          item.status = 'completed';
          successCount++;

          console.log('[OfflineQueueManager] Successfully processed item:', item.id);
        } catch (error: any) {
          item.retryCount++;

          if (item.retryCount >= item.maxRetries) {
            item.status = 'failed';
            item.error = error.message || 'Unknown error';
            failureCount++;

            const appError = await handleError(
              error,
              { queueItemId: item.id, type: item.type, retryCount: item.retryCount },
              false
            );
            console.error('[OfflineQueueManager] Item failed after max retries:', item.id, appError.message);
          } else {
            item.status = 'pending';
            console.log('[OfflineQueueManager] Item will be retried:', item.id, 'Retry count:', item.retryCount);
          }
        }
      }

      // Remove completed items older than 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.queue = this.queue.filter(
        item => !(item.status === 'completed' && item.timestamp < oneDayAgo)
      );

      await this.persistQueue();

      console.log('[OfflineQueueManager] Queue processing complete:', {
        success: successCount,
        failed: failureCount,
        remaining: this.queue.filter(item => item.status === 'pending').length,
      });

      // Notify subscribers
      this.notifySyncComplete(failureCount === 0);
    } catch (error: any) {
      const appError = await handleError(
        error,
        { operation: 'process_queue' },
        false
      );
      console.error('[OfflineQueueManager] Error processing queue:', appError.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    isOnline: boolean;
    isProcessing: boolean;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      completed: this.queue.filter(item => item.status === 'completed').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      isOnline: this.isOnline,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Get all queue items
   */
  getQueueItems(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Clear completed items
   */
  async clearCompleted(): Promise<void> {
    this.queue = this.queue.filter(item => item.status !== 'completed');
    await this.persistQueue();
    console.log('[OfflineQueueManager] Cleared completed items');
  }

  /**
   * Clear all items
   */
  async clearAll(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
    console.log('[OfflineQueueManager] Cleared all items');
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    const failedItems = this.queue.filter(item => item.status === 'failed');
    failedItems.forEach(item => {
      item.status = 'pending';
      item.retryCount = 0;
      item.error = undefined;
    });
    await this.persistQueue();
    console.log('[OfflineQueueManager] Reset', failedItems.length, 'failed items for retry');

    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Subscribe to sync completion events
   */
  onSyncComplete(callback: (success: boolean) => void): () => void {
    this.syncCallbacks.add(callback);
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  /**
   * Notify subscribers of sync completion
   */
  private notifySyncComplete(success: boolean): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(success);
      } catch (error) {
        console.error('[OfflineQueueManager] Error in sync callback:', error);
      }
    });
  }

  /**
   * Check if online
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.syncCallbacks.clear();
    console.log('[OfflineQueueManager] Manager destroyed');
  }
}

// Export singleton instance
export const offlineQueueManager = new OfflineQueueManager();

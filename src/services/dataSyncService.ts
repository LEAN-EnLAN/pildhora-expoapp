import { getDbInstance, getRdbInstance, getDeviceRdbInstance } from './firebase';
import { ref, onValue, set, get, off } from 'firebase/database';
import { collection, query, where, onSnapshot, Timestamp, Unsubscribe } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication } from '../types';
import { medicationEventService } from './medicationEventService';
import { withRetry, handleError } from '../utils/errorHandling';

/**
 * Data Synchronization Service
 * 
 * Handles bidirectional synchronization between:
 * 1. App → Device: Medication changes sync to device within 5 seconds
 * 2. Device → App: Device events sync to Firestore within 5 seconds
 * 3. Offline queue for network interruptions
 * 4. Sync status indicators for UI
 * 
 * Architecture:
 * - Firestore: Persistent storage for medications and events
 * - RTDB: Real-time device state and configuration
 * - AsyncStorage: Offline queue for pending changes
 */

// Storage keys
const PENDING_MEDICATION_SYNC_KEY = '@pending_medication_sync';
const PENDING_DEVICE_EVENT_SYNC_KEY = '@pending_device_event_sync';
const LAST_MEDICATION_SYNC_KEY = '@last_medication_sync';
const LAST_DEVICE_EVENT_SYNC_KEY = '@last_device_event_sync';

// Sync intervals
const MEDICATION_SYNC_TIMEOUT_MS = 5000; // 5 seconds
const DEVICE_EVENT_SYNC_TIMEOUT_MS = 5000; // 5 seconds
const RETRY_INTERVAL_MS = 10000; // 10 seconds for retry

/**
 * Sync status for UI indicators
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error' | 'offline';

/**
 * Medication sync operation
 */
interface MedicationSyncOperation {
  id: string;
  medicationId: string;
  deviceId: string;
  operation: 'create' | 'update' | 'delete';
  data?: Partial<Medication>;
  timestamp: number;
  retryCount: number;
}

/**
 * Device event sync operation
 */
interface DeviceEventSyncOperation {
  id: string;
  deviceId: string;
  eventType: string;
  eventData: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Sync statistics for monitoring
 */
export interface SyncStatistics {
  lastMedicationSync: Date | null;
  lastDeviceEventSync: Date | null;
  pendingMedicationOps: number;
  pendingDeviceEventOps: number;
  medicationSyncStatus: SyncStatus;
  deviceEventSyncStatus: SyncStatus;
}

/**
 * Data Synchronization Service Class
 */
export class DataSyncService {
  private medicationSyncQueue: MedicationSyncOperation[] = [];
  private deviceEventSyncQueue: DeviceEventSyncOperation[] = [];
  private medicationSyncStatus: SyncStatus = 'synced';
  private deviceEventSyncStatus: SyncStatus = 'synced';
  private lastMedicationSync: Date | null = null;
  private lastDeviceEventSync: Date | null = null;
  
  // Listeners and intervals
  private medicationListeners: Map<string, Unsubscribe> = new Map();
  private deviceEventListeners: Map<string, () => void> = new Map();
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  
  // Callbacks for sync status changes
  private syncStatusCallbacks: Set<(stats: SyncStatistics) => void> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the sync service
   */
  private async initialize(): Promise<void> {
    try {
      // Load pending operations from storage
      await this.loadPendingOperations();
      
      // Load last sync timestamps
      await this.loadLastSyncTimestamps();
      
      // Start background sync
      this.startBackgroundSync();
      
      console.log('[DataSyncService] Initialized successfully');
    } catch (error) {
      console.error('[DataSyncService] Initialization error:', error);
    }
  }

  /**
   * Load pending operations from AsyncStorage
   */
  private async loadPendingOperations(): Promise<void> {
    try {
      const medicationData = await AsyncStorage.getItem(PENDING_MEDICATION_SYNC_KEY);
      if (medicationData) {
        this.medicationSyncQueue = JSON.parse(medicationData);
        console.log('[DataSyncService] Loaded', this.medicationSyncQueue.length, 'pending medication operations');
      }

      const deviceEventData = await AsyncStorage.getItem(PENDING_DEVICE_EVENT_SYNC_KEY);
      if (deviceEventData) {
        this.deviceEventSyncQueue = JSON.parse(deviceEventData);
        console.log('[DataSyncService] Loaded', this.deviceEventSyncQueue.length, 'pending device event operations');
      }
    } catch (error) {
      console.error('[DataSyncService] Error loading pending operations:', error);
    }
  }

  /**
   * Load last sync timestamps from AsyncStorage
   */
  private async loadLastSyncTimestamps(): Promise<void> {
    try {
      const medicationSyncData = await AsyncStorage.getItem(LAST_MEDICATION_SYNC_KEY);
      if (medicationSyncData) {
        this.lastMedicationSync = new Date(medicationSyncData);
      }

      const deviceEventSyncData = await AsyncStorage.getItem(LAST_DEVICE_EVENT_SYNC_KEY);
      if (deviceEventSyncData) {
        this.lastDeviceEventSync = new Date(deviceEventSyncData);
      }
    } catch (error) {
      console.error('[DataSyncService] Error loading last sync timestamps:', error);
    }
  }

  /**
   * Persist pending operations to AsyncStorage
   */
  private async persistPendingOperations(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PENDING_MEDICATION_SYNC_KEY,
        JSON.stringify(this.medicationSyncQueue)
      );
      await AsyncStorage.setItem(
        PENDING_DEVICE_EVENT_SYNC_KEY,
        JSON.stringify(this.deviceEventSyncQueue)
      );
    } catch (error) {
      console.error('[DataSyncService] Error persisting pending operations:', error);
    }
  }

  /**
   * Persist last sync timestamps to AsyncStorage
   */
  private async persistLastSyncTimestamps(): Promise<void> {
    try {
      if (this.lastMedicationSync) {
        await AsyncStorage.setItem(
          LAST_MEDICATION_SYNC_KEY,
          this.lastMedicationSync.toISOString()
        );
      }
      if (this.lastDeviceEventSync) {
        await AsyncStorage.setItem(
          LAST_DEVICE_EVENT_SYNC_KEY,
          this.lastDeviceEventSync.toISOString()
        );
      }
    } catch (error) {
      console.error('[DataSyncService] Error persisting last sync timestamps:', error);
    }
  }

  /**
   * Start background sync with retry interval
   */
  private startBackgroundSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(() => {
      this.processPendingOperations().catch(error => {
        console.error('[DataSyncService] Background sync error:', error);
      });
    }, RETRY_INTERVAL_MS);

    console.log('[DataSyncService] Background sync started');
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('[DataSyncService] Background sync stopped');
    }
  }

  /**
   * Queue a medication sync operation
   */
  async queueMedicationSync(
    medicationId: string,
    deviceId: string,
    operation: 'create' | 'update' | 'delete',
    data?: Partial<Medication>
  ): Promise<void> {
    const syncOp: MedicationSyncOperation = {
      id: `med_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      medicationId,
      deviceId,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.medicationSyncQueue.push(syncOp);
    await this.persistPendingOperations();
    
    this.medicationSyncStatus = 'pending';
    this.notifySyncStatusChange();

    console.log('[DataSyncService] Queued medication sync:', operation, medicationId);

    // Attempt immediate sync
    this.processPendingOperations().catch(error => {
      console.error('[DataSyncService] Immediate sync failed:', error);
    });
  }

  /**
   * Queue a device event sync operation
   */
  async queueDeviceEventSync(
    deviceId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    const syncOp: DeviceEventSyncOperation = {
      id: `event_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      eventType,
      eventData,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.deviceEventSyncQueue.push(syncOp);
    await this.persistPendingOperations();
    
    this.deviceEventSyncStatus = 'pending';
    this.notifySyncStatusChange();

    console.log('[DataSyncService] Queued device event sync:', eventType);

    // Attempt immediate sync
    this.processPendingOperations().catch(error => {
      console.error('[DataSyncService] Immediate sync failed:', error);
    });
  }

  /**
   * Process all pending sync operations
   */
  private async processPendingOperations(): Promise<void> {
    // Process medication sync operations
    if (this.medicationSyncQueue.length > 0) {
      this.medicationSyncStatus = 'syncing';
      this.notifySyncStatusChange();

      const operations = [...this.medicationSyncQueue];
      const successfulOps: string[] = [];

      for (const op of operations) {
        try {
          await this.syncMedicationToDevice(op);
          successfulOps.push(op.id);
          this.lastMedicationSync = new Date();
        } catch (error) {
          console.error('[DataSyncService] Failed to sync medication:', op.id, error);
          op.retryCount++;
          
          // Remove operation if max retries exceeded
          if (op.retryCount > 5) {
            console.warn('[DataSyncService] Max retries exceeded for medication sync:', op.id);
            successfulOps.push(op.id);
          }
        }
      }

      // Remove successful operations
      this.medicationSyncQueue = this.medicationSyncQueue.filter(
        op => !successfulOps.includes(op.id)
      );

      await this.persistPendingOperations();
      await this.persistLastSyncTimestamps();

      this.medicationSyncStatus = this.medicationSyncQueue.length > 0 ? 'pending' : 'synced';
      this.notifySyncStatusChange();
    }

    // Process device event sync operations
    if (this.deviceEventSyncQueue.length > 0) {
      this.deviceEventSyncStatus = 'syncing';
      this.notifySyncStatusChange();

      const operations = [...this.deviceEventSyncQueue];
      const successfulOps: string[] = [];

      for (const op of operations) {
        try {
          await this.syncDeviceEventToFirestore(op);
          successfulOps.push(op.id);
          this.lastDeviceEventSync = new Date();
        } catch (error) {
          console.error('[DataSyncService] Failed to sync device event:', op.id, error);
          op.retryCount++;
          
          // Remove operation if max retries exceeded
          if (op.retryCount > 5) {
            console.warn('[DataSyncService] Max retries exceeded for device event sync:', op.id);
            successfulOps.push(op.id);
          }
        }
      }

      // Remove successful operations
      this.deviceEventSyncQueue = this.deviceEventSyncQueue.filter(
        op => !successfulOps.includes(op.id)
      );

      await this.persistPendingOperations();
      await this.persistLastSyncTimestamps();

      this.deviceEventSyncStatus = this.deviceEventSyncQueue.length > 0 ? 'pending' : 'synced';
      this.notifySyncStatusChange();
    }
  }

  /**
   * Sync medication changes to device via RTDB
   */
  private async syncMedicationToDevice(op: MedicationSyncOperation): Promise<void> {
    const rdb = await getDeviceRdbInstance();
    if (!rdb) {
      throw new Error('RTDB not initialized');
    }

    await withRetry(
      async () => {
        const medicationsRef = ref(rdb, `devices/${op.deviceId}/medications/${op.medicationId}`);

        if (op.operation === 'delete') {
          await set(medicationsRef, null);
        } else {
          // Transform medication data for device
          const deviceData = this.transformMedicationForDevice(op.data);
          await set(medicationsRef, deviceData);
        }

        console.log('[DataSyncService] Synced medication to device:', op.operation, op.medicationId);
      },
      { maxAttempts: 3, initialDelayMs: 1000, backoffMultiplier: 2 },
      { operation: 'sync_medication_to_device', medicationId: op.medicationId }
    );
  }

  /**
   * Transform medication data for device format
   */
  private transformMedicationForDevice(data?: Partial<Medication>): any {
    if (!data) return null;

    return {
      name: data.name,
      dosage: data.dosage || `${data.doseValue}${data.doseUnit}`,
      times: data.times,
      frequency: data.frequency,
      emoji: data.emoji,
      trackInventory: data.trackInventory,
      currentQuantity: data.currentQuantity,
      updatedAt: Date.now(),
    };
  }

  /**
   * Sync device events to Firestore
   */
  private async syncDeviceEventToFirestore(op: DeviceEventSyncOperation): Promise<void> {
    // Use the medication event service for event persistence
    await medicationEventService.enqueue({
      eventType: op.eventType as any,
      medicationId: op.eventData.medicationId || '',
      medicationName: op.eventData.medicationName || '',
      medicationData: op.eventData,
      patientId: op.eventData.patientId || '',
      patientName: op.eventData.patientName || '',
      caregiverId: op.eventData.caregiverId || '',
      syncStatus: 'pending',
    });

    console.log('[DataSyncService] Synced device event to Firestore:', op.eventType);
  }

  /**
   * Start listening for medication changes for a patient
   */
  async startMedicationSync(patientId: string, deviceId: string): Promise<void> {
    // Stop existing listener if any
    this.stopMedicationSync(patientId);

    try {
      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const q = query(
        collection(db, 'medications'),
        where('patientId', '==', patientId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const medication = { id: change.doc.id, ...change.doc.data() } as Medication;

            if (change.type === 'added' || change.type === 'modified') {
              this.queueMedicationSync(
                medication.id,
                deviceId,
                change.type === 'added' ? 'create' : 'update',
                medication
              );
            } else if (change.type === 'removed') {
              this.queueMedicationSync(
                medication.id,
                deviceId,
                'delete'
              );
            }
          });
        },
        (error) => {
          console.error('[DataSyncService] Medication listener error:', error);
          this.medicationSyncStatus = 'error';
          this.notifySyncStatusChange();
        }
      );

      this.medicationListeners.set(patientId, unsubscribe);
      console.log('[DataSyncService] Started medication sync for patient:', patientId);
    } catch (error) {
      console.error('[DataSyncService] Failed to start medication sync:', error);
      throw error;
    }
  }

  /**
   * Stop listening for medication changes for a patient
   */
  stopMedicationSync(patientId: string): void {
    const unsubscribe = this.medicationListeners.get(patientId);
    if (unsubscribe) {
      unsubscribe();
      this.medicationListeners.delete(patientId);
      console.log('[DataSyncService] Stopped medication sync for patient:', patientId);
    }
  }

  /**
   * Start listening for device events
   */
  async startDeviceEventSync(deviceId: string, patientId: string): Promise<void> {
    // Stop existing listener if any
    this.stopDeviceEventSync(deviceId);

    try {
      const rdb = await getDeviceRdbInstance();
      if (!rdb) {
        throw new Error('RTDB not initialized');
      }

      const eventsRef = ref(rdb, `devices/${deviceId}/events`);

      const listener = onValue(
        eventsRef,
        (snapshot) => {
          const events = snapshot.val();
          if (events) {
            Object.entries(events).forEach(([eventId, eventData]: [string, any]) => {
              // Queue event for sync to Firestore
              this.queueDeviceEventSync(deviceId, eventData.type, {
                ...eventData,
                patientId,
                deviceId,
              });
            });
          }
        },
        (error) => {
          console.error('[DataSyncService] Device event listener error:', error);
          this.deviceEventSyncStatus = 'error';
          this.notifySyncStatusChange();
        }
      );

      this.deviceEventListeners.set(deviceId, () => off(eventsRef));
      console.log('[DataSyncService] Started device event sync for device:', deviceId);
    } catch (error) {
      console.error('[DataSyncService] Failed to start device event sync:', error);
      throw error;
    }
  }

  /**
   * Stop listening for device events
   */
  stopDeviceEventSync(deviceId: string): void {
    const unsubscribe = this.deviceEventListeners.get(deviceId);
    if (unsubscribe) {
      unsubscribe();
      this.deviceEventListeners.delete(deviceId);
      console.log('[DataSyncService] Stopped device event sync for device:', deviceId);
    }
  }

  /**
   * Get current sync statistics
   */
  getSyncStatistics(): SyncStatistics {
    return {
      lastMedicationSync: this.lastMedicationSync,
      lastDeviceEventSync: this.lastDeviceEventSync,
      pendingMedicationOps: this.medicationSyncQueue.length,
      pendingDeviceEventOps: this.deviceEventSyncQueue.length,
      medicationSyncStatus: this.medicationSyncStatus,
      deviceEventSyncStatus: this.deviceEventSyncStatus,
    };
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (stats: SyncStatistics) => void): () => void {
    this.syncStatusCallbacks.add(callback);
    return () => {
      this.syncStatusCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of sync status change
   */
  private notifySyncStatusChange(): void {
    const stats = this.getSyncStatistics();
    this.syncStatusCallbacks.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('[DataSyncService] Error in sync status callback:', error);
      }
    });
  }

  /**
   * Force sync all pending operations
   */
  async forceSyncAll(): Promise<void> {
    console.log('[DataSyncService] Force syncing all pending operations');
    await this.processPendingOperations();
  }

  /**
   * Clear all pending operations (for testing/debugging)
   */
  async clearPendingOperations(): Promise<void> {
    this.medicationSyncQueue = [];
    this.deviceEventSyncQueue = [];
    await this.persistPendingOperations();
    this.medicationSyncStatus = 'synced';
    this.deviceEventSyncStatus = 'synced';
    this.notifySyncStatusChange();
    console.log('[DataSyncService] Cleared all pending operations');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopBackgroundSync();
    
    // Stop all medication listeners
    this.medicationListeners.forEach(unsubscribe => unsubscribe());
    this.medicationListeners.clear();
    
    // Stop all device event listeners
    this.deviceEventListeners.forEach(unsubscribe => unsubscribe());
    this.deviceEventListeners.clear();
    
    this.syncStatusCallbacks.clear();
    
    console.log('[DataSyncService] Service destroyed');
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();

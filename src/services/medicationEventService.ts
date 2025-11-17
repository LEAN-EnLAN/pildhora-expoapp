import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { getDbInstance } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { 
  MedicationEvent, 
  MedicationEventType, 
  Medication,
  MedicationEventChange 
} from '../types';
import {
  withRetry,
  handleError,
  createNetworkError,
  ApplicationError,
  ErrorCategory,
  ErrorSeverity,
} from '../utils/errorHandling';

const EVENT_QUEUE_KEY = '@medication_event_queue';
const LAST_SYNC_KEY = '@medication_event_last_sync';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Service for managing medication events and their synchronization with Firestore
 */
export class MedicationEventService {
  private queue: MedicationEvent[] = [];
  private syncInProgress: boolean = false;
  private lastSyncAttempt: Date | null = null;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: any = null;
  private syncCallbacks: Set<() => void> = new Set();

  constructor() {
    this.loadQueue();
    this.startBackgroundSync();
    this.setupAppStateListener();
  }

  /**
   * Load the event queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(EVENT_QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log('[MedicationEventService] Loaded queue with', this.queue.length, 'events');
      }

      const lastSyncData = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (lastSyncData) {
        this.lastSyncAttempt = new Date(lastSyncData);
      }
    } catch (error) {
      console.error('[MedicationEventService] Error loading queue:', error);
    }
  }

  /**
   * Persist the event queue to AsyncStorage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(this.queue));
      console.log('[MedicationEventService] Persisted queue with', this.queue.length, 'events');
    } catch (error) {
      console.error('[MedicationEventService] Error persisting queue:', error);
    }
  }

  /**
   * Persist the last sync attempt timestamp
   */
  private async persistLastSync(): Promise<void> {
    try {
      if (this.lastSyncAttempt) {
        await AsyncStorage.setItem(LAST_SYNC_KEY, this.lastSyncAttempt.toISOString());
      }
    } catch (error) {
      console.error('[MedicationEventService] Error persisting last sync:', error);
    }
  }

  /**
   * Generate a unique ID for an event
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enqueue a new medication event
   * @param event - The event data (without id and timestamp)
   */
  async enqueue(event: Omit<MedicationEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullEvent: MedicationEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date().toISOString(),
      };

      // Add to queue with retry logic for storage operations
      await withRetry(
        async () => {
          this.queue.push(fullEvent);
          await this.persistQueue();
        },
        { maxAttempts: 2, initialDelayMs: 500 },
        { operation: 'enqueue_event', eventId: fullEvent.id }
      );

      console.log('[MedicationEventService] Enqueued event:', {
        id: fullEvent.id,
        type: fullEvent.eventType,
        medicationName: fullEvent.medicationName,
      });

      // Attempt immediate sync (non-blocking, errors are logged)
      this.syncPendingEvents().catch(error => {
        console.error('[MedicationEventService] Immediate sync failed:', error);
      });
    } catch (error: any) {
      const appError = await handleError(
        error,
        { operation: 'enqueue_event', eventType: event.eventType },
        false
      );
      console.error('[MedicationEventService] Error enqueueing event:', appError);
      throw appError;
    }
  }

  /**
   * Dequeue the next pending event
   * @returns The next pending event or null if queue is empty
   */
  async dequeue(): Promise<MedicationEvent | null> {
    if (this.queue.length === 0) {
      return null;
    }

    const event = this.queue.shift();
    await this.persistQueue();
    return event || null;
  }

  /**
   * Sync all pending events to Firestore
   */
  async syncPendingEvents(): Promise<void> {
    // Prevent concurrent sync operations
    if (this.syncInProgress) {
      console.log('[MedicationEventService] Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = new Date();
    await this.persistLastSync();

    try {
      const db = await getDbInstance();
      if (!db) {
        console.warn('[MedicationEventService] Firestore not available, sync deferred');
        return;
      }

      const pendingEvents = this.queue.filter(e => e.syncStatus === 'pending');
      
      if (pendingEvents.length === 0) {
        console.log('[MedicationEventService] No pending events to sync');
        return;
      }

      console.log('[MedicationEventService] Syncing', pendingEvents.length, 'pending events');

      for (const event of pendingEvents) {
        try {
          // Convert timestamp to Firestore Timestamp
          const eventData = {
            ...event,
            timestamp: Timestamp.fromDate(new Date(event.timestamp)),
          };

          // Add to Firestore with retry logic
          await withRetry(
            async () => {
              await addDoc(collection(db, 'medicationEvents'), eventData);
            },
            { maxAttempts: 3, initialDelayMs: 1000, backoffMultiplier: 2 },
            { operation: 'sync_event', eventId: event.id }
          );
          
          // Mark as delivered
          event.syncStatus = 'delivered';
          
          console.log('[MedicationEventService] Successfully synced event:', event.id);
        } catch (error: any) {
          const appError = await handleError(
            error,
            { operation: 'sync_event', eventId: event.id },
            false
          );
          console.error('[MedicationEventService] Failed to sync event:', event.id, appError.message);
          event.syncStatus = 'failed';
        }
      }

      // Remove delivered events from queue
      this.queue = this.queue.filter(e => e.syncStatus !== 'delivered');
      await this.persistQueue();

      console.log('[MedicationEventService] Sync complete. Remaining events:', this.queue.length);
      
      // Notify subscribers
      this.notifySyncComplete();
    } catch (error: any) {
      const appError = await handleError(
        error,
        { operation: 'sync_pending_events' },
        false
      );
      console.error('[MedicationEventService] Error during sync:', appError.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get the count of pending events
   * @returns The number of pending events in the queue
   */
  async getPendingCount(): Promise<number> {
    return this.queue.filter(e => e.syncStatus === 'pending').length;
  }

  /**
   * Get all events in the queue (for debugging)
   * @returns All events in the queue
   */
  async getAllEvents(): Promise<MedicationEvent[]> {
    return [...this.queue];
  }

  /**
   * Clear all events from the queue (for testing/debugging)
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
    console.log('[MedicationEventService] Queue cleared');
  }

  /**
   * Get the last sync attempt timestamp
   * @returns The last sync attempt date or null
   */
  getLastSyncAttempt(): Date | null {
    return this.lastSyncAttempt;
  }

  /**
   * Check if sync is currently in progress
   * @returns True if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Start background sync with 5-minute retry interval
   */
  private startBackgroundSync(): void {
    // Clear any existing interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    // Set up 5-minute interval for background sync
    this.syncIntervalId = setInterval(() => {
      console.log('[MedicationEventService] Background sync triggered');
      this.syncPendingEvents().catch(error => {
        console.error('[MedicationEventService] Background sync error:', error);
      });
    }, SYNC_INTERVAL_MS);

    console.log('[MedicationEventService] Background sync started (5-minute interval)');
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('[MedicationEventService] Background sync stopped');
    }
  }

  /**
   * Setup app state listener for foreground sync
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    console.log('[MedicationEventService] App state listener setup');
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active') {
      console.log('[MedicationEventService] App came to foreground, triggering sync');
      this.syncPendingEvents().catch(error => {
        console.error('[MedicationEventService] Foreground sync error:', error);
      });
    }
  };

  /**
   * Remove app state listener
   */
  private removeAppStateListener(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
      console.log('[MedicationEventService] App state listener removed');
    }
  }

  /**
   * Subscribe to sync status changes
   * @param callback - Function to call when sync completes
   * @returns Unsubscribe function
   */
  onSyncComplete(callback: () => void): () => void {
    this.syncCallbacks.add(callback);
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers that sync completed
   */
  private notifySyncComplete(): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[MedicationEventService] Error in sync callback:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopBackgroundSync();
    this.removeAppStateListener();
    this.syncCallbacks.clear();
    console.log('[MedicationEventService] Service destroyed');
  }
}

// Export a singleton instance
export const medicationEventService = new MedicationEventService();

/**
 * MedicationEventQueue class - Wrapper for the event service
 * Provides the interface specified in the design document
 */
export class MedicationEventQueue {
  private service: MedicationEventService;

  constructor(service: MedicationEventService) {
    this.service = service;
  }

  /**
   * Enqueue a new medication event
   * @param event - The event data (without id and timestamp)
   */
  async enqueue(event: Omit<MedicationEvent, 'id' | 'timestamp'>): Promise<void> {
    return this.service.enqueue(event);
  }

  /**
   * Dequeue the next pending event
   * @returns The next pending event or null if queue is empty
   */
  async dequeue(): Promise<MedicationEvent | null> {
    return this.service.dequeue();
  }

  /**
   * Sync all pending events to Firestore
   */
  async syncPendingEvents(): Promise<void> {
    return this.service.syncPendingEvents();
  }

  /**
   * Get the count of pending events
   * @returns The number of pending events in the queue
   */
  async getPendingCount(): Promise<number> {
    return this.service.getPendingCount();
  }

  /**
   * Subscribe to sync status changes
   * @param callback - Function to call when sync completes
   * @returns Unsubscribe function
   */
  onSyncComplete(callback: () => void): () => void {
    return this.service.onSyncComplete(callback);
  }

  /**
   * Get the last sync attempt timestamp
   * @returns The last sync attempt date or null
   */
  getLastSyncAttempt(): Date | null {
    return this.service.getLastSyncAttempt();
  }

  /**
   * Check if sync is currently in progress
   * @returns True if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.service.isSyncInProgress();
  }
}

// Export a singleton instance of the queue
export const medicationEventQueue = new MedicationEventQueue(medicationEventService);

/**
 * Helper functions for generating medication events
 */

/**
 * Helper function to remove undefined values from an object
 * Firestore doesn't allow undefined values
 * Also recursively handles nested objects
 */
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined) {
      // Recursively handle nested plain objects (but not Dates, Timestamps, or Arrays)
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && 
          value.constructor === Object) {
        result[key] = removeUndefinedFields(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Generate a medication created event
 * @param medication - The newly created medication
 * @param patientName - The name of the patient
 * @returns Event data ready to be enqueued
 */
export function generateMedicationCreatedEvent(
  medication: Medication,
  patientName: string
): Omit<MedicationEvent, 'id' | 'timestamp'> {
  return {
    eventType: 'created',
    medicationId: medication.id,
    medicationName: medication.name,
    medicationData: removeUndefinedFields({ ...medication }),
    patientId: medication.patientId,
    patientName,
    caregiverId: medication.caregiverId,
    syncStatus: 'pending',
  };
}

/**
 * Generate a medication updated event with change tracking
 * @param oldMedication - The medication before update
 * @param newMedication - The medication after update
 * @param patientName - The name of the patient
 * @returns Event data ready to be enqueued
 */
export function generateMedicationUpdatedEvent(
  oldMedication: Medication,
  newMedication: Medication,
  patientName: string
): Omit<MedicationEvent, 'id' | 'timestamp'> {
  // Track changes between old and new medication
  const changes: MedicationEventChange[] = [];

  // Compare key fields
  const fieldsToCompare: (keyof Medication)[] = [
    'name',
    'doseValue',
    'doseUnit',
    'quantityType',
    'frequency',
    'times',
    'emoji',
    'trackInventory',
    'currentQuantity',
    'lowQuantityThreshold',
  ];

  for (const field of fieldsToCompare) {
    const oldValue = oldMedication[field];
    const newValue = newMedication[field];

    // Handle array comparison
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
        });
      }
    } else if (oldValue !== newValue) {
      changes.push({
        field,
        oldValue,
        newValue,
      });
    }
  }

  return {
    eventType: 'updated',
    medicationId: newMedication.id,
    medicationName: newMedication.name,
    medicationData: removeUndefinedFields({ ...newMedication }),
    patientId: newMedication.patientId,
    patientName,
    caregiverId: newMedication.caregiverId,
    syncStatus: 'pending',
    changes: changes.length > 0 ? changes : undefined,
  };
}

/**
 * Generate a medication deleted event
 * @param medication - The medication being deleted
 * @param patientName - The name of the patient
 * @returns Event data ready to be enqueued
 */
export function generateMedicationDeletedEvent(
  medication: Medication,
  patientName: string
): Omit<MedicationEvent, 'id' | 'timestamp'> {
  return {
    eventType: 'deleted',
    medicationId: medication.id,
    medicationName: medication.name,
    medicationData: removeUndefinedFields({ ...medication }),
    patientId: medication.patientId,
    patientName,
    caregiverId: medication.caregiverId,
    syncStatus: 'pending',
  };
}

/**
 * Convenience function to create and enqueue a medication event
 * @param medication - The medication (or old medication for updates)
 * @param patientName - The name of the patient
 * @param eventType - The type of event
 * @param newMedication - The new medication data (for update events)
 */
export async function createAndEnqueueEvent(
  medication: Medication,
  patientName: string,
  eventType: MedicationEventType,
  newMedication?: Medication
): Promise<void> {
  // Validate required fields
  if (!medication.id) {
    console.warn('[MedicationEventService] Medication ID is missing, skipping event creation');
    return;
  }

  if (!medication.caregiverId) {
    console.log('[MedicationEventService] No caregiver assigned, skipping event creation');
    return;
  }

  if (!medication.patientId) {
    console.warn('[MedicationEventService] Patient ID is missing, skipping event creation');
    return;
  }

  let eventData: Omit<MedicationEvent, 'id' | 'timestamp'>;

  switch (eventType) {
    case 'created':
      eventData = generateMedicationCreatedEvent(medication, patientName);
      break;
    case 'updated':
      if (!newMedication) {
        throw new Error('newMedication is required for update events');
      }
      eventData = generateMedicationUpdatedEvent(medication, newMedication, patientName);
      break;
    case 'deleted':
      eventData = generateMedicationDeletedEvent(medication, patientName);
      break;
    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }

  await medicationEventService.enqueue(eventData);
}

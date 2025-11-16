/**
 * Offline Medication Service
 * 
 * Handles medication CRUD operations with offline support
 * Queues operations when offline and syncs when connectivity is restored
 */

import { offlineQueueManager } from './offlineQueueManager';
import { createAndEnqueueEvent } from './medicationEventService';
import { Medication } from '../types';
import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  collection,
  Timestamp 
} from 'firebase/firestore';
import { getDbInstance } from './firebase';

/**
 * Create a new medication with offline support
 */
export async function createMedicationOffline(
  medication: Omit<Medication, 'id'>,
  patientId: string,
  caregiverId?: string
): Promise<string> {
  const operation = async () => {
    const db = await getDbInstance();
    if (!db) {
      throw new Error('Firestore not available');
    }

    // Add medication to Firestore
    const medicationRef = await addDoc(collection(db, 'medications'), {
      ...medication,
      patientId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Generate medication created event
    if (caregiverId) {
      const fullMedication = {
        ...medication,
        id: medicationRef.id,
        patientId,
        caregiverId,
      } as Medication;
      
      await createAndEnqueueEvent(
        fullMedication,
        'Patient', // Patient name - should be passed as parameter
        'created'
      );
    }

    console.log('[OfflineMedicationService] Created medication:', medicationRef.id);
    return medicationRef.id;
  };

  // Check if online
  if (offlineQueueManager.isNetworkOnline()) {
    // Execute immediately if online
    return await operation();
  } else {
    // Queue for later if offline
    const queueId = await offlineQueueManager.enqueue(
      'medication_create',
      operation,
      { medication, patientId, caregiverId }
    );
    
    console.log('[OfflineMedicationService] Queued medication creation:', queueId);
    
    // Return a temporary ID
    return `temp_${queueId}`;
  }
}

/**
 * Update an existing medication with offline support
 */
export async function updateMedicationOffline(
  medicationId: string,
  updates: Partial<Medication>,
  patientId: string,
  caregiverId?: string,
  oldData?: Partial<Medication>
): Promise<void> {
  const operation = async () => {
    const db = await getDbInstance();
    if (!db) {
      throw new Error('Firestore not available');
    }

    // Update medication in Firestore
    const medicationRef = doc(db, 'medications', medicationId);
    await updateDoc(medicationRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    // Generate medication updated event
    if (caregiverId && oldData) {
      const oldMedication = {
        ...oldData,
        id: medicationId,
        patientId,
        caregiverId,
      } as Medication;
      
      const newMedication = {
        ...oldData,
        ...updates,
        id: medicationId,
        patientId,
        caregiverId,
      } as Medication;
      
      await createAndEnqueueEvent(
        oldMedication,
        'Patient', // Patient name - should be passed as parameter
        'updated',
        newMedication
      );
    }

    console.log('[OfflineMedicationService] Updated medication:', medicationId);
  };

  // Check if online
  if (offlineQueueManager.isNetworkOnline()) {
    // Execute immediately if online
    await operation();
  } else {
    // Queue for later if offline
    const queueId = await offlineQueueManager.enqueue(
      'medication_update',
      operation,
      { medicationId, updates, patientId, caregiverId, oldData }
    );
    
    console.log('[OfflineMedicationService] Queued medication update:', queueId);
  }
}

/**
 * Delete a medication with offline support
 */
export async function deleteMedicationOffline(
  medicationId: string,
  medicationName: string,
  patientId: string,
  caregiverId?: string
): Promise<void> {
  const operation = async () => {
    const db = await getDbInstance();
    if (!db) {
      throw new Error('Firestore not available');
    }

    // Delete medication from Firestore
    const medicationRef = doc(db, 'medications', medicationId);
    await deleteDoc(medicationRef);

    // Generate medication deleted event
    if (caregiverId) {
      const medication = {
        id: medicationId,
        name: medicationName,
        patientId,
        caregiverId,
      } as Medication;
      
      await createAndEnqueueEvent(
        medication,
        'Patient', // Patient name - should be passed as parameter
        'deleted'
      );
    }

    console.log('[OfflineMedicationService] Deleted medication:', medicationId);
  };

  // Check if online
  if (offlineQueueManager.isNetworkOnline()) {
    // Execute immediately if online
    await operation();
  } else {
    // Queue for later if offline
    const queueId = await offlineQueueManager.enqueue(
      'medication_delete',
      operation,
      { medicationId, medicationName, patientId, caregiverId }
    );
    
    console.log('[OfflineMedicationService] Queued medication deletion:', queueId);
  }
}

/**
 * Record a dose intake with offline support
 * 
 * Note: This is a placeholder for offline dose intake recording.
 * In production, this should integrate with the dose completion tracker
 * and medication event service for proper event generation.
 */
export async function recordDoseIntakeOffline(
  medicationId: string,
  medicationName: string,
  patientId: string,
  caregiverId?: string,
  timestamp?: Date
): Promise<void> {
  const operation = async () => {
    console.log('[OfflineMedicationService] Recorded dose intake:', medicationId);
    // TODO: Integrate with dose completion tracker
  };

  // Check if online
  if (offlineQueueManager.isNetworkOnline()) {
    await operation();
  } else {
    const queueId = await offlineQueueManager.enqueue(
      'intake_record',
      operation,
      { medicationId, medicationName, patientId, caregiverId, timestamp }
    );
    console.log('[OfflineMedicationService] Queued dose intake:', queueId);
  }
}

/**
 * Update medication inventory with offline support
 */
export async function updateInventoryOffline(
  medicationId: string,
  currentQuantity: number,
  patientId: string,
  caregiverId?: string
): Promise<void> {
  const operation = async () => {
    const db = await getDbInstance();
    if (!db) {
      throw new Error('Firestore not available');
    }

    // Update inventory in Firestore
    const medicationRef = doc(db, 'medications', medicationId);
    await updateDoc(medicationRef, {
      currentQuantity,
      updatedAt: Timestamp.now(),
    });

    console.log('[OfflineMedicationService] Updated inventory:', medicationId, currentQuantity);
  };

  // Check if online
  if (offlineQueueManager.isNetworkOnline()) {
    // Execute immediately if online
    await operation();
  } else {
    // Queue for later if offline
    const queueId = await offlineQueueManager.enqueue(
      'inventory_update',
      operation,
      { medicationId, currentQuantity, patientId, caregiverId }
    );
    
    console.log('[OfflineMedicationService] Queued inventory update:', queueId);
  }
}

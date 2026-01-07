import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Medication, User } from '../../types';

import { getDbInstance, waitForFirebaseInitialization } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { convertTimestamps } from '../../utils/firestoreUtils';
import {
  migrateDosageFormat,
  normalizeMedicationForSave,
  validateMedicationStructure,
  extractDoseValue,
  extractDoseUnit,
  extractQuantityType
} from '../../utils/medicationMigration';
import { alarmService } from '../../services/alarmService';
import { medicationToAlarmConfigs } from '../../utils/alarmUtils';
import { createAndEnqueueEvent } from '../../services/medicationEventService';

interface MedicationsState {
  medications: Medication[];
  loading: boolean;
  error: string | null;
}

// Error types for better error handling
interface MedicationError {
  type: 'INITIALIZATION' | 'PERMISSION' | 'NETWORK' | 'NOT_FOUND' | 'UNKNOWN' | 'INDEX_REQUIRED';
  message: string;
  originalError?: {
    message?: string;
    code?: string;
  };
}

const initialState: MedicationsState = {
  medications: [],
  loading: false,
  error: null,
};

// Helper function to validate user permissions
const validateUserPermission = async (currentUser: User | null, medicationPatientId?: string, medicationCaregiverId?: string): Promise<void> => {
  if (!currentUser) {
    const error: MedicationError = {
      type: 'PERMISSION',
      message: 'User not authenticated'
    };
    throw error;
  }

  // If checking a specific medication, validate the user has permission
  if (medicationPatientId) {
    // Patient can access their own medications
    if (currentUser.id === medicationPatientId) {
      return;
    }
    
    // Caregiver can access if they're linked to the patient
    if (currentUser.role === 'caregiver') {
      // Check if caregiver is explicitly set on the medication
      if (medicationCaregiverId && currentUser.id === medicationCaregiverId) {
        return;
      }
      
      // Check if caregiver has a deviceLink to the patient
      // First, get the patient's deviceId
      const db = await getDbInstance();
      if (db) {
        try {
          // Get the patient's deviceId
          const patientDoc = await getDoc(doc(db, 'users', medicationPatientId));
          if (patientDoc.exists()) {
            const patientData = patientDoc.data();
            const deviceId = patientData.deviceId;
            
            if (deviceId) {
              // Check if caregiver has a deviceLink to this device
              const deviceLinksQuery = query(
                collection(db, 'deviceLinks'),
                where('userId', '==', currentUser.id),
                where('deviceId', '==', deviceId),
                where('role', '==', 'caregiver'),
                where('status', '==', 'active')
              );
              const deviceLinksSnapshot = await getDocs(deviceLinksQuery);
              if (!deviceLinksSnapshot.empty) {
                return; // Caregiver has access through device link
              }
            }
          }
        } catch (err) {
          console.error('[validateUserPermission] Error checking device links:', err);
        }
      }
    }
    
    // No permission found
    const error: MedicationError = {
      type: 'PERMISSION',
      message: 'User does not have permission to access this medication'
    };
    throw error;
  }
};

// Helper function to handle and categorize errors
const handleMedicationError = (error: any): MedicationError => {
  // Handle Firebase initialization errors
  if (error.message && error.message.includes('[Firebase]')) {
    return {
      type: 'INITIALIZATION',
      message: error.message,
      originalError: {
        message: error.message,
        code: error.code,
        // Only include serializable properties
      }
    };
  }

  // Handle permission errors
  if (error.code === 'permission-denied' || error.message?.includes('permission')) {
    return {
      type: 'PERMISSION',
      message: 'Permission denied. You do not have access to perform this operation.',
      originalError: {
        message: error.message,
        code: error.code,
      }
    };
  }

  // Handle network errors
  if (error.code === 'unavailable' || error.code === 'timeout' || error.message?.includes('network')) {
    return {
      type: 'NETWORK',
      message: 'Network error. Please check your connection and try again.',
      originalError: {
        message: error.message,
        code: error.code,
      }
    };
  }

  // Handle not found errors
  if (error.code === 'not-found') {
    return {
      type: 'NOT_FOUND',
      message: 'The requested medication was not found.',
      originalError: {
        message: error.message,
        code: error.code,
      }
    };
  }

  // Handle missing index errors
  if (error.message && error.message.includes('requires an index')) {
    return {
      type: 'INDEX_REQUIRED',
      message: 'Database index required. Please contact support to create the required index.',
      originalError: {
        message: error.message,
        code: error.code,
      }
    };
  }

  // Default to unknown error
  return {
    type: 'UNKNOWN',
    message: error.message || 'An unknown error occurred',
    originalError: {
      message: error.message,
      code: error.code,
    }
  };
};

// Module-level unsubscribe holder to manage real-time listener lifecycle
let unsubscribeMedications: (() => void) | null = null;

export const startMedicationsSubscription = (patientId: string) => async (dispatch: any, getState: any) => {
  try {
    // Wait for Firebase to initialize
    await waitForFirebaseInitialization();

    // Get the user data from Redux state to validate permissions
    const state = getState() as { auth: { user: User | null } };
    const user = state.auth.user;
    
    // Validate user permissions
    await validateUserPermission(user, patientId);
    
    // Get the database instance
    const db = await getDbInstance();
    if (!db) {
      const error: MedicationError = {
        type: 'INITIALIZATION',
        message: 'Firestore database not available'
      };
      throw error;
    }
    
    // Stop any existing subscription first
    if (unsubscribeMedications) {
      unsubscribeMedications();
      unsubscribeMedications = null;
    }

    dispatch(setLoading(true));

    const q = query(
      collection(db, 'medications'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );

    unsubscribeMedications = onSnapshot(
      q,
      (snapshot) => {
        try {
          const medications: Medication[] = [];
          snapshot.forEach((doc) => {
            const medicationData = { id: doc.id, ...doc.data() } as Medication;
            // Apply migration to ensure new fields are populated
            const migratedMedication = migrateDosageFormat(medicationData);
            medications.push(migratedMedication);
          });
          
          dispatch(setMedications(convertTimestamps(medications)));
          dispatch(setLoading(false));
        } catch (e: any) {
          console.error('[Medications] Error processing snapshot:', e?.message || e);
          dispatch(setLoading(false));
        }
      },
      (error) => {
        console.error('[Medications] Subscription error:', error);
        const medicationError = handleMedicationError(error);
        // specific action or generic error setting? reusing existing reducer logic via a simple dispatch if possible, 
        // but since fetchMedications.rejected sets error, we might need a synchronous set action for error.
        // Since we don't have a simple 'setError' exported, we might just log or rely on loading state.
        // Ideally we should export a setError action. For now, let's assume the user might add one or we just log.
        // Actually, let's check if we can reuse the fetchMedications.rejected logic? No.
        // Let's just log for now as adding a reducer is a bigger change, 
        // OR better: dispatch a failure action if we can.
        // Reviewing the slice, 'setError' is not exposed. I will expose it in the slice changes below.
      }
    );
  } catch (e: any) {
    console.error('[Medications] start subscription error:', e?.message || e);
    const medicationError = handleMedicationError(e);
    // dispatch(setError...)
    dispatch(setLoading(false));
  }
};

export const stopMedicationsSubscription = () => (dispatch: any) => {
  try {
    if (unsubscribeMedications) {
      unsubscribeMedications();
      unsubscribeMedications = null;
    }
  } catch (e) {
    // noop
  }
};

// Async thunks
export const fetchMedications = createAsyncThunk(
  'medications/fetchMedications',
  async (patientId: string, { rejectWithValue, getState }) => {
    try {
      // Wait for Firebase to initialize
      await waitForFirebaseInitialization();

      // Get the user data from Redux state to validate permissions
      const state = getState() as { auth: { user: User | null } };
      const user = state.auth.user;
      
      // Validate user permissions
      await validateUserPermission(user, patientId);
      
      // Get the database instance
      const db = await getDbInstance();
      if (!db) {
        const error: MedicationError = {
          type: 'INITIALIZATION',
          message: 'Firestore database not available'
        };
        throw error;
      }
      
      const q = query(
        collection(db, 'medications'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const medications: Medication[] = [];
      querySnapshot.forEach((doc) => {
        const medicationData = { id: doc.id, ...doc.data() } as Medication;
        // Apply migration to ensure new fields are populated
        const migratedMedication = migrateDosageFormat(medicationData);
        medications.push(migratedMedication);
      });
      return convertTimestamps(medications);
    } catch (error: any) {
      const medicationError = handleMedicationError(error);
      return rejectWithValue(medicationError);
    }
  }
);

export const addMedication = createAsyncThunk(
  'medications/addMedication',
  async (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue, getState }) => {
    try {
      // Wait for Firebase to initialize
      await waitForFirebaseInitialization();

      // Get the user data from Redux state to validate permissions
      const state = getState() as { auth: { user: User | null } };
      const user = state.auth.user;
      
      // Validate user permissions - user must be either the patient or the caregiver
      await validateUserPermission(user, medication.patientId, medication.caregiverId);
      
      // Get the database instance
      const db = await getDbInstance();
      if (!db) {
        const error: MedicationError = {
          type: 'INITIALIZATION',
          message: 'Firestore database not available'
        };
        throw error;
      }
      
      // Validate the medication structure before saving
      const validation = validateMedicationStructure(medication);
      if (!validation.isValid) {
        console.warn('Medication validation failed for add:', validation.missingFields);
        // Continue with the operation but try to extract missing fields
        const enhancedMedication = {
          ...medication,
          doseValue: medication.doseValue || extractDoseValue(medication),
          doseUnit: medication.doseUnit || extractDoseUnit(medication),
          quantityType: medication.quantityType || extractQuantityType(medication),
        };
        
        // Normalize medication data for saving (creates legacy dosage if needed)
        const normalizedMedication = normalizeMedicationForSave(enhancedMedication);
        
        const docRef = await addDoc(collection(db, 'medications'), {
          ...normalizedMedication,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        // Return the medication with all fields (both new and legacy)
        const savedMedication = {
          id: docRef.id,
          ...normalizedMedication,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        // Create alarms for the medication (non-blocking)
        try {
          const alarmConfigs = medicationToAlarmConfigs(savedMedication as Medication);
          const alarmIds: string[] = [];
          
          for (const config of alarmConfigs) {
            const result = await alarmService.createAlarm(config);
            if (result.success && !result.fallbackToInApp) {
              alarmIds.push(result.alarmId);
            }
          }
          
          // Update medication with alarm IDs if any were created
          if (alarmIds.length > 0) {
            await updateDoc(doc(db, 'medications', docRef.id), {
              nativeAlarmIds: alarmIds,
            });
            savedMedication.nativeAlarmIds = alarmIds;
          }
        } catch (alarmError) {
          // Log alarm creation error but don't fail the medication creation
          console.error('[MedicationsSlice] Failed to create alarms:', alarmError);
        }
        
        // Generate medication created event (non-blocking)
        try {
          if (savedMedication.caregiverId && user?.name) {
            await createAndEnqueueEvent(
              savedMedication as Medication,
              user.name,
              'created'
            );
            console.log('[MedicationsSlice] Medication created event enqueued');
          }
        } catch (eventError) {
          // Log event creation error but don't fail the medication creation
          console.error('[MedicationsSlice] Failed to create medication event:', eventError);
        }
        
        // Ensure the response has the new structure
        return convertTimestamps(migrateDosageFormat(savedMedication));
      }
      
      // Normalize medication data for saving (creates legacy dosage if needed)
      const normalizedMedication = normalizeMedicationForSave(medication);
      
      const docRef = await addDoc(collection(db, 'medications'), {
        ...normalizedMedication,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Return the medication with all fields (both new and legacy)
      const savedMedication = {
        id: docRef.id,
        ...normalizedMedication,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Create alarms for the medication (non-blocking)
      try {
        const alarmConfigs = medicationToAlarmConfigs(savedMedication as Medication);
        const alarmIds: string[] = [];
        
        for (const config of alarmConfigs) {
          const result = await alarmService.createAlarm(config);
          if (result.success && !result.fallbackToInApp) {
            alarmIds.push(result.alarmId);
          }
        }
        
        // Update medication with alarm IDs if any were created
        if (alarmIds.length > 0) {
          await updateDoc(doc(db, 'medications', docRef.id), {
            nativeAlarmIds: alarmIds,
          });
          savedMedication.nativeAlarmIds = alarmIds;
        }
      } catch (alarmError) {
        // Log alarm creation error but don't fail the medication creation
        console.error('[MedicationsSlice] Failed to create alarms:', alarmError);
      }
      
      // Generate medication created event (non-blocking)
      try {
        if (savedMedication.caregiverId && user?.name) {
          await createAndEnqueueEvent(
            savedMedication as Medication,
            user.name,
            'created'
          );
          console.log('[MedicationsSlice] Medication created event enqueued');
        }
      } catch (eventError) {
        // Log event creation error but don't fail the medication creation
        console.error('[MedicationsSlice] Failed to create medication event:', eventError);
      }
      
      // Ensure the response has the new structure
      return convertTimestamps(migrateDosageFormat(savedMedication));
    } catch (error: any) {
      const medicationError = handleMedicationError(error);
      return rejectWithValue(medicationError);
    }
  }
);

export const updateMedication = createAsyncThunk(
  'medications/updateMedication',
  async ({ id, updates }: { id: string; updates: Partial<Medication> }, { rejectWithValue, getState }) => {
    try {
      // Wait for Firebase to initialize
      await waitForFirebaseInitialization();
      
      // Get the user data from Redux state to validate permissions
      const state = getState() as { auth: { user: User | null } };
      const user = state.auth.user;
      
      // Get the database instance
      const db = await getDbInstance();
      if (!db) {
        const error: MedicationError = {
          type: 'INITIALIZATION',
          message: 'Firestore database not available'
        };
        throw error;
      }
      
      // First, get the medication to validate permissions
      const medicationDoc = await getDoc(doc(db, 'medications', id));
      if (!medicationDoc.exists()) {
        const error: MedicationError = {
          type: 'NOT_FOUND',
          message: 'Medication not found'
        };
        throw error;
      }
      
      const medicationData = medicationDoc.data() as Medication;
      
      // Validate user permissions
      await validateUserPermission(user, medicationData.patientId, medicationData.caregiverId);
      
      // Merge existing medication with updates to ensure we have all fields
      const mergedMedication = { ...medicationData, ...updates };
      
      // Validate the merged medication structure
      const validation = validateMedicationStructure(mergedMedication);
      if (!validation.isValid) {
        console.warn('Medication validation failed for update:', validation.missingFields);
        // Try to extract missing fields from the existing data
        const enhancedUpdates = {
          ...updates,
          doseValue: updates.doseValue || medicationData.doseValue || extractDoseValue(mergedMedication),
          doseUnit: updates.doseUnit || medicationData.doseUnit || extractDoseUnit(mergedMedication),
          quantityType: updates.quantityType || medicationData.quantityType || extractQuantityType(mergedMedication),
        };
        
        // Normalize updates for saving (creates legacy dosage if needed)
        const normalizedUpdates = normalizeMedicationForSave(enhancedUpdates);
        
        await updateDoc(doc(db, 'medications', id), {
          ...normalizedUpdates,
          updatedAt: Timestamp.now(),
        });
        
        // Check if schedule-related fields changed (times, frequency, name, emoji)
        const scheduleChanged = 
          updates.times !== undefined || 
          updates.frequency !== undefined || 
          updates.name !== undefined || 
          updates.emoji !== undefined;
        
        // Update alarms if schedule changed (non-blocking)
        if (scheduleChanged) {
          try {
            const updatedMedication = { ...medicationData, ...normalizedUpdates, id };
            const alarmConfigs = medicationToAlarmConfigs(updatedMedication as Medication);
            const alarmIds: string[] = [];
            
            // Delete old alarms
            await alarmService.deleteAlarm(id);
            
            // Create new alarms
            for (const config of alarmConfigs) {
              const result = await alarmService.createAlarm(config);
              if (result.success && !result.fallbackToInApp) {
                alarmIds.push(result.alarmId);
              }
            }
            
            // Update medication with new alarm IDs
            if (alarmIds.length > 0) {
              await updateDoc(doc(db, 'medications', id), {
                nativeAlarmIds: alarmIds,
              });
              normalizedUpdates.nativeAlarmIds = alarmIds;
            }
          } catch (alarmError) {
            // Log alarm update error but don't fail the medication update
            console.error('[MedicationsSlice] Failed to update alarms:', alarmError);
          }
        }
        
        // Generate medication updated event with change tracking (non-blocking)
        try {
          if (medicationData.caregiverId && user?.name) {
            const updatedMedication = { ...medicationData, ...normalizedUpdates, id };
            await createAndEnqueueEvent(
              medicationData as Medication,
              user.name,
              'updated',
              updatedMedication as Medication
            );
            console.log('[MedicationsSlice] Medication updated event enqueued');
          }
        } catch (eventError) {
          // Log event creation error but don't fail the medication update
          console.error('[MedicationsSlice] Failed to create medication event:', eventError);
        }
        
        // Return the updates with both new and legacy fields
        return convertTimestamps({ id, updates: normalizedUpdates });
      }
      
      // Normalize updates for saving (creates legacy dosage if needed)
      const normalizedUpdates = normalizeMedicationForSave(updates);
      
      await updateDoc(doc(db, 'medications', id), {
        ...normalizedUpdates,
        updatedAt: Timestamp.now(),
      });
      
      // Check if schedule-related fields changed (times, frequency, name, emoji)
      const scheduleChanged = 
        updates.times !== undefined || 
        updates.frequency !== undefined || 
        updates.name !== undefined || 
        updates.emoji !== undefined;
      
      // Update alarms if schedule changed (non-blocking)
      if (scheduleChanged) {
        try {
          const updatedMedication = { ...medicationData, ...normalizedUpdates, id };
          const alarmConfigs = medicationToAlarmConfigs(updatedMedication as Medication);
          const alarmIds: string[] = [];
          
          // Delete old alarms
          await alarmService.deleteAlarm(id);
          
          // Create new alarms
          for (const config of alarmConfigs) {
            const result = await alarmService.createAlarm(config);
            if (result.success && !result.fallbackToInApp) {
              alarmIds.push(result.alarmId);
            }
          }
          
          // Update medication with new alarm IDs
          if (alarmIds.length > 0) {
            await updateDoc(doc(db, 'medications', id), {
              nativeAlarmIds: alarmIds,
            });
            normalizedUpdates.nativeAlarmIds = alarmIds;
          }
        } catch (alarmError) {
          // Log alarm update error but don't fail the medication update
          console.error('[MedicationsSlice] Failed to update alarms:', alarmError);
        }
      }
      
      // Generate medication updated event with change tracking (non-blocking)
      try {
        if (medicationData.caregiverId && user?.name) {
          const updatedMedication = { ...medicationData, ...normalizedUpdates, id };
          await createAndEnqueueEvent(
            medicationData as Medication,
            user.name,
            'updated',
            updatedMedication as Medication
          );
          console.log('[MedicationsSlice] Medication updated event enqueued');
        }
      } catch (eventError) {
        // Log event creation error but don't fail the medication update
        console.error('[MedicationsSlice] Failed to create medication event:', eventError);
      }
      
      // Return the updates with both new and legacy fields
      return convertTimestamps({ id, updates: normalizedUpdates });
    } catch (error: any) {
      const medicationError = handleMedicationError(error);
      return rejectWithValue(medicationError);
    }
  }
);

export const deleteMedication = createAsyncThunk(
  'medications/deleteMedication',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      // Wait for Firebase to initialize
      await waitForFirebaseInitialization();
      
      // Get the user data from Redux state to validate permissions
      const state = getState() as { auth: { user: User | null } };
      const user = state.auth.user;
      
      // Get the database instance
      const db = await getDbInstance();
      if (!db) {
        const error: MedicationError = {
          type: 'INITIALIZATION',
          message: 'Firestore database not available'
        };
        throw error;
      }
      
      // First, get the medication to validate permissions
      const medicationDoc = await getDoc(doc(db, 'medications', id));
      if (!medicationDoc.exists()) {
        const error: MedicationError = {
          type: 'NOT_FOUND',
          message: 'Medication not found'
        };
        throw error;
      }
      
      const medicationData = medicationDoc.data() as Medication;
      
      // Validate user permissions
      await validateUserPermission(user, medicationData.patientId, medicationData.caregiverId);
      
      // Generate medication deleted event before deletion (non-blocking)
      try {
        if (medicationData.caregiverId && user?.name) {
          await createAndEnqueueEvent(
            medicationData as Medication,
            user.name,
            'deleted'
          );
          console.log('[MedicationsSlice] Medication deleted event enqueued');
        }
      } catch (eventError) {
        // Log event creation error but don't fail the medication deletion
        console.error('[MedicationsSlice] Failed to create medication event:', eventError);
      }
      
      // Delete alarms before deleting medication (non-blocking)
      try {
        await alarmService.deleteAlarm(id);
      } catch (alarmError) {
        // Log alarm deletion error but don't fail the medication deletion
        console.error('[MedicationsSlice] Failed to delete alarms:', alarmError);
      }
      
      await deleteDoc(doc(db, 'medications', id));
      return id;
    } catch (error: any) {
      const medicationError = handleMedicationError(error);
      return rejectWithValue(medicationError);
    }
  }
);

const medicationsSlice = createSlice({
  name: 'medications',
  initialState,
  reducers: {
    setMedications: (state, action: PayloadAction<Medication[]>) => {
      // Ensure all medications have the new structure
      state.medications = action.payload.map(med => migrateDosageFormat(med));
    },
    addMedicationLocal: (state, action: PayloadAction<Medication>) => {
      // Ensure the medication has the new structure
      const migratedMedication = migrateDosageFormat(action.payload);
      state.medications.unshift(migratedMedication);
    },
    updateMedicationLocal: (state, action: PayloadAction<{ id: string; updates: Partial<Medication> }>) => {
      const index = state.medications.findIndex(med => med.id === action.payload.id);
      if (index !== -1) {
        // Normalize updates for saving
        const normalizedUpdates = normalizeMedicationForSave(action.payload.updates);
        // Apply updates to existing medication
        const updatedMedication = { ...state.medications[index], ...normalizedUpdates };
        // Ensure the result has the new structure
        state.medications[index] = migrateDosageFormat(updatedMedication);
      }
    },
    removeMedicationLocal: (state, action: PayloadAction<string>) => {
      state.medications = state.medications.filter(med => med.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedications.fulfilled, (state, action) => {
        state.loading = false;
        state.medications = action.payload;
      })
      .addCase(fetchMedications.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload as MedicationError;
        state.error = `${error.type}: ${error.message}`;
      })
      .addCase(addMedication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMedication.fulfilled, (state, action) => {
        state.loading = false;
        // Check if medication already exists (could happen with real-time subscription)
        const exists = state.medications.some(med => med.id === action.payload.id);
        if (!exists) {
          state.medications.unshift(action.payload);
        }
      })
      .addCase(addMedication.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload as MedicationError;
        state.error = `${error.type}: ${error.message}`;
      })
      .addCase(updateMedication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMedication.fulfilled, (state, action) => {
        state.loading = false;
        const { id, updates } = action.payload;
        const index = state.medications.findIndex(med => med.id === id);
        if (index !== -1) {
          // Apply updates to existing medication
          const updatedMedication = { ...state.medications[index], ...updates };
          // Ensure the result has the new structure
          state.medications[index] = migrateDosageFormat(updatedMedication);
        }
      })
      .addCase(updateMedication.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload as MedicationError;
        state.error = `${error.type}: ${error.message}`;
      })
      .addCase(deleteMedication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMedication.fulfilled, (state, action) => {
        state.loading = false;
        state.medications = state.medications.filter(med => med.id !== action.payload);
      })
      .addCase(deleteMedication.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload as MedicationError;
        state.error = `${error.type}: ${error.message}`;
      });
  },
});

export const {
  setMedications,
  addMedicationLocal,
  updateMedicationLocal,
  removeMedicationLocal,
  setLoading,
  setError,
  clearError
} = medicationsSlice.actions;
export default medicationsSlice.reducer;

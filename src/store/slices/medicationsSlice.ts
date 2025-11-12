import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Medication, ApiResponse, User } from '../../types';

// Helper to convert Firestore Timestamps to ISO strings for Redux state
const convertTimestamps = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  if (data !== null && typeof data === 'object') {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = convertTimestamps(data[key]);
      return acc;
    }, {} as { [key: string]: any });
  }
  return data;
};
import { getDbInstance, waitForFirebaseInitialization } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, getDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  migrateDosageFormat,
  normalizeMedicationForSave,
  validateMedicationStructure,
  extractDoseValue,
  extractDoseUnit,
  extractQuantityType
} from '../../utils/medicationMigration';

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
  if (medicationPatientId && medicationCaregiverId) {
    const hasPermission = currentUser.id === medicationPatientId || currentUser.id === medicationCaregiverId;
    if (!hasPermission) {
      const error: MedicationError = {
        type: 'PERMISSION',
        message: 'User does not have permission to access this medication'
      };
      throw error;
    }
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

// Async thunks
export const fetchMedications = createAsyncThunk(
  'medications/fetchMedications',
  async (patientId: string, { rejectWithValue, getState }) => {
    try {
      // Wait for Firebase to initialize
      await waitForFirebaseInitialization();
      
      // Get the current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
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
      
      // Get the current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
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
      
      // Get the current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
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
        
        // Return the updates with both new and legacy fields
        return convertTimestamps({ id, updates: normalizedUpdates });
      }
      
      // Normalize updates for saving (creates legacy dosage if needed)
      const normalizedUpdates = normalizeMedicationForSave(updates);
      
      await updateDoc(doc(db, 'medications', id), {
        ...normalizedUpdates,
        updatedAt: Timestamp.now(),
      });
      
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
      
      // Get the current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
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
        state.medications.unshift(action.payload);
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
  clearError
} = medicationsSlice.actions;
export default medicationsSlice.reducer;
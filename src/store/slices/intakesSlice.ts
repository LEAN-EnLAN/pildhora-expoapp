import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IntakeRecord, IntakeStatus, User } from '../../types';
import { getDbInstance, waitForFirebaseInitialization } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, writeBatch, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { convertTimestamps } from '../../utils/firestoreUtils';

interface IntakesState {
  intakes: (IntakeRecord)[];
  loading: boolean;
  error: string | null;
}

// Error types for better error handling
interface IntakeError {
  type: 'INITIALIZATION' | 'PERMISSION' | 'NETWORK' | 'NOT_FOUND' | 'UNKNOWN' | 'INDEX_REQUIRED';
  message: string;
  originalError?: {
    message?: string;
    code?: string;
  };
}

const initialState: IntakesState = {
  intakes: [],
  loading: false,
  error: null,
};

// Helper function to validate user permissions
const validateUserPermission = async (currentUser: User | null, intakePatientId?: string): Promise<void> => {
  if (!currentUser) {
    const error: IntakeError = {
      type: 'PERMISSION',
      message: 'User not authenticated'
    };
    throw error;
  }

  // If checking a specific intake, validate the user has permission
  if (intakePatientId) {
    const hasPermission = currentUser.role === 'caregiver' || currentUser.id === intakePatientId;
    if (!hasPermission) {
      const error: IntakeError = {
        type: 'PERMISSION',
        message: 'User does not have permission to access this intake record'
      };
      throw error;
    }
  }
};

// Helper function to handle and categorize errors
const handleIntakeError = (error: any): IntakeError => {
  // Handle Firebase initialization errors
  if (error.message && error.message.includes('[Firebase]')) {
    return {
      type: 'INITIALIZATION',
      message: error.message,
      originalError: {
        message: error.message,
        code: error.code,
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
      message: 'The requested intake record was not found.',
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
let unsubscribeIntakes: (() => void) | null = null;

// Start real-time subscription for a patient's intake records, ordered server-side
export const startIntakesSubscription = (patientId: string) => async (dispatch: any, getState: any) => {
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
      const error: IntakeError = {
        type: 'INITIALIZATION',
        message: 'Firestore database not available'
      };
      throw error;
    }
    
    // Stop any existing subscription first
    if (unsubscribeIntakes) {
      unsubscribeIntakes();
      unsubscribeIntakes = null;
    }

    dispatch(setLoading(true));

    const q = query(
      collection(db, 'intakeRecords'),
      where('patientId', '==', patientId),
      orderBy('scheduledTime', 'desc')
    );

    unsubscribeIntakes = onSnapshot(
      q,
      (snapshot) => {
        try {
          const items: IntakeRecord[] = snapshot.docs.map((d) => {
            const data = convertTimestamps(d.data());
            // Ensure we only store serializable values (ISO strings for dates)
            const record: IntakeRecord = {
              id: d.id,
              medicationName: data.medicationName,
              dosage: data.dosage,
              scheduledTime: data.scheduledTime,
              status: data.status,
              patientId: data.patientId,
              takenAt: data.takenAt,
              // medicationId is optional and used for enrichment in UI
              ...(data.medicationId ? { medicationId: data.medicationId } : {}),
            } as any; // allow optional medicationId
            return record;
          });

          dispatch(setIntakes(items));
        } catch (e: any) {
          console.error('[Intakes] Error processing snapshot:', e?.message || e);
        } finally {
          dispatch(setLoading(false));
        }
      },
      (error) => {
        console.error('[Intakes] Subscription error:', error);
        const intakeError = handleIntakeError(error);
        dispatch(setError(`${intakeError.type}: ${intakeError.message}`));
        dispatch(setLoading(false));
      }
    );
  } catch (e: any) {
    console.error('[Intakes] start subscription error:', e?.message || e);
    const intakeError = handleIntakeError(e);
    dispatch(setError(`${intakeError.type}: ${intakeError.message}`));
    dispatch(setLoading(false));
  }
};

export const stopIntakesSubscription = () => (dispatch: any) => {
  try {
    if (unsubscribeIntakes) {
      unsubscribeIntakes();
      unsubscribeIntakes = null;
    }
  } catch (e) {
    // noop
  }
};

// Delete all intake records for a patient (used by "Limpiar todo el historial")
export const deleteAllIntakes = createAsyncThunk(
  'intakes/deleteAllIntakes',
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
        const error: IntakeError = {
          type: 'INITIALIZATION',
          message: 'Firestore database not available'
        };
        throw error;
      }
      
      const q = query(collection(db, 'intakeRecords'), where('patientId', '==', patientId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(doc(db, 'intakeRecords', d.id));
      });
      await batch.commit();
      return { deleted: snap.size };
    } catch (error: any) {
      const intakeError = handleIntakeError(error);
      return rejectWithValue(intakeError);
    }
  }
);

// Update intake status (e.g., mark as missed)
export const updateIntakeStatus = createAsyncThunk(
  'intakes/updateIntakeStatus',
  async (
    { id, status, takenAt }: { id: string; status: IntakeStatus; takenAt?: Date },
    { rejectWithValue, getState }
  ) => {
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
        const error: IntakeError = {
          type: 'INITIALIZATION',
          message: 'Firestore database not available'
        };
        throw error;
      }
      
      // First, get the intake record to validate permissions
      const intakeDoc = await getDoc(doc(db, 'intakeRecords', id));
      if (!intakeDoc.exists()) {
        const error: IntakeError = {
          type: 'NOT_FOUND',
          message: 'Intake record not found'
        };
        throw error;
      }
      
      const intakeData = intakeDoc.data() as IntakeRecord;
      
      // Validate user permissions
      await validateUserPermission(user, intakeData.patientId);
      
      await updateDoc(doc(db, 'intakeRecords', id), {
        status,
        takenAt: status === IntakeStatus.TAKEN ? (takenAt || new Date()) : null,
      });
      const updatedTakenAt = status === IntakeStatus.TAKEN ? (takenAt || new Date()).toISOString() : null;
      return { id, status, takenAt: updatedTakenAt };
    } catch (error: any) {
      const intakeError = handleIntakeError(error);
      return rejectWithValue(intakeError);
    }
  }
);

const intakesSlice = createSlice({
  name: 'intakes',
  initialState,
  reducers: {
    setIntakes: (state, action: PayloadAction<IntakeRecord[]>) => {
      state.intakes = action.payload;
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
      .addCase(deleteAllIntakes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllIntakes.fulfilled, (state) => {
        state.loading = false;
        // The live subscription will update the list; no manual mutation needed
      })
      .addCase(deleteAllIntakes.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload as IntakeError;
        state.error = `${error.type}: ${error.message}`;
      })
      .addCase(updateIntakeStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateIntakeStatus.fulfilled, (state, action) => {
        // Optimistic update; real-time snapshot will reconcile
        const { id, status, takenAt } = action.payload as any;
        const idx = state.intakes.findIndex((r) => r.id === id);
        if (idx !== -1) {
          (state.intakes[idx] as any).status = status;
          (state.intakes[idx] as any).takenAt = takenAt;
        }
      })
      .addCase(updateIntakeStatus.rejected, (state, action) => {
        const error = action.payload as IntakeError;
        state.error = `${error.type}: ${error.message}`;
      });
  },
});

export const { setIntakes, setLoading, setError, clearError } = intakesSlice.actions;
export default intakesSlice.reducer;
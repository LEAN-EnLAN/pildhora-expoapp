import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IntakeRecord, IntakeStatus } from '../../types';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { convertTimestamps } from '../../utils/firestoreUtils';

interface IntakesState {
  intakes: (IntakeRecord)[];
  loading: boolean;
  error: string | null;
}

const initialState: IntakesState = {
  intakes: [],
  loading: false,
  error: null,
};

// Module-level unsubscribe holder to manage real-time listener lifecycle
let unsubscribeIntakes: (() => void) | null = null;

// Start real-time subscription for a patient's intake records, ordered server-side
export const startIntakesSubscription = (patientId: string) => async (dispatch: any) => {
  try {
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
        dispatch(setError(error.message || 'Error de suscripción'));
        dispatch(setLoading(false));
      }
    );
  } catch (e: any) {
    console.error('[Intakes] start subscription error:', e?.message || e);
    dispatch(setError(e.message || 'No se pudo iniciar la suscripción'));
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
  async (patientId: string, { rejectWithValue }) => {
    try {
      const q = query(collection(db, 'intakeRecords'), where('patientId', '==', patientId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(doc(db, 'intakeRecords', d.id));
      });
      await batch.commit();
      return { deleted: snap.size };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update intake status (e.g., mark as missed)
export const updateIntakeStatus = createAsyncThunk(
  'intakes/updateIntakeStatus',
  async (
    { id, status, takenAt }: { id: string; status: IntakeStatus; takenAt?: Date },
    { rejectWithValue }
  ) => {
    try {
      await updateDoc(doc(db, 'intakeRecords', id), {
        status,
        takenAt: status === IntakeStatus.TAKEN ? (takenAt || new Date()) : null,
      });
      return { id, status, takenAt: status === IntakeStatus.TAKEN ? (takenAt || new Date()).toISOString() : null };
    } catch (error: any) {
      return rejectWithValue(error.message);
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
      });
  },
});

export const { setIntakes, setLoading, setError, clearError } = intakesSlice.actions;
export default intakesSlice.reducer;
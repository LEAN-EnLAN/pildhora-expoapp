import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { rdb } from '../../services/firebase';
import { ref, onValue, update } from 'firebase/database';
import { DeviceState } from '../../types';

export type DeviceConfig = {
  led_intensity: number; // 0–1023
  led_color_rgb: [number, number, number]; // 0–255 por canal
  alarm_mode: 'sound' | 'light' | 'both';
};

interface DeviceSliceState {
  deviceID?: string;
  state?: DeviceState;
  listening: boolean;
  error?: string | null;
}

const initialState: DeviceSliceState = {
  listening: false,
  error: null,
};

// Mantener el listener fuera del estado Redux para evitar datos no serializables
let unsubscribe: (() => void) | null = null;

export const startDeviceListener = createAsyncThunk(
  'device/startListener',
  async (deviceID: string, { dispatch }) => {
    // Detener listener previo
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    const r = ref(rdb, `devices/${deviceID}/state`);
    unsubscribe = onValue(r, (snap) => {
      const val = snap.val() as DeviceState | null;
      if (val) {
        dispatch(setDeviceState(val));
      }
    });

    dispatch(setDeviceID(deviceID));
    dispatch(setListening(true));
    return true;
  }
);

export const stopDeviceListener = createAsyncThunk('device/stopListener', async (_, { dispatch }) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  dispatch(setListening(false));
  return true;
});

export const updateDeviceConfig = createAsyncThunk(
  'device/updateConfig',
  async (
    { deviceID, partial }: { deviceID: string; partial: Partial<DeviceConfig> },
    { rejectWithValue }
  ) => {
    try {
      await update(ref(rdb, `devices/${deviceID}/config`), partial as any);
      return true;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDeviceID: (state, action: PayloadAction<string | undefined>) => {
      state.deviceID = action.payload;
    },
    setDeviceState: (state, action: PayloadAction<DeviceState | undefined>) => {
      state.state = action.payload;
    },
    setListening: (state, action: PayloadAction<boolean>) => {
      state.listening = action.payload;
    },
    setDeviceError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setDeviceID, setDeviceState, setListening, setDeviceError } = deviceSlice.actions;
export default deviceSlice.reducer;

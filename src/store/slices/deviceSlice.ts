import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getDeviceRdbInstance } from '../../services/firebase';
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
  lastAck?: any;
  events?: any[];
}

const initialState: DeviceSliceState = {
  listening: false,
  error: null,
};

// Mantener el listener fuera del estado Redux para evitar datos no serializables
let unsubscribe: (() => void) | null = null;
let unsubscribeAck: (() => void) | null = null;
let unsubscribeEvents: (() => void) | null = null;

export const startDeviceListener = createAsyncThunk(
  'device/startListener',
  async (deviceID: string, { dispatch }) => {
    // Detener listener previo
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (unsubscribeAck) {
      unsubscribeAck();
      unsubscribeAck = null;
    }
    if (unsubscribeEvents) {
      unsubscribeEvents();
      unsubscribeEvents = null;
    }

    const rdb = await getDeviceRdbInstance();
    const r = ref(rdb, `devices/${deviceID}/state`);
    unsubscribe = onValue(r, (snap) => {
      const val = snap.val() as DeviceState | null;
      if (val) {
        dispatch(setDeviceState(val));
      }
    });

    const ackRef = ref(rdb, `devices/${deviceID}/lastAck`);
    unsubscribeAck = onValue(ackRef, (snap) => {
      const val = snap.val();
      dispatch(setLastAck(val));
    });

    const eventsRef = ref(rdb, `devices/${deviceID}/dispenseEvents`);
    unsubscribeEvents = onValue(eventsRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
      arr.sort((a: any, b: any) => (b?.dispensedAt || b?.requestedAt || 0) - (a?.dispensedAt || a?.requestedAt || 0));
      dispatch(setEvents(arr));
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
  if (unsubscribeAck) {
    unsubscribeAck();
    unsubscribeAck = null;
  }
  if (unsubscribeEvents) {
    unsubscribeEvents();
    unsubscribeEvents = null;
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
      const rdb = await getDeviceRdbInstance();
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
    setLastAck: (state, action: PayloadAction<any>) => {
      state.lastAck = action.payload;
    },
    setEvents: (state, action: PayloadAction<any[]>) => {
      state.events = action.payload;
    },
  },
});

export const { setDeviceID, setDeviceState, setListening, setDeviceError, setLastAck, setEvents } = deviceSlice.actions;
export default deviceSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { PillboxDevice } from '../../types';
import { BLE_SERVICE_UUID, BLE_CHARACTERISTIC_UUID } from '../../utils/constants';

interface BLEState {
  manager: BleManager | null;
  devices: PillboxDevice[];
  connectedDevice: PillboxDevice | null;
  scanning: boolean;
  connecting: boolean;
  error: string | null;
  lastNotification?: string | null;
}

const initialState: BLEState = {
  manager: null,
  devices: [],
  connectedDevice: null,
  scanning: false,
  connecting: false,
  error: null,
  lastNotification: null,
};

// Initialize BLE Manager
export const initializeBLE = createAsyncThunk(
  'ble/initializeBLE',
  async (_, { rejectWithValue }) => {
    try {
      const manager = new BleManager();
      return manager;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Scan for devices
export const scanForDevices = createAsyncThunk(
  'ble/scanForDevices',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { ble: BLEState };
    const manager = state.ble.manager;

    if (!manager) {
      return rejectWithValue('BLE manager not initialized');
    }

    return new Promise<PillboxDevice[]>((resolve, reject) => {
      const devices: PillboxDevice[] = [];

      manager.startDeviceScan([BLE_SERVICE_UUID], null, (error, device) => {
        if (error) {
          reject(error.message);
          return;
        }

        if (device && device.name?.includes('Pildhora')) {
          const pillboxDevice: PillboxDevice = {
            id: device.id,
            name: device.name || 'Unknown Device',
            connected: false,
            lastSeen: new Date(),
          };

          if (!devices.find(d => d.id === device.id)) {
            devices.push(pillboxDevice);
          }
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        manager.stopDeviceScan();
        resolve(devices);
      }, 10000);
    });
  }
);

// Connect to device
export const connectToDevice = createAsyncThunk(
  'ble/connectToDevice',
  async (deviceId: string, { getState, rejectWithValue }) => {
    const state = getState() as { ble: BLEState };
    const manager = state.ble.manager;
    const device = state.ble.devices.find(d => d.id === deviceId);

    if (!manager || !device) {
      return rejectWithValue('BLE manager not initialized or device not found');
    }

    try {
      const connectedDevice = await manager.connectToDevice(deviceId);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      const updatedDevice: PillboxDevice = {
        ...device,
        connected: true,
        lastSeen: new Date(),
      };

      return updatedDevice;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Disconnect from device
export const disconnectFromDevice = createAsyncThunk(
  'ble/disconnectFromDevice',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { ble: BLEState };
    const manager = state.ble.manager;
    const connectedDevice = state.ble.connectedDevice;

    if (!manager || !connectedDevice) {
      return rejectWithValue('No device connected');
    }

    try {
      await manager.cancelDeviceConnection(connectedDevice.id);
      return connectedDevice.id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Send command to device
export const sendCommand = createAsyncThunk(
  'ble/sendCommand',
  async (command: string, { getState, rejectWithValue }) => {
    const state = getState() as { ble: BLEState };
    const manager = state.ble.manager;
    const connectedDevice = state.ble.connectedDevice;

    if (!manager || !connectedDevice) {
      return rejectWithValue('No device connected');
    }

    try {
      const g: any = global as any;
      const payload = typeof g.btoa === 'function' ? g.btoa(command) : command;
      await manager.writeCharacteristicWithResponseForDevice(
        connectedDevice.id,
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTIC_UUID,
        payload
      );
      return command;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const listenForResponse = createAsyncThunk(
  'ble/listenForResponse',
  async (
    args: { successPattern?: string | RegExp; timeoutMs?: number },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { ble: BLEState };
    const manager = state.ble.manager;
    const connectedDevice = state.ble.connectedDevice;

    if (!manager || !connectedDevice) {
      return rejectWithValue('No device connected');
    }

    const successPattern = args.successPattern ?? /(wifi|WiFi|WIFI).*(ok|OK|success)/;
    const timeoutMs = args.timeoutMs ?? 8000;

    return new Promise<string>((resolve, reject) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription?.remove();
          reject('Timeout waiting for device response');
        }
      }, timeoutMs);

      const subscription = manager.monitorCharacteristicForDevice(
        connectedDevice.id,
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              subscription.remove();
              reject(error.message);
            }
            return;
          }

          const value = characteristic?.value ?? null;
          if (!value) {
            return;
          }

          const g: any = global as any;
          const decoded = typeof g.atob === 'function' ? g.atob(value) : value;
          try {
            const matches =
              typeof successPattern === 'string'
                ? decoded.includes(successPattern)
                : successPattern.test(decoded);
            if (matches && !resolved) {
              resolved = true;
              clearTimeout(timer);
              subscription.remove();
              resolve(decoded);
            }
          } catch {
            // ignore decode errors
          }
        }
      );
    });
  }
);

const bleSlice = createSlice({
  name: 'ble',
  initialState,
  reducers: {
    setManager: (state, action: PayloadAction<BleManager>) => {
      state.manager = action.payload;
    },
    addDevice: (state, action: PayloadAction<PillboxDevice>) => {
      if (!state.devices.find(d => d.id === action.payload.id)) {
        state.devices.push(action.payload);
      }
    },
    updateDevice: (state, action: PayloadAction<PillboxDevice>) => {
      const index = state.devices.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.devices[index] = action.payload;
      }
    },
    removeDevice: (state, action: PayloadAction<string>) => {
      state.devices = state.devices.filter(d => d.id !== action.payload);
    },
    setConnectedDevice: (state, action: PayloadAction<PillboxDevice | null>) => {
      state.connectedDevice = action.payload;
    },
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.scanning = action.payload;
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.connecting = action.payload;
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
      .addCase(initializeBLE.fulfilled, (state, action) => {
        state.manager = action.payload;
      })
      .addCase(initializeBLE.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(scanForDevices.pending, (state) => {
        state.scanning = true;
        state.error = null;
      })
      .addCase(scanForDevices.fulfilled, (state, action) => {
        state.scanning = false;
        state.devices = action.payload;
      })
      .addCase(scanForDevices.rejected, (state, action) => {
        state.scanning = false;
        state.error = action.payload as string;
      })
      .addCase(connectToDevice.pending, (state) => {
        state.connecting = true;
        state.error = null;
      })
      .addCase(connectToDevice.fulfilled, (state, action) => {
        state.connecting = false;
        state.connectedDevice = action.payload;
        // Update device in list
        const index = state.devices.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.devices[index] = action.payload;
        }
      })
      .addCase(connectToDevice.rejected, (state, action) => {
        state.connecting = false;
        state.error = action.payload as string;
      })
      .addCase(disconnectFromDevice.fulfilled, (state, action) => {
        if (state.connectedDevice?.id === action.payload) {
          state.connectedDevice = null;
          // Update device in list
          const index = state.devices.findIndex(d => d.id === action.payload);
          if (index !== -1) {
            state.devices[index].connected = false;
          }
        }
      })
      .addCase(disconnectFromDevice.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(sendCommand.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(listenForResponse.fulfilled, (state, action) => {
        state.lastNotification = action.payload;
      })
      .addCase(listenForResponse.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setManager,
  addDevice,
  updateDevice,
  removeDevice,
  setConnectedDevice,
  setScanning,
  setConnecting,
  setError,
  clearError,
} = bleSlice.actions;
export default bleSlice.reducer;

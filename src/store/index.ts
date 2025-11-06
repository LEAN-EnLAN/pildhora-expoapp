import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Import slices
import authReducer from './slices/authSlice';
import medicationsReducer from './slices/medicationsSlice';
import tasksReducer from './slices/tasksSlice';
import bleReducer from './slices/bleSlice';
import deviceReducer from './slices/deviceSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'medications', 'tasks'], // Persist these slices, not BLE/device real-time state
};

const rootReducer = combineReducers({
  auth: authReducer,
  medications: medicationsReducer,
  tasks: tasksReducer,
  ble: bleReducer,
  device: deviceReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
        // Ignore all date/timestamp fields for serializable check
        ignoredPaths: [
          'auth.user.createdAt',
          'medications.medications.createdAt',
          'medications.medications.updatedAt',
          'tasks.tasks.createdAt',
          'tasks.tasks.dueDate',
          'device.devices.lastSeen',
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

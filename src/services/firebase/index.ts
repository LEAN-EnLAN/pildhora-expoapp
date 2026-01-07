import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  connectAuthEmulator,
  Auth 
} from 'firebase/auth';
import * as FirebaseAuthPkg from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore 
} from 'firebase/firestore';
import { 
  getFunctions, 
  connectFunctionsEmulator, 
  Functions 
} from 'firebase/functions';
import { 
  getDatabase, 
  connectDatabaseEmulator, 
  Database 
} from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { diagnoseNetworkIssues } from '../../utils/networkCheck';

// Firebase configuration
const firebaseConfig: any = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Default RTDB (app data) and devices RTDB (hardware commands) use different URLs.
const envDefaultDbUrl = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
const envDeviceDbUrl = process.env.EXPO_PUBLIC_FIREBASE_DEVICE_DATABASE_URL;

// If someone pointed EXPO_PUBLIC_FIREBASE_DATABASE_URL to the devices DB by mistake, prefer the project default.
const inferredDefaultDbUrl = firebaseConfig.projectId
  ? `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
  : undefined;

const defaultDbUrl =
  envDefaultDbUrl && envDefaultDbUrl.includes('default-rtdb')
    ? envDefaultDbUrl
    : inferredDefaultDbUrl;

const deviceDbUrl =
  envDeviceDbUrl ||
  (envDefaultDbUrl && envDefaultDbUrl.includes('devices-') ? envDefaultDbUrl : null) ||
  'https://devices-m1947.firebaseio.com';

if (envDefaultDbUrl && envDefaultDbUrl.includes('devices-')) {
  console.warn(
    '[Firebase] EXPO_PUBLIC_FIREBASE_DATABASE_URL points to a devices DB; using project default for app data instead.'
  );
}

// Initialize App
let app: FirebaseApp;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] App initialized successfully');
  } catch (error) {
    console.error('[Firebase] Error initializing app:', error);
    throw error;
  }
} else {
  app = getApp();
}

// Initialize Auth
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: (FirebaseAuthPkg as any)?.getReactNativePersistence
        ? (FirebaseAuthPkg as any).getReactNativePersistence(AsyncStorage)
        : undefined,
    });
  } catch (e: any) {
    // If auth is already initialized, get it
    if (e.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      console.error('[Firebase] Error initializing auth:', e);
      throw e;
    }
  }
}

// Initialize Services
const db = getFirestore(app);
// Explicitly pass URLs so default app data doesn't accidentally use the devices DB.
const rdb = getDatabase(app, defaultDbUrl);
const deviceRdb = getDatabase(app, deviceDbUrl);
const functions = getFunctions(app);

// Connect to Emulators if configured
const connectToEmulators = () => {
  if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    try {
      const authUrl = process.env.EXPO_PUBLIC_AUTH_EMULATOR_URL || 'http://localhost:9099';
      connectAuthEmulator(auth, authUrl, { disableWarnings: true });
      
      const firestoreHost = process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost';
      const firestorePort = Number(process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080);
      connectFirestoreEmulator(db, firestoreHost, firestorePort);
      
      const dbHost = process.env.EXPO_PUBLIC_DATABASE_EMULATOR_HOST || 'localhost';
      const dbPort = Number(process.env.EXPO_PUBLIC_DATABASE_EMULATOR_PORT || 9000);
      connectDatabaseEmulator(rdb, dbHost, dbPort);
      connectDatabaseEmulator(deviceRdb, dbHost, dbPort);
      
      const functionsHost = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST || 'localhost';
      const functionsPort = Number(process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_PORT || 5001);
      connectFunctionsEmulator(functions, functionsHost, functionsPort);
      
      console.log('[Firebase] Connected to local emulators');
    } catch (e) {
      console.warn('[Firebase] Failed to connect to local emulators', e);
    }
  }
};

connectToEmulators();

// Export instances directly
export { app, auth, db, rdb, deviceRdb, functions };

// Export async getters for backward compatibility
// These are now just wrappers that return the already initialized instances
export const getAuthInstance = async () => auth;
export const getDbInstance = async () => db;
export const getRdbInstance = async () => rdb;
export const getDeviceRdbInstance = async () => deviceRdb;
export const getFunctionsInstance = async () => functions;

// Helper to check initialization status (always true now)
export const isFirebaseReady = () => true;
export const waitForFirebaseInitialization = async () => {};

// Export initialization error getter (always null now)
export const getInitializationError = () => null;

// Re-export diagnostic tool but don't run it automatically
export { diagnoseNetworkIssues };

// Optional reinitialize stub for callers expecting it
export const reinitializeFirebase = async () => {};

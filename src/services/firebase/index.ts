import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { diagnoseNetworkIssues } from '../../utils/networkCheck';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration using individual environment variables
// Nota: Las variables deben comenzar con "EXPO_PUBLIC_" para estar disponibles en tiempo de ejecución.
const firebaseConfig: any = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Optionally include the RTDB databaseURL to avoid implicit defaults that might point to a different instance
const envDatabaseURL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
if (envDatabaseURL) {
  firebaseConfig.databaseURL = envDatabaseURL;
} else if (firebaseConfig.projectId) {
  // Fallback to default RTDB URL convention: https://<projectId>-default-rtdb.firebaseio.com
  firebaseConfig.databaseURL = `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;
}

// Validate required Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error(
    '[Firebase] Missing required Firebase configuration. ' +
    'Please check your .env file and ensure all EXPO_PUBLIC_FIREBASE_* variables are set.'
  );
}

// Initialize Firebase with error handling
let app;
try {
  // First, check network connectivity to Firebase services
  const enableDiagnostics = process.env.EXPO_PUBLIC_ENABLE_NETWORK_DIAGNOSTICS === 'true';
  if (enableDiagnostics) {
    console.log('[Firebase] Checking network connectivity to Firebase services...');
    diagnoseNetworkIssues().then((issues) => {
      if (issues.length > 0) {
        console.warn('[Firebase] Network issues detected:', issues);
      }
    });
  }

  app = initializeApp(firebaseConfig);
  console.log('[Firebase] Successfully initialized Firebase app');
  console.log('[Firebase] Project diagnostics:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL,
    storageBucket: firebaseConfig.storageBucket,
  });
} catch (error: any) {
  console.error('[Firebase] Failed to initialize Firebase:', error);
  
  // Check for common network/DNS issues
  if (error.message.includes('fetch') || error.message.includes('network')) {
    const enableDiagnostics = process.env.EXPO_PUBLIC_ENABLE_NETWORK_DIAGNOSTICS === 'true';
    if (enableDiagnostics) {
      diagnoseNetworkIssues().then((issues) => {
        console.error('[Firebase] Detailed network diagnosis:', issues);
      });
    }
    
    throw new Error(
      '[Firebase] Network error detected. This might be due to DNS resolution issues. ' +
      'Try changing your DNS servers to 8.8.8.8 and 8.8.4.4 (Google DNS) or 1.1.1.1 (Cloudflare DNS).'
    );
  }
  
  throw error;
}

// Initialize Firebase Auth
const authInstance = getAuth(app);
// Ensure web persistence across reloads/tabs
if (Platform.OS === 'web') {
  try {
    setPersistence(authInstance, browserLocalPersistence);
  } catch (e) {
    console.warn('[Firebase] Failed to set web auth persistence', e);
  }
}
export const auth = authInstance;
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const rdb = getDatabase(app);

// Optional: connect to emulators if enabled via env var
// EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, process.env.EXPO_PUBLIC_AUTH_EMULATOR_URL || 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost', Number(process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080));
    connectDatabaseEmulator(rdb, process.env.EXPO_PUBLIC_DATABASE_EMULATOR_HOST || 'localhost', Number(process.env.EXPO_PUBLIC_DATABASE_EMULATOR_PORT || 9000));
    connectFunctionsEmulator(functions, process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST || 'localhost', Number(process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_PORT || 5001));
    console.log('[Firebase] Connected to local emulators');
  } catch (e) {
    console.warn('[Firebase] Failed to connect to local emulators', e);
  }
}

export default app;

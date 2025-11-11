import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator, Database } from 'firebase/database';
import { diagnoseNetworkIssues } from '../../utils/networkCheck';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase initialization state management
let isFirebaseInitialized = false;
let initializationError: Error | null = null;
let initializationPromise: Promise<void> | null = null;
let resolveInitialization: (() => void) | null = null;
let rejectInitialization: ((error: Error) => void) | null = null;

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

// Initialize Firebase with error handling and promise-based initialization
let app: FirebaseApp | null = null;

// Create initialization promise
initializationPromise = new Promise<void>((resolve, reject) => {
  resolveInitialization = resolve;
  rejectInitialization = reject;
});

const initializeFirebaseApp = async (): Promise<void> => {
  if (isFirebaseInitialized) {
    return;
  }

  if (initializationError) {
    throw initializationError;
  }

  try {
    // First, check network connectivity to Firebase services
    const enableDiagnostics = process.env.EXPO_PUBLIC_ENABLE_NETWORK_DIAGNOSTICS === 'true';
    if (enableDiagnostics) {
      console.log('[Firebase] Checking network connectivity to Firebase services...');
      const issues = await diagnoseNetworkIssues();
      if (issues.length > 0) {
        console.warn('[Firebase] Network issues detected:', issues);
      }
    }

    app = initializeApp(firebaseConfig);
    console.log('[Firebase] Successfully initialized Firebase app');
    console.log('[Firebase] Project diagnostics:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      databaseURL: firebaseConfig.databaseURL,
      storageBucket: firebaseConfig.storageBucket,
    });

    isFirebaseInitialized = true;
    initializationError = null;
    
    if (resolveInitialization) {
      resolveInitialization();
    }
  } catch (error: any) {
    console.error('[Firebase] Failed to initialize Firebase:', error);
    initializationError = error;

    // Check for common network/DNS issues
    if (error.message.includes('fetch') || error.message.includes('network')) {
      const enableDiagnostics = process.env.EXPO_PUBLIC_ENABLE_NETWORK_DIAGNOSTICS === 'true';
      if (enableDiagnostics) {
        const issues = await diagnoseNetworkIssues();
        console.error('[Firebase] Detailed network diagnosis:', issues);
      }

      const networkError = new Error(
        '[Firebase] Network error detected. This might be due to DNS resolution issues. ' +
        'Try changing your DNS servers to 8.8.8.8 and 8.8.4.4 (Google DNS) or 1.1.1.1 (Cloudflare DNS).'
      );
      
      if (rejectInitialization) {
        rejectInitialization(networkError);
      }
      throw networkError;
    }

    if (rejectInitialization) {
      rejectInitialization(error);
    }
    throw error;
  }
};

// Start initialization immediately
initializeFirebaseApp().catch(error => {
  console.error('[Firebase] Initialization failed:', error);
});

import { getReactNativePersistence } from 'firebase/auth';

// Initialize Firebase Auth only after Firebase app is ready
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let functionsInstance: Functions | null = null;
let rdbInstance: Database | null = null;

const initializeFirebaseServices = async () => {
  await waitForFirebaseInitialization();
  
  if (!authInstance) {
    authInstance = getAuth(app!, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  
  if (!dbInstance) {
    dbInstance = getFirestore(app!);
  }
  
  if (!functionsInstance) {
    functionsInstance = getFunctions(app!);
  }
  
  if (!rdbInstance) {
    rdbInstance = getDatabase(app!);
  }
};

// Export getters that ensure initialization
export const getAuthInstance = async () => {
  await initializeFirebaseServices();
  return authInstance;
};

export const getDbInstance = async () => {
  await initializeFirebaseServices();
  return dbInstance;
};

export const getFunctionsInstance = async () => {
  await initializeFirebaseServices();
  return functionsInstance;
};

export const getRdbInstance = async () => {
  await initializeFirebaseServices();
  return rdbInstance;
};

// For backward compatibility, export the instances directly
// Note: These should only be used after ensuring Firebase is initialized
export const auth = authInstance;
export const db = dbInstance;
export const functions = functionsInstance;
export const rdb = rdbInstance;

// Connect to emulators if enabled via env var
// EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
const connectToEmulators = async () => {
  if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS !== 'true') {
    return;
  }

  try {
    await initializeFirebaseServices();
    
    if (authInstance) {
      connectAuthEmulator(authInstance, process.env.EXPO_PUBLIC_AUTH_EMULATOR_URL || 'http://localhost:9099', { disableWarnings: true });
    }
    if (dbInstance) {
      connectFirestoreEmulator(dbInstance, process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost', Number(process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080));
    }
    if (rdbInstance) {
      connectDatabaseEmulator(rdbInstance, process.env.EXPO_PUBLIC_DATABASE_EMULATOR_HOST || 'localhost', Number(process.env.EXPO_PUBLIC_DATABASE_EMULATOR_PORT || 9000));
    }
    if (functionsInstance) {
      connectFunctionsEmulator(functionsInstance, process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST || 'localhost', Number(process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_PORT || 5001));
    }
    console.log('[Firebase] Connected to local emulators');
  } catch (e) {
    console.warn('[Firebase] Failed to connect to local emulators', e);
  }
};

// Connect to emulators after initialization
initializationPromise?.then(() => {
  connectToEmulators();
}).catch(error => {
  console.error('[Firebase] Failed to connect to emulators due to initialization error:', error);
});

// Export initialization utilities
export const waitForFirebaseInitialization = async (): Promise<void> => {
  if (isFirebaseInitialized) {
    return;
  }
  
  if (initializationError) {
    throw initializationError;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  throw new Error('[Firebase] Initialization promise not available');
};

export const isFirebaseReady = (): boolean => isFirebaseInitialized;

export const getInitializationError = (): Error | null => initializationError;

export const reinitializeFirebase = async (): Promise<void> => {
  isFirebaseInitialized = false;
  initializationError = null;
  initializationPromise = new Promise<void>((resolve, reject) => {
    resolveInitialization = resolve;
    rejectInitialization = reject;
  });
  
  await initializeFirebaseApp();
  await initializeFirebaseServices();
  await connectToEmulators();
};

export default app;

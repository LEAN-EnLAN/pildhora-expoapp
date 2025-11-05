import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { diagnoseNetworkIssues } from '../../utils/networkCheck';

// Firebase configuration using individual environment variables
// Nota: Las variables deben comenzar con "EXPO_PUBLIC_" para estar disponibles en tiempo de ejecución.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

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
  console.log('[Firebase] Checking network connectivity to Firebase services...');
  diagnoseNetworkIssues().then((issues) => {
    if (issues.length > 0) {
      console.warn('[Firebase] Network issues detected:', issues);
    }
  });

  app = initializeApp(firebaseConfig);
  console.log('[Firebase] Successfully initialized Firebase app');
} catch (error: any) {
  console.error('[Firebase] Failed to initialize Firebase:', error);
  
  // Check for common network/DNS issues
  if (error.message.includes('fetch') || error.message.includes('network')) {
    diagnoseNetworkIssues().then((issues) => {
      console.error('[Firebase] Detailed network diagnosis:', issues);
    });
    
    throw new Error(
      '[Firebase] Network error detected. This might be due to DNS resolution issues. ' +
      'Try changing your DNS servers to 8.8.8.8 and 8.8.4.4 (Google DNS) or 1.1.1.1 (Cloudflare DNS).'
    );
  }
  
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
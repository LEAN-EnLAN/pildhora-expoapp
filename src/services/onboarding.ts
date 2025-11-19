import { getAuthInstance, getDbInstance } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';
import { convertTimestamps } from '../utils/firestoreUtils';

/**
 * OnboardingService Error Class
 * 
 * Custom error class for onboarding-related errors with user-friendly messages
 * and retry capability flags.
 */
export class OnboardingError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}

/**
 * Validation helpers
 */
function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new OnboardingError(
      'Invalid user ID: must be a non-empty string',
      'INVALID_USER_ID',
      'Error de autenticación. Por favor, cierra sesión e inicia sesión nuevamente.',
      false
    );
  }
}

function validateOnboardingStep(step: string): void {
  const validSteps = ['device_provisioning', 'device_connection', 'complete'];
  if (!validSteps.includes(step)) {
    throw new OnboardingError(
      `Invalid onboarding step: ${step}`,
      'INVALID_ONBOARDING_STEP',
      'Paso de configuración no válido.',
      false
    );
  }
}

/**
 * Validate authentication and return current user ID
 */
async function validateAuthentication(): Promise<string> {
  const auth = await getAuthInstance();

  if (!auth) {
    throw new OnboardingError(
      'Firebase Auth not initialized',
      'AUTH_NOT_INITIALIZED',
      'Error de autenticación. Por favor, reinicia la aplicación.',
      true
    );
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new OnboardingError(
      'User not authenticated',
      'NOT_AUTHENTICATED',
      'No has iniciado sesión. Por favor, inicia sesión e intenta nuevamente.',
      false
    );
  }

  return currentUser.uid;
}

/**
 * Retry logic for transient failures
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on non-retryable errors
      if (error instanceof OnboardingError && !error.retryable) {
        throw error;
      }

      // Check if error is retryable based on Firebase error codes
      const retryableCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted'];
      const isRetryable = retryableCodes.includes(error.code);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      console.log(`[OnboardingService] Retry attempt ${attempt}/${maxRetries} after error:`, error.code);

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

/**
 * Convert Firebase errors to user-friendly messages
 */
function handleFirebaseError(error: any, operation: string): never {
  console.error(`[OnboardingService] ${operation} failed:`, {
    code: error.code,
    message: error.message
  });

  if (error instanceof OnboardingError) {
    throw error;
  }

  switch (error.code) {
    case 'permission-denied':
      throw new OnboardingError(
        `Permission denied for ${operation}`,
        'PERMISSION_DENIED',
        'No tienes permiso para realizar esta operación. Verifica tu conexión y permisos.',
        false
      );

    case 'unavailable':
      throw new OnboardingError(
        `Service unavailable for ${operation}`,
        'SERVICE_UNAVAILABLE',
        'El servicio no está disponible. Por favor, verifica tu conexión a internet e intenta nuevamente.',
        true
      );

    case 'deadline-exceeded':
    case 'timeout':
      throw new OnboardingError(
        `Operation timeout for ${operation}`,
        'TIMEOUT',
        'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.',
        true
      );

    case 'not-found':
      throw new OnboardingError(
        `User not found for ${operation}`,
        'USER_NOT_FOUND',
        'Usuario no encontrado. Por favor, cierra sesión e inicia sesión nuevamente.',
        false
      );

    default:
      throw new OnboardingError(
        `Unknown error during ${operation}: ${error.message}`,
        'UNKNOWN_ERROR',
        'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        true
      );
  }
}

/**
 * OnboardingService Interface
 * 
 * Provides methods for managing user onboarding state and progress.
 * Handles both patient device provisioning and caregiver device connection flows.
 */
export interface OnboardingService {
  needsOnboarding(userId: string, role: 'patient' | 'caregiver'): Promise<boolean>;
  getOnboardingStep(userId: string): Promise<string | null>;
  updateOnboardingStep(userId: string, step: string): Promise<void>;
  completeOnboarding(userId: string): Promise<void>;
}

/**
 * Check if user needs onboarding
 * 
 * Determines if a user needs to complete onboarding based on their role
 * and current onboarding status.
 * 
 * Requirements: 9.1, 9.2, 9.3
 * 
 * @param userId - The user ID to check
 * @param role - The user's role (patient or caregiver)
 * @returns Promise<boolean> - true if user needs onboarding, false otherwise
 * 
 * @example
 * ```typescript
 * const needsSetup = await needsOnboarding('user-123', 'patient');
 * if (needsSetup) {
 *   router.push('/patient/device-provisioning');
 * }
 * ```
 */
export async function needsOnboarding(
  userId: string,
  role: 'patient' | 'caregiver'
): Promise<boolean> {
  console.log('[OnboardingService] needsOnboarding called', { userId, role });

  try {
    // Validate inputs
    validateUserId(userId);

    // Get Firebase instances
    const db = await getDbInstance();

    if (!db) {
      throw new OnboardingError(
        'Firebase Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.',
        true
      );
    }

    // Get user document with retry logic
    const userDoc = await retryOperation(async () => {
      const docRef = doc(db, 'users', userId);
      return await getDoc(docRef);
    });

    if (!userDoc.exists()) {
      console.log('[OnboardingService] User document not found');
      throw new OnboardingError(
        'User document not found',
        'USER_NOT_FOUND',
        'Usuario no encontrado. Por favor, cierra sesión e inicia sesión nuevamente.',
        false
      );
    }

    const userData = convertTimestamps(userDoc.data()) as User;

    // Check if onboarding is already complete
    if (userData.onboardingComplete) {
      console.log('[OnboardingService] Onboarding already complete');
      return false;
    }

    // For patients: check if they have a device
    if (role === 'patient') {
      const needsSetup = !userData.deviceId;
      console.log('[OnboardingService] Patient needs onboarding:', needsSetup);
      return needsSetup;
    }

    // For caregivers: check if they have any device links
    if (role === 'caregiver') {
      // Check if caregiver has any linked patients/devices
      const hasLinks = userData.patients && userData.patients.length > 0;
      const needsSetup = !hasLinks;
      console.log('[OnboardingService] Caregiver needs onboarding:', needsSetup);
      return needsSetup;
    }

    console.log('[OnboardingService] Unknown role, assuming onboarding needed');
    return true;

  } catch (error: any) {
    handleFirebaseError(error, 'needsOnboarding');
  }
}

/**
 * Get current onboarding step
 * 
 * Retrieves the current onboarding step for a user.
 * Returns null if onboarding is complete or not started.
 * 
 * Requirements: 9.2, 9.3
 * 
 * @param userId - The user ID to check
 * @returns Promise<string | null> - Current onboarding step or null
 * 
 * @example
 * ```typescript
 * const step = await getOnboardingStep('user-123');
 * if (step === 'device_provisioning') {
 *   // Resume device provisioning wizard
 * }
 * ```
 */
export async function getOnboardingStep(userId: string): Promise<string | null> {
  console.log('[OnboardingService] getOnboardingStep called', { userId });

  try {
    // Validate inputs
    validateUserId(userId);

    // Get Firebase instances
    const db = await getDbInstance();

    if (!db) {
      throw new OnboardingError(
        'Firebase Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.',
        true
      );
    }

    // Get user document with retry logic
    const userDoc = await retryOperation(async () => {
      const docRef = doc(db, 'users', userId);
      return await getDoc(docRef);
    });

    if (!userDoc.exists()) {
      console.log('[OnboardingService] User document not found');
      throw new OnboardingError(
        'User document not found',
        'USER_NOT_FOUND',
        'Usuario no encontrado. Por favor, cierra sesión e inicia sesión nuevamente.',
        false
      );
    }

    const userData = convertTimestamps(userDoc.data()) as User;

    // Return null if onboarding is complete
    if (userData.onboardingComplete) {
      console.log('[OnboardingService] Onboarding complete, no step');
      return null;
    }

    const step = userData.onboardingStep || null;
    console.log('[OnboardingService] Current onboarding step:', step);
    return step;

  } catch (error: any) {
    handleFirebaseError(error, 'getOnboardingStep');
  }
}

/**
 * Update onboarding step
 * 
 * Updates the current onboarding step for a user to track wizard progress.
 * 
 * Requirements: 9.2, 9.3
 * 
 * @param userId - The user ID to update
 * @param step - The new onboarding step
 * @returns Promise<void>
 * 
 * @example
 * ```typescript
 * await updateOnboardingStep('user-123', 'device_provisioning');
 * ```
 */
export async function updateOnboardingStep(
  userId: string,
  step: string
): Promise<void> {
  console.log('[OnboardingService] updateOnboardingStep called', { userId, step });

  try {
    // Validate inputs
    validateUserId(userId);
    validateOnboardingStep(step);

    // Validate authentication
    const currentUserId = await validateAuthentication();

    // Ensure user is updating their own onboarding
    if (currentUserId !== userId) {
      throw new OnboardingError(
        'User ID mismatch',
        'USER_ID_MISMATCH',
        'No puedes actualizar el estado de configuración de otro usuario.',
        false
      );
    }

    // Get Firebase instances
    const db = await getDbInstance();

    if (!db) {
      throw new OnboardingError(
        'Firebase Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.',
        true
      );
    }

    // Update user document with retry logic
    await retryOperation(async () => {
      const docRef = doc(db, 'users', userId);
      console.log('[OnboardingService] Updating onboarding step in Firestore');
      await setDoc(
        docRef,
        {
          onboardingStep: step,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      console.log('[OnboardingService] Successfully updated onboarding step');
    });

  } catch (error: any) {
    handleFirebaseError(error, 'updateOnboardingStep');
  }
}

/**
 * Complete onboarding
 * 
 * Marks the user's onboarding as complete and sets the onboarding step to 'complete'.
 * 
 * Requirements: 9.4, 9.5
 * 
 * @param userId - The user ID to update
 * @returns Promise<void>
 * 
 * @example
 * ```typescript
 * await completeOnboarding('user-123');
 * router.push('/patient/home');
 * ```
 */
export async function completeOnboarding(userId: string): Promise<void> {
  console.log('[OnboardingService] completeOnboarding called', { userId });

  try {
    // Validate inputs
    validateUserId(userId);

    // Validate authentication
    const currentUserId = await validateAuthentication();

    // Ensure user is completing their own onboarding
    if (currentUserId !== userId) {
      throw new OnboardingError(
        'User ID mismatch',
        'USER_ID_MISMATCH',
        'No puedes completar la configuración de otro usuario.',
        false
      );
    }

    // Get Firebase instances
    const db = await getDbInstance();

    if (!db) {
      throw new OnboardingError(
        'Firebase Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.',
        true
      );
    }

    // Update user document with retry logic
    await retryOperation(async () => {
      const docRef = doc(db, 'users', userId);
      console.log('[OnboardingService] Marking onboarding as complete in Firestore');
      await setDoc(
        docRef,
        {
          onboardingComplete: true,
          onboardingStep: 'complete',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      console.log('[OnboardingService] Successfully completed onboarding');
    });

  } catch (error: any) {
    handleFirebaseError(error, 'completeOnboarding');
  }
}

/**
 * Default export of onboarding service methods
 */
export default {
  needsOnboarding,
  getOnboardingStep,
  updateOnboardingStep,
  completeOnboarding,
  skipOnboarding
};

/**
 * Skip onboarding (Autonomous Mode)
 * 
 * Marks the user's onboarding as complete but notes that they skipped device setup.
 * Sets autonomousMode flag to true.
 * 
 * @param userId - The user ID to update
 * @returns Promise<void>
 */
export async function skipOnboarding(userId: string): Promise<void> {
  console.log('[OnboardingService] skipOnboarding called', { userId });

  try {
    // Validate inputs
    validateUserId(userId);

    // Validate authentication
    const currentUserId = await validateAuthentication();

    // Ensure user is updating their own onboarding
    if (currentUserId !== userId) {
      throw new OnboardingError(
        'User ID mismatch',
        'USER_ID_MISMATCH',
        'No puedes modificar la configuración de otro usuario.',
        false
      );
    }

    // Get Firebase instances
    const db = await getDbInstance();

    if (!db) {
      throw new OnboardingError(
        'Firebase Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.',
        true
      );
    }

    // Update user document with retry logic
    await retryOperation(async () => {
      const docRef = doc(db, 'users', userId);
      console.log('[OnboardingService] Marking onboarding as skipped (autonomous mode) in Firestore');
      await setDoc(
        docRef,
        {
          onboardingComplete: true,
          onboardingStep: 'skipped',
          autonomousMode: true,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      console.log('[OnboardingService] Successfully skipped onboarding');
    });

  } catch (error: any) {
    handleFirebaseError(error, 'skipOnboarding');
  }
}

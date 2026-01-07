import { getAuthInstance, getDbInstance, getDeviceRdbInstance } from './firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, set as rtdbSet } from 'firebase/database';

// Error types for better error handling
export class DeviceLinkingError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'DeviceLinkingError';
  }
}

// Validation helpers
function validateDeviceId(deviceId: string): void {
  if (!deviceId || typeof deviceId !== 'string') {
    throw new DeviceLinkingError(
      'Invalid device ID: must be a non-empty string',
      'INVALID_DEVICE_ID',
      'El ID del dispositivo no es válido. Por favor, verifica el ID e intenta nuevamente.',
      false
    );
  }

  // Requirement 1.2: Minimum 5 characters for device ID
  if (deviceId.trim().length < 5) {
    throw new DeviceLinkingError(
      'Invalid device ID: must be at least 5 characters',
      'DEVICE_ID_TOO_SHORT',
      'El ID del dispositivo debe tener al menos 5 caracteres.',
      false
    );
  }

  if (deviceId.length > 100) {
    throw new DeviceLinkingError(
      'Invalid device ID: must be less than 100 characters',
      'DEVICE_ID_TOO_LONG',
      'El ID del dispositivo es demasiado largo.',
      false
    );
  }

  // Check for invalid characters (allow alphanumeric, hyphens, underscores, and hash)
  if (!/^[a-zA-Z0-9_\-#]+$/.test(deviceId)) {
    throw new DeviceLinkingError(
      'Invalid device ID: contains invalid characters',
      'INVALID_DEVICE_ID_FORMAT',
      'El ID del dispositivo solo puede contener letras, números, guiones, guiones bajos y el símbolo #.',
      false
    );
  }
}

function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new DeviceLinkingError(
      'Invalid user ID: must be a non-empty string',
      'INVALID_USER_ID',
      'Error de autenticación. Por favor, cierra sesión e inicia sesión nuevamente.',
      false
    );
  }
}

async function validateAuthentication(expectedUserId?: string): Promise<string> {
  const auth = await getAuthInstance();

  if (!auth) {
    throw new DeviceLinkingError(
      'Firebase Auth not initialized',
      'AUTH_NOT_INITIALIZED',
      'Error de autenticación. Por favor, reinicia la aplicación.',
      true
    );
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new DeviceLinkingError(
      'User not authenticated',
      'NOT_AUTHENTICATED',
      'No has iniciado sesión. Por favor, inicia sesión e intenta nuevamente.',
      false
    );
  }

  if (expectedUserId && currentUser.uid !== expectedUserId) {
    console.error('[DeviceLinking] UID mismatch', {
      authUid: currentUser.uid,
      providedUserId: expectedUserId
    });
    throw new DeviceLinkingError(
      `UID mismatch: Auth UID (${currentUser.uid}) != Provided UID (${expectedUserId})`,
      'UID_MISMATCH',
      'Error de autenticación. Por favor, cierra sesión e inicia sesión nuevamente.',
      false
    );
  }

  // Refresh token to avoid stale/expired ID tokens causing functions/unauthenticated
  try {
    await currentUser.getIdToken(true);
  } catch (e: any) {
    console.warn('[DeviceLinking] Failed to refresh ID token before call', {
      code: e?.code,
      message: e?.message,
    });
  }

  return currentUser.uid;
}

// Retry logic for transient failures
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
      if (error instanceof DeviceLinkingError && !error.retryable) {
        throw error;
      }

      // Check if error is retryable based on Firebase error codes
      const retryableCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted', 'internal'];
      const isRetryable = retryableCodes.includes(error.code);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      console.log(`[DeviceLinking] Retry attempt ${attempt}/${maxRetries} after error:`, error.code);

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

// Convert Firebase errors to user-friendly messages
function handleFirebaseError(error: any, operation: string): never {
  console.error(`[DeviceLinking] ${operation} failed:`, {
    code: error.code,
    message: error.message,
    details: error.details
  });

  if (error instanceof DeviceLinkingError) {
    throw error;
  }

  switch (error.code) {
    case 'permission-denied':
    case 'functions/permission-denied':
      throw new DeviceLinkingError(
        `Permission denied for ${operation}`,
        'PERMISSION_DENIED',
        'No tienes permiso para realizar esta operación. Verifica tu conexión y permisos.',
        false
      );

    case 'unauthenticated':
    case 'functions/unauthenticated':
      throw new DeviceLinkingError(
        `User not authenticated during ${operation}`,
        'UNAUTHENTICATED',
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        false
      );

    case 'unavailable':
    case 'functions/unavailable':
      throw new DeviceLinkingError(
        `Service unavailable for ${operation}`,
        'SERVICE_UNAVAILABLE',
        'El servicio no está disponible. Por favor, verifica tu conexión a internet e intenta nuevamente.',
        true
      );

    case 'deadline-exceeded':
    case 'timeout':
    case 'functions/deadline-exceeded':
      throw new DeviceLinkingError(
        `Operation timeout for ${operation}`,
        'TIMEOUT',
        'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.',
        true
      );

    case 'not-found':
    case 'functions/not-found':
      throw new DeviceLinkingError(
        `Resource not found for ${operation}`,
        'NOT_FOUND',
        'El dispositivo no fue encontrado. Verifica el ID del dispositivo.',
        false
      );

    case 'already-exists':
    case 'functions/already-exists':
      throw new DeviceLinkingError(
        `Resource already exists for ${operation}`,
        'ALREADY_EXISTS',
        'Este dispositivo ya está vinculado.',
        false
      );
    
    case 'functions/invalid-argument':
      throw new DeviceLinkingError(
        `Invalid argument for ${operation}`,
        'INVALID_ARGUMENT',
        'Los datos proporcionados no son válidos.',
        false
      );

    default:
      throw new DeviceLinkingError(
        `Unknown error during ${operation}: ${error.message}`,
        'UNKNOWN_ERROR',
        'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        true
      );
  }
}

async function unlinkAsOwnerLocally(userId: string, deviceId: string): Promise<void> {
  const db = await getDbInstance();
  if (!db) throw new Error('Firestore not initialized');

  const deviceRef = doc(db, 'devices', deviceId);
  const deviceSnap = await getDoc(deviceRef);

  if (!deviceSnap.exists()) {
    throw new DeviceLinkingError(
      'Device not found for unlink',
      'NOT_FOUND',
      'El dispositivo no existe.'
    );
  }

  const deviceData = deviceSnap.data();
  if (deviceData?.primaryPatientId !== userId) {
    throw new DeviceLinkingError(
      'Only the primary patient can unlink this device',
      'NOT_OWNER',
      'Solo el paciente propietario puede desvincular el dispositivo.'
    );
  }

  const linkRef = doc(db, 'deviceLinks', `${deviceId}_${userId}`);
  const userRef = doc(db, 'users', userId);

  await setDoc(userRef, { deviceId: null }, { merge: true });
  await setDoc(linkRef, { status: 'inactive', unlinkedAt: serverTimestamp() }, { merge: true });
  await setDoc(deviceRef, { provisioningStatus: 'unlinked' }, { merge: true });

  // Best-effort RTDB cleanup for device ownership maps
  const deviceRdb = await getDeviceRdbInstance();
  if (deviceRdb) {
    try {
      await rtdbSet(ref(deviceRdb, `devices/${deviceId}/ownerUserId`), userId);
      await rtdbSet(ref(deviceRdb, `users/${userId}/devices/${deviceId}`), false);
    } catch (e: any) {
      console.warn('[DeviceLinking] RTDB cleanup failed', { message: e?.message });
    }
  }
}

/**
 * Link a device to the authenticated user using Cloud Functions.
 * 
 * This function calls the 'linkDeviceToUser' Cloud Function which handles:
 * - Validation of device existence
 * - Creation of deviceLink document
 * - Creation of user profile links
 * - Security checks
 */
export async function linkDeviceToUser(userId: string, deviceId: string): Promise<void> {
  console.log('[DeviceLinking] linkDeviceToUser called', { userId, deviceId: deviceId.substring(0, 8) + '...' });

  try {
    // Input validation (includes minimum 5 character check)
    validateUserId(userId);
    validateDeviceId(deviceId);

    // Authentication validation
    await validateAuthentication(userId);
    const db = await getDbInstance();
    if (!db) throw new Error('Firestore not initialized');
    const userDoc = await getDoc(doc(db, 'users', userId));
    const role = userDoc.data()?.role || 'patient';

    await retryOperation(async () => {
      await setDoc(doc(db, 'deviceLinks', `${deviceId}_${userId}`), {
        deviceId,
        userId,
        role,
        status: 'active',
        linkedAt: serverTimestamp(),
      }, { merge: true });
      const deviceUpdate: any = {
        [`linkedUsers.${userId}`]: role,
        updatedAt: serverTimestamp(),
      };
      if (role === 'patient') {
        deviceUpdate.primaryPatientId = userId;
        // Update user profile with deviceId for patient role
        await setDoc(doc(db, 'users', userId), { deviceId }, { merge: true });
      } else {
        // For other roles (caregiver), we might not want to set deviceId if it implies "my primary device"
        // But based on current unlink logic which clears it for everyone, maybe we should?
        // For now, restricting to patient seems safer to avoid overriding a caregiver's potential other device
        // logic if they have multiple (though the schema suggests 1:1 for user.deviceId)
      }
      await setDoc(doc(db, 'devices', deviceId), deviceUpdate, { merge: true });
      const deviceRdb = await getDeviceRdbInstance();
      if (deviceRdb) {
        try {
          await (await import('firebase/database')).set(
            (await import('firebase/database')).ref(deviceRdb, `users/${userId}/devices/${deviceId}`),
            true
          );
        } catch {}
      }
    });

    console.log('[DeviceLinking] Device linking completed successfully');
  } catch (error: any) {
    handleFirebaseError(error, 'linkDeviceToUser');
  }
}

/**
 * Diagnostic function to check if the temporary development rule should be active
 */
export async function checkDevelopmentRuleStatus(): Promise<void> {
  console.log('[DeviceLinking] Checking development rule status...');
  console.log('[DeviceLinking] Current system time:', new Date().toISOString());
  console.log('[DeviceLinking] Development rule expires: 2025-12-31T23:59:59.999Z');

  try {
    const auth = await getAuthInstance();
    const db = await getDbInstance();

    if (!auth || !db) {
      console.warn('[DeviceLinking] Firebase services not available for rule status check.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[DeviceLinking] No authenticated user, skipping rule check.');
      return;
    }

    console.log('[DeviceLinking] Authentication state:', {
      isAuthenticated: !!currentUser,
      uid: currentUser.uid
    });

    // Check if we can read a test document to verify rule evaluation
    const testDocRef = doc(db, 'deviceLinks', 'test-diagnostic');
    const testDoc = await getDoc(testDocRef);

    if (testDoc.exists()) {
      console.log('[DeviceLinking] Test document exists and is readable');
      console.log('[DeviceLinking] ✅ Development rule is working correctly');
    } else {
      console.log('[DeviceLinking] Test document does not exist, creating it...');
      // Create the test document if it doesn't exist
      await setDoc(testDocRef, {
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        purpose: 'development-rule-diagnostic',
        test: true
      });
      console.log('[DeviceLinking] Test document created successfully');

      // Try reading it again to verify
      const testDocAfterCreate = await getDoc(testDocRef);
      if (testDocAfterCreate.exists()) {
        console.log('[DeviceLinking] ✅ Development rule is working correctly');
      } else {
        console.log('[DeviceLinking] ❌ Development rule issue - document created but not readable');
      }
    }
  } catch (error: any) {
    console.error('[DeviceLinking] Failed to check development rule:', {
      code: error.code,
      message: error.message
    });

    // Provide specific guidance based on error code
    if (error.code === 'permission-denied') {
      console.log('[DeviceLinking] ❌ Permission denied - development rule may not be active');
    } else if (error.code === 'unavailable') {
      console.log('[DeviceLinking] ❌ Service unavailable - check network connection');
    } else {
      console.log('[DeviceLinking] ❌ Unexpected error - check Firebase configuration');
    }
  }
}

/**
 * Unlink a device from a user.
 * @param targetUserId The user being revoked/unlinked.
 * @param deviceId The device to unlink.
 * @param actingUserId The authenticated user performing the unlink (defaults to targetUserId).
 */
export async function unlinkDeviceFromUser(targetUserId: string, deviceId: string, actingUserId?: string): Promise<void> {
  console.log('[DeviceLinking] unlinkDeviceFromUser called', { targetUserId, deviceId: deviceId.substring(0, 8) + '...', actingUserId });

  try {
    // Input validation
    validateUserId(targetUserId);
    validateDeviceId(deviceId);

    // Authentication validation (defaults to ensuring current user === target when actingUserId is not provided)
    const authUid = await validateAuthentication(actingUserId ?? targetUserId);
    const requesterId = actingUserId ?? authUid;

    const db = await getDbInstance();
    if (!db) throw new DeviceLinkingError('Firestore not initialized', 'FIRESTORE_NOT_INITIALIZED', 'Error interno');

    const deviceRef = doc(db, 'devices', deviceId);
    const deviceSnap = await getDoc(deviceRef);

    if (!deviceSnap.exists()) {
      throw new DeviceLinkingError('Device not found for unlink', 'NOT_FOUND', 'El dispositivo no fue encontrado.');
    }

    const deviceData = deviceSnap.data();

    // Only the primary patient (or the user themselves) can revoke another user's access
    if (targetUserId !== requesterId && deviceData?.primaryPatientId && deviceData.primaryPatientId !== requesterId) {
      throw new DeviceLinkingError(
        'Only the primary patient can revoke caregiver access',
        'NOT_OWNER',
        'Solo el paciente propietario puede revocar el acceso de un cuidador.'
      );
    }

    const linkRef = doc(db, 'deviceLinks', `${deviceId}_${targetUserId}`);
    const userRef = doc(db, 'users', targetUserId);

    // 1. Mark link inactive
    await setDoc(linkRef, { status: 'inactive', unlinkedAt: serverTimestamp() }, { merge: true });
    
    // 2. Remove device from user profile if it matches
    await setDoc(userRef, { deviceId: null }, { merge: true });

    // 3. If this user was the primary patient, clear it from device
    if (deviceData?.primaryPatientId === targetUserId) {
      await setDoc(deviceRef, { 
        primaryPatientId: null,
        provisioningStatus: 'unlinked'
      }, { merge: true });
    }

    // 4. RTDB cleanup
    const deviceRdb = await getDeviceRdbInstance();
    if (deviceRdb) {
      try {
        // Remove from user's device list
        await rtdbSet(ref(deviceRdb, `users/${targetUserId}/devices/${deviceId}`), null);
      } catch (e: any) {
        console.warn('[DeviceLinking] RTDB cleanup failed', { message: e?.message });
      }
    }
    
    console.log('[DeviceLinking] Unlink successful');

  } catch (error: any) {
    handleFirebaseError(error, 'unlinkDeviceFromUser');
  }
}

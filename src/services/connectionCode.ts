import { getAuthInstance, getDbInstance } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import type { ConnectionCodeData } from '../types';

/**
 * ConnectionCodeService Error Class
 * 
 * Custom error class for connection code-related errors with user-friendly messages
 * and retry capability flags.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export class ConnectionCodeError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ConnectionCodeError';
  }
}

/**
 * ConnectionCodeData interface
 * 
 * Represents the data structure for a connection code.
 * Used for validating codes and displaying patient information to caregivers.
 */

/**
 * Validate authentication and return current user ID
 */
async function validateAuthentication(): Promise<string> {
  const auth = await getAuthInstance();
  
  if (!auth) {
    throw new ConnectionCodeError(
      'Firebase Auth not initialized',
      'AUTH_NOT_INITIALIZED',
      'Error de autenticación. Por favor, reinicia la aplicación.',
      true
    );
  }

  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new ConnectionCodeError(
      'User not authenticated',
      'NOT_AUTHENTICATED',
      'No has iniciado sesión. Por favor, inicia sesión e intenta nuevamente.',
      false
    );
  }

  try {
    await currentUser.getIdToken(true);
  } catch (e: any) {
    console.warn('[ConnectionCodeService] Failed to refresh ID token', { code: e?.code, message: e?.message });
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
      if (error instanceof ConnectionCodeError && !error.retryable) {
        throw error;
      }
      
      // Check if error is retryable based on Firebase error codes
      const retryableCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted', 'internal'];
      const isRetryable = retryableCodes.includes(error.code);
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`[ConnectionCodeService] Retry attempt ${attempt}/${maxRetries} after error:`, error.code);
      
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
  console.error(`[ConnectionCodeService] ${operation} failed:`, {
    code: error.code,
    message: error.message,
    details: error.details
  });

  if (error instanceof ConnectionCodeError) {
    throw error;
  }

  // Map Cloud Function error codes
  switch (error.code) {
    case 'permission-denied':
      throw new ConnectionCodeError(
        `Permission denied for ${operation}`,
        'PERMISSION_DENIED',
        'No tienes permiso para realizar esta operación.',
        false
      );
    
    case 'functions/permission-denied':
      throw new ConnectionCodeError(
        `Permission denied for ${operation}`,
        'PERMISSION_DENIED',
        'No tienes permiso para realizar esta operación.',
        false
      );

    case 'unavailable':
    case 'functions/unavailable':
      throw new ConnectionCodeError(
        `Service unavailable for ${operation}`,
        'SERVICE_UNAVAILABLE',
        'El servicio no está disponible. Por favor, verifica tu conexión a internet e intenta nuevamente.',
        true
      );
    
    case 'deadline-exceeded':
    case 'timeout':
      throw new ConnectionCodeError(
        `Operation timeout for ${operation}`,
        'TIMEOUT',
        'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.',
        true
      );

    case 'unauthenticated':
    case 'functions/unauthenticated':
      throw new ConnectionCodeError(
        `User not authenticated during ${operation}`,
        'UNAUTHENTICATED',
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        false
      );
    
    case 'not-found':
    case 'functions/not-found':
      throw new ConnectionCodeError(
        `Resource not found for ${operation}`,
        'NOT_FOUND',
        'Código no encontrado o no válido.',
        false
      );
    
    case 'failed-precondition':
    case 'functions/failed-precondition':
      // Often used for "Code expired" or "Code already used"
      throw new ConnectionCodeError(
        `Failed precondition for ${operation}: ${error.message}`,
        'INVALID_STATE',
        error.message === 'Code expired' ? 'Este código ha expirado.' : 
        error.message === 'Code already used' ? 'Este código ya ha sido utilizado.' :
        'No se puede completar la operación en el estado actual.',
        false
      );

    case 'already-exists':
      throw new ConnectionCodeError(
        `Resource already exists for ${operation}`,
        'ALREADY_EXISTS',
        'El código ya existe.',
        false
      );
    
    default:
      throw new ConnectionCodeError(
        `Unknown error during ${operation}: ${error.message}`,
        'UNKNOWN_ERROR',
        'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        true
      );
  }
}

/**
 * Generate a new connection code for a patient's device
 * 
 * Calls Cloud Function: generateConnectionCode
 */
export async function generateCode(
  patientId: string, // Kept for interface compatibility, but Cloud Function infers from auth
  deviceId: string,
  expiresInHours: number = 24
): Promise<string> {
  console.log('[ConnectionCodeService] generateCode called', { deviceId, expiresInHours });
  
  try {
    await validateAuthentication();
    
    if (!deviceId) throw new ConnectionCodeError('Invalid Device ID', 'INVALID_ARGUMENT', 'ID de dispositivo inválido');
    const db = await getDbInstance();
    if (!db) throw new ConnectionCodeError('Firestore not initialized', 'FIRESTORE_ERROR', 'Error interno');

    const auth = await getAuthInstance();
    const uid = auth!.currentUser!.uid;

    const userDoc = await getDoc(doc(db, 'users', uid));
    const patientName = userDoc.exists() ? (userDoc.data()?.name as string) || '' : '';

    const ttlMs = Math.max(1, expiresInHours) * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();

    let code = '';
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 10; i++) {
      code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      const existing = await getDoc(doc(db, 'connectionCodes', code));
      if (!existing.exists()) break;
      if (i === 9) throw new ConnectionCodeError('Could not generate unique code', 'ALREADY_EXISTS', 'No se pudo generar un código único');
    }

    await retryOperation(async () => {
      await setDoc(
        doc(db, 'connectionCodes', code),
        {
          code,
          deviceId,
          patientId: uid,
          patientName,
          active: true,
          used: false,
          createdAt: serverTimestamp(),
          expiresAt,
        },
        { merge: true }
      );
    });

    return code;
    
  } catch (error: any) {
    handleFirebaseError(error, 'generateCode');
  }
}

/**
 * Validate and retrieve connection code data
 * 
 * Calls Cloud Function: validateConnectionCode
 */
export async function validateCode(code: string): Promise<ConnectionCodeData | null> {
  console.log('[ConnectionCodeService] validateCode called', { code });
  
  try {
    await validateAuthentication();
    
    if (!code) throw new ConnectionCodeError('Invalid Code', 'INVALID_ARGUMENT', 'Código inválido');
    const db = await getDbInstance();
    if (!db) throw new ConnectionCodeError('Firestore not initialized', 'FIRESTORE_ERROR', 'Error interno');

    return await retryOperation(async () => {
      const snap = await getDoc(doc(db, 'connectionCodes', code));
      if (!snap.exists()) {
        throw new ConnectionCodeError('Code not found', 'NOT_FOUND', 'Código no encontrado');
      }
      const data = snap.data() as any;
      const now = Date.now();
      let expMs: number | null = null;
      if (typeof data.expiresAt === 'string') expMs = Date.parse(data.expiresAt);
      else if (data.expiresAt?.toDate) expMs = data.expiresAt.toDate().getTime();
      if (expMs && now > expMs) {
        throw new ConnectionCodeError('Code expired', 'INVALID_STATE', 'Este código ha expirado');
      }
      if (data.used === true || data.active === false) {
        throw new ConnectionCodeError('Code already used or revoked', 'INVALID_STATE', 'Este código ya no está disponible');
      }
      const expiresAt: Date = expMs ? new Date(expMs) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result: ConnectionCodeData = {
        code: data.code,
        deviceId: data.deviceId,
        patientId: data.patientId,
        patientName: data.patientName || '',
        expiresAt,
        used: false,
      };
      return result;
    });
    
  } catch (error: any) {
    handleFirebaseError(error, 'validateCode');
  }
}

/**
 * Mark code as used and create device link
 * 
 * Calls Cloud Function: useConnectionCode
 */
export async function useCode(code: string, caregiverId: string): Promise<void> {
  console.log('[ConnectionCodeService] useCode called', { code });
  
  try {
    await validateAuthentication();
    
    if (!code) throw new ConnectionCodeError('Invalid Code', 'INVALID_ARGUMENT', 'Código inválido');
    const db = await getDbInstance();
    if (!db) throw new ConnectionCodeError('Firestore not initialized', 'FIRESTORE_ERROR', 'Error interno');

    await retryOperation(async () => {
      const snap = await getDoc(doc(db, 'connectionCodes', code));
      if (!snap.exists()) throw new ConnectionCodeError('Code not found', 'NOT_FOUND', 'Código no encontrado');
      const data = snap.data() as any;
      const now = Date.now();
      const exp = typeof data.expiresAt === 'string' ? Date.parse(data.expiresAt) : null;
      if (exp && now > exp) throw new ConnectionCodeError('Code expired', 'INVALID_STATE', 'Este código ha expirado');
      if (data.used === true || data.active === false) throw new ConnectionCodeError('Code already used or revoked', 'INVALID_STATE', 'Este código ya no está disponible');

      await updateDoc(doc(db, 'connectionCodes', code), {
        used: true,
        usedBy: caregiverId,
        usedAt: serverTimestamp(),
        active: false,
      });

      const linkId = `${data.deviceId}_${caregiverId}`;
      await setDoc(doc(db, 'deviceLinks', linkId), {
        deviceId: data.deviceId,
        userId: caregiverId,
        role: 'caregiver',
        status: 'active',
        linkedAt: serverTimestamp(),
      }, { merge: true });
    });
    
    console.log('[ConnectionCodeService] Code usage completed successfully');
    
  } catch (error: any) {
    handleFirebaseError(error, 'useCode');
  }
}

/**
 * Revoke/invalidate a connection code
 * 
 * Calls Cloud Function: revokeConnectionCode
 */
export async function revokeCode(code: string): Promise<void> {
  console.log('[ConnectionCodeService] revokeCode called', { code });
  
  try {
    await validateAuthentication();
    
    if (!code) throw new ConnectionCodeError('Invalid Code', 'INVALID_ARGUMENT', 'Código inválido');
    const db = await getDbInstance();
    if (!db) throw new ConnectionCodeError('Firestore not initialized', 'FIRESTORE_ERROR', 'Error interno');

    await retryOperation(async () => {
      const snap = await getDoc(doc(db, 'connectionCodes', code));
      if (!snap.exists()) throw new ConnectionCodeError('Code not found', 'NOT_FOUND', 'Código no encontrado');
      await updateDoc(doc(db, 'connectionCodes', code), {
        active: false,
        revokedAt: serverTimestamp(),
      });
    });
    
    console.log('[ConnectionCodeService] Code revocation completed successfully');
    
  } catch (error: any) {
    handleFirebaseError(error, 'revokeCode');
  }
}

/**
 * Get active connection codes for a patient
 * 
 * Calls Cloud Function: getActiveConnectionCodes
 */
export async function getActiveCodes(patientId: string): Promise<ConnectionCodeData[]> {
  console.log('[ConnectionCodeService] getActiveCodes called', { patientId });
  
  try {
    await validateAuthentication();
    
    const db = await getDbInstance();
    if (!db) throw new ConnectionCodeError('Firestore not initialized', 'FIRESTORE_ERROR', 'Error interno');

    return await retryOperation(async () => {
      const q = query(collection(db, 'connectionCodes'), where('patientId', '==', patientId), where('active', '==', true));
      const snap = await getDocs(q);
      const list: ConnectionCodeData[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        let expDate: Date | null = null;
        if (typeof data.expiresAt === 'string') expDate = new Date(Date.parse(data.expiresAt));
        else if (data.expiresAt?.toDate) expDate = data.expiresAt.toDate();
        const item: ConnectionCodeData = {
          code: data.code,
          deviceId: data.deviceId,
          patientId: data.patientId,
          patientName: data.patientName || '',
          expiresAt: expDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: !!data.used,
          usedBy: data.usedBy,
          usedAt: data.usedAt?.toDate ? data.usedAt.toDate() : data.usedAt ? new Date(Date.parse(data.usedAt)) : undefined,
        };
        list.push(item);
      });
      return list;
    });
    
  } catch (error: any) {
    if (error?.code === 'unauthenticated' || error?.code === 'functions/unauthenticated') {
      console.warn('[ConnectionCodeService] getActiveCodes unauthenticated, returning empty list');
      return [];
    }
    handleFirebaseError(error, 'getActiveCodes');
  }
}

/**
 * ConnectionCodeService interface
 */
export interface ConnectionCodeService {
  generateCode(patientId: string, deviceId: string, expiresInHours?: number): Promise<string>;
  validateCode(code: string): Promise<ConnectionCodeData | null>;
  useCode(code: string, caregiverId: string): Promise<void>;
  revokeCode(code: string): Promise<void>;
  getActiveCodes(patientId: string): Promise<ConnectionCodeData[]>;
}

export default {
  generateCode,
  validateCode,
  useCode,
  revokeCode,
  getActiveCodes
};

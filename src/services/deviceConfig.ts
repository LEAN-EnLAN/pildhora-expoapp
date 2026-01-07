import { getAuthInstance, getDbInstance, getDeviceRdbInstance } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, set, get, update } from 'firebase/database';
import { DeviceConfig } from '../types';

// Error types for device configuration
export class DeviceConfigError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'DeviceConfigError';
  }
}

// Validation helpers
function validateDeviceId(deviceId: string): void {
  if (!deviceId || typeof deviceId !== 'string') {
    throw new DeviceConfigError(
      'Invalid device ID: must be a non-empty string',
      'INVALID_DEVICE_ID',
      'El ID del dispositivo no es vÃ¡lido.',
      false
    );
  }

  if (deviceId.trim().length < 5) {
    throw new DeviceConfigError(
      'Invalid device ID: must be at least 5 characters',
      'DEVICE_ID_TOO_SHORT',
      'El ID del dispositivo debe tener al menos 5 caracteres.',
      false
    );
  }

  if (deviceId.length > 100) {
    throw new DeviceConfigError(
      'Invalid device ID: must be less than 100 characters',
      'DEVICE_ID_TOO_LONG',
      'El ID del dispositivo es demasiado largo.',
      false
    );
  }

  // Check for invalid characters (allow alphanumeric, hyphens, underscores, and hash)
  if (!/^[a-zA-Z0-9_\-#]+$/.test(deviceId)) {
    throw new DeviceConfigError(
      'Invalid device ID: contains invalid characters',
      'INVALID_DEVICE_ID_FORMAT',
      'El ID del dispositivo solo puede contener letras, nÃºmeros, guiones, guiones bajos y el sÃ­mbolo #.',
      false
    );
  }
}

function validateAlarmMode(alarmMode: string): void {
  const validModes = ['off', 'sound', 'led', 'both'];
  if (!validModes.includes(alarmMode)) {
    throw new DeviceConfigError(
      `Invalid alarm mode: ${alarmMode}`,
      'INVALID_ALARM_MODE',
      'El modo de alarma seleccionado no es vÃ¡lido.',
      false
    );
  }
}

function validateLedIntensity(intensity: number): void {
  if (typeof intensity !== 'number' || isNaN(intensity)) {
    throw new DeviceConfigError(
      'Invalid LED intensity: must be a number',
      'INVALID_LED_INTENSITY',
      'La intensidad del LED debe ser un nÃºmero.',
      false
    );
  }

  if (intensity < 0 || intensity > 1023) {
    throw new DeviceConfigError(
      `Invalid LED intensity: ${intensity} (must be 0-1023)`,
      'LED_INTENSITY_OUT_OF_RANGE',
      'La intensidad del LED debe estar entre 0 y 1023.',
      false
    );
  }
}

function validateLedColor(color: { r: number; g: number; b: number }): void {
  if (!color || typeof color !== 'object') {
    throw new DeviceConfigError(
      'Invalid LED color: must be an object with r, g, b properties',
      'INVALID_LED_COLOR',
      'El color del LED no es vÃ¡lido.',
      false
    );
  }

  const { r, g, b } = color;

  if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
    throw new DeviceConfigError(
      'Invalid LED color: r, g, b must be numbers',
      'INVALID_LED_COLOR_VALUES',
      'Los valores de color deben ser nÃºmeros.',
      false
    );
  }

  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new DeviceConfigError(
      `Invalid LED color values: r=${r}, g=${g}, b=${b} (must be 0-255)`,
      'LED_COLOR_OUT_OF_RANGE',
      'Los valores de color deben estar entre 0 y 255.',
      false
    );
  }
}

function validateDeviceConfig(config: Partial<DeviceConfig>): void {
  if (!config || typeof config !== 'object') {
    throw new DeviceConfigError(
      'Invalid device config: must be an object',
      'INVALID_CONFIG',
      'La configuraciÃ³n del dispositivo no es vÃ¡lida.',
      false
    );
  }

  if (config.deviceId) {
    validateDeviceId(config.deviceId);
  }

  if (config.alarmMode) {
    validateAlarmMode(config.alarmMode);
  }

  if (config.ledIntensity !== undefined) {
    validateLedIntensity(config.ledIntensity);
  }

  if (config.ledColor) {
    validateLedColor(config.ledColor);
  }
}

async function validateAuthentication(): Promise<string> {
  const auth = await getAuthInstance();
  
  if (!auth) {
    throw new DeviceConfigError(
      'Firebase Auth not initialized',
      'AUTH_NOT_INITIALIZED',
      'Error de autenticaciÃ³n. Por favor, reinicia la aplicaciÃ³n.',
      true
    );
  }

  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new DeviceConfigError(
      'User not authenticated',
      'NOT_AUTHENTICATED',
      'No has iniciado sesiÃ³n. Por favor, inicia sesiÃ³n e intenta nuevamente.',
      false
    );
  }

  try {
    await currentUser.getIdToken(true);
  } catch (e: any) {
    console.warn('[DeviceConfig] Failed to refresh ID token', { code: e?.code, message: e?.message });
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
      if (error instanceof DeviceConfigError && !error.retryable) {
        throw error;
      }
      
      // Check if error is retryable based on Firebase error codes
      const retryableCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted'];
      const isRetryable = retryableCodes.includes(error.code);
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`[DeviceConfig] Retry attempt ${attempt}/${maxRetries} after error:`, error.code);
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
}

// Convert Firebase errors to user-friendly messages
function handleFirebaseError(error: any, operation: string): never {
  console.error(`[DeviceConfig] ${operation} failed:`, {
    code: error.code,
    message: error.message
  });

  if (error instanceof DeviceConfigError) {
    throw error;
  }

  switch (error.code) {
    case 'permission-denied':
      throw new DeviceConfigError(
        `Permission denied for ${operation}`,
        'PERMISSION_DENIED',
        'No tienes permiso para modificar la configuraciÃ³n del dispositivo.',
        false
      );

    case 'unauthenticated':
      throw new DeviceConfigError(
        `User not authenticated during ${operation}`,
        'UNAUTHENTICATED',
        'Tu sesiÃ³n ha expirado. Por favor, inicia sesiÃ³n nuevamente.',
        false
      );
    
    case 'unavailable':
      throw new DeviceConfigError(
        `Service unavailable for ${operation}`,
        'SERVICE_UNAVAILABLE',
        'El servicio no estÃ¡ disponible. Por favor, verifica tu conexiÃ³n a internet.',
        true
      );
    
    case 'deadline-exceeded':
    case 'timeout':
      throw new DeviceConfigError(
        `Operation timeout for ${operation}`,
        'TIMEOUT',
        'La operaciÃ³n tardÃ³ demasiado tiempo. Por favor, intenta nuevamente.',
        true
      );

    case 'functions/unauthenticated':
      throw new DeviceConfigError(
        `User not authenticated during ${operation}`,
        'UNAUTHENTICATED',
        'Tu sesiÃ³n ha expirado. Por favor, inicia sesiÃ³n nuevamente.',
        false
      );
    
    case 'not-found':
      throw new DeviceConfigError(
        `Device not found for ${operation}`,
        'NOT_FOUND',
        'El dispositivo no fue encontrado.',
        false
      );
    
    default:
      throw new DeviceConfigError(
        `Unknown error during ${operation}: ${error.message}`,
        'UNKNOWN_ERROR',
        'OcurriÃ³ un error inesperado. Por favor, intenta nuevamente.',
        true
      );
  }
}

/**
 * Save device configuration via Cloud Function
 * @param deviceId - The device ID
 * @param config - Partial device configuration to save
 * @returns Promise that resolves when configuration is saved
 */
export async function saveDeviceConfig(
  deviceId: string,
  config: Partial<Omit<DeviceConfig, 'deviceId' | 'lastUpdated'>>
): Promise<void> {
  console.log('[DeviceConfig] saveDeviceConfig called', { deviceId: deviceId.substring(0, 8) + '...' });
  
  try {
    // Validate authentication
    const userId = await validateAuthentication();
    
    // Validate inputs
    validateDeviceId(deviceId);
    validateDeviceConfig({ ...config, deviceId });
    const db = await getDbInstance();
    const rdb = await getDeviceRdbInstance();
    if (!db) throw new DeviceConfigError('Firestore not initialized', 'FIRESTORE_NOT_INITIALIZED', 'Error interno');
    if (!rdb) throw new DeviceConfigError('RTDB not initialized', 'RTDB_NOT_INITIALIZED', 'Error de conexión.');

    await retryOperation(async () => {
      const cfgRef = ref(rdb, `devices/${deviceId}/config`);
      const currentSnap = await get(cfgRef);
      const current = currentSnap.exists() ? (currentSnap.val() as any) : {};
      const payload = { ...current, ...config, updatedAt: Date.now() } as any;
      try {
        await update(cfgRef, payload);
      } catch {
        await set(cfgRef, payload);
      }
    });

    // Mirror desired configuration to Firestore so UI and future saves stay in sync
    const firestorePayload: Record<string, any> = {
      updatedAt: serverTimestamp(),
      'desiredConfig.updated_at': serverTimestamp(),
      'desiredConfig.updated_by': userId,
    };

    if (config.alarmMode !== undefined) {
      firestorePayload['desiredConfig.alarm_mode'] = config.alarmMode;
    }
    if (config.ledIntensity !== undefined) {
      firestorePayload['desiredConfig.led_intensity'] = config.ledIntensity;
    }
    if (config.ledColor) {
      firestorePayload['desiredConfig.led_color_rgb'] = [
        config.ledColor.r,
        config.ledColor.g,
        config.ledColor.b,
      ];
    }

    await setDoc(doc(db, 'devices', deviceId), firestorePayload, { merge: true });
    
  } catch (error: any) {
    handleFirebaseError(error, 'saveDeviceConfig');
  }
}

/**
 * Get device configuration and status via Cloud Function
 * @param deviceId - The device ID
 * @returns Promise that resolves with the device configuration and status
 */
export async function getDeviceConfig(deviceId: string): Promise<any> {
  console.log('[DeviceConfig] getDeviceConfig called', { deviceId: deviceId.substring(0, 8) + '...' });
  
  try {
    // Validate authentication
    await validateAuthentication();
    
    // Validate inputs
    validateDeviceId(deviceId);
    const db = await getDbInstance();
    const rdb = await getDeviceRdbInstance();
    if (!db || !rdb) throw new DeviceConfigError('Firebase not initialized', 'FIREBASE_NOT_INITIALIZED', 'Error interno');

    let firestoreDesired: any = {};
    let firestoreLast: any = {};
    try {
      const snap = await getDoc(doc(db, 'devices', deviceId));
      if (snap.exists()) {
        const data = snap.data() as any;
        firestoreDesired = data?.desiredConfig || {};
        firestoreLast = data?.lastKnownState || {};
      }
    } catch (e: any) {
      console.warn('[DeviceConfig] Firestore read denied or failed, continuing with RTDB only', { code: e?.code, message: e?.message });
    }

    let rdbState: any = {};
    let rdbConfig: any = {};
    try {
      const stateRef = ref(rdb, `devices/${deviceId}/state`);
      const configRef = ref(rdb, `devices/${deviceId}/config`);
      const [stateSnap, configSnap] = await Promise.all([get(stateRef), get(configRef)]);
      rdbState = stateSnap.exists() ? (stateSnap.val() as any) : {};
      rdbConfig = configSnap.exists() ? (configSnap.val() as any) : {};
    } catch (e: any) {
      console.warn('[DeviceConfig] RTDB read denied or failed', { code: e?.code, message: e?.message });
    }

    return {
      firestore: { desiredConfig: firestoreDesired, lastKnownState: firestoreLast },
      rdb: { ...rdbState, config: rdbConfig },
    };
    
  } catch (error: any) {
    handleFirebaseError(error, 'getDeviceConfig');
  }
}

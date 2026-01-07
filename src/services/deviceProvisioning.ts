import { getAuthInstance, getDbInstance, getDeviceRdbInstance } from './firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { linkDeviceToUser } from './deviceLinking';

export class DeviceProvisioningError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'DeviceProvisioningError';
  }
}

export interface DeviceProvisioningData {
  deviceId: string;
  userId: string;
  wifiSSID?: string;
  wifiPassword?: string;
  alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';
  ledIntensity: number;
  ledColor: string;
  volume: number;
}

function validateDeviceId(deviceId: string): void {
  if (!deviceId || typeof deviceId !== 'string') {
    throw new DeviceProvisioningError(
      'Invalid device ID',
      'INVALID_DEVICE_ID',
      'El ID del dispositivo no es válido.',
      false
    );
  }

  if (deviceId.trim().length < 5) {
    throw new DeviceProvisioningError(
      'Device ID too short',
      'DEVICE_ID_TOO_SHORT',
      'El ID del dispositivo debe tener al menos 5 caracteres.',
      false
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
    throw new DeviceProvisioningError(
      'Invalid device ID format',
      'INVALID_DEVICE_ID_FORMAT',
      'El ID del dispositivo solo puede contener letras, números, guiones y guiones bajos.',
      false
    );
  }
}

function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new DeviceProvisioningError(
      'Invalid user ID',
      'INVALID_USER_ID',
      'Error de autenticación.',
      false
    );
  }
}

async function validateAuthentication(userId: string): Promise<void> {
  const auth = await getAuthInstance();
  
  if (!auth || !auth.currentUser) {
    throw new DeviceProvisioningError(
      'Not authenticated',
      'NOT_AUTHENTICATED',
      'No has iniciado sesión.',
      false
    );
  }

  if (auth.currentUser.uid !== userId) {
    throw new DeviceProvisioningError(
      'User ID mismatch',
      'USER_ID_MISMATCH',
      'Error de autenticación.',
      false
    );
  }
}

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
      
      if (error instanceof DeviceProvisioningError && !error.retryable) {
        throw error;
      }
      
      const retryableCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted', 'aborted'];
      const isRetryable = retryableCodes.includes(error.code);
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
}

function handleFirebaseError(error: any, operation: string): never {
  console.error(`[DeviceProvisioning] ${operation} failed:`, error);

  if (error instanceof DeviceProvisioningError) {
    throw error;
  }

  switch (error.code) {
    case 'permission-denied':
      throw new DeviceProvisioningError(
        'Permission denied',
        'PERMISSION_DENIED',
        'No tienes permiso para configurar este dispositivo.',
        false
      );
    
    case 'unavailable':
      throw new DeviceProvisioningError(
        'Service unavailable',
        'SERVICE_UNAVAILABLE',
        'El servicio no está disponible. Verifica tu conexión.',
        true
      );
    
    case 'already-exists':
      throw new DeviceProvisioningError(
        'Device already exists',
        'DEVICE_ALREADY_EXISTS',
        'Este dispositivo ya está configurado.',
        false
      );
    
    default:
      throw new DeviceProvisioningError(
        'Unknown error',
        'UNKNOWN_ERROR',
        'Ocurrió un error inesperado.',
        true
      );
  }
}

export async function checkDeviceExists(deviceId: string): Promise<boolean> {
  try {
    validateDeviceId(deviceId);
    
    const db = await getDbInstance();
    if (!db) {
      throw new DeviceProvisioningError(
        'Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión.',
        true
      );
    }
    
    const deviceDoc = await retryOperation(async () => {
      const docRef = doc(db, 'devices', deviceId);
      return await getDoc(docRef);
    });
    
    return deviceDoc.exists();
    
  } catch (error: any) {
    handleFirebaseError(error, 'checkDeviceExists');
  }
}

export async function provisionDevice(data: DeviceProvisioningData): Promise<void> {
  console.log('[DeviceProvisioning] Starting provisioning');
  
  try {
    validateDeviceId(data.deviceId);
    validateUserId(data.userId);
    await validateAuthentication(data.userId);
    
    const db = await getDbInstance();
    const rdb = await getDeviceRdbInstance();
    
    if (!db || !rdb) {
      throw new DeviceProvisioningError(
        'Firebase not initialized',
        'FIREBASE_NOT_INITIALIZED',
        'Error de conexión.',
        true
      );
    }
    
    const deviceExists = await checkDeviceExists(data.deviceId);
    
    if (deviceExists) {
      const deviceDoc = await retryOperation(async () => {
        return await getDoc(doc(db, 'devices', data.deviceId));
      });
      
      const deviceData = deviceDoc.data();
      
      if (deviceData?.primaryPatientId === data.userId) {
        await updateDeviceConfiguration(data);
        return;
      }
      
      throw new DeviceProvisioningError(
        'Device already claimed',
        'DEVICE_ALREADY_CLAIMED',
        'Este dispositivo ya está vinculado a otro usuario.',
        false
      );
    }
    
    await retryOperation(async () => {
      await setDoc(doc(db, 'devices', data.deviceId), {
        id: data.deviceId,
        primaryPatientId: data.userId,
        provisioningStatus: 'active',
        provisionedAt: serverTimestamp(),
        provisionedBy: data.userId,
        wifiConfigured: !!(data.wifiSSID && data.wifiPassword),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        linkedUsers: {
          [data.userId]: {
            role: 'patient',
            linkedAt: serverTimestamp()
          }
        }
      });
    });
    
    await retryOperation(async () => {
      await setDoc(doc(db, 'deviceConfigs', data.deviceId), {
        deviceId: data.deviceId,
        userId: data.userId,
        alarmMode: data.alarmMode,
        ledIntensity: data.ledIntensity,
        ledColor: data.ledColor,
        volume: data.volume,
        wifiSSID: data.wifiSSID || '',
        wifiConfigured: !!(data.wifiSSID && data.wifiPassword),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await linkDeviceToUser(data.userId, data.deviceId);
    
    await retryOperation(async () => {
      await setDoc(doc(db, 'users', data.userId), {
        deviceId: data.deviceId,
        onboardingComplete: true,
        onboardingStep: 'complete',
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    
    await retryOperation(async () => {
      await set(ref(rdb, `deviceState/${data.deviceId}`), {
        online: false,
        lastSeen: null,
        batteryLevel: 100,
        connectionMode: 'autonomous',
        wifiConfigured: !!(data.wifiSSID && data.wifiPassword),
        updatedAt: Date.now()
      });
    });
    
    console.log('[DeviceProvisioning] Completed successfully');
    
  } catch (error: any) {
    handleFirebaseError(error, 'provisionDevice');
  }
}

async function updateDeviceConfiguration(data: DeviceProvisioningData): Promise<void> {
  const db = await getDbInstance();
  
  if (!db) {
    throw new DeviceProvisioningError(
      'Firestore not initialized',
      'FIRESTORE_NOT_INITIALIZED',
      'Error de conexión.',
      true
    );
  }
  
  await retryOperation(async () => {
    await setDoc(doc(db, 'deviceConfigs', data.deviceId), {
      alarmMode: data.alarmMode,
      ledIntensity: data.ledIntensity,
      ledColor: data.ledColor,
      volume: data.volume,
      wifiSSID: data.wifiSSID || '',
      wifiConfigured: !!(data.wifiSSID && data.wifiPassword),
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
  
  await retryOperation(async () => {
    await setDoc(doc(db, 'devices', data.deviceId), {
      wifiConfigured: !!(data.wifiSSID && data.wifiPassword),
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
}

export async function verifyDeviceOwnership(deviceId: string, userId: string): Promise<boolean> {
  try {
    validateDeviceId(deviceId);
    validateUserId(userId);
    
    const db = await getDbInstance();
    
    if (!db) {
      throw new DeviceProvisioningError(
        'Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión.',
        true
      );
    }
    
    const deviceDoc = await retryOperation(async () => {
      return await getDoc(doc(db, 'devices', deviceId));
    });
    
    if (!deviceDoc.exists()) {
      return false;
    }
    
    return deviceDoc.data()?.primaryPatientId === userId;
    
  } catch (error: any) {
    handleFirebaseError(error, 'verifyDeviceOwnership');
  }
}

export default {
  provisionDevice,
  checkDeviceExists,
  verifyDeviceOwnership
};

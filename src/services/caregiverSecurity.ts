/**
 * Caregiver Security Service
 * 
 * Provides security measures for caregiver dashboard:
 * - User role verification
 * - Device access verification
 * - Encrypted cache management
 * - Secure logout with cache clearing
 */

import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDbInstance } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// Encryption key - In production, this should be stored securely
// Consider using react-native-keychain or similar for production
const ENCRYPTION_KEY = 'PILDHORA_SECURE_KEY_2024';

// Cache keys
const CACHE_KEYS = {
  PATIENT_DATA: 'caregiver_patient_data',
  DEVICE_STATE: 'caregiver_device_state',
  MEDICATION_EVENTS: 'caregiver_medication_events',
  USER_PREFERENCES: 'caregiver_user_preferences',
};

/**
 * User role type
 */
export type UserRole = 'patient' | 'caregiver' | 'admin';

/**
 * User data interface
 */
export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
}

/**
 * Device access result
 */
export interface DeviceAccessResult {
  hasAccess: boolean;
  deviceId?: string;
  patientId?: string;
  linkStatus?: 'active' | 'inactive';
  reason?: string;
}

/**
 * Verify user role before rendering caregiver screens
 * 
 * @returns Promise<UserData | null> User data if caregiver, null otherwise
 */
export async function verifyUserRole(): Promise<UserData | null> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('[Security] No authenticated user');
      return null;
    }

    // Get user document from Firestore
    const db = await getDbInstance();
    const userDoc = await getDoc(doc(db!, 'users', currentUser.uid));

    if (!userDoc.exists()) {
      console.log('[Security] User document not found');
      return null;
    }

    const userData = userDoc.data();
    const role = userData.role as UserRole;

    if (role !== 'caregiver') {
      console.log(`[Security] User role is ${role}, not caregiver`);
      return null;
    }

    return {
      uid: currentUser.uid,
      email: currentUser.email || '',
      role,
      name: userData.name,
    };
  } catch (error) {
    console.error('[Security] Error verifying user role:', error);
    return null;
  }
}

/**
 * Verify device access for a caregiver
 * 
 * Checks if the caregiver has an active device link to access patient data
 * 
 * @param caregiverId - The caregiver's user ID
 * @param deviceId - The device ID to verify access for
 * @returns Promise<DeviceAccessResult> Access verification result
 */
export async function verifyDeviceAccess(
  caregiverId: string,
  deviceId: string
): Promise<DeviceAccessResult> {
  try {
    // Query deviceLinks collection for active link
    const db = await getDbInstance();
    const deviceLinksRef = collection(db!, 'deviceLinks');
    const q = query(
      deviceLinksRef,
      where('userId', '==', caregiverId),
      where('deviceId', '==', deviceId),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        hasAccess: false,
        reason: 'No active device link found',
      };
    }

    const linkData = querySnapshot.docs[0].data();

    // Get device document to find associated patient
    const deviceDoc = await getDoc(doc(db!, 'devices', deviceId));

    if (!deviceDoc.exists()) {
      return {
        hasAccess: false,
        reason: 'Device not found',
      };
    }

    const deviceData = deviceDoc.data();
    const patientId = deviceData.primaryPatientId;

    return {
      hasAccess: true,
      deviceId,
      patientId,
      linkStatus: linkData.status,
    };
  } catch (error) {
    console.error('[Security] Error verifying device access:', error);
    return {
      hasAccess: false,
      reason: 'Error verifying access',
    };
  }
}

/**
 * Verify caregiver has access to a specific patient
 * 
 * @param caregiverId - The caregiver's user ID
 * @param patientId - The patient's user ID
 * @returns Promise<boolean> True if caregiver has access
 */
export async function verifyPatientAccess(
  caregiverId: string,
  patientId: string
): Promise<boolean> {
  try {
    // Get patient document
    const db = await getDbInstance();
    const patientDoc = await getDoc(doc(db!, 'users', patientId));

    if (!patientDoc.exists()) {
      return false;
    }

    const patientData = patientDoc.data();
    const deviceId = patientData.deviceId;

    if (!deviceId) {
      // Patient has no device, no caregiver access
      return false;
    }

    // Verify caregiver has access to the patient's device
    const accessResult = await verifyDeviceAccess(caregiverId, deviceId);
    return accessResult.hasAccess;
  } catch (error) {
    console.error('[Security] Error verifying patient access:', error);
    return false;
  }
}

/**
 * Encrypt sensitive data before caching
 * 
 * @param data - Data to encrypt
 * @returns string Encrypted data
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('[Security] Error encrypting data:', error);
    throw error;
  }
}

/**
 * Decrypt cached data
 * 
 * @param encryptedData - Encrypted data string
 * @returns any Decrypted data
 */
export function decryptData(encryptedData: string): any {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[Security] Error decrypting data:', error);
    return null;
  }
}

/**
 * Cache sensitive data with encryption
 * 
 * @param key - Cache key
 * @param data - Data to cache
 * @returns Promise<void>
 */
export async function cacheSecureData(key: string, data: any): Promise<void> {
  try {
    const encrypted = encryptData(data);
    await AsyncStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('[Security] Error caching secure data:', error);
    throw error;
  }
}

/**
 * Retrieve and decrypt cached data
 * 
 * @param key - Cache key
 * @returns Promise<any | null> Decrypted data or null if not found
 */
export async function getSecureCache(key: string): Promise<any | null> {
  try {
    const encrypted = await AsyncStorage.getItem(key);
    
    if (!encrypted) {
      return null;
    }

    return decryptData(encrypted);
  } catch (error) {
    console.error('[Security] Error retrieving secure cache:', error);
    return null;
  }
}

/**
 * Clear all caregiver cached data
 * 
 * Should be called on logout to ensure sensitive data is removed
 * 
 * @returns Promise<void>
 */
export async function clearCaregiverCache(): Promise<void> {
  try {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('[Security] Caregiver cache cleared successfully');
  } catch (error) {
    console.error('[Security] Error clearing caregiver cache:', error);
    throw error;
  }
}

/**
 * Clear specific cache entry
 * 
 * @param key - Cache key to clear
 * @returns Promise<void>
 */
export async function clearCacheEntry(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[Security] Error clearing cache entry:', error);
    throw error;
  }
}

/**
 * Secure logout - clears cache and signs out
 * 
 * @returns Promise<void>
 */
export async function secureLogout(): Promise<void> {
  try {
    // Clear all cached data
    await clearCaregiverCache();

    // Sign out from Firebase
    const auth = getAuth();
    await auth.signOut();

    console.log('[Security] Secure logout completed');
  } catch (error) {
    console.error('[Security] Error during secure logout:', error);
    throw error;
  }
}

/**
 * Check if user session is valid
 * 
 * @returns Promise<boolean> True if session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return false;
    }

    // Check if token is still valid
    const token = await currentUser.getIdToken(false);
    return !!token;
  } catch (error) {
    console.error('[Security] Error checking session validity:', error);
    return false;
  }
}

/**
 * Refresh user token
 * 
 * @returns Promise<string | null> New token or null if failed
 */
export async function refreshUserToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    // Force token refresh
    const token = await currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('[Security] Error refreshing token:', error);
    return null;
  }
}

/**
 * Validate caregiver access to medication
 * 
 * @param caregiverId - The caregiver's user ID
 * @param medicationId - The medication ID
 * @returns Promise<boolean> True if caregiver has access
 */
export async function validateMedicationAccess(
  caregiverId: string,
  medicationId: string
): Promise<boolean> {
  try {
    const db = await getDbInstance();
    const medicationDoc = await getDoc(doc(db!, 'medications', medicationId));

    if (!medicationDoc.exists()) {
      return false;
    }

    const medicationData = medicationDoc.data();
    
    // Check if caregiver is associated with the medication
    if (medicationData.caregiverId === caregiverId) {
      return true;
    }

    // Check if caregiver has access to the patient
    const patientId = medicationData.patientId;
    return await verifyPatientAccess(caregiverId, patientId);
  } catch (error) {
    console.error('[Security] Error validating medication access:', error);
    return false;
  }
}

/**
 * Get all patients accessible by caregiver
 * 
 * @param caregiverId - The caregiver's user ID
 * @returns Promise<string[]> Array of patient IDs
 */
export async function getAccessiblePatients(caregiverId: string): Promise<string[]> {
  try {
    // Query all active device links for this caregiver
    const db = await getDbInstance();
    const deviceLinksRef = collection(db!, 'deviceLinks');
    const q = query(
      deviceLinksRef,
      where('userId', '==', caregiverId),
      where('role', '==', 'caregiver'),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const patientIds: string[] = [];

    // For each device link, get the associated patient
    for (const linkDoc of querySnapshot.docs) {
      const linkData = linkDoc.data();
      const deviceId = linkData.deviceId;

      const deviceDoc = await getDoc(doc(db!, 'devices', deviceId));
      if (deviceDoc.exists()) {
        const deviceData = deviceDoc.data();
        const patientId = deviceData.primaryPatientId;
        if (patientId && !patientIds.includes(patientId)) {
          patientIds.push(patientId);
        }
      }
    }

    return patientIds;
  } catch (error) {
    console.error('[Security] Error getting accessible patients:', error);
    return [];
  }
}

// Export cache keys for use in other modules
export { CACHE_KEYS };

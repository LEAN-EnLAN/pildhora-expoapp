import { db, auth, rdb } from './firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { ref, set, remove } from 'firebase/database';

/**
 * Link a device to the authenticated user by updating the mapping under users/{uid}/devices.
 * Note: Writing devices/{deviceID}/ownerUserId should be done server-side for security.
 * The Cloud Function will resolve ownership by scanning users/{uid}/devices.
 */
export async function linkDeviceToUser(userId: string, deviceId: string): Promise<void> {
  console.log('[DEBUG] linkDeviceToUser called with:', { userId, deviceId });
  
  if (!userId || !deviceId) throw new Error('linkDeviceToUser requires userId and deviceId');
  
  // Verify authentication state
  const currentUser = auth.currentUser;
  console.log('[DEBUG] Firebase Auth current user:', {
    isAuthenticated: !!currentUser,
    uid: currentUser?.uid,
    email: currentUser?.email,
    providedUserId: userId,
    uidMatches: currentUser?.uid === userId
  });
  
  if (!currentUser) {
    console.error('[DEBUG] No authenticated user in Firebase Auth');
    throw new Error('User not authenticated in Firebase Auth');
  }
  
  if (currentUser.uid !== userId) {
    console.error('[DEBUG] UID mismatch between Redux state and Firebase Auth', {
      authUid: currentUser.uid,
      providedUserId: userId
    });
    throw new Error(`UID mismatch: Auth UID (${currentUser.uid}) != Provided UID (${userId})`);
  }
  
  // Write to RTDB first at /users/{uid}/devices/{deviceID} as expected by Cloud Functions
  const deviceRef = ref(rdb, `users/${userId}/devices/${deviceId}`);
  const deviceData = {
    deviceId,
    linkedAt: serverTimestamp(),
    status: 'active'
  };
  
  console.log('[DEBUG] Attempting to write to RTDB:', { path: `users/${userId}/devices/${deviceId}`, deviceData });
  
  try {
    await set(deviceRef, deviceData);
    console.log('[DEBUG] Successfully wrote device link to RTDB');
    
    // The Cloud Function will handle mirroring this to Firestore
    // We don't need to write directly to Firestore anymore
  } catch (error: any) {
    console.error('[DEBUG] Failed to write device link to RTDB:', {
      error: error.message,
      code: error.code,
      path: `users/${userId}/devices/${deviceId}`,
      deviceData
    });
    throw error;
  }
}

/**
 * Diagnostic function to check if the temporary development rule should be active
 */
export async function checkDevelopmentRuleStatus(): Promise<void> {
  console.log('[DEBUG] Checking development rule status...');
  console.log('[DEBUG] Current system time:', new Date().toISOString());
  console.log('[DEBUG] Development rule expires: 2025-12-31T23:59:59.999Z');
  
  // Check if we can read a test document to verify rule evaluation
  try {
    const testDoc = await getDoc(doc(db, 'deviceLinks', 'test-diagnostic'));
    console.log('[DEBUG] Test document read result:', testDoc.exists());
  } catch (error: any) {
    console.error('[DEBUG] Failed to read test document:', {
      error: error.message,
      code: error.code
    });
  }
}

/**
 * Unlink a device from the user by removing the mapping.
 */
export async function unlinkDeviceFromUser(userId: string, deviceId: string): Promise<void> {
  if (!userId || !deviceId) throw new Error('unlinkDeviceFromUser requires userId and deviceId');
  
  // Verify authentication state
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated in Firebase Auth');
  }
  
  if (currentUser.uid !== userId) {
    throw new Error(`UID mismatch: Auth UID (${currentUser.uid}) != Provided UID (${userId})`);
  }
  
  // Remove the device from RTDB at /users/{uid}/devices/{deviceID}
  const deviceRef = ref(rdb, `users/${userId}/devices/${deviceId}`);
  
  console.log('[DEBUG] Attempting to remove device from RTDB:', { path: `users/${userId}/devices/${deviceId}` });
  
  try {
    await remove(deviceRef);
    console.log('[DEBUG] Successfully removed device link from RTDB');
    
    // The Cloud Function will handle updating the mirrored Firestore document
    // We don't need to write directly to Firestore anymore
  } catch (error: any) {
    console.error('[DEBUG] Failed to remove device link from RTDB:', {
      error: error.message,
      code: error.code,
      path: `users/${userId}/devices/${deviceId}`
    });
    throw error;
  }
}

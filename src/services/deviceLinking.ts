import { db } from './firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

/**
 * Link a device to the authenticated user by updating the mapping under users/{uid}/devices.
 * Note: Writing devices/{deviceID}/ownerUserId should be done server-side for security.
 * The Cloud Function will resolve ownership by scanning users/{uid}/devices.
 */
export async function linkDeviceToUser(userId: string, deviceId: string): Promise<void> {
  if (!userId || !deviceId) throw new Error('linkDeviceToUser requires userId and deviceId');
  // Create or update a Firestore link document. Use deterministic ID `${userId}_${deviceId}`
  const linkId = `${userId}_${deviceId}`;
  await setDoc(doc(db, 'deviceLinks', linkId), {
    userId,
    deviceId,
    status: 'active',
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Unlink a device from the user by removing the mapping.
 */
export async function unlinkDeviceFromUser(userId: string, deviceId: string): Promise<void> {
  if (!userId || !deviceId) throw new Error('unlinkDeviceFromUser requires userId and deviceId');
  const linkId = `${userId}_${deviceId}`;
  // Prefer marking inactive to keep audit history
  await setDoc(doc(db, 'deviceLinks', linkId), {
    userId,
    createdBy: userId,
    status: 'inactive',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

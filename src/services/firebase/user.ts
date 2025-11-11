import {
  collection,
  addDoc,
  Timestamp,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { getDbInstance } from './index';
import { User } from '../../types';

// This is a simplified user type for adding a new user.
// In a real app, you might have a more complex user creation process,
// potentially involving Firebase Authentication.
interface NewUserPayload {
  name: string;
  email: string;
  role: 'patient' | 'caregiver';
  caregiverId: string;
  deviceId: string;
}

/**
 * Adds a new user document to the 'users' collection in Firestore.
 * @param userData - The data for the new user.
 * @returns The ID of the newly created user document.
 */
export const addUser = async (userData: NewUserPayload): Promise<string> => {
  const db = await getDbInstance();
  const docRef = await addDoc(collection(db, 'users'), {
    ...userData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * Finds a patient user by their linked device ID.
 * @param deviceId - The ID of the device to search for.
 * @returns The user document if found, otherwise null.
 */
export const findPatientByDevice = async (deviceId: string): Promise<User | null> => {
  const db = await getDbInstance();
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('role', '==', 'patient'),
    where('deviceId', '==', deviceId),
    limit(1)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
};

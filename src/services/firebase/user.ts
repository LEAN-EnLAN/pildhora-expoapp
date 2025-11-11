import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
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
  caregiverId?: string;
  deviceId?: string;
  patients?: string[];
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
 * Updates a medication for a specific patient.
 * @param medicationId - The ID of the medication to update.
 * @param medicationData - The data to update.
 */
export const updateMedication = async (medicationId: string, medicationData: any): Promise<void> => {
  const db = await getDbInstance();
  const medicationRef = doc(db, 'medications', medicationId);
  await setDoc(medicationRef, medicationData, { merge: true });
};

/**
 * Deletes a medication for a specific patient.
 * @param medicationId - The ID of the medication to delete.
 */
export const deleteMedication = async (medicationId: string): Promise<void> => {
  const db = await getDbInstance();
  const medicationRef = doc(db, 'medications', medicationId);
  await deleteDoc(medicationRef);
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

/**
 * Fetches the device assigned to a specific patient.
 * @param patientId - The ID of the patient.
 * @returns The device if found, otherwise null.
 */
export const getPatientDevice = async (patientId: string): Promise<any | null> => {
  const db = await getDbInstance();
  const patient = await getPatientById(patientId);
  if (!patient || !patient.deviceId) {
    return null;
  }

  const deviceDocRef = doc(db, 'devices', patient.deviceId);
  const deviceDoc = await getDoc(deviceDocRef);

  if (!deviceDoc.exists()) {
    return null;
  }

  return { id: deviceDoc.id, ...deviceDoc.data() };
};

/**
 * Fetches all medications for a specific patient.
 * @param patientId - The ID of the patient.
 * @returns A promise that resolves to an array of medication documents.
 */
export const getMedications = async (patientId: string): Promise<any[]> => {
  const db = await getDbInstance();
  const medicationsRef = collection(db, 'medications');
  const q = query(medicationsRef, where('patientId', '==', patientId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Adds a new medication for a specific patient.
 * @param medicationData - The data for the new medication.
 * @returns The ID of the newly created medication document.
 */
export const addMedication = async (medicationData: any): Promise<string> => {
  const db = await getDbInstance();
  const docRef = await addDoc(collection(db, 'medications'), {
    ...medicationData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * Fetches all patients assigned to a specific caregiver.
 * @param caregiverId - The ID of the caregiver.
 * @returns A promise that resolves to an array of patient user documents.
 */
export const getCaregiverPatients = async (caregiverId: string): Promise<User[]> => {
  const db = await getDbInstance();
  const caregiverDocRef = doc(db, 'users', caregiverId);
  const caregiverDoc = await getDoc(caregiverDocRef);

  if (!caregiverDoc.exists() || caregiverDoc.data().role !== 'caregiver') {
    return [];
  }

  const patientIds = caregiverDoc.data().patients || [];
  if (patientIds.length === 0) {
    return [];
  }

  const patientsQuery = query(collection(db, 'users'), where('__name__', 'in', patientIds));
  const querySnapshot = await getDocs(patientsQuery);

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
};

/**
 * Fetches a single patient's user document by their ID.
 * @param patientId - The ID of the patient to retrieve.
 * @returns The user document if found, otherwise null.
 */
export const getPatientById = async (patientId: string): Promise<User | null> => {
  const db = await getDbInstance();
  const userDocRef = doc(db, 'users', patientId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    return null;
  }

  return { id: userDoc.id, ...userDoc.data() } as User;
};

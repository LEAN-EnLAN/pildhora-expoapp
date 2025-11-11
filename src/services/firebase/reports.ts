import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDbInstance } from './index';
import { Report } from '../../types'; // Assuming Report type exists

// Type for the payload to create a new report in Firestore
type NewReportPayload = Omit<Report, 'id' | 'createdAt'>;

/**
 * Uploads a file to a patient-specific folder in Firebase Storage.
 * @param fileUri - The local URI of the file to upload.
 * @param patientId - The ID of the patient this report belongs to.
 * @param fileName - The name of the file.
 * @returns The public download URL of the uploaded file.
 */
export const uploadReportFile = async (fileUri: string, patientId: string, fileName: string): Promise<string> => {
  const storage = getStorage();
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `reports/${patientId}/${fileName}`);
  const snapshot = await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};

/**
 * Adds a new report's metadata to Firestore.
 * @param reportData - The metadata for the new report.
 * @returns The ID of the newly created report document.
 */
export const addReportMetadata = async (reportData: NewReportPayload): Promise<string> => {
  const db = await getDbInstance();
  const docRef = await addDoc(collection(db, 'reports'), {
    ...reportData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * Creates a query to fetch reports for a specific caregiver.
 * @param caregiverId - The ID of the caregiver.
 * @returns A Firestore query object.
 */
export const getReportsQuery = async (caregiverId: string) => {
  const db = await getDbInstance();
  return query(
    collection(db, 'reports'),
    where('caregiverId', '==', caregiverId),
    orderBy('createdAt', 'desc')
  );
};

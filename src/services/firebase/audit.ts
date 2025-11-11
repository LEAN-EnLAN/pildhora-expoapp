import {
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { getDbInstance } from './index';
import { AuditLog } from '../../types'; // Assuming AuditLog type exists

type NewAuditLogPayload = Omit<AuditLog, 'id' | 'timestamp'>;

/**
 * Creates a query to fetch audit logs for a specific caregiver.
 * @param caregiverId - The ID of the caregiver.
 * @returns A Firestore query object.
 */
export const getAuditLogQuery = async (caregiverId: string) => {
  const db = await getDbInstance();
  return query(
    collection(db, 'auditLogs'),
    where('caregiverId', '==', caregiverId),
    orderBy('timestamp', 'desc')
  );
};

/**
 * Adds a new audit log entry to Firestore.
 * This function will be called from various parts of the application
 * to log significant events.
 * @param logData - The data for the new audit log.
 */
export const addAuditLog = async (logData: NewAuditLogPayload): Promise<void> => {
  const db = await getDbInstance();
  await addDoc(collection(db, 'auditLogs'), {
    ...logData,
    timestamp: Timestamp.now(),
  });
};

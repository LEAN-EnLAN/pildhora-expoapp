import { getDbInstance } from './firebase';
import { doc, deleteDoc, query, collection, where, getDocs } from 'firebase/firestore';

/**
 * Service for managing caregiver-patient relationships
 */

export class CaregiverPatientLinkError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'CaregiverPatientLinkError';
  }
}

/**
 * Unlink a patient from a caregiver
 * This removes the deviceLink that connects the caregiver to the patient's device
 * 
 * @param caregiverId - The caregiver's user ID
 * @param patientId - The patient's user ID
 */
export async function unlinkPatientFromCaregiver(
  caregiverId: string,
  patientId: string
): Promise<void> {
  console.log('[CaregiverPatientLinks] Unlinking patient from caregiver', {
    caregiverId,
    patientId,
  });

  try {
    const db = await getDbInstance();
    if (!db) {
      throw new CaregiverPatientLinkError(
        'Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.'
      );
    }

    // Find the deviceLink that connects this caregiver to this patient
    // The deviceLink has the format: {deviceId}_{userId}
    // We need to find the link where userId = caregiverId and the device belongs to patientId
    
    // First, get the patient's deviceId
    const patientDoc = await getDocs(
      query(collection(db, 'users'), where('__name__', '==', patientId))
    );

    if (patientDoc.empty) {
      throw new CaregiverPatientLinkError(
        'Patient not found',
        'PATIENT_NOT_FOUND',
        'No se encontró el paciente.'
      );
    }

    const patientData = patientDoc.docs[0].data();
    const deviceId = patientData.deviceId;

    if (!deviceId) {
      throw new CaregiverPatientLinkError(
        'Patient has no linked device',
        'NO_DEVICE',
        'El paciente no tiene un dispositivo vinculado.'
      );
    }

    // Now delete the deviceLink document
    const deviceLinkId = `${deviceId}_${caregiverId}`;
    const deviceLinkRef = doc(db, 'deviceLinks', deviceLinkId);

    await deleteDoc(deviceLinkRef);

    console.log('[CaregiverPatientLinks] Successfully unlinked patient from caregiver');
  } catch (error: any) {
    console.error('[CaregiverPatientLinks] Error unlinking patient:', error);

    if (error instanceof CaregiverPatientLinkError) {
      throw error;
    }

    if (error.code === 'permission-denied') {
      throw new CaregiverPatientLinkError(
        'Permission denied',
        'PERMISSION_DENIED',
        'No tienes permiso para desvincular este paciente.'
      );
    }

    throw new CaregiverPatientLinkError(
      'Unknown error',
      'UNKNOWN_ERROR',
      'Ocurrió un error al desvincular el paciente. Por favor, intenta nuevamente.'
    );
  }
}

/**
 * Get all patients linked to a caregiver
 * This is already handled by useLinkedPatients hook, but we provide this
 * as a standalone function for other use cases
 * 
 * @param caregiverId - The caregiver's user ID
 * @returns Array of patient IDs
 */
export async function getCaregiverPatientIds(caregiverId: string): Promise<string[]> {
  console.log('[CaregiverPatientLinks] Getting patient IDs for caregiver', { caregiverId });

  try {
    const db = await getDbInstance();
    if (!db) {
      throw new CaregiverPatientLinkError(
        'Firestore not initialized',
        'FIRESTORE_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.'
      );
    }

    // Query deviceLinks where userId = caregiverId and role = caregiver
    const deviceLinksQuery = query(
      collection(db, 'deviceLinks'),
      where('userId', '==', caregiverId),
      where('role', '==', 'caregiver'),
      where('status', '==', 'active')
    );

    const deviceLinksSnapshot = await getDocs(deviceLinksQuery);

    if (deviceLinksSnapshot.empty) {
      return [];
    }

    // Extract deviceIds
    const deviceIds = deviceLinksSnapshot.docs.map(doc => doc.data().deviceId);

    // For each deviceId, find the patient who owns it
    const patientIds: string[] = [];

    for (const deviceId of deviceIds) {
      const patientsQuery = query(
        collection(db, 'users'),
        where('deviceId', '==', deviceId),
        where('role', '==', 'patient')
      );

      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        patientIds.push(patientsSnapshot.docs[0].id);
      }
    }

    console.log('[CaregiverPatientLinks] Found patient IDs:', patientIds);
    return patientIds;
  } catch (error: any) {
    console.error('[CaregiverPatientLinks] Error getting patient IDs:', error);

    if (error instanceof CaregiverPatientLinkError) {
      throw error;
    }

    throw new CaregiverPatientLinkError(
      'Unknown error',
      'UNKNOWN_ERROR',
      'Ocurrió un error al obtener los pacientes. Por favor, intenta nuevamente.'
    );
  }
}

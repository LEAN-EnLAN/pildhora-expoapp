import { getDbInstance, getAuthInstance } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service for managing patient autonomous mode
 * 
 * When autonomous mode is enabled:
 * - New medication events are not shared with caregivers
 * - Caregivers see "Modo autónomo activado" for current data
 * - Historical data from before autonomous mode remains visible
 */

export class AutonomousModeError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'AutonomousModeError';
  }
}

/**
 * Enable or disable autonomous mode for a patient
 * @param patientId - The patient's user ID
 * @param enabled - Whether to enable or disable autonomous mode
 */
export async function setAutonomousMode(
  patientId: string,
  enabled: boolean
): Promise<void> {
  console.log('[AutonomousMode] Setting autonomous mode:', { patientId, enabled });

  try {
    const auth = await getAuthInstance();
    const db = await getDbInstance();

    if (!auth || !auth.currentUser) {
      throw new AutonomousModeError(
        'User not authenticated',
        'NOT_AUTHENTICATED',
        'No has iniciado sesión. Por favor, inicia sesión e intenta nuevamente.'
      );
    }

    if (auth.currentUser.uid !== patientId) {
      throw new AutonomousModeError(
        'Unauthorized: user can only change their own autonomous mode',
        'UNAUTHORIZED',
        'No tienes permiso para cambiar este ajuste.'
      );
    }

    if (!db) {
      throw new AutonomousModeError(
        'Database not initialized',
        'DB_NOT_INITIALIZED',
        'Error de conexión. Por favor, reinicia la aplicación.'
      );
    }

    // Update user document with autonomous mode setting
    const userRef = doc(db, 'users', patientId);
    await setDoc(
      userRef,
      {
        autonomousMode: enabled,
        autonomousModeChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('[AutonomousMode] Successfully updated autonomous mode');
  } catch (error: any) {
    console.error('[AutonomousMode] Error setting autonomous mode:', error);
    
    if (error instanceof AutonomousModeError) {
      throw error;
    }

    throw new AutonomousModeError(
      `Failed to set autonomous mode: ${error.message}`,
      error.code || 'UNKNOWN_ERROR',
      'Error al cambiar el modo. Por favor, intenta nuevamente.'
    );
  }
}

/**
 * Check if a patient is in autonomous mode
 * @param patientId - The patient's user ID
 * @returns Whether autonomous mode is enabled
 */
export async function isAutonomousModeEnabled(patientId: string): Promise<boolean> {
  try {
    const db = await getDbInstance();

    if (!db) {
      console.warn('[AutonomousMode] Database not initialized, assuming autonomous mode disabled');
      return false;
    }

    const userRef = doc(db, 'users', patientId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn('[AutonomousMode] User document not found:', patientId);
      return false;
    }

    const userData = userDoc.data();
    return userData?.autonomousMode === true;
  } catch (error: any) {
    console.error('[AutonomousMode] Error checking autonomous mode:', error);
    // Default to false on error to avoid blocking functionality
    return false;
  }
}

/**
 * Get the timestamp when autonomous mode was last changed
 * @param patientId - The patient's user ID
 * @returns The timestamp or null if never changed
 */
export async function getAutonomousModeChangedAt(
  patientId: string
): Promise<Date | null> {
  try {
    const db = await getDbInstance();

    if (!db) {
      return null;
    }

    const userRef = doc(db, 'users', patientId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    const timestamp = userData?.autonomousModeChangedAt;

    if (!timestamp) {
      return null;
    }

    // Handle Firestore Timestamp
    if (timestamp.toDate) {
      return timestamp.toDate();
    }

    // Handle Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // Handle ISO string
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }

    return null;
  } catch (error: any) {
    console.error('[AutonomousMode] Error getting autonomous mode timestamp:', error);
    return null;
  }
}

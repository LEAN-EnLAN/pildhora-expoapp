import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDbInstance } from '../services/firebase';

interface UsePatientAutonomousModeResult {
  isAutonomous: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to monitor a patient's autonomous mode status in real-time
 * 
 * @param patientId - The patient's user ID
 * @returns Autonomous mode status, loading state, and error
 */
export function usePatientAutonomousMode(
  patientId: string | undefined
): UsePatientAutonomousModeResult {
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setIsLoading(false);
      setIsAutonomous(false);
      setError(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupListener = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const db = await getDbInstance();
        if (!db) {
          throw new Error('Firebase Firestore not initialized');
        }

        const userRef = doc(db, 'users', patientId);

        unsubscribe = onSnapshot(
          userRef,
          (snapshot) => {
            if (!mounted) return;

            if (snapshot.exists()) {
              const userData = snapshot.data();
              setIsAutonomous(userData?.autonomousMode === true);
            } else {
              setIsAutonomous(false);
            }

            setIsLoading(false);
            setError(null);
          },
          (err) => {
            if (!mounted) return;

            console.error('[usePatientAutonomousMode] Firestore listener error:', err);
            setError(err as Error);
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;

        console.error('[usePatientAutonomousMode] Setup error:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [patientId]);

  return {
    isAutonomous,
    isLoading,
    error,
  };
}

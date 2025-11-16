/**
 * useCaregiverSecurity Hook
 * 
 * React hook for caregiver security features:
 * - Role verification
 * - Device access verification
 * - Secure logout
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  verifyUserRole,
  verifyDeviceAccess,
  verifyPatientAccess,
  secureLogout,
  isSessionValid,
  getAccessiblePatients,
  UserData,
  DeviceAccessResult,
} from '../services/caregiverSecurity';

export interface UseCaregiverSecurityResult {
  user: UserData | null;
  isLoading: boolean;
  isAuthorized: boolean;
  error: string | null;
  verifyAccess: (deviceId: string) => Promise<DeviceAccessResult>;
  verifyPatient: (patientId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  accessiblePatients: string[];
}

/**
 * Hook for caregiver security features
 * 
 * Automatically verifies user role and manages authentication state
 * 
 * @param requireAuth - Whether to require authentication (default: true)
 * @returns UseCaregiverSecurityResult
 */
export function useCaregiverSecurity(requireAuth: boolean = true): UseCaregiverSecurityResult {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessiblePatients, setAccessiblePatients] = useState<string[]>([]);

  /**
   * Verify user role and session
   */
  const verifyAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if session is valid
      const sessionValid = await isSessionValid();
      if (!sessionValid) {
        setIsAuthorized(false);
        setUser(null);
        if (requireAuth) {
          router.replace('/auth/login');
        }
        return;
      }

      // Verify user role
      const userData = await verifyUserRole();
      
      if (!userData) {
        setIsAuthorized(false);
        setUser(null);
        setError('User is not authorized as a caregiver');
        if (requireAuth) {
          router.replace('/auth/login');
        }
        return;
      }

      setUser(userData);
      setIsAuthorized(true);

      // Get accessible patients
      const patients = await getAccessiblePatients(userData.uid);
      setAccessiblePatients(patients);
    } catch (err) {
      console.error('[useCaregiverSecurity] Error verifying auth:', err);
      setError('Failed to verify authentication');
      setIsAuthorized(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, router]);

  /**
   * Verify device access
   */
  const verifyAccess = useCallback(
    async (deviceId: string): Promise<DeviceAccessResult> => {
      if (!user) {
        return {
          hasAccess: false,
          reason: 'User not authenticated',
        };
      }

      return await verifyDeviceAccess(user.uid, deviceId);
    },
    [user]
  );

  /**
   * Verify patient access
   */
  const verifyPatient = useCallback(
    async (patientId: string): Promise<boolean> => {
      if (!user) {
        return false;
      }

      return await verifyPatientAccess(user.uid, patientId);
    },
    [user]
  );

  /**
   * Secure logout
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await secureLogout();
      setUser(null);
      setIsAuthorized(false);
      setAccessiblePatients([]);
      router.replace('/auth/login');
    } catch (err) {
      console.error('[useCaregiverSecurity] Error during logout:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Refresh authentication
   */
  const refreshAuth = useCallback(async () => {
    await verifyAuth();
  }, [verifyAuth]);

  // Verify auth on mount
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return {
    user,
    isLoading,
    isAuthorized,
    error,
    verifyAccess,
    verifyPatient,
    logout,
    refreshAuth,
    accessiblePatients,
  };
}

/**
 * Hook for device access verification
 * 
 * @param deviceId - Device ID to verify access for
 * @returns Device access result
 */
export function useDeviceAccess(deviceId: string | null) {
  const [accessResult, setAccessResult] = useState<DeviceAccessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useCaregiverSecurity();

  useEffect(() => {
    if (!deviceId || !user) {
      setAccessResult(null);
      return;
    }

    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const result = await verifyDeviceAccess(user.uid, deviceId);
        setAccessResult(result);
      } catch (error) {
        console.error('[useDeviceAccess] Error checking access:', error);
        setAccessResult({
          hasAccess: false,
          reason: 'Error checking access',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [deviceId, user]);

  return { accessResult, isLoading };
}

/**
 * Hook for patient access verification
 * 
 * @param patientId - Patient ID to verify access for
 * @returns Patient access result
 */
export function usePatientAccess(patientId: string | null) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useCaregiverSecurity();

  useEffect(() => {
    if (!patientId || !user) {
      setHasAccess(false);
      return;
    }

    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const result = await verifyPatientAccess(user.uid, patientId);
        setHasAccess(result);
      } catch (error) {
        console.error('[usePatientAccess] Error checking access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [patientId, user]);

  return { hasAccess, isLoading };
}

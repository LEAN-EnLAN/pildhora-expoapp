import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { getDbInstance, getDeviceRdbInstance, getAuthInstance } from '../services/firebase';
import { linkDeviceToUser, unlinkDeviceFromUser } from '../services/deviceLinking';
import { generateCode, getActiveCodes, revokeCode as revokeConnectionCode } from '../services/connectionCode';
import { saveDeviceConfig as saveDeviceConfigService, getDeviceConfig } from '../services/deviceConfig';
import { setAutonomousMode, isAutonomousModeEnabled } from '../services/autonomousMode';
import { useDeviceLinks } from './useDeviceLinks';
import type { ConnectionCodeData, DeviceState } from '../types';

export interface DeviceInfo {
  id: string;
  firmwareVersion?: string;
  wifiSSID?: string;
  provisioningStatus?: 'pending' | 'active' | 'inactive' | 'unlinked';
  provisionedAt?: Date;
  lastSeen?: Date;
}

export interface LinkedCaregiver {
  id: string;
  name: string;
  email: string;
  linkedAt: Date;
}

export interface DeviceConfigInput {
  alarmMode: 'off' | 'sound' | 'led' | 'both';
  ledIntensity: number;
  ledColor: { r: number; g: number; b: number };
}

export interface UseDeviceSettingsOptions {
  userId?: string;
  deviceId?: string;
}

export interface UseDeviceSettingsReturn {
  // Device Info
  deviceId: string | null;
  deviceInfo: DeviceInfo | null;
  deviceState: DeviceState | null;
  isOnline: boolean;
  
  // Device Config
  deviceConfig: DeviceConfigInput | null;
  savingConfig: boolean;
  
  // Caregivers
  caregivers: LinkedCaregiver[];
  caregiversLoading: boolean;
  
  // Connection Codes
  connectionCodes: ConnectionCodeData[];
  codesLoading: boolean;
  
  // Autonomous Mode
  autonomousMode: boolean;
  togglingAutonomousMode: boolean;
  
  // Actions
  linkDevice: (newDeviceId: string) => Promise<void>;
  unlinkDevice: () => Promise<void>;
  generateConnectionCode: () => Promise<string>;
  revokeCode: (code: string) => Promise<void>;
  revokeCaregiver: (caregiverId: string, caregiverName: string) => Promise<void>;
  toggleAutonomousMode: (enabled: boolean) => Promise<void>;
  saveConfig: (config: DeviceConfigInput) => Promise<void>;
  
  // State
  loading: boolean;
  error: string | null;
  success: string | null;
  clearError: () => void;
  clearSuccess: () => void;
  refresh: () => void;
}

export function useDeviceSettings({
  userId,
  deviceId: initialDeviceId,
}: UseDeviceSettingsOptions): UseDeviceSettingsReturn {
  // Core state
  const [deviceId, setDeviceId] = useState<string | null>(initialDeviceId || null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfigInput | null>(null);
  const [connectionCodes, setConnectionCodes] = useState<ConnectionCodeData[]>([]);
  const [caregivers, setCaregivers] = useState<LinkedCaregiver[]>([]);
  const [autonomousMode, setAutonomousModeState] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [togglingAutonomousMode, setTogglingAutonomousMode] = useState(false);
  
  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Refs
  const caregiverProfilesRef = useRef<Record<string, { name: string; email: string }>>({});
  const [refreshToggle, setRefreshToggle] = useState(0);

  // Use device links hook for real-time caregiver updates
  const { 
    deviceLinks, 
    isLoading: caregiversLoading, 
    error: caregiversError,
    refetch: refetchCaregivers 
  } = useDeviceLinks({
    deviceId: deviceId || undefined,
    enabled: !!deviceId,
  });

  // Computed
  const isOnline = deviceState?.is_online ?? false;

  // Update deviceId when prop changes
  useEffect(() => {
    if (initialDeviceId !== deviceId) {
      setDeviceId(initialDeviceId || null);
    }
  }, [initialDeviceId]);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const db = await getDbInstance();
      if (!db) throw new Error('Database not initialized');

      // Refresh auth token
      const auth = await getAuthInstance();
      if (auth?.currentUser) {
        await auth.currentUser.getIdToken(true);
      }

      // Load connection codes
      const codes = await getActiveCodes(userId);
      setConnectionCodes(codes);

      // Load autonomous mode
      const isAutonomous = await isAutonomousModeEnabled(userId);
      setAutonomousModeState(isAutonomous);

      if (!deviceId) {
        setLoading(false);
        return;
      }

      // Load device info from Firestore
      const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
      if (deviceDoc.exists()) {
        const data = deviceDoc.data();
        setDeviceInfo({
          id: deviceId,
          firmwareVersion: data.firmwareVersion,
          wifiSSID: data.wifiSSID,
          provisioningStatus: data.provisioningStatus,
          provisionedAt: data.provisionedAt?.toDate?.() || undefined,
          lastSeen: data.lastSeen?.toDate?.() || undefined,
        });
      }

      // Load device config
      const configData = await getDeviceConfig(deviceId);
      const desired = configData.firestore?.desiredConfig || {};
      const ledColorArr = (desired?.led_color_rgb as [number, number, number]) ?? [255, 0, 0];
      
      setDeviceConfig({
        alarmMode: (desired?.alarm_mode as 'off' | 'sound' | 'led' | 'both') ?? 'off',
        ledIntensity: (desired?.led_intensity as number) ?? 512,
        ledColor: { r: ledColorArr[0], g: ledColorArr[1], b: ledColorArr[2] },
      });

    } catch (err: any) {
      console.error('[useDeviceSettings] Error loading data:', err);
      setError(err.userMessage || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [userId, deviceId, refreshToggle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time RTDB subscription for device state
  useEffect(() => {
    if (!deviceId) {
      setDeviceState(null);
      return;
    }

    // Validate device ID for RTDB
    if (/[.#$\[\]]/.test(deviceId)) {
      console.warn('[useDeviceSettings] Invalid device ID for RTDB:', deviceId);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const rdb = await getDeviceRdbInstance();
        if (!rdb) return;

        const stateRef = ref(rdb, `devices/${deviceId}/state`);
        
        const callback = (snapshot: any) => {
          const state = snapshot.val() as DeviceState | null;
          setDeviceState(state);
        };

        onValue(stateRef, callback);
        unsubscribe = () => off(stateRef, 'value', callback);
      } catch (err) {
        console.error('[useDeviceSettings] RTDB listener error:', err);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [deviceId]);

  // Hydrate caregivers from device links
  useEffect(() => {
    if (!deviceId || !deviceLinks.length) {
      setCaregivers([]);
      return;
    }

    let cancelled = false;

    const hydrateCaregivers = async () => {
      try {
        const db = await getDbInstance();
        if (!db) return;

        const caregiverLinks = deviceLinks.filter(l => l.role === 'caregiver');
        
        const hydrated = await Promise.all(caregiverLinks.map(async link => {
          const cached = caregiverProfilesRef.current[link.userId];
          if (cached) {
            return {
              id: link.userId,
              name: cached.name,
              email: cached.email,
              linkedAt: link.linkedAt ?? new Date(),
            };
          }

          let name = 'Desconocido';
          let email = '';
          
          try {
            const userSnap = await getDoc(doc(db, 'users', link.userId));
            if (userSnap.exists()) {
              const data = userSnap.data();
              name = data.name || data.displayName || data.email || name;
              email = data.email || email;
            }
          } catch (err) {
            console.warn('[useDeviceSettings] Failed to hydrate caregiver:', err);
          }

          caregiverProfilesRef.current[link.userId] = { name, email };
          
          return { id: link.userId, name, email, linkedAt: link.linkedAt ?? new Date() };
        }));

        if (!cancelled) {
          setCaregivers(hydrated);
        }
      } catch (err) {
        console.error('[useDeviceSettings] Error hydrating caregivers:', err);
      }
    };

    hydrateCaregivers();

    return () => { cancelled = true; };
  }, [deviceId, deviceLinks]);

  // Surface caregiver errors
  useEffect(() => {
    if (caregiversError) {
      setError(caregiversError.message || 'Error al cargar cuidadores');
    }
  }, [caregiversError]);

  // Actions
  const linkDevice = useCallback(async (newDeviceId: string) => {
    if (!userId) throw new Error('No user ID');
    
    setError(null);
    setSuccess(null);

    try {
      const auth = await getAuthInstance();
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('No has iniciado sesión');

      await linkDeviceToUser(currentUser.uid, newDeviceId.trim());
      setDeviceId(newDeviceId.trim());
      setSuccess(`Dispositivo ${newDeviceId} vinculado exitosamente`);
      setRefreshToggle(prev => prev + 1);
    } catch (err: any) {
      setError(err.userMessage || 'Error al vincular dispositivo');
      throw err;
    }
  }, [userId]);

  const unlinkDevice = useCallback(async () => {
    if (!userId || !deviceId) throw new Error('Missing user or device ID');

    setError(null);
    setSuccess(null);

    try {
      const auth = await getAuthInstance();
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('No has iniciado sesión');

      await unlinkDeviceFromUser(currentUser.uid, deviceId);
      setDeviceId(null);
      setDeviceInfo(null);
      setDeviceState(null);
      setDeviceConfig(null);
      setCaregivers([]);
      setSuccess('Dispositivo desvinculado exitosamente');
    } catch (err: any) {
      setError(err.userMessage || 'Error al desvincular dispositivo');
      throw err;
    }
  }, [userId, deviceId]);

  const generateConnectionCode = useCallback(async () => {
    if (!userId || !deviceId) throw new Error('Missing user or device ID');

    setError(null);

    try {
      const code = await generateCode(userId, deviceId, 24);
      setSuccess(`Código generado: ${code}`);
      
      // Reload codes
      const codes = await getActiveCodes(userId);
      setConnectionCodes(codes);
      
      return code;
    } catch (err: any) {
      setError(err.userMessage || 'Error al generar código');
      throw err;
    }
  }, [userId, deviceId]);

  const revokeCode = useCallback(async (code: string) => {
    if (!userId) throw new Error('No user ID');

    setError(null);

    try {
      await revokeConnectionCode(code);
      setSuccess('Código revocado exitosamente');
      
      const codes = await getActiveCodes(userId);
      setConnectionCodes(codes);
    } catch (err: any) {
      setError(err.userMessage || 'Error al revocar código');
      throw err;
    }
  }, [userId]);

  const revokeCaregiver = useCallback(async (caregiverId: string, caregiverName: string) => {
    if (!userId || !deviceId) throw new Error('Missing user or device ID');

    setError(null);

    try {
      await unlinkDeviceFromUser(caregiverId, deviceId, userId);
      setSuccess(`Acceso de ${caregiverName} revocado exitosamente`);
      refetchCaregivers();
    } catch (err: any) {
      setError(err.userMessage || 'Error al revocar acceso');
      throw err;
    }
  }, [userId, deviceId, refetchCaregivers]);

  const toggleAutonomousMode = useCallback(async (enabled: boolean) => {
    if (!userId) throw new Error('No user ID');

    setTogglingAutonomousMode(true);
    setError(null);

    try {
      await setAutonomousMode(userId, enabled);
      setAutonomousModeState(enabled);
      setSuccess(
        enabled
          ? 'Modo Autónomo activado. Tus datos ya no se comparten con cuidadores.'
          : 'Modo Supervisado activado. Tus cuidadores pueden ver tu información.'
      );
    } catch (err: any) {
      setError(err.userMessage || 'Error al cambiar el modo');
      throw err;
    } finally {
      setTogglingAutonomousMode(false);
    }
  }, [userId]);

  const saveConfig = useCallback(async (config: DeviceConfigInput) => {
    if (!deviceId) throw new Error('No device ID');

    setSavingConfig(true);
    setError(null);

    try {
      await saveDeviceConfigService(deviceId, config);
      setDeviceConfig(config);
      setSuccess('Configuración guardada exitosamente');
    } catch (err: any) {
      setError(err.userMessage || 'Error al guardar configuración');
      throw err;
    } finally {
      setSavingConfig(false);
    }
  }, [deviceId]);

  const refresh = useCallback(() => {
    setRefreshToggle(prev => prev + 1);
    refetchCaregivers();
  }, [refetchCaregivers]);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(null), []);

  return {
    deviceId,
    deviceInfo,
    deviceState,
    isOnline,
    deviceConfig,
    savingConfig,
    caregivers,
    caregiversLoading,
    connectionCodes,
    codesLoading: loading, // Use main loading state for codes
    autonomousMode,
    togglingAutonomousMode,
    linkDevice,
    unlinkDevice,
    generateConnectionCode,
    revokeCode,
    revokeCaregiver,
    toggleAutonomousMode,
    saveConfig,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    refresh,
  };
}

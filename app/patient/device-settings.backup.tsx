import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity, Share, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { checkAuthState } from '../../src/store/slices/authSlice';
import { Card, Button, Input, ErrorMessage, SuccessMessage, LoadingSpinner, AnimatedListItem, Collapsible, Modal } from '../../src/components/ui';
import { DeviceConfigPanel } from '../../src/components/shared/DeviceConfigPanel';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens';
import { getDbInstance, getRdbInstance, getDeviceRdbInstance, getAuthInstance, getFunctionsInstance } from '../../src/services/firebase';
import { ref, get, push, set, onValue, off } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { DeviceLink, ConnectionCodeData } from '../../src/types';
import { generateCode, getActiveCodes, revokeCode } from '../../src/services/connectionCode';
import { linkDeviceToUser, unlinkDeviceFromUser } from '../../src/services/deviceLinking';
import { saveDeviceConfig as saveDeviceConfigService, getDeviceConfig } from '../../src/services/deviceConfig';
import { setAutonomousMode, isAutonomousModeEnabled } from '../../src/services/autonomousMode';
import { deviceActionsService } from '../../src/services/deviceActions';
import { useDeviceLinks } from '../../src/hooks/useDeviceLinks';
import { Ionicons } from '@expo/vector-icons';

interface LinkedCaregiver {
  id: string;
  name: string;
  email: string;
  linkedAt: Date;
}

type DeviceStatsLocal = Record<string, {
  battery: number | null;
  status: string | null;
  alarmMode: 'off' | 'sound' | 'led' | 'both';
  ledIntensity: number;
  ledColor: { r: number; g: number; b: number };
  saving?: boolean;
  saveError?: string | null;
}>;

export default function DeviceSettings() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [caregivers, setCaregivers] = useState<LinkedCaregiver[]>([]);
  const [connectionCodes, setConnectionCodes] = useState<ConnectionCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [topoState, setTopoState] = useState<boolean | null>(null);

  const deviceId = user?.deviceId;
  const patientId = user?.id;

  // Device linking state
  const [newDeviceId, setNewDeviceId] = useState('');
  const [linkingDevice, setLinkingDevice] = useState(false);
  
  // Device stats and configuration
  const [deviceStats, setDeviceStats] = useState<DeviceStatsLocal>({});
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [unlinkingDevice, setUnlinkingDevice] = useState<string | null>(null);
  const [dispensingDevice, setDispensingDevice] = useState<string | null>(null);
  const [dispenseFeedback, setDispenseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [autonomousMode, setAutonomousModeState] = useState(false);
  const [togglingAutonomousMode, setTogglingAutonomousMode] = useState(false);
  const { deviceLinks, isLoading: caregiversLoading, error: caregiversError, refetch: refetchCaregivers } = useDeviceLinks({
    deviceId,
    enabled: !!deviceId,
  });
  const caregiverProfilesRef = useRef<Record<string, { name: string; email: string }>>({});

  // Load caregivers, connection codes, and device stats
  const loadData = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    
    // If no device, just load connection codes (they might exist from before)
    if (!deviceId) {
      try {
        const db = await getDbInstance();
        if (db) {
          const codes = await getActiveCodes(patientId);
          setConnectionCodes(codes);
        }
      } catch (err) {
        console.error('[DeviceSettings] Error loading codes:', err);
      }
      setLoading(false);
      return;
    }

    try {
      const db = await getDbInstance();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Refresh auth token to avoid stale ID tokens on callable/functions
      try {
        const auth = await getAuthInstance();
        if (auth?.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
      } catch (refreshErr) {
        console.warn('[DeviceSettings] Failed to refresh ID token', refreshErr);
      }

      // Load active connection codes
      const codes = await getActiveCodes(patientId);
      setConnectionCodes(codes);

      // Load autonomous mode status
      const isAutonomous = await isAutonomousModeEnabled(patientId);
      setAutonomousModeState(isAutonomous);

      // Load device stats and configuration via services
      try {
        const deviceData = await getDeviceConfig(deviceId);
        
        const devData = deviceData.firestore;
        const desired = devData?.desiredConfig || {};
        const alarmMode = (desired?.alarm_mode as 'off' | 'sound' | 'led' | 'both') ?? 'off';
        const ledIntensity = (desired?.led_intensity as number) ?? 512;
        const ledColorArr = (desired?.led_color_rgb as [number, number, number]) ?? [255, 0, 0];
        const ledColor = { r: ledColorArr[0], g: ledColorArr[1], b: ledColorArr[2] };
        const last = devData?.lastKnownState || {};
        
        let battery: number | null = null;
        const rawBattery = last?.battery ?? last?.batteryPercent ?? last?.battery_percentage ?? last?.battery_level ?? null;
        if (typeof rawBattery === 'number') {
          battery = Math.round(rawBattery);
        } else if (typeof rawBattery === 'string') {
          const parsed = parseFloat(rawBattery);
          battery = isNaN(parsed) ? null : Math.round(parsed);
        }
        
        // Check RTDB state
        const stateVal = deviceData.rdb || {};
        const status = stateVal?.current_status || 'N/D';
        
        if (typeof stateVal?.battery_level === 'number') {
          battery = Math.round(stateVal.battery_level);
        }
        
        setDeviceStats({
          [deviceId]: { battery, status, alarmMode, ledIntensity, ledColor, saving: false, saveError: null }
        });
      } catch (err) {
        console.error('[DeviceSettings] Error loading device config:', err);
        // Graceful fallback to defaults if config fetch fails (e.g., unauthenticated)
        setDeviceStats({
          [deviceId]: {
            battery: null,
            status: 'N/D',
            alarmMode: 'off',
            ledIntensity: 512,
            ledColor: { r: 255, g: 0, b: 0 },
            saving: false,
            saveError: 'No se pudo cargar la configuración (permiso o sesión).'
          }
        });
      }

      setError(null);
    } catch (err: any) {
      console.error('[DeviceSettings] Error loading data:', err);
      setError(err.userMessage || 'Error al cargar datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, deviceId]);

  // Hydrate caregivers from live deviceLinks listener with user profiles
  useEffect(() => {
    let cancelled = false;
    if (!deviceId) {
      setCaregivers([]);
      return;
    }

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
              const data = userSnap.data() as any;
              name = data.name || data.displayName || data.email || name;
              email = data.email || email;
            }
          } catch (err) {
            console.warn('[DeviceSettings] Failed to hydrate caregiver profile', err);
          }

          return {
            id: link.userId,
            name,
            email,
            linkedAt: link.linkedAt ?? new Date(),
          };
        }));

        if (!cancelled) {
          hydrated.forEach(c => {
            caregiverProfilesRef.current[c.id] = { name: c.name, email: c.email };
          });
          setCaregivers(hydrated);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[DeviceSettings] Error hydrating caregivers from links:', err);
        }
      }
    };

    hydrateCaregivers();

    return () => {
      cancelled = true;
    };
  }, [deviceId, deviceLinks]);

  // Surface caregiver listener errors to page-level error banner without blocking others
  useEffect(() => {
    if (caregiversError) {
      setError(caregiversError.message || 'No se pudieron cargar los cuidadores.');
    }
  }, [caregiversError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      try {
        // Validate device ID for RTDB compatibility
        // RTDB paths cannot contain ".", "#", "$", "[", or "]"
        if (deviceId.includes('#') || deviceId.includes('.') || deviceId.includes('$') || deviceId.includes('[') || deviceId.includes(']')) {
           console.warn(`[DeviceSettings] Invalid device ID for RTDB listener: ${deviceId}. Skipping listener.`);
           return;
        }

        const rdb = await getDeviceRdbInstance();
        if (!rdb) return;
        const pathRef = ref(rdb, `devices/${deviceId}/commands/topo`);
        const cb = (snap: any) => {
          const v = snap.val();
          setTopoState(typeof v === 'boolean' ? v : !!v);
        };
        onValue(pathRef, cb);
        return () => off(pathRef, 'value', cb as any);
      } catch (err) {
         console.error('[DeviceSettings] RTDB Listener Error:', err);
      }
    })();
  }, [deviceId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLinkDevice = async () => {
    if (!newDeviceId.trim()) {
      setError('Por favor, ingresa un ID de dispositivo');
      return;
    }

    setLinkingDevice(true);
    setError(null);
    setSuccess(null);

    try {
      // Use current auth user to avoid mismatches with Redux state
      const auth = await getAuthInstance();
      const currentUser = auth?.currentUser;

      if (!currentUser) {
        throw new Error('No has iniciado sesión');
      }

      if (patientId && patientId !== currentUser.uid) {
        console.warn('[DeviceSettings] Redux/Auth ID mismatch', { reduxId: patientId, authId: currentUser.uid });
      }

      await linkDeviceToUser(currentUser.uid, newDeviceId.trim());
      
      // Refresh auth state to update deviceId in Redux
      await dispatch(checkAuthState());
      
      setSuccess(`Dispositivo ${newDeviceId} vinculado exitosamente`);
      setNewDeviceId('');
      
      // Reload data to show the newly linked device
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (err: any) {
      console.error('[DeviceSettings] Error linking device:', err);
      setError(err.userMessage || 'Error al vincular dispositivo');
    } finally {
      setLinkingDevice(false);
    }
  };

  const handleUnlinkDevice = async () => {
    if (!deviceId) return;

    Alert.alert(
      'Desvincular Dispositivo',
      '¿Estás seguro de que deseas desvincular este dispositivo? Dejarás de tener acceso a sus funciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            setUnlinkingDevice(deviceId);
            setError(null);
            setSuccess(null);

            try {
              // Use current auth user
              const auth = await getAuthInstance();
              const currentUser = auth?.currentUser;

              if (!currentUser) {
                throw new Error('No has iniciado sesión');
              }

              await unlinkDeviceFromUser(currentUser.uid, deviceId);
              
              // Refresh auth state to update deviceId in Redux
              await dispatch(checkAuthState());

              setSuccess('Dispositivo desvinculado exitosamente');
              
              // Refresh to show the "Link Device" screen
              setTimeout(() => {
                 // We can try to reload data or navigate
                 loadData();
              }, 1000);

            } catch (err: any) {
              console.error('[DeviceSettings] Error unlinking device:', err);
              setError(err.userMessage || 'Error al desvincular dispositivo');
            } finally {
              setUnlinkingDevice(null);
            }
          }
        }
      ]
    );
  };

  const handleToggleAutonomousMode = async (newValue: boolean) => {
    if (!patientId) return;

    const modeLabel = newValue ? 'Modo Autónomo' : 'Modo Supervisado';
    const warningMessage = newValue
      ? `Al activar el Modo Autónomo:\n\n• Tus cuidadores NO verán nuevos eventos de medicamentos\n• Podrán ver el historial anterior\n• Verán "Modo autónomo activado" en tu información actual\n\n¿Deseas continuar?`
      : `Al desactivar el Modo Autónomo:\n\n• Tus cuidadores volverán a ver tus eventos de medicamentos en tiempo real\n• Tendrán acceso completo a tu información\n\n¿Deseas continuar?`;

    Alert.alert(
      `Cambiar a ${modeLabel}`,
      warningMessage,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setTogglingAutonomousMode(true);
            setError(null);
            setSuccess(null);

            try {
              await setAutonomousMode(patientId, newValue);
              setAutonomousModeState(newValue);
              setSuccess(
                newValue
                  ? 'Modo Autónomo activado. Tus datos ya no se comparten con cuidadores.'
                  : 'Modo Supervisado activado. Tus cuidadores pueden ver tu información nuevamente.'
              );
            } catch (err: any) {
              console.error('[DeviceSettings] Error toggling autonomous mode:', err);
              setError(err.userMessage || 'Error al cambiar el modo');
            } finally {
              setTogglingAutonomousMode(false);
            }
          }
        }
      ]
    );
  };

  const handleDispense = async () => {
    if (!deviceId || !patientId) return;
    
    setError(null);
    setSuccess(null);
    setDispensingDevice(deviceId);
    
    try {
      const result = await deviceActionsService.dispenseManualDose(deviceId, patientId);
      
      if (result.success) {
        setDispenseFeedback({
            type: 'success',
            message: result.message || 'Solicitud de dispensación enviada',
        });
      } else {
        throw new Error(result.message || 'Error al solicitar dispensación');
      }
    } catch (e: any) {
      setDispenseFeedback({
        type: 'error',
        message: e.message || 'No se pudo dispensar',
      });
    } finally {
      setDispensingDevice(null);
    }
  };

  const toggleDeviceExpanded = () => {
    if (!deviceId) return;
    setExpandedDevices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  };

  const saveDeviceConfig = async (config: {
    alarmMode: 'off' | 'sound' | 'led' | 'both';
    ledIntensity: number;
    ledColor: { r: number; g: number; b: number };
  }) => {
    if (!deviceId || !patientId) return;
    
    setError(null);
    setSuccess(null);
    setDeviceStats((prev) => ({ 
      ...prev, 
      [deviceId]: { ...(prev[deviceId] || {}), saving: true, saveError: null } 
    }));
    
    try {
      await saveDeviceConfigService(deviceId, {
        alarmMode: config.alarmMode,
        ledIntensity: config.ledIntensity,
        ledColor: config.ledColor
      });
      
      setDeviceStats((prev) => ({ 
        ...prev, 
        [deviceId]: { 
          ...(prev[deviceId] || {}), 
          alarmMode: config.alarmMode,
          ledIntensity: config.ledIntensity,
          ledColor: config.ledColor,
          saving: false,
          saveError: null,
        } 
      }));
      
      setSuccess('Configuración guardada exitosamente');
    } catch (e: any) {
      const errorMsg = e?.userMessage || e?.message || 'Error al guardar configuración';
      setDeviceStats((prev) => ({ 
        ...prev, 
        [deviceId]: { ...(prev[deviceId] || {}), saving: false, saveError: errorMsg } 
      }));
      setError(errorMsg);
    }
  };

  const handleGenerateCode = async () => {
    if (!patientId || !deviceId) {
      setError('No se encontró información del dispositivo');
      return;
    }

    setGeneratingCode(true);
    setError(null);
    setSuccess(null);

    try {
      const code = await generateCode(patientId, deviceId, 24);
      setSuccess(`Código generado: ${code}`);
      
      // Reload codes to show the new one
      await loadData();

      // Offer to share the code
      setTimeout(() => {
        Alert.alert(
          'Código Generado',
          `Tu código de conexión es: ${code}\n\n¿Deseas compartirlo?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Compartir',
              onPress: () => handleShareCode(code)
            }
          ]
        );
      }, 500);
    } catch (err: any) {
      console.error('[DeviceSettings] Error generating code:', err);
      setError(err.userMessage || 'Error al generar código');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleShareCode = async (code: string) => {
    try {
      await Share.share({
        message: `Código de conexión para dispositivo de medicamentos: ${code}\n\nEste código expira en 24 horas.`,
        title: 'Código de Conexión'
      });
    } catch (err) {
      console.error('[DeviceSettings] Error sharing code:', err);
    }
  };

  const handleRevokeCode = async (code: string) => {
    Alert.alert(
      'Revocar Código',
      '¿Estás seguro de que deseas revocar este código? No podrá ser utilizado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeCode(code);
              setSuccess('Código revocado exitosamente');
              await loadData();
            } catch (err: any) {
              console.error('[DeviceSettings] Error revoking code:', err);
              setError(err.userMessage || 'Error al revocar código');
            }
          }
        }
      ]
    );
  };

  const handleRevokeCaregiver = async (caregiverId: string, caregiverName: string) => {
    if (!deviceId) return;

    Alert.alert(
      'Revocar Acceso',
      `¿Estás seguro de que deseas revocar el acceso de ${caregiverName}? Ya no podrán ver tu información de medicamentos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!patientId) {
                throw new Error('No se pudo identificar al paciente autenticado');
              }

              await unlinkDeviceFromUser(caregiverId, deviceId, patientId);
              setSuccess(`Acceso de ${caregiverName} revocado exitosamente`);
              await loadData();
            } catch (err: any) {
              console.error('[DeviceSettings] Error revoking caregiver:', err);
              setError(err.userMessage || 'Error al revocar acceso');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatExpirationTime = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Expira en ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `Expira en ${minutes}m`;
    } else {
      return 'Expirado';
    }
  };

  if (!deviceId) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityLabel="Volver"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} accessibilityRole="header">Ajustes del dispositivo</Text>
          </View>

          {/* Success/Error Messages */}
          {success && (
            <View style={styles.messageContainer} accessibilityLiveRegion="polite">
              <SuccessMessage
                message={success}
                onDismiss={() => setSuccess(null)}
                autoDismiss={true}
                duration={5000}
              />
            </View>
          )}

          {error && (
            <View style={styles.messageContainer} accessibilityLiveRegion="polite">
              <ErrorMessage
                message={error}
                onDismiss={() => setError(null)}
                variant="banner"
              />
            </View>
          )}

          {/* Link Device Section */}
          <View style={styles.section}>
            <Card variant="elevated" padding="lg">
              <View style={styles.linkDeviceHeader}>
                <Ionicons name="link-outline" size={48} color={colors.primary[600]} />
                <Text style={styles.linkDeviceTitle}>Vincular Dispositivo</Text>
                <Text style={styles.linkDeviceSubtitle}>
                  Ingresa el ID único de tu dispositivo PildHora para comenzar a gestionar tus medicamentos.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel} accessibilityRole="header">ID del dispositivo</Text>
                <Input
                  value={newDeviceId}
                  onChangeText={setNewDeviceId}
                  placeholder="Ej: DEVICE-001"
                  autoCapitalize="characters"
                  accessibilityLabel="ID del dispositivo"
                  style={styles.deviceInput}
                />
                <Text style={styles.inputHint}>
                  El ID se encuentra en la parte posterior de tu dispositivo
                </Text>
              </View>

              <Button
                variant="primary"
                onPress={handleLinkDevice}
                loading={linkingDevice}
                disabled={linkingDevice || !newDeviceId.trim()}
                accessibilityLabel="Vincular dispositivo"
                accessibilityHint="Vincula el dispositivo a tu cuenta para gestionarlo desde la app"
                style={styles.linkButton}
              >
                Vincular dispositivo
              </Button>

              <View style={styles.divider} />

              <View style={styles.alternativeOption}>
                <Text style={styles.alternativeText}>
                  ¿Dispositivo nuevo sin configurar?
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push('/patient/device-provisioning')}
                  accessibilityLabel="Ir a configuración completa"
                >
                  Configuración Completa
                </Button>
              </View>

              <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: colors.gray[200], paddingTop: 24 }}>
                 <Text style={{ marginBottom: 12, textAlign: 'center', color: colors.gray[600], fontSize: 14 }}>
                   Zona de Pruebas
                 </Text>
                 <Text style={{ marginBottom: 12, textAlign: 'center', color: topoState ? '#E53935' : '#388E3C', fontSize: 14 }}>
                   Estado TOPO: {topoState === null ? 'N/D' : topoState ? 'ON' : 'OFF'}
                 </Text>
                 <Button
                    variant="secondary"
                    onPress={async () => {
                      try {
                        const rdb = await getDeviceRdbInstance();
                        if (!rdb) {
                          console.error('Firebase Database not initialized');
                          Alert.alert('Error', 'Firebase Database not initialized');
                          return;
                        }
                        const actionPath = `devices/TEST-DEVICE-001/commands/topo`;
                        await set(ref(rdb, actionPath), true);
                        Alert.alert('Éxito', 'Se ha enviado la señal TOPO a TEST-DEVICE-001.');
                      } catch (error: any) {
                        console.error('Test Topo Error:', error);
                        Alert.alert('Error', error.message);
                      }
                    }}
                    style={{ backgroundColor: '#FF5722' }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>TEST TOPO (TEST-DEVICE-001)</Text>
                  </Button>
              </View>
            </Card>
          </View>

          {/* Help Section */}
          <View style={styles.section}>
            <Card variant="outlined" padding="lg">
              <View style={styles.helpHeader}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary[600]} />
                <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
              </View>
              <Text style={styles.helpText}>
                • Verifica que el ID esté escrito correctamente{'\n'}
                • El ID distingue entre mayúsculas y minúsculas{'\n'}
                • Si es un dispositivo nuevo, usa "Configuración Completa"{'\n'}
                • Contacta soporte si tienes problemas
              </Text>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Ajustes del dispositivo</Text>
          <TouchableOpacity
            onPress={() => router.push('/patient/device-provisioning')}
            style={styles.headerRightButton}
            accessibilityLabel="Configurar WiFi"
            accessibilityHint="Abre el asistente de configuración para conectar el dispositivo a WiFi"
            accessibilityRole="button"
          >
            <Ionicons name="wifi-outline" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Success/Error Messages */}
        {success && (
          <View style={styles.messageContainer} accessibilityLiveRegion="polite">
            <SuccessMessage
              message={success}
              onDismiss={() => setSuccess(null)}
              autoDismiss={true}
              duration={5000}
            />
          </View>
        )}

        {error && (
          <View style={styles.messageContainer} accessibilityLiveRegion="polite">
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
              variant="banner"
            />
          </View>
        )}

        {/* Device Info and Configuration */}
        <View style={styles.section}>
          <Card variant="elevated" padding="lg">
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <Ionicons name="hardware-chip-outline" size={32} color={colors.primary[600]} />
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceLabel} accessibilityRole="header">ID del dispositivo</Text>
                  <Text style={styles.deviceIdText} numberOfLines={1} ellipsizeMode="middle">{deviceId}</Text>
                </View>
              </View>
            </View>

            {/* Autonomous Mode Toggle */}
            <View style={styles.autonomousModeSection}>
              <View style={styles.autonomousModeHeader}>
                <Ionicons 
                  name={autonomousMode ? "eye-off" : "eye"} 
                  size={24} 
                  color={autonomousMode ? colors.warning[600] : colors.primary[600]} 
                />
                <View style={styles.autonomousModeInfo}>
                  <Text style={styles.autonomousModeTitle}>
                    {autonomousMode ? 'Modo Autónomo' : 'Modo Supervisado'}
                  </Text>
                  <Text style={styles.autonomousModeDescription}>
                    {autonomousMode 
                      ? 'Tus datos no se comparten con cuidadores'
                      : 'Tus cuidadores pueden ver tu información'
                    }
                  </Text>
                </View>
                <Switch
                  value={autonomousMode}
                  onValueChange={handleToggleAutonomousMode}
                  disabled={togglingAutonomousMode}
                  trackColor={{ false: colors.gray[300], true: colors.warning[200] }}
                  thumbColor={autonomousMode ? colors.warning[600] : colors.gray[50]}
                  ios_backgroundColor={colors.gray[300]}
                  accessibilityLabel={autonomousMode ? 'Desactivar modo autónomo' : 'Activar modo autónomo'}
                />
              </View>
              
              {caregivers.length > 0 && (
                <View style={styles.autonomousModeWarning}>
                  <Ionicons name="information-circle" size={16} color={colors.gray[600]} />
                  <Text style={styles.autonomousModeWarningText}>
                    {autonomousMode 
                      ? `${caregivers.length} cuidador${caregivers.length > 1 ? 'es' : ''} conectado${caregivers.length > 1 ? 's' : ''} (sin acceso a datos nuevos)`
                      : `${caregivers.length} cuidador${caregivers.length > 1 ? 'es' : ''} con acceso completo`
                    }
                  </Text>
                </View>
              )}
            </View>

            {/* Device Stats */}
            {/* Always show basic actions even if stats fail to load */}
            
            <View style={styles.statsRow} accessibilityLabel={`Batería: ${deviceStats[deviceId]?.battery != null ? `${deviceStats[deviceId]?.battery}%` : 'N/D'}`}>
              <Text style={styles.statsLabel}>Batería</Text>
              <Text style={styles.statsValue} numberOfLines={1}>
                {deviceStats[deviceId]?.battery != null ? `${deviceStats[deviceId]?.battery}%` : 'N/D'}
              </Text>
            </View>
            
            <View style={styles.statsRow} accessibilityLabel={`Estado: ${deviceStats[deviceId]?.status ?? 'N/D'}`}>
              <Text style={styles.statsLabel}>Estado</Text>
              <Text style={styles.statsValue} numberOfLines={1}>
                {deviceStats[deviceId]?.status ?? 'N/D'}
              </Text>
            </View>

            {/* Expand/Collapse Button */}
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={toggleDeviceExpanded}
              accessibilityLabel={expandedDevices.has(deviceId) ? 'Ocultar configuración' : 'Mostrar configuración'}
              accessibilityRole="button"
              accessibilityHint={expandedDevices.has(deviceId) ? 'Oculta los controles de configuración del dispositivo' : 'Muestra los controles de configuración del dispositivo'}
            >
              <Ionicons 
                name={expandedDevices.has(deviceId) ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.primary[500]} 
              />
              <Text style={styles.expandButtonText}>
                {expandedDevices.has(deviceId) ? 'Ocultar configuración' : 'Mostrar configuración'}
              </Text>
            </TouchableOpacity>

            {/* Device Configuration Panel (Expanded) */}
            <Collapsible collapsed={!expandedDevices.has(deviceId)}>
              <View style={styles.configSection}>
                <DeviceConfigPanel
                  deviceId={deviceId}
                  initialAlarmMode={deviceStats[deviceId]?.alarmMode ?? 'off'}
                  initialLedIntensity={deviceStats[deviceId]?.ledIntensity ?? 512}
                  initialLedColor={deviceStats[deviceId]?.ledColor ?? { r: 255, g: 0, b: 0 }}
                  onSave={saveDeviceConfig}
                  loading={deviceStats[deviceId]?.saving ?? false}
                />
                
                {deviceStats[deviceId]?.saveError && (
                  <ErrorMessage
                    message={deviceStats[deviceId].saveError!}
                    variant="inline"
                    onDismiss={() => {
                      setDeviceStats((prev) => ({
                        ...prev,
                        [deviceId]: { ...(prev[deviceId] || {}), saveError: null }
                      }));
                    }}
                  />
                )}
              </View>
            </Collapsible>

            {/* Dispense and Unlink Buttons */}
            <View style={styles.actionButtons}>
              <Button 
                onPress={handleDispense}
                variant="primary"
                fullWidth
                loading={dispensingDevice === deviceId}
                disabled={dispensingDevice === deviceId}
                accessibilityLabel="Dispensar medicamento"
              >
                Dispensar Medicamento
              </Button>

              <Button 
                onPress={handleUnlinkDevice}
                variant="danger"
                fullWidth
                loading={unlinkingDevice === deviceId}
                disabled={unlinkingDevice === deviceId}
                accessibilityLabel="Desvincular dispositivo"
                style={{ marginTop: spacing.sm }}
              >
                Desvincular Dispositivo
              </Button>
            </View>
          </Card>
        </View>

        {/* Connected Caregivers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuidadores Conectados</Text>
          <Text style={styles.sectionSubtitle}>
            Personas que tienen acceso a tu información de medicamentos
          </Text>

          {loading ? (
            <Card variant="elevated" padding="lg">
              <Text style={styles.loadingText}>Cargando...</Text>
            </Card>
          ) : caregivers.length === 0 ? (
            <Card variant="elevated" padding="lg">
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.gray[400]} />
                <Text style={styles.emptyStateText}>
                  No hay cuidadores conectados
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Genera un código de conexión para compartir con un cuidador
                </Text>
              </View>
            </Card>
          ) : (
            caregivers.map((caregiver) => (
              <Card key={caregiver.id} variant="elevated" padding="lg" style={styles.caregiverCard}>
                <View style={styles.caregiverHeader}>
                  <View style={styles.caregiverIcon}>
                    <Ionicons name="person" size={24} color={colors.primary[600]} />
                  </View>
                  <View style={styles.caregiverInfo}>
                    <Text style={styles.caregiverName} numberOfLines={1}>{caregiver.name}</Text>
                    <Text style={styles.caregiverEmail} numberOfLines={1}>{caregiver.email}</Text>
                    <Text style={styles.caregiverDate}>
                      Conectado: {formatDate(caregiver.linkedAt)}
                    </Text>
                  </View>
                </View>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={() => handleRevokeCaregiver(caregiver.id, caregiver.name)}
                  style={styles.revokeButton}
                  accessibilityLabel={`Revocar acceso de ${caregiver.name}`}
                >
                  Revocar Acceso
                </Button>
              </Card>
            ))
          )}
        </View>

        {/* Connection Codes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderColumn}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Códigos de conexión</Text>
            <Text style={styles.sectionSubtitle}>
              Códigos activos para conectar nuevos cuidadores
            </Text>
            <Button
              variant="primary"
              size="sm"
              onPress={handleGenerateCode}
              loading={generatingCode}
              disabled={generatingCode}
              accessibilityLabel="Generar nuevo código de conexión"
              accessibilityHint="Genera un código temporal (24 h) para compartir con un cuidador"
              style={styles.generateButton}
            >
              Generar Código
            </Button>
          </View>

          {loading ? (
            <Card variant="elevated" padding="lg">
              <Text style={styles.loadingText}>Cargando...</Text>
            </Card>
          ) : connectionCodes.length === 0 ? (
            <Card variant="elevated" padding="lg">
              <View style={styles.emptyState}>
                <Ionicons name="key-outline" size={48} color={colors.gray[400]} />
                <Text style={styles.emptyStateText}>
                  No hay códigos activos
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Genera un código para compartir con un cuidador
                </Text>
              </View>
            </Card>
          ) : (
            connectionCodes.map((codeData) => (
              <Card key={codeData.code} variant="elevated" padding="lg" style={styles.codeCard}>
                <View style={styles.codeHeader}>
                  <View style={styles.codeIcon}>
                    <Ionicons name="key" size={24} color={colors.success[600]} />
                  </View>
                  <View style={styles.codeInfo}>
                    <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode="middle">{codeData.code}</Text>
                    <Text style={styles.codeExpiration}>
                      {formatExpirationTime(codeData.expiresAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.codeActions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => handleShareCode(codeData.code)}
                    style={styles.codeActionButton}
                    accessibilityLabel={`Compartir código de conexión`}
                    accessibilityHint={`Comparte el código de conexión usando tus apps disponibles`}
                  >
                    <Ionicons name="share-outline" size={16} color={colors.gray[700]} />
                    <Text style={styles.codeActionText}>Compartir</Text>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onPress={() => handleRevokeCode(codeData.code)}
                    style={styles.codeActionButton}
                    accessibilityLabel={`Revocar código de conexión`}
                    accessibilityHint={`Inhabilita el código para que ya no pueda usarse`}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.surface} />
                    <Text style={styles.codeActionTextDanger}>Revocar</Text>
                  </Button>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Card variant="outlined" padding="lg">
            <View style={styles.helpHeader} accessibilityRole="header">
              <Ionicons name="information-circle-outline" size={24} color={colors.primary[600]} />
              <Text style={styles.helpTitle}>¿Cómo funciona?</Text>
            </View>
            <Text style={styles.helpText}>
              1. Genera un código de conexión{'\n'}
              2. Comparte el código con tu cuidador{'\n'}
              3. El cuidador ingresa el código en su app{'\n'}
              4. Una vez conectado, podrá ver y gestionar tus medicamentos
            </Text>
            <Text style={styles.helpNote}>
              Los códigos expiran en 24 horas y solo pueden usarse una vez.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Dispense feedback modal */}
      <Modal
        visible={!!dispenseFeedback}
        onClose={() => setDispenseFeedback(null)}
        title={dispenseFeedback?.type === 'success' ? 'Dispensación enviada' : 'No se pudo dispensar'}
        size="sm"
      >
        <View style={{ gap: spacing.md }}>
          {dispenseFeedback?.type === 'success' ? (
            <SuccessMessage
              message={dispenseFeedback.message}
              autoDismiss={false}
            />
          ) : (
            <ErrorMessage
              message={dispenseFeedback?.message || ''}
              variant="inline"
            />
          )}
          <Button
            onPress={() => setDispenseFeedback(null)}
            variant={dispenseFeedback?.type === 'success' ? 'primary' : 'secondary'}
            fullWidth
            accessibilityLabel="Cerrar mensaje"
          >
            Entendido
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.gray[900],
    flex: 1,
  },
  headerRightButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
  },
  messageContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionHeaderColumn: {
    marginBottom: spacing.md,
  },
  generateButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  deviceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  deviceIdText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    fontFamily: 'monospace',
  },
  autonomousModeSection: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  autonomousModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  autonomousModeInfo: {
    flex: 1,
  },
  autonomousModeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  autonomousModeDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },
  autonomousModeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  autonomousModeWarningText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  statsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  statsValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  expandButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
    marginLeft: spacing.xs,
  },
  configSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  actionButtons: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
  },
  caregiverCard: {
    marginBottom: spacing.md,
  },
  caregiverHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  caregiverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  caregiverInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  caregiverName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  caregiverEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  caregiverDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  revokeButton: {
    alignSelf: 'flex-start',
  },
  codeCard: {
    marginBottom: spacing.md,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  codeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  codeValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  codeExpiration: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  codeActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  codeActionTextDanger: {
    fontSize: typography.fontSize.sm,
    color: colors.surface,
    fontWeight: typography.fontWeight.medium,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  helpTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginLeft: spacing.sm,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  helpNote: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
  linkDeviceHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  linkDeviceTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  linkDeviceSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  deviceInput: {
    marginBottom: spacing.xs,
  },
  inputHint: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
  linkButton: {
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.lg,
  },
  alternativeOption: {
    alignItems: 'center',
  },
  alternativeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

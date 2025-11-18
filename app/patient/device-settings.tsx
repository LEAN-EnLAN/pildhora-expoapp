import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity, Share, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { Card, Button, Input, ErrorMessage, SuccessMessage, LoadingSpinner, AnimatedListItem, Collapsible, Modal } from '../../src/components/ui';
import { DeviceConfigPanel } from '../../src/components/shared/DeviceConfigPanel';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens';
import { getDbInstance, getRdbInstance, getAuthInstance } from '../../src/services/firebase';
import { ref, get, push, set } from 'firebase/database';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { DeviceLink, ConnectionCodeData } from '../../src/types';
import { generateCode, getActiveCodes, revokeCode } from '../../src/services/connectionCode';
import { linkDeviceToUser, unlinkDeviceFromUser } from '../../src/services/deviceLinking';
import { setAutonomousMode, isAutonomousModeEnabled } from '../../src/services/autonomousMode';
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
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [caregivers, setCaregivers] = useState<LinkedCaregiver[]>([]);
  const [connectionCodes, setConnectionCodes] = useState<ConnectionCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

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

      // Load connected caregivers
      const deviceLinksQuery = query(
        collection(db, 'deviceLinks'),
        where('deviceId', '==', deviceId),
        where('role', '==', 'caregiver'),
        where('status', '==', 'active')
      );

      const deviceLinksSnapshot = await getDocs(deviceLinksQuery);
      const caregiverData: LinkedCaregiver[] = [];

      for (const linkDoc of deviceLinksSnapshot.docs) {
        const link = linkDoc.data() as DeviceLink;
        
        // Fetch caregiver user data
        const userDoc = await getDoc(doc(db, 'users', link.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          caregiverData.push({
            id: link.userId,
            name: userData.name || 'Unknown',
            email: userData.email || '',
            linkedAt: link.linkedAt instanceof Date ? link.linkedAt : new Date(link.linkedAt)
          });
        }
      }

      setCaregivers(caregiverData);

      // Load active connection codes
      const codes = await getActiveCodes(patientId);
      setConnectionCodes(codes);

      // Load autonomous mode status
      const isAutonomous = await isAutonomousModeEnabled(patientId);
      setAutonomousModeState(isAutonomous);

      // Load device stats and configuration
      const devDoc = await getDoc(doc(db, 'devices', deviceId));
      if (devDoc.exists()) {
        const devData = devDoc.data();
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
        
        let status: string | null = null;
        try {
          const rdbInst = await getRdbInstance();
          if (rdbInst) {
            const snap = await get(ref(rdbInst, `devices/${deviceId}/state`));
            const stateVal = snap.val() || {};
            status = stateVal?.current_status || 'N/D';
            if (typeof stateVal?.battery_level === 'number') {
              battery = Math.round(stateVal.battery_level);
            }
          }
        } catch (e) {
          console.error('Error fetching status from RTDB', e);
        }
        
        setDeviceStats({
          [deviceId]: { battery, status, alarmMode, ledIntensity, ledColor, saving: false, saveError: null }
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLinkDevice = async () => {
    if (!newDeviceId.trim()) {
      setError('Por favor, ingresa un ID de dispositivo');
      return;
    }

    if (!patientId) {
      setError('No se encontró información del usuario');
      return;
    }

    setLinkingDevice(true);
    setError(null);
    setSuccess(null);

    try {
      await linkDeviceToUser(patientId, newDeviceId.trim());
      
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
    if (!deviceId) return;
    
    setError(null);
    setSuccess(null);
    setDispensingDevice(deviceId);
    
    try {
      const rdb = await getRdbInstance();
      const auth = await getAuthInstance();
      if (!rdb) {
        throw new Error('Realtime Database not available');
      }
      
      const stateSnap = await get(ref(rdb, `devices/${deviceId}/state`));
      const current = stateSnap.val() || {};
      const isIdle = current?.current_status === 'idle' || current?.current_status === 'IDLE';
      const timeSynced = current?.time_synced === true;
      
      if (!isIdle || !timeSynced) {
        throw new Error('No se puede dispensar: el dispositivo no está listo');
      }
      
      const reqRef = push(ref(rdb, `devices/${deviceId}/dispenseRequests`));
      const payload = {
        triggerId: `${auth?.currentUser?.uid || 'app'}_${Date.now()}`,
        requestedBy: auth?.currentUser?.uid || 'app',
        requestedAt: Date.now(),
      };
      await set(reqRef, payload);
      
      setDispenseFeedback({
        type: 'success',
        message: 'Solicitud de dispensación enviada',
      });
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
      const auth = await getAuthInstance();
      if (!auth || !auth.currentUser || auth.currentUser.uid !== patientId) {
        throw new Error('Usuario no autenticado');
      }
      
      const dbInst = await getDbInstance();
      if (!dbInst) {
        throw new Error('Database not available');
      }
      
      const payload = {
        led_intensity: config.ledIntensity,
        led_color_rgb: [config.ledColor.r, config.ledColor.g, config.ledColor.b],
        alarm_mode: config.alarmMode,
      };
      
      await setDoc(
        doc(dbInst, 'devices', deviceId),
        {
          desiredConfig: payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      
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
      const errorMsg = e?.message || 'Error al guardar configuración';
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
              await unlinkDeviceFromUser(caregiverId, deviceId);
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
            <Text style={styles.headerTitle}>Gestión de Dispositivo</Text>
          </View>

          {/* Success/Error Messages */}
          {success && (
            <View style={styles.messageContainer}>
              <SuccessMessage
                message={success}
                onDismiss={() => setSuccess(null)}
                autoDismiss={true}
                duration={5000}
              />
            </View>
          )}

          {error && (
            <View style={styles.messageContainer}>
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
                <Text style={styles.inputLabel}>ID del Dispositivo</Text>
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
                style={styles.linkButton}
              >
                Vincular Dispositivo
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
          <Text style={styles.headerTitle}>Gestión de Dispositivo</Text>
        </View>

        {/* Success/Error Messages */}
        {success && (
          <View style={styles.messageContainer}>
            <SuccessMessage
              message={success}
              onDismiss={() => setSuccess(null)}
              autoDismiss={true}
              duration={5000}
            />
          </View>
        )}

        {error && (
          <View style={styles.messageContainer}>
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
                  <Text style={styles.deviceLabel}>ID del Dispositivo</Text>
                  <Text style={styles.deviceIdText}>{deviceId}</Text>
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
            {deviceStats[deviceId] && (
              <>
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Batería</Text>
                  <Text style={styles.statsValue}>
                    {deviceStats[deviceId]?.battery != null ? `${deviceStats[deviceId]?.battery}%` : 'N/D'}
                  </Text>
                </View>
                
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Estado</Text>
                  <Text style={styles.statsValue}>
                    {deviceStats[deviceId]?.status ?? 'N/D'}
                  </Text>
                </View>

                {/* Expand/Collapse Button */}
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={toggleDeviceExpanded}
                  accessibilityLabel={expandedDevices.has(deviceId) ? 'Ocultar configuración' : 'Mostrar configuración'}
                  accessibilityRole="button"
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
                      initialAlarmMode={deviceStats[deviceId].alarmMode}
                      initialLedIntensity={deviceStats[deviceId].ledIntensity}
                      initialLedColor={deviceStats[deviceId].ledColor}
                      onSave={saveDeviceConfig}
                      loading={deviceStats[deviceId].saving}
                    />
                    
                    {deviceStats[deviceId].saveError && (
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

                {/* Dispense Button */}
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
                </View>
              </>
            )}
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
                    <Text style={styles.caregiverName}>{caregiver.name}</Text>
                    <Text style={styles.caregiverEmail}>{caregiver.email}</Text>
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
            <Text style={styles.sectionTitle}>Códigos de Conexión</Text>
            <Text style={styles.sectionSubtitle}>
              Códigos activos para conectar nuevos cuidadores
            </Text>
            <Button
              variant="primary"
              size="sm"
              onPress={handleGenerateCode}
              loading={generatingCode}
              disabled={generatingCode}
              accessibilityLabel="Generar nuevo código"
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
                    <Text style={styles.codeValue}>{codeData.code}</Text>
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
                    accessibilityLabel={`Compartir código ${codeData.code}`}
                  >
                    <Ionicons name="share-outline" size={16} color={colors.gray[700]} />
                    <Text style={styles.codeActionText}>Compartir</Text>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onPress={() => handleRevokeCode(codeData.code)}
                    style={styles.codeActionButton}
                    accessibilityLabel={`Revocar código ${codeData.code}`}
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
            <View style={styles.helpHeader}>
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

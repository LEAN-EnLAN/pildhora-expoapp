import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootState } from '../../src/store';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { unlinkDeviceFromUser } from '../../src/services/deviceLinking';
import { getDbInstance } from '../../src/services/firebase';
import { Button, Card, LoadingSpinner, ErrorMessage, SuccessMessage, AnimatedListItem, Collapsible } from '../../src/components/ui';
import { DeviceConfigPanel } from '../../src/components/shared/DeviceConfigPanel';
import { ScreenWrapper } from '../../src/components/caregiver';
import { useScrollViewPadding } from '../../src/hooks/useScrollViewPadding';
import { useCaregiverDevices, CaregiverLinkedDevice } from '../../src/hooks/useCaregiverDevices';
import { useDeviceState } from '../../src/hooks/useDeviceState';
import { colors, spacing, typography, shadows } from '../../src/theme/tokens';

export default function DeviceManagementScreen() {
  const router = useRouter();
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  // Layout dimensions for proper spacing
  const { contentPaddingBottom } = useScrollViewPadding();

  // Handle back navigation with haptics
  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/caregiver/dashboard');
  }, [router]);


  const [unlinkingDevice, setUnlinkingDevice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [savingConfig, setSavingConfig] = useState<Record<string, boolean>>({});

  // Fetch linked devices (includes those without patients)
  const { devices, isLoading: loadingDevices, error: devicesError, refetch } = useCaregiverDevices({
    caregiverId: userId || null,
    enabled: !!userId,
  });



  // Handle device unlinking with confirmation
  const handleUnlink = useCallback(async (deviceIdToUnlink: string, patientName?: string) => {
    if (!userId) {
      setErrorMessage('Debes iniciar sesión para desvincular un dispositivo');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirmar desvinculación',
      patientName
        ? `¿Estás seguro de que deseas desvincular el dispositivo del paciente ${patientName}?`
        : '¿Estás seguro de que deseas desvincular este dispositivo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            setUnlinkingDevice(deviceIdToUnlink);
            setErrorMessage(null);
            setSuccessMessage(null);

            try {
              await unlinkDeviceFromUser(userId, deviceIdToUnlink);
              setSuccessMessage('Dispositivo desvinculado exitosamente');

              // Refresh linked devices list
              await refetch();
            } catch (error: any) {
              console.error('[DeviceManagement] Error unlinking device:', error);
              setErrorMessage(error.userMessage || error.message || 'No se pudo desvincular el dispositivo');
            } finally {
              setUnlinkingDevice(null);
            }
          },
        },
      ]
    );
  }, [userId, refetch]);

  // Toggle device configuration panel
  const toggleDeviceExpanded = useCallback((deviceId: string) => {
    setExpandedDevices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  }, []);

  // Handle device configuration save
  const handleSaveConfig = useCallback(async (
    deviceId: string,
    config: {
      alarmMode: 'off' | 'sound' | 'led' | 'both';
      ledIntensity: number;
      ledColor: { r: number; g: number; b: number };
    }
  ) => {
    setSavingConfig(prev => ({ ...prev, [deviceId]: true }));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const db = await getDbInstance();
      if (!db) {
        throw new Error('No se pudo conectar a la base de datos');
      }

      // Update Firestore desiredConfig (Cloud Function will mirror to RTDB)
      const payload = {
        led_intensity: config.ledIntensity,
        led_color_rgb: [config.ledColor.r, config.ledColor.g, config.ledColor.b],
        alarm_mode: config.alarmMode,
      };

      await setDoc(
        doc(db, 'devices', deviceId),
        {
          desiredConfig: payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccessMessage('Configuración guardada exitosamente');
    } catch (error: any) {
      console.error('[DeviceManagement] Error saving config:', error);
      setErrorMessage(error.message || 'No se pudo guardar la configuración');
    } finally {
      setSavingConfig(prev => ({ ...prev, [deviceId]: false }));
    }
  }, []);

  // Render device card with status and configuration
  const renderDeviceCard = (device: CaregiverLinkedDevice, index: number) => {
    const deviceId = device.deviceId;
    const patientName = device.patient?.name;

    const isExpanded = expandedDevices.has(deviceId);
    const isSaving = savingConfig[deviceId] || false;
    const isUnlinking = unlinkingDevice === deviceId;

    return (
      <AnimatedListItem key={deviceId} index={index} delay={100}>
        <Card variant="outlined" padding="md" style={styles.deviceCard}>
          {/* Device Header */}
          <View style={styles.deviceHeader}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceId}>{deviceId}</Text>
              {patientName ? (
                <Text style={styles.patientName}>Paciente: {patientName}</Text>
              ) : (
                <View style={styles.waitingBadge}>
                  <Ionicons name="time-outline" size={14} color={colors.warning[600]} />
                  <Text style={styles.waitingText}>Esperando vinculación de paciente</Text>
                </View>
              )}
            </View>
            <Button
              onPress={() => handleUnlink(deviceId, patientName)}
              variant="danger"
              size="sm"
              loading={isUnlinking}
              disabled={isUnlinking}
              accessibilityLabel={`Desvincular dispositivo ${patientName ? `de ${patientName}` : ''}`}
            >
              Desvincular
            </Button>
          </View>

          {/* Device Status */}
          <DeviceStatusSection deviceId={deviceId} />

          {/* Expand/Collapse Button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleDeviceExpanded(deviceId)}
            accessibilityLabel={isExpanded ? 'Ocultar configuración' : 'Mostrar configuración'}
            accessibilityHint={isExpanded ? 'Colapsa el panel de configuración del dispositivo' : 'Expande el panel de configuración del dispositivo'}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
          >
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.primary[500]}
              accessible={false}
            />
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Ocultar configuración' : 'Mostrar configuración'}
            </Text>
          </TouchableOpacity>

          {/* Device Configuration Panel (Expanded) */}
          <Collapsible collapsed={!isExpanded}>
            <View style={styles.configSection}>
              <DeviceConfigPanelWrapper
                deviceId={deviceId}
                onSave={(config) => handleSaveConfig(deviceId, config)}
                loading={isSaving}
              />
            </View>
          </Collapsible>
        </Card>
      </AnimatedListItem>
    );
  };

  return (
    <ScreenWrapper applyTopPadding={false}>
      {/* Back Button Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          accessibilityLabel="Volver al tablero"
          accessibilityHint="Regresa al tablero principal del cuidador"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          <Text style={styles.backButtonText}>Tablero</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Dispositivos</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}>
        {/* Success/Error Messages */}
        {successMessage && (
          <View style={styles.messageContainer}>
            <SuccessMessage
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            />
          </View>
        )}

        {errorMessage && (
          <View style={styles.messageContainer}>
            <ErrorMessage
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              variant="banner"
            />
          </View>
        )}

        {devicesError && (
          <View style={styles.messageContainer}>
            <ErrorMessage
              message="Error al cargar dispositivos vinculados"
              variant="banner"
            />
          </View>
        )}

        {/* Link New Device Section */}
        <View style={styles.section}>
          <Card variant="elevated" padding="lg">
            <View style={styles.sectionHeader}>
              <Ionicons name="hardware-chip-outline" size={24} color={colors.primary[500]} />
              <Text style={styles.sectionTitle}>Vincular Nuevo Dispositivo</Text>
            </View>

            <Text style={styles.sectionDescription}>
              Para vincular un nuevo dispositivo, necesitas un código de invitación del paciente.
            </Text>

            <Button
              onPress={() => router.push('/caregiver/device-connection')}
              variant="primary"
              size="lg"
              fullWidth
              accessibilityLabel="Vincular con código"
              leftIcon={<Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />}
            >
              Ingresar Código de Invitación
            </Button>
          </Card>
        </View>

        {/* Linked Devices Section */}
        <View style={styles.section}>
          <Card variant="elevated" padding="lg">
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={24} color={colors.primary[500]} />
              <Text style={styles.sectionTitle}>Dispositivos Vinculados</Text>
            </View>

            {loadingDevices ? (
              <LoadingSpinner
                size="large"
                message="Cargando dispositivos..."
              />
            ) : devices.length === 0 ? (
              <View
                style={styles.emptyState}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="No hay dispositivos vinculados. Vincula un dispositivo para comenzar a monitorear pacientes"
              >
                <Ionicons name="hardware-chip-outline" size={48} color={colors.gray[300]} accessible={false} />
                <Text style={styles.emptyStateText}>
                  No hay dispositivos vinculados
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Vincula un dispositivo para comenzar a monitorear pacientes
                </Text>
              </View>
            ) : (
              <View style={styles.devicesList}>
                {devices
                  .map((device, index) => renderDeviceCard(device, index))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

// Component to display device status with real-time updates
const DeviceStatusSection: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const { deviceState, isLoading } = useDeviceState({ deviceId, enabled: true });

  if (isLoading) {
    return (
      <View style={styles.statusSection}>
        <LoadingSpinner size="small" message="Cargando estado..." />
      </View>
    );
  }

  const batteryLevel = deviceState?.battery_level ?? null;
  const isOnline = deviceState?.is_online ?? false;
  const currentStatus = deviceState?.current_status ?? 'N/D';

  return (
    <View
      style={styles.statusSection}
      accessible={true}
      accessibilityLabel={`Estado del dispositivo: ${isOnline ? 'En línea' : 'Desconectado'}, Batería: ${batteryLevel !== null ? `${batteryLevel} por ciento` : 'no disponible'}, Estado actual: ${currentStatus}`}
      accessibilityRole="summary"
    >
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <View style={styles.statusLabel}>
            <Ionicons
              name={isOnline ? 'wifi' : 'wifi-outline'}
              size={16}
              color={isOnline ? colors.success[500] : colors.gray[400]}
              accessible={false}
            />
            <Text style={styles.statusLabelText}>Estado</Text>
          </View>
          <Text style={[styles.statusValue, isOnline && styles.statusValueOnline]}>
            {isOnline ? 'En línea' : 'Desconectado'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <View style={styles.statusLabel}>
            <Ionicons
              name="battery-half"
              size={16}
              color={batteryLevel && batteryLevel > 20 ? colors.success[500] : colors.warning[500]}
              accessible={false}
            />
            <Text style={styles.statusLabelText}>Batería</Text>
          </View>
          <Text style={styles.statusValue}>
            {batteryLevel !== null ? `${batteryLevel}%` : 'N/D'}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <View style={styles.statusLabel}>
            <Ionicons name="information-circle-outline" size={16} color={colors.gray[400]} accessible={false} />
            <Text style={styles.statusLabelText}>Estado actual</Text>
          </View>
          <Text style={styles.statusValue}>{currentStatus}</Text>
        </View>
      </View>
    </View>
  );
};

// Wrapper component to fetch and pass device config to DeviceConfigPanel
const DeviceConfigPanelWrapper: React.FC<{
  deviceId: string;
  onSave: (config: any) => void;
  loading: boolean;
}> = ({ deviceId, onSave, loading }) => {
  const [config, setConfig] = useState<{
    alarmMode: 'off' | 'sound' | 'led' | 'both';
    ledIntensity: number;
    ledColor: { r: number; g: number; b: number };
  } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const db = await getDbInstance();
        if (!db) return;

        const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
        if (deviceDoc.exists()) {
          const data = deviceDoc.data();
          const desired = data?.desiredConfig || {};

          setConfig({
            alarmMode: (desired?.alarm_mode as any) ?? 'both',
            ledIntensity: (desired?.led_intensity as number) ?? 512,
            ledColor: {
              r: (desired?.led_color_rgb?.[0] as number) ?? 255,
              g: (desired?.led_color_rgb?.[1] as number) ?? 255,
              b: (desired?.led_color_rgb?.[2] as number) ?? 255,
            },
          });
        } else {
          // Default config
          setConfig({
            alarmMode: 'both',
            ledIntensity: 512,
            ledColor: { r: 255, g: 255, b: 255 },
          });
        }
      } catch (error: any) {
        // Handle permission errors gracefully (expected when caregiver has no device link)
        if (error?.code === 'permission-denied') {
          console.log('[DeviceConfigPanelWrapper] No permission to read device config - using defaults');
        } else {
          console.error('[DeviceConfigPanelWrapper] Error fetching config:', error);
        }
        // Set default config on error
        setConfig({
          alarmMode: 'both',
          ledIntensity: 512,
          ledColor: { r: 255, g: 255, b: 255 },
        });
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [deviceId]);

  if (loadingConfig || !config) {
    return <LoadingSpinner size="small" message="Cargando configuración..." />;
  }

  return (
    <DeviceConfigPanel
      deviceId={deviceId}
      initialAlarmMode={config.alarmMode}
      initialLedIntensity={config.ledIntensity}
      initialLedColor={config.ledColor}
      onSave={onSave}
      loading={loading}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },

  devicesList: {
    gap: spacing.md,
  },
  deviceCard: {
    marginBottom: spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  deviceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  deviceId: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  patientName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  waitingText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning[600],
    fontWeight: typography.fontWeight.medium,
  },
  statusSection: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  statusLabelText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.medium,
  },
  statusValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
  },
  statusValueOnline: {
    color: colors.success[600],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minHeight: 44,
  },
  expandButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
  },
  configSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

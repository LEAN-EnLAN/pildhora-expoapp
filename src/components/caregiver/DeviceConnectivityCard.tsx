import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';
import { getDbInstance } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { DeviceConnectivityCardProps } from '../../types';
import { unlinkDeviceFromUser } from '../../services/deviceLinking';
import { useDeviceState } from '../../hooks/useDeviceState';

export const DeviceConnectivityCard: React.FC<DeviceConnectivityCardProps> = React.memo(({
  deviceId,
  patientId,
  onManageDevice,
  onDeviceUnlinked,
  style
}) => {
  // Use custom hook for real-time device state
  const {
    deviceState,
    isLoading: deviceLoading,
    error: deviceError
  } = useDeviceState({
    deviceId,
    enabled: !!deviceId
  });

  const [deviceConfig, setDeviceConfig] = useState<any>(null);
  const [unlinking, setUnlinking] = useState<boolean>(false);

  // Fade-in animation for content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger animation when data loads
  useEffect(() => {
    if (!deviceLoading && deviceState) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [deviceLoading, deviceState, fadeAnim]);

  // Set up Firestore listener for device configuration
  useEffect(() => {
    if (!deviceId) {
      setDeviceConfig(null);
      return;
    }

    let firestoreUnsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupConfigListener = async () => {
      try {
        const db = await getDbInstance();
        if (!db) {
          console.warn('[DeviceConnectivityCard] Firestore not initialized');
          return;
        }

        const deviceDocRef = doc(db, 'devices', deviceId);

        firestoreUnsubscribe = onSnapshot(
          deviceDocRef,
          (snapshot) => {
            if (!mounted) return;

            if (snapshot.exists()) {
              const data = snapshot.data();
              setDeviceConfig(data?.desiredConfig || null);
              console.log('[DeviceConnectivityCard] Device config loaded:', data?.desiredConfig);
            } else {
              setDeviceConfig(null);
            }
          },
          (err) => {
            if (!mounted) return;
            console.error('[DeviceConnectivityCard] Firestore listener error:', err);
            // Don't set error state for config - it's optional
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        console.error('[DeviceConnectivityCard] Config setup error:', err);
        // Don't set error state for config - it's optional
      }
    };

    setupConfigListener();

    // Cleanup listener on unmount or device change
    return () => {
      mounted = false;
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  }, [deviceId]);

  // Determine online status
  const isOnline = useMemo(() => {
    if (!deviceState) return false;
    return deviceState.is_online;
  }, [deviceState]);

  // Get battery level
  const batteryLevel = useMemo(() => {
    if (!deviceState) return null;
    return deviceState.battery_level;
  }, [deviceState]);

  // Get battery color based on level
  const batteryColor = useMemo(() => {
    if (batteryLevel === null || batteryLevel === undefined) return colors.gray[400];
    if (batteryLevel > 50) return colors.success[500];
    if (batteryLevel > 20) return colors.warning[500];
    return colors.error[500];
  }, [batteryLevel]);

  // Get status color
  const statusColor = useMemo(() => {
    if (!isOnline) return colors.gray[400];
    return colors.success[500];
  }, [isOnline]);

  // Format last seen timestamp
  const lastSeenText = useMemo(() => {
    if (!deviceState?.last_seen) return null;

    try {
      const lastSeenDate = new Date(deviceState.last_seen);
      return getRelativeTimeString(lastSeenDate);
    } catch (err) {
      console.error('[DeviceConnectivityCard] Error formatting last seen:', err);
      return null;
    }
  }, [deviceState?.last_seen]);

  // Accessibility labels
  const batteryLabel = useMemo(() => {
    if (batteryLevel === null || batteryLevel === undefined) {
      return 'Nivel de batería no disponible';
    }
    if (batteryLevel > 50) {
      return `Nivel de batería ${batteryLevel} por ciento, bueno`;
    }
    if (batteryLevel > 20) {
      return `Nivel de batería ${batteryLevel} por ciento, bajo`;
    }
    return `Nivel de batería ${batteryLevel} por ciento, crítico`;
  }, [batteryLevel]);

  const statusLabel = useMemo(() => {
    if (isOnline) {
      return 'Dispositivo en línea';
    }
    return `Dispositivo desconectado${lastSeenText ? `, visto por última vez ${lastSeenText}` : ''}`;
  }, [isOnline, lastSeenText]);

  // Handle manage device button press
  const handleManageDevice = useCallback(() => {
    if (onManageDevice) {
      onManageDevice();
    }
  }, [onManageDevice]);

  // Handle unlink device button press
  const handleUnlinkDevice = useCallback(async () => {
    if (!deviceId || !patientId) {
      Alert.alert('Error', 'No se puede desenlazar: información del dispositivo o paciente no disponible');
      return;
    }

    Alert.alert(
      'Desenlazar dispositivo',
      `¿Estás seguro de que deseas desenlazar el dispositivo ${deviceId} del paciente?\n\nEsto eliminará la conexión entre el dispositivo y el paciente.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desenlazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUnlinking(true);
              console.log('[DeviceConnectivityCard] Unlinking device:', deviceId, 'from patient:', patientId);

              await unlinkDeviceFromUser(patientId, deviceId);

              Alert.alert(
                'Éxito',
                'El dispositivo ha sido desenlazado exitosamente',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Notify parent component that device was unlinked
                      if (onDeviceUnlinked) {
                        onDeviceUnlinked();
                      }
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('[DeviceConnectivityCard] Error unlinking device:', error);
              Alert.alert(
                'Error',
                error?.userMessage || error?.message || 'No se pudo desenlazar el dispositivo. Por favor, intenta nuevamente.'
              );
            } finally {
              setUnlinking(false);
            }
          },
        },
      ]
    );
  }, [deviceId, patientId, onDeviceUnlinked]);

  // Render loading state
  if (deviceLoading) {
    return (
      <Card
        variant="elevated"
        padding="lg"
        style={style}
        accessibilityLabel="Cargando estado del dispositivo"
      >
        <Text style={styles.title}>Conectividad del dispositivo</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary['500']} />
          <Text style={styles.loadingText}>Conectando...</Text>
        </View>
      </Card>
    );
  }

  // Render error state
  if (deviceError) {
    return (
      <Card
        variant="elevated"
        padding="lg"
        style={style}
        accessibilityLabel={`Error: ${deviceError.message}`}
      >
        <Text style={styles.title}>Conectividad del dispositivo</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{deviceError.message || 'Error al conectar con el dispositivo'}</Text>
        </View>
      </Card>
    );
  }

  // Render no device state
  if (!deviceId) {
    return (
      <Card
        variant="elevated"
        padding="lg"
        style={style}
        accessibilityLabel="No hay dispositivo vinculado"
      >
        <Text style={styles.title}>Conectividad del dispositivo</Text>
        <View style={styles.noDeviceContainer}>
          <Text style={styles.noDeviceText}>
            No hay dispositivo vinculado
          </Text>
          {onManageDevice && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleManageDevice}
              style={styles.manageButton}
              accessibilityLabel="Vincular dispositivo"
              accessibilityHint="Abre la pantalla de gestión de dispositivos para vincular un nuevo dispositivo"
            >
              Vincular dispositivo
            </Button>
          )}
        </View>
      </Card>
    );
  }

  // Get additional device state info
  const currentStatus = deviceState?.current_status || 'N/D';
  const wifiSignal = deviceState?.wifi_signal_strength;
  // Get alarm mode from Firestore config (desiredConfig) or fallback to RTDB state
  const alarmMode = deviceConfig?.alarm_mode || deviceState?.alarm_mode || 'N/D';
  // Get LED intensity from Firestore config or fallback to RTDB state
  const ledIntensity = deviceConfig?.led_intensity ?? deviceState?.led_intensity;

  return (
    <Card
      variant="elevated"
      padding="none"
      style={style}
      accessibilityLabel={`Estado del dispositivo: ${statusLabel}, ${batteryLabel}`}
    >
      {/* Header with gradient background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="hardware-chip" size={24} color={colors.primary[600]} />
            </View>
            <View>
              <Text style={styles.title}>Dispositivo</Text>
              <Text style={styles.subtitle}>Estado de conexión</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOnline ? colors.success[50] : colors.gray[100] }]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success[500] : colors.gray[400] }]} />
            <Text style={[styles.statusBadgeText, { color: isOnline ? colors.success[700] : colors.gray[600] }]}>
              {isOnline ? 'En línea' : 'Fuera de línea'}
            </Text>
          </View>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Device ID with icon */}
        <View style={styles.deviceIdContainer}>
          <Text style={styles.deviceIdLabel}>ID del Dispositivo</Text>
          <Text
            style={styles.deviceIdValue}
            accessible={true}
            accessibilityLabel={`ID del dispositivo: ${deviceId}`}
          >
            {deviceId}
          </Text>
        </View>

        {/* Main Status Grid */}
        <View style={styles.statusGrid}>
          {/* Battery Level */}
          <View
            style={styles.statusCard}
            accessible={true}
            accessibilityLabel={batteryLabel}
          >
            <Text style={styles.statusCardLabel}>Batería</Text>
            <View style={styles.statusCardValueContainer}>
              <Text style={[styles.statusCardValue, { color: batteryColor }]}>
                {batteryLevel !== null && batteryLevel !== undefined
                  ? `${batteryLevel}%`
                  : 'N/A'}
              </Text>
              <View style={[styles.batteryBar, { backgroundColor: colors.gray[200] }]}>
                <View
                  style={[
                    styles.batteryBarFill,
                    {
                      width: `${batteryLevel || 0}%`,
                      backgroundColor: batteryColor
                    }
                  ]}
                />
              </View>
            </View>
          </View>

          {/* WiFi Signal */}
          {wifiSignal !== null && wifiSignal !== undefined && (
            <View
              style={styles.statusCard}
              accessible={true}
              accessibilityLabel={`Señal WiFi: ${wifiSignal} dBm`}
            >
              <Text style={styles.statusCardLabel}>WiFi</Text>
              <View style={styles.statusCardValueContainer}>
                <Text style={styles.statusCardValue}>
                  {wifiSignal} dBm
                </Text>
                <Text style={styles.statusCardSubtext}>
                  {wifiSignal > -50 ? 'Excelente' : wifiSignal > -70 ? 'Buena' : 'Débil'}
                </Text>
              </View>
            </View>
          )}

          {/* Current Status */}
          <View
            style={styles.statusCard}
            accessible={true}
            accessibilityLabel={`Estado actual: ${currentStatus}`}
          >
            <Text style={styles.statusCardLabel}>Estado Actual</Text>
            <View style={styles.statusCardValueContainer}>
              <Text style={styles.statusCardValue} numberOfLines={2}>
                {currentStatus}
              </Text>
            </View>
          </View>

          {/* Alarm Mode */}
          <View
            style={styles.statusCard}
            accessible={true}
            accessibilityLabel={`Modo de alarma: ${alarmMode}`}
          >
            <Text style={styles.statusCardLabel}>Modo Alarma</Text>
            <View style={styles.statusCardValueContainer}>
              <Text style={styles.statusCardValue}>
                {alarmMode === 'both' ? '🔔 + 💡' :
                  alarmMode === 'sound' ? '🔔' :
                    alarmMode === 'led' ? '💡' :
                      alarmMode === 'off' ? 'Apagado' : 'N/D'}
              </Text>
            </View>
          </View>
        </View>

        {/* LED Intensity (if available) */}
        {ledIntensity !== null && ledIntensity !== undefined && (
          <View style={styles.ledIntensityContainer}>
            <Text style={styles.ledIntensityLabel}>Intensidad LED: {Math.round((ledIntensity / 1023) * 100)}%</Text>
            <View style={styles.ledIntensityBar}>
              <View
                style={[
                  styles.ledIntensityBarFill,
                  { width: `${(ledIntensity / 1023) * 100}%` }
                ]}
              />
            </View>
          </View>
        )}

        {/* Last Seen (only when offline) */}
        {!isOnline && lastSeenText && (
          <View style={styles.lastSeenContainer}>
            <Text
              style={styles.lastSeen}
              accessible={true}
              accessibilityLabel={`Visto por última vez ${lastSeenText}`}
            >
              ⏱️ Visto por última vez: {lastSeenText}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onManageDevice && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleManageDevice}
              style={styles.actionButton}
              accessibilityLabel="Gestionar dispositivo"
              accessibilityHint="Abre la pantalla de gestión de dispositivos"
            >
              Gestionar
            </Button>
          )}

          {patientId && (
            <Button
              variant="danger"
              size="sm"
              onPress={handleUnlinkDevice}
              loading={unlinking}
              disabled={unlinking}
              style={styles.actionButton}
              accessibilityLabel="Desenlazar dispositivo"
              accessibilityHint="Elimina la conexión entre el dispositivo y el paciente"
            >
              {unlinking ? 'Desenlazando...' : 'Desenlazar'}
            </Button>
          )}
        </View>
      </Animated.View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  deviceIdContainer: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  deviceIdLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  deviceIdValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    fontFamily: 'monospace',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statusCardLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  statusCardValueContainer: {
    gap: spacing.xs,
  },
  statusCardValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  statusCardSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  batteryBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  batteryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  ledIntensityContainer: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: 8,
  },
  ledIntensityLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  ledIntensityBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  ledIntensityBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  lastSeenContainer: {
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning[500],
  },
  lastSeen: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[600],
    fontWeight: typography.fontWeight.medium,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  manageButton: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  errorContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error['500'],
    textAlign: 'center',
  },
  noDeviceContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  noDeviceText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

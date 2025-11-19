import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../ui/Card';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';
import { useDeviceLinks } from '../../../hooks/useDeviceLinks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { usePatientAutonomousMode } from '../../../hooks/usePatientAutonomousMode';
import { getRdbInstance, getDbInstance } from '../../../services/firebase';
import { ref, onValue, off } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

interface DeviceStatusCardProps {
  deviceId?: string;
  style?: any;
}

interface DeviceData {
  batteryLevel: number | null;
  status: 'idle' | 'dispensing' | 'error' | 'offline' | 'pending';
  isOnline: boolean;
  lastSeen: number | null;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = React.memo(({
  deviceId,
  style
}) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const patientId = user?.id;

  // Local state for device data
  const [deviceData, setDeviceData] = useState<DeviceData>({
    batteryLevel: null,
    status: 'offline',
    isOnline: false,
    lastSeen: null,
  });
  const [loading, setLoading] = useState(true);

  // Real-time device links listener
  const { caregiverCount, hasCaregivers, isLoading: linksLoading } = useDeviceLinks({
    deviceId: deviceId || undefined,
    enabled: !!deviceId,
  });

  // Real-time autonomous mode listener
  const { isAutonomous, isLoading: autonomousModeLoading } = usePatientAutonomousMode(patientId);

  // Fetch device data directly from Firebase RTDB
  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupDeviceListener = async () => {
      try {
        console.log('[DeviceStatusCard] Setting up listener for device:', deviceId);
        const rdb = await getRdbInstance();

        if (!rdb) {
          console.warn('[DeviceStatusCard] RTDB not available');
          setLoading(false);
          return;
        }

        const deviceStateRef = ref(rdb, `devices/${deviceId}/state`);

        unsubscribe = onValue(deviceStateRef, (snapshot) => {
          if (!mounted) return;

          if (snapshot.exists()) {
            const state = snapshot.val();
            console.log('[DeviceStatusCard] Received device state:', state);

            // Parse battery level
            let battery: number | null = null;
            const rawBattery = state?.battery_level ?? state?.batteryPercent ?? state?.battery_percentage ?? null;
            if (typeof rawBattery === 'number') {
              battery = Math.round(rawBattery);
            } else if (typeof rawBattery === 'string') {
              const parsed = parseFloat(rawBattery);
              battery = isNaN(parsed) ? null : Math.round(parsed);
            }

            // Parse status
            const rawStatus = state?.current_status || 'offline';
            const isOnline = state?.is_online === true;

            let normalizedStatus: 'idle' | 'dispensing' | 'error' | 'offline' | 'pending' = 'offline';

            if (!isOnline) {
              normalizedStatus = 'offline';
            } else {
              switch (rawStatus.toLowerCase()) {
                case 'pending':
                  normalizedStatus = 'pending';
                  break;
                case 'dispensing':
                  normalizedStatus = 'dispensing';
                  break;
                case 'error':
                case 'alarm_sounding':
                case 'alarm_active':
                  normalizedStatus = 'error';
                  break;
                case 'idle':
                case 'dose_taken':
                case 'dose_missed':
                default:
                  normalizedStatus = 'idle';
                  break;
              }
            }

            setDeviceData({
              batteryLevel: battery,
              status: normalizedStatus,
              isOnline,
              lastSeen: state?.last_seen || null,
            });
            setLoading(false);
          } else {
            console.log('[DeviceStatusCard] No device state found in RTDB');
            setDeviceData({
              batteryLevel: null,
              status: 'offline',
              isOnline: false,
              lastSeen: null,
            });
            setLoading(false);
          }
        }, (error) => {
          console.error('[DeviceStatusCard] Error listening to device state:', error);
          setLoading(false);
        });

      } catch (error) {
        console.error('[DeviceStatusCard] Error setting up device listener:', error);
        setLoading(false);
      }
    };

    setupDeviceListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [deviceId]);

  const statusText = useMemo(() => {
    if (!deviceData.isOnline) return 'Desconectado';
    switch (deviceData.status) {
      case 'pending':
        return 'Sincronizando...';
      case 'idle':
        return 'Conectado';
      case 'dispensing':
        return 'Dispensando';
      case 'error':
        return 'Error';
      case 'offline':
        return 'Desconectado';
      default:
        return 'Conectado';
    }
  }, [deviceData]);

  // Connection mode text and color
  const connectionMode = useMemo(() => {
    if (!deviceId) return null;
    if (linksLoading || autonomousModeLoading) {
      return { text: 'Verificando modo...', color: colors.gray[400], icon: 'time-outline' as const };
    }

    if (isAutonomous) {
      return {
        text: hasCaregivers
          ? `Modo Autónomo (${caregiverCount} cuidador${caregiverCount > 1 ? 'es' : ''} sin acceso)`
          : 'Modo Autónomo',
        color: colors.warning[600],
        icon: 'eye-off' as const,
      };
    }

    // Default to Supervised Mode if not Autonomous
    return {
      text: hasCaregivers
        ? (caregiverCount === 1 ? 'Modo Supervisado (1 cuidador)' : `Modo Supervisado (${caregiverCount} cuidadores)`)
        : 'Modo Supervisado (Sin cuidadores)',
      color: colors.primary[500],
      icon: 'eye' as const,
    };
  }, [deviceId, linksLoading, autonomousModeLoading, isAutonomous, hasCaregivers, caregiverCount]);

  const statusColor = useMemo(() => {
    if (!deviceData.isOnline || deviceData.status === 'offline') return colors.gray[400];
    switch (deviceData.status) {
      case 'pending':
        return colors.warning[500];
      case 'idle':
        return colors.success[500];
      case 'dispensing':
        return colors.primary[500];
      case 'error':
        return colors.error[500];
      default:
        return colors.gray[400];
    }
  }, [deviceData]);

  const batteryColor = useMemo(() => {
    if (deviceData.batteryLevel === null) return colors.gray[400];
    if (deviceData.batteryLevel > 50) return colors.success[500];
    if (deviceData.batteryLevel > 20) return colors.warning[500];
    return colors.error[500];
  }, [deviceData.batteryLevel]);

  const batteryIcon = useMemo(() => {
    if (deviceData.batteryLevel === null) return 'battery-dead-outline';
    if (deviceData.batteryLevel > 75) return 'battery-full';
    if (deviceData.batteryLevel > 50) return 'battery-half';
    if (deviceData.batteryLevel > 20) return 'battery-charging';
    return 'battery-dead';
  }, [deviceData.batteryLevel]);

  return (
    <TouchableOpacity
      onPress={() => router.push('/patient/device-settings')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Ir a configuración del dispositivo"
    >
      <Card
        variant="elevated"
        padding="lg"
        style={style}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mi dispositivo</Text>
          <Ionicons name="settings-outline" size={20} color={colors.gray[500]} />
        </View>

        {deviceId ? (
          <View style={styles.content}>
            {/* Connection Mode Banner - Always visible if data available */}
            {connectionMode && (
              <View
                style={[
                  styles.modeBanner,
                  { backgroundColor: `${connectionMode.color}15` }
                ]}
              >
                <Ionicons
                  name={connectionMode.icon}
                  size={20}
                  color={connectionMode.color}
                />
                <Text style={[styles.modeText, { color: connectionMode.color }]}>
                  {connectionMode.text}
                </Text>
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando estado del dispositivo...</Text>
              </View>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.label}>Batería</Text>
                    <View style={styles.valueContainer}>
                      <Ionicons
                        name={batteryIcon}
                        size={20}
                        color={batteryColor}
                      />
                      <Text style={[styles.value, { color: batteryColor }]}>
                        {deviceData.batteryLevel !== null
                          ? `${deviceData.batteryLevel}%`
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.label}>Estado</Text>
                    <View style={styles.valueContainer}>
                      <View
                        style={[styles.indicator, { backgroundColor: statusColor }]}
                      />
                      <Text style={styles.value}>{statusText}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.deviceIdContainer}>
                  <Ionicons name="hardware-chip-outline" size={16} color={colors.gray[500]} />
                  <Text style={styles.deviceId}>ID: {deviceId}</Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.noDeviceContainer}>
            <Ionicons name="link-outline" size={32} color={colors.gray[400]} />
            <Text style={styles.noDeviceText}>
              No hay dispositivo vinculado
            </Text>
            <Text style={styles.noDeviceSubtext}>
              Toca aquí para vincular un dispositivo
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  content: {
    gap: spacing.md,
  },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  modeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  deviceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  deviceId: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontFamily: 'monospace',
  },
  noDeviceContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  noDeviceText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    textAlign: 'center',
  },
  noDeviceSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

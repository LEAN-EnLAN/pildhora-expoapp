import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';
import { getRdbInstance } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { DeviceState, DeviceConnectivityCardProps } from '../../types';
import { unlinkDeviceFromUser } from '../../services/deviceLinking';

export const DeviceConnectivityCard: React.FC<DeviceConnectivityCardProps> = React.memo(({
  deviceId,
  patientId,
  onManageDevice,
  onDeviceUnlinked,
  style
}) => {
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<boolean>(false);
  
  // Fade-in animation for content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Set up RTDB listener for device state
  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      setDeviceState(null);
      setError(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupListener = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Clear previous device state when switching devices
        setDeviceState(null);

        const rtdb = await getRdbInstance();
        if (!rtdb) {
          throw new Error('Firebase Realtime Database not initialized');
        }

        const deviceRef = ref(rtdb, `devices/${deviceId}/state`);
        
        unsubscribe = onValue(
          deviceRef,
          (snapshot) => {
            if (!mounted) return;
            
            const data = snapshot.val() as DeviceState | null;
            setDeviceState(data);
            setLoading(false);
            setError(null);
            
            // Fade in content when data loads
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          },
          (err) => {
            if (!mounted) return;
            
            console.error('[DeviceConnectivityCard] RTDB listener error:', err);
            setError('Error al conectar con el dispositivo');
            setLoading(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        
        console.error('[DeviceConnectivityCard] Setup error:', err);
        setError(err.message || 'Error al inicializar');
        setLoading(false);
      }
    };

    setupListener();

    // Cleanup listener on unmount or device change
    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
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
    if (batteryLevel > 50) return colors.success;
    if (batteryLevel > 20) return colors.warning['500'];
    return colors.error['500'];
  }, [batteryLevel]);

  // Get status color
  const statusColor = useMemo(() => {
    if (!isOnline) return colors.gray[400];
    return colors.success;
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
  if (loading) {
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
  if (error) {
    return (
      <Card 
        variant="elevated" 
        padding="lg" 
        style={style}
        accessibilityLabel={`Error: ${error}`}
      >
        <Text style={styles.title}>Conectividad del dispositivo</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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

  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      style={style}
      accessibilityLabel={`Estado del dispositivo: ${statusLabel}, ${batteryLabel}`}
    >
      <Text style={styles.title}>Conectividad del dispositivo</Text>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Device ID */}
        <Text 
          style={styles.deviceId}
          accessible={true}
          accessibilityLabel={`ID del dispositivo: ${deviceId}`}
        >
          ID: {deviceId}
        </Text>

        {/* Status and Battery Row */}
        <View style={styles.infoRow}>
          {/* Online/Offline Status */}
          <View 
            style={styles.infoItem}
            accessible={true}
            accessibilityLabel={statusLabel}
          >
            <Text style={styles.label}>Estado</Text>
            <View style={styles.valueContainer}>
              <View 
                style={[styles.statusIndicator, { backgroundColor: statusColor }]}
                accessible={false}
              />
              <Text style={styles.value}>
                {isOnline ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>

          {/* Battery Level */}
          <View 
            style={styles.infoItem}
            accessible={true}
            accessibilityLabel={batteryLabel}
          >
            <Text style={styles.label}>Batería</Text>
            <View style={styles.valueContainer}>
              <View 
                style={[styles.batteryIndicator, { backgroundColor: batteryColor }]}
                accessible={false}
              />
              <Text style={styles.value}>
                {batteryLevel !== null && batteryLevel !== undefined 
                  ? `${batteryLevel}%` 
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Last Seen (only when offline) */}
        {!isOnline && lastSeenText && (
          <Text 
            style={styles.lastSeen}
            accessible={true}
            accessibilityLabel={`Visto por última vez ${lastSeenText}`}
          >
            Visto por última vez: {lastSeenText}
          </Text>
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
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  content: {
    gap: spacing.md,
  },
  deviceId: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
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
    gap: spacing.sm,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  batteryIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  lastSeen: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../ui/Card';
import { colors, spacing, typography } from '../../../theme/tokens';

interface DeviceStatusCardProps {
  deviceId?: string;
  batteryLevel?: number | null;
  status: 'idle' | 'dispensing' | 'error' | 'offline';
  isOnline: boolean;
  style?: any;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = React.memo(({
  deviceId,
  batteryLevel,
  status,
  isOnline,
  style
}) => {
  const statusText = useMemo(() => {
    if (!isOnline) return 'Desconectado';
    switch (status) {
      case 'idle':
        return 'Activo';
      case 'dispensing':
        return 'Dispensando';
      case 'error':
        return 'Error';
      case 'offline':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  }, [isOnline, status]);

  const statusColor = useMemo(() => {
    if (!isOnline || status === 'offline') return colors.gray[400];
    switch (status) {
      case 'idle':
        return colors.success;
      case 'dispensing':
        return colors.info;
      case 'error':
        return typeof colors.error === 'string' ? colors.error : colors.error[500];
      default:
        return colors.gray[400];
    }
  }, [isOnline, status]);

  const batteryColor = useMemo(() => {
    if (batteryLevel === null || batteryLevel === undefined) return colors.gray[400];
    if (batteryLevel > 50) return colors.success;
    if (batteryLevel > 20) return typeof colors.warning === 'string' ? colors.warning : colors.warning[500];
    return typeof colors.error === 'string' ? colors.error : colors.error[500];
  }, [batteryLevel]);

  const batteryLabel = useMemo(() => {
    if (batteryLevel === null || batteryLevel === undefined) return 'Battery level not available';
    if (batteryLevel > 50) return `Battery level ${batteryLevel} percent, good`;
    if (batteryLevel > 20) return `Battery level ${batteryLevel} percent, low`;
    return `Battery level ${batteryLevel} percent, critical`;
  }, [batteryLevel]);

  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      style={style}
      accessibilityLabel={deviceId 
        ? `Device status: ${statusText}, ${batteryLabel}`
        : 'No device linked'
      }
    >
      <Text style={styles.title}>Mi dispositivo</Text>
      
      {deviceId ? (
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <View 
              style={styles.infoItem}
              accessible={true}
              accessibilityLabel={batteryLabel}
            >
              <Text style={styles.label}>Batería</Text>
              <View style={styles.valueContainer}>
                <View 
                  style={[styles.indicator, { backgroundColor: batteryColor }]}
                  accessible={false}
                />
                <Text style={styles.value}>
                  {batteryLevel !== null && batteryLevel !== undefined 
                    ? `${batteryLevel}%` 
                    : 'N/A'}
                </Text>
              </View>
            </View>
            
            <View 
              style={styles.infoItem}
              accessible={true}
              accessibilityLabel={`Device status: ${statusText}`}
            >
              <Text style={styles.label}>Estado</Text>
              <View style={styles.valueContainer}>
                <View 
                  style={[styles.indicator, { backgroundColor: statusColor }]}
                  accessible={false}
                />
                <Text style={styles.value}>{statusText}</Text>
              </View>
            </View>
          </View>
          
          <Text 
            style={styles.deviceId}
            accessible={true}
            accessibilityLabel={`Device ID: ${deviceId}`}
          >
            ID: {deviceId}
          </Text>
        </View>
      ) : (
        <View 
          style={styles.noDeviceContainer}
          accessible={true}
          accessibilityLabel="No device linked"
        >
          <Text style={styles.noDeviceText}>
            No hay dispositivo vinculado
          </Text>
        </View>
      )}
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
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  deviceId: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  noDeviceContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  noDeviceText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

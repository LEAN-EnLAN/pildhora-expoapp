import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { DeviceStatusBadge, DeviceStatusType } from './DeviceStatusBadge';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';
import type { DeviceState } from '../../../types';
import type { DeviceInfo } from '../../../hooks/useDeviceSettings';

interface DeviceInfoCardProps {
  deviceId: string;
  deviceInfo: DeviceInfo | null;
  deviceState: DeviceState | null;
  isOnline: boolean;
  onCopyId?: () => void;
}

export const DeviceInfoCard: React.FC<DeviceInfoCardProps> = React.memo(({
  deviceId,
  deviceInfo,
  deviceState,
  isOnline,
  onCopyId,
}) => {
  const handleCopyId = useCallback(() => {
    try {
      Clipboard.setString(deviceId);
      onCopyId?.();
    } catch (err) {
      // Fallback: just trigger callback
      onCopyId?.();
    }
  }, [deviceId, onCopyId]);

  const getStatus = (): DeviceStatusType => {
    if (!deviceState) return 'unknown';
    if (deviceState.current_status === 'error') return 'error';
    return isOnline ? 'online' : 'offline';
  };

  const getBatteryIcon = (): keyof typeof Ionicons.glyphMap => {
    const level = deviceState?.battery_level;
    if (level == null) return 'battery-half-outline';
    if (level >= 80) return 'battery-full';
    if (level >= 50) return 'battery-half-outline';
    if (level >= 20) return 'battery-half-outline';
    return 'battery-dead';
  };

  const getBatteryColor = (): string => {
    const level = deviceState?.battery_level;
    if (level == null) return colors.gray[400];
    if (level >= 50) return colors.success[500];
    if (level >= 20) return colors.warning[500];
    return colors.error[500];
  };

  const formatLastSeen = (): string => {
    const lastSeen = deviceState?.last_seen || deviceInfo?.lastSeen;
    if (!lastSeen) return 'N/D';
    
    const date = typeof lastSeen === 'number' ? new Date(lastSeen) : lastSeen;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  return (
    <Card variant="elevated" padding="lg">
      {/* Header with Device ID and Status */}
      <View style={styles.header}>
        <View style={styles.deviceIdContainer}>
          <Ionicons name="hardware-chip-outline" size={28} color={colors.primary[600]} />
          <View style={styles.deviceIdInfo}>
            <Text style={styles.label}>ID del dispositivo</Text>
            <TouchableOpacity
              onPress={handleCopyId}
              style={styles.idRow}
              accessibilityLabel={`ID del dispositivo: ${deviceId}. Toca para copiar.`}
              accessibilityRole="button"
            >
              <Text style={styles.deviceId} numberOfLines={1} ellipsizeMode="middle">
                {deviceId}
              </Text>
              <Ionicons name="copy-outline" size={16} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>
        <DeviceStatusBadge status={getStatus()} size="md" />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Battery */}
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons name={getBatteryIcon()} size={20} color={getBatteryColor()} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Batería</Text>
            <Text style={styles.statValue}>
              {deviceState?.battery_level != null ? `${Math.round(deviceState.battery_level)}%` : 'N/D'}
            </Text>
          </View>
        </View>

        {/* WiFi Signal */}
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons 
              name="wifi" 
              size={20} 
              color={deviceState?.wifi_signal_strength ? colors.primary[500] : colors.gray[400]} 
            />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>WiFi</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {deviceInfo?.wifiSSID || 'N/D'}
            </Text>
          </View>
        </View>

        {/* Last Seen */}
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons name="time-outline" size={20} color={colors.gray[500]} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Última conexión</Text>
            <Text style={styles.statValue}>{formatLastSeen()}</Text>
          </View>
        </View>

        {/* Firmware */}
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Ionicons name="code-slash-outline" size={20} color={colors.gray[500]} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Firmware</Text>
            <Text style={styles.statValue}>
              {deviceInfo?.firmwareVersion || 'N/D'}
            </Text>
          </View>
        </View>
      </View>

      {/* Current Status */}
      {deviceState?.current_status && (
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Estado actual:</Text>
          <Text style={styles.statusValue}>
            {deviceState.current_status === 'idle' ? 'Inactivo' :
             deviceState.current_status === 'dispensing' ? 'Dispensando' :
             deviceState.current_status === 'alarm_active' ? 'Alarma activa' :
             deviceState.current_status === 'PENDING' ? 'Pendiente' :
             deviceState.current_status === 'ALARM_SOUNDING' ? 'Alarma sonando' :
             deviceState.current_status === 'DOSE_TAKEN' ? 'Dosis tomada' :
             deviceState.current_status === 'DOSE_MISSED' ? 'Dosis perdida' :
             deviceState.current_status}
          </Text>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  deviceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  deviceIdInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    fontFamily: 'monospace',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.sm,
  },
  statusValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
  },
});

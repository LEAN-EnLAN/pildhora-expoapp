import React from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompactDeviceCardProps {
  deviceId?: string;
  deviceName?: string;
  isOnline?: boolean;
  batteryLevel?: number;
  lastSeen?: number; // timestamp
  signalStrength?: number; // 0-100 or 0-4
  status?: string; // 'IDLE', 'DISPENSING', etc.
  loading?: boolean;
}

export const CompactDeviceCard: React.FC<CompactDeviceCardProps> = ({
  deviceId,
  deviceName = 'Pastillero Inteligente',
  isOnline = false,
  batteryLevel,
  lastSeen,
  signalStrength,
  status = 'IDLE',
  loading = false,
}) => {
  // Helper for battery icon and color
  const getBatteryInfo = (level?: number) => {
    if (level === undefined) return { icon: 'battery-dead', color: colors.gray[400] };
    if (level >= 90) return { icon: 'battery-full', color: colors.success[500] };
    if (level >= 50) return { icon: 'battery-half', color: colors.success[500] };
    if (level >= 20) return { icon: 'battery-dead', color: colors.warning[500] }; // visual approx
    return { icon: 'battery-dead', color: colors.error[500] };
  };

  const { icon: batteryIcon, color: batteryColor } = getBatteryInfo(batteryLevel);

  // Helper for last seen text
  const getLastSeenText = () => {
    if (!lastSeen) return 'Nunca visto';
    return `Visto hace ${formatDistanceToNow(lastSeen, { addSuffix: false, locale: es })}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando estado del dispositivo...</Text>
      </View>
    );
  }

  if (!deviceId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.gray[400]} />
          <Text style={styles.noDeviceText}>No hay dispositivo vinculado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="hardware-chip-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.deviceName}>{deviceName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isOnline ? colors.success[100] : colors.error[100] }]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success[500] : colors.error[500] }]} />
          <Text style={[styles.statusText, { color: isOnline ? colors.success[700] : colors.error[700] }]}>
            {isOnline ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Grid Stats */}
      <View style={styles.statsGrid}>
        {/* Battery */}
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name={batteryIcon as any} size={20} color={batteryColor} />
          </View>
          <View>
            <Text style={styles.statLabel}>Batería</Text>
            <Text style={styles.statValue}>{batteryLevel !== undefined ? `${batteryLevel}%` : '--'}</Text>
          </View>
        </View>

        {/* Connectivity */}
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name={isOnline ? "wifi" : "wifi-outline"} size={20} color={isOnline ? colors.primary[500] : colors.gray[400]} />
          </View>
          <View>
            <Text style={styles.statLabel}>Señal</Text>
            <Text style={styles.statValue}>{isOnline ? 'Excelente' : 'Sin señal'}</Text>
          </View>
        </View>

        {/* Last Sync */}
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={20} color={colors.gray[500]} />
          </View>
          <View>
            <Text style={styles.statLabel}>Sincronización</Text>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {getLastSeenText()}
            </Text>
          </View>
        </View>

        {/* Current State */}
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="pulse-outline" size={20} color={colors.info[500]} />
          </View>
          <View>
            <Text style={styles.statLabel}>Estado</Text>
            <Text style={styles.statValue}>{status}</Text>
          </View>
        </View>
      </View>

      {/* Actions Footer (Optional) */}
      <View style={styles.footer}>
        <Text style={styles.deviceId}>ID: {deviceId}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statItem: {
    width: '48%', // Better fit
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
    flexShrink: 1, // Prevent overflow
  },
  footer: {
    marginTop: spacing.md,
    alignItems: 'flex-end',
  },
  deviceId: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    fontFamily: (typography as any)?.fontFamily?.mono || (Platform.OS === 'ios' ? 'Menlo' : 'monospace'),
  },
  loadingText: {
    textAlign: 'center',
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
  },
  noDeviceText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
  },
});

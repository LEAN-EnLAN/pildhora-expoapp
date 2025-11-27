import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import { PatientWithDevice } from '../../../types';

interface StatusRibbonProps {
  deviceStatus?: {
    isOnline: boolean;
    batteryLevel?: number;
    lastSeen?: number;
  };
}

export const StatusRibbon: React.FC<StatusRibbonProps> = ({
  deviceStatus,
}) => {
  // Helper to determine battery color
  const getBatteryColor = (level?: number) => {
    if (level === undefined) return colors.gray[400];
    if (level > 50) return colors.success[500];
    if (level > 20) return colors.warning[500];
    return colors.error[500];
  };

  // Helper to determine battery icon
  const getBatteryIcon = (level?: number) => {
    if (level === undefined) return 'battery-dead';
    if (level >= 90) return 'battery-full';
    if (level >= 50) return 'battery-half';
    if (level >= 20) return 'battery-dead'; // visual approximation
    return 'battery-dead';
  };

  return (
    <View style={styles.container}>
      {/* Device Status Area */}
      <View style={styles.statusSection}>
        <Text style={styles.label}>ESTADO</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={deviceStatus?.isOnline ? "wifi" : "cloud-offline-outline"} 
              size={18} 
              color={deviceStatus?.isOnline ? colors.success[600] : colors.gray[400]} 
            />
          </View>
          <View style={styles.statusItem}>
            <Ionicons 
              name={getBatteryIcon(deviceStatus?.batteryLevel)} 
              size={18} 
              color={getBatteryColor(deviceStatus?.batteryLevel)} 
            />
            {deviceStatus?.batteryLevel !== undefined && (
              <Text style={styles.statusValue}>{deviceStatus.batteryLevel}%</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray[50],
    minHeight: 56, // Reduced height
    alignItems: 'center',
    justifyContent: 'center', // Centered
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: {
    fontSize: 10,
    color: colors.gray[500],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusValue: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.semibold,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

export type DeviceStatusType = 'online' | 'offline' | 'error' | 'unknown';

interface DeviceStatusBadgeProps {
  status: DeviceStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<DeviceStatusType, {
  label: string;
  color: string;
  bgColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  online: {
    label: 'En línea',
    color: colors.success[700],
    bgColor: colors.success[100],
    icon: 'checkmark-circle',
  },
  offline: {
    label: 'Desconectado',
    color: colors.gray[600],
    bgColor: colors.gray[100],
    icon: 'cloud-offline',
  },
  error: {
    label: 'Error',
    color: colors.error[700],
    bgColor: colors.error[100],
    icon: 'alert-circle',
  },
  unknown: {
    label: 'Desconocido',
    color: colors.gray[500],
    bgColor: colors.gray[100],
    icon: 'help-circle',
  },
};

const SIZE_CONFIG = {
  sm: { icon: 14, text: typography.fontSize.xs, padding: spacing.xs },
  md: { icon: 16, text: typography.fontSize.sm, padding: spacing.sm },
  lg: { icon: 20, text: typography.fontSize.base, padding: spacing.md },
};

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = React.memo(({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bgColor, paddingHorizontal: sizeConfig.padding, paddingVertical: sizeConfig.padding / 2 }
      ]}
      accessibilityLabel={`Estado del dispositivo: ${config.label}`}
      accessibilityRole="text"
    >
      <Ionicons name={config.icon} size={sizeConfig.icon} color={config.color} />
      {showLabel && (
        <Text style={[styles.label, { color: config.color, fontSize: sizeConfig.text }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  label: {
    fontWeight: typography.fontWeight.medium,
  },
});

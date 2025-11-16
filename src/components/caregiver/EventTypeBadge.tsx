import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';
import { MedicationEventType, EventTypeBadgeProps } from '../../types';

/**
 * Get badge configuration (color, background, icon, label) for event type
 * Supports both short names (created, updated, deleted) and full names (medication_created, etc.)
 */
function getBadgeConfig(eventType: EventTypeBadgeProps['eventType']): {
  color: string;
  backgroundColor: string;
  icon: string;
  label: string;
} {
  switch (eventType) {
    case 'created':
    case 'medication_created':
      return {
        color: colors.primary[700], // Darker for better contrast (6.68:1)
        backgroundColor: colors.primary[50],
        icon: 'add-circle',
        label: 'Creado',
      };
    case 'updated':
    case 'medication_updated':
      return {
        color: '#B45309', // Darker orange for better contrast (5.2:1)
        backgroundColor: colors.warning[50],
        icon: 'create',
        label: 'Actualizado',
      };
    case 'deleted':
    case 'medication_deleted':
      return {
        color: '#B91C1C', // Even darker red for better contrast (5.5:1)
        backgroundColor: colors.error[50],
        icon: 'trash',
        label: 'Eliminado',
      };
    case 'dose_taken':
      return {
        color: '#15803D', // Darker green for better contrast (4.6:1)
        backgroundColor: '#E6F7ED',
        icon: 'checkmark-circle',
        label: 'Dosis Tomada',
      };
    case 'dose_missed':
      return {
        color: '#B45309', // Darker orange for better contrast (5.2:1)
        backgroundColor: '#FFF7ED',
        icon: 'alert-circle',
        label: 'Dosis Perdida',
      };
    default:
      return {
        color: colors.gray[600],
        backgroundColor: colors.gray[100],
        icon: 'information-circle',
        label: 'Evento',
      };
  }
}

/**
 * EventTypeBadge Component
 * 
 * Displays a color-coded badge for medication event types.
 * Used in LastMedicationStatusCard and event lists.
 * 
 * @param {EventTypeBadgeProps} props - Component props
 * @returns {JSX.Element} Rendered badge component
 * 
 * @example
 * <EventTypeBadge eventType="created" size="md" />
 * <EventTypeBadge eventType="dose_taken" size="sm" />
 */
export const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({
  eventType,
  size = 'md',
}) => {
  const config = getBadgeConfig(eventType);

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const fontSize = size === 'sm' ? typography.fontSize.xs : size === 'lg' ? typography.fontSize.base : typography.fontSize.sm;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
        styles[`badge_${size}`],
      ]}
      accessible={true}
      accessibilityLabel={`Estado: ${config.label}`}
      accessibilityRole="text"
    >
      <Ionicons name={config.icon as any} size={iconSize} color={config.color} />
      <Text style={[styles.label, { color: config.color, fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  badge_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  badge_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  badge_lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  label: {
    fontWeight: typography.fontWeight.semibold,
  },
});

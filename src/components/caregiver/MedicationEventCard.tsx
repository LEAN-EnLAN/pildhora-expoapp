import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';
import { MedicationEvent, MedicationEventType, MedicationEventCardProps } from '../../types';
import { getRelativeTimeString } from '../../utils/dateUtils';

/**
 * Get icon name and color for event type
 */
function getEventTypeIcon(eventType: MedicationEventType): { name: string; color: string; backgroundColor: string } {
  switch (eventType) {
    case 'created':
      return {
        name: 'add-circle',
        color: colors.success[500],
        backgroundColor: colors.success[50],
      };
    case 'updated':
      return {
        name: 'create',
        color: colors.primary[500],
        backgroundColor: colors.primary[50],
      };
    case 'deleted':
      return {
        name: 'trash',
        color: colors.error[500],
        backgroundColor: colors.error[50],
      };
    default:
      return {
        name: 'information-circle',
        color: colors.info[500],
        backgroundColor: colors.info[50],
      };
  }
}

/**
 * Get human-readable event type text
 */
function getEventTypeText(eventType: MedicationEventType): string {
  switch (eventType) {
    case 'created':
      return 'Creó';
    case 'updated':
      return 'Actualizó';
    case 'deleted':
      return 'Eliminó';
    default:
      return 'Modificó';
  }
}

/**
 * Format change summary for update events
 */
function getChangeSummary(event: MedicationEvent): string | null {
  if (event.eventType !== 'updated' || !event.changes || event.changes.length === 0) {
    return null;
  }

  const change = event.changes[0];
  const fieldLabels: Record<string, string> = {
    name: 'nombre',
    doseValue: 'dosis',
    doseUnit: 'unidad',
    times: 'horarios',
    frequency: 'frecuencia',
    emoji: 'icono',
    currentQuantity: 'cantidad',
    lowQuantityThreshold: 'umbral bajo',
  };

  const fieldLabel = fieldLabels[change.field] || change.field;
  
  if (change.field === 'times' && Array.isArray(change.oldValue) && Array.isArray(change.newValue)) {
    return `Cambió ${fieldLabel}: ${change.oldValue.join(', ')} → ${change.newValue.join(', ')}`;
  }
  
  return `Cambió ${fieldLabel}: ${change.oldValue} → ${change.newValue}`;
}

export const MedicationEventCard: React.FC<MedicationEventCardProps> = React.memo(({
  event,
  onPress,
}) => {
  const iconConfig = getEventTypeIcon(event.eventType);
  const eventTypeText = getEventTypeText(event.eventType);
  const relativeTime = getRelativeTimeString(event.timestamp);
  const changeSummary = getChangeSummary(event);

  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={onPress}
      accessibilityLabel={`${event.patientName} ${eventTypeText.toLowerCase()} ${event.medicationName}, ${relativeTime}`}
      accessibilityHint="Toca para ver detalles del evento"
    >
      <View style={styles.container}>
        {/* Event type icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconConfig.backgroundColor }]}>
          <Ionicons name={iconConfig.name as any} size={24} color={iconConfig.color} />
        </View>

        {/* Event content */}
        <View style={styles.content}>
          {/* Patient name and action */}
          <View style={styles.headerRow}>
            <Text style={styles.patientName} numberOfLines={1}>
              {event.patientName}
            </Text>
            <Text style={styles.eventType}>{eventTypeText}</Text>
          </View>

          {/* Medication name */}
          <Text style={styles.medicationName} numberOfLines={1}>
            "{event.medicationName}"
          </Text>

          {/* Change summary for updates */}
          {changeSummary && (
            <Text style={styles.changeSummary} numberOfLines={2}>
              {changeSummary}
            </Text>
          )}

          {/* Timestamp */}
          <View style={styles.timestampRow}>
            <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.timestamp}>{relativeTime}</Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      </View>
    </Card>
  );
});

MedicationEventCard.displayName = 'MedicationEventCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  patientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    flex: 1,
  },
  eventType: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
  },
  medicationName: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  changeSummary: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
});

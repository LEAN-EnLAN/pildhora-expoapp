import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Define a minimal event type based on what we need
interface MedicationEvent {
  id: string;
  timestamp: number;
  type: string;
  medicationName?: string;
  status?: string;
}

interface CompactEventsListProps {
  events: MedicationEvent[];
  onEventPress?: (event: MedicationEvent) => void;
  isLoading?: boolean;
}

export const CompactEventsList: React.FC<CompactEventsListProps> = ({
  events,
  onEventPress,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Cargando eventos...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay eventos recientes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const date = new Date(event.timestamp);
        
        // Determine icon and color based on type/status
        let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
        let iconColor = colors.gray[400];
        let label = event.type;

        if (event.type === 'INTAKE_MISSED') {
          iconName = 'alert-circle';
          iconColor = colors.error[500];
          label = 'Olvido';
        } else if (event.type === 'INTAKE_TAKEN') {
          iconName = 'checkmark-circle';
          iconColor = colors.success[500];
          label = 'Tomado';
        } else if (event.type === 'DEVICE_OFFLINE') {
          iconName = 'cloud-offline';
          iconColor = colors.warning[500];
          label = 'Desconectado';
        }

        return (
          <TouchableOpacity
            key={event.id}
            style={[styles.item, !isLast && styles.borderBottom]}
            onPress={() => onEventPress?.(event)}
            disabled={!onEventPress}
          >
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{format(date, 'HH:mm', { locale: es })}</Text>
            </View>
            
            <View style={styles.detailsContainer}>
              <Text style={styles.mainText} numberOfLines={1}>
                {event.medicationName || label}
              </Text>
              {event.medicationName && (
                <Text style={styles.subText}>{label}</Text>
              )}
            </View>

            <Ionicons name={iconName} size={20} color={iconColor} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  timeContainer: {
    width: 45,
    marginRight: spacing.sm,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    fontWeight: typography.fontWeight.medium,
  },
  detailsContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  mainText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: typography.fontWeight.medium,
  },
  subText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
});

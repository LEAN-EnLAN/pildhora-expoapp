/**
 * StatusCard Component
 * 
 * Displays the current status of the pastillero device including:
 * - Online/offline indicator (green/red)
 * - Last dispense time in relative format
 * - Next scheduled dose for today
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../ui/Card';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import { getNextScheduledDoseToday, TURNO_COLORS } from '../../services/pastilleroService';
import type { StatusCardProps, TurnoType } from '../../types';

interface ExtendedStatusCardProps extends StatusCardProps {
  /** Optional callback when the card is pressed */
  onPress?: () => void;
}

/**
 * StatusCard displays real-time pastillero device status.
 * Shows connection status, last dispense time, and next scheduled dose.
 */
export const StatusCard: React.FC<ExtendedStatusCardProps> = ({
  online,
  ultimoDispense,
  horarios,
  onPress,
}) => {
  // Calculate next scheduled dose for today
  const nextDose = useMemo(() => {
    return getNextScheduledDoseToday(horarios);
  }, [horarios]);

  // Format last dispense time as relative string
  const lastDispenseText = useMemo(() => {
    if (!ultimoDispense) return 'Sin registro';
    try {
      const date = new Date(ultimoDispense);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return 'Sin registro';
    }
  }, [ultimoDispense]);

  // Get turno color for next dose indicator
  const nextDoseColor = nextDose ? TURNO_COLORS[nextDose.turno as TurnoType] : colors.gray[400];

  const content = (
    <>
      {/* Header with title */}
      <View style={styles.header}>
        <Ionicons name="medical" size={24} color={colors.primary[500]} />
        <Text style={styles.title}>Estado del Pastillero</Text>
        {onPress && (
          <View style={styles.headerRight}>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </View>
        )}
      </View>

      {/* Status rows */}
      <View style={styles.statusContainer}>
        {/* Online status row */}
        <View
          style={styles.statusRow}
          accessible={true}
          accessibilityLabel={`Conexión: ${online ? 'En línea' : 'Desconectado'}`}
        >
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: online ? colors.success[500] : colors.error[500] },
              ]}
            />
            <Text style={styles.statusLabel}>Conexión</Text>
          </View>
          <Text style={[styles.statusValue, { color: online ? colors.success[600] : colors.error[600] }]}>
            {online ? 'En línea' : 'Desconectado'}
          </Text>
        </View>

        {/* Last dispense row */}
        <View
          style={styles.statusRow}
          accessible={true}
          accessibilityLabel={`Última dispensación: ${lastDispenseText}`}
        >
          <View style={styles.statusLeft}>
            <Ionicons name="time-outline" size={18} color={colors.gray[500]} />
            <Text style={styles.statusLabel}>Última dispensación</Text>
          </View>
          <Text style={styles.statusValue}>{lastDispenseText}</Text>
        </View>

        {/* Next dose row */}
        <View
          style={[styles.statusRow, styles.lastRow]}
          accessible={true}
          accessibilityLabel={
            nextDose
              ? `Próxima dosis hoy: ${nextDose.turnoName} a las ${nextDose.hora}`
              : 'Sin dosis programada para hoy'
          }
        >
          <View style={styles.statusLeft}>
            <Ionicons name="calendar-outline" size={18} color={colors.gray[500]} />
            <Text style={styles.statusLabel}>Próxima dosis hoy</Text>
          </View>
          {nextDose ? (
            <View style={styles.nextDoseContainer}>
              <View style={[styles.nextDoseBadge, { backgroundColor: nextDoseColor }]}>
                <Text style={styles.nextDoseBadgeText}>{nextDose.turnoName}</Text>
              </View>
              <Text style={styles.nextDoseTime}>{nextDose.hora}</Text>
            </View>
          ) : (
            <Text style={styles.noDoseText}>Sin dosis programada para hoy</Text>
          )}
        </View>
      </View>
    </>
  );

  return (
    <Card
      variant="elevated"
      padding="lg"
      style={styles.container}
      accessibilityLabel={`Estado del pastillero: ${online ? 'conectado' : 'desconectado'}`}
    >
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  statusContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    ...shadows.xs,
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  statusValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[800],
  },
  nextDoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextDoseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  nextDoseBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  nextDoseTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },
  noDoseText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.gray[500],
  },
});

/**
 * UpcomingDosesList - Secondary medication list sorted by urgency
 * 
 * Displays upcoming medications in order of when they're due.
 * Apple Alarms-style compact list with clear time indicators.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

interface UpcomingDose {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  timeDecimal: number;
  icon?: string;
  isCompleted?: boolean;
  completedAt?: Date;
}

interface UpcomingDosesListProps {
  doses: UpcomingDose[];
  onDosePress: (dose: UpcomingDose) => void;
  currentTimeDecimal: number;
}

const DoseItem: React.FC<{
  dose: UpcomingDose;
  onPress: () => void;
  isNext: boolean;
  currentTimeDecimal: number;
}> = React.memo(({ dose, onPress, isNext, currentTimeDecimal }) => {
  const minutesUntil = useMemo(() => {
    const diff = (dose.timeDecimal - currentTimeDecimal) * 60;
    return Math.round(diff);
  }, [dose.timeDecimal, currentTimeDecimal]);

  const timeLabel = useMemo(() => {
    if (dose.isCompleted) return 'Tomada';
    if (minutesUntil < 0) return 'Atrasada';
    if (minutesUntil === 0) return 'Ahora';
    if (minutesUntil < 60) return `en ${minutesUntil} min`;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    return mins > 0 ? `en ${hours}h ${mins}m` : `en ${hours}h`;
  }, [minutesUntil, dose.isCompleted]);

  const statusColor = useMemo(() => {
    if (dose.isCompleted) return colors.success[500];
    if (minutesUntil < 0) return colors.error[500];
    if (minutesUntil <= 15) return colors.warning[500];
    return colors.gray[400];
  }, [minutesUntil, dose.isCompleted]);

  return (
    <TouchableOpacity
      style={[
        styles.doseItem,
        isNext && styles.doseItemNext,
        dose.isCompleted && styles.doseItemCompleted,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${dose.medicationName}, ${dose.dosage}, ${dose.scheduledTime}`}
      accessibilityHint="Toca para ver detalles"
      accessibilityRole="button"
    >
      <View style={styles.timeColumn}>
        <Text style={[styles.timeText, dose.isCompleted && styles.textCompleted]}>
          {dose.scheduledTime}
        </Text>
        <Text style={[styles.timeLabel, { color: statusColor }]}>{timeLabel}</Text>
      </View>
      <View style={styles.medicationColumn}>
        <View style={styles.iconSmall}>
          <Text style={styles.iconEmojiSmall}>{dose.icon || '💊'}</Text>
        </View>
        <View style={styles.medicationDetails}>
          <Text style={[styles.medicationName, dose.isCompleted && styles.textCompleted]} numberOfLines={1}>
            {dose.medicationName}
          </Text>
          <Text style={[styles.dosageText, dose.isCompleted && styles.textCompleted]}>{dose.dosage}</Text>
        </View>
      </View>
      <View style={styles.statusColumn}>
        {dose.isCompleted ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
        ) : (
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        )}
      </View>
    </TouchableOpacity>
  );
});

export const UpcomingDosesList: React.FC<UpcomingDosesListProps> = React.memo(({
  doses,
  onDosePress,
  currentTimeDecimal,
}) => {
  const sortedDoses = useMemo(() => {
    return [...doses].sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return a.timeDecimal - b.timeDecimal;
    });
  }, [doses]);

  if (doses.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="list-outline" size={20} color={colors.gray[600]} />
        <Text style={styles.headerTitle}>Otras dosis de hoy</Text>
        <Text style={styles.headerCount}>{doses.length}</Text>
      </View>
      <View style={styles.listContainer}>
        {sortedDoses.map((dose, index) => (
          <DoseItem
            key={dose.id}
            dose={dose}
            onPress={() => onDosePress(dose)}
            isNext={index === 0 && !dose.isCompleted}
            currentTimeDecimal={currentTimeDecimal}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
  },
  headerCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: spacing.xs,
  },
  doseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  doseItemNext: {
    backgroundColor: colors.primary[50],
  },
  doseItemCompleted: {
    opacity: 0.7,
    backgroundColor: colors.gray[50],
  },
  timeColumn: {
    width: 80,
    marginRight: spacing.md,
  },
  timeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  timeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  textCompleted: {
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  medicationColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSmall: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconEmojiSmall: {
    fontSize: 18,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  dosageText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  statusColumn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

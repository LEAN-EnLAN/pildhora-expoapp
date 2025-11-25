/**
 * NextDoseHeroCard - Primary visual element for patient home
 * 
 * Displays the most urgent medication dose with maximum visual prominence.
 * Designed for elderly users with large touch targets and clear information hierarchy.
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import { triggerHapticFeedback, HapticFeedbackType, announceForAccessibility } from '../../../utils/accessibility';

interface NextDoseHeroCardProps {
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  icon?: string;
  iconColor?: string;
  onTake: () => void;
  onSkip: () => void;
  loading?: boolean;
  isCompleted?: boolean;
  completedAt?: Date;
  isOverdue?: boolean;
  minutesUntilDue?: number;
}

export const NextDoseHeroCard: React.FC<NextDoseHeroCardProps> = React.memo(({
  medicationName,
  dosage,
  scheduledTime,
  icon = '💊',
  iconColor,
  onTake,
  onSkip,
  loading = false,
  isCompleted = false,
  completedAt,
  isOverdue = false,
  minutesUntilDue,
}) => {
  const completedTimeStr = completedAt
    ? completedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '';

  // Urgency indicator
  const urgencyInfo = useMemo(() => {
    if (isCompleted) {
      return { label: 'Completada', color: colors.success[500], bgColor: colors.success[50] };
    }
    if (isOverdue) {
      return { label: 'Atrasada', color: colors.error[500], bgColor: colors.error[50] };
    }
    if (minutesUntilDue !== undefined && minutesUntilDue <= 15) {
      return { label: 'Ahora', color: colors.warning[500], bgColor: colors.warning[50] };
    }
    if (minutesUntilDue !== undefined && minutesUntilDue <= 60) {
      return { label: 'Pronto', color: colors.primary[500], bgColor: colors.primary[50] };
    }
    return { label: 'Próxima', color: colors.gray[500], bgColor: colors.gray[100] };
  }, [isCompleted, isOverdue, minutesUntilDue]);

  const handleTake = useCallback(async () => {
    if (isCompleted || loading) return;
    await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
    announceForAccessibility(`Registrando dosis de ${medicationName}`);
    onTake();
  }, [isCompleted, loading, medicationName, onTake]);

  const handleSkip = useCallback(async () => {
    if (isCompleted || loading) return;
    await triggerHapticFeedback(HapticFeedbackType.WARNING);
    announceForAccessibility(`Omitiendo dosis de ${medicationName}`);
    onSkip();
  }, [isCompleted, loading, medicationName, onSkip]);

  if (isCompleted) {
    return (
      <View style={[styles.container, styles.containerCompleted]}>
        <View style={styles.completedContent}>
          <View style={styles.completedIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success[500]} />
          </View>
          <Text style={styles.completedTitle}>¡Dosis tomada!</Text>
          <Text style={styles.completedMedName}>{medicationName}</Text>
          <Text style={styles.completedTime}>Tomada a las {completedTimeStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Time Display - Most prominent */}
      <View style={styles.timeSection}>
        <View style={[styles.urgencyBadge, { backgroundColor: urgencyInfo.bgColor }]}>
          <Text style={[styles.urgencyText, { color: urgencyInfo.color }]}>
            {urgencyInfo.label}
          </Text>
        </View>
        <Text style={styles.timeDisplay}>{scheduledTime}</Text>
        {minutesUntilDue !== undefined && minutesUntilDue > 0 && (
          <Text style={styles.timeUntil}>
            en {minutesUntilDue < 60 ? `${minutesUntilDue} min` : `${Math.floor(minutesUntilDue / 60)}h ${minutesUntilDue % 60}m`}
          </Text>
        )}
      </View>

      {/* Medication Info */}
      <View style={styles.medicationSection}>
        <View style={[styles.iconContainer, iconColor ? { backgroundColor: iconColor + '20' } : {}]}>
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName} numberOfLines={2}>{medicationName}</Text>
          <Text style={styles.dosage}>{dosage}</Text>
        </View>
      </View>

      {/* Action Buttons - Large touch targets for elderly */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.takeButton, loading && styles.buttonDisabled]}
          onPress={handleTake}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityLabel={`Tomar ${medicationName}`}
          accessibilityHint="Registra que has tomado esta dosis"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[colors.success[500], colors.success[600]]}
            style={styles.takeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark-circle" size={32} color={colors.surface} />
            <Text style={styles.takeButtonText}>
              {loading ? 'Registrando...' : 'Tomar'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipButton, loading && styles.buttonDisabled]}
          onPress={handleSkip}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityLabel={`Omitir ${medicationName}`}
          accessibilityHint="Omite esta dosis de medicamento"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle-outline" size={28} color={colors.gray[600]} />
          <Text style={styles.skipButtonText}>Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  containerCompleted: {
    backgroundColor: colors.success[50],
    borderWidth: 2,
    borderColor: colors.success[100],
  },
  // Time Section - Most prominent
  timeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  urgencyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  urgencyText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    letterSpacing: -1,
  },
  timeUntil: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  // Medication Section
  medicationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  iconEmoji: {
    fontSize: 32,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  dosage: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
  },
  // Actions Section - Large buttons for elderly
  actionsSection: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  takeButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  takeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  takeButtonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  skipButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Completed State
  completedContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  completedIconContainer: {
    marginBottom: spacing.md,
  },
  completedTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.success[600],
    marginBottom: spacing.sm,
  },
  completedMedName: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  completedTime: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },
});

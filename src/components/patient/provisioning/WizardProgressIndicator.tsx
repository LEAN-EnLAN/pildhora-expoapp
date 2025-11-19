import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

/**
 * Props for WizardProgressIndicator component
 */
export interface WizardProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

/**
 * WizardProgressIndicator Component
 * 
 * Modern, visually appealing progress indicator for device provisioning wizard.
 * 
 * Features:
 * - Animated progress bar with gradient
 * - Icon-based step indicators
 * - Connected line showing progression
 * - Current step highlight with pulse effect
 * - Percentage display
 * 
 * Accessibility:
 * - Announces current step and total steps
 * - Provides progress value for screen readers
 * - Uses semantic colors for completed/current/pending states
 * 
 * Requirements: 11.1, 11.2
 */
export function WizardProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels
}: WizardProgressIndicatorProps) {
  const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${currentStep + 1} de ${totalSteps}: ${stepLabels[currentStep]}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep + 1 }}
    >
      {/* Header with Title and Percentage */}
      <View style={styles.header}>
        <Text style={styles.title}>Configurar Dispositivo</Text>
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{progressPercentage}%</Text>
        </View>
      </View>

      {/* Current Step Info */}
      <View style={styles.currentStepInfo}>
        <Text style={styles.currentStepLabel}>Paso {currentStep + 1} de {totalSteps}</Text>
        <Text style={styles.currentStepName}>{stepLabels[currentStep]}</Text>
      </View>

      {/* Progress Bar with Gradient Effect */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` }
            ]}
            accessibilityElementsHidden
          >
            <View style={styles.progressBarGradient} />
          </View>
        </View>
      </View>

      {/* Step Indicators with Connection Lines */}
      <View style={styles.stepsContainer}>
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;
          const isNotLast = index < totalSteps - 1;

          return (
            <React.Fragment key={index}>
              <View style={styles.stepItem}>
                {/* Step Circle with Icon */}
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent,
                    isPending && styles.stepCirclePending,
                  ]}
                  accessibilityElementsHidden
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={20} color={colors.surface} />
                  ) : isCurrent ? (
                    <View style={styles.currentStepPulse}>
                      <Text style={styles.stepNumberCurrent}>{index + 1}</Text>
                    </View>
                  ) : (
                    <Text style={styles.stepNumberPending}>{index + 1}</Text>
                  )}
                </View>

                {/* Step Label */}
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                    isPending && styles.stepLabelPending,
                  ]}
                  numberOfLines={2}
                  accessibilityElementsHidden
                >
                  {label}
                </Text>
              </View>

              {/* Connection Line */}
              {isNotLast && (
                <View style={styles.connectionLineContainer}>
                  <View
                    style={[
                      styles.connectionLine,
                      index < currentStep && styles.connectionLineCompleted,
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: 'transparent', // Transparent to blend with gradient
    // Removed borderBottomWidth to make it cleaner
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  percentageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  percentageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  currentStepInfo: {
    marginBottom: spacing.md,
  },
  currentStepLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginBottom: spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentStepName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  progressBarContainer: {
    marginBottom: spacing.lg,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarGradient: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepItem: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepCircleCurrent: {
    backgroundColor: '#3B82F6', // primary[500]
    borderColor: '#3B82F6', // primary[500]
    shadowColor: '#3B82F6', // primary[500]
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepCirclePending: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  currentStepPulse: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberCurrent: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  stepNumberPending: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[500],
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * 1.3,
  },
  stepLabelCompleted: {
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  stepLabelCurrent: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  stepLabelPending: {
    color: colors.gray[500],
  },
  connectionLineContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  connectionLine: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  connectionLineCompleted: {
    backgroundColor: colors.success,
  },
});

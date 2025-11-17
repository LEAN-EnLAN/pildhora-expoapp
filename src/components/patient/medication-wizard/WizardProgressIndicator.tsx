import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

interface WizardProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

// Step icons mapping
const STEP_ICONS = [
  { icon: '🏷️', filledIcon: '🏷️' },  // Icon & Name
  { icon: '⏰', filledIcon: '⏰' },  // Schedule
  { icon: '💊', filledIcon: '💊' },  // Dosage
  { icon: '📦', filledIcon: '📦' },  // Inventory
];

export function WizardProgressIndicator({ 
  currentStep, 
  totalSteps, 
  stepLabels 
}: WizardProgressIndicatorProps) {
  return (
    <View 
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${currentStep + 1} de ${totalSteps}: ${stepLabels[currentStep]}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep + 1 }}
    >
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${((currentStep + 1) / totalSteps) * 100}%` }
          ]}
          accessibilityElementsHidden
        />
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsContainer}>
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;
          const stepIcon = STEP_ICONS[index] || STEP_ICONS[0];

          return (
            <View key={index} style={styles.stepItem}>
              {/* Step Circle */}
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isCurrent && styles.stepCircleCurrent,
                  isPending && styles.stepCirclePending,
                ]}
                accessibilityElementsHidden
              >
                <Text
                  style={[
                    styles.stepIcon,
                    isPending && styles.stepIconPending,
                  ]}
                >
                  {isCompleted || isCurrent ? stepIcon.filledIcon : stepIcon.icon}
                </Text>
              </View>

              {/* Step Label */}
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isPending && styles.stepLabelPending,
                ]}
                numberOfLines={2}
                accessibilityElementsHidden
              >
                {label}
              </Text>
            </View>
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
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
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
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success[500],
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary[500],
  },
  stepCirclePending: {
    backgroundColor: colors.gray[200],
  },
  stepIcon: {
    fontSize: 20,
  },
  stepIconPending: {
    opacity: 0.5,
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    color: colors.gray[700],
    lineHeight: typography.fontSize.xs * 1.4,
  },
  stepLabelCurrent: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
  stepLabelPending: {
    color: colors.gray[500],
  },
});

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
      {/* Steps Container */}
      <View style={styles.stepsContainer}>
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;
          const stepIcon = STEP_ICONS[index] || STEP_ICONS[0];

          return (
            <View key={index} style={styles.stepWrapper}>
              {/* Connector Line */}
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    index <= currentStep && styles.connectorLineActive
                  ]}
                />
              )}

              <View style={styles.stepItem}>
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
                  numberOfLines={1}
                  accessibilityElementsHidden
                >
                  {label}
                </Text>
              </View>
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
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  connectorLine: {
    position: 'absolute',
    top: 16, // Half of circle height (32/2)
    left: -50, // Extend to previous step
    right: 50, // Extend to current step content
    height: 2,
    backgroundColor: colors.gray[200],
    zIndex: -1,
    width: '100%',
    transform: [{ translateX: -50 }], // Adjust position
  },
  connectorLineActive: {
    backgroundColor: colors.primary[500],
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepCircleCompleted: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
    elevation: 4,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stepCirclePending: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[200],
  },
  stepIcon: {
    fontSize: 16,
  },
  stepIconPending: {
    opacity: 0.4,
    filter: 'grayscale(100%)',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: colors.gray[500],
    fontWeight: typography.fontWeight.medium,
    marginTop: 4,
  },
  stepLabelCurrent: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
  },
  stepLabelPending: {
    color: colors.gray[400],
  },
});

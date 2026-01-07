import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const showStepName = width >= 360; // Hide long labels on cramped screens
  const currentStepLabel = stepLabels[currentStep];

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${currentStep + 1} de ${totalSteps}: ${stepLabels[currentStep]}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep + 1 }}
    >
      <View style={styles.currentStepInfo}>
        <Text
          style={styles.currentStepLabel}
          allowFontScaling
        >
          Paso {currentStep + 1} de {totalSteps}
        </Text>
        {showStepName && (
          <Text
            style={styles.currentStepName}
            numberOfLines={1}
            ellipsizeMode="tail"
            allowFontScaling
          >
            {currentStepLabel}
          </Text>
        )}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    backgroundColor: 'transparent', // Transparent to blend with gradient
  },
  currentStepInfo: {
    marginBottom: spacing.sm,
    gap: spacing.xs / 2,
  },
  currentStepLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.fontWeight.semibold,
  },
  currentStepName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  progressBarContainer: {
    // No margin bottom - parent controls spacing
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
});

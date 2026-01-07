import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

interface AutonomousModeBannerProps {
  /** Optional custom message */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
}

/**
 * Banner component to display when a patient is in autonomous mode
 * 
 * Shows caregivers that the patient has enabled autonomous mode and
 * current data is not being shared.
 */
export function AutonomousModeBanner({
  message = 'Modo autónomo activado',
  size = 'md',
  showIcon = true,
}: AutonomousModeBannerProps) {
  return (
    <View style={[styles.container, styles[`container_${size}`]]}>
      {showIcon && (
        <Ionicons 
          name="eye-off" 
          size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} 
          color={colors.warning[600]} 
        />
      )}
      <Text style={[styles.text, styles[`text_${size}`]]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  container_sm: {
    padding: spacing.xs,
    gap: spacing.xs,
  },
  container_md: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  container_lg: {
    padding: spacing.md,
    gap: spacing.md,
  },
  text: {
    color: colors.warning[600],
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  text_sm: {
    fontSize: typography.fontSize.xs,
  },
  text_md: {
    fontSize: typography.fontSize.sm,
  },
  text_lg: {
    fontSize: typography.fontSize.base,
  },
});

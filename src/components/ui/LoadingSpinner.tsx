/**
 * LoadingSpinner Component
 * 
 * Displays an animated loading spinner for async operations.
 * Supports different sizes and overlay modes.
 * 
 * @example
 * // Inline spinner
 * <LoadingSpinner size="small" />
 * 
 * // Full screen overlay
 * <LoadingSpinner size="large" overlay message="Loading..." />
 */

import React, { useRef, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Optional loading message */
  message?: string;
  /** Show as full-screen overlay */
  overlay?: boolean;
  /** Custom color for spinner */
  color?: string;
  /** Custom style */
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
  overlay = false,
  color = colors.primary[500],
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const content = (
    <Animated.View
      style={[
        styles.container,
        overlay && styles.overlay,
        { opacity: fadeAnim },
        style,
      ]}
    >
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </Animated.View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
  },
  spinnerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  autoDismiss?: boolean;
  duration?: number;
  onDismiss?: () => void;
  style?: ViewStyle;
}

/**
 * Toast Component
 * 
 * Displays temporary notification messages with animations
 * Supports success, error, info, and warning types
 * Auto-dismisses after specified duration
 * 
 * @example
 * <Toast
 *   message="Medication saved successfully"
 *   type="success"
 *   autoDismiss={true}
 *   duration={3000}
 *   onDismiss={() => setShowToast(false)}
 * />
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  autoDismiss = true,
  duration = 3000,
  onDismiss,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
      }),
    ]).start();

    // Auto dismiss
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, duration, onDismiss, fadeAnim, slideAnim]);

  // Get icon and colors based on type
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          backgroundColor: colors.success[50],
          borderColor: colors.success[500],
          iconColor: colors.success[500],
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          backgroundColor: colors.error[50],
          borderColor: colors.error[500],
          iconColor: colors.error[500],
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          backgroundColor: colors.warning[50],
          borderColor: colors.warning[500],
          iconColor: colors.warning[500],
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          backgroundColor: colors.primary[50],
          borderColor: colors.primary[500],
          iconColor: colors.primary[500],
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
      accessible={true}
      accessibilityLabel={`${type}: ${message}`}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <Ionicons
          name={config.icon}
          size={24}
          color={config.iconColor}
          accessible={false}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[800],
    fontWeight: typography.fontWeight.medium,
  },
});

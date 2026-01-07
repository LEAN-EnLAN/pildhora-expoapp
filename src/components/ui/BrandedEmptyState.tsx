/**
 * BrandedEmptyState Component
 * 
 * Empty state component with app branding for when lists or content are empty.
 * Provides a friendly, branded experience with optional action button.
 * 
 * @example
 * <BrandedEmptyState
 *   title="No hay medicamentos"
 *   message="Agrega tu primer medicamento para comenzar"
 *   actionLabel="Agregar medicamento"
 *   onAction={() => router.push('/add')}
 * />
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';
import { motion } from '../../theme/motion';
import AppIcon from './AppIcon';
import { Button } from './Button';

export interface BrandedEmptyStateProps {
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Title text */
  title: string;
  /** Description message */
  message?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Whether to show the app icon */
  showAppIcon?: boolean;
  /** Custom icon color */
  iconColor?: string;
}

export default function BrandedEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  showAppIcon = false,
  iconColor = colors.gray[400],
}: BrandedEmptyStateProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: motion.duration.medium,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...motion.spring.gentle,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {showAppIcon ? (
          <View style={styles.appIconContainer}>
            <AppIcon size="lg" showShadow={false} rounded={true} />
          </View>
        ) : icon ? (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={64} color={iconColor} />
          </View>
        ) : null}

        <Text style={styles.title}>{title}</Text>

        {message && <Text style={styles.message}>{message}</Text>}

        {actionLabel && onAction && (
          <View style={styles.actionContainer}>
            <Button
              variant="primary"
              size="lg"
              onPress={onAction}
              accessibilityLabel={actionLabel}
            >
              {actionLabel}
            </Button>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  appIconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.6,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing.xl,
  },
  actionContainer: {
    marginTop: spacing.md,
    width: '100%',
  },
});

/**
 * BrandedLoadingScreen Component
 * 
 * Full-screen loading indicator with app branding.
 * Used for initial app load, authentication, and major transitions.
 * 
 * @example
 * <BrandedLoadingScreen message="Cargando..." />
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import AppIcon from './AppIcon';
import { LoadingSpinner } from './LoadingSpinner';

export interface BrandedLoadingScreenProps {
  /** Loading message to display */
  message?: string;
  /** Whether to show the spinner */
  showSpinner?: boolean;
}

export default function BrandedLoadingScreen({
  message = 'Cargando...',
  showSpinner = true,
}: BrandedLoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
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
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <AppIcon size="2xl" showShadow={true} rounded={true} />
        
        <Text style={styles.brandName}>PILDHORA</Text>
        
        {showSpinner && (
          <View style={styles.spinnerContainer}>
            <LoadingSpinner size="large" />
          </View>
        )}
        
        {message && <Text style={styles.message}>{message}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  brandName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary[500],
    letterSpacing: 1,
  },
  spinnerContainer: {
    marginVertical: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

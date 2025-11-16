/**
 * ErrorState Component
 * 
 * Reusable error state component for caregiver screens
 * Displays user-friendly error messages with retry options
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme/tokens';
import { ErrorCategory } from '../../utils/errorHandling';
import { ErrorStateProps } from '../../types';

/**
 * Get icon name based on error category
 */
function getErrorIcon(category?: ErrorCategory): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'cloud-offline-outline';
    case ErrorCategory.PERMISSION:
      return 'lock-closed-outline';
    case ErrorCategory.INITIALIZATION:
      return 'warning-outline';
    case ErrorCategory.NOT_FOUND:
      return 'search-outline';
    default:
      return 'alert-circle-outline';
  }
}

/**
 * Get default title based on error category
 */
function getErrorTitle(category?: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Error de Conexión';
    case ErrorCategory.PERMISSION:
      return 'Permiso Denegado';
    case ErrorCategory.INITIALIZATION:
      return 'Error de Inicialización';
    case ErrorCategory.NOT_FOUND:
      return 'No Encontrado';
    default:
      return 'Error';
  }
}

/**
 * ErrorState component
 */
export function ErrorState({
  title,
  message,
  category,
  onRetry,
  retryLabel = 'Reintentar',
  showIcon = true,
}: ErrorStateProps) {
  const iconName = getErrorIcon(category);
  const displayTitle = title || getErrorTitle(category);

  return (
    <View style={styles.container}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={64} color="#DC2626" />
        </View>
      )}
      
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onRetry && (
        <Button
          variant="primary"
          size="lg"
          onPress={onRetry}
          style={styles.retryButton}
          accessibilityLabel={retryLabel}
          accessibilityHint="Intenta cargar los datos nuevamente"
        >
          {retryLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing.xl,
  },
  retryButton: {
    minWidth: 200,
  },
});

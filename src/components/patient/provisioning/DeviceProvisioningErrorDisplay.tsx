import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import {
  DeviceProvisioningErrorCode,
  handleDeviceProvisioningError,
  getSupportContactInfo,
} from '../../../utils/deviceProvisioningErrors';

/**
 * DeviceProvisioningErrorDisplay Component
 * 
 * Displays device provisioning errors with user-friendly messages,
 * troubleshooting steps, and support contact information.
 * 
 * Requirements: 11.4, 11.6
 */

interface DeviceProvisioningErrorDisplayProps {
  errorCode: DeviceProvisioningErrorCode;
  onRetry?: () => void;
  onContactSupport?: () => void;
  style?: any;
}

export function DeviceProvisioningErrorDisplay({
  errorCode,
  onRetry,
  onContactSupport,
  style,
}: DeviceProvisioningErrorDisplayProps) {
  const errorResponse = handleDeviceProvisioningError(errorCode);
  const supportInfo = getSupportContactInfo();

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Error Header */}
      <View style={styles.errorHeader}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error[500]} />
        </View>
        <Text style={styles.errorTitle}>Error de Configuración</Text>
        <Text style={styles.errorMessage}>{errorResponse.userMessage}</Text>
      </View>

      {/* Suggested Action */}
      <View style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <Ionicons name="bulb" size={20} color={colors.warning[500]} />
          <Text style={styles.actionTitle}>Acción Sugerida</Text>
        </View>
        <Text style={styles.actionText}>{errorResponse.suggestedAction}</Text>
      </View>

      {/* Troubleshooting Steps */}
      <View style={styles.troubleshootingSection}>
        <Text style={styles.sectionTitle}>Pasos para Solucionar</Text>

        {errorResponse.troubleshootingSteps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Support Contact */}
      {errorResponse.supportContact && (
        <View style={styles.supportSection}>
          <View style={styles.supportHeader}>
            <Ionicons name="headset" size={24} color={colors.primary[500]} />
            <Text style={styles.supportTitle}>¿Necesitas Ayuda?</Text>
          </View>

          <View style={styles.supportCard}>
            <View style={styles.supportItem}>
              <Ionicons name="mail" size={18} color={colors.gray[600]} />
              <Text style={styles.supportText}>{supportInfo.email}</Text>
            </View>

            {supportInfo.phone && (
              <View style={styles.supportItem}>
                <Ionicons name="call" size={18} color={colors.gray[600]} />
                <Text style={styles.supportText}>{supportInfo.phone}</Text>
              </View>
            )}

            <View style={styles.supportItem}>
              <Ionicons name="time" size={18} color={colors.gray[600]} />
              <Text style={styles.supportText}>{supportInfo.hours}</Text>
            </View>
          </View>

          {onContactSupport && (
            <TouchableOpacity
              style={styles.supportButton}
              onPress={onContactSupport}
              accessibilityRole="button"
              accessibilityLabel="Contactar soporte técnico"
            >
              <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
              <Text style={styles.supportButtonText}>Contactar Soporte</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Retry Button */}
      {errorResponse.retryable && onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Reintentar configuración"
        >
          <Ionicons name="refresh" size={20} color={colors.primary[500]} />
          <Text style={styles.retryButtonText}>Intentar Nuevamente</Text>
        </TouchableOpacity>
      )}

      {/* Non-retryable Notice */}
      {!errorResponse.retryable && (
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color={colors.gray[600]} />
          <Text style={styles.noticeText}>
            Este error requiere asistencia adicional. Por favor, contacta al soporte técnico.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Glassmorphism background
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: '#FEF2F2', // error[50]
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.error[500],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: typography.fontSize.base * 1.5,
  },
  actionCard: {
    backgroundColor: '#FFFBEB', // warning[50]
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  actionText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
    lineHeight: typography.fontSize.base * 1.5,
  },
  troubleshootingSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
    lineHeight: typography.fontSize.base * 1.5,
  },
  supportSection: {
    marginBottom: spacing.xl,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  supportTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  supportText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  supportButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary[500],
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * 1.5,
  },
});

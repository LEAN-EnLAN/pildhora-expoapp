import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';
import { useWizardContext } from '../WizardContext';
import { announceForAccessibility, triggerHapticFeedback, HapticFeedbackType } from '../../../../utils/accessibility';
import { provisionDevice, checkDeviceExists } from '../../../../services/deviceProvisioning';
import {
  DeviceProvisioningErrorCode,
  parseDeviceProvisioningError,
  handleDeviceProvisioningError
} from '../../../../utils/deviceProvisioningErrors';
import { DeviceProvisioningErrorDisplay } from '../DeviceProvisioningErrorDisplay';

/**
 * VerificationStep Component
 * 
 * Third step of the device provisioning wizard. Verifies the device exists,
 * is unclaimed, and creates the necessary device documents and links.
 * 
 * Premium visual overhaul.
 */
export function VerificationStep() {
  const { formData, setCanProceed, userId } = useWizardContext();
  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [currentStep, setCurrentStep] = useState<string>('Verificando dispositivo...');
  const [errorCode, setErrorCode] = useState<DeviceProvisioningErrorCode | null>(null);

  useEffect(() => {
    announceForAccessibility('Paso 3: Verificando tu dispositivo');
    performVerification();
  }, []);

  /**
   * Perform device verification and provisioning
   */
  const performVerification = async () => {
    try {
      const { deviceId } = formData;

      if (!deviceId) {
        throw new Error('No se proporcionó un ID de dispositivo');
      }

      // Step 1: Check if device already exists
      setCurrentStep('Verificando disponibilidad...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const deviceExists = await checkDeviceExists(deviceId);

      if (deviceExists) {
        setCurrentStep('Verificando vínculos...');
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Step 2: Provision device
      setCurrentStep('Registrando dispositivo...');
      await new Promise(resolve => setTimeout(resolve, 600));

      await provisionDevice({
        deviceId,
        userId,
        wifiSSID: formData.wifiSSID,
        wifiPassword: formData.wifiPassword,
        alarmMode: formData.alarmMode || 'both',
        ledIntensity: formData.ledIntensity || 75,
        ledColor: formData.ledColor || '#3B82F6',
        volume: formData.volume || 75,
      });

      // Step 3: Complete
      setCurrentStep('¡Dispositivo verificado!');
      setVerificationState('success');
      setCanProceed(true);
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      announceForAccessibility('Dispositivo verificado y vinculado exitosamente');

    } catch (error: any) {
      console.error('[VerificationStep] Verification failed:', error);

      let parsedErrorCode: DeviceProvisioningErrorCode;

      if (error.code === 'DEVICE_ALREADY_CLAIMED') {
        parsedErrorCode = DeviceProvisioningErrorCode.DEVICE_ALREADY_CLAIMED;
      } else if (error.code === 'PERMISSION_DENIED') {
        parsedErrorCode = DeviceProvisioningErrorCode.PERMISSION_DENIED;
      } else {
        parsedErrorCode = parseDeviceProvisioningError(error);
      }

      const errorResponse = handleDeviceProvisioningError(parsedErrorCode);

      setErrorCode(parsedErrorCode);
      setVerificationState('error');
      setCanProceed(false);
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
      announceForAccessibility(`Error: ${errorResponse.userMessage}`);
    }
  };

  const handleRetry = () => {
    setVerificationState('verifying');
    setErrorCode(null);
    setCurrentStep('Verificando dispositivo...');
    performVerification();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Header */}
      <View style={styles.header}>
        <View style={[
          styles.iconContainer,
          verificationState === 'success' && styles.iconContainerSuccess,
          verificationState === 'error' && styles.iconContainerError,
        ]}>
          {verificationState === 'verifying' && (
            <ActivityIndicator size="large" color={colors.primary[500]} />
          )}
          {verificationState === 'success' && (
            <Ionicons name="checkmark-circle" size={48} color={colors.success[500]} />
          )}
          {verificationState === 'error' && (
            <Ionicons name="alert-circle" size={48} color={colors.error[500]} />
          )}
        </View>

        <Text style={styles.title}>
          {verificationState === 'verifying' && 'Verificando...'}
          {verificationState === 'success' && '¡Todo listo!'}
          {verificationState === 'error' && 'Hubo un problema'}
        </Text>

        <Text style={styles.subtitle}>
          {verificationState === 'verifying' && currentStep}
          {verificationState === 'success' && 'Tu dispositivo ha sido verificado correctamente.'}
          {verificationState === 'error' && 'No pudimos verificar tu dispositivo.'}
        </Text>
      </View>

      {/* Progress Card */}
      {verificationState === 'verifying' && (
        <View style={styles.card}>
          <View style={styles.progressItem}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={styles.progressText}>Conectando con el servidor...</Text>
          </View>
          <View style={styles.connectorLine} />
          <View style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              !currentStep.includes('disponibilidad') ? styles.progressDotActive : styles.progressDotPending
            ]} />
            <Text style={[
              styles.progressText,
              currentStep.includes('disponibilidad') && styles.progressTextPending
            ]}>Validando ID del dispositivo...</Text>
          </View>
          <View style={styles.connectorLine} />
          <View style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              currentStep.includes('Registrando') ? styles.progressDotActive : styles.progressDotPending
            ]} />
            <Text style={[
              styles.progressText,
              !currentStep.includes('Registrando') && styles.progressTextPending
            ]}>Vinculando a tu cuenta...</Text>
          </View>
        </View>
      )}

      {/* Success Card */}
      {verificationState === 'success' && (
        <View style={styles.successCard}>
          <View style={styles.deviceInfoRow}>
            <Ionicons name="hardware-chip-outline" size={24} color={colors.primary[600]} />
            <View>
              <Text style={styles.deviceInfoLabel}>ID del Dispositivo</Text>
              <Text style={styles.deviceInfoValue}>{formData.deviceId}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.successMessage}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.success[500]} />
            <Text style={styles.successMessageText}>Dispositivo seguro y vinculado</Text>
          </View>
        </View>
      )}

      {/* Error State */}
      {verificationState === 'error' && errorCode && (
        <DeviceProvisioningErrorDisplay
          errorCode={errorCode}
          onRetry={handleRetry}
          style={styles.errorDisplay}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  iconContainerSuccess: {
    backgroundColor: '#F0FDF4', // success[50]
  },
  iconContainerError: {
    backgroundColor: '#FEF2F2', // error[50]
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  progressDotActive: {
    backgroundColor: colors.primary[500],
    ...shadows.sm,
  },
  progressDotPending: {
    backgroundColor: colors.gray[300],
  },
  progressText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
    fontWeight: typography.fontWeight.medium,
  },
  progressTextPending: {
    color: colors.gray[400],
  },
  connectorLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.gray[200],
    marginLeft: 5, // Center with dot (12/2 - 1)
    marginVertical: 4,
  },
  successCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  deviceInfoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceInfoValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.md,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  successMessageText: {
    fontSize: typography.fontSize.sm,
    color: colors.success[500],
    fontWeight: typography.fontWeight.medium,
  },
  errorDisplay: {
    width: '100%',
  },
});

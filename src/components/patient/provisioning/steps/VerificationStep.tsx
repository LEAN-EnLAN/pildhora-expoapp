import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../../theme/tokens';
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
 * Requirements: 3.4, 4.1, 4.2, 4.4, 4.5
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
   * Requirements: 3.4, 4.1, 4.2, 4.4, 4.5
   */
  const performVerification = async () => {
    try {
      const { deviceId } = formData;

      if (!deviceId) {
        throw new Error('No se proporcionó un ID de dispositivo');
      }

      // Step 1: Check if device already exists
      setCurrentStep('Verificando disponibilidad del dispositivo...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const deviceExists = await checkDeviceExists(deviceId);
      
      if (deviceExists) {
        setCurrentStep('Verificando vínculos existentes...');
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Step 2: Provision device (creates device, deviceConfig, deviceLink, updates user)
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
      setCurrentStep('¡Dispositivo verificado exitosamente!');
      setVerificationState('success');
      setCanProceed(true);
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      announceForAccessibility('Dispositivo verificado y vinculado exitosamente');

    } catch (error: any) {
      console.error('[VerificationStep] Verification failed:', error);
      
      // Parse error to appropriate error code
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

  /**
   * Retry verification
   */
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
      {/* Header */}
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
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          )}
          {verificationState === 'error' && (
            <Ionicons name="alert-circle" size={48} color={colors.error[500]} />
          )}
        </View>

        <Text style={styles.title}>
          {verificationState === 'verifying' && 'Verificando Dispositivo'}
          {verificationState === 'success' && '¡Verificación Exitosa!'}
          {verificationState === 'error' && 'Error de Verificación'}
        </Text>

        <Text style={styles.subtitle}>
          {verificationState === 'verifying' && 'Por favor espera mientras verificamos tu dispositivo'}
          {verificationState === 'success' && 'Tu dispositivo ha sido registrado correctamente'}
          {verificationState === 'error' && 'No pudimos verificar tu dispositivo'}
        </Text>
      </View>

      {/* Progress Steps */}
      {verificationState === 'verifying' && (
        <View style={styles.progressSection}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color={colors.primary[500]} style={styles.progressIcon} />
            <Text style={styles.progressText}>{currentStep}</Text>
          </View>

          <View style={styles.stepsList}>
            <ProgressStep 
              icon="checkmark-circle" 
              text="Verificar disponibilidad" 
              completed={currentStep !== 'Verificando disponibilidad del dispositivo...'}
            />
            <ProgressStep 
              icon="document-text" 
              text="Registrar dispositivo" 
              completed={!currentStep.includes('Verificando') && !currentStep.includes('Registrando')}
            />
            <ProgressStep 
              icon="link" 
              text="Vincular a tu cuenta" 
              completed={!currentStep.includes('Verificando') && !currentStep.includes('Registrando') && !currentStep.includes('Vinculando')}
            />
            <ProgressStep 
              icon="cloud-upload" 
              text="Sincronizar" 
              completed={currentStep.includes('exitosamente')}
            />
          </View>
        </View>
      )}

      {/* Success State */}
      {verificationState === 'success' && (
        <View style={styles.successSection}>
          <View style={styles.successCard}>
            <Ionicons name="hardware-chip" size={32} color={colors.primary[500]} style={styles.successIcon} />
            <View style={styles.successContent}>
              <Text style={styles.successTitle}>Dispositivo: {formData.deviceId}</Text>
              <Text style={styles.successText}>Estado: Activo y listo para configurar</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary[500]} />
            <Text style={styles.infoText}>
              A continuación, configuraremos la conexión WiFi y las preferencias de tu dispositivo
            </Text>
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

/**
 * ProgressStep Component
 */
interface ProgressStepProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  completed: boolean;
}

function ProgressStep({ icon, text, completed }: ProgressStepProps) {
  return (
    <View style={styles.progressStepItem}>
      <View style={[styles.progressStepIcon, completed && styles.progressStepIconCompleted]}>
        <Ionicons 
          name={completed ? 'checkmark' : icon} 
          size={16} 
          color={completed ? colors.success : colors.gray[400]} 
        />
      </View>
      <Text style={[styles.progressStepText, completed && styles.progressStepTextCompleted]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF', // primary[50]
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  progressIcon: {
    marginRight: spacing.md,
  },
  progressText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[800],
  },
  stepsList: {
    gap: spacing.md,
  },
  progressStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  progressStepIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  progressStepIconCompleted: {
    backgroundColor: '#F0FDF4', // success[50]
  },
  progressStepText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  progressStepTextCompleted: {
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  successSection: {
    gap: spacing.md,
  },
  successCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successIcon: {
    marginRight: spacing.md,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  successText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', // primary[50]
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * 1.4,
  },
  errorDisplay: {
    marginTop: 0,
  },
});

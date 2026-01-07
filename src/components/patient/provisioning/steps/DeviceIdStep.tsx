import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../../ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';
import { useWizardContext } from '../WizardContext';
import { announceForAccessibility, triggerHapticFeedback, HapticFeedbackType } from '../../../../utils/accessibility';
import { getDbInstance } from '../../../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  DeviceProvisioningErrorCode,
  parseDeviceProvisioningError
} from '../../../../utils/deviceProvisioningErrors';

// Test Device IDs that bypass backend validation for testing purposes
const TEST_DEVICE_IDS = ['TEST-DEVICE-001', 'TEST-DEVICE-002', 'PILDHORA-TEST-01'];

/**
 * DeviceIdStep Component
 * 
 * Second step of the device provisioning wizard. Allows user to enter
 * their device ID with real-time validation and availability checking.
 * 
 * Premium visual overhaul.
 */
export function DeviceIdStep() {
  const { formData, updateFormData, setCanProceed } = useWizardContext();
  const [deviceId, setDeviceId] = useState(formData.deviceId || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkDebounceTimer, setCheckDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Announce step for accessibility
  useEffect(() => {
    announceForAccessibility('Paso 2: Ingresa el ID de tu dispositivo');
  }, []);

  /**
   * Validate device ID format
   */
  const validateFormat = useCallback((id: string): string | null => {
    if (!id || id.trim().length === 0) {
      return 'El ID del dispositivo es requerido';
    }

    if (id.trim().length < 5) {
      return 'El ID debe tener al menos 5 caracteres';
    }

    if (id.length > 100) {
      return 'El ID no puede tener más de 100 caracteres';
    }

    // Check for invalid characters (allow alphanumeric, hyphens, underscores, and hash)
    if (!/^[a-zA-Z0-9_\-#]+$/.test(id)) {
      return 'El ID solo puede contener letras, números, guiones, guiones bajos y el símbolo #';
    }

    return null;
  }, []);

  /**
   * Check if device is available (not already claimed)
   */
  const checkDeviceAvailability = useCallback(async (id: string): Promise<string | null> => {
    // Bypass check for test device IDs
    if (TEST_DEVICE_IDS.includes(id)) {
      return null;
    }

    try {
      const db = await getDbInstance();
      if (!db) {
        const errorCode = DeviceProvisioningErrorCode.DEVICE_OFFLINE;
        const errorResponse = require('../../../../utils/deviceProvisioningErrors').handleDeviceProvisioningError(errorCode);
        return errorResponse.userMessage;
      }

      // Check if device document exists in Firestore
      const deviceRef = doc(db, 'devices', id);
      const deviceDoc = await getDoc(deviceRef);

      if (deviceDoc.exists()) {
        const deviceData = deviceDoc.data();

        // Check if device is already claimed by another patient
        if (deviceData.primaryPatientId) {
          const errorCode = DeviceProvisioningErrorCode.DEVICE_ALREADY_CLAIMED;
          const errorResponse = require('../../../../utils/deviceProvisioningErrors').handleDeviceProvisioningError(errorCode);
          return errorResponse.userMessage;
        }
      }

      // Device is available
      return null;
    } catch (error: any) {
      console.error('[DeviceIdStep] Error checking device availability:', error);

      // Parse error to appropriate error code
      const errorCode = parseDeviceProvisioningError(error);
      const errorResponse = require('../../../../utils/deviceProvisioningErrors').handleDeviceProvisioningError(errorCode);
      return errorResponse.userMessage;
    }
  }, []);

  /**
   * Handle device ID change with validation and availability check
   */
  const handleDeviceIdChange = useCallback((value: string) => {
    setDeviceId(value);
    setValidationError(null);
    setCanProceed(false);

    // Clear existing debounce timer
    if (checkDebounceTimer) {
      clearTimeout(checkDebounceTimer);
    }

    // Validate format first
    const formatError = validateFormat(value);
    if (formatError) {
      setValidationError(formatError);
      return;
    }

    // Debounce availability check (wait 500ms after user stops typing)
    const timer = setTimeout(async () => {
      setIsChecking(true);

      const availabilityError = await checkDeviceAvailability(value);

      setIsChecking(false);

      if (availabilityError) {
        setValidationError(availabilityError);
        await triggerHapticFeedback(HapticFeedbackType.ERROR);
        announceForAccessibility(availabilityError);
      } else {
        // Device ID is valid and available
        updateFormData({ deviceId: value });
        setCanProceed(true);
        await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
        announceForAccessibility('ID del dispositivo válido');
      }
    }, 500);

    setCheckDebounceTimer(timer);
  }, [validateFormat, checkDeviceAvailability, updateFormData, setCanProceed, checkDebounceTimer]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (checkDebounceTimer) {
        clearTimeout(checkDebounceTimer);
      }
    };
  }, [checkDebounceTimer]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="qr-code-outline" size={40} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>ID del Dispositivo</Text>
        <Text style={styles.subtitle}>
          Ingresa el código único que se encuentra en tu dispositivo Pildhora
        </Text>
      </View>

      {/* Input Card */}
      <View style={styles.card}>
        <Input
          label="ID del Dispositivo"
          value={deviceId}
          onChangeText={handleDeviceIdChange}
          placeholder="Ej: DEVICE-12345"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={100}
          accessibilityLabel="Campo de ID del dispositivo"
          accessibilityHint="Ingresa el código alfanumérico de 5 a 100 caracteres ubicado en tu dispositivo"
          leftIcon={<Ionicons name="barcode-outline" size={20} color={colors.gray[400]} />}
        />

        {/* Validation Feedback */}
        <View style={styles.feedbackWrapper}>
          {isChecking && (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.feedbackText}>Verificando disponibilidad...</Text>
            </View>
          )}

          {validationError && !isChecking && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          {!validationError && !isChecking && deviceId.length >= 5 && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[500]} />
              <Text style={styles.successText}>ID válido y disponible</Text>
            </View>
          )}
        </View>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>¿Dónde encuentro el ID?</Text>

        <View style={styles.helpCard}>
          <View style={styles.helpIconWrapper}>
            <Ionicons name="search" size={24} color={colors.primary[500]} />
          </View>
          <View style={styles.helpContent}>
            <Text style={styles.helpText}>
              Busca una etiqueta en la parte inferior o trasera de tu dispositivo.
            </Text>
            <View style={styles.locationList}>
              <View style={styles.locationItem}>
                <Ionicons name="cube-outline" size={16} color={colors.gray[500]} />
                <Text style={styles.locationText}>En la caja del producto</Text>
              </View>
              <View style={styles.locationItem}>
                <Ionicons name="book-outline" size={16} color={colors.gray[500]} />
                <Text style={styles.locationText}>En el manual de usuario</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Troubleshooting */}
      <View style={styles.troubleshootingSection}>
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Asegúrate de escribir el ID exactamente como aparece, respetando mayúsculas y guiones.
          </Text>
        </View>
      </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
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
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    marginBottom: spacing.xl,
  },
  feedbackWrapper: {
    marginTop: spacing.md,
    minHeight: 40, // Reserve space to prevent layout jump
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
  },
  feedbackText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#FEF2F2', // error[50]
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
    lineHeight: typography.fontSize.sm * 1.4,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#F0FDF4', // success[50]
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  successText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.success[500],
    fontWeight: typography.fontWeight.medium,
  },
  helpSection: {
    marginBottom: spacing.xl,
  },
  helpTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  helpIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  helpContent: {
    flex: 1,
  },
  helpText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  locationList: {
    gap: spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  troubleshootingSection: {
    marginBottom: spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB', // warning[50]
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[800],
    lineHeight: 20,
  },
});

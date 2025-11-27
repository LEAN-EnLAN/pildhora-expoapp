import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../src/store';
import { Button, Container, Card, Input } from '../../src/components/ui';
import { ScreenWrapper } from '../../src/components/caregiver';
import { validateCode, ConnectionCodeError } from '../../src/services/connectionCode';
import { colors, spacing, typography, borderRadius } from '../../src/theme/tokens';

/**
 * DeviceConnectionScreen
 * 
 * Screen for caregivers to connect to patient devices using connection codes.
 * 
 * Requirements: 5.1, 5.2, 5.3
 * 
 * Flow:
 * 1. Caregiver enters connection code to link new patient/device
 * 2. Real-time format validation (6-8 alphanumeric)
 * 3. Code validation on submit
 * 4. Navigate to confirmation screen (Task 9)
 */
export default function DeviceConnectionScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // Form state
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);

  /**
   * Validate code format (6-8 alphanumeric characters)
   * Requirements: 5.2
   */
  const validateCodeFormat = useCallback((value: string): boolean => {
    // Empty is valid (no error shown until user types)
    if (!value) {
      setFormatError(null);
      return true;
    }

    // Convert to uppercase for validation
    const upperValue = value.toUpperCase();

    // Check length
    if (upperValue.length < 6) {
      setFormatError('El código debe tener al menos 6 caracteres');
      return false;
    }

    if (upperValue.length > 8) {
      setFormatError('El código no puede tener más de 8 caracteres');
      return false;
    }

    // Check alphanumeric only
    if (!/^[A-Z0-9]+$/.test(upperValue)) {
      setFormatError('El código solo puede contener letras y números');
      return false;
    }

    setFormatError(null);
    return true;
  }, []);

  /**
   * Handle code input change with real-time validation
   * Requirements: 5.2, 5.3
   */
  const handleCodeChange = useCallback((value: string) => {
    // Convert to uppercase and remove spaces
    const cleanValue = value.toUpperCase().replace(/\s/g, '');
    
    // Limit to 8 characters
    const limitedValue = cleanValue.slice(0, 8);
    
    setCode(limitedValue);
    setValidationError(null); // Clear server validation errors on input change
    
    // Validate format
    validateCodeFormat(limitedValue);
  }, [validateCodeFormat]);

  /**
   * Handle code validation and navigation
   * Requirements: 5.2, 5.3
   */
  const handleValidateCode = useCallback(async () => {
    // Validate format first
    if (!validateCodeFormat(code)) {
      return;
    }

    if (!code) {
      setValidationError('Por favor ingresa un código de conexión');
      return;
    }

    if (!user?.id) {
      setValidationError('Error de autenticación. Por favor, inicia sesión nuevamente.');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Validate code with service
      const codeData = await validateCode(code);

      if (!codeData) {
        setValidationError('Código no válido o expirado');
        return;
      }

      // Navigate to confirmation screen with code data
      // This will be implemented in Task 9
      router.push({
        pathname: '/caregiver/device-connection-confirm',
        params: {
          code: codeData.code,
          patientId: codeData.patientId,
          patientName: codeData.patientName,
          deviceId: codeData.deviceId,
        },
      });
    } catch (error: any) {
      console.error('[DeviceConnection] Validation error:', error);

      // Handle ConnectionCodeError with user-friendly messages
      if (error instanceof ConnectionCodeError) {
        setValidationError(error.userMessage);
      } else {
        setValidationError('Error al validar el código. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsValidating(false);
    }
  }, [code, user, router, validateCodeFormat]);

  /**
   * Check if form is valid for submission
   */
  const isFormValid = code.length >= 6 && code.length <= 8 && !formatError;

  return (
    <ScreenWrapper applyTopPadding={false}>
      <Container style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <View style={styles.backButtonContainer}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.back()}
                leftIcon={<Ionicons name="chevron-back" size={20} color={colors.gray[700]} />}
                accessibilityLabel="Volver"
                accessibilityHint="Regresa a la pantalla de pacientes"
              >
                Volver
              </Button>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="link-outline"
                  size={48}
                  color={colors.primary[500]}
                  accessible={false}
                />
              </View>
              <Text style={styles.title}>Conectar Dispositivo</Text>
              <Text style={styles.subtitle}>
                Ingresa el código de conexión proporcionado por el paciente para vincular su dispositivo
              </Text>
            </View>

            {/* Connection Code Form */}
            <Card style={styles.card}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Código de Conexión</Text>
                <Text style={styles.sectionDescription}>
                  El código debe tener entre 6 y 8 caracteres alfanuméricos
                </Text>

                <Input
                  label="Código"
                  placeholder="Ej: ABC123"
                  value={code}
                  onChangeText={handleCodeChange}
                  error={formatError || validationError || undefined}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  required
                  leftIcon={
                    <Ionicons
                      name="key-outline"
                      size={20}
                      color={colors.gray[400]}
                    />
                  }
                  rightIcon={
                    code.length >= 6 && !formatError ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.success[500]}
                      />
                    ) : null
                  }
                  accessibilityLabel="Código de conexión"
                  accessibilityHint="Ingresa el código de 6 a 8 caracteres proporcionado por el paciente"
                />

                {/* Format hint */}
                {!formatError && !validationError && code.length > 0 && (
                  <View style={styles.hintContainer}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={colors.gray[500]}
                    />
                    <Text style={styles.hintText}>
                      {code.length}/8 caracteres
                    </Text>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                onPress={handleValidateCode}
                disabled={!isFormValid || isValidating}
                loading={isValidating}
                fullWidth
                accessibilityLabel="Validar código"
                accessibilityHint="Valida el código de conexión e inicia el proceso de vinculación"
              >
                {isValidating ? 'Validando...' : 'Continuar'}
              </Button>
            </Card>

            {/* Help Section */}
            <Card style={styles.helpCard}>
              <View style={styles.helpHeader}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color={colors.primary[500]}
                />
                <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
              </View>

              <View style={styles.helpContent}>
                <View style={styles.helpItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.helpText}>
                    El paciente debe generar un código desde su aplicación
                  </Text>
                </View>

                <View style={styles.helpItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.helpText}>
                    Los códigos expiran después de 24 horas
                  </Text>
                </View>

                <View style={styles.helpItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.helpText}>
                    Cada código solo puede usarse una vez
                  </Text>
                </View>
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </Container>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  backButtonContainer: {
    marginBottom: spacing.md,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.md,
  },
  // Form Card
  card: {
    marginBottom: spacing.lg,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  // Help Card
  helpCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[100],
    borderWidth: 1,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  helpTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  helpContent: {
    gap: spacing.md,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});

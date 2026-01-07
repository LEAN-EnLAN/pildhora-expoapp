import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, BackHandler, ActivityIndicator, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../ui';
import { WizardProgressIndicator } from './WizardProgressIndicator';
import { ExitConfirmationDialog } from './ExitConfirmationDialog';
import { WizardProvider } from './WizardContext';
import {
  WelcomeStep,
  DeviceIdStep,
  VerificationStep,
  WiFiConfigStep,
  PreferencesStep,
  CompletionStep
} from './steps';
import { colors, spacing, shadows, borderRadius } from '../../../theme/tokens';
import {
  triggerHapticFeedback,
  HapticFeedbackType,
  announceForAccessibility,
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  MIN_TOUCH_TARGET_SIZE
} from '../../../utils/accessibility';
import { wizardPersistenceService } from '../../../services/wizardPersistence';

/**
 * Device provisioning wizard form data
 * 
 * Tracks all data collected through the wizard steps.
 */
export interface DeviceProvisioningFormData {
  // Step 2: Device ID Entry
  deviceId: string;

  // Step 4: WiFi Configuration
  wifiSSID?: string;
  wifiPassword?: string;

  // Step 5: Device Preferences
  alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';  // User-friendly options
  ledIntensity: number;  // 0-100
  ledColor: string;      // Hex color
  volume: number;        // 0-100
}

/**
 * Wizard state management
 */
interface WizardState {
  currentStep: number;
  totalSteps: number;
  formData: DeviceProvisioningFormData;
  canProceed: boolean;
  isSubmitting: boolean;
}

/**
 * Props for DeviceProvisioningWizard component
 */
export interface DeviceProvisioningWizardProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
  /** Optional: Resume from saved progress */
  resumeFromSaved?: boolean;
}

const INITIAL_FORM_DATA: DeviceProvisioningFormData = {
  deviceId: '',
  wifiSSID: '',
  wifiPassword: '',
  alarmMode: 'both',
  ledIntensity: 75,
  ledColor: '#3B82F6', // Primary blue
  volume: 75,
};

const STEP_LABELS = [
  'Bienvenida',
  'ID Dispositivo',
  'Verificación',
  'WiFi',
  'Preferencias',
  'Completado',
];

/**
 * DeviceProvisioningWizard Component
 * 
 * Multi-step wizard for guiding patients through device setup.
 * Premium visual overhaul.
 */
export function DeviceProvisioningWizard({
  userId,
  onComplete,
  onCancel,
  resumeFromSaved = true,
}: DeviceProvisioningWizardProps) {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 0,
    totalSteps: 6,
    formData: INITIAL_FORM_DATA,
    canProceed: true, // First step (welcome) can always proceed
    isSubmitting: false,
  });

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(resumeFromSaved);
  const hasUnsavedChanges = useRef(false);
  const lastSavedStep = useRef<number>(0);
  const insets = useSafeAreaInsets();

  // Accessibility state
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [isReduceMotionActive, setIsReduceMotionActive] = useState(false);
  const stepContainerRef = useRef<View>(null);

  // Check accessibility settings on mount
  useEffect(() => {
    const checkAccessibilitySettings = async () => {
      const screenReaderEnabled = await isScreenReaderEnabled();
      const reduceMotionEnabled = await isReduceMotionEnabled();

      setIsScreenReaderActive(screenReaderEnabled);
      setIsReduceMotionActive(reduceMotionEnabled);

      if (screenReaderEnabled) {
        console.log('[DeviceProvisioningWizard] Screen reader detected - enhanced accessibility mode enabled');
      }
    };

    checkAccessibilitySettings();
  }, []);

  // Restore saved progress on mount
  useEffect(() => {
    if (!resumeFromSaved) {
      setIsLoadingProgress(false);
      return;
    }

    const restoreProgress = async () => {
      try {
        const savedProgress = await wizardPersistenceService.restoreProgress(userId);

        if (savedProgress && savedProgress.currentStep > 0) {
          // Don't restore if already on completion step
          if (savedProgress.currentStep < 5) {
            setWizardState(prev => ({
              ...prev,
              currentStep: savedProgress.currentStep,
              formData: savedProgress.formData,
              canProceed: true, // Restored steps are already validated
            }));

            lastSavedStep.current = savedProgress.currentStep;
            hasUnsavedChanges.current = true;

            announceForAccessibility(
              `Progreso restaurado. Continuando desde el paso ${savedProgress.currentStep + 1}`
            );
          }
        }
      } catch (error) {
        console.error('[DeviceProvisioningWizard] Error restoring progress:', error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    restoreProgress();
  }, [userId, resumeFromSaved]);

  // Track if form has been modified
  const updateFormData = useCallback((updates: Partial<DeviceProvisioningFormData>) => {
    hasUnsavedChanges.current = true;
    setWizardState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
    }));
  }, []);

  // Update validation state
  const setCanProceed = useCallback((canProceed: boolean) => {
    setWizardState(prev => ({ ...prev, canProceed }));
  }, []);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (!wizardState.canProceed) {
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
      Alert.alert('Validación', 'Por favor completa todos los campos requeridos antes de continuar');
      return;
    }

    if (wizardState.currentStep < wizardState.totalSteps - 1) {
      await triggerHapticFeedback(HapticFeedbackType.SELECTION);

      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        canProceed: false, // Reset validation for next step
      }));
    }
  }, [wizardState.canProceed, wizardState.currentStep, wizardState.totalSteps]);

  const handleBack = useCallback(async () => {
    if (wizardState.currentStep > 0) {
      await triggerHapticFeedback(HapticFeedbackType.SELECTION);

      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        canProceed: true, // Previous steps are already validated
      }));
    }
  }, [wizardState.currentStep]);

  // Exit handling
  const handleExit = useCallback(() => {
    if (hasUnsavedChanges.current) {
      setShowExitDialog(true);
    } else {
      onCancel();
    }
  }, [onCancel]);

  const handleExitConfirm = useCallback(async () => {
    setShowExitDialog(false);

    // Clear saved progress when user explicitly cancels
    try {
      await wizardPersistenceService.clearProgress();
    } catch (error) {
      console.error('[DeviceProvisioningWizard] Error clearing progress on cancel:', error);
    }

    hasUnsavedChanges.current = false;
    onCancel();
  }, [onCancel]);

  const handleExitCancel = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  // Completion handler
  const handleComplete = useCallback(async () => {
    setWizardState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);

      // Clear saved progress on successful completion
      await wizardPersistenceService.clearProgress();

      hasUnsavedChanges.current = false;
      onComplete();

      announceForAccessibility('Dispositivo configurado exitosamente');
    } catch (error) {
      console.error('[DeviceProvisioningWizard] Error in completion handler:', error);
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
      Alert.alert('Error', 'No se pudo completar la configuración del dispositivo');
      setWizardState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [onComplete]);

  // Skip handler (Autonomous Mode)
  const handleSkip = useCallback(async () => {
    setWizardState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await triggerHapticFeedback(HapticFeedbackType.SELECTION);

      // Clear saved progress
      await wizardPersistenceService.clearProgress();

      // Mark as skipped in backend
      const { skipOnboarding } = require('../../../services/onboarding');
      await skipOnboarding(userId);

      hasUnsavedChanges.current = false;
      onComplete(); // Navigate to home

      announceForAccessibility('Configuración omitida. Modo autónomo activado.');
    } catch (error) {
      console.error('[DeviceProvisioningWizard] Error in skip handler:', error);
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
      Alert.alert('Error', 'No se pudo omitir la configuración. Por favor intenta nuevamente.');
      setWizardState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [userId, onComplete]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (wizardState.currentStep > 0) {
        handleBack();
        return true;
      } else {
        handleExit();
        return true;
      }
    });

    return () => backHandler.remove();
  }, [wizardState.currentStep, handleBack, handleExit]);

  // Keyboard navigation support for web/desktop
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          if (wizardState.canProceed && wizardState.currentStep < wizardState.totalSteps - 1) {
            event.preventDefault();
            handleNext();
          }
          break;
        case 'ArrowLeft':
        case 'PageUp':
          if (wizardState.currentStep > 0) {
            event.preventDefault();
            handleBack();
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleExit();
          break;
        case 'Enter':
          // Only handle Enter on last step to complete
          if (wizardState.currentStep === wizardState.totalSteps - 1 && wizardState.canProceed) {
            event.preventDefault();
            handleComplete();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wizardState, handleNext, handleBack, handleExit, handleComplete]);

  // Announce step changes for screen readers with enhanced context
  useEffect(() => {
    const currentStepLabel = STEP_LABELS[wizardState.currentStep];
    const announcement = isScreenReaderActive
      ? `Navegando al paso ${wizardState.currentStep + 1} de ${wizardState.totalSteps}: ${currentStepLabel}. ${getStepInstructions(wizardState.currentStep)}`
      : `Paso ${wizardState.currentStep + 1} de ${wizardState.totalSteps}: ${currentStepLabel}`;

    // Delay announcement slightly to ensure screen reader picks it up after navigation
    setTimeout(() => {
      announceForAccessibility(announcement);
    }, 300);
  }, [wizardState.currentStep, wizardState.totalSteps, isScreenReaderActive]);

  // Helper function to provide step-specific instructions for screen readers
  const getStepInstructions = (step: number): string => {
    const instructions = [
      'Lee la información de bienvenida y presiona Siguiente para continuar',
      'Ingresa el ID de tu dispositivo en el campo de texto',
      'Espera mientras verificamos tu dispositivo',
      'Configura la conexión WiFi de tu dispositivo',
      'Personaliza las preferencias de alarma y notificaciones',
      'Revisa el resumen y completa la configuración'
    ];
    return instructions[step] || '';
  };

  // Auto-save progress when step changes (except first and last step)
  useEffect(() => {
    // Don't save on initial load or if still loading
    if (isLoadingProgress) {
      return;
    }

    // Don't save welcome step (0) or completion step (5)
    if (wizardState.currentStep === 0 || wizardState.currentStep === 5) {
      return;
    }

    // Only save if we've moved to a new step
    if (wizardState.currentStep === lastSavedStep.current) {
      return;
    }

    const saveProgress = async () => {
      try {
        await wizardPersistenceService.saveProgress({
          currentStep: wizardState.currentStep,
          formData: wizardState.formData,
          userId,
          timestamp: Date.now(),
        });

        lastSavedStep.current = wizardState.currentStep;
      } catch (error) {
        console.error('[DeviceProvisioningWizard] Error saving progress:', error);
        // Don't show error to user, just log it
      }
    };

    saveProgress();
  }, [wizardState.currentStep, wizardState.formData, userId, isLoadingProgress]);

  // Render current step
  const renderStep = () => {
    const isFirstStep = wizardState.currentStep === 0;
    const isLastStep = wizardState.currentStep === wizardState.totalSteps - 1;

    // Render the appropriate step component
    let stepContent: React.ReactNode;

    switch (wizardState.currentStep) {
      case 0:
        stepContent = <WelcomeStep />;
        break;
      case 1:
        stepContent = <DeviceIdStep />;
        break;
      case 2:
        stepContent = <VerificationStep />;
        break;
      case 3:
        stepContent = <WiFiConfigStep />;
        break;
      case 4:
        stepContent = <PreferencesStep />;
        break;
      case 5:
        stepContent = <CompletionStep />;
        break;
      default:
        stepContent = (
          <View style={styles.stepPlaceholder}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        );
    }

    return (
      <View style={styles.stepContainer}>
        {/* Step content */}
        <View style={styles.stepContent}>
          {stepContent}
        </View>

        {/* Navigation Controls */}
        <View
          style={[
            styles.navigationContainer,
            { paddingBottom: spacing.lg + insets.bottom }
          ]}
          accessibilityLabel="Controles de navegación del asistente"
        >
          <View style={styles.navigationButtons}>
            {isFirstStep ? (
              <Button
                onPress={handleExit}
                variant="ghost"
                size="md"
                style={[styles.linkButton, styles.accessibleButton]}
                accessibilityLabel="Cancelar configuración"
                accessibilityHint="Cancela y sale del formulario de configuración. También puedes usar la tecla Escape"
              >
                Cancelar
              </Button>
            ) : (
              <Button
                onPress={handleBack}
                variant="ghost"
                size="md"
                style={[styles.linkButton, styles.accessibleButton]}
                accessibilityLabel={`Paso anterior: ${STEP_LABELS[wizardState.currentStep - 1]}`}
                accessibilityHint="Regresa al paso anterior del formulario. También puedes usar la tecla de flecha izquierda"
              >
                Atrás
              </Button>
            )}

            {!isLastStep && (
              <Button
                onPress={handleNext}
                variant="primary"
                size="lg"
                fullWidth
                disabled={!wizardState.canProceed}
                style={[styles.primaryButton, styles.accessibleButton]}
                accessibilityLabel={`Siguiente paso: ${STEP_LABELS[wizardState.currentStep + 1]}`}
                accessibilityHint={
                  wizardState.canProceed
                    ? "Continúa al siguiente paso del formulario. También puedes usar la tecla de flecha derecha"
                    : "Completa los campos requeridos antes de continuar"
                }
              >
                Siguiente
              </Button>
            )}

            {isLastStep && (
              <Button
                onPress={handleComplete}
                variant="primary"
                size="lg"
                fullWidth
                disabled={!wizardState.canProceed}
                loading={wizardState.isSubmitting}
                style={[styles.primaryButton, styles.accessibleButton]}
                accessibilityLabel="Completar configuración del dispositivo"
                accessibilityHint="Finaliza la configuración y guarda todos los ajustes. También puedes usar la tecla Enter"
              >
                Completar
              </Button>
            )}
          </View>

          {/* Keyboard shortcuts hint for screen readers */}
          {Platform.OS === 'web' && (
            <View
              style={styles.keyboardHints}
              accessibilityElementsHidden={!isScreenReaderActive}
            >
              <View accessible={true} accessibilityLabel="Atajos de teclado disponibles: Flecha derecha o Page Down para siguiente paso, Flecha izquierda o Page Up para paso anterior, Escape para cancelar" />
            </View>
          )}
        </View>
      </View>
    );
  };

  // Show loading state while restoring progress
  if (isLoadingProgress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <WizardProvider
      value={{
        formData: wizardState.formData,
        updateFormData,
        setCanProceed,
        userId,
        isReduceMotionActive,
        onSkip: handleSkip,
      }}
    >
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#BAE6FD']} // Light blue gradient
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View
          style={styles.safeArea}
          accessible={false}
          accessibilityLabel="Asistente de configuración del dispositivo"
        >
          {/* Progress Indicator */}
          <View style={styles.progressWrapper}>
            <WizardProgressIndicator
              currentStep={wizardState.currentStep}
              totalSteps={wizardState.totalSteps}
              stepLabels={STEP_LABELS}
            />
          </View>

          {/* Current Step Content */}
          <View
            ref={stepContainerRef}
            style={styles.content}
            accessible={false}
          >
            {renderStep()}
          </View>

          {/* Exit Confirmation Dialog */}
          <ExitConfirmationDialog
            visible={showExitDialog}
            onConfirm={handleExitConfirm}
            onCancel={handleExitCancel}
          />
        </View>
      </LinearGradient>
    </WizardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: 800, // Limit width on large screens
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glassmorphism effect
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.md,
  },
  stepPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: 'transparent',
  },
  navigationContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  navigationButtons: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.md,
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  primaryButton: {
    borderRadius: borderRadius.full, // Pill shaped buttons
  },
  // Ensure buttons meet minimum touch target size (44x44)
  accessibleButton: {
    minHeight: MIN_TOUCH_TARGET_SIZE,
    minWidth: MIN_TOUCH_TARGET_SIZE,
  },
  keyboardHints: {
    position: 'absolute',
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});

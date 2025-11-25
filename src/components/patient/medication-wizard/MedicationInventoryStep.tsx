import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput as RNTextInput,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../ui';
import { useWizardContext } from './WizardContext';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';
import { useDebouncedCallback } from '../../../utils/performance';

interface MedicationInventoryStepProps {
  // No props needed - uses wizard context
}

export function MedicationInventoryStep({}: MedicationInventoryStepProps) {
  const { formData, updateFormData, setCanProceed, mode } = useWizardContext();

  // State for inventory tracking
  const [trackInventory, setTrackInventory] = useState(true);
  const [initialQuantity, setInitialQuantity] = useState(
    formData.initialQuantity?.toString() || ''
  );
  const [lowQuantityThreshold, setLowQuantityThreshold] = useState(
    formData.lowQuantityThreshold?.toString() || ''
  );
  const [autoThreshold, setAutoThreshold] = useState(true);
  const [quantityError, setQuantityError] = useState('');

  // Calculate auto threshold based on schedule
  const calculateAutoThreshold = (): number => {
    const timesPerDay = formData.times?.length || 1;
    const daysPerWeek = formData.frequency?.length || 7;
    
    // Calculate average doses per day
    const avgDosesPerWeek = timesPerDay * daysPerWeek;
    const avgDosesPerDay = avgDosesPerWeek / 7;
    
    // 3 days buffer as per requirements
    return Math.ceil(avgDosesPerDay * 3);
  };

  // Update auto threshold when schedule changes or quantity is entered
  useEffect(() => {
    if (autoThreshold && initialQuantity) {
      const calculated = calculateAutoThreshold();
      setLowQuantityThreshold(calculated.toString());
      updateFormData({ lowQuantityThreshold: calculated });
    }
  }, [autoThreshold, initialQuantity, formData.times, formData.frequency]);

  // Validation function
  const validateFields = (): boolean => {
    // If not tracking inventory, skip is valid
    if (!trackInventory) {
      return true;
    }

    // If tracking, must have initial quantity
    if (!initialQuantity || initialQuantity.trim() === '') {
      setQuantityError('Ingresa la cantidad inicial');
      return false;
    }

    const qty = parseInt(initialQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setQuantityError('Ingresa un número válido mayor a 0');
      return false;
    }

    if (qty > 9999) {
      setQuantityError('La cantidad es demasiado grande');
      return false;
    }

    setQuantityError('');
    return true;
  };

  // Debounced validation for better performance (300ms delay)
  const debouncedValidation = useDebouncedCallback(() => {
    const isValid = validateFields();
    setCanProceed(isValid);
  }, 300);

  // Handle initial quantity change with debounced validation
  const handleQuantityChange = (text: string) => {
    // Allow only numbers
    if (text === '' || /^\d+$/.test(text)) {
      setInitialQuantity(text);
      
      if (text) {
        const qty = parseInt(text, 10);
        updateFormData({ initialQuantity: qty });
      } else {
        updateFormData({ initialQuantity: undefined });
      }
      
      // Debounced validation to avoid excessive re-renders
      debouncedValidation();
    }
  };

  // Handle manual threshold change
  const handleThresholdChange = (text: string) => {
    // Allow only numbers
    if (text === '' || /^\d+$/.test(text)) {
      setLowQuantityThreshold(text);
      setAutoThreshold(false);
      
      if (text) {
        const threshold = parseInt(text, 10);
        updateFormData({ lowQuantityThreshold: threshold });
      } else {
        updateFormData({ lowQuantityThreshold: undefined });
      }
      
      // Debounced validation to avoid excessive re-renders
      debouncedValidation();
    }
  };

  // Handle skip inventory tracking
  const handleSkip = () => {
    setTrackInventory(false);
    updateFormData({
      initialQuantity: undefined,
      lowQuantityThreshold: undefined,
    });
    // Immediate validation for skip action
    setCanProceed(true);
  };

  // Handle enable inventory tracking
  const handleEnableTracking = () => {
    setTrackInventory(true);
    // Trigger validation after enabling
    debouncedValidation();
  };

  // Update validation whenever tracking state changes (immediate for better UX)
  useEffect(() => {
    if (!trackInventory) {
      setCanProceed(true);
    } else {
      const isValid = validateFields();
      setCanProceed(isValid);
    }
  }, [trackInventory]);

  // Initialize validation on mount
  useEffect(() => {
    const isValid = validateFields();
    setCanProceed(isValid);
  }, []);

  // If in edit mode, this step shouldn't be shown
  if (mode === 'edit') {
    return null;
  }

  // If user chose to skip inventory tracking
  if (!trackInventory) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Paso 4: Inventario omitido"
      >
        <View style={styles.skipContainer}>
          <Text style={styles.skipIcon}>📦</Text>
          <Text style={styles.skipTitle}>Inventario omitido</Text>
          <Text style={styles.skipText}>
            No se realizará seguimiento del inventario para este medicamento.
            Puedes activarlo más tarde desde la configuración del medicamento.
          </Text>
          
          <Button
            onPress={handleEnableTracking}
            variant="secondary"
            size="lg"
            style={styles.enableButton}
            accessibilityLabel="Activar seguimiento de inventario"
          >
            Activar seguimiento
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Paso 4: Configuración de inventario"
      accessibilityHint="Configura el seguimiento de inventario para tu medicamento"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
        <Text style={styles.subtitle}>
          Configura el seguimiento de inventario para saber cuándo necesitas recargar
        </Text>
      </View>

      {/* Initial Quantity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Cantidad inicial <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperText}>
          ¿Cuántas dosis tienes actualmente?
        </Text>

        <View style={styles.quantityInputContainer}>
          <RNTextInput
            style={[
              styles.quantityInput,
              quantityError && styles.quantityInputError,
            ]}
            value={initialQuantity}
            onChangeText={handleQuantityChange}
            placeholder="0"
            keyboardType="number-pad"
            maxLength={4}
            accessible={true}
            accessibilityLabel="Cantidad inicial de dosis"
            accessibilityHint="Ingresa cuántas dosis tienes actualmente"
            accessibilityRole="none"
          />
          <Text style={styles.quantityUnit}>dosis</Text>
        </View>

        {quantityError && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {quantityError}
          </Text>
        )}

        {/* Visual Quantity Indicator */}
        {initialQuantity && !quantityError && (
          <QuantityVisualizer quantity={parseInt(initialQuantity, 10)} />
        )}
      </View>

      {/* Low Quantity Threshold Section */}
      {initialQuantity && !quantityError && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Alerta de cantidad baja</Text>
          <Text style={styles.helperText}>
            Te avisaremos cuando queden pocas dosis
          </Text>

          <View style={styles.thresholdContainer}>
            <View style={styles.thresholdInputRow}>
              <Text style={styles.thresholdLabel}>Alertar cuando queden:</Text>
              <View style={styles.thresholdInputWrapper}>
                <RNTextInput
                  style={styles.thresholdInput}
                  value={lowQuantityThreshold}
                  onChangeText={handleThresholdChange}
                  keyboardType="number-pad"
                  maxLength={4}
                  accessible={true}
                  accessibilityLabel="Umbral de cantidad baja"
                  accessibilityHint="Cantidad de dosis para activar la alerta"
                  accessibilityRole="none"
                />
                <Text style={styles.thresholdUnit}>dosis</Text>
              </View>
            </View>

            {autoThreshold && (
              <View style={styles.autoThresholdBadge}>
                <Text style={styles.autoThresholdIcon}>✨</Text>
                <Text style={styles.autoThresholdText}>
                  Calculado automáticamente (3 días de reserva)
                </Text>
              </View>
            )}
          </View>

          {/* Threshold Preview */}
          {lowQuantityThreshold && (
            <ThresholdPreview
              currentQuantity={parseInt(initialQuantity, 10)}
              threshold={parseInt(lowQuantityThreshold, 10)}
            />
          )}
        </View>
      )}

      {/* Skip Option */}
      <View style={styles.skipSection}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessible={true}
          accessibilityLabel="Omitir seguimiento de inventario"
          accessibilityHint="No realizar seguimiento de inventario para este medicamento"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonIcon}>⏭️</Text>
          <View style={styles.skipButtonContent}>
            <Text style={styles.skipButtonTitle}>Omitir inventario</Text>
            <Text style={styles.skipButtonText}>
              No realizar seguimiento de inventario
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          El seguimiento de inventario te ayuda a saber cuándo necesitas recargar tu medicamento.
          Puedes activarlo o desactivarlo en cualquier momento.
        </Text>
      </View>
    </ScrollView>
  );
}

// Quantity Visualizer Component
interface QuantityVisualizerProps {
  quantity: number;
}

function QuantityVisualizer({ quantity }: QuantityVisualizerProps) {
  const displayCount = Math.min(quantity, 20); // Cap at 20 for display
  const rows = Math.ceil(displayCount / 10);

  return (
    <View style={styles.visualizer}>
      <Text style={styles.visualizerLabel}>Vista previa del inventario:</Text>
      <View style={styles.visualizerContent}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.visualizerRow}>
            {Array.from({ length: Math.min(10, displayCount - rowIndex * 10) }).map(
              (_, colIndex) => (
                <View key={colIndex} style={styles.pillIcon}>
                  <Text style={styles.pillEmoji}>💊</Text>
                </View>
              )
            )}
          </View>
        ))}
        {quantity > 20 && (
          <Text style={styles.visualizerMore}>+{quantity - 20} más</Text>
        )}
      </View>
      <Text style={styles.visualizerTotal}>Total: {quantity} dosis</Text>
    </View>
  );
}

// Threshold Preview Component
interface ThresholdPreviewProps {
  currentQuantity: number;
  threshold: number;
}

function ThresholdPreview({ currentQuantity, threshold }: ThresholdPreviewProps) {
  const percentage = Math.min((threshold / currentQuantity) * 100, 100);
  const isLow = currentQuantity <= threshold;

  return (
    <View style={styles.thresholdPreview}>
      <View style={styles.thresholdPreviewHeader}>
        <Text style={styles.thresholdPreviewLabel}>Estado actual:</Text>
        <Text
          style={[
            styles.thresholdPreviewStatus,
            isLow && styles.thresholdPreviewStatusLow,
          ]}
        >
          {isLow ? '⚠️ Cantidad baja' : '✅ Cantidad suficiente'}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: isLow ? colors.warning[500] : colors.success[500],
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.progressBarThreshold,
            { left: `${percentage}%` },
          ]}
        >
          <View style={styles.progressBarThresholdLine} />
          <Text style={styles.progressBarThresholdLabel}>{threshold}</Text>
        </View>
      </View>

      <Text style={styles.thresholdPreviewText}>
        Se activará la alerta cuando queden {threshold} dosis o menos
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: typography.fontSize.base * 1.5,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error[500],
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },

  // Quantity Input
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  quantityInput: {
    fontSize: 64,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    minWidth: 180,
    minHeight: 100,
  },
  quantityInputError: {
    borderColor: colors.error[500],
  },
  quantityUnit: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Quantity Visualizer
  visualizer: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  visualizerLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  visualizerContent: {
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 60,
  },
  visualizerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pillIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillEmoji: {
    fontSize: 24,
  },
  visualizerMore: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
    marginTop: spacing.sm,
  },
  visualizerTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // Threshold Container
  thresholdContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  thresholdInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  thresholdLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    flex: 1,
  },
  thresholdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thresholdInput: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    minWidth: 80,
  },
  thresholdUnit: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
  },
  autoThresholdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
  },
  autoThresholdIcon: {
    fontSize: 16,
  },
  autoThresholdText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },

  // Threshold Preview
  thresholdPreview: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  thresholdPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  thresholdPreviewLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
  },
  thresholdPreviewStatus: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success[500],
  },
  thresholdPreviewStatusLow: {
    color: colors.warning[500],
  },
  progressBarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressBarThreshold: {
    position: 'absolute',
    top: -8,
    transform: [{ translateX: -12 }],
    alignItems: 'center',
  },
  progressBarThresholdLine: {
    width: 2,
    height: 28,
    backgroundColor: colors.gray[700],
  },
  progressBarThresholdLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[700],
    marginTop: spacing.xs,
  },
  thresholdPreviewText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textAlign: 'center',
  },

  // Skip Section
  skipSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  skipButtonIcon: {
    fontSize: 32,
  },
  skipButtonContent: {
    flex: 1,
  },
  skipButtonTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  skipButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },

  // Skip Container (when inventory is skipped)
  skipContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  skipIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  skipTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  skipText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing.xl,
  },
  enableButton: {
    minWidth: 200,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    gap: spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * 1.5,
  },
});

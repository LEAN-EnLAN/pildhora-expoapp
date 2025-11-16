import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, Chip } from '../../ui';
import { useWizardContext } from './WizardContext';
import { DOSE_UNITS, QUANTITY_TYPES } from '../../../types';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import { useDebouncedCallback } from '../../../utils/performance';

// Unit mappings by medication type
const UNIT_MAPPINGS: Record<string, string[]> = {
  tablets: ['units', 'mg', 'g', 'mcg'],
  capsules: ['units', 'mg', 'g', 'mcg'],
  liquid: ['ml', 'l', 'drops'],
  cream: ['g', 'ml', 'applications'],
  inhaler: ['puffs', 'inhalations'],
  drops: ['drops', 'ml'],
  spray: ['sprays', 'applications', 'ml'],
  other: ['units', 'mg', 'g', 'mcg', 'ml', 'l', 'drops', 'sprays', 'puffs', 'inhalations', 'applications', 'custom'],
};

interface MedicationDosageStepProps {
  // No props needed - uses wizard context
}

export const MedicationDosageStep = React.memo(function MedicationDosageStep({}: MedicationDosageStepProps) {
  const { formData, updateFormData, setCanProceed } = useWizardContext();
  const { width: screenWidth } = useWindowDimensions();

  const [doseValue, setDoseValue] = useState(formData.doseValue || '');
  const [doseUnit, setDoseUnit] = useState(formData.doseUnit || '');
  const [quantityType, setQuantityType] = useState(formData.quantityType || '');
  const [customUnit, setCustomUnit] = useState('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<typeof DOSE_UNITS[number][]>([...DOSE_UNITS]);
  
  const [doseValueError, setDoseValueError] = useState('');
  const [doseUnitError, setDoseUnitError] = useState('');
  const [quantityTypeError, setQuantityTypeError] = useState('');

  // Calculate responsive layout values
  const responsiveLayout = useMemo(() => {
    const isSmallScreen = screenWidth < 360;
    const isMediumScreen = screenWidth >= 360 && screenWidth < 768;
    const isTablet = screenWidth >= 768;
    
    // Calculate quantity type button width as percentage string
    let quantityTypeWidth: string | number = '47%'; // Default for 2 columns
    if (isTablet) {
      quantityTypeWidth = '31%'; // 3 columns on tablets
    } else if (isSmallScreen) {
      quantityTypeWidth = '100%'; // 1 column on very small screens
    }
    
    return {
      isSmallScreen,
      isMediumScreen,
      isTablet,
      quantityTypeWidth: quantityTypeWidth as '47%' | '31%' | '100%',
      doseInputFontSize: isSmallScreen ? 36 : isTablet ? 56 : 48,
      chipSize: isSmallScreen ? 'sm' as const : 'md' as const,
    };
  }, [screenWidth]);

  // Validation function
  const validateFields = (
    currentDoseValue: string,
    currentDoseUnit: string,
    currentQuantityType: string
  ): boolean => {
    let isValid = true;

    // Validate dose value
    if (!currentDoseValue || currentDoseValue.trim() === '') {
      setDoseValueError('Ingresa el valor de la dosis');
      isValid = false;
    } else if (!/^\d*\.?\d{0,2}$/.test(currentDoseValue)) {
      setDoseValueError('Ingresa un valor numérico válido (ej: 500, 10.5)');
      isValid = false;
    } else if (parseFloat(currentDoseValue) <= 0) {
      setDoseValueError('El valor debe ser mayor a 0');
      isValid = false;
    } else if (currentDoseValue.length > 10) {
      setDoseValueError('El valor es demasiado largo');
      isValid = false;
    } else {
      setDoseValueError('');
    }

    // Validate dose unit
    if (!currentDoseUnit || currentDoseUnit.trim() === '') {
      setDoseUnitError('Selecciona una unidad de dosis');
      isValid = false;
    } else {
      setDoseUnitError('');
    }

    // Validate quantity type
    if (!currentQuantityType || currentQuantityType.trim() === '') {
      setQuantityTypeError('Selecciona el tipo de medicamento');
      isValid = false;
    } else {
      setQuantityTypeError('');
    }

    return isValid;
  };

  // Debounced validation for better performance (300ms delay)
  const debouncedValidation = useDebouncedCallback((
    currentDoseValue: string,
    currentDoseUnit: string,
    currentQuantityType: string
  ) => {
    const isValid = validateFields(currentDoseValue, currentDoseUnit, currentQuantityType);
    setCanProceed(isValid);
  }, 300);

  // Handle dose value change with debounced validation
  const handleDoseValueChange = useCallback((text: string) => {
    // Allow only numbers and one decimal point
    if (text === '' || /^\d*\.?\d{0,2}$/.test(text)) {
      setDoseValue(text);
      updateFormData({ doseValue: text });
      // Debounced validation to avoid excessive re-renders
      debouncedValidation(text, doseUnit, quantityType);
    }
  }, [doseUnit, quantityType, updateFormData, debouncedValidation]);

  // Handle dose unit selection
  const handleDoseUnitSelect = useCallback((unitId: string) => {
    if (unitId === 'custom') {
      setShowCustomUnit(true);
      setDoseUnit('');
      setDoseUnitError('Ingresa una unidad personalizada');
      setCanProceed(false);
    } else {
      setShowCustomUnit(false);
      setCustomUnit('');
      setDoseUnit(unitId);
      const isValid = validateFields(doseValue, unitId, quantityType);
      updateFormData({ doseUnit: unitId });
      setCanProceed(isValid);
    }
  }, [doseValue, quantityType, validateFields, updateFormData, setCanProceed]);

  // Handle custom unit change
  const handleCustomUnitChange = useCallback((text: string) => {
    setCustomUnit(text);
    setDoseUnit(text);
    const isValid = validateFields(doseValue, text, quantityType);
    updateFormData({ doseUnit: text });
    setCanProceed(isValid);
  }, [doseValue, quantityType, validateFields, updateFormData, setCanProceed]);

  // Handle quantity type selection
  const handleQuantityTypeSelect = useCallback((typeId: string) => {
    setQuantityType(typeId);
    const isValid = validateFields(doseValue, doseUnit, typeId);
    updateFormData({ quantityType: typeId });
    setCanProceed(isValid);
  }, [doseValue, doseUnit, validateFields, updateFormData, setCanProceed]);

  // Filter available units based on medication type
  useEffect(() => {
    if (quantityType) {
      const allowedUnitIds = UNIT_MAPPINGS[quantityType] || [];
      const filtered = [...DOSE_UNITS].filter(unit => 
        allowedUnitIds.includes(unit.id)
      );
      setAvailableUnits(filtered);
      
      // Reset unit if it's not compatible with the new type
      if (doseUnit && !allowedUnitIds.includes(doseUnit)) {
        const previousUnit = DOSE_UNITS.find(u => u.id === doseUnit)?.label || doseUnit;
        setDoseUnit('');
        setShowCustomUnit(false);
        setCustomUnit('');
        updateFormData({ doseUnit: '' });
        
        // Show alert notification
        Alert.alert(
          'Unidad reiniciada',
          `La unidad anterior "${previousUnit}" no es compatible con el tipo de medicamento seleccionado. Por favor, selecciona una nueva unidad.`,
          [{ text: 'Entendido' }]
        );
        
        // Revalidate after reset
        const isValid = validateFields(doseValue, '', quantityType);
        setCanProceed(isValid);
      }
    } else {
      // If no quantity type selected, show all units
      setAvailableUnits([...DOSE_UNITS]);
    }
  }, [quantityType]);

  // Initialize validation on mount
  useEffect(() => {
    const isValid = validateFields(doseValue, doseUnit, quantityType);
    setCanProceed(isValid);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Paso 3: Configuración de dosis"
      accessibilityHint="Configura la cantidad y tipo de medicamento"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dosis</Text>
        <Text style={styles.subtitle}>
          Configura la cantidad y tipo de medicamento que debes tomar
        </Text>
      </View>

      {/* Dose Value Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Cantidad <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperText}>
          Ingresa el valor numérico de la dosis
        </Text>

        <View style={styles.doseValueContainer}>
          <View style={styles.doseInputWrapper}>
            <RNTextInput
              style={[
                styles.doseValueInput,
                { fontSize: responsiveLayout.doseInputFontSize },
                doseValueError && styles.doseValueInputError,
              ]}
              value={doseValue}
              onChangeText={handleDoseValueChange}
              placeholder="Ej: 500, 10, 0.5"
              keyboardType="decimal-pad"
              maxLength={10}
              accessible={true}
              accessibilityLabel="Valor de la dosis"
              accessibilityHint="Ingresa el valor numérico de la dosis"
              accessibilityRole="none"
            />
            {/* Inline Emoji Preview */}
            {doseValue && !doseValueError && formData.emoji && (
              <Text style={styles.inlinePreviewEmoji}>
                {formData.emoji}
              </Text>
            )}
          </View>
        </View>

        {doseValueError && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {doseValueError}
          </Text>
        )}
      </View>

      {/* Quantity Type Section - Moved here to replace preview container */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Tipo de medicamento <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperText}>
          Selecciona la forma del medicamento
        </Text>

        <View
          style={styles.quantityTypesGrid}
          accessible={true}
          accessibilityLabel="Selector de tipo de medicamento"
          accessibilityRole="menu"
        >
          {QUANTITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.quantityTypeButton,
                { width: responsiveLayout.quantityTypeWidth },
                quantityType === type.id && styles.quantityTypeButtonSelected,
              ]}
              onPress={() => handleQuantityTypeSelect(type.id)}
              accessible={true}
              accessibilityLabel={type.label}
              accessibilityRole="button"
              accessibilityState={{ selected: quantityType === type.id }}
              accessibilityHint={`Toca para seleccionar ${type.label}`}
            >
              <Text style={[
                styles.quantityTypeIcon,
                { fontSize: responsiveLayout.isSmallScreen ? 28 : 32 }
              ]}>
                {getQuantityTypeEmoji(type.id)}
              </Text>
              <Text
                style={[
                  styles.quantityTypeLabel,
                  { fontSize: responsiveLayout.isSmallScreen ? typography.fontSize.xs : typography.fontSize.sm },
                  quantityType === type.id && styles.quantityTypeLabelSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {quantityTypeError && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {quantityTypeError}
          </Text>
        )}
      </View>

      {/* Dose Unit Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Unidad <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperText}>
          Selecciona la unidad de medida
        </Text>

        <View
          style={styles.unitsGrid}
          accessible={true}
          accessibilityLabel="Selector de unidades de dosis"
          accessibilityRole="menu"
        >
          {availableUnits.map((unit) => (
            <Chip
              key={unit.id}
              label={unit.label}
              selected={doseUnit === unit.id || (unit.id === 'custom' && showCustomUnit)}
              onPress={() => handleDoseUnitSelect(unit.id)}
              variant="outlined"
              color="primary"
              size={responsiveLayout.chipSize}
              style={styles.unitChip}
              accessibilityLabel={unit.label}
              accessibilityHint={
                doseUnit === unit.id
                  ? `${unit.label} está seleccionado`
                  : `Toca para seleccionar ${unit.label}`
              }
            />
          ))}
        </View>

        {/* Custom Unit Input */}
        {showCustomUnit && (
          <View style={styles.customUnitContainer}>
            <Input
              label="Unidad personalizada"
              value={customUnit}
              onChangeText={handleCustomUnitChange}
              placeholder="Ej: cucharadas, sobres"
              variant="outlined"
              size="md"
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              accessible={true}
              accessibilityLabel="Unidad personalizada"
              accessibilityHint="Escribe tu propia unidad de medida"
            />
          </View>
        )}

        {doseUnitError && !showCustomUnit && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {doseUnitError}
          </Text>
        )}
      </View>

      {/* Summary Section */}
      {doseValue && doseUnit && quantityType && !doseValueError && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryIcon}>📋</Text>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Resumen de la dosis:</Text>
            <Text style={styles.summaryText}>
              {doseValue} {doseUnit} de {QUANTITY_TYPES.find(t => t.id === quantityType)?.label.toLowerCase() || quantityType}
            </Text>
          </View>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Asegúrate de ingresar la dosis exacta como aparece en tu receta médica
        </Text>
      </View>
    </ScrollView>
  );
});

// Enhanced Pill Preview Component
interface PillPreviewProps {
  count: number;
  emoji?: string;
}

const PillPreview = React.memo(function PillPreview({ count, emoji = '💊' }: PillPreviewProps) {
  const displayCount = Math.min(count, 12);
  
  return (
    <View style={styles.pillPreview}>
      {/* Display medication emoji */}
      {emoji && (
        <Text style={styles.previewEmoji}>{emoji}</Text>
      )}
      
      <View style={styles.pillGrid}>
        {Array.from({ length: displayCount }).map((_, index) => (
          <View key={index} style={styles.pillContainer}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              style={styles.pill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.pillShine} />
            </LinearGradient>
          </View>
        ))}
      </View>
      {count > 12 && (
        <Text style={styles.pillMoreText}>
          +{count - 12} más
        </Text>
      )}
    </View>
  );
});

// Enhanced Liquid Preview Component
interface LiquidPreviewProps {
  amount: number;
  unit: string;
  emoji?: string;
}

const LiquidPreview = React.memo(function LiquidPreview({ amount, unit, emoji = '💊' }: LiquidPreviewProps) {
  // Calculate fill percentage based on amount
  // For ml: assume max 100ml for visualization
  // For l: convert to ml (1l = 1000ml)
  // For drops: assume max 20 drops for visualization
  let maxAmount = 100;
  let displayAmount = amount;
  
  if (unit === 'l') {
    displayAmount = amount * 1000; // Convert liters to ml
    maxAmount = 1000;
  } else if (unit === 'drops' || unit === 'gotas') {
    maxAmount = 20;
  }
  
  const fillPercentage = Math.min((displayAmount / maxAmount) * 100, 100);
  
  return (
    <View style={styles.liquidPreview}>
      {/* Display medication emoji */}
      {emoji && (
        <Text style={styles.previewEmoji}>{emoji}</Text>
      )}
      
      <View style={styles.liquidGlassContainer}>
        {/* Glass border container */}
        <View style={styles.liquidGlass}>
          {/* Gradient fill */}
          <LinearGradient
            colors={[colors.info[400], colors.info[600]]}
            style={[styles.liquidFill, { height: `${fillPercentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>
      </View>
      
      {/* Amount and unit label */}
      <Text style={styles.liquidLabel}>
        {amount} {unit}
      </Text>
    </View>
  );
});

// Enhanced Cream Preview Component
interface CreamPreviewProps {
  amount: number;
  unit: string;
  emoji?: string;
}

const CreamPreview = React.memo(function CreamPreview({ amount, unit, emoji = '💊' }: CreamPreviewProps) {
  // Calculate fill percentage based on amount
  // For g: assume max 100g for visualization
  // For ml: assume max 100ml for visualization
  // For applications: assume max 20 applications for visualization
  let maxAmount = 100;
  let displayAmount = amount;
  
  if (unit === 'applications' || unit === 'aplicaciones') {
    maxAmount = 20;
  }
  
  const fillPercentage = Math.min((displayAmount / maxAmount) * 100, 100);
  
  return (
    <View style={styles.creamPreview}>
      {/* Display medication emoji */}
      {emoji && (
        <Text style={styles.previewEmoji}>{emoji}</Text>
      )}
      
      <View style={styles.creamTubeContainer}>
        {/* Tube visualization */}
        <LinearGradient
          colors={[colors.success[400], colors.success[600]]}
          style={styles.creamTube}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Cap section at top */}
          <View style={styles.creamCap}>
            <View style={styles.creamCapTop} />
          </View>
          
          {/* Body section with fill indicator */}
          <View style={styles.creamBody}>
            {/* Fill level indicator */}
            <View style={styles.creamFillContainer}>
              <View 
                style={[
                  styles.creamFill, 
                  { width: `${fillPercentage}%` }
                ]} 
              />
            </View>
          </View>
        </LinearGradient>
      </View>
      
      {/* Amount and unit label */}
      <Text style={styles.creamLabel}>
        {amount} {unit}
      </Text>
    </View>
  );
});

// Helper function to get emoji for quantity type
function getQuantityTypeEmoji(typeId: string): string {
  const emojiMap: Record<string, string> = {
    tablets: '💊',
    capsules: '💊',
    liquid: '🧪',
    cream: '🧴',
    inhaler: '💨',
    drops: '💧',
    spray: '💦',
    other: '📦',
  };
  return emojiMap[typeId] || '💊';
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

  // Dose Value Input
  doseValueContainer: {
    marginBottom: spacing.sm,
  },
  doseInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doseValueInput: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    padding: spacing.lg,
    paddingRight: spacing.xl * 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    minHeight: 100,
    width: '100%',
  },
  doseValueInputError: {
    borderColor: colors.error[500],
  },
  inlinePreviewEmoji: {
    position: 'absolute',
    right: spacing.lg,
    fontSize: 44,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Units Grid
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  unitChip: {
    minWidth: 44,
    minHeight: 44,
  },
  customUnitContainer: {
    marginTop: spacing.md,
  },

  // Quantity Types Grid
  quantityTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  quantityTypeButton: {
    // Width will be set dynamically via inline styles
    aspectRatio: 1.5,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 80,
  },
  quantityTypeButtonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  quantityTypeIcon: {
    fontSize: 32,
  },
  quantityTypeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    textAlign: 'center',
  },
  quantityTypeLabelSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },

  // Dosage Visualizer
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 60,
  },
  dropEmoji: {
    fontSize: 28,
  },
  visualizerEmoji: {
    fontSize: 48,
  },
  visualizerCount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  visualizerMore: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
  },

  // Preview Emoji (shared across all preview types)
  previewEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // Enhanced Liquid Preview
  liquidPreview: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  liquidGlassContainer: {
    width: 100,
    height: 140,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liquidGlass: {
    width: 80,
    height: 120,
    borderWidth: 3,
    borderColor: colors.gray[400],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
    position: 'relative',
    ...shadows.md,
  },
  liquidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  liquidLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    textAlign: 'center',
  },

  // Enhanced Cream Preview
  creamPreview: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  creamTubeContainer: {
    width: 100,
    height: 160,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creamTube: {
    width: 90,
    height: 150,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  creamCap: {
    height: 35,
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  creamCapTop: {
    width: 30,
    height: 15,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.sm,
  },
  creamBody: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  creamFillContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  creamFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: borderRadius.md,
  },
  creamLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    textAlign: 'center',
  },

  // Enhanced Pill Preview
  pillPreview: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: 300,
  },
  pillContainer: {
    width: 44,
    height: 44,
  },
  pill: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  pillShine: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  pillMoreText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
  },

  // Summary Box
  summaryBox: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success[500],
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
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

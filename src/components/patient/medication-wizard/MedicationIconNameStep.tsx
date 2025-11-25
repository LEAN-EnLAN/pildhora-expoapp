import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  ScrollView,
  useWindowDimensions,
  Alert,
  Keyboard
} from 'react-native';
import { Input } from '../../ui';
import { useWizardContext } from './WizardContext';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import { useDebouncedCallback } from '../../../utils/performance';

// Common emojis for medications
const COMMON_MEDICATION_EMOJIS = [
  '💊', '💉', '🩹', '🩺', '🧪', '🧬',
  '🌡️', '💙', '❤️', '🧡', '💚', '💛',
  '🔴', '🔵', '🟢', '🟡', '🟠', '🟣',
  '⚪', '⚫', '🟤', '🩷', '🤍', '🖤'
];

interface MedicationIconNameStepProps {
  // No props needed - uses wizard context
}

export const MedicationIconNameStep = React.memo(function MedicationIconNameStep({ }: MedicationIconNameStepProps) {
  const { formData, updateFormData, setCanProceed } = useWizardContext();
  const { width: screenWidth } = useWindowDimensions();

  const [emoji, setEmoji] = useState(formData.emoji || '');
  const [name, setName] = useState(formData.name || '');
  const [nameError, setNameError] = useState('');
  const [emojiError, setEmojiError] = useState('');

  // Ref for hidden emoji input
  const emojiInputRef = useRef<RNTextInput>(null);

  // Calculate responsive emoji grid layout
  const emojiGridLayout = useMemo(() => {
    // Responsive emoji button size based on screen width
    let emojiSize = 56;
    let gap = 8;

    // Adjust sizes for different screen widths
    if (screenWidth < 360) {
      // Small phones (320-360px)
      emojiSize = 48;
      gap = 6;
    } else if (screenWidth >= 768) {
      // Tablets (768px+)
      emojiSize = 64;
      gap = 12;
    }

    const horizontalPadding = spacing.lg * 2; // padding on both sides
    const availableWidth = screenWidth - horizontalPadding;

    // Calculate how many emojis fit per row
    const emojisPerRow = Math.floor(availableWidth / (emojiSize + gap));

    // Ensure at least 4 emojis per row on small screens, up to 10 on tablets
    const minEmojis = screenWidth < 360 ? 4 : 5;
    const maxEmojis = screenWidth >= 768 ? 10 : 8;
    const clampedEmojisPerRow = Math.max(minEmojis, Math.min(maxEmojis, emojisPerRow));

    return {
      emojisPerRow: clampedEmojisPerRow,
      emojiSize,
      gap,
    };
  }, [screenWidth]);

  // Validation function
  const validateFields = useCallback((currentEmoji: string, currentName: string): boolean => {
    let isValid = true;

    // Validate emoji
    if (!currentEmoji || currentEmoji.trim() === '') {
      setEmojiError('Selecciona un icono para tu medicamento');
      isValid = false;
    } else {
      setEmojiError('');
    }

    // Validate name
    if (!currentName || currentName.trim() === '') {
      setNameError('Ingresa el nombre del medicamento');
      isValid = false;
    } else if (currentName.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres');
      isValid = false;
    } else if (currentName.length > 50) {
      setNameError('El nombre no puede exceder 50 caracteres');
      isValid = false;
    } else if (!/^[a-zA-Z0-9\s\-áéíóúÁÉÍÓÚñÑüÜ]+$/.test(currentName)) {
      setNameError('El nombre solo puede contener letras, números, espacios y guiones');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  }, []);

  // Debounced validation for better performance (300ms delay)
  const debouncedValidation = useDebouncedCallback((currentEmoji: string, currentName: string) => {
    const isValid = validateFields(currentEmoji, currentName);
    setCanProceed(isValid);
  }, 300);

  // Handle emoji selection (immediate validation for better UX)
  const handleEmojiSelect = useCallback((selectedEmoji: string) => {
    setEmoji(selectedEmoji);
    updateFormData({ emoji: selectedEmoji });
    // Immediate validation for emoji selection
    const isValid = validateFields(selectedEmoji, name);
    setCanProceed(isValid);
  }, [name, updateFormData, validateFields, setCanProceed]);

  // Extract emoji from text (handles multi-character emojis)
  const extractEmoji = (text: string): string | null => {
    // Match emoji using Unicode property escapes
    // This regex matches most emojis including those with modifiers and ZWJ sequences
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const matches = text.match(emojiRegex);

    if (matches && matches.length > 0) {
      // Return the first emoji found
      return matches[0];
    }

    return null;
  };

  // Handle "Más emojis" button press
  const handleMoreEmojisPress = useCallback(() => {
    try {
      // Focus the hidden input to trigger native emoji keyboard
      if (emojiInputRef.current) {
        // Clear previous value to ensure onChangeText triggers even for same emoji
        emojiInputRef.current.clear();
        emojiInputRef.current.focus();
      } else {
        // Fallback if ref is not available
        Alert.alert(
          'Teclado no disponible',
          'No se pudo abrir el teclado de emojis. Por favor, selecciona un emoji de la cuadrícula.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Error handling if keyboard cannot be opened
      console.error('Error opening emoji keyboard:', error);
      Alert.alert(
        'Error',
        'No se pudo abrir el teclado de emojis. Por favor, selecciona un emoji de la cuadrícula.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Handle text change from hidden emoji input
  const handleEmojiInputChange = useCallback((text: string) => {
    if (!text || text.trim() === '') {
      return;
    }

    // Extract emoji from the input text
    const extractedEmoji = extractEmoji(text);

    if (extractedEmoji) {
      // Update the selected emoji
      handleEmojiSelect(extractedEmoji);

      // Close the keyboard after selection
      Keyboard.dismiss();
    } else {
      // No valid emoji found, show error
      Alert.alert(
        'Emoji no válido',
        'Por favor, selecciona un emoji válido del teclado.',
        [{ text: 'OK' }]
      );

      // Close keyboard
      Keyboard.dismiss();
    }
  }, [handleEmojiSelect, extractEmoji]);

  // Handle name change with debounced validation
  const handleNameChange = useCallback((text: string) => {
    // Enforce character limit
    if (text.length <= 50) {
      setName(text);
      updateFormData({ name: text });
      // Debounced validation to avoid excessive re-renders
      debouncedValidation(emoji, text);
    }
  }, [emoji, updateFormData, debouncedValidation]);

  // Initialize validation on mount
  useEffect(() => {
    const isValid = validateFields(emoji, name);
    setCanProceed(isValid);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessible={true}
      accessibilityLabel="Paso 1: Selección de icono y nombre"
      accessibilityHint="Selecciona un icono y escribe el nombre de tu medicamento"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Icono y Nombre</Text>
        <Text style={styles.subtitle}>
          Personaliza cómo aparecerá tu medicamento
        </Text>
      </View>

      {/* Emoji Preview Section */}
      <View style={styles.emojiPreviewSection}>
        <View style={styles.emojiPreviewContainer}>
          <View
            style={[
              styles.emojiPreview,
              emojiError ? styles.emojiPreviewError : null
            ]}
            accessible={true}
            accessibilityLabel={emoji ? `Icono seleccionado: ${emoji}` : 'Ningún icono seleccionado'}
            accessibilityRole="image"
          >
            {emoji ? (
              <Text style={styles.emojiPreviewText}>{emoji}</Text>
            ) : (
              <Text style={styles.emojiPlaceholder}>?</Text>
            )}
          </View>

          {emojiError ? (
            <Text
              style={styles.errorText}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              {emojiError}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Name Input Section */}
      <View style={styles.nameSection}>
        <Input
          label="Nombre del medicamento"
          value={name}
          onChangeText={handleNameChange}
          placeholder="Ej: Aspirina, Ibuprofeno"
          error={nameError}
          helperText={`${name.length}/50 caracteres`}
          required
          variant="outlined"
          size="lg"
          maxLength={50}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          accessible={true}
          accessibilityLabel="Nombre del medicamento"
          accessibilityHint="Escribe el nombre de tu medicamento, máximo 50 caracteres"
        />
      </View>

      {/* Emoji Picker Section */}
      <View style={styles.emojiPickerSection}>
        <Text style={styles.sectionLabel}>Selecciona un icono</Text>

        <View
          style={styles.emojiGrid}
          accessible={true}
          accessibilityLabel="Cuadrícula de iconos disponibles"
          accessibilityRole="menu"
        >
          {COMMON_MEDICATION_EMOJIS.map((emojiOption, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emojiButton,
                emoji === emojiOption && styles.emojiButtonSelected
              ]}
              onPress={() => handleEmojiSelect(emojiOption)}
              accessible={true}
              accessibilityLabel={`Icono ${emojiOption}`}
              accessibilityRole="button"
              accessibilityState={{ selected: emoji === emojiOption }}
              accessibilityHint={`Toca para seleccionar ${emojiOption} como icono del medicamento`}
            >
              <Text style={styles.emojiButtonText}>{emojiOption}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Native Emoji Picker Button */}
        <TouchableOpacity
          style={styles.nativePickerButton}
          onPress={handleMoreEmojisPress}
          accessible={true}
          accessibilityLabel="Abrir selector de emojis del sistema"
          accessibilityRole="button"
          accessibilityHint="Abre el teclado de emojis de tu dispositivo para seleccionar más opciones"
        >
          <Text style={styles.nativePickerButtonText}>
            🎨 Más emojis...
          </Text>
        </TouchableOpacity>

        {/* Hidden input for native emoji keyboard */}
        <RNTextInput
          ref={emojiInputRef}
          style={styles.hiddenEmojiInput}
          value=""
          onChangeText={handleEmojiInputChange}
          placeholder=""
          keyboardType="default" // Default keyboard often has emoji key
          autoCapitalize="none"
          autoCorrect={false}
          accessible={false}
          importantForAccessibility="no"
        />
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          El icono te ayudará a identificar rápidamente tu medicamento en la lista y en las notificaciones.
        </Text>
      </View>
    </ScrollView>
  );
});

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
    alignItems: 'center',
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
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },

  // Emoji Preview
  emojiPreviewSection: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  emojiPreviewContainer: {
    alignItems: 'center',
  },
  emojiPreview: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  emojiPreviewError: {
    borderColor: colors.error[500],
    borderWidth: 2,
  },
  emojiPreviewText: {
    fontSize: 56,
  },
  emojiPlaceholder: {
    fontSize: 48,
    color: colors.gray[300],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Name Section
  nameSection: {
    marginBottom: spacing.xl,
  },

  // Emoji Picker
  emojiPickerSection: {
    marginBottom: spacing.xl,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  emojiButtonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  emojiButtonText: {
    fontSize: 28,
  },
  nativePickerButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  nativePickerButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  hiddenEmojiInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[900],
    lineHeight: typography.fontSize.sm * 1.5,
  },
});

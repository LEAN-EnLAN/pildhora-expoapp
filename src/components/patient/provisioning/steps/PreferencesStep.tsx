import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ColorPicker } from '../../../ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';
import { useWizardContext } from '../WizardContext';
import { announceForAccessibility, triggerHapticFeedback, HapticFeedbackType } from '../../../../utils/accessibility';
import { saveDeviceConfig } from '../../../../services/deviceConfig';
import Slider from '@react-native-community/slider';

/**
 * PreferencesStep Component
 * 
 * Fifth step of the device provisioning wizard. Allows user to configure
 * device preferences.
 * 
 * Premium visual overhaul.
 */
export function PreferencesStep() {
  const { formData, updateFormData, setCanProceed } = useWizardContext();

  // Alarm mode state
  const [alarmMode, setAlarmMode] = useState<'sound' | 'vibrate' | 'both' | 'silent'>(
    formData.alarmMode || 'both'
  );

  // LED settings state
  const [ledIntensity, setLedIntensity] = useState(formData.ledIntensity ?? 50);
  const [ledColor, setLedColor] = useState(formData.ledColor || '#3B82F6');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Volume state
  const [volume, setVolume] = useState(formData.volume ?? 75);

  // Save and test states
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  useEffect(() => {
    announceForAccessibility('Paso 5: Configura las preferencias de tu dispositivo');
  }, []);

  // Always allow proceeding
  useEffect(() => {
    setCanProceed(true);
  }, [setCanProceed]);

  // Update form data when preferences change
  useEffect(() => {
    updateFormData({
      alarmMode,
      ledIntensity,
      ledColor,
      volume,
    });
    if (preferencesSaved) {
      setPreferencesSaved(false);
    }
  }, [alarmMode, ledIntensity, ledColor, volume, updateFormData]);

  /**
   * Save preferences
   */
  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const rgbColor = hexToRgb(ledColor);

      let deviceAlarmMode: 'off' | 'sound' | 'led' | 'both';
      if (alarmMode === 'silent') {
        deviceAlarmMode = 'off';
      } else if (alarmMode === 'vibrate') {
        deviceAlarmMode = 'led';
      } else {
        deviceAlarmMode = alarmMode as 'sound' | 'both';
      }

      const deviceLedIntensity = Math.round((ledIntensity / 100) * 1023);

      await saveDeviceConfig(formData.deviceId, {
        alarmMode: deviceAlarmMode,
        ledIntensity: deviceLedIntensity,
        ledColor: rgbColor,
      });

      setPreferencesSaved(true);
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      announceForAccessibility('Preferencias guardadas exitosamente');

    } catch (error: any) {
      console.error('[PreferencesStep] Error saving preferences:', error);

      let userMessage = 'Error al guardar las preferencias';
      if (error.code === 'PERMISSION_DENIED') userMessage = 'No tienes permiso para configurar este dispositivo';

      setSaveError(userMessage);
      setPreferencesSaved(false);
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAlarm = async () => {
    setIsTesting(true);
    try {
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('[PreferencesStep] Error testing alarm:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 59, g: 130, b: 246 };
  };

  const handleColorChange = (color: { hex: string; rgb: [number, number, number] }) => {
    setLedColor(color.hex);
  };

  const alarmModes = [
    { id: 'sound' as const, label: 'Sonido', icon: 'volume-high' as const },
    { id: 'vibrate' as const, label: 'Vibración', icon: 'phone-portrait' as const },
    { id: 'both' as const, label: 'Ambos', icon: 'notifications' as const },
    { id: 'silent' as const, label: 'Silencio', icon: 'volume-mute' as const },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="options" size={40} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>Preferencias</Text>
        <Text style={styles.subtitle}>
          Personaliza cómo te avisa tu dispositivo.
        </Text>
      </View>

      {/* Alarm Mode Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de Alarma</Text>
        <View style={styles.alarmModesGrid}>
          {alarmModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.alarmModeCard,
                alarmMode === mode.id && styles.alarmModeCardSelected,
              ]}
              onPress={() => setAlarmMode(mode.id)}
            >
              <View style={[
                styles.alarmIconContainer,
                alarmMode === mode.id && styles.alarmIconContainerSelected
              ]}>
                <Ionicons
                  name={mode.icon}
                  size={24}
                  color={alarmMode === mode.id ? colors.primary[500] : colors.gray[500]}
                />
              </View>
              <Text
                style={[
                  styles.alarmModeLabel,
                  alarmMode === mode.id && styles.alarmModeLabelSelected,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LED Settings Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Iluminación LED</Text>

        {/* Color Picker */}
        <TouchableOpacity
          style={styles.colorPickerButton}
          onPress={() => setShowColorPicker(true)}
        >
          <View style={[styles.colorPreview, { backgroundColor: ledColor }]} />
          <Text style={styles.colorPickerText}>Color del indicador</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        {/* Intensity Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Intensidad</Text>
            <Text style={styles.sliderValue}>{ledIntensity}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={5}
            value={ledIntensity}
            onValueChange={setLedIntensity}
            minimumTrackTintColor={colors.primary[500]}
            maximumTrackTintColor={colors.gray[200]}
            thumbTintColor={colors.primary[500]}
          />
        </View>
      </View>

      {/* Volume Card */}
      {(alarmMode === 'sound' || alarmMode === 'both') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volumen</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Ionicons name="volume-low" size={20} color={colors.gray[500]} />
              <Text style={styles.sliderValue}>{volume}%</Text>
              <Ionicons name="volume-high" size={20} color={colors.gray[500]} />
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={volume}
              onValueChange={setVolume}
              minimumTrackTintColor={colors.primary[500]}
              maximumTrackTintColor={colors.gray[200]}
              thumbTintColor={colors.primary[500]}
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          onPress={handleTestAlarm}
          variant="secondary"
          size="lg"
          disabled={isTesting}
          loading={isTesting}
          style={styles.actionButton}
        >
          {isTesting ? 'Probando...' : 'Probar Alarma'}
        </Button>

        <Button
          onPress={handleSavePreferences}
          variant="primary"
          size="lg"
          disabled={isSaving || preferencesSaved}
          loading={isSaving}
          style={styles.actionButton}
        >
          {isSaving ? 'Guardando...' : preferencesSaved ? '¡Guardado!' : 'Guardar Cambios'}
        </Button>
      </View>

      {/* Color Picker Modal */}
      <ColorPicker
        value={ledColor}
        onChange={handleColorChange}
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        showPresets={true}
        showCustomPicker={true}
      />
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  alarmModesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  alarmModeCard: {
    width: '47%', // 2 columns with gap
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  alarmModeCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: '#FFFFFF',
    ...shadows.md,
  },
  alarmIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  alarmIconContainerSelected: {
    backgroundColor: '#EFF6FF',
  },
  alarmModeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },
  alarmModeLabelSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.gray[100],
    marginRight: spacing.md,
  },
  colorPickerText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: typography.fontWeight.medium,
  },
  sliderContainer: {
    marginTop: spacing.xs,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  sliderValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  buttonContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    borderRadius: borderRadius.full,
  },
});

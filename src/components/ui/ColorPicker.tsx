import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { Modal } from './Modal';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

interface ColorPickerProps {
  value: string; // hex string, e.g. '#ff0000'
  onChange: (color: { hex: string; rgb: [number, number, number] }) => void;
  presets?: string[];
  showPresets?: boolean;
  showCustomPicker?: boolean;
  visible: boolean;
  onClose: () => void;
}

/**
 * Enhanced ColorPicker component with Modal integration
 * Provides preset color swatches and custom HSB color picker
 * Outputs both hex and RGB values for device configuration
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  presets: customPresets,
  showPresets = true,
  showCustomPicker = true,
  visible,
  onClose,
}) => {
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');
  const [rgb, setRgb] = useState<[number, number, number]>(() => {
    const clean = (value || '#000000').replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
  });

  useEffect(() => {
    const clean = (value || '#000000').replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    setRgb([r, g, b]);
  }, [value]);

  // Color conversion helpers
  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0'))
      .join('')}`;

  const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
    const rr = r / 255,
      gg = g / 255,
      bb = b / 255;
    const max = Math.max(rr, gg, bb),
      min = Math.min(rr, gg, bb);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rr) h = ((gg - bb) / d) % 6;
      else if (max === gg) h = (bb - rr) / d + 2;
      else h = (rr - gg) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return [h, s, v];
  };

  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rr = 0,
      gg = 0,
      bb = 0;
    if (h >= 0 && h < 60) {
      rr = c;
      gg = x;
      bb = 0;
    } else if (h >= 60 && h < 120) {
      rr = x;
      gg = c;
      bb = 0;
    } else if (h >= 120 && h < 180) {
      rr = 0;
      gg = c;
      bb = x;
    } else if (h >= 180 && h < 240) {
      rr = 0;
      gg = x;
      bb = c;
    } else if (h >= 240 && h < 300) {
      rr = x;
      gg = 0;
      bb = c;
    } else {
      rr = c;
      gg = 0;
      bb = x;
    }
    const r8 = Math.round((rr + m) * 255);
    const g8 = Math.round((gg + m) * 255);
    const b8 = Math.round((bb + m) * 255);
    return [r8, g8, b8];
  };

  const [hsv, setHsv] = useState<[number, number, number]>(() => rgbToHsv(rgb[0], rgb[1], rgb[2]));

  useEffect(() => {
    setHsv(rgbToHsv(rgb[0], rgb[1], rgb[2]));
  }, [rgb]);

  const currentHex = rgbToHex(rgb[0], rgb[1], rgb[2]);

  const handleColorSelect = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    setRgb([r, g, b]);
    onChange({ hex, rgb: [r, g, b] });
  };

  // Default preset colors
  const defaultPresets = [
    '#7F7F7F',
    '#000000',
    '#007AFF',
    '#34C759',
    '#FFCC00',
    '#FF3B30',
    '#AF52DE',
    '#5856D6',
    '#FF2D55',
    '#FFC5AB',
    '#FFFFFF',
    '#FF9500',
  ];

  const presetColors = customPresets || defaultPresets;

  const [h, s, v] = hsv;

  const handleConfirm = () => {
    onChange({ hex: currentHex, rgb });
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Seleccionar Color" size="lg">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Large Color Preview */}
        <View
          style={styles.previewContainer}
          accessible={true}
          accessibilityLabel={`Selected color: ${currentHex}, RGB ${rgb[0]}, ${rgb[1]}, ${rgb[2]}`}
        >
          <View
            style={[styles.previewLarge, { backgroundColor: currentHex }]}
            accessible={false}
          />
          <View style={styles.previewInfo}>
            <Text style={styles.previewHex}>{currentHex.toUpperCase()}</Text>
            <Text style={styles.previewRgb}>
              RGB({rgb[0]}, {rgb[1]}, {rgb[2]})
            </Text>
          </View>
        </View>

        {/* Mode Selector */}
        {showPresets && showCustomPicker && (
          <View
            style={styles.modeSelector}
            accessible={true}
            accessibilityRole="radiogroup"
            accessibilityLabel="Color picker mode"
          >
            <TouchableOpacity
              onPress={() => setMode('presets')}
              style={[styles.modeButton, mode === 'presets' && styles.modeButtonActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: mode === 'presets' }}
              accessibilityLabel="Preset colors mode"
              accessible={true}
            >
              <Text style={[styles.modeButtonText, mode === 'presets' && styles.modeButtonTextActive]}>
                Presets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('custom')}
              style={[styles.modeButton, mode === 'custom' && styles.modeButtonActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: mode === 'custom' }}
              accessibilityLabel="Custom color mode"
              accessible={true}
            >
              <Text style={[styles.modeButtonText, mode === 'custom' && styles.modeButtonTextActive]}>
                Personalizado
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Preset Colors Grid */}
        {showPresets && mode === 'presets' && (
          <View style={styles.presetsContainer}>
            <Text style={styles.sectionTitle}>Colores Predefinidos</Text>
            <View style={styles.presetsGrid}>
              {presetColors.map((hex) => (
                <TouchableOpacity
                  key={hex}
                  style={[
                    styles.presetSwatch,
                    { backgroundColor: hex },
                    currentHex.toLowerCase() === hex.toLowerCase() && styles.presetSwatchSelected,
                  ]}
                  onPress={() => handleColorSelect(hex)}
                  accessibilityLabel={`Select color ${hex}`}
                  accessibilityHint={`Sets the color to ${hex}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentHex.toLowerCase() === hex.toLowerCase() }}
                  accessible={true}
                />
              ))}
            </View>
          </View>
        )}

        {/* Custom Color Picker */}
        {showCustomPicker && mode === 'custom' && (
          <View style={styles.customContainer}>
            <Text style={styles.sectionTitle}>Color Personalizado</Text>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Matiz: {Math.round(h)}°</Text>
              <Slider
                minimumValue={0}
                maximumValue={360}
                step={1}
                value={h}
                minimumTrackTintColor={colors.primary[500]}
                maximumTrackTintColor={colors.gray[300]}
                onValueChange={(val) => {
                  const [r8, g8, b8] = hsvToRgb(val, s, v);
                  setRgb([r8, g8, b8]);
                }}
                onSlidingComplete={(val) => {
                  const [r8, g8, b8] = hsvToRgb(val, s, v);
                  const hex = rgbToHex(r8, g8, b8);
                  onChange({ hex, rgb: [r8, g8, b8] });
                }}
                accessibilityLabel={`Hue slider, current value ${Math.round(h)} degrees`}
                accessibilityRole="adjustable"
                accessible={true}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Saturación: {Math.round(s * 100)}%</Text>
              <Slider
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={s}
                minimumTrackTintColor={colors.success[500]}
                maximumTrackTintColor={colors.gray[300]}
                onValueChange={(val) => {
                  const [r8, g8, b8] = hsvToRgb(h, val, v);
                  setRgb([r8, g8, b8]);
                }}
                onSlidingComplete={(val) => {
                  const [r8, g8, b8] = hsvToRgb(h, val, v);
                  const hex = rgbToHex(r8, g8, b8);
                  onChange({ hex, rgb: [r8, g8, b8] });
                }}
                accessibilityLabel={`Saturation slider, current value ${Math.round(s * 100)} percent`}
                accessibilityRole="adjustable"
                accessible={true}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Brillo: {Math.round(v * 100)}%</Text>
              <Slider
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={v}
                minimumTrackTintColor={colors.warning[500]}
                maximumTrackTintColor={colors.gray[300]}
                onValueChange={(val) => {
                  const [r8, g8, b8] = hsvToRgb(h, s, val);
                  setRgb([r8, g8, b8]);
                }}
                onSlidingComplete={(val) => {
                  const [r8, g8, b8] = hsvToRgb(h, s, val);
                  const hex = rgbToHex(r8, g8, b8);
                  onChange({ hex, rgb: [r8, g8, b8] });
                }}
                accessibilityLabel={`Brightness slider, current value ${Math.round(v * 100)} percent`}
                accessibilityRole="adjustable"
                accessible={true}
              />
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          accessibilityLabel="Confirm color selection"
          accessibilityHint={`Confirms selection of color ${currentHex}`}
          accessibilityRole="button"
          accessible={true}
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  previewLarge: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  previewInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  previewHex: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  previewRgb: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.xs / 2,
    marginBottom: spacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: colors.surface,
  },
  modeButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
  },
  modeButtonTextActive: {
    color: colors.gray[900],
    fontWeight: typography.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  presetsContainer: {
    marginBottom: spacing.lg,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  presetSwatch: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    minWidth: 44,
    minHeight: 44,
  },
  presetSwatchSelected: {
    borderWidth: 3,
    borderColor: colors.primary[500],
  },
  customContainer: {
    marginBottom: spacing.lg,
  },
  sliderContainer: {
    marginBottom: spacing.lg,
  },
  sliderLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  confirmButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});

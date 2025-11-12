import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

type Props = {
  value: string; // hex string, e.g. '#ff0000'
  onCompleteJS: (color: { hex: string }) => void;
  style?: any;
};

/**
 * A reusable, well-spaced scaffold for the reanimated-color-picker components.
 * Provides consistent spacing and sensible defaults.
 */
export default function ColorPickerScaffold({ value, onCompleteJS, style }: Props) {
  const [mode, setMode] = useState<'grid' | 'spectrum' | 'sliders'>('grid');
  const [alpha, setAlpha] = useState(1);
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

  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`;

  const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
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
    let rr = 0, gg = 0, bb = 0;
    if (h >= 0 && h < 60) { rr = c; gg = x; bb = 0; }
    else if (h >= 60 && h < 120) { rr = x; gg = c; bb = 0; }
    else if (h >= 120 && h < 180) { rr = 0; gg = c; bb = x; }
    else if (h >= 180 && h < 240) { rr = 0; gg = x; bb = c; }
    else if (h >= 240 && h < 300) { rr = x; gg = 0; bb = c; }
    else { rr = c; gg = 0; bb = x; }
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

  const setFromHex = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    setRgb([r, g, b]);
    onCompleteJS({ hex });
  };

  const gridColors = useMemo(() => {
    const rows = 10, cols = 12;
    const list: string[] = [];
    for (let i = 0; i < rows; i++) {
      const s = Math.min(1, Math.max(0, (i + 1) / rows));
      const v = i < 2 ? 1 - i * 0.06 : 1;
      for (let j = 0; j < cols; j++) {
        const h = (j / cols) * 360;
        const [r8, g8, b8] = hsvToRgb(h, s, v);
        list.push(rgbToHex(r8, g8, b8));
      }
    }
    return list;
  }, []);

  const spectrumColors = useMemo(() => {
    const rows = 12, cols = 12;
    const list: string[] = [];
    for (let i = 0; i < rows; i++) {
      const s = Math.min(1, Math.max(0, (i + 1) / rows));
      const v = 1;
      for (let j = 0; j < cols; j++) {
        const h = (j / cols) * 360;
        const [r8, g8, b8] = hsvToRgb(h, s, v);
        list.push(rgbToHex(r8, g8, b8));
      }
    }
    return list;
  }, []);

  const presets = ['#7F7F7F','#000000','#007AFF','#34C759','#FFCC00','#FF3B30','#AF52DE','#5856D6','#FF2D55','#FFC5AB'];

  const [h, s, v] = hsv;

  return (
    <View style={[{ width: '100%', paddingVertical: 8 }, style]}>
      <View style={segmentedStyles.container}>
        {[
          { key: 'grid', label: 'Grid' },
          { key: 'spectrum', label: 'Spectrum' },
          { key: 'sliders', label: 'Sliders' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setMode(tab.key as any)}
            style={[segmentedStyles.tab, mode === tab.key ? segmentedStyles.tabActive : null]}
          >
            <Text style={[segmentedStyles.tabLabel, mode === tab.key ? segmentedStyles.tabLabelActive : null]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={panelStyles.previewRow}>
        <View style={[panelStyles.preview, { backgroundColor: currentHex }]} />
        <View style={panelStyles.opacityRow}>
          <View style={panelStyles.checkersRow}>
            {Array.from({ length: 16 }).map((_, i) => (
              <View key={i} style={[panelStyles.checkerSquare, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#000000' }]} />
            ))}
          </View>
          <Slider
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={alpha}
            onValueChange={(val) => setAlpha(val)}
            minimumTrackTintColor="#AF52DE"
            maximumTrackTintColor="#D1D5DB"
            style={panelStyles.opacitySlider}
          />
          <Text style={panelStyles.opacityText}>{Math.round(alpha * 100)}%</Text>
        </View>
      </View>

      {mode === 'grid' && (
        <View style={panelStyles.grid}>
          {gridColors.map((hex) => (
            <TouchableOpacity key={hex} style={[panelStyles.cell, { backgroundColor: hex }]} onPress={() => setFromHex(hex)} />
          ))}
        </View>
      )}

      {mode === 'spectrum' && (
        <View style={panelStyles.grid}>
          {spectrumColors.map((hex) => (
            <TouchableOpacity key={hex} style={[panelStyles.cell, { backgroundColor: hex }]} onPress={() => setFromHex(hex)} />
          ))}
        </View>
      )}

      {mode === 'sliders' && (
        <View style={{ gap: 8 }}>
          <Text style={panelStyles.label}>Hue: {Math.round(h)}</Text>
          <Slider minimumValue={0} maximumValue={360} step={1} value={h} minimumTrackTintColor="#007AFF" maximumTrackTintColor="#D1D5DB" onValueChange={(val) => {
            const [r8,g8,b8] = hsvToRgb(val, s, v);
            setRgb([r8,g8,b8]);
            onCompleteJS({ hex: rgbToHex(r8,g8,b8) });
          }} />
          <Text style={panelStyles.label}>Saturation: {Math.round(s*100)}%</Text>
          <Slider minimumValue={0} maximumValue={1} step={0.01} value={s} minimumTrackTintColor="#34C759" maximumTrackTintColor="#D1D5DB" onValueChange={(val) => {
            const [r8,g8,b8] = hsvToRgb(h, val, v);
            setRgb([r8,g8,b8]);
            onCompleteJS({ hex: rgbToHex(r8,g8,b8) });
          }} />
          <Text style={panelStyles.label}>Brightness: {Math.round(v*100)}%</Text>
          <Slider minimumValue={0} maximumValue={1} step={0.01} value={v} minimumTrackTintColor="#FFCC00" maximumTrackTintColor="#D1D5DB" onValueChange={(val) => {
            const [r8,g8,b8] = hsvToRgb(h, s, val);
            setRgb([r8,g8,b8]);
            onCompleteJS({ hex: rgbToHex(r8,g8,b8) });
          }} />
        </View>
      )}

      <View style={panelStyles.swatches}>
        {presets.map((hex) => (
          <TouchableOpacity key={hex} style={[panelStyles.swatch, { backgroundColor: hex }]} onPress={() => setFromHex(hex)} />
        ))}
      </View>
    </View>
  );
}

const segmentedStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
});

const panelStyles = StyleSheet.create({
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  preview: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  opacityRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkersRow: { height: 24, width: 112, flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  checkerSquare: { width: 7, height: '100%' },
  opacitySlider: { flex: 1 },
  opacityText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  cell: { width: '8.33%', height: 28 },
  label: { fontSize: 14, color: '#8E8E93' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
});

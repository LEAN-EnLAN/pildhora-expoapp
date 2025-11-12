# Device Color Picker Migration Guide

## Overview
This guide documents the replacement of the device color picking system with a modern, native implementation aligned with the Figma design (`Frame-5581_27073`). The new picker preserves existing capabilities, improves aesthetics, and excludes previous web‑optimized reanimated solutions.

## Component API
- Location: `src/components/ColorPickerScaffold.tsx`
- Props:
  - `value: string` – hex color string (e.g., `#FF0000`)
  - `onCompleteJS: (color: { hex: string }) => void` – callback invoked with hex on selection
  - `style?: any` – optional container style

API remains compatible. Existing consumers do not require changes.

## Migration
1. No code changes required where `ColorPickerScaffold` is already used.
2. The modal integration on the devices page remains under `app/patient/link-device.tsx`.
3. The picker emits hex strings; persistence continues as `[r,g,b]` arrays in Firestore via existing conversion logic.

### Backward Compatibility
- Existing `desiredConfig.led_color_rgb: [r,g,b]` values remain valid.
- The UI initializes from the stored RGB converted to hex.
- Alpha is UI‑only; persisted color remains opaque `[r,g,b]`.

## Design Specification
- Segmented control: `Grid | Spectrum | Sliders` with rounded tabs and subtle elevation.
- Preview tile and swatches: rounded, bordered elements consistent with the design system.
- Grid: 12×10 palette computed from HSV space.
- Spectrum: 12×12 dense palette across hue and saturation.
- Sliders: Hue, Saturation, Brightness, plus an Opacity control.
- Styling follows app typography and color tokens for consistency.

## Performance & Architecture
- Pure React Native views and `@react-native-community/slider`.
- No dependency on web‑optimized reanimated pickers.
- Computation uses memoized palette generation for smooth interaction.

## Testing
Use `test-color-picker-system.js` in project root.
- Color accuracy: Hex/RGB/HSV conversions checked across samples.
- Interaction responsiveness: Simulated slider changes and grid selections.
- Visual consistency: Presence of segmented tabs, preview, swatches verified.
- Backward compatibility: Existing RGB arrays convert to the same hex roundtrip.

## Maintenance Notes
- Future adjustments to palette density can be made via `rows/cols` constants in the scaffold.
- Swatch presets are centralized in the scaffold for easy updates.
- Keep emitted values in hex to preserve consumer contract in the app.


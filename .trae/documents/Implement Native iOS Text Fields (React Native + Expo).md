## Overview
- Build a native iOS `UITextField`-based component and bridge it into the Expo/React Native app to match the Figma designs: `Light examples`, `Dark examples`, and `Frame-5433_20204`.
- Provide a reusable JS wrapper and a small group container that reproduces the separator/padding/typography from the designs.
- Replace existing `TextInput` usage across screens with the new component and add validation, states, tests, and documentation.

## Tech & Constraints
- Current project is Expo-managed (`expo-router`, no `ios/` folder). Bridging requires generating native projects.
- Plan uses Expo prebuild + Development Client to integrate native iOS code safely, keeping Android/Web paths functional.

## Phase 1: Prepare Native Projects
1. Generate native projects: `expo prebuild` (keeps existing JS entry with Expo Router).
2. Enable iOS system theming: set `userInterfaceStyle` to `automatic` in `app.json`.
3. Ensure EAS build profiles are ready for Dev Client and production.

## Phase 2: Native iOS Component
- Create `PHTextFieldView: UIView` wrapping `UITextField`.
- Styling (from Figma):
  - Height `52pt`, horizontal padding `16pt`, line-height `20pt`, letter-spacing `-0.43pt`, font `SF Pro 17 Medium`.
  - Separator lines (`1pt`) above each field: light `#e6e6e6`, dark `#1a1a1a`.
  - Cursor/tint: light `#0088FF`, dark `#0091FF`.
  - Text colors: `UIColor.label` (primary), placeholders: `UIColor.tertiaryLabel`.
  - Clear button: `clearButtonMode = .whileEditing` (icon matches native).
- States:
  - Focused: cursor visible, tint color applied.
  - Disabled: `isEnabled = false`, `alpha = 0.6`, text `secondaryLabel`.
  - Error: red underline (separator turns `systemRed`), optional error message label.
- Input types: map props → `keyboardType`, `isSecureTextEntry`, `textContentType`, `returnKeyType`, `autoCapitalization`, `autoCorrection`.
- Accessibility: appropriate `accessibilityLabel`, traits, and VoiceOver support.

## Phase 3: React Native Bridge
- `PHTextFieldManager: RCTViewManager` exporting `PHTextField`.
- Props/events:
  - `value`, `placeholder`, `disabled`, `errorMessage`, `secure`, `keyboardType`, `returnKeyType`, `autoCapitalize`.
  - Events: `onChangeText`, `onFocus`, `onBlur`, `onSubmitEditing`.
- Theming: dynamic via `traitCollectionDidChange` with optional prop `appearance: 'light' | 'dark' | 'automatic'`.

## Phase 4: JS Wrapper & Group Layout
- Add `src/components/ui/PHTextField.tsx`: `requireNativeComponent('PHTextField')` typed wrapper.
- Add `src/components/ui/PHTextFieldGroup.tsx` to reproduce the designs:
  - Stacks rows with separators, padding left/right `16`, rounded group container for the card frame.
  - Variants: `light`, `dark`, `automatic` (default).
  - Exposes slots for: placeholder-only row, active input row (with clear), read-only value row.
- Token file `src/components/ui/textfieldTokens.ts` reflecting Figma metrics/colors; defaults use iOS system dynamic colors.

## Phase 5: Validation & Error Handling
- Utility validators in `src/utils/validation/text.ts`:
  - `isEmail`, `isNumeric`, `minLength`, `required`.
- Wrapper handles errors: shows red separator and optional error message under the field.
- Integrations:
  - Login and signup: email format + password rules.
  - Medication inputs: numeric dose and name required.

## Phase 6: Replace Inputs Across Screens
- Swap `TextInput` with `PHTextField` or `PHTextFieldGroup` where layouts match designs.
- Targeted files and lines:
  - `app/auth/login.tsx:99`, `app/auth/login.tsx:111`.
  - `app/auth/signup.tsx:98`, `app/auth/signup.tsx:108`, `app/auth/signup.tsx:120`, `app/auth/signup.tsx:131`.
  - `app/caregiver/chat.tsx:75`.
  - `app/caregiver/tasks.tsx:119`.
  - `app/patient/link-device.tsx:274`.
  - `src/components/patient/medication-form/MedicationNameInput.tsx:23`.
  - `src/components/patient/medication-form/DoseInputContainer.tsx:66`, `src/components/patient/medication-form/DoseInputContainer.tsx:95`.

## Phase 7: Testing Strategy
- Unit/UI (Jest + React Native Testing Library): snapshot and behavior tests for `PHTextField` and `PHTextFieldGroup`.
- E2E (Detox + Expo Dev Client): focus/blur, clear button, type switching, error display.
- iOS native (XCTest): verify dynamic color application and state transitions.
- Device coverage: iOS 15–18, iPhone SE → iPhone Pro Max.

## Phase 8: Documentation & Library Integration
- Add component docs to the UI library (`src/components/ui/docs/PHTextField.mdx`) with usage, props, states, and examples (light/dark/automatic).
- Export from `src/components/ui/index.ts` and add a Storybook-like showcase screen under `app/ui/textfields.tsx`.

## Rollout & Compatibility
- Android/Web fallback: keep using RN `TextInput` inside wrapper for non-iOS platforms.
- Performance: native cursor/clear behavior via `UITextField`; no jank.
- Accessibility: labels/traits preserved.

## Acceptance Criteria
- Visual parity with Figma (spacing, typography, separators, cursor colors) in light/dark.
- Consistent behavior and validation across targeted screens.
- Tests green on CI, manual verification on key iOS devices.
- Documented and exported from UI component library for reuse.

## Risks & Mitigations
- Expo prebuild maintenance: keep minimal native footprint; document steps.
- Dark mode: switch `userInterfaceStyle` to `automatic`, ensure tokens use dynamic colors.
- EAS build setup: validate Dev Client locally before production.

## Next Action
- Proceed to prebuild and scaffold the native iOS view manager, then implement wrappers, integrate into screens, and add tests/docs as outlined above.
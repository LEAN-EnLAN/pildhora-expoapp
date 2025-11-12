## Objectives
- Mobile‑first layout with a consistent visual language using existing `ui` kit (`Container`, `Card`, `Button`).
- Unify selectors/pickers and iconography; remove web‑centric patterns and nested scrolls.
- Keep the form logic in `MedicationForm` while modernizing screen structure and actions.

## Current State
- Screen wrapper uses a plain `View` + nested `ScrollView` and hardcoded background (`app/patient/medications/[id].tsx:37–45`).
- Delete flow handled via `Alert` (`app/patient/medications/[id].tsx:18–35`).
- Form already uses mobile‑native components and the local UI kit (`src/components/patient/MedicationForm.tsx:190–222`).

## Design Principles
- Use `Container` background `#F2F2F7` and standardized paddings (`src/components/ui/Container.tsx:28–45`).
- Wrap content in a single `Card` with platform shadows (`src/components/ui/Card.tsx:31–54`).
- Promote a simple, predictable header with back and delete actions; use `Ionicons` for icons (package.json lines 14, 42).

## Implementation Plan
1. Screen Layout
- Replace `View` + `ScrollView` with `Container padding="lg"` to enforce mobile‑first spacing.
- Render `MedicationForm` directly; avoid nested `ScrollView` because the form already scrolls.

2. Header & Actions
- Add a slim screen header: title "Editar Medicamento", back action (router.back), and a delete icon button.
- Hook the delete icon to the existing `handleDelete` logic (`app/patient/medications/[id].tsx:18–35`).
- Keep platform consistency: `ActionSheetIOS` is used inside form selectors; here, an `Alert` confirmation remains cross‑platform.

3. Consistency & Cleanup
- Remove the local `styles.container/content` and hardcoded color `#F3F4F6`; rely on `Container` defaults.
- Ensure no unused imports (e.g., `Ionicons` only if the header uses it).
- Maintain the `MedicationForm` component as is; its subcomponents already use mobile‑native patterns:
  - Time: `@react-native-community/datetimepicker` (`ReminderTimePicker.tsx:117–124`).
  - Dose unit: Modal list with `Button` + `Card` (`DoseInputContainer.tsx:104–138`).
  - Quantity type: `ActionSheetIOS` on iOS and modal on Android (`QuantityTypeSelector.tsx:22–41, 53–81`).

4. Visual Details
- Spacing: container `lg` padding; card `padding=12` with rounded corners.
- Typography: retain titles within form components; header adds high‑level screen title only.
- Icons: Ionicons sizes 20–24, consistent colors (`#6B7280` for affordances, `#EF4444` for destructive).

## Verification
- Launch on iOS and Android; confirm:
  - No nested scroll; smooth form scrolling.
  - Header renders correctly; delete flow works and returns to list.
  - Pickers/selectors render appropriately per platform and icons display reliably.
- Sanity tests align with existing reports (`medication-workflow-test-report.md`).

## Deliverables
- Updated `app/patient/medications/[id].tsx` implementing the new layout and header.
- No changes to `MedicationForm` or its subcomponents unless issues are found during verification.

## Notes
- We leverage the existing UI kit; no new libraries added.
- The color picker concerns are addressed elsewhere via `ColorPickerScaffold` and are not part of this screen. If a medication color is later added, we will reuse that scaffold for a native experience.
# Patient Selection Logic - Quick Reference

## Overview
The PatientSelector component provides complete patient selection logic with persistence and automatic data refresh.

## Key Functions

### 1. handlePatientPress
**Purpose**: Handle patient chip press events

**Behavior**:
- Prevents re-selection of current patient
- Saves selection to AsyncStorage
- Updates parent via `onSelectPatient` callback
- Triggers data refresh via `onRefresh` callback

**Usage**: Automatically called when user taps a patient chip

---

### 2. saveSelectedPatient
**Purpose**: Persist selected patient ID to AsyncStorage

**Storage Key**: `@caregiver_selected_patient_id`

**Behavior**:
- Saves patient ID asynchronously
- Includes error handling
- Logs success/failure

**Usage**: Called automatically by `handlePatientPress`

---

### 3. loadLastSelectedPatient
**Purpose**: Load saved patient selection on app start

**Behavior**:
- Retrieves saved patient ID from AsyncStorage
- Validates patient exists in current list
- Falls back to first patient if saved not found
- Handles all edge cases gracefully

**Usage**: Called automatically on component mount

---

## Props Interface

```typescript
interface PatientSelectorProps {
  patients: PatientWithDevice[];      // Array of patients to display
  selectedPatientId?: string;         // Currently selected patient ID
  onSelectPatient: (id: string) => void; // Selection callback
  loading?: boolean;                  // Loading state
  onRefresh?: () => void;            // Data refresh callback
}
```

## Integration Example

```typescript
function CaregiverDashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>();
  const [patients, setPatients] = useState<PatientWithDevice[]>([]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const handleRefresh = () => {
    // Refresh all data for selected patient
    fetchDeviceStatus(selectedPatientId);
    fetchMedicationEvents(selectedPatientId);
    fetchMedications(selectedPatientId);
  };

  return (
    <PatientSelector
      patients={patients}
      selectedPatientId={selectedPatientId}
      onSelectPatient={handleSelectPatient}
      onRefresh={handleRefresh}
    />
  );
}
```

## Flow Diagram

```
App Start
    ↓
Load from AsyncStorage
    ↓
Validate patient exists ──→ Yes ──→ Select saved patient
    ↓                                      ↓
    No                              Trigger onSelectPatient
    ↓                                      ↓
Select first patient              Update parent state
    ↓
Display patient chips
    ↓
User taps chip
    ↓
handlePatientPress
    ↓
├─→ Save to AsyncStorage
├─→ Call onSelectPatient
└─→ Call onRefresh
    ↓
Parent refreshes data
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No patients | Shows empty state |
| Single patient | Hides selector |
| Saved patient not found | Selects first patient |
| AsyncStorage error | Falls back to first patient |
| Already selected | Prevents re-selection |
| No saved selection | Selects first patient |

## Debug Logging

All logs prefixed with `[PatientSelector]`:

- `Patient selected: {id}` - When user selects patient
- `Saved selected patient: {id}` - When saved to AsyncStorage
- `Loading last selected patient: {id}` - When loading saved selection
- `Saved patient not found, selecting first patient` - Fallback scenario
- `No saved selection, selecting first patient` - No saved data

## Performance

- **useCallback**: Handler memoized with proper dependencies
- **React.memo**: PatientChip component memoized
- **Conditional render**: Only shows when >1 patient
- **Smooth animations**: Uses Animated API

## Requirements Satisfied

- ✅ 12.2: Patient selection state management
- ✅ 12.3: Persistent selection across sessions
- ✅ 12.5: Data refresh on patient change

## Files

- **Component**: `src/components/caregiver/PatientSelector.tsx`
- **Types**: `src/types/index.ts` (PatientWithDevice interface)
- **Test**: `test-patient-selection-logic.js`
- **Documentation**: `TASK7.1_IMPLEMENTATION_SUMMARY.md`

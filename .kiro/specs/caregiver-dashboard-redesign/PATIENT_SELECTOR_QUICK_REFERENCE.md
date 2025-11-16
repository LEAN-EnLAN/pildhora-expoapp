# PatientSelector Quick Reference

## Import

```typescript
import { PatientSelector } from '@/components/caregiver';
// or
import PatientSelector from '@/components/caregiver/PatientSelector';
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `patients` | `PatientWithDevice[]` | ✅ Yes | Array of patients with optional device state |
| `selectedPatientId` | `string` | ❌ No | Currently selected patient ID |
| `onSelectPatient` | `(patientId: string) => void` | ✅ Yes | Callback when patient is selected |
| `loading` | `boolean` | ❌ No | Shows loading state (default: false) |
| `onRefresh` | `() => void` | ❌ No | Called when patient changes for data refresh |

## Basic Usage

```typescript
<PatientSelector
  patients={patients}
  selectedPatientId={selectedId}
  onSelectPatient={handleSelect}
/>
```

## With Data Refresh

```typescript
<PatientSelector
  patients={patients}
  selectedPatientId={selectedId}
  onSelectPatient={handleSelect}
  onRefresh={refreshDashboardData}
/>
```

## With Loading State

```typescript
<PatientSelector
  patients={patients}
  selectedPatientId={selectedId}
  onSelectPatient={handleSelect}
  loading={isLoading}
/>
```

## PatientWithDevice Type

```typescript
interface PatientWithDevice extends Patient {
  deviceState?: DeviceState;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  deviceId?: string;
  caregiverId: string;
  createdAt: Date | string;
  adherence?: number;
  lastTaken?: string;
}

interface DeviceState {
  is_online: boolean;
  battery_level: number;
  current_status: 'PENDING' | 'ALARM_SOUNDING' | 'DOSE_TAKEN' | 'DOSE_MISSED';
  last_event_at?: number;
}
```

## Component Behavior

### Auto-Hide
- Returns `null` when `patients.length === 1`
- No selector needed for single patient

### Auto-Select
- Loads last selected patient from AsyncStorage on mount
- Falls back to first patient if saved patient not found
- Selects first patient if no selection exists

### Persistence
- Saves selection to AsyncStorage key: `@caregiver_selected_patient_id`
- Loads on mount automatically
- Persists across app restarts

## States

| State | Condition | Display |
|-------|-----------|---------|
| **Normal** | `patients.length > 1 && !loading` | Scrollable patient chips |
| **Hidden** | `patients.length === 1` | `null` (component hidden) |
| **Empty** | `patients.length === 0 && !loading` | Empty state message |
| **Loading** | `loading === true` | Activity indicator |

## Device Status

### Status Dot Colors
- 🟢 **Green** (`colors.success`): Device online
- ⚪ **Gray** (`colors.gray[400]`): Device offline or no device

### Status Text
- "En línea" - Device is online
- "Desconectado" - Device is offline
- "Sin dispositivo" - No device linked
- "Estado desconocido" - Device state unavailable

## Styling

All styles use design system tokens from `src/theme/tokens.ts`:
- Colors: `colors.*`
- Spacing: `spacing.*`
- Typography: `typography.*`
- Border Radius: `borderRadius.*`
- Shadows: `shadows.*`

## Animations

### Fade In (Mount)
- Duration: 300ms
- Effect: Opacity 0 → 1

### Press Feedback
- Type: Spring animation
- Effect: Scale 1.0 → 0.95 → 1.0
- Damping: 15
- Stiffness: 150

## Accessibility

- Full screen reader support
- Descriptive labels and hints
- Selection state announced
- Device status announced
- Proper focus order

## Example Implementation

```typescript
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { PatientSelector } from '@/components/caregiver';
import { PatientWithDevice } from '@/types';

function CaregiverDashboard() {
  const [patients, setPatients] = useState<PatientWithDevice[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Fetch patients from Firestore
      const patientsData = await getPatientsForCaregiver();
      setPatients(patientsData);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    // Selection is automatically saved to AsyncStorage
  };

  const handleRefresh = () => {
    // Refresh dashboard data for selected patient
    fetchDashboardData(selectedPatientId);
  };

  return (
    <View>
      <PatientSelector
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        onRefresh={handleRefresh}
        loading={loading}
      />
      
      {/* Dashboard content for selected patient */}
    </View>
  );
}
```

## Common Patterns

### With Real-Time Device State

```typescript
useEffect(() => {
  if (!selectedPatientId) return;

  const patient = patients.find(p => p.id === selectedPatientId);
  if (!patient?.deviceId) return;

  // Set up RTDB listener for device state
  const deviceRef = ref(rtdb, `devices/${patient.deviceId}/state`);
  const unsubscribe = onValue(deviceRef, (snapshot) => {
    const deviceState = snapshot.val();
    
    // Update patient with new device state
    setPatients(prev => prev.map(p => 
      p.id === selectedPatientId 
        ? { ...p, deviceState }
        : p
    ));
  });

  return () => unsubscribe();
}, [selectedPatientId]);
```

### With Firestore Query

```typescript
useEffect(() => {
  const caregiverId = auth.currentUser?.uid;
  if (!caregiverId) return;

  const patientsQuery = query(
    collection(db, 'patients'),
    where('caregiverId', '==', caregiverId)
  );

  const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
    const patientsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PatientWithDevice[];
    
    setPatients(patientsData);
  });

  return () => unsubscribe();
}, []);
```

## Troubleshooting

### Selection not persisting
```typescript
// Check AsyncStorage permissions
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test read/write
AsyncStorage.setItem('test', 'value')
  .then(() => AsyncStorage.getItem('test'))
  .then(value => console.log('AsyncStorage working:', value))
  .catch(error => console.error('AsyncStorage error:', error));
```

### Device status not showing
```typescript
// Ensure deviceState is included in patient data
const patient: PatientWithDevice = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  caregiverId: 'caregiver-1',
  deviceId: 'device-1',
  createdAt: new Date(),
  deviceState: {  // ← Must include this
    is_online: true,
    battery_level: 85,
    current_status: 'PENDING',
  },
};
```

### Component not rendering
```typescript
// Check conditions
console.log('Patients:', patients.length);
console.log('Loading:', loading);
console.log('Selected:', selectedPatientId);

// Component renders when:
// - patients.length > 1 (hidden if 1)
// - !loading (shows loading state if true)
// - patients.length > 0 (shows empty state if 0)
```

## Performance Tips

1. **Memoize callbacks**: Use `useCallback` for `onSelectPatient` and `onRefresh`
2. **Optimize patient list**: Don't pass unnecessary data in patients array
3. **Debounce refresh**: Avoid calling `onRefresh` too frequently
4. **Cache device state**: Use SWR or similar for device state caching

## Testing

```bash
# Run test suite
node test-patient-selector.js

# Expected: 25/25 tests passing
```

## Related Components

- `CaregiverHeader` - Header component for caregiver screens
- `DeviceConnectivityCard` - Shows device status details
- `QuickActionsPanel` - Dashboard quick actions

## Files

- Component: `src/components/caregiver/PatientSelector.tsx`
- Export: `src/components/caregiver/index.ts`
- Types: `src/types/index.ts`
- Test: `test-patient-selector.js`

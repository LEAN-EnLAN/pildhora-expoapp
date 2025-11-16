# Data Fetching Hooks Quick Reference Guide

## Overview

This guide provides quick reference for the three custom hooks created for dashboard data fetching.

---

## useLinkedPatients

**Purpose**: Fetch patients linked to a caregiver via deviceLinks collection

### Import

```typescript
import { useLinkedPatients } from '../../src/hooks/useLinkedPatients';
```

### Usage

```typescript
const {
  patients,      // PatientWithDevice[]
  isLoading,     // boolean
  error,         // Error | null
  refetch,       // () => Promise<void>
} = useLinkedPatients({
  caregiverId: 'caregiver-uid',
  enabled: true, // optional, default: true
});
```

### Features

- ✅ Queries `deviceLinks` collection
- ✅ Filters by userId, role='caregiver', status='active'
- ✅ Fetches corresponding patient data
- ✅ Real-time updates via onSnapshot
- ✅ Caching with AsyncStorage
- ✅ Error handling

### Data Flow

```
1. Query deviceLinks for caregiver
   ↓
2. Extract deviceIds
   ↓
3. For each deviceId, query users collection
   ↓
4. Filter by role='patient' and deviceId
   ↓
5. Return array of PatientWithDevice
```

### Cache Key

`linked_patients:{caregiverId}`

---

## useLatestMedicationEvent

**Purpose**: Fetch the most recent medication event for a patient

### Import

```typescript
import { useLatestMedicationEvent } from '../../src/hooks/useLatestMedicationEvent';
```

### Usage

```typescript
const {
  event,         // MedicationEvent | null
  isLoading,     // boolean
  error,         // Error | null
  refetch,       // () => Promise<void>
} = useLatestMedicationEvent({
  patientId: 'patient-uid',      // optional
  caregiverId: 'caregiver-uid',  // optional
  enabled: true,                  // optional, default: true
});
```

### Features

- ✅ Queries `medicationEvents` collection
- ✅ Orders by timestamp descending
- ✅ Limits to 1 result
- ✅ Real-time updates via onSnapshot
- ✅ Caching with AsyncStorage
- ✅ Supports filtering by patientId or caregiverId

### Query Structure

```typescript
query(
  collection(db, 'medicationEvents'),
  where('caregiverId', '==', caregiverId),  // if provided
  where('patientId', '==', patientId),      // if provided
  orderBy('timestamp', 'desc'),
  limit(1)
)
```

### Cache Key

- With patientId: `latest_event:{patientId}`
- With caregiverId only: `latest_event:caregiver:{caregiverId}`

---

## useDeviceState

**Purpose**: Fetch real-time device state from Firebase Realtime Database

### Import

```typescript
import { useDeviceState } from '../../src/hooks/useDeviceState';
```

### Usage

```typescript
const {
  deviceState,   // DeviceState | null
  isLoading,     // boolean
  error,         // Error | null
  refetch,       // () => void
} = useDeviceState({
  deviceId: 'device-id',
  enabled: true,  // optional, default: true
});
```

### Features

- ✅ Listens to RTDB path: `devices/{deviceId}/state`
- ✅ Real-time updates via onValue
- ✅ Automatic cleanup on unmount
- ✅ Error handling
- ✅ No caching (always real-time)

### DeviceState Type

```typescript
interface DeviceState {
  is_online: boolean;
  battery_level: number;
  current_status: 'PENDING' | 'ALARM_SOUNDING' | 'DOSE_TAKEN' | 'DOSE_MISSED';
  last_event_at?: number;
}
```

### RTDB Path

```
devices/
  {deviceId}/
    state/
      is_online: boolean
      battery_level: number
      current_status: string
      last_event_at: number
```

---

## Common Patterns

### Pattern 1: Dashboard with Multiple Patients

```typescript
function CaregiverDashboard() {
  const caregiverUid = getAuth()?.currentUser?.uid;
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Fetch all linked patients
  const { patients, isLoading, error } = useLinkedPatients({
    caregiverId: caregiverUid,
  });

  // Get selected patient
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Fetch device state for selected patient
  const { deviceState } = useDeviceState({
    deviceId: selectedPatient?.deviceId,
    enabled: !!selectedPatient?.deviceId,
  });

  // Fetch latest event for selected patient
  const { event } = useLatestMedicationEvent({
    patientId: selectedPatientId || undefined,
    enabled: !!selectedPatientId,
  });

  return (
    <View>
      <PatientSelector
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
      />
      <DeviceConnectivityCard deviceId={selectedPatient?.deviceId} />
      <LastMedicationStatusCard event={event} />
    </View>
  );
}
```

### Pattern 2: Single Patient View

```typescript
function PatientDetailView({ patientId }: { patientId: string }) {
  // Fetch latest event for this patient
  const { event, isLoading, error } = useLatestMedicationEvent({
    patientId,
  });

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage error={error} />;
  if (!event) return <EmptyState />;

  return <EventCard event={event} />;
}
```

### Pattern 3: Device Monitoring

```typescript
function DeviceMonitor({ deviceId }: { deviceId: string }) {
  const { deviceState, isLoading, error, refetch } = useDeviceState({
    deviceId,
  });

  if (isLoading) return <ActivityIndicator />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (!deviceState) return <Text>No device data</Text>;

  return (
    <View>
      <Text>Status: {deviceState.is_online ? 'Online' : 'Offline'}</Text>
      <Text>Battery: {deviceState.battery_level}%</Text>
      <Text>Current Status: {deviceState.current_status}</Text>
    </View>
  );
}
```

---

## Error Handling

All hooks follow the same error handling pattern:

```typescript
const { data, isLoading, error, refetch } = useHook(options);

if (error) {
  return (
    <ErrorMessage
      message={error.message}
      onRetry={refetch}
    />
  );
}
```

### Common Errors

1. **Firebase not initialized**: Wait for initialization before enabling hooks
2. **Permission denied**: Check Firestore security rules
3. **Network error**: Show retry button
4. **No data found**: Show empty state (not an error)

---

## Performance Tips

1. **Enable/Disable Hooks**: Use `enabled` option to prevent unnecessary queries
   ```typescript
   const { patients } = useLinkedPatients({
     caregiverId,
     enabled: isInitialized && !!caregiverId,
   });
   ```

2. **Conditional Device State**: Only fetch device state when deviceId exists
   ```typescript
   const { deviceState } = useDeviceState({
     deviceId: patient?.deviceId,
     enabled: !!patient?.deviceId,
   });
   ```

3. **Memoize Derived Data**: Use useMemo for expensive computations
   ```typescript
   const selectedPatient = useMemo(() => {
     return patients.find(p => p.id === selectedPatientId);
   }, [patients, selectedPatientId]);
   ```

4. **Cleanup**: Hooks automatically cleanup listeners on unmount

---

## Caching Strategy

### Cache Behavior

1. **On Mount**:
   - Load from cache immediately (if available)
   - Show cached data
   - Fetch fresh data in background
   - Update UI when fresh data arrives

2. **On Update**:
   - Real-time listener updates data
   - Update cache
   - Update UI

3. **On Unmount**:
   - Cleanup listeners
   - Keep cache for next mount

### Cache Keys

- Linked patients: `linked_patients:{caregiverId}`
- Latest event (patient): `latest_event:{patientId}`
- Latest event (caregiver): `latest_event:caregiver:{caregiverId}`
- Device state: No caching (always real-time)

### Clear Cache

```typescript
import { clearCache } from '../utils/cache';

// Clear specific cache
await clearCache('linked_patients:caregiver-uid');

// Clear all cache (on logout)
await AsyncStorage.clear();
```

---

## Testing

### Unit Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useLinkedPatients } from '../useLinkedPatients';

describe('useLinkedPatients', () => {
  it('fetches linked patients', async () => {
    const { result } = renderHook(() =>
      useLinkedPatients({ caregiverId: 'test-uid' })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.patients).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });
});
```

---

## Troubleshooting

### Issue: Hook returns empty array

**Possible causes**:
1. No deviceLinks exist for caregiver
2. Firestore security rules blocking access
3. caregiverId is null or undefined
4. Hook is disabled (`enabled: false`)

**Solution**:
- Check console logs for errors
- Verify deviceLinks collection has data
- Check Firestore security rules
- Ensure caregiverId is valid

### Issue: Real-time updates not working

**Possible causes**:
1. Listener not set up correctly
2. Component unmounted before listener attached
3. Network connectivity issues

**Solution**:
- Check console logs for listener errors
- Verify Firebase connection
- Use refetch() to manually trigger update

### Issue: Stale data showing

**Possible causes**:
1. Cache not being updated
2. Real-time listener not firing
3. Data not changing in Firestore/RTDB

**Solution**:
- Clear cache and reload
- Check if data is actually changing in Firebase console
- Use refetch() to force fresh data

---

## Best Practices

1. ✅ Always handle loading, error, and empty states
2. ✅ Use `enabled` option to prevent unnecessary queries
3. ✅ Memoize derived data with useMemo
4. ✅ Cleanup is automatic, no manual cleanup needed
5. ✅ Use refetch() for manual refresh (e.g., pull-to-refresh)
6. ✅ Check console logs for debugging information
7. ✅ Test with Firebase emulator before production
8. ✅ Handle null/undefined deviceId gracefully

---

## Related Documentation

- [Task 8.1 Implementation Summary](.kiro/specs/caregiver-dashboard-redesign/TASK8.1_IMPLEMENTATION_SUMMARY.md)
- [Dashboard Implementation](app/caregiver/dashboard.tsx)
- [Firebase Services](src/services/firebase.ts)
- [Cache Utilities](src/utils/cache.ts)

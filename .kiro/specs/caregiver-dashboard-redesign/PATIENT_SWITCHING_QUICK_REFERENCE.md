# Patient Switching - Quick Reference Guide

## Overview

This guide provides a quick reference for understanding and working with the patient switching logic in the caregiver dashboard.

## Key Concepts

### 1. Patient Selection Flow

```
PatientSelector → handlePatientSelect → State Update → Component Re-render → Data Refresh
```

### 2. State Management

**Selected Patient ID**: Stored in component state and AsyncStorage
**Patient State Cache**: Map of patient-specific data for quick access
**Component Keys**: Force re-mounting when patient changes

## Code Snippets

### Selecting a Patient

```typescript
// In PatientSelector component
const handlePatientPress = useCallback((patientId: string) => {
  if (patientId === selectedPatientId) {
    return; // Already selected
  }
  
  // Save to AsyncStorage
  saveSelectedPatient(patientId);
  
  // Update selection
  onSelectPatient(patientId);
  
  // Trigger data refresh
  if (onRefresh) {
    onRefresh();
  }
}, [selectedPatientId, onSelectPatient, onRefresh]);
```

### Handling Patient Selection in Dashboard

```typescript
// In dashboard component
const handlePatientSelect = useCallback((patientId: string) => {
  // Prevent unnecessary updates
  if (patientId === selectedPatientId) {
    return;
  }
  
  // Update state cache
  patientStateCache.set(patientId, {
    lastViewed: new Date(),
    deviceId: patientsWithDevices.find(p => p.id === patientId)?.deviceId,
  });
  
  // Update selected patient
  setSelectedPatientId(patientId);
  
  // Persist to storage
  AsyncStorage.setItem(SELECTED_PATIENT_KEY, patientId);
}, [selectedPatientId, patientStateCache, patientsWithDevices]);
```

### Component Re-mounting

```typescript
// Force re-mount when patient changes
<View key={selectedPatient.id}>
  <DeviceConnectivityCard
    key={`device-${selectedPatient.id}`}
    deviceId={selectedPatient.deviceId}
  />
  
  <LastMedicationStatusCard
    key={`medication-${selectedPatient.id}`}
    patientId={selectedPatient.id}
  />
</View>
```

## Data Refresh Mechanisms

### Device Connectivity Card

**Trigger**: `deviceId` prop change
**Action**: 
1. Cleanup old RTDB listener
2. Clear previous device state
3. Setup new RTDB listener
4. Fetch new device state

```typescript
useEffect(() => {
  // Clear previous state
  setDeviceState(null);
  
  // Setup new listener
  const deviceRef = ref(rtdb, `devices/${deviceId}/state`);
  const unsubscribe = onValue(deviceRef, handleUpdate);
  
  // Cleanup
  return () => unsubscribe();
}, [deviceId]);
```

### Last Medication Status Card

**Trigger**: `patientId` prop change
**Action**:
1. Clear previous event
2. Fetch latest event for new patient

```typescript
useEffect(() => {
  // Clear previous event
  setEvent(null);
  
  // Fetch new event
  fetchLastEvent();
}, [patientId]);
```

## State Cache Structure

```typescript
Map<patientId, {
  lastViewed: Date,      // When patient was last viewed
  deviceId?: string      // Associated device ID
}>
```

### Usage

```typescript
// Add to cache
patientStateCache.set(patientId, {
  lastViewed: new Date(),
  deviceId: patient.deviceId,
});

// Get from cache
const cachedData = patientStateCache.get(patientId);

// Check if exists
if (patientStateCache.has(patientId)) {
  // Patient has been viewed before
}
```

## AsyncStorage Keys

```typescript
const SELECTED_PATIENT_KEY = '@caregiver_selected_patient';
```

### Save Selection

```typescript
await AsyncStorage.setItem(SELECTED_PATIENT_KEY, patientId);
```

### Load Selection

```typescript
const savedPatientId = await AsyncStorage.getItem(SELECTED_PATIENT_KEY);
```

## Common Patterns

### 1. Prevent Redundant Updates

```typescript
if (patientId === selectedPatientId) {
  return; // Skip update
}
```

### 2. Cleanup Listeners

```typescript
useEffect(() => {
  const unsubscribe = setupListener();
  
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [dependency]);
```

### 3. Clear Stale Data

```typescript
useEffect(() => {
  // Clear previous data
  setData(null);
  
  // Fetch new data
  fetchData();
}, [patientId]);
```

## Debugging

### Console Logs to Look For

```
[Dashboard] Patient selected: {patientId}
[Dashboard] Switched from patient: {oldId} to: {newId}
[DeviceConnectivityCard] Setting up RTDB listener for device: {deviceId}
[DeviceConnectivityCard] Device state updated
[DeviceConnectivityCard] Cleaning up RTDB listener
[LastMedicationStatusCard] Fetching latest event for patient: {patientId}
[LastMedicationStatusCard] Fetched event: {eventId}
```

### Common Issues

**Issue**: Device state not updating
**Solution**: Check RTDB listener cleanup and deviceId prop

**Issue**: Medication event showing old data
**Solution**: Verify patientId prop is updating and event is cleared

**Issue**: Memory leaks
**Solution**: Ensure all listeners have cleanup in useEffect return

**Issue**: Rapid switching causes errors
**Solution**: Use mounted flag to prevent stale updates

## Performance Tips

1. **Use useCallback**: Memoize event handlers
2. **Early Returns**: Skip unnecessary updates
3. **Component Keys**: Force re-mount only when needed
4. **State Cache**: Reduce redundant fetches
5. **Cleanup**: Always cleanup listeners

## Testing Checklist

- [ ] Patient selector displays all patients
- [ ] Clicking patient updates selection
- [ ] Device card shows correct device state
- [ ] Medication card shows correct event
- [ ] Selection persists after app restart
- [ ] No memory leaks (check with React DevTools)
- [ ] Rapid switching works smoothly
- [ ] Error states handled gracefully

## Related Files

- `app/caregiver/dashboard.tsx` - Main dashboard with patient selection
- `src/components/caregiver/PatientSelector.tsx` - Patient selection UI
- `src/components/caregiver/DeviceConnectivityCard.tsx` - Device state display
- `src/components/caregiver/LastMedicationStatusCard.tsx` - Event display
- `src/hooks/useLinkedPatients.ts` - Fetch linked patients
- `src/hooks/useDeviceState.ts` - Device state hook
- `src/hooks/useLatestMedicationEvent.ts` - Event fetching hook

## API Reference

### handlePatientSelect

```typescript
function handlePatientSelect(patientId: string): void
```

**Parameters:**
- `patientId`: ID of the patient to select

**Side Effects:**
- Updates `selectedPatientId` state
- Updates `patientStateCache`
- Persists to AsyncStorage
- Triggers component re-renders

### patientStateCache

```typescript
Map<string, { lastViewed: Date; deviceId?: string }>
```

**Methods:**
- `set(patientId, data)`: Add/update patient data
- `get(patientId)`: Retrieve patient data
- `has(patientId)`: Check if patient exists
- `size`: Number of cached patients

## Best Practices

1. ✅ Always check if patient is already selected before updating
2. ✅ Clear previous data before fetching new data
3. ✅ Use component keys for clean state transitions
4. ✅ Cleanup all listeners in useEffect return
5. ✅ Log state transitions for debugging
6. ✅ Handle edge cases (no device, no events, etc.)
7. ✅ Use memoization for performance
8. ✅ Persist important state to AsyncStorage

## Summary

The patient switching logic provides a robust, performant way to manage multiple patients in the caregiver dashboard. Key features include:

- ✅ Smooth patient selection with PatientSelector
- ✅ Automatic data refresh when patient changes
- ✅ Separate state maintenance per patient
- ✅ Proper cleanup of listeners and resources
- ✅ Persistent selection across app sessions
- ✅ Comprehensive error handling
- ✅ Performance optimizations

For detailed implementation, see `TASK8.2_IMPLEMENTATION_SUMMARY.md`.

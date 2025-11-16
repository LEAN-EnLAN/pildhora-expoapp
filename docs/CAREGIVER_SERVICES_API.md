# Caregiver Services API Documentation

## Overview

This document provides comprehensive API documentation for all caregiver-related services in the PILDHORA application. These services handle security, device linking, medication event management, and patient data caching.

## Table of Contents

1. [Caregiver Security Service](#caregiver-security-service)
2. [Device Linking Service](#device-linking-service)
3. [Medication Event Service](#medication-event-service)
4. [Patient Data Cache Service](#patient-data-cache-service)

---

## Caregiver Security Service

**Location**: `src/services/caregiverSecurity.ts`

### Purpose

Provides security measures for the caregiver dashboard including user role verification, device access verification, encrypted cache management, and secure logout functionality.

### Key Features

- User role verification before rendering caregiver screens
- Device and patient access verification
- Encrypted data caching using AES encryption
- Secure logout with cache clearing
- Session validation and token refresh

### API Reference

#### `verifyUserRole(): Promise<UserData | null>`

Verifies that the current authenticated user has the 'caregiver' role.

**Returns**: User data if caregiver, null otherwise

**Example**:
```typescript
const userData = await verifyUserRole();
if (!userData) {
  // Redirect to login or show error
  router.replace('/auth/login');
}
```

#### `verifyDeviceAccess(caregiverId: string, deviceId: string): Promise<DeviceAccessResult>`

Checks if a caregiver has an active device link to access patient data.

**Parameters**:
- `caregiverId`: The caregiver's user ID
- `deviceId`: The device ID to verify access for

**Returns**: Access verification result with device and patient information

**Example**:
```typescript
const accessResult = await verifyDeviceAccess(caregiverId, deviceId);
if (accessResult.hasAccess) {
  console.log('Patient ID:', accessResult.patientId);
} else {
  console.log('Access denied:', accessResult.reason);
}
```

#### `verifyPatientAccess(caregiverId: string, patientId: string): Promise<boolean>`

Verifies if a caregiver has access to a specific patient through device linking.

**Parameters**:
- `caregiverId`: The caregiver's user ID
- `patientId`: The patient's user ID

**Returns**: True if caregiver has access

**Example**:
```typescript
const hasAccess = await verifyPatientAccess(caregiverId, patientId);
if (!hasAccess) {
  Alert.alert('Access Denied', 'You do not have permission to view this patient.');
}
```

#### `encryptData(data: any): string`

Encrypts sensitive data before caching using AES encryption.

**Parameters**:
- `data`: Data to encrypt (any JSON-serializable object)

**Returns**: Encrypted data string

**Example**:
```typescript
const encrypted = encryptData({ patientId: '123', medications: [...] });
await AsyncStorage.setItem('cache_key', encrypted);
```

#### `decryptData(encryptedData: string): any`

Decrypts cached data.

**Parameters**:
- `encryptedData`: Encrypted data string

**Returns**: Decrypted data object

**Example**:
```typescript
const encrypted = await AsyncStorage.getItem('cache_key');
const data = decryptData(encrypted);
```

#### `cacheSecureData(key: string, data: any): Promise<void>`

Caches sensitive data with encryption.

**Parameters**:
- `key`: Cache key
- `data`: Data to cache

**Example**:
```typescript
await cacheSecureData(CACHE_KEYS.PATIENT_DATA, patientData);
```

#### `getSecureCache(key: string): Promise<any | null>`

Retrieves and decrypts cached data.

**Parameters**:
- `key`: Cache key

**Returns**: Decrypted data or null if not found

**Example**:
```typescript
const cachedData = await getSecureCache(CACHE_KEYS.PATIENT_DATA);
if (cachedData) {
  setPatientData(cachedData);
}
```

#### `clearCaregiverCache(): Promise<void>`

Clears all caregiver cached data. Should be called on logout.

**Example**:
```typescript
await clearCaregiverCache();
```

#### `secureLogout(): Promise<void>`

Performs secure logout by clearing cache and signing out from Firebase.

**Example**:
```typescript
try {
  await secureLogout();
  router.replace('/auth/login');
} catch (error) {
  console.error('Logout failed:', error);
}
```

#### `isSessionValid(): Promise<boolean>`

Checks if the user session is still valid.

**Returns**: True if session is valid

**Example**:
```typescript
const isValid = await isSessionValid();
if (!isValid) {
  // Redirect to login
}
```

#### `refreshUserToken(): Promise<string | null>`

Forces a refresh of the user's authentication token.

**Returns**: New token or null if failed

**Example**:
```typescript
const newToken = await refreshUserToken();
if (newToken) {
  // Token refreshed successfully
}
```

#### `validateMedicationAccess(caregiverId: string, medicationId: string): Promise<boolean>`

Validates if a caregiver has access to a specific medication.

**Parameters**:
- `caregiverId`: The caregiver's user ID
- `medicationId`: The medication ID

**Returns**: True if caregiver has access

**Example**:
```typescript
const canEdit = await validateMedicationAccess(caregiverId, medicationId);
if (!canEdit) {
  Alert.alert('Access Denied', 'You cannot edit this medication.');
}
```

#### `getAccessiblePatients(caregiverId: string): Promise<string[]>`

Gets all patients accessible by a caregiver.

**Parameters**:
- `caregiverId`: The caregiver's user ID

**Returns**: Array of patient IDs

**Example**:
```typescript
const patientIds = await getAccessiblePatients(caregiverId);
console.log('Managing', patientIds.length, 'patients');
```

### Types

```typescript
export type UserRole = 'patient' | 'caregiver' | 'admin';

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface DeviceAccessResult {
  hasAccess: boolean;
  deviceId?: string;
  patientId?: string;
  linkStatus?: 'active' | 'inactive';
  reason?: string;
}
```

### Cache Keys

```typescript
export const CACHE_KEYS = {
  PATIENT_DATA: 'caregiver_patient_data',
  DEVICE_STATE: 'caregiver_device_state',
  MEDICATION_EVENTS: 'caregiver_medication_events',
  USER_PREFERENCES: 'caregiver_user_preferences',
};
```

### Security Considerations

1. **Encryption Key**: In production, the encryption key should be stored securely using `react-native-keychain` or similar
2. **Token Refresh**: Tokens are automatically refreshed by Firebase, but manual refresh is available
3. **Cache Clearing**: Always clear cache on logout to prevent unauthorized access
4. **Session Validation**: Check session validity before sensitive operations

---

## Device Linking Service

**Location**: `src/services/deviceLinking.ts`

### Purpose

Manages the linking and unlinking of devices to user accounts, creating the connection between patients, devices, and caregivers.

### Key Features

- Device ID validation (minimum 5 characters)
- Firestore deviceLink document management
- RTDB device mapping updates
- Comprehensive error handling with user-friendly messages
- Retry logic for transient failures
- Development rule diagnostics

### API Reference

#### `linkDeviceToUser(userId: string, deviceId: string): Promise<void>`

Links a device to a user account by creating a deviceLink document in Firestore and updating RTDB.

**Parameters**:
- `userId`: The user's ID (patient or caregiver)
- `deviceId`: The device identifier (minimum 5 characters)

**Throws**: `DeviceLinkingError` with user-friendly messages

**Example**:
```typescript
try {
  await linkDeviceToUser(userId, deviceId);
  Alert.alert('Success', 'Device linked successfully!');
} catch (error) {
  if (error instanceof DeviceLinkingError) {
    Alert.alert('Error', error.userMessage);
  }
}
```

#### `unlinkDeviceFromUser(userId: string, deviceId: string): Promise<void>`

Unlinks a device from a user account by removing the deviceLink document and RTDB mapping.

**Parameters**:
- `userId`: The user's ID
- `deviceId`: The device identifier

**Throws**: `DeviceLinkingError` with user-friendly messages

**Example**:
```typescript
try {
  await unlinkDeviceFromUser(userId, deviceId);
  Alert.alert('Success', 'Device unlinked successfully!');
} catch (error) {
  if (error instanceof DeviceLinkingError) {
    Alert.alert('Error', error.userMessage);
  }
}
```

#### `checkDevelopmentRuleStatus(): Promise<void>`

Diagnostic function to check if the temporary development rule is active. Useful for debugging permission issues.

**Example**:
```typescript
await checkDevelopmentRuleStatus();
// Check console logs for diagnostic information
```

### Error Handling

The service uses a custom `DeviceLinkingError` class that provides:

- **code**: Machine-readable error code
- **userMessage**: User-friendly Spanish message
- **retryable**: Whether the operation can be retried

**Error Codes**:
- `INVALID_DEVICE_ID`: Device ID is invalid
- `DEVICE_ID_TOO_SHORT`: Device ID less than 5 characters
- `DEVICE_ID_TOO_LONG`: Device ID exceeds 100 characters
- `INVALID_DEVICE_ID_FORMAT`: Device ID contains invalid characters
- `NOT_AUTHENTICATED`: User not logged in
- `UID_MISMATCH`: Authentication mismatch
- `PERMISSION_DENIED`: Insufficient permissions
- `SERVICE_UNAVAILABLE`: Firebase service unavailable
- `TIMEOUT`: Operation timed out
- `NOT_FOUND`: Device not found
- `ALREADY_EXISTS`: Device already linked
- `ALREADY_LINKED`: Device already linked to this user

### Validation Rules

**Device ID**:
- Minimum 5 characters
- Maximum 100 characters
- Alphanumeric, hyphens, and underscores only
- Pattern: `/^[a-zA-Z0-9_-]+$/`

### Retry Logic

The service automatically retries operations up to 3 times with exponential backoff for:
- Network errors
- Service unavailable errors
- Timeout errors
- Resource exhausted errors

Non-retryable errors (validation, permission) fail immediately.

---

## Medication Event Service

**Location**: `src/services/medicationEventService.ts`

### Purpose

Manages medication events and their synchronization with Firestore, providing offline support through event queuing.

### Key Features

- Event queuing with persistent storage
- Automatic background sync (5-minute interval)
- Foreground sync on app activation
- Retry logic with exponential backoff
- Event change tracking for updates
- Sync status callbacks

### API Reference

#### `medicationEventService.enqueue(event: Omit<MedicationEvent, 'id' | 'timestamp'>): Promise<void>`

Enqueues a new medication event for synchronization.

**Parameters**:
- `event`: Event data without id and timestamp (auto-generated)

**Example**:
```typescript
await medicationEventService.enqueue({
  eventType: 'created',
  medicationId: med.id,
  medicationName: med.name,
  medicationData: med,
  patientId: patient.id,
  patientName: patient.name,
  caregiverId: caregiver.id,
  syncStatus: 'pending',
});
```

#### `medicationEventService.syncPendingEvents(): Promise<void>`

Manually triggers synchronization of all pending events.

**Example**:
```typescript
await medicationEventService.syncPendingEvents();
```

#### `medicationEventService.getPendingCount(): Promise<number>`

Gets the count of pending events in the queue.

**Returns**: Number of pending events

**Example**:
```typescript
const count = await medicationEventService.getPendingCount();
console.log(`${count} events pending sync`);
```

#### `medicationEventService.onSyncComplete(callback: () => void): () => void`

Subscribes to sync completion events.

**Parameters**:
- `callback`: Function to call when sync completes

**Returns**: Unsubscribe function

**Example**:
```typescript
const unsubscribe = medicationEventService.onSyncComplete(() => {
  console.log('Sync completed!');
  refreshEventList();
});

// Later, to unsubscribe:
unsubscribe();
```

#### `medicationEventService.getLastSyncAttempt(): Date | null`

Gets the timestamp of the last sync attempt.

**Returns**: Last sync date or null

**Example**:
```typescript
const lastSync = medicationEventService.getLastSyncAttempt();
if (lastSync) {
  console.log('Last synced:', lastSync.toLocaleString());
}
```

#### `medicationEventService.isSyncInProgress(): boolean`

Checks if synchronization is currently in progress.

**Returns**: True if sync is in progress

**Example**:
```typescript
if (medicationEventService.isSyncInProgress()) {
  showLoadingIndicator();
}
```

### Helper Functions

#### `generateMedicationCreatedEvent(medication: Medication, patientName: string)`

Generates a medication created event.

**Example**:
```typescript
const event = generateMedicationCreatedEvent(medication, patientName);
await medicationEventService.enqueue(event);
```

#### `generateMedicationUpdatedEvent(oldMedication: Medication, newMedication: Medication, patientName: string)`

Generates a medication updated event with change tracking.

**Example**:
```typescript
const event = generateMedicationUpdatedEvent(oldMed, newMed, patientName);
await medicationEventService.enqueue(event);
```

#### `generateMedicationDeletedEvent(medication: Medication, patientName: string)`

Generates a medication deleted event.

**Example**:
```typescript
const event = generateMedicationDeletedEvent(medication, patientName);
await medicationEventService.enqueue(event);
```

#### `createAndEnqueueEvent(medication: Medication, patientName: string, eventType: MedicationEventType, newMedication?: Medication)`

Convenience function to create and enqueue an event in one call.

**Example**:
```typescript
// For create
await createAndEnqueueEvent(medication, patientName, 'created');

// For update
await createAndEnqueueEvent(oldMed, patientName, 'updated', newMed);

// For delete
await createAndEnqueueEvent(medication, patientName, 'deleted');
```

### Background Sync

The service automatically syncs pending events:
- Every 5 minutes (background interval)
- When app comes to foreground
- Immediately after enqueueing (best effort)

### Event Types

```typescript
type MedicationEventType = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'dose_taken' 
  | 'dose_missed';
```

### Sync Status

```typescript
type SyncStatus = 'pending' | 'delivered' | 'failed';
```

---

## Patient Data Cache Service

**Location**: `src/services/patientDataCache.ts`

### Purpose

Caches patient data for offline viewing, providing fallback data when network is unavailable.

### Key Features

- Encrypted data storage
- Automatic cache expiration (24 hours)
- Cache size management (max 10 patients)
- Cache statistics and pruning
- Support for multiple data types

### API Reference

#### `patientDataCache.cachePatient(patient: PatientWithDevice): Promise<void>`

Caches a patient profile.

**Example**:
```typescript
await patientDataCache.cachePatient(patient);
```

#### `patientDataCache.getCachedPatient(patientId: string): Promise<PatientWithDevice | null>`

Retrieves a cached patient profile.

**Returns**: Patient data or null if not found/expired

**Example**:
```typescript
const cachedPatient = await patientDataCache.getCachedPatient(patientId);
if (cachedPatient) {
  setPatient(cachedPatient);
}
```

#### `patientDataCache.cacheMedications(patientId: string, medications: Medication[]): Promise<void>`

Caches patient medications.

**Example**:
```typescript
await patientDataCache.cacheMedications(patientId, medications);
```

#### `patientDataCache.getCachedMedications(patientId: string): Promise<Medication[] | null>`

Retrieves cached medications.

**Example**:
```typescript
const cachedMeds = await patientDataCache.getCachedMedications(patientId);
if (cachedMeds) {
  setMedications(cachedMeds);
}
```

#### `patientDataCache.cacheEvents(patientId: string, events: MedicationEvent[]): Promise<void>`

Caches medication events.

**Example**:
```typescript
await patientDataCache.cacheEvents(patientId, events);
```

#### `patientDataCache.getCachedEvents(patientId: string): Promise<MedicationEvent[] | null>`

Retrieves cached events.

**Example**:
```typescript
const cachedEvents = await patientDataCache.getCachedEvents(patientId);
if (cachedEvents) {
  setEvents(cachedEvents);
}
```

#### `patientDataCache.cacheDeviceState(patientId: string, deviceState: any): Promise<void>`

Caches device state.

**Example**:
```typescript
await patientDataCache.cacheDeviceState(patientId, deviceState);
```

#### `patientDataCache.getCachedDeviceState(patientId: string): Promise<any | null>`

Retrieves cached device state.

**Example**:
```typescript
const cachedState = await patientDataCache.getCachedDeviceState(patientId);
if (cachedState) {
  setDeviceState(cachedState);
}
```

#### `patientDataCache.clearPatientCache(patientId: string): Promise<void>`

Clears cache for a specific patient.

**Example**:
```typescript
await patientDataCache.clearPatientCache(patientId);
```

#### `patientDataCache.clearAllCache(): Promise<void>`

Clears all cached data.

**Example**:
```typescript
await patientDataCache.clearAllCache();
```

#### `patientDataCache.getCacheStats(): Promise<CacheStats>`

Gets cache statistics.

**Returns**: Object with cache statistics

**Example**:
```typescript
const stats = await patientDataCache.getCacheStats();
console.log('Cached patients:', stats.totalPatients);
console.log('Total size:', stats.totalSize, 'bytes');
console.log('Oldest cache:', stats.oldestCache);
console.log('Newest cache:', stats.newestCache);
```

#### `patientDataCache.pruneOldCache(): Promise<void>`

Removes cache entries older than 24 hours.

**Example**:
```typescript
await patientDataCache.pruneOldCache();
```

### Cache Configuration

- **Max Cache Age**: 24 hours
- **Max Cached Patients**: 10
- **Data Types**: patient, medications, events, deviceState

### Cache Strategy

1. **Write-through**: Data is cached immediately after fetching
2. **Stale-while-revalidate**: Cached data is shown while fresh data is fetched
3. **Automatic expiration**: Cache entries expire after 24 hours
4. **LRU eviction**: Oldest entries are removed when limit is reached

---

## Best Practices

### Security

1. Always verify user role before rendering caregiver screens
2. Verify device/patient access before displaying sensitive data
3. Clear cache on logout
4. Use encrypted cache for sensitive data
5. Validate session before critical operations

### Error Handling

1. Use try-catch blocks for all service calls
2. Display user-friendly error messages
3. Log detailed errors for debugging
4. Implement retry logic for transient failures
5. Provide fallback UI for error states

### Performance

1. Cache frequently accessed data
2. Use background sync for non-critical operations
3. Implement pagination for large datasets
4. Prune old cache entries regularly
5. Monitor cache size and performance

### Offline Support

1. Cache data immediately after fetching
2. Display cached data when offline
3. Queue operations for later sync
4. Show sync status to users
5. Handle sync conflicts gracefully

---

## Troubleshooting

### Common Issues

**Issue**: Permission denied errors
- **Solution**: Check Firebase security rules and user authentication

**Issue**: Device linking fails
- **Solution**: Verify device ID format and check development rule status

**Issue**: Events not syncing
- **Solution**: Check network connectivity and sync status

**Issue**: Cache not working
- **Solution**: Verify AsyncStorage permissions and cache key format

**Issue**: Session expired
- **Solution**: Implement token refresh or redirect to login

### Debugging

Enable detailed logging:
```typescript
// In development
console.log('[Service] Operation details:', data);
```

Check service status:
```typescript
const isValid = await isSessionValid();
const pendingCount = await medicationEventService.getPendingCount();
const cacheStats = await patientDataCache.getCacheStats();
```

---

## Migration Notes

### From Legacy System

1. Update all service imports to use new paths
2. Replace old authentication checks with `verifyUserRole()`
3. Migrate to new device linking API
4. Update event generation to use new service
5. Implement cache for offline support

### Breaking Changes

- Device linking now requires minimum 5 characters
- Event service uses singleton pattern
- Cache service uses encrypted storage
- Security service requires explicit role verification

---

## Support

For issues or questions:
1. Check this documentation
2. Review service implementation
3. Check Firebase console for errors
4. Contact development team

Last Updated: 2024

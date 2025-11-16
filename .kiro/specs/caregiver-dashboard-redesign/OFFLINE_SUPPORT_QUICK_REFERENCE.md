# Offline Support - Quick Reference Guide

## 🚀 Quick Start

### Using Network Status
```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const { isOnline, queueStatus } = useNetworkStatus();
```

### Queueing Medication Operations
```typescript
import { createMedicationOffline } from '../services/offlineMedicationService';

await createMedicationOffline(medicationData, patientId, caregiverId);
```

### Caching Data
```typescript
import { patientDataCache } from '../services/patientDataCache';

await patientDataCache.cachePatient(patient);
const cached = await patientDataCache.getCachedPatient(patientId);
```

## 📦 Core Services

### Patient Data Cache Service

**Purpose**: Cache patient data for offline viewing

**Key Methods**:
```typescript
// Cache data
await patientDataCache.cachePatient(patient);
await patientDataCache.cacheMedications(patientId, medications);
await patientDataCache.cacheEvents(patientId, events);
await patientDataCache.cacheDeviceState(patientId, deviceState);

// Retrieve cached data
const patient = await patientDataCache.getCachedPatient(patientId);
const medications = await patientDataCache.getCachedMedications(patientId);
const events = await patientDataCache.getCachedEvents(patientId);
const deviceState = await patientDataCache.getCachedDeviceState(patientId);

// Clear cache
await patientDataCache.clearPatientCache(patientId);
await patientDataCache.clearAllCache();

// Get statistics
const stats = await patientDataCache.getCacheStats();
```

**Configuration**:
- Max cache age: 24 hours
- Max cached patients: 10
- Auto-pruning: Yes

### Offline Queue Manager

**Purpose**: Queue operations when offline and sync when online

**Key Methods**:
```typescript
// Enqueue operation
const queueId = await offlineQueueManager.enqueue(
  'medication_create',
  operation,
  data
);

// Process queue
await offlineQueueManager.processQueue();

// Get status
const status = offlineQueueManager.getQueueStatus();
// Returns: { total, pending, processing, completed, failed, isOnline, isProcessing }

// Subscribe to sync completion
const unsubscribe = offlineQueueManager.onSyncComplete((success) => {
  console.log('Sync completed:', success);
});

// Retry failed items
await offlineQueueManager.retryFailed();

// Clear queue
await offlineQueueManager.clearCompleted();
await offlineQueueManager.clearAll();
```

**Configuration**:
- Max queue size: 500 items
- Max retries: 5 attempts
- Retry backoff: Exponential (1s, 2s, 4s, 8s, 16s)

### Offline Medication Service

**Purpose**: Handle medication operations with offline support

**Functions**:
```typescript
// Create medication
await createMedicationOffline(medication, patientId, caregiverId);

// Update medication
await updateMedicationOffline(medicationId, updates, patientId, caregiverId, oldData);

// Delete medication
await deleteMedicationOffline(medicationId, medicationName, patientId, caregiverId);

// Record dose intake
await recordDoseIntakeOffline(medicationId, medicationName, patientId, caregiverId, timestamp);

// Update inventory
await updateInventoryOffline(medicationId, currentQuantity, patientId, caregiverId);
```

**Behavior**:
- ✅ Executes immediately if online
- ✅ Queues for later if offline
- ✅ Generates medication events
- ✅ Returns temp ID if offline

## 🎣 Hooks

### useNetworkStatus

**Purpose**: Monitor network connectivity and queue status

**Returns**:
```typescript
interface NetworkStatus {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  queueStatus: {
    pending: number;
    processing: number;
    failed: number;
  };
}
```

**Usage**:
```typescript
const networkStatus = useNetworkStatus();

if (!networkStatus.isOnline) {
  // Show offline UI
}

if (networkStatus.queueStatus.pending > 0) {
  // Show sync indicator
}
```

## 🎨 Components

### OfflineIndicator

**Purpose**: Display network status and sync progress

**Props**:
```typescript
interface OfflineIndicatorProps {
  isOnline?: boolean; // Optional override
}
```

**Usage**:
```typescript
<OfflineIndicator />
```

**States**:
- 🔴 **Offline**: "Sin conexión - Los cambios se guardarán localmente"
- 🔵 **Syncing**: "Sincronizando X cambio(s)..."
- 🔵 **Pending**: "X cambio(s) pendiente(s)"
- ✅ **Success**: "Cambios sincronizados"

## 🔄 Data Flow

### Online Operation
```
User Action → Check Network (Online) → Execute Immediately → Update Firestore → Cache Data
```

### Offline Operation
```
User Action → Check Network (Offline) → Queue Operation → Persist Queue → Show Indicator
```

### Sync on Reconnect
```
Network Restored → Process Queue → Execute Operations → Update Firestore → Show Success
```

## 💾 Cache Structure

### Cache Keys
```
@patient_cache_{patientId}_patient
@patient_cache_{patientId}_medications
@patient_cache_{patientId}_events
@patient_cache_{patientId}_deviceState
@patient_cache_metadata
@cached_patients_{caregiverId}
```

### Queue Storage
```
@offline_queue
```

## 🎯 Best Practices

### 1. Always Use Offline-Aware Services
```typescript
// ❌ Don't use direct Firestore operations
await addDoc(collection(db, 'medications'), data);

// ✅ Use offline-aware service
await createMedicationOffline(data, patientId, caregiverId);
```

### 2. Cache Data After Fetching
```typescript
const medications = await fetchMedications(patientId);

// Cache for offline use
await patientDataCache.cacheMedications(patientId, medications);
```

### 3. Show Cached Data Indicator
```typescript
{usingCachedData && (
  <View style={styles.cachedDataBanner}>
    <Ionicons name="information-circle" size={20} color={colors.warning[500]} />
    <Text>Mostrando datos guardados. Conéctate para actualizar.</Text>
  </View>
)}
```

### 4. Handle Network Status Changes
```typescript
const networkStatus = useNetworkStatus();

useEffect(() => {
  if (networkStatus.isOnline) {
    // Refresh data when coming back online
    refetchData();
  }
}, [networkStatus.isOnline]);
```

### 5. Provide Retry Options
```typescript
if (error && !usingCachedData) {
  return (
    <ErrorState
      message="Error loading data"
      onRetry={handleRetry}
    />
  );
}
```

## ⚠️ Common Pitfalls

### 1. Not Checking Network Status
```typescript
// ❌ Don't assume online
await updateMedication(id, data);

// ✅ Use offline-aware service
await updateMedicationOffline(id, data, patientId, caregiverId);
```

### 2. Not Caching Fetched Data
```typescript
// ❌ Fetch without caching
const data = await fetchData();

// ✅ Cache after fetching
const data = await fetchData();
await patientDataCache.cachePatient(data);
```

### 3. Not Showing Offline Indicator
```typescript
// ❌ No visual feedback
<View>{content}</View>

// ✅ Show offline indicator
<View>
  <OfflineIndicator />
  {content}
</View>
```

### 4. Not Handling Cached Data
```typescript
// ❌ Only show live data
const data = medications;

// ✅ Fallback to cached data
const data = medications.length > 0 
  ? medications 
  : cachedMedications;
```

## 🐛 Debugging

### Check Network Status
```typescript
const networkStatus = useNetworkStatus();
console.log('Network:', networkStatus);
```

### Check Queue Status
```typescript
const status = offlineQueueManager.getQueueStatus();
console.log('Queue:', status);
```

### Check Cache
```typescript
const stats = await patientDataCache.getCacheStats();
console.log('Cache:', stats);
```

### View Queue Items
```typescript
const items = offlineQueueManager.getQueueItems();
console.log('Queue items:', items);
```

## 📊 Monitoring

### Cache Statistics
```typescript
const stats = await patientDataCache.getCacheStats();
// {
//   totalPatients: 5,
//   totalSize: 1024000,
//   oldestCache: '2025-11-15T10:00:00Z',
//   newestCache: '2025-11-16T14:30:00Z'
// }
```

### Queue Statistics
```typescript
const status = offlineQueueManager.getQueueStatus();
// {
//   total: 10,
//   pending: 3,
//   processing: 1,
//   completed: 5,
//   failed: 1,
//   isOnline: true,
//   isProcessing: false
// }
```

## 🔧 Configuration

### Cache Settings
```typescript
// In patientDataCache.ts
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_PATIENTS = 10;
```

### Queue Settings
```typescript
// In offlineQueueManager.ts
const MAX_QUEUE_SIZE = 500;
const MAX_RETRY_COUNT = 5;
```

## 📱 User Experience

### Offline Workflow
1. User goes offline
2. Offline indicator appears
3. Cached data is displayed
4. User makes changes
5. Changes are queued
6. User comes back online
7. Queue automatically syncs
8. Success indicator appears
9. Fresh data is loaded

### Visual Feedback
- **Offline**: Yellow banner with cloud-offline icon
- **Syncing**: Blue banner with sync icon
- **Success**: Green banner with checkmark (auto-hides)
- **Cached Data**: Info banner at top of screen

## 🎓 Examples

### Complete Component Example
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { patientDataCache } from '../services/patientDataCache';
import { OfflineIndicator } from '../components/caregiver/OfflineIndicator';

function MyComponent({ patientId }) {
  const networkStatus = useNetworkStatus();
  const [data, setData] = useState([]);
  const [cachedData, setCachedData] = useState([]);
  const [usingCache, setUsingCache] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    const loadCache = async () => {
      const cached = await patientDataCache.getCachedMedications(patientId);
      if (cached) setCachedData(cached);
    };
    loadCache();
  }, [patientId]);

  // Fetch live data when online
  useEffect(() => {
    if (networkStatus.isOnline) {
      fetchData();
    }
  }, [networkStatus.isOnline]);

  const fetchData = async () => {
    const result = await fetchMedications(patientId);
    setData(result);
    await patientDataCache.cacheMedications(patientId, result);
    setUsingCache(false);
  };

  // Use cached data if offline or no live data
  const displayData = data.length > 0 ? data : cachedData;
  const showCacheBanner = usingCache || (!networkStatus.isOnline && cachedData.length > 0);

  return (
    <View>
      <OfflineIndicator />
      {showCacheBanner && (
        <Text>Mostrando datos guardados</Text>
      )}
      {displayData.map(item => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </View>
  );
}
```

## 📚 Additional Resources

- [NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)
- [Task 14.2 Implementation Summary](.kiro/specs/caregiver-dashboard-redesign/TASK14.2_IMPLEMENTATION_SUMMARY.md)

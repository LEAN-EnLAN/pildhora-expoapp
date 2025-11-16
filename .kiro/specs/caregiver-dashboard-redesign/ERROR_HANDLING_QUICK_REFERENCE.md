# Error Handling & Offline Support - Quick Reference

## Components

### ErrorState Component
```typescript
import { ErrorState } from '../../src/components/caregiver/ErrorState';

<ErrorState
  category={ErrorCategory.NETWORK}
  message="No se pudo conectar al servidor"
  onRetry={handleRetry}
/>
```

### OfflineIndicator Component
```typescript
import { OfflineIndicator } from '../../src/components/caregiver/OfflineIndicator';

<OfflineIndicator isOnline={isOnline} />
```

### ErrorBoundary Wrapper
```typescript
import { ErrorBoundary } from '../../src/components/shared/ErrorBoundary';

export default function MyScreen() {
  return (
    <ErrorBoundary>
      <MyScreenContent />
    </ErrorBoundary>
  );
}
```

## Services

### Patient Data Cache
```typescript
import { patientDataCache } from '../../src/services/patientDataCache';

// Cache data
await patientDataCache.cachePatient(patient);
await patientDataCache.cacheMedications(patientId, medications);
await patientDataCache.cacheEvents(caregiverId, events);

// Retrieve cached data
const patient = await patientDataCache.getCachedPatient(patientId);
const meds = await patientDataCache.getCachedMedications(patientId);
const events = await patientDataCache.getCachedEvents(caregiverId);

// Clear cache
await patientDataCache.clearPatientCache(patientId);
await patientDataCache.clearAllCache();
```

### Offline Queue Manager
```typescript
import { offlineQueueManager } from '../../src/services/offlineQueueManager';

// Check online status
const isOnline = offlineQueueManager.isNetworkOnline();

// Enqueue operation
await offlineQueueManager.enqueue(
  'medication_create',
  () => createMedication(data),
  data
);

// Get queue status
const status = offlineQueueManager.getQueueStatus();
```

### Error Handling Utilities
```typescript
import { 
  categorizeError, 
  ErrorCategory,
  handleError,
  withRetry 
} from '../../src/utils/errorHandling';

// Categorize error
const categorized = categorizeError(error);

// Handle error with logging
await handleError(error, { context: 'dashboard' }, true);

// Retry with exponential backoff
const result = await withRetry(
  () => fetchData(),
  { maxAttempts: 3 }
);
```

## Error Categories

- `ErrorCategory.NETWORK` - Connection errors
- `ErrorCategory.PERMISSION` - Access denied
- `ErrorCategory.INITIALIZATION` - Firebase init errors
- `ErrorCategory.NOT_FOUND` - Resource not found
- `ErrorCategory.VALIDATION` - Invalid data
- `ErrorCategory.PLATFORM_API` - Device API errors
- `ErrorCategory.UNKNOWN` - Generic errors

## Common Patterns

### Screen with Error Handling
```typescript
function MyScreenContent() {
  const [error, setError] = useState<any | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [cachedData, setCachedData] = useState([]);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // Monitor network status
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(offlineQueueManager.isNetworkOnline());
    };
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load cached data
  useEffect(() => {
    const loadCache = async () => {
      const cached = await patientDataCache.getCachedData(id);
      if (cached) setCachedData(cached);
    };
    loadCache();
  }, [id]);

  // Fetch data with error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadData();
        setData(data);
        await patientDataCache.cacheData(id, data);
        setUsingCachedData(false);
      } catch (err) {
        const categorized = categorizeError(err);
        setError(categorized);
        if (cachedData.length > 0) {
          setData(cachedData);
          setUsingCachedData(true);
        }
      }
    };
    if (isOnline) fetchData();
  }, [isOnline]);

  // Error state
  if (error && !usingCachedData && cachedData.length === 0) {
    return (
      <ErrorState
        category={error.category}
        message={error.userMessage}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      {usingCachedData && <CachedDataBanner />}
      {/* Screen content */}
    </>
  );
}

export default function MyScreen() {
  return (
    <ErrorBoundary>
      <MyScreenContent />
    </ErrorBoundary>
  );
}
```

### Cached Data Banner
```typescript
{usingCachedData && (
  <View style={styles.cachedDataBanner}>
    <Ionicons name="information-circle" size={20} color={colors.warning[500]} />
    <Text style={styles.cachedDataText}>
      Mostrando datos guardados. Conéctate para actualizar.
    </Text>
  </View>
)}
```

## Styling

### Cached Data Banner Styles
```typescript
cachedDataBanner: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.warning[50],
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  gap: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.warning[200],
},
cachedDataText: {
  flex: 1,
  fontSize: typography.fontSize.sm,
  color: colors.warning[500],
  fontWeight: typography.fontWeight.medium,
},
```

## Testing

### Manual Testing Steps

1. **Test Offline Mode:**
   - Disable network
   - Open screen
   - Verify cached data displays
   - Check offline indicator shows

2. **Test Error Recovery:**
   - Trigger error (e.g., invalid data)
   - Verify error state shows
   - Click retry button
   - Verify data loads

3. **Test Sync:**
   - Go offline
   - Make changes (if supported)
   - Go online
   - Verify sync occurs
   - Check success notification

## Best Practices

1. **Always wrap screens with ErrorBoundary**
2. **Cache data after successful loads**
3. **Check online status before network operations**
4. **Provide retry buttons for recoverable errors**
5. **Show cached data when offline**
6. **Display clear offline indicators**
7. **Use categorizeError for consistent error handling**
8. **Log errors for debugging**
9. **Test offline scenarios thoroughly**
10. **Provide user-friendly error messages in Spanish**

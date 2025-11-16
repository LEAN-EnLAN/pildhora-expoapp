# Error States Quick Reference Guide

## Quick Start

### Adding Error Handling to a New Screen

```typescript
import { ErrorState } from '../../src/components/caregiver/ErrorState';
import { OfflineIndicator } from '../../src/components/caregiver/OfflineIndicator';
import { categorizeError } from '../../src/utils/errorHandling';
import { offlineQueueManager } from '../../src/services/offlineQueueManager';

function MyScreen() {
  const [error, setError] = useState<any | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Monitor network status
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(offlineQueueManager.isNetworkOnline());
    };
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Handle retry
  const handleRetry = () => {
    setError(null);
    // Re-fetch data
  };
  
  // Error state
  if (error) {
    const categorized = categorizeError(error);
    return (
      <ErrorState
        category={categorized.category}
        message={categorized.userMessage}
        onRetry={handleRetry}
      />
    );
  }
  
  return (
    <View>
      <OfflineIndicator isOnline={isOnline} />
      {/* Your content */}
    </View>
  );
}
```

---

## Error Categories

| Category | Icon | Retryable | Use Case |
|----------|------|-----------|----------|
| `NETWORK` | cloud-offline | ✅ Yes | Network failures, timeouts |
| `PERMISSION` | lock-closed | ❌ No | Access denied, auth errors |
| `INITIALIZATION` | warning | ✅ Yes | Firebase init failures |
| `NOT_FOUND` | search | ❌ No | Resource not found |
| `VALIDATION` | alert-circle | ❌ No | Invalid data |
| `PLATFORM_API` | alert-circle | Varies | Device API errors |
| `UNKNOWN` | alert-circle | ✅ Yes | Unexpected errors |

---

## Common Error Patterns

### Pattern 1: Firestore Query Error

```typescript
try {
  const snapshot = await getDocs(query);
  // Process data
} catch (error) {
  const categorized = categorizeError(error);
  setError(categorized);
}
```

### Pattern 2: Real-time Listener Error

```typescript
const unsubscribe = onSnapshot(
  query,
  (snapshot) => {
    // Success
    setData(processSnapshot(snapshot));
    setError(null);
  },
  (error) => {
    // Error
    const categorized = categorizeError(error);
    setError(categorized);
  }
);
```

### Pattern 3: Async Operation with Retry

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    const data = await fetchData();
    setData(data);
    setError(null);
  } catch (error) {
    const categorized = categorizeError(error);
    setError(categorized);
  } finally {
    setLoading(false);
  }
};

const handleRetry = () => {
  setError(null);
  loadData();
};
```

---

## Cached Data Fallback Pattern

```typescript
const [cachedData, setCachedData] = useState([]);
const [usingCachedData, setUsingCachedData] = useState(false);

// Load cached data on mount
useEffect(() => {
  const loadCached = async () => {
    const cached = await patientDataCache.getCachedData(id);
    if (cached) setCachedData(cached);
  };
  loadCached();
}, [id]);

// Use cached data on error
useEffect(() => {
  if (error && cachedData.length > 0) {
    setData(cachedData);
    setUsingCachedData(true);
  }
}, [error, cachedData]);

// Show banner when using cached data
{usingCachedData && (
  <View style={styles.cachedDataBanner}>
    <Ionicons name="information-circle" size={20} color={colors.warning[500]} />
    <Text>Mostrando datos guardados. Conéctate para actualizar.</Text>
  </View>
)}
```

---

## ErrorState Component Props

```typescript
interface ErrorStateProps {
  title?: string;              // Optional custom title
  message: string;             // Required error message
  category?: ErrorCategory;    // Error category for icon/title
  onRetry?: () => void;        // Optional retry handler
  retryLabel?: string;         // Custom retry button text
  showIcon?: boolean;          // Show/hide icon (default: true)
}
```

### Usage Examples

**Basic Error**:
```typescript
<ErrorState
  message="No se pudo cargar los datos"
  onRetry={handleRetry}
/>
```

**Network Error**:
```typescript
<ErrorState
  category={ErrorCategory.NETWORK}
  message="Verifica tu conexión a internet"
  onRetry={handleRetry}
/>
```

**Permission Error (No Retry)**:
```typescript
<ErrorState
  category={ErrorCategory.PERMISSION}
  message="No tienes permiso para ver esta información"
/>
```

**Custom Title**:
```typescript
<ErrorState
  title="Error Personalizado"
  message="Algo salió mal"
  onRetry={handleRetry}
  retryLabel="Intentar de Nuevo"
/>
```

---

## Error Messages (Spanish)

### Network Errors
```typescript
"No se pudo conectar al servidor. Por favor, verifica tu conexión a internet e intenta nuevamente."
```

### Permission Errors
```typescript
"No tienes permiso para realizar esta acción."
```

### Initialization Errors
```typescript
"Error al inicializar la aplicación. Por favor, reinicia la aplicación."
```

### Not Found Errors
```typescript
"El recurso solicitado no fue encontrado."
```

### Validation Errors
```typescript
"Los datos proporcionados no son válidos. Por favor, verifica e intenta nuevamente."
```

### Unknown Errors
```typescript
"Ocurrió un error inesperado. Por favor, intenta nuevamente."
```

---

## Firebase Error Code Mapping

| Firebase Code | Category | Retryable |
|---------------|----------|-----------|
| `unavailable` | NETWORK | ✅ |
| `timeout` | NETWORK | ✅ |
| `deadline-exceeded` | NETWORK | ✅ |
| `permission-denied` | PERMISSION | ❌ |
| `unauthenticated` | PERMISSION | ❌ |
| `not-found` | NOT_FOUND | ❌ |
| `failed-precondition` | VALIDATION | ❌ |
| `invalid-argument` | VALIDATION | ❌ |

---

## Offline Support Checklist

- [ ] Import `offlineQueueManager`
- [ ] Add `isOnline` state
- [ ] Monitor network status with interval
- [ ] Add `<OfflineIndicator isOnline={isOnline} />`
- [ ] Load cached data on mount
- [ ] Fallback to cached data on error
- [ ] Show cached data banner when using cached data
- [ ] Disable pull-to-refresh when offline
- [ ] Cache fresh data when loaded

---

## Testing Error States

### Manual Testing Checklist

1. **Network Error**:
   - Turn off WiFi/data
   - Try to load screen
   - Verify error message shows
   - Verify retry button appears
   - Turn on WiFi/data
   - Tap retry
   - Verify data loads

2. **Cached Data**:
   - Load screen with internet
   - Turn off internet
   - Reload screen
   - Verify cached data shows
   - Verify banner appears

3. **Permission Error**:
   - Modify Firestore rules to deny access
   - Try to load data
   - Verify permission error shows
   - Verify no retry button

4. **Empty State vs Error State**:
   - Verify empty state shows when no data (not an error)
   - Verify error state shows on actual errors

---

## Common Mistakes to Avoid

❌ **Don't show error state when data is empty**
```typescript
// WRONG
if (data.length === 0) {
  return <ErrorState message="No data" />;
}

// RIGHT
if (data.length === 0) {
  return <EmptyState />;
}
```

❌ **Don't forget to clear error on retry**
```typescript
// WRONG
const handleRetry = () => {
  loadData(); // Error state still showing
};

// RIGHT
const handleRetry = () => {
  setError(null);
  loadData();
};
```

❌ **Don't show error when cached data is available**
```typescript
// WRONG
if (error) {
  return <ErrorState />;
}

// RIGHT
if (error && !cachedData.length) {
  return <ErrorState />;
}
```

❌ **Don't use generic error messages**
```typescript
// WRONG
<ErrorState message="Error" />

// RIGHT
const categorized = categorizeError(error);
<ErrorState message={categorized.userMessage} />
```

---

## Performance Tips

1. **Throttle network checks**: Check every 5 seconds, not on every render
2. **Cache aggressively**: Cache data immediately after loading
3. **Use memoization**: Memoize error categorization if called frequently
4. **Cleanup listeners**: Always cleanup Firestore listeners on unmount
5. **Async error logging**: Don't block UI for error logging

---

## Accessibility

✅ **Do**:
- Use `accessibilityLabel` on retry buttons
- Use `accessibilityHint` to explain what retry does
- Ensure error messages are screen reader friendly
- Use semantic colors (error red, warning yellow)

❌ **Don't**:
- Rely only on color to convey error state
- Use technical jargon in error messages
- Make retry buttons too small (min 44x44)
- Forget to announce errors to screen readers

---

## Debug Tips

### Enable Error Logging
```typescript
import { logError, getErrorLogs } from '../../src/utils/errorHandling';

// Log error
await logError(categorizedError);

// View logs
const logs = await getErrorLogs();
console.log('Error logs:', logs);
```

### Test Error States in Development
```typescript
// Simulate network error
const simulateNetworkError = () => {
  const error = new Error('Network request failed');
  const categorized = categorizeError(error);
  setError(categorized);
};

// Simulate permission error
const simulatePermissionError = () => {
  const error = { code: 'permission-denied', message: 'Access denied' };
  const categorized = categorizeError(error);
  setError(categorized);
};
```

---

## Related Files

- **ErrorState Component**: `src/components/caregiver/ErrorState.tsx`
- **Error Utilities**: `src/utils/errorHandling.ts`
- **Offline Indicator**: `src/components/caregiver/OfflineIndicator.tsx`
- **Patient Cache**: `src/services/patientDataCache.ts`
- **Offline Queue**: `src/services/offlineQueueManager.ts`
- **Error Boundary**: `src/components/shared/ErrorBoundary.tsx`

---

## Support

For questions or issues with error handling:
1. Check this guide first
2. Review implementation in existing screens (Dashboard, Events, Medications)
3. Check error logs with `getErrorLogs()`
4. Review Firebase error codes documentation

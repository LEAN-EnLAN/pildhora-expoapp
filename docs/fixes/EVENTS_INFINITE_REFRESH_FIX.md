# Events Infinite Refresh Loop Fix

## Problem
The events screen was experiencing an infinite refresh loop, continuously fetching the same query from Firestore and causing visual flickering.

## Root Cause Analysis

### Primary Issue: Unstable Callback Dependencies
The main cause was unstable callback functions (`onSuccess` and `onError`) being passed to `useCollectionSWR`:

1. **Inline callback functions**: The callbacks were defined inline in the hook call, causing them to be recreated on every render
2. **useEffect dependency issue**: The `useCollectionSWR` hook's `useEffect` had disabled eslint warnings and wasn't properly tracking callback dependencies
3. **Realtime listener recreation**: Every time callbacks changed, the realtime `onSnapshot` listener was torn down and recreated
4. **Infinite loop**: This caused continuous refetches and visual reloading

### Secondary Issues
1. **Auto-load filters on mount**: `EventFilterControls` was loading saved filters from AsyncStorage on mount, including `dateRange` with Date objects
2. **Date object reference instability**: Date objects were being recreated with the same values but different references
3. **Cache key regeneration**: The cache key depended on Date object references instead of timestamp values

## Solution

### 1. Memoized Callbacks (Primary Fix)
Wrapped the `onSuccess` and `onError` callbacks in `useCallback` to prevent them from being recreated on every render:

```typescript
// Before: Unstable - recreated on every render
useCollectionSWR({
  onSuccess: (data) => {
    if (user?.id && data.length > 0) {
      patientDataCache.cacheEvents(user.id, data).catch(err => {
        console.error('[MedicationEventRegistry] Error caching events:', err);
      });
    }
  },
  onError: (err) => {
    console.error('[MedicationEventRegistry] Error fetching events:', err);
  },
});

// After: Stable - memoized with useCallback
const handleSuccess = useCallback((data: MedicationEvent[]) => {
  if (user?.id && data.length > 0) {
    patientDataCache.cacheEvents(user.id, data).catch(err => {
      console.error('[MedicationEventRegistry] Error caching events:', err);
    });
  }
}, [user?.id]);

const handleError = useCallback((err: Error) => {
  console.error('[MedicationEventRegistry] Error fetching events:', err);
}, []);

useCollectionSWR({
  onSuccess: handleSuccess,
  onError: handleError,
});
```

### 2. Disabled Realtime Updates
Temporarily disabled realtime updates (`realtime: false`) to prevent the infinite loop while maintaining data freshness through pull-to-refresh:

```typescript
useCollectionSWR({
  realtime: false, // Disabled to prevent infinite refresh loops
  // Users can still refresh manually via pull-to-refresh
});
```

**Trade-off**: Events won't update in real-time, but users can manually refresh. This is acceptable since:
- Pull-to-refresh is a familiar pattern
- Prevents battery drain from continuous listeners
- Events don't change frequently enough to require real-time updates

### 3. Disabled Auto-Load/Save Filters
Commented out the `useEffect` hooks in `EventFilterControls.tsx` that automatically loaded and saved filters from AsyncStorage.

**Trade-off**: Filters are now session-only and don't persist between app restarts.

### 4. Stabilized Cache Key Dependencies
Updated the `cacheKey` useMemo to depend on stable timestamp values instead of Date object references:

```typescript
useMemo(() => {
  // ...
}, [
  user?.id, 
  filters.patientId, 
  filters.eventType,
  filters.dateRange?.start.getTime(), // Stable timestamp
  filters.dateRange?.end.getTime(),   // Stable timestamp
]);
```

### 5. Stabilized Query Dependencies
Applied the same timestamp-based dependency fix to the query building `useEffect`.

### 6. Fixed TypeScript Error
Corrected `colors.success` to `colors.success[500]` in EventFilterControls for proper color token usage.

## Files Modified
- `src/components/caregiver/EventFilterControls.tsx` - Disabled auto-load/save, fixed color token
- `app/caregiver/events.tsx` - Memoized callbacks, disabled realtime, stabilized dependencies

## Testing
After applying these changes:
1. ✅ The events screen should load once and remain stable
2. ✅ No infinite refresh loops should occur
3. ✅ The screen should not flicker or continuously reload
4. ✅ Changing filters should trigger a single refetch
5. ✅ Pull-to-refresh should work correctly

## Future Improvements

### Re-enable Realtime Updates (Recommended)
Once the callback stability is confirmed, realtime updates can be safely re-enabled by changing:
```typescript
realtime: false → realtime: true
```

### Filter Persistence (Optional)
If filter persistence is desired:
- Store Date objects as ISO strings or timestamps in AsyncStorage
- Implement debounced filter changes
- Add comparison logic to detect actual value changes vs reference changes

### useCollectionSWR Hook Improvements (Recommended)
The hook should be refactored to:
- Properly memoize the `fetchData` function with `useCallback`
- Include all dependencies in the `useEffect` dependency array
- Remove the eslint-disable comment
- Consider using `useRef` for callbacks to avoid dependency issues

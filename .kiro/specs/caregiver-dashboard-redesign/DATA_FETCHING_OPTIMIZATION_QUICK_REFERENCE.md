# Data Fetching Optimization - Quick Reference

## useCollectionSWR Hook

### Basic Usage

```typescript
import { useCollectionSWR } from '../hooks/useCollectionSWR';

const { data, isLoading, error, mutate } = useCollectionSWR({
  cacheKey: 'myData:userId',
  query: myQuery,
  initialData: STATIC_DATA,
});
```

### With All Options

```typescript
const { data, source, isLoading, error, mutate, refetch } = useCollectionSWR({
  cacheKey: 'events:userId:filters',
  query: eventsQuery,
  initialData: STATIC_INITIAL_EVENTS,
  realtime: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  onSuccess: (data) => console.log('Success:', data.length),
  onError: (error) => console.error('Error:', error),
});
```

## Cache Keys

### Format

```typescript
// Simple
`collection:userId`

// With filters
`collection:userId:filter1:filter2`

// With date range
`collection:userId:${startTime}-${endTime}`
```

### Examples

```typescript
// Events
`events:${userId}:${patientId}:${eventType}:${dateRange}`

// Patients
`linked_patients:${caregiverId}`

// Tasks
`tasks:${userId}`
```

## Pagination

### Add Limit to Query

```typescript
import { limit } from 'firebase/firestore';

const myQuery = query(
  collection(db, 'myCollection'),
  where('userId', '==', userId),
  orderBy('timestamp', 'desc'),
  limit(50) // Pagination
);
```

### Common Limits

- Events: 50 per page
- Patients: 50 max
- Tasks: 100 max
- Latest event: 1

## Cache TTL

### Set TTL

```typescript
const { data } = useCollectionSWR({
  cacheKey: 'myData',
  query: myQuery,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
});
```

### Common TTLs

- Events: 5 minutes
- Patients: No expiration (real-time)
- Tasks: 10 minutes
- Settings: 30 minutes

## Manual Refetch

### Using mutate()

```typescript
const { mutate } = useCollectionSWR({ ... });

// Trigger refetch
const handleRefresh = () => {
  mutate();
};
```

### Using refetch()

```typescript
const { refetch } = useCollectionSWR({ ... });

// Async refetch
const handleRetry = async () => {
  await refetch();
};
```

## Static Initial Data

### Define Static Data

```typescript
const STATIC_INITIAL_EVENTS: MedicationEvent[] = [];
const STATIC_INITIAL_TASKS: Task[] = [];
```

### Use in Hook

```typescript
const { data } = useCollectionSWR({
  cacheKey: 'events',
  query: eventsQuery,
  initialData: STATIC_INITIAL_EVENTS, // Instant render
});
```

## Real-time Updates

### Enable (Default)

```typescript
const { data } = useCollectionSWR({
  cacheKey: 'events',
  query: eventsQuery,
  realtime: true, // Default
});
```

### Disable

```typescript
const { data } = useCollectionSWR({
  cacheKey: 'settings',
  query: settingsQuery,
  realtime: false, // No onSnapshot
});
```

## Error Handling

### Check Error State

```typescript
const { data, error } = useCollectionSWR({ ... });

if (error) {
  return <ErrorState error={error} />;
}
```

### With Callback

```typescript
const { data } = useCollectionSWR({
  cacheKey: 'events',
  query: eventsQuery,
  onError: (error) => {
    console.error('Failed to fetch:', error);
    showToast('Error loading data');
  },
});
```

## Success Callback

### Track Fetches

```typescript
const { data } = useCollectionSWR({
  cacheKey: 'events',
  query: eventsQuery,
  onSuccess: (data) => {
    console.log('Fetched', data.length, 'items');
    analytics.track('data_loaded', { count: data.length });
  },
});
```

## Source Tracking

### Check Data Source

```typescript
const { data, source } = useCollectionSWR({ ... });

// source can be: 'static' | 'cache' | 'firestore'

if (source === 'cache') {
  showCacheWarning();
}
```

## Firestore Indexes

### Required Indexes

Add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "myCollection",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "mode": "ASCENDING" },
    { "fieldPath": "timestamp", "mode": "DESCENDING" }
  ]
}
```

### Common Patterns

```json
// Single field + timestamp
{ "userId": "ASC", "timestamp": "DESC" }

// Multiple filters + timestamp
{ "userId": "ASC", "status": "ASC", "timestamp": "DESC" }

// With limit (no special index needed)
```

## Performance Tips

### 1. Memoize Queries

```typescript
const myQuery = useMemo(() => {
  if (!userId) return null;
  return query(
    collection(db, 'myCollection'),
    where('userId', '==', userId),
    limit(50)
  );
}, [userId]);
```

### 2. Memoize Cache Keys

```typescript
const cacheKey = useMemo(() => {
  if (!userId) return null;
  return `myData:${userId}:${filter}`;
}, [userId, filter]);
```

### 3. Use Callbacks

```typescript
const handleRefresh = useCallback(() => {
  mutate();
}, [mutate]);
```

### 4. Optimize Re-renders

```typescript
const filteredData = useMemo(() => {
  return data.filter(item => item.status === 'active');
}, [data]);
```

## Migration Checklist

- [ ] Add static initial data
- [ ] Replace manual fetching with useCollectionSWR
- [ ] Add pagination to query
- [ ] Memoize query and cache key
- [ ] Update refresh handler to use mutate()
- [ ] Add Firestore indexes
- [ ] Test cache behavior
- [ ] Test real-time updates
- [ ] Test error handling
- [ ] Test offline mode

## Common Patterns

### Events List

```typescript
const STATIC_EVENTS: MedicationEvent[] = [];

const { data: events, isLoading, mutate } = useCollectionSWR({
  cacheKey: `events:${userId}:${filters}`,
  query: eventsQuery,
  initialData: STATIC_EVENTS,
  realtime: true,
  cacheTTL: 5 * 60 * 1000,
});
```

### Patient List

```typescript
const { data: patients, isLoading } = useCollectionSWR({
  cacheKey: `patients:${caregiverId}`,
  query: patientsQuery,
  initialData: [],
  realtime: true,
});
```

### Settings

```typescript
const { data: settings, refetch } = useCollectionSWR({
  cacheKey: `settings:${userId}`,
  query: settingsQuery,
  realtime: false, // No real-time for settings
  cacheTTL: 30 * 60 * 1000, // 30 minutes
});
```

## Troubleshooting

### Data Not Updating

1. Check cache key is correct
2. Verify real-time is enabled
3. Check Firestore indexes
4. Verify query is not null

### Slow Initial Load

1. Add static initial data
2. Check cache is working
3. Verify pagination limit
4. Check network speed

### Too Many Requests

1. Increase cache TTL
2. Disable real-time if not needed
3. Add pagination
4. Memoize queries

### Cache Not Working

1. Verify cache key is stable
2. Check AsyncStorage permissions
3. Verify cache TTL not too short
4. Check for cache errors in logs

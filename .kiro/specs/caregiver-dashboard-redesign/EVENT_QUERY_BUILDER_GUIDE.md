# Event Query Builder - Developer Guide

## Quick Start

### Import the Query Builder

```typescript
import { buildEventQuery, applyClientSideSearch } from '../../src/utils/eventQueryBuilder';
```

### Build a Query

```typescript
const db = await getDbInstance();
const query = buildEventQuery(
  db,                    // Firestore instance
  'caregiver-123',      // Caregiver ID (required)
  {                     // Filters (all optional)
    patientId: 'patient-456',
    eventType: 'created',
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    }
  },
  50                    // Max results (optional, default: 50)
);
```

### Apply Client-Side Search

```typescript
const filteredEvents = applyClientSideSearch(
  events,              // Array of events
  'aspirin'           // Search query (optional)
);
```

## Filter Types

### 1. Patient Filter
```typescript
{
  patientId: 'patient-123'
}
```
- **Type**: Server-side (Firestore)
- **Effect**: Shows only events for specified patient
- **Index Required**: Yes

### 2. Event Type Filter
```typescript
{
  eventType: 'created' | 'updated' | 'deleted'
}
```
- **Type**: Server-side (Firestore)
- **Effect**: Shows only events of specified type
- **Index Required**: Yes

### 3. Date Range Filter
```typescript
{
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
}
```
- **Type**: Server-side (Firestore)
- **Effect**: Shows events within date range
- **Index Required**: Yes

### 4. Medication Name Search
```typescript
{
  searchQuery: 'aspirin'
}
```
- **Type**: Client-side (JavaScript)
- **Effect**: Filters by medication name (case-insensitive)
- **Index Required**: No

## Common Patterns

### Pattern 1: All Events for Caregiver
```typescript
const query = buildEventQuery(db, caregiverId, {});
```

### Pattern 2: Events for Specific Patient
```typescript
const query = buildEventQuery(db, caregiverId, {
  patientId: selectedPatientId
});
```

### Pattern 3: Recent Events (Last 7 Days)
```typescript
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const query = buildEventQuery(db, caregiverId, {
  dateRange: {
    start: sevenDaysAgo,
    end: new Date()
  }
});
```

### Pattern 4: Created Events Only
```typescript
const query = buildEventQuery(db, caregiverId, {
  eventType: 'created'
});
```

### Pattern 5: All Filters Combined
```typescript
const query = buildEventQuery(db, caregiverId, {
  patientId: selectedPatientId,
  eventType: 'updated',
  dateRange: {
    start: startDate,
    end: endDate
  }
});

// Then apply client-side search
const filtered = applyClientSideSearch(events, searchQuery);
```

## Real-Time Listener Setup

```typescript
useEffect(() => {
  const db = await getDbInstance();
  const query = buildEventQuery(db, caregiverId, filters);
  
  const unsubscribe = onSnapshot(
    query,
    (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(events);
    },
    (error) => {
      console.error('Query error:', error);
    }
  );
  
  return () => unsubscribe();
}, [caregiverId, filters]);
```

## Error Handling

### Check for Index Errors
```typescript
try {
  const query = buildEventQuery(db, caregiverId, filters);
  // Use query...
} catch (error) {
  if (error.message.includes('index')) {
    console.error('Missing Firestore index:', error);
    // Show user-friendly message
  }
}
```

### Validate Filter Combinations
```typescript
import { validateFilterCombination } from '../../src/utils/eventQueryBuilder';

const validation = validateFilterCombination(filters);
if (!validation.valid) {
  console.error('Invalid filter combination:', validation.error);
}
```

## Performance Tips

### 1. Use Appropriate Limits
```typescript
// For initial load
const query = buildEventQuery(db, caregiverId, filters, 20);

// For "load more"
const query = buildEventQuery(db, caregiverId, filters, 50);
```

### 2. Combine Server and Client Filtering
```typescript
// Server-side: Filter by patient, type, date
const query = buildEventQuery(db, caregiverId, {
  patientId,
  eventType,
  dateRange
});

// Client-side: Search by medication name
const filtered = applyClientSideSearch(events, searchQuery);
```

### 3. Debounce Search Input
```typescript
const debouncedSearch = useMemo(
  () => debounce((query) => {
    const filtered = applyClientSideSearch(events, query);
    setFilteredEvents(filtered);
  }, 300),
  [events]
);
```

## Debugging

### Log Query Configuration
```typescript
console.log('Building query with filters:', {
  caregiverId,
  patientId: filters.patientId,
  eventType: filters.eventType,
  dateRange: filters.dateRange
});
```

### Get Required Index Config
```typescript
import { getRequiredIndexConfig } from '../../src/utils/eventQueryBuilder';

const indexConfig = getRequiredIndexConfig(filters);
console.log('Required index:', JSON.stringify(indexConfig, null, 2));
```

### Format Filter Summary
```typescript
import { formatFilterSummary } from '../../src/utils/eventQueryBuilder';

const summary = formatFilterSummary(filters, patientName);
console.log('Active filters:', summary);
```

## Testing

### Unit Test Example
```typescript
import { buildEventQuery, applyClientSideSearch } from './eventQueryBuilder';

describe('Event Query Builder', () => {
  it('should build query with patient filter', () => {
    const query = buildEventQuery(mockDb, 'caregiver-1', {
      patientId: 'patient-1'
    });
    
    expect(query.constraints).toHaveLength(4); // caregiver, patient, orderBy, limit
  });
  
  it('should filter events by medication name', () => {
    const events = [
      { medicationName: 'Aspirin' },
      { medicationName: 'Ibuprofen' }
    ];
    
    const filtered = applyClientSideSearch(events, 'asp');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].medicationName).toBe('Aspirin');
  });
});
```

## Firestore Index Requirements

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### Check Index Status
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click "Indexes" tab
4. Verify all indexes are "Enabled"

### Required Indexes
- `caregiverId` + `timestamp`
- `caregiverId` + `patientId` + `timestamp`
- `caregiverId` + `eventType` + `timestamp`
- `caregiverId` + `patientId` + `eventType` + `timestamp`
- Plus date range variations

## Common Issues

### Issue: "Missing index" error
**Solution**: Deploy Firestore indexes
```bash
firebase deploy --only firestore:indexes
```

### Issue: Query returns no results
**Solution**: Check filter values
```typescript
console.log('Filters:', filters);
console.log('Caregiver ID:', caregiverId);
```

### Issue: Search not working
**Solution**: Ensure client-side search is applied after Firestore query
```typescript
// ❌ Wrong - search before Firestore results
const filtered = applyClientSideSearch([], searchQuery);

// ✅ Correct - search after Firestore results
const filtered = applyClientSideSearch(events, searchQuery);
```

### Issue: Real-time updates not working
**Solution**: Ensure listener cleanup
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback);
  return () => unsubscribe(); // Important!
}, [dependencies]);
```

## API Reference

### `buildEventQuery(db, caregiverId, filters, maxResults)`

**Parameters:**
- `db: Firestore` - Firestore database instance
- `caregiverId: string` - ID of the caregiver (required)
- `filters: EventFilters` - Filter object (optional)
- `maxResults: number` - Maximum results (default: 50)

**Returns:** `Query<DocumentData>` - Firestore query

**Example:**
```typescript
const query = buildEventQuery(db, 'caregiver-123', {
  patientId: 'patient-456'
}, 20);
```

### `applyClientSideSearch(events, searchQuery)`

**Parameters:**
- `events: T[]` - Array of events with `medicationName` property
- `searchQuery: string | undefined` - Search string (optional)

**Returns:** `T[]` - Filtered array of events

**Example:**
```typescript
const filtered = applyClientSideSearch(events, 'aspirin');
```

### `validateFilterCombination(filters)`

**Parameters:**
- `filters: EventFilters` - Filter object to validate

**Returns:** `{ valid: boolean; error?: string }`

**Example:**
```typescript
const validation = validateFilterCombination(filters);
if (!validation.valid) {
  console.error(validation.error);
}
```

### `getRequiredIndexConfig(filters)`

**Parameters:**
- `filters: EventFilters` - Filter object

**Returns:** Index configuration object

**Example:**
```typescript
const config = getRequiredIndexConfig(filters);
console.log(JSON.stringify(config, null, 2));
```

### `formatFilterSummary(filters, patientName)`

**Parameters:**
- `filters: EventFilters` - Active filters
- `patientName: string | undefined` - Name of selected patient

**Returns:** `string` - Human-readable filter summary

**Example:**
```typescript
const summary = formatFilterSummary(filters, 'John Doe');
// Returns: "Paciente: John Doe • Tipo: Creados • Fecha: 1 ene - 31 ene"
```

## Best Practices

1. **Always provide caregiverId** - It's required for all queries
2. **Use appropriate result limits** - Don't fetch more than needed
3. **Combine server and client filtering** - Use Firestore for heavy lifting, client for search
4. **Clean up listeners** - Always return cleanup function from useEffect
5. **Handle errors gracefully** - Provide user-friendly error messages
6. **Log filter values** - Helps with debugging query issues
7. **Deploy indexes** - Required for production use
8. **Test all filter combinations** - Ensure indexes support all cases

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify Firestore indexes are deployed
3. Review filter values being passed
4. Check Firebase Console for query execution
5. Refer to implementation summary document

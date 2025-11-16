# EventFilterControls Quick Reference

## Component Import

```typescript
import { EventFilterControls, EventFilters } from '../../src/components/caregiver/EventFilterControls';
```

## Basic Usage

```typescript
const [filters, setFilters] = useState<EventFilters>({});
const [patients, setPatients] = useState<Patient[]>([]);

<EventFilterControls
  filters={filters}
  onFiltersChange={setFilters}
  patients={patients.map(p => ({ id: p.id, name: p.name }))}
/>
```

## EventFilters Interface

```typescript
interface EventFilters {
  patientId?: string;           // Selected patient ID
  eventType?: MedicationEventType; // 'created' | 'updated' | 'deleted'
  dateRange?: {
    start: Date;                // Start date
    end: Date;                  // End date
  };
  searchQuery?: string;         // Search text
}
```

## Filter Application

### Firestore Query Filters

```typescript
// Build query with filters
const constraints: any[] = [
  where('caregiverId', '==', user.id),
];

if (filters.patientId) {
  constraints.push(where('patientId', '==', filters.patientId));
}

if (filters.eventType) {
  constraints.push(where('eventType', '==', filters.eventType));
}

if (filters.dateRange) {
  constraints.push(
    where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start)),
    where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end))
  );
}

const eventsQuery = query(collection(db, 'medicationEvents'), ...constraints);
```

### Client-Side Search Filter

```typescript
const filteredEvents = useMemo(() => {
  if (!filters.searchQuery) return allEvents;
  
  const searchLower = filters.searchQuery.toLowerCase();
  return allEvents.filter(event =>
    event.medicationName.toLowerCase().includes(searchLower)
  );
}, [allEvents, filters.searchQuery]);
```

## Filter Persistence

### Storage Key
```typescript
const FILTERS_STORAGE_KEY = '@medication_event_filters';
```

### Automatic Persistence
- **Load**: On component mount
- **Save**: On every filter change
- **Format**: JSON string with Date serialization

### Manual Clear
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear saved filters
await AsyncStorage.removeItem('@medication_event_filters');
```

## Date Range Presets

| Preset | Description | Calculation |
|--------|-------------|-------------|
| `'today'` | Current day | Start of today to now |
| `'week'` | Last 7 days | 7 days ago to now |
| `'month'` | Current month | 1st of month to now |
| `'all'` | No filter | Clears date range |

## Event Types

| Type | Label | Icon | Color |
|------|-------|------|-------|
| `'created'` | Creados | ➕ | Green |
| `'updated'` | Actualizados | ✏️ | Blue |
| `'deleted'` | Eliminados | 🗑️ | Red |

## Component Props

```typescript
interface EventFilterControlsProps {
  filters: EventFilters;                          // Current filter state
  onFiltersChange: (filters: EventFilters) => void; // Filter change handler
  patients: Array<{ id: string; name: string }>; // Patient list for dropdown
}
```

## Filter States

### Empty State (No Filters)
```typescript
filters = {}
```

### With Search Only
```typescript
filters = {
  searchQuery: "aspirin"
}
```

### With Patient Filter
```typescript
filters = {
  patientId: "patient-123"
}
```

### With Event Type Filter
```typescript
filters = {
  eventType: "created"
}
```

### With Date Range
```typescript
filters = {
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
}
```

### Multiple Filters
```typescript
filters = {
  patientId: "patient-123",
  eventType: "created",
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  searchQuery: "aspirin"
}
```

## Clear Filters

```typescript
// Clear all filters
onFiltersChange({});

// Clear specific filter
onFiltersChange({ ...filters, patientId: undefined });
```

## Styling

### Active Filter Chip
```typescript
{
  backgroundColor: colors.primary[50],
  borderColor: colors.primary[500],
}
```

### Inactive Filter Chip
```typescript
{
  backgroundColor: colors.surface,
  borderColor: colors.gray[300],
}
```

### Clear Button
```typescript
{
  backgroundColor: colors.error[50],
  borderColor: colors.error[500],
}
```

## Common Patterns

### Check if Filters Active
```typescript
const hasActiveFilters = !!(
  filters.patientId ||
  filters.eventType ||
  filters.dateRange ||
  filters.searchQuery
);
```

### Get Filter Count
```typescript
const filterCount = [
  filters.patientId,
  filters.eventType,
  filters.dateRange,
  filters.searchQuery,
].filter(Boolean).length;
```

### Reset Specific Filter
```typescript
// Reset patient filter
onFiltersChange({ ...filters, patientId: undefined });

// Reset date range
onFiltersChange({ ...filters, dateRange: undefined });

// Reset search
onFiltersChange({ ...filters, searchQuery: undefined });
```

## Integration with FlatList

```typescript
<FlatList
  data={filteredEvents}
  renderItem={renderEventItem}
  keyExtractor={(item) => item.id}
  ListHeaderComponent={
    <EventFilterControls
      filters={filters}
      onFiltersChange={handleFiltersChange}
      patients={patients.map(p => ({ id: p.id, name: p.name }))}
    />
  }
  contentContainerStyle={{ padding: spacing.lg }}
/>
```

## Performance Tips

1. **Memoize Handler**: Use `useCallback` for `onFiltersChange`
2. **Memoize Patients**: Only map patient data when it changes
3. **Debounce Search**: Already handled internally
4. **Lazy Load**: Component handles modal rendering efficiently

## Accessibility

- All interactive elements have 44x44pt touch targets
- Icons provide visual context
- Placeholders describe expected input
- Active states clearly indicated
- Screen reader compatible

## Troubleshooting

### Filters Not Saving
```typescript
// Check AsyncStorage permissions
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test storage
await AsyncStorage.setItem('test', 'value');
const value = await AsyncStorage.getItem('test');
console.log('Storage works:', value === 'value');
```

### Filters Not Loading
```typescript
// Check for saved filters
const saved = await AsyncStorage.getItem('@medication_event_filters');
console.log('Saved filters:', saved);
```

### Date Serialization Issues
```typescript
// Dates are automatically converted to/from strings
// Component handles this internally
// No action needed
```

## Best Practices

1. ✅ Always provide patient list (even if empty)
2. ✅ Use memoized callbacks for handlers
3. ✅ Let component handle persistence
4. ✅ Clear storage on logout
5. ✅ Test with multiple patients
6. ✅ Verify Firestore indexes for queries
7. ✅ Handle loading states in parent
8. ✅ Show filter count badge (optional)

## Example Implementation

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { EventFilterControls, EventFilters } from '../../src/components/caregiver/EventFilterControls';

export default function EventsScreen() {
  const [filters, setFilters] = useState<EventFilters>({});
  const [events, setEvents] = useState<MedicationEvent[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Memoized handler
  const handleFiltersChange = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
  }, []);

  // Memoized patient list
  const patientList = useMemo(() => 
    patients.map(p => ({ id: p.id, name: p.name })),
    [patients]
  );

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = events;

    // Client-side search
    if (filters.searchQuery) {
      const search = filters.searchQuery.toLowerCase();
      result = result.filter(e => 
        e.medicationName.toLowerCase().includes(search)
      );
    }

    return result;
  }, [events, filters.searchQuery]);

  return (
    <FlatList
      data={filteredEvents}
      ListHeaderComponent={
        <EventFilterControls
          filters={filters}
          onFiltersChange={handleFiltersChange}
          patients={patientList}
        />
      }
    />
  );
}
```

## Summary

The EventFilterControls component provides:
- ✅ Search by medication name
- ✅ Filter by patient
- ✅ Filter by event type
- ✅ Filter by date range
- ✅ Persistent state
- ✅ Clear all filters
- ✅ Responsive design
- ✅ Accessible interface
- ✅ Design system compliant

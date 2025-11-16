# Events Registry - Quick Reference

## Overview

The Events Registry is a unified interface for viewing all medication-related events with real-time updates, comprehensive filtering, and search capabilities.

## Key Files

### Main Screen
- `app/caregiver/events.tsx` - Events Registry screen

### Components
- `src/components/caregiver/MedicationEventCard.tsx` - Individual event card
- `src/components/caregiver/EventFilterControls.tsx` - Filter UI
- `src/components/caregiver/EventTypeBadge.tsx` - Event type badges

### Detail Screen
- `app/caregiver/events/[id].tsx` - Event detail view

## Features

### Event Types
- **created** - Medication creation (green icon)
- **updated** - Medication modification (blue icon)
- **deleted** - Medication deletion (red icon)

### Filters
- **Patient** - Filter by specific patient
- **Event Type** - Filter by event type
- **Date Range** - Today, Last 7 days, This month, All time
- **Search** - Real-time search by medication name

### Real-time Updates
- Firestore onSnapshot listener
- Automatic updates when events occur
- No manual refresh needed

### Performance
- FlatList virtualization
- Optimized rendering
- Filter persistence

## Usage

### View All Events
```typescript
// Events automatically load on screen mount
// Pull down to refresh manually
```

### Filter by Patient
```typescript
// Tap patient filter chip
// Select patient from modal
// Events update automatically
```

### Search for Medication
```typescript
// Type in search box
// Results filter in real-time
// Tap × to clear
```

### View Event Details
```typescript
// Tap any event card
// Navigate to detail screen
router.push({
  pathname: '/caregiver/events/[id]',
  params: { id: event.id }
});
```

## Data Structure

### MedicationEvent
```typescript
interface MedicationEvent {
  id: string;
  eventType: 'created' | 'updated' | 'deleted';
  medicationId: string;
  medicationName: string;
  medicationData?: Partial<Medication>;
  patientId: string;
  patientName: string;
  caregiverId?: string;
  timestamp: string | Timestamp;
  syncStatus: 'pending' | 'synced' | 'failed';
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

### EventFilters
```typescript
interface EventFilters {
  patientId?: string;
  eventType?: MedicationEventType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}
```

## Firestore Query

### Base Query
```typescript
query(
  collection(db, 'medicationEvents'),
  where('caregiverId', '==', user.id),
  orderBy('timestamp', 'desc'),
  limit(20)
)
```

### With Filters
```typescript
// Add patient filter
where('patientId', '==', filters.patientId)

// Add event type filter
where('eventType', '==', filters.eventType)

// Add date range filter
where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start))
where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end))
```

### Client-side Search
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

### Save Filters
```typescript
await AsyncStorage.setItem(
  '@medication_event_filters',
  JSON.stringify(filters)
);
```

### Load Filters
```typescript
const savedFilters = await AsyncStorage.getItem('@medication_event_filters');
if (savedFilters) {
  const parsed = JSON.parse(savedFilters);
  // Convert date strings back to Date objects
  if (parsed.dateRange) {
    parsed.dateRange = {
      start: new Date(parsed.dateRange.start),
      end: new Date(parsed.dateRange.end),
    };
  }
  setFilters(parsed);
}
```

## Performance Optimizations

### FlatList Configuration
```typescript
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: 120,
    offset: 120 * index,
    index,
  })}
/>
```

### Memoization
```typescript
// Memoize filtered events
const filteredEvents = useMemo(() => {
  // Filter logic
}, [allEvents, filters.searchQuery]);

// Memoize event handlers
const handleEventPress = useCallback((event: MedicationEvent) => {
  router.push({
    pathname: '/caregiver/events/[id]',
    params: { id: event.id }
  });
}, [router]);

// Memoize render function
const renderEventItem = useCallback(({ item }: { item: MedicationEvent }) => (
  <MedicationEventCard
    event={item}
    onPress={() => handleEventPress(item)}
  />
), [handleEventPress]);
```

## Error Handling

### Loading State
```typescript
if (loading) {
  return <ListSkeleton count={5} ItemSkeleton={EventCardSkeleton} />;
}
```

### Error State
```typescript
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.error[500]} />
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorMessage}>{error}</Text>
    </View>
  );
}
```

### Empty State
```typescript
const renderEmptyState = () => (
  <View style={styles.emptyState}>
    <Ionicons name="notifications-off-outline" size={64} color={colors.gray[400]} />
    <Text style={styles.emptyTitle}>No hay eventos</Text>
    <Text style={styles.emptySubtitle}>
      Los cambios de medicamentos de tus pacientes aparecerán aquí
    </Text>
  </View>
);
```

## Accessibility

### Event Card
```typescript
<Card
  accessibilityLabel={`${event.patientName} ${eventTypeText.toLowerCase()} ${event.medicationName}, ${relativeTime}`}
  accessibilityHint="Toca para ver detalles del evento"
>
```

### Filter Controls
```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Filtrar por paciente"
  accessibilityHint="Abre el selector de pacientes"
>
```

## Common Tasks

### Add New Event Type
1. Update `MedicationEventType` in types
2. Add icon and color in `getEventTypeIcon()`
3. Add label in `getEventTypeText()`
4. Add to filter modal options

### Customize Event Card
1. Edit `MedicationEventCard.tsx`
2. Update styles
3. Add new fields from event data

### Add New Filter
1. Add to `EventFilters` interface
2. Add UI control in `EventFilterControls.tsx`
3. Add Firestore query logic in `events.tsx`
4. Update persistence logic

### Change Date Range Presets
1. Edit `handleDateRangeSelect()` in `EventFilterControls.tsx`
2. Add new preset case
3. Add modal option

## Troubleshooting

### Events Not Loading
- Check Firestore connection
- Verify user authentication
- Check caregiverId in query
- Review Firestore security rules

### Filters Not Working
- Check Firestore indexes
- Verify filter state updates
- Check query constraints
- Review console for errors

### Search Not Working
- Verify searchQuery in filters
- Check useMemo dependencies
- Ensure medication names are strings
- Review toLowerCase() calls

### Performance Issues
- Check FlatList configuration
- Verify getItemLayout
- Review memoization
- Check for unnecessary re-renders

## Testing

### Run Verification Test
```bash
node test-events-consolidation.js
```

### Run Filter Test
```bash
node test-event-filtering.js
```

## Requirements Met

- ✅ Requirement 3.1: Consolidate reports and audit
- ✅ Requirement 3.2: Unified event display
- ✅ Requirement 3.3: Dynamic Firestore queries
- ✅ Requirement 3.4: Comprehensive filtering
- ✅ Requirement 8.2: Real-time updates
- ✅ Requirement 14.1: Performance optimization

## Related Tasks

- Task 10: Event detail view
- Task 11: Medications management
- Task 14: Error handling
- Task 15: Performance optimizations

## Resources

- [Firestore Queries Documentation](https://firebase.google.com/docs/firestore/query-data/queries)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

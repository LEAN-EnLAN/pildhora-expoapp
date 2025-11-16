# Event Registry UI - Quick Reference

## 🚀 Quick Start

### Import and Use

```typescript
// The events screen is automatically available at:
// Route: /caregiver/events

// Navigation from other screens:
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/caregiver/events');
```

---

## 📦 Key Components

### 1. Events Screen
**File:** `app/caregiver/events.tsx`

```typescript
// Main screen component - no props needed
export default function MedicationEventRegistry() {
  // Automatically handles:
  // - Real-time Firestore listener
  // - Filter state management
  // - Loading/error/empty states
  // - Pull-to-refresh
  // - Navigation
}
```

### 2. MedicationEventCard
**File:** `src/components/caregiver/MedicationEventCard.tsx`

```typescript
import { MedicationEventCard } from '@/components/caregiver/MedicationEventCard';

<MedicationEventCard
  event={medicationEvent}
  onPress={() => handlePress(event)}
/>
```

**Props:**
- `event: MedicationEvent` - The event data
- `onPress: () => void` - Press handler

### 3. EventFilterControls
**File:** `src/components/caregiver/EventFilterControls.tsx`

```typescript
import { EventFilterControls } from '@/components/caregiver/EventFilterControls';

<EventFilterControls
  filters={filters}
  onFiltersChange={handleFiltersChange}
  patients={patientsList}
/>
```

**Props:**
- `filters: EventFilters` - Current filter state
- `onFiltersChange: (filters: EventFilters) => void` - Filter change handler
- `patients: Array<{ id: string; name: string }>` - Patient list

---

## 🔧 Data Types

### MedicationEvent

```typescript
interface MedicationEvent {
  id: string;
  eventType: 'created' | 'updated' | 'deleted';
  medicationId: string;
  medicationName: string;
  medicationData: Partial<Medication>;
  patientId: string;
  patientName: string;
  caregiverId: string;
  timestamp: Date | string;
  syncStatus: 'pending' | 'delivered' | 'failed';
  changes?: MedicationEventChange[];
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

---

## 🎯 Common Tasks

### 1. Navigate to Events Screen

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/caregiver/events');
```

### 2. Navigate to Event Detail

```typescript
router.push({
  pathname: '/caregiver/events/[id]',
  params: { id: eventId }
});
```

### 3. Create a New Event

```typescript
import { medicationEventService } from '@/services/medicationEventService';

await medicationEventService.enqueue({
  eventType: 'created',
  medicationId: medication.id,
  medicationName: medication.name,
  medicationData: medication,
  patientId: patient.id,
  patientName: patient.name,
  caregiverId: caregiver.id,
  syncStatus: 'pending',
});
```

### 4. Filter Events

```typescript
// Set filters programmatically
setFilters({
  patientId: 'patient-123',
  eventType: 'created',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date(),
  },
  searchQuery: 'aspirin',
});
```

### 5. Clear All Filters

```typescript
setFilters({});
```

---

## 🔍 Firestore Queries

### Basic Query (All Events for Caregiver)

```typescript
const eventsQuery = query(
  collection(db, 'medicationEvents'),
  where('caregiverId', '==', caregiverId),
  orderBy('timestamp', 'desc'),
  limit(20)
);
```

### With Patient Filter

```typescript
const eventsQuery = query(
  collection(db, 'medicationEvents'),
  where('caregiverId', '==', caregiverId),
  where('patientId', '==', patientId),
  orderBy('timestamp', 'desc'),
  limit(20)
);
```

### With Event Type Filter

```typescript
const eventsQuery = query(
  collection(db, 'medicationEvents'),
  where('caregiverId', '==', caregiverId),
  where('eventType', '==', 'created'),
  orderBy('timestamp', 'desc'),
  limit(20)
);
```

### With Date Range Filter

```typescript
const eventsQuery = query(
  collection(db, 'medicationEvents'),
  where('caregiverId', '==', caregiverId),
  where('timestamp', '>=', Timestamp.fromDate(startDate)),
  where('timestamp', '<=', Timestamp.fromDate(endDate)),
  orderBy('timestamp', 'desc'),
  limit(20)
);
```

---

## 🎨 Styling

### Event Type Colors

```typescript
// Created events
backgroundColor: '#E6F7ED'
iconColor: colors.success

// Updated events
backgroundColor: colors.primary[50]
iconColor: colors.primary[500]

// Deleted events
backgroundColor: colors.error[50]
iconColor: colors.error[500]
```

### Filter Chip States

```typescript
// Inactive
backgroundColor: colors.surface
borderColor: colors.gray[300]
textColor: colors.gray[700]

// Active
backgroundColor: colors.primary[50]
borderColor: colors.primary[500]
textColor: colors.primary[500]
```

---

## ⚡ Performance Tips

### 1. FlatList Optimization

```typescript
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 2. Memoize Render Functions

```typescript
const renderEventItem = useCallback(({ item }) => (
  <MedicationEventCard event={item} onPress={() => handlePress(item)} />
), [handlePress]);
```

### 3. Memoize Filtered Data

```typescript
const filteredEvents = useMemo(() => {
  return events.filter(event => 
    event.medicationName.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [events, searchQuery]);
```

---

## 🐛 Debugging

### Check Firestore Listener

```typescript
console.log('[Events] Setting up listener for caregiver:', caregiverId);
console.log('[Events] Filters:', filters);
console.log('[Events] Query constraints:', constraints);
```

### Monitor Event Updates

```typescript
onSnapshot(eventsQuery, (snapshot) => {
  console.log('[Events] Received', snapshot.size, 'events');
  snapshot.docChanges().forEach(change => {
    console.log('[Events] Change type:', change.type);
    console.log('[Events] Event:', change.doc.data());
  });
});
```

### Check Filter State

```typescript
console.log('[Events] Current filters:', filters);
console.log('[Events] Filtered events count:', filteredEvents.length);
```

---

## 🧪 Testing

### Test Event Card Rendering

```typescript
import { render } from '@testing-library/react-native';
import { MedicationEventCard } from '@/components/caregiver/MedicationEventCard';

const mockEvent = {
  id: 'evt-123',
  eventType: 'created',
  medicationName: 'Aspirin',
  patientName: 'John Doe',
  timestamp: new Date().toISOString(),
  // ... other fields
};

const { getByText } = render(
  <MedicationEventCard event={mockEvent} onPress={jest.fn()} />
);

expect(getByText('Aspirin')).toBeTruthy();
expect(getByText('John Doe')).toBeTruthy();
```

### Test Filter Changes

```typescript
const { getByPlaceholderText } = render(<EventFilterControls {...props} />);
const searchInput = getByPlaceholderText('Buscar por medicamento...');

fireEvent.changeText(searchInput, 'aspirin');
expect(onFiltersChange).toHaveBeenCalledWith({
  searchQuery: 'aspirin'
});
```

---

## 📚 Related Documentation

- **Design Document:** `.kiro/specs/caregiver-dashboard-redesign/design.md`
- **Requirements:** `.kiro/specs/caregiver-dashboard-redesign/requirements.md`
- **Implementation Summary:** `.kiro/specs/caregiver-dashboard-redesign/TASK9.1_IMPLEMENTATION_SUMMARY.md`
- **Visual Guide:** `.kiro/specs/caregiver-dashboard-redesign/EVENT_REGISTRY_UI_VISUAL_GUIDE.md`

---

## 🔗 Related Components

- **EventTypeBadge:** `src/components/caregiver/EventTypeBadge.tsx`
- **LastMedicationStatusCard:** `src/components/caregiver/LastMedicationStatusCard.tsx`
- **MedicationEventService:** `src/services/medicationEventService.ts`
- **Date Utils:** `src/utils/dateUtils.ts`

---

## 💡 Pro Tips

1. **Real-time Updates:** The onSnapshot listener automatically updates the UI when events change in Firestore
2. **Filter Persistence:** Filters are saved to AsyncStorage and restored on app restart
3. **Performance:** FlatList virtualization ensures smooth scrolling even with hundreds of events
4. **Search:** Client-side search is instant and doesn't require additional Firestore queries
5. **Pull-to-Refresh:** Works seamlessly with the real-time listener for manual refresh option

---

## ⚠️ Common Issues

### Issue: Events not loading
**Solution:** Check that user is authenticated and has caregiverId

### Issue: Filters not working
**Solution:** Verify Firestore indexes are created for compound queries

### Issue: Slow scrolling
**Solution:** Ensure FlatList optimization props are set correctly

### Issue: Listener not cleaning up
**Solution:** Verify useEffect return function calls unsubscribe()

---

## 📞 Support

For questions or issues:
1. Check the implementation summary document
2. Review the visual guide for UI details
3. Consult the design document for architecture
4. Check Firestore console for data structure

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅

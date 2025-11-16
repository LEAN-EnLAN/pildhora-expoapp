# Medication CRUD Operations - Quick Reference Guide

## Overview

This guide provides quick reference information for working with caregiver medication CRUD operations and event generation.

## File Locations

```
app/caregiver/medications/[patientId]/
├── index.tsx          # List medications
├── add.tsx            # Add new medication
└── [id].tsx           # View/Edit/Delete medication

src/services/
└── medicationEventService.ts  # Event generation and sync

src/store/slices/
└── medicationsSlice.ts        # Redux actions
```

## Quick Start

### Adding a Medication

```typescript
// 1. Fetch patient name
const [patientName, setPatientName] = useState<string>('');

useEffect(() => {
  const loadPatientName = async () => {
    const patient = await getPatientById(patientId);
    if (patient) setPatientName(patient.name);
  };
  loadPatientName();
}, [patientId]);

// 2. Save medication
const result = await dispatch(addMedication(medicationData)).unwrap();

// 3. Generate event
await createAndEnqueueEvent(
  { ...result, caregiverId: user.id } as Medication,
  patientName,
  'created'
);
```

### Updating a Medication

```typescript
// 1. Build updates object
const updates: Partial<Medication> = {
  name: newName,
  doseValue: newDoseValue,
  // ... other changed fields
};

// 2. Update medication
await dispatch(updateMedication({ id: medicationId, updates })).unwrap();

// 3. Generate event with change tracking
const updatedMedication = { ...medication, ...updates, caregiverId: user.id };
await createAndEnqueueEvent(
  { ...medication, caregiverId: user.id } as Medication,
  patientName,
  'updated',
  updatedMedication
);
```

### Deleting a Medication

```typescript
// 1. Show confirmation
Alert.alert(
  'Eliminar medicamento',
  `¿Estás seguro de que deseas eliminar "${medication.name}"?`,
  [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: async () => {
        // 2. Generate event BEFORE deletion
        await createAndEnqueueEvent(
          { ...medication, caregiverId: user.id } as Medication,
          patientName,
          'deleted'
        );
        
        // 3. Delete medication
        await dispatch(deleteMedication(medication.id)).unwrap();
      }
    }
  ]
);
```

## Event Types

| Event Type | When Generated | Change Tracking |
|------------|----------------|-----------------|
| `created` | New medication added | No |
| `updated` | Medication modified | Yes |
| `deleted` | Medication removed | No |

## Event Data Structure

```typescript
{
  id: "evt_1234567890_abc123",
  eventType: "created" | "updated" | "deleted",
  medicationId: "med_xyz789",
  medicationName: "Aspirin",
  medicationData: { /* full medication object */ },
  patientId: "patient_123",
  patientName: "John Doe",
  caregiverId: "caregiver_456",
  timestamp: "2024-01-15T10:30:00.000Z",
  syncStatus: "pending" | "delivered" | "failed",
  changes: [ // Only for 'updated' events
    {
      field: "doseValue",
      oldValue: "500",
      newValue: "1000"
    }
  ]
}
```

## Change Tracking

### Tracked Fields

- `name` - Medication name
- `doseValue` - Dose amount
- `doseUnit` - Dose unit (mg, ml, etc.)
- `quantityType` - Form factor (tablet, capsule, etc.)
- `frequency` - Days of week
- `times` - Time of day
- `emoji` - Visual icon
- `trackInventory` - Inventory tracking enabled
- `currentQuantity` - Current stock
- `lowQuantityThreshold` - Low stock threshold

### Change Object

```typescript
interface MedicationEventChange {
  field: string;      // Field name
  oldValue: any;      // Previous value
  newValue: any;      // New value
}
```

## Event Synchronization

### Sync Triggers

1. **Immediate**: After event enqueue
2. **Background**: Every 5 minutes
3. **Foreground**: When app becomes active
4. **Manual**: Via `syncPendingEvents()`

### Sync Status

- `pending` - Waiting to sync
- `delivered` - Successfully synced
- `failed` - Sync failed (will retry)

### Checking Sync Status

```typescript
import { medicationEventService } from '@/services/medicationEventService';

// Get pending count
const pendingCount = await medicationEventService.getPendingCount();

// Check if sync in progress
const isSyncing = medicationEventService.isSyncInProgress();

// Get last sync time
const lastSync = medicationEventService.getLastSyncAttempt();

// Subscribe to sync completion
const unsubscribe = medicationEventService.onSyncComplete(() => {
  console.log('Sync completed!');
});
```

## Error Handling

### Best Practices

```typescript
try {
  // 1. Perform medication operation
  await dispatch(addMedication(data)).unwrap();
  
  // 2. Generate event (non-blocking)
  try {
    await createAndEnqueueEvent(medication, patientName, 'created');
  } catch (eventError) {
    // Log but don't fail the operation
    console.error('Event generation failed:', eventError);
  }
  
  // 3. Show success to user
  Alert.alert('Éxito', 'Medicamento agregado correctamente');
  
} catch (error) {
  // Handle medication operation failure
  Alert.alert('Error', 'No se pudo guardar el medicamento');
}
```

### Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Patient not found | Log error, skip event |
| Event generation fails | Log error, operation succeeds |
| Event sync fails | Queue for retry |
| Network unavailable | Queue for later sync |
| Firestore unavailable | Queue for later sync |

## Common Patterns

### Pattern 1: Fetch Patient Name

```typescript
const [patientName, setPatientName] = useState<string>('');

useEffect(() => {
  const loadPatientName = async () => {
    if (patientId) {
      try {
        const patient = await getPatientById(patientId);
        if (patient) setPatientName(patient.name);
      } catch (err) {
        console.error('Error loading patient:', err);
      }
    }
  };
  loadPatientName();
}, [patientId]);
```

### Pattern 2: Generate Event After Operation

```typescript
// Always generate event AFTER successful operation
const result = await dispatch(addMedication(data)).unwrap();

// Then generate event (non-blocking)
if (patientName && result.id) {
  try {
    await createAndEnqueueEvent(
      { ...result, caregiverId: user.id } as Medication,
      patientName,
      'created'
    );
  } catch (eventError) {
    console.error('Event generation failed:', eventError);
  }
}
```

### Pattern 3: Generate Event Before Deletion

```typescript
// Generate event BEFORE deletion to capture data
await createAndEnqueueEvent(
  { ...medication, caregiverId: user.id } as Medication,
  patientName,
  'deleted'
);

// Then delete
await dispatch(deleteMedication(medication.id)).unwrap();
```

## Testing

### Manual Test Checklist

- [ ] Add medication → Check event in registry
- [ ] Edit medication → Check update event with changes
- [ ] Delete medication → Check delete event
- [ ] Offline add → Check event syncs when online
- [ ] Multiple patients → Check patient name in events
- [ ] Event queue → Check pending events persist

### Test Event Generation

```typescript
// Test creating an event
const testEvent = {
  eventType: 'created' as const,
  medicationId: 'test_123',
  medicationName: 'Test Med',
  medicationData: testMedication,
  patientId: 'patient_123',
  patientName: 'Test Patient',
  caregiverId: 'caregiver_123',
  syncStatus: 'pending' as const,
};

await medicationEventService.enqueue(testEvent);

// Check queue
const pending = await medicationEventService.getPendingCount();
console.log('Pending events:', pending);

// Trigger sync
await medicationEventService.syncPendingEvents();
```

## Debugging

### Enable Logging

```typescript
// In medicationEventService.ts, logs are already enabled
// Check console for:
// - [MedicationEventService] Enqueued event: ...
// - [MedicationEventService] Syncing X pending events
// - [MedicationEventService] Successfully synced event: ...
```

### Check Event Queue

```typescript
// Get all events in queue
const allEvents = await medicationEventService.getAllEvents();
console.log('Queue:', allEvents);

// Clear queue (for testing only)
await medicationEventService.clearQueue();
```

### Inspect AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check event queue
const queue = await AsyncStorage.getItem('@medication_event_queue');
console.log('Queue:', JSON.parse(queue || '[]'));

// Check last sync
const lastSync = await AsyncStorage.getItem('@medication_event_last_sync');
console.log('Last sync:', lastSync);
```

## Performance Tips

1. **Batch Operations**: Group multiple medication changes when possible
2. **Lazy Loading**: Load patient name only when needed
3. **Debounce Sync**: Don't trigger sync too frequently
4. **Queue Monitoring**: Monitor queue size and clear old events
5. **Error Logging**: Log errors but don't block operations

## Security Notes

1. **Caregiver ID**: Always set on medications and events
2. **Patient ID**: Validate before operations
3. **Event Data**: Full medication snapshot for audit trail
4. **Firestore Rules**: Enforce permissions on server side
5. **Sensitive Data**: Don't log PII to console

## Related Documentation

- [Task 11.1 Implementation Summary](./TASK11.1_IMPLEMENTATION_SUMMARY.md)
- [Medication Event Service Guide](../../src/services/MEDICATION_EVENT_SERVICE_GUIDE.md)
- [Event Queue Architecture](../../.kiro/specs/medication-management-redesign/EVENT_QUEUE_ARCHITECTURE.md)

## Support

For issues or questions:
1. Check console logs for errors
2. Verify patient name is loaded
3. Check event queue status
4. Review Firestore security rules
5. Test with network disabled/enabled

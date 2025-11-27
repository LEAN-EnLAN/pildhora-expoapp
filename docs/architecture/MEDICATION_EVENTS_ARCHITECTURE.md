# Medication Events Architecture

## Overview

The medication events system tracks all changes to medications (create, update, delete) and makes them visible to caregivers in the Events Registry screen.

## Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Medication CRUD Operation                    │
│                  (Create, Update, or Delete)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              medicationsSlice.ts (Redux Thunk)                   │
│  • Saves medication to Firestore                                │
│  • Checks if caregiverId exists                                 │
│  • Checks if user.name exists                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────┴────────┐
                    │  Has caregiverId │
                    │  AND user.name?  │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │ YES                     │ NO
                ▼                         ▼
┌───────────────────────────┐   ┌──────────────────┐
│  createAndEnqueueEvent()  │   │  No event created│
│  medicationEventService   │   │  (Silent skip)   │
└───────────┬───────────────┘   └──────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Event Queue (AsyncStorage)                          │
│  • Event stored locally with status: 'pending'                  │
│  • Includes all medication data + patient name                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Sync Process (Background + Foreground)              │
│  • Runs every 5 minutes (background)                            │
│  • Runs when app comes to foreground                            │
│  • Runs immediately after event creation                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────┴────────┐
                    │  Check Autonomous│
                    │  Mode Status     │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │ Disabled                │ Enabled
                ▼                         ▼
┌───────────────────────────┐   ┌──────────────────────┐
│  Sync to Firestore        │   │  Mark as 'delivered' │
│  medicationEvents         │   │  (Don't sync)        │
│  collection               │   │  (Caregiver can't    │
│                           │   │   see it)            │
└───────────┬───────────────┘   └──────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Firestore: medicationEvents Collection              │
│  • Event stored with status: 'delivered'                        │
│  • Indexed by caregiverId and patientId                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Caregiver Events Screen Query                       │
│  • Queries events where caregiverId == currentUser.id           │
│  • Filters by linked patient IDs                                │
│  • Applies date range and event type filters                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Events Displayed to Caregiver                       │
│  • Shows medication changes for all linked patients             │
│  • Real-time updates via pull-to-refresh                        │
└─────────────────────────────────────────────────────────────────┘
```

## Critical Requirements for Events to Work

### 1. Medication Must Have `caregiverId`

**Where it's set**:
- `src/store/slices/medicationsSlice.ts` - `addMedication` thunk
- `app/caregiver/medications/[patientId]/add.tsx` - Caregiver add screen

**Code**:
```typescript
const medicationData = {
  // ... other fields
  patientId: pid,
  caregiverId: user.id, // ← REQUIRED for events
};
```

**Why it's required**:
```typescript
// In medicationsSlice.ts
if (savedMedication.caregiverId && user?.name) {
  await createAndEnqueueEvent(/* ... */);
}
```

### 2. User Must Have `name` Field

**Where it's used**:
- Event generation requires `user.name` to populate `patientName` field
- This is displayed in the event card

**Code**:
```typescript
await createAndEnqueueEvent(
  savedMedication as Medication,
  user.name, // ← REQUIRED
  'created'
);
```

### 3. Autonomous Mode Must Be Disabled

**Where it's checked**:
- `src/services/medicationEventService.ts` - `syncPendingEvents` method

**Code**:
```typescript
const isAutonomous = await isAutonomousModeEnabled(event.patientId);

if (isAutonomous) {
  // Event is marked as delivered but NOT synced to Firestore
  event.syncStatus = 'delivered';
  continue;
}
```

**Why**: Autonomous mode allows patients to use the app without sharing data with caregivers.

### 4. Device Link Must Be Active

**Where it's checked**:
- `app/caregiver/events.tsx` - Event query building

**Code**:
```typescript
const { patients } = useLinkedPatients({
  caregiverId: user?.id || null,
  enabled: !!user?.id,
});

// Only query events for linked patients
const query = buildEventQuery(
  db,
  user.id,
  filters,
  EVENTS_PER_PAGE,
  linkedPatientIds // ← REQUIRED
);
```

## Event Data Structure

```typescript
interface MedicationEvent {
  id: string;                    // Auto-generated
  eventType: 'created' | 'updated' | 'deleted';
  medicationId: string;          // Reference to medication
  medicationName: string;        // For display
  medicationData: Medication;    // Full medication snapshot
  patientId: string;             // Patient who owns the medication
  patientName: string;           // Patient display name
  caregiverId: string;           // Caregiver who should see this event
  timestamp: Date | Timestamp;   // When event occurred
  syncStatus: 'pending' | 'delivered' | 'failed';
  changes?: MedicationEventChange[]; // For 'updated' events
}
```

## Common Issues & Solutions

### Issue 1: Events Not Appearing for New Medications

**Symptom**: Caregiver doesn't see events for recently created medications

**Diagnosis**:
1. Check if medication has `caregiverId` field
2. Check if patient has autonomous mode enabled
3. Check if deviceLink is active

**Solution**:
- Add missing `caregiverId` to medications
- Disable autonomous mode
- Verify deviceLink status

### Issue 2: Old Medications Have No Events

**Symptom**: Medications created before event system have no "created" events

**Diagnosis**: Events are only created when medications are added/updated/deleted

**Solution**:
- Manually create "created" events for existing medications
- Or accept that old medications won't have creation events

### Issue 3: Events Created But Not Syncing

**Symptom**: Events exist in AsyncStorage but not in Firestore

**Diagnosis**:
1. Check network connectivity
2. Check if autonomous mode was enabled during sync
3. Check Firebase permissions

**Solution**:
- Ensure network is available
- Disable autonomous mode
- Verify Firestore security rules allow event creation

### Issue 4: Patient-Created Medications Have No Events

**Symptom**: When patient creates their own medication, no event appears

**Diagnosis**: Patient-created medications don't have `caregiverId` set

**Solution**:
- Enhance patient medication creation to check for linked caregiver
- Set `caregiverId` if caregiver exists
- This is a recommended enhancement (not yet implemented)

## Performance Considerations

### Event Queue

- Events are stored in AsyncStorage (local device storage)
- Queue persists across app restarts
- Background sync runs every 5 minutes
- Foreground sync runs when app becomes active

### Firestore Queries

- Events are indexed by `caregiverId` and `patientId`
- Queries are limited to 50 events per page
- SWR pattern provides instant rendering with cached data
- Pull-to-refresh triggers fresh data fetch

### Offline Support

- Events are created locally even when offline
- Sync happens automatically when connection is restored
- Cached events are displayed while offline
- Banner shows when displaying cached data

## Security

### Firestore Rules

Events are protected by security rules:

```javascript
// Only caregivers can read their own events
match /medicationEvents/{eventId} {
  allow read: if request.auth != null && 
    resource.data.caregiverId == request.auth.uid;
  
  // Events are created by the system (via Admin SDK or authenticated users)
  allow create: if request.auth != null;
}
```

### Autonomous Mode

- When enabled, events are created locally but not synced
- Provides privacy for patients who don't want caregiver monitoring
- Can be toggled on/off in patient settings

## Testing

### Manual Testing

1. Create a medication as caregiver
2. Verify event appears in Events screen
3. Update the medication
4. Verify update event appears
5. Delete the medication
6. Verify delete event appears

### Automated Testing

See test files:
- `test-medication-crud-operations.js`
- `test-caregiver-medications-management.js`
- `test-event-registry.js`

## Related Documentation

- `CAREGIVER_EVENTS_NOT_UPDATING_FIX.md` - Troubleshooting guide
- `QUICK_DIAGNOSIS_STEPS.md` - Quick diagnostic steps
- `src/services/EVENT_QUEUE_GUIDE.md` - Event queue implementation
- `src/services/MEDICATION_EVENT_SERVICE_GUIDE.md` - Service API reference

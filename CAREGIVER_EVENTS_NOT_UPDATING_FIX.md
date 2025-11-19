# Caregiver Events Not Updating - Root Cause & Fix

## Problem

Caregiver "Tomas" is not seeing new medication events for patient "Lean nashe" even though new medications have been created.

## Root Cause Analysis

After analyzing the code, there are **three conditions** that must be met for medication events to appear in the caregiver's event registry:

### 1. Medication Must Have `caregiverId` Field

In `src/store/slices/medicationsSlice.ts`, events are only created when the medication has a `caregiverId`:

```typescript
// Generate medication created event (non-blocking)
try {
  if (savedMedication.caregiverId && user?.name) {
    await createAndEnqueueEvent(
      savedMedication as Medication,
      user.name,
      'created'
    );
  }
} catch (eventError) {
  console.error('[MedicationsSlice] Failed to create medication event:', eventError);
}
```

**Issue**: If a patient creates their own medication (not through a caregiver), the `caregiverId` field will be missing, and no event will be created.

### 2. Patient Must NOT Have Autonomous Mode Enabled

In `src/services/medicationEventService.ts`, events are skipped if the patient has autonomous mode enabled:

```typescript
// Check if patient is in autonomous mode
const isAutonomous = await isAutonomousModeEnabled(event.patientId);

if (isAutonomous) {
  console.log('[MedicationEventService] Patient in autonomous mode, skipping event sync:', event.id);
  // Mark as delivered but don't sync to Firestore
  event.syncStatus = 'delivered';
  continue;
}
```

**Issue**: If Lean nashe has autonomous mode enabled, events will be created locally but never synced to Firestore, making them invisible to caregivers.

### 3. Events Query Must Include Patient in Linked Patients

In `app/caregiver/events.tsx`, the query only fetches events for linked patients:

```typescript
const query = buildEventQuery(
  db,
  user.id,
  {
    patientId: filters.patientId,
    eventType: filters.eventType,
    dateRange: filters.dateRange,
  },
  EVENTS_PER_PAGE,
  linkedPatientIds // Pass linked patient IDs
);
```

**Issue**: If the deviceLink between Tomas and Lean nashe is not properly set up, events won't be queried.

## Diagnostic Steps

### Step 1: Check Lean Nashe's Medications

Run this query in Firebase Console (Firestore):

```
Collection: medications
Where: patientId == "vtBGfPfbEhU6Z7njl1YsujrUexc2"
```

Check each medication for:
- ✓ Does it have a `caregiverId` field?
- ✓ Is the `caregiverId` set to Tomas's ID (`ZsoeNjnLOGgj1rNomcbJF7QSWTZ2`)?

### Step 2: Check Autonomous Mode Status

Run this query in Firebase Console (Firestore):

```
Collection: users
Document: vtBGfPfbEhU6Z7njl1YsujrUexc2
```

Check:
- ✓ Is `autonomousMode.enabled` set to `false` or missing?

### Step 3: Check Medication Events

Run this query in Firebase Console (Firestore):

```
Collection: medicationEvents
Where: patientId == "vtBGfPfbEhU6Z7njl1YsujrUexc2"
```

Check:
- ✓ Do events exist for the new medications?
- ✓ Do they have `caregiverId` set to Tomas's ID?
- ✓ Are the timestamps recent?

### Step 4: Check Device Links

Run this query in Firebase Console (Firestore):

```
Collection: deviceLinks
Where: patientId == "vtBGfPfbEhU6Z7njl1YsujrUexc2"
Where: userId == "ZsoeNjnLOGgj1rNomcbJF7QSWTZ2"
```

Check:
- ✓ Does an active deviceLink exist?
- ✓ Is `status` set to `"active"`?
- ✓ Is `role` set to `"caregiver"`?

## Solutions

### Solution 1: Fix Missing `caregiverId` on Medications

If medications are missing the `caregiverId` field, run the fix script:

```bash
node fix-lean-nashe-events.js
```

This script will:
1. Find all medications for Lean nashe
2. Set `caregiverId` to Tomas's ID if missing
3. Create missing "created" events
4. Verify events are visible to the caregiver

### Solution 2: Disable Autonomous Mode

If autonomous mode is enabled, disable it:

**Option A: Through the app**
1. Log in as Lean nashe (patient)
2. Go to Settings
3. Toggle "Autonomous Mode" to OFF

**Option B: Through Firebase Console**
1. Go to Firestore
2. Navigate to `users/vtBGfPfbEhU6Z7njl1YsujrUexc2`
3. Edit the document
4. Set `autonomousMode.enabled` to `false`

### Solution 3: Ensure Device Link is Active

If the deviceLink is missing or inactive:

```bash
# Check device links
node check-device-links.js

# Fix device links if needed
node fix-device-links.js
```

## Prevention

To prevent this issue in the future:

### 1. Always Set `caregiverId` When Creating Medications

The caregiver screens already do this correctly:

```typescript
const medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
  // ... other fields
  patientId: pid,
  caregiverId: user.id, // ✓ Always set when caregiver creates medication
};
```

### 2. Patient-Created Medications Should Link to Caregiver

When a patient creates their own medication, we should:

1. Check if they have a linked caregiver
2. If yes, set the `caregiverId` field
3. This ensures events are created and visible to the caregiver

**Recommended Enhancement** (not yet implemented):

```typescript
// In patient medication creation flow
const linkedCaregiver = await getLinkedCaregiver(patientId);

const medicationData = {
  // ... other fields
  patientId: patientId,
  caregiverId: linkedCaregiver?.id, // Set if caregiver exists
};
```

### 3. Monitor Autonomous Mode Status

Add a banner in the caregiver dashboard when a patient has autonomous mode enabled:

```typescript
if (patient.autonomousMode?.enabled) {
  return (
    <Banner type="warning">
      {patient.name} has autonomous mode enabled. 
      You won't see new medication events until they disable it.
    </Banner>
  );
}
```

## Testing Checklist

After applying fixes:

- [ ] Verify medications have `caregiverId` set
- [ ] Verify autonomous mode is disabled
- [ ] Verify deviceLink is active
- [ ] Create a new medication as caregiver
- [ ] Verify event appears in caregiver's event registry
- [ ] Create a new medication as patient (if applicable)
- [ ] Verify event appears in caregiver's event registry
- [ ] Update a medication
- [ ] Verify update event appears
- [ ] Delete a medication
- [ ] Verify delete event appears

## Related Files

- `src/store/slices/medicationsSlice.ts` - Medication CRUD with event creation
- `src/services/medicationEventService.ts` - Event queue and sync logic
- `app/caregiver/events.tsx` - Caregiver event registry screen
- `app/caregiver/medications/[patientId]/add.tsx` - Caregiver add medication
- `src/services/autonomousMode.ts` - Autonomous mode logic

## Summary

The most likely cause is that **medications are missing the `caregiverId` field**. This happens when:

1. Medications were created before the event system was implemented
2. Medications were created by the patient themselves
3. There was an error during medication creation that prevented the field from being set

Run `fix-lean-nashe-events.js` to automatically fix this issue and create missing events.

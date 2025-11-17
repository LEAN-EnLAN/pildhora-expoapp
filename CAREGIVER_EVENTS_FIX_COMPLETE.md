# Caregiver Events Query Fix - Complete

## Problem

Caregivers were seeing 0 events in the events screen even though events existed in the database. The logs showed:
```
LOG [useLinkedPatients] Found 4 linked devices
LOG [useCollectionSWR] Fetched 0 items from Firestore (events:ZsoeNjnLOGgj1rNomcbJF7QSWTZ2:all:all:all)
```

## Root Cause

The `buildEventQuery` function in `src/utils/eventQueryBuilder.ts` was querying medication events by `caregiverId`:

```typescript
constraints.push(where('caregiverId', '==', caregiverId));
```

However, medication events in the database are stored with the **patient's ID** in the `caregiverId` field, not the actual caregiver's ID. This is because events are created by patients managing their own medications.

Example event structure:
```json
{
  "eventType": "created",
  "medicationName": "Ibuprofeno",
  "patientId": "vtBGfPfbEhU6Z7njl1YsujrUexc2",
  "patientName": "Lean Nashe",
  "caregiverId": "vtBGfPfbEhU6Z7njl1YsujrUexc2",  // ← Same as patientId!
  "timestamp": {...}
}
```

## Solution

Updated the query to filter by `patientId` instead of `caregiverId`, using the list of patients the caregiver has access to through deviceLinks.

### Changes Made

1. **Updated `buildEventQuery` in `src/utils/eventQueryBuilder.ts`**:
   - Changed from filtering by `caregiverId` to filtering by `patientId`
   - Added `linkedPatientIds` parameter to pass the list of accessible patients
   - Uses Firestore's `in` operator to query multiple patients (up to 10)
   - Returns `null` if no patients are available

2. **Updated `app/caregiver/events.tsx`**:
   - Extracts patient IDs from the `useLinkedPatients` hook
   - Passes `linkedPatientIds` to `buildEventQuery`
   - Watches the entire `patients` array for changes



### Code Changes

**Before:**
```typescript
// Query by caregiverId (WRONG - events don't have caregiver's ID)
constraints.push(where('caregiverId', '==', caregiverId));
```

**After:**
```typescript
// Query by patientId using linked patients (CORRECT)
if (filters.patientId) {
  constraints.push(where('patientId', '==', filters.patientId));
} else if (linkedPatientIds && linkedPatientIds.length > 0) {
  const patientsToQuery = linkedPatientIds.slice(0, 10);
  constraints.push(where('patientId', 'in', patientsToQuery));
}
```

## Testing

Verified that caregiver "Tomas" (ZsoeNjnLOGgj1rNomcbJF7QSWTZ2) can now access:
- ✅ 4 linked patients
- ✅ 2 medication events from patient "Lean Nashe"
- ✅ Events are properly filtered by patientId

## Impact

- ✅ Caregivers can now see medication events from their linked patients
- ✅ Events screen will show all events from accessible patients
- ✅ Filtering by specific patient still works correctly
- ✅ No permission errors

## Notes

- Firestore's `in` operator supports up to 10 values
- If a caregiver has more than 10 linked patients, only the first 10 will be queried
- For production with many patients, consider implementing pagination or multiple queries

## Files Modified

1. `src/utils/eventQueryBuilder.ts` - Updated query logic
2. `app/caregiver/events.tsx` - Pass linked patient IDs to query builder

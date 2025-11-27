# Firestore Timestamp Handling Fix

## Issue
The app was crashing with the error:
```
TypeError: targetDate.getTime is not a function (it is undefined)
```

This occurred in `MedicationEventCard.tsx` when trying to display relative time strings for medication events.

## Root Cause
When fetching data from Firestore, timestamp fields are returned as Firestore `Timestamp` objects, not JavaScript `Date` objects or ISO strings. The `getRelativeTimeString` function in `dateUtils.ts` was only handling `Date` objects and strings, causing it to fail when receiving Firestore Timestamps.

## Solution
Updated `src/utils/dateUtils.ts` to handle multiple date formats:

1. **Added `toDate()` helper function** that converts various date formats to JavaScript `Date` objects:
   - JavaScript `Date` objects (pass through)
   - ISO date strings (convert with `new Date()`)
   - Firestore Timestamps with `.toDate()` method
   - Firestore Timestamps with `.seconds` property
   - Fallback for any other format

2. **Updated all date utility functions** to use the new `toDate()` helper:
   - `getRelativeTimeString()`
   - `formatDateTime()`
   - `isToday()`
   - `isYesterday()`

## Files Modified
- `src/utils/dateUtils.ts` - Added Firestore Timestamp handling
- `src/components/caregiver/MedicationEventCard.tsx` - Fixed color token usage (unrelated but found during fix)

## Components Affected
The following components use `getRelativeTimeString()` and will now work correctly with Firestore Timestamps:
- `MedicationEventCard.tsx`
- `LastMedicationStatusCard.tsx`
- `DeviceConnectivityCard.tsx`
- `app/caregiver/events/[id].tsx`

## Testing
The fix handles all common date formats:
```typescript
// All of these now work:
getRelativeTimeString(new Date());                    // Date object
getRelativeTimeString('2024-01-15T10:30:00Z');       // ISO string
getRelativeTimeString(firestoreTimestamp);            // Firestore Timestamp
```

## Prevention
To prevent similar issues in the future:
1. Always use the `dateUtils` functions when displaying dates
2. Never assume date format from Firestore - it returns Timestamp objects
3. The `toDate()` helper is now robust enough to handle any date format

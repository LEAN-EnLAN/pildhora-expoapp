## Root Cause
- The "Tomar medicación" action directly creates a `taken` record every press without checking if the dose was already recorded (app/patient/home.tsx:163–193). This allows infinite duplicate intakes for the same scheduled time.
- Adherence is computed as `takenDoses / totalDoses` without clamping or deduplication (app/patient/home.tsx:70–92), so duplicates push the ratio above 1.
- The chart component clamps only the ring data, not the label, so it displays values over 100% (src/components/AdherenceProgressChart.tsx:38).
- Store/intake logic does not restrict multiple `taken` updates or enforce uniqueness (src/store/slices/intakesSlice.ts:268–323).

## Fixes
- Prevent duplicate intake creation for the same medication and scheduled time on Patient Home.
- Clamp and deduplicate adherence calculation to avoid >100%.
- Clamp the chart label to 0–100.
- Disable the "Tomar medicación" button when the upcoming dose is already recorded.
- Optional: make intake record IDs deterministic to enforce uniqueness at the database level.
- Optional: add a small cleanup to remove duplicate intake records created previously.

## Implementation Steps
1. Patient Home duplicate guard
- In `handleTakeUpcomingMedication` (app/patient/home.tsx:163), compute `scheduledDate` as today’s upcoming time (already done at 171–175).
- Before writing, check `intakes` for any record where:
  - `status === IntakeStatus.TAKEN`,
  - `medicationId === upcoming.med.id`,
  - `new Date(record.scheduledTime).getTime() === scheduledDate.getTime()`.
- If found, show an alert ("Esta dosis ya fue registrada") and return; otherwise proceed with `addDoc`.
- Also, derive an `alreadyTaken` boolean and use it to disable the button.

2. Adherence calculation safety
- Update `adherencePercentage` (app/patient/home.tsx:70–92):
  - Count unique taken intakes for today using a Set keyed by `medicationId|scheduledTimeISO` (fallback to `medicationName` if `medicationId` is missing).
  - Compute `takenUnique / totalDoses` and clamp: `Math.min(1, takenUnique / totalDoses)`.

3. Chart label clamp
- In `AdherenceProgressChart` (src/components/AdherenceProgressChart.tsx:38), clamp the label to 0–100: `Math.round(Math.max(0, Math.min(progress, 1)) * 100)`.

4. Optional database-level uniqueness
- Replace `addDoc(intakeRecords)` with `setDoc(doc(intakeRecords, `${patientId}_${medId}_${YYYYMMDDHHmm}`), data)` to make writes idempotent for a given dose time. This prevents double-writes even under race conditions. Keep as a future enhancement if changing IDs now is risky.

5. Optional duplicate cleanup
- For today’s records: query `intakeRecords` where `patientId == current` and `scheduledTime >= startOfToday`, group by `medicationId+scheduledTime`, keep one doc per group, delete extras. Gate behind an admin-only action or a one-time migration.

## Verification
- Manual: Press "Tomar medicación" once → intake created; pressing again shows alert and button disabled. Adherence ring shows 100% only when all scheduled doses are recorded; never exceeds 100%.
- Data: Observe `intakes` updating via subscription (src/store/slices/intakesSlice.ts:170–205); no additional records after duplicate press.
- UI: Chart label displays clamped percentage; progression increments only to scheduled total.

## Notes
- This plan avoids large schema changes and delivers immediate UX/data correctness.
- If legacy duplicates exist, clamping prevents visual >100%; the optional cleanup removes inflated history permanently.
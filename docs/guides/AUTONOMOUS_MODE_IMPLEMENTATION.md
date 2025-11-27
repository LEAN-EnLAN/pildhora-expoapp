# Autonomous Mode Implementation

## Overview

The Autonomous Mode feature allows patients to control whether their medication data is shared with caregivers. When enabled, patients can use the app privately without sharing real-time medication events with their connected caregivers.

## Features

### For Patients

1. **Toggle Switch in Device Settings**
   - Replaces the "desvincular" button
   - Clear visual indicator (eye icon)
   - Shows current mode: "Modo Supervisado" or "Modo Autónomo"
   - Warning dialog before changing modes

2. **Two Modes**
   - **Modo Supervisado (Supervised Mode)**: Default mode where caregivers can see all medication data
   - **Modo Autónomo (Autonomous Mode)**: Private mode where new events are not shared with caregivers

3. **Data Control**
   - When autonomous mode is enabled:
     - New medication events are NOT synced to Firestore
     - Events are still tracked locally for the patient
     - Caregivers cannot see new activity
   - When autonomous mode is disabled:
     - Normal data sharing resumes
     - All new events are visible to caregivers

### For Caregivers

1. **Visual Indicators**
   - Banner showing "Modo autónomo activado" when patient is in autonomous mode
   - Displayed on dashboard and in medication status cards
   - Clear messaging that current data is not available

2. **Historical Data Access**
   - Caregivers can still see historical events from before autonomous mode was enabled
   - Past medication history remains accessible
   - Only new events are hidden

## Implementation Details

### Database Schema

Added to `users` collection:
```typescript
{
  autonomousMode: boolean;           // Whether autonomous mode is enabled
  autonomousModeChangedAt: Timestamp; // When mode was last changed
}
```

### Key Components

1. **Service Layer**
   - `src/services/autonomousMode.ts`: Core service for managing autonomous mode
   - `src/services/medicationEventService.ts`: Updated to check autonomous mode before syncing events

2. **UI Components**
   - `app/patient/device-settings.tsx`: Patient settings screen with toggle switch
   - `src/components/caregiver/AutonomousModeBanner.tsx`: Banner component for caregivers
   - `app/caregiver/dashboard.tsx`: Updated to show autonomous mode status

3. **Hooks**
   - `src/hooks/usePatientAutonomousMode.ts`: Real-time hook to monitor patient's autonomous mode status

### Event Sync Logic

When a medication event is created:

1. Event is added to local queue
2. During sync, the service checks if patient is in autonomous mode
3. If autonomous mode is enabled:
   - Event is marked as "delivered" but NOT synced to Firestore
   - Event remains in local storage for patient's use
   - Caregivers cannot see the event
4. If autonomous mode is disabled:
   - Event is synced normally to Firestore
   - Caregivers can see the event

### Security Considerations

- Only the patient can change their own autonomous mode setting
- Authentication is verified before allowing mode changes
- Caregivers cannot override autonomous mode
- Historical data remains protected by existing security rules

## User Flow

### Patient Enabling Autonomous Mode

1. Patient opens Device Settings
2. Sees toggle switch showing current mode
3. Taps switch to enable autonomous mode
4. Confirmation dialog explains:
   - Caregivers won't see new events
   - Historical data remains visible
   - Current data will show "Modo autónomo activado"
5. Patient confirms
6. Mode is updated in database
7. Success message confirms change

### Caregiver Viewing Patient in Autonomous Mode

1. Caregiver opens dashboard
2. Selects patient who has autonomous mode enabled
3. Sees banner: "Modo autónomo activado - Los datos actuales no están siendo compartidos"
4. Last medication status card shows autonomous mode message
5. Historical events remain visible in events tab
6. No new events appear while autonomous mode is active

## Testing

Run the test script:
```bash
node test-autonomous-mode.js
```

### Manual Testing Checklist

**Patient Side:**
- [ ] Toggle switch appears in device settings
- [ ] Switch shows correct current mode
- [ ] Warning dialog appears when toggling
- [ ] Mode changes successfully
- [ ] Success message appears
- [ ] Caregiver count updates with mode status

**Caregiver Side:**
- [ ] Banner appears when patient is in autonomous mode
- [ ] Banner disappears when patient disables autonomous mode
- [ ] Last medication card shows autonomous mode message
- [ ] Historical events remain visible
- [ ] New events don't appear while autonomous mode is active
- [ ] New events appear after autonomous mode is disabled

## Files Modified

### New Files
- `src/services/autonomousMode.ts`
- `src/hooks/usePatientAutonomousMode.ts`
- `src/components/caregiver/AutonomousModeBanner.tsx`
- `test-autonomous-mode.js`
- `AUTONOMOUS_MODE_IMPLEMENTATION.md`

### Modified Files
- `src/types/index.ts` - Added `autonomousMode` field to User interface
- `src/services/medicationEventService.ts` - Added autonomous mode check before syncing events
- `app/patient/device-settings.tsx` - Replaced unlink button with autonomous mode toggle
- `app/caregiver/dashboard.tsx` - Added autonomous mode banner
- `src/components/caregiver/LastMedicationStatusCard.tsx` - Added autonomous mode handling

## Future Enhancements

1. **Analytics**: Track autonomous mode usage patterns
2. **Notifications**: Notify caregivers when patient enables autonomous mode
3. **Scheduled Mode**: Allow patients to schedule autonomous mode (e.g., during work hours)
4. **Partial Sharing**: Allow patients to share some data types but not others
5. **Emergency Override**: Allow caregivers to request access in emergencies

## Support

For questions or issues with autonomous mode:
1. Check that Firebase is properly initialized
2. Verify user authentication
3. Check Firestore security rules allow user document updates
4. Review console logs for error messages

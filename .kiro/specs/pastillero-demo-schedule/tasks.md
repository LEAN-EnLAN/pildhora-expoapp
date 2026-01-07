# Implementation Plan

- [x] 1. Create types and constants for pastillero schedule





  - [x] 1.1 Add pastillero types to src/types/index.ts


    - Add `TurnoType`, `DiaType`, `DemoScheduleEntry` interfaces
    - Add `PastilleroStatus` and `PastilleroCommands` interfaces
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create pastillero service with demo data constant


    - Create `src/services/pastilleroService.ts`
    - Export `DEMO_PASTILLERO_SCHEDULE` constant with 7 day entries
    - Export `HORARIOS_TURNO` mapping (turno index → hora string)
    - Export `DIAS` and `TURNOS` arrays for RTDB key generation
    - _Requirements: 1.2, 1.4_

- [x] 2. Implement Firebase RTDB upload function



  - [x] 2.1 Add generateRtdbCommands function


    - Initialize all 28 day+turno combinations to false
    - Set only scheduled entries to true
    - _Requirements: 1.3_


  - [x] 2.2 Add uploadPastilleroData function

    - Accept deviceId and optional schedule array
    - Use Firebase `update()` to write to `/devices/{deviceId}/commands`
    - Return Promise that resolves/rejects appropriately
    - _Requirements: 1.3, 1.5_

- [x] 3. Create usePastilleroStatus hook





  - [x] 3.1 Implement real-time listener hook


    - Create `src/hooks/usePastilleroStatus.ts`
    - Accept deviceId and enabled options
    - Listen to `/devices/{deviceId}/state` for online status and last_event_at
    - Listen to `/devices/{deviceId}/commands` for schedule data
    - Return `{ ultimoDispense, online, loading, commands }`
    - Clean up listeners on unmount
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


  - [x] 3.2 Export hook from hooks index

    - Add export to `src/hooks/index.ts`
    - _Requirements: 3.1_
-

- [x] 4. Create PastilleroScheduleList component




  - [x] 4.1 Create schedule list component


    - Create `src/components/shared/PastilleroScheduleList.tsx`
    - Use FlatList to render 7 schedule entries
    - Display day name, turno name, and hora for each entry
    - Apply color coding: yellow (mañana), orange (mediodía), blue (tarde), purple (noche)
    - Use card-style design consistent with existing UI
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 4.2 Add upload button with confirmation


    - Add button to trigger uploadPastilleroData
    - Show Alert on success or error
    - _Requirements: 2.4_
-

- [x] 5. Create StatusCard component





  - [x] 5.1 Implement status card UI

    - Create `src/components/shared/StatusCard.tsx`
    - Display green/red indicator based on online prop
    - Show last dispense time in relative format using date-fns
    - Calculate and display next scheduled dose for today
    - Show "Sin dosis programada para hoy" if no doses today
    - Use Ionicons for visual elements
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
-

- [x] 6. Integrate into patient and caregiver views




  - [x] 6.1 Add StatusCard to patient home screen


    - Import and use StatusCard in patient dashboard
    - Connect to usePastilleroStatus hook with patient's deviceId
    - _Requirements: 5.1, 5.4_

  - [x] 6.2 Add StatusCard to caregiver dashboard


    - Display StatusCard for each linked patient with a device
    - Use patient's deviceId for each card
    - _Requirements: 5.2, 5.4_

  - [x] 6.3 Create dedicated schedule view screen


    - Create `app/patient/pastillero-schedule.tsx` screen
    - Display PastilleroScheduleList component
    - Add navigation from patient settings or home
    - _Requirements: 5.3, 5.4, 5.5_

- [ ] 6.4 Write unit tests for pastillero service
    - Test DEMO_PASTILLERO_SCHEDULE structure
    - Test generateRtdbCommands output
    - Test next schedule calculation
    - _Requirements: 1.2, 1.3_

- [x] 7.3 Verify scheduleSync.ts RTDB key compatibility with TestScheduleSyncButton
    - Confirmed `scheduleSync.ts` generates keys matching RTDB rules (e.g., `domingomañana`, `lunesmediodia`)
    - Service writes to `/devices/{deviceId}/commands` path which is properly secured
    - All 28 day+turno combinations validated as boolean in database.rules.json
    - RTDB rules deployed to both `devices-m1947` and `pildhora-app2-default-rtdb` databases
    - Fixed unused imports (Platform, i) in TestScheduleSyncButton.tsx
    - Deployment verified successful on December 2, 2025

- [x] 7. Backend updates for pastillero schedule feature

  - [x] 7.1 Update RTDB security rules with validation
    - Added validation rules for `/devices/{deviceId}/commands` path
    - Validates all 28 day+turno boolean fields with Spanish characters (domingomañana, lunesmañana, etc.)
    - Validates optional fields: topo, led, buzzer, reboot, fortu, testbool (boolean), turnotest (number/string), ledColor (string)
    - Allows flexible `$other` fields for extensibility
    - Deployed to Firebase RTDB successfully on December 2, 2025

  - [x] 7.2 Verify scheduleSync.ts RTDB compatibility
    - Confirmed `scheduleSync.ts` generates keys matching RTDB rules (e.g., `domingomañana`, `lunesmediodia`)
    - Service writes to `/devices/{deviceId}/commands` path which is properly secured
    - All 28 day+turno combinations validated as boolean
    - Re-deployed RTDB rules to both `devices-m1947` and `pildhora-app2-default-rtdb` databases
    - Deployment verified successful on December 2, 2025

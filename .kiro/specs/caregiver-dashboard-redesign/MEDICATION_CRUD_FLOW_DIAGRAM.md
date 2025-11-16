# Medication CRUD Operations - Flow Diagrams

## Overview

This document provides visual flow diagrams for all medication CRUD operations with event generation.

## Create Medication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE MEDICATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User Action                 Component                  Service/Redux
    │                           │                            │
    │  Tap "Add Medication"     │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  Load Patient Name         │
    │                           ├───────────────────────────>│
    │                           │  getPatientById(patientId) │
    │                           │<───────────────────────────┤
    │                           │  Patient { name: "John" }  │
    │                           │                            │
    │  Fill Wizard Form         │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │  Complete Wizard          │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  Save Medication           │
    │                           ├───────────────────────────>│
    │                           │  addMedication(data)       │
    │                           │<───────────────────────────┤
    │                           │  Medication { id: "123" }  │
    │                           │                            │
    │                           │  Generate Event            │
    │                           ├───────────────────────────>│
    │                           │  createAndEnqueueEvent(    │
    │                           │    medication,             │
    │                           │    patientName,            │
    │                           │    'created'               │
    │                           │  )                         │
    │                           │<───────────────────────────┤
    │                           │  Event Enqueued            │
    │                           │                            │
    │                           │  Sync Event                │
    │                           │  (Background)              │
    │                           │                            │
    │  Success Message          │                            │
    │<──────────────────────────┤                            │
    │  "Medicamento agregado"   │                            │
    │                           │                            │
    │  Navigate Back            │                            │
    │<──────────────────────────┤                            │
    │                           │                            │
```

## Update Medication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPDATE MEDICATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User Action                 Component                  Service/Redux
    │                           │                            │
    │  Tap "Edit"               │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  Load Patient Name         │
    │                           ├───────────────────────────>│
    │                           │  getPatientById(patientId) │
    │                           │<───────────────────────────┤
    │                           │  Patient { name: "John" }  │
    │                           │                            │
    │                           │  Enter Edit Mode           │
    │                           │  (Show Wizard)             │
    │                           │                            │
    │  Modify Fields            │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │  Complete Wizard          │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  Detect Changes            │
    │                           │  (Compare old vs new)      │
    │                           │                            │
    │                           │  Update Medication         │
    │                           ├───────────────────────────>│
    │                           │  updateMedication({        │
    │                           │    id: "123",              │
    │                           │    updates: { ... }        │
    │                           │  })                        │
    │                           │<───────────────────────────┤
    │                           │  Update Successful         │
    │                           │                            │
    │                           │  Generate Event            │
    │                           ├───────────────────────────>│
    │                           │  createAndEnqueueEvent(    │
    │                           │    oldMedication,          │
    │                           │    patientName,            │
    │                           │    'updated',              │
    │                           │    newMedication           │
    │                           │  )                         │
    │                           │<───────────────────────────┤
    │                           │  Event with Changes        │
    │                           │  [                         │
    │                           │    {                       │
    │                           │      field: "doseValue",   │
    │                           │      oldValue: "500",      │
    │                           │      newValue: "1000"      │
    │                           │    }                       │
    │                           │  ]                         │
    │                           │                            │
    │  Success Message          │                            │
    │<──────────────────────────┤                            │
    │  "Medicamento actualizado"│                            │
    │                           │                            │
    │  Exit Edit Mode           │                            │
    │<──────────────────────────┤                            │
    │                           │                            │
```

## Delete Medication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELETE MEDICATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User Action                 Component                  Service/Redux
    │                           │                            │
    │  Tap "Delete"             │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  Show Confirmation         │
    │<──────────────────────────┤                            │
    │  "¿Estás seguro?"         │                            │
    │                           │                            │
    │  Confirm Delete           │                            │
    ├──────────────────────────>│                            │
    │                           │                            │
    │                           │  Generate Event FIRST      │
    │                           ├───────────────────────────>│
    │                           │  createAndEnqueueEvent(    │
    │                           │    medication,             │
    │                           │    patientName,            │
    │                           │    'deleted'               │
    │                           │  )                         │
    │                           │<───────────────────────────┤
    │                           │  Event Enqueued            │
    │                           │  (Captures med data)       │
    │                           │                            │
    │                           │  Delete Medication         │
    │                           ├───────────────────────────>│
    │                           │  deleteMedication("123")   │
    │                           │<───────────────────────────┤
    │                           │  Deletion Successful       │
    │                           │                            │
    │  Success Message          │                            │
    │<──────────────────────────┤                            │
    │  "Medicamento eliminado"  │                            │
    │                           │                            │
    │  Navigate Back            │                            │
    │<──────────────────────────┤                            │
    │                           │                            │
```

## Event Synchronization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  EVENT SYNCHRONIZATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

Event Queue              Sync Service              Firestore
    │                         │                         │
    │  Event Enqueued         │                         │
    ├────────────────────────>│                         │
    │  Status: pending        │                         │
    │                         │                         │
    │                         │  Immediate Sync         │
    │                         ├────────────────────────>│
    │                         │  addDoc(event)          │
    │                         │<────────────────────────┤
    │                         │  Success                │
    │                         │                         │
    │  Update Status          │                         │
    │<────────────────────────┤                         │
    │  Status: delivered      │                         │
    │                         │                         │
    │  Remove from Queue      │                         │
    │<────────────────────────┤                         │
    │                         │                         │

┌─────────────────────────────────────────────────────────────────┐
│                    SYNC FAILURE SCENARIO                         │
└─────────────────────────────────────────────────────────────────┘

Event Queue              Sync Service              Firestore
    │                         │                         │
    │  Event Enqueued         │                         │
    ├────────────────────────>│                         │
    │  Status: pending        │                         │
    │                         │                         │
    │                         │  Immediate Sync         │
    │                         ├────────────────────────>│
    │                         │  addDoc(event)          │
    │                         │<────────────────────────┤
    │                         │  Network Error          │
    │                         │                         │
    │  Update Status          │                         │
    │<────────────────────────┤                         │
    │  Status: failed         │                         │
    │                         │                         │
    │  Keep in Queue          │                         │
    │                         │                         │
    │                         │  Wait 5 minutes         │
    │                         │  (Background Sync)      │
    │                         │                         │
    │                         │  Retry Sync             │
    │                         ├────────────────────────>│
    │                         │  addDoc(event)          │
    │                         │<────────────────────────┤
    │                         │  Success                │
    │                         │                         │
    │  Update Status          │                         │
    │<────────────────────────┤                         │
    │  Status: delivered      │                         │
    │                         │                         │
    │  Remove from Queue      │                         │
    │<────────────────────────┤                         │
    │                         │                         │
```

## Change Tracking Flow (Update Events)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHANGE TRACKING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Old Medication          Change Detector         New Medication
    │                         │                         │
    │  {                      │                         │
    │    name: "Aspirin",     │                         │
    │    doseValue: "500",    │                         │
    │    doseUnit: "mg",      │                         │
    │    times: ["08:00"]     │                         │
    │  }                      │                         │
    ├────────────────────────>│                         │
    │                         │<────────────────────────┤
    │                         │  {                      │
    │                         │    name: "Aspirin",     │
    │                         │    doseValue: "1000",   │
    │                         │    doseUnit: "mg",      │
    │                         │    times: ["08:00",     │
    │                         │            "20:00"]     │
    │                         │  }                      │
    │                         │                         │
    │                         │  Compare Fields         │
    │                         │                         │
    │                         │  Changes Detected:      │
    │                         │  [                      │
    │                         │    {                    │
    │                         │      field: "doseValue",│
    │                         │      oldValue: "500",   │
    │                         │      newValue: "1000"   │
    │                         │    },                   │
    │                         │    {                    │
    │                         │      field: "times",    │
    │                         │      oldValue: [        │
    │                         │        "08:00"          │
    │                         │      ],                 │
    │                         │      newValue: [        │
    │                         │        "08:00",         │
    │                         │        "20:00"          │
    │                         │      ]                  │
    │                         │    }                    │
    │                         │  ]                      │
    │                         │                         │
    │                         │  Generate Event         │
    │                         │  with Changes           │
    │                         │                         │
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                           │
└─────────────────────────────────────────────────────────────────┘

Operation               Error Handler           User Experience
    │                         │                         │
    │  Save Medication        │                         │
    ├────────────────────────>│                         │
    │  Success                │                         │
    │<────────────────────────┤                         │
    │                         │                         │
    │  Generate Event         │                         │
    ├────────────────────────>│                         │
    │  Error: Network Failed  │                         │
    │<────────────────────────┤                         │
    │                         │                         │
    │  Log Error              │                         │
    │  (Don't throw)          │                         │
    │                         │                         │
    │  Continue               │                         │
    ├────────────────────────────────────────────────────>│
    │                         │  Show Success Message   │
    │                         │  "Medicamento agregado" │
    │                         │                         │
    │                         │  (Event will retry      │
    │                         │   in background)        │
    │                         │                         │

┌─────────────────────────────────────────────────────────────────┐
│                 OPERATION FAILURE SCENARIO                       │
└─────────────────────────────────────────────────────────────────┘

Operation               Error Handler           User Experience
    │                         │                         │
    │  Save Medication        │                         │
    ├────────────────────────>│                         │
    │  Error: Firestore Down  │                         │
    │<────────────────────────┤                         │
    │                         │                         │
    │  Catch Error            │                         │
    │  (Throw to user)        │                         │
    │                         │                         │
    │  Skip Event Generation  │                         │
    │                         │                         │
    ├────────────────────────────────────────────────────>│
    │                         │  Show Error Message     │
    │                         │  "No se pudo guardar"   │
    │                         │                         │
    │                         │  Offer Retry Button     │
    │                         │                         │
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  app/caregiver/medications/[patientId]/                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  index.tsx (List)                                          │ │
│  │  - Display medications                                     │ │
│  │  - Search/filter                                           │ │
│  │  - Low inventory badges                                    │ │
│  │  - Navigate to add/detail                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  add.tsx (Create)                                          │ │
│  │  - Fetch patient name                                      │ │
│  │  - Show medication wizard                                  │ │
│  │  - Save medication (Redux)                                 │ │
│  │  - Generate created event                                  │ │
│  │  - Navigate back                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [id].tsx (Detail/Edit/Delete)                             │ │
│  │  - Fetch patient name                                      │ │
│  │  - Show detail view                                        │ │
│  │  - Edit mode (wizard)                                      │ │
│  │  - Update medication (Redux)                               │ │
│  │  - Generate updated event                                  │ │
│  │  - Delete with confirmation                                │ │
│  │  - Generate deleted event                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  src/services/medicationEventService.ts                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MedicationEventService                                    │ │
│  │  - enqueue(event)                                          │ │
│  │  - dequeue()                                               │ │
│  │  - syncPendingEvents()                                     │ │
│  │  - getPendingCount()                                       │ │
│  │  - onSyncComplete(callback)                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Helper Functions                                          │ │
│  │  - generateMedicationCreatedEvent()                        │ │
│  │  - generateMedicationUpdatedEvent()                        │ │
│  │  - generateMedicationDeletedEvent()                        │ │
│  │  - createAndEnqueueEvent()                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  src/store/slices/medicationsSlice.ts                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Redux Actions                                             │ │
│  │  - addMedication(data)                                     │ │
│  │  - updateMedication({ id, updates })                       │ │
│  │  - deleteMedication(id)                                    │ │
│  │  - fetchMedications(patientId)                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

These flow diagrams illustrate:
1. **Create Flow**: Patient name → Save → Event → Success
2. **Update Flow**: Patient name → Changes → Save → Event → Success
3. **Delete Flow**: Confirmation → Event → Delete → Success
4. **Sync Flow**: Queue → Sync → Retry on failure
5. **Change Tracking**: Compare old/new → Generate changes array
6. **Error Handling**: Operation success/failure → Event best effort
7. **Architecture**: Components → Services → Redux → Firestore

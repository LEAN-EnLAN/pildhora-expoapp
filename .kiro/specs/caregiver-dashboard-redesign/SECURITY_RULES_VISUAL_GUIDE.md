# Firestore Security Rules - Visual Guide

## Access Control Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FIRESTORE COLLECTIONS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    TASKS     │  │ DEVICELINKS  │  │ MEDICATION   │     │
│  │              │  │              │  │   EVENTS     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         │                 │                  │              │
│    caregiverId         userId         patientId +           │
│                                       caregiverId           │
└─────────────────────────────────────────────────────────────┘
```

## Tasks Collection

```
┌─────────────────────────────────────────────────────────────┐
│ TASKS: Caregiver-Scoped Task Management                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Caregiver A                    Caregiver B                 │
│  ┌──────────┐                   ┌──────────┐               │
│  │ Task 1   │ ✅ Can Access     │ Task 3   │ ✅ Can Access│
│  │ Task 2   │                   │ Task 4   │               │
│  └──────────┘                   └──────────┘               │
│       │                              │                      │
│       └──────────────────────────────┘                      │
│                    ❌ Cannot Access                         │
│                    Each Other's Tasks                       │
└─────────────────────────────────────────────────────────────┘
```


## DeviceLinks Collection

```
┌─────────────────────────────────────────────────────────────┐
│ DEVICELINKS: Device-User Relationships                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User A                         User B                      │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ Device-001   │ ✅ Can Access │ Device-002   │ ✅ Access │
│  │ role: patient│               │ role: cgiver │           │
│  │ status:active│               │ status:active│           │
│  └──────────────┘               └──────────────┘           │
│       │                              │                      │
│       └──────────────────────────────┘                      │
│                    ❌ Cannot Access                         │
│                    Each Other's Links                       │
└─────────────────────────────────────────────────────────────┘
```

## MedicationEvents Collection

```
┌─────────────────────────────────────────────────────────────┐
│ MEDICATIONEVENTS: Shared Patient-Caregiver Access          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Patient                        Caregiver                   │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ Event 1      │◄──────────────┤ Event 1      │           │
│  │ Event 2      │  ✅ Both Can  │ Event 2      │           │
│  │ Event 3      │    Access     │ Event 3      │           │
│  └──────────────┘               └──────────────┘           │
│                                                              │
│  ✅ Patient can read/write their events                     │
│  ✅ Caregiver can read/write events for their patients      │
│  ❌ Others cannot access these events                       │
└─────────────────────────────────────────────────────────────┘
```

## Field Validation

### Tasks
```
{
  caregiverId: "user123",     // ✅ Required, must match auth.uid
  title: "Buy medication",    // ✅ Required
  completed: false,           // ✅ Required
  createdAt: Timestamp,       // ✅ Required
  updatedAt: Timestamp        // ✅ Required
}
```

### DeviceLinks
```
{
  deviceId: "DEVICE-001",     // ✅ Required
  userId: "user123",          // ✅ Required, must match auth.uid
  role: "caregiver",          // ✅ Required: "patient" | "caregiver"
  status: "active",           // ✅ Required: "active" | "inactive"
  linkedAt: Timestamp,        // ✅ Required
  linkedBy: "user456"         // ⚪ Optional
}
```

### MedicationEvents
```
{
  eventType: "dose_taken",    // ✅ Required: 5 valid types
  medicationId: "med123",     // ✅ Required
  medicationName: "Aspirin",  // ✅ Required
  patientId: "patient123",    // ✅ Required
  timestamp: Timestamp,       // ✅ Required
  syncStatus: "synced",       // ✅ Required: 3 valid statuses
  caregiverId: "cgiver123",   // ⚪ Optional
  patientName: "John Doe",    // ⚪ Optional
  medicationData: {...},      // ⚪ Optional
  changes: [...]              // ⚪ Optional
}
```

## Access Patterns

### Read Operations
```
Tasks:           ✅ Own tasks only
DeviceLinks:     ✅ Own links only
MedicationEvents: ✅ Patient OR Caregiver
```

### Write Operations
```
Tasks:           ✅ Create/Update/Delete own tasks
DeviceLinks:     ✅ Create/Update/Delete own links
MedicationEvents: ✅ Create/Update/Delete if authorized
```

### Validation
```
All Collections: ✅ Authentication required
                 ✅ Field validation
                 ✅ Type checking
                 ✅ Enum validation
```

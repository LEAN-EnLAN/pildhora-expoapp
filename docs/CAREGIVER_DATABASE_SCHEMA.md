# Caregiver Dashboard Database Schema

## Overview

This document describes the database schema changes and additions for the caregiver dashboard redesign. The schema supports the device-patient-caregiver linking architecture and enables both independent patient usage and supervised caregiving modes.

## Table of Contents

1. [Firestore Collections](#firestore-collections)
2. [Realtime Database Structure](#realtime-database-structure)
3. [Data Models](#data-models)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Security Rules](#security-rules)

---

## Firestore Collections

### users

Stores user account information for patients, caregivers, and admins.

**Collection Path**: `/users/{userId}`

**Document Structure**:
```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;            // User email
  role: 'patient' | 'caregiver' | 'admin';
  name: string;             // Display name
  deviceId?: string;        // Linked device ID (patients only)
  caregiverId?: string;     // Associated caregiver (patients only)
  createdAt: Timestamp;     // Account creation timestamp
  updatedAt: Timestamp;     // Last update timestamp
  adherence?: number;       // Medication adherence percentage (patients)
  lastTaken?: Timestamp;    // Last medication taken (patients)
}
```

**Indexes**:
- `role` (ascending)
- `deviceId` (ascending)
- `caregiverId` (ascending)

**Example**:
```json
{
  "uid": "abc123",
  "email": "caregiver@example.com",
  "role": "caregiver",
  "name": "Dr. Smith",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### deviceLinks

Stores the relationships between devices and users (patients and caregivers).

**Collection Path**: `/deviceLinks/{linkId}`

**Document ID Format**: `{deviceId}_{userId}`

**Document Structure**:
```typescript
{
  id: string;               // Document ID (deviceId_userId)
  deviceId: string;         // Device identifier
  userId: string;           // User ID (patient or caregiver)
  role: 'patient' | 'caregiver';
  status: 'active' | 'inactive';
  linkedAt: Timestamp;      // When link was created
  linkedBy: string;         // User ID who created the link
  unlinkedAt?: Timestamp;   // When link was removed (if inactive)
}
```

**Indexes**:
- `deviceId` (ascending), `status` (ascending)
- `userId` (ascending), `status` (ascending)
- `userId` (ascending), `role` (ascending), `status` (ascending)

**Example**:
```json
{
  "id": "DEVICE-001_abc123",
  "deviceId": "DEVICE-001",
  "userId": "abc123",
  "role": "caregiver",
  "status": "active",
  "linkedAt": "2024-01-15T10:00:00Z",
  "linkedBy": "abc123"
}
```

**Linking Architecture**:
```
Patient (user1) → Device (DEVICE-001)
                     ↓
Caregiver (user2) → Device (DEVICE-001) → Patient (user1)
Caregiver (user3) → Device (DEVICE-001) → Patient (user1)
```

---

### devices

Stores device configuration and metadata.

**Collection Path**: `/devices/{deviceId}`

**Document Structure**:
```typescript
{
  id: string;                    // Device identifier
  primaryPatientId: string;      // Primary patient using this device
  desiredConfig: {
    alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';
    ledIntensity: number;        // 0-100
    ledColor: string;            // Hex color code
    volume?: number;             // 0-100
  };
  currentConfig?: {              // Last known config from device
    alarmMode: string;
    ledIntensity: number;
    ledColor: string;
    volume?: number;
  };
  firmwareVersion?: string;
  lastSeen?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `primaryPatientId` (ascending)

**Example**:
```json
{
  "id": "DEVICE-001",
  "primaryPatientId": "patient123",
  "desiredConfig": {
    "alarmMode": "sound",
    "ledIntensity": 75,
    "ledColor": "#FF5733",
    "volume": 80
  },
  "firmwareVersion": "1.2.3",
  "lastSeen": "2024-01-15T10:00:00Z",
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### medicationEvents

Stores all medication lifecycle events for audit and reporting.

**Collection Path**: `/medicationEvents/{eventId}`

**Document Structure**:
```typescript
{
  id: string;                    // Event identifier
  eventType: 'created' | 'updated' | 'deleted' | 'dose_taken' | 'dose_missed';
  medicationId: string;          // Medication identifier
  medicationName: string;        // Medication name (denormalized)
  medicationData?: Partial<Medication>;  // Snapshot of medication data
  patientId: string;             // Patient identifier
  patientName: string;           // Patient name (denormalized)
  caregiverId?: string;          // Caregiver who performed action
  timestamp: Timestamp;          // When event occurred
  syncStatus: 'pending' | 'delivered' | 'failed';
  changes?: Array<{              // For update events
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}
```

**Indexes**:
- `patientId` (ascending), `timestamp` (descending)
- `caregiverId` (ascending), `timestamp` (descending)
- `medicationId` (ascending), `timestamp` (descending)
- `eventType` (ascending), `timestamp` (descending)
- Composite: `patientId` (ascending), `eventType` (ascending), `timestamp` (descending)

**Example**:
```json
{
  "id": "evt_1234567890_abc",
  "eventType": "updated",
  "medicationId": "med123",
  "medicationName": "Aspirin",
  "medicationData": {
    "doseValue": 100,
    "doseUnit": "mg"
  },
  "patientId": "patient123",
  "patientName": "John Doe",
  "caregiverId": "caregiver456",
  "timestamp": "2024-01-15T10:00:00Z",
  "syncStatus": "delivered",
  "changes": [
    {
      "field": "doseValue",
      "oldValue": 50,
      "newValue": 100
    }
  ]
}
```

---

### medications

Stores medication information for patients.

**Collection Path**: `/medications/{medicationId}`

**Document Structure**:
```typescript
{
  id: string;
  patientId: string;
  caregiverId?: string;          // Caregiver managing this medication
  name: string;
  emoji: string;
  doseValue: number;
  doseUnit: string;
  quantityType: 'pill' | 'liquid' | 'cream';
  frequency: 'daily' | 'weekly' | 'as_needed';
  times: string[];               // Array of time strings (HH:mm)
  trackInventory: boolean;
  currentQuantity?: number;
  lowQuantityThreshold?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;         // Soft delete
}
```

**Indexes**:
- `patientId` (ascending), `deletedAt` (ascending)
- `caregiverId` (ascending), `deletedAt` (ascending)

**Example**:
```json
{
  "id": "med123",
  "patientId": "patient123",
  "caregiverId": "caregiver456",
  "name": "Aspirin",
  "emoji": "💊",
  "doseValue": 100,
  "doseUnit": "mg",
  "quantityType": "pill",
  "frequency": "daily",
  "times": ["08:00", "20:00"],
  "trackInventory": true,
  "currentQuantity": 30,
  "lowQuantityThreshold": 10,
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### tasks

Stores caregiver-specific tasks (notes/to-dos).

**Collection Path**: `/tasks/{taskId}`

**Document Structure**:
```typescript
{
  id: string;
  caregiverId: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `caregiverId` (ascending), `completed` (ascending)

**Example**:
```json
{
  "id": "task123",
  "caregiverId": "caregiver456",
  "title": "Call pharmacy for refill",
  "completed": false,
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

---

## Realtime Database Structure

### devices/{deviceId}/state

Stores real-time device state information.

**Path**: `/devices/{deviceId}/state`

**Structure**:
```typescript
{
  is_online: boolean;
  battery_level: number;         // 0-100
  current_status: 'idle' | 'dispensing' | 'alarm_active' | 'error';
  last_seen: number;             // Unix timestamp (milliseconds)
  time_synced: boolean;
  current_medication?: string;   // Currently dispensing medication
  error_code?: string;           // Error code if status is 'error'
}
```

**Example**:
```json
{
  "is_online": true,
  "battery_level": 85,
  "current_status": "idle",
  "last_seen": 1705315200000,
  "time_synced": true
}
```

---

### devices/{deviceId}/config

Stores device configuration (mirrored from Firestore).

**Path**: `/devices/{deviceId}/config`

**Structure**:
```typescript
{
  alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';
  ledIntensity: number;          // 0-100
  ledColor: string;              // Hex color code
  volume: number;                // 0-100
  updatedAt: number;             // Unix timestamp
}
```

**Example**:
```json
{
  "alarmMode": "sound",
  "ledIntensity": 75,
  "ledColor": "#FF5733",
  "volume": 80,
  "updatedAt": 1705315200000
}
```

---

### users/{userId}/devices

Maps users to their linked devices.

**Path**: `/users/{userId}/devices/{deviceId}`

**Structure**:
```typescript
{
  [deviceId]: boolean;           // true if linked, false if unlinked
}
```

**Example**:
```json
{
  "DEVICE-001": true,
  "DEVICE-002": true
}
```

---

## Data Models

### TypeScript Interfaces

```typescript
// User
interface User {
  uid: string;
  email: string;
  role: 'patient' | 'caregiver' | 'admin';
  name: string;
  deviceId?: string;
  caregiverId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  adherence?: number;
  lastTaken?: Timestamp;
}

// Device Link
interface DeviceLink {
  id: string;
  deviceId: string;
  userId: string;
  role: 'patient' | 'caregiver';
  status: 'active' | 'inactive';
  linkedAt: Timestamp;
  linkedBy: string;
  unlinkedAt?: Timestamp;
}

// Device
interface Device {
  id: string;
  primaryPatientId: string;
  desiredConfig: DeviceConfig;
  currentConfig?: DeviceConfig;
  firmwareVersion?: string;
  lastSeen?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface DeviceConfig {
  alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';
  ledIntensity: number;
  ledColor: string;
  volume?: number;
}

// Device State (RTDB)
interface DeviceState {
  is_online: boolean;
  battery_level: number;
  current_status: 'idle' | 'dispensing' | 'alarm_active' | 'error';
  last_seen: number;
  time_synced: boolean;
  current_medication?: string;
  error_code?: string;
}

// Medication Event
interface MedicationEvent {
  id: string;
  eventType: 'created' | 'updated' | 'deleted' | 'dose_taken' | 'dose_missed';
  medicationId: string;
  medicationName: string;
  medicationData?: Partial<Medication>;
  patientId: string;
  patientName: string;
  caregiverId?: string;
  timestamp: Timestamp;
  syncStatus: 'pending' | 'delivered' | 'failed';
  changes?: MedicationEventChange[];
}

interface MedicationEventChange {
  field: string;
  oldValue: any;
  newValue: any;
}

// Medication
interface Medication {
  id: string;
  patientId: string;
  caregiverId?: string;
  name: string;
  emoji: string;
  doseValue: number;
  doseUnit: string;
  quantityType: 'pill' | 'liquid' | 'cream';
  frequency: 'daily' | 'weekly' | 'as_needed';
  times: string[];
  trackInventory: boolean;
  currentQuantity?: number;
  lowQuantityThreshold?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

// Task
interface Task {
  id: string;
  caregiverId: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Patient with Device (composite)
interface PatientWithDevice extends User {
  deviceState?: DeviceState;
}
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│  (Patient)  │
└──────┬──────┘
       │ 1
       │ links to
       │ 0..1
       ▼
┌─────────────┐
│   Device    │
└──────┬──────┘
       │ 1
       │ linked by
       │ 0..N
       ▼
┌─────────────┐
│ DeviceLink  │
└──────┬──────┘
       │ N
       │ grants access to
       │ 1
       ▼
┌─────────────┐
│    User     │
│ (Caregiver) │
└──────┬──────┘
       │ 1
       │ manages
       │ 0..N
       ▼
┌─────────────┐
│ Medication  │
└──────┬──────┘
       │ 1
       │ generates
       │ 0..N
       ▼
┌─────────────┐
│MedicationEvt│
└─────────────┘
```

### Relationship Rules

1. **Patient → Device**: One-to-one (optional)
   - A patient can have 0 or 1 linked device
   - A device has exactly 1 primary patient

2. **Device → DeviceLink**: One-to-many
   - A device can have multiple links (patient + caregivers)
   - Each link represents access for one user

3. **Caregiver → DeviceLink**: One-to-many
   - A caregiver can link to multiple devices
   - Each link grants access to one patient

4. **Patient → Medication**: One-to-many
   - A patient can have multiple medications
   - Each medication belongs to one patient

5. **Medication → MedicationEvent**: One-to-many
   - A medication can have multiple events
   - Each event relates to one medication

---

## Indexes

### Required Firestore Indexes

Create these composite indexes in Firebase Console:

```javascript
// medicationEvents collection
{
  collectionGroup: "medicationEvents",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "patientId", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
}

{
  collectionGroup: "medicationEvents",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "caregiverId", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
}

{
  collectionGroup: "medicationEvents",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "patientId", order: "ASCENDING" },
    { fieldPath: "eventType", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
}

// deviceLinks collection
{
  collectionGroup: "deviceLinks",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "userId", order: "ASCENDING" },
    { fieldPath: "role", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" }
  ]
}

{
  collectionGroup: "deviceLinks",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "deviceId", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" }
  ]
}

// medications collection
{
  collectionGroup: "medications",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "patientId", order: "ASCENDING" },
    { fieldPath: "deletedAt", order: "ASCENDING" }
  ]
}

// tasks collection
{
  collectionGroup: "tasks",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "caregiverId", order: "ASCENDING" },
    { fieldPath: "completed", order: "ASCENDING" }
  ]
}
```

---

## Security Rules

### Firestore Security Rules

See `firestore.rules` for complete implementation. Key rules:

**deviceLinks**:
- Users can read their own links
- Users can create new links
- Users can update/delete their own links

**medicationEvents**:
- Caregivers can read events for their patients
- Patients can read their own events
- Only authenticated users can write events

**medications**:
- Patients can read/write their own medications
- Caregivers can read/write medications for their patients

**tasks**:
- Caregivers can only access their own tasks

### RTDB Security Rules

See `database.rules.json` for complete implementation. Key rules:

**devices/{deviceId}/state**:
- Readable by linked users (patient + caregivers)
- Writable by device (via service account)

**devices/{deviceId}/config**:
- Readable by linked users
- Writable by linked users

**users/{userId}/devices**:
- Readable/writable only by the user

---

## Migration Guide

### From Legacy Schema

1. **Create deviceLinks collection**:
   ```typescript
   // For each patient with deviceId
   await setDoc(doc(db, 'deviceLinks', `${deviceId}_${patientId}`), {
     deviceId,
     userId: patientId,
     role: 'patient',
     status: 'active',
     linkedAt: serverTimestamp(),
     linkedBy: patientId,
   });
   ```

2. **Migrate device data**:
   ```typescript
   // Ensure devices collection has primaryPatientId
   await updateDoc(doc(db, 'devices', deviceId), {
     primaryPatientId: patientId,
   });
   ```

3. **Create medication events**:
   ```typescript
   // Generate events for existing medications
   for (const medication of medications) {
     await createAndEnqueueEvent(medication, patientName, 'created');
   }
   ```

### Data Validation

Run these queries to validate migration:

```typescript
// Check all patients have valid device links
const patients = await getDocs(
  query(collection(db, 'users'), where('role', '==', 'patient'))
);

for (const patientDoc of patients.docs) {
  const patient = patientDoc.data();
  if (patient.deviceId) {
    const linkId = `${patient.deviceId}_${patient.uid}`;
    const link = await getDoc(doc(db, 'deviceLinks', linkId));
    if (!link.exists()) {
      console.error('Missing device link for patient:', patient.uid);
    }
  }
}
```

---

## Performance Considerations

### Query Optimization

1. **Use composite indexes** for complex queries
2. **Limit query results** with pagination
3. **Cache frequently accessed data**
4. **Use RTDB for real-time data** (device state)
5. **Denormalize data** where appropriate (patient names in events)

### Data Size Management

1. **Soft delete medications** (set deletedAt instead of deleting)
2. **Archive old events** (move to separate collection after 1 year)
3. **Limit event queue size** (max 100 pending events)
4. **Prune old cache entries** (remove after 24 hours)

---

## Backup and Recovery

### Backup Strategy

1. **Firestore**: Automatic daily backups enabled
2. **RTDB**: Export data weekly
3. **Critical collections**: Export before major changes

### Recovery Procedures

1. **Restore from backup**: Use Firebase Console
2. **Rebuild indexes**: Run index creation scripts
3. **Validate data integrity**: Run validation queries
4. **Test security rules**: Use Firebase Emulator

---

## Monitoring

### Key Metrics

1. **Document counts**: Monitor collection sizes
2. **Query performance**: Track slow queries
3. **Index usage**: Verify indexes are being used
4. **Security rule denials**: Monitor unauthorized access attempts
5. **RTDB connections**: Track active listeners

### Alerts

Set up alerts for:
- Unusual document creation rates
- High query latency
- Security rule violations
- RTDB connection limits

---

## Support

For schema questions or issues:
1. Review this documentation
2. Check Firebase Console
3. Validate with emulator
4. Contact development team

Last Updated: 2024

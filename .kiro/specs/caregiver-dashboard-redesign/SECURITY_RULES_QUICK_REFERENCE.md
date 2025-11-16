# Firestore Security Rules - Quick Reference

## Collections Overview

| Collection | Purpose | Access Control |
|------------|---------|----------------|
| `tasks` | Caregiver task management | Scoped to caregiverId |
| `deviceLinks` | Device-user relationships | Scoped to userId |
| `medicationEvents` | Medication lifecycle events | Patient + Caregiver access |

## Tasks Collection

**Scope**: Individual caregiver

```javascript
// Read own tasks
allow read: if caregiverId == currentUser

// Create task for self
allow create: if caregiverId == currentUser

// Update/delete own tasks
allow update, delete: if caregiverId == currentUser
```

**Required Fields**:
- `caregiverId` (string)
- `title` (string)
- `completed` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## DeviceLinks Collection

**Scope**: Individual user (patient or caregiver)

```javascript
// Read own links
allow read: if userId == currentUser

// Create link for self
allow create: if userId == currentUser && validFields && validRole && validStatus

// Update/delete own links
allow update, delete: if userId == currentUser
```

**Required Fields**:
- `deviceId` (string)
- `userId` (string)
- `role` (string): 'patient' | 'caregiver'
- `status` (string): 'active' | 'inactive'
- `linkedAt` (timestamp)

**Optional Fields**:
- `linkedBy` (string)

## MedicationEvents Collection

**Scope**: Patient + assigned caregiver

```javascript
// Read events
allow read: if patientId == currentUser || caregiverId == currentUser

// Create events
allow create: if (patientId == currentUser || caregiverId == currentUser) && validData

// Update events
allow update: if patientId == currentUser || caregiverId == currentUser

// Delete events
allow delete: if patientId == currentUser || caregiverId == currentUser
```

**Required Fields**:
- `eventType` (string): 'medication_created' | 'medication_updated' | 'medication_deleted' | 'dose_taken' | 'dose_missed'
- `medicationId` (string)
- `medicationName` (string)
- `patientId` (string)
- `timestamp` (timestamp)
- `syncStatus` (string): 'pending' | 'synced' | 'failed'

**Optional Fields**:
- `caregiverId` (string)
- `patientName` (string)
- `medicationData` (map)
- `changes` (list)

## Common Patterns

### Check if User is Authenticated
```javascript
function isSignedIn() {
  return request.auth != null;
}
```

### Check if User Owns Resource
```javascript
function isSelf(uid) {
  return isSignedIn() && request.auth.uid == uid;
}
```

### Validate Required Fields
```javascript
request.resource.data.keys().hasAll(['field1', 'field2', 'field3'])
```

### Validate Enum Values
```javascript
request.resource.data.role in ['patient', 'caregiver']
```

### Validate Field Types
```javascript
request.resource.data.timestamp is timestamp
request.resource.data.name is string
request.resource.data.count is number
request.resource.data.active is bool
request.resource.data.metadata is map
request.resource.data.items is list
```

## Testing Commands

### Start Firebase Emulator
```bash
firebase emulators:start --only firestore
```

### Run Manual Verification
```bash
node test-firestore-security-rules.js
```

### Run Automated Tests (if configured)
```bash
npm test -- test-firestore-security-rules.spec.js
```

## Security Checklist

- [x] All rules require authentication
- [x] Users can only access their own data
- [x] Required fields are validated
- [x] Enum values are validated
- [x] Field types are validated
- [x] Principle of least privilege applied
- [x] No overly permissive rules
- [x] Rate limiting considered (placeholder)

## Common Errors

### "Missing or insufficient permissions"
- User is not authenticated
- User doesn't own the resource
- Required fields are missing
- Invalid enum values

### "PERMISSION_DENIED"
- Security rule explicitly denies access
- User trying to access another user's data
- Invalid data structure

### "INVALID_ARGUMENT"
- Missing required fields
- Invalid field types
- Invalid enum values

## Quick Fixes

### Task Access Denied
```javascript
// Ensure caregiverId matches current user
const task = {
  caregiverId: auth.currentUser.uid, // Must match
  title: 'My Task',
  completed: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
```

### DeviceLink Creation Failed
```javascript
// Ensure all required fields and valid values
const deviceLink = {
  deviceId: 'DEVICE-001',
  userId: auth.currentUser.uid, // Must match
  role: 'caregiver', // Must be 'patient' or 'caregiver'
  status: 'active', // Must be 'active' or 'inactive'
  linkedAt: serverTimestamp()
};
```

### MedicationEvent Creation Failed
```javascript
// Ensure valid event type and sync status
const event = {
  eventType: 'medication_created', // Must be valid type
  medicationId: 'med123',
  medicationName: 'Aspirin',
  patientId: patientId,
  caregiverId: auth.currentUser.uid, // Optional but must match if present
  timestamp: serverTimestamp(),
  syncStatus: 'pending' // Must be 'pending', 'synced', or 'failed'
};
```

## Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Best Practices](https://firebase.google.com/docs/firestore/security/rules-conditions)

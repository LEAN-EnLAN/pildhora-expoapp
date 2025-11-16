# Device Linking Quick Reference

## Overview

Quick reference for the device linking implementation in Task 13.1.

## Service Functions

### linkDeviceToUser(userId, deviceId)

Links a device to a user (patient or caregiver).

**Parameters:**
- `userId` (string): The authenticated user's ID
- `deviceId` (string): The device identifier (minimum 5 characters)

**Returns:** `Promise<void>`

**Throws:** `DeviceLinkingError` with user-friendly messages

**Example:**
```typescript
import { linkDeviceToUser } from '@/services/deviceLinking';

try {
  await linkDeviceToUser(userId, 'device-12345');
  console.log('Device linked successfully');
} catch (error) {
  console.error(error.userMessage); // User-friendly Spanish message
}
```

### unlinkDeviceFromUser(userId, deviceId)

Unlinks a device from a user.

**Parameters:**
- `userId` (string): The authenticated user's ID
- `deviceId` (string): The device identifier

**Returns:** `Promise<void>`

**Throws:** `DeviceLinkingError` with user-friendly messages

**Example:**
```typescript
import { unlinkDeviceFromUser } from '@/services/deviceLinking';

try {
  await unlinkDeviceFromUser(userId, 'device-12345');
  console.log('Device unlinked successfully');
} catch (error) {
  console.error(error.userMessage);
}
```

## Validation Rules

### Device ID Requirements

- **Minimum Length**: 5 characters
- **Maximum Length**: 100 characters
- **Allowed Characters**: Alphanumeric, hyphens (-), underscores (_)
- **Not Allowed**: Spaces, special characters (@, #, $, etc.)

### Valid Examples
```
✅ device-12345
✅ ESP8266_ABC
✅ my-device-001
✅ DEVICE123
```

### Invalid Examples
```
❌ abc          (too short)
❌ dev          (too short)
❌ device 123   (contains space)
❌ device@home  (special character)
```

## Error Codes

| Code | User Message (Spanish) | Description |
|------|------------------------|-------------|
| `DEVICE_ID_TOO_SHORT` | El ID del dispositivo debe tener al menos 5 caracteres. | Device ID is less than 5 characters |
| `INVALID_DEVICE_ID_FORMAT` | El ID del dispositivo solo puede contener letras, números, guiones y guiones bajos. | Device ID contains invalid characters |
| `ALREADY_LINKED` | Este dispositivo ya está vinculado a tu cuenta. | Device is already linked to this user |
| `USER_NOT_FOUND` | No se encontró el usuario. Por favor, cierra sesión e inicia sesión nuevamente. | User document not found in Firestore |
| `INVALID_USER_ROLE` | Rol de usuario no válido. Por favor, contacta al soporte. | User role is not 'patient' or 'caregiver' |
| `FIRESTORE_NOT_INITIALIZED` | Error de conexión. Por favor, reinicia la aplicación. | Firestore is not initialized |
| `RTDB_NOT_INITIALIZED` | Error de conexión. Por favor, reinicia la aplicación. | RTDB is not initialized |

## Data Structures

### DeviceLink Document (Firestore)

**Collection:** `deviceLinks`  
**Document ID:** `{deviceId}_{userId}`

```typescript
{
  deviceId: string;        // The device identifier
  userId: string;          // The user ID (patient or caregiver)
  role: 'patient' | 'caregiver';  // User's role
  status: 'active' | 'inactive';  // Link status
  linkedAt: Timestamp;     // When the link was created
  linkedBy: string;        // User ID who created the link
}
```

**Example:**
```json
{
  "deviceId": "device-12345",
  "userId": "user-abc-123",
  "role": "caregiver",
  "status": "active",
  "linkedAt": "2024-01-15T10:30:00Z",
  "linkedBy": "user-abc-123"
}
```

### RTDB Entry

**Path:** `users/{userId}/devices/{deviceId}`  
**Value:** `true` (boolean)

**Example:**
```
users/
  user-abc-123/
    devices/
      device-12345: true
      device-67890: true
```

## UI Integration

### Basic Implementation

```typescript
import { useState } from 'react';
import { linkDeviceToUser } from '@/services/deviceLinking';

function DeviceLinkingComponent({ userId }) {
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    // Validate
    if (deviceId.trim().length < 5) {
      setError('El Device ID debe tener al menos 5 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await linkDeviceToUser(userId, deviceId.trim());
      setSuccess('Dispositivo vinculado exitosamente');
      setDeviceId('');
    } catch (err) {
      setError(err.userMessage || 'Error al vincular dispositivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        placeholder="Device ID"
      />
      <button onClick={handleLink} disabled={loading}>
        {loading ? 'Vinculando...' : 'Vincular'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}
```

### With React Native

```typescript
import { Input, Button, ErrorMessage, SuccessMessage } from '@/components/ui';

<Input
  label="Device ID"
  value={deviceId}
  onChangeText={setDeviceId}
  error={error}
  helperText="Mínimo 5 caracteres"
/>

<Button
  onPress={handleLink}
  loading={loading}
  disabled={deviceId.trim().length < 5}
>
  Vincular Dispositivo
</Button>

{error && <ErrorMessage message={error} />}
{success && <SuccessMessage message={success} />}
```

## Querying Linked Devices

### Using useLinkedPatients Hook

```typescript
import { useLinkedPatients } from '@/hooks/useLinkedPatients';

function CaregiverDashboard({ caregiverId }) {
  const { patients, isLoading, error, refetch } = useLinkedPatients({
    caregiverId,
    enabled: true,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {patients.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}
```

### Manual Firestore Query

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDbInstance } from '@/services/firebase';

async function getLinkedDevices(userId) {
  const db = await getDbInstance();
  
  const q = query(
    collection(db, 'deviceLinks'),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

## Multi-Caregiver Support

Multiple caregivers can link to the same device:

```
Device: device-12345
  ├─ Patient: patient-001 (role: patient)
  ├─ Caregiver: caregiver-001 (role: caregiver)
  └─ Caregiver: caregiver-002 (role: caregiver)
```

**Firestore Documents:**
```
deviceLinks/device-12345_patient-001
deviceLinks/device-12345_caregiver-001
deviceLinks/device-12345_caregiver-002
```

## Best Practices

1. **Always validate on both client and server**
   - Client: Immediate feedback
   - Server: Security and data integrity

2. **Handle errors gracefully**
   - Display user-friendly messages
   - Log technical details for debugging
   - Provide retry options when appropriate

3. **Refresh data after linking/unlinking**
   ```typescript
   await linkDeviceToUser(userId, deviceId);
   await refetch(); // Refresh linked patients list
   ```

4. **Show loading states**
   ```typescript
   setLoading(true);
   try {
     await linkDeviceToUser(userId, deviceId);
   } finally {
     setLoading(false);
   }
   ```

5. **Confirm before unlinking**
   ```typescript
   Alert.alert(
     'Confirmar desvinculación',
     '¿Estás seguro?',
     [
       { text: 'Cancelar', style: 'cancel' },
       { text: 'Desvincular', onPress: handleUnlink }
     ]
   );
   ```

## Troubleshooting

### Device ID validation fails
- Check minimum 5 character requirement
- Verify no spaces or special characters
- Ensure only alphanumeric, hyphens, and underscores

### "Already linked" error
- Device is already linked to this user
- Check if link should be updated instead
- Consider unlinking first if needed

### "User not found" error
- User document missing in Firestore
- User may need to re-authenticate
- Check Firebase Auth state

### "Permission denied" error
- Check Firestore security rules
- Verify user is authenticated
- Ensure user has correct role

## Related Documentation

- [Task 13.1 Implementation Summary](./TASK13.1_IMPLEMENTATION_SUMMARY.md)
- [Device Management Visual Guide](./DEVICE_MANAGEMENT_VISUAL_GUIDE.md)
- [Requirements Document](./requirements.md) - Requirements 1.2, 1.3
- [Design Document](./design.md) - DeviceLink Model

## Support

For issues or questions:
1. Check error code in the table above
2. Review validation rules
3. Verify Firebase configuration
4. Check console logs for technical details

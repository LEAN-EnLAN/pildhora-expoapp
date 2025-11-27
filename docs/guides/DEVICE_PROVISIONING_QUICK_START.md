# Device Provisioning - Quick Start Guide

## For Developers

### Using the Provisioning Service

```typescript
import { provisionDevice } from '../services/deviceProvisioning';

// Provision a new device
await provisionDevice({
  deviceId: 'DEVICE-12345',
  userId: currentUser.uid,
  wifiSSID: 'MyNetwork',
  wifiPassword: 'password123',
  alarmMode: 'both',
  ledIntensity: 75,
  ledColor: '#3B82F6',
  volume: 75,
});
```

### Error Handling

```typescript
import { provisionDevice, DeviceProvisioningError } from '../services/deviceProvisioning';

try {
  await provisionDevice(data);
} catch (error) {
  if (error instanceof DeviceProvisioningError) {
    // User-friendly error message
    alert(error.userMessage);
    
    // Check if retryable
    if (error.retryable) {
      // Show retry button
    }
  }
}
```

### Checking Device Existence

```typescript
import { checkDeviceExists } from '../services/deviceProvisioning';

const exists = await checkDeviceExists('DEVICE-12345');
if (exists) {
  // Device already provisioned
}
```

### Verifying Ownership

```typescript
import { verifyDeviceOwnership } from '../services/deviceProvisioning';

const isOwner = await verifyDeviceOwnership('DEVICE-12345', userId);
if (isOwner) {
  // User owns this device
}
```

## For Testers

### Manual Testing Steps

1. **Create New User**
   - Sign up with a new email
   - Should be redirected to device provisioning

2. **Enter Device ID**
   - Use format: `TEST-DEVICE-12345`
   - Minimum 5 characters
   - Only letters, numbers, hyphens, underscores

3. **Verify Device**
   - Should show progress indicators
   - Should complete without errors
   - Should show success message

4. **Configure WiFi** (Optional)
   - Enter network name
   - Enter password
   - Can skip this step

5. **Set Preferences**
   - Choose alarm mode
   - Adjust LED intensity
   - Set volume level

6. **Complete Setup**
   - Should show summary
   - Should mark onboarding complete
   - Should redirect to home

### Test Scenarios

#### Happy Path
```
1. New user signs up
2. Enters valid device ID
3. Device is verified
4. Configures WiFi
5. Sets preferences
6. Completes setup
✓ User is redirected to home
```

#### Device Already Claimed
```
1. User enters device ID that's already claimed
2. Verification fails
✓ Error message: "Este dispositivo ya está vinculado a otro usuario"
```

#### Network Error
```
1. User starts provisioning
2. Loses internet connection
3. Provisioning fails
✓ Error message: "El servicio no está disponible"
✓ Retry button is shown
```

#### Invalid Device ID
```
1. User enters "ABC" (too short)
✓ Error message: "El ID del dispositivo debe tener al menos 5 caracteres"

2. User enters "ABC@123" (invalid characters)
✓ Error message: "El ID del dispositivo solo puede contener letras, números..."
```

## For QA

### Automated Test

Run the test script:
```bash
node test-device-provisioning-improvements.js
```

Expected output:
```
✓ Test 1: Create Test User
✓ Test 2: Create Device Document
✓ Test 3: Create Device Configuration
✓ Test 4: Create Device Link
✓ Test 5: Update User Document
✓ Test 6: Initialize RTDB Device State
✓ Test 7: Verify Complete Provisioning

Tests Passed: 7
Tests Failed: 0
```

### What to Check

**Firestore:**
- [ ] `devices/{deviceId}` document exists
- [ ] `deviceConfigs/{deviceId}` document exists
- [ ] `deviceLinks/{deviceId}_{userId}` document exists
- [ ] `users/{userId}` has `deviceId` field
- [ ] `users/{userId}` has `onboardingComplete: true`

**Realtime Database:**
- [ ] `deviceState/{deviceId}` exists
- [ ] `users/{userId}/devices/{deviceId}` is `true`

**User Experience:**
- [ ] Progress indicators show during verification
- [ ] Error messages are in Spanish
- [ ] Success message is shown
- [ ] User is redirected after completion

## Common Issues

### Permission Denied

**Symptom:** Error message "No tienes permiso para configurar este dispositivo"

**Causes:**
- Security rules not deployed
- User not authenticated
- Device already claimed by another user

**Solution:**
1. Deploy Firestore security rules
2. Verify user is logged in
3. Check device ownership in Firestore console

### Device Already Exists

**Symptom:** Error message "Este dispositivo ya está configurado"

**Causes:**
- Device ID already used
- Previous provisioning attempt

**Solution:**
1. Use a different device ID
2. Or delete existing device documents
3. Or update existing device configuration

### Network Timeout

**Symptom:** Error message "La operación tardó demasiado tiempo"

**Causes:**
- Slow internet connection
- Firebase service issues

**Solution:**
1. Check internet connection
2. Click retry button
3. Wait and try again

## Security Rules Reference

### Devices Collection

```javascript
// Users can create devices for themselves
allow create: if isSignedIn() && 
  request.resource.data.id == deviceId &&
  request.resource.data.primaryPatientId == request.auth.uid;

// Only device owner can update
allow update: if isSignedIn() && 
  resource.data.primaryPatientId == request.auth.uid;

// Device owner and linked users can read
allow read: if isSignedIn() && 
  (resource.data.primaryPatientId == request.auth.uid ||
   isLinkedToDevice(deviceId, request.auth.uid));
```

### Device Configs Collection

```javascript
// Device owner can create during provisioning
allow create: if isSignedIn() && isDeviceOwner(deviceId);

// Device owner and linked users can update
allow update: if isSignedIn() &&
  (isLinkedToDevice(deviceId, request.auth.uid) ||
   isDeviceOwner(deviceId));
```

## API Reference

### provisionDevice(data)

Provisions a new device for a user.

**Parameters:**
- `deviceId` (string): Device identifier (min 5 chars)
- `userId` (string): User ID
- `wifiSSID` (string, optional): WiFi network name
- `wifiPassword` (string, optional): WiFi password
- `alarmMode` ('sound' | 'vibrate' | 'both' | 'silent'): Alarm mode
- `ledIntensity` (number): LED brightness (0-100)
- `ledColor` (string): LED color (hex format)
- `volume` (number): Volume level (0-100)

**Returns:** Promise<void>

**Throws:** DeviceProvisioningError

### checkDeviceExists(deviceId)

Checks if a device document exists.

**Parameters:**
- `deviceId` (string): Device identifier

**Returns:** Promise<boolean>

**Throws:** DeviceProvisioningError

### verifyDeviceOwnership(deviceId, userId)

Verifies if a user owns a device.

**Parameters:**
- `deviceId` (string): Device identifier
- `userId` (string): User ID

**Returns:** Promise<boolean>

**Throws:** DeviceProvisioningError

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in console
3. Run the test script
4. Check Firebase console for data
5. Contact development team

## Related Documentation

- [DEVICE_PROVISIONING_IMPROVEMENTS.md](./DEVICE_PROVISIONING_IMPROVEMENTS.md) - Detailed technical documentation
- [DEVICE_PROVISIONING_FIX_SUMMARY.md](./DEVICE_PROVISIONING_FIX_SUMMARY.md) - Executive summary
- [firestore.rules](./firestore.rules) - Security rules

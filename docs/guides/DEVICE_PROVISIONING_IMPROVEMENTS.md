# Device Provisioning Improvements

## Overview

This document outlines the improvements made to the device provisioning flow to address permission issues that prevented new users from setting up their devices.

## Problem Statement

New users were unable to complete device provisioning because:

1. **Overly Restrictive Security Rules**: The Firestore security rules for the `devices` collection required too many fields to be present during creation, making it difficult for new users to provision devices.

2. **Complex Validation**: The `isValidDeviceCreation()` function checked for many optional fields that weren't always available during initial provisioning.

3. **No Centralized Provisioning Service**: Device provisioning logic was scattered across multiple components, making it hard to maintain and debug.

4. **Permission Errors**: New users encountered "permission-denied" errors when trying to create device documents.

## Solutions Implemented

### 1. New Device Provisioning Service

Created `src/services/deviceProvisioning.ts` - a centralized service that handles the complete device provisioning flow:

**Key Features:**
- **Single Entry Point**: `provisionDevice()` function handles all provisioning steps
- **Proper Error Handling**: Custom `DeviceProvisioningError` class with user-friendly messages
- **Retry Logic**: Automatic retry for transient failures
- **Validation**: Input validation for device IDs and user IDs
- **Complete Flow**: Handles device creation, configuration, linking, and RTDB initialization

**Functions:**
- `provisionDevice(data)`: Main provisioning function
- `checkDeviceExists(deviceId)`: Check if device already exists
- `verifyDeviceOwnership(deviceId, userId)`: Verify device ownership
- `updateDeviceConfiguration(data)`: Update existing device configuration

### 2. Simplified Security Rules

Updated `firestore.rules` to be more permissive for new device provisioning:

**Before:**
```javascript
function isValidDeviceCreation() {
  let data = request.resource.data;
  return data.keys().hasAll(['id', 'primaryPatientId', 'provisioningStatus', 
         'provisionedAt', 'provisionedBy', 'wifiConfigured', 'createdAt', 'updatedAt']) &&
         // ... many more checks
}
```

**After:**
```javascript
function isValidDeviceCreation() {
  let data = request.resource.data;
  return data.keys().hasAll(['id', 'primaryPatientId']) &&
         data.id == deviceId &&
         data.primaryPatientId == request.auth.uid &&
         (!data.keys().hasAny(['provisionedBy']) || data.provisionedBy == request.auth.uid);
}
```

**Key Changes:**
- Only require essential fields (`id` and `primaryPatientId`)
- Allow optional fields to be added later
- Simplified validation logic
- Users can only create devices for themselves

### 3. Enhanced Device Config Rules

Updated `deviceConfigs` security rules to support initial provisioning:

**New Features:**
- Separate rules for create, read, update, and delete operations
- `isInitialProvisioning()` helper function to allow config creation during setup
- Device owner can create configuration even if deviceLink doesn't exist yet
- Proper permission checks for all operations

### 4. Updated Verification Step

Modified `src/components/patient/provisioning/steps/VerificationStep.tsx`:

**Before:**
- Manual Firestore document creation
- Scattered error handling
- Complex multi-step process

**After:**
- Uses centralized `provisionDevice()` service
- Simplified error handling
- Clear progress indicators
- Better user feedback

## Provisioning Flow

### Step-by-Step Process

1. **User Enters Device ID** (DeviceIdStep)
   - Validates device ID format
   - Checks minimum length (5 characters)

2. **Device Verification** (VerificationStep)
   - Checks if device exists
   - Calls `provisionDevice()` service
   - Creates all necessary documents

3. **WiFi Configuration** (WiFiConfigStep)
   - Optional WiFi setup
   - Stored in device configuration

4. **Preferences Setup** (PreferencesStep)
   - Alarm mode, LED, volume settings
   - Stored in device configuration

5. **Completion** (CompletionStep)
   - Marks onboarding as complete
   - Shows configuration summary
   - Navigates to patient home

### What Gets Created

When `provisionDevice()` is called, it creates:

1. **Device Document** (`devices/{deviceId}`)
   ```javascript
   {
     id: deviceId,
     primaryPatientId: userId,
     provisioningStatus: 'active',
     provisionedAt: timestamp,
     provisionedBy: userId,
     wifiConfigured: boolean,
     createdAt: timestamp,
     updatedAt: timestamp,
     linkedUsers: { [userId]: { role: 'patient', linkedAt: timestamp } }
   }
   ```

2. **Device Configuration** (`deviceConfigs/{deviceId}`)
   ```javascript
   {
     deviceId: deviceId,
     userId: userId,
     alarmMode: 'sound' | 'vibrate' | 'both' | 'silent',
     ledIntensity: 0-100,
     ledColor: '#RRGGBB',
     volume: 0-100,
     wifiSSID: string,
     wifiConfigured: boolean,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

3. **Device Link** (`deviceLinks/{deviceId}_{userId}`)
   ```javascript
   {
     id: linkId,
     deviceId: deviceId,
     userId: userId,
     role: 'patient',
     status: 'active',
     linkedAt: timestamp,
     linkedBy: userId
   }
   ```

4. **User Update** (`users/{userId}`)
   ```javascript
   {
     deviceId: deviceId,
     onboardingComplete: true,
     onboardingStep: 'complete',
     updatedAt: timestamp
   }
   ```

5. **RTDB Device State** (`deviceState/{deviceId}`)
   ```javascript
   {
     online: false,
     lastSeen: null,
     batteryLevel: 100,
     connectionMode: 'autonomous',
     wifiConfigured: boolean,
     updatedAt: timestamp
   }
   ```

## Error Handling

### Error Types

The provisioning service handles various error scenarios:

1. **INVALID_DEVICE_ID**: Device ID format is invalid
2. **DEVICE_ID_TOO_SHORT**: Device ID is less than 5 characters
3. **DEVICE_ALREADY_CLAIMED**: Device is already linked to another user
4. **PERMISSION_DENIED**: User doesn't have permission
5. **SERVICE_UNAVAILABLE**: Firebase service is unavailable
6. **UNKNOWN_ERROR**: Unexpected error occurred

### User-Friendly Messages

All errors are translated to Spanish user-friendly messages:

```typescript
{
  INVALID_DEVICE_ID: 'El ID del dispositivo no es válido.',
  DEVICE_ALREADY_CLAIMED: 'Este dispositivo ya está vinculado a otro usuario.',
  PERMISSION_DENIED: 'No tienes permiso para configurar este dispositivo.',
  // ... etc
}
```

### Retry Logic

The service includes automatic retry for transient failures:
- Maximum 3 retry attempts
- Exponential backoff (1s, 2s, 3s)
- Only retries on retryable errors (unavailable, timeout, etc.)

## Testing

### Manual Testing Checklist

- [ ] New user can complete device provisioning
- [ ] Device ID validation works correctly
- [ ] Error messages are displayed properly
- [ ] Retry functionality works
- [ ] Device already claimed error is shown
- [ ] WiFi configuration is optional
- [ ] Preferences are saved correctly
- [ ] Onboarding completes successfully
- [ ] User is redirected to home screen

### Test Scenarios

1. **Happy Path**: New user provisions a new device
2. **Device Already Exists**: User tries to provision an already claimed device
3. **Network Error**: User loses connection during provisioning
4. **Invalid Device ID**: User enters invalid device ID format
5. **Re-provisioning**: User tries to provision the same device twice

## Security Considerations

### What Changed

1. **More Permissive Creation**: Users can now create device documents with minimal fields
2. **Self-Assignment Only**: Users can only create devices assigned to themselves
3. **Ownership Validation**: Device owner is always the authenticated user
4. **No Privilege Escalation**: Users cannot change device ownership after creation

### What Stayed Secure

1. **Authentication Required**: All operations require authentication
2. **Ownership Checks**: Only device owner can update/delete
3. **Caregiver Access**: Caregivers can only access via deviceLinks
4. **Data Isolation**: Users can only access their own devices

## Migration Notes

### For Existing Users

No migration needed. Existing devices and configurations will continue to work.

### For New Deployments

1. Deploy updated Firestore security rules
2. Deploy new provisioning service code
3. Test with a new user account
4. Monitor error logs for any issues

## Future Improvements

1. **Device Registry**: Maintain a registry of valid device IDs
2. **Device Verification**: Verify device exists in hardware registry
3. **QR Code Scanning**: Allow users to scan device QR code
4. **Bulk Provisioning**: Support for provisioning multiple devices
5. **Device Transfer**: Allow transferring device ownership
6. **Provisioning Analytics**: Track provisioning success/failure rates

## Related Files

- `src/services/deviceProvisioning.ts` - Main provisioning service
- `firestore.rules` - Updated security rules
- `src/components/patient/provisioning/steps/VerificationStep.tsx` - Updated verification step
- `src/services/deviceLinking.ts` - Device linking service
- `src/services/onboarding.ts` - Onboarding service

## Support

If you encounter issues with device provisioning:

1. Check browser console for error messages
2. Verify Firebase authentication is working
3. Check Firestore security rules are deployed
4. Verify device ID format is correct
5. Check network connectivity

For permission errors, ensure:
- User is authenticated
- Security rules are deployed
- Device ID is valid
- Device is not already claimed

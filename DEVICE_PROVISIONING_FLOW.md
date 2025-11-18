# Device Provisioning Flow

## Overview

This document describes the complete flow for device provisioning.

## User Flow

1. **Sign Up** - User creates account
2. **Auto Redirect** - Routing service detects no device, redirects to provisioning
3. **Welcome** - Introduction and instructions
4. **Enter Device ID** - User enters device identifier
5. **Verification** - System provisions device (automatic)
6. **WiFi Setup** - Optional network configuration
7. **Preferences** - Alarm, LED, volume settings
8. **Completion** - Summary and redirect to home

## Provisioning Service Steps

When `provisionDevice()` is called:

1. **Validate Input**
   - Check device ID format
   - Verify user authentication
   - Validate required fields

2. **Check Existing Device**
   - Query Firestore for device document
   - If exists and owned by user: update configuration
   - If exists and owned by other: throw error
   - If not exists: continue to creation

3. **Create Device Document**
   - Collection: `devices/{deviceId}`
   - Fields: id, primaryPatientId, status, timestamps

4. **Create Device Configuration**
   - Collection: `deviceConfigs/{deviceId}`
   - Fields: alarm settings, LED, volume, WiFi

5. **Create Device Link**
   - Collection: `deviceLinks/{deviceId}_{userId}`
   - Links device to user account

6. **Update User Document**
   - Add deviceId to user
   - Mark onboarding complete

7. **Initialize RTDB State**
   - Path: `deviceState/{deviceId}`
   - Path: `users/{userId}/devices/{deviceId}`

## Data Created

### Firestore Collections

**devices/{deviceId}**
- id, primaryPatientId, provisioningStatus
- provisionedAt, provisionedBy, wifiConfigured
- createdAt, updatedAt, linkedUsers

**deviceConfigs/{deviceId}**
- deviceId, userId, alarmMode
- ledIntensity, ledColor, volume
- wifiSSID, wifiConfigured
- createdAt, updatedAt

**deviceLinks/{deviceId}_{userId}**
- id, deviceId, userId, role
- status, linkedAt, linkedBy

**users/{userId}** (updated)
- deviceId, onboardingComplete
- onboardingStep, updatedAt

### Realtime Database

**deviceState/{deviceId}**
- online, lastSeen, batteryLevel
- connectionMode, wifiConfigured, updatedAt

**users/{userId}/devices/{deviceId}**
- true (simple mapping)

## Security Rules

### Device Creation

User can create device if:
- User is authenticated
- Device has required fields (id, primaryPatientId)
- Device ID matches document ID
- Primary patient ID is current user

### Device Config Creation

User can create config if:
- User is authenticated
- User owns the device (is primaryPatientId)

### Device Link Creation

User can create link if:
- User is authenticated
- (Validation done at application level)

## Error Handling

### Error Types

- **INVALID_DEVICE_ID** - Format is invalid
- **DEVICE_ID_TOO_SHORT** - Less than 5 characters
- **DEVICE_ALREADY_CLAIMED** - Owned by another user
- **PERMISSION_DENIED** - No permission to create
- **SERVICE_UNAVAILABLE** - Network/Firebase issue
- **UNKNOWN_ERROR** - Unexpected error

### Retry Logic

- Automatic retry for transient errors
- Maximum 3 attempts
- Exponential backoff (1s, 2s, 3s)
- Only retries on retryable errors

## Testing

Run test script:
```bash
node test-device-provisioning-improvements.js
```

Tests verify:
- User creation
- Device document creation
- Device configuration creation
- Device link creation
- User document update
- RTDB initialization
- Complete provisioning

## Files

- `src/services/deviceProvisioning.ts` - Main service
- `firestore.rules` - Security rules
- `src/components/patient/provisioning/steps/VerificationStep.tsx` - UI component
- `test-device-provisioning-improvements.js` - Test script

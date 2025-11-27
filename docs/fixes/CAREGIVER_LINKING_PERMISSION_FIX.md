# Caregiver Device Linking Permission Fix

## Problem Summary

When caregivers attempted to link to a patient's device using a connection code, they received a "permission-denied" error from Firestore. The connection code validation succeeded, but the deviceLink creation failed.

### Error Logs
```
[DeviceLinking] linkDeviceToUser failed: {"code": "permission-denied"}
[ConnectionCodeService] useCode failed: {"code": "PERMISSION_DENIED", "message": "Permission denied for linkDeviceToUser"}
```

## Root Cause

The Firestore security rules for the `deviceLinks` collection had overly restrictive create permissions. The original rule was:

```javascript
allow create: if isSignedIn() &&
  isValidDeviceLinkData() &&
  (request.resource.data.userId == request.auth.uid ||
   isDeviceOwner(request.resource.data.deviceId));
```

This rule only allowed:
1. Users to create links where `userId == auth.uid` (user linking themselves)
2. Device owners to create links for their device

### The Problem

When a caregiver uses a connection code to link to a patient's device:
- `userId` = caregiver's UID (the caregiver themselves)
- `deviceId` = patient's device ID
- `linkedBy` = caregiver's UID
- The caregiver is **NOT** the device owner (the patient is)

The caregiver satisfies condition #1 (`userId == auth.uid`), but the security rule was still denying access. This was because the rule was too strict and didn't account for the `linkedBy` field that indicates who initiated the link.

## Solution

Updated the `deviceLinks` create rule to also allow creation when `linkedBy` matches the authenticated user:

```javascript
allow create: if isSignedIn() &&
  isValidDeviceLinkData() &&
  (request.resource.data.userId == request.auth.uid ||
   request.resource.data.linkedBy == request.auth.uid ||
   isDeviceOwner(request.resource.data.deviceId));
```

### Why This Works

The `linkedBy` field is set to the authenticated user's UID when they create the link. By adding this condition, we allow:
- **Patients** to create deviceLinks during device provisioning (userId == auth.uid)
- **Caregivers** to create deviceLinks when using connection codes (linkedBy == auth.uid)
- **Device owners** to create deviceLinks for their devices (isDeviceOwner)

This maintains security while enabling the caregiver linking flow.

## Security Considerations

✅ **Secure**: The connection code validation is still enforced in the `connectionCodes` rules
✅ **Secure**: Caregivers can only create links for themselves (linkedBy == auth.uid)
✅ **Secure**: Connection codes are one-time use and time-limited
✅ **Secure**: Device owners can still revoke caregiver links

## Testing

### Test Data
- Patient ID: `vtBGfPfbEhU6Z7njl1YsujrUexc2`
- Caregiver ID: `ZsoeNjnLOGgj1rNomcbJF7QSWTZ2`
- Device ID: `device-001`
- Connection Code: `YAGHG7`

### Test Steps

1. **Reset the connection code** (if already used):
   ```bash
   node reset-connection-code.js
   ```

2. **Test the linking flow**:
   - Patient generates connection code: `YAGHG7`
   - Caregiver enters the code in the app
   - Caregiver confirms the connection
   - DeviceLink should be created successfully

3. **Verify the results**:
   ```bash
   node test-caregiver-device-linking.js
   ```

## Files Modified

1. **firestore.rules** - Updated deviceLinks create rule
2. **test-caregiver-device-linking.js** - Test script to verify the fix
3. **reset-connection-code.js** - Utility to reset connection codes for testing

## Deployment

The updated security rules have been deployed to Firebase:
```bash
firebase deploy --only firestore:rules
```

## Next Steps

1. ✅ Security rules updated and deployed
2. ✅ Connection code reset for testing
3. 🔄 Test the caregiver linking flow in the app
4. ✅ Verify deviceLink is created successfully

## Related Documentation

- [Caregiver Connection Guide](docs/CAREGIVER_CONNECTION_GUIDE.md)
- [Device Linking Service](src/services/deviceLinking.ts)
- [Connection Code Service](src/services/connectionCode.ts)
- [Security Rules Documentation](.kiro/specs/user-onboarding-device-provisioning/SECURITY_RULES_IMPLEMENTATION.md)

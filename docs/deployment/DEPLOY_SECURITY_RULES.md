# Deploy Security Rules - Quick Guide

## ⚠️ CRITICAL SECURITY NOTICE

**The service account credentials you shared in the chat are now PUBLIC and MUST be revoked immediately!**

### Immediate Action Required:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `pildhora-app2`
3. Go to **Project Settings** → **Service Accounts**
4. Find the service account: `firebase-adminsdk-fbsvc@pildhora-app2.iam.gserviceaccount.com`
5. **Delete or regenerate the private key immediately**
6. Create a new service account key if needed
7. **Never share service account credentials publicly again**

## Deploy Updated Security Rules

### Option 1: Firebase Console (Recommended for Testing)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `pildhora-app2`
3. Go to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules only
firebase deploy --only firestore:rules
```

## Verify Rules Are Deployed

### Check in Firebase Console

1. Go to Firestore Database → Rules
2. Verify the rules show the simplified device creation logic
3. Check the "Published" timestamp is recent

### Test with a New User

1. Create a new user account in your app
2. Try to provision a device
3. Check browser console for any permission errors
4. If errors persist, check the exact error message

## Simplified Rules Summary

The updated rules now allow:

### Devices Collection
- **Create**: Any authenticated user can create devices assigned to themselves
- **Read**: Device owner and linked caregivers
- **Update**: Only device owner
- **Delete**: Only device owner

### Device Configs Collection
- **All Operations**: Any authenticated user (simplified for provisioning)
- Application logic ensures proper ownership

### Device Links Collection
- **All Operations**: Any authenticated user (simplified)
- Validation done at application level

## Testing Checklist

- [ ] Rules deployed to Firebase
- [ ] Create new test user account
- [ ] User can sign up successfully
- [ ] User is redirected to device provisioning
- [ ] User can enter device ID
- [ ] Device verification completes without permission errors
- [ ] Device document created in Firestore
- [ ] Device config created in Firestore
- [ ] Device link created in Firestore
- [ ] User document updated with deviceId
- [ ] RTDB state initialized
- [ ] User redirected to home screen

## Common Issues

### Still Getting Permission Errors

1. **Rules not deployed**: Verify in Firebase Console that rules are published
2. **Cached rules**: Wait 1-2 minutes for rules to propagate
3. **Wrong project**: Verify you're deploying to the correct Firebase project
4. **Authentication issue**: Ensure user is properly authenticated

### Device Already Exists Error

This is expected if the device ID is already in use. Try with a different device ID.

### Network Errors

Check internet connection and Firebase service status.

## Security Considerations

### Current Rules (Simplified for Development)

The current rules are **more permissive** to allow new users to provision devices easily. This is acceptable for development but should be reviewed for production.

**What's Allowed:**
- Any authenticated user can create device configs
- Any authenticated user can create device links

**What's Still Secure:**
- Users can only create devices assigned to themselves
- Device ownership cannot be changed after creation
- All operations require authentication

### Production Recommendations

For production, consider:

1. **Device Registry**: Validate device IDs against a registry of valid devices
2. **Rate Limiting**: Implement rate limiting for device creation
3. **Audit Logging**: Log all device provisioning attempts
4. **Stricter Config Rules**: Restore ownership checks for device configs
5. **Link Validation**: Add validation for device links

## Rollback Plan

If issues occur, you can rollback to previous rules:

1. Go to Firebase Console → Firestore → Rules
2. Click "History" tab
3. Select previous version
4. Click "Restore"

## Support

If you continue to have permission issues:

1. Check the exact error message in browser console
2. Verify the error code (permission-denied, not-found, etc.)
3. Check Firebase Console → Firestore → Rules for syntax errors
4. Verify user is authenticated (check Firebase Auth console)
5. Try with a completely new user account

## Next Steps

After rules are deployed and working:

1. Test complete provisioning flow
2. Verify all documents are created correctly
3. Test with multiple users
4. Monitor Firebase Console for any errors
5. Plan for production security hardening

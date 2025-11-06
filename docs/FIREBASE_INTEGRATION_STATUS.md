# Firebase Integration Status

## Overview
This document outlines the current status of Firebase integration in the Pildhora app and provides instructions for completing the setup.

## Current Configuration Status

### ✅ Completed
1. **Firebase Service Configuration** (`src/services/firebase/index.ts`)
   - Updated to use individual environment variables instead of a single JSON config
   - Added proper validation for required Firebase configuration

2. **Redux Auth Slice** (`src/store/slices/authSlice.ts`)
   - Properly integrated with Firebase Authentication
   - Implements sign up, sign in, logout, and auth state checking
   - Stores user data in Firestore

3. **App Initialization** (`app/_layout.tsx`)
   - Redux store is properly configured with Firebase integration
   - Redux persist is set up to maintain auth state

4. **Dependencies** (`package.json`)
   - All required Firebase dependencies are installed:
     - `firebase: ^12.5.0`
     - `@reduxjs/toolkit: ^2.9.2`
     - `react-redux: ^9.2.0`
     - `redux-persist: ^6.0.0`

5. **Authentication Flow** (`app/auth/login.tsx`, `app/auth/signup.tsx`)
   - Login and signup screens are properly connected to Redux auth slice
   - Navigation based on user role (patient/caregiver) is implemented

6. **Firebase Rules**
   - Firestore rules updated with proper authentication rules
   - Realtime Database (RTDB) rules tightened:
     - Default deny at root
     - Users can read/write their own `users/{uid}` subtree
     - Device `state` is readable to owners; `config` is readable/writable to owners
     - `adherence_logs` are read-only for the user and written by backend functions

7. **Digital Shadow (RTDB + Redux)**
   - `deviceSlice` created with RTDB listeners for real-time device state
   - Store integration updated (device slice not persisted)
   - Documentation updated with Redux usage

8. **Cloud Functions (Missed Dose flow + Notifications)**
   - `onDeviceStatusUpdated` RTDB trigger schedules a delayed check via Cloud Tasks when `current_status` becomes `ALARM_SOUNDING`
   - `checkMissedDose` HTTP function verifies status after 30 minutes, writes `adherence_logs`, and sends FCM notifications to caregivers

9. **Push Token Registration (Client)**
   - `src/services/notifications/push.ts` registers device FCM and Expo push tokens on login
   - Tokens stored under `users/{uid}/fcmTokens/{token}` and `users/{uid}/expoPushTokens/{token}`


## Setup Instructions

### 1. Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings → General → Your apps
4. If you haven't added an app, click "Add app" and select iOS/Android/Web
5. Copy the configuration values

### 2. Update Environment Variables
Replace the placeholder values in `.env` with your actual Firebase configuration:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

### 3. Deploy Firebase Rules
Deploy the updated security rules to Firebase:

```bash
firebase deploy --only firestore:rules
firebase deploy --only database:rules
```

### 4. Test Authentication
1. Run the app with `npm start` or `expo start`
2. Try creating a new account
3. Verify that user data is stored in Firestore
4. Test login functionality

### 5. Configure Push Notifications (Android FCM)
- Ensure your Google services file is present at project root: `google-services.json`
- `app.json` includes:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

- Install notifications module (already installed): `npx expo install expo-notifications`
- Note: To receive push notifications on a real device, you need an EAS build (Expo Go does not support push notifications by default).

### 6. Cloud Functions Environment Config
Set environment variables for Cloud Tasks and the HTTP function URL:

Required env vars (used in `functions/src/index.ts`):
- `TASKS_LOCATION` (default: `us-central1`)
- `MISSED_DOSE_QUEUE` (default: `missed-dose-queue`)
- `CHECK_MISSED_DOSE_URL` (HTTPS URL of the deployed `checkMissedDose` function)
- `MISSED_DOSE_SA_EMAIL` (optional, service account email for OIDC on Cloud Tasks)

Steps:
1. Create the Cloud Tasks queue in your GCP project (Console or gcloud)
2. Deploy functions: `firebase deploy --only functions`
3. Get the URL of `checkMissedDose` and set it as `CHECK_MISSED_DOSE_URL`
4. Redeploy functions if you changed env vars

## Security Notes

1. **Production Deployment**
   - Before deploying to production, review and tighten the Firestore rules
   - The current rules allow full access until December 31, 2025 for development

2. **Environment Variables**
   - Never commit the actual `.env` file with real credentials to version control
   - The `.env` file is already included in `.gitignore`
   - Backend function env vars should be configured via Firebase/Cloud Functions environment or `firebase.json` runtime settings

3. **User Data Structure**
   - User documents are stored in the `users` collection with the user's UID as the document ID
   - Each user document contains: id, email, name, role, and createdAt

## Troubleshooting

### Common Issues

1. **"Missing Firebase configuration" error**
   - Ensure all EXPO_PUBLIC_FIREBASE_* variables are set in `.env`
   - Restart the Expo development server after updating `.env`

2. **Authentication errors**
   - Check that Authentication is enabled in Firebase Console
   - Verify Email/Password sign-in method is enabled

3. **Firestore permission denied**
   - Deploy the updated Firestore rules
   - Check that the rules match your data structure

4. **Redux state not persisting**
   - Verify AsyncStorage is properly configured
   - Check that the auth slice is included in the persist whitelist

## Next Steps

1. Complete the Firebase configuration by updating the `.env` file
2. Test the authentication flow thoroughly
3. Link a device to the patient via `users/{uid}/devices/{deviceID}` mapping using `src/services/deviceLinking.ts`
4. Build development clients with EAS and validate push notifications end-to-end
5. Review and tighten security rules before production deployment

## Hybrid Model: RTDB for Real-time, Firestore for Metadata & Linking

To keep the pillbox real-time while enabling clean UI queries and access control:

- Realtime Database (RTDB)
  - `devices/{deviceID}/state` (current_status, battery_level, wifi, etc.)
  - `devices/{deviceID}/config` (live settings consumed by the device)
  - `users/{uid}/devices/{deviceID}` (client-side link; triggers backend mirroring)

- Firestore
  - `devices/{deviceID}` document: metadata and `linkedUsers` map of UID -> role
  - `deviceLinks/{deviceID}_{uid}` document: one per link for easier queries/audits
  - Optional: `desiredConfig` in `devices/{deviceID}` mirrored to RTDB `/config`

### Cloud Functions (added)

- `onUserDeviceLinked` (RTDB trigger): when `/users/{uid}/devices/{deviceID}` is created
  - Sets `devices/{deviceID}.linkedUsers[uid] = role` in Firestore
  - Creates `deviceLinks/{deviceID}_{uid}` with status `active`
  - If the linking user is a patient and `ownerUserId` is not set in RTDB, sets it server-side

- `onUserDeviceUnlinked` (RTDB trigger): when `/users/{uid}/devices/{deviceID}` is deleted
  - Removes the user from `devices/{deviceID}.linkedUsers`
  - Marks `deviceLinks/{deviceID}_{uid}` as `inactive`

- `onDesiredConfigUpdated` (Firestore trigger): when `devices/{deviceID}.desiredConfig` changes
  - Mirrors new desired config to RTDB at `/devices/{deviceID}/config`

### Firestore Rules (added)

- `devices/{deviceId}`: read only for linked users; caregivers can update metadata (e.g., `desiredConfig`)
- `deviceLinks/{linkId}`: readable by involved user; writes typically handled by backend

### Why this approach

- RTDB remains the live source the hardware reads and writes to
- Firestore provides query-friendly, secure relationships for UI and permissions
- Backend functions ensure consistency and minimize client write privileges

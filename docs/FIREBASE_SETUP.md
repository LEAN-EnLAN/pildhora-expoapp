# Firebase Setup Guide

## Prerequisites
- Google account
- Node.js installed
- Firebase CLI installed globally: `npm install -g firebase-tools`

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `pildhora-pillbox`
4. Enable Google Analytics (recommended)
5. Choose Google Analytics account
6. Click "Create project"

## Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Enable "Email/Password" provider
4. (Optional) Enable Google, Apple, or other providers

## Step 3: Set up Firestore Database
1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location (choose one close to your users)
4. Click "Done"

## Step 4: Enable Cloud Functions (Optional - for AI reports)
1. Go to "Functions" → "Get started"
2. This will enable Cloud Functions for AI processing

## Step 5: Get Firebase Configuration
1. Go to Project settings (gear icon) → "General" tab
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Enter app nickname: "Pildhora Web"
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the config object - you'll need these values

## Step 6: Configure Environment Variables
1. Open `.env` file in the project root
2. Replace the placeholder values with your Firebase config:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=pildhora-pillbox.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=pildhora-pillbox
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=pildhora-pillbox.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Step 7: Set up Firestore Security Rules (Important!)
1. Go to "Firestore Database" → "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Medications: patients can read their own, caregivers can read/write for their patients
    match /medications/{medicationId} {
      allow read: if request.auth != null &&
        (resource.data.patientId == request.auth.uid ||
         resource.data.caregiverId == request.auth.uid);
      allow create: if request.auth != null &&
        request.auth.uid == resource.data.caregiverId;
      allow update, delete: if request.auth != null &&
        resource.data.caregiverId == request.auth.uid;
    }

    // Tasks: only caregivers can manage their tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null &&
        resource.data.caregiverId == request.auth.uid;
    }

    // Devices: users can read/write their associated devices
    match /devices/{deviceId} {
      allow read, write: if request.auth != null;
    }

    // Reports: users can read their own reports
    match /reports/{reportId} {
      allow read: if request.auth != null &&
        (resource.data.patientId == request.auth.uid ||
         resource.data.caregiverId == request.auth.uid);
      allow create: if request.auth != null;
    }
  }
}
```

## Step 8: Test the Setup
1. Run the app: `npm start`
2. Try creating an account and logging in
3. Check Firebase Console to see if data is being stored

## Troubleshooting
- **Auth errors**: Check if Authentication is enabled and rules are correct
- **Firestore errors**: Verify security rules and data structure
- **Config errors**: Ensure all environment variables are set correctly

## Next Steps After Setup
- Implement BLE connectivity
- Add medication management screens
- Set up push notifications
- Configure Google AI for reports
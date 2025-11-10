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

## Step 3: Set up Firestore and Realtime Database
1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location (choose one close to your users)
4. Click "Done"
5. Go to "Realtime Database" -> "Create database"
6. Choose a location and "Start in test mode"

## Step 4: Get Firebase Configuration
1. Go to Project settings (gear icon) → "General" tab
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Enter app nickname: "Pildhora Web"
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the config object - you'll need these values

## Step 5: Configure Environment Variables
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

## Step 6: Set up Security Rules
The security rules for Firestore and the Realtime Database are critical for securing your application's data. For a detailed explanation of the data models and security rules, please refer to the following documents:

- **`docs/SYSTEM_ARCHITECTURE.md`**: Provides a high-level overview of the system architecture, including the "Digital Shadow" paradigm.
- **`docs/DATABASE_SCHEMA.md`**: Provides a detailed description of the Firestore and Realtime Database schemas.

To deploy the rules, you can use the Firebase CLI:
```bash
firebase deploy --only firestore:rules
firebase deploy --only database:rules
```

## Step 7: Test the Setup
1. Run the app: `npm start`
2. Try creating an account and logging in
3. Check Firebase Console to see if data is being stored in both Firestore and the Realtime Database.

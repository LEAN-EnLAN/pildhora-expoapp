// Test script to verify device linking changes
// This script needs to be run within the Expo/React Native environment
// or with proper TypeScript transpilation setup

// Since we can't directly import TypeScript files in Node.js without setup,
// we'll create a manual test that simulates what the app would do

const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getDatabase } = require('firebase/database');

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase if not already initialized
let app;
if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const rdb = getDatabase(app);

async function testDeviceLinking() {
  console.log('Testing device linking functionality...');
  
  // Test parameters (replace with actual values when testing)
  const testUserId = 'test-user-id';
  const testDeviceId = 'TEST-DEVICE-001';
  
  try {
    if (!app) {
      console.log('Firebase app not initialized. Skipping test.');
      return;
    }
    // First, we need to authenticate
    console.log('0. Checking authentication status...');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('❌ No authenticated user. This test requires authentication.');
      console.log('To test with real authentication:');
      console.log('1. Start the development server with: npm start');
      console.log('2. Log in to the app');
      console.log('3. Try linking a device from the patient link-device page');
      return;
    }
    
    console.log(`✅ User authenticated: ${currentUser.uid}`);
    
    // Test device linking
    console.log('1. Testing device linking...');
    const deviceRef = rdb.ref(`users/${currentUser.uid}/devices/${testDeviceId}`);
    const deviceData = {
      deviceId: testDeviceId,
      linkedAt: serverTimestamp(),
      status: 'active'
    };
    
    await deviceRef.set(deviceData);
    console.log('✅ Device linking successful');
    
    // Test device unlinking
    console.log('2. Testing device unlinking...');
    await deviceRef.remove();
    console.log('✅ Device unlinking successful');
    
    console.log('\n✅ All tests passed! The device linking permission issue should be resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.log('\n🔍 Permission denied detected. This suggests the RTDB rules might not be deployed correctly.');
      console.log('To deploy the RTDB rules, run: firebase deploy --only database');
    }
  }
}

// Alternative test function that can be run in the browser console
function createBrowserTest() {
  return `
// Copy and paste this function in the browser console when running the app
async function testDeviceLinkingInBrowser() {
  const { linkDeviceToUser, unlinkDeviceFromUser } = window.deviceLinking || {};
  
  if (!linkDeviceToUser || !unlinkDeviceFromUser) {
    console.error('Device linking functions not available. Make sure you\'re on the patient link-device page.');
    return;
  }
  
  const testDeviceId = 'TEST-DEVICE-BROWSER-' + Date.now();
  
  try {
    console.log('1. Testing device linking...');
    // Get the current user ID from Redux or Firebase Auth
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) {
      console.error('No authenticated user found. Please log in first.');
      return;
    }
    
    await linkDeviceToUser(userId, testDeviceId);
    console.log('✅ Device linking successful');
    
    console.log('2. Testing device unlinking...');
    await unlinkDeviceFromUser(userId, testDeviceId);
    console.log('✅ Device unlinking successful');
    
    console.log('\\n✅ All tests passed! The device linking permission issue should be resolved.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the test
testDeviceLinkingInBrowser();
  `;
}

// Check if we're in a Node.js environment
if (typeof window === 'undefined') {
  console.log('Node.js environment detected.');
  console.log('Note: This test requires Firebase credentials to be set in environment variables.');
  console.log('For a more accurate test, use the browser test function below.\n');
  
  testDeviceLinking().then(() => {
    console.log('\nBrowser test function (copy and paste in browser console):');
    console.log(createBrowserTest());
  });
} else {
  // Browser environment
  console.log('Browser environment detected. Use the createBrowserTest() function to generate a test script.');
}
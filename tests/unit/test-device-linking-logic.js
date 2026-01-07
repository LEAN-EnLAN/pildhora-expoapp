/**
 * Test script for Task 13.1: Device Linking Logic Implementation
 * 
 * This script verifies:
 * 1. Device ID validation (minimum 5 characters)
 * 2. DeviceLink document creation in Firestore
 * 3. RTDB users/{uid}/devices node update
 * 4. User-friendly error handling
 * 
 * Requirements: 1.2, 1.3
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, deleteDoc } = require('firebase/firestore');
const { getDatabase, ref, get, remove } = require('firebase/database');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Test device ID
const TEST_DEVICE_ID = 'test-device-12345';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n▶ ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

async function cleanup(userId) {
  logSection('Cleanup');
  
  try {
    // Remove deviceLink document
    const deviceLinkId = `${TEST_DEVICE_ID}_${userId}`;
    const deviceLinkRef = doc(db, 'deviceLinks', deviceLinkId);
    
    try {
      await deleteDoc(deviceLinkRef);
      logSuccess(`Removed deviceLink document: ${deviceLinkId}`);
    } catch (error) {
      if (error.code !== 'not-found') {
        logWarning(`Could not remove deviceLink: ${error.message}`);
      }
    }
    
    // Remove RTDB entry
    const rtdbRef = ref(rtdb, `users/${userId}/devices/${TEST_DEVICE_ID}`);
    
    try {
      await remove(rtdbRef);
      logSuccess(`Removed RTDB entry: users/${userId}/devices/${TEST_DEVICE_ID}`);
    } catch (error) {
      logWarning(`Could not remove RTDB entry: ${error.message}`);
    }
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

async function testDeviceIdValidation() {
  logTest('Test 1: Device ID Validation (Minimum 5 Characters)');
  
  const testCases = [
    { deviceId: '', shouldFail: true, reason: 'Empty string' },
    { deviceId: 'abc', shouldFail: true, reason: 'Less than 5 characters' },
    { deviceId: 'abcd', shouldFail: true, reason: 'Exactly 4 characters' },
    { deviceId: 'abcde', shouldFail: false, reason: 'Exactly 5 characters (minimum)' },
    { deviceId: 'test-device-123', shouldFail: false, reason: 'Valid device ID' },
    { deviceId: 'device_with_underscores', shouldFail: false, reason: 'Valid with underscores' },
    { deviceId: 'device with spaces', shouldFail: true, reason: 'Contains spaces' },
    { deviceId: 'device@special', shouldFail: true, reason: 'Contains special characters' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      // Import the validation function (we'll test it indirectly through the service)
      const { linkDeviceToUser } = require('./src/services/deviceLinking');
      
      // This will throw if validation fails
      // We use a fake userId for validation testing only
      await linkDeviceToUser('test-user-id', testCase.deviceId);
      
      if (testCase.shouldFail) {
        logError(`${testCase.reason}: Expected to fail but passed`);
        failed++;
      } else {
        logSuccess(`${testCase.reason}: Passed validation`);
        passed++;
      }
    } catch (error) {
      if (testCase.shouldFail) {
        logSuccess(`${testCase.reason}: Correctly rejected (${error.code})`);
        passed++;
      } else {
        logError(`${testCase.reason}: Unexpectedly failed - ${error.message}`);
        failed++;
      }
    }
  }
  
  log(`\nValidation Tests: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

async function testDeviceLinking(userId) {
  logTest('Test 2: Device Linking (Firestore + RTDB)');
  
  try {
    const { linkDeviceToUser } = require('./src/services/deviceLinking');
    
    // Link the device
    log('  Linking device...');
    await linkDeviceToUser(userId, TEST_DEVICE_ID);
    logSuccess('Device linking completed without errors');
    
    // Verify deviceLink document in Firestore
    const deviceLinkId = `${TEST_DEVICE_ID}_${userId}`;
    const deviceLinkRef = doc(db, 'deviceLinks', deviceLinkId);
    const deviceLinkDoc = await getDoc(deviceLinkRef);
    
    if (!deviceLinkDoc.exists()) {
      logError('DeviceLink document not found in Firestore');
      return false;
    }
    
    const deviceLinkData = deviceLinkDoc.data();
    logSuccess('DeviceLink document created in Firestore');
    
    // Verify document structure
    const requiredFields = ['deviceId', 'userId', 'role', 'status', 'linkedAt', 'linkedBy'];
    const missingFields = requiredFields.filter(field => !(field in deviceLinkData));
    
    if (missingFields.length > 0) {
      logError(`Missing fields in deviceLink: ${missingFields.join(', ')}`);
      return false;
    }
    logSuccess('DeviceLink document has all required fields');
    
    // Verify field values
    if (deviceLinkData.deviceId !== TEST_DEVICE_ID) {
      logError(`Incorrect deviceId: ${deviceLinkData.deviceId}`);
      return false;
    }
    logSuccess(`DeviceId matches: ${deviceLinkData.deviceId}`);
    
    if (deviceLinkData.userId !== userId) {
      logError(`Incorrect userId: ${deviceLinkData.userId}`);
      return false;
    }
    logSuccess(`UserId matches: ${deviceLinkData.userId}`);
    
    if (deviceLinkData.status !== 'active') {
      logError(`Incorrect status: ${deviceLinkData.status}`);
      return false;
    }
    logSuccess(`Status is active: ${deviceLinkData.status}`);
    
    if (!['patient', 'caregiver'].includes(deviceLinkData.role)) {
      logError(`Invalid role: ${deviceLinkData.role}`);
      return false;
    }
    logSuccess(`Role is valid: ${deviceLinkData.role}`);
    
    // Verify RTDB entry
    const rtdbRef = ref(rtdb, `users/${userId}/devices/${TEST_DEVICE_ID}`);
    const rtdbSnapshot = await get(rtdbRef);
    
    if (!rtdbSnapshot.exists()) {
      logError('RTDB entry not found');
      return false;
    }
    logSuccess('RTDB entry created successfully');
    
    if (rtdbSnapshot.val() !== true) {
      logError(`Incorrect RTDB value: ${rtdbSnapshot.val()}`);
      return false;
    }
    logSuccess('RTDB value is correct (true)');
    
    return true;
  } catch (error) {
    logError(`Device linking failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testDuplicateLinking(userId) {
  logTest('Test 3: Duplicate Linking Prevention');
  
  try {
    const { linkDeviceToUser } = require('./src/services/deviceLinking');
    
    // Try to link the same device again
    log('  Attempting to link already-linked device...');
    await linkDeviceToUser(userId, TEST_DEVICE_ID);
    
    logError('Duplicate linking should have been prevented');
    return false;
  } catch (error) {
    if (error.code === 'ALREADY_LINKED') {
      logSuccess('Duplicate linking correctly prevented');
      logSuccess(`User-friendly message: "${error.userMessage}"`);
      return true;
    } else {
      logError(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testErrorHandling() {
  logTest('Test 4: User-Friendly Error Messages');
  
  const testCases = [
    {
      name: 'Invalid device ID (too short)',
      deviceId: 'abc',
      expectedCode: 'DEVICE_ID_TOO_SHORT',
    },
    {
      name: 'Invalid device ID (special characters)',
      deviceId: 'device@123',
      expectedCode: 'INVALID_DEVICE_ID_FORMAT',
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      const { linkDeviceToUser } = require('./src/services/deviceLinking');
      await linkDeviceToUser('test-user-id', testCase.deviceId);
      
      logError(`${testCase.name}: Should have thrown an error`);
      failed++;
    } catch (error) {
      if (error.code === testCase.expectedCode) {
        logSuccess(`${testCase.name}: Correct error code (${error.code})`);
        
        if (error.userMessage && error.userMessage.length > 0) {
          logSuccess(`  User message: "${error.userMessage}"`);
          passed++;
        } else {
          logError(`  Missing user-friendly message`);
          failed++;
        }
      } else {
        logError(`${testCase.name}: Wrong error code (expected ${testCase.expectedCode}, got ${error.code})`);
        failed++;
      }
    }
  }
  
  log(`\nError Handling Tests: ${passed} passed, ${failed} failed`, failed === 0 ? 'green' : 'red');
  return failed === 0;
}

async function testDeviceUnlinking(userId) {
  logTest('Test 5: Device Unlinking');
  
  try {
    const { unlinkDeviceFromUser } = require('./src/services/deviceLinking');
    
    // Unlink the device
    log('  Unlinking device...');
    await unlinkDeviceFromUser(userId, TEST_DEVICE_ID);
    logSuccess('Device unlinking completed without errors');
    
    // Verify deviceLink document removed from Firestore
    const deviceLinkId = `${TEST_DEVICE_ID}_${userId}`;
    const deviceLinkRef = doc(db, 'deviceLinks', deviceLinkId);
    const deviceLinkDoc = await getDoc(deviceLinkRef);
    
    if (deviceLinkDoc.exists()) {
      logError('DeviceLink document still exists in Firestore');
      return false;
    }
    logSuccess('DeviceLink document removed from Firestore');
    
    // Verify RTDB entry removed
    const rtdbRef = ref(rtdb, `users/${userId}/devices/${TEST_DEVICE_ID}`);
    const rtdbSnapshot = await get(rtdbRef);
    
    if (rtdbSnapshot.exists()) {
      logError('RTDB entry still exists');
      return false;
    }
    logSuccess('RTDB entry removed successfully');
    
    return true;
  } catch (error) {
    logError(`Device unlinking failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function runTests() {
  logSection('Task 13.1: Device Linking Logic Implementation Test');
  
  log('Requirements being tested:', 'yellow');
  log('  - 1.2: Validate deviceID input (minimum 5 characters)', 'yellow');
  log('  - 1.3: Create deviceLink document in Firestore', 'yellow');
  log('  - Update RTDB users/{uid}/devices node', 'yellow');
  log('  - Handle linking errors with user-friendly messages', 'yellow');
  
  try {
    // Authenticate as a test caregiver
    logSection('Authentication');
    log('Authenticating test user...');
    
    const email = process.env.TEST_CAREGIVER_EMAIL || 'testcaregiver@example.com';
    const password = process.env.TEST_CAREGIVER_PASSWORD || 'testpassword123';
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    logSuccess(`Authenticated as: ${email}`);
    logSuccess(`User ID: ${userId}`);
    
    // Clean up any existing test data
    await cleanup(userId);
    
    // Run tests
    const results = {
      validation: await testDeviceIdValidation(),
      linking: await testDeviceLinking(userId),
      duplicate: await testDuplicateLinking(userId),
      errorHandling: await testErrorHandling(),
      unlinking: await testDeviceUnlinking(userId),
    };
    
    // Summary
    logSection('Test Summary');
    
    const testNames = {
      validation: 'Device ID Validation',
      linking: 'Device Linking (Firestore + RTDB)',
      duplicate: 'Duplicate Linking Prevention',
      errorHandling: 'User-Friendly Error Messages',
      unlinking: 'Device Unlinking',
    };
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [key, passed] of Object.entries(results)) {
      if (passed) {
        logSuccess(`${testNames[key]}: PASSED`);
        totalPassed++;
      } else {
        logError(`${testNames[key]}: FAILED`);
        totalFailed++;
      }
    }
    
    log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`, totalFailed === 0 ? 'green' : 'red');
    
    if (totalFailed === 0) {
      logSection('✓ All Tests Passed!');
      log('Task 13.1 implementation is complete and working correctly.', 'green');
    } else {
      logSection('✗ Some Tests Failed');
      log('Please review the failed tests and fix the issues.', 'red');
    }
    
    process.exit(totalFailed === 0 ? 0 : 1);
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

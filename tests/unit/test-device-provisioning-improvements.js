/**
 * Test Script: Device Provisioning Improvements
 * 
 * This script tests the improved device provisioning flow to ensure
 * new users can successfully set up their devices.
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } = require('firebase/firestore');
const { getDatabase, ref, get, set, remove } = require('firebase/database');

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

// Test configuration
const TEST_DEVICE_ID = 'TEST-DEVICE-' + Date.now();
const TEST_USER_EMAIL = 'test-provisioning-' + Date.now() + '@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Colors for console output
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
  console.log('='.repeat(60) + '\n');
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

/**
 * Test 1: Create test user
 */
async function testCreateUser() {
  logTest('Test 1: Create Test User');
  
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      TEST_USER_EMAIL,
      TEST_USER_PASSWORD
    );
    
    const userId = userCredential.user.uid;
    
    // Create user document
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      email: TEST_USER_EMAIL,
      role: 'patient',
      name: 'Test User',
      onboardingComplete: false,
      onboardingStep: 'device_provisioning',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    logSuccess(`User created: ${userId}`);
    logSuccess(`Email: ${TEST_USER_EMAIL}`);
    return userId;
    
  } catch (error) {
    logError(`Failed to create user: ${error.message}`);
    throw error;
  }
}

/**
 * Test 2: Verify security rules allow device creation
 */
async function testDeviceCreation(userId) {
  logTest('Test 2: Create Device Document');
  
  try {
    const deviceRef = doc(db, 'devices', TEST_DEVICE_ID);
    
    // Try to create device document with minimal fields
    await setDoc(deviceRef, {
      id: TEST_DEVICE_ID,
      primaryPatientId: userId,
      provisioningStatus: 'active',
      provisionedAt: serverTimestamp(),
      provisionedBy: userId,
      wifiConfigured: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      linkedUsers: {
        [userId]: {
          role: 'patient',
          linkedAt: serverTimestamp()
        }
      }
    });
    
    logSuccess('Device document created successfully');
    
    // Verify document exists
    const deviceDoc = await getDoc(deviceRef);
    if (deviceDoc.exists()) {
      logSuccess('Device document verified in Firestore');
      const data = deviceDoc.data();
      logSuccess(`  - Device ID: ${data.id}`);
      logSuccess(`  - Owner: ${data.primaryPatientId}`);
      logSuccess(`  - Status: ${data.provisioningStatus}`);
    } else {
      logError('Device document not found after creation');
    }
    
  } catch (error) {
    logError(`Failed to create device: ${error.code || error.message}`);
    if (error.code === 'permission-denied') {
      logError('PERMISSION DENIED - Security rules may need updating');
    }
    throw error;
  }
}

/**
 * Test 3: Create device configuration
 */
async function testDeviceConfiguration(userId) {
  logTest('Test 3: Create Device Configuration');
  
  try {
    const configRef = doc(db, 'deviceConfigs', TEST_DEVICE_ID);
    
    await setDoc(configRef, {
      deviceId: TEST_DEVICE_ID,
      userId: userId,
      alarmMode: 'both',
      ledIntensity: 75,
      ledColor: '#3B82F6',
      volume: 75,
      wifiSSID: 'TestNetwork',
      wifiConfigured: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    logSuccess('Device configuration created successfully');
    
    // Verify configuration
    const configDoc = await getDoc(configRef);
    if (configDoc.exists()) {
      logSuccess('Device configuration verified');
      const data = configDoc.data();
      logSuccess(`  - Alarm Mode: ${data.alarmMode}`);
      logSuccess(`  - LED Intensity: ${data.ledIntensity}%`);
      logSuccess(`  - Volume: ${data.volume}%`);
    }
    
  } catch (error) {
    logError(`Failed to create device configuration: ${error.code || error.message}`);
    throw error;
  }
}

/**
 * Test 4: Create device link
 */
async function testDeviceLink(userId) {
  logTest('Test 4: Create Device Link');
  
  try {
    const linkId = `${TEST_DEVICE_ID}_${userId}`;
    const linkRef = doc(db, 'deviceLinks', linkId);
    
    await setDoc(linkRef, {
      id: linkId,
      deviceId: TEST_DEVICE_ID,
      userId: userId,
      role: 'patient',
      status: 'active',
      linkedAt: serverTimestamp(),
      linkedBy: userId,
    });
    
    logSuccess('Device link created successfully');
    
    // Verify link
    const linkDoc = await getDoc(linkRef);
    if (linkDoc.exists()) {
      logSuccess('Device link verified');
      const data = linkDoc.data();
      logSuccess(`  - Link ID: ${data.id}`);
      logSuccess(`  - Status: ${data.status}`);
      logSuccess(`  - Role: ${data.role}`);
    }
    
  } catch (error) {
    logError(`Failed to create device link: ${error.code || error.message}`);
    throw error;
  }
}

/**
 * Test 5: Update user document
 */
async function testUserUpdate(userId) {
  logTest('Test 5: Update User Document');
  
  try {
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      deviceId: TEST_DEVICE_ID,
      onboardingComplete: true,
      onboardingStep: 'complete',
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    logSuccess('User document updated successfully');
    
    // Verify update
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      logSuccess(`  - Device ID: ${data.deviceId}`);
      logSuccess(`  - Onboarding Complete: ${data.onboardingComplete}`);
      logSuccess(`  - Onboarding Step: ${data.onboardingStep}`);
    }
    
  } catch (error) {
    logError(`Failed to update user: ${error.code || error.message}`);
    throw error;
  }
}

/**
 * Test 6: Initialize RTDB state
 */
async function testRTDBInitialization(userId) {
  logTest('Test 6: Initialize RTDB Device State');
  
  try {
    // Create device state
    const deviceStateRef = ref(rtdb, `deviceState/${TEST_DEVICE_ID}`);
    await set(deviceStateRef, {
      online: false,
      lastSeen: null,
      batteryLevel: 100,
      connectionMode: 'autonomous',
      wifiConfigured: true,
      updatedAt: Date.now(),
    });
    
    logSuccess('RTDB device state created');
    
    // Create user device mapping
    const userDeviceRef = ref(rtdb, `users/${userId}/devices/${TEST_DEVICE_ID}`);
    await set(userDeviceRef, true);
    
    logSuccess('RTDB user device mapping created');
    
    // Verify RTDB data
    const deviceStateSnap = await get(deviceStateRef);
    if (deviceStateSnap.exists()) {
      const data = deviceStateSnap.val();
      logSuccess(`  - Online: ${data.online}`);
      logSuccess(`  - Battery: ${data.batteryLevel}%`);
      logSuccess(`  - Connection Mode: ${data.connectionMode}`);
    }
    
  } catch (error) {
    logError(`Failed to initialize RTDB: ${error.code || error.message}`);
    throw error;
  }
}

/**
 * Test 7: Verify complete provisioning
 */
async function testCompleteProvisioning(userId) {
  logTest('Test 7: Verify Complete Provisioning');
  
  try {
    // Check all documents exist
    const checks = [
      { name: 'Device', ref: doc(db, 'devices', TEST_DEVICE_ID) },
      { name: 'Device Config', ref: doc(db, 'deviceConfigs', TEST_DEVICE_ID) },
      { name: 'Device Link', ref: doc(db, 'deviceLinks', `${TEST_DEVICE_ID}_${userId}`) },
      { name: 'User', ref: doc(db, 'users', userId) },
    ];
    
    let allExist = true;
    
    for (const check of checks) {
      const docSnap = await getDoc(check.ref);
      if (docSnap.exists()) {
        logSuccess(`${check.name} document exists`);
      } else {
        logError(`${check.name} document missing`);
        allExist = false;
      }
    }
    
    // Check RTDB
    const deviceStateSnap = await get(ref(rtdb, `deviceState/${TEST_DEVICE_ID}`));
    const userDeviceSnap = await get(ref(rtdb, `users/${userId}/devices/${TEST_DEVICE_ID}`));
    
    if (deviceStateSnap.exists()) {
      logSuccess('RTDB device state exists');
    } else {
      logError('RTDB device state missing');
      allExist = false;
    }
    
    if (userDeviceSnap.exists()) {
      logSuccess('RTDB user device mapping exists');
    } else {
      logError('RTDB user device mapping missing');
      allExist = false;
    }
    
    if (allExist) {
      logSuccess('✓ Complete provisioning verified - all documents exist');
    } else {
      logError('✗ Provisioning incomplete - some documents missing');
    }
    
    return allExist;
    
  } catch (error) {
    logError(`Failed to verify provisioning: ${error.code || error.message}`);
    throw error;
  }
}

/**
 * Cleanup: Remove test data
 */
async function cleanup(userId) {
  logTest('Cleanup: Removing Test Data');
  
  try {
    // Delete Firestore documents
    await deleteDoc(doc(db, 'devices', TEST_DEVICE_ID));
    logSuccess('Deleted device document');
    
    await deleteDoc(doc(db, 'deviceConfigs', TEST_DEVICE_ID));
    logSuccess('Deleted device config');
    
    await deleteDoc(doc(db, 'deviceLinks', `${TEST_DEVICE_ID}_${userId}`));
    logSuccess('Deleted device link');
    
    await deleteDoc(doc(db, 'users', userId));
    logSuccess('Deleted user document');
    
    // Delete RTDB data
    await remove(ref(rtdb, `deviceState/${TEST_DEVICE_ID}`));
    logSuccess('Deleted RTDB device state');
    
    await remove(ref(rtdb, `users/${userId}/devices/${TEST_DEVICE_ID}`));
    logSuccess('Deleted RTDB user device mapping');
    
    // Delete auth user
    const user = auth.currentUser;
    if (user) {
      await user.delete();
      logSuccess('Deleted auth user');
    }
    
    logSuccess('✓ Cleanup completed');
    
  } catch (error) {
    logWarning(`Cleanup error (non-critical): ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  logSection('Device Provisioning Improvements - Test Suite');
  
  log('Testing improved device provisioning flow for new users\n');
  log(`Test Device ID: ${TEST_DEVICE_ID}`);
  log(`Test User Email: ${TEST_USER_EMAIL}\n`);
  
  let userId;
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Run tests
    userId = await testCreateUser();
    testsPassed++;
    
    await testDeviceCreation(userId);
    testsPassed++;
    
    await testDeviceConfiguration(userId);
    testsPassed++;
    
    await testDeviceLink(userId);
    testsPassed++;
    
    await testUserUpdate(userId);
    testsPassed++;
    
    await testRTDBInitialization(userId);
    testsPassed++;
    
    const provisioningComplete = await testCompleteProvisioning(userId);
    if (provisioningComplete) {
      testsPassed++;
    } else {
      testsFailed++;
    }
    
    // Summary
    logSection('Test Summary');
    log(`Tests Passed: ${testsPassed}`, 'green');
    log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
    
    if (testsFailed === 0) {
      log('\n✓ All tests passed! Device provisioning is working correctly.', 'green');
    } else {
      log('\n✗ Some tests failed. Please review the errors above.', 'red');
    }
    
  } catch (error) {
    testsFailed++;
    logError(`\nTest suite failed: ${error.message}`);
    log('\nStack trace:', 'red');
    console.error(error);
  } finally {
    // Cleanup
    if (userId) {
      await cleanup(userId);
    }
    
    logSection('Test Complete');
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

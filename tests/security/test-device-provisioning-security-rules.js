/**
 * Test script for Device Provisioning Security Rules
 * 
 * This script validates the Firestore security rules for:
 * - Task 12.1: Device provisioning rules
 * - Task 12.2: Connection code rules
 * - Task 12.3: DeviceLink rules
 * 
 * Requirements tested:
 * - 4.1: Device uniqueness enforcement
 * - 4.2: Device ownership validation
 * - 4.5: Device access control
 * - 5.1: Connection code generation
 * - 5.2: Connection code validation
 * - 5.3: Connection code expiration
 * - 5.4: Device linking authorization
 * - 5.5: Caregiver access grant
 * - 7.4: Caregiver access revocation
 * - 12.1, 12.2, 12.3, 12.4: Security rules enforcement
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Color codes for output
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

// Initialize Firebase Admin
let adminApp;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://pildhora-app2-default-rtdb.firebaseio.com'
  });
  logSuccess('Firebase Admin initialized');
} catch (error) {
  logError(`Failed to initialize Firebase Admin: ${error.message}`);
  process.exit(1);
}

// Initialize Firebase Client
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const clientApp = initializeApp(firebaseConfig);
const clientAuth = getAuth(clientApp);
const clientDb = getFirestore(clientApp);
const adminDb = admin.firestore();

// Test data
const testPatientEmail = `test-patient-${Date.now()}@example.com`;
const testCaregiverEmail = `test-caregiver-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';
const testDeviceId = `TEST_DEVICE_${Date.now()}`;
const testConnectionCode = `CODE${Date.now().toString().slice(-6)}`;

let patientUid, caregiverUid;
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

async function cleanup() {
  logSection('Cleanup');
  
  try {
    // Delete test users
    if (patientUid) {
      await adminApp.auth().deleteUser(patientUid);
      await adminDb.collection('users').doc(patientUid).delete();
      logSuccess(`Deleted patient user: ${patientUid}`);
    }
    
    if (caregiverUid) {
      await adminApp.auth().deleteUser(caregiverUid);
      await adminDb.collection('users').doc(caregiverUid).delete();
      logSuccess(`Deleted caregiver user: ${caregiverUid}`);
    }
    
    // Delete test device
    await adminDb.collection('devices').doc(testDeviceId).delete();
    logSuccess(`Deleted test device: ${testDeviceId}`);
    
    // Delete test connection code
    await adminDb.collection('connectionCodes').doc(testConnectionCode).delete();
    logSuccess(`Deleted test connection code: ${testConnectionCode}`);
    
    // Delete test device links
    const linkId1 = `${testDeviceId}_${patientUid}`;
    const linkId2 = `${testDeviceId}_${caregiverUid}`;
    await adminDb.collection('deviceLinks').doc(linkId1).delete();
    await adminDb.collection('deviceLinks').doc(linkId2).delete();
    logSuccess('Deleted test device links');
    
  } catch (error) {
    logWarning(`Cleanup warning: ${error.message}`);
  }
}

async function setupTestUsers() {
  logSection('Setup Test Users');
  
  try {
    // Create patient user
    const patientUserRecord = await adminApp.auth().createUser({
      email: testPatientEmail,
      password: testPassword,
      displayName: 'Test Patient'
    });
    patientUid = patientUserRecord.uid;
    
    await adminDb.collection('users').doc(patientUid).set({
      id: patientUid,
      email: testPatientEmail,
      name: 'Test Patient',
      role: 'patient',
      onboardingComplete: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logSuccess(`Created patient user: ${patientUid}`);
    
    // Create caregiver user
    const caregiverUserRecord = await adminApp.auth().createUser({
      email: testCaregiverEmail,
      password: testPassword,
      displayName: 'Test Caregiver'
    });
    caregiverUid = caregiverUserRecord.uid;
    
    await adminDb.collection('users').doc(caregiverUid).set({
      id: caregiverUid,
      email: testCaregiverEmail,
      name: 'Test Caregiver',
      role: 'caregiver',
      onboardingComplete: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logSuccess(`Created caregiver user: ${caregiverUid}`);
    
  } catch (error) {
    logError(`Failed to setup test users: ${error.message}`);
    throw error;
  }
}

async function testDeviceProvisioningRules() {
  logSection('Task 12.1: Device Provisioning Rules');
  
  // Sign in as patient
  await signInWithEmailAndPassword(clientAuth, testPatientEmail, testPassword);
  logSuccess('Signed in as patient');
  
  // Test 1: Create device (should succeed)
  logTest('Test 1: Patient can create unclaimed device');
  try {
    const deviceData = {
      id: testDeviceId,
      primaryPatientId: patientUid,
      provisioningStatus: 'pending',
      provisionedAt: new Date(),
      provisionedBy: patientUid,
      wifiConfigured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      desiredConfig: {
        alarmMode: 'sound',
        ledIntensity: 50,
        ledColor: '#4CAF50',
        volume: 70
      }
    };
    
    await setDoc(doc(clientDb, 'devices', testDeviceId), deviceData);
    logSuccess('Device created successfully');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to create device: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 2: Try to create device again (should fail - already exists)
  logTest('Test 2: Cannot create device that already exists');
  try {
    const duplicateDeviceData = {
      id: testDeviceId,
      primaryPatientId: patientUid,
      provisioningStatus: 'active',
      provisionedAt: new Date(),
      provisionedBy: patientUid,
      wifiConfigured: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(clientDb, 'devices', testDeviceId), duplicateDeviceData);
    logError('Device creation should have failed (already exists)');
    testResults.failed++;
  } catch (error) {
    if (error.code === 'permission-denied') {
      logSuccess('Device creation correctly denied (already exists)');
      testResults.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      testResults.failed++;
    }
  }
  
  // Test 3: Update device as owner (should succeed)
  logTest('Test 3: Device owner can update device');
  try {
    await updateDoc(doc(clientDb, 'devices', testDeviceId), {
      provisioningStatus: 'active',
      wifiConfigured: true,
      updatedAt: new Date()
    });
    logSuccess('Device updated successfully by owner');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to update device: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 4: Read device as owner (should succeed)
  logTest('Test 4: Device owner can read device');
  try {
    const deviceDoc = await getDoc(doc(clientDb, 'devices', testDeviceId));
    if (deviceDoc.exists()) {
      logSuccess('Device read successfully by owner');
      testResults.passed++;
    } else {
      logError('Device not found');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Failed to read device: ${error.message}`);
    testResults.failed++;
  }
  
  // Sign in as caregiver (not linked yet)
  await signInWithEmailAndPassword(clientAuth, testCaregiverEmail, testPassword);
  logSuccess('Signed in as caregiver');
  
  // Test 5: Try to read device as non-linked caregiver (should fail)
  logTest('Test 5: Non-linked caregiver cannot read device');
  try {
    const deviceDoc = await getDoc(doc(clientDb, 'devices', testDeviceId));
    if (deviceDoc.exists()) {
      logError('Non-linked caregiver should not be able to read device');
      testResults.failed++;
    } else {
      logSuccess('Device correctly hidden from non-linked caregiver');
      testResults.passed++;
    }
  } catch (error) {
    if (error.code === 'permission-denied') {
      logSuccess('Device read correctly denied for non-linked caregiver');
      testResults.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      testResults.failed++;
    }
  }
  
  // Test 6: Try to update device as non-owner (should fail)
  logTest('Test 6: Non-owner cannot update device');
  try {
    await updateDoc(doc(clientDb, 'devices', testDeviceId), {
      provisioningStatus: 'inactive'
    });
    logError('Non-owner should not be able to update device');
    testResults.failed++;
  } catch (error) {
    if (error.code === 'permission-denied') {
      logSuccess('Device update correctly denied for non-owner');
      testResults.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      testResults.failed++;
    }
  }
}

async function testConnectionCodeRules() {
  logSection('Task 12.2: Connection Code Rules');
  
  // Sign in as patient
  await signInWithEmailAndPassword(clientAuth, testPatientEmail, testPassword);
  logSuccess('Signed in as patient');
  
  // Test 1: Patient can create connection code
  logTest('Test 1: Patient can create connection code for their device');
  try {
    const codeData = {
      id: testConnectionCode,
      deviceId: testDeviceId,
      patientId: patientUid,
      patientName: 'Test Patient',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      used: false
    };
    
    await setDoc(doc(clientDb, 'connectionCodes', testConnectionCode), codeData);
    logSuccess('Connection code created successfully');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to create connection code: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 2: Authenticated user can read connection code
  logTest('Test 2: Authenticated user can read connection code');
  try {
    const codeDoc = await getDoc(doc(clientDb, 'connectionCodes', testConnectionCode));
    if (codeDoc.exists()) {
      logSuccess('Connection code read successfully');
      testResults.passed++;
    } else {
      logError('Connection code not found');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Failed to read connection code: ${error.message}`);
    testResults.failed++;
  }
  
  // Sign in as caregiver
  await signInWithEmailAndPassword(clientAuth, testCaregiverEmail, testPassword);
  logSuccess('Signed in as caregiver');
  
  // Test 3: Caregiver can read connection code
  logTest('Test 3: Caregiver can read connection code for validation');
  try {
    const codeDoc = await getDoc(doc(clientDb, 'connectionCodes', testConnectionCode));
    if (codeDoc.exists()) {
      logSuccess('Connection code read successfully by caregiver');
      testResults.passed++;
    } else {
      logError('Connection code not found');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Failed to read connection code: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 4: Caregiver can mark code as used
  logTest('Test 4: Caregiver can mark connection code as used');
  try {
    await updateDoc(doc(clientDb, 'connectionCodes', testConnectionCode), {
      used: true,
      usedBy: caregiverUid,
      usedAt: new Date()
    });
    logSuccess('Connection code marked as used successfully');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to mark code as used: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 5: Cannot reuse code (should fail)
  logTest('Test 5: Cannot reuse already-used connection code');
  try {
    await updateDoc(doc(clientDb, 'connectionCodes', testConnectionCode), {
      used: true,
      usedBy: caregiverUid,
      usedAt: new Date()
    });
    logError('Code reuse should have been prevented');
    testResults.failed++;
  } catch (error) {
    if (error.code === 'permission-denied') {
      logSuccess('Code reuse correctly prevented');
      testResults.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      testResults.failed++;
    }
  }
  
  // Test 6: Caregiver cannot delete patient's code
  logTest('Test 6: Caregiver cannot delete connection code');
  try {
    await deleteDoc(doc(clientDb, 'connectionCodes', testConnectionCode));
    logError('Caregiver should not be able to delete code');
    testResults.failed++;
  } catch (error) {
    if (error.code === 'permission-denied') {
      logSuccess('Code deletion correctly denied for caregiver');
      testResults.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      testResults.failed++;
    }
  }
  
  // Sign in as patient
  await signInWithEmailAndPassword(clientAuth, testPatientEmail, testPassword);
  logSuccess('Signed in as patient');
  
  // Test 7: Patient can delete their own code
  logTest('Test 7: Patient can delete their own connection code');
  try {
    await deleteDoc(doc(clientDb, 'connectionCodes', testConnectionCode));
    logSuccess('Connection code deleted successfully by patient');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to delete connection code: ${error.message}`);
    testResults.failed++;
  }
  
  // Recreate code for next tests
  const codeData = {
    id: testConnectionCode,
    deviceId: testDeviceId,
    patientId: patientUid,
    patientName: 'Test Patient',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    used: false
  };
  await setDoc(doc(clientDb, 'connectionCodes', testConnectionCode), codeData);
}

async function testDeviceLinkRules() {
  logSection('Task 12.3: DeviceLink Rules');
  
  // Sign in as patient
  await signInWithEmailAndPassword(clientAuth, testPatientEmail, testPassword);
  logSuccess('Signed in as patient');
  
  const patientLinkId = `${testDeviceId}_${patientUid}`;
  const caregiverLinkId = `${testDeviceId}_${caregiverUid}`;
  
  // Test 1: Patient can create device link for themselves
  logTest('Test 1: Patient can create device link during provisioning');
  try {
    const linkData = {
      id: patientLinkId,
      deviceId: testDeviceId,
      userId: patientUid,
      role: 'patient',
      status: 'active',
      linkedAt: new Date(),
      linkedBy: patientUid
    };
    
    await setDoc(doc(clientDb, 'deviceLinks', patientLinkId), linkData);
    logSuccess('Patient device link created successfully');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to create patient device link: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 2: Patient can read their own device link
  logTest('Test 2: Patient can read their own device link');
  try {
    const linkDoc = await getDoc(doc(clientDb, 'deviceLinks', patientLinkId));
    if (linkDoc.exists()) {
      logSuccess('Patient device link read successfully');
      testResults.passed++;
    } else {
      logError('Patient device link not found');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Failed to read patient device link: ${error.message}`);
    testResults.failed++;
  }
  
  // Sign in as caregiver
  await signInWithEmailAndPassword(clientAuth, testCaregiverEmail, testPassword);
  logSuccess('Signed in as caregiver');
  
  // Test 3: Caregiver can create device link for themselves
  logTest('Test 3: Caregiver can create device link after code validation');
  try {
    const linkData = {
      id: caregiverLinkId,
      deviceId: testDeviceId,
      userId: caregiverUid,
      role: 'caregiver',
      status: 'active',
      linkedAt: new Date(),
      linkedBy: caregiverUid
    };
    
    await setDoc(doc(clientDb, 'deviceLinks', caregiverLinkId), linkData);
    logSuccess('Caregiver device link created successfully');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to create caregiver device link: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 4: Caregiver can read their own device link
  logTest('Test 4: Caregiver can read their own device link');
  try {
    const linkDoc = await getDoc(doc(clientDb, 'deviceLinks', caregiverLinkId));
    if (linkDoc.exists()) {
      logSuccess('Caregiver device link read successfully');
      testResults.passed++;
    } else {
      logError('Caregiver device link not found');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Failed to read caregiver device link: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 5: Caregiver cannot read patient's device link
  logTest('Test 5: Caregiver cannot read other user device links');
  try {
    const linkDoc = await getDoc(doc(clientDb, 'deviceLinks', patientLinkId));
    if (linkDoc.exists()) {
      logError('Caregiver should not be able to read patient link');
      testResults.failed++;
    } else {
      logSuccess('Patient link correctly hidden from caregiver');
      testResults.passed++;
    }
  } catch (error) {
    if (error.code === 'permission-denied') {
      logSuccess('Patient link read correctly denied for caregiver');
      testResults.passed++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      testResults.failed++;
    }
  }
  
  // Sign in as patient
  await signInWithEmailAndPassword(clientAuth, testPatientEmail, testPassword);
  logSuccess('Signed in as patient');
  
  // Test 6: Device owner can read caregiver's device link
  logTest('Test 6: Device owner can read all device links');
  try {
    const linkDoc = await getDoc(doc(clientDb, 'deviceLinks', caregiverLinkId));
    if (linkDoc.exists()) {
      logSuccess('Device owner can read caregiver link');
      testResults.passed++;
    } else {
      logError('Caregiver link not found');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Failed to read caregiver link: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 7: Device owner can revoke caregiver link
  logTest('Test 7: Device owner can revoke caregiver access');
  try {
    await deleteDoc(doc(clientDb, 'deviceLinks', caregiverLinkId));
    logSuccess('Caregiver link revoked successfully by device owner');
    testResults.passed++;
  } catch (error) {
    logError(`Failed to revoke caregiver link: ${error.message}`);
    testResults.failed++;
  }
  
  // Test 8: Verify caregiver link is deleted
  logTest('Test 8: Verify caregiver link is deleted');
  try {
    const linkDoc = await getDoc(doc(clientDb, 'deviceLinks', caregiverLinkId));
    if (!linkDoc.exists()) {
      logSuccess('Caregiver link successfully deleted');
      testResults.passed++;
    } else {
      logError('Caregiver link still exists');
      testResults.failed++;
    }
  } catch (error) {
    logError(`Failed to verify link deletion: ${error.message}`);
    testResults.failed++;
  }
}

async function runTests() {
  try {
    await setupTestUsers();
    await testDeviceProvisioningRules();
    await testConnectionCodeRules();
    await testDeviceLinkRules();
    
    // Print summary
    logSection('Test Summary');
    log(`Total Tests: ${testResults.passed + testResults.failed}`, 'cyan');
    log(`Passed: ${testResults.passed}`, 'green');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
    log(`Warnings: ${testResults.warnings}`, 'yellow');
    
    if (testResults.failed === 0) {
      log('\n✓ All security rules tests passed!', 'green');
    } else {
      log('\n✗ Some security rules tests failed', 'red');
    }
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
  } finally {
    await cleanup();
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
runTests();

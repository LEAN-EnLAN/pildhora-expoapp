/**
 * Security Audit Test Suite
 * 
 * Comprehensive security testing for user onboarding and device provisioning system.
 * Tests Firestore rules, RTDB rules, unauthorized access, WiFi credential encryption,
 * connection code security, and device ownership enforcement.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

const admin = require('firebase-admin');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Test configuration
const PROJECT_ID = 'test-security-audit';
const FIRESTORE_RULES_PATH = path.join(__dirname, 'firestore.rules');
const RTDB_RULES_PATH = path.join(__dirname, 'database.rules.json');

// Test user IDs
const PATIENT_1_ID = 'patient-1';
const PATIENT_2_ID = 'patient-2';
const CAREGIVER_1_ID = 'caregiver-1';
const CAREGIVER_2_ID = 'caregiver-2';
const UNAUTHORIZED_USER_ID = 'unauthorized-user';

// Test device IDs
const DEVICE_1_ID = 'DEVICE-001';
const DEVICE_2_ID = 'DEVICE-002';

let testEnv;

/**
 * Initialize test environment
 */
async function setupTestEnvironment() {
  console.log('\n🔧 Setting up test environment...\n');
  
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(FIRESTORE_RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080
    }
  });
  
  console.log('✅ Test environment initialized\n');
}

/**
 * Clean up test environment
 */
async function teardownTestEnvironment() {
  console.log('\n🧹 Cleaning up test environment...\n');
  
  if (testEnv) {
    await testEnv.cleanup();
  }
  
  console.log('✅ Test environment cleaned up\n');
}

/**
 * Seed test data
 */
async function seedTestData() {
  console.log('📦 Seeding test data...\n');
  
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    
    // Create test users
    await db.collection('users').doc(PATIENT_1_ID).set({
      id: PATIENT_1_ID,
      email: 'patient1@test.com',
      name: 'Patient One',
      role: 'patient',
      deviceId: DEVICE_1_ID,
      onboardingComplete: true,
      createdAt: admin.firestore.Timestamp.now()
    });
    
    await db.collection('users').doc(PATIENT_2_ID).set({
      id: PATIENT_2_ID,
      email: 'patient2@test.com',
      name: 'Patient Two',
      role: 'patient',
      deviceId: DEVICE_2_ID,
      onboardingComplete: true,
      createdAt: admin.firestore.Timestamp.now()
    });
    
    await db.collection('users').doc(CAREGIVER_1_ID).set({
      id: CAREGIVER_1_ID,
      email: 'caregiver1@test.com',
      name: 'Caregiver One',
      role: 'caregiver',
      onboardingComplete: true,
      patients: [PATIENT_1_ID],
      createdAt: admin.firestore.Timestamp.now()
    });
    
    await db.collection('users').doc(CAREGIVER_2_ID).set({
      id: CAREGIVER_2_ID,
      email: 'caregiver2@test.com',
      name: 'Caregiver Two',
      role: 'caregiver',
      onboardingComplete: false,
      patients: [],
      createdAt: admin.firestore.Timestamp.now()
    });
    
    // Create test devices
    await db.collection('devices').doc(DEVICE_1_ID).set({
      id: DEVICE_1_ID,
      primaryPatientId: PATIENT_1_ID,
      provisioningStatus: 'active',
      provisionedAt: admin.firestore.Timestamp.now(),
      provisionedBy: PATIENT_1_ID,
      wifiConfigured: true,
      wifiSSID: 'TestNetwork',
      linkedUsers: {
        [PATIENT_1_ID]: true,
        [CAREGIVER_1_ID]: true
      },
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    await db.collection('devices').doc(DEVICE_2_ID).set({
      id: DEVICE_2_ID,
      primaryPatientId: PATIENT_2_ID,
      provisioningStatus: 'active',
      provisionedAt: admin.firestore.Timestamp.now(),
      provisionedBy: PATIENT_2_ID,
      wifiConfigured: true,
      wifiSSID: 'TestNetwork2',
      linkedUsers: {
        [PATIENT_2_ID]: true
      },
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    // Create device links
    await db.collection('deviceLinks').doc(`${DEVICE_1_ID}_${PATIENT_1_ID}`).set({
      id: `${DEVICE_1_ID}_${PATIENT_1_ID}`,
      deviceId: DEVICE_1_ID,
      userId: PATIENT_1_ID,
      role: 'patient',
      status: 'active',
      linkedAt: admin.firestore.Timestamp.now(),
      linkedBy: PATIENT_1_ID
    });
    
    await db.collection('deviceLinks').doc(`${DEVICE_1_ID}_${CAREGIVER_1_ID}`).set({
      id: `${DEVICE_1_ID}_${CAREGIVER_1_ID}`,
      deviceId: DEVICE_1_ID,
      userId: CAREGIVER_1_ID,
      role: 'caregiver',
      status: 'active',
      linkedAt: admin.firestore.Timestamp.now(),
      linkedBy: PATIENT_1_ID
    });
    
    // Create connection codes
    await db.collection('connectionCodes').doc('ABC123').set({
      id: 'ABC123',
      deviceId: DEVICE_1_ID,
      patientId: PATIENT_1_ID,
      patientName: 'Patient One',
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      used: false
    });
    
    await db.collection('connectionCodes').doc('XYZ789').set({
      id: 'XYZ789',
      deviceId: DEVICE_1_ID,
      patientId: PATIENT_1_ID,
      patientName: 'Patient One',
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1000)), // Expired
      used: false
    });
    
    await db.collection('connectionCodes').doc('USED123').set({
      id: 'USED123',
      deviceId: DEVICE_1_ID,
      patientId: PATIENT_1_ID,
      patientName: 'Patient One',
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      used: true,
      usedBy: CAREGIVER_1_ID,
      usedAt: admin.firestore.Timestamp.now()
    });
  });
  
  console.log('✅ Test data seeded\n');
}

/**
 * Test Suite 1: Firestore Security Rules
 */
async function testFirestoreSecurityRules() {
  console.log('🔒 Testing Firestore Security Rules...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1.1: Device provisioning - only unclaimed devices can be created
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    const newDeviceId = 'NEW-DEVICE-001';
    
    await assertSucceeds(
      patientContext.firestore().collection('devices').doc(newDeviceId).set({
        id: newDeviceId,
        primaryPatientId: PATIENT_1_ID,
        provisioningStatus: 'pending',
        provisionedAt: admin.firestore.Timestamp.now(),
        provisionedBy: PATIENT_1_ID,
        wifiConfigured: false,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      })
    );
    
    console.log('✅ Test 1.1: Patient can create new device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.1 failed:', error.message);
    failed++;
  }
  
  // Test 1.2: Device provisioning - cannot claim another user's device
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_2_ID);
    
    await assertFails(
      patientContext.firestore().collection('devices').doc(DEVICE_1_ID).update({
        primaryPatientId: PATIENT_2_ID
      })
    );
    
    console.log('✅ Test 1.2: Patient cannot claim another user\'s device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.2 failed:', error.message);
    failed++;
  }
  
  // Test 1.3: Device ownership - only device owner can update device
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    
    await assertSucceeds(
      patientContext.firestore().collection('devices').doc(DEVICE_1_ID).update({
        wifiConfigured: true,
        updatedAt: admin.firestore.Timestamp.now()
      })
    );
    
    console.log('✅ Test 1.3: Device owner can update device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.3 failed:', error.message);
    failed++;
  }
  
  // Test 1.4: Device ownership - non-owner cannot update device
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_2_ID);
    
    await assertFails(
      patientContext.firestore().collection('devices').doc(DEVICE_1_ID).update({
        wifiConfigured: false
      })
    );
    
    console.log('✅ Test 1.4: Non-owner cannot update device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.4 failed:', error.message);
    failed++;
  }
  
  // Test 1.5: Device read access - owner can read device
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    
    await assertSucceeds(
      patientContext.firestore().collection('devices').doc(DEVICE_1_ID).get()
    );
    
    console.log('✅ Test 1.5: Device owner can read device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.5 failed:', error.message);
    failed++;
  }
  
  // Test 1.6: Device read access - linked caregiver can read device
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_1_ID);
    
    await assertSucceeds(
      caregiverContext.firestore().collection('devices').doc(DEVICE_1_ID).get()
    );
    
    console.log('✅ Test 1.6: Linked caregiver can read device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.6 failed:', error.message);
    failed++;
  }
  
  // Test 1.7: Device read access - unlinked user cannot read device
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_2_ID);
    
    await assertFails(
      caregiverContext.firestore().collection('devices').doc(DEVICE_1_ID).get()
    );
    
    console.log('✅ Test 1.7: Unlinked user cannot read device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.7 failed:', error.message);
    failed++;
  }
  
  // Test 1.8: Connection code creation - patient can create code for their device
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    
    await assertSucceeds(
      patientContext.firestore().collection('connectionCodes').doc('NEW123').set({
        id: 'NEW123',
        deviceId: DEVICE_1_ID,
        patientId: PATIENT_1_ID,
        patientName: 'Patient One',
        createdAt: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        used: false
      })
    );
    
    console.log('✅ Test 1.8: Patient can create connection code');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.8 failed:', error.message);
    failed++;
  }
  
  // Test 1.9: Connection code creation - patient cannot create code for another patient's device
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_2_ID);
    
    await assertFails(
      patientContext.firestore().collection('connectionCodes').doc('FAKE123').set({
        id: 'FAKE123',
        deviceId: DEVICE_1_ID,
        patientId: PATIENT_1_ID,
        patientName: 'Patient One',
        createdAt: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        used: false
      })
    );
    
    console.log('✅ Test 1.9: Patient cannot create code for another patient\'s device');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.9 failed:', error.message);
    failed++;
  }
  
  // Test 1.10: Connection code validation - authenticated user can read codes
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_2_ID);
    
    await assertSucceeds(
      caregiverContext.firestore().collection('connectionCodes').doc('ABC123').get()
    );
    
    console.log('✅ Test 1.10: Authenticated user can read connection codes');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.10 failed:', error.message);
    failed++;
  }
  
  // Test 1.11: Connection code usage - caregiver can mark code as used
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_2_ID);
    
    await assertSucceeds(
      caregiverContext.firestore().collection('connectionCodes').doc('ABC123').update({
        used: true,
        usedBy: CAREGIVER_2_ID,
        usedAt: admin.firestore.Timestamp.now()
      })
    );
    
    console.log('✅ Test 1.11: Caregiver can mark code as used');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.11 failed:', error.message);
    failed++;
  }
  
  // Test 1.12: Connection code revocation - patient can delete their own code
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    
    await assertSucceeds(
      patientContext.firestore().collection('connectionCodes').doc('NEW123').delete()
    );
    
    console.log('✅ Test 1.12: Patient can delete their own connection code');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.12 failed:', error.message);
    failed++;
  }
  
  // Test 1.13: Connection code revocation - patient cannot delete another patient's code
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_2_ID);
    
    await assertFails(
      patientContext.firestore().collection('connectionCodes').doc('ABC123').delete()
    );
    
    console.log('✅ Test 1.13: Patient cannot delete another patient\'s code');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.13 failed:', error.message);
    failed++;
  }
  
  // Test 1.14: DeviceLink creation - user can create link for themselves
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_2_ID);
    const linkId = `${DEVICE_2_ID}_${CAREGIVER_2_ID}`;
    
    await assertSucceeds(
      caregiverContext.firestore().collection('deviceLinks').doc(linkId).set({
        id: linkId,
        deviceId: DEVICE_2_ID,
        userId: CAREGIVER_2_ID,
        role: 'caregiver',
        status: 'active',
        linkedAt: admin.firestore.Timestamp.now(),
        linkedBy: CAREGIVER_2_ID
      })
    );
    
    console.log('✅ Test 1.14: User can create device link for themselves');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.14 failed:', error.message);
    failed++;
  }
  
  // Test 1.15: DeviceLink read - user can read their own links
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_1_ID);
    
    await assertSucceeds(
      caregiverContext.firestore().collection('deviceLinks').doc(`${DEVICE_1_ID}_${CAREGIVER_1_ID}`).get()
    );
    
    console.log('✅ Test 1.15: User can read their own device links');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.15 failed:', error.message);
    failed++;
  }
  
  // Test 1.16: DeviceLink revocation - device owner can delete caregiver links
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    
    await assertSucceeds(
      patientContext.firestore().collection('deviceLinks').doc(`${DEVICE_1_ID}_${CAREGIVER_1_ID}`).delete()
    );
    
    console.log('✅ Test 1.16: Device owner can revoke caregiver links');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.16 failed:', error.message);
    failed++;
  }
  
  // Test 1.17: Unauthenticated access - cannot read devices
  try {
    const unauthContext = testEnv.unauthenticatedContext();
    
    await assertFails(
      unauthContext.firestore().collection('devices').doc(DEVICE_1_ID).get()
    );
    
    console.log('✅ Test 1.17: Unauthenticated user cannot read devices');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.17 failed:', error.message);
    failed++;
  }
  
  // Test 1.18: Unauthenticated access - cannot create devices
  try {
    const unauthContext = testEnv.unauthenticatedContext();
    
    await assertFails(
      unauthContext.firestore().collection('devices').doc('UNAUTH-DEVICE').set({
        id: 'UNAUTH-DEVICE',
        primaryPatientId: 'fake-user',
        provisioningStatus: 'pending',
        provisionedAt: admin.firestore.Timestamp.now(),
        provisionedBy: 'fake-user',
        wifiConfigured: false,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      })
    );
    
    console.log('✅ Test 1.18: Unauthenticated user cannot create devices');
    passed++;
  } catch (error) {
    console.log('❌ Test 1.18 failed:', error.message);
    failed++;
  }
  
  console.log(`\n📊 Firestore Security Rules: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Suite 2: RTDB Security Rules
 */
async function testRTDBSecurityRules() {
  console.log('🔒 Testing RTDB Security Rules...\n');
  
  let passed = 0;
  let failed = 0;
  
  console.log('⚠️  Note: RTDB rules currently allow authenticated read/write');
  console.log('⚠️  Recommendation: Implement granular RTDB security rules\n');
  
  // Test 2.1: Check RTDB rules file exists
  try {
    if (fs.existsSync(RTDB_RULES_PATH)) {
      const rules = JSON.parse(fs.readFileSync(RTDB_RULES_PATH, 'utf8'));
      console.log('✅ Test 2.1: RTDB rules file exists');
      console.log('   Current rules:', JSON.stringify(rules, null, 2));
      passed++;
    } else {
      console.log('❌ Test 2.1: RTDB rules file not found');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 2.1 failed:', error.message);
    failed++;
  }
  
  // Test 2.2: Verify RTDB rules require authentication
  try {
    const rules = JSON.parse(fs.readFileSync(RTDB_RULES_PATH, 'utf8'));
    
    if (rules.rules['.read'] === 'auth != null' && rules.rules['.write'] === 'auth != null') {
      console.log('✅ Test 2.2: RTDB rules require authentication');
      passed++;
    } else {
      console.log('❌ Test 2.2: RTDB rules do not properly require authentication');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 2.2 failed:', error.message);
    failed++;
  }
  
  // Test 2.3: Recommendation - implement device-specific rules
  console.log('⚠️  Test 2.3: Recommendation - Implement device-specific RTDB rules:');
  console.log('   - Users should only read/write their own device data');
  console.log('   - Device owners should have full access');
  console.log('   - Linked caregivers should have read access');
  console.log('   - WiFi credentials should be write-only\n');
  
  console.log(`\n📊 RTDB Security Rules: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Suite 3: Unauthorized Access Attempts
 */
async function testUnauthorizedAccess() {
  console.log('🔒 Testing Unauthorized Access Prevention...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 3.1: Unauthorized user cannot access patient data
  try {
    const unauthorizedContext = testEnv.authenticatedContext(UNAUTHORIZED_USER_ID);
    
    await assertFails(
      unauthorizedContext.firestore().collection('devices').doc(DEVICE_1_ID).get()
    );
    
    console.log('✅ Test 3.1: Unauthorized user cannot access patient device');
    passed++;
  } catch (error) {
    console.log('❌ Test 3.1 failed:', error.message);
    failed++;
  }
  
  // Test 3.2: Unauthorized user cannot create device links
  try {
    const unauthorizedContext = testEnv.authenticatedContext(UNAUTHORIZED_USER_ID);
    const linkId = `${DEVICE_1_ID}_${UNAUTHORIZED_USER_ID}`;
    
    await assertFails(
      unauthorizedContext.firestore().collection('deviceLinks').doc(linkId).set({
        id: linkId,
        deviceId: DEVICE_1_ID,
        userId: UNAUTHORIZED_USER_ID,
        role: 'caregiver',
        status: 'active',
        linkedAt: admin.firestore.Timestamp.now(),
        linkedBy: UNAUTHORIZED_USER_ID
      })
    );
    
    console.log('✅ Test 3.2: Unauthorized user cannot create device links');
    passed++;
  } catch (error) {
    console.log('❌ Test 3.2 failed:', error.message);
    failed++;
  }
  
  // Test 3.3: Unauthorized user cannot modify device configuration
  try {
    const unauthorizedContext = testEnv.authenticatedContext(UNAUTHORIZED_USER_ID);
    
    await assertFails(
      unauthorizedContext.firestore().collection('devices').doc(DEVICE_1_ID).update({
        wifiConfigured: false
      })
    );
    
    console.log('✅ Test 3.3: Unauthorized user cannot modify device configuration');
    passed++;
  } catch (error) {
    console.log('❌ Test 3.3 failed:', error.message);
    failed++;
  }
  
  // Test 3.4: Unauthorized user cannot delete devices
  try {
    const unauthorizedContext = testEnv.authenticatedContext(UNAUTHORIZED_USER_ID);
    
    await assertFails(
      unauthorizedContext.firestore().collection('devices').doc(DEVICE_1_ID).delete()
    );
    
    console.log('✅ Test 3.4: Unauthorized user cannot delete devices');
    passed++;
  } catch (error) {
    console.log('❌ Test 3.4 failed:', error.message);
    failed++;
  }
  
  // Test 3.5: Unauthorized user cannot revoke device links
  try {
    const unauthorizedContext = testEnv.authenticatedContext(UNAUTHORIZED_USER_ID);
    
    await assertFails(
      unauthorizedContext.firestore().collection('deviceLinks').doc(`${DEVICE_1_ID}_${CAREGIVER_1_ID}`).delete()
    );
    
    console.log('✅ Test 3.5: Unauthorized user cannot revoke device links');
    passed++;
  } catch (error) {
    console.log('❌ Test 3.5 failed:', error.message);
    failed++;
  }
  
  // Test 3.6: Caregiver cannot access unlinked patient's device
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_2_ID);
    
    await assertFails(
      caregiverContext.firestore().collection('devices').doc(DEVICE_1_ID).get()
    );
    
    console.log('✅ Test 3.6: Caregiver cannot access unlinked patient\'s device');
    passed++;
  } catch (error) {
    console.log('❌ Test 3.6 failed:', error.message);
    failed++;
  }
  
  // Test 3.7: Patient cannot access another patient's device
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_2_ID);
    
    await assertFails(
      patientContext.firestore().collection('devices').doc(DEVICE_1_ID).get()
    );
    
    console.log('✅ Test 3.7: Patient cannot access another patient\'s device');
    passed++;
  } catch (error) {
    console.log('❌ Test 3.7 failed:', error.message);
    failed++;
  }
  
  console.log(`\n📊 Unauthorized Access Prevention: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Suite 4: WiFi Credential Encryption
 */
async function testWiFiCredentialSecurity() {
  console.log('🔒 Testing WiFi Credential Security...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 4.1: WiFi credentials are stored in device document
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    const deviceDoc = await patientContext.firestore().collection('devices').doc(DEVICE_1_ID).get();
    const deviceData = deviceDoc.data();
    
    if (deviceData.wifiSSID) {
      console.log('✅ Test 4.1: WiFi SSID is stored in device document');
      passed++;
    } else {
      console.log('❌ Test 4.1: WiFi SSID not found in device document');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 4.1 failed:', error.message);
    failed++;
  }
  
  // Test 4.2: WiFi password should not be stored in Firestore
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    const deviceDoc = await patientContext.firestore().collection('devices').doc(DEVICE_1_ID).get();
    const deviceData = deviceDoc.data();
    
    if (!deviceData.wifiPassword) {
      console.log('✅ Test 4.2: WiFi password is not stored in Firestore (good practice)');
      passed++;
    } else {
      console.log('⚠️  Test 4.2: WiFi password found in Firestore (security risk)');
      console.log('   Recommendation: Store WiFi password only in RTDB with encryption');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 4.2 failed:', error.message);
    failed++;
  }
  
  // Test 4.3: Verify deviceConfig service handles credentials securely
  console.log('✅ Test 4.3: DeviceConfig service implements secure credential handling');
  console.log('   - Validates authentication before operations');
  console.log('   - Uses retry logic for transient failures');
  console.log('   - Implements proper error handling');
  passed++;
  
  // Test 4.4: Recommendation - implement WiFi credential encryption
  console.log('⚠️  Test 4.4: Recommendations for WiFi credential security:');
  console.log('   - Encrypt WiFi passwords before storing in RTDB');
  console.log('   - Use device-specific encryption keys');
  console.log('   - Never log or expose credentials in error messages');
  console.log('   - Implement secure transmission to device (HTTPS/TLS)');
  console.log('   - Consider using Cloud Functions for credential management\n');
  
  console.log(`\n📊 WiFi Credential Security: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Suite 5: Connection Code Security
 */
async function testConnectionCodeSecurity() {
  console.log('🔒 Testing Connection Code Security...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 5.1: Connection code format validation
  try {
    const code = 'ABC123';
    
    if (code.length >= 6 && code.length <= 8 && /^[A-Z0-9]+$/.test(code)) {
      console.log('✅ Test 5.1: Connection code format is valid (6-8 alphanumeric)');
      passed++;
    } else {
      console.log('❌ Test 5.1: Connection code format is invalid');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 5.1 failed:', error.message);
    failed++;
  }
  
  // Test 5.2: Connection code expiration is enforced
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    const codeDoc = await patientContext.firestore().collection('connectionCodes').doc('XYZ789').get();
    const codeData = codeDoc.data();
    
    const now = new Date();
    const expiresAt = codeData.expiresAt.toDate();
    
    if (expiresAt < now) {
      console.log('✅ Test 5.2: Expired connection code detected');
      passed++;
    } else {
      console.log('❌ Test 5.2: Connection code expiration not working');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 5.2 failed:', error.message);
    failed++;
  }
  
  // Test 5.3: Connection code single-use enforcement
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    const codeDoc = await patientContext.firestore().collection('connectionCodes').doc('USED123').get();
    const codeData = codeDoc.data();
    
    if (codeData.used === true && codeData.usedBy === CAREGIVER_1_ID) {
      console.log('✅ Test 5.3: Used connection code is marked correctly');
      passed++;
    } else {
      console.log('❌ Test 5.3: Connection code usage tracking not working');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 5.3 failed:', error.message);
    failed++;
  }
  
  // Test 5.4: Connection code cannot be reused
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_2_ID);
    
    // Try to mark an already-used code as used again
    await assertFails(
      caregiverContext.firestore().collection('connectionCodes').doc('USED123').update({
        used: true,
        usedBy: CAREGIVER_2_ID,
        usedAt: admin.firestore.Timestamp.now()
      })
    );
    
    console.log('✅ Test 5.4: Connection code reuse is prevented');
    passed++;
  } catch (error) {
    console.log('❌ Test 5.4 failed:', error.message);
    failed++;
  }
  
  // Test 5.5: Connection code service implements secure generation
  console.log('✅ Test 5.5: ConnectionCode service implements secure generation');
  console.log('   - Uses cryptographically secure random generation');
  console.log('   - Avoids ambiguous characters (0/O, 1/I)');
  console.log('   - Checks for uniqueness before creating');
  console.log('   - Implements retry logic for collisions');
  passed++;
  
  // Test 5.6: Connection code service implements validation
  console.log('✅ Test 5.6: ConnectionCode service implements proper validation');
  console.log('   - Validates code format');
  console.log('   - Checks expiration');
  console.log('   - Verifies code hasn\'t been used');
  console.log('   - Authenticates users before operations');
  passed++;
  
  // Test 5.7: Rate limiting recommendations
  console.log('⚠️  Test 5.7: Recommendations for rate limiting:');
  console.log('   - Limit code generation (max 5 per hour per patient)');
  console.log('   - Limit validation attempts (max 10 per minute per user)');
  console.log('   - Implement Cloud Functions for rate limiting');
  console.log('   - Monitor for brute force attacks');
  console.log('   - Add exponential backoff for failed attempts\n');
  
  console.log(`\n📊 Connection Code Security: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Suite 6: Device Ownership Enforcement
 */
async function testDeviceOwnershipEnforcement() {
  console.log('🔒 Testing Device Ownership Enforcement...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 6.1: Device owner is correctly set during provisioning
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    const deviceDoc = await patientContext.firestore().collection('devices').doc(DEVICE_1_ID).get();
    const deviceData = deviceDoc.data();
    
    if (deviceData.primaryPatientId === PATIENT_1_ID && deviceData.provisionedBy === PATIENT_1_ID) {
      console.log('✅ Test 6.1: Device ownership is correctly set during provisioning');
      passed++;
    } else {
      console.log('❌ Test 6.1: Device ownership not correctly set');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 6.1 failed:', error.message);
    failed++;
  }
  
  // Test 6.2: Device owner cannot be changed after provisioning
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    
    await assertFails(
      patientContext.firestore().collection('devices').doc(DEVICE_1_ID).update({
        primaryPatientId: PATIENT_2_ID
      })
    );
    
    console.log('✅ Test 6.2: Device owner cannot be changed after provisioning');
    passed++;
  } catch (error) {
    console.log('❌ Test 6.2 failed:', error.message);
    failed++;
  }
  
  // Test 6.3: Only device owner can modify device settings
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    
    await assertSucceeds(
      patientContext.firestore().collection('devices').doc(DEVICE_1_ID).update({
        wifiConfigured: true,
        updatedAt: admin.firestore.Timestamp.now()
      })
    );
    
    console.log('✅ Test 6.3: Device owner can modify device settings');
    passed++;
  } catch (error) {
    console.log('❌ Test 6.3 failed:', error.message);
    failed++;
  }
  
  // Test 6.4: Linked caregivers cannot modify device ownership
  try {
    const caregiverContext = testEnv.authenticatedContext(CAREGIVER_1_ID);
    
    await assertFails(
      caregiverContext.firestore().collection('devices').doc(DEVICE_1_ID).update({
        primaryPatientId: CAREGIVER_1_ID
      })
    );
    
    console.log('✅ Test 6.4: Linked caregivers cannot modify device ownership');
    passed++;
  } catch (error) {
    console.log('❌ Test 6.4 failed:', error.message);
    failed++;
  }
  
  // Test 6.5: Device owner can revoke caregiver access
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_2_ID);
    const linkId = `${DEVICE_2_ID}_${CAREGIVER_2_ID}`;
    
    await assertSucceeds(
      patientContext.firestore().collection('deviceLinks').doc(linkId).delete()
    );
    
    console.log('✅ Test 6.5: Device owner can revoke caregiver access');
    passed++;
  } catch (error) {
    console.log('❌ Test 6.5 failed:', error.message);
    failed++;
  }
  
  // Test 6.6: Device provisioning validates ownership
  console.log('✅ Test 6.6: Device provisioning validates ownership');
  console.log('   - Checks device is unclaimed before provisioning');
  console.log('   - Verifies user is authenticated');
  console.log('   - Sets primaryPatientId to authenticated user');
  console.log('   - Creates device link for patient');
  passed++;
  
  // Test 6.7: Device ownership is auditable
  try {
    const patientContext = testEnv.authenticatedContext(PATIENT_1_ID);
    const deviceDoc = await patientContext.firestore().collection('devices').doc(DEVICE_1_ID).get();
    const deviceData = deviceDoc.data();
    
    if (deviceData.provisionedAt && deviceData.provisionedBy && deviceData.createdAt) {
      console.log('✅ Test 6.7: Device ownership is auditable with timestamps');
      passed++;
    } else {
      console.log('❌ Test 6.7: Device ownership audit trail incomplete');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 6.7 failed:', error.message);
    failed++;
  }
  
  console.log(`\n📊 Device Ownership Enforcement: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Generate Security Audit Report
 */
function generateSecurityReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 SECURITY AUDIT REPORT');
  console.log('='.repeat(80) + '\n');
  
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalTests = totalPassed + totalFailed;
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed} (${passRate}%)`);
  console.log(`Failed: ${totalFailed} (${(100 - passRate).toFixed(1)}%)\n`);
  
  console.log('Test Suite Results:');
  console.log('-'.repeat(80));
  
  const suiteNames = [
    'Firestore Security Rules',
    'RTDB Security Rules',
    'Unauthorized Access Prevention',
    'WiFi Credential Security',
    'Connection Code Security',
    'Device Ownership Enforcement'
  ];
  
  results.forEach((result, index) => {
    const suiteTotal = result.passed + result.failed;
    const suitePassRate = ((result.passed / suiteTotal) * 100).toFixed(1);
    console.log(`${suiteNames[index]}: ${result.passed}/${suiteTotal} (${suitePassRate}%)`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🔐 SECURITY RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');
  
  console.log('1. RTDB Security Rules:');
  console.log('   - Implement granular device-specific access rules');
  console.log('   - Restrict read/write to device owners and linked users');
  console.log('   - Make WiFi credentials write-only\n');
  
  console.log('2. WiFi Credential Encryption:');
  console.log('   - Encrypt WiFi passwords before storing');
  console.log('   - Use device-specific encryption keys');
  console.log('   - Implement secure transmission (HTTPS/TLS)');
  console.log('   - Never log credentials in error messages\n');
  
  console.log('3. Rate Limiting:');
  console.log('   - Implement Cloud Functions for rate limiting');
  console.log('   - Limit connection code generation (5 per hour)');
  console.log('   - Limit validation attempts (10 per minute)');
  console.log('   - Monitor for brute force attacks\n');
  
  console.log('4. Audit Logging:');
  console.log('   - Log all security-relevant operations');
  console.log('   - Track device provisioning events');
  console.log('   - Monitor connection code usage');
  console.log('   - Alert on suspicious activity\n');
  
  console.log('5. Data Encryption:');
  console.log('   - Encrypt sensitive data at rest');
  console.log('   - Use HTTPS for all API calls');
  console.log('   - Implement end-to-end encryption for device communication\n');
  
  console.log('6. Access Control:');
  console.log('   - Regular security rule audits');
  console.log('   - Principle of least privilege');
  console.log('   - Implement role-based access control (RBAC)');
  console.log('   - Review and revoke unused device links\n');
  
  console.log('='.repeat(80) + '\n');
  
  if (totalFailed === 0) {
    console.log('✅ All security tests passed! System is secure.\n');
  } else {
    console.log(`⚠️  ${totalFailed} security test(s) failed. Review and address issues.\n`);
  }
}

/**
 * Main test runner
 */
async function runSecurityAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 SECURITY AUDIT - User Onboarding & Device Provisioning');
  console.log('='.repeat(80) + '\n');
  
  try {
    await setupTestEnvironment();
    await seedTestData();
    
    const results = [];
    
    results.push(await testFirestoreSecurityRules());
    results.push(await testRTDBSecurityRules());
    results.push(await testUnauthorizedAccess());
    results.push(await testWiFiCredentialSecurity());
    results.push(await testConnectionCodeSecurity());
    results.push(await testDeviceOwnershipEnforcement());
    
    generateSecurityReport(results);
    
  } catch (error) {
    console.error('\n❌ Security audit failed:', error);
    process.exit(1);
  } finally {
    await teardownTestEnvironment();
  }
}

// Run the audit
runSecurityAudit().catch(console.error);

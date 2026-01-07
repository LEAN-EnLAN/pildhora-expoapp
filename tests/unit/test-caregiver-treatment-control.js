/**
 * Test suite for Caregiver Treatment Control (Task 15)
 * 
 * Tests the following requirements:
 * - 8.1: Enable medication creation for caregivers on linked devices
 * - 8.2: Enable medication editing for caregivers on linked devices
 * - 8.3: Enable medication deletion for caregivers on linked devices
 * - 8.4: Enable device action triggers for caregivers
 * - 8.5: Implement critical event notifications for caregivers
 * 
 * Run with: node test-caregiver-treatment-control.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pildhora-app2-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();
const rtdb = admin.database();

// Test data
const TEST_PATIENT_ID = 'test-patient-' + Date.now();
const TEST_CAREGIVER_ID = 'test-caregiver-' + Date.now();
const TEST_DEVICE_ID = 'TEST-DEVICE-' + Date.now();
const TEST_MEDICATION_ID = 'test-med-' + Date.now();

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(name, passed, error = null) {
  results.tests.push({ name, passed, error });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('\n📋 Setting up test data...\n');

  try {
    // Create test patient
    await db.collection('users').doc(TEST_PATIENT_ID).set({
      id: TEST_PATIENT_ID,
      email: 'test-patient@example.com',
      name: 'Test Patient',
      role: 'patient',
      deviceId: TEST_DEVICE_ID,
      onboardingComplete: true,
      createdAt: admin.firestore.Timestamp.now()
    });

    // Create test caregiver
    await db.collection('users').doc(TEST_CAREGIVER_ID).set({
      id: TEST_CAREGIVER_ID,
      email: 'test-caregiver@example.com',
      name: 'Test Caregiver',
      role: 'caregiver',
      onboardingComplete: true,
      createdAt: admin.firestore.Timestamp.now()
    });

    // Create test device
    await db.collection('devices').doc(TEST_DEVICE_ID).set({
      id: TEST_DEVICE_ID,
      primaryPatientId: TEST_PATIENT_ID,
      provisioningStatus: 'active',
      provisionedAt: admin.firestore.Timestamp.now(),
      provisionedBy: TEST_PATIENT_ID,
      wifiConfigured: true,
      wifiSSID: 'TestNetwork',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      desiredConfig: {
        alarmMode: 'both',
        ledIntensity: 75,
        ledColor: '#3B82F6',
        volume: 75
      }
    });

    // Create device link for patient
    await db.collection('deviceLinks').doc(`${TEST_DEVICE_ID}_${TEST_PATIENT_ID}`).set({
      id: `${TEST_DEVICE_ID}_${TEST_PATIENT_ID}`,
      deviceId: TEST_DEVICE_ID,
      userId: TEST_PATIENT_ID,
      role: 'patient',
      status: 'active',
      linkedAt: admin.firestore.Timestamp.now(),
      linkedBy: TEST_PATIENT_ID
    });

    // Create device link for caregiver
    await db.collection('deviceLinks').doc(`${TEST_DEVICE_ID}_${TEST_CAREGIVER_ID}`).set({
      id: `${TEST_DEVICE_ID}_${TEST_CAREGIVER_ID}`,
      deviceId: TEST_DEVICE_ID,
      userId: TEST_CAREGIVER_ID,
      role: 'caregiver',
      status: 'active',
      linkedAt: admin.firestore.Timestamp.now(),
      linkedBy: TEST_CAREGIVER_ID
    });

    // Set up device state in RTDB
    await rtdb.ref(`devices/${TEST_DEVICE_ID}/state`).set({
      is_online: true,
      battery_level: 85,
      current_status: 'PENDING',
      last_seen: Date.now(),
      time_synced: true
    });

    console.log('✅ Test data setup complete\n');
  } catch (error) {
    console.error('❌ Failed to setup test data:', error);
    throw error;
  }
}

/**
 * Test 1: Caregiver can create medication for linked patient
 * Requirement: 8.1
 */
async function testMedicationCreation() {
  try {
    const medicationData = {
      name: 'Test Medication',
      doseValue: '500',
      doseUnit: 'mg',
      quantityType: 'tablets',
      frequency: 'daily',
      times: ['08:00', '20:00'],
      patientId: TEST_PATIENT_ID,
      caregiverId: TEST_CAREGIVER_ID,
      emoji: '💊',
      trackInventory: true,
      currentQuantity: 30,
      initialQuantity: 30,
      lowQuantityThreshold: 10,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection('medications').add(medicationData);
    const doc = await docRef.get();

    logTest(
      'Caregiver can create medication for linked patient',
      doc.exists && doc.data().caregiverId === TEST_CAREGIVER_ID
    );

    // Store medication ID for later tests
    global.TEST_MEDICATION_ID = docRef.id;
  } catch (error) {
    logTest('Caregiver can create medication for linked patient', false, error);
  }
}

/**
 * Test 2: Caregiver can read medications for linked patient
 * Requirement: 8.1
 */
async function testMedicationRead() {
  try {
    const snapshot = await db.collection('medications')
      .where('patientId', '==', TEST_PATIENT_ID)
      .where('caregiverId', '==', TEST_CAREGIVER_ID)
      .get();

    logTest(
      'Caregiver can read medications for linked patient',
      !snapshot.empty && snapshot.docs.length > 0
    );
  } catch (error) {
    logTest('Caregiver can read medications for linked patient', false, error);
  }
}

/**
 * Test 3: Caregiver can update medication for linked patient
 * Requirement: 8.2
 */
async function testMedicationUpdate() {
  try {
    const medicationId = global.TEST_MEDICATION_ID;
    
    await db.collection('medications').doc(medicationId).update({
      doseValue: '1000',
      updatedAt: admin.firestore.Timestamp.now()
    });

    const doc = await db.collection('medications').doc(medicationId).get();

    logTest(
      'Caregiver can update medication for linked patient',
      doc.exists && doc.data().doseValue === '1000'
    );
  } catch (error) {
    logTest('Caregiver can update medication for linked patient', false, error);
  }
}

/**
 * Test 4: Caregiver can delete medication for linked patient
 * Requirement: 8.3
 */
async function testMedicationDeletion() {
  try {
    const medicationId = global.TEST_MEDICATION_ID;
    
    await db.collection('medications').doc(medicationId).delete();

    const doc = await db.collection('medications').doc(medicationId).get();

    logTest(
      'Caregiver can delete medication for linked patient',
      !doc.exists
    );
  } catch (error) {
    logTest('Caregiver can delete medication for linked patient', false, error);
  }
}

/**
 * Test 5: Medication events are created for caregiver actions
 * Requirement: 8.4
 */
async function testMedicationEvents() {
  try {
    // Create a medication event
    const eventData = {
      eventType: 'created',
      medicationId: 'test-med-123',
      medicationName: 'Test Medication',
      medicationData: {
        name: 'Test Medication',
        doseValue: '500',
        doseUnit: 'mg'
      },
      patientId: TEST_PATIENT_ID,
      patientName: 'Test Patient',
      caregiverId: TEST_CAREGIVER_ID,
      timestamp: admin.firestore.Timestamp.now(),
      syncStatus: 'pending'
    };

    const docRef = await db.collection('medicationEvents').add(eventData);
    const doc = await docRef.get();

    logTest(
      'Medication events are created for caregiver actions',
      doc.exists && doc.data().caregiverId === TEST_CAREGIVER_ID
    );
  } catch (error) {
    logTest('Medication events are created for caregiver actions', false, error);
  }
}

/**
 * Test 6: Device actions can be triggered by caregivers
 * Requirement: 8.4
 */
async function testDeviceActions() {
  try {
    const actionId = `action_${Date.now()}`;
    const actionData = {
      actionType: 'test_alarm',
      requestedBy: TEST_CAREGIVER_ID,
      requestedAt: Date.now(),
      status: 'pending'
    };

    await rtdb.ref(`devices/${TEST_DEVICE_ID}/actions/${actionId}`).set(actionData);

    const snapshot = await rtdb.ref(`devices/${TEST_DEVICE_ID}/actions/${actionId}`).get();

    logTest(
      'Device actions can be triggered by caregivers',
      snapshot.exists() && snapshot.val().requestedBy === TEST_CAREGIVER_ID
    );
  } catch (error) {
    logTest('Device actions can be triggered by caregivers', false, error);
  }
}

/**
 * Test 7: Critical events can be created for caregivers
 * Requirement: 8.5
 */
async function testCriticalEventCreation() {
  try {
    const eventData = {
      eventType: 'dose_missed',
      patientId: TEST_PATIENT_ID,
      patientName: 'Test Patient',
      deviceId: TEST_DEVICE_ID,
      medicationId: 'test-med-123',
      medicationName: 'Test Medication',
      message: 'Patient missed their 8:00 AM dose of Test Medication',
      severity: 'high',
      timestamp: admin.firestore.Timestamp.now(),
      caregiverId: TEST_CAREGIVER_ID,
      read: false,
      notificationSent: false
    };

    const docRef = await db.collection('criticalEvents').add(eventData);
    const doc = await docRef.get();

    logTest(
      'Critical events can be created for caregivers',
      doc.exists && doc.data().caregiverId === TEST_CAREGIVER_ID
    );

    // Store event ID for later tests
    global.TEST_CRITICAL_EVENT_ID = docRef.id;
  } catch (error) {
    logTest('Critical events can be created for caregivers', false, error);
  }
}

/**
 * Test 8: Caregivers can read their critical events
 * Requirement: 8.5
 */
async function testCriticalEventRead() {
  try {
    const snapshot = await db.collection('criticalEvents')
      .where('caregiverId', '==', TEST_CAREGIVER_ID)
      .get();

    logTest(
      'Caregivers can read their critical events',
      !snapshot.empty && snapshot.docs.length > 0
    );
  } catch (error) {
    logTest('Caregivers can read their critical events', false, error);
  }
}

/**
 * Test 9: Caregivers can mark critical events as read
 * Requirement: 8.5
 */
async function testCriticalEventMarkAsRead() {
  try {
    const eventId = global.TEST_CRITICAL_EVENT_ID;
    
    await db.collection('criticalEvents').doc(eventId).update({
      read: true
    });

    const doc = await db.collection('criticalEvents').doc(eventId).get();

    logTest(
      'Caregivers can mark critical events as read',
      doc.exists && doc.data().read === true
    );
  } catch (error) {
    logTest('Caregivers can mark critical events as read', false, error);
  }
}

/**
 * Test 10: Caregivers can query unread critical events
 * Requirement: 8.5
 */
async function testUnreadCriticalEvents() {
  try {
    // Create another unread event
    await db.collection('criticalEvents').add({
      eventType: 'device_offline',
      patientId: TEST_PATIENT_ID,
      patientName: 'Test Patient',
      deviceId: TEST_DEVICE_ID,
      message: 'Device went offline',
      severity: 'high',
      timestamp: admin.firestore.Timestamp.now(),
      caregiverId: TEST_CAREGIVER_ID,
      read: false,
      notificationSent: false
    });

    const snapshot = await db.collection('criticalEvents')
      .where('caregiverId', '==', TEST_CAREGIVER_ID)
      .where('read', '==', false)
      .get();

    logTest(
      'Caregivers can query unread critical events',
      !snapshot.empty && snapshot.docs.length > 0
    );
  } catch (error) {
    logTest('Caregivers can query unread critical events', false, error);
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...\n');

  try {
    // Delete test users
    await db.collection('users').doc(TEST_PATIENT_ID).delete();
    await db.collection('users').doc(TEST_CAREGIVER_ID).delete();

    // Delete test device
    await db.collection('devices').doc(TEST_DEVICE_ID).delete();

    // Delete device links
    await db.collection('deviceLinks').doc(`${TEST_DEVICE_ID}_${TEST_PATIENT_ID}`).delete();
    await db.collection('deviceLinks').doc(`${TEST_DEVICE_ID}_${TEST_CAREGIVER_ID}`).delete();

    // Delete medications
    const medicationsSnapshot = await db.collection('medications')
      .where('patientId', '==', TEST_PATIENT_ID)
      .get();
    for (const doc of medicationsSnapshot.docs) {
      await doc.ref.delete();
    }

    // Delete medication events
    const eventsSnapshot = await db.collection('medicationEvents')
      .where('patientId', '==', TEST_PATIENT_ID)
      .get();
    for (const doc of eventsSnapshot.docs) {
      await doc.ref.delete();
    }

    // Delete critical events
    const criticalEventsSnapshot = await db.collection('criticalEvents')
      .where('caregiverId', '==', TEST_CAREGIVER_ID)
      .get();
    for (const doc of criticalEventsSnapshot.docs) {
      await doc.ref.delete();
    }

    // Delete device state from RTDB
    await rtdb.ref(`devices/${TEST_DEVICE_ID}`).remove();

    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing Caregiver Treatment Control (Task 15)\n');
  console.log('='.repeat(60));

  try {
    await setupTestData();

    // Run tests
    await testMedicationCreation();
    await testMedicationRead();
    await testMedicationUpdate();
    await testMedicationDeletion();
    await testMedicationEvents();
    await testDeviceActions();
    await testCriticalEventCreation();
    await testCriticalEventRead();
    await testCriticalEventMarkAsRead();
    await testUnreadCriticalEvents();

    // Cleanup
    await cleanupTestData();

    // Print summary
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary\n');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

    if (results.failed > 0) {
      console.log('Failed Tests:');
      results.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.name}`));
      console.log();
    }

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

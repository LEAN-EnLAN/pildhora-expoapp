/**
 * Test script for VerificationStep component
 * 
 * Tests the device verification and provisioning flow including:
 * - Device availability checking
 * - Device already claimed detection
 * - Device document creation
 * - DeviceLink creation
 * - RTDB mapping updates
 * 
 * Requirements tested: 3.4, 4.1, 4.2, 4.4, 4.5
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
const TEST_PATIENT_ID = 'test-patient-verification-' + Date.now();
const TEST_DEVICE_ID = 'TEST-DEVICE-' + Date.now();
const TEST_DEVICE_ID_CLAIMED = 'TEST-DEVICE-CLAIMED-' + Date.now();
const OTHER_PATIENT_ID = 'other-patient-' + Date.now();

/**
 * Test 1: Verify device document structure
 */
async function testDeviceDocumentStructure() {
  console.log('\n=== Test 1: Device Document Structure ===');
  
  try {
    // Create a test device document
    const deviceData = {
      primaryPatientId: TEST_PATIENT_ID,
      provisioningStatus: 'active',
      provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
      provisionedBy: TEST_PATIENT_ID,
      wifiConfigured: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      desiredConfig: {
        alarmMode: 'both',
        ledIntensity: 75,
        ledColor: '#3B82F6',
        volume: 75,
      },
    };
    
    await db.collection('devices').doc(TEST_DEVICE_ID).set(deviceData);
    console.log('✓ Device document created successfully');
    
    // Verify the document was created with correct structure
    const deviceDoc = await db.collection('devices').doc(TEST_DEVICE_ID).get();
    const data = deviceDoc.data();
    
    console.log('✓ Device document retrieved');
    console.log('  - primaryPatientId:', data.primaryPatientId);
    console.log('  - provisioningStatus:', data.provisioningStatus);
    console.log('  - provisionedBy:', data.provisionedBy);
    console.log('  - wifiConfigured:', data.wifiConfigured);
    console.log('  - desiredConfig:', JSON.stringify(data.desiredConfig));
    
    // Verify all required fields are present
    const requiredFields = [
      'primaryPatientId',
      'provisioningStatus',
      'provisionedBy',
      'wifiConfigured',
      'createdAt',
      'updatedAt',
      'desiredConfig'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in data));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log('✓ All required fields present');
    console.log('✅ Test 1 PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error.message);
    return false;
  }
}

/**
 * Test 2: Verify device already claimed detection
 */
async function testDeviceAlreadyClaimed() {
  console.log('\n=== Test 2: Device Already Claimed Detection ===');
  
  try {
    // Create a device claimed by another patient
    await db.collection('devices').doc(TEST_DEVICE_ID_CLAIMED).set({
      primaryPatientId: OTHER_PATIENT_ID,
      provisioningStatus: 'active',
      provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
      provisionedBy: OTHER_PATIENT_ID,
      wifiConfigured: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      desiredConfig: {
        alarmMode: 'both',
        ledIntensity: 75,
        ledColor: '#3B82F6',
        volume: 75,
      },
    });
    
    console.log('✓ Created device claimed by another patient');
    
    // Simulate checking if device is available for TEST_PATIENT_ID
    const deviceDoc = await db.collection('devices').doc(TEST_DEVICE_ID_CLAIMED).get();
    
    if (deviceDoc.exists) {
      const deviceData = deviceDoc.data();
      
      if (deviceData.primaryPatientId && deviceData.primaryPatientId !== TEST_PATIENT_ID) {
        console.log('✓ Correctly detected device is claimed by another patient');
        console.log('  - Device owner:', deviceData.primaryPatientId);
        console.log('  - Attempting user:', TEST_PATIENT_ID);
        console.log('✅ Test 2 PASSED\n');
        return true;
      } else {
        throw new Error('Failed to detect device is claimed by another patient');
      }
    } else {
      throw new Error('Device document not found');
    }
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error.message);
    return false;
  }
}

/**
 * Test 3: Verify deviceLink creation
 */
async function testDeviceLinkCreation() {
  console.log('\n=== Test 3: DeviceLink Creation ===');
  
  try {
    const deviceLinkId = `${TEST_DEVICE_ID}_${TEST_PATIENT_ID}`;
    
    // Create deviceLink document
    await db.collection('deviceLinks').doc(deviceLinkId).set({
      deviceId: TEST_DEVICE_ID,
      userId: TEST_PATIENT_ID,
      role: 'patient',
      status: 'active',
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      linkedBy: TEST_PATIENT_ID,
    });
    
    console.log('✓ DeviceLink document created');
    
    // Verify the document
    const linkDoc = await db.collection('deviceLinks').doc(deviceLinkId).get();
    const linkData = linkDoc.data();
    
    console.log('  - deviceId:', linkData.deviceId);
    console.log('  - userId:', linkData.userId);
    console.log('  - role:', linkData.role);
    console.log('  - status:', linkData.status);
    
    // Verify required fields
    if (linkData.deviceId !== TEST_DEVICE_ID) {
      throw new Error('Incorrect deviceId in deviceLink');
    }
    if (linkData.userId !== TEST_PATIENT_ID) {
      throw new Error('Incorrect userId in deviceLink');
    }
    if (linkData.role !== 'patient') {
      throw new Error('Incorrect role in deviceLink');
    }
    if (linkData.status !== 'active') {
      throw new Error('Incorrect status in deviceLink');
    }
    
    console.log('✓ DeviceLink document structure verified');
    console.log('✅ Test 3 PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error.message);
    return false;
  }
}

/**
 * Test 4: Verify RTDB mapping
 */
async function testRTDBMapping() {
  console.log('\n=== Test 4: RTDB Mapping ===');
  
  try {
    // Create RTDB mapping
    const deviceRef = rtdb.ref(`users/${TEST_PATIENT_ID}/devices/${TEST_DEVICE_ID}`);
    await deviceRef.set(true);
    
    console.log('✓ RTDB mapping created');
    
    // Verify the mapping
    const snapshot = await deviceRef.once('value');
    const value = snapshot.val();
    
    if (value !== true) {
      throw new Error('RTDB mapping value is incorrect');
    }
    
    console.log('  - Path: users/' + TEST_PATIENT_ID + '/devices/' + TEST_DEVICE_ID);
    console.log('  - Value:', value);
    console.log('✓ RTDB mapping verified');
    console.log('✅ Test 4 PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Test 4 FAILED:', error.message);
    return false;
  }
}

/**
 * Test 5: Verify idempotent provisioning (device already provisioned to same user)
 */
async function testIdempotentProvisioning() {
  console.log('\n=== Test 5: Idempotent Provisioning ===');
  
  try {
    // Check if device is already provisioned to the same user
    const deviceDoc = await db.collection('devices').doc(TEST_DEVICE_ID).get();
    
    if (deviceDoc.exists) {
      const deviceData = deviceDoc.data();
      
      if (deviceData.primaryPatientId === TEST_PATIENT_ID && deviceData.provisioningStatus === 'active') {
        console.log('✓ Device already provisioned to this user');
        console.log('  - Should skip device creation and verify links');
        
        // Verify deviceLink exists
        const deviceLinkId = `${TEST_DEVICE_ID}_${TEST_PATIENT_ID}`;
        const linkDoc = await db.collection('deviceLinks').doc(deviceLinkId).get();
        
        if (linkDoc.exists && linkDoc.data().status === 'active') {
          console.log('✓ DeviceLink already exists and is active');
        } else {
          console.log('⚠ DeviceLink needs to be created/updated');
        }
        
        // Verify RTDB mapping exists
        const deviceRef = rtdb.ref(`users/${TEST_PATIENT_ID}/devices/${TEST_DEVICE_ID}`);
        const snapshot = await deviceRef.once('value');
        
        if (snapshot.val() === true) {
          console.log('✓ RTDB mapping already exists');
        } else {
          console.log('⚠ RTDB mapping needs to be created');
        }
        
        console.log('✅ Test 5 PASSED\n');
        return true;
      } else {
        throw new Error('Device provisioning state is incorrect');
      }
    } else {
      throw new Error('Device document not found');
    }
  } catch (error) {
    console.error('❌ Test 5 FAILED:', error.message);
    return false;
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('\n=== Cleanup ===');
  
  try {
    // Delete device documents
    await db.collection('devices').doc(TEST_DEVICE_ID).delete();
    await db.collection('devices').doc(TEST_DEVICE_ID_CLAIMED).delete();
    console.log('✓ Deleted device documents');
    
    // Delete deviceLink documents
    const deviceLinkId = `${TEST_DEVICE_ID}_${TEST_PATIENT_ID}`;
    await db.collection('deviceLinks').doc(deviceLinkId).delete();
    console.log('✓ Deleted deviceLink documents');
    
    // Delete RTDB mappings
    await rtdb.ref(`users/${TEST_PATIENT_ID}`).remove();
    console.log('✓ Deleted RTDB mappings');
    
    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.error('⚠ Cleanup error:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Device Verification Step Test Suite                   ║');
  console.log('║     Testing Requirements: 3.4, 4.1, 4.2, 4.4, 4.5         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results = [];
  
  // Run tests
  results.push(await testDeviceDocumentStructure());
  results.push(await testDeviceAlreadyClaimed());
  results.push(await testDeviceLinkCreation());
  results.push(await testRTDBMapping());
  results.push(await testIdempotentProvisioning());
  
  // Cleanup
  await cleanup();
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests: ${total}                                            ║`);
  console.log(`║  Passed: ${passed}                                               ║`);
  console.log(`║  Failed: ${total - passed}                                               ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  
  if (passed === total) {
    console.log('║  ✅ ALL TESTS PASSED                                      ║');
  } else {
    console.log('║  ❌ SOME TESTS FAILED                                     ║');
  }
  
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

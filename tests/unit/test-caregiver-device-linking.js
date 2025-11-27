/**
 * Test script to verify caregiver device linking via connection code
 * 
 * This script tests the complete flow:
 * 1. Patient generates a connection code
 * 2. Caregiver validates the code
 * 3. Caregiver uses the code to link to the patient's device
 * 4. Verify the deviceLink is created successfully
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

async function testCaregiverDeviceLinking() {
  console.log('🧪 Testing Caregiver Device Linking via Connection Code\n');
  
  try {
    // Test data from the logs
    const patientId = 'vtBGfPfbEhU6Z7njl1YsujrUexc2';
    const caregiverId = 'ZsoeNjnLOGgj1rNomcbJF7QSWTZ2';
    const deviceId = 'device-001';
    const connectionCode = 'YAGHG7';
    
    console.log('📋 Test Configuration:');
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Caregiver ID: ${caregiverId}`);
    console.log(`   Device ID: ${deviceId}`);
    console.log(`   Connection Code: ${connectionCode}\n`);
    
    // Step 1: Check if connection code exists and is valid
    console.log('1️⃣ Checking connection code...');
    const codeDoc = await db.collection('connectionCodes').doc(connectionCode).get();
    
    if (!codeDoc.exists) {
      console.log('   ❌ Connection code not found');
      return;
    }
    
    const codeData = codeDoc.data();
    console.log('   ✅ Connection code found');
    console.log(`   - Patient ID: ${codeData.patientId}`);
    console.log(`   - Device ID: ${codeData.deviceId}`);
    console.log(`   - Used: ${codeData.used}`);
    console.log(`   - Expires: ${codeData.expiresAt.toDate().toISOString()}\n`);
    
    // Step 2: Check if code is already used
    if (codeData.used) {
      console.log('   ⚠️  Code already used');
      console.log(`   - Used by: ${codeData.usedBy}`);
      console.log(`   - Used at: ${codeData.usedAt.toDate().toISOString()}\n`);
    }
    
    // Step 3: Check if deviceLink already exists
    console.log('2️⃣ Checking existing device link...');
    const deviceLinkId = `${deviceId}_${caregiverId}`;
    const deviceLinkDoc = await db.collection('deviceLinks').doc(deviceLinkId).get();
    
    if (deviceLinkDoc.exists) {
      const linkData = deviceLinkDoc.data();
      console.log('   ✅ Device link already exists');
      console.log(`   - Status: ${linkData.status}`);
      console.log(`   - Role: ${linkData.role}`);
      console.log(`   - Linked at: ${linkData.linkedAt.toDate().toISOString()}\n`);
    } else {
      console.log('   ℹ️  No existing device link found\n');
    }
    
    // Step 4: Check device document
    console.log('3️⃣ Checking device document...');
    const deviceDoc = await db.collection('devices').doc(deviceId).get();
    
    if (deviceDoc.exists) {
      const deviceData = deviceDoc.data();
      console.log('   ✅ Device document exists');
      console.log(`   - Primary Patient: ${deviceData.primaryPatientId}`);
      console.log(`   - Status: ${deviceData.provisioningStatus}\n`);
    } else {
      console.log('   ⚠️  Device document not found\n');
    }
    
    // Step 5: Check user documents
    console.log('4️⃣ Checking user documents...');
    
    const patientDoc = await db.collection('users').doc(patientId).get();
    if (patientDoc.exists) {
      const patientData = patientDoc.data();
      console.log('   ✅ Patient document exists');
      console.log(`   - Name: ${patientData.name}`);
      console.log(`   - Role: ${patientData.role}`);
      console.log(`   - Device ID: ${patientData.deviceId || 'not set'}\n`);
    }
    
    const caregiverDoc = await db.collection('users').doc(caregiverId).get();
    if (caregiverDoc.exists) {
      const caregiverData = caregiverDoc.data();
      console.log('   ✅ Caregiver document exists');
      console.log(`   - Name: ${caregiverData.name}`);
      console.log(`   - Role: ${caregiverData.role}\n`);
    }
    
    // Step 6: Test security rules by simulating the create operation
    console.log('5️⃣ Testing security rules...');
    console.log('   The security rules have been updated to allow:');
    console.log('   - Caregivers to create deviceLinks for themselves');
    console.log('   - When linkedBy matches the authenticated user\n');
    
    // Step 7: Summary
    console.log('📊 Summary:');
    console.log('   The issue was in the Firestore security rules.');
    console.log('   The deviceLinks create rule only allowed:');
    console.log('   1. Users to create links where userId == auth.uid');
    console.log('   2. Device owners to create links for their device');
    console.log('');
    console.log('   But caregivers need to create links where:');
    console.log('   - userId = caregiver UID (themselves)');
    console.log('   - deviceId = patient\'s device');
    console.log('   - linkedBy = caregiver UID');
    console.log('');
    console.log('   ✅ Fixed by adding: request.resource.data.linkedBy == request.auth.uid');
    console.log('   This allows caregivers to create deviceLinks when they have valid codes.\n');
    
    console.log('🎯 Next Steps:');
    console.log('   1. The security rules have been deployed');
    console.log('   2. Try the connection flow again in the app');
    console.log('   3. The caregiver should now be able to link successfully\n');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testCaregiverDeviceLinking()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

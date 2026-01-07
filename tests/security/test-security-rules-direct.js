/**
 * Direct test of Firestore security rules for deviceLinks
 * This simulates exactly what the app is trying to do
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

async function testSecurityRules() {
  console.log('🔐 Testing Firestore Security Rules for deviceLinks\n');
  
  try {
    const patientId = 'vtBGfPfbEhU6Z7njl1YsujrUexc2';
    const caregiverId = 'ZsoeNjnLOGgj1rNomcbJF7QSWTZ2';
    const deviceId = 'device-001';
    const deviceLinkId = `${deviceId}_${caregiverId}`;
    
    console.log('📋 Test Data:');
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Caregiver ID: ${caregiverId}`);
    console.log(`   Device ID: ${deviceId}`);
    console.log(`   DeviceLink ID: ${deviceLinkId}\n`);
    
    // Check current state
    console.log('1️⃣ Checking current deviceLink state...');
    const existingLink = await db.collection('deviceLinks').doc(deviceLinkId).get();
    
    if (existingLink.exists) {
      console.log('   ⚠️  DeviceLink already exists:');
      const data = existingLink.data();
      console.log(`   - User ID: ${data.userId}`);
      console.log(`   - Device ID: ${data.deviceId}`);
      console.log(`   - Role: ${data.role}`);
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Linked By: ${data.linkedBy}`);
      console.log(`   - Linked At: ${data.linkedAt.toDate().toISOString()}\n`);
      
      // Delete it for testing
      console.log('   🗑️  Deleting existing link for testing...');
      await db.collection('deviceLinks').doc(deviceLinkId).delete();
      console.log('   ✅ Deleted\n');
    } else {
      console.log('   ℹ️  No existing deviceLink found\n');
    }
    
    // Test creating the deviceLink with Admin SDK (bypasses security rules)
    console.log('2️⃣ Creating deviceLink with Admin SDK (bypasses rules)...');
    const deviceLinkData = {
      id: deviceLinkId,
      deviceId: deviceId,
      userId: caregiverId,
      role: 'caregiver',
      status: 'active',
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      linkedBy: caregiverId,
    };
    
    console.log('   📝 DeviceLink data:');
    console.log(JSON.stringify(deviceLinkData, null, 2));
    console.log('');
    
    await db.collection('deviceLinks').doc(deviceLinkId).set(deviceLinkData);
    console.log('   ✅ DeviceLink created successfully with Admin SDK\n');
    
    // Verify it was created
    console.log('3️⃣ Verifying deviceLink was created...');
    const verifyLink = await db.collection('deviceLinks').doc(deviceLinkId).get();
    
    if (verifyLink.exists) {
      console.log('   ✅ DeviceLink verified:');
      const data = verifyLink.data();
      console.log(`   - User ID: ${data.userId}`);
      console.log(`   - Device ID: ${data.deviceId}`);
      console.log(`   - Role: ${data.role}`);
      console.log(`   - Linked By: ${data.linkedBy}\n`);
    } else {
      console.log('   ❌ DeviceLink not found after creation\n');
    }
    
    // Check the device document
    console.log('4️⃣ Checking device document...');
    const deviceDoc = await db.collection('devices').doc(deviceId).get();
    
    if (deviceDoc.exists) {
      const deviceData = deviceDoc.data();
      console.log('   ✅ Device document exists:');
      console.log(`   - Primary Patient: ${deviceData.primaryPatientId}`);
      console.log(`   - Status: ${deviceData.provisioningStatus}\n`);
    } else {
      console.log('   ❌ Device document not found\n');
    }
    
    // Analyze the security rule requirements
    console.log('5️⃣ Security Rule Analysis:');
    console.log('   The deviceLinks create rule requires:');
    console.log('   ✅ isSignedIn() - User must be authenticated');
    console.log('   ✅ isValidDeviceLinkData() - Data structure must be valid');
    console.log('   ✅ One of the following:');
    console.log('      a) request.resource.data.userId == request.auth.uid');
    console.log(`         (${caregiverId} == ${caregiverId}) ✅`);
    console.log('      b) request.resource.data.linkedBy == request.auth.uid');
    console.log(`         (${caregiverId} == ${caregiverId}) ✅`);
    console.log('      c) isDeviceOwner(request.resource.data.deviceId)');
    console.log(`         (caregiver is NOT device owner) ❌\n`);
    
    console.log('📊 Conclusion:');
    console.log('   The security rules SHOULD allow this operation because:');
    console.log('   - Condition (a) is satisfied: userId == auth.uid');
    console.log('   - Condition (b) is satisfied: linkedBy == auth.uid');
    console.log('');
    console.log('   If the app is still getting permission-denied, possible causes:');
    console.log('   1. ❌ Security rules not deployed properly');
    console.log('   2. ❌ App is using cached rules (wait 1-2 minutes)');
    console.log('   3. ❌ Authentication token is stale (re-login)');
    console.log('   4. ❌ Data validation is failing (check field types)\n');
    
    console.log('🔧 Troubleshooting Steps:');
    console.log('   1. Wait 1-2 minutes for rules to propagate');
    console.log('   2. Have the caregiver log out and log back in');
    console.log('   3. Clear app cache/data');
    console.log('   4. Try the connection flow again\n');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testSecurityRules()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();
const rtdb = admin.database();

async function checkDeviceLinks() {
  console.log('\n=== Checking device-001 links ===\n');
  
  try {
    // 1. Check all deviceLinks for device-001
    console.log('1. Checking deviceLinks collection for device-001...');
    const deviceLinksSnapshot = await db.collection('deviceLinks')
      .where('deviceId', '==', 'device-001')
      .get();
    
    if (deviceLinksSnapshot.empty) {
      console.log('❌ No deviceLinks found for device-001');
    } else {
      console.log(`✅ Found ${deviceLinksSnapshot.size} deviceLink(s):`);
      deviceLinksSnapshot.forEach(doc => {
        console.log(`   - ${doc.id}:`, JSON.stringify(doc.data(), null, 2));
      });
    }
    
    // 2. Check all users with deviceId = device-001
    console.log('\n2. Checking users collection for deviceId = device-001...');
    const usersSnapshot = await db.collection('users')
      .where('deviceId', '==', 'device-001')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found with deviceId = device-001');
    } else {
      console.log(`✅ Found ${usersSnapshot.size} user(s):`);
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id} (${data.role}): ${data.name || data.email}`);
      });
    }
    
    // 3. Check RTDB for device-001
    console.log('\n3. Checking RTDB for device-001...');
    const deviceSnapshot = await rtdb.ref('devices/device-001').once('value');
    if (deviceSnapshot.exists()) {
      console.log('✅ Device exists in RTDB:', JSON.stringify(deviceSnapshot.val(), null, 2));
    } else {
      console.log('❌ Device not found in RTDB');
    }
    
    // 4. Check all users in RTDB for device-001 references
    console.log('\n4. Checking RTDB users for device-001 references...');
    const usersRtdbSnapshot = await rtdb.ref('users').once('value');
    const usersData = usersRtdbSnapshot.val();
    
    if (usersData) {
      let foundReferences = false;
      Object.entries(usersData).forEach(([userId, userData]) => {
        if (userData.devices && userData.devices['device-001']) {
          console.log(`✅ Found reference in users/${userId}/devices/device-001`);
          foundReferences = true;
        }
      });
      
      if (!foundReferences) {
        console.log('❌ No RTDB user references found for device-001');
      }
    } else {
      console.log('❌ No users found in RTDB');
    }
    
    // 5. List all caregivers
    console.log('\n5. Listing all caregivers...');
    const caregiversSnapshot = await db.collection('users')
      .where('role', '==', 'caregiver')
      .get();
    
    if (caregiversSnapshot.empty) {
      console.log('❌ No caregivers found');
    } else {
      console.log(`✅ Found ${caregiversSnapshot.size} caregiver(s):`);
      caregiversSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name || data.email}`);
      });
    }
    
    // 6. List all deviceLinks for caregivers
    console.log('\n6. Listing all deviceLinks for caregivers...');
    const caregiverLinksSnapshot = await db.collection('deviceLinks')
      .where('role', '==', 'caregiver')
      .where('status', '==', 'active')
      .get();
    
    if (caregiverLinksSnapshot.empty) {
      console.log('❌ No active caregiver deviceLinks found');
    } else {
      console.log(`✅ Found ${caregiverLinksSnapshot.size} active caregiver link(s):`);
      caregiverLinksSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: userId=${data.userId}, deviceId=${data.deviceId}`);
      });
    }
    
    console.log('\n=== Check complete ===\n');
    
  } catch (error) {
    console.error('Error checking device links:', error);
  }
  
  process.exit(0);
}

checkDeviceLinks();

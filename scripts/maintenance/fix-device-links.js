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

async function fixDeviceLinks() {
  console.log('\n=== Fixing device-001 links ===\n');
  
  try {
    // Step 1: Find all users who have device-001 in RTDB
    console.log('1. Finding users with device-001 in RTDB...');
    const usersSnapshot = await rtdb.ref('users').once('value');
    const usersData = usersSnapshot.val();
    
    const usersWithDevice = [];
    if (usersData) {
      Object.entries(usersData).forEach(([userId, userData]) => {
        if (userData.devices && userData.devices['device-001']) {
          usersWithDevice.push(userId);
        }
      });
    }
    
    console.log(`Found ${usersWithDevice.length} users with device-001 in RTDB:`, usersWithDevice);
    
    // Step 2: Check which of these users are patients
    console.log('\n2. Checking which users are patients...');
    const patients = [];
    
    for (const userId of usersWithDevice) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   - ${userId}: role=${userData.role}, name=${userData.name || userData.email}`);
        
        if (userData.role === 'patient') {
          patients.push({ id: userId, data: userData });
        }
      }
    }
    
    if (patients.length === 0) {
      console.log('\n❌ No patients found with device-001 in RTDB');
      console.log('This is the root cause - caregivers need a patient to link to!');
      return;
    }
    
    console.log(`\n✅ Found ${patients.length} patient(s) with device-001`);
    
    // Step 3: Update patient documents to include deviceId field
    console.log('\n3. Updating patient documents with deviceId field...');
    
    for (const patient of patients) {
      if (!patient.data.deviceId || patient.data.deviceId !== 'device-001') {
        console.log(`   Updating patient ${patient.id} (${patient.data.name || patient.data.email})...`);
        await db.collection('users').doc(patient.id).update({
          deviceId: 'device-001'
        });
        console.log(`   ✅ Updated patient ${patient.id}`);
      } else {
        console.log(`   ✓ Patient ${patient.id} already has deviceId set`);
      }
    }
    
    // Step 4: Verify the fix
    console.log('\n4. Verifying fix...');
    const verifySnapshot = await db.collection('users')
      .where('role', '==', 'patient')
      .where('deviceId', '==', 'device-001')
      .get();
    
    console.log(`✅ Found ${verifySnapshot.size} patient(s) with deviceId = device-001`);
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.name || data.email}`);
    });
    
    // Step 5: Check caregiver links
    console.log('\n5. Checking caregiver deviceLinks...');
    const caregiverLinksSnapshot = await db.collection('deviceLinks')
      .where('deviceId', '==', 'device-001')
      .where('role', '==', 'caregiver')
      .where('status', '==', 'active')
      .get();
    
    console.log(`✅ Found ${caregiverLinksSnapshot.size} active caregiver link(s)`);
    caregiverLinksSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: userId=${data.userId}`);
    });
    
    console.log('\n=== Fix complete! ===');
    console.log('\nThe caregiver dashboard should now show the linked patient.');
    
  } catch (error) {
    console.error('Error fixing device links:', error);
  }
  
  process.exit(0);
}

fixDeviceLinks();

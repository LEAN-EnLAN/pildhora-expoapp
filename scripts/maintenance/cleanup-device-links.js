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

async function cleanupDeviceLinks() {
  console.log('\n=== Cleaning Up Device-001 Links ===\n');
  
  const correctPatientId = 'vtBGfPfbEhU6Z7njl1YsujrUexc2'; // Lean Nashe
  const incorrectPatientIds = [
    'VRExADHJveRjUxhR0OvgfBQzU7G3', // Fortu
    'mslZmixmhYaQ4bOeE6dAboChxV43' // German Mario
  ];
  
  try {
    // 1. Remove deviceId from incorrect patients
    console.log('1. Removing deviceId from incorrect patients...');
    for (const patientId of incorrectPatientIds) {
      const userDoc = await db.collection('users').doc(patientId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   Checking ${userData.name} (${patientId})...`);
        
        if (userData.deviceId === 'device-001') {
          await db.collection('users').doc(patientId).update({
            deviceId: admin.firestore.FieldValue.delete()
          });
          console.log(`   ✅ Removed deviceId from ${userData.name}`);
        } else {
          console.log(`   ✓ ${userData.name} doesn't have device-001`);
        }
      }
    }
    
    // 2. Remove RTDB references for incorrect patients
    console.log('\n2. Removing RTDB references for incorrect patients...');
    for (const patientId of incorrectPatientIds) {
      const deviceRef = rtdb.ref(`users/${patientId}/devices/device-001`);
      const snapshot = await deviceRef.once('value');
      
      if (snapshot.exists()) {
        await deviceRef.remove();
        console.log(`   ✅ Removed RTDB reference for ${patientId}`);
      } else {
        console.log(`   ✓ No RTDB reference for ${patientId}`);
      }
    }
    
    // 3. Verify correct patient still has device-001
    console.log('\n3. Verifying correct patient (Lean Nashe)...');
    const correctUserDoc = await db.collection('users').doc(correctPatientId).get();
    if (correctUserDoc.exists) {
      const userData = correctUserDoc.data();
      console.log(`   Patient: ${userData.name}`);
      console.log(`   DeviceId: ${userData.deviceId || 'NOT SET'}`);
      
      if (userData.deviceId !== 'device-001') {
        console.log('   ⚠️  Setting deviceId for Lean Nashe...');
        await db.collection('users').doc(correctPatientId).update({
          deviceId: 'device-001'
        });
        console.log('   ✅ DeviceId set');
      } else {
        console.log('   ✅ DeviceId already set correctly');
      }
    }
    
    // 4. Verify RTDB for correct patient
    const correctDeviceRef = rtdb.ref(`users/${correctPatientId}/devices/device-001`);
    const correctSnapshot = await correctDeviceRef.once('value');
    
    if (!correctSnapshot.exists()) {
      console.log('   ⚠️  Adding RTDB reference for Lean Nashe...');
      await correctDeviceRef.set(true);
      console.log('   ✅ RTDB reference added');
    } else {
      console.log('   ✅ RTDB reference exists');
    }
    
    // 5. Final verification
    console.log('\n4. Final verification...');
    const allPatientsSnapshot = await db.collection('users')
      .where('role', '==', 'patient')
      .where('deviceId', '==', 'device-001')
      .get();
    
    console.log(`\nPatients with device-001: ${allPatientsSnapshot.size}`);
    allPatientsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${doc.id})`);
    });
    
    if (allPatientsSnapshot.size === 1 && allPatientsSnapshot.docs[0].id === correctPatientId) {
      console.log('\n✅ SUCCESS: Only Lean Nashe is linked to device-001');
    } else {
      console.log('\n⚠️  WARNING: Unexpected patient count or wrong patient linked');
    }
    
    console.log('\n=== Cleanup Complete ===\n');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  
  process.exit(0);
}

cleanupDeviceLinks();

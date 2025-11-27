/**
 * Diagnostic script to check device data in Firebase
 * This will help identify why device data isn't showing on patient/home
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase config (from your project)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDlHxLqVxWLqxWLqxWLqxWLqxWLqxWLqxW",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "pildhora-app2.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "pildhora-app2",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "pildhora-app2.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "749289645165",
  appId: process.env.FIREBASE_APP_ID || "1:749289645165:web:xxxxx",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://pildhora-app2-default-rtdb.firebaseio.com"
};

async function diagnoseDeviceData() {
  console.log('🔍 Starting Device Data Diagnosis...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const rtdb = getDatabase(app);
    const firestore = getFirestore(app);

    console.log('✅ Firebase initialized\n');

    // Step 1: Check for users with devices
    console.log('📋 Step 1: Checking users with linked devices...');
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const patientsWithDevices = [];

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.role === 'patient' && data.deviceId) {
        patientsWithDevices.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          deviceId: data.deviceId,
          autonomousMode: data.autonomousMode || false
        });
      }
    });

    console.log(`Found ${patientsWithDevices.length} patients with devices:\n`);
    patientsWithDevices.forEach(p => {
      console.log(`  - ${p.name} (${p.email})`);
      console.log(`    Device ID: ${p.deviceId}`);
      console.log(`    Autonomous Mode: ${p.autonomousMode ? 'YES' : 'NO'}`);
      console.log('');
    });

    if (patientsWithDevices.length === 0) {
      console.log('❌ No patients with devices found!');
      console.log('   This is likely why device data isn\'t showing.\n');
      return;
    }

    // Step 2: Check RTDB for device state
    console.log('\n📋 Step 2: Checking RTDB device state...');
    for (const patient of patientsWithDevices) {
      console.log(`\nChecking device: ${patient.deviceId}`);
      
      // Check users/{userId}/devices
      const userDevicesRef = ref(rtdb, `users/${patient.id}/devices`);
      const userDevicesSnap = await get(userDevicesRef);
      console.log(`  users/${patient.id}/devices:`, userDevicesSnap.exists() ? '✅ EXISTS' : '❌ MISSING');
      if (userDevicesSnap.exists()) {
        console.log('    Data:', JSON.stringify(userDevicesSnap.val(), null, 2));
      }

      // Check devices/{deviceId}/state
      const deviceStateRef = ref(rtdb, `devices/${patient.deviceId}/state`);
      const deviceStateSnap = await get(deviceStateRef);
      console.log(`  devices/${patient.deviceId}/state:`, deviceStateSnap.exists() ? '✅ EXISTS' : '❌ MISSING');
      
      if (deviceStateSnap.exists()) {
        const state = deviceStateSnap.val();
        console.log('    State Data:');
        console.log(`      - battery_level: ${state.battery_level || 'N/A'}`);
        console.log(`      - current_status: ${state.current_status || 'N/A'}`);
        console.log(`      - is_online: ${state.is_online || false}`);
        console.log(`      - last_seen: ${state.last_seen || 'N/A'}`);
        console.log(`      - time_synced: ${state.time_synced || false}`);
      } else {
        console.log('    ⚠️  Device state is MISSING in RTDB!');
        console.log('    This is why device data isn\'t showing on patient/home');
      }
    }

    // Step 3: Check deviceLinks
    console.log('\n\n📋 Step 3: Checking deviceLinks...');
    for (const patient of patientsWithDevices) {
      const deviceLinksQuery = query(
        collection(firestore, 'deviceLinks'),
        where('deviceId', '==', patient.deviceId)
      );
      const linksSnapshot = await getDocs(deviceLinksQuery);
      
      console.log(`\nDevice ${patient.deviceId}:`);
      console.log(`  Total links: ${linksSnapshot.size}`);
      
      linksSnapshot.forEach(doc => {
        const link = doc.data();
        console.log(`    - ${link.role}: ${link.userId} (${link.status})`);
      });
    }

    // Summary
    console.log('\n\n📊 DIAGNOSIS SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    
    const devicesWithState = patientsWithDevices.filter(async p => {
      const stateRef = ref(rtdb, `devices/${p.deviceId}/state`);
      const snap = await get(stateRef);
      return snap.exists();
    });

    console.log(`✅ Patients with devices: ${patientsWithDevices.length}`);
    console.log(`✅ Devices with RTDB state: Check output above`);
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. If device state is missing, the device needs to connect and send data');
    console.log('   2. Check that users/{userId}/devices/{deviceId} = true exists');
    console.log('   3. Verify device is online and sending heartbeats');
    console.log('   4. Check Redux device listener is starting correctly');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
    console.error('Error details:', error.message);
  }
}

// Run diagnosis
diagnoseDeviceData().then(() => {
  console.log('✅ Diagnosis complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Diagnosis failed:', err);
  process.exit(1);
});

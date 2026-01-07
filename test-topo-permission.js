/**
 * Simple test to verify RTDB permission fix for topo commands
 * This test simulates the alarm service trying to write a topo command
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

// Firebase config (replace with your config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

async function testTopoPermission() {
  console.log('🧪 Testing RTDB topo command permission...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);
    
    console.log('✅ Firebase initialized');
    
    // Sign in anonymously for testing
    await signInAnonymously(auth);
    console.log('✅ Anonymous sign-in successful');
    
    // Test device ID and user ID
    const testDeviceId = 'TEST-DEVICE-001';
    const testUserId = auth.currentUser.uid;
    
    // First, create the device link in RTDB (simulating device linking)
    console.log('📝 Creating device link in RTDB...');
    const deviceLinkRef = ref(database, `users/${testUserId}/devices/${testDeviceId}`);
    await set(deviceLinkRef, true);
    console.log('✅ Device link created');
    
    // Now test the topo command write (this should work after our fix)
    console.log('📤 Testing topo command write...');
    const commandsRef = ref(database, `devices/${testDeviceId}/commands`);
    await set(commandsRef, { topo: true });
    console.log('✅ Topo command written successfully!');
    
    // Verify the write worked
    console.log('🔍 Verifying write...');
    const verifyRef = ref(database, `devices/${testDeviceId}/commands/topo`);
    const snapshot = await get(verifyRef);
    
    if (snapshot.exists() && snapshot.val() === true) {
      console.log('🎉 SUCCESS: Topo command permission test PASSED!');
      console.log(`   - Device: ${testDeviceId}`);
      console.log(`   - User: ${testUserId}`);
      console.log(`   - Command: topo = true`);
    } else {
      console.log('❌ FAILED: Topo command was not written correctly');
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.log('💡 This suggests the RTDB security rules still need adjustment');
    }
  }
}

// Run the test
testTopoPermission();
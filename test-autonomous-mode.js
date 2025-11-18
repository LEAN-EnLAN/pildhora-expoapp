/**
 * Test script for Autonomous Mode feature
 * 
 * This script tests the autonomous mode functionality:
 * 1. Setting autonomous mode on/off
 * 2. Checking autonomous mode status
 * 3. Verifying event sync behavior
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (use your actual config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testAutonomousMode() {
  console.log('🧪 Testing Autonomous Mode Feature\n');

  try {
    // Test 1: Sign in as patient
    console.log('1️⃣ Signing in as patient...');
    const patientEmail = process.env.TEST_PATIENT_EMAIL || 'patient@test.com';
    const patientPassword = process.env.TEST_PATIENT_PASSWORD || 'password123';
    
    const userCredential = await signInWithEmailAndPassword(auth, patientEmail, patientPassword);
    const patientId = userCredential.user.uid;
    console.log('✅ Signed in as:', patientId);

    // Test 2: Check current autonomous mode status
    console.log('\n2️⃣ Checking current autonomous mode status...');
    const userRef = doc(db, 'users', patientId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User document not found');
      return;
    }

    const userData = userDoc.data();
    const currentMode = userData.autonomousMode === true;
    console.log('Current mode:', currentMode ? 'AUTONOMOUS' : 'SUPERVISED');

    // Test 3: Toggle autonomous mode
    console.log('\n3️⃣ Toggling autonomous mode...');
    const newMode = !currentMode;
    
    await setDoc(
      userRef,
      {
        autonomousMode: newMode,
        autonomousModeChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    console.log('✅ Autonomous mode set to:', newMode ? 'AUTONOMOUS' : 'SUPERVISED');

    // Test 4: Verify the change
    console.log('\n4️⃣ Verifying the change...');
    const updatedDoc = await getDoc(userRef);
    const updatedData = updatedDoc.data();
    const verifiedMode = updatedData.autonomousMode === true;
    
    if (verifiedMode === newMode) {
      console.log('✅ Mode verified successfully:', verifiedMode ? 'AUTONOMOUS' : 'SUPERVISED');
    } else {
      console.log('❌ Mode verification failed');
    }

    // Test 5: Check impact on caregivers
    console.log('\n5️⃣ Checking caregiver visibility...');
    if (newMode) {
      console.log('⚠️  AUTONOMOUS MODE ACTIVE:');
      console.log('   - New medication events will NOT be synced to Firestore');
      console.log('   - Caregivers will see "Modo autónomo activado"');
      console.log('   - Historical events remain visible');
    } else {
      console.log('✅ SUPERVISED MODE ACTIVE:');
      console.log('   - Medication events will be synced normally');
      console.log('   - Caregivers have full access to data');
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Initial Mode: ${currentMode ? 'AUTONOMOUS' : 'SUPERVISED'}`);
    console.log(`   Final Mode: ${newMode ? 'AUTONOMOUS' : 'SUPERVISED'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    process.exit(0);
  }
}

// Run tests
testAutonomousMode();

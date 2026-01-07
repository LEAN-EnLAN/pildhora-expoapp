/**
 * Fix Script: Patient Device Display Issue
 * 
 * This script fixes the issue where DEVICE-001 and connection codes
 * don't show in the patient panel by:
 * 1. Setting the deviceId field in the user document
 * 2. Generating a new connection code for the patient
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pildhora-app2-default-rtdb.firebaseio.com/'
  });
}

const db = admin.firestore();

// Patient ID from diagnosis
const PATIENT_ID = 'VRExADHJveRjUxhR0OvgfBQzU7G3';
const DEVICE_ID = 'DEVICE-001';

async function fixPatientDeviceDisplay() {
  console.log('\n🔧 FIXING PATIENT DEVICE DISPLAY ISSUE\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Set deviceId in user document
    console.log('\n📝 Step 1: Setting deviceId in user document...');
    await db.collection('users').doc(PATIENT_ID).update({
      deviceId: DEVICE_ID
    });
    console.log(`✅ Set deviceId to ${DEVICE_ID} for patient ${PATIENT_ID}`);

    // Step 2: Generate a new connection code
    console.log('\n🔑 Step 2: Generating new connection code...');
    
    // Get patient name
    const userDoc = await db.collection('users').doc(PATIENT_ID).get();
    const userData = userDoc.data();
    const patientName = userData.name || 'Unknown Patient';
    
    // Generate random code (6 characters, avoiding ambiguous chars)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Set expiration to 24 hours from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Create connection code document
    await db.collection('connectionCodes').doc(code).set({
      id: code,
      code: code,
      deviceId: DEVICE_ID,
      patientId: PATIENT_ID,
      patientName: patientName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      used: false,
      status: 'active'
    });
    
    console.log(`✅ Generated connection code: ${code}`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);
    console.log(`   Patient: ${patientName}`);
    console.log(`   Device: ${DEVICE_ID}`);

    // Step 3: Verify the fix
    console.log('\n✅ Step 3: Verifying fix...');
    const updatedUserDoc = await db.collection('users').doc(PATIENT_ID).get();
    const updatedUserData = updatedUserDoc.data();
    
    console.log(`   User deviceId: ${updatedUserData.deviceId}`);
    
    const codesSnapshot = await db.collection('connectionCodes')
      .where('patientId', '==', PATIENT_ID)
      .where('used', '==', false)
      .get();
    
    console.log(`   Active connection codes: ${codesSnapshot.size}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Fix complete!');
    console.log('\n📱 The patient should now see:');
    console.log(`   - Device: ${DEVICE_ID}`);
    console.log(`   - Connection Code: ${code}`);
    console.log('\n💡 Tell the patient to refresh their app or log out and back in.');

  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    console.error(error.stack);
  }
}

// Run fix
fixPatientDeviceDisplay()
  .then(() => {
    console.log('\n👋 Fix finished. Exiting...\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

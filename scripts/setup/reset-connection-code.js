/**
 * Reset connection code to allow retesting the caregiver linking flow
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

async function resetConnectionCode() {
  console.log('🔄 Resetting connection code for retesting...\n');
  
  try {
    const connectionCode = 'YAGHG7';
    
    // Reset the connection code to unused state
    await db.collection('connectionCodes').doc(connectionCode).update({
      used: false,
      usedBy: admin.firestore.FieldValue.delete(),
      usedAt: admin.firestore.FieldValue.delete()
    });
    
    console.log(`✅ Connection code ${connectionCode} has been reset`);
    console.log('   - Status: unused');
    console.log('   - Ready for testing\n');
    
    console.log('🎯 Next Steps:');
    console.log('   1. Go back to the app');
    console.log('   2. As the caregiver, enter the connection code: YAGHG7');
    console.log('   3. The linking should now succeed with the updated security rules\n');
    
  } catch (error) {
    console.error('❌ Error resetting connection code:', error);
  }
}

// Run the reset
resetConnectionCode()
  .then(() => {
    console.log('✅ Reset completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });

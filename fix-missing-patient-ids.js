/**
 * Fix deviceLinks that are missing patientId field
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Load service account from environment variable or file
let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Use the path to service account JSON file
  serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Use the JSON string directly
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error('❌ ERROR: No Firebase credentials found!');
  console.error('Please set either:');
  console.error('  - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)');
  console.error('  - FIREBASE_SERVICE_ACCOUNT (service account JSON as string)');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function fixMissingPatientIds() {
  console.log('\n🔧 Fixing deviceLinks with missing patientId...\n');
  
  const linksSnapshot = await db.collection('deviceLinks').get();
  let fixed = 0;
  
  for (const linkDoc of linksSnapshot.docs) {
    const link = linkDoc.data();
    
    if (!link.patientId && link.deviceId) {
      console.log(`Fixing link: ${linkDoc.id}`);
      console.log(`  Device: ${link.deviceId}`);
      
      // Find patient with this device
      const patientsSnapshot = await db.collection('users')
        .where('deviceId', '==', link.deviceId)
        .where('role', '==', 'patient')
        .get();
      
      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        const patientId = patientDoc.id;
        const patientData = patientDoc.data();
        
        console.log(`  Found patient: ${patientData.name || patientData.email} (${patientId})`);
        
        await linkDoc.ref.update({
          patientId: patientId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`  ✓ Updated with patientId\n`);
        fixed++;
      } else {
        console.log(`  ⚠ No patient found for device ${link.deviceId}\n`);
      }
    }
  }
  
  console.log(`✅ Fixed ${fixed} deviceLinks\n`);
}

fixMissingPatientIds().catch(console.error);

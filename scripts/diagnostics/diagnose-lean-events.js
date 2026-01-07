const admin = require('firebase-admin');
require('dotenv').config();

// Load service account from environment variable or file
let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error('❌ ERROR: No Firebase credentials found!');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function diagnoseLeanNasheEvents() {
  try {
    const leanNasheId = 'vtBGfPfbEhU6Z7njl1YsujrUexc2';
    const tomasId = 'ZsoeNjnLOGgj1rNomcbJF7QSWTZ2';
    
    console.log('\n=== Diagnosing Lean Nashe Events Issue ===\n');
    
    // Check all medications for Lean Nashe
    console.log('Checking all medications for Lean Nashe...');
    const medicationsSnapshot = await db.collection('medications')
      .where('patientId', '==', leanNasheId)
      .get();
    
    console.log(`Found ${medicationsSnapshot.size} medications\n`);
    
    medicationsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Medication: ${data.name} (${doc.id})`);
      console.log(`  caregiverId: ${data.caregiverId || 'MISSING'}`);
      console.log(`  createdAt: ${data.createdAt?.toDate?.()}`);
      console.log('');
    });
    
    // Check medication events
    console.log('Checking medication events...');
    const eventsSnapshot = await db.collection('medicationEvents')
      .where('patientId', '==', leanNasheId)
      .get();
    
    console.log(`Found ${eventsSnapshot.size} events\n`);
    
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Event: ${data.eventType} - ${data.medicationName}`);
      console.log(`  caregiverId: ${data.caregiverId}`);
      console.log(`  timestamp: ${data.timestamp?.toDate?.()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseLeanNasheEvents();

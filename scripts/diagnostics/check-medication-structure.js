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

async function checkMedicationStructure() {
  console.log('\n=== Checking Medication Document Structure ===\n');
  
  try {
    const allMedsSnapshot = await db.collection('medications').get();
    
    console.log(`Found ${allMedsSnapshot.size} medication(s)\n`);
    
    allMedsSnapshot.forEach(doc => {
      const med = doc.data();
      console.log(`Medication ID: ${doc.id}`);
      console.log(`  name: ${med.name}`);
      console.log(`  userId: ${med.userId || 'NOT SET'}`);
      console.log(`  patientId: ${med.patientId || 'NOT SET'}`);
      console.log(`  icon: ${med.icon || 'NOT SET'}`);
      console.log(`  All fields:`, Object.keys(med).join(', '));
      console.log('');
    });
    
    console.log('=== Check Complete ===\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkMedicationStructure();

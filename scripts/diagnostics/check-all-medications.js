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

async function checkAllMedications() {
  console.log('\n=== Checking All Medications ===\n');
  
  try {
    // Get ALL medications
    console.log('1. Fetching all medications...');
    const allMedsSnapshot = await db.collection('medications').get();
    
    console.log(`Found ${allMedsSnapshot.size} total medication(s) in database\n`);
    
    if (allMedsSnapshot.empty) {
      console.log('❌ No medications found in the entire database!');
      console.log('   This explains why caregivers see no medications.');
      console.log('   Patients need to add medications first.');
    } else {
      console.log('Medications by user:');
      const medsByUser = {};
      
      allMedsSnapshot.forEach(doc => {
        const med = doc.data();
        const userId = med.userId || med.patientId || 'unknown';
        
        if (!medsByUser[userId]) {
          medsByUser[userId] = [];
        }
        
        medsByUser[userId].push({
          id: doc.id,
          name: med.name,
          icon: med.icon,
          userId: userId
        });
      });
      
      for (const [userId, meds] of Object.entries(medsByUser)) {
        // Get user info
        const userDoc = await db.collection('users').doc(userId).get();
        const userName = userDoc.exists ? userDoc.data().name : 'Unknown';
        const userRole = userDoc.exists ? userDoc.data().role : 'unknown';
        
        console.log(`\n  ${userName} (${userId}) - ${userRole}:`);
        meds.forEach(med => {
          console.log(`    - ${med.name} (${med.icon || 'no icon'})`);
        });
      }
    }
    
    // Check for device-001 patients specifically
    console.log('\n\n2. Checking device-001 patients specifically...');
    const device001Patients = ['VRExADHJveRjUxhR0OvgfBQzU7G3', 'mslZmixmhYaQ4bOeE6dAboChxV43', 'vtBGfPfbEhU6Z7njl1YsujrUexc2'];
    
    for (const patientId of device001Patients) {
      const userDoc = await db.collection('users').doc(patientId).get();
      const userName = userDoc.exists ? userDoc.data().name : 'Unknown';
      
      const medsSnapshot = await db.collection('medications')
        .where('userId', '==', patientId)
        .get();
      
      console.log(`  ${userName} (${patientId}): ${medsSnapshot.size} medication(s)`);
    }
    
    console.log('\n=== Check Complete ===\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkAllMedications();

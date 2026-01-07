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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixTomasSetup() {
  console.log('🔧 FIXING TOMAS CAREGIVER SETUP\n');

  try {
    const usersSnapshot = await db.collection('users').get();
    
    const allUsers = [];
    let tomasUser = null;
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      allUsers.push({ id: doc.id, ...data });
      
      if (data.email && (data.email.toLowerCase().includes('tom') || data.email === 'tom@g.com')) {
        tomasUser = { id: doc.id, ...data };
      }
    });

    console.log(`Found ${allUsers.length} users\n`);
    allUsers.forEach(u => console.log(`  ${u.email || 'NO EMAIL'} (${u.role || 'NO ROLE'})`));

    if (!tomasUser) {
      console.log('\n❌ Could not find Tomas');
      process.exit(1);
    }

    console.log(`\n✅ Found: ${tomasUser.email} (ID: ${tomasUser.id})`);

    // Update role
    console.log('\n📋 Updating role to caregiver...');
    await db.collection('users').doc(tomasUser.id).update({ role: 'caregiver' });
    console.log('✅ Role updated');

    // Find patients
    const patients = allUsers.filter(u => u.id !== tomasUser.id && (u.role === 'patient' || !u.role));
    console.log(`\n📋 Found ${patients.length} patients to link`);

    // Create links
    for (const patient of patients) {
      await db.collection('caregiverPatientLinks').add({
        caregiverId: tomasUser.id,
        patientId: patient.id,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Linked: ${patient.email || patient.id}`);
    }

    console.log(`\n✅ COMPLETE: ${patients.length} patients linked to Tomas`);

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    process.exit(0);
  }
}

fixTomasSetup();

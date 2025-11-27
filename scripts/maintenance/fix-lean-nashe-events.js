/**
 * Fix missing events for Lean Nashe's medications
 * This script will:
 * 1. Check all medications for Lean Nashe
 * 2. Ensure they have caregiverId set
 * 3. Create missing medication events
 * 4. Check autonomous mode status
 */

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
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function fixLeanNasheEvents() {
  try {
    const leanNasheId = 'vtBGfPfbEhU6Z7njl1YsujrUexc2';
    const tomasId = 'ZsoeNjnLOGgj1rNomcbJF7QSWTZ2'; // Caregiver
    
    console.log('\n=== Fixing Lean Nashe Events ===\n');
    
    // 1. Check user document
    console.log('1. Checking Lean Nashe user document...');
    const userDoc = await db.collection('users').doc(leanNasheId).get();
    if (!userDoc.exists) {
      console.error('❌ User not found!');
      return;
    }
    
    const userData = userDoc.data();
    console.log(`   Name: ${userData.name}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Autonomous mode: ${userData.autonomousMode?.enabled ? 'ENABLED' : 'DISABLED'}`);
    
    // 2. Check if autonomous mode is blocking events
    if (userData.autonomousMode?.enabled) {
      console.log('\n⚠️  WARNING: Autonomous mode is ENABLED!');
      console.log('   Events will not sync to caregivers while autonomous mode is active.');
      console.log('   Disable autonomous mode first if you want events to sync.');
      return;
    }
    
    // 3. Get all medications
    console.log('\n2. Checking medications...');
    const medicationsSnapshot = await db.collection('medications')
      .where('patientId', '==', leanNasheId)
      .get();
    
    console.log(`   Found ${medicationsSnapshot.size} medications\n`);
    
    if (medicationsSnapshot.empty) {
      console.log('   No medications found.');
      return;
    }
    
    // 4. Check and fix each medication
    let fixedCount = 0;
    let eventsCreated = 0;
    
    for (const medDoc of medicationsSnapshot.docs) {
      const medication = { id: medDoc.id, ...medDoc.data() };
      console.log(`   Medication: ${medication.name}`);
      
      // Check if caregiverId is missing
      if (!medication.caregiverId) {
        console.log(`     ⚠️  Missing caregiverId - setting to ${tomasId}`);
        await medDoc.ref.update({
          caregiverId: tomasId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        medication.caregiverId = tomasId;
        fixedCount++;
      } else {
        console.log(`     ✓ caregiverId: ${medication.caregiverId}`);
      }
      
      // Check if event exists
      const existingEvents = await db.collection('medicationEvents')
        .where('medicationId', '==', medication.id)
        .where('eventType', '==', 'created')
        .get();
      
      if (existingEvents.empty) {
        console.log(`     ⚠️  No 'created' event found - creating one`);
        
        // Create the event
        await db.collection('medicationEvents').add({
          eventType: 'created',
          medicationId: medication.id,
          medicationName: medication.name,
          medicationData: medication,
          patientId: leanNasheId,
          patientName: userData.name || 'Lean Nashe',
          caregiverId: medication.caregiverId,
          timestamp: medication.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          syncStatus: 'delivered'
        });
        
        eventsCreated++;
        console.log(`     ✓ Event created`);
      } else {
        console.log(`     ✓ Event exists`);
      }
      
      console.log('');
    }
    
    // 5. Summary
    console.log('\n=== Summary ===');
    console.log(`✓ Fixed ${fixedCount} medications with missing caregiverId`);
    console.log(`✓ Created ${eventsCreated} missing events`);
    
    // 6. Verify events are visible to caregiver
    console.log('\n3. Verifying events visible to caregiver...');
    const caregiverEvents = await db.collection('medicationEvents')
      .where('caregiverId', '==', tomasId)
      .where('patientId', '==', leanNasheId)
      .get();
    
    console.log(`   Caregiver can see ${caregiverEvents.size} events for Lean Nashe`);
    
    caregiverEvents.forEach(doc => {
      const event = doc.data();
      console.log(`   - ${event.eventType}: ${event.medicationName} (${event.timestamp?.toDate?.()})`);
    });
    
    console.log('\n✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixLeanNasheEvents();

/**
 * Diagnostic Script: Last Event Widget Issue
 * 
 * This script checks:
 * 1. If medication events exist in Firestore
 * 2. What fields they have (patientId vs caregiverId)
 * 3. If the query works correctly
 * 4. Security rule permissions
 */

const admin = require('firebase-admin');
const serviceAccount = require('./pildhora-app2-firebase-adminsdk-fbsvc-1684b37985.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pildhora-app2.firebaseio.com'
  });
}

const db = admin.firestore();

async function diagnoseLastEventWidget() {
  console.log('='.repeat(80));
  console.log('LAST EVENT WIDGET DIAGNOSTIC');
  console.log('='.repeat(80));

  try {
    // Step 1: Check if any medication events exist
    console.log('\n📊 Step 1: Checking for medication events...\n');
    const eventsSnapshot = await db.collection('medicationEvents')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    if (eventsSnapshot.empty) {
      console.log('❌ NO MEDICATION EVENTS FOUND IN DATABASE');
      console.log('   This is why the widget shows nothing!');
      return;
    }

    console.log(`✅ Found ${eventsSnapshot.size} recent events\n`);

    // Step 2: Analyze event structure
    console.log('📋 Step 2: Analyzing event structure...\n');
    
    const events = [];
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp
      });
    });

    // Check what fields exist
    const firstEvent = events[0];
    console.log('Sample event structure:');
    console.log('  ID:', firstEvent.id);
    console.log('  Has patientId:', !!firstEvent.patientId, firstEvent.patientId || 'N/A');
    console.log('  Has caregiverId:', !!firstEvent.caregiverId, firstEvent.caregiverId || 'N/A');
    console.log('  Event Type:', firstEvent.eventType);
    console.log('  Medication:', firstEvent.medicationName);
    console.log('  Timestamp:', firstEvent.timestamp);
    console.log('  Patient Name:', firstEvent.patientName || 'N/A');

    // Count events by field presence
    const withPatientId = events.filter(e => e.patientId).length;
    const withCaregiverId = events.filter(e => e.caregiverId).length;
    
    console.log('\n📈 Field Statistics:');
    console.log(`  Events with patientId: ${withPatientId}/${events.length}`);
    console.log(`  Events with caregiverId: ${withCaregiverId}/${events.length}`);

    // Step 3: Get unique patient IDs
    console.log('\n👥 Step 3: Finding patients with events...\n');
    
    const patientIds = [...new Set(events.map(e => e.patientId).filter(Boolean))];
    console.log(`Found ${patientIds.length} unique patients with events:`);
    patientIds.forEach((pid, i) => {
      const patientEvents = events.filter(e => e.patientId === pid);
      console.log(`  ${i + 1}. Patient ID: ${pid}`);
      console.log(`     - ${patientEvents.length} events`);
      console.log(`     - Latest: ${patientEvents[0].medicationName} (${patientEvents[0].eventType})`);
    });

    // Step 4: Test query by patientId
    console.log('\n🔍 Step 4: Testing query by patientId...\n');
    
    if (patientIds.length > 0) {
      const testPatientId = patientIds[0];
      console.log(`Testing query for patient: ${testPatientId}`);
      
      const querySnapshot = await db.collection('medicationEvents')
        .where('patientId', '==', testPatientId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        console.log('✅ Query successful! Found event:');
        console.log('  ID:', doc.id);
        console.log('  Medication:', data.medicationName);
        console.log('  Type:', data.eventType);
        console.log('  Timestamp:', data.timestamp?.toDate?.() || data.timestamp);
      } else {
        console.log('❌ Query returned no results');
      }
    }

    // Step 5: Check deviceLinks for caregiver access
    console.log('\n🔗 Step 5: Checking deviceLinks (caregiver access)...\n');
    
    const deviceLinksSnapshot = await db.collection('deviceLinks')
      .limit(5)
      .get();

    if (deviceLinksSnapshot.empty) {
      console.log('⚠️  No deviceLinks found - caregivers may not have access');
    } else {
      console.log(`Found ${deviceLinksSnapshot.size} device links:`);
      deviceLinksSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - Device: ${doc.id}`);
        console.log(`    Patient: ${data.patientId || 'N/A'}`);
        console.log(`    Caregiver: ${data.caregiverId || 'N/A'}`);
        console.log(`    Status: ${data.status || 'N/A'}`);
      });
    }

    // Step 6: Recommendations
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (withPatientId === events.length) {
      console.log('✅ All events have patientId - query by patientId should work');
    } else {
      console.log(`⚠️  Only ${withPatientId}/${events.length} events have patientId`);
    }

    if (withCaregiverId < events.length) {
      console.log(`⚠️  Only ${withCaregiverId}/${events.length} events have caregiverId`);
      console.log('   DO NOT query by caregiverId - use patientId instead');
    }

    console.log('\n📝 For the LastMedicationStatusCard component:');
    console.log('   1. MUST query by patientId (not caregiverId)');
    console.log('   2. Pass the selected patient\'s ID from the dashboard');
    console.log('   3. Ensure the patient ID matches events in the database');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }

  console.log('\n' + '='.repeat(80));
}

// Run diagnostic
diagnoseLastEventWidget()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });

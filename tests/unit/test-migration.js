/**
 * Test script to verify the medication data migration
 * 
 * This script checks:
 * 1. Migration status document exists and is completed
 * 2. Medications have emoji and trackInventory fields
 * 3. Intake records have completionToken and deviceSource fields
 * 
 * Usage: node test-migration.js
 */

require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const MIGRATION_NAME = 'medication-redesign-v1';

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('Service account key not found at: ' + serviceAccountPath);
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 
                   `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });

    console.log('[Test] Firebase Admin SDK initialized successfully');
    return admin.firestore();
  } catch (error) {
    console.error('[Test] Failed to initialize Firebase:', error.message);
    throw error;
  }
}

/**
 * Test migration status
 */
async function testMigrationStatus(db) {
  console.log('\n=== Testing Migration Status ===');
  
  try {
    const migrationDoc = await db.collection('migrations').doc(MIGRATION_NAME).get();
    
    if (!migrationDoc.exists) {
      console.error('❌ Migration status document not found');
      return false;
    }
    
    const data = migrationDoc.data();
    console.log('✅ Migration status document exists');
    console.log(`   Status: ${data.status}`);
    console.log(`   Medications processed: ${data.medicationsProcessed}`);
    console.log(`   Intake records processed: ${data.intakeRecordsProcessed}`);
    
    if (data.errors && data.errors.length > 0) {
      console.warn('⚠️  Errors encountered during migration:');
      data.errors.forEach(error => console.warn(`   - ${error}`));
    }
    
    if (data.status !== 'completed') {
      console.error(`❌ Migration status is "${data.status}", expected "completed"`);
      return false;
    }
    
    console.log('✅ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    return false;
  }
}

/**
 * Test medications migration
 */
async function testMedications(db) {
  console.log('\n=== Testing Medications Migration ===');
  
  try {
    const snapshot = await db.collection('medications').limit(100).get();
    
    if (snapshot.empty) {
      console.log('⚠️  No medications found in database');
      return true;
    }
    
    console.log(`Found ${snapshot.size} medications to check`);
    
    let missingEmoji = 0;
    let missingTrackInventory = 0;
    let correct = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (!data.emoji) {
        missingEmoji++;
        console.log(`❌ Medication ${doc.id} (${data.name}) missing emoji field`);
      }
      
      if (data.trackInventory === undefined) {
        missingTrackInventory++;
        console.log(`❌ Medication ${doc.id} (${data.name}) missing trackInventory field`);
      }
      
      if (data.emoji && data.trackInventory !== undefined) {
        correct++;
      }
    });
    
    console.log(`\nResults:`);
    console.log(`  ✅ Correct: ${correct}`);
    console.log(`  ❌ Missing emoji: ${missingEmoji}`);
    console.log(`  ❌ Missing trackInventory: ${missingTrackInventory}`);
    
    if (missingEmoji === 0 && missingTrackInventory === 0) {
      console.log('✅ All medications migrated correctly');
      return true;
    } else {
      console.error('❌ Some medications are missing required fields');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking medications:', error.message);
    return false;
  }
}

/**
 * Test intake records migration
 */
async function testIntakeRecords(db) {
  console.log('\n=== Testing Intake Records Migration ===');
  
  try {
    const snapshot = await db.collection('intakeRecords').limit(100).get();
    
    if (snapshot.empty) {
      console.log('⚠️  No intake records found in database');
      return true;
    }
    
    console.log(`Found ${snapshot.size} intake records to check`);
    
    let missingCompletionToken = 0;
    let missingDeviceSource = 0;
    let correct = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Only check records that have medicationId (required for completionToken)
      if (data.medicationId && !data.completionToken) {
        missingCompletionToken++;
        console.log(`❌ Intake record ${doc.id} missing completionToken`);
      }
      
      if (!data.deviceSource) {
        missingDeviceSource++;
        console.log(`❌ Intake record ${doc.id} missing deviceSource`);
      }
      
      if (data.completionToken && data.deviceSource) {
        correct++;
      }
    });
    
    console.log(`\nResults:`);
    console.log(`  ✅ Correct: ${correct}`);
    console.log(`  ❌ Missing completionToken: ${missingCompletionToken}`);
    console.log(`  ❌ Missing deviceSource: ${missingDeviceSource}`);
    
    if (missingCompletionToken === 0 && missingDeviceSource === 0) {
      console.log('✅ All intake records migrated correctly');
      return true;
    } else {
      console.error('❌ Some intake records are missing required fields');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking intake records:', error.message);
    return false;
  }
}

/**
 * Test sample data
 */
async function testSampleData(db) {
  console.log('\n=== Sample Data ===');
  
  try {
    // Get one medication
    const medicationSnapshot = await db.collection('medications').limit(1).get();
    if (!medicationSnapshot.empty) {
      const medicationDoc = medicationSnapshot.docs[0];
      const medicationData = medicationDoc.data();
      console.log('\nSample Medication:');
      console.log(`  ID: ${medicationDoc.id}`);
      console.log(`  Name: ${medicationData.name}`);
      console.log(`  Emoji: ${medicationData.emoji || 'MISSING'}`);
      console.log(`  Track Inventory: ${medicationData.trackInventory !== undefined ? medicationData.trackInventory : 'MISSING'}`);
    }
    
    // Get one intake record
    const intakeSnapshot = await db.collection('intakeRecords').limit(1).get();
    if (!intakeSnapshot.empty) {
      const intakeDoc = intakeSnapshot.docs[0];
      const intakeData = intakeDoc.data();
      console.log('\nSample Intake Record:');
      console.log(`  ID: ${intakeDoc.id}`);
      console.log(`  Medication: ${intakeData.medicationName}`);
      console.log(`  Completion Token: ${intakeData.completionToken || 'MISSING'}`);
      console.log(`  Device Source: ${intakeData.deviceSource || 'MISSING'}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error fetching sample data:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('=== Medication Data Migration Test ===');
  console.log(`Migration name: ${MIGRATION_NAME}\n`);
  
  let db;
  
  try {
    // Initialize Firebase
    db = initializeFirebase();
    
    // Run tests
    const statusOk = await testMigrationStatus(db);
    const medicationsOk = await testMedications(db);
    const intakeRecordsOk = await testIntakeRecords(db);
    await testSampleData(db);
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Migration Status: ${statusOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Medications: ${medicationsOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Intake Records: ${intakeRecordsOk ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = statusOk && medicationsOk && intakeRecordsOk;
    
    if (allPassed) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

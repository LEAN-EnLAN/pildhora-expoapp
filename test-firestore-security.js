/**
 * Test script for Firestore security rules
 * Tests patient and caregiver access controls using Firebase Rules Unit Testing
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, collection, addDoc, updateDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config (using environment variables or defaults)
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Load Firestore rules
const rulesPath = path.join(__dirname, 'config', 'firestore.rules');
const rules = fs.readFileSync(rulesPath, 'utf8');

let testEnv;

// Test data
const testUsers = {
    patient1: { uid: 'test-patient-1', email: 'patient1@test.com', role: 'patient' },
    patient2: { uid: 'test-patient-2', email: 'patient2@test.com', role: 'patient' },
    caregiver1: { uid: 'test-caregiver-1', email: 'caregiver1@test.com', role: 'caregiver' },
    caregiver2: { uid: 'test-caregiver-2', email: 'caregiver2@test.com', role: 'caregiver' }
};

const testData = {
    medication1: { id: 'test-med-1', patientId: testUsers.patient1.uid, caregiverId: testUsers.caregiver1.uid, name: 'Test Med 1' },
    medication2: { id: 'test-med-2', patientId: testUsers.patient2.uid, caregiverId: testUsers.caregiver2.uid, name: 'Test Med 2' },
    device1: { id: 'test-device-1', primaryPatientId: testUsers.patient1.uid },
    device2: { id: 'test-device-2', patientId: testUsers.patient1.uid }, // Test device using patientId field
    connectionCode1: { id: 'test-code-1', patientId: testUsers.patient1.uid }
};

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, error = null) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}`);
    if (error) {
        console.log(`   Error: ${error.message}`);
    }
    results.tests.push({ name, passed, error: error?.message });
    if (passed) results.passed++;
    else results.failed++;
}

// Setup test data
async function setupTestData(db) {
    console.log('🔧 Setting up test data...');

    // Create user documents
    for (const [key, user] of Object.entries(testUsers)) {
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            role: user.role,
            name: `${key} Name`
        });
        console.log(`   Created user document for ${key}`);
    }

    // Create caregiver-patient link
    await setDoc(doc(db, 'caregiverPatients', testUsers.caregiver1.uid, 'patients', testUsers.patient1.uid), {
        linkedAt: new Date()
    });
    console.log('   Created caregiver-patient link');

    // Create test medication
    await setDoc(doc(db, 'medications', testData.medication1.id), {
        ...testData.medication1,
        createdAt: new Date()
    });
    console.log('   Created test medication');

    // Create test device 1 (primaryPatientId)
    await setDoc(doc(db, 'devices', testData.device1.id), {
        ...testData.device1,
        createdAt: new Date()
    });
    console.log('   Created test device 1');

    // Create test device 2 (patientId)
    await setDoc(doc(db, 'devices', testData.device2.id), {
        ...testData.device2,
        createdAt: new Date()
    });
    console.log('   Created test device 2');

    // Create test connection code
    await setDoc(doc(db, 'connectionCodes', testData.connectionCode1.id), {
        ...testData.connectionCode1,
        createdAt: new Date()
    });
    console.log('   Created test connection code');

    console.log('✅ Test data setup complete');
}

// Run tests
async function runTests() {
    console.log('🧪 Running Firestore security tests...\n');

    try {
        // Initialize test environment
        testEnv = await initializeTestEnvironment({
            projectId: firebaseConfig.projectId,
            firestore: {
                rules: rules,
            },
        });

        // Setup test data
        await setupTestData(testEnv.unauthenticatedContext().firestore());

        // Test 1: Patient Access
        console.log('1️⃣ Testing Patient Access...');

        const patient1Auth = testEnv.authenticatedContext(testUsers.patient1.uid);
        const patient1Db = patient1Auth.firestore();

        // Patient can read/write their own medication
        await assertSucceeds(getDoc(doc(patient1Db, 'medications', testData.medication1.id)));
        logTest('Patient can read own medication', true);

        await assertSucceeds(addDoc(collection(patient1Db, 'medications'), {
            patientId: testUsers.patient1.uid,
            caregiverId: testUsers.caregiver1.uid,
            name: 'New Med'
        }));
        logTest('Patient can create medication', true);

        await assertSucceeds(updateDoc(doc(patient1Db, 'medications', testData.medication1.id), { name: 'Updated Med' }));
        logTest('Patient can update own medication', true);

        // Patient cannot access other patient's medication
        await assertFails(getDoc(doc(patient1Db, 'medications', testData.medication2.id)));
        logTest('Patient cannot read other patient medication', true);

        // Test 2: Caregiver Access (Linked)
        console.log('\n2️⃣ Testing Caregiver Access (Linked)...');

        const caregiver1Auth = testEnv.authenticatedContext(testUsers.caregiver1.uid);
        const caregiver1Db = caregiver1Auth.firestore();

        // Linked caregiver can access patient's medication
        await assertSucceeds(getDoc(doc(caregiver1Db, 'medications', testData.medication1.id)));
        logTest('Linked caregiver can read patient medication', true);

        await assertSucceeds(updateDoc(doc(caregiver1Db, 'medications', testData.medication1.id), { name: 'Updated by Caregiver' }));
        logTest('Linked caregiver can update patient medication', true);

        // Linked caregiver can access patient's device (primaryPatientId)
        await assertSucceeds(getDoc(doc(caregiver1Db, 'devices', testData.device1.id)));
        logTest('Linked caregiver can read patient device (primaryPatientId)', true);

        // Linked caregiver can access patient's device (patientId)
        await assertSucceeds(getDoc(doc(caregiver1Db, 'devices', testData.device2.id)));
        logTest('Linked caregiver can read patient device (patientId)', true);

        // Test 3: Caregiver Access (Unlinked)
        console.log('\n3️⃣ Testing Caregiver Access (Unlinked)...');

        const caregiver2Auth = testEnv.authenticatedContext(testUsers.caregiver2.uid);
        const caregiver2Db = caregiver2Auth.firestore();

        // Unlinked caregiver cannot access patient1's data
        await assertFails(getDoc(doc(caregiver2Db, 'medications', testData.medication1.id)));
        logTest('Unlinked caregiver cannot read patient medication', true);

        await assertFails(getDoc(doc(caregiver2Db, 'devices', testData.device1.id)));
        logTest('Unlinked caregiver cannot read patient device', true);

        // Test 4: Device and Connection Codes
        console.log('\n4️⃣ Testing Device and Connection Codes...');

        // Linked caregiver can update connection codes
        await assertSucceeds(updateDoc(doc(caregiver1Db, 'connectionCodes', testData.connectionCode1.id), { status: 'used' }));
        logTest('Linked caregiver can update connection codes', true);

        // Unlinked caregiver cannot update connection codes
        await assertFails(updateDoc(doc(caregiver2Db, 'connectionCodes', testData.connectionCode1.id), { status: 'used' }));
        logTest('Unlinked caregiver cannot update connection codes', true);

        // Test additional collections
        console.log('\n5️⃣ Testing Additional Collections...');

        // Test intakeRecords
        await assertSucceeds(addDoc(collection(patient1Db, 'intakeRecords'), {
            patientId: testUsers.patient1.uid,
            medicationId: testData.medication1.id,
            status: 'TAKEN'
        }));
        logTest('Patient can create intake record', true);

        await assertSucceeds(getDoc(doc(patient1Db, 'intakeRecords', 'test-intake-1')));
        // This will fail since we didn't create it, but that's expected for read test
        await assertSucceeds(addDoc(collection(caregiver1Db, 'intakeRecords'), {
            patientId: testUsers.patient1.uid,
            medicationId: testData.medication1.id,
            status: 'TAKEN'
        }));
        logTest('Linked caregiver can create intake record', true);

        await assertFails(addDoc(collection(caregiver2Db, 'intakeRecords'), {
            patientId: testUsers.patient1.uid,
            medicationId: testData.medication1.id,
            status: 'TAKEN'
        }));
        logTest('Unlinked caregiver cannot create intake record', true);

        // Test medicationEvents
        await assertSucceeds(addDoc(collection(patient1Db, 'medicationEvents'), {
            patientId: testUsers.patient1.uid,
            eventType: 'dose_taken'
        }));
        logTest('Patient can create medication event', true);

        await assertSucceeds(addDoc(collection(caregiver1Db, 'medicationEvents'), {
            patientId: testUsers.patient1.uid,
            eventType: 'dose_taken'
        }));
        logTest('Linked caregiver can create medication event', true);

        await assertFails(addDoc(collection(caregiver2Db, 'medicationEvents'), {
            patientId: testUsers.patient1.uid,
            eventType: 'dose_taken'
        }));
        logTest('Unlinked caregiver cannot create medication event', true);

    } catch (error) {
        console.error('❌ Test execution failed:', error);
        logTest('Test execution', false, error);
    } finally {
        // Cleanup
        if (testEnv) {
            await testEnv.cleanup();
        }
    }

    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📈 Total: ${results.passed + results.failed}`);

    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.tests.filter(t => !t.passed).forEach(test => {
            console.log(`   - ${test.name}: ${test.error}`);
        });
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

// Main execution
async function main() {
    try {
        console.log('🚀 Starting Firestore Security Rules Test\n');

        // Run tests
        await runTests();

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

main();
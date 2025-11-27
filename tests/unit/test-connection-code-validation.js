/**
 * Connection Code Validation Test
 * 
 * Tests Task 9.1: Create connection code validation
 * 
 * This test verifies that the connection code validation logic properly handles:
 * - Expired codes with clear error messages
 * - Already-used codes
 * - Invalid codes
 * 
 * Requirements: 5.3, 5.4
 */

const { validateCode, generateCode, useCode, ConnectionCodeError } = require('./src/services/connectionCode');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function logTest(testName) {
  log(`\n▶ ${testName}`, colors.blue);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, colors.green);
}

function logError(message) {
  log(`  ✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`  ⚠ ${message}`, colors.yellow);
}

// Test data
const TEST_PATIENT_EMAIL = 'patient@test.com';
const TEST_PATIENT_PASSWORD = 'testpassword123';
const TEST_CAREGIVER_EMAIL = 'caregiver@test.com';
const TEST_CAREGIVER_PASSWORD = 'testpassword123';
const TEST_DEVICE_ID = 'TEST-DEVICE-001';

let testPatientId = null;
let testCaregiverId = null;

/**
 * Test 1: Validate expired code
 */
async function testExpiredCode() {
  logTest('Test 1: Validate expired code with clear error message');

  try {
    // Sign in as patient
    const patientCred = await signInWithEmailAndPassword(auth, TEST_PATIENT_EMAIL, TEST_PATIENT_PASSWORD);
    testPatientId = patientCred.user.uid;
    logSuccess('Signed in as patient');

    // Create an expired code manually
    const expiredCode = 'EXPIRED1';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await setDoc(doc(db, 'connectionCodes', expiredCode), {
      id: expiredCode,
      deviceId: TEST_DEVICE_ID,
      patientId: testPatientId,
      patientName: 'Test Patient',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(yesterday),
      used: false,
    });
    logSuccess('Created expired connection code');

    // Try to validate the expired code
    try {
      await validateCode(expiredCode);
      logError('Expected CODE_EXPIRED error but validation succeeded');
      return false;
    } catch (error) {
      if (error instanceof ConnectionCodeError && error.code === 'CODE_EXPIRED') {
        logSuccess('Correctly threw CODE_EXPIRED error');
        logSuccess(`Error message: "${error.userMessage}"`);
        
        // Verify error message is clear and helpful
        if (error.userMessage.includes('expirado') || error.userMessage.includes('expired')) {
          logSuccess('Error message clearly indicates expiration');
        } else {
          logWarning('Error message could be clearer about expiration');
        }
        
        return true;
      } else {
        logError(`Expected CODE_EXPIRED but got: ${error.code || error.message}`);
        return false;
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 2: Validate already-used code
 */
async function testAlreadyUsedCode() {
  logTest('Test 2: Validate already-used code');

  try {
    // Sign in as patient
    const patientCred = await signInWithEmailAndPassword(auth, TEST_PATIENT_EMAIL, TEST_PATIENT_PASSWORD);
    testPatientId = patientCred.user.uid;
    logSuccess('Signed in as patient');

    // Create a used code manually
    const usedCode = 'USED1234';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await setDoc(doc(db, 'connectionCodes', usedCode), {
      id: usedCode,
      deviceId: TEST_DEVICE_ID,
      patientId: testPatientId,
      patientName: 'Test Patient',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(tomorrow),
      used: true,
      usedBy: 'some-caregiver-id',
      usedAt: Timestamp.now(),
    });
    logSuccess('Created already-used connection code');

    // Try to validate the used code
    try {
      await validateCode(usedCode);
      logError('Expected CODE_ALREADY_USED error but validation succeeded');
      return false;
    } catch (error) {
      if (error instanceof ConnectionCodeError && error.code === 'CODE_ALREADY_USED') {
        logSuccess('Correctly threw CODE_ALREADY_USED error');
        logSuccess(`Error message: "${error.userMessage}"`);
        
        // Verify error message is clear
        if (error.userMessage.includes('utilizado') || error.userMessage.includes('used')) {
          logSuccess('Error message clearly indicates code was already used');
        } else {
          logWarning('Error message could be clearer about code being used');
        }
        
        return true;
      } else {
        logError(`Expected CODE_ALREADY_USED but got: ${error.code || error.message}`);
        return false;
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 3: Validate invalid/non-existent code
 */
async function testInvalidCode() {
  logTest('Test 3: Validate invalid/non-existent code');

  try {
    // Sign in as patient
    await signInWithEmailAndPassword(auth, TEST_PATIENT_EMAIL, TEST_PATIENT_PASSWORD);
    logSuccess('Signed in as patient');

    // Try to validate a non-existent code
    const invalidCode = 'INVALID1';
    
    try {
      await validateCode(invalidCode);
      logError('Expected CODE_NOT_FOUND error but validation succeeded');
      return false;
    } catch (error) {
      if (error instanceof ConnectionCodeError && error.code === 'CODE_NOT_FOUND') {
        logSuccess('Correctly threw CODE_NOT_FOUND error');
        logSuccess(`Error message: "${error.userMessage}"`);
        
        // Verify error message is helpful
        if (error.userMessage.includes('encontrado') || error.userMessage.includes('not found')) {
          logSuccess('Error message clearly indicates code was not found');
        } else {
          logWarning('Error message could be clearer');
        }
        
        return true;
      } else {
        logError(`Expected CODE_NOT_FOUND but got: ${error.code || error.message}`);
        return false;
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 4: Validate code with invalid format
 */
async function testInvalidFormat() {
  logTest('Test 4: Validate code with invalid format');

  try {
    // Sign in as patient
    await signInWithEmailAndPassword(auth, TEST_PATIENT_EMAIL, TEST_PATIENT_PASSWORD);
    logSuccess('Signed in as patient');

    const testCases = [
      { code: '', description: 'empty string' },
      { code: '12345', description: 'too short (5 chars)' },
      { code: '123456789', description: 'too long (9 chars)' },
      { code: 'ABC-123', description: 'contains special characters' },
      { code: 'abc123', description: 'lowercase letters' },
    ];

    let allPassed = true;

    for (const testCase of testCases) {
      try {
        await validateCode(testCase.code);
        logError(`Expected INVALID_CODE_FORMAT for ${testCase.description} but validation succeeded`);
        allPassed = false;
      } catch (error) {
        if (error instanceof ConnectionCodeError && error.code === 'INVALID_CODE_FORMAT') {
          logSuccess(`Correctly rejected ${testCase.description}`);
        } else {
          logError(`Expected INVALID_CODE_FORMAT for ${testCase.description} but got: ${error.code || error.message}`);
          allPassed = false;
        }
      }
    }

    return allPassed;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 5: Validate valid code (positive test)
 */
async function testValidCode() {
  logTest('Test 5: Validate valid code (positive test)');

  try {
    // Sign in as patient
    const patientCred = await signInWithEmailAndPassword(auth, TEST_PATIENT_EMAIL, TEST_PATIENT_PASSWORD);
    testPatientId = patientCred.user.uid;
    logSuccess('Signed in as patient');

    // Generate a valid code
    const validCode = await generateCode(testPatientId, TEST_DEVICE_ID, 24);
    logSuccess(`Generated valid connection code: ${validCode}`);

    // Validate the code
    const codeData = await validateCode(validCode);
    
    if (!codeData) {
      logError('validateCode returned null for valid code');
      return false;
    }

    logSuccess('Successfully validated code');
    logSuccess(`Patient: ${codeData.patientName}`);
    logSuccess(`Device: ${codeData.deviceId}`);
    logSuccess(`Expires: ${codeData.expiresAt.toLocaleString()}`);
    logSuccess(`Used: ${codeData.used}`);

    // Verify code data
    if (codeData.code !== validCode) {
      logError('Code mismatch in returned data');
      return false;
    }

    if (codeData.patientId !== testPatientId) {
      logError('Patient ID mismatch in returned data');
      return false;
    }

    if (codeData.deviceId !== TEST_DEVICE_ID) {
      logError('Device ID mismatch in returned data');
      return false;
    }

    if (codeData.used !== false) {
      logError('Code should not be marked as used');
      return false;
    }

    logSuccess('All code data fields are correct');
    return true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 6: Validation in confirmation screen flow
 */
async function testConfirmationScreenValidation() {
  logTest('Test 6: Validation in confirmation screen flow');

  try {
    // Sign in as patient and generate code
    const patientCred = await signInWithEmailAndPassword(auth, TEST_PATIENT_EMAIL, TEST_PATIENT_PASSWORD);
    testPatientId = patientCred.user.uid;
    const validCode = await generateCode(testPatientId, TEST_DEVICE_ID, 24);
    logSuccess(`Generated code: ${validCode}`);

    // Sign in as caregiver
    const caregiverCred = await signInWithEmailAndPassword(auth, TEST_CAREGIVER_EMAIL, TEST_CAREGIVER_PASSWORD);
    testCaregiverId = caregiverCred.user.uid;
    logSuccess('Signed in as caregiver');

    // Simulate confirmation screen validation
    logSuccess('Simulating confirmation screen validation...');
    
    // First validation (should succeed)
    const codeData = await validateCode(validCode);
    if (!codeData) {
      logError('First validation failed');
      return false;
    }
    logSuccess('First validation succeeded');

    // Use the code
    await useCode(validCode, testCaregiverId);
    logSuccess('Code used successfully');

    // Try to validate again (should fail with CODE_ALREADY_USED)
    try {
      await validateCode(validCode);
      logError('Expected CODE_ALREADY_USED after using code');
      return false;
    } catch (error) {
      if (error instanceof ConnectionCodeError && error.code === 'CODE_ALREADY_USED') {
        logSuccess('Correctly prevented revalidation of used code');
        return true;
      } else {
        logError(`Expected CODE_ALREADY_USED but got: ${error.code || error.message}`);
        return false;
      }
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  logSection('CONNECTION CODE VALIDATION TESTS - TASK 9.1');
  
  log('Testing connection code validation logic:', colors.cyan);
  log('- Expired codes with clear error messages', colors.cyan);
  log('- Already-used codes', colors.cyan);
  log('- Invalid codes', colors.cyan);
  log('Requirements: 5.3, 5.4\n', colors.cyan);

  const results = {
    passed: 0,
    failed: 0,
    total: 6,
  };

  // Run tests
  const tests = [
    { name: 'Expired Code', fn: testExpiredCode },
    { name: 'Already-Used Code', fn: testAlreadyUsedCode },
    { name: 'Invalid Code', fn: testInvalidCode },
    { name: 'Invalid Format', fn: testInvalidFormat },
    { name: 'Valid Code', fn: testValidCode },
    { name: 'Confirmation Screen Validation', fn: testConfirmationScreenValidation },
  ];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw unexpected error: ${error.message}`);
      results.failed++;
    }
  }

  // Print summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, colors.cyan);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  
  if (results.failed === 0) {
    log('\n✓ All tests passed! Task 9.1 implementation is complete.', colors.green);
  } else {
    log(`\n✗ ${results.failed} test(s) failed. Please review the implementation.`, colors.red);
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

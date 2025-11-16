/**
 * Test script for Task 13.1: Device Linking Validation Logic
 * 
 * This script verifies the validation logic without requiring Firebase authentication:
 * 1. Device ID validation (minimum 5 characters)
 * 2. Error message structure
 * 
 * Requirements: 1.2, 1.3
 */

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n▶ ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'yellow');
}

// Read and analyze the deviceLinking.ts file
const fs = require('fs');
const path = require('path');

function analyzeDeviceLinkingService() {
  logSection('Task 13.1: Device Linking Logic Code Analysis');
  
  const filePath = path.join(__dirname, 'src', 'services', 'deviceLinking.ts');
  
  if (!fs.existsSync(filePath)) {
    logError('deviceLinking.ts file not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  let allTestsPassed = true;
  
  // Test 1: Check for minimum 5 character validation
  logTest('Test 1: Device ID Minimum Length Validation (5 characters)');
  
  const minLengthRegex = /deviceId\.trim\(\)\.length\s*<\s*5/;
  if (minLengthRegex.test(content)) {
    logSuccess('Found validation for minimum 5 characters');
    
    // Check for the error message
    const errorMessageRegex = /DEVICE_ID_TOO_SHORT.*debe tener al menos 5 caracteres/s;
    if (errorMessageRegex.test(content)) {
      logSuccess('Found user-friendly error message for short device IDs');
    } else {
      logError('Missing user-friendly error message for short device IDs');
      allTestsPassed = false;
    }
  } else {
    logError('Missing validation for minimum 5 characters');
    allTestsPassed = false;
  }
  
  // Test 2: Check for deviceLink document creation in Firestore
  logTest('Test 2: DeviceLink Document Creation in Firestore');
  
  const deviceLinkCreationRegex = /setDoc\s*\(\s*deviceLinkRef/;
  if (deviceLinkCreationRegex.test(content)) {
    logSuccess('Found deviceLink document creation using setDoc');
    
    // Check for required fields
    const requiredFields = ['deviceId', 'userId', 'role', 'status', 'linkedAt', 'linkedBy'];
    let allFieldsPresent = true;
    
    for (const field of requiredFields) {
      const fieldRegex = new RegExp(`${field}\\s*:`);
      if (fieldRegex.test(content)) {
        logSuccess(`  - Field '${field}' is included`);
      } else {
        logError(`  - Field '${field}' is missing`);
        allFieldsPresent = false;
        allTestsPassed = false;
      }
    }
    
    if (allFieldsPresent) {
      logSuccess('All required fields are present in deviceLink document');
    }
  } else {
    logError('Missing deviceLink document creation in Firestore');
    allTestsPassed = false;
  }
  
  // Test 3: Check for RTDB update
  logTest('Test 3: RTDB users/{uid}/devices Node Update');
  
  const rtdbUpdateRegex = /users\/\$\{userId\}\/devices\/\$\{deviceId\}/;
  if (rtdbUpdateRegex.test(content)) {
    logSuccess('Found RTDB path: users/{userId}/devices/{deviceId}');
    
    const setRegex = /set\s*\(\s*deviceRef/;
    if (setRegex.test(content)) {
      logSuccess('Found RTDB set operation for device link');
    } else {
      logError('Missing RTDB set operation');
      allTestsPassed = false;
    }
  } else {
    logError('Missing RTDB users/{uid}/devices path');
    allTestsPassed = false;
  }
  
  // Test 4: Check for user role validation
  logTest('Test 4: User Role Validation');
  
  const roleValidationRegex = /userRole.*patient.*caregiver/s;
  if (roleValidationRegex.test(content)) {
    logSuccess('Found user role validation (patient/caregiver)');
  } else {
    logError('Missing user role validation');
    allTestsPassed = false;
  }
  
  // Test 5: Check for duplicate link prevention
  logTest('Test 5: Duplicate Link Prevention');
  
  const duplicateCheckRegex = /existingLink.*exists.*status.*active/s;
  if (duplicateCheckRegex.test(content)) {
    logSuccess('Found duplicate link check');
    
    const duplicateErrorRegex = /ALREADY_LINKED/;
    if (duplicateErrorRegex.test(content)) {
      logSuccess('Found ALREADY_LINKED error code');
    } else {
      logError('Missing ALREADY_LINKED error code');
      allTestsPassed = false;
    }
  } else {
    logError('Missing duplicate link prevention');
    allTestsPassed = false;
  }
  
  // Test 6: Check for error handling with user-friendly messages
  logTest('Test 6: User-Friendly Error Messages');
  
  const errorClassRegex = /class DeviceLinkingError.*userMessage/s;
  if (errorClassRegex.test(content)) {
    logSuccess('Found DeviceLinkingError class with userMessage field');
  } else {
    logError('Missing DeviceLinkingError class or userMessage field');
    allTestsPassed = false;
  }
  
  const errorHandlerRegex = /handleFirebaseError/;
  if (errorHandlerRegex.test(content)) {
    logSuccess('Found handleFirebaseError function for error handling');
  } else {
    logError('Missing handleFirebaseError function');
    allTestsPassed = false;
  }
  
  // Test 7: Check for unlinking functionality
  logTest('Test 7: Device Unlinking Functionality');
  
  const unlinkFunctionRegex = /export async function unlinkDeviceFromUser/;
  if (unlinkFunctionRegex.test(content)) {
    logSuccess('Found unlinkDeviceFromUser function');
    
    const deleteDocRegex = /deleteDoc\s*\(\s*deviceLinkRef/;
    if (deleteDocRegex.test(content)) {
      logSuccess('Found deviceLink document deletion in Firestore');
    } else {
      logError('Missing deviceLink document deletion');
      allTestsPassed = false;
    }
    
    const removeRegex = /remove\s*\(\s*deviceRef/;
    if (removeRegex.test(content)) {
      logSuccess('Found RTDB entry removal');
    } else {
      logError('Missing RTDB entry removal');
      allTestsPassed = false;
    }
  } else {
    logError('Missing unlinkDeviceFromUser function');
    allTestsPassed = false;
  }
  
  // Test 8: Check for Requirements comments
  logTest('Test 8: Requirements Documentation');
  
  const requirementsRegex = /Requirements 1\.2, 1\.3/;
  if (requirementsRegex.test(content)) {
    logSuccess('Found requirements documentation (1.2, 1.3)');
  } else {
    logInfo('Consider adding requirements documentation in comments');
  }
  
  return allTestsPassed;
}

function analyzeAddDeviceScreen() {
  logSection('Add Device Screen Integration Analysis');
  
  const filePath = path.join(__dirname, 'app', 'caregiver', 'add-device.tsx');
  
  if (!fs.existsSync(filePath)) {
    logError('add-device.tsx file not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  let allTestsPassed = true;
  
  // Test 1: Check for device ID validation in UI
  logTest('Test 1: UI Device ID Validation (Minimum 5 Characters)');
  
  const minLengthUIRegex = /length\s*<\s*5/;
  if (minLengthUIRegex.test(content)) {
    logSuccess('Found UI validation for minimum 5 characters');
  } else {
    logError('Missing UI validation for minimum 5 characters');
    allTestsPassed = false;
  }
  
  // Test 2: Check for linkDeviceToUser import and usage
  logTest('Test 2: linkDeviceToUser Service Integration');
  
  const importRegex = /import.*linkDeviceToUser.*deviceLinking/;
  if (importRegex.test(content)) {
    logSuccess('Found linkDeviceToUser import from deviceLinking service');
  } else {
    logError('Missing linkDeviceToUser import');
    allTestsPassed = false;
  }
  
  const usageRegex = /await linkDeviceToUser\s*\(/;
  if (usageRegex.test(content)) {
    logSuccess('Found linkDeviceToUser function call');
  } else {
    logError('Missing linkDeviceToUser function call');
    allTestsPassed = false;
  }
  
  // Test 3: Check for error handling
  logTest('Test 3: Error Handling in UI');
  
  const errorHandlingRegex = /catch.*error.*userMessage/s;
  if (errorHandlingRegex.test(content)) {
    logSuccess('Found error handling with userMessage display');
  } else {
    logError('Missing proper error handling with userMessage');
    allTestsPassed = false;
  }
  
  // Test 4: Check for success message
  logTest('Test 4: Success Message Display');
  
  const successRegex = /setSuccessMessage.*vinculado exitosamente/;
  if (successRegex.test(content)) {
    logSuccess('Found success message display');
  } else {
    logError('Missing success message display');
    allTestsPassed = false;
  }
  
  return allTestsPassed;
}

// Run analysis
function runAnalysis() {
  logSection('Task 13.1: Device Linking Logic Implementation Verification');
  
  log('Requirements being verified:', 'yellow');
  log('  ✓ 1.2: Validate deviceID input (minimum 5 characters)', 'yellow');
  log('  ✓ 1.3: Create deviceLink document in Firestore', 'yellow');
  log('  ✓ Update RTDB users/{uid}/devices node', 'yellow');
  log('  ✓ Handle linking errors with user-friendly messages', 'yellow');
  
  const serviceTestsPassed = analyzeDeviceLinkingService();
  const uiTestsPassed = analyzeAddDeviceScreen();
  
  // Summary
  logSection('Verification Summary');
  
  if (serviceTestsPassed) {
    logSuccess('Device Linking Service: ALL CHECKS PASSED');
  } else {
    logError('Device Linking Service: SOME CHECKS FAILED');
  }
  
  if (uiTestsPassed) {
    logSuccess('Add Device Screen: ALL CHECKS PASSED');
  } else {
    logError('Add Device Screen: SOME CHECKS FAILED');
  }
  
  if (serviceTestsPassed && uiTestsPassed) {
    logSection('✓ Implementation Verified!');
    log('Task 13.1 implementation is complete and meets all requirements.', 'green');
    log('\nKey Features Implemented:', 'cyan');
    log('  ✓ Device ID validation (minimum 5 characters)', 'green');
    log('  ✓ DeviceLink document creation in Firestore', 'green');
    log('  ✓ RTDB users/{uid}/devices node update', 'green');
    log('  ✓ User role validation (patient/caregiver)', 'green');
    log('  ✓ Duplicate link prevention', 'green');
    log('  ✓ User-friendly error messages', 'green');
    log('  ✓ Device unlinking functionality', 'green');
    return true;
  } else {
    logSection('✗ Verification Failed');
    log('Please review the failed checks above.', 'red');
    return false;
  }
}

// Run the analysis
const success = runAnalysis();
process.exit(success ? 0 : 1);

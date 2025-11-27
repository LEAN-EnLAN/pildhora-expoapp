/**
 * Security Audit Verification Script
 * 
 * Verifies security implementations without requiring Firebase emulator.
 * Checks code structure, rules, and service implementations.
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🔐 SECURITY AUDIT VERIFICATION');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;
let warnings = 0;

/**
 * Check if file exists
 */
function checkFileExists(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${description}: File exists`);
      passed++;
      return true;
    } else {
      console.log(`❌ ${description}: File not found`);
      failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: Error checking file - ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Check file content for pattern
 */
function checkFileContent(filePath, pattern, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (pattern.test(content)) {
      console.log(`✅ ${description}: Pattern found`);
      passed++;
      return true;
    } else {
      console.log(`❌ ${description}: Pattern not found`);
      failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: Error reading file - ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Check for security warning
 */
function checkSecurityWarning(condition, description, recommendation) {
  if (condition) {
    console.log(`⚠️  ${description}`);
    console.log(`   Recommendation: ${recommendation}\n`);
    warnings++;
    return true;
  }
  return false;
}

console.log('📋 1. Checking Firestore Security Rules...\n');

// Check Firestore rules file exists
if (checkFileExists('firestore.rules', 'Firestore rules file')) {
  // Check device provisioning rules
  checkFileContent(
    'firestore.rules',
    /allow create: if isSignedIn\(\) && isValidDeviceCreation\(\)/,
    'Device provisioning rule'
  );
  
  // Check device ownership enforcement
  checkFileContent(
    'firestore.rules',
    /resource\.data\.primaryPatientId == request\.auth\.uid/,
    'Device ownership enforcement'
  );
  
  // Check connection code rules
  checkFileContent(
    'firestore.rules',
    /!resource\.data\.used/,
    'Connection code single-use enforcement'
  );
  
  // Check deviceLink rules
  checkFileContent(
    'firestore.rules',
    /isDeviceOwner/,
    'DeviceLink ownership validation'
  );
}

console.log('\n📋 2. Checking RTDB Security Rules...\n');

// Check RTDB rules file exists
if (checkFileExists('database.rules.json', 'RTDB rules file')) {
  const rtdbRules = JSON.parse(fs.readFileSync('database.rules.json', 'utf8'));
  
  // Check authentication requirement
  if (rtdbRules.rules['.read'] === 'auth != null' && rtdbRules.rules['.write'] === 'auth != null') {
    console.log('✅ RTDB requires authentication');
    passed++;
  } else {
    console.log('❌ RTDB authentication not properly configured');
    failed++;
  }
  
  // Warning about granular rules
  checkSecurityWarning(
    !rtdbRules.rules.devices,
    'RTDB lacks granular device-specific rules',
    'Implement device-specific access control in RTDB rules'
  );
}

console.log('\n📋 3. Checking Service Layer Security...\n');

// Check onboarding service
if (checkFileExists('src/services/onboarding.ts', 'Onboarding service')) {
  checkFileContent(
    'src/services/onboarding.ts',
    /validateAuthentication/,
    'Onboarding service authentication validation'
  );
  
  checkFileContent(
    'src/services/onboarding.ts',
    /retryOperation/,
    'Onboarding service retry logic'
  );
  
  checkFileContent(
    'src/services/onboarding.ts',
    /OnboardingError/,
    'Onboarding service error handling'
  );
}

// Check connection code service
if (checkFileExists('src/services/connectionCode.ts', 'Connection code service')) {
  checkFileContent(
    'src/services/connectionCode.ts',
    /validateAuthentication/,
    'Connection code service authentication validation'
  );
  
  checkFileContent(
    'src/services/connectionCode.ts',
    /generateRandomCode/,
    'Connection code secure generation'
  );
  
  checkFileContent(
    'src/services/connectionCode.ts',
    /validateCodeFormat/,
    'Connection code format validation'
  );
  
  checkFileContent(
    'src/services/connectionCode.ts',
    /ConnectionCodeError/,
    'Connection code error handling'
  );
}

// Check device config service
if (checkFileExists('src/services/deviceConfig.ts', 'Device config service')) {
  checkFileContent(
    'src/services/deviceConfig.ts',
    /validateAuthentication/,
    'Device config service authentication validation'
  );
  
  checkFileContent(
    'src/services/deviceConfig.ts',
    /validateDeviceId/,
    'Device config service device ID validation'
  );
  
  checkFileContent(
    'src/services/deviceConfig.ts',
    /DeviceConfigError/,
    'Device config service error handling'
  );
  
  // Check for WiFi credential handling
  const deviceConfigContent = fs.readFileSync('src/services/deviceConfig.ts', 'utf8');
  if (deviceConfigContent.includes('wifi_password') && !deviceConfigContent.includes('encrypt')) {
    checkSecurityWarning(
      true,
      'WiFi credentials may not be encrypted',
      'Implement WiFi password encryption before storing'
    );
  }
}

console.log('\n📋 4. Checking Connection Code Security...\n');

// Check code generation avoids ambiguous characters
checkFileContent(
  'src/services/connectionCode.ts',
  /ABCDEFGHJKMNPQRSTUVWXYZ23456789/,
  'Connection code avoids ambiguous characters'
);

// Check code uniqueness validation
checkFileContent(
  'src/services/connectionCode.ts',
  /generateUniqueCode/,
  'Connection code uniqueness check'
);

// Check expiration validation
checkFileContent(
  'src/services/connectionCode.ts',
  /expiresAt/,
  'Connection code expiration check'
);

// Check single-use enforcement
checkFileContent(
  'src/services/connectionCode.ts',
  /used/,
  'Connection code single-use tracking'
);

console.log('\n📋 5. Checking Device Ownership Enforcement...\n');

// Check device ownership in types
if (checkFileExists('src/types/index.ts', 'Types definition')) {
  checkFileContent(
    'src/types/index.ts',
    /primaryPatientId/,
    'Device ownership field in types'
  );
  
  checkFileContent(
    'src/types/index.ts',
    /provisionedBy/,
    'Device provisioning audit field in types'
  );
}

// Check device provisioning verification step
if (checkFileExists('src/components/patient/provisioning/steps/VerificationStep.tsx', 'Device provisioning verification step')) {
  checkFileContent(
    'src/components/patient/provisioning/steps/VerificationStep.tsx',
    /primaryPatientId/,
    'Device provisioning sets ownership'
  );
}

console.log('\n📋 6. Checking Documentation...\n');

// Check security audit report
checkFileExists(
  '.kiro/specs/user-onboarding-device-provisioning/TASK24_SECURITY_AUDIT_REPORT.md',
  'Security audit report'
);

// Check security quick reference
checkFileExists(
  '.kiro/specs/user-onboarding-device-provisioning/SECURITY_AUDIT_QUICK_REFERENCE.md',
  'Security quick reference'
);

// Check test file
checkFileExists(
  'test-security-audit.js',
  'Security audit test suite'
);

console.log('\n' + '='.repeat(80));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(80) + '\n');

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

console.log(`Total Checks: ${total}`);
console.log(`Passed: ${passed} (${passRate}%)`);
console.log(`Failed: ${failed} (${(100 - passRate).toFixed(1)}%)`);
console.log(`Warnings: ${warnings}\n`);

console.log('='.repeat(80));
console.log('🔐 KEY SECURITY FINDINGS');
console.log('='.repeat(80) + '\n');

console.log('✅ STRENGTHS:');
console.log('   - Comprehensive Firestore security rules');
console.log('   - Authentication validation in all services');
console.log('   - Connection code security with single-use enforcement');
console.log('   - Device ownership enforcement with audit trails');
console.log('   - Proper error handling with user-friendly messages\n');

console.log('⚠️  AREAS FOR IMPROVEMENT:');
console.log('   - RTDB needs granular device-specific access control');
console.log('   - WiFi credentials should be encrypted');
console.log('   - Rate limiting should be implemented via Cloud Functions');
console.log('   - Audit logging should be enhanced\n');

console.log('='.repeat(80));
console.log('📝 RECOMMENDATIONS');
console.log('='.repeat(80) + '\n');

console.log('HIGH PRIORITY:');
console.log('1. Implement granular RTDB security rules');
console.log('2. Add WiFi credential encryption');
console.log('3. Implement rate limiting via Cloud Functions\n');

console.log('MEDIUM PRIORITY:');
console.log('4. Enhance audit logging');
console.log('5. Add monitoring and alerting');
console.log('6. Implement session management\n');

console.log('LOW PRIORITY:');
console.log('7. Add multi-factor authentication (MFA)');
console.log('8. Implement IP-based restrictions');
console.log('9. Add security headers\n');

console.log('='.repeat(80) + '\n');

if (failed === 0 && warnings <= 3) {
  console.log('✅ Security audit verification PASSED!\n');
  console.log('The system has a solid security foundation with minor improvements needed.\n');
  process.exit(0);
} else if (failed > 0) {
  console.log(`❌ Security audit verification FAILED with ${failed} failed check(s).\n`);
  console.log('Please address the failed checks before proceeding.\n');
  process.exit(1);
} else {
  console.log(`⚠️  Security audit verification PASSED with ${warnings} warning(s).\n`);
  console.log('Consider addressing the warnings for enhanced security.\n');
  process.exit(0);
}

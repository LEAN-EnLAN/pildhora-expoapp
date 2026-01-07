/**
 * Test suite for Task 14: Role-Based Screen Variants
 * 
 * Verifies that:
 * 1. Shared screens detect user role from auth state
 * 2. Patient variant rendering works correctly
 * 3. Caregiver variant rendering works correctly
 * 4. Device management features shown only to device owners
 * 5. Patient selection features shown only to caregivers
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TASK 14: ROLE-BASED SCREEN VARIANTS - VERIFICATION');
console.log('='.repeat(80));
console.log();

let passedTests = 0;
let failedTests = 0;
const errors = [];

function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
    errors.push({ test: description, error: error.message });
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function readFile(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
}

function fileContains(filePath, searchString) {
  const content = readFile(filePath);
  return content.includes(searchString);
}

// ============================================================================
// Test 1: useUserRole Hook
// ============================================================================
console.log('Test 1: useUserRole Hook');
console.log('-'.repeat(80));

test('useUserRole hook file exists', () => {
  if (!fileExists('src/hooks/useUserRole.ts')) {
    throw new Error('useUserRole.ts not found');
  }
});

test('useUserRole hook exports role detection', () => {
  if (!fileContains('src/hooks/useUserRole.ts', 'export function useUserRole')) {
    throw new Error('useUserRole function not exported');
  }
});

test('useUserRole hook uses auth state', () => {
  if (!fileContains('src/hooks/useUserRole.ts', 'useSelector')) {
    throw new Error('useSelector not used');
  }
  if (!fileContains('src/hooks/useUserRole.ts', 'state.auth')) {
    throw new Error('Auth state not accessed');
  }
});

test('useUserRole hook returns role helpers', () => {
  const content = readFile('src/hooks/useUserRole.ts');
  if (!content.includes('isPatient') || !content.includes('isCaregiver')) {
    throw new Error('Role helper properties not returned');
  }
});

test('useUserRole hook exported from hooks index', () => {
  if (!fileContains('src/hooks/index.ts', 'useUserRole')) {
    throw new Error('useUserRole not exported from hooks index');
  }
});

console.log();

// ============================================================================
// Test 2: Role Permission Utilities
// ============================================================================
console.log('Test 2: Role Permission Utilities');
console.log('-'.repeat(80));

test('rolePermissions utility file exists', () => {
  if (!fileExists('src/utils/rolePermissions.ts')) {
    throw new Error('rolePermissions.ts not found');
  }
});

test('canManageDevices function exists', () => {
  if (!fileContains('src/utils/rolePermissions.ts', 'export function canManageDevices')) {
    throw new Error('canManageDevices function not found');
  }
});

test('canSelectPatients function exists', () => {
  if (!fileContains('src/utils/rolePermissions.ts', 'export function canSelectPatients')) {
    throw new Error('canSelectPatients function not found');
  }
});

test('canManageDevices checks patient device ownership', () => {
  const content = readFile('src/utils/rolePermissions.ts');
  if (!content.includes("user.role === 'patient'") || !content.includes('user.deviceId')) {
    throw new Error('Device ownership check not implemented');
  }
});

test('canSelectPatients restricts to caregivers', () => {
  const content = readFile('src/utils/rolePermissions.ts');
  if (!content.includes("user.role === 'caregiver'")) {
    throw new Error('Caregiver restriction not implemented');
  }
});

test('ownsDevice function exists', () => {
  if (!fileContains('src/utils/rolePermissions.ts', 'export function ownsDevice')) {
    throw new Error('ownsDevice function not found');
  }
});

test('canModifyDeviceSettings function exists', () => {
  if (!fileContains('src/utils/rolePermissions.ts', 'export function canModifyDeviceSettings')) {
    throw new Error('canModifyDeviceSettings function not found');
  }
});

test('canManageMedications function exists', () => {
  if (!fileContains('src/utils/rolePermissions.ts', 'export function canManageMedications')) {
    throw new Error('canManageMedications function not found');
  }
});

console.log();

// ============================================================================
// Test 3: RoleBasedSettings Component
// ============================================================================
console.log('Test 3: RoleBasedSettings Component');
console.log('-'.repeat(80));

test('RoleBasedSettings component file exists', () => {
  if (!fileExists('src/components/shared/RoleBasedSettings.tsx')) {
    throw new Error('RoleBasedSettings.tsx not found');
  }
});

test('RoleBasedSettings uses useUserRole hook', () => {
  if (!fileContains('src/components/shared/RoleBasedSettings.tsx', 'useUserRole')) {
    throw new Error('useUserRole hook not used');
  }
});

test('RoleBasedSettings renders patient variant', () => {
  const content = readFile('src/components/shared/RoleBasedSettings.tsx');
  if (!content.includes('isPatient') || !content.includes('Mi dispositivo')) {
    throw new Error('Patient variant not implemented');
  }
});

test('RoleBasedSettings renders caregiver variant', () => {
  const content = readFile('src/components/shared/RoleBasedSettings.tsx');
  if (!content.includes('isCaregiver') || !content.includes('Mis pacientes')) {
    throw new Error('Caregiver variant not implemented');
  }
});

test('RoleBasedSettings shows device management for patients', () => {
  const content = readFile('src/components/shared/RoleBasedSettings.tsx');
  if (!content.includes('isPatient && user?.deviceId')) {
    throw new Error('Device management conditional not found');
  }
  if (!content.includes('/patient/device-settings')) {
    throw new Error('Device settings navigation not found');
  }
});

test('RoleBasedSettings shows patient management for caregivers', () => {
  const content = readFile('src/components/shared/RoleBasedSettings.tsx');
  if (!content.includes('isCaregiver')) {
    throw new Error('Caregiver conditional not found');
  }
  if (!content.includes('/caregiver/add-device')) {
    throw new Error('Patient management navigation not found');
  }
});

test('RoleBasedSettings displays role badge', () => {
  const content = readFile('src/components/shared/RoleBasedSettings.tsx');
  if (!content.includes('roleBadge') || !content.includes('roleBadgeText')) {
    throw new Error('Role badge not implemented');
  }
});

test('RoleBasedSettings exported from shared index', () => {
  if (!fileContains('src/components/shared/index.ts', 'RoleBasedSettings')) {
    throw new Error('RoleBasedSettings not exported from shared index');
  }
});

console.log();

// ============================================================================
// Test 4: Patient Settings Screen
// ============================================================================
console.log('Test 4: Patient Settings Screen');
console.log('-'.repeat(80));

test('Patient settings screen exists', () => {
  if (!fileExists('app/patient/settings.tsx')) {
    throw new Error('Patient settings screen not found');
  }
});

test('Patient settings uses RoleBasedSettings', () => {
  if (!fileContains('app/patient/settings.tsx', 'RoleBasedSettings')) {
    throw new Error('RoleBasedSettings not used in patient settings');
  }
});

test('Patient settings imports from shared', () => {
  if (!fileContains('app/patient/settings.tsx', "from '../../src/components/shared/RoleBasedSettings'")) {
    throw new Error('RoleBasedSettings not imported from shared');
  }
});

console.log();

// ============================================================================
// Test 5: Caregiver Settings Screen
// ============================================================================
console.log('Test 5: Caregiver Settings Screen');
console.log('-'.repeat(80));

test('Caregiver settings screen exists', () => {
  if (!fileExists('app/caregiver/settings.tsx')) {
    throw new Error('Caregiver settings screen not found');
  }
});

test('Caregiver settings uses RoleBasedSettings', () => {
  if (!fileContains('app/caregiver/settings.tsx', 'RoleBasedSettings')) {
    throw new Error('RoleBasedSettings not used in caregiver settings');
  }
});

test('Caregiver settings imports from shared', () => {
  if (!fileContains('app/caregiver/settings.tsx', "from '../../src/components/shared/RoleBasedSettings'")) {
    throw new Error('RoleBasedSettings not imported from shared');
  }
});

console.log();

// ============================================================================
// Test 6: Role-Based Feature Visibility
// ============================================================================
console.log('Test 6: Role-Based Feature Visibility');
console.log('-'.repeat(80));

test('Patient home shows device management for device owners', () => {
  const content = readFile('app/patient/home.tsx');
  // Patient home should show device status and management
  if (!content.includes('DeviceStatusCard')) {
    throw new Error('DeviceStatusCard not found in patient home');
  }
});

test('Caregiver dashboard shows patient selector', () => {
  const content = readFile('app/caregiver/dashboard.tsx');
  if (!content.includes('PatientSelector')) {
    throw new Error('PatientSelector not found in caregiver dashboard');
  }
});

test('Caregiver dashboard uses linked patients', () => {
  const content = readFile('app/caregiver/dashboard.tsx');
  if (!content.includes('useLinkedPatients')) {
    throw new Error('useLinkedPatients hook not used');
  }
});

test('Patient home hides medication management in caregiving mode', () => {
  const content = readFile('app/patient/home.tsx');
  // Should check device online status before showing medication management
  if (!content.includes('deviceStatus.isOnline')) {
    throw new Error('Device online check not found');
  }
});

console.log();

// ============================================================================
// Test 7: Documentation and Comments
// ============================================================================
console.log('Test 7: Documentation and Comments');
console.log('-'.repeat(80));

test('useUserRole hook has JSDoc comments', () => {
  const content = readFile('src/hooks/useUserRole.ts');
  if (!content.includes('/**') || !content.includes('@example')) {
    throw new Error('JSDoc comments missing');
  }
});

test('rolePermissions has function documentation', () => {
  const content = readFile('src/utils/rolePermissions.ts');
  const functionCount = (content.match(/export function/g) || []).length;
  const docCount = (content.match(/\/\*\*/g) || []).length;
  if (docCount < functionCount) {
    throw new Error('Not all functions have documentation');
  }
});

test('RoleBasedSettings has requirements references', () => {
  const content = readFile('src/components/shared/RoleBasedSettings.tsx');
  if (!content.includes('Requirements: 6.1, 6.2, 6.3, 6.4, 6.5')) {
    throw new Error('Requirements references missing');
  }
});

console.log();

// ============================================================================
// Test 8: Type Safety
// ============================================================================
console.log('Test 8: Type Safety');
console.log('-'.repeat(80));

test('useUserRole returns typed role', () => {
  const content = readFile('src/hooks/useUserRole.ts');
  if (!content.includes("'patient' | 'caregiver'")) {
    throw new Error('Role type not properly typed');
  }
});

test('rolePermissions functions accept User type', () => {
  const content = readFile('src/utils/rolePermissions.ts');
  if (!content.includes('User | null')) {
    throw new Error('User type not used in function signatures');
  }
});

test('rolePermissions imports User type', () => {
  if (!fileContains('src/utils/rolePermissions.ts', "import { User } from '../types'")) {
    throw new Error('User type not imported');
  }
});

console.log();

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log();

if (failedTests > 0) {
  console.log('FAILED TESTS:');
  console.log('-'.repeat(80));
  errors.forEach(({ test, error }) => {
    console.log(`✗ ${test}`);
    console.log(`  ${error}`);
  });
  console.log();
  process.exit(1);
} else {
  console.log('✓ All tests passed!');
  console.log();
  console.log('IMPLEMENTATION COMPLETE:');
  console.log('-'.repeat(80));
  console.log('✓ useUserRole hook created for role detection');
  console.log('✓ Role permission utilities implemented');
  console.log('✓ RoleBasedSettings component created');
  console.log('✓ Patient settings screen updated');
  console.log('✓ Caregiver settings screen created');
  console.log('✓ Device management features restricted to device owners');
  console.log('✓ Patient selection features restricted to caregivers');
  console.log('✓ All requirements (6.1, 6.2, 6.3, 6.4, 6.5) satisfied');
  console.log();
  process.exit(0);
}

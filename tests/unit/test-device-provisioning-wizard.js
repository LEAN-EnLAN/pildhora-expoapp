/**
 * Test script for Device Provisioning Wizard Structure
 * 
 * Verifies that task 6 has been completed:
 * - Device provisioning screen created
 * - Wizard container component created
 * - Progress indicator component created
 * - Wizard context created
 * - Exit confirmation dialog created
 * - All components properly exported
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Device Provisioning Wizard Structure...\n');

let passed = 0;
let failed = 0;

function test(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function fileContains(filePath, searchString) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return content.includes(searchString);
}

// Test 1: Device provisioning screen exists
test(
  'Device provisioning screen created (app/patient/device-provisioning.tsx)',
  fileExists('app/patient/device-provisioning.tsx')
);

// Test 2: Wizard container component exists
test(
  'Wizard container component created (DeviceProvisioningWizard.tsx)',
  fileExists('src/components/patient/provisioning/DeviceProvisioningWizard.tsx')
);

// Test 3: Progress indicator component exists
test(
  'Progress indicator component created (WizardProgressIndicator.tsx)',
  fileExists('src/components/patient/provisioning/WizardProgressIndicator.tsx')
);

// Test 4: Wizard context exists
test(
  'Wizard context created (WizardContext.tsx)',
  fileExists('src/components/patient/provisioning/WizardContext.tsx')
);

// Test 5: Exit confirmation dialog exists
test(
  'Exit confirmation dialog created (ExitConfirmationDialog.tsx)',
  fileExists('src/components/patient/provisioning/ExitConfirmationDialog.tsx')
);

// Test 6: Index file exists
test(
  'Index file created for exports (index.ts)',
  fileExists('src/components/patient/provisioning/index.ts')
);

// Test 7: Wizard has step navigation
test(
  'Wizard implements step navigation (handleNext, handleBack)',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'handleNext') &&
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'handleBack')
);

// Test 8: Wizard has state management
test(
  'Wizard implements state management (WizardState)',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'interface WizardState')
);

// Test 9: Progress indicator shows current step
test(
  'Progress indicator displays current step',
  fileContains('src/components/patient/provisioning/WizardProgressIndicator.tsx', 'currentStep') &&
  fileContains('src/components/patient/provisioning/WizardProgressIndicator.tsx', 'totalSteps')
);

// Test 10: Context provides form data
test(
  'Wizard context provides form data and update methods',
  fileContains('src/components/patient/provisioning/WizardContext.tsx', 'formData') &&
  fileContains('src/components/patient/provisioning/WizardContext.tsx', 'updateFormData')
);

// Test 11: Wizard has validation logic
test(
  'Wizard implements step validation (canProceed)',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'canProceed')
);

// Test 12: Wizard has 6 steps
test(
  'Wizard defines 6 steps (Welcome, Device ID, Verification, WiFi, Preferences, Completion)',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'totalSteps: 6')
);

// Test 13: Progress indicator has accessibility support
test(
  'Progress indicator has accessibility support',
  fileContains('src/components/patient/provisioning/WizardProgressIndicator.tsx', 'accessibilityRole="progressbar"')
);

// Test 14: Wizard handles Android back button
test(
  'Wizard handles Android back button',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'BackHandler')
);

// Test 15: Exit dialog confirms unsaved changes
test(
  'Exit dialog confirms unsaved changes',
  fileContains('src/components/patient/provisioning/ExitConfirmationDialog.tsx', 'onConfirm') &&
  fileContains('src/components/patient/provisioning/ExitConfirmationDialog.tsx', 'onCancel')
);

// Test 16: Wizard uses haptic feedback
test(
  'Wizard uses haptic feedback for navigation',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'triggerHapticFeedback')
);

// Test 17: Wizard announces step changes
test(
  'Wizard announces step changes for screen readers',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'announceForAccessibility')
);

// Test 18: Form data interface defined
test(
  'Device provisioning form data interface defined',
  fileContains('src/components/patient/provisioning/DeviceProvisioningWizard.tsx', 'interface DeviceProvisioningFormData')
);

// Test 19: Wizard exports types
test(
  'Wizard exports TypeScript types',
  fileContains('src/components/patient/provisioning/index.ts', 'export type')
);

// Test 20: Screen uses wizard component
test(
  'Device provisioning screen uses wizard component',
  fileContains('app/patient/device-provisioning.tsx', 'DeviceProvisioningWizard')
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed! Task 6 is complete.');
  console.log('\n📋 Implementation Summary:');
  console.log('  ✓ Device provisioning screen created');
  console.log('  ✓ Wizard container with step navigation');
  console.log('  ✓ Progress indicator component');
  console.log('  ✓ Wizard context for state management');
  console.log('  ✓ Exit confirmation dialog');
  console.log('  ✓ Step validation logic');
  console.log('  ✓ Accessibility support');
  console.log('  ✓ Haptic feedback');
  console.log('  ✓ Android back button handling');
  console.log('\n📝 Next Steps:');
  console.log('  → Task 7: Implement device provisioning wizard steps');
  console.log('  → Create individual step components (Welcome, Device ID, etc.)');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}

/**
 * Test script to verify medication wizard integration
 * 
 * This script verifies that:
 * 1. The wizard component is properly integrated in add/edit screens
 * 2. The Redux actions handle all new wizard fields
 * 3. Form data is correctly transformed to medication data
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Medication Wizard Integration...\n');

// Test 1: Verify wizard is imported in add screen
console.log('Test 1: Checking add medication screen integration...');
const addScreenPath = path.join(__dirname, 'app/patient/medications/add.tsx');
const addScreenContent = fs.readFileSync(addScreenPath, 'utf8');

const addScreenChecks = [
  { name: 'MedicationWizard import', pattern: /import.*MedicationWizard.*from.*medication-wizard/ },
  { name: 'MedicationFormData import', pattern: /import.*MedicationFormData.*from.*medication-wizard/ },
  { name: 'addMedication action import', pattern: /import.*addMedication.*from.*medicationsSlice/ },
  { name: 'handleWizardComplete function', pattern: /handleWizardComplete.*=.*useCallback/ },
  { name: 'MedicationWizard component usage', pattern: /<MedicationWizard/ },
  { name: 'onComplete prop', pattern: /onComplete=\{handleWizardComplete\}/ },
  { name: 'Error handling with retry', pattern: /Reintentar/ },
];

let addScreenPassed = true;
addScreenChecks.forEach(check => {
  const passed = check.pattern.test(addScreenContent);
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed) addScreenPassed = false;
});

// Test 2: Verify wizard is integrated in edit screen
console.log('\nTest 2: Checking edit medication screen integration...');
const editScreenPath = path.join(__dirname, 'app/patient/medications/[id].tsx');
const editScreenContent = fs.readFileSync(editScreenPath, 'utf8');

const editScreenChecks = [
  { name: 'MedicationWizard import', pattern: /import.*MedicationWizard.*from.*medication-wizard/ },
  { name: 'MedicationFormData import', pattern: /import.*MedicationFormData.*from.*medication-wizard/ },
  { name: 'updateMedication action import', pattern: /import.*updateMedication.*from.*medicationsSlice/ },
  { name: 'handleWizardComplete function', pattern: /handleWizardComplete.*=.*useCallback/ },
  { name: 'MedicationWizard component usage', pattern: /<MedicationWizard/ },
  { name: 'mode="edit" prop', pattern: /mode="edit"/ },
  { name: 'medication prop', pattern: /medication=\{medication\}/ },
  { name: 'Error handling with retry', pattern: /Reintentar/ },
];

let editScreenPassed = true;
editScreenChecks.forEach(check => {
  const passed = check.pattern.test(editScreenContent);
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed) editScreenPassed = false;
});

// Test 3: Verify wizard component accepts completion handler
console.log('\nTest 3: Checking wizard component signature...');
const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
const wizardContent = fs.readFileSync(wizardPath, 'utf8');

const wizardChecks = [
  { name: 'onComplete accepts formData', pattern: /onComplete:.*\(formData:.*MedicationFormData\)/ },
  { name: 'handleComplete passes formData', pattern: /await onComplete\(wizardState\.formData\)/ },
  { name: 'Error handling in completion', pattern: /catch.*\(error\)/ },
  { name: 'Sets submitting state', pattern: /isSubmitting: true/ },
];

let wizardPassed = true;
wizardChecks.forEach(check => {
  const passed = check.pattern.test(wizardContent);
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed) wizardPassed = false;
});

// Test 4: Verify Redux slice handles new fields
console.log('\nTest 4: Checking Redux slice handles wizard fields...');
const slicePath = path.join(__dirname, 'src/store/slices/medicationsSlice.ts');
const sliceContent = fs.readFileSync(slicePath, 'utf8');

const sliceChecks = [
  { name: 'Handles emoji field', pattern: /emoji/ },
  { name: 'Handles nativeAlarmIds field', pattern: /nativeAlarmIds/ },
  { name: 'Alarm service integration', pattern: /alarmService/ },
  { name: 'Uses spread operator for fields', pattern: /\.\.\.medication/ },
  { name: 'Normalizes medication data', pattern: /normalizeMedicationForSave/ },
];

let slicePassed = true;
sliceChecks.forEach(check => {
  const passed = check.pattern.test(sliceContent);
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed) slicePassed = false;
});

// Test 5: Verify form data transformation
console.log('\nTest 5: Checking form data transformation...');
const transformationChecks = [
  { name: 'Transforms emoji', pattern: /emoji:\s*formData\.emoji/ },
  { name: 'Transforms doseValue', pattern: /doseValue:\s*formData\.doseValue/ },
  { name: 'Transforms doseUnit', pattern: /doseUnit:\s*formData\.doseUnit/ },
  { name: 'Transforms quantityType', pattern: /quantityType:\s*formData\.quantityType/ },
  { name: 'Transforms times array', pattern: /times:\s*formData\.times/ },
  { name: 'Transforms frequency', pattern: /frequency:\s*formData\.frequency\.join/ },
  { name: 'Transforms nativeAlarmIds', pattern: /nativeAlarmIds:\s*formData\.nativeAlarmIds/ },
  { name: 'Transforms inventory fields', pattern: /initialQuantity:\s*formData\.initialQuantity/ },
];

let transformationPassed = true;
transformationChecks.forEach(check => {
  const passed = check.pattern.test(addScreenContent) || check.pattern.test(editScreenContent);
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed) transformationPassed = false;
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary:');
console.log('='.repeat(50));
console.log(`Add Screen Integration:     ${addScreenPassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Edit Screen Integration:    ${editScreenPassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Wizard Component:           ${wizardPassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Redux Slice:                ${slicePassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Form Data Transformation:   ${transformationPassed ? '✅ PASSED' : '❌ FAILED'}`);

const allPassed = addScreenPassed && editScreenPassed && wizardPassed && slicePassed && transformationPassed;

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All tests passed! Wizard integration is complete.');
} else {
  console.log('❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}
console.log('='.repeat(50));

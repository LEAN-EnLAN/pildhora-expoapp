/**
 * Test: Medication Wizard Integration for Caregivers (Task 11.2)
 * 
 * This test verifies that the medication wizard is properly integrated
 * for caregivers with the following requirements:
 * 1. Navigate to medication wizard on "Add" button press
 * 2. Pass patientId and caregiverId as params
 * 3. Handle wizard completion and navigation back
 * 4. Refresh medication list after wizard completion
 */

console.log('='.repeat(80));
console.log('MEDICATION WIZARD INTEGRATION TEST (Task 11.2)');
console.log('='.repeat(80));

const fs = require('fs');
const path = require('path');

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function testPassed(testName) {
  results.passed.push(testName);
  console.log(`✅ PASS: ${testName}`);
}

function testFailed(testName, reason) {
  results.failed.push({ test: testName, reason });
  console.log(`❌ FAIL: ${testName}`);
  console.log(`   Reason: ${reason}`);
}

function testWarning(testName, reason) {
  results.warnings.push({ test: testName, reason });
  console.log(`⚠️  WARN: ${testName}`);
  console.log(`   Reason: ${reason}`);
}

// Test 1: Verify add medication screen exists
console.log('\n📋 Test 1: Verify add medication screen exists');
const addScreenPath = path.join(__dirname, 'app/caregiver/medications/[patientId]/add.tsx');
if (fs.existsSync(addScreenPath)) {
  testPassed('Add medication screen file exists');
} else {
  testFailed('Add medication screen file exists', 'File not found at expected path');
}

// Test 2: Verify navigation to wizard on Add button press
console.log('\n📋 Test 2: Verify navigation to wizard on Add button press');
const indexScreenPath = path.join(__dirname, 'app/caregiver/medications/[patientId]/index.tsx');
const indexContent = fs.readFileSync(indexScreenPath, 'utf8');

if (indexContent.includes('router.push(`/caregiver/medications/${pid}/add`)')) {
  testPassed('Navigation to add screen implemented');
} else {
  testFailed('Navigation to add screen implemented', 'router.push to add screen not found');
}

// Test 3: Verify patientId is passed as route param
console.log('\n📋 Test 3: Verify patientId is passed as route param');
const addContent = fs.readFileSync(addScreenPath, 'utf8');

if (addContent.includes('useLocalSearchParams()') && addContent.includes('patientId')) {
  testPassed('PatientId extracted from route params');
} else {
  testFailed('PatientId extracted from route params', 'useLocalSearchParams or patientId not found');
}

// Test 4: Verify caregiverId is passed to medication data
console.log('\n📋 Test 4: Verify caregiverId is passed to medication data');
if (addContent.includes('caregiverId: user.id')) {
  testPassed('CaregiverId passed to medication data');
} else {
  testFailed('CaregiverId passed to medication data', 'caregiverId assignment not found');
}

// Test 5: Verify wizard completion handler
console.log('\n📋 Test 5: Verify wizard completion handler');
if (addContent.includes('handleWizardComplete') && 
    addContent.includes('dispatch(addMedication(medicationData))')) {
  testPassed('Wizard completion handler implemented');
} else {
  testFailed('Wizard completion handler implemented', 'handleWizardComplete or dispatch not found');
}

// Test 6: Verify navigation back after completion
console.log('\n📋 Test 6: Verify navigation back after completion');
if (addContent.includes('router.back()')) {
  testPassed('Navigation back after completion');
} else {
  testFailed('Navigation back after completion', 'router.back() not found');
}

// Test 7: Verify wizard cancellation handler
console.log('\n📋 Test 7: Verify wizard cancellation handler');
if (addContent.includes('handleWizardCancel') && 
    addContent.includes('onCancel={handleWizardCancel}')) {
  testPassed('Wizard cancellation handler implemented');
} else {
  testFailed('Wizard cancellation handler implemented', 'handleWizardCancel not found');
}

// Test 8: Verify MedicationWizard component is used
console.log('\n📋 Test 8: Verify MedicationWizard component is used');
if (addContent.includes('import') && 
    addContent.includes('MedicationWizard') &&
    addContent.includes('<MedicationWizard')) {
  testPassed('MedicationWizard component imported and used');
} else {
  testFailed('MedicationWizard component imported and used', 'MedicationWizard import or usage not found');
}

// Test 9: Verify wizard mode is set to 'add'
console.log('\n📋 Test 9: Verify wizard mode is set to "add"');
if (addContent.includes('mode="add"')) {
  testPassed('Wizard mode set to "add"');
} else {
  testFailed('Wizard mode set to "add"', 'mode="add" prop not found');
}

// Test 10: Verify medication list refresh on focus
console.log('\n📋 Test 10: Verify medication list refresh on focus');
if (indexContent.includes('useFocusEffect') && 
    indexContent.includes('fetchMedications')) {
  testPassed('Medication list refreshes on screen focus');
} else {
  testFailed('Medication list refreshes on screen focus', 'useFocusEffect with fetchMedications not found');
}

// Test 11: Verify patient name is fetched for event generation
console.log('\n📋 Test 11: Verify patient name is fetched for event generation');
if (addContent.includes('getPatientById') && 
    addContent.includes('setPatientName')) {
  testPassed('Patient name fetched for event generation');
} else {
  testWarning('Patient name fetched for event generation', 'getPatientById or setPatientName not found');
}

// Test 12: Verify medication event is created
console.log('\n📋 Test 12: Verify medication event is created');
if (addContent.includes('createAndEnqueueEvent')) {
  testPassed('Medication event creation implemented');
} else {
  testWarning('Medication event creation implemented', 'createAndEnqueueEvent not found');
}

// Test 13: Verify error handling
console.log('\n📋 Test 13: Verify error handling');
if (addContent.includes('try') && 
    addContent.includes('catch') &&
    addContent.includes('Alert.alert')) {
  testPassed('Error handling implemented');
} else {
  testFailed('Error handling implemented', 'try/catch or Alert.alert not found');
}

// Test 14: Verify retry functionality on error
console.log('\n📋 Test 14: Verify retry functionality on error');
if (addContent.includes('Reintentar') && 
    addContent.includes('onPress: () => handleWizardComplete(formData)')) {
  testPassed('Retry functionality on error');
} else {
  testWarning('Retry functionality on error', 'Retry button or handler not found');
}

// Test 15: Verify success message
console.log('\n📋 Test 15: Verify success message');
if (addContent.includes('Éxito') && 
    addContent.includes('Medicamento agregado correctamente')) {
  testPassed('Success message displayed');
} else {
  testWarning('Success message displayed', 'Success alert not found');
}

// Test 16: Verify header with back button
console.log('\n📋 Test 16: Verify header with back button');
if (addContent.includes('headerTitle') && 
    addContent.includes('Agregar Medicamento') &&
    addContent.includes('handleBack')) {
  testPassed('Header with back button implemented');
} else {
  testFailed('Header with back button implemented', 'Header or back button not found');
}

// Test 17: Verify accessibility labels
console.log('\n📋 Test 17: Verify accessibility labels');
const accessibilityCount = (addContent.match(/accessibilityLabel/g) || []).length;
if (accessibilityCount >= 2) {
  testPassed(`Accessibility labels present (${accessibilityCount} found)`);
} else {
  testWarning(`Accessibility labels present (${accessibilityCount} found)`, 'Should have more accessibility labels');
}

// Test 18: Verify inventory tracking is passed
console.log('\n📋 Test 18: Verify inventory tracking is passed');
if (addContent.includes('trackInventory') && 
    addContent.includes('initialQuantity') &&
    addContent.includes('lowQuantityThreshold')) {
  testPassed('Inventory tracking fields passed to medication');
} else {
  testWarning('Inventory tracking fields passed to medication', 'Inventory fields not found');
}

// Test 19: Verify schedule data is passed correctly
console.log('\n📋 Test 19: Verify schedule data is passed correctly');
if (addContent.includes('times: formData.times') && 
    addContent.includes('frequency: formData.frequency.join')) {
  testPassed('Schedule data passed correctly');
} else {
  testFailed('Schedule data passed correctly', 'Schedule data mapping not found');
}

// Test 20: Verify dosage data is passed correctly
console.log('\n📋 Test 20: Verify dosage data is passed correctly');
if (addContent.includes('doseValue: formData.doseValue') && 
    addContent.includes('doseUnit: formData.doseUnit') &&
    addContent.includes('quantityType: formData.quantityType')) {
  testPassed('Dosage data passed correctly');
} else {
  testFailed('Dosage data passed correctly', 'Dosage data mapping not found');
}

// Print summary
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`📊 Total: ${results.passed.length + results.failed.length + results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.failed.forEach(({ test, reason }) => {
    console.log(`  - ${test}`);
    console.log(`    ${reason}`);
  });
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.warnings.forEach(({ test, reason }) => {
    console.log(`  - ${test}`);
    console.log(`    ${reason}`);
  });
}

console.log('\n' + '='.repeat(80));
if (results.failed.length === 0) {
  console.log('✅ ALL CRITICAL TESTS PASSED!');
  console.log('Task 11.2: Medication wizard integration for caregivers is complete.');
} else {
  console.log('❌ SOME TESTS FAILED - Please review the implementation.');
}
console.log('='.repeat(80));

// Exit with appropriate code
process.exit(results.failed.length > 0 ? 1 : 0);

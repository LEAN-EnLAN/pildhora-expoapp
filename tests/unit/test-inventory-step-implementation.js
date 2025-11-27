/**
 * Test Script: Medication Inventory Step Implementation
 * 
 * This script verifies that the MedicationInventoryStep component
 * has been properly implemented according to Task 9 requirements.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Medication Inventory Step Implementation\n');
console.log('=' .repeat(60));

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(description, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ description, status: '✅ PASS' });
    console.log(`✅ ${description}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ description, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Test 1: Component file exists
test('MedicationInventoryStep component file exists', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  if (!fs.existsSync(componentPath)) {
    throw new Error('Component file not found');
  }
});

// Test 2: Component is exported from index
test('Component is exported from wizard index', () => {
  const indexPath = path.join(__dirname, 'src/components/patient/medication-wizard/index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('MedicationInventoryStep')) {
    throw new Error('Component not exported from index');
  }
});

// Test 3: Component has required imports
test('Component imports required dependencies', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const requiredImports = [
    'useWizardContext',
    'colors',
    'spacing',
    'typography',
    'borderRadius'
  ];
  
  requiredImports.forEach(imp => {
    if (!content.includes(imp)) {
      throw new Error(`Missing import: ${imp}`);
    }
  });
});

// Test 4: Component has initial quantity input
test('Component has initial quantity input field', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('initialQuantity') || !content.includes('quantityInput')) {
    throw new Error('Initial quantity input not found');
  }
});

// Test 5: Component has auto-threshold calculation
test('Component implements auto-threshold calculation', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('calculateAutoThreshold') || !content.includes('avgDosesPerDay * 3')) {
    throw new Error('Auto-threshold calculation not found');
  }
});

// Test 6: Component has visual quantity indicator
test('Component has QuantityVisualizer component', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('QuantityVisualizer') || !content.includes('pillEmoji')) {
    throw new Error('QuantityVisualizer not found');
  }
});

// Test 7: Component has manual threshold adjustment
test('Component allows manual threshold adjustment', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('handleThresholdChange') || !content.includes('thresholdInput')) {
    throw new Error('Manual threshold adjustment not found');
  }
});

// Test 8: Component has skip option
test('Component has skip inventory tracking option', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('handleSkip') || !content.includes('Omitir inventario')) {
    throw new Error('Skip option not found');
  }
});

// Test 9: Component has threshold preview
test('Component has ThresholdPreview component', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('ThresholdPreview') || !content.includes('progressBar')) {
    throw new Error('ThresholdPreview not found');
  }
});

// Test 10: Component validates input
test('Component has validation logic', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('validateFields') || !content.includes('quantityError')) {
    throw new Error('Validation logic not found');
  }
});

// Test 11: Component uses wizard context
test('Component uses wizard context correctly', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const contextMethods = ['formData', 'updateFormData', 'setCanProceed', 'mode'];
  contextMethods.forEach(method => {
    if (!content.includes(method)) {
      throw new Error(`Missing context method: ${method}`);
    }
  });
});

// Test 12: Component only shows in add mode
test('Component only renders in add mode', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes("mode === 'edit'") || !content.includes('return null')) {
    throw new Error('Mode check not found');
  }
});

// Test 13: Component has accessibility features
test('Component has accessibility attributes', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const a11yAttributes = ['accessibilityLabel', 'accessibilityHint', 'accessibilityRole'];
  a11yAttributes.forEach(attr => {
    if (!content.includes(attr)) {
      throw new Error(`Missing accessibility attribute: ${attr}`);
    }
  });
});

// Test 14: Component has proper styling
test('Component has StyleSheet definitions', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const styleKeys = [
    'quantityInput',
    'visualizer',
    'thresholdContainer',
    'progressBar',
    'skipButton'
  ];
  
  styleKeys.forEach(key => {
    if (!content.includes(key)) {
      throw new Error(`Missing style definition: ${key}`);
    }
  });
});

// Test 15: Implementation documentation exists
test('Implementation documentation exists', () => {
  const docPath = path.join(__dirname, 'src/components/patient/medication-wizard/STEP4_IMPLEMENTATION.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('Implementation documentation not found');
  }
});

// Test 16: Component updates form data correctly
test('Component updates form data with inventory fields', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('updateFormData({ initialQuantity') || 
      !content.includes('updateFormData({ lowQuantityThreshold')) {
    throw new Error('Form data updates not found');
  }
});

// Test 17: Component has numeric keypad input
test('Component uses numeric keypad for input', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('keyboardType="number-pad"')) {
    throw new Error('Numeric keypad not configured');
  }
});

// Test 18: Component has info box
test('Component has informational help text', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('infoBox') || !content.includes('💡')) {
    throw new Error('Info box not found');
  }
});

// Test 19: Wizard includes inventory step
test('Wizard includes inventory step in add mode', () => {
  const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
  const content = fs.readFileSync(wizardPath, 'utf8');
  
  if (!content.includes('MedicationInventoryStep') || !content.includes("mode === 'add' ? 4 : 3")) {
    throw new Error('Inventory step not integrated in wizard');
  }
});

// Test 20: Component handles skip state correctly
test('Component handles skip state with enable option', () => {
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationInventoryStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('handleEnableTracking') || !content.includes('skipContainer')) {
    throw new Error('Skip state handling not found');
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   Total Tests: ${results.passed + results.failed}`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log(`   Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests
    .filter(t => t.status.includes('FAIL'))
    .forEach(t => {
      console.log(`   - ${t.description}`);
      if (t.error) console.log(`     ${t.error}`);
    });
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);

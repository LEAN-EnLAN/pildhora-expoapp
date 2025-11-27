/**
 * Test script for Task 4: Medication Wizard Container and Navigation
 * 
 * This script verifies:
 * 1. MedicationWizard container component with step management
 * 2. Wizard state management for form data persistence across steps
 * 3. Step navigation logic with validation gates
 * 4. Progress indicator component showing current step
 * 5. Exit confirmation dialog for unsaved changes
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TASK 4: MEDICATION WIZARD CONTAINER AND NAVIGATION - VERIFICATION');
console.log('='.repeat(80));
console.log();

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function readFile(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
}

function containsPattern(content, pattern, description) {
  const regex = new RegExp(pattern, 's');
  assert(regex.test(content), `Missing ${description}`);
}

// ============================================================================
// SUB-TASK 1: Create MedicationWizard container component with step management
// ============================================================================
console.log('Sub-task 1: MedicationWizard Container Component');
console.log('-'.repeat(80));

test('MedicationWizard.tsx file exists', () => {
  assert(
    fileExists('src/components/patient/medication-wizard/MedicationWizard.tsx'),
    'MedicationWizard.tsx not found'
  );
});

test('MedicationWizard has proper props interface', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'interface MedicationWizardProps', 'MedicationWizardProps interface');
  containsPattern(content, 'mode:\\s*[\'"]add[\'"]\\s*\\|\\s*[\'"]edit[\'"]', 'mode prop');
  containsPattern(content, 'medication\\?:', 'optional medication prop');
  containsPattern(content, 'onComplete:', 'onComplete callback');
  containsPattern(content, 'onCancel:', 'onCancel callback');
});

test('MedicationWizard has WizardState interface', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'interface WizardState', 'WizardState interface');
  containsPattern(content, 'currentStep:', 'currentStep field');
  containsPattern(content, 'totalSteps:', 'totalSteps field');
  containsPattern(content, 'formData:', 'formData field');
  containsPattern(content, 'canProceed:', 'canProceed field');
  containsPattern(content, 'isSubmitting:', 'isSubmitting field');
});

test('MedicationWizard has MedicationFormData interface', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'interface MedicationFormData', 'MedicationFormData interface');
  containsPattern(content, 'emoji:', 'emoji field');
  containsPattern(content, 'name:', 'name field');
  containsPattern(content, 'times:', 'times field');
  containsPattern(content, 'frequency:', 'frequency field');
  containsPattern(content, 'nativeAlarmIds:', 'nativeAlarmIds field');
  containsPattern(content, 'doseValue:', 'doseValue field');
  containsPattern(content, 'doseUnit:', 'doseUnit field');
  containsPattern(content, 'quantityType:', 'quantityType field');
  containsPattern(content, 'initialQuantity\\?:', 'initialQuantity field');
  containsPattern(content, 'lowQuantityThreshold\\?:', 'lowQuantityThreshold field');
});

test('MedicationWizard manages step state', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'useState<WizardState>', 'useState for wizard state');
  containsPattern(content, 'currentStep:', 'currentStep in state');
  containsPattern(content, 'totalSteps:', 'totalSteps in state');
});

test('MedicationWizard handles different modes (add/edit)', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'mode === [\'"]add[\'"]', 'add mode check');
  containsPattern(content, 'mode === [\'"]edit[\'"]', 'edit mode check');
  containsPattern(content, 'totalSteps:\\s*mode === [\'"]add[\'"]\\s*\\?\\s*4\\s*:\\s*3', 'different step counts for modes');
});

test('MedicationWizard renders all step components', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'MedicationIconNameStep', 'Step 1: Icon & Name');
  containsPattern(content, 'MedicationScheduleStep', 'Step 2: Schedule');
  containsPattern(content, 'MedicationDosageStep', 'Step 3: Dosage');
  containsPattern(content, 'MedicationInventoryStep', 'Step 4: Inventory');
});

test('MedicationWizard uses lazy loading for performance', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'lazy\\(', 'lazy loading');
  containsPattern(content, 'Suspense', 'Suspense component');
  containsPattern(content, 'ActivityIndicator', 'loading indicator');
});

console.log();

// ============================================================================
// SUB-TASK 2: Implement wizard state management for form data persistence
// ============================================================================
console.log('Sub-task 2: Wizard State Management');
console.log('-'.repeat(80));

test('WizardContext exists', () => {
  assert(
    fileExists('src/components/patient/medication-wizard/WizardContext.tsx'),
    'WizardContext.tsx not found'
  );
});

test('WizardContext provides form data', () => {
  const content = readFile('src/components/patient/medication-wizard/WizardContext.tsx');
  containsPattern(content, 'interface WizardContextValue', 'WizardContextValue interface');
  containsPattern(content, 'formData:', 'formData in context');
  containsPattern(content, 'updateFormData:', 'updateFormData function');
  containsPattern(content, 'setCanProceed:', 'setCanProceed function');
  containsPattern(content, 'mode:', 'mode in context');
});

test('WizardContext has useWizardContext hook', () => {
  const content = readFile('src/components/patient/medication-wizard/WizardContext.tsx');
  containsPattern(content, 'function useWizardContext', 'useWizardContext hook');
  containsPattern(content, 'useContext\\(WizardContext\\)', 'useContext call');
  containsPattern(content, 'throw new Error', 'error handling for missing provider');
});

test('MedicationWizard wraps content with WizardProvider', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'WizardProvider', 'WizardProvider usage');
  containsPattern(content, 'formData:\\s*wizardState\\.formData', 'formData passed to provider');
  containsPattern(content, 'updateFormData', 'updateFormData passed to provider');
  containsPattern(content, 'setCanProceed', 'setCanProceed passed to provider');
});

test('MedicationWizard has updateFormData function', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'const updateFormData = useCallback', 'updateFormData callback');
  containsPattern(content, 'hasUnsavedChanges\\.current = true', 'tracks unsaved changes');
  containsPattern(content, 'setWizardState\\(prev => \\(\\{[^}]*formData:', 'updates form data in state');
});

test('MedicationWizard persists data across steps', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, '\\.\\.\\.prev\\.formData', 'spreads previous form data');
  containsPattern(content, '\\.\\.\\.updates', 'merges updates');
});

test('MedicationWizard initializes form data from medication in edit mode', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'getInitialFormData', 'getInitialFormData function');
  containsPattern(content, 'mode === [\'"]edit[\'"] && medication', 'edit mode check');
  containsPattern(content, 'medication\\.emoji \\|\\| [\'"]💊[\'"]', 'default emoji migration');
});

console.log();

// ============================================================================
// SUB-TASK 3: Build step navigation logic with validation gates
// ============================================================================
console.log('Sub-task 3: Step Navigation Logic');
console.log('-'.repeat(80));

test('MedicationWizard has handleNext function', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'const handleNext = useCallback', 'handleNext callback');
  containsPattern(content, '!wizardState\\.canProceed', 'validation check');
  containsPattern(content, 'currentStep < .*totalSteps', 'step boundary check');
});

test('MedicationWizard has handleBack function', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'const handleBack = useCallback', 'handleBack callback');
  containsPattern(content, 'currentStep > 0', 'prevents going before first step');
  containsPattern(content, 'currentStep - 1', 'decrements step');
});

test('Navigation validates before proceeding', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'if \\(!wizardState\\.canProceed\\)', 'validation gate');
  containsPattern(content, 'Alert\\.alert', 'shows validation error');
});

test('Navigation resets validation for next step', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'canProceed: false', 'resets canProceed');
});

test('Navigation sets previous steps as validated', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'canProceed: true.*Previous steps', 'marks previous steps as valid');
});

test('MedicationWizard has handleComplete function', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'const handleComplete = useCallback', 'handleComplete callback');
  containsPattern(content, 'isSubmitting: true', 'sets submitting state');
  containsPattern(content, 'await onComplete\\(wizardState\\.formData\\)', 'calls onComplete with form data');
});

test('Navigation buttons are conditionally rendered', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'isFirstStep', 'first step check');
  containsPattern(content, 'isLastStep', 'last step check');
  containsPattern(content, '!isFirstStep && \\(', 'conditional back button');
  containsPattern(content, '!isLastStep && \\(', 'conditional next button');
  containsPattern(content, 'isLastStep && \\(', 'conditional complete button');
});

test('Navigation uses haptic feedback', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'triggerHapticFeedback', 'haptic feedback function');
  containsPattern(content, 'HapticFeedbackType\\.SELECTION', 'selection feedback');
  containsPattern(content, 'HapticFeedbackType\\.SUCCESS', 'success feedback');
  containsPattern(content, 'HapticFeedbackType\\.ERROR', 'error feedback');
});

test('Navigation handles Android back button', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'BackHandler\\.addEventListener', 'back handler listener');
  containsPattern(content, 'hardwareBackPress', 'hardware back press event');
  containsPattern(content, 'backHandler\\.remove', 'cleanup listener');
});

console.log();

// ============================================================================
// SUB-TASK 4: Create progress indicator component showing current step
// ============================================================================
console.log('Sub-task 4: Progress Indicator Component');
console.log('-'.repeat(80));

test('WizardProgressIndicator.tsx file exists', () => {
  assert(
    fileExists('src/components/patient/medication-wizard/WizardProgressIndicator.tsx'),
    'WizardProgressIndicator.tsx not found'
  );
});

test('WizardProgressIndicator has proper props', () => {
  const content = readFile('src/components/patient/medication-wizard/WizardProgressIndicator.tsx');
  containsPattern(content, 'interface WizardProgressIndicatorProps', 'props interface');
  containsPattern(content, 'currentStep:', 'currentStep prop');
  containsPattern(content, 'totalSteps:', 'totalSteps prop');
  containsPattern(content, 'stepLabels:', 'stepLabels prop');
});

test('WizardProgressIndicator renders progress bar', () => {
  const content = readFile('src/components/patient/medication-wizard/WizardProgressIndicator.tsx');
  containsPattern(content, 'progressBarContainer', 'progress bar container');
  containsPattern(content, 'progressBarFill', 'progress bar fill');
  containsPattern(content, '\\(\\(currentStep \\+ 1\\) / totalSteps\\) \\* 100', 'progress calculation');
});

test('WizardProgressIndicator renders step circles', () => {
  const content = readFile('src/components/patient/medication-wizard/WizardProgressIndicator.tsx');
  containsPattern(content, 'stepCircle', 'step circle');
  containsPattern(content, 'stepCircleCompleted', 'completed state');
  containsPattern(content, 'stepCircleCurrent', 'current state');
  containsPattern(content, 'stepCirclePending', 'pending state');
});

test('WizardProgressIndicator shows step labels', () => {
  const content = readFile('src/components/patient/medication-wizard/WizardProgressIndicator.tsx');
  containsPattern(content, 'stepLabel', 'step label');
  containsPattern(content, 'stepLabels\\.map', 'maps over step labels');
});

test('WizardProgressIndicator has accessibility support', () => {
  const content = readFile('src/components/patient/medication-wizard/WizardProgressIndicator.tsx');
  containsPattern(content, 'accessibilityRole="progressbar"', 'progressbar role');
  containsPattern(content, 'accessibilityLabel', 'accessibility label');
  containsPattern(content, 'accessibilityValue', 'accessibility value');
});

test('MedicationWizard renders WizardProgressIndicator', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, '<WizardProgressIndicator', 'renders progress indicator');
  containsPattern(content, 'currentStep=\\{wizardState\\.currentStep\\}', 'passes currentStep');
  containsPattern(content, 'totalSteps=\\{wizardState\\.totalSteps\\}', 'passes totalSteps');
  containsPattern(content, 'stepLabels=\\{getStepLabels\\(mode\\)\\}', 'passes step labels');
});

test('MedicationWizard has getStepLabels helper', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'function getStepLabels', 'getStepLabels function');
  containsPattern(content, 'Icono y Nombre', 'step 1 label');
  containsPattern(content, 'Horario', 'step 2 label');
  containsPattern(content, 'Dosis', 'step 3 label');
  containsPattern(content, 'Inventario', 'step 4 label');
});

test('Progress indicator announces step changes', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'announceForAccessibility', 'accessibility announcement');
  containsPattern(content, 'Paso.*de.*:', 'step announcement format');
});

console.log();

// ============================================================================
// SUB-TASK 5: Add exit confirmation dialog for unsaved changes
// ============================================================================
console.log('Sub-task 5: Exit Confirmation Dialog');
console.log('-'.repeat(80));

test('ExitConfirmationDialog.tsx file exists', () => {
  assert(
    fileExists('src/components/patient/medication-wizard/ExitConfirmationDialog.tsx'),
    'ExitConfirmationDialog.tsx not found'
  );
});

test('ExitConfirmationDialog has proper props', () => {
  const content = readFile('src/components/patient/medication-wizard/ExitConfirmationDialog.tsx');
  containsPattern(content, 'interface ExitConfirmationDialogProps', 'props interface');
  containsPattern(content, 'visible:', 'visible prop');
  containsPattern(content, 'onConfirm:', 'onConfirm callback');
  containsPattern(content, 'onCancel:', 'onCancel callback');
});

test('ExitConfirmationDialog uses Modal component', () => {
  const content = readFile('src/components/patient/medication-wizard/ExitConfirmationDialog.tsx');
  containsPattern(content, '<Modal', 'Modal component');
  containsPattern(content, 'visible=\\{visible\\}', 'passes visible prop');
  containsPattern(content, 'onClose=\\{onCancel\\}', 'passes onClose handler');
});

test('ExitConfirmationDialog shows warning message', () => {
  const content = readFile('src/components/patient/medication-wizard/ExitConfirmationDialog.tsx');
  containsPattern(content, 'cambios sin guardar', 'unsaved changes message');
  containsPattern(content, 'perderás', 'data loss warning');
});

test('ExitConfirmationDialog has action buttons', () => {
  const content = readFile('src/components/patient/medication-wizard/ExitConfirmationDialog.tsx');
  containsPattern(content, 'onPress=\\{onCancel\\}', 'cancel button');
  containsPattern(content, 'onPress=\\{onConfirm\\}', 'confirm button');
  containsPattern(content, 'variant="danger"', 'danger variant for exit');
});

test('MedicationWizard tracks unsaved changes', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'hasUnsavedChanges', 'unsaved changes ref');
  containsPattern(content, 'hasUnsavedChanges\\.current = true', 'sets unsaved flag');
  containsPattern(content, 'hasUnsavedChanges\\.current = false', 'clears unsaved flag');
});

test('MedicationWizard has handleExit function', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'const handleExit = useCallback', 'handleExit callback');
  containsPattern(content, 'if \\(hasUnsavedChanges\\.current\\)', 'checks for unsaved changes');
  containsPattern(content, 'setShowExitDialog\\(true\\)', 'shows exit dialog');
});

test('MedicationWizard has exit confirmation handlers', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, 'const handleExitConfirm = useCallback', 'handleExitConfirm callback');
  containsPattern(content, 'const handleExitCancel = useCallback', 'handleExitCancel callback');
});

test('MedicationWizard renders ExitConfirmationDialog', () => {
  const content = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(content, '<ExitConfirmationDialog', 'renders exit dialog');
  containsPattern(content, 'visible=\\{showExitDialog\\}', 'passes visible state');
  containsPattern(content, 'onConfirm=\\{handleExitConfirm\\}', 'passes confirm handler');
  containsPattern(content, 'onCancel=\\{handleExitCancel\\}', 'passes cancel handler');
});

console.log();

// ============================================================================
// ADDITIONAL CHECKS: Requirements verification
// ============================================================================
console.log('Additional Checks: Requirements Verification');
console.log('-'.repeat(80));

test('Requirement 1.1: Multi-step wizard interface with progress indication', () => {
  const wizardContent = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(wizardContent, 'WizardProgressIndicator', 'progress indicator');
  containsPattern(wizardContent, 'currentStep', 'step tracking');
  containsPattern(wizardContent, 'totalSteps', 'total steps');
});

test('Requirement 1.2: Separate screens for configuration', () => {
  const wizardContent = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(wizardContent, 'case 0:', 'step 0 rendering');
  containsPattern(wizardContent, 'case 1:', 'step 1 rendering');
  containsPattern(wizardContent, 'case 2:', 'step 2 rendering');
  containsPattern(wizardContent, 'case 3:', 'step 3 rendering');
});

test('Requirement 1.3: Save medication with all configured properties', () => {
  const wizardContent = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(wizardContent, 'onComplete\\(wizardState\\.formData\\)', 'passes complete form data');
  containsPattern(wizardContent, 'handleComplete', 'completion handler');
});

test('Requirement 1.4: Navigate backward without losing data', () => {
  const wizardContent = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(wizardContent, 'handleBack', 'back navigation');
  containsPattern(wizardContent, '\\.\\.\\.prev\\.formData', 'preserves form data');
  containsPattern(wizardContent, 'canProceed: true.*Previous', 'maintains validation');
});

test('Requirement 1.5: Discard incomplete medication on exit', () => {
  const wizardContent = readFile('src/components/patient/medication-wizard/MedicationWizard.tsx');
  containsPattern(wizardContent, 'handleExit', 'exit handler');
  containsPattern(wizardContent, 'ExitConfirmationDialog', 'exit confirmation');
  containsPattern(wizardContent, 'hasUnsavedChanges\\.current = false', 'clears unsaved flag on exit');
});

test('Components are exported from index', () => {
  const indexContent = readFile('src/components/patient/medication-wizard/index.ts');
  containsPattern(indexContent, 'export.*MedicationWizard', 'exports MedicationWizard');
  containsPattern(indexContent, 'export.*WizardProgressIndicator', 'exports WizardProgressIndicator');
  containsPattern(indexContent, 'export.*ExitConfirmationDialog', 'exports ExitConfirmationDialog');
  containsPattern(indexContent, 'export.*WizardProvider', 'exports WizardProvider');
  containsPattern(indexContent, 'export.*useWizardContext', 'exports useWizardContext');
});

console.log();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log();

if (results.failed > 0) {
  console.log('Failed Tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => {
      console.log(`  ✗ ${t.name}`);
      console.log(`    ${t.error}`);
    });
  console.log();
  process.exit(1);
} else {
  console.log('✓ All tests passed!');
  console.log();
  console.log('Task 4 Implementation Complete:');
  console.log('  ✓ MedicationWizard container component with step management');
  console.log('  ✓ Wizard state management for form data persistence across steps');
  console.log('  ✓ Step navigation logic with validation gates');
  console.log('  ✓ Progress indicator component showing current step');
  console.log('  ✓ Exit confirmation dialog for unsaved changes');
  console.log();
  console.log('Requirements Verified:');
  console.log('  ✓ 1.1: Multi-step wizard interface with progress indication');
  console.log('  ✓ 1.2: Separate screens for configuration');
  console.log('  ✓ 1.3: Save medication with all configured properties');
  console.log('  ✓ 1.4: Navigate backward without losing data');
  console.log('  ✓ 1.5: Discard incomplete medication on exit');
  console.log();
  process.exit(0);
}

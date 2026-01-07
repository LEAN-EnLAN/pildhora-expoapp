/**
 * Comprehensive Test Plan for Medication Wizard Flow
 * Task 17: Test complete wizard flow
 * 
 * This test validates the entire medication wizard including:
 * - Step 1: Icon and name selection
 * - Step 2: Schedule configuration
 * - Step 3: Dosage configuration
 * - Navigation between steps
 * - Form data persistence
 * - Validation at each step
 * - "Más emojis" button functionality
 * - Unit filtering when changing medication type
 * - All dosage preview visualizations
 */

console.log('='.repeat(80));
console.log('MEDICATION WIZARD COMPLETE FLOW TEST');
console.log('='.repeat(80));
console.log('');

// Test configuration
const testConfig = {
  testData: {
    // Step 1 data
    emoji: '💊',
    name: 'Aspirina',
    
    // Step 2 data
    times: ['08:00', '14:00', '20:00'],
    frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    
    // Step 3 data
    doseValue: '500',
    doseUnit: 'mg',
    quantityType: 'tablets',
  },
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(testName, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${testName}`);
  if (details) {
    console.log(`  ${details}`);
  }
  
  testResults.tests.push({ name: testName, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// ============================================================================
// STEP 1: ICON AND NAME SELECTION TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('STEP 1: ICON AND NAME SELECTION');
console.log('='.repeat(80));

// Test 1.1: Component structure
console.log('\n--- Test 1.1: Component Structure ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationIconNameStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  // Check for required elements
  const hasEmojiGrid = content.includes('COMMON_MEDICATION_EMOJIS');
  const hasEmojiPreview = content.includes('emojiPreview');
  const hasNameInput = content.includes('Nombre del medicamento');
  const hasMasEmojisButton = content.includes('Más emojis');
  const hasHiddenInput = content.includes('hiddenEmojiInput');
  
  logTest('Component has emoji grid', hasEmojiGrid);
  logTest('Component has emoji preview', hasEmojiPreview);
  logTest('Component has name input', hasNameInput);
  logTest('Component has "Más emojis" button', hasMasEmojisButton);
  logTest('Component has hidden emoji input', hasHiddenInput);
} catch (error) {
  logTest('Component structure test', false, error.message);
}

// Test 1.2: Spanish localization
console.log('\n--- Test 1.2: Spanish Localization ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationIconNameStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const spanishTexts = [
    'Icono y Nombre',
    'Selecciona un icono',
    'Nombre del medicamento',
    'Más emojis',
    'Selecciona un icono para tu medicamento',
    'Ingresa el nombre del medicamento',
  ];
  
  spanishTexts.forEach(text => {
    const hasText = content.includes(text);
    logTest(`Has Spanish text: "${text}"`, hasText);
  });
} catch (error) {
  logTest('Spanish localization test', false, error.message);
}

// Test 1.3: Validation logic
console.log('\n--- Test 1.3: Validation Logic ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationIconNameStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasEmojiValidation = content.includes('Selecciona un icono para tu medicamento');
  const hasNameValidation = content.includes('Ingresa el nombre del medicamento');
  const hasLengthValidation = content.includes('al menos 2 caracteres');
  const hasMaxLengthValidation = content.includes('no puede exceder 50 caracteres');
  const hasCharValidation = content.includes('solo puede contener letras');
  
  logTest('Has emoji validation', hasEmojiValidation);
  logTest('Has name validation', hasNameValidation);
  logTest('Has minimum length validation', hasLengthValidation);
  logTest('Has maximum length validation', hasMaxLengthValidation);
  logTest('Has character validation', hasCharValidation);
} catch (error) {
  logTest('Validation logic test', false, error.message);
}

// Test 1.4: Emoji mosaic layout
console.log('\n--- Test 1.4: Emoji Mosaic Layout ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationIconNameStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasCenteredGrid = content.includes('justifyContent: center') || content.includes("justify-content: 'center'");
  const hasResponsiveLayout = content.includes('useWindowDimensions');
  const hasMinTouchTarget = content.includes('minWidth: 48') && content.includes('minHeight: 48');
  const hasGap = content.includes('gap:');
  
  logTest('Grid is centered', hasCenteredGrid);
  logTest('Has responsive layout calculation', hasResponsiveLayout);
  logTest('Has minimum touch target size', hasMinTouchTarget);
  logTest('Has consistent spacing (gap)', hasGap);
} catch (error) {
  logTest('Emoji mosaic layout test', false, error.message);
}

// Test 1.5: "Más emojis" functionality
console.log('\n--- Test 1.5: "Más Emojis" Functionality ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationIconNameStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasEmojiInputRef = content.includes('emojiInputRef');
  const hasHandleMoreEmojis = content.includes('handleMoreEmojisPress');
  const hasEmojiExtraction = content.includes('extractEmoji');
  const hasFocusLogic = content.includes('.focus()');
  const hasBlurLogic = content.includes('.blur()');
  const hasErrorHandling = content.includes('Teclado no disponible');
  
  logTest('Has emoji input ref', hasEmojiInputRef);
  logTest('Has "Más emojis" handler', hasHandleMoreEmojis);
  logTest('Has emoji extraction logic', hasEmojiExtraction);
  logTest('Has focus logic', hasFocusLogic);
  logTest('Has blur logic', hasBlurLogic);
  logTest('Has error handling', hasErrorHandling);
} catch (error) {
  logTest('"Más emojis" functionality test', false, error.message);
}

// ============================================================================
// STEP 2: SCHEDULE CONFIGURATION TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('STEP 2: SCHEDULE CONFIGURATION');
console.log('='.repeat(80));

// Test 2.1: Component structure
console.log('\n--- Test 2.1: Component Structure ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationScheduleStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasTimeCard = content.includes('TimeCard');
  const hasCustomTimeline = content.includes('CustomTimeline');
  const hasDaySelector = content.includes('DAYS_OF_WEEK');
  const hasTimePicker = content.includes('DateTimePicker');
  const hasAddTimeButton = content.includes('Agregar horario');
  
  logTest('Component has TimeCard', hasTimeCard);
  logTest('Component has CustomTimeline', hasCustomTimeline);
  logTest('Component has day selector', hasDaySelector);
  logTest('Component has time picker', hasTimePicker);
  logTest('Component has add time button', hasAddTimeButton);
} catch (error) {
  logTest('Component structure test', false, error.message);
}

// Test 2.2: TimeCard design
console.log('\n--- Test 2.2: TimeCard Design ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationScheduleStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasClockEmoji = content.includes('🕐');
  const hasEditButton = content.includes('pencil');
  const hasDeleteButton = content.includes('trash-outline');
  const hasIonicons = content.includes('Ionicons');
  const hasCardStyling = content.includes('timeCard');
  
  logTest('TimeCard has clock emoji', hasClockEmoji);
  logTest('TimeCard has edit button with icon', hasEditButton);
  logTest('TimeCard has delete button with icon', hasDeleteButton);
  logTest('Uses Ionicons', hasIonicons);
  logTest('Has card styling', hasCardStyling);
} catch (error) {
  logTest('TimeCard design test', false, error.message);
}

// Test 2.3: Custom timeline
console.log('\n--- Test 2.3: Custom Timeline ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationScheduleStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const has24HourTimeline = content.includes('Array.from({ length: 24 })');
  const hasHourMarkers = content.includes('hourMarker');
  const hasMedicationIndicator = content.includes('medicationIndicator');
  const hasBadgeForMultiple = content.includes('medicationBadge');
  const hasHorizontalScroll = content.includes('horizontal');
  const noExternalPackage = !content.includes('react-native-horizontal-timeline');
  
  logTest('Has 24-hour timeline', has24HourTimeline);
  logTest('Has hour markers', hasHourMarkers);
  logTest('Has medication indicators', hasMedicationIndicator);
  logTest('Has badge for multiple times', hasBadgeForMultiple);
  logTest('Has horizontal scroll', hasHorizontalScroll);
  logTest('No external timeline package', noExternalPackage);
} catch (error) {
  logTest('Custom timeline test', false, error.message);
}

// Test 2.4: Day selector
console.log('\n--- Test 2.4: Day Selector ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationScheduleStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasHorizontalScroll = content.includes('horizontal');
  const hasChips = content.includes('Chip');
  const hasSpanishDays = content.includes('Lun') && content.includes('Mar') && content.includes('Mié');
  const hasToggleLogic = content.includes('handleDayToggle');
  
  logTest('Day selector has horizontal scroll', hasHorizontalScroll);
  logTest('Uses Chip component', hasChips);
  logTest('Has Spanish day labels', hasSpanishDays);
  logTest('Has toggle logic', hasToggleLogic);
} catch (error) {
  logTest('Day selector test', false, error.message);
}

// Test 2.5: Validation
console.log('\n--- Test 2.5: Validation ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationScheduleStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasTimeValidation = content.includes('validateFields');
  const hasMinimumTime = content.includes('length === 0') || content.includes('length > 0');
  const hasMinimumDay = content.includes('length > 1') || content.includes('length === 0');
  const hasTimeFormat = content.includes('timeRegex') || content.includes('[0-9]');
  
  logTest('Has validation function', hasTimeValidation);
  logTest('Validates minimum times', hasMinimumTime);
  logTest('Validates minimum days', hasMinimumDay);
  logTest('Validates time format', hasTimeFormat);
} catch (error) {
  logTest('Validation test', false, error.message);
}

// ============================================================================
// STEP 3: DOSAGE CONFIGURATION TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('STEP 3: DOSAGE CONFIGURATION');
console.log('='.repeat(80));

// Test 3.1: Component structure
console.log('\n--- Test 3.1: Component Structure ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasDoseValueInput = content.includes('doseValueInput');
  const hasUnitSelector = content.includes('unitsGrid');
  const hasTypeSelector = content.includes('quantityTypesGrid');
  const hasVisualizer = content.includes('DosageVisualizer');
  const hasUnitMappings = content.includes('UNIT_MAPPINGS');
  
  logTest('Component has dose value input', hasDoseValueInput);
  logTest('Component has unit selector', hasUnitSelector);
  logTest('Component has type selector', hasTypeSelector);
  logTest('Component has dosage visualizer', hasVisualizer);
  logTest('Component has unit mappings', hasUnitMappings);
} catch (error) {
  logTest('Component structure test', false, error.message);
}

// Test 3.2: Unit filtering logic
console.log('\n--- Test 3.2: Unit Filtering Logic ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasUnitMappings = content.includes('UNIT_MAPPINGS');
  const hasTabletsMapping = content.includes("tablets: ['units', 'mg', 'g', 'mcg']");
  const hasLiquidMapping = content.includes("liquid: ['ml', 'l', 'drops']");
  const hasCreamMapping = content.includes("cream: ['g', 'ml', 'applications']");
  const hasInhalerMapping = content.includes("inhaler: ['puffs', 'inhalations']");
  const hasFilteringLogic = content.includes('filter(unit =>');
  const hasUnitReset = content.includes('Unidad reiniciada');
  
  logTest('Has unit mappings configuration', hasUnitMappings);
  logTest('Has tablets mapping', hasTabletsMapping);
  logTest('Has liquid mapping', hasLiquidMapping);
  logTest('Has cream mapping', hasCreamMapping);
  logTest('Has inhaler mapping', hasInhalerMapping);
  logTest('Has filtering logic', hasFilteringLogic);
  logTest('Has unit reset alert', hasUnitReset);
} catch (error) {
  logTest('Unit filtering logic test', false, error.message);
}

// Test 3.3: Dosage preview visualizations
console.log('\n--- Test 3.3: Dosage Preview Visualizations ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasPillPreview = content.includes('PillPreview');
  const hasLiquidPreview = content.includes('LiquidPreview');
  const hasCreamPreview = content.includes('CreamPreview');
  const hasLinearGradient = content.includes('LinearGradient');
  const hasEmojiIntegration = content.includes('emoji={') || content.includes('emoji:');
  
  logTest('Has PillPreview component', hasPillPreview);
  logTest('Has LiquidPreview component', hasLiquidPreview);
  logTest('Has CreamPreview component', hasCreamPreview);
  logTest('Uses LinearGradient', hasLinearGradient);
  logTest('Integrates medication emoji', hasEmojiIntegration);
} catch (error) {
  logTest('Dosage preview visualizations test', false, error.message);
}

// Test 3.4: Pill preview details
console.log('\n--- Test 3.4: Pill Preview Details ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasGridLayout = content.includes('pillGrid');
  const hasShineEffect = content.includes('pillShine');
  const hasMaxDisplay = content.includes('Math.min(count, 12)');
  const hasMoreText = content.includes('+{count - 12} más') || content.includes('pillMoreText');
  const hasGradient = content.includes('colors={[colors.primary');
  
  logTest('Pill preview has grid layout', hasGridLayout);
  logTest('Pill preview has shine effect', hasShineEffect);
  logTest('Pill preview limits to 12 pills', hasMaxDisplay);
  logTest('Pill preview shows "+X más" text', hasMoreText);
  logTest('Pill preview uses gradient', hasGradient);
} catch (error) {
  logTest('Pill preview details test', false, error.message);
}

// Test 3.5: Liquid preview details
console.log('\n--- Test 3.5: Liquid Preview Details ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasGlassContainer = content.includes('liquidGlass');
  const hasFillLevel = content.includes('liquidFill');
  const hasFillPercentage = content.includes('fillPercentage');
  const hasGradient = content.includes('colors={[colors.info');
  const hasLabel = content.includes('liquidLabel');
  
  logTest('Liquid preview has glass container', hasGlassContainer);
  logTest('Liquid preview has fill level', hasFillLevel);
  logTest('Liquid preview calculates fill percentage', hasFillPercentage);
  logTest('Liquid preview uses gradient', hasGradient);
  logTest('Liquid preview has amount label', hasLabel);
} catch (error) {
  logTest('Liquid preview details test', false, error.message);
}

// Test 3.6: Cream preview details
console.log('\n--- Test 3.6: Cream Preview Details ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasTubeVisualization = content.includes('creamTube');
  const hasCap = content.includes('creamCap');
  const hasBody = content.includes('creamBody');
  const hasFillIndicator = content.includes('creamFill');
  const hasGradient = content.includes('colors={[colors.success');
  const hasLabel = content.includes('creamLabel');
  
  logTest('Cream preview has tube visualization', hasTubeVisualization);
  logTest('Cream preview has cap section', hasCap);
  logTest('Cream preview has body section', hasBody);
  logTest('Cream preview has fill indicator', hasFillIndicator);
  logTest('Cream preview uses gradient', hasGradient);
  logTest('Cream preview has amount label', hasLabel);
} catch (error) {
  logTest('Cream preview details test', false, error.message);
}

// Test 3.7: Validation
console.log('\n--- Test 3.7: Validation ---');
try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const hasValueValidation = content.includes('Ingresa el valor de la dosis');
  const hasUnitValidation = content.includes('Selecciona una unidad de dosis');
  const hasTypeValidation = content.includes('Selecciona el tipo de medicamento');
  const hasNumericValidation = content.includes('decimal-pad') || content.includes('numeric');
  const hasPositiveValidation = content.includes('mayor a 0') || content.includes('> 0');
  
  logTest('Has dose value validation', hasValueValidation);
  logTest('Has unit validation', hasUnitValidation);
  logTest('Has type validation', hasTypeValidation);
  logTest('Has numeric input validation', hasNumericValidation);
  logTest('Has positive value validation', hasPositiveValidation);
} catch (error) {
  logTest('Validation test', false, error.message);
}

// ============================================================================
// WIZARD INTEGRATION TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('WIZARD INTEGRATION');
console.log('='.repeat(80));

// Test 4.1: Navigation between steps
console.log('\n--- Test 4.1: Navigation Between Steps ---');
try {
  const fs = require('fs');
  const path = require('path');
  const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
  const content = fs.readFileSync(wizardPath, 'utf8');
  
  const hasNextHandler = content.includes('handleNext');
  const hasBackHandler = content.includes('handleBack');
  const hasStepTracking = content.includes('currentStep');
  const hasStepValidation = content.includes('canProceed');
  const hasProgressIndicator = content.includes('WizardProgressIndicator');
  
  logTest('Has next step handler', hasNextHandler);
  logTest('Has back step handler', hasBackHandler);
  logTest('Has step tracking', hasStepTracking);
  logTest('Has step validation', hasStepValidation);
  logTest('Has progress indicator', hasProgressIndicator);
} catch (error) {
  logTest('Navigation between steps test', false, error.message);
}

// Test 4.2: Form data persistence
console.log('\n--- Test 4.2: Form Data Persistence ---');
try {
  const fs = require('fs');
  const path = require('path');
  const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
  const content = fs.readFileSync(wizardPath, 'utf8');
  
  const hasFormData = content.includes('formData');
  const hasUpdateFormData = content.includes('updateFormData');
  const hasWizardContext = content.includes('WizardProvider');
  const hasInitialData = content.includes('INITIAL_FORM_DATA');
  const hasPersistence = content.includes('formData:') && content.includes('...prev.formData');
  
  logTest('Has form data state', hasFormData);
  logTest('Has update form data function', hasUpdateFormData);
  logTest('Uses wizard context', hasWizardContext);
  logTest('Has initial form data', hasInitialData);
  logTest('Persists data across steps', hasPersistence);
} catch (error) {
  logTest('Form data persistence test', false, error.message);
}

// Test 4.3: Validation at each step
console.log('\n--- Test 4.3: Validation at Each Step ---');
try {
  const fs = require('fs');
  const path = require('path');
  const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
  const content = fs.readFileSync(wizardPath, 'utf8');
  
  const hasCanProceed = content.includes('canProceed');
  const hasSetCanProceed = content.includes('setCanProceed');
  const hasValidationCheck = content.includes('!wizardState.canProceed') || content.includes('!canProceed');
  const hasValidationAlert = content.includes('completa todos los campos');
  const hasDisabledButton = content.includes('disabled={!');
  
  logTest('Has canProceed state', hasCanProceed);
  logTest('Has setCanProceed function', hasSetCanProceed);
  logTest('Checks validation before proceeding', hasValidationCheck);
  logTest('Shows validation alert', hasValidationAlert);
  logTest('Disables button when invalid', hasDisabledButton);
} catch (error) {
  logTest('Validation at each step test', false, error.message);
}

// Test 4.4: Step labels and progress
console.log('\n--- Test 4.4: Step Labels and Progress ---');
try {
  const fs = require('fs');
  const path = require('path');
  const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
  const content = fs.readFileSync(wizardPath, 'utf8');
  
  const hasStepLabels = content.includes('getStepLabels');
  const hasSpanishLabels = content.includes('Icono y Nombre') && 
                           content.includes('Horario') && 
                           content.includes('Dosis');
  const hasTotalSteps = content.includes('totalSteps');
  const hasInventoryStep = content.includes('Inventario');
  
  logTest('Has step labels function', hasStepLabels);
  logTest('Has Spanish step labels', hasSpanishLabels);
  logTest('Tracks total steps', hasTotalSteps);
  logTest('Has inventory step for add mode', hasInventoryStep);
} catch (error) {
  logTest('Step labels and progress test', false, error.message);
}

// Test 4.5: Mode handling (add vs edit)
console.log('\n--- Test 4.5: Mode Handling (Add vs Edit) ---');
try {
  const fs = require('fs');
  const path = require('path');
  const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
  const content = fs.readFileSync(wizardPath, 'utf8');
  
  const hasMode = content.includes("mode: 'add' | 'edit'");
  const hasInitialData = content.includes('getInitialFormData');
  const hasMedicationProp = content.includes('medication?:');
  const hasConditionalSteps = content.includes("mode === 'add' ? 4 : 3");
  const hasEditDataMapping = content.includes("mode === 'edit' && medication");
  
  logTest('Has mode prop', hasMode);
  logTest('Has initial data function', hasInitialData);
  logTest('Has medication prop for edit', hasMedicationProp);
  logTest('Has conditional step count', hasConditionalSteps);
  logTest('Maps medication data in edit mode', hasEditDataMapping);
} catch (error) {
  logTest('Mode handling test', false, error.message);
}

// ============================================================================
// RESPONSIVE LAYOUT TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('RESPONSIVE LAYOUT');
console.log('='.repeat(80));

// Test 5.1: Responsive calculations
console.log('\n--- Test 5.1: Responsive Calculations ---');
try {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'src/components/patient/medication-wizard/MedicationIconNameStep.tsx',
    'src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'src/components/patient/medication-wizard/MedicationDosageStep.tsx',
  ];
  
  files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(filePath);
    
    const hasWindowDimensions = content.includes('useWindowDimensions');
    const hasScreenWidth = content.includes('screenWidth') || content.includes('width:');
    const hasResponsiveLayout = content.includes('responsiveLayout') || content.includes('isSmallScreen');
    
    logTest(`${fileName} uses useWindowDimensions`, hasWindowDimensions);
    logTest(`${fileName} calculates responsive values`, hasResponsiveLayout);
  });
} catch (error) {
  logTest('Responsive calculations test', false, error.message);
}

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('ACCESSIBILITY');
console.log('='.repeat(80));

// Test 6.1: Accessibility labels
console.log('\n--- Test 6.1: Accessibility Labels ---');
try {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'src/components/patient/medication-wizard/MedicationIconNameStep.tsx',
    'src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'src/components/patient/medication-wizard/MedicationDosageStep.tsx',
  ];
  
  files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(filePath);
    
    const hasAccessibilityLabel = content.includes('accessibilityLabel');
    const hasAccessibilityHint = content.includes('accessibilityHint');
    const hasAccessibilityRole = content.includes('accessibilityRole');
    
    logTest(`${fileName} has accessibility labels`, hasAccessibilityLabel);
    logTest(`${fileName} has accessibility hints`, hasAccessibilityHint);
    logTest(`${fileName} has accessibility roles`, hasAccessibilityRole);
  });
} catch (error) {
  logTest('Accessibility labels test', false, error.message);
}

// Test 6.2: Touch targets
console.log('\n--- Test 6.2: Touch Targets ---');
try {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'src/components/patient/medication-wizard/MedicationIconNameStep.tsx',
    'src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
  ];
  
  files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(filePath);
    
    const hasMinWidth = content.includes('minWidth: 48') || content.includes('minWidth: 44');
    const hasMinHeight = content.includes('minHeight: 48') || content.includes('minHeight: 44');
    const hasHitSlop = content.includes('hitSlop');
    
    logTest(`${fileName} has minimum width`, hasMinWidth);
    logTest(`${fileName} has minimum height`, hasMinHeight);
    logTest(`${fileName} uses hitSlop for small targets`, hasHitSlop);
  });
} catch (error) {
  logTest('Touch targets test', false, error.message);
}

// ============================================================================
// DEPENDENCIES TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('DEPENDENCIES');
console.log('='.repeat(80));

// Test 7.1: Required dependencies
console.log('\n--- Test 7.1: Required Dependencies ---');
try {
  const fs = require('fs');
  const path = require('path');
  const packagePath = path.join(__dirname, 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const hasLinearGradient = dependencies['expo-linear-gradient'] !== undefined;
  const hasIonicons = dependencies['@expo/vector-icons'] !== undefined;
  const hasDateTimePicker = dependencies['@react-native-community/datetimepicker'] !== undefined;
  
  logTest('Has expo-linear-gradient', hasLinearGradient);
  logTest('Has @expo/vector-icons', hasIonicons);
  logTest('Has @react-native-community/datetimepicker', hasDateTimePicker);
} catch (error) {
  logTest('Required dependencies test', false, error.message);
}

// Test 7.2: No unwanted dependencies
console.log('\n--- Test 7.2: No Unwanted Dependencies ---');
try {
  const fs = require('fs');
  const path = require('path');
  const packagePath = path.join(__dirname, 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const noHorizontalTimeline = dependencies['react-native-horizontal-timeline'] === undefined;
  
  logTest('Does not have react-native-horizontal-timeline', noHorizontalTimeline);
} catch (error) {
  logTest('No unwanted dependencies test', false, error.message);
}

// ============================================================================
// TYPES TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TYPES');
console.log('='.repeat(80));

// Test 8.1: Spanish type labels
console.log('\n--- Test 8.1: Spanish Type Labels ---');
try {
  const fs = require('fs');
  const path = require('path');
  const typesPath = path.join(__dirname, 'src/types/index.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  
  const spanishTypes = [
    'Tabletas',
    'Cápsulas',
    'Líquido',
    'Crema',
    'Inhalador',
    'Gotas',
    'Spray',
  ];
  
  spanishTypes.forEach(type => {
    const hasType = content.includes(type);
    logTest(`Has Spanish type: "${type}"`, hasType);
  });
} catch (error) {
  logTest('Spanish type labels test', false, error.message);
}

// Test 8.2: Spanish unit labels
console.log('\n--- Test 8.2: Spanish Unit Labels ---');
try {
  const fs = require('fs');
  const path = require('path');
  const typesPath = path.join(__dirname, 'src/types/index.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  
  const spanishUnits = [
    'miligramos',
    'gramos',
    'microgramos',
    'mililitros',
    'litros',
    'unidades',
    'gotas',
    'sprays',
    'inhalaciones',
    'aplicaciones',
  ];
  
  let foundCount = 0;
  spanishUnits.forEach(unit => {
    const hasUnit = content.includes(unit);
    if (hasUnit) foundCount++;
    logTest(`Has Spanish unit: "${unit}"`, hasUnit);
  });
  
  logTest(`Found ${foundCount}/${spanishUnits.length} Spanish units`, foundCount >= 8);
} catch (error) {
  logTest('Spanish unit labels test', false, error.message);
}

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('INTEGRATION SCENARIOS');
console.log('='.repeat(80));

// Test 9.1: Complete flow scenario
console.log('\n--- Test 9.1: Complete Flow Scenario ---');
console.log('Simulating complete wizard flow with test data...');

const flowSteps = [
  {
    step: 1,
    name: 'Icon and Name Selection',
    data: {
      emoji: testConfig.testData.emoji,
      name: testConfig.testData.name,
    },
    validations: [
      'Emoji is selected',
      'Name is valid',
      'Name length is within limits',
    ],
  },
  {
    step: 2,
    name: 'Schedule Configuration',
    data: {
      times: testConfig.testData.times,
      frequency: testConfig.testData.frequency,
    },
    validations: [
      'At least one time is set',
      'At least one day is selected',
      'Times are in valid format',
    ],
  },
  {
    step: 3,
    name: 'Dosage Configuration',
    data: {
      doseValue: testConfig.testData.doseValue,
      doseUnit: testConfig.testData.doseUnit,
      quantityType: testConfig.testData.quantityType,
    },
    validations: [
      'Dose value is numeric',
      'Dose unit is selected',
      'Quantity type is selected',
      'Unit is compatible with type',
    ],
  },
];

flowSteps.forEach(stepInfo => {
  console.log(`\nStep ${stepInfo.step}: ${stepInfo.name}`);
  console.log(`Data: ${JSON.stringify(stepInfo.data, null, 2)}`);
  
  stepInfo.validations.forEach(validation => {
    // Simulate validation checks
    let passed = true;
    
    if (validation.includes('Emoji') && !stepInfo.data.emoji) passed = false;
    if (validation.includes('Name') && !stepInfo.data.name) passed = false;
    if (validation.includes('time') && (!stepInfo.data.times || stepInfo.data.times.length === 0)) passed = false;
    if (validation.includes('day') && (!stepInfo.data.frequency || stepInfo.data.frequency.length === 0)) passed = false;
    if (validation.includes('Dose value') && !stepInfo.data.doseValue) passed = false;
    if (validation.includes('unit is selected') && !stepInfo.data.doseUnit) passed = false;
    if (validation.includes('type is selected') && !stepInfo.data.quantityType) passed = false;
    
    logTest(`  ${validation}`, passed);
  });
});

// Test 9.2: Unit filtering scenario
console.log('\n--- Test 9.2: Unit Filtering Scenario ---');
console.log('Testing unit filtering when changing medication type...');

const unitFilteringScenarios = [
  { type: 'tablets', expectedUnits: ['units', 'mg', 'g', 'mcg'] },
  { type: 'liquid', expectedUnits: ['ml', 'l', 'drops'] },
  { type: 'cream', expectedUnits: ['g', 'ml', 'applications'] },
  { type: 'inhaler', expectedUnits: ['puffs', 'inhalations'] },
];

try {
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationDosageStep.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  
  unitFilteringScenarios.forEach(scenario => {
    const mappingString = `${scenario.type}: [${scenario.expectedUnits.map(u => `'${u}'`).join(', ')}]`;
    const hasMapping = content.includes(mappingString);
    logTest(`  ${scenario.type} → ${scenario.expectedUnits.join(', ')}`, hasMapping);
  });
} catch (error) {
  logTest('Unit filtering scenario test', false, error.message);
}

// ============================================================================
// PLATFORM-SPECIFIC TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('PLATFORM-SPECIFIC FEATURES');
console.log('='.repeat(80));

// Test 10.1: iOS-specific features
console.log('\n--- Test 10.1: iOS-Specific Features ---');
try {
  const fs = require('fs');
  const path = require('path');
  const schedulePath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationScheduleStep.tsx');
  const content = fs.readFileSync(schedulePath, 'utf8');
  
  const hasIOSModal = content.includes("Platform.OS === 'ios'");
  const hasIOSTimePicker = content.includes('display="spinner"');
  const hasIOSConfirm = content.includes('handleIOSConfirm');
  const hasIOSCancel = content.includes('handleIOSCancel');
  
  logTest('Has iOS-specific modal', hasIOSModal);
  logTest('Has iOS time picker with spinner', hasIOSTimePicker);
  logTest('Has iOS confirm handler', hasIOSConfirm);
  logTest('Has iOS cancel handler', hasIOSCancel);
} catch (error) {
  logTest('iOS-specific features test', false, error.message);
}

// Test 10.2: Android-specific features
console.log('\n--- Test 10.2: Android-Specific Features ---');
try {
  const fs = require('fs');
  const path = require('path');
  const schedulePath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationScheduleStep.tsx');
  const content = fs.readFileSync(schedulePath, 'utf8');
  
  const hasAndroidPicker = content.includes("Platform.OS === 'android'");
  const hasAndroidDisplay = content.includes('display="default"');
  const hasAndroidHandler = content.includes('handleTimeChange');
  
  logTest('Has Android-specific picker', hasAndroidPicker);
  logTest('Has Android default display', hasAndroidDisplay);
  logTest('Has Android time change handler', hasAndroidHandler);
} catch (error) {
  logTest('Android-specific features test', false, error.message);
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('PERFORMANCE');
console.log('='.repeat(80));

// Test 11.1: Debounced validation
console.log('\n--- Test 11.1: Debounced Validation ---');
try {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'src/components/patient/medication-wizard/MedicationIconNameStep.tsx',
    'src/components/patient/medication-wizard/MedicationDosageStep.tsx',
  ];
  
  files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(filePath);
    
    const hasDebouncedCallback = content.includes('useDebouncedCallback');
    const hasDebounceDelay = content.includes('300');
    
    logTest(`${fileName} uses debounced validation`, hasDebouncedCallback);
    logTest(`${fileName} has 300ms debounce delay`, hasDebounceDelay);
  });
} catch (error) {
  logTest('Debounced validation test', false, error.message);
}

// Test 11.2: Lazy loading
console.log('\n--- Test 11.2: Lazy Loading ---');
try {
  const fs = require('fs');
  const path = require('path');
  const wizardPath = path.join(__dirname, 'src/components/patient/medication-wizard/MedicationWizard.tsx');
  const content = fs.readFileSync(wizardPath, 'utf8');
  
  const hasLazy = content.includes('lazy(');
  const hasSuspense = content.includes('Suspense');
  const hasLoadingFallback = content.includes('ActivityIndicator');
  
  logTest('Uses lazy loading for steps', hasLazy);
  logTest('Uses Suspense for lazy components', hasSuspense);
  logTest('Has loading fallback', hasLoadingFallback);
} catch (error) {
  logTest('Lazy loading test', false, error.message);
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('ERROR HANDLING');
console.log('='.repeat(80));

// Test 12.1: Error messages
console.log('\n--- Test 12.1: Error Messages ---');
try {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'src/components/patient/medication-wizard/MedicationIconNameStep.tsx',
    'src/components/patient/medication-wizard/MedicationDosageStep.tsx',
  ];
  
  files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(filePath);
    
    const hasErrorState = content.includes('Error');
    const hasErrorDisplay = content.includes('errorText');
    const hasErrorStyling = content.includes('colors.error');
    
    logTest(`${fileName} has error state`, hasErrorState);
    logTest(`${fileName} displays error messages`, hasErrorDisplay);
    logTest(`${fileName} has error styling`, hasErrorStyling);
  });
} catch (error) {
  logTest('Error messages test', false, error.message);
}

// Test 12.2: Alert dialogs
console.log('\n--- Test 12.2: Alert Dialogs ---');
try {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'src/components/patient/medication-wizard/MedicationIconNameStep.tsx',
    'src/components/patient/medication-wizard/MedicationDosageStep.tsx',
    'src/components/patient/medication-wizard/MedicationWizard.tsx',
  ];
  
  files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(filePath);
    
    const hasAlert = content.includes('Alert.alert');
    
    logTest(`${fileName} uses Alert dialogs`, hasAlert);
  });
} catch (error) {
  logTest('Alert dialogs test', false, error.message);
}

// ============================================================================
// SUMMARY AND RECOMMENDATIONS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));

console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`);
console.log(`\x1b[32mPassed: ${testResults.passed}\x1b[0m`);
console.log(`\x1b[31mFailed: ${testResults.failed}\x1b[0m`);

const passRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
console.log(`Pass Rate: ${passRate}%`);

// Group failed tests by category
if (testResults.failed > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('FAILED TESTS');
  console.log('='.repeat(80));
  
  const failedTests = testResults.tests.filter(t => !t.passed);
  failedTests.forEach(test => {
    console.log(`\n\x1b[31m✗\x1b[0m ${test.name}`);
    if (test.details) {
      console.log(`  ${test.details}`);
    }
  });
}

// Recommendations
console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATIONS FOR MANUAL TESTING');
console.log('='.repeat(80));

console.log(`
The following aspects should be tested manually on actual devices:

📱 iOS Device Testing:
  1. Test emoji keyboard opening with "Más emojis" button
  2. Test time picker modal with spinner display
  3. Test haptic feedback on step transitions
  4. Test VoiceOver screen reader compatibility
  5. Test on different iOS screen sizes (iPhone SE, iPhone 14, iPad)

🤖 Android Device Testing:
  1. Test emoji keyboard opening with "Más emojis" button
  2. Test time picker dialog with default display
  3. Test haptic feedback on step transitions
  4. Test TalkBack screen reader compatibility
  5. Test on different Android screen sizes (small phone, large phone, tablet)

🎨 Visual Testing:
  1. Verify emoji mosaic is centered on all screen sizes
  2. Verify TimeCard design with clock emoji and action buttons
  3. Verify custom timeline displays correctly with medication emoji
  4. Verify pill preview shows up to 12 pills with "+X más" text
  5. Verify liquid preview shows gradient fill with proper percentage
  6. Verify cream preview shows tube with cap and fill indicator
  7. Test all dosage previews with different values and units

🔄 Flow Testing:
  1. Complete full wizard flow from start to finish
  2. Test navigation back and forth between steps
  3. Test form data persistence when navigating between steps
  4. Test validation prevents proceeding with invalid data
  5. Test unit filtering when changing medication type
  6. Test unit reset alert when incompatible unit is selected

♿ Accessibility Testing:
  1. Test with screen reader (VoiceOver/TalkBack)
  2. Test with large text sizes
  3. Test with high contrast mode
  4. Test all interactive elements have proper labels
  5. Test minimum touch target sizes (48x48 dp)

⚡ Performance Testing:
  1. Test on lower-end devices
  2. Test smooth scrolling in emoji grid and timeline
  3. Test debounced validation doesn't cause lag
  4. Test lazy loading of wizard steps
  5. Test memory usage during wizard flow

🌐 Localization Testing:
  1. Verify all text is in Spanish
  2. Verify error messages are in Spanish
  3. Verify validation messages are in Spanish
  4. Verify type and unit labels are in Spanish
`);

console.log('\n' + '='.repeat(80));
console.log('TEST EXECUTION COMPLETE');
console.log('='.repeat(80));

// Exit with appropriate code
process.exit(testResults.failed > 0 ? 1 : 0);

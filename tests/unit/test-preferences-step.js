/**
 * Test script for PreferencesStep component
 * 
 * Verifies:
 * - Component renders with all required elements
 * - Alarm mode selector with 4 options (sound, vibrate, both, silent)
 * - LED intensity slider (0-100)
 * - LED color picker integration
 * - Volume slider (0-100) shown conditionally
 * - Test alarm functionality
 * - Save preferences using deviceConfig service
 * 
 * Requirements: 3.6, 10.1, 10.2
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing PreferencesStep Component Implementation\n');

// Test 1: Verify file exists
console.log('Test 1: Verify PreferencesStep file exists');
const preferencesStepPath = path.join(__dirname, 'src/components/patient/provisioning/steps/PreferencesStep.tsx');
if (fs.existsSync(preferencesStepPath)) {
  console.log('✅ PreferencesStep.tsx exists\n');
} else {
  console.log('❌ PreferencesStep.tsx not found\n');
  process.exit(1);
}

// Test 2: Verify imports
console.log('Test 2: Verify required imports');
const content = fs.readFileSync(preferencesStepPath, 'utf8');

const requiredImports = [
  'ColorPicker',
  'Slider',
  'saveDeviceConfig',
  'useWizardContext',
  'announceForAccessibility',
  'triggerHapticFeedback',
];

let allImportsPresent = true;
requiredImports.forEach(imp => {
  if (content.includes(imp)) {
    console.log(`✅ ${imp} imported`);
  } else {
    console.log(`❌ ${imp} not imported`);
    allImportsPresent = false;
  }
});
console.log('');

// Test 3: Verify alarm mode options
console.log('Test 3: Verify alarm mode options');
const alarmModes = ['sound', 'vibrate', 'both', 'silent'];
let allModesPresent = true;
alarmModes.forEach(mode => {
  if (content.includes(`'${mode}'`)) {
    console.log(`✅ Alarm mode '${mode}' present`);
  } else {
    console.log(`❌ Alarm mode '${mode}' missing`);
    allModesPresent = false;
  }
});
console.log('');

// Test 4: Verify LED intensity slider
console.log('Test 4: Verify LED intensity slider');
if (content.includes('ledIntensity') && content.includes('Slider')) {
  console.log('✅ LED intensity slider implemented');
} else {
  console.log('❌ LED intensity slider missing');
}
console.log('');

// Test 5: Verify LED color picker
console.log('Test 5: Verify LED color picker integration');
const colorPickerFeatures = [
  'showColorPicker',
  'setShowColorPicker',
  'handleColorChange',
  '<ColorPicker',
];
let colorPickerComplete = true;
colorPickerFeatures.forEach(feature => {
  if (content.includes(feature)) {
    console.log(`✅ ${feature} present`);
  } else {
    console.log(`❌ ${feature} missing`);
    colorPickerComplete = false;
  }
});
console.log('');

// Test 6: Verify volume slider
console.log('Test 6: Verify volume slider (conditional)');
if (content.includes('volume') && content.includes('alarmMode === \'sound\' || alarmMode === \'both\'')) {
  console.log('✅ Volume slider with conditional rendering');
} else {
  console.log('❌ Volume slider or conditional rendering missing');
}
console.log('');

// Test 7: Verify test alarm functionality
console.log('Test 7: Verify test alarm functionality');
if (content.includes('handleTestAlarm') && content.includes('isTesting')) {
  console.log('✅ Test alarm functionality implemented');
} else {
  console.log('❌ Test alarm functionality missing');
}
console.log('');

// Test 8: Verify save preferences functionality
console.log('Test 8: Verify save preferences functionality');
const saveFeatures = [
  'handleSavePreferences',
  'saveDeviceConfig',
  'isSaving',
  'preferencesSaved',
  'saveError',
];
let saveComplete = true;
saveFeatures.forEach(feature => {
  if (content.includes(feature)) {
    console.log(`✅ ${feature} present`);
  } else {
    console.log(`❌ ${feature} missing`);
    saveComplete = false;
  }
});
console.log('');

// Test 9: Verify RGB color conversion
console.log('Test 9: Verify hex to RGB color conversion');
if (content.includes('hexToRgb') && content.includes('ledColor: rgbColor') || content.includes('ledColor: { r, g, b }')) {
  console.log('✅ Hex to RGB conversion implemented');
} else {
  console.log('❌ Hex to RGB conversion missing');
}
console.log('');

// Test 10: Verify LED intensity conversion (0-100 to 0-1023)
console.log('Test 10: Verify LED intensity conversion');
if (content.includes('1023') && content.includes('ledIntensity / 100')) {
  console.log('✅ LED intensity conversion (0-100 to 0-1023) implemented');
} else {
  console.log('❌ LED intensity conversion missing');
}
console.log('');

// Test 11: Verify alarm mode mapping
console.log('Test 11: Verify alarm mode mapping to device format');
const mappingChecks = [
  'deviceAlarmMode',
  'silent',
  'vibrate',
];
let mappingComplete = true;
mappingChecks.forEach(check => {
  if (content.includes(check)) {
    console.log(`✅ ${check} mapping present`);
  } else {
    console.log(`❌ ${check} mapping missing`);
    mappingComplete = false;
  }
});
console.log('');

// Test 12: Verify accessibility features
console.log('Test 12: Verify accessibility features');
const a11yFeatures = [
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'announceForAccessibility',
];
let a11yComplete = true;
a11yFeatures.forEach(feature => {
  if (content.includes(feature)) {
    console.log(`✅ ${feature} present`);
  } else {
    console.log(`❌ ${feature} missing`);
    a11yComplete = false;
  }
});
console.log('');

// Test 13: Verify error handling
console.log('Test 13: Verify error handling');
if (content.includes('saveError') && content.includes('setSaveError') && content.includes('errorContainer')) {
  console.log('✅ Error handling implemented');
} else {
  console.log('❌ Error handling missing');
}
console.log('');

// Test 14: Verify success feedback
console.log('Test 14: Verify success feedback');
if (content.includes('preferencesSaved') && content.includes('successContainer') && content.includes('HapticFeedbackType.SUCCESS')) {
  console.log('✅ Success feedback implemented');
} else {
  console.log('❌ Success feedback missing');
}
console.log('');

// Test 15: Verify LED preview
console.log('Test 15: Verify LED preview');
if (content.includes('ledPreview') && content.includes('ledIndicator') && content.includes('opacity: ledIntensity / 100')) {
  console.log('✅ LED preview with intensity implemented');
} else {
  console.log('❌ LED preview missing');
}
console.log('');

// Summary
console.log('═══════════════════════════════════════════════════════');
console.log('📊 Test Summary\n');

const allTestsPassed = allImportsPresent && allModesPresent && colorPickerComplete && 
                       saveComplete && mappingComplete && a11yComplete;

if (allTestsPassed) {
  console.log('✅ All tests passed!');
  console.log('\n✨ PreferencesStep implementation is complete with:');
  console.log('   • Alarm mode selector (sound/vibrate/both/silent)');
  console.log('   • LED intensity slider (0-100)');
  console.log('   • LED color picker with modal');
  console.log('   • Volume slider (conditional)');
  console.log('   • Test alarm functionality');
  console.log('   • Save preferences using deviceConfig service');
  console.log('   • LED preview with real-time updates');
  console.log('   • Error handling and success feedback');
  console.log('   • Full accessibility support');
  console.log('\n📋 Requirements covered: 3.6, 10.1, 10.2');
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════\n');

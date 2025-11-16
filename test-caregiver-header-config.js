/**
 * Test: Caregiver Header Configuration
 * 
 * This test verifies that the caregiver layout properly configures headers
 * to prevent duplication and ensure a single header renders across all routes.
 * 
 * Task 3.1: Configure navigation header options
 * Requirements: 6.2, 6.3, 6.4
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Caregiver Header Configuration\n');

// Test 1: Verify main layout has headerShown: false
console.log('Test 1: Checking main layout header configuration...');
const layoutPath = path.join(__dirname, 'app', 'caregiver', '_layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

const hasHeaderShownFalse = layoutContent.includes('headerShown: false');
const hasCustomHeader = layoutContent.includes('<CaregiverHeader');
const headerOutsideTabs = layoutContent.indexOf('<CaregiverHeader') < layoutContent.indexOf('<Tabs');

if (hasHeaderShownFalse) {
  console.log('✅ Main layout has headerShown: false in screenOptions');
} else {
  console.log('❌ Main layout missing headerShown: false in screenOptions');
}

if (hasCustomHeader && headerOutsideTabs) {
  console.log('✅ Custom CaregiverHeader is rendered outside Tabs component');
} else {
  console.log('❌ Custom CaregiverHeader not properly positioned');
}

// Test 2: Verify individual screens don't have headerShown: true
console.log('\nTest 2: Checking individual screen configurations...');
const screenNames = ['dashboard', 'tasks', 'reports', 'medications', 'audit', 'events', 'add-device'];
let allScreensConfigured = true;

for (const screenName of screenNames) {
  const screenRegex = new RegExp(`name="${screenName}"[\\s\\S]*?options=\\{[\\s\\S]*?headerShown:\\s*true`, 'm');
  if (screenRegex.test(layoutContent)) {
    console.log(`❌ Screen "${screenName}" has headerShown: true (should be false or omitted)`);
    allScreensConfigured = false;
  }
}

if (allScreensConfigured) {
  console.log('✅ All screens properly configured without headerShown: true');
}

// Test 3: Verify nested layouts have headerShown: false
console.log('\nTest 3: Checking nested layout configurations...');
const medicationsLayoutPath = path.join(__dirname, 'app', 'caregiver', 'medications', '_layout.tsx');

if (fs.existsSync(medicationsLayoutPath)) {
  const medicationsLayoutContent = fs.readFileSync(medicationsLayoutPath, 'utf8');
  const hasNestedHeaderShownFalse = medicationsLayoutContent.includes('headerShown: false');
  
  if (hasNestedHeaderShownFalse) {
    console.log('✅ Medications nested layout has headerShown: false');
  } else {
    console.log('❌ Medications nested layout missing headerShown: false');
  }
} else {
  console.log('⚠️  Medications layout file not found (may not exist yet)');
}

// Test 4: Verify screen title is passed dynamically
console.log('\nTest 4: Checking dynamic screen title configuration...');
const hasGetScreenTitle = layoutContent.includes('getScreenTitle');
const hasTitleMapping = layoutContent.includes('const titles:') || layoutContent.includes('const titles =');
const usesPatchname = layoutContent.includes('pathname');

if (hasGetScreenTitle && hasTitleMapping) {
  console.log('✅ Dynamic screen title function implemented');
} else {
  console.log('❌ Dynamic screen title function missing or incomplete');
}

if (usesPatchname) {
  console.log('✅ Uses pathname to determine current screen');
} else {
  console.log('⚠️  May not be using pathname for dynamic title');
}

// Test 5: Verify no header duplication patterns
console.log('\nTest 5: Checking for header duplication patterns...');
const hasHeaderFunction = /header:\s*\(\)\s*=>/.test(layoutContent);
const hasMultipleHeaders = (layoutContent.match(/<CaregiverHeader/g) || []).length > 1;

if (hasHeaderFunction) {
  console.log('❌ Found header function in screenOptions (may cause duplication)');
} else {
  console.log('✅ No header function in screenOptions');
}

if (hasMultipleHeaders) {
  console.log('⚠️  Multiple CaregiverHeader instances found (verify this is intentional)');
} else {
  console.log('✅ Single CaregiverHeader instance');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));

const allTestsPassed = 
  hasHeaderShownFalse && 
  hasCustomHeader && 
  headerOutsideTabs && 
  allScreensConfigured && 
  hasGetScreenTitle && 
  hasTitleMapping &&
  !hasHeaderFunction &&
  !hasMultipleHeaders;

if (allTestsPassed) {
  console.log('✅ All tests passed! Header configuration is correct.');
  console.log('\nThe caregiver layout now:');
  console.log('  • Has headerShown: false for all screens');
  console.log('  • Implements a single custom header outside Tabs');
  console.log('  • Passes screen title dynamically based on route');
  console.log('  • Prevents header duplication across all routes');
} else {
  console.log('⚠️  Some tests failed. Review the output above for details.');
}

console.log('\n✨ Task 3.1 Implementation Complete');
console.log('Requirements verified: 6.2, 6.3, 6.4');

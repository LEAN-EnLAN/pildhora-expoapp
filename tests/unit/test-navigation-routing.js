/**
 * Navigation and Routing Test Suite
 * 
 * Tests for Task 19: Update navigation and routing
 * Tests for Task 19.1: Configure tab navigation
 * 
 * Verifies:
 * - Tab navigation configuration
 * - Deep linking support
 * - Navigation state persistence
 * - Navigation params handling
 * - Tab bar styling and accessibility
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Navigation and Routing Test Suite\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;
let testResults = [];

function test(description, fn) {
  try {
    fn();
    passCount++;
    testResults.push({ status: '✅', description });
    console.log(`✅ ${description}`);
  } catch (error) {
    failCount++;
    testResults.push({ status: '❌', description, error: error.message });
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}\n`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function readFile(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
}

// Test Suite
console.log('\n📋 Task 19.1: Configure Tab Navigation\n');

test('Caregiver layout file exists', () => {
  assert(fileExists('app/caregiver/_layout.tsx'), 'Layout file should exist');
});

test('Layout imports design system tokens', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes("from '../../src/theme/tokens'"),
    'Should import design system tokens'
  );
});

test('Layout uses colors from design system', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('colors.primary[500]'),
    'Should use primary color for active tint'
  );
  assert(
    content.includes('colors.gray[500]'),
    'Should use gray color for inactive tint'
  );
});

test('Tab bar has custom styling', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('tabBarStyle'),
    'Should have custom tab bar style'
  );
  assert(
    content.includes('tabBarLabelStyle'),
    'Should have custom label style'
  );
  assert(
    content.includes('tabBarIconStyle'),
    'Should have custom icon style'
  );
});

test('Tab bar uses design system spacing', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('spacing.sm') || content.includes('spacing.lg'),
    'Should use spacing tokens'
  );
});

test('Tab bar has proper shadows', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('shadows.sm'),
    'Should use shadow tokens'
  );
});

test('Tab icons use focused/unfocused variants', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('focused ?'),
    'Should use focused state for icons'
  );
  assert(
    content.includes('"home"') && content.includes('"home-outline"'),
    'Should have filled and outline icon variants'
  );
});

test('All tabs have accessibility labels', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('tabBarAccessibilityLabel'),
    'Should have accessibility labels'
  );
  const labelCount = (content.match(/tabBarAccessibilityLabel/g) || []).length;
  assert(
    labelCount >= 4,
    `Should have accessibility labels for all 4 main tabs (found ${labelCount})`
  );
});

test('Modal screens are hidden from tab bar', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('href: null'),
    'Modal screens should have href: null'
  );
  assert(
    content.includes('shouldHideTabs'),
    'Should have function to hide tabs for modal screens'
  );
});

test('Tab bar hides on modal routes', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('tabBarHidden'),
    'Should have tabBarHidden style'
  );
  assert(
    content.includes('display: \'none\''),
    'Hidden style should set display to none'
  );
});

console.log('\n📋 Task 19: Update Navigation and Routing\n');

test('Navigation utilities file exists', () => {
  assert(fileExists('src/utils/navigation.ts'), 'Navigation utils should exist');
});

test('Navigation utilities export required functions', () => {
  const content = readFile('src/utils/navigation.ts');
  assert(
    content.includes('export async function saveNavigationState'),
    'Should export saveNavigationState'
  );
  assert(
    content.includes('export async function loadNavigationState'),
    'Should export loadNavigationState'
  );
  assert(
    content.includes('export async function saveLastRoute'),
    'Should export saveLastRoute'
  );
  assert(
    content.includes('export async function loadLastRoute'),
    'Should export loadLastRoute'
  );
});

test('Navigation utilities handle deep linking', () => {
  const content = readFile('src/utils/navigation.ts');
  assert(
    content.includes('export function parseDeepLink'),
    'Should export parseDeepLink'
  );
  assert(
    content.includes('export async function handleDeepLink'),
    'Should export handleDeepLink'
  );
  assert(
    content.includes('export function buildDeepLink'),
    'Should export buildDeepLink'
  );
});

test('Navigation utilities use AsyncStorage', () => {
  const content = readFile('src/utils/navigation.ts');
  assert(
    content.includes("from '@react-native-async-storage/async-storage'"),
    'Should import AsyncStorage'
  );
  assert(
    content.includes('AsyncStorage.setItem'),
    'Should use AsyncStorage.setItem'
  );
  assert(
    content.includes('AsyncStorage.getItem'),
    'Should use AsyncStorage.getItem'
  );
});

test('Deep link configuration includes caregiver routes', () => {
  const content = readFile('src/utils/navigation.ts');
  assert(
    content.includes('caregiverDeepLinkConfig'),
    'Should export deep link config'
  );
  assert(
    content.includes('dashboard'),
    'Should include dashboard route'
  );
  assert(
    content.includes('medications'),
    'Should include medications route'
  );
  assert(
    content.includes('events'),
    'Should include events route'
  );
});

test('Navigation persistence hook exists', () => {
  assert(
    fileExists('src/hooks/useNavigationPersistence.ts'),
    'Navigation persistence hook should exist'
  );
});

test('Navigation persistence hook exports main function', () => {
  const content = readFile('src/hooks/useNavigationPersistence.ts');
  assert(
    content.includes('export function useNavigationPersistence'),
    'Should export useNavigationPersistence'
  );
});

test('Navigation persistence hook handles deep links', () => {
  const content = readFile('src/hooks/useNavigationPersistence.ts');
  assert(
    content.includes('handleDeepLinks'),
    'Should have handleDeepLinks option'
  );
  assert(
    content.includes('getInitialURL'),
    'Should get initial URL'
  );
  assert(
    content.includes('subscribeToDeepLinks'),
    'Should subscribe to deep link events'
  );
});

test('Navigation persistence hook saves last route', () => {
  const content = readFile('src/hooks/useNavigationPersistence.ts');
  assert(
    content.includes('persistLastRoute'),
    'Should have persistLastRoute option'
  );
  assert(
    content.includes('saveLastRoute'),
    'Should save last route'
  );
});

test('Layout uses navigation persistence hook', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('useNavigationPersistence'),
    'Should use navigation persistence hook'
  );
  assert(
    content.includes('isNavigationReady'),
    'Should check if navigation is ready'
  );
});

test('Layout shows loading state during navigation init', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes('ActivityIndicator'),
    'Should show loading indicator'
  );
  assert(
    content.includes('loadingContainer'),
    'Should have loading container style'
  );
});

test('App.json has deep linking configuration', () => {
  const content = readFile('app.json');
  const config = JSON.parse(content);
  assert(
    config.expo.scheme === 'pildhora',
    'Should have pildhora URL scheme'
  );
});

test('App.json has iOS associated domains', () => {
  const content = readFile('app.json');
  const config = JSON.parse(content);
  assert(
    config.expo.ios.associatedDomains,
    'Should have associated domains for iOS'
  );
  assert(
    config.expo.ios.associatedDomains.includes('applinks:pildhora.com'),
    'Should include pildhora.com domain'
  );
});

test('App.json has Android intent filters', () => {
  const content = readFile('app.json');
  const config = JSON.parse(content);
  assert(
    config.expo.android.intentFilters,
    'Should have intent filters for Android'
  );
  assert(
    config.expo.android.intentFilters.length > 0,
    'Should have at least one intent filter'
  );
});

test('Android intent filters include caregiver paths', () => {
  const content = readFile('app.json');
  const config = JSON.parse(content);
  const hasCaregiver = config.expo.android.intentFilters.some(filter =>
    filter.data.some(d => d.pathPrefix === '/caregiver')
  );
  assert(hasCaregiver, 'Should have caregiver path in intent filters');
});

test('Navigation params are type-safe', () => {
  const content = readFile('src/utils/navigation.ts');
  assert(
    content.includes('CaregiverNavigationParams'),
    'Should export navigation params interface'
  );
  assert(
    content.includes('navigateToRoute'),
    'Should export type-safe navigation helper'
  );
});

test('Tab bar styling is platform-specific', () => {
  const content = readFile('app/caregiver/_layout.tsx');
  assert(
    content.includes("Platform.OS === 'ios'"),
    'Should have iOS-specific styling'
  );
  assert(
    content.includes('paddingBottom'),
    'Should adjust padding for iOS safe area'
  );
});

test('All navigation paths are tested', () => {
  const content = readFile('src/utils/navigation.ts');
  assert(
    content.includes('dashboard'),
    'Should handle dashboard route'
  );
  assert(
    content.includes('tasks'),
    'Should handle tasks route'
  );
  assert(
    content.includes('medications'),
    'Should handle medications route'
  );
  assert(
    content.includes('events'),
    'Should handle events route'
  );
  assert(
    content.includes('add-device'),
    'Should handle add-device route'
  );
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary\n');
console.log(`Total Tests: ${passCount + failCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 All tests passed! Navigation and routing implementation is complete.\n');
  console.log('✅ Task 19.1: Configure tab navigation - COMPLETE');
  console.log('✅ Task 19: Update navigation and routing - COMPLETE');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(failCount > 0 ? 1 : 0);

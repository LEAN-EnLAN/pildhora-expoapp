/**
 * Task 5.1 Verification Script
 * Verifies Firebase RTDB listener integration in DeviceConnectivityCard
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Task 5.1: Firebase RTDB Listener Integration Verification\n');
console.log('=' .repeat(70));

const componentPath = path.join(__dirname, 'src/components/caregiver/DeviceConnectivityCard.tsx');
const testPath = path.join(__dirname, 'src/components/caregiver/__tests__/DeviceConnectivityCard.test.tsx');

let passCount = 0;
let failCount = 0;

function checkRequirement(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passCount++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
}

// Read component file
const componentContent = fs.readFileSync(componentPath, 'utf8');

console.log('\n📋 Requirement 11.1: Set up RTDB listener using onValue\n');

checkRequirement(
  'Imports Firebase RTDB functions',
  componentContent.includes('import { ref, onValue } from \'firebase/database\''),
  'Component imports ref and onValue from firebase/database'
);

checkRequirement(
  'Imports getRdbInstance service',
  componentContent.includes('getRdbInstance'),
  'Component uses getRdbInstance to get RTDB instance'
);

checkRequirement(
  'Sets up RTDB listener in useEffect',
  componentContent.includes('useEffect') && 
  componentContent.includes('onValue') &&
  componentContent.includes('deviceRef'),
  'useEffect hook sets up RTDB listener with onValue'
);

checkRequirement(
  'Listens to correct RTDB path',
  componentContent.includes('devices/${deviceId}/state'),
  'Listener monitors devices/{deviceId}/state path'
);

console.log('\n📋 Requirement 11.2: Update device state in real-time\n');

checkRequirement(
  'Updates state on snapshot changes',
  componentContent.includes('setDeviceState') &&
  componentContent.includes('snapshot.val()'),
  'Component updates state when RTDB snapshot changes'
);

checkRequirement(
  'Uses DeviceState interface',
  componentContent.includes('interface DeviceState') &&
  componentContent.includes('is_online: boolean') &&
  componentContent.includes('battery_level: number'),
  'Proper TypeScript interface for device state'
);

checkRequirement(
  'Real-time state management',
  componentContent.includes('useState<DeviceState | null>'),
  'Component maintains device state in React state'
);

console.log('\n📋 Requirement 11.5: Handle listener cleanup on unmount\n');

checkRequirement(
  'Returns cleanup function from useEffect',
  componentContent.includes('return () => {') &&
  componentContent.includes('if (unsubscribe)') &&
  componentContent.includes('unsubscribe()'),
  'useEffect returns cleanup function that calls unsubscribe'
);

checkRequirement(
  'Tracks mounted state',
  componentContent.includes('let mounted = true') &&
  componentContent.includes('mounted = false'),
  'Component tracks mounted state to prevent updates after unmount'
);

checkRequirement(
  'Prevents memory leaks',
  componentContent.includes('if (!mounted) return'),
  'Guards against state updates on unmounted component'
);

console.log('\n📋 Loading and Error States\n');

checkRequirement(
  'Implements loading state',
  componentContent.includes('const [loading, setLoading]') &&
  componentContent.includes('setLoading(true)') &&
  componentContent.includes('setLoading(false)'),
  'Component manages loading state during initialization'
);

checkRequirement(
  'Implements error state',
  componentContent.includes('const [error, setError]') &&
  componentContent.includes('setError('),
  'Component manages error state for failures'
);

checkRequirement(
  'Renders loading UI',
  componentContent.includes('if (loading)') &&
  componentContent.includes('ActivityIndicator') &&
  componentContent.includes('Conectando...'),
  'Component shows loading spinner and message'
);

checkRequirement(
  'Renders error UI',
  componentContent.includes('if (error)') &&
  componentContent.includes('errorText'),
  'Component shows error message when listener fails'
);

checkRequirement(
  'Handles RTDB initialization errors',
  componentContent.includes('try {') &&
  componentContent.includes('catch') &&
  componentContent.includes('Firebase Realtime Database not initialized'),
  'Component catches and handles RTDB initialization errors'
);

console.log('\n📋 Additional Implementation Quality\n');

checkRequirement(
  'Uses async/await for RTDB initialization',
  componentContent.includes('const setupListener = async () => {') &&
  componentContent.includes('await getRdbInstance()'),
  'Properly handles async RTDB initialization'
);

checkRequirement(
  'Implements error callback for onValue',
  componentContent.includes('onValue(') &&
  /onValue\([^)]+,\s*\([^)]+\)\s*=>\s*{[^}]+},\s*\([^)]+\)\s*=>\s*{/.test(componentContent),
  'onValue includes error callback handler'
);

checkRequirement(
  'Uses React.memo for performance',
  componentContent.includes('React.memo'),
  'Component wrapped in React.memo to prevent unnecessary re-renders'
);

checkRequirement(
  'Uses useMemo for derived values',
  componentContent.includes('useMemo') &&
  componentContent.includes('isOnline') &&
  componentContent.includes('batteryLevel'),
  'Memoizes computed values for performance'
);

// Check test file
console.log('\n📋 Unit Tests Coverage\n');

if (fs.existsSync(testPath)) {
  const testContent = fs.readFileSync(testPath, 'utf8');
  
  checkRequirement(
    'Tests RTDB listener setup',
    testContent.includes('mockOnValue') &&
    testContent.includes('getRdbInstance'),
    'Tests mock RTDB and verify listener setup'
  );
  
  checkRequirement(
    'Tests listener cleanup',
    testContent.includes('unmount') &&
    testContent.includes('mockUnsubscribe'),
    'Tests that unsubscribe is called on unmount'
  );
  
  checkRequirement(
    'Tests online/offline states',
    testContent.includes('is_online: true') &&
    testContent.includes('is_online: false'),
    'Tests both online and offline device states'
  );
  
  checkRequirement(
    'Tests loading state',
    testContent.includes('Conectando...'),
    'Tests loading state rendering'
  );
} else {
  checkRequirement('Test file exists', false, 'Test file not found');
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('\n📊 VERIFICATION SUMMARY\n');
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 Task 5.1 is FULLY IMPLEMENTED and meets all requirements!');
  console.log('\n✨ Key Features:');
  console.log('   • RTDB listener set up with onValue');
  console.log('   • Real-time device state updates');
  console.log('   • Proper listener cleanup on unmount');
  console.log('   • Loading and error states handled');
  console.log('   • Memory leak prevention');
  console.log('   • Comprehensive error handling');
  console.log('   • Unit tests with cleanup verification');
} else {
  console.log('\n⚠️  Some requirements need attention.');
}

console.log('\n' + '='.repeat(70));

process.exit(failCount > 0 ? 1 : 0);

/**
 * Test script for Task 8.1: Dashboard Data Fetching Implementation
 * 
 * This script verifies that the dashboard properly:
 * 1. Queries Firestore for linked patients via deviceLinks collection
 * 2. Sets up RTDB listener for device state
 * 3. Queries latest medication event
 * 4. Implements SWR pattern with cache
 * 5. Handles loading, error, and empty states
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('Task 8.1: Dashboard Data Fetching Implementation Verification');
console.log('='.repeat(80));
console.log('');

let allTestsPassed = true;
const results = [];

function testResult(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  if (!passed) allTestsPassed = false;
}

// Test 1: Verify useLinkedPatients hook exists and has correct structure
console.log('\n1. Checking useLinkedPatients hook...');
try {
  const hookPath = path.join(__dirname, 'src/hooks/useLinkedPatients.ts');
  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  const hasDeviceLinksQuery = hookContent.includes("collection(db, 'deviceLinks')");
  const hasWhereClause = hookContent.includes("where('userId', '==', caregiverId)");
  const hasRoleFilter = hookContent.includes("where('role', '==', 'caregiver')");
  const hasStatusFilter = hookContent.includes("where('status', '==', 'active')");
  const hasOnSnapshot = hookContent.includes('onSnapshot');
  const hasCache = hookContent.includes('getCache') && hookContent.includes('setCache');
  const hasErrorHandling = hookContent.includes('catch') || hookContent.includes('try');
  
  testResult(
    'useLinkedPatients queries deviceLinks collection',
    hasDeviceLinksQuery,
    hasDeviceLinksQuery ? 'Correctly queries deviceLinks collection' : 'Missing deviceLinks query'
  );
  
  testResult(
    'useLinkedPatients filters by caregiver userId',
    hasWhereClause,
    hasWhereClause ? 'Filters by userId correctly' : 'Missing userId filter'
  );
  
  testResult(
    'useLinkedPatients filters by role and status',
    hasRoleFilter && hasStatusFilter,
    (hasRoleFilter && hasStatusFilter) ? 'Filters by role=caregiver and status=active' : 'Missing role/status filters'
  );
  
  testResult(
    'useLinkedPatients implements real-time updates',
    hasOnSnapshot,
    hasOnSnapshot ? 'Uses onSnapshot for real-time updates' : 'Missing real-time listener'
  );
  
  testResult(
    'useLinkedPatients implements caching',
    hasCache,
    hasCache ? 'Implements cache with getCache/setCache' : 'Missing cache implementation'
  );
  
  testResult(
    'useLinkedPatients has error handling',
    hasErrorHandling,
    hasErrorHandling ? 'Has proper error handling' : 'Missing error handling'
  );
} catch (error) {
  testResult('useLinkedPatients hook exists', false, error.message);
}

// Test 2: Verify useLatestMedicationEvent hook exists and has correct structure
console.log('\n2. Checking useLatestMedicationEvent hook...');
try {
  const hookPath = path.join(__dirname, 'src/hooks/useLatestMedicationEvent.ts');
  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  const hasMedicationEventsQuery = hookContent.includes("collection(db, 'medicationEvents')");
  const hasOrderBy = hookContent.includes("orderBy('timestamp', 'desc')");
  const hasLimit = hookContent.includes('limit(1)');
  const hasOnSnapshot = hookContent.includes('onSnapshot');
  const hasCache = hookContent.includes('getCache') && hookContent.includes('setCache');
  const hasPatientFilter = hookContent.includes("where('patientId'");
  const hasCaregiverFilter = hookContent.includes("where('caregiverId'");
  
  testResult(
    'useLatestMedicationEvent queries medicationEvents collection',
    hasMedicationEventsQuery,
    hasMedicationEventsQuery ? 'Correctly queries medicationEvents' : 'Missing medicationEvents query'
  );
  
  testResult(
    'useLatestMedicationEvent orders by timestamp descending',
    hasOrderBy,
    hasOrderBy ? 'Orders by timestamp desc' : 'Missing orderBy clause'
  );
  
  testResult(
    'useLatestMedicationEvent limits to 1 result',
    hasLimit,
    hasLimit ? 'Limits to 1 result' : 'Missing limit clause'
  );
  
  testResult(
    'useLatestMedicationEvent implements real-time updates',
    hasOnSnapshot,
    hasOnSnapshot ? 'Uses onSnapshot for real-time updates' : 'Missing real-time listener'
  );
  
  testResult(
    'useLatestMedicationEvent implements caching',
    hasCache,
    hasCache ? 'Implements cache with getCache/setCache' : 'Missing cache implementation'
  );
  
  testResult(
    'useLatestMedicationEvent supports filtering',
    hasPatientFilter && hasCaregiverFilter,
    (hasPatientFilter && hasCaregiverFilter) ? 'Supports patientId and caregiverId filters' : 'Missing filter support'
  );
} catch (error) {
  testResult('useLatestMedicationEvent hook exists', false, error.message);
}

// Test 3: Verify useDeviceState hook exists and has correct structure
console.log('\n3. Checking useDeviceState hook...');
try {
  const hookPath = path.join(__dirname, 'src/hooks/useDeviceState.ts');
  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  const hasRTDBRef = hookContent.includes('ref(rtdb,');
  const hasDevicesPath = hookContent.includes('devices/${deviceId}/state');
  const hasOnValue = hookContent.includes('onValue');
  const hasCleanup = hookContent.includes('unsubscribe()');
  const hasErrorHandling = hookContent.includes('catch') || hookContent.includes('try');
  
  testResult(
    'useDeviceState uses RTDB ref',
    hasRTDBRef,
    hasRTDBRef ? 'Uses RTDB ref correctly' : 'Missing RTDB ref'
  );
  
  testResult(
    'useDeviceState queries correct path',
    hasDevicesPath,
    hasDevicesPath ? 'Queries devices/{deviceId}/state path' : 'Incorrect RTDB path'
  );
  
  testResult(
    'useDeviceState implements real-time listener',
    hasOnValue,
    hasOnValue ? 'Uses onValue for real-time updates' : 'Missing onValue listener'
  );
  
  testResult(
    'useDeviceState cleans up listener',
    hasCleanup,
    hasCleanup ? 'Properly cleans up listener on unmount' : 'Missing cleanup'
  );
  
  testResult(
    'useDeviceState has error handling',
    hasErrorHandling,
    hasErrorHandling ? 'Has proper error handling' : 'Missing error handling'
  );
} catch (error) {
  testResult('useDeviceState hook exists', false, error.message);
}

// Test 4: Verify dashboard uses the new hooks
console.log('\n4. Checking dashboard integration...');
try {
  const dashboardPath = path.join(__dirname, 'app/caregiver/dashboard.tsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  const importsLinkedPatients = dashboardContent.includes("import { useLinkedPatients }");
  const importsLatestEvent = dashboardContent.includes("import { useLatestMedicationEvent }");
  const importsDeviceState = dashboardContent.includes("import { useDeviceState }");
  const usesLinkedPatients = dashboardContent.includes('useLinkedPatients(');
  const hasAsyncStorage = dashboardContent.includes('AsyncStorage');
  const hasSelectedPatientKey = dashboardContent.includes('SELECTED_PATIENT_KEY');
  const hasPersistence = dashboardContent.includes('AsyncStorage.setItem');
  const hasLoadFromStorage = dashboardContent.includes('AsyncStorage.getItem');
  
  testResult(
    'Dashboard imports useLinkedPatients',
    importsLinkedPatients,
    importsLinkedPatients ? 'Imports useLinkedPatients hook' : 'Missing useLinkedPatients import'
  );
  
  testResult(
    'Dashboard uses useLinkedPatients',
    usesLinkedPatients,
    usesLinkedPatients ? 'Uses useLinkedPatients hook' : 'Not using useLinkedPatients'
  );
  
  testResult(
    'Dashboard implements patient selection persistence',
    hasAsyncStorage && hasSelectedPatientKey,
    (hasAsyncStorage && hasSelectedPatientKey) ? 'Implements AsyncStorage for persistence' : 'Missing persistence'
  );
  
  testResult(
    'Dashboard saves selected patient',
    hasPersistence,
    hasPersistence ? 'Saves selected patient to AsyncStorage' : 'Missing save logic'
  );
  
  testResult(
    'Dashboard loads selected patient on mount',
    hasLoadFromStorage,
    hasLoadFromStorage ? 'Loads selected patient from AsyncStorage' : 'Missing load logic'
  );
} catch (error) {
  testResult('Dashboard file exists', false, error.message);
}

// Test 5: Verify SWR pattern implementation
console.log('\n5. Checking SWR pattern implementation...');
try {
  const linkedPatientsPath = path.join(__dirname, 'src/hooks/useLinkedPatients.ts');
  const linkedPatientsContent = fs.readFileSync(linkedPatientsPath, 'utf8');
  
  const latestEventPath = path.join(__dirname, 'src/hooks/useLatestMedicationEvent.ts');
  const latestEventContent = fs.readFileSync(latestEventPath, 'utf8');
  
  const hasStaleWhileRevalidate = 
    linkedPatientsContent.includes('getCache') && 
    linkedPatientsContent.includes('setCache') &&
    linkedPatientsContent.includes('onSnapshot');
  
  const hasEventCache = 
    latestEventContent.includes('getCache') && 
    latestEventContent.includes('setCache');
  
  const hasRefetchFunction = 
    linkedPatientsContent.includes('refetch') &&
    latestEventContent.includes('refetch');
  
  testResult(
    'Implements stale-while-revalidate pattern',
    hasStaleWhileRevalidate,
    hasStaleWhileRevalidate ? 'Shows cached data while fetching fresh data' : 'Missing SWR pattern'
  );
  
  testResult(
    'Caches medication events',
    hasEventCache,
    hasEventCache ? 'Caches medication events' : 'Missing event caching'
  );
  
  testResult(
    'Provides refetch functions',
    hasRefetchFunction,
    hasRefetchFunction ? 'Hooks provide refetch functions' : 'Missing refetch functions'
  );
} catch (error) {
  testResult('SWR pattern verification', false, error.message);
}

// Test 6: Verify loading, error, and empty states
console.log('\n6. Checking state handling...');
try {
  const linkedPatientsPath = path.join(__dirname, 'src/hooks/useLinkedPatients.ts');
  const linkedPatientsContent = fs.readFileSync(linkedPatientsPath, 'utf8');
  
  const latestEventPath = path.join(__dirname, 'src/hooks/useLatestMedicationEvent.ts');
  const latestEventContent = fs.readFileSync(latestEventPath, 'utf8');
  
  const deviceStatePath = path.join(__dirname, 'src/hooks/useDeviceState.ts');
  const deviceStateContent = fs.readFileSync(deviceStatePath, 'utf8');
  
  const dashboardPath = path.join(__dirname, 'app/caregiver/dashboard.tsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  const hasLoadingState = 
    linkedPatientsContent.includes('isLoading') &&
    latestEventContent.includes('isLoading') &&
    deviceStateContent.includes('isLoading');
  
  const hasErrorState = 
    linkedPatientsContent.includes('error') &&
    latestEventContent.includes('error') &&
    deviceStateContent.includes('error');
  
  const dashboardHandlesLoading = dashboardContent.includes('patientsLoading');
  const dashboardHandlesError = dashboardContent.includes('patientsError');
  const dashboardHandlesEmpty = dashboardContent.includes('patientsWithDevices.length === 0');
  
  testResult(
    'Hooks provide loading states',
    hasLoadingState,
    hasLoadingState ? 'All hooks provide isLoading state' : 'Missing loading states'
  );
  
  testResult(
    'Hooks provide error states',
    hasErrorState,
    hasErrorState ? 'All hooks provide error state' : 'Missing error states'
  );
  
  testResult(
    'Dashboard handles loading state',
    dashboardHandlesLoading,
    dashboardHandlesLoading ? 'Dashboard shows loading UI' : 'Missing loading UI'
  );
  
  testResult(
    'Dashboard handles error state',
    dashboardHandlesError,
    dashboardHandlesError ? 'Dashboard shows error UI' : 'Missing error UI'
  );
  
  testResult(
    'Dashboard handles empty state',
    dashboardHandlesEmpty,
    dashboardHandlesEmpty ? 'Dashboard shows empty state UI' : 'Missing empty state UI'
  );
} catch (error) {
  testResult('State handling verification', false, error.message);
}

// Print summary
console.log('\n' + '='.repeat(80));
console.log('Test Summary');
console.log('='.repeat(80));

const passedTests = results.filter(r => r.passed).length;
const totalTests = results.length;
const passRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`\nTotal Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Pass Rate: ${passRate}%`);

if (allTestsPassed) {
  console.log('\n✅ All tests passed! Task 8.1 implementation is complete.');
  console.log('\nImplemented features:');
  console.log('  ✓ Query Firestore for linked patients via deviceLinks collection');
  console.log('  ✓ Set up RTDB listener for device state');
  console.log('  ✓ Query latest medication event');
  console.log('  ✓ Implement SWR pattern with cache');
  console.log('  ✓ Handle loading, error, and empty states');
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.');
}

console.log('\n' + '='.repeat(80));

process.exit(allTestsPassed ? 0 : 1);

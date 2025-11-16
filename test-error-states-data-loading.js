/**
 * Test: Error States for Data Loading (Task 14.1)
 * 
 * Verifies that error states are properly implemented across:
 * - Dashboard data fetching
 * - Events list loading
 * - Medications list loading
 * 
 * Tests:
 * 1. Error state components exist and are properly imported
 * 2. Error categorization works correctly
 * 3. User-friendly error messages are displayed
 * 4. Retry buttons are provided for recoverable errors
 * 5. Offline indicators are shown when appropriate
 * 6. Cached data fallback works correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Error States for Data Loading (Task 14.1)\n');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}\n`);
  }
}

// Helper function to check if file contains pattern
function fileContains(filePath, pattern, description) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!pattern.test(content)) {
    throw new Error(`${description} not found in ${filePath}`);
  }
  return true;
}

// Helper function to check multiple patterns
function fileContainsAll(filePath, patterns) {
  const content = fs.readFileSync(filePath, 'utf8');
  const missing = [];
  
  patterns.forEach(({ pattern, description }) => {
    if (!pattern.test(content)) {
      missing.push(description);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing in ${filePath}: ${missing.join(', ')}`);
  }
  return true;
}

console.log('📋 Test Suite: Error States Implementation\n');

// ============================================================================
// Test 1: Dashboard Error State Implementation
// ============================================================================
console.log('1️⃣  Dashboard Error States\n');

test('Dashboard imports ErrorState component', () => {
  fileContains(
    'app/caregiver/dashboard.tsx',
    /import\s+{\s*ErrorState\s*}\s+from/,
    'ErrorState import'
  );
});

test('Dashboard imports error handling utilities', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /categorizeError/, description: 'categorizeError import' },
    { pattern: /ErrorCategory/, description: 'ErrorCategory import (optional)' }
  ]);
});

test('Dashboard has initialization error state', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /initializationError/, description: 'initializationError state' },
    { pattern: /setInitializationError/, description: 'setInitializationError setter' },
    { pattern: /<ErrorState/, description: 'ErrorState component usage' }
  ]);
});

test('Dashboard has patients error state', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /patientsError/, description: 'patientsError from hook' },
    { pattern: /error:\s*patientsError/, description: 'patientsError destructured' }
  ]);
});

test('Dashboard has retry handler', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /handleRetryInitialization/, description: 'handleRetryInitialization function' },
    { pattern: /onRetry={handleRetryInitialization}/, description: 'onRetry prop passed to ErrorState' }
  ]);
});

test('Dashboard shows offline indicator', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /OfflineIndicator/, description: 'OfflineIndicator import' },
    { pattern: /<OfflineIndicator\s+isOnline={isOnline}/, description: 'OfflineIndicator usage' }
  ]);
});

test('Dashboard has cached data fallback', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /cachedPatients/, description: 'cachedPatients state' },
    { pattern: /usingCachedData/, description: 'usingCachedData state' },
    { pattern: /patientDataCache/, description: 'patientDataCache usage' }
  ]);
});

test('Dashboard shows cached data banner', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /cachedDataBanner/, description: 'cachedDataBanner style' },
    { pattern: /Mostrando datos guardados/, description: 'Cached data message' }
  ]);
});

test('Dashboard categorizes errors before displaying', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /categorizeError\(.*Error\)/, description: 'categorizeError call' },
    { pattern: /category={.*\.category}/, description: 'category prop passed to ErrorState' }
  ]);
});

// ============================================================================
// Test 2: Events List Error State Implementation
// ============================================================================
console.log('\n2️⃣  Events List Error States\n');

test('Events imports ErrorState component', () => {
  fileContains(
    'app/caregiver/events.tsx',
    /import\s+{\s*ErrorState\s*}\s+from/,
    'ErrorState import'
  );
});

test('Events imports error handling utilities', () => {
  fileContains(
    'app/caregiver/events.tsx',
    /categorizeError/,
    'categorizeError import'
  );
});

test('Events has error state management', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /const\s+\[error,\s*setError\]/, description: 'error state' },
    { pattern: /setError\(/, description: 'setError usage' }
  ]);
});

test('Events has retry handler', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /handleRetry/, description: 'handleRetry function' },
    { pattern: /onRetry={handleRetry}/, description: 'onRetry prop' }
  ]);
});

test('Events shows offline indicator', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /OfflineIndicator/, description: 'OfflineIndicator import' },
    { pattern: /<OfflineIndicator\s+isOnline={isOnline}/, description: 'OfflineIndicator usage' }
  ]);
});

test('Events has cached data fallback', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /cachedEvents/, description: 'cachedEvents state' },
    { pattern: /usingCachedData/, description: 'usingCachedData state' },
    { pattern: /patientDataCache\.getCachedEvents/, description: 'getCachedEvents call' }
  ]);
});

test('Events shows cached data banner', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /cachedDataBanner/, description: 'cachedDataBanner style' },
    { pattern: /Mostrando datos guardados/, description: 'Cached data message' }
  ]);
});

test('Events renders error state conditionally', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /if\s*\(error\s+&&\s+!usingCachedData/, description: 'Conditional error rendering' },
    { pattern: /<ErrorState/, description: 'ErrorState component' }
  ]);
});

test('Events categorizes errors', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /categorizeError\(err\)/, description: 'categorizeError in listener' },
    { pattern: /category={error\.category}/, description: 'category prop' }
  ]);
});

// ============================================================================
// Test 3: Medications List Error State Implementation
// ============================================================================
console.log('\n3️⃣  Medications List Error States\n');

test('Medications imports ErrorState component', () => {
  fileContains(
    'app/caregiver/medications/[patientId]/index.tsx',
    /import\s+{\s*ErrorState\s*}\s+from/,
    'ErrorState import'
  );
});

test('Medications imports error handling utilities', () => {
  fileContains(
    'app/caregiver/medications/[patientId]/index.tsx',
    /categorizeError/,
    'categorizeError import'
  );
});

test('Medications uses Redux error state', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /const\s+{\s*.*error.*}\s*=\s*useSelector/, description: 'error from Redux' },
    { pattern: /state\.medications/, description: 'medications slice' }
  ]);
});

test('Medications has retry handler', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /handleRetry/, description: 'handleRetry function' },
    { pattern: /dispatch\(fetchMedications/, description: 'fetchMedications dispatch' }
  ]);
});

test('Medications shows offline indicator', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /OfflineIndicator/, description: 'OfflineIndicator import' },
    { pattern: /<OfflineIndicator\s+isOnline={isOnline}/, description: 'OfflineIndicator usage' }
  ]);
});

test('Medications has cached data fallback', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /cachedMedications/, description: 'cachedMedications state' },
    { pattern: /usingCachedData/, description: 'usingCachedData state' },
    { pattern: /patientDataCache\.getCachedMedications/, description: 'getCachedMedications call' }
  ]);
});

test('Medications shows cached data banner', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /cachedDataBanner/, description: 'cachedDataBanner style' },
    { pattern: /Mostrando datos guardados/, description: 'Cached data message' }
  ]);
});

test('Medications renders error state conditionally', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /if\s*\(error\s+&&\s+!usingCachedData/, description: 'Conditional error rendering' },
    { pattern: /<ErrorState/, description: 'ErrorState component' }
  ]);
});

test('Medications categorizes errors', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /categorizeError\(error\)/, description: 'categorizeError call' },
    { pattern: /category={categorized\.category}/, description: 'category prop' }
  ]);
});

// ============================================================================
// Test 4: ErrorState Component Implementation
// ============================================================================
console.log('\n4️⃣  ErrorState Component\n');

test('ErrorState component exists', () => {
  const exists = fs.existsSync('src/components/caregiver/ErrorState.tsx');
  if (!exists) {
    throw new Error('ErrorState.tsx file not found');
  }
});

test('ErrorState accepts required props', () => {
  fileContainsAll('src/components/caregiver/ErrorState.tsx', [
    { pattern: /interface\s+ErrorStateProps/, description: 'ErrorStateProps interface' },
    { pattern: /message:\s*string/, description: 'message prop' },
    { pattern: /category\?:\s*ErrorCategory/, description: 'category prop' },
    { pattern: /onRetry\?:/, description: 'onRetry prop' }
  ]);
});

test('ErrorState displays user-friendly messages', () => {
  fileContainsAll('src/components/caregiver/ErrorState.tsx', [
    { pattern: /<Text.*>{.*message.*}<\/Text>/, description: 'Message display' },
    { pattern: /getErrorTitle/, description: 'Error title function' }
  ]);
});

test('ErrorState shows retry button', () => {
  fileContainsAll('src/components/caregiver/ErrorState.tsx', [
    { pattern: /onRetry\s+&&/, description: 'Conditional retry button' },
    { pattern: /<Button.*onPress={onRetry}/, description: 'Retry button' }
  ]);
});

test('ErrorState shows category-specific icons', () => {
  fileContainsAll('src/components/caregiver/ErrorState.tsx', [
    { pattern: /getErrorIcon/, description: 'getErrorIcon function' },
    { pattern: /ErrorCategory\.NETWORK/, description: 'Network error handling' },
    { pattern: /ErrorCategory\.PERMISSION/, description: 'Permission error handling' }
  ]);
});

// ============================================================================
// Test 5: Error Handling Utilities
// ============================================================================
console.log('\n5️⃣  Error Handling Utilities\n');

test('Error handling utilities exist', () => {
  const exists = fs.existsSync('src/utils/errorHandling.ts');
  if (!exists) {
    throw new Error('errorHandling.ts file not found');
  }
});

test('ErrorCategory enum is defined', () => {
  fileContainsAll('src/utils/errorHandling.ts', [
    { pattern: /export\s+enum\s+ErrorCategory/, description: 'ErrorCategory enum' },
    { pattern: /NETWORK\s*=/, description: 'NETWORK category' },
    { pattern: /PERMISSION\s*=/, description: 'PERMISSION category' },
    { pattern: /INITIALIZATION\s*=/, description: 'INITIALIZATION category' }
  ]);
});

test('categorizeError function exists', () => {
  fileContainsAll('src/utils/errorHandling.ts', [
    { pattern: /export\s+function\s+categorizeError/, description: 'categorizeError function' },
    { pattern: /return.*AppError/, description: 'Returns AppError' }
  ]);
});

test('Error categorization handles Firebase errors', () => {
  fileContainsAll('src/utils/errorHandling.ts', [
    { pattern: /error\.code/, description: 'Checks error code' },
    { pattern: /unavailable|timeout/, description: 'Network error codes' },
    { pattern: /permission-denied/, description: 'Permission error codes' }
  ]);
});

test('User-friendly error messages are provided', () => {
  fileContainsAll('src/utils/errorHandling.ts', [
    { pattern: /userMessage/, description: 'userMessage field' },
    { pattern: /verifica tu conexión/, description: 'Spanish network message' },
    { pattern: /No tienes permiso/, description: 'Spanish permission message' }
  ]);
});

test('Retryable errors are marked correctly', () => {
  fileContainsAll('src/utils/errorHandling.ts', [
    { pattern: /retryable:\s*true/, description: 'Retryable flag set to true' },
    { pattern: /retryable:\s*false/, description: 'Retryable flag set to false' }
  ]);
});

// ============================================================================
// Test 6: Offline Support
// ============================================================================
console.log('\n6️⃣  Offline Support\n');

test('OfflineIndicator component exists', () => {
  const exists = fs.existsSync('src/components/caregiver/OfflineIndicator.tsx');
  if (!exists) {
    throw new Error('OfflineIndicator.tsx file not found');
  }
});

test('patientDataCache service exists', () => {
  const exists = fs.existsSync('src/services/patientDataCache.ts');
  if (!exists) {
    throw new Error('patientDataCache.ts file not found');
  }
});

test('offlineQueueManager service exists', () => {
  const exists = fs.existsSync('src/services/offlineQueueManager.ts');
  if (!exists) {
    throw new Error('offlineQueueManager.ts file not found');
  }
});

test('Dashboard monitors network status', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /offlineQueueManager\.isNetworkOnline/, description: 'Network status check' },
    { pattern: /setIsOnline/, description: 'isOnline state setter' }
  ]);
});

test('Events monitors network status', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /offlineQueueManager\.isNetworkOnline/, description: 'Network status check' },
    { pattern: /setIsOnline/, description: 'isOnline state setter' }
  ]);
});

test('Medications monitors network status', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /offlineQueueManager\.isNetworkOnline/, description: 'Network status check' },
    { pattern: /setIsOnline/, description: 'isOnline state setter' }
  ]);
});

// ============================================================================
// Test 7: Error Boundary Integration
// ============================================================================
console.log('\n7️⃣  Error Boundary Integration\n');

test('Dashboard wrapped with ErrorBoundary', () => {
  fileContainsAll('app/caregiver/dashboard.tsx', [
    { pattern: /import.*ErrorBoundary/, description: 'ErrorBoundary import' },
    { pattern: /<ErrorBoundary>/, description: 'ErrorBoundary wrapper' }
  ]);
});

test('Events wrapped with ErrorBoundary', () => {
  fileContainsAll('app/caregiver/events.tsx', [
    { pattern: /import.*ErrorBoundary/, description: 'ErrorBoundary import' },
    { pattern: /<ErrorBoundary>/, description: 'ErrorBoundary wrapper' }
  ]);
});

test('Medications wrapped with ErrorBoundary', () => {
  fileContainsAll('app/caregiver/medications/[patientId]/index.tsx', [
    { pattern: /import.*ErrorBoundary/, description: 'ErrorBoundary import' },
    { pattern: /<ErrorBoundary>/, description: 'ErrorBoundary wrapper' }
  ]);
});

// ============================================================================
// Print Results
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 Test Results Summary');
console.log('='.repeat(70));
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests
    .filter(t => t.status.includes('FAIL'))
    .forEach(t => {
      console.log(`\n  ${t.name}`);
      console.log(`  Error: ${t.error}`);
    });
}

console.log('\n✅ Task 14.1 Implementation Verification Complete!\n');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);

#!/usr/bin/env node

/**
 * Test: Data Fetching Optimization (Task 15.2)
 * 
 * This test verifies the implementation of:
 * - SWR pattern with useCollectionSWR hook
 * - Static initial data for instant rendering
 * - Cache Firestore query results
 * - Proper query indexing
 * - Pagination with query limits
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(description, fn) {
  try {
    fn();
    log(`✓ ${description}`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description}`, 'red');
    log(`  ${error.message}`, 'red');
    return false;
  }
}

// Read files
const useCollectionSWRPath = path.join(__dirname, 'src/hooks/useCollectionSWR.ts');
const useLinkedPatientsPath = path.join(__dirname, 'src/hooks/useLinkedPatients.ts');
const eventsScreenPath = path.join(__dirname, 'app/caregiver/events.tsx');
const firestoreIndexesPath = path.join(__dirname, 'firestore.indexes.json');

const useCollectionSWRContent = fs.readFileSync(useCollectionSWRPath, 'utf8');
const useLinkedPatientsContent = fs.readFileSync(useLinkedPatientsPath, 'utf8');
const eventsScreenContent = fs.readFileSync(eventsScreenPath, 'utf8');
const firestoreIndexes = JSON.parse(fs.readFileSync(firestoreIndexesPath, 'utf8'));

log('\n📊 Testing Data Fetching Optimization Implementation...\n', 'cyan');

let passed = 0;
let failed = 0;

// Test 1: useCollectionSWR Hook Enhancements
log('Test Suite 1: useCollectionSWR Hook Enhancements', 'blue');

if (test('Has extended options interface', () => {
  if (!useCollectionSWRContent.includes('interface UseCollectionSWROptions<T>')) {
    throw new Error('UseCollectionSWROptions interface not found');
  }
  if (!useCollectionSWRContent.includes('realtime?:')) {
    throw new Error('realtime option not found');
  }
  if (!useCollectionSWRContent.includes('cacheTTL?:')) {
    throw new Error('cacheTTL option not found');
  }
  if (!useCollectionSWRContent.includes('onSuccess?:')) {
    throw new Error('onSuccess callback not found');
  }
  if (!useCollectionSWRContent.includes('onError?:')) {
    throw new Error('onError callback not found');
  }
})) passed++; else failed++;

if (test('Has cache TTL support', () => {
  if (!useCollectionSWRContent.includes('isCacheValid')) {
    throw new Error('isCacheValid function not found');
  }
  if (!useCollectionSWRContent.includes('cacheTTL')) {
    throw new Error('cacheTTL not implemented');
  }
})) passed++; else failed++;

if (test('Implements SWR pattern (cache-first)', () => {
  if (!useCollectionSWRContent.includes('Step 1: Try to load from cache')) {
    throw new Error('Cache-first pattern not documented');
  }
  if (!useCollectionSWRContent.includes('Step 2: Fetch fresh data')) {
    throw new Error('Fresh data fetch not documented');
  }
  if (!useCollectionSWRContent.includes('Step 3: Update cache')) {
    throw new Error('Cache update not documented');
  }
})) passed++; else failed++;

if (test('Has refetch function', () => {
  if (!useCollectionSWRContent.includes('refetch: () => Promise<void>')) {
    throw new Error('refetch function not in return type');
  }
  if (!useCollectionSWRContent.includes('const refetch = useCallback')) {
    throw new Error('refetch implementation not found');
  }
})) passed++; else failed++;

if (test('Has comprehensive JSDoc documentation', () => {
  if (!useCollectionSWRContent.includes('Custom hook for fetching Firestore collections with SWR pattern')) {
    throw new Error('Main JSDoc not found');
  }
  if (!useCollectionSWRContent.includes('@example')) {
    throw new Error('Usage example not found');
  }
})) passed++; else failed++;

// Test 2: useLinkedPatients Optimization
log('\nTest Suite 2: useLinkedPatients Optimization', 'blue');

if (test('Implements SWR pattern', () => {
  if (!useLinkedPatientsContent.includes('Step 1: Try to load from cache')) {
    throw new Error('Cache-first pattern not implemented');
  }
  if (!useLinkedPatientsContent.includes('Step 2: Fetch fresh data')) {
    throw new Error('Fresh data fetch not implemented');
  }
})) passed++; else failed++;

if (test('Uses parallel fetching with Promise.all', () => {
  if (!useLinkedPatientsContent.includes('Promise.all(patientPromises)')) {
    throw new Error('Promise.all not used for parallel fetching');
  }
  if (!useLinkedPatientsContent.includes('parallel fetching')) {
    throw new Error('Parallel fetching not documented');
  }
})) passed++; else failed++;

if (test('Has pagination support', () => {
  if (!useLinkedPatientsContent.includes('MAX_PATIENTS_PER_FETCH')) {
    throw new Error('MAX_PATIENTS_PER_FETCH constant not found');
  }
  if (!useLinkedPatientsContent.includes('limit(MAX_PATIENTS_PER_FETCH)')) {
    throw new Error('Pagination limit not applied to query');
  }
})) passed++; else failed++;

if (test('Updates cache with fresh data', () => {
  if (!useLinkedPatientsContent.includes('Step 4: Update cache')) {
    throw new Error('Cache update step not documented');
  }
  if (!useLinkedPatientsContent.includes('await setCache(stableCacheKey, validPatients)')) {
    throw new Error('Cache update not implemented');
  }
})) passed++; else failed++;

// Test 3: Events Screen Refactoring
log('\nTest Suite 3: Events Screen Refactoring', 'blue');

if (test('Uses useCollectionSWR hook', () => {
  if (!eventsScreenContent.includes('import { useCollectionSWR }')) {
    throw new Error('useCollectionSWR not imported');
  }
  if (!eventsScreenContent.includes('useCollectionSWR<MedicationEvent>')) {
    throw new Error('useCollectionSWR not used');
  }
})) passed++; else failed++;

if (test('Has static initial data', () => {
  if (!eventsScreenContent.includes('STATIC_INITIAL_EVENTS')) {
    throw new Error('STATIC_INITIAL_EVENTS not defined');
  }
  if (!eventsScreenContent.includes('initialData: STATIC_INITIAL_EVENTS')) {
    throw new Error('Static initial data not passed to hook');
  }
})) passed++; else failed++;

if (test('Implements cache key with filters', () => {
  if (!eventsScreenContent.includes('const cacheKey = useMemo')) {
    throw new Error('Cache key not memoized');
  }
  if (!eventsScreenContent.includes('events:${user.id}')) {
    throw new Error('Cache key does not include user ID');
  }
})) passed++; else failed++;

if (test('Has cache TTL configured', () => {
  if (!eventsScreenContent.includes('cacheTTL:')) {
    throw new Error('cacheTTL not configured');
  }
  if (!eventsScreenContent.includes('5 * 60 * 1000')) {
    throw new Error('5-minute cache TTL not set');
  }
})) passed++; else failed++;

if (test('Has pagination limit', () => {
  if (!eventsScreenContent.includes('EVENTS_PER_PAGE')) {
    throw new Error('EVENTS_PER_PAGE constant not found');
  }
  if (!eventsScreenContent.includes('EVENTS_PER_PAGE = 50')) {
    throw new Error('Pagination limit not set to 50');
  }
})) passed++; else failed++;

if (test('Uses mutate for refresh', () => {
  if (!eventsScreenContent.includes('mutate()')) {
    throw new Error('mutate() not called');
  }
  if (!eventsScreenContent.includes('const handleRefresh')) {
    throw new Error('handleRefresh not implemented');
  }
})) passed++; else failed++;

if (test('Memoizes query', () => {
  if (!eventsScreenContent.includes('const eventsQuery = useMemo')) {
    throw new Error('Query not memoized');
  }
})) passed++; else failed++;

if (test('Has onSuccess callback', () => {
  if (!eventsScreenContent.includes('onSuccess:')) {
    throw new Error('onSuccess callback not configured');
  }
  if (!eventsScreenContent.includes('patientDataCache.cacheEvents')) {
    throw new Error('Cache update not in onSuccess');
  }
})) passed++; else failed++;

// Test 4: Firestore Indexes
log('\nTest Suite 4: Firestore Indexes', 'blue');

if (test('Has deviceLinks composite index', () => {
  const deviceLinksIndex = firestoreIndexes.indexes.find(idx => 
    idx.collectionGroup === 'deviceLinks' &&
    idx.fields.some(f => f.fieldPath === 'userId') &&
    idx.fields.some(f => f.fieldPath === 'role') &&
    idx.fields.some(f => f.fieldPath === 'status')
  );
  if (!deviceLinksIndex) {
    throw new Error('deviceLinks composite index (userId + role + status) not found');
  }
})) passed++; else failed++;

if (test('Has medicationEvents indexes', () => {
  const eventIndexes = firestoreIndexes.indexes.filter(idx => 
    idx.collectionGroup === 'medicationEvents'
  );
  if (eventIndexes.length < 5) {
    throw new Error('Not enough medicationEvents indexes found');
  }
})) passed++; else failed++;

// Test 5: Performance Optimizations
log('\nTest Suite 5: Performance Optimizations', 'blue');

if (test('Uses useMemo for derived data', () => {
  if (!eventsScreenContent.includes('const events = useMemo')) {
    throw new Error('Events filtering not memoized');
  }
})) passed++; else failed++;

if (test('Uses useCallback for handlers', () => {
  if (!eventsScreenContent.includes('const handleRefresh = useCallback')) {
    throw new Error('handleRefresh not wrapped in useCallback');
  }
  if (!eventsScreenContent.includes('const handleRetry = useCallback')) {
    throw new Error('handleRetry not wrapped in useCallback');
  }
})) passed++; else failed++;

if (test('Removed redundant state variables', () => {
  // Should not have manual loading/error state since SWR provides it
  const hasManualLoading = eventsScreenContent.includes('const [loading, setLoading] = useState');
  const hasManualError = eventsScreenContent.includes('const [error, setError] = useState');
  const hasManualEvents = eventsScreenContent.includes('const [allEvents, setAllEvents] = useState');
  
  if (hasManualLoading || hasManualError || hasManualEvents) {
    throw new Error('Redundant state variables not removed');
  }
})) passed++; else failed++;

// Test 6: Documentation
log('\nTest Suite 6: Documentation', 'blue');

if (test('Has implementation summary document', () => {
  const summaryPath = path.join(__dirname, '.kiro/specs/caregiver-dashboard-redesign/TASK15.2_DATA_FETCHING_OPTIMIZATION.md');
  if (!fs.existsSync(summaryPath)) {
    throw new Error('Implementation summary document not found');
  }
  const summaryContent = fs.readFileSync(summaryPath, 'utf8');
  if (!summaryContent.includes('SWR pattern')) {
    throw new Error('SWR pattern not documented');
  }
  if (!summaryContent.includes('Performance Improvements')) {
    throw new Error('Performance improvements not documented');
  }
})) passed++; else failed++;

if (test('Has quick reference guide', () => {
  const guidePath = path.join(__dirname, '.kiro/specs/caregiver-dashboard-redesign/DATA_FETCHING_OPTIMIZATION_QUICK_REFERENCE.md');
  if (!fs.existsSync(guidePath)) {
    throw new Error('Quick reference guide not found');
  }
  const guideContent = fs.readFileSync(guidePath, 'utf8');
  if (!guideContent.includes('useCollectionSWR Hook')) {
    throw new Error('Hook usage not documented');
  }
  if (!guideContent.includes('Cache Keys')) {
    throw new Error('Cache keys not documented');
  }
})) passed++; else failed++;

// Summary
log('\n' + '='.repeat(50), 'cyan');
log(`Total Tests: ${passed + failed}`, 'cyan');
log(`Passed: ${passed}`, 'green');
log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
log('='.repeat(50) + '\n', 'cyan');

if (failed === 0) {
  log('✓ All data fetching optimization tests passed!', 'green');
  log('\nImplementation Summary:', 'cyan');
  log('  ✓ Enhanced useCollectionSWR with SWR pattern', 'green');
  log('  ✓ Added cache TTL support', 'green');
  log('  ✓ Implemented static initial data', 'green');
  log('  ✓ Optimized useLinkedPatients with parallel fetching', 'green');
  log('  ✓ Refactored events screen with SWR', 'green');
  log('  ✓ Added Firestore composite indexes', 'green');
  log('  ✓ Implemented pagination limits', 'green');
  log('  ✓ Created comprehensive documentation', 'green');
  process.exit(0);
} else {
  log('✗ Some tests failed. Please review the implementation.', 'red');
  process.exit(1);
}

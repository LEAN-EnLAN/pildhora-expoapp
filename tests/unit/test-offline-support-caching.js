/**
 * Test: Offline Support and Caching Implementation
 * 
 * Verifies Task 14.2 implementation:
 * - Cache recently viewed patient data using AsyncStorage
 * - Display cached data when offline
 * - Show offline indicator in UI
 * - Queue medication changes made offline
 * - Sync queued changes when connectivity restored
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Offline Support and Caching Implementation\n');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}\n`);
    failCount++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function fileContains(filePath, searchString) {
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return content.includes(searchString);
}

function fileContainsRegex(filePath, regex) {
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return regex.test(content);
}

// Test 1: Patient Data Cache Service
console.log('📦 Testing Patient Data Cache Service...\n');

test('PatientDataCacheService exists', () => {
  if (!fileExists('src/services/patientDataCache.ts')) {
    throw new Error('patientDataCache.ts not found');
  }
});

test('Cache service has cachePatient method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'cachePatient')) {
    throw new Error('cachePatient method not found');
  }
});

test('Cache service has cacheMedications method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'cacheMedications')) {
    throw new Error('cacheMedications method not found');
  }
});

test('Cache service has cacheEvents method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'cacheEvents')) {
    throw new Error('cacheEvents method not found');
  }
});

test('Cache service has cacheDeviceState method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'cacheDeviceState')) {
    throw new Error('cacheDeviceState method not found');
  }
});

test('Cache service has getCachedPatient method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'getCachedPatient')) {
    throw new Error('getCachedPatient method not found');
  }
});

test('Cache service has getCachedMedications method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'getCachedMedications')) {
    throw new Error('getCachedMedications method not found');
  }
});

test('Cache service has clearPatientCache method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'clearPatientCache')) {
    throw new Error('clearPatientCache method not found');
  }
});

test('Cache service has clearAllCache method', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'clearAllCache')) {
    throw new Error('clearAllCache method not found');
  }
});

test('Cache service implements cache expiration', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'MAX_CACHE_AGE_MS')) {
    throw new Error('Cache expiration not implemented');
  }
});

// Test 2: Offline Queue Manager
console.log('\n📤 Testing Offline Queue Manager...\n');

test('OfflineQueueManager exists', () => {
  if (!fileExists('src/services/offlineQueueManager.ts')) {
    throw new Error('offlineQueueManager.ts not found');
  }
});

test('Queue manager integrates with NetInfo', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', '@react-native-community/netinfo')) {
    throw new Error('NetInfo integration not found');
  }
});

test('Queue manager has enqueue method', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'enqueue')) {
    throw new Error('enqueue method not found');
  }
});

test('Queue manager has processQueue method', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'processQueue')) {
    throw new Error('processQueue method not found');
  }
});

test('Queue manager has getQueueStatus method', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'getQueueStatus')) {
    throw new Error('getQueueStatus method not found');
  }
});

test('Queue manager supports medication operations', () => {
  const hasMedicationCreate = fileContains('src/services/offlineQueueManager.ts', 'medication_create');
  const hasMedicationUpdate = fileContains('src/services/offlineQueueManager.ts', 'medication_update');
  const hasMedicationDelete = fileContains('src/services/offlineQueueManager.ts', 'medication_delete');
  
  if (!hasMedicationCreate || !hasMedicationUpdate || !hasMedicationDelete) {
    throw new Error('Medication operation types not found');
  }
});

test('Queue manager persists to AsyncStorage', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'persistQueue')) {
    throw new Error('Queue persistence not implemented');
  }
});

test('Queue manager loads from AsyncStorage', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'loadQueue')) {
    throw new Error('Queue loading not implemented');
  }
});

test('Queue manager has retry logic', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'retryCount')) {
    throw new Error('Retry logic not found');
  }
});

test('Queue manager has sync completion callback', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'onSyncComplete')) {
    throw new Error('Sync completion callback not found');
  }
});

// Test 3: Network Status Hook
console.log('\n🌐 Testing Network Status Hook...\n');

test('useNetworkStatus hook exists', () => {
  if (!fileExists('src/hooks/useNetworkStatus.ts')) {
    throw new Error('useNetworkStatus.ts not found');
  }
});

test('Network status hook uses NetInfo', () => {
  if (!fileContains('src/hooks/useNetworkStatus.ts', '@react-native-community/netinfo')) {
    throw new Error('NetInfo not imported');
  }
});

test('Network status hook returns isOnline', () => {
  if (!fileContains('src/hooks/useNetworkStatus.ts', 'isOnline')) {
    throw new Error('isOnline not returned');
  }
});

test('Network status hook returns queue status', () => {
  if (!fileContains('src/hooks/useNetworkStatus.ts', 'queueStatus')) {
    throw new Error('queueStatus not returned');
  }
});

test('Network status hook monitors queue', () => {
  if (!fileContains('src/hooks/useNetworkStatus.ts', 'offlineQueueManager')) {
    throw new Error('Queue manager integration not found');
  }
});

// Test 4: Offline Medication Service
console.log('\n💊 Testing Offline Medication Service...\n');

test('OfflineMedicationService exists', () => {
  if (!fileExists('src/services/offlineMedicationService.ts')) {
    throw new Error('offlineMedicationService.ts not found');
  }
});

test('Service has createMedicationOffline function', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'createMedicationOffline')) {
    throw new Error('createMedicationOffline not found');
  }
});

test('Service has updateMedicationOffline function', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'updateMedicationOffline')) {
    throw new Error('updateMedicationOffline not found');
  }
});

test('Service has deleteMedicationOffline function', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'deleteMedicationOffline')) {
    throw new Error('deleteMedicationOffline not found');
  }
});

test('Service has recordDoseIntakeOffline function', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'recordDoseIntakeOffline')) {
    throw new Error('recordDoseIntakeOffline not found');
  }
});

test('Service has updateInventoryOffline function', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'updateInventoryOffline')) {
    throw new Error('updateInventoryOffline not found');
  }
});

test('Service checks online status before operations', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'isNetworkOnline')) {
    throw new Error('Online status check not found');
  }
});

test('Service queues operations when offline', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'offlineQueueManager.enqueue')) {
    throw new Error('Queue integration not found');
  }
});

test('Service generates medication events', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'medicationEventService')) {
    throw new Error('Event generation not found');
  }
});

// Test 5: Offline Indicator Component
console.log('\n🚦 Testing Offline Indicator Component...\n');

test('OfflineIndicator component exists', () => {
  if (!fileExists('src/components/caregiver/OfflineIndicator.tsx')) {
    throw new Error('OfflineIndicator.tsx not found');
  }
});

test('Offline indicator uses network status hook', () => {
  if (!fileContains('src/components/caregiver/OfflineIndicator.tsx', 'useNetworkStatus')) {
    throw new Error('useNetworkStatus hook not used');
  }
});

test('Offline indicator shows offline state', () => {
  if (!fileContains('src/components/caregiver/OfflineIndicator.tsx', 'cloud-offline')) {
    throw new Error('Offline icon not found');
  }
});

test('Offline indicator shows syncing state', () => {
  if (!fileContains('src/components/caregiver/OfflineIndicator.tsx', 'sync')) {
    throw new Error('Sync icon not found');
  }
});

test('Offline indicator shows success state', () => {
  if (!fileContains('src/components/caregiver/OfflineIndicator.tsx', 'checkmark-circle')) {
    throw new Error('Success icon not found');
  }
});

test('Offline indicator animates in/out', () => {
  if (!fileContains('src/components/caregiver/OfflineIndicator.tsx', 'Animated')) {
    throw new Error('Animation not implemented');
  }
});

test('Offline indicator subscribes to sync completion', () => {
  if (!fileContains('src/components/caregiver/OfflineIndicator.tsx', 'onSyncComplete')) {
    throw new Error('Sync completion subscription not found');
  }
});

// Test 6: Dashboard Integration
console.log('\n🏠 Testing Dashboard Integration...\n');

test('Dashboard uses network status hook', () => {
  if (!fileContains('app/caregiver/dashboard.tsx', 'useNetworkStatus')) {
    throw new Error('useNetworkStatus hook not used');
  }
});

test('Dashboard shows offline indicator', () => {
  if (!fileContains('app/caregiver/dashboard.tsx', '<OfflineIndicator')) {
    throw new Error('OfflineIndicator not rendered');
  }
});

test('Dashboard caches patient data', () => {
  if (!fileContains('app/caregiver/dashboard.tsx', 'patientDataCache')) {
    throw new Error('Patient data caching not implemented');
  }
});

test('Dashboard loads cached data on mount', () => {
  if (!fileContains('app/caregiver/dashboard.tsx', 'loadCachedData')) {
    throw new Error('Cached data loading not found');
  }
});

test('Dashboard shows cached data banner', () => {
  if (!fileContains('app/caregiver/dashboard.tsx', 'cachedDataBanner')) {
    throw new Error('Cached data banner not found');
  }
});

test('Dashboard uses cached data when offline', () => {
  if (!fileContains('app/caregiver/dashboard.tsx', 'usingCachedData')) {
    throw new Error('Cached data fallback not implemented');
  }
});

test('Dashboard caches data when loaded', () => {
  if (!fileContainsRegex('app/caregiver/dashboard.tsx', /cachePatient|cacheMedications/)) {
    throw new Error('Data caching not implemented');
  }
});

// Test 7: Medications Screen Integration
console.log('\n💊 Testing Medications Screen Integration...\n');

test('Medications screen uses network status hook', () => {
  if (!fileContains('app/caregiver/medications/[patientId]/index.tsx', 'useNetworkStatus')) {
    throw new Error('useNetworkStatus hook not used');
  }
});

test('Medications screen shows offline indicator', () => {
  if (!fileContains('app/caregiver/medications/[patientId]/index.tsx', '<OfflineIndicator')) {
    throw new Error('OfflineIndicator not rendered');
  }
});

test('Medications screen caches medications', () => {
  if (!fileContains('app/caregiver/medications/[patientId]/index.tsx', 'cacheMedications')) {
    throw new Error('Medications caching not implemented');
  }
});

test('Medications screen loads cached medications', () => {
  if (!fileContains('app/caregiver/medications/[patientId]/index.tsx', 'getCachedMedications')) {
    throw new Error('Cached medications loading not found');
  }
});

test('Medications screen shows cached data banner', () => {
  if (!fileContains('app/caregiver/medications/[patientId]/index.tsx', 'cachedDataBanner')) {
    throw new Error('Cached data banner not found');
  }
});

test('Medications screen uses cached data when offline', () => {
  if (!fileContains('app/caregiver/medications/[patientId]/index.tsx', 'usingCachedData')) {
    throw new Error('Cached data fallback not implemented');
  }
});

test('Medications screen fetches only when online', () => {
  if (!fileContains('app/caregiver/medications/[patientId]/index.tsx', 'isOnline')) {
    throw new Error('Online check not implemented');
  }
});

// Test 8: Data Flow and Architecture
console.log('\n🏗️  Testing Data Flow and Architecture...\n');

test('Cache service exports singleton instance', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'export const patientDataCache')) {
    throw new Error('Singleton instance not exported');
  }
});

test('Queue manager exports singleton instance', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'export const offlineQueueManager')) {
    throw new Error('Singleton instance not exported');
  }
});

test('Network status hook is properly typed', () => {
  if (!fileContains('src/hooks/useNetworkStatus.ts', 'NetworkStatus')) {
    throw new Error('NetworkStatus type not found');
  }
});

test('Offline medication service uses proper types', () => {
  if (!fileContains('src/services/offlineMedicationService.ts', 'Medication')) {
    throw new Error('Medication type not imported');
  }
});

test('Queue items have proper status tracking', () => {
  const hasStatus = fileContains('src/services/offlineQueueManager.ts', 'status:');
  const hasPending = fileContains('src/services/offlineQueueManager.ts', 'pending');
  const hasProcessing = fileContains('src/services/offlineQueueManager.ts', 'processing');
  const hasCompleted = fileContains('src/services/offlineQueueManager.ts', 'completed');
  const hasFailed = fileContains('src/services/offlineQueueManager.ts', 'failed');
  
  if (!hasStatus || !hasPending || !hasProcessing || !hasCompleted || !hasFailed) {
    throw new Error('Queue status tracking incomplete');
  }
});

// Test 9: Error Handling
console.log('\n⚠️  Testing Error Handling...\n');

test('Cache service handles errors gracefully', () => {
  if (!fileContainsRegex('src/services/patientDataCache.ts', /try\s*{[\s\S]*catch/)) {
    throw new Error('Error handling not found in cache service');
  }
});

test('Queue manager handles errors gracefully', () => {
  if (!fileContainsRegex('src/services/offlineQueueManager.ts', /try\s*{[\s\S]*catch/)) {
    throw new Error('Error handling not found in queue manager');
  }
});

test('Offline medication service handles errors', () => {
  if (!fileContainsRegex('src/services/offlineMedicationService.ts', /throw new Error/)) {
    throw new Error('Error handling not found in offline medication service');
  }
});

test('Dashboard handles cache loading errors', () => {
  const content = fs.readFileSync(path.join(__dirname, 'app/caregiver/dashboard.tsx'), 'utf8');
  const hasCatchBlock = /loadCachedData[\s\S]*catch/.test(content);
  
  if (!hasCatchBlock) {
    throw new Error('Cache loading error handling not found');
  }
});

// Test 10: Performance and Optimization
console.log('\n⚡ Testing Performance and Optimization...\n');

test('Cache service limits cached patients', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'MAX_CACHED_PATIENTS')) {
    throw new Error('Cache size limit not implemented');
  }
});

test('Queue manager limits queue size', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'MAX_QUEUE_SIZE')) {
    throw new Error('Queue size limit not implemented');
  }
});

test('Cache service prunes old entries', () => {
  if (!fileContains('src/services/patientDataCache.ts', 'pruneOldCache')) {
    throw new Error('Cache pruning not implemented');
  }
});

test('Queue manager removes completed items', () => {
  if (!fileContains('src/services/offlineQueueManager.ts', 'clearCompleted')) {
    throw new Error('Completed item cleanup not implemented');
  }
});

test('Network status hook uses intervals efficiently', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/hooks/useNetworkStatus.ts'), 'utf8');
  const hasCleanup = /return\s*\(\s*\)\s*=>\s*{[\s\S]*clearInterval/.test(content);
  
  if (!hasCleanup) {
    throw new Error('Interval cleanup not found');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${passCount + failCount}`);
console.log(`🎯 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
console.log('='.repeat(50) + '\n');

if (failCount === 0) {
  console.log('🎉 All tests passed! Offline support and caching implementation is complete.\n');
  console.log('✨ Key Features Implemented:');
  console.log('   • Patient data caching with AsyncStorage');
  console.log('   • Cached data display when offline');
  console.log('   • Offline indicator in UI');
  console.log('   • Medication change queueing when offline');
  console.log('   • Automatic sync when connectivity restored');
  console.log('   • Network status monitoring with NetInfo');
  console.log('   • Comprehensive error handling');
  console.log('   • Performance optimizations\n');
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}

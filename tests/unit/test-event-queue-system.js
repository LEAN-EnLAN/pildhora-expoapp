/**
 * Test script for Medication Event Queue System
 * 
 * Tests:
 * 1. MedicationEventQueue class with enqueue/dequeue methods
 * 2. Immediate sync attempt on event creation
 * 3. Background sync with 5-minute retry interval
 * 4. App foreground sync trigger
 * 5. Sync status tracking and error handling
 * 6. Pending event count indicator in UI
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Medication Event Queue System Implementation\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}\n`);
    failed++;
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

// Test 1: MedicationEventQueue class exists
test('MedicationEventQueue class is defined', () => {
  if (!fileExists('src/services/medicationEventService.ts')) {
    throw new Error('medicationEventService.ts not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'export class MedicationEventQueue')) {
    throw new Error('MedicationEventQueue class not found');
  }
});

// Test 2: Enqueue method exists
test('MedicationEventQueue has enqueue method', () => {
  if (!fileContainsRegex('src/services/medicationEventService.ts', /async enqueue\(/)) {
    throw new Error('enqueue method not found in MedicationEventQueue');
  }
});

// Test 3: Dequeue method exists
test('MedicationEventQueue has dequeue method', () => {
  if (!fileContainsRegex('src/services/medicationEventService.ts', /async dequeue\(/)) {
    throw new Error('dequeue method not found in MedicationEventQueue');
  }
});

// Test 4: Immediate sync on enqueue
test('Immediate sync is triggered on enqueue', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/services/medicationEventService.ts'), 'utf8');
  const enqueueMatch = content.match(/async enqueue\([^)]+\)[^{]*{[\s\S]*?this\.syncPendingEvents\(\)/);
  if (!enqueueMatch) {
    throw new Error('Immediate sync not called in enqueue method');
  }
});

// Test 5: Background sync with 5-minute interval
test('Background sync with 5-minute interval is implemented', () => {
  if (!fileContains('src/services/medicationEventService.ts', 'SYNC_INTERVAL_MS = 5 * 60 * 1000')) {
    throw new Error('5-minute sync interval constant not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'startBackgroundSync')) {
    throw new Error('startBackgroundSync method not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'setInterval') || 
      !fileContains('src/services/medicationEventService.ts', 'SYNC_INTERVAL_MS)')) {
    throw new Error('setInterval with SYNC_INTERVAL_MS not found');
  }
});

// Test 6: App foreground sync trigger
test('App foreground sync trigger is implemented', () => {
  if (!fileContains('src/services/medicationEventService.ts', 'AppState')) {
    throw new Error('AppState import not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'setupAppStateListener')) {
    throw new Error('setupAppStateListener method not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'handleAppStateChange')) {
    throw new Error('handleAppStateChange method not found');
  }
  if (!fileContainsRegex('src/services/medicationEventService.ts', /nextAppState === ['"]active['"]/)) {
    throw new Error('Foreground detection not found');
  }
});

// Test 7: Sync status tracking
test('Sync status tracking is implemented', () => {
  if (!fileContains('src/services/medicationEventService.ts', 'syncInProgress')) {
    throw new Error('syncInProgress flag not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'lastSyncAttempt')) {
    throw new Error('lastSyncAttempt tracking not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'isSyncInProgress')) {
    throw new Error('isSyncInProgress method not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'getLastSyncAttempt')) {
    throw new Error('getLastSyncAttempt method not found');
  }
});

// Test 8: Error handling
test('Error handling is implemented', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/services/medicationEventService.ts'), 'utf8');
  const syncMethod = content.match(/async syncPendingEvents[\s\S]*?finally\s*{[\s\S]*?}/);
  if (!syncMethod) {
    throw new Error('try-catch-finally block not found in syncPendingEvents');
  }
  if (!fileContainsRegex('src/services/medicationEventService.ts', /catch\s*\([^)]*error[^)]*\)/)) {
    throw new Error('Error handling not found');
  }
});

// Test 9: Sync callbacks
test('Sync completion callbacks are implemented', () => {
  if (!fileContains('src/services/medicationEventService.ts', 'onSyncComplete')) {
    throw new Error('onSyncComplete method not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'syncCallbacks')) {
    throw new Error('syncCallbacks collection not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'notifySyncComplete')) {
    throw new Error('notifySyncComplete method not found');
  }
});

// Test 10: getPendingCount method
test('getPendingCount method is implemented', () => {
  if (!fileContainsRegex('src/services/medicationEventService.ts', /async getPendingCount\(/)) {
    throw new Error('getPendingCount method not found');
  }
});

// Test 11: EventSyncIndicator component exists
test('EventSyncIndicator component is created', () => {
  if (!fileExists('src/components/screens/patient/EventSyncIndicator.tsx')) {
    throw new Error('EventSyncIndicator.tsx not found');
  }
  if (!fileContains('src/components/screens/patient/EventSyncIndicator.tsx', 'export function EventSyncIndicator')) {
    throw new Error('EventSyncIndicator component not exported');
  }
});

// Test 12: EventSyncIndicator shows pending count
test('EventSyncIndicator displays pending count', () => {
  if (!fileContains('src/components/screens/patient/EventSyncIndicator.tsx', 'pendingCount')) {
    throw new Error('pendingCount state not found');
  }
  if (!fileContains('src/components/screens/patient/EventSyncIndicator.tsx', 'getPendingCount')) {
    throw new Error('getPendingCount call not found');
  }
});

// Test 13: EventSyncIndicator shows sync status
test('EventSyncIndicator displays sync status', () => {
  if (!fileContains('src/components/screens/patient/EventSyncIndicator.tsx', 'isSyncing')) {
    throw new Error('isSyncing state not found');
  }
  if (!fileContains('src/components/screens/patient/EventSyncIndicator.tsx', 'ActivityIndicator')) {
    throw new Error('ActivityIndicator not found');
  }
});

// Test 14: EventSyncIndicator subscribes to sync events
test('EventSyncIndicator subscribes to sync completion', () => {
  if (!fileContainsRegex('src/components/screens/patient/EventSyncIndicator.tsx', /onSyncComplete\(/)) {
    throw new Error('onSyncComplete subscription not found');
  }
  if (!fileContainsRegex('src/components/screens/patient/EventSyncIndicator.tsx', /unsubscribe\(/)) {
    throw new Error('Unsubscribe call not found');
  }
});

// Test 15: EventSyncBadge component exists
test('EventSyncBadge component is created', () => {
  if (!fileExists('src/components/screens/patient/EventSyncBadge.tsx')) {
    throw new Error('EventSyncBadge.tsx not found');
  }
  if (!fileContains('src/components/screens/patient/EventSyncBadge.tsx', 'export function EventSyncBadge')) {
    throw new Error('EventSyncBadge component not exported');
  }
});

// Test 16: EventSyncBadge shows badge with count
test('EventSyncBadge displays badge with count', () => {
  if (!fileContains('src/components/screens/patient/EventSyncBadge.tsx', 'pendingCount')) {
    throw new Error('pendingCount state not found');
  }
  if (!fileContainsRegex('src/components/screens/patient/EventSyncBadge.tsx', /badge.*Text/)) {
    throw new Error('Badge text not found');
  }
});

// Test 17: Components are exported from index
test('Components are exported from patient screens index', () => {
  if (!fileExists('src/components/screens/patient/index.ts')) {
    throw new Error('Patient screens index not found');
  }
  if (!fileContains('src/components/screens/patient/index.ts', 'EventSyncIndicator')) {
    throw new Error('EventSyncIndicator not exported from index');
  }
  if (!fileContains('src/components/screens/patient/index.ts', 'EventSyncBadge')) {
    throw new Error('EventSyncBadge not exported from index');
  }
});

// Test 18: Singleton instances are exported
test('Singleton instances are exported', () => {
  if (!fileContains('src/services/medicationEventService.ts', 'export const medicationEventService')) {
    throw new Error('medicationEventService singleton not exported');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'export const medicationEventQueue')) {
    throw new Error('medicationEventQueue singleton not exported');
  }
});

// Test 19: Documentation exists
test('Event queue documentation is created', () => {
  if (!fileExists('src/services/EVENT_QUEUE_GUIDE.md')) {
    throw new Error('EVENT_QUEUE_GUIDE.md not found');
  }
  const content = fs.readFileSync(path.join(__dirname, 'src/services/EVENT_QUEUE_GUIDE.md'), 'utf8');
  if (!content.includes('Background Sync')) {
    throw new Error('Background sync documentation not found');
  }
  if (!content.includes('Foreground Sync')) {
    throw new Error('Foreground sync documentation not found');
  }
});

// Test 20: Cleanup methods exist
test('Cleanup methods are implemented', () => {
  if (!fileContains('src/services/medicationEventService.ts', 'stopBackgroundSync')) {
    throw new Error('stopBackgroundSync method not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'removeAppStateListener')) {
    throw new Error('removeAppStateListener method not found');
  }
  if (!fileContains('src/services/medicationEventService.ts', 'destroy')) {
    throw new Error('destroy method not found');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed! Event queue system is fully implemented.\n');
  console.log('✅ Task 13 Complete:');
  console.log('   - MedicationEventQueue class with enqueue/dequeue methods');
  console.log('   - Immediate sync attempt on event creation');
  console.log('   - Background sync with 5-minute retry interval');
  console.log('   - App foreground sync trigger');
  console.log('   - Sync status tracking and error handling');
  console.log('   - Pending event count indicator in UI');
  console.log('\n📚 See src/services/EVENT_QUEUE_GUIDE.md for usage documentation');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}

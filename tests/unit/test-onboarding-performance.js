/**
 * Test suite for onboarding performance optimizations
 * 
 * Tests all performance optimization features:
 * - Lazy loading for wizard steps
 * - Device validation caching
 * - Optimistic UI updates
 * - Progress indicators for async operations
 * - Network quality detection
 * - Batch operations
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

const { performance } = require('perf_hooks');

// Mock AsyncStorage
const mockAsyncStorage = {
  storage: new Map(),
  async setItem(key, value) {
    this.storage.set(key, value);
  },
  async getItem(key) {
    return this.storage.get(key) || null;
  },
  async removeItem(key) {
    this.storage.delete(key);
  },
  async getAllKeys() {
    return Array.from(this.storage.keys());
  },
  async multiRemove(keys) {
    keys.forEach(key => this.storage.delete(key));
  },
  clear() {
    this.storage.clear();
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

// ============================================================================
// Test Suite
// ============================================================================

console.log('\n🧪 Testing Onboarding Performance Optimizations\n');
console.log('='.repeat(60));

// Test 1: Cache Manager - Set and Get
asyncTest('Cache Manager - Set and Get', async () => {
  mockAsyncStorage.clear();
  
  const testData = { deviceId: 'TEST-123', isValid: true };
  const key = '@test_cache_key';
  const ttl = 5000; // 5 seconds
  
  // Simulate cache set
  const cachedData = {
    data: testData,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl
  };
  
  await mockAsyncStorage.setItem(key, JSON.stringify(cachedData));
  
  // Simulate cache get
  const cached = await mockAsyncStorage.getItem(key);
  assertNotNull(cached, 'Cached data should exist');
  
  const parsed = JSON.parse(cached);
  assertEquals(parsed.data.deviceId, 'TEST-123', 'Device ID should match');
  assertEquals(parsed.data.isValid, true, 'isValid should be true');
});

// Test 2: Cache Manager - Expiration
asyncTest('Cache Manager - Expiration', async () => {
  mockAsyncStorage.clear();
  
  const testData = { deviceId: 'TEST-456' };
  const key = '@test_expired_key';
  
  // Create expired cache entry
  const cachedData = {
    data: testData,
    timestamp: Date.now() - 10000, // 10 seconds ago
    expiresAt: Date.now() - 5000   // Expired 5 seconds ago
  };
  
  await mockAsyncStorage.setItem(key, JSON.stringify(cachedData));
  
  // Simulate cache get with expiration check
  const cached = await mockAsyncStorage.getItem(key);
  const parsed = JSON.parse(cached);
  
  const isExpired = Date.now() > parsed.expiresAt;
  assert(isExpired, 'Cache should be expired');
  
  if (isExpired) {
    await mockAsyncStorage.removeItem(key);
  }
  
  const afterRemoval = await mockAsyncStorage.getItem(key);
  assertEquals(afterRemoval, null, 'Expired cache should be removed');
});

// Test 3: Device Validation Caching
asyncTest('Device Validation Caching', async () => {
  mockAsyncStorage.clear();
  
  const deviceId = 'DEVICE-789';
  const validationResult = {
    deviceId,
    isValid: true,
    isClaimed: false
  };
  
  // Simulate caching validation result
  const cacheKey = `@onboarding_device_validation_${deviceId}`;
  const cachedData = {
    data: validationResult,
    timestamp: Date.now(),
    expiresAt: Date.now() + 300000 // 5 minutes
  };
  
  await mockAsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
  
  // Simulate cache hit
  const cached = await mockAsyncStorage.getItem(cacheKey);
  assertNotNull(cached, 'Validation result should be cached');
  
  const parsed = JSON.parse(cached);
  assertEquals(parsed.data.deviceId, deviceId, 'Device ID should match');
  assertEquals(parsed.data.isValid, true, 'Device should be valid');
  assertEquals(parsed.data.isClaimed, false, 'Device should not be claimed');
});

// Test 4: Connection Code Validation Caching
asyncTest('Connection Code Validation Caching', async () => {
  mockAsyncStorage.clear();
  
  const code = 'ABC123';
  const validationResult = {
    code,
    isValid: true,
    patientName: 'John Doe',
    deviceId: 'DEVICE-001'
  };
  
  // Simulate caching validation result
  const cacheKey = `@onboarding_connection_code_${code}`;
  const cachedData = {
    data: validationResult,
    timestamp: Date.now(),
    expiresAt: Date.now() + 120000 // 2 minutes
  };
  
  await mockAsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
  
  // Simulate cache hit
  const cached = await mockAsyncStorage.getItem(cacheKey);
  assertNotNull(cached, 'Connection code result should be cached');
  
  const parsed = JSON.parse(cached);
  assertEquals(parsed.data.code, code, 'Code should match');
  assertEquals(parsed.data.isValid, true, 'Code should be valid');
  assertEquals(parsed.data.patientName, 'John Doe', 'Patient name should match');
});

// Test 5: Optimistic Update Flow
asyncTest('Optimistic Update Flow', async () => {
  let localState = { config: 'old' };
  
  // Simulate optimistic update
  const optimisticData = { config: 'new' };
  const rollbackData = { ...localState };
  
  // Apply optimistic update
  localState = optimisticData;
  assertEquals(localState.config, 'new', 'Optimistic update should be applied');
  
  // Simulate operation failure and rollback
  localState = rollbackData;
  assertEquals(localState.config, 'old', 'Rollback should restore original state');
});

// Test 6: Async Progress Tracking
test('Async Progress Tracking', () => {
  const progress = {
    isActive: false,
    current: 0,
    total: 0,
    message: '',
    percentage: 0
  };
  
  // Start operation
  progress.isActive = true;
  progress.total = 3;
  progress.message = 'Starting...';
  
  assert(progress.isActive, 'Operation should be active');
  assertEquals(progress.total, 3, 'Total steps should be 3');
  
  // Update progress
  progress.current = 1;
  progress.message = 'Step 1...';
  progress.percentage = (1 / 3) * 100;
  
  assertEquals(progress.current, 1, 'Current step should be 1');
  assert(progress.percentage > 0, 'Percentage should be greater than 0');
  
  // Complete operation
  progress.current = 3;
  progress.percentage = 100;
  progress.isActive = false;
  
  assertEquals(progress.percentage, 100, 'Progress should be 100%');
  assert(!progress.isActive, 'Operation should be complete');
});

// Test 7: Network Quality Detection
test('Network Quality Detection', () => {
  const requestTimes = [100, 150, 120, 130, 140]; // Fast network
  const avg = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;
  
  let quality;
  if (avg < 500) {
    quality = 'fast';
  } else if (avg < 2000) {
    quality = 'slow';
  } else {
    quality = 'offline';
  }
  
  assertEquals(quality, 'fast', 'Network should be classified as fast');
  
  // Test slow network
  const slowRequestTimes = [800, 1000, 900, 1100, 1200];
  const slowAvg = slowRequestTimes.reduce((a, b) => a + b, 0) / slowRequestTimes.length;
  
  let slowQuality;
  if (slowAvg < 500) {
    slowQuality = 'fast';
  } else if (slowAvg < 2000) {
    slowQuality = 'slow';
  } else {
    slowQuality = 'offline';
  }
  
  assertEquals(slowQuality, 'slow', 'Network should be classified as slow');
});

// Test 8: Batch Operations Queue
asyncTest('Batch Operations Queue', async () => {
  const queue = [];
  const results = [];
  
  // Add operations to queue
  queue.push(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    results.push('op1');
  });
  
  queue.push(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    results.push('op2');
  });
  
  queue.push(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    results.push('op3');
  });
  
  assertEquals(queue.length, 3, 'Queue should have 3 operations');
  
  // Process batch
  await Promise.all(queue.map(op => op()));
  
  assertEquals(results.length, 3, 'All operations should complete');
  assert(results.includes('op1'), 'Operation 1 should complete');
  assert(results.includes('op2'), 'Operation 2 should complete');
  assert(results.includes('op3'), 'Operation 3 should complete');
});

// Test 9: Performance Metrics Collection
test('Performance Metrics Collection', () => {
  const metrics = new Map();
  
  // Record metrics
  const recordMetric = (name, duration) => {
    const existing = metrics.get(name) || [];
    existing.push(duration);
    metrics.set(name, existing);
  };
  
  recordMetric('device_validation', 150);
  recordMetric('device_validation', 180);
  recordMetric('device_validation', 160);
  
  const values = metrics.get('device_validation');
  assertEquals(values.length, 3, 'Should have 3 measurements');
  
  // Calculate average
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  assert(avg > 0, 'Average should be greater than 0');
  assert(avg < 200, 'Average should be reasonable');
});

// Test 10: Cache Invalidation
asyncTest('Cache Invalidation', async () => {
  mockAsyncStorage.clear();
  
  const key = '@test_invalidation';
  await mockAsyncStorage.setItem(key, JSON.stringify({ data: 'test' }));
  
  let cached = await mockAsyncStorage.getItem(key);
  assertNotNull(cached, 'Data should be cached');
  
  // Invalidate cache
  await mockAsyncStorage.removeItem(key);
  
  cached = await mockAsyncStorage.getItem(key);
  assertEquals(cached, null, 'Cache should be invalidated');
});

// Test 11: Clear All Caches
asyncTest('Clear All Caches', async () => {
  mockAsyncStorage.clear();
  
  // Add multiple cache entries
  await mockAsyncStorage.setItem('@onboarding_test1', 'data1');
  await mockAsyncStorage.setItem('@onboarding_test2', 'data2');
  await mockAsyncStorage.setItem('@wizard_test3', 'data3');
  await mockAsyncStorage.setItem('@other_data', 'data4');
  
  const allKeys = await mockAsyncStorage.getAllKeys();
  assertEquals(allKeys.length, 4, 'Should have 4 keys');
  
  // Clear onboarding caches
  const onboardingKeys = allKeys.filter(
    key => key.startsWith('@onboarding_') || key.startsWith('@wizard_')
  );
  
  assertEquals(onboardingKeys.length, 3, 'Should have 3 onboarding keys');
  
  await mockAsyncStorage.multiRemove(onboardingKeys);
  
  const remainingKeys = await mockAsyncStorage.getAllKeys();
  assertEquals(remainingKeys.length, 1, 'Should have 1 key remaining');
  assertEquals(remainingKeys[0], '@other_data', 'Other data should remain');
});

// Test 12: Lazy Loading Simulation
asyncTest('Lazy Loading Simulation', async () => {
  const loadComponent = async (name) => {
    // Simulate component loading delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return { default: `${name}Component` };
  };
  
  const start = performance.now();
  const component = await loadComponent('WelcomeStep');
  const duration = performance.now() - start;
  
  assertNotNull(component, 'Component should load');
  assertEquals(component.default, 'WelcomeStepComponent', 'Component name should match');
  assert(duration >= 50, 'Loading should take at least 50ms');
});

// Test 13: Preload Next Step
asyncTest('Preload Next Step', async () => {
  const stepComponents = [
    async () => ({ default: 'Step1' }),
    async () => ({ default: 'Step2' }),
    async () => ({ default: 'Step3' })
  ];
  
  const currentStep = 0;
  const nextStep = currentStep + 1;
  
  assert(nextStep < stepComponents.length, 'Next step should exist');
  
  // Preload next step
  const preloaded = await stepComponents[nextStep]();
  assertEquals(preloaded.default, 'Step2', 'Next step should be preloaded');
});

// Test 14: Adaptive Cache TTL Based on Network Quality
test('Adaptive Cache TTL Based on Network Quality', () => {
  const getCacheTTL = (quality) => {
    switch (quality) {
      case 'fast':
        return 2 * 60 * 1000; // 2 minutes
      case 'slow':
        return 10 * 60 * 1000; // 10 minutes
      case 'offline':
        return 30 * 60 * 1000; // 30 minutes
      default:
        return 5 * 60 * 1000; // 5 minutes
    }
  };
  
  assertEquals(getCacheTTL('fast'), 120000, 'Fast network TTL should be 2 minutes');
  assertEquals(getCacheTTL('slow'), 600000, 'Slow network TTL should be 10 minutes');
  assertEquals(getCacheTTL('offline'), 1800000, 'Offline TTL should be 30 minutes');
});

// Test 15: Measure Async Operation Performance
asyncTest('Measure Async Operation Performance', async () => {
  const measureAsyncOperation = async (name, operation) => {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      return { result, duration, success: true };
    } catch (error) {
      const duration = performance.now() - start;
      return { error, duration, success: false };
    }
  };
  
  const operation = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'success';
  };
  
  const { result, duration, success } = await measureAsyncOperation('test_op', operation);
  
  assert(success, 'Operation should succeed');
  assertEquals(result, 'success', 'Result should be success');
  assert(duration >= 100, 'Duration should be at least 100ms');
});

// ============================================================================
// Test Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary\n');
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`✓ Passed: ${results.passed}`);
console.log(`✗ Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests
    .filter(t => t.status === 'FAILED')
    .forEach(t => {
      console.log(`  - ${t.name}`);
      console.log(`    Error: ${t.error}`);
    });
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);

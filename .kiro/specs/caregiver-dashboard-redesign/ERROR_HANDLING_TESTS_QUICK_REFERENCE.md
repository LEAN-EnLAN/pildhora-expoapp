# Error Handling Tests - Quick Reference

## Test Files Overview

| File | Tests | Focus |
|------|-------|-------|
| `ErrorBoundary.test.tsx` | 15 | Error catching, retry, logging |
| `ErrorState.test.tsx` | 17 | Error display, categories, retry |
| `OfflineIndicator.test.tsx` | 20 | Offline mode, sync status |
| `ErrorHandlingIntegration.test.tsx` | 10 | Component integration |
| **TOTAL** | **62** | **Complete error handling** |

---

## Quick Commands

### Run All Error Handling Tests
```bash
npm test -- ErrorBoundary ErrorState OfflineIndicator ErrorHandlingIntegration
```

### Run Individual Tests
```bash
# ErrorBoundary only
npm test -- ErrorBoundary.test.tsx

# ErrorState only
npm test -- ErrorState.test.tsx

# OfflineIndicator only
npm test -- OfflineIndicator.test.tsx

# Integration only
npm test -- ErrorHandlingIntegration.test.tsx
```

### With Coverage
```bash
npm test -- ErrorHandling --coverage
```

### Watch Mode
```bash
npm test -- --watch ErrorHandling
```

---

## Test Coverage Summary

### ErrorBoundary (15 tests)
✅ Error catching and display  
✅ Custom fallback rendering  
✅ Retry functionality  
✅ Error logging  
✅ Development mode details  
✅ State management  

### ErrorState (17 tests)
✅ Message and title display  
✅ 5 error categories (Network, Permission, Init, Not Found, Unknown)  
✅ Retry button functionality  
✅ Custom labels  
✅ Accessibility support  

### OfflineIndicator (20 tests)
✅ Online/offline detection  
✅ Sync status (pending, processing)  
✅ Success notifications  
✅ Priority-based display  
✅ Cleanup on unmount  

### Integration (10 tests)
✅ Component interactions  
✅ Error recovery flows  
✅ Offline mode handling  
✅ State transitions  
✅ Nested boundaries  

---

## Key Test Scenarios

### 1. Error Boundary Catches Errors
```typescript
// Component throws error
<ErrorBoundary>
  <ThrowError />
</ErrorBoundary>

// Verifies: Fallback UI shown, error logged
```

### 2. Retry Resets Error State
```typescript
// Press retry button
fireEvent.press(getByText('Reintentar'));

// Verifies: Error state cleared, children re-rendered
```

### 3. Offline Mode Detected
```typescript
// Mock offline state
mockUseNetworkStatus({ isOnline: false });

// Verifies: Offline banner shown
```

### 4. Sync Status Displayed
```typescript
// Mock pending changes
mockUseNetworkStatus({ queueStatus: { pending: 3 } });

// Verifies: "3 cambios pendientes" shown
```

---

## Mocking Patterns

### Network Status
```typescript
jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({
    isOnline: true,
    queueStatus: { pending: 0, processing: 0, failed: 0 },
  })),
}));
```

### Offline Queue
```typescript
jest.mock('../../../services/offlineQueueManager', () => ({
  offlineQueueManager: {
    onSyncComplete: jest.fn(() => jest.fn()),
    getQueueStatus: jest.fn(() => ({ pending: 0 })),
  },
}));
```

### Error Logging
```typescript
jest.mock('../../../utils/errorHandling', () => ({
  logError: jest.fn().mockResolvedValue(undefined),
  ApplicationError: jest.fn(),
  ErrorCategory: { NETWORK: 'NETWORK', ... },
}));
```

---

## Common Assertions

### Component Rendering
```typescript
expect(getByText('Error message')).toBeTruthy();
expect(queryByText('Not shown')).toBeNull();
```

### Function Calls
```typescript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(expectedArg);
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Async Operations
```typescript
await waitFor(() => {
  expect(getByText('Success')).toBeTruthy();
});
```

### Accessibility
```typescript
expect(getByLabelText('Retry button')).toBeTruthy();
```

---

## Troubleshooting

### Issue: Tests Timeout
**Solution:** Use fake timers
```typescript
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
```

### Issue: Async Warnings
**Solution:** Wrap in act()
```typescript
act(() => {
  // State updates here
});
```

### Issue: Console Errors
**Solution:** Suppress expected errors
```typescript
beforeAll(() => {
  console.error = jest.fn();
});
```

---

## Coverage Goals

| Metric | Target | Expected |
|--------|--------|----------|
| Line Coverage | > 90% | ~95% |
| Branch Coverage | > 85% | ~90% |
| Function Coverage | > 90% | ~95% |
| Statement Coverage | > 90% | ~95% |

---

## CI/CD Integration

### GitHub Actions
```yaml
- name: Error Handling Tests
  run: npm test -- ErrorHandling --ci --coverage
```

### Coverage Reports
- HTML: `coverage/lcov-report/index.html`
- LCOV: `coverage/lcov.info`
- JSON: `coverage/coverage-final.json`

---

## Related Documentation

- [Test Documentation](../../../src/components/caregiver/__tests__/ErrorHandling.test.md)
- [Implementation Summary](./TASK14.3_IMPLEMENTATION_SUMMARY.md)
- [Error Handling Guide](./ERROR_HANDLING_QUICK_REFERENCE.md)
- [Error States Guide](./ERROR_STATES_QUICK_REFERENCE.md)
- [Offline Support Guide](./OFFLINE_SUPPORT_QUICK_REFERENCE.md)

---

## Quick Stats

- **Total Tests:** 62
- **Test Files:** 4
- **Components Tested:** 3 (ErrorBoundary, ErrorState, OfflineIndicator)
- **Integration Tests:** 10
- **Expected Coverage:** > 90%

---

**Last Updated:** 2024-01-16  
**Status:** ✅ Complete

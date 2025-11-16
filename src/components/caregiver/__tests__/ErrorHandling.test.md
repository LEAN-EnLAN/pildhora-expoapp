# Error Handling Unit Tests

## Overview

Comprehensive unit tests for error handling components including ErrorBoundary, ErrorState, OfflineIndicator, and their integration.

## Test Files

### 1. ErrorBoundary.test.tsx

Tests for the ErrorBoundary component that catches React errors and displays fallback UI.

**Test Coverage:**

#### Normal Rendering (2 tests)
- ✅ Renders children when no error occurs
- ✅ Renders multiple children correctly

#### Error Catching (4 tests)
- ✅ Catches errors and displays default fallback UI
- ✅ Displays retry button in fallback UI
- ✅ Logs error when caught
- ✅ Creates ApplicationError with correct parameters

#### Custom Fallback (2 tests)
- ✅ Renders custom fallback when provided
- ✅ Passes retry function to custom fallback

#### Retry Functionality (2 tests)
- ✅ Resets error state when retry is pressed
- ✅ Clears error state on retry

#### Error Handler Callback (2 tests)
- ✅ Calls onError callback when error is caught
- ✅ Passes correct error to onError callback

#### Development Mode (1 test)
- ✅ Shows error details in development mode

#### Error State Management (2 tests)
- ✅ Maintains error state until retry
- ✅ Updates state correctly when error occurs

**Total Tests:** 15

---

### 2. ErrorState.test.tsx

Tests for the ErrorState component that displays user-friendly error messages with retry options.

**Test Coverage:**

#### Basic Rendering (5 tests)
- ✅ Renders error message
- ✅ Renders default title when not provided
- ✅ Renders custom title when provided
- ✅ Shows icon by default
- ✅ Hides icon when showIcon is false

#### Error Categories (5 tests)
- ✅ Displays network error icon and title
- ✅ Displays permission error icon and title
- ✅ Displays initialization error icon and title
- ✅ Displays not found error icon and title
- ✅ Displays default error icon for unknown category

#### Retry Functionality (5 tests)
- ✅ Shows retry button when onRetry is provided
- ✅ Hides retry button when onRetry is not provided
- ✅ Calls onRetry when retry button is pressed
- ✅ Displays custom retry label
- ✅ Sets correct accessibility label on retry button

#### Accessibility (1 test)
- ✅ Has proper accessibility labels

#### Custom Styling (1 test)
- ✅ Renders with all props combined

**Total Tests:** 17

---

### 3. OfflineIndicator.test.tsx

Tests for the OfflineIndicator component that displays network status and sync progress.

**Test Coverage:**

#### Online State (2 tests)
- ✅ Does not render when online with no pending items
- ✅ Accepts isOnline override prop

#### Offline State (4 tests)
- ✅ Displays offline banner when not connected
- ✅ Shows offline message with local save info
- ✅ Displays offline icon
- ✅ Uses isOnline override when offline

#### Sync Status (6 tests)
- ✅ Displays pending changes count
- ✅ Displays singular form for one pending change
- ✅ Displays processing status
- ✅ Displays singular form for one processing change
- ✅ Shows sync icon when processing
- ✅ Shows upload icon when pending

#### Sync Success (4 tests)
- ✅ Displays success message after sync completion
- ✅ Shows success icon after sync
- ✅ Hides success message after timeout
- ✅ Does not show success message on failed sync

#### Cleanup (1 test)
- ✅ Unsubscribes from sync events on unmount

#### Priority Display (3 tests)
- ✅ Prioritizes sync success over other states
- ✅ Shows offline state over pending changes
- ✅ Shows processing over pending

**Total Tests:** 20

---

### 4. ErrorHandlingIntegration.test.tsx

Integration tests for complete error handling flows and component interactions.

**Test Coverage:**

#### ErrorBoundary with ErrorState (2 tests)
- ✅ Uses ErrorState as custom fallback
- ✅ Handles network errors with appropriate category

#### Complete Error Recovery Flow (1 test)
- ✅ Recovers from error after retry

#### Offline Mode with Error Handling (2 tests)
- ✅ Shows offline indicator and error state together
- ✅ Handles offline errors with retry

#### Multiple Error States (1 test)
- ✅ Handles multiple error categories

#### Error State Transitions (1 test)
- ✅ Transitions from loading to error to success

#### Nested Error Boundaries (1 test)
- ✅ Catches errors at appropriate boundary level

#### Error Logging Integration (1 test)
- ✅ Logs errors through error handling system

#### Accessibility in Error States (1 test)
- ✅ Maintains accessibility during error states

**Total Tests:** 10

---

## Total Test Count

**Overall:** 62 tests across 4 test files

## Running the Tests

### Run All Error Handling Tests

```bash
npm test -- ErrorBoundary.test.tsx ErrorState.test.tsx OfflineIndicator.test.tsx ErrorHandlingIntegration.test.tsx
```

### Run Individual Test Files

```bash
# ErrorBoundary tests
npm test -- ErrorBoundary.test.tsx

# ErrorState tests
npm test -- ErrorState.test.tsx

# OfflineIndicator tests
npm test -- OfflineIndicator.test.tsx

# Integration tests
npm test -- ErrorHandlingIntegration.test.tsx
```

### Run with Coverage

```bash
npm test -- --coverage --collectCoverageFrom="src/components/**/*.{ts,tsx}"
```

### Watch Mode

```bash
npm test -- --watch ErrorHandling
```

## Test Patterns

### Mocking Strategy

1. **Firebase Services**: Mocked to prevent actual network calls
2. **Network Status**: Mocked useNetworkStatus hook for controlled testing
3. **Offline Queue**: Mocked offlineQueueManager for sync status testing
4. **Error Logging**: Mocked logError function to verify error tracking
5. **UI Components**: Mocked Ionicons and Button components

### Test Structure

All tests follow the **Arrange-Act-Assert** pattern:

```typescript
it('test description', () => {
  // Arrange: Set up test data and mocks
  const mockFn = jest.fn();
  
  // Act: Render component and interact
  const { getByText } = render(<Component onAction={mockFn} />);
  fireEvent.press(getByText('Button'));
  
  // Assert: Verify expected behavior
  expect(mockFn).toHaveBeenCalled();
});
```

### Async Testing

For async operations, use `waitFor`:

```typescript
await waitFor(() => {
  expect(getByText('Success')).toBeTruthy();
});
```

## Key Features Tested

### Error Boundary
- ✅ Error catching and display
- ✅ Custom fallback rendering
- ✅ Retry functionality
- ✅ Error logging
- ✅ Development mode error details
- ✅ Error state management
- ✅ Callback integration

### Error State
- ✅ Message and title display
- ✅ Category-specific icons and titles
- ✅ Retry button functionality
- ✅ Custom labels
- ✅ Accessibility support
- ✅ Icon visibility control

### Offline Indicator
- ✅ Online/offline detection
- ✅ Sync status display
- ✅ Pending changes count
- ✅ Processing status
- ✅ Success notifications
- ✅ Priority-based display
- ✅ Animation handling
- ✅ Cleanup on unmount

### Integration
- ✅ ErrorBoundary + ErrorState combination
- ✅ Complete error recovery flows
- ✅ Offline mode with errors
- ✅ Multiple error states
- ✅ State transitions
- ✅ Nested error boundaries
- ✅ Error logging integration
- ✅ Accessibility maintenance

## Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 90%
- **Statement Coverage**: > 90%

## Troubleshooting

### Common Issues

1. **Timer Issues**: Use `jest.useFakeTimers()` for components with timeouts
2. **Async Warnings**: Wrap state updates in `act()`
3. **Mock Not Working**: Ensure mocks are defined before imports
4. **Console Errors**: Suppress expected errors with `console.error = jest.fn()`

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand ErrorBoundary.test.tsx
```

## CI/CD Integration

These tests are designed for continuous integration:

```yaml
- name: Run Error Handling Tests
  run: npm test -- ErrorHandling --ci --coverage
```

## Related Documentation

- [Error Handling Implementation](../../../../.kiro/specs/caregiver-dashboard-redesign/ERROR_HANDLING_QUICK_REFERENCE.md)
- [Error States Guide](../../../../.kiro/specs/caregiver-dashboard-redesign/ERROR_STATES_QUICK_REFERENCE.md)
- [Offline Support](../../../../.kiro/specs/caregiver-dashboard-redesign/OFFLINE_SUPPORT_QUICK_REFERENCE.md)
- [Task 14 Implementation](../../../../.kiro/specs/caregiver-dashboard-redesign/TASK14_IMPLEMENTATION_SUMMARY.md)

## Maintenance

Update tests when:
- Error handling logic changes
- New error categories are added
- Offline sync behavior changes
- UI components are modified
- Accessibility requirements change

## Future Enhancements

- [ ] Add E2E tests for complete error flows
- [ ] Add visual regression tests for error states
- [ ] Add performance tests for error recovery
- [ ] Add tests for error analytics tracking
- [ ] Add tests for error rate limiting

Last Updated: 2024-01-16

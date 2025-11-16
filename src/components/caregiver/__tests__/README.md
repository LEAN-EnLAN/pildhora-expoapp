# Medications Management Unit Tests

## Overview

This directory contains comprehensive unit tests for the caregiver medications management functionality. The tests cover medication list rendering, search/filter operations, CRUD operations, and event generation.

## Test Files

### 1. MedicationsManagement.test.tsx

Tests for the main medications management screen (`app/caregiver/medications/[patientId]/index.tsx`).

**Test Coverage:**
- ✅ Component renders with loading state
- ✅ Renders empty state when no medications exist
- ✅ Renders medication list with MedicationCard components
- ✅ Search functionality filters medications by name
- ✅ Search is case-insensitive
- ✅ Clear search button works correctly
- ✅ Shows empty search results state
- ✅ Add medication button navigates to wizard
- ✅ Medication card press navigates to detail view
- ✅ Shows low inventory badge when applicable
- ✅ Error state displays correctly
- ✅ Retry button works on error
- ✅ Search filters by dose unit
- ✅ Search filters by quantity type
- ✅ Accessibility labels are present

**Total Tests:** 15

### 2. MedicationsCRUD.test.tsx

Tests for medication CRUD operations and event generation.

**Test Coverage:**

#### Event Generation (10 tests)
- ✅ Generates correct medication created event
- ✅ Generates medication updated event with tracked changes
- ✅ Generates medication updated event with no changes
- ✅ Generates correct medication deleted event
- ✅ Tracks name change in update event
- ✅ Tracks frequency change in update event
- ✅ Tracks inventory settings change
- ✅ Tracks emoji change
- ✅ Tracks quantity type change
- ✅ Tracks multiple changes simultaneously

#### Event Enqueueing (10 tests)
- ✅ Creates and enqueues medication created event
- ✅ Creates and enqueues medication updated event
- ✅ Creates and enqueues medication deleted event
- ✅ Throws error for update without new medication
- ✅ Skips event creation when no caregiver assigned
- ✅ Multiple events can be enqueued
- ✅ Events have unique IDs
- ✅ Events have timestamps
- ✅ Events are marked as pending
- ✅ Event includes complete medication data

#### Queue Management (5 tests)
- ✅ Returns correct pending event count
- ✅ Clears all events from queue
- ✅ Returns all events as array
- ✅ Tracks sync status correctly
- ✅ Persists event queue to storage

**Total Tests:** 25

## Running the Tests

### Prerequisites

Install test dependencies:

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native @types/jest jest
```

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test MedicationsManagement.test.tsx
npm test MedicationsCRUD.test.tsx
```

### Run with Coverage

```bash
npm test -- --coverage
```

## Test Structure

### Mocking Strategy

The tests use comprehensive mocking for:
- **Expo Router**: Mocked navigation and routing hooks
- **Firebase Services**: Mocked Firestore and RTDB operations
- **AsyncStorage**: Mocked for event queue persistence
- **Redux Store**: Fresh store created for each test with preloaded state

### Test Patterns

1. **Arrange-Act-Assert**: Each test follows the AAA pattern
2. **Isolation**: Tests are independent and don't affect each other
3. **Cleanup**: `beforeEach` hooks ensure clean state
4. **Async Handling**: Proper use of `waitFor` for async operations

## Key Features Tested

### Medication List Rendering
- Loading states with skeleton loaders
- Empty states with helpful messages
- Medication cards with proper data display
- Low inventory badges
- Error states with retry functionality

### Search and Filter
- Real-time search as user types
- Case-insensitive matching
- Filters by medication name, dose unit, and quantity type
- Clear search functionality
- Empty search results handling

### CRUD Operations
- **Create**: Navigation to wizard, event generation
- **Read**: Fetching and displaying medications
- **Update**: Change tracking, event generation with diffs
- **Delete**: Confirmation dialogs, event generation

### Event Generation
- Automatic event creation for all CRUD operations
- Change tracking for updates (field-level diffs)
- Event queue management
- Sync status tracking
- Caregiver assignment validation

### Real-Time Updates
- Firestore onSnapshot integration
- Automatic list refresh on focus
- Inventory status checking
- Patient data loading

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%
- **Statement Coverage**: > 80%

## Integration with CI/CD

These tests are designed to run in continuous integration pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test -- --ci --coverage --maxWorkers=2
```

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mocks are defined before imports
2. **Async timeout**: Increase timeout in `waitFor` options
3. **Redux state issues**: Check preloadedState matches actual state shape
4. **Navigation mocks**: Verify router mock returns expected functions

### Debug Mode

Run tests in debug mode:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Future Enhancements

- [ ] Add integration tests for complete user flows
- [ ] Add E2E tests with Detox
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Add accessibility testing with axe

## Related Documentation

- [Medications Management Implementation](../../../.kiro/specs/caregiver-dashboard-redesign/TASK11_IMPLEMENTATION_SUMMARY.md)
- [Event Generation Guide](../../../services/MEDICATION_EVENT_SERVICE_GUIDE.md)
- [Testing Best Practices](../../../../docs/TESTING_GUIDE.md)

## Maintenance

These tests should be updated when:
- New features are added to medications management
- Event generation logic changes
- UI components are modified
- Redux state structure changes

Last Updated: 2024-01-16

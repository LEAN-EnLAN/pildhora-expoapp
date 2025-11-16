# Device Management Tests - Quick Reference

## Test File Location
`src/components/caregiver/__tests__/DeviceManagement.test.tsx`

## Quick Stats
- **Total Tests**: 25
- **Requirements Covered**: 1.4, 11.5
- **Test Categories**: 5 (Linking, Unlinking, Configuration, Error Handling, UI States)

## Running Tests

### Setup (First Time Only)
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native @types/jest jest
```

### Run Commands
```bash
# Run all device management tests
npm test DeviceManagement.test.tsx

# Run with coverage
npm test DeviceManagement.test.tsx -- --coverage

# Run in watch mode
npm test DeviceManagement.test.tsx -- --watch
```

## Test Categories

### 1. Device Linking (7 tests)
- ✅ Valid device ID linking
- ✅ Minimum 5 character validation
- ✅ Empty input validation
- ✅ Error handling
- ✅ Input clearing
- ✅ Success message
- ✅ Loading state

### 2. Device Unlinking (5 tests)
- ✅ Confirmation dialog
- ✅ Successful unlinking
- ✅ Cancel unlinking
- ✅ Error handling
- ✅ Success message

### 3. Device Configuration (3 tests)
- ✅ Panel expansion
- ✅ Configuration saving
- ✅ Error handling

### 4. Error Handling (5 tests)
- ✅ Authentication errors
- ✅ Network errors
- ✅ Firebase errors
- ✅ Loading errors
- ✅ Permission errors

### 5. UI States (5 tests)
- ✅ Loading state
- ✅ Empty state
- ✅ Device status display
- ✅ Message dismissal
- ✅ Accessibility labels

## Key Test Scenarios

### Device Linking Validation
```typescript
// Minimum 5 characters required
"abc" → ❌ Error: "debe tener al menos 5 caracteres"
"esp8266-ABC123" → ✅ Valid
```

### Confirmation Flow
```typescript
Press "Desvincular" → Alert shown → Confirm → Device unlinked
Press "Desvincular" → Alert shown → Cancel → No action
```

### Error Messages
```typescript
Already linked → "Este dispositivo ya está vinculado a tu cuenta"
Not authenticated → "Debes iniciar sesión"
Network error → "verifica tu conexión a internet"
```

## Requirements Coverage

### Requirement 1.4 ✅
- Device linking with validation
- Device unlinking with confirmation
- Authentication verification
- Error handling

### Requirement 11.5 ✅
- Device status display
- Battery level display
- Configuration updates
- Real-time synchronization

## Mock Data

### Patient with Device
```typescript
{
  id: 'patient-123',
  name: 'John Doe',
  deviceId: 'esp8266-ABC123',
  email: 'john@test.com',
  role: 'patient'
}
```

### Device State
```typescript
{
  is_online: true,
  battery_level: 85,
  current_status: 'idle'
}
```

## Expected Results

All 25 tests should pass:
```
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
```

## Troubleshooting

### Tests not running?
1. Check Jest is installed: `npm list jest`
2. Verify test script in package.json
3. Check file path is correct

### Mocks not working?
1. Ensure mocks defined before imports
2. Clear Jest cache: `jest --clearCache`
3. Check mock implementation matches API

### Async timeouts?
1. Increase timeout: `waitFor(() => {...}, { timeout: 5000 })`
2. Verify async operations complete
3. Check promise resolution

## Documentation

- **Test File**: `DeviceManagement.test.tsx`
- **Test Docs**: `DeviceManagement.test.md`
- **Implementation**: `TASK13.4_IMPLEMENTATION_SUMMARY.md`

## Related Files

- Screen: `app/caregiver/add-device.tsx`
- Services: `src/services/deviceLinking.ts`, `src/services/deviceConfig.ts`
- Hooks: `src/hooks/useLinkedPatients.ts`, `src/hooks/useDeviceState.ts`

---

**Last Updated**: 2024-01-16
**Status**: ✅ Complete

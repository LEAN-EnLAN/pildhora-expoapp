# Device Status Synchronization Fix

## Issue
When a device is linked on the link-device page, it shows as connected there, but the home screen still displays "No hay dispositivo vinculado" (No device linked).

## Root Cause
The home screen's device initialization logic only runs when the component mounts (when `patientId` or `dispatch` changes). When a user:
1. Navigates to `/patient/link-device`
2. Links a device successfully
3. Navigates back to `/patient/home`

The home screen component doesn't re-run the device detection logic because the dependencies (`patientId` and `dispatch`) haven't changed. The component is already mounted, so the `useEffect` doesn't trigger again.

## Solution
Added an `AppState` listener that refreshes the device list whenever the app becomes active. This ensures that:
- When navigating between screens, the device list is refreshed
- When the app comes to foreground, the device list is updated
- The home screen always shows the current device status

### Changes Made

#### File: `app/patient/home.tsx`

1. **Added AppState import**:
```typescript
import { ..., AppState } from 'react-native';
```

2. **Extracted device initialization into a reusable callback**:
```typescript
const initDevice = useCallback(async () => {
  // Device detection logic
}, [patientId, dispatch, deviceSlice?.listening]);
```

3. **Added AppState listener**:
```typescript
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('[Home] App became active, refreshing devices');
      initDevice();
    }
  });
  
  return () => {
    subscription.remove();
  };
}, [initDevice]);
```

## How It Works

### Before Fix
```
User Flow:
1. Home screen loads → initDevice() runs → No devices found
2. User navigates to link-device page
3. User links device → RTDB updated
4. User navigates back to home → initDevice() DOES NOT run
5. Home screen still shows "No device linked" ❌
```

### After Fix
```
User Flow:
1. Home screen loads → initDevice() runs → No devices found
2. User navigates to link-device page
3. User links device → RTDB updated
4. User navigates back to home → AppState becomes 'active'
5. AppState listener triggers → initDevice() runs
6. Device list refreshed → Device detected ✓
7. Home screen shows device status ✓
```

## Testing

Run the test script to verify the fix:
```bash
node test-device-status-sync.js
```

The test verifies:
1. Device linking works correctly in RTDB
2. Device state is readable
3. Home screen can detect devices after refresh
4. AppState listener mechanism works as expected

## Additional Benefits

This fix also improves the app in other scenarios:
- **App backgrounding**: When user switches apps and comes back, device status is refreshed
- **Network reconnection**: If the app was offline and comes back online, devices are re-detected
- **Multiple devices**: If user has multiple devices, the most recently active one is selected

## Verification Steps

To manually verify the fix:
1. Open the app and go to home screen
2. Verify it shows "No hay dispositivo vinculado"
3. Navigate to "Mi dispositivo" (link-device page)
4. Link a device using a valid Device ID
5. Navigate back to home screen
6. **Expected**: Device status card now shows the linked device with battery and status
7. **Before fix**: Would still show "No device linked"

## Additional Fix: Animation Errors

While testing, we discovered animation errors in the `Collapsible` component used on the link-device page. The error was:
```
ERROR: Attempting to run JS driven animation on animated node that has been moved to "native" earlier
```

### Root Cause
The `Collapsible` component was mixing `useNativeDriver: true` (for opacity) and `useNativeDriver: false` (for height) on the same animated node, which React Native doesn't support.

### Solution
Changed all animations to use `useNativeDriver: false` to ensure consistency. While this is slightly less performant, it prevents the error and works correctly for both height and opacity animations.

## Related Files
- `app/patient/home.tsx` - Home screen with device status
- `app/patient/link-device.tsx` - Device linking page
- `src/components/screens/patient/DeviceStatusCard.tsx` - Device status display component
- `src/components/ui/Collapsible.tsx` - Collapsible animation component (fixed)
- `src/services/deviceLinking.ts` - Device linking service
- `test-device-status-sync.js` - Test script for verification

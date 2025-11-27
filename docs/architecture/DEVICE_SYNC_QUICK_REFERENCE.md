# Device Sync - Quick Reference

## Problem
Device state not syncing between home page and link-device page.

## Solution
Added `useFocusEffect` to home page to refresh devices on screen focus.

## Code Change

```typescript
// Import useFocusEffect
import { useRouter, useFocusEffect } from 'expo-router';

// Add focus effect hook (after other useEffects)
useFocusEffect(
  useCallback(() => {
    console.log('[Home] Screen focused, refreshing devices');
    initDevice();
  }, [initDevice])
);
```

## When Device List Refreshes

| Trigger | Hook | Description |
|---------|------|-------------|
| Component mount | `useEffect` | Initial load |
| App foreground | `AppState` listener | App comes from background |
| Screen focus | `useFocusEffect` | Navigate back to screen ⭐ |

## Debug Logs

Watch for these console logs:
```
[Home] Found linked devices: ['DEVICE-001']
[Home] Single device found: DEVICE-001
[Home] Screen focused, refreshing devices
```

## Common Scenarios

### Scenario 1: Link New Device
1. Home shows no device
2. Go to link-device page → link device
3. Navigate back → ✅ Device appears

### Scenario 2: Unlink Device
1. Home shows Device A
2. Go to link-device page → unlink Device A
3. Navigate back → ✅ "No device linked" shown

### Scenario 3: Multiple Devices
1. Home shows Device A
2. Go to link-device page → link Device B
3. Navigate back → ✅ Most active device shown

## Files Modified
- `app/patient/home.tsx` - Added focus effect

## Files Unchanged (but related)
- `app/patient/link-device.tsx` - Already refreshes after operations
- `src/services/deviceLinking.ts` - Device linking logic
- `src/store/slices/deviceSlice.ts` - Redux device state

## Testing Checklist
- [ ] Link device → navigate back → device appears
- [ ] Unlink device → navigate back → device removed
- [ ] Multiple devices → navigate back → correct device shown
- [ ] App background/foreground → devices refresh
- [ ] Device listener starts/stops correctly

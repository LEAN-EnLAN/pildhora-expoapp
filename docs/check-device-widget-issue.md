# Device Widget Issue - Diagnostic Report

## Problem
Device data (battery, status, availability) not showing on patient/home screen in the "Mi dispositivo" widget.

## Root Cause Analysis

Based on code review, the issue is likely one of the following:

### 1. Device Listener Not Starting
**Location**: `app/patient/home.tsx` lines 109-146

The `initDevice()` function starts the device listener, but there might be issues:
- Device ID not being set correctly
- Redux listener not starting
- RTDB connection failing

### 2. Device State Not in RTDB
**Location**: Firebase Realtime Database `devices/{deviceId}/state`

The widget expects data at:
```
devices/{deviceId}/state {
  battery_level: number,
  current_status: string,
  is_online: boolean
}
```

If this data doesn't exist, the widget will show "N/A" or "Desconectado".

### 3. Redux State Not Updating
**Location**: `src/store/slices/deviceSlice.ts`

The device slice listens to RTDB and updates Redux state. If the listener isn't working:
- `deviceSlice.state` will be undefined
- `deviceStatus` computed value will return offline state
- Widget will show no data

## Immediate Fixes Needed

### Fix 1: Add Fallback UI When No Device Data
The widget should show a helpful message when device data is missing, not just "N/A".

### Fix 2: Add Debug Logging
Add console logs to track:
1. When device listener starts
2. When RTDB data is received
3. When Redux state updates
4. What data the widget receives

### Fix 3: Verify RTDB Data Exists
Check Firebase Console:
1. Go to Realtime Database
2. Navigate to `devices/{deviceId}/state`
3. Verify data exists and is structured correctly

## Testing Steps

1. **Check if device is linked**:
   - Open patient/home
   - Check console for: `[Home] Found linked devices: [...]`
   - If empty array, no device is linked

2. **Check if listener starts**:
   - Look for: `[Home] Single device found: {deviceId}`
   - Or: `[Home] Selected device from multiple: {deviceId}`

3. **Check Redux state**:
   - In React DevTools, check Redux state
   - Look at `device.state` - should have battery_level, current_status, is_online

4. **Check widget props**:
   - The DeviceStatusCard should receive:
     - `deviceId`: string
     - `batteryLevel`: number or null
     - `status`: 'idle' | 'dispensing' | 'error' | 'offline' | 'pending'
     - `isOnline`: boolean

## Quick Fix Implementation

I'll now implement better error handling and debug logging to identify the exact issue.

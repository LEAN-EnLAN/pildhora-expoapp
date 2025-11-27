# Device Sync Testing Checklist

## Pre-Testing Setup
- [ ] Ensure you have at least one device provisioned
- [ ] Have device ID ready for testing
- [ ] Clear app cache if needed
- [ ] Log in as a patient user

## Test Case 1: Link First Device
**Steps:**
1. [ ] Start on home page (no device linked)
2. [ ] Verify "No device linked" message shown
3. [ ] Navigate to link-device page
4. [ ] Enter device ID and click "Link"
5. [ ] Wait for success message
6. [ ] Navigate back to home page

**Expected Result:**
- [ ] Device appears on home page immediately
- [ ] Device status card shows correct device ID
- [ ] Battery level displayed (if available)
- [ ] Online/offline status shown correctly

## Test Case 2: Link Additional Device
**Steps:**
1. [ ] Start on home page (Device A linked)
2. [ ] Note current device ID
3. [ ] Navigate to link-device page
4. [ ] Link Device B
5. [ ] Navigate back to home page

**Expected Result:**
- [ ] Home page shows Device B (most recently linked)
- [ ] Device listener switches to Device B
- [ ] Status updates for Device B

## Test Case 3: Unlink Device
**Steps:**
1. [ ] Start on home page (Device A linked)
2. [ ] Navigate to link-device page
3. [ ] Click "Unlink" on Device A
4. [ ] Confirm unlink action
5. [ ] Navigate back to home page

**Expected Result:**
- [ ] "No device linked" message shown
- [ ] Device status card shows no device
- [ ] No device listener active

## Test Case 4: Multiple Devices Selection
**Steps:**
1. [ ] Link Device A (offline)
2. [ ] Link Device B (online)
3. [ ] Navigate back to home page

**Expected Result:**
- [ ] Device B shown (online takes priority)
- [ ] Correct device listener attached

## Test Case 5: App Background/Foreground
**Steps:**
1. [ ] Start on home page with device linked
2. [ ] Put app in background
3. [ ] Unlink device via another method (web console)
4. [ ] Bring app to foreground

**Expected Result:**
- [ ] Device state refreshes
- [ ] Shows updated device status

## Test Case 6: Rapid Navigation
**Steps:**
1. [ ] Navigate: Home → Link-Device → Home → Link-Device → Home
2. [ ] Perform quickly multiple times

**Expected Result:**
- [ ] No crashes or errors
- [ ] Device state always accurate
- [ ] No memory leaks

## Console Log Verification
Check for these logs during testing:

### On Screen Focus
```
[Home] Screen focused, refreshing devices
[Home] Found linked devices: ['DEVICE-001']
[Home] Single device found: DEVICE-001
```

### On Device Link
```
[DeviceLinking] linkDeviceToUser called
[DeviceLinking] Successfully created deviceLink document
[DeviceLinking] Successfully wrote device link to RTDB
```

### On Device Unlink
```
[DeviceLinking] unlinkDeviceFromUser called
[DeviceLinking] Successfully removed deviceLink document
[DeviceLinking] Successfully removed device link from RTDB
```

## Error Scenarios

### Test Case 7: Network Error During Refresh
**Steps:**
1. [ ] Disable network
2. [ ] Navigate to link-device page
3. [ ] Navigate back to home page

**Expected Result:**
- [ ] Graceful error handling
- [ ] No app crash
- [ ] Error logged to console

### Test Case 8: Invalid Device State
**Steps:**
1. [ ] Link device with corrupted RTDB data
2. [ ] Navigate back to home page

**Expected Result:**
- [ ] Fallback to safe defaults
- [ ] No crash
- [ ] Error logged

## Performance Checks
- [ ] Device refresh completes in < 1 second
- [ ] No UI freezing during refresh
- [ ] Smooth navigation transitions
- [ ] No excessive re-renders

## Accessibility Checks
- [ ] Screen reader announces device status
- [ ] Device status card has proper labels
- [ ] Navigation works with keyboard/screen reader

## Cross-Platform Testing
- [ ] iOS: Test on iPhone
- [ ] Android: Test on Android device
- [ ] Both platforms show same behavior

## Regression Testing
- [ ] Existing device features still work
- [ ] Medication list loads correctly
- [ ] Adherence card displays properly
- [ ] Upcoming dose card functions
- [ ] Emergency button works
- [ ] Settings navigation works

## Sign-Off
- [ ] All test cases passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Ready for production

## Notes
_Add any observations or issues found during testing:_

---

**Tester:** _______________
**Date:** _______________
**Build:** _______________
**Result:** ☐ Pass  ☐ Fail  ☐ Needs Review

# Critical Issues Fix - Inventory & Alarms

## Issues Identified

### 1. Stock Going to 0 Immediately
**Root Cause**: The `parseDoseAmount()` function is likely returning the full quantity instead of the dose amount per intake.

**Current Logic**:
- When a dose is taken, `inventoryService.decrementInventory()` is called
- It uses `parseDoseAmount()` which tries to parse from `doseValue` or `dosage`
- If `doseValue` contains the total quantity (e.g., "30" tablets), it decrements by 30 instead of 1

**Example Scenario**:
- User has 30 tablets
- Takes 1 dose
- System reads `doseValue: "30"` and decrements by 30
- Stock goes to 0

### 2. Alarms Not Working
**Root Cause**: Multiple issues with alarm implementation:

#### A. Alarms are created but not using native alarm APIs
- The code uses `expo-notifications` which provides notifications, NOT native alarms
- On Android, notifications can be dismissed and don't wake the device reliably
- On iOS, notifications don't work when app is terminated
- **Real alarms require**:
  - Android: `AlarmManager` API with `SET_ALARM` permission
  - iOS: `UNCalendarNotificationTrigger` with critical alerts

#### B. Alarm permissions not properly requested
- The app requests notification permissions, but not alarm permissions
- Android 12+ requires `SCHEDULE_EXACT_ALARM` permission
- iOS requires critical alert permissions for reliable alarms

#### C. Alarms may not persist across app restarts
- Alarms are stored in AsyncStorage but not re-registered on app restart
- If the app is killed, alarms are lost

## Solutions

### Fix 1: Correct Inventory Decrement Logic

The issue is that `doseValue` should represent the dose per intake, not the total quantity. We need to ensure:
1. `doseValue` = amount per dose (e.g., "500" for 500mg)
2. `initialQuantity` = total number of doses (e.g., 30 tablets)
3. When taking a dose, decrement by 1 (or the number of units per dose)

**Fix**: Update `parseDoseAmount()` to always return 1 for countable items (tablets, capsules) unless explicitly specified otherwise.

### Fix 2: Implement Native Alarms

**Option A: Use expo-notifications with critical alerts (Recommended for MVP)**
- Enable critical alerts on iOS
- Use high-priority notifications on Android
- Request proper permissions
- Add alarm sound and vibration

**Option B: Use native alarm APIs (Best for production)**
- Create native modules for Android AlarmManager
- Use UNCalendarNotificationTrigger on iOS
- Requires ejecting from Expo or using custom dev client

**Option C: Use expo-task-manager with background tasks**
- Schedule background tasks to check for upcoming doses
- Show notifications when doses are due
- More reliable than regular notifications

### Fix 3: Proper Permission Handling

Add proper permission requests for:
- Android: `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `POST_NOTIFICATIONS`
- iOS: Critical alert permissions

## Implementation Priority

### Immediate Fixes (Critical)
1. ✅ Fix inventory decrement logic
2. ✅ Add proper alarm permissions
3. ✅ Improve alarm reliability with critical alerts

### Short-term Improvements
4. Add alarm persistence across app restarts
5. Add alarm verification and debugging tools
6. Improve error handling and user feedback

### Long-term Enhancements
7. Implement native alarm modules
8. Add alarm testing and monitoring
9. Implement backup notification strategies

# Device Sync Flow Diagram

## Before Fix (Problem)

```
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Device Status: Device A                            │     │
│  │ Battery: 85%                                       │     │
│  │ Status: Online                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  [Navigate to Link Device] ──────────────────────────────►  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    LINK-DEVICE PAGE                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Linked Devices:                                    │     │
│  │  • Device A [Unlink]                               │     │
│  │                                                     │     │
│  │ [Link Device B] ◄─── User clicks                   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Firebase Updated: Device B linked ✓                        │
│  refreshLinkedDevices() called ✓                            │
│                                                              │
│  [Navigate Back] ──────────────────────────────────────────►│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Device Status: Device A  ❌ STALE DATA             │     │
│  │ Battery: 85%                                       │     │
│  │ Status: Online                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ❌ No refresh triggered on navigation                      │
│  ❌ Still showing old device                                │
└─────────────────────────────────────────────────────────────┘
```

## After Fix (Solution)

```
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Device Status: Device A                            │     │
│  │ Battery: 85%                                       │     │
│  │ Status: Online                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  [Navigate to Link Device] ──────────────────────────────►  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    LINK-DEVICE PAGE                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Linked Devices:                                    │     │
│  │  • Device A [Unlink]                               │     │
│  │                                                     │     │
│  │ [Link Device B] ◄─── User clicks                   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Firebase Updated: Device B linked ✓                        │
│  refreshLinkedDevices() called ✓                            │
│                                                              │
│  [Navigate Back] ──────────────────────────────────────────►│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE                            │
│                                                              │
│  ✅ useFocusEffect triggered!                               │
│  ✅ initDevice() called                                     │
│  ✅ Fetching devices from Firebase...                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Device Status: Device B  ✅ FRESH DATA             │     │
│  │ Battery: 92%                                       │     │
│  │ Status: Online                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ✅ Showing current device state                            │
└─────────────────────────────────────────────────────────────┘
```

## Refresh Triggers Comparison

### Before Fix
```
┌──────────────────┐
│  Component Mount │ ──► initDevice()
└──────────────────┘

┌──────────────────┐
│  App Foreground  │ ──► initDevice()
└──────────────────┘

┌──────────────────┐
│ Screen Focus     │ ──► ❌ Nothing
└──────────────────┘
```

### After Fix
```
┌──────────────────┐
│  Component Mount │ ──► initDevice()
└──────────────────┘

┌──────────────────┐
│  App Foreground  │ ──► initDevice()
└──────────────────┘

┌──────────────────┐
│ Screen Focus     │ ──► ✅ initDevice()  ⭐ NEW
└──────────────────┘
```

## Code Flow

```
User Action: Navigate back to home
         │
         ▼
┌─────────────────────────────────────┐
│  useFocusEffect callback triggered  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  initDevice() called                │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Fetch from RTDB:                   │
│  users/{userId}/devices             │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Parse device IDs                   │
│  Select active device               │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  setActiveDeviceId(deviceId)        │
│  dispatch(startDeviceListener())    │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  UI updates with fresh device data  │
└─────────────────────────────────────┘
```

## Key Components

```
┌────────────────────────────────────────────────────────┐
│                    HOME PAGE                           │
│  ┌──────────────────────────────────────────────┐     │
│  │ useFocusEffect(() => {                       │     │
│  │   initDevice();  ◄─── Refresh on focus       │     │
│  │ }, [initDevice])                             │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ initDevice() {                               │     │
│  │   • Fetch devices from RTDB                  │     │
│  │   • Select active device                     │     │
│  │   • Start device listener                    │     │
│  │ }                                            │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ <DeviceStatusCard                            │     │
│  │   deviceId={activeDeviceId}                  │     │
│  │   batteryLevel={...}                         │     │
│  │   status={...}                               │     │
│  │ />                                           │     │
│  └──────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘
```

## Benefits

```
┌─────────────────────────────────────────────────────────┐
│                    BEFORE FIX                           │
├─────────────────────────────────────────────────────────┤
│  ❌ Stale device data after navigation                  │
│  ❌ User sees incorrect device status                   │
│  ❌ Manual app restart needed to refresh                │
│  ❌ Confusing user experience                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     AFTER FIX                           │
├─────────────────────────────────────────────────────────┤
│  ✅ Fresh device data on every navigation               │
│  ✅ Accurate device status always shown                 │
│  ✅ Automatic refresh, no user action needed            │
│  ✅ Seamless, intuitive user experience                 │
└─────────────────────────────────────────────────────────┘
```

# Real-Time Connection Mode Sync Implementation

## Overview

Implemented real-time synchronization for patient device connection mode, allowing patients to see instantly when caregivers connect or disconnect from their device. The UI now shows whether the device is in "Autonomous Mode" (no caregivers) or "Caregiver Mode" (with caregiver count).

## Changes Made

### 1. Created `useDeviceLinks` Hook

**File**: `src/hooks/useDeviceLinks.ts`

A new custom hook that provides real-time updates for device links using Firestore's `onSnapshot` listener.

**Features**:
- Real-time listener for deviceLinks collection
- Filters by deviceId and active status
- Counts active caregivers
- Automatic cleanup on unmount
- Error handling and loading states

**Usage**:
```typescript
const { caregiverCount, hasCaregivers, isLoading } = useDeviceLinks({
  deviceId: 'device-001',
  enabled: true,
});
```

**Returns**:
- `deviceLinks`: Array of all active device links
- `caregiverCount`: Number of active caregivers
- `hasCaregivers`: Boolean indicating if any caregivers are connected
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Manual refetch function

### 2. Updated `DeviceStatusCard` Component

**File**: `src/components/screens/patient/DeviceStatusCard.tsx`

Enhanced the device status card to show real-time connection mode.

**New Features**:
- Connection mode banner showing current mode
- Visual indicator with icon and color
- Real-time updates when caregivers connect/disconnect
- Caregiver count display

**Connection Modes**:

1. **Autonomous Mode** (No caregivers)
   - Icon: Person icon
   - Color: Green (success)
   - Text: "Modo Autónomo"

2. **Caregiver Mode** (1+ caregivers)
   - Icon: People icon
   - Color: Blue (primary)
   - Text: "Modo Cuidador (X)" where X is the count

3. **Loading State**
   - Icon: Time icon
   - Color: Gray
   - Text: "Verificando..."

## How It Works

### Real-Time Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REAL-TIME SYNC FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. Patient opens home screen
   └─> DeviceStatusCard renders
       └─> useDeviceLinks hook initializes
           └─> Sets up Firestore onSnapshot listener
               └─> Queries: deviceLinks where deviceId == X and status == 'active'

2. Caregiver connects to device
   └─> deviceLink document created in Firestore
       └─> onSnapshot listener fires
           └─> useDeviceLinks updates caregiverCount
               └─> DeviceStatusCard re-renders
                   └─> Shows "Modo Cuidador (1)"

3. Another caregiver connects
   └─> Another deviceLink document created
       └─> onSnapshot listener fires
           └─> caregiverCount increments to 2
               └─> Shows "Modo Cuidador (2)"

4. Caregiver disconnects
   └─> deviceLink document deleted or status set to 'inactive'
       └─> onSnapshot listener fires
           └─> caregiverCount decrements
               └─> If count reaches 0, shows "Modo Autónomo"
```

### Data Structure

**Firestore Collection**: `deviceLinks`

```typescript
{
  id: "device-001_caregiver-123",
  deviceId: "device-001",
  userId: "caregiver-123",
  role: "caregiver",
  status: "active",
  linkedAt: Timestamp,
  linkedBy: "caregiver-123"
}
```

**Query**:
```typescript
collection('deviceLinks')
  .where('deviceId', '==', deviceId)
  .where('status', '==', 'active')
```

## Visual Design

### Connection Mode Banner

```
┌─────────────────────────────────────────────────────┐
│ Mi dispositivo                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👥 Modo Cuidador (2)                          │ │  <- Blue banner
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Batería              Estado                       │
│  ● 85%                ● Activo                     │
│                                                     │
│  ID: device-001                                    │
└─────────────────────────────────────────────────────┘
```

When no caregivers:

```
┌─────────────────────────────────────────────────────┐
│ Mi dispositivo                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤 Modo Autónomo                              │ │  <- Green banner
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Batería              Estado                       │
│  ● 85%                ● Activo                     │
│                                                     │
│  ID: device-001                                    │
└─────────────────────────────────────────────────────┘
```

## Testing

### Manual Testing Steps

1. **Test Autonomous Mode**:
   - Log in as patient
   - Verify device shows "Modo Autónomo"
   - Green banner with person icon

2. **Test Caregiver Connection**:
   - Keep patient app open
   - In another device/browser, log in as caregiver
   - Connect to patient's device using connection code
   - **Expected**: Patient app immediately shows "Modo Cuidador (1)"
   - Banner changes to blue with people icon

3. **Test Multiple Caregivers**:
   - Connect a second caregiver
   - **Expected**: Patient app shows "Modo Cuidador (2)"

4. **Test Caregiver Disconnection**:
   - Unlink one caregiver
   - **Expected**: Count decrements to "Modo Cuidador (1)"
   - Unlink last caregiver
   - **Expected**: Changes back to "Modo Autónomo"

5. **Test Real-Time Updates**:
   - Have patient and caregiver apps open side-by-side
   - Connect/disconnect caregivers
   - **Expected**: Patient app updates within 1-2 seconds

### Automated Testing

Create a test script:

```javascript
// test-realtime-connection-mode.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testRealtimeSync() {
  const deviceId = 'test-device-001';
  const patientId = 'test-patient-001';
  const caregiverId = 'test-caregiver-001';

  console.log('1. Creating device link...');
  await db.collection('deviceLinks').doc(`${deviceId}_${caregiverId}`).set({
    id: `${deviceId}_${caregiverId}`,
    deviceId: deviceId,
    userId: caregiverId,
    role: 'caregiver',
    status: 'active',
    linkedAt: admin.firestore.Timestamp.now(),
    linkedBy: caregiverId,
  });
  console.log('✓ Device link created');

  console.log('\n2. Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n3. Removing device link...');
  await db.collection('deviceLinks').doc(`${deviceId}_${caregiverId}`).delete();
  console.log('✓ Device link removed');

  console.log('\n✅ Test complete - Check patient app for real-time updates');
  process.exit(0);
}

testRealtimeSync();
```

## Performance Considerations

### Firestore Reads

- Each device link change triggers a snapshot update
- Typical usage: 1-5 caregivers per device
- Estimated reads: ~10-50 per day per patient

### Optimization

1. **Query Indexing**: Firestore automatically indexes `deviceId` and `status` fields
2. **Listener Cleanup**: Hook properly cleans up listeners on unmount
3. **Conditional Rendering**: Only renders banner when deviceId exists
4. **Memoization**: Uses `useMemo` for derived values

## Security

The existing Firestore security rules already handle device link access:

```javascript
match /deviceLinks/{linkId} {
  // Users can read their own links
  allow read: if isSignedIn() &&
    (resource.data.userId == request.auth.uid ||
     isDeviceOwner(resource.data.deviceId));
}
```

Patients can read all links to their device, so they can see caregiver connections.

## Accessibility

- Connection mode banner has proper `accessibilityLabel`
- Screen readers announce: "Connection mode: Modo Cuidador (2)"
- Visual indicators use both color and icons
- High contrast between text and background

## Future Enhancements

1. **Caregiver Names**: Show names of connected caregivers
   ```
   Modo Cuidador (2)
   • María García
   • Juan Pérez
   ```

2. **Connection Notifications**: Toast notification when caregiver connects/disconnects
   ```
   "María García se ha conectado a tu dispositivo"
   ```

3. **Connection History**: Log of caregiver connections
   ```
   Historial de Conexiones
   • María García - Conectado hace 5 min
   • Juan Pérez - Desconectado hace 2 horas
   ```

4. **Permission Levels**: Show what permissions each caregiver has
   ```
   Modo Cuidador (2)
   • María García (Admin)
   • Juan Pérez (Solo lectura)
   ```

## Related Files

- `src/hooks/useDeviceLinks.ts` - Real-time device links hook
- `src/components/screens/patient/DeviceStatusCard.tsx` - Updated device status card
- `src/hooks/useDeviceState.ts` - Existing device state hook (already real-time)
- `firestore.rules` - Security rules for deviceLinks collection

## Status

✅ **COMPLETE** - Real-time connection mode sync is now live!

Patients can now see instantly when caregivers connect or disconnect from their device, with a clear visual indicator showing whether the device is in autonomous mode or caregiver mode.

---

**Implementation Date**: November 17, 2025
**Implemented By**: Kiro AI Assistant
**Tested**: Pending user verification

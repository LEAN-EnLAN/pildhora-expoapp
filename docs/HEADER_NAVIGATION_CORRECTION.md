# Header Navigation Correction

## Issue
The caregiver header account menu was incorrectly pointing to device management when it should provide access to the connection code flow for linking patients.

## Context

The app has **two different device-related flows**:

### 1. Device Connection Flow (Code-Based) ✅
**Purpose**: Caregivers connect to patients using a 6-digit code
**Screens**:
- `/caregiver/device-connection` - Enter connection code
- `/caregiver/device-connection-confirm` - Confirm connection

**Use Case**: Primary flow for caregivers to link with patients

### 2. Device Management Flow (ID-Based)
**Purpose**: Direct device linking by device ID (advanced/admin)
**Screen**:
- `/caregiver/add-device` - Manage devices by ID

**Use Case**: Advanced device management, troubleshooting

## Changes Made

### Updated Account Menu Options

#### iOS ActionSheet
**Before**:
```typescript
options: [
  'Cancelar',
  'Configuraciones',
  'Gestión de Dispositivos',  // Only device management
  'Cerrar Sesión',
]
```

**After**:
```typescript
options: [
  'Cancelar',
  'Configuraciones',
  'Conectar Dispositivo',      // NEW - Connection code flow
  'Gestión de Dispositivos',   // Advanced device management
  'Cerrar Sesión',
]
```

#### Android Modal
**Before**:
- Settings
- Device Management
- Logout

**After**:
- Settings
- **Connect Device** (Primary button - connection code flow)
- Device Management (Secondary - advanced)
- Logout

### Navigation Mapping

```typescript
// Updated action handler
handleAccountAction = (action: 'settings' | 'connect' | 'devices' | 'logout') => {
  if (action === 'settings') {
    router.push('/caregiver/settings');
  } else if (action === 'connect') {
    router.push('/caregiver/device-connection');  // NEW - Code entry
  } else if (action === 'devices') {
    router.push('/caregiver/add-device');         // Advanced management
  } else if (action === 'logout') {
    onLogout();
  }
}
```

## User Flow

### Primary Flow (Connection Code)
```
Caregiver Header → Account Menu → "Conectar Dispositivo"
  ↓
Enter 6-digit code
  ↓
Confirm connection
  ↓
Linked to patient
```

### Advanced Flow (Device Management)
```
Caregiver Header → Account Menu → "Gestión de Dispositivos"
  ↓
Enter device ID
  ↓
Link device directly
  ↓
Configure device settings
```

## Button Styling

### Connect Device Button (Primary)
```typescript
<Button
  variant="primary"           // Blue, prominent
  leftIcon="key-outline"      // Connection code icon
  onPress={() => handleAccountAction('connect')}
>
  Conectar Dispositivo
</Button>
```

### Device Management Button (Secondary)
```typescript
<Button
  variant="secondary"         // Gray, less prominent
  leftIcon="hardware-chip-outline"  // Device icon
  onPress={() => handleAccountAction('devices')}
>
  Gestión de Dispositivos
</Button>
```

## Accessibility

### Labels Updated
- **Connect Device**: "Opens device connection screen to enter connection code"
- **Device Management**: "Opens device management screen"

### Visual Hierarchy
1. **Primary**: Connect Device (most common action)
2. **Secondary**: Settings, Device Management
3. **Destructive**: Logout

## Testing Checklist

- [x] iOS ActionSheet shows correct options
- [x] Android Modal shows correct options
- [x] "Conectar Dispositivo" navigates to `/caregiver/device-connection`
- [x] "Gestión de Dispositivos" navigates to `/caregiver/add-device`
- [x] "Configuraciones" navigates to `/caregiver/settings`
- [x] Button styling is correct (primary vs secondary)
- [x] Icons are appropriate
- [x] Accessibility labels are descriptive
- [x] No TypeScript errors

## Related Files

### Modified
- `src/components/caregiver/CaregiverHeader.tsx`

### Related Screens
- `app/caregiver/device-connection.tsx` - Connection code entry
- `app/caregiver/device-connection-confirm.tsx` - Connection confirmation
- `app/caregiver/add-device.tsx` - Device management
- `app/caregiver/settings.tsx` - Settings

## Documentation References

- Connection code flow: `.kiro/specs/user-onboarding-device-provisioning/TASK9_COMPLETION_SUMMARY.md`
- Device management: `DEVICE_MANAGEMENT_CONSOLIDATION.md`
- Navigation: `docs/NAVIGATION_REFERENCE.md`

---

**Status**: ✅ Complete
**Date**: November 17, 2025
**Issue**: Corrected navigation to prioritize connection code flow

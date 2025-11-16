# Device Management Screen - Quick Reference

## Component Location
`app/caregiver/add-device.tsx`

## Key Features

### 1. Link New Device
```typescript
// Minimum device ID length: 5 characters
// Validates input in real-time
// Creates device document if needed
// Links to caregiver via RTDB
```

### 2. View Linked Devices
```typescript
// Shows all devices linked to caregiver
// Displays associated patient name
// Real-time device status updates
// Battery level and online/offline status
```

### 3. Device Configuration
```typescript
// Alarm mode: off, sound, led, both
// LED intensity: 0-1023
// LED color: RGB picker
// Saves to Firestore desiredConfig
```

### 4. Unlink Device
```typescript
// Confirmation dialog before unlinking
// Removes from RTDB and Firestore
// Refreshes device list automatically
```

## Data Sources

### Firestore
- `devices/{deviceId}` - Device documents with config
- `deviceLinks/{linkId}` - Device-user relationships
- `users/{userId}` - Patient information

### RTDB
- `users/{uid}/devices/{deviceId}` - Device links
- `devices/{deviceId}/state` - Real-time device state
- `devices/{deviceId}/config` - Device configuration

## Hooks Used

### useLinkedPatients
```typescript
const { patients, isLoading, error, refetch } = useLinkedPatients({
  caregiverId: userId,
  enabled: !!userId,
});
```

### useDeviceState
```typescript
const { deviceState, isLoading } = useDeviceState({
  deviceId: deviceId,
  enabled: true,
});
```

## Service Functions

### linkDeviceToUser
```typescript
await linkDeviceToUser(userId, deviceId);
// - Validates inputs
// - Updates RTDB users/{uid}/devices
// - Cloud Function mirrors to Firestore
```

### unlinkDeviceFromUser
```typescript
await unlinkDeviceFromUser(userId, deviceId);
// - Removes RTDB link
// - Cloud Function updates Firestore
```

## Component Structure

```
DeviceManagementScreen
├── CaregiverHeader
│   └── title="Gestión de Dispositivos"
│
├── Success/Error Messages
│   ├── SuccessMessage (dismissible)
│   └── ErrorMessage (dismissible)
│
├── Link New Device Section
│   ├── Section Header (icon + title)
│   ├── Description Text
│   ├── Input Field
│   │   ├── Label: "Device ID"
│   │   ├── Placeholder: "esp8266-ABC123"
│   │   ├── Validation: min 5 chars
│   │   └── Helper Text
│   └── Link Button
│       ├── Loading State
│       └── Disabled when invalid
│
└── Linked Devices Section
    ├── Section Header (icon + title)
    ├── Loading Spinner (if loading)
    ├── Empty State (if no devices)
    └── Device Cards (for each device)
        ├── Device Header
        │   ├── Device ID
        │   ├── Patient Name
        │   └── Unlink Button
        ├── Device Status
        │   ├── Online/Offline
        │   ├── Battery Level
        │   └── Current Status
        ├── Expand/Collapse Button
        └── Configuration Panel (collapsible)
            └── DeviceConfigPanel
                ├── Alarm Mode Chips
                ├── LED Intensity Slider
                ├── LED Color Picker
                └── Save Button
```

## State Management

```typescript
// Input state
const [deviceId, setDeviceId] = useState('');
const [validationError, setValidationError] = useState('');

// Operation states
const [linking, setLinking] = useState(false);
const [unlinkingDevice, setUnlinkingDevice] = useState<string | null>(null);
const [savingConfig, setSavingConfig] = useState<Record<string, boolean>>({});

// UI states
const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);

// Data from hooks
const { patients, isLoading, error, refetch } = useLinkedPatients(...);
```

## Validation Rules

### Device ID
- ✅ Required (not empty)
- ✅ Minimum 5 characters
- ✅ Alphanumeric with hyphens/underscores
- ❌ Special characters not allowed

### User Authentication
- ✅ Must be logged in
- ✅ Must have caregiver role
- ✅ Valid Firebase auth token

## Error Messages

### Validation Errors
```typescript
'El Device ID es requerido'
'El Device ID debe tener al menos 5 caracteres'
```

### Operation Errors
```typescript
'Debes iniciar sesión para vincular un dispositivo'
'No se pudo conectar a la base de datos'
'No se pudo vincular el dispositivo'
'No se pudo desvincular el dispositivo'
'No se pudo guardar la configuración'
```

### Success Messages
```typescript
'Dispositivo vinculado exitosamente'
'Dispositivo desvinculado exitosamente'
'Configuración guardada exitosamente'
```

## Styling

### Design Tokens
```typescript
colors.primary[500]    // Primary actions
colors.success[500]    // Online status
colors.warning[500]    // Low battery
colors.danger[500]     // Unlink button
colors.gray[...]       // Text hierarchy

spacing.lg             // Section padding
spacing.md             // Card padding
spacing.sm             // Element gaps

typography.fontSize.xl // Section titles
typography.fontSize.lg // Device IDs
typography.fontSize.base // Body text
```

### Touch Targets
- Minimum 44x44 points for all interactive elements
- Adequate spacing between buttons
- Clear visual feedback on press

## Accessibility

### Labels
```typescript
accessibilityLabel="Vincular dispositivo"
accessibilityLabel="Desvincular dispositivo de {patientName}"
accessibilityLabel="Mostrar configuración"
accessibilityLabel="Ocultar configuración"
```

### Roles
```typescript
accessibilityRole="button"
accessibilityRole="text"
```

## Testing

### Run Tests
```bash
node test-device-management-caregiver.js
```

### Test Coverage
- ✅ Device linking validation
- ✅ Device linking operation
- ✅ Device unlinking operation
- ✅ Configuration updates
- ✅ Error handling

## Common Issues & Solutions

### Issue: Device not appearing in list
**Solution**: Check that device has a linked patient with matching deviceId

### Issue: Configuration not saving
**Solution**: Verify Firestore permissions and Cloud Function deployment

### Issue: Real-time status not updating
**Solution**: Check RTDB connection and device state path

### Issue: Validation error persists
**Solution**: Ensure device ID is at least 5 characters and contains valid characters

## Performance Tips

1. **Minimize Re-renders**: Use useCallback for event handlers
2. **Efficient Queries**: Filter at database level, not client-side
3. **Cleanup Listeners**: Always cleanup RTDB listeners on unmount
4. **Cache Data**: Use caching for frequently accessed data
5. **Lazy Load**: Only fetch device config when panel is expanded

## Integration Checklist

- [ ] Firebase initialized
- [ ] User authenticated as caregiver
- [ ] RTDB rules deployed
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Device exists in database
- [ ] Patient linked to device
- [ ] DeviceConfigPanel component available

## Related Files

### Services
- `src/services/deviceLinking.ts`
- `src/services/firebase.ts`

### Components
- `src/components/caregiver/CaregiverHeader.tsx`
- `src/components/shared/DeviceConfigPanel.tsx`
- `src/components/ui/*`

### Hooks
- `src/hooks/useLinkedPatients.ts`
- `src/hooks/useDeviceState.ts`

### Types
- `src/types/index.ts`

## Future Enhancements

1. **Device Provisioning**: Add new device setup flow
2. **Device History**: Show device activity logs
3. **Bulk Operations**: Link/unlink multiple devices
4. **Device Diagnostics**: Enhanced troubleshooting tools
5. **Firmware Updates**: Notify about available updates
6. **Device Groups**: Organize devices by location/type
7. **Advanced Filters**: Filter devices by status, battery, etc.
8. **Export Data**: Export device configuration and history

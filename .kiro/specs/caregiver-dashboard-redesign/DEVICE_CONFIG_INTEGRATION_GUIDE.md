# DeviceConfigPanel Integration Quick Reference

## Overview

The DeviceConfigPanel component is integrated into the caregiver device management screen, allowing caregivers to configure device settings for linked patient devices.

## Component Location

```
src/components/shared/DeviceConfigPanel.tsx (Reused from patient-side)
app/caregiver/add-device.tsx (Integration point)
```

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Caregiver Action                         │
│              (Adjust alarm, LED, color)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DeviceConfigPanel Component                    │
│         • Alarm Mode Selection (Chips)                      │
│         • LED Intensity Slider (0-1023)                     │
│         • LED Color Picker (RGB)                            │
│         • Save Button                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              handleSaveConfig Function                      │
│         • Validates configuration                           │
│         • Shows loading state                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Firestore: devices/{deviceId}                       │
│         {                                                   │
│           desiredConfig: {                                  │
│             alarm_mode: 'both',                             │
│             led_intensity: 512,                             │
│             led_color_rgb: [255, 255, 255]                  │
│           },                                                │
│           updatedAt: Timestamp                              │
│         }                                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Cloud Function: onDesiredConfigUpdated              │
│         • Triggered on desiredConfig change                 │
│         • Mirrors to RTDB                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         RTDB: devices/{deviceId}/config                     │
│         {                                                   │
│           alarm_mode: 'both',                               │
│           led_intensity: 512,                               │
│           led_color_rgb: [255, 255, 255]                    │
│         }                                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Hardware Device (ESP8266)                      │
│         • Reads config from RTDB                            │
│         • Applies alarm and LED settings                    │
└─────────────────────────────────────────────────────────────┘
```

## UI Structure

```
Device Management Screen
├── Link New Device Section
│   └── Device ID Input + Link Button
│
└── Linked Devices Section
    └── Device Card (for each linked device)
        ├── Device Header
        │   ├── Device ID
        │   ├── Patient Name
        │   └── Unlink Button
        │
        ├── Device Status Section
        │   ├── Online/Offline Status
        │   ├── Battery Level
        │   └── Current Status
        │
        ├── Expand/Collapse Button
        │   └── "Mostrar configuración" / "Ocultar configuración"
        │
        └── Collapsible Config Section
            └── DeviceConfigPanelWrapper
                └── DeviceConfigPanel
                    ├── Alarm Mode Chips
                    ├── LED Intensity Slider
                    ├── LED Color Picker
                    └── Save Button
```

## Props Interface

### DeviceConfigPanel

```typescript
interface DeviceConfigPanelProps {
  deviceId: string;
  initialAlarmMode?: 'off' | 'sound' | 'led' | 'both';
  initialLedIntensity?: number; // 0-1023
  initialLedColor?: { r: number; g: number; b: number }; // 0-255 each
  onSave: (config: {
    alarmMode: 'off' | 'sound' | 'led' | 'both';
    ledIntensity: number;
    ledColor: { r: number; g: number; b: number };
  }) => void;
  onCancel?: () => void;
  loading?: boolean;
  style?: any;
}
```

### DeviceConfigPanelWrapper

```typescript
interface DeviceConfigPanelWrapperProps {
  deviceId: string;
  onSave: (config: any) => void;
  loading: boolean;
}
```

## Configuration Object

### Input Format (DeviceConfigPanel)

```typescript
{
  alarmMode: 'off' | 'sound' | 'led' | 'both',
  ledIntensity: number, // 0-1023
  ledColor: {
    r: number, // 0-255
    g: number, // 0-255
    b: number  // 0-255
  }
}
```

### Firestore Format (desiredConfig)

```typescript
{
  alarm_mode: 'off' | 'sound' | 'led' | 'both',
  led_intensity: number, // 0-1023
  led_color_rgb: [number, number, number] // [r, g, b]
}
```

### RTDB Format (config)

```typescript
{
  alarm_mode: 'off' | 'sound' | 'led' | 'both',
  led_intensity: number, // 0-1023
  led_color_rgb: [number, number, number] // [r, g, b]
}
```

## Default Values

```typescript
{
  alarmMode: 'both',
  ledIntensity: 512,
  ledColor: { r: 255, g: 255, b: 255 }
}
```

## State Management

### Component States

```typescript
// Expand/collapse state
const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());

// Saving state per device
const [savingConfig, setSavingConfig] = useState<Record<string, boolean>>({});

// Feedback messages
const [successMessage, setSuccessMessage] = useState<string | null>(null);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

### Wrapper States

```typescript
// Configuration state
const [config, setConfig] = useState<{
  alarmMode: 'off' | 'sound' | 'led' | 'both';
  ledIntensity: number;
  ledColor: { r: number; g: number; b: number };
} | null>(null);

// Loading state
const [loadingConfig, setLoadingConfig] = useState(true);
```

## Key Functions

### toggleDeviceExpanded

```typescript
const toggleDeviceExpanded = useCallback((deviceId: string) => {
  setExpandedDevices((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(deviceId)) {
      newSet.delete(deviceId);
    } else {
      newSet.add(deviceId);
    }
    return newSet;
  });
}, []);
```

### handleSaveConfig

```typescript
const handleSaveConfig = useCallback(async (
  deviceId: string,
  config: {
    alarmMode: 'off' | 'sound' | 'led' | 'both';
    ledIntensity: number;
    ledColor: { r: number; g: number; b: number };
  }
) => {
  setSavingConfig(prev => ({ ...prev, [deviceId]: true }));
  
  try {
    const db = await getDbInstance();
    const payload = {
      led_intensity: config.ledIntensity,
      led_color_rgb: [config.ledColor.r, config.ledColor.g, config.ledColor.b],
      alarm_mode: config.alarmMode,
    };
    
    await setDoc(
      doc(db, 'devices', deviceId),
      { desiredConfig: payload, updatedAt: serverTimestamp() },
      { merge: true }
    );
    
    setSuccessMessage('Configuración guardada exitosamente');
  } catch (error: any) {
    setErrorMessage(error.message || 'No se pudo guardar la configuración');
  } finally {
    setSavingConfig(prev => ({ ...prev, [deviceId]: false }));
  }
}, []);
```

### fetchConfig (in Wrapper)

```typescript
useEffect(() => {
  const fetchConfig = async () => {
    try {
      const db = await getDbInstance();
      const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
      
      if (deviceDoc.exists()) {
        const data = deviceDoc.data();
        const desired = data?.desiredConfig || {};
        
        setConfig({
          alarmMode: desired?.alarm_mode ?? 'both',
          ledIntensity: desired?.led_intensity ?? 512,
          ledColor: {
            r: desired?.led_color_rgb?.[0] ?? 255,
            g: desired?.led_color_rgb?.[1] ?? 255,
            b: desired?.led_color_rgb?.[2] ?? 255,
          },
        });
      } else {
        // Default config
        setConfig({
          alarmMode: 'both',
          ledIntensity: 512,
          ledColor: { r: 255, g: 255, b: 255 },
        });
      }
    } catch (error) {
      // Set default config on error
      setConfig({
        alarmMode: 'both',
        ledIntensity: 512,
        ledColor: { r: 255, g: 255, b: 255 },
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  fetchConfig();
}, [deviceId]);
```

## Error Handling

### Database Connection Errors

```typescript
if (!db) {
  throw new Error('No se pudo conectar a la base de datos');
}
```

### Configuration Fetch Errors

```typescript
catch (error) {
  console.error('[DeviceConfigPanelWrapper] Error fetching config:', error);
  // Set default config on error
  setConfig({ alarmMode: 'both', ledIntensity: 512, ledColor: { r: 255, g: 255, b: 255 } });
}
```

### Configuration Save Errors

```typescript
catch (error: any) {
  console.error('[DeviceManagement] Error saving config:', error);
  setErrorMessage(error.message || 'No se pudo guardar la configuración');
}
```

## User Feedback

### Success Message

```typescript
setSuccessMessage('Configuración guardada exitosamente');
```

### Error Message

```typescript
setErrorMessage(error.message || 'No se pudo guardar la configuración');
```

### Loading States

```typescript
// Initial config loading
if (loadingConfig || !config) {
  return <LoadingSpinner size="sm" text="Cargando configuración..." />;
}

// Saving config
<Button loading={isSaving} disabled={isSaving}>
  Guardar cambios
</Button>
```

## Accessibility

### Labels

```typescript
accessibilityLabel={isExpanded ? 'Ocultar configuración' : 'Mostrar configuración'}
accessibilityRole="button"
```

### Touch Targets

All interactive elements meet minimum 44x44 points requirement.

## Testing

### Test File

`test-device-config-integration.js`

### Run Tests

```bash
node test-device-config-integration.js
```

### Expected Output

```
✅ ALL TESTS PASSED
🎉 Task 13.3 implementation is complete and verified!
```

## Common Issues

### Issue: Config not loading

**Solution:** Check Firestore permissions and device document exists

### Issue: Config not saving

**Solution:** Verify user authentication and Firestore write permissions

### Issue: RTDB not updating

**Solution:** Check Cloud Function deployment and logs

### Issue: Default values not showing

**Solution:** Verify default config object in wrapper component

## Best Practices

1. **Always fetch config before rendering panel**
2. **Use default values when config doesn't exist**
3. **Show loading states during fetch and save**
4. **Provide clear success/error feedback**
5. **Handle errors gracefully with fallbacks**
6. **Clean up state on component unmount**
7. **Use memoized callbacks for performance**
8. **Maintain per-device state for multiple devices**

## Related Files

- `src/components/shared/DeviceConfigPanel.tsx` - Reusable config panel
- `app/caregiver/add-device.tsx` - Integration point
- `functions/src/index.ts` - Cloud Function for RTDB mirroring
- `src/services/deviceConfig.ts` - Device config service (legacy)
- `test-device-config-integration.js` - Integration tests

## Requirements Met

✅ **Requirement 11.1:** Real-Time Device Status Integration  
✅ **Requirement 11.2:** Device Configuration

## Next Steps

Continue with Task 13.4: Write unit tests for device management

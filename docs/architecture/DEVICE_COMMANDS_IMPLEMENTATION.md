# Device Commands Implementation

## Overview

The `deviceCommands.ts` service enables sending commands to ESP8266 smart pillbox devices via Firebase Realtime Database (RTDB).

## Commands Available

| Command | Type | Description |
|---------|------|-------------|
| `topo` | boolean | Trigger medication dispensing sequence |
| `buzzer` | boolean | Activate/deactivate buzzer alarm |
| `led` | boolean | Control LED on/off state |
| `ledColor` | string | Set LED color (format: "R,G,B") |
| `reboot` | boolean | Reboot the device |

## RTDB Path

Commands are written to: `/devices/{deviceId}/commands`

## Backend Updates

### RTDB Security Rules (database.rules.json)

Updated rules to:
- Require authentication for writing commands
- Validate command data types and formats
- Add validation for `ledColor` format (R,G,B pattern)
- Add validation for device state fields
- Add validation for device config fields
- Add `commandLogs` path for audit logging

### Validation Rules

```json
"commands": {
  "topo": { ".validate": "newData.isBoolean()" },
  "buzzer": { ".validate": "newData.isBoolean()" },
  "led": { ".validate": "newData.isBoolean()" },
  "ledColor": { ".validate": "newData.isString() && newData.val().matches(/^\\d{1,3},\\d{1,3},\\d{1,3}$/)" },
  "reboot": { ".validate": "newData.isBoolean()" }
}
```

## Usage Examples

```typescript
import { triggerTopo, triggerBuzzer, setLedColor, rebootDevice } from './services/deviceCommands';

// Trigger medication dispensing
await triggerTopo('device-123');

// Activate buzzer
await triggerBuzzer('device-123', true);

// Set LED to red
await setLedColor('device-123', 255, 0, 0);

// Reboot device
await rebootDevice('device-123');
```

## Deployment

```bash
firebase deploy --only database
```

## Security

- All command writes require authentication
- Device reads commands via polling (no auth required for device)
- State updates from device allowed without auth (device writes)
- Config changes require authentication

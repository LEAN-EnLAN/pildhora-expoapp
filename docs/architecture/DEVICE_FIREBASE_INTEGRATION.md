# ESP8266 Firebase Integration Guide

## Overview

The smart pillbox (ESP8266) communicates with the Pildhora app via Firebase Realtime Database (RTDB). The device polls for commands and updates its state.

## Firebase Configuration

```
Host: devices-m1947.firebaseio.com
Device Path: /devices/{DEVICE_ID}/
```

## Data Structure

```
/devices/{DEVICE_ID}/
├── commands/           # Commands from app to device
│   ├── topo: boolean   # Trigger medication dispensing
│   ├── buzzer: boolean # Activate buzzer alarm
│   ├── led: boolean    # Turn on LED
│   ├── ledColor: "R,G,B" # LED color (e.g., "255,0,0")
│   └── reboot: boolean # Reboot device
├── state/              # Device state (updated by device)
│   ├── online: boolean
│   ├── lastSeen: number (timestamp)
│   ├── ip: string
│   └── firmware: string
├── config/             # Device configuration
│   ├── alarm_mode: string
│   ├── led_intensity: number
│   └── wifi_ssid: string
└── ownerUserId: string # Owner's Firebase Auth UID
```

## Commands

### TOPO (Medication Dispensing)
Triggers the full medication dispensing sequence:
1. Red LED + buzzer alarm until button pressed
2. Servo rotates to dispense pill
3. Orange LED until button pressed (confirm pill taken)
4. Green LED for 5 seconds (success)


### From App (TypeScript)
```typescript
import { triggerTopo, triggerBuzzer, setLedColor } from '@/services/deviceCommands';

// Dispense medication
await triggerTopo('TEST-DEVICE-001');

// Sound alarm
await triggerBuzzer('TEST-DEVICE-001');

// Set LED to red
await setLedColor('TEST-DEVICE-001', 255, 0, 0);
```

### From Command Line
```bash
# Send TOPO command
node test-device-commands.js topo

# Send buzzer command
node test-device-commands.js buzzer

# Set LED color (green)
node test-device-commands.js led 0,255,0

# Check device status
node test-device-commands.js status

# Clear all commands
node test-device-commands.js clear
```

## Firmware Setup

1. Open `hardware/esp8266_firmware/esp8266_firmware.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   #define WIFI_SSID     "YOUR_WIFI_SSID"
   #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
   ```
3. Verify Firebase host matches your RTDB:
   ```cpp
   #define FIREBASE_HOST "devices-m1947.firebaseio.com"
   ```
4. Set your device ID:
   ```cpp
   String DEVICE_ID = "TEST-DEVICE-001";
   ```
5. Upload to ESP8266

## Polling Behavior

- Commands polled every 2 seconds
- State heartbeat sent every 30 seconds
- Device auto-resets commands after execution

## Troubleshooting

### Device not responding to commands
1. Check Serial Monitor for Firebase connection logs
2. Verify WiFi connection
3. Confirm device ID matches Firebase path
4. Check Firebase security rules allow read/write

### Commands not resetting
- Verify Firebase secret is valid
- Check RTDB rules allow writes to `/devices/{deviceId}/commands`

## Security Rules (database.rules.json)

```json
{
  "rules": {
    "devices": {
      "$deviceId": {
        "commands": { ".read": true, ".write": true },
        "state": { ".read": true, ".write": true },
        "config": { ".read": "auth != null", ".write": "auth != null" }
      }
    }
  }
}
```

Deploy rules: `firebase deploy --only database`

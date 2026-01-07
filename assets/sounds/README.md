# Sound Assets

This folder contains sound files for the Pildhora app.

## Required Files

### alarm.mp3
The alarm sound that plays when a topo (medication dispensing) event is triggered.

**Requirements:**
- Format: MP3
- Duration: 2-5 seconds (will loop)
- Volume: Normalized to -3dB
- Style: Alert/notification sound, not too harsh for elderly users

**To add the alarm sound:**
1. Place your `alarm.mp3` file in this folder
2. The app will automatically use it for topo alarms

**If no sound file is present:**
- The app will fall back to vibration-only alerts
- A console warning will be logged

## Audio Setup

To enable audio playback, ensure `expo-av` is installed:

```bash
npx expo install expo-av
```

Then uncomment the Audio import and playback code in:
`src/components/shared/TopoAlarmOverlay.tsx`

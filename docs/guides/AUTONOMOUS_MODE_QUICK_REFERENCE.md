# Autonomous Mode - Quick Reference

## 🎯 What It Does

Allows patients to control whether their medication data is shared with caregivers.

## 🔄 Two Modes

| Mode | Icon | Data Sharing | Use Case |
|------|------|--------------|----------|
| **Modo Supervisado** | 👁️ | Full sharing | Normal monitoring by caregivers |
| **Modo Autónomo** | 🚫 | No new data shared | Privacy when needed |

## 📱 Patient Actions

### Enable Autonomous Mode
1. Open **Device Settings** (Gestión de Dispositivo)
2. Find the toggle switch
3. Tap to enable (switch turns orange)
4. Confirm in dialog
5. Done! ✅

### Disable Autonomous Mode
1. Open **Device Settings**
2. Tap the toggle switch (currently orange)
3. Confirm in dialog
4. Done! Data sharing resumes ✅

## 👀 Caregiver View

### When Patient is in Autonomous Mode
- 🟠 Orange banner appears: "Modo autónomo activado"
- 📊 No new events visible
- 📜 Historical events still accessible
- 🔌 Device status still visible

### When Patient is in Supervised Mode
- ✅ All data visible
- 📊 Real-time event updates
- 📜 Full history access
- 🔌 Device status visible

## 🔧 Technical Quick Facts

```typescript
// Check if patient is in autonomous mode
const isAutonomous = await isAutonomousModeEnabled(patientId);

// Set autonomous mode
await setAutonomousMode(patientId, true);  // Enable
await setAutonomousMode(patientId, false); // Disable

// React hook for real-time monitoring
const { isAutonomous, isLoading } = usePatientAutonomousMode(patientId);
```

## 📊 Data Flow

```
Supervised Mode:  Patient → Firestore → Caregiver ✅
Autonomous Mode:  Patient → Local Only 🚫 Caregiver
```

## 🎨 Visual Indicators

| Element | Supervised | Autonomous |
|---------|-----------|------------|
| Icon | 👁️ eye | 🚫 eye-off |
| Color | Blue | Orange |
| Switch | OFF (gray) | ON (orange) |
| Banner | None | Orange warning |

## ⚡ Key Points

✅ **Instant Effect** - Changes apply immediately
✅ **Reversible** - Can toggle on/off anytime
✅ **Historical Data** - Past events always visible to caregivers
✅ **Local Tracking** - Patient still tracks medications locally
✅ **No Unlinking** - Caregivers stay connected, just can't see new data

## 🔒 Security

- ✅ Only patient can change their own mode
- ✅ Authentication required
- ✅ Caregivers cannot override
- ✅ Secure by default (supervised mode)

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/services/autonomousMode.ts` | Core service |
| `src/hooks/usePatientAutonomousMode.ts` | React hook |
| `src/components/caregiver/AutonomousModeBanner.tsx` | Banner UI |
| `app/patient/device-settings.tsx` | Patient toggle |
| `app/caregiver/dashboard.tsx` | Caregiver view |

## 🧪 Testing

```bash
# Run test script
node test-autonomous-mode.js

# Manual test
1. Sign in as patient
2. Toggle autonomous mode
3. Sign in as caregiver
4. Verify banner appears
5. Check historical events visible
6. Verify no new events appear
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Toggle not working | Check Firebase auth |
| Banner not showing | Verify patient ID correct |
| Events still syncing | Check medicationEventService logs |
| Mode not persisting | Check Firestore permissions |

## 📚 Full Documentation

- `AUTONOMOUS_MODE_IMPLEMENTATION.md` - Complete technical details
- `AUTONOMOUS_MODE_VISUAL_GUIDE.md` - UI mockups and flows
- `AUTONOMOUS_MODE_SUMMARY.md` - Feature overview

---

**Quick Start**: Patient opens Device Settings → Toggle switch → Confirm → Done! 🎉

# PatientSelector Visual Guide

## Component Overview

The PatientSelector component provides a horizontal scrollable list of patient chips that allows caregivers to switch between multiple patients they manage.

## Visual States

### 1. Multiple Patients (Normal State)

```
┌─────────────────────────────────────────────────────────┐
│ Pacientes                                               │
│                                                         │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│ │ John Doe   ● │  │ Jane Smith ● │  │ Bob Wilson ● │  │
│ │ En línea     │  │ Desconectado │  │ En línea     │  │
│ │          ✓   │  │              │  │              │  │
│ └──────────────┘  └──────────────┘  └──────────────┘  │
│   (Selected)        (Unselected)      (Unselected)     │
└─────────────────────────────────────────────────────────┘
```

**Visual Characteristics:**
- **Selected Chip**: Blue background, blue border, checkmark icon
- **Unselected Chip**: Gray background, gray border, no checkmark
- **Status Dot**: Green (online) or Gray (offline)
- **Horizontal Scroll**: Swipe left/right to see more patients

### 2. Single Patient (Auto-Hidden)

```
Component returns null - not displayed
```

**Behavior:**
- When only one patient exists, the selector is hidden
- No need to switch between patients
- Reduces UI clutter

### 3. Empty State

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    👥                                   │
│                                                         │
│          No hay pacientes vinculados                    │
│                                                         │
│   Vincula un dispositivo para comenzar a               │
│          gestionar pacientes                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Visual Characteristics:**
- Large icon (people outline)
- Title text
- Descriptive message
- Centered layout

### 4. Loading State

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ⟳  Cargando pacientes...                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Visual Characteristics:**
- Activity indicator (spinner)
- Loading text
- Centered layout

## Color Scheme

### Selected Chip
- **Background**: `colors.primary[50]` (#E6F0FF)
- **Border**: `colors.primary[500]` (#007AFF)
- **Text**: `colors.primary[700]` (#0052A3)
- **Shadow**: `shadows.md` (elevated)

### Unselected Chip
- **Background**: `colors.gray[50]` (#F9FAFB)
- **Border**: `colors.gray[200]` (#E5E7EB)
- **Text**: `colors.gray[900]` (#111827)
- **Shadow**: `shadows.sm` (subtle)

### Device Status Indicators
- **Online**: `colors.success` (#34C759) - Green dot
- **Offline**: `colors.gray[400]` (#9CA3AF) - Gray dot
- **No Device**: `colors.gray[400]` (#9CA3AF) - Gray dot

## Typography

### Label
- **Font Size**: `typography.fontSize.sm` (14px)
- **Font Weight**: `typography.fontWeight.semibold` (600)
- **Color**: `colors.gray[700]`

### Patient Name
- **Font Size**: `typography.fontSize.base` (16px)
- **Font Weight**: `typography.fontWeight.semibold` (600)
- **Color**: `colors.gray[900]` (unselected) / `colors.primary[700]` (selected)

### Status Text
- **Font Size**: `typography.fontSize.xs` (12px)
- **Font Weight**: `typography.fontWeight.medium` (500)
- **Color**: `colors.gray[600]` (unselected) / `colors.primary[600]` (selected)

## Spacing

### Container
- **Padding Vertical**: `spacing.md` (12px)
- **Padding Horizontal**: `spacing.lg` (16px)

### Chips
- **Padding Horizontal**: `spacing.md` (12px)
- **Padding Vertical**: `spacing.sm` (8px)
- **Margin Right**: `spacing.md` (12px)
- **Gap Between Elements**: `spacing.xs` (4px)

### Chip Dimensions
- **Min Width**: 160px
- **Max Width**: 200px
- **Border Radius**: `borderRadius.lg` (16px)
- **Border Width**: 2px

## Animations

### 1. Fade In (Component Mount)
```typescript
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
})
```
- **Duration**: 300ms
- **Effect**: Opacity 0 → 1

### 2. Press Feedback (Chip Press)
```typescript
// Press In
Animated.spring(scaleAnim, {
  toValue: 0.95,
  useNativeDriver: true,
  damping: 15,
  stiffness: 150,
})

// Press Out
Animated.spring(scaleAnim, {
  toValue: 1,
  useNativeDriver: true,
  damping: 15,
  stiffness: 150,
})
```
- **Effect**: Scale 1.0 → 0.95 → 1.0
- **Type**: Spring animation
- **Damping**: 15
- **Stiffness**: 150

## Interaction Flow

### User Taps Patient Chip

```
1. User taps chip
   ↓
2. Scale animation (1.0 → 0.95)
   ↓
3. User releases
   ↓
4. Scale animation (0.95 → 1.0)
   ↓
5. Check if already selected
   ↓
6. If not selected:
   - Save to AsyncStorage
   - Call onSelectPatient callback
   - Call onRefresh callback (if provided)
   ↓
7. Visual update:
   - Previous chip: blue → gray
   - New chip: gray → blue
   - Checkmark appears on new chip
```

## Device Status Logic

### Status Dot Color
```typescript
if (!patient.deviceId || !patient.deviceState) {
  return colors.gray[400]; // No device or unknown state
}

return patient.deviceState.is_online 
  ? colors.success    // Green - Online
  : colors.gray[400]; // Gray - Offline
```

### Status Text
```typescript
if (!patient.deviceId) {
  return 'Sin dispositivo';
}

if (!patient.deviceState) {
  return 'Estado desconocido';
}

return patient.deviceState.is_online 
  ? 'En línea' 
  : 'Desconectado';
```

## Accessibility

### Patient Chip
```typescript
accessibilityRole="button"
accessibilityLabel="Patient John Doe"
accessibilityHint="Currently selected patient John Doe. Device status: En línea"
accessibilityState={{ selected: true }}
```

### ScrollView
```typescript
accessibilityLabel="Patient selector"
accessibilityHint="Scroll horizontally to view and select patients"
```

### Status Dot
```typescript
accessibilityLabel="Device status: En línea"
```

## Integration Example

### Basic Usage
```typescript
import { PatientSelector } from '@/components/caregiver';

function Dashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>();
  const [patients, setPatients] = useState<PatientWithDevice[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      caregiverId: 'caregiver-1',
      deviceId: 'device-1',
      createdAt: new Date(),
      deviceState: {
        is_online: true,
        battery_level: 85,
        current_status: 'PENDING',
      },
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      caregiverId: 'caregiver-1',
      deviceId: 'device-2',
      createdAt: new Date(),
      deviceState: {
        is_online: false,
        battery_level: 45,
        current_status: 'PENDING',
      },
    },
  ]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    console.log('Selected patient:', patientId);
  };

  const handleRefresh = () => {
    console.log('Refreshing data for patient:', selectedPatientId);
    // Fetch new data for selected patient
  };

  return (
    <View>
      <CaregiverHeader caregiverName="Dr. Smith" />
      
      <PatientSelector
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        onRefresh={handleRefresh}
        loading={false}
      />
      
      {/* Rest of dashboard content */}
    </View>
  );
}
```

## Responsive Behavior

### Small Screens (< 375px width)
- Chips maintain min-width of 160px
- Horizontal scroll enabled
- 2-3 chips visible at once

### Medium Screens (375px - 768px width)
- Chips expand up to max-width of 200px
- 3-4 chips visible at once
- Comfortable spacing

### Large Screens (> 768px width)
- Chips at max-width of 200px
- 4+ chips visible at once
- May not need to scroll

## Edge Cases

### No Patients
- Shows empty state with icon and message
- Guides user to link a device

### Single Patient
- Component returns null (hidden)
- No selector needed

### Saved Patient Not Found
- Selects first patient in list
- Logs warning to console

### AsyncStorage Error
- Falls back to first patient
- Logs error to console
- Continues to function

### No Selected Patient
- Automatically selects first patient
- Saves selection to AsyncStorage

## Performance Notes

1. **Native Driver**: All animations use native driver for 60 FPS
2. **Memoization**: Event handlers use useCallback
3. **Conditional Rendering**: Hidden for single patient
4. **Efficient Updates**: Only re-renders on prop changes
5. **Async Operations**: Don't block UI thread

## Testing Checklist

- [ ] Multiple patients display correctly
- [ ] Selected state highlights properly
- [ ] Device status indicators show correct colors
- [ ] Tapping chip changes selection
- [ ] Selection persists across app restarts
- [ ] Empty state displays when no patients
- [ ] Loading state displays during fetch
- [ ] Single patient hides component
- [ ] Animations are smooth
- [ ] Accessibility labels work with screen reader
- [ ] Horizontal scrolling works
- [ ] Press feedback animations work
- [ ] Error handling works (AsyncStorage failures)

## Common Issues & Solutions

### Issue: Selection not persisting
**Solution**: Check AsyncStorage permissions and error logs

### Issue: Device status not updating
**Solution**: Ensure deviceState is passed in PatientWithDevice

### Issue: Animations stuttering
**Solution**: Verify useNativeDriver is true

### Issue: Component not hiding for single patient
**Solution**: Check patients.length === 1 condition

### Issue: Empty state not showing
**Solution**: Verify loading is false and patients.length === 0

## Next Steps

After implementing PatientSelector, integrate it into:
1. Dashboard screen (Task 8)
2. Connect to real patient data from Firestore
3. Wire up device state from RTDB
4. Test with multiple caregivers and patients

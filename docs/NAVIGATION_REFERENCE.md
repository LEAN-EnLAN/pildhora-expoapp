# Navigation Reference Guide

## Overview
This document provides a complete reference for the app's navigation structure, routing, and icon system.

## Navigation Architecture

### Root Stack Navigator
The app uses Expo Router with a file-based routing system.

```
app/
├── _layout.tsx          # Root stack navigator
├── index.tsx            # Welcome/splash screen
├── auth/
│   ├── login.tsx        # Login screen
│   └── signup.tsx       # Signup screen
├── patient/
│   └── _layout.tsx      # Patient stack navigator
└── caregiver/
    └── _layout.tsx      # Caregiver tab navigator
```

## Patient Navigation

### Patient Stack Routes
All patient routes use a stack navigator with no visible headers (custom headers in screens).

| Route | Screen | Description |
|-------|--------|-------------|
| `/patient/home` | PatientHome | Main dashboard with adherence, upcoming doses, device status |
| `/patient/medications` | MedicationsIndex | List of all medications |
| `/patient/medications/add` | AddMedication | Medication wizard for adding new medications |
| `/patient/medications/[id]` | MedicationDetail | View/edit medication details |
| `/patient/history` | HistoryScreen | Dose history and events |
| `/patient/settings` | PatientSettings | App settings and preferences |
| `/patient/device-settings` | DeviceSettings | Device management and caregiver connections |
| `/patient/device-provisioning` | DeviceProvisioning | Device setup wizard |
| `/patient/edit-profile` | EditProfile | Edit user profile |

### Patient Quick Actions Icons
Used in the home screen quick action cards:

```tsx
// History
<Ionicons name="time-outline" size={24} color={colors.primary[500]} />

// Medications (Autonomous Mode only)
<Ionicons name="medical-outline" size={24} color={colors.primary[500]} />

// Device
<Ionicons name="hardware-chip-outline" size={24} color={colors.primary[500]} />
```

## Caregiver Navigation

### Caregiver Tab Navigator
The caregiver interface uses a bottom tab navigator with 4 main tabs.

| Route | Tab | Icon | Description |
|-------|-----|------|-------------|
| `/caregiver/dashboard` | Inicio | `home` / `home-outline` | Main dashboard with patient selector and quick actions |
| `/caregiver/tasks` | Tareas | `checkbox` / `checkbox-outline` | Task management and reminders |
| `/caregiver/device-connection` | Pacientes | `people` / `people-outline` | Patient management and linking |
| `/caregiver/events` | Eventos | `notifications` / `notifications-outline` | Event registry and history |

### Caregiver Modal Routes
These routes are hidden from the tab bar (href: null):

| Route | Screen | Description |
|-------|--------|-------------|
| `/caregiver/patients` | PatientsScreen | CRUD interface for managing patients |
| `/caregiver/medications` | MedicationsManagement | Medication management (accessed via patients screen) |
| `/caregiver/add-device` | DeviceManagement | Device linking and management |
| `/caregiver/device-connection-confirm` | DeviceConnectionConfirm | Confirm device connection |
| `/caregiver/settings` | CaregiverSettings | App settings |

### Caregiver Nested Routes

#### Medications
```
/caregiver/medications/
├── index.tsx                           # Patient selector
└── [patientId]/
    ├── index.tsx                       # Patient's medication list
    ├── add.tsx                         # Add medication for patient
    └── [id].tsx                        # Edit medication
```

#### Events
```
/caregiver/events/
├── index.tsx                           # Event registry
└── [id].tsx                            # Event detail view
```

## Icon System

### Icon Standards

#### Ionicons Naming Convention
- **Outline variant**: Used for inactive/secondary states (e.g., `home-outline`)
- **Solid variant**: Used for active/primary states (e.g., `home`)
- **Consistent sizing**:
  - Navigation icons: 24px
  - Inline icons: 16-20px
  - Empty state icons: 48-64px
  - Header icons: 28px

#### Tab Bar Icons
```tsx
// Standard tab bar icon implementation
tabBarIcon: ({ color, size, focused }) => (
  <Ionicons 
    name={focused ? 'icon-name' : 'icon-name-outline'} 
    size={size} 
    color={color} 
  />
)
```

### Complete Icon Reference

#### Navigation Icons
| Context | Icon | Usage |
|---------|------|-------|
| Home/Dashboard | `home` / `home-outline` | Main screen navigation |
| Tasks | `checkbox` / `checkbox-outline` | Task management |
| Medications | `medkit` / `medkit-outline` | Medication management |
| Events/Notifications | `notifications` / `notifications-outline` | Event registry |
| History | `time-outline` | Dose history |
| Device | `hardware-chip-outline` | Device management |
| Settings | `settings-outline` | App settings |

#### Action Icons
| Action | Icon | Usage |
|--------|------|-------|
| Add | `add` | Create new item |
| Edit | `pencil-outline` | Edit existing item |
| Delete | `trash-outline` | Delete item |
| Back | `chevron-back` / `arrow-back` | Navigate back |
| Close | `close` | Close modal/dialog |
| Share | `share-outline` | Share content |
| Emergency | `alert-circle` | Emergency call |
| Account | `person-circle-outline` | User account menu |

#### Status Icons
| Status | Icon | Color | Usage |
|--------|------|-------|-------|
| Success | `checkmark-circle-outline` | `colors.success` | Completed state |
| Error | `alert-circle-outline` | `colors.error[500]` | Error state |
| Warning | `warning-outline` | `colors.warning` | Warning state |
| Info | `information-circle-outline` | `colors.info` | Information |
| Online | `shield-checkmark` | `colors.success` | Device online |
| Offline | `cloud-offline-outline` | `colors.gray[400]` | Device offline |

#### Content Icons
| Content | Icon | Usage |
|---------|------|-------|
| Time/Schedule | `time-outline` / `alarm-outline` | Time-related content |
| Calendar | `calendar-outline` | Date selection |
| Medical | `medical-outline` | Medical content |
| Link | `link-outline` | Connection/linking |
| Key | `key` / `key-outline` | Access codes |
| People | `people-outline` / `person` | User/caregiver info |

## Accessibility

### Tab Bar Accessibility
All tab bar items include:
- `tabBarAccessibilityLabel`: Descriptive label
- `tabBarAccessibilityHint`: Action description (optional)

Example:
```tsx
tabBarAccessibilityLabel: 'Inicio - Tablero principal del cuidador'
```

### Icon Button Accessibility
All icon buttons should include:
```tsx
<TouchableOpacity
  accessibilityLabel="Descriptive label"
  accessibilityHint="What happens when pressed"
  accessibilityRole="button"
>
  <Ionicons name="icon-name" size={24} color={color} />
</TouchableOpacity>
```

## Navigation Patterns

### Deep Linking
The app supports deep linking for all routes:
```
pildhora://patient/medications/123
pildhora://caregiver/events/456
```

### Navigation Guards
Both patient and caregiver layouts include role-based guards:
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (!isAuthenticated || user?.role !== 'patient') {
      router.replace('/');
    }
  }, 300);
  return () => clearTimeout(timer);
}, [isAuthenticated, user?.role]);
```

### Modal Presentation
Modal screens are hidden from tab bars using:
```tsx
<Tabs.Screen 
  name="modal-screen" 
  options={{ 
    href: null,  // Hides from tab bar
    title: 'Modal Title',
  }} 
/>
```

## Best Practices

### 1. Icon Consistency
- Always use outline variants for inactive states
- Use solid variants for active/focused states
- Maintain consistent sizing across similar contexts

### 2. Navigation Flow
- Use stack navigation for hierarchical flows
- Use tab navigation for peer-level sections
- Use modals for temporary, focused tasks

### 3. Accessibility
- Always provide accessibility labels
- Use semantic role attributes
- Ensure sufficient color contrast (WCAG AA)

### 4. Performance
- Lazy load screens when possible
- Use `React.memo` for icon components if needed
- Optimize tab bar rendering with `shouldComponentUpdate`

## Testing Checklist

- [ ] All routes are accessible
- [ ] Tab bar icons display correctly in active/inactive states
- [ ] Navigation guards work properly
- [ ] Deep links resolve correctly
- [ ] Accessibility labels are present and accurate
- [ ] Back navigation works as expected
- [ ] Modal screens present and dismiss correctly
- [ ] Icons are visually consistent
- [ ] No console warnings or errors
- [ ] Smooth animations and transitions

## Migration Notes

### Removed Routes (v2.0)
- `/device/provision/*` - Replaced by `/patient/device-provisioning` wizard
- `/app/ui/textfields.tsx` - Development testing screen removed

### Updated Routes (v2.0)
- Patient layout now explicitly registers all screens
- Caregiver layout includes all modal screens
- Root layout includes patient and caregiver group screens

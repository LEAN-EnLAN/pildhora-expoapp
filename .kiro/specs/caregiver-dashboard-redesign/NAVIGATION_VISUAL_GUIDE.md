# Navigation and Routing Visual Guide

## Tab Navigation Layout

```
┌─────────────────────────────────────────────────────────┐
│                   CaregiverHeader                       │
│  PILDHORA    [Screen Title]    [Emergency] [Account]   │
└─────────────────────────────────────────────────────────┘
│                                                         │
│                   Screen Content                        │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
┌─────────────────────────────────────────────────────────┐
│                      Tab Bar                            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │ 🏠   │  │ ☑️   │  │ 💊   │  │ 🔔   │               │
│  │Inicio│  │Tareas│  │Medic.│  │Event.│               │
│  └──────┘  └──────┘  └──────┘  └──────┘               │
└─────────────────────────────────────────────────────────┘
```

## Tab States

### Active Tab (Dashboard)
```
┌──────────────┐
│   🏠 (filled) │  ← Filled icon
│   Inicio      │  ← Primary color (#007AFF)
└──────────────┘
```

### Inactive Tab (Tasks)
```
┌──────────────┐
│  ☑️ (outline) │  ← Outline icon
│   Tareas      │  ← Gray color (#6B7280)
└──────────────┘
```

## Tab Bar Styling

### iOS (85px height)
```
┌─────────────────────────────────────────┐
│  Tabs with icons and labels             │
│  paddingTop: 8px                        │
│  paddingBottom: 16px (safe area)        │
│  ─────────────────────────────────────  │
│  Home indicator space                   │
└─────────────────────────────────────────┘
```

### Android (65px height)
```
┌─────────────────────────────────────────┐
│  Tabs with icons and labels             │
│  paddingTop: 8px                        │
│  paddingBottom: 8px                     │
└─────────────────────────────────────────┘
```

## Modal Screen Behavior

### Normal Screen (Tabs Visible)
```
┌─────────────────────────────────────────┐
│         CaregiverHeader                 │
├─────────────────────────────────────────┤
│                                         │
│         Dashboard Content               │
│                                         │
├─────────────────────────────────────────┤
│         Tab Bar (Visible)               │
│  🏠  ☑️  💊  🔔                         │
└─────────────────────────────────────────┘
```

### Modal Screen (Tabs Hidden)
```
┌─────────────────────────────────────────┐
│         CaregiverHeader                 │
├─────────────────────────────────────────┤
│                                         │
│      Add Device Content                 │
│                                         │
│                                         │
│                                         │
│         Tab Bar (Hidden)                │
└─────────────────────────────────────────┘
```

## Deep Link Flow

### Initial App Launch with Deep Link
```
1. App Launches
   ↓
2. Check for Initial URL
   ↓
3. Parse Deep Link
   pildhora://caregiver/events/123
   ↓
4. Navigate to Route
   /caregiver/events/123
   ↓
5. Show Event Detail Screen
```

### Deep Link While App Running
```
1. User Clicks Link
   https://pildhora.com/caregiver/dashboard
   ↓
2. App Receives URL Event
   ↓
3. Parse Deep Link
   ↓
4. Navigate to Route
   /caregiver/dashboard
   ↓
5. Show Dashboard Screen
```

## Navigation State Persistence

### Save Flow
```
User Navigates
   ↓
Route Changes
   ↓
Save Last Route
   ↓
AsyncStorage
   @pildhora:last_route
   {
     route: '/caregiver/events',
     params: {},
     timestamp: 1700000000000
   }
```

### Restore Flow
```
App Launches
   ↓
Check for Deep Link
   (None found)
   ↓
Load Last Route
   ↓
Check Timestamp
   (< 24 hours)
   ↓
Navigate to Last Route
   /caregiver/events
```

## Navigation Hierarchy

```
app/caregiver/
├── _layout.tsx (Tabs)
│   ├── dashboard.tsx (Tab)
│   ├── tasks.tsx (Tab)
│   ├── medications/ (Tab)
│   │   ├── _layout.tsx (Stack)
│   │   ├── index.tsx
│   │   └── [patientId]/
│   │       ├── index.tsx
│   │       ├── add.tsx
│   │       └── [id].tsx
│   ├── events.tsx (Tab)
│   │   └── [id].tsx (Modal)
│   └── add-device.tsx (Modal)
```

## Tab Icon Variants

### Dashboard Tab
```
Inactive:  🏠 (home-outline)
Active:    🏠 (home)
Color:     #6B7280 → #007AFF
```

### Tasks Tab
```
Inactive:  ☑️ (checkbox-outline)
Active:    ☑️ (checkbox)
Color:     #6B7280 → #007AFF
```

### Medications Tab
```
Inactive:  💊 (medkit-outline)
Active:    💊 (medkit)
Color:     #6B7280 → #007AFF
```

### Events Tab
```
Inactive:  🔔 (notifications-outline)
Active:    🔔 (notifications)
Color:     #6B7280 → #007AFF
```

## Accessibility Labels

### Dashboard Tab
```
Label: "Inicio - Tablero principal"
Role: button
Hint: "Navega al tablero principal"
```

### Tasks Tab
```
Label: "Tareas - Gestionar tareas del cuidador"
Role: button
Hint: "Navega a la lista de tareas"
```

### Medications Tab
```
Label: "Medicamentos - Gestionar medicamentos del paciente"
Role: button
Hint: "Navega a la gestión de medicamentos"
```

### Events Tab
```
Label: "Eventos - Ver registro de eventos de medicamentos"
Role: button
Hint: "Navega al registro de eventos"
```

## Deep Link URL Patterns

### Custom Scheme
```
pildhora://caregiver/dashboard
pildhora://caregiver/tasks
pildhora://caregiver/medications
pildhora://caregiver/medications/patient-123
pildhora://caregiver/medications/patient-123/add
pildhora://caregiver/medications/patient-123/med-456
pildhora://caregiver/events
pildhora://caregiver/events/event-789
pildhora://caregiver/add-device
```

### Universal/App Links
```
https://pildhora.com/caregiver/dashboard
https://pildhora.com/caregiver/tasks
https://pildhora.com/caregiver/medications
https://pildhora.com/caregiver/medications/patient-123
https://pildhora.com/caregiver/medications/patient-123/add
https://pildhora.com/caregiver/medications/patient-123/med-456
https://pildhora.com/caregiver/events
https://pildhora.com/caregiver/events/event-789
https://pildhora.com/caregiver/add-device
```

## Navigation Loading States

### Initial Load
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│              🔄                         │
│         Loading...                      │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### After Load
```
┌─────────────────────────────────────────┐
│         CaregiverHeader                 │
├─────────────────────────────────────────┤
│                                         │
│         Dashboard Content               │
│                                         │
├─────────────────────────────────────────┤
│         Tab Bar                         │
└─────────────────────────────────────────┘
```

## Platform-Specific Differences

### iOS Tab Bar
```
┌─────────────────────────────────────────┐
│  Icon (24px)                            │
│  Label (12px, medium)                   │
│  ─────────────────────────────────────  │
│  Padding: 8px top, 16px bottom          │
│  Height: 85px                           │
│  ─────────────────────────────────────  │
│  Home Indicator Space                   │
└─────────────────────────────────────────┘
```

### Android Tab Bar
```
┌─────────────────────────────────────────┐
│  Icon (24px)                            │
│  Label (12px, medium)                   │
│  ─────────────────────────────────────  │
│  Padding: 8px top, 8px bottom           │
│  Height: 65px                           │
└─────────────────────────────────────────┘
```

## Color Palette

### Active State
```
Background: #007AFF (Primary 500)
Text: #007AFF (Primary 500)
Icon: #007AFF (Primary 500)
```

### Inactive State
```
Background: Transparent
Text: #6B7280 (Gray 500)
Icon: #6B7280 (Gray 500)
```

### Tab Bar
```
Background: #FFFFFF (Surface)
Border: #E5E7EB (Gray 200)
Shadow: rgba(0, 0, 0, 0.05)
```

## Navigation Params Flow

### Type-Safe Navigation
```
navigateToRoute(
  router.push,
  'events/[id]',
  { id: '123' }
)
   ↓
TypeScript Validation
   ↓
Route: /caregiver/events/123
Params: { id: '123' }
   ↓
Screen Receives Params
   ↓
const { id } = useLocalSearchParams()
```

## Error States

### Deep Link Parse Error
```
Invalid URL
   ↓
parseDeepLink() returns null
   ↓
Fallback to default route
   ↓
Navigate to /caregiver/dashboard
```

### State Restore Error
```
Load State Fails
   ↓
Log Error
   ↓
Continue with default state
   ↓
Show Dashboard
```

## Summary

This visual guide provides a comprehensive overview of the navigation and routing implementation, including:

- Tab bar layout and styling
- Tab states (active/inactive)
- Modal screen behavior
- Deep link flows
- Navigation state persistence
- Platform-specific differences
- Accessibility features
- Color palette
- Error handling

All visual elements follow the design system tokens and maintain consistency across the application.

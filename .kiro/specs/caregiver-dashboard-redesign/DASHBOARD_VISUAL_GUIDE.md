# Caregiver Dashboard - Visual Guide

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                   CaregiverHeader                       │
│  PILDHORA                              [🚨] [👤]       │
│  Dr. Smith                                              │
├─────────────────────────────────────────────────────────┤
│                  PatientSelector                        │
│  Pacientes                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ John Doe │  │ Jane Doe │  │ Bob Smith│            │
│  │ 🟢 Online│  │ ⚫ Offline│  │ 🟢 Online│            │
│  └──────────┘  └──────────┘  └──────────┘            │
├─────────────────────────────────────────────────────────┤
│                   ScrollView Content                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │        DeviceConnectivityCard                     │ │
│  │  Conectividad del dispositivo                     │ │
│  │  ID: DEVICE-001                                   │ │
│  │                                                   │ │
│  │  Estado          Batería                         │ │
│  │  🟢 En línea     🟢 85%                          │ │
│  │                                                   │ │
│  │  [Gestionar dispositivo]                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │      LastMedicationStatusCard                     │ │
│  │  ⏰ Último Evento                                 │ │
│  │                                                   │ │
│  │  [DOSIS TOMADA]                                  │ │
│  │  💊 Aspirina 500mg                               │ │
│  │  👤 John Doe                                     │ │
│  │  ⏱️ Hace 2 horas                                 │ │
│  │                                                   │ │
│  │  [Ver Todos los Eventos →]                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │          QuickActionsPanel                        │ │
│  │  Acciones Rápidas                                 │ │
│  │                                                   │ │
│  │  ┌──────────┐  ┌──────────┐                     │ │
│  │  │    🔔    │  │    💊    │                     │ │
│  │  │ Eventos  │  │Medicamen-│                     │ │
│  │  │          │  │   tos    │                     │ │
│  │  └──────────┘  └──────────┘                     │ │
│  │                                                   │ │
│  │  ┌──────────┐  ┌──────────┐                     │ │
│  │  │    ☑️    │  │    🔧    │                     │ │
│  │  │  Tareas  │  │Dispositi-│                     │ │
│  │  │          │  │    vo    │                     │ │
│  │  └──────────┘  └──────────┘                     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. CaregiverHeader
```
┌─────────────────────────────────────────────────────────┐
│  PILDHORA                              [🚨] [👤]       │
│  Dr. Smith                                              │
└─────────────────────────────────────────────────────────┘
```
- **Left**: PILDHORA branding + caregiver name
- **Right**: Emergency button (red) + Account menu button (gray)
- **Height**: Dynamic based on safe area insets
- **Background**: White with bottom border

### 2. PatientSelector (Conditional)
```
┌─────────────────────────────────────────────────────────┐
│  Pacientes                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ John Doe │  │ Jane Doe │  │ Bob Smith│            │
│  │ 🟢 Online│  │ ⚫ Offline│  │ 🟢 Online│            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```
- **Display**: Only shown if 2+ patients
- **Layout**: Horizontal scrollable
- **Selected**: Blue border + blue background
- **Unselected**: Gray border + gray background
- **Status Dot**: Green (online) / Gray (offline)

### 3. DeviceConnectivityCard
```
┌───────────────────────────────────────────────────────┐
│  Conectividad del dispositivo                         │
│  ID: DEVICE-001                                       │
│                                                       │
│  Estado          Batería                             │
│  🟢 En línea     🟢 85%                              │
│                                                       │
│  [Gestionar dispositivo]                             │
└───────────────────────────────────────────────────────┘
```
- **Status Colors**:
  - 🟢 Green: Online
  - ⚫ Gray: Offline
- **Battery Colors**:
  - 🟢 Green: >50%
  - 🟡 Yellow: 20-50%
  - 🔴 Red: <20%
- **Last Seen**: Shown when offline
- **Real-time**: Updates via RTDB listener

### 4. LastMedicationStatusCard
```
┌───────────────────────────────────────────────────────┐
│  ⏰ Último Evento                                     │
│                                                       │
│  [DOSIS TOMADA]                                      │
│  💊 Aspirina 500mg                                   │
│  👤 John Doe                                         │
│  ⏱️ Hace 2 horas                                     │
│                                                       │
│  [Ver Todos los Eventos →]                           │
└───────────────────────────────────────────────────────┘
```
- **Event Badge Colors**:
  - 🟢 Green: dose_taken
  - 🔵 Blue: medication_created
  - 🟡 Yellow: medication_updated
  - 🔴 Red: medication_deleted
  - 🟠 Orange: dose_missed
- **Timestamp**: Relative time (e.g., "Hace 2 horas")
- **Empty State**: Shows when no events

### 5. QuickActionsPanel
```
┌───────────────────────────────────────────────────────┐
│  Acciones Rápidas                                     │
│                                                       │
│  ┌──────────┐  ┌──────────┐                         │
│  │    🔔    │  │    💊    │                         │
│  │ Eventos  │  │Medicamen-│                         │
│  │          │  │   tos    │                         │
│  └──────────┘  └──────────┘                         │
│                                                       │
│  ┌──────────┐  ┌──────────┐                         │
│  │    ☑️    │  │    🔧    │                         │
│  │  Tareas  │  │Dispositi-│                         │
│  │          │  │    vo    │                         │
│  └──────────┘  └──────────┘                         │
└───────────────────────────────────────────────────────┘
```
- **Layout**: 2x2 grid on mobile, 1x4 on tablet
- **Card Colors**:
  - 🔵 Blue: Events (primary)
  - 🟢 Green: Medications (success)
  - 🟡 Yellow: Tasks (warning)
  - 🟣 Purple: Device (info)
- **Animation**: Scale + opacity on press
- **Touch Target**: Minimum 120px height

## Loading States

### Skeleton Loaders
```
┌───────────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                       │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                       │
│  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓                                   │
│  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓                                   │
│                                                       │
│  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓                                   │
│  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓                                   │
└───────────────────────────────────────────────────────┘
```
- Shows while `patientsLoading === true`
- Matches layout of actual content
- Smooth fade-in when data loads

## Error States

### Initialization Error
```
┌───────────────────────────────────────────────────────┐
│                                                       │
│                      🚨                               │
│                                                       │
│           Error de inicialización                    │
│                                                       │
│     No se pudo conectar con los servicios            │
│              de Firebase                             │
│                                                       │
│              [Reintentar]                            │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Query Error
```
┌───────────────────────────────────────────────────────┐
│                                                       │
│                      ⚠️                               │
│                                                       │
│          Configuración en progreso                   │
│                                                       │
│   Los índices de la base de datos se están          │
│   configurando. Esto puede tardar unos minutos.     │
│                                                       │
│              [Reintentar]                            │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## Empty States

### No Patients
```
┌───────────────────────────────────────────────────────┐
│                                                       │
│                      👥                               │
│                                                       │
│         No hay pacientes vinculados                  │
│                                                       │
│   Vincula un dispositivo para comenzar a            │
│           gestionar pacientes                        │
│                                                       │
│          [Vincular Dispositivo]                      │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### No Patient Selected
```
┌───────────────────────────────────────────────────────┐
│                                                       │
│                      ✋                               │
│                                                       │
│            Selecciona un paciente                    │
│                                                       │
│   Elige un paciente de la lista superior            │
│         para ver su información                      │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Mobile (< 768px)
- Quick Actions: 2x2 grid
- Patient chips: Horizontal scroll
- Cards: Full width with padding
- Touch targets: Minimum 44x44 points

### Tablet (≥ 768px)
- Quick Actions: 1x4 grid (horizontal)
- Patient chips: Horizontal scroll with more visible
- Cards: Full width with larger padding
- Touch targets: Minimum 44x44 points

## Color Palette

### Status Colors
- **Online**: `colors.success` (#34C759)
- **Offline**: `colors.gray[400]` (#9CA3AF)
- **Battery Good**: `colors.success` (#34C759)
- **Battery Low**: `colors.warning[500]` (#FF9500)
- **Battery Critical**: `colors.error[500]` (#FF3B30)

### Event Badge Colors
- **Created**: `colors.primary[500]` (#007AFF)
- **Updated**: `colors.warning[500]` (#FF9500)
- **Deleted**: `colors.error[500]` (#FF3B30)
- **Dose Taken**: `colors.success` (#34C759)
- **Dose Missed**: `colors.warning[500]` (#FF9500)

### Background Colors
- **Screen**: `colors.gray[50]` (#F9FAFB)
- **Cards**: `colors.surface` (#FFFFFF)
- **Selected**: `colors.primary[50]` (#E6F0FF)

## Spacing

### Content Padding
- **Horizontal**: `spacing.lg` (16px)
- **Vertical**: `spacing.lg` (16px)
- **Card Gap**: `spacing.lg` (16px)

### Component Spacing
- **Header Padding**: `spacing.lg` (16px)
- **Patient Selector**: `spacing.md` (12px)
- **Card Padding**: `spacing.lg` (16px)
- **Button Spacing**: `spacing.md` (12px)

## Typography

### Headers
- **Screen Title**: `fontSize.xl` (20px), `fontWeight.bold`
- **Card Title**: `fontSize.lg` (18px), `fontWeight.semibold`
- **Section Title**: `fontSize.xl` (20px), `fontWeight.bold`

### Body Text
- **Primary**: `fontSize.base` (16px), `fontWeight.normal`
- **Secondary**: `fontSize.sm` (14px), `fontWeight.medium`
- **Caption**: `fontSize.xs` (12px), `fontWeight.normal`

## Accessibility

### Touch Targets
- All interactive elements: Minimum 44x44 points
- Quick action cards: 120px height minimum
- Buttons: 44px height minimum

### Labels
- All buttons have `accessibilityLabel`
- All buttons have `accessibilityHint`
- All icons have `accessibilityRole="button"`
- Status indicators have descriptive labels

### Color Contrast
- Text on background: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum (WCAG AA)
- Interactive elements: Clear visual distinction

## Animation

### Press Animations
- **Scale**: 1.0 → 0.95 on press
- **Opacity**: 1.0 → 0.7 on press
- **Duration**: 100ms
- **Easing**: Spring (damping: 15, stiffness: 150)

### Fade In
- **Opacity**: 0 → 1
- **Duration**: 300ms
- **Easing**: Linear

### Scroll
- **Smooth**: Native scroll behavior
- **Indicators**: Hidden for horizontal scrolls

## Data Flow

```
Firebase Firestore
       ↓
useCollectionSWR (with cache)
       ↓
patients array
       ↓
useMemo → patientsWithDevices
       ↓
PatientSelector
       ↓
handlePatientSelect
       ↓
selectedPatientId state
       ↓
useMemo → selectedPatient
       ↓
┌─────────────────────────────────┐
│  DeviceConnectivityCard         │ → RTDB listener
│  LastMedicationStatusCard       │ → Firestore query
│  QuickActionsPanel              │ → Navigation
└─────────────────────────────────┘
```

## Navigation Flow

```
Dashboard
    ├─→ Events (/caregiver/events)
    ├─→ Medications (/caregiver/medications)
    ├─→ Tasks (/caregiver/tasks)
    └─→ Device Management (/caregiver/add-device)
```

---

**Last Updated**: November 15, 2025  
**Version**: 1.0  
**Status**: ✅ Complete

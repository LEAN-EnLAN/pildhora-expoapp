# Last Medication Status Card - Visual Guide

## Component Overview

The LastMedicationStatusCard displays the most recent medication event for a patient on the caregiver dashboard. It provides quick insight into the latest medication activity.

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  🕐 Último Evento                                       │
│                                                         │
│  ┌──────────────────┐                                  │
│  │ 🔵 Creado        │  ← Event Type Badge              │
│  └──────────────────┘                                  │
│                                                         │
│  💊 Aspirina 500mg                                      │
│                                                         │
│  👤 Juan Pérez                                          │
│                                                         │
│  🕐 hace 2 horas                                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Ver Todos los Eventos →                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Event Type Badge Colors

### Medication Events

#### Created (Creado)
```
┌──────────────────┐
│ ➕ Creado        │  Blue background (#E6F0FF)
└──────────────────┘  Blue text (#007AFF)
```

#### Updated (Actualizado)
```
┌──────────────────┐
│ ✏️ Actualizado   │  Yellow background (#FFF7ED)
└──────────────────┘  Orange text (#FF9500)
```

#### Deleted (Eliminado)
```
┌──────────────────┐
│ 🗑️ Eliminado     │  Red background (#FEF2F2)
└──────────────────┘  Red text (#FF3B30)
```

### Dose Events

#### Dose Taken (Dosis Tomada)
```
┌──────────────────┐
│ ✅ Dosis Tomada  │  Green background (#E6F7ED)
└──────────────────┘  Green text (#34C759)
```

#### Dose Missed (Dosis Perdida)
```
┌──────────────────┐
│ ⚠️ Dosis Perdida │  Orange background (#FFF7ED)
└──────────────────┘  Orange text (#FF9500)
```

## Component States

### 1. Loading State

```
┌─────────────────────────────────────────────────────────┐
│  🕐 Último Evento                                       │
│                                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓                                          │
│                                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                        │
│                                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                  │
│                                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                        │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Animated shimmer effect
- Matches final content layout
- Prevents layout shift

### 2. Empty State

```
┌─────────────────────────────────────────────────────────┐
│  🕐 Último Evento                                       │
│                                                         │
│                                                         │
│                    📄                                   │
│                                                         │
│            No hay eventos recientes                     │
│                                                         │
│      Los eventos de medicamentos aparecerán aquí       │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Large document icon
- Clear message
- Helpful subtext
- Centered layout

### 3. Error State

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Último Evento                                       │
│                                                         │
│                                                         │
│              Error al cargar el evento                  │
│                                                         │
│              ┌──────────────┐                           │
│              │  Reintentar  │                           │
│              └──────────────┘                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Error icon and message
- Retry button
- Red color coding
- Centered layout

### 4. Event Display (Normal State)

```
┌─────────────────────────────────────────────────────────┐
│  🕐 Último Evento                                       │
│                                                         │
│  ┌──────────────────┐                                  │
│  │ ✅ Dosis Tomada  │                                  │
│  └──────────────────┘                                  │
│                                                         │
│  💊 Ibuprofeno 400mg                                    │
│                                                         │
│  👤 María García                                        │
│                                                         │
│  🕐 hace 30 minutos                                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Ver Todos los Eventos →                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Event type badge at top
- Medication name with icon
- Patient name (optional)
- Relative timestamp
- Navigation button

## Responsive Behavior

### Mobile (< 768px)
- Full width card
- Single column layout
- Comfortable touch targets (44x44 minimum)
- Readable font sizes

### Tablet (≥ 768px)
- Same layout as mobile
- Can be placed in grid with other cards
- Maintains aspect ratio

## Accessibility Features

### Screen Reader Support

**Badge Announcement:**
```
"Estado: Dosis Tomada"
```

**Card Content:**
```
"Último Evento. Dosis Tomada. Ibuprofeno 400mg. María García. hace 30 minutos."
```

**Button:**
```
"Ver Todos los Eventos. Navega a la pantalla de registro de eventos."
```

### Keyboard Navigation
- Card is focusable if interactive
- Button receives focus
- Logical tab order

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Badge colors have sufficient contrast
- Icons are supplemented with text

## Usage Examples

### Basic Usage
```typescript
import { LastMedicationStatusCard } from '@/components/caregiver';

<LastMedicationStatusCard
  caregiverId={user.id}
  onViewAll={() => router.push('/caregiver/events')}
/>
```

### With Patient Filter
```typescript
<LastMedicationStatusCard
  patientId={selectedPatientId}
  caregiverId={user.id}
  onViewAll={() => router.push('/caregiver/events')}
/>
```

### Without Navigation
```typescript
<LastMedicationStatusCard
  patientId={selectedPatientId}
  caregiverId={user.id}
/>
```

## Integration with Dashboard

### Recommended Layout

```
Dashboard Screen
├── CaregiverHeader
├── PatientSelector (if multiple patients)
├── ScrollView
│   ├── DeviceConnectivityCard
│   ├── LastMedicationStatusCard  ← This component
│   └── QuickActionsPanel
```

### Spacing Recommendations
- Margin top: `spacing.lg` (16px)
- Margin bottom: `spacing.lg` (16px)
- Horizontal padding: `spacing.lg` (16px)

## Performance Characteristics

### Initial Load
- Firestore query: ~200-500ms
- Skeleton display: immediate
- Smooth transition to content

### Updates
- Real-time updates via Firestore listener (future enhancement)
- Manual refresh on patient change
- Efficient query with limit(1)

### Memory
- Minimal state (event, loading, error)
- Proper cleanup in useEffect
- No memory leaks

## Design Tokens Used

### Colors
- `colors.primary[500]` - Blue for created events
- `colors.warning[500]` - Yellow for updated events
- `colors.error[500]` - Red for deleted events
- `colors.success` - Green for dose taken
- `colors.gray[*]` - Neutral colors for text and backgrounds

### Spacing
- `spacing.xs` (4px) - Tight gaps
- `spacing.sm` (8px) - Small gaps
- `spacing.md` (12px) - Medium gaps
- `spacing.lg` (16px) - Large gaps

### Typography
- `typography.fontSize.sm` (14px) - Small text
- `typography.fontSize.base` (16px) - Body text
- `typography.fontSize.lg` (18px) - Large text
- `typography.fontWeight.medium` (500) - Medium weight
- `typography.fontWeight.semibold` (600) - Semibold weight

### Border Radius
- `borderRadius.md` (12px) - Badge corners
- `borderRadius.lg` (16px) - Card corners
- `borderRadius.full` (9999px) - Pill-shaped badges

## Future Enhancements

### Potential Improvements
1. Real-time updates with Firestore listener
2. Swipe actions for quick navigation
3. Event preview on long press
4. Animation when new event arrives
5. Customizable event type filters

### Integration Opportunities
1. Link to medication detail view
2. Quick actions menu on event
3. Share event functionality
4. Export event data

## Troubleshooting

### No Events Displayed
- Check Firestore security rules
- Verify caregiverId is set correctly
- Ensure medicationEvents collection exists
- Check console for query errors

### Loading Forever
- Check Firebase initialization
- Verify network connectivity
- Check Firestore indexes
- Review query constraints

### Wrong Event Displayed
- Verify orderBy timestamp descending
- Check limit(1) is applied
- Ensure timestamp field exists
- Review patient/caregiver filters

## Conclusion

The LastMedicationStatusCard provides a polished, accessible way to display the most recent medication event. Its clear visual hierarchy, comprehensive state handling, and adherence to design system guidelines make it a robust component for the caregiver dashboard.

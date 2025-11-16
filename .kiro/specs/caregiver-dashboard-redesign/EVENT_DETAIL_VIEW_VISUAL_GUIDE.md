# Event Detail View - Visual Guide

## Overview

This guide provides a visual reference for the enhanced event detail view screen, showing the layout, styling, and component structure.

## Screen Layout

```
┌─────────────────────────────────────────────────────┐
│                 CaregiverHeader                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ [BADGE: Actualizado]                          │ │
│  │                                               │ │
│  │  ┌────┐                                       │ │
│  │  │ 📝 │  Patient Name actualizó              │ │
│  │  └────┘  "Medication Name"                   │ │
│  │          🕐 hace 2 horas                      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔄 Cambios Realizados                         │ │
│  │ ─────────────────────────────────────────────│ │
│  │                                               │ │
│  │  ●─── DOSIS                                   │ │
│  │  │    Anterior: 10 mg                        │ │
│  │  │    ──→                                    │ │
│  │  │    Nuevo: 20 mg                           │ │
│  │  │                                            │ │
│  │  ●─── HORARIOS                                │ │
│  │  │    Anterior: 08:00, 20:00                 │ │
│  │  │    ──→                                    │ │
│  │  │    Nuevo: 09:00, 21:00                    │ │
│  │  │                                            │ │
│  │  ●    FRECUENCIA                              │ │
│  │       Anterior: Diario                        │ │
│  │       ──→                                     │ │
│  │       Nuevo: Cada 12 horas                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📄 Información del Medicamento                │ │
│  │ ─────────────────────────────────────────────│ │
│  │                                               │ │
│  │  [😊] Icono:        💊                        │ │
│  │  [💊] Nombre:       Aspirina                  │ │
│  │  [💧] Dosis:        20 mg                     │ │
│  │  [📦] Tipo:         Pastilla                  │ │
│  │  [🕐] Horarios:     09:00, 21:00              │ │
│  │  [🔄] Frecuencia:   Cada 12 horas             │ │
│  │  [📚] Inventario:   45 unidades               │ │
│  │  [⚠️] Umbral bajo:  10 unidades               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 👤 Información del Paciente                   │ │
│  │ ─────────────────────────────────────────────│ │
│  │                                               │ │
│  │  ┌────┐  NOMBRE                               │ │
│  │  │ 👤 │  Juan Pérez                           │ │
│  │  └────┘                                       │ │
│  │                                               │ │
│  │  ┌────┐  EMAIL                                │ │
│  │  │ ✉️ │  juan@example.com                     │ │
│  │  └────┘                                       │ │
│  │                                               │ │
│  │  ┌────┐  ADHERENCIA                           │ │
│  │  │ 📊 │  85%                                  │ │
│  │  └────┘                                       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ [💊 Ver Medicamentos]                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ [✉️ Contactar Paciente]                       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Event Header Card

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ [BADGE: Actualizado] ← EventTypeBadge   │
│                                         │
│  ┌────────┐                             │
│  │   📝   │  Patient Name actualizó     │
│  │ Icon   │  "Medication Name"          │
│  │ 64x64  │  🕐 hace 2 horas            │
│  └────────┘                             │
└─────────────────────────────────────────┘
```

**Styling**:
- Card variant: `elevated`
- Padding: `lg` (16px)
- Badge size: `lg`
- Icon container: 64x64px with shadow
- Typography: xl (title), lg (medication), sm (timestamp)

### 2. Timeline Change View

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ 🔄 Cambios Realizados                   │
│ ─────────────────────────────────────── │
│                                         │
│  ●─── FIELD NAME                        │
│  │    Anterior: old value               │
│  │    ──→                               │
│  │    Nuevo: new value                  │
│  │                                      │
│  ●─── FIELD NAME                        │
│  │    Anterior: old value               │
│  │    ──→                               │
│  │    Nuevo: new value                  │
│  │                                      │
│  ●    FIELD NAME (last item, no line)   │
│       Anterior: old value                │
│       ──→                                │
│       Nuevo: new value                   │
└─────────────────────────────────────────┘
```

**Timeline Elements**:
- **Dot**: 12px diameter, primary[500] color, 3px border
- **Line**: 2px width, primary[100] color
- **Field Label**: Uppercase, bold, gray[700]
- **Value Labels**: "Anterior" / "Nuevo", xs size, uppercase
- **Old Value**: error[50] background, error[500] text, 3px left border
- **New Value**: success+20 background, green text, 3px left border
- **Arrow**: 20px icon, primary[500] color

### 3. Medication Snapshot Card

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ 📄 Información del Medicamento          │
│ ─────────────────────────────────────── │
│                                         │
│  ┌──┐                                   │
│  │😊│ Icono:        💊                  │
│  └──┘                                   │
│                                         │
│  ┌──┐                                   │
│  │💊│ Nombre:       Aspirina            │
│  └──┘                                   │
│                                         │
│  ┌──┐                                   │
│  │💧│ Dosis:        20 mg               │
│  └──┘                                   │
└─────────────────────────────────────────┘
```

**Icon Containers**:
- Size: 32x32px
- Background: gray[100]
- Border radius: sm
- Icon size: 18px
- Icon color: gray[500]

### 4. Patient Contact Card

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ 👤 Información del Paciente             │
│ ─────────────────────────────────────── │
│                                         │
│  ┌────────┐  NOMBRE                     │
│  │   👤   │  Juan Pérez                 │
│  │ 40x40  │                             │
│  └────────┘                             │
│                                         │
│  ┌────────┐  EMAIL                      │
│  │   ✉️   │  juan@example.com           │
│  │ 40x40  │                             │
│  └────────┘                             │
└─────────────────────────────────────────┘
```

**Contact Row Styling**:
- Background: gray[50]
- Border radius: md
- Padding: sm vertical, md horizontal
- Icon container: 40x40px, primary[50] background
- Label: xs size, uppercase, gray[500]
- Value: base size, medium weight, gray[900]

## Color Palette

### Event Type Badge Colors

| Event Type | Background | Text Color | Icon |
|------------|------------|------------|------|
| Created | primary[50] | primary[500] | add-circle |
| Updated | warning[50] | warning[500] | create |
| Deleted | error[50] | error[500] | trash |
| Dose Taken | #E6F7ED | success | checkmark-circle |
| Dose Missed | #FFF7ED | #FF9500 | alert-circle |

### Change Value Colors

| Type | Background | Text | Border |
|------|------------|------|--------|
| Old Value | error[50] | error[500] | error[500] (3px) |
| New Value | success+20 | #059669 | success (3px) |

### Section Colors

| Element | Color |
|---------|-------|
| Section Icon Container | primary[50] background, primary[500] icon |
| Section Border | gray[100] |
| Timeline Dot | primary[500] with primary[100] border |
| Timeline Line | primary[100] |

## Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Header Title | xl | bold | gray[900] |
| Medication Name | lg | normal (italic) | gray[700] |
| Section Title | lg | semibold | gray[900] |
| Field Label | sm | bold (uppercase) | gray[700] |
| Value Label | xs | semibold (uppercase) | gray[500] |
| Value Text | base | medium | gray[900] |
| Timestamp | sm | normal | gray[500] |

## Spacing System

| Element | Spacing |
|---------|---------|
| Card Padding | lg (16px) |
| Section Gap | lg (16px) |
| Item Gap | md (12px) |
| Icon Gap | sm (8px) |
| Timeline Gap | lg (16px) |
| Header Badge Margin | md (12px) |

## Interactive Elements

### Action Buttons

**Primary Button** (Ver Medicamentos):
```
┌─────────────────────────────────────┐
│ 💊 Ver Medicamentos                 │
└─────────────────────────────────────┘
```
- Variant: primary
- Full width
- Left icon: medical-outline
- Accessibility: "Ver lista de medicamentos de [patient]"

**Secondary Button** (Contactar Paciente):
```
┌─────────────────────────────────────┐
│ ✉️ Contactar Paciente               │
└─────────────────────────────────────┘
```
- Variant: secondary
- Full width
- Left icon: mail-outline
- Accessibility: "Contactar a [patient]"

## Accessibility Features

### Labels
- Event header: "[Patient] [action] [medication] [time]"
- Change items: "[Field] cambió de [old] a [new]"
- Sections: Descriptive labels for each section
- Icons: Proper accessibility roles

### Touch Targets
- All buttons: Minimum 44x44 points
- Icon containers: 40x40px or larger
- Timeline dots: 12px with adequate spacing

### Screen Reader
- Logical reading order maintained
- Descriptive hints for actions
- Proper semantic structure

## Responsive Behavior

### Small Screens
- Single column layout
- Full-width cards
- Stacked value containers in timeline

### Large Screens
- Maintains single column for consistency
- Maximum width constraints
- Centered content

## Loading States

**Skeleton Loader**:
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└─────────────────────────────────────┘
```

## Error States

**Error Display**:
```
┌─────────────────────────────────────┐
│           ⚠️                        │
│                                     │
│          Error                      │
│   Evento no encontrado              │
│                                     │
│      [Volver]                       │
└─────────────────────────────────────┘
```

## Animation Behavior

### Card Entrance
- Fade in with slight scale
- Staggered timing for multiple cards

### Timeline Items
- Sequential reveal from top to bottom
- Smooth line drawing animation

### Button Press
- Scale down to 0.95
- Opacity to 0.8
- Duration: 150ms

## Best Practices

1. **Consistency**: Use design system tokens throughout
2. **Hierarchy**: Clear visual distinction between sections
3. **Accessibility**: Comprehensive labels and proper structure
4. **Performance**: Optimized rendering with proper keys
5. **Responsiveness**: Adapts to different screen sizes

## Implementation Notes

- All cards use `variant="elevated"` for depth
- Timeline view provides intuitive change visualization
- Icon containers enhance visual hierarchy
- Color coding aids quick comprehension
- Accessibility labels ensure screen reader support

## Related Components

- `EventTypeBadge` - Color-coded event type indicator
- `Card` - Container with elevation
- `Button` - Action buttons
- `Container` - Layout wrapper

## Testing Checklist

- [ ] Event header displays correctly
- [ ] Timeline view renders for update events
- [ ] Medication snapshot shows all fields
- [ ] Patient contact information displays
- [ ] Action buttons work correctly
- [ ] Accessibility labels present
- [ ] Loading state shows properly
- [ ] Error state handles gracefully
- [ ] Navigation works as expected
- [ ] Design system tokens used consistently

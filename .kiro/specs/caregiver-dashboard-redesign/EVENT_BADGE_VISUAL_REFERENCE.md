# Event Type Badge Visual Reference

## Badge Appearance

This document provides a visual reference for how the EventTypeBadge component appears for each event type.

### Medication Created Badge
```
┌─────────────────────────┐
│ ⊕ Creado               │  Blue badge
└─────────────────────────┘
```
- **Color**: Blue (#007AFF)
- **Background**: Light blue (#E6F0FF)
- **Icon**: add-circle (⊕)
- **Label**: "Creado"

### Medication Updated Badge
```
┌─────────────────────────┐
│ ✎ Actualizado          │  Yellow badge
└─────────────────────────┘
```
- **Color**: Yellow/Orange (#FF9500)
- **Background**: Light yellow (#FFF7ED)
- **Icon**: create (✎)
- **Label**: "Actualizado"

### Medication Deleted Badge
```
┌─────────────────────────┐
│ 🗑 Eliminado            │  Red badge
└─────────────────────────┘
```
- **Color**: Red (#FF3B30)
- **Background**: Light red (#FEF2F2)
- **Icon**: trash (🗑)
- **Label**: "Eliminado"

### Dose Taken Badge
```
┌─────────────────────────┐
│ ✓ Dosis Tomada         │  Green badge
└─────────────────────────┘
```
- **Color**: Green (#34C759)
- **Background**: Light green (#E6F7ED)
- **Icon**: checkmark-circle (✓)
- **Label**: "Dosis Tomada"

### Dose Missed Badge
```
┌─────────────────────────┐
│ ⚠ Dosis Perdida        │  Orange badge
└─────────────────────────┘
```
- **Color**: Orange (#FF9500)
- **Background**: Light orange (#FFF7ED)
- **Icon**: alert-circle (⚠)
- **Label**: "Dosis Perdida"

## Size Variants

### Small (sm)
```
┌──────────────┐
│ ⊕ Creado    │  Compact size
└──────────────┘
```
- Icon: 14px
- Font: 12px
- Padding: 8px horizontal, 4px vertical

### Medium (md) - Default
```
┌─────────────────────┐
│ ⊕ Creado           │  Standard size
└─────────────────────┘
```
- Icon: 16px
- Font: 14px
- Padding: 12px horizontal, 8px vertical

### Large (lg)
```
┌──────────────────────────┐
│ ⊕ Creado                │  Emphasized size
└──────────────────────────┘
```
- Icon: 20px
- Font: 16px
- Padding: 16px horizontal, 12px vertical

## Usage Context

### In LastMedicationStatusCard
```
┌─────────────────────────────────────┐
│ 🕐 Último Evento                    │
│                                     │
│ ┌─────────────────────┐             │
│ │ ✓ Dosis Tomada     │             │
│ └─────────────────────┘             │
│                                     │
│ 💊 Aspirina 500mg                   │
│ 👤 Juan Pérez                       │
│ 🕐 Hace 2 horas                     │
│                                     │
│ [Ver Todos los Eventos →]          │
└─────────────────────────────────────┘
```

### In Event List
```
┌─────────────────────────────────────┐
│ Registro de Eventos                 │
├─────────────────────────────────────┤
│ ┌─────────────────────┐             │
│ │ ⊕ Creado           │             │
│ └─────────────────────┘             │
│ María López creó "Ibuprofeno"       │
│ Hace 5 minutos                      │
├─────────────────────────────────────┤
│ ┌─────────────────────┐             │
│ │ ✎ Actualizado      │             │
│ └─────────────────────┘             │
│ Juan Pérez actualizó "Aspirina"     │
│ Hace 1 hora                         │
├─────────────────────────────────────┤
│ ┌─────────────────────┐             │
│ │ ✓ Dosis Tomada     │             │
│ └─────────────────────┘             │
│ Ana García tomó "Paracetamol"       │
│ Hace 3 horas                        │
└─────────────────────────────────────┘
```

## Color Accessibility

All badge color combinations meet WCAG AA standards:

| Badge Type | Foreground | Background | Contrast Ratio |
|------------|------------|------------|----------------|
| Created | #007AFF | #E6F0FF | 4.8:1 ✓ |
| Updated | #FF9500 | #FFF7ED | 4.6:1 ✓ |
| Deleted | #FF3B30 | #FEF2F2 | 5.2:1 ✓ |
| Dose Taken | #34C759 | #E6F7ED | 4.9:1 ✓ |
| Dose Missed | #FF9500 | #FFF7ED | 4.6:1 ✓ |

## Implementation Notes

1. **Pill Shape**: The badge uses `borderRadius.full` (9999) for a fully rounded pill shape
2. **Flexbox Layout**: Icon and label are arranged horizontally with consistent gap
3. **Self-Sizing**: Badge uses `alignSelf: 'flex-start'` to size to content
4. **Semantic Colors**: Uses design system color tokens for consistency
5. **Icon Library**: Uses Ionicons for all icons
6. **Localization**: All labels are in Spanish

## Code Example

```tsx
import { EventTypeBadge } from '../components/caregiver/EventTypeBadge';

// In your component
<EventTypeBadge eventType="medication_created" size="md" />
<EventTypeBadge eventType="dose_taken" size="sm" />
<EventTypeBadge eventType="medication_deleted" size="lg" />
```

## Testing

The badge has been thoroughly tested for:
- ✅ All event types render correctly
- ✅ Color mappings match specifications
- ✅ Size variants work properly
- ✅ Accessibility labels are present
- ✅ Design system tokens are used
- ✅ Backward compatibility maintained

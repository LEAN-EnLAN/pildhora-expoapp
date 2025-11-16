# Caregiver Device Unlink - Visual Guide

## Before and After

### Before (No Unlink Button)
```
┌─────────────────────────────────────────┐
│ Conectividad del dispositivo            │
│                                         │
│ ID: DEVICE-12345                        │
│                                         │
│ Estado          Batería                 │
│ ● En línea      ● 85%                   │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │    Gestionar dispositivo        │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### After (With Unlink Button)
```
┌─────────────────────────────────────────┐
│ Conectividad del dispositivo            │
│                                         │
│ ID: DEVICE-12345                        │
│                                         │
│ Estado          Batería                 │
│ ● En línea      ● 85%                   │
│                                         │
│ ┌──────────┐  ┌──────────────────┐    │
│ │Gestionar │  │   Desenlazar     │    │
│ └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────┘
```

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  CAREGIVER DASHBOARD                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Patient: Juan Pérez                            │    │
│  │                                                 │    │
│  │ ┌────────────────────────────────────────┐    │    │
│  │ │ Device Connectivity Card               │    │    │
│  │ │                                         │    │    │
│  │ │ ID: DEVICE-12345                       │    │    │
│  │ │ Status: Online    Battery: 85%         │    │    │
│  │ │                                         │    │    │
│  │ │ [Gestionar] [Desenlazar] ◄─────────────┼────┼────┐
│  │ └────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                                                           │
                                                           │ Click
                                                           ▼
┌─────────────────────────────────────────────────────────┐
│              CONFIRMATION DIALOG                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Desenlazar dispositivo                        │    │
│  │                                                 │    │
│  │  ¿Estás seguro de que deseas desenlazar       │    │
│  │  el dispositivo DEVICE-12345 del paciente?     │    │
│  │                                                 │    │
│  │  Esto eliminará la conexión entre el           │    │
│  │  dispositivo y el paciente.                    │    │
│  │                                                 │    │
│  │  ┌──────────┐  ┌──────────────────┐          │    │
│  │  │Cancelar  │  │   Desenlazar     │          │    │
│  │  └──────────┘  └──────────────────┘          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                                                           │
                                                           │ Confirm
                                                           ▼
┌─────────────────────────────────────────────────────────┐
│                 LOADING STATE                            │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Device Connectivity Card                       │    │
│  │                                                 │    │
│  │ ID: DEVICE-12345                               │    │
│  │ Status: Online    Battery: 85%                 │    │
│  │                                                 │    │
│  │ [Gestionar] [Desenlazando...] ◄────────────────┼────┐
│  │              (disabled)                         │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                                                           │
                                                           │ Processing
                                                           ▼
┌─────────────────────────────────────────────────────────┐
│                SUCCESS MESSAGE                           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Éxito                                         │    │
│  │                                                 │    │
│  │  El dispositivo ha sido desenlazado            │    │
│  │  exitosamente                                  │    │
│  │                                                 │    │
│  │  ┌──────────┐                                  │    │
│  │  │    OK    │                                  │    │
│  │  └──────────┘                                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                                                           │
                                                           │ OK
                                                           ▼
┌─────────────────────────────────────────────────────────┐
│              REFRESHED DASHBOARD                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Patient: Juan Pérez                            │    │
│  │                                                 │    │
│  │ ┌────────────────────────────────────────┐    │    │
│  │ │ Device Connectivity Card               │    │    │
│  │ │                                         │    │    │
│  │ │ No hay dispositivo vinculado           │    │    │
│  │ │                                         │    │    │
│  │ │ ┌────────────────────────────────┐    │    │    │
│  │ │ │   Vincular dispositivo         │    │    │    │
│  │ │ └────────────────────────────────┘    │    │    │
│  │ └────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Button States

### Normal State
```
┌──────────────────┐
│   Desenlazar     │  ← Red background (danger variant)
└──────────────────┘     White text
                         Enabled
```

### Hover/Press State
```
┌──────────────────┐
│   Desenlazar     │  ← Darker red background
└──────────────────┘     White text
                         Slightly scaled (0.95)
```

### Loading State
```
┌──────────────────┐
│ Desenlazando...  │  ← Red background
└──────────────────┘     White text
                         Disabled
                         Spinner visible
```

### Disabled State
```
┌──────────────────┐
│   Desenlazar     │  ← Gray background
└──────────────────┘     Gray text
                         Not clickable
```

## Color Scheme

### Gestionar Button (Outline)
- **Border**: `colors.primary[500]` (#4F46E5)
- **Text**: `colors.primary[500]` (#4F46E5)
- **Background**: Transparent
- **Hover**: Light blue background

### Desenlazar Button (Danger)
- **Background**: `colors.error[500]` (#EF4444)
- **Text**: `colors.surface` (#FFFFFF)
- **Border**: None
- **Hover**: Darker red (#DC2626)

## Spacing and Layout

```
┌─────────────────────────────────────────┐
│ Card Padding: 16px (spacing.lg)        │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Button Container                │   │
│ │ flexDirection: 'row'            │   │
│ │ gap: 8px (spacing.sm)           │   │
│ │ marginTop: 16px (spacing.md)    │   │
│ │                                 │   │
│ │ ┌──────────┐  ┌──────────────┐ │   │
│ │ │ Button 1 │  │   Button 2   │ │   │
│ │ │ flex: 1  │  │   flex: 1    │ │   │
│ │ └──────────┘  └──────────────┘ │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Responsive Behavior

### Small Screens (< 360px)
```
┌─────────────────────────┐
│ Device Card             │
│                         │
│ [Gestionar]             │
│ [Desenlazar]            │  ← Stacked vertically
└─────────────────────────┘
```

### Medium/Large Screens (≥ 360px)
```
┌─────────────────────────────────┐
│ Device Card                     │
│                                 │
│ [Gestionar] [Desenlazar]        │  ← Side by side
└─────────────────────────────────┘
```

## Error States

### Network Error
```
┌─────────────────────────────────────────┐
│  Error                                  │
│                                         │
│  El servicio no está disponible.       │
│  Por favor, verifica tu conexión a     │
│  internet e intenta nuevamente.        │
│                                         │
│  ┌──────────┐                          │
│  │    OK    │                          │
│  └──────────┘                          │
└─────────────────────────────────────────┘
```

### Permission Error
```
┌─────────────────────────────────────────┐
│  Error                                  │
│                                         │
│  No tienes permiso para realizar       │
│  esta operación. Verifica tu conexión  │
│  y permisos.                           │
│                                         │
│  ┌──────────┐                          │
│  │    OK    │                          │
│  └──────────┘                          │
└─────────────────────────────────────────┘
```

### Missing Information
```
┌─────────────────────────────────────────┐
│  Error                                  │
│                                         │
│  No se puede desenlazar: información   │
│  del dispositivo o paciente no         │
│  disponible                            │
│                                         │
│  ┌──────────┐                          │
│  │    OK    │                          │
│  └──────────┘                          │
└─────────────────────────────────────────┘
```

## Accessibility Features

### Screen Reader Announcements

1. **Button Focus**:
   - "Desenlazar dispositivo, botón"
   - "Elimina la conexión entre el dispositivo y el paciente"

2. **Loading State**:
   - "Desenlazando dispositivo, por favor espera"

3. **Success**:
   - "Éxito, el dispositivo ha sido desenlazado exitosamente"

4. **Error**:
   - "Error, [error message]"

### Focus Order
```
1. Device ID text
2. Status indicator
3. Battery indicator
4. Gestionar button
5. Desenlazar button
```

### Touch Targets
```
Minimum size: 44x44 points
Actual button height: 44px
Spacing between buttons: 8px
Total interactive area: Adequate
```

## Animation Timeline

```
0ms    │ User clicks "Desenlazar"
       │
100ms  │ Button scales down (0.95)
       │
200ms  │ Confirmation dialog fades in
       │
       │ [User reads and confirms]
       │
0ms    │ User clicks "Desenlazar" in dialog
       │
50ms   │ Dialog fades out
       │
100ms  │ Button shows loading state
       │ Text changes to "Desenlazando..."
       │
       │ [Network request in progress]
       │
2000ms │ Success response received
       │
2100ms │ Success dialog fades in
       │
       │ [User clicks OK]
       │
2200ms │ Success dialog fades out
       │
2300ms │ Dashboard refreshes
       │ Card updates with new state
       │
2600ms │ Fade-in animation for updated card
```

---

**Version**: 2.0.1
**Date**: November 16, 2024
**Status**: ✅ Complete

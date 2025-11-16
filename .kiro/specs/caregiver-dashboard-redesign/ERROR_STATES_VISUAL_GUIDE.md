# Error States Visual Guide

## Overview

This guide provides visual representations of all error states implemented in Task 14.1.

---

## Error State Component Layout

```
┌─────────────────────────────────────────┐
│                                         │
│              [ERROR ICON]               │
│           (64x64, colored)              │
│                                         │
│         ┌─────────────────┐             │
│         │   Error Title   │             │
│         └─────────────────┘             │
│                                         │
│    ┌───────────────────────────┐       │
│    │   User-friendly message   │       │
│    │   explaining the error    │       │
│    └───────────────────────────┘       │
│                                         │
│         ┌─────────────────┐             │
│         │  [Retry Button] │             │
│         └─────────────────┘             │
│          (if retryable)                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## Error Categories with Icons

### 1. Network Error (NETWORK)

```
┌─────────────────────────────────────────┐
│                                         │
│              ☁️ (offline)               │
│           cloud-offline-outline         │
│                                         │
│         Error de Conexión               │
│                                         │
│    No se pudo conectar al servidor.    │
│    Por favor, verifica tu conexión     │
│    a internet e intenta nuevamente.    │
│                                         │
│         [ Reintentar ]                  │
│                                         │
└─────────────────────────────────────────┘

Icon: cloud-offline-outline
Color: error[500] (red)
Retryable: ✅ Yes
```

### 2. Permission Error (PERMISSION)

```
┌─────────────────────────────────────────┐
│                                         │
│              🔒 (lock)                  │
│           lock-closed-outline           │
│                                         │
│         Permiso Denegado                │
│                                         │
│    No tienes permiso para realizar     │
│    esta acción.                        │
│                                         │
│         (no retry button)               │
│                                         │
└─────────────────────────────────────────┘

Icon: lock-closed-outline
Color: error[500] (red)
Retryable: ❌ No
```

### 3. Initialization Error (INITIALIZATION)

```
┌─────────────────────────────────────────┐
│                                         │
│              ⚠️ (warning)               │
│            warning-outline              │
│                                         │
│      Error de Inicialización            │
│                                         │
│    Error al inicializar la aplicación. │
│    Por favor, reinicia la aplicación.  │
│                                         │
│         [ Reintentar ]                  │
│                                         │
└─────────────────────────────────────────┘

Icon: warning-outline
Color: error[500] (red)
Retryable: ✅ Yes
```

### 4. Not Found Error (NOT_FOUND)

```
┌─────────────────────────────────────────┐
│                                         │
│              🔍 (search)                │
│            search-outline               │
│                                         │
│           No Encontrado                 │
│                                         │
│    El recurso solicitado no fue        │
│    encontrado.                         │
│                                         │
│         (no retry button)               │
│                                         │
└─────────────────────────────────────────┘

Icon: search-outline
Color: error[500] (red)
Retryable: ❌ No
```

### 5. Unknown Error (UNKNOWN)

```
┌─────────────────────────────────────────┐
│                                         │
│              ⚠️ (alert)                 │
│         alert-circle-outline            │
│                                         │
│               Error                     │
│                                         │
│    Ocurrió un error inesperado.        │
│    Por favor, intenta nuevamente.      │
│                                         │
│         [ Reintentar ]                  │
│                                         │
└─────────────────────────────────────────┘

Icon: alert-circle-outline
Color: error[500] (red)
Retryable: ✅ Yes
```

---

## Screen-Specific Error States

### Dashboard Error State

```
┌─────────────────────────────────────────┐
│  PILDHORA    [Emergency] [Account]     │ ← Header
├─────────────────────────────────────────┤
│  ⚠️ Sin conexión                        │ ← Offline Indicator
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              ☁️                          │
│                                         │
│         Error de Conexión               │
│                                         │
│    No se pudo conectar al servidor.    │
│    Por favor, verifica tu conexión     │
│    a internet e intenta nuevamente.    │
│                                         │
│         [ Reintentar ]                  │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Events List Error State

```
┌─────────────────────────────────────────┐
│  ⚠️ Sin conexión                        │ ← Offline Indicator
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              ☁️                          │
│                                         │
│         Error de Conexión               │
│                                         │
│    No se pudo cargar los eventos.      │
│    Por favor, verifica tu conexión     │
│    a internet e intenta nuevamente.    │
│                                         │
│         [ Reintentar ]                  │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Medications List Error State

```
┌─────────────────────────────────────────┐
│  ⚠️ Sin conexión                        │ ← Offline Indicator
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              ☁️                          │
│                                         │
│         Error de Conexión               │
│                                         │
│    No se pudo cargar los medicamentos. │
│    Por favor, verifica tu conexión     │
│    a internet e intenta nuevamente.    │
│                                         │
│         [ Reintentar ]                  │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Offline Indicator

```
┌─────────────────────────────────────────┐
│  ℹ️  Sin conexión                       │
└─────────────────────────────────────────┘

Background: warning[50] (light yellow)
Border: warning[200] (yellow)
Icon: information-circle
Icon Color: warning[500] (orange)
Text Color: warning[500] (orange)
```

---

## Cached Data Banner

```
┌─────────────────────────────────────────┐
│  ℹ️  Mostrando datos guardados.         │
│     Conéctate para actualizar.          │
└─────────────────────────────────────────┘

Background: warning[50] (light yellow)
Border: warning[200] (yellow)
Icon: information-circle
Icon Color: warning[500] (orange)
Text Color: warning[500] (orange)
```

---

## State Transitions

### Normal Flow

```
┌─────────────┐
│   Loading   │ ← Skeleton loaders
│   State     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Success   │ ← Data displayed
│   State     │
└─────────────┘
```

### Error Flow (No Cached Data)

```
┌─────────────┐
│   Loading   │ ← Skeleton loaders
│   State     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Error    │ ← Error state with retry
│   State     │
└──────┬──────┘
       │
       │ User taps retry
       ▼
┌─────────────┐
│   Loading   │ ← Skeleton loaders
│   State     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Success   │ ← Data displayed
│   State     │
└─────────────┘
```

### Error Flow (With Cached Data)

```
┌─────────────┐
│   Loading   │ ← Skeleton loaders
│   State     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Cached    │ ← Cached data + banner
│    Data     │   "Mostrando datos guardados"
│   State     │
└──────┬──────┘
       │
       │ Connection restored
       ▼
┌─────────────┐
│   Success   │ ← Fresh data, banner removed
│   State     │
└─────────────┘
```

### Offline Flow

```
┌─────────────┐
│   Online    │ ← Normal operation
│   State     │
└──────┬──────┘
       │
       │ Network lost
       ▼
┌─────────────┐
│  Offline    │ ← Offline indicator appears
│  Indicator  │   Cached data loads
└──────┬──────┘
       │
       │ Network restored
       ▼
┌─────────────┐
│   Online    │ ← Indicator disappears
│   State     │   Fresh data syncs
└─────────────┘
```

---

## Color Scheme

### Error States
- **Icon Color**: `colors.error[500]` (red)
- **Title Color**: `colors.gray[900]` (dark gray)
- **Message Color**: `colors.gray[600]` (medium gray)
- **Button**: Primary variant (blue)

### Offline Indicator
- **Background**: `colors.warning[50]` (light yellow)
- **Border**: `colors.warning[200]` (yellow)
- **Icon**: `colors.warning[500]` (orange)
- **Text**: `colors.warning[500]` (orange)

### Cached Data Banner
- **Background**: `colors.warning[50]` (light yellow)
- **Border**: `colors.warning[200]` (yellow)
- **Icon**: `colors.warning[500]` (orange)
- **Text**: `colors.warning[500]` (orange)

---

## Spacing and Layout

### ErrorState Component
```
Padding: spacing.xl (24px)
Icon Size: 64x64
Icon Margin Bottom: spacing.lg (16px)
Title Font Size: typography.fontSize.xl (20px)
Title Margin Bottom: spacing.sm (8px)
Message Font Size: typography.fontSize.base (16px)
Message Margin Bottom: spacing.xl (24px)
Button Min Width: 200px
```

### Offline Indicator
```
Padding Vertical: spacing.sm (8px)
Padding Horizontal: spacing.md (12px)
Icon Size: 20x20
Gap: spacing.sm (8px)
Border Bottom Width: 1px
```

### Cached Data Banner
```
Padding Vertical: spacing.sm (8px)
Padding Horizontal: spacing.md (12px)
Icon Size: 20x20
Gap: spacing.sm (8px)
Border Bottom Width: 1px
```

---

## Accessibility

### Screen Reader Announcements

**Error State**:
```
"Error. [Error Title]. [Error Message]. [Retry Button]"
```

**Offline Indicator**:
```
"Warning. Sin conexión. No hay conexión a internet."
```

**Cached Data Banner**:
```
"Information. Mostrando datos guardados. Conéctate para actualizar."
```

### Touch Targets

- **Retry Button**: Minimum 44x44 points ✅
- **Icon**: Not interactive (visual only)
- **Text**: Not interactive (informational)

---

## Animation States

### Error State Appearance
```
Fade In: 300ms
Scale: 0.95 → 1.0
Opacity: 0 → 1
```

### Retry Button Press
```
Scale: 1.0 → 0.95 → 1.0
Duration: 150ms
```

### Offline Indicator Slide
```
Slide Down: 200ms
From: translateY(-100%)
To: translateY(0)
```

### Cached Data Banner Slide
```
Slide Down: 200ms
From: translateY(-100%)
To: translateY(0)
```

---

## Responsive Behavior

### Mobile (< 768px)
- Error state takes full width
- Icon size: 64x64
- Button: Full width
- Padding: spacing.lg

### Tablet (768px - 1024px)
- Error state centered
- Icon size: 64x64
- Button: Min width 200px
- Padding: spacing.xl

### Desktop (> 1024px)
- Error state centered
- Icon size: 64x64
- Button: Min width 200px
- Padding: spacing.xl

---

## Dark Mode (Future Enhancement)

### Error States
- **Icon Color**: `colors.error[400]` (lighter red)
- **Title Color**: `colors.gray[100]` (light gray)
- **Message Color**: `colors.gray[400]` (medium gray)
- **Background**: `colors.gray[900]` (dark)

### Offline Indicator
- **Background**: `colors.warning[900]` (dark yellow)
- **Icon**: `colors.warning[400]` (lighter orange)
- **Text**: `colors.warning[400]` (lighter orange)

---

## Examples in Context

### Dashboard with Network Error

```
┌─────────────────────────────────────────┐
│  PILDHORA    [Emergency] [Account]     │
├─────────────────────────────────────────┤
│  ⚠️ Sin conexión                        │
├─────────────────────────────────────────┤
│                                         │
│              ☁️                          │
│                                         │
│         Error de Conexión               │
│                                         │
│    No se pudo conectar al servidor.    │
│    Por favor, verifica tu conexión     │
│    a internet e intenta nuevamente.    │
│                                         │
│         [ Reintentar ]                  │
│                                         │
└─────────────────────────────────────────┘
```

### Events with Cached Data

```
┌─────────────────────────────────────────┐
│  ⚠️ Sin conexión                        │
├─────────────────────────────────────────┤
│  ℹ️  Mostrando datos guardados.         │
│     Conéctate para actualizar.          │
├─────────────────────────────────────────┤
│  [Search: ___________] [Filters]       │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐ │
│  │ 🔵 Medicamento Creado             │ │
│  │ Aspirina                          │ │
│  │ Hace 2 horas                      │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🟢 Dosis Tomada                   │ │
│  │ Ibuprofeno                        │ │
│  │ Hace 5 horas                      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Medications with Permission Error

```
┌─────────────────────────────────────────┐
│                                         │
│              🔒                          │
│                                         │
│         Permiso Denegado                │
│                                         │
│    No tienes permiso para ver los      │
│    medicamentos de este paciente.      │
│                                         │
│         (no retry button)               │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

### Visual Testing
- [ ] Error icon displays correctly
- [ ] Error title is readable
- [ ] Error message is clear
- [ ] Retry button is visible (when retryable)
- [ ] Colors match design system
- [ ] Spacing is consistent
- [ ] Layout is centered

### Interaction Testing
- [ ] Retry button is tappable
- [ ] Retry button shows press feedback
- [ ] Error state clears on retry
- [ ] Loading state shows after retry
- [ ] Success state shows after successful retry

### Accessibility Testing
- [ ] Screen reader announces error
- [ ] Retry button has accessibility label
- [ ] Touch target is minimum 44x44
- [ ] Color contrast meets WCAG AA
- [ ] Focus order is logical

---

## Conclusion

This visual guide provides a comprehensive reference for all error states implemented in Task 14.1. Use this guide when:

1. Implementing new error states
2. Reviewing error handling
3. Testing error scenarios
4. Designing new features
5. Training new developers

All error states follow consistent patterns for excellent user experience.

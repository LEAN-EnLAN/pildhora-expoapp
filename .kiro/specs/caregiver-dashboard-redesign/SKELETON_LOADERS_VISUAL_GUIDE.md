# Skeleton Loaders Visual Guide

## Overview

This guide provides visual representations of all skeleton loader components used in the caregiver dashboard.

## Dashboard Loading State

```
┌─────────────────────────────────────────────────────────┐
│                  CaregiverHeader                        │
├─────────────────────────────────────────────────────────┤
│  PatientSelectorSkeleton                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ ████████ │  │ ████████ │  │ ████████ │             │
│  │ ● ██████ │  │ ● ██████ │  │ ● ██████ │             │
│  └──────────┘  └──────────┘  └──────────┘             │
├─────────────────────────────────────────────────────────┤
│  DeviceConnectivityCardSkeleton                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ████████████                                      │ │
│  │ ██████                                            │ │
│  │                                                   │ │
│  │ ██████        ██████                              │ │
│  │ ● ████        ● ████                              │ │
│  │                                                   │ │
│  │ ████████████████████████████████████████████████  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  LastMedicationStatusCardSkeleton                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ● ████████                                        │ │
│  │                                                   │ │
│  │ ████████████████                                  │ │
│  │ ● ██████████████████                              │ │
│  │ ● ████████████                                    │ │
│  │ ● ██████                                          │ │
│  │                                                   │ │
│  │ ████████████████████                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  QuickActionsPanelSkeleton                              │
│  ████████████                                           │
│                                                         │
│  ┌──────────┬──────────┐  ┌──────────┬──────────┐     │
│  │    ●●    │    ●●    │  │    ●●    │    ●●    │     │
│  │   ●  ●   │   ●  ●   │  │   ●  ●   │   ●  ●   │     │
│  │    ●●    │    ●●    │  │    ●●    │    ●●    │     │
│  │          │          │  │          │          │     │
│  │ ████████ │ ████████ │  │ ████████ │ ████████ │     │
│  └──────────┴──────────┘  └──────────┴──────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### 1. PatientSelectorSkeleton

```
Label: ████████

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ████████████ │  │ ████████████ │  │ ████████████ │
│ ● ██████████ │  │ ● ██████████ │  │ ● ██████████ │
└──────────────┘  └──────────────┘  └──────────────┘
   Patient 1         Patient 2         Patient 3
```

**Structure**:
- Label: 80px × 14px
- 3 chips (160-200px width)
- Each chip contains:
  - Name: 70% width × 16px
  - Status row: 8px dot + 80px × 12px text

### 2. DeviceConnectivityCardSkeleton

```
┌─────────────────────────────────────────────┐
│ Title: ████████████ (60% width)             │
│                                             │
│ Device ID: ██████ (40% width)               │
│                                             │
│ Status Row:                                 │
│ ┌──────────────┐    ┌──────────────┐       │
│ │ Label: ████  │    │ Label: ████  │       │
│ │ ● Value: ███ │    │ ● Value: ███ │       │
│ └──────────────┘    └──────────────┘       │
│                                             │
│ Button: ████████████████████████████████    │
└─────────────────────────────────────────────┘
```

**Structure**:
- Title: 60% width × 20px
- Device ID: 40% width × 14px
- 2 info items (status, battery)
- Button: 100% width × 36px

### 3. LastMedicationStatusCardSkeleton

```
┌─────────────────────────────────────────────┐
│ Header:                                     │
│ ● ████████████                              │
│                                             │
│ Event Badge: ████████████████ (40% width)   │
│                                             │
│ Medication: ● ██████████████████ (70%)      │
│ Patient: ● ████████████ (50%)               │
│ Timestamp: ● ██████ (40%)                   │
│                                             │
│ Button: ████████████████ (60% width)        │
└─────────────────────────────────────────────┘
```

**Structure**:
- Header: 20px circle + 120px × 20px text
- Badge: 40% width × 32px (full border radius)
- Info rows: icon (16-18px) + text (various widths)
- Button: 60% width × 36px

### 4. QuickActionsPanelSkeleton

```
Section Title: ████████████

Mobile (2×2 Grid):
┌──────────┬──────────┐
│    ●●    │    ●●    │
│   ●  ●   │   ●  ●   │
│    ●●    │    ●●    │
│          │          │
│ ████████ │ ████████ │
└──────────┴──────────┘
┌──────────┬──────────┐
│    ●●    │    ●●    │
│   ●  ●   │   ●  ●   │
│    ●●    │    ●●    │
│          │          │
│ ████████ │ ████████ │
└──────────┴──────────┘

Tablet (1×4 Grid):
┌────┬────┬────┬────┐
│ ●● │ ●● │ ●● │ ●● │
│ ██ │ ██ │ ██ │ ██ │
└────┴────┴────┴────┘
```

**Structure**:
- Title: 40% width × 24px
- 4 cards in responsive grid
- Each card:
  - Icon circle: 64px × 64px (full border radius)
  - Title: 70% width × 16px

### 5. MedicationCardSkeleton (Existing)

```
┌─────────────────────────────────────────────┐
│ ┌────┐  ████████████████ (70%)              │
│ │ ██ │  ████████████ (50%)                  │
│ └────┘                                      │
│                                             │
│ ┌────────┐ ┌────────┐                      │
│ │ ██████ │ │ ██████ │  (Time chips)        │
│ └────────┘ └────────┘                      │
│                                             │
│ ████████████ (60%)  (Schedule info)         │
└─────────────────────────────────────────────┘
```

### 6. EventCardSkeleton (Existing)

```
┌─────────────────────────────────────────────┐
│ ┌────┐  ████████████████████ (80%)          │
│ │ ██ │  ██████████████ (60%)                │
│ └────┘  ██████ (40%)                        │
└─────────────────────────────────────────────┘
```

## Animation Behavior

### Shimmer Effect

All skeleton elements pulse with opacity:

```
Time:     0ms    500ms   1000ms  1500ms  2000ms
Opacity:  0.3 → 0.7  →  0.3  →  0.7  →  0.3
          ▁▁▁   ▔▔▔    ▁▁▁    ▔▔▔    ▁▁▁
```

- **Duration**: 1000ms per cycle
- **Range**: 0.3 (dim) to 0.7 (bright)
- **Loop**: Infinite
- **Easing**: Linear

### Fade-In Transition

When real content loads:

```
Skeleton State → Fade Out (instant) → Real Content Fade In

Time:     0ms              400ms
Opacity:  0  ──────────→   1
          ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▔▔▔
```

- **Duration**: 400ms
- **Range**: 0 to 1
- **Easing**: Default (ease-in-out)

## Responsive Behavior

### Mobile (< 768px)

- QuickActionsPanel: 2×2 grid (48% width per card)
- PatientSelector: Horizontal scroll
- Cards: Full width

### Tablet (≥ 768px)

- QuickActionsPanel: 1×4 grid (23% width per card)
- PatientSelector: Horizontal scroll
- Cards: Full width

## Color Specifications

All skeleton elements use:
- **Background**: `colors.gray[200]` (#E5E7EB)
- **Shimmer**: Opacity animation (no color change)
- **Container**: Matches real component background

## Spacing

All skeleton components use design system spacing tokens:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px

## Border Radius

Skeleton elements match real component border radius:
- **sm**: 4px (small elements)
- **md**: 8px (cards, inputs)
- **lg**: 12px (large cards)
- **xl**: 16px (buttons)
- **full**: 9999px (circles, pills)

## Usage Context

### When to Show Skeletons

1. **Initial page load**: Show skeletons until first data arrives
2. **Data refresh**: Optional (can use pull-to-refresh spinner instead)
3. **Navigation**: Show skeletons when navigating to new patient
4. **Network recovery**: Show skeletons when reconnecting

### When NOT to Show Skeletons

1. **Subsequent updates**: Use real-time updates without skeletons
2. **Background refresh**: Keep showing real data
3. **Cached data available**: Show cached data instead
4. **Error states**: Show error UI instead of skeletons

## Accessibility

Skeleton loaders:
- Are purely visual (no ARIA labels needed)
- Don't interfere with screen readers
- Are replaced by accessible content when loaded
- Don't trap focus or keyboard navigation

## Performance

All skeleton components:
- Use native driver for animations (60fps)
- Are lightweight (no complex calculations)
- Don't cause layout shifts
- Render quickly (<16ms)

## Testing Checklist

Visual verification:
- [ ] Skeleton matches real component layout
- [ ] Shimmer animation is smooth
- [ ] Fade-in transition is smooth
- [ ] Responsive layout works correctly
- [ ] Colors match design system
- [ ] Spacing is consistent
- [ ] Border radius matches real components

Functional verification:
- [ ] Skeletons appear during loading
- [ ] Skeletons disappear when data loads
- [ ] No layout shift when content appears
- [ ] Animation performance is 60fps
- [ ] Works on both iOS and Android
- [ ] Works on different screen sizes

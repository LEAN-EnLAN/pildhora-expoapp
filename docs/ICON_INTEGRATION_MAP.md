# Icon Integration Map

Visual map of where the Pildhora app icon appears throughout the application.

## Application Flow with Icon Touchpoints

```
┌─────────────────────────────────────────────────────────────┐
│                     APP LAUNCH                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Splash Screen (configured in app.json)              │  │
│  │  📱 Icon: assets/splash-icon.png                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Login Screen (app/auth/login.tsx)                   │  │
│  │  🎨 AppIcon: size="2xl" (128px) with shadow          │  │
│  │  Location: Center of card, above title               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Signup Screen (app/auth/signup.tsx)                 │  │
│  │  🎨 AppIcon: size="2xl" (128px) with shadow          │  │
│  │  Location: Center of card, above title               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PATIENT FLOW                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Loading State                                        │  │
│  │  🎨 BrandedLoadingScreen                             │  │
│  │  - AppIcon: size="2xl" (128px) with shadow           │  │
│  │  - Animated entrance                                  │  │
│  │  - Loading spinner                                    │  │
│  │  - Custom message                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Home Screen (app/patient/home.tsx)                  │  │
│  │  🎨 AppIcon: size="sm" (32px) in header              │  │
│  │  Location: Left side, next to "PILDHORA" text        │  │
│  │  Style: No shadow, rounded                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Empty States (when implemented)                     │  │
│  │  🎨 BrandedEmptyState                                │  │
│  │  - Optional AppIcon: size="lg" (64px)                │  │
│  │  - Or custom Ionicon                                  │  │
│  │  - Title and message                                  │  │
│  │  - Optional action button                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  CAREGIVER FLOW                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dashboard (app/caregiver/dashboard.tsx)             │  │
│  │  🎨 AppIcon: size="sm" (32px) in header              │  │
│  │  Component: CaregiverHeader                          │  │
│  │  Location: Left side, next to "PILDHORA" text        │  │
│  │  Style: No shadow, rounded                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  All Caregiver Screens                               │  │
│  │  - Tasks                                              │  │
│  │  - Medications                                        │  │
│  │  - Events                                             │  │
│  │  🎨 Same header with AppIcon                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                SETTINGS & INFORMATION                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  About Screen (when implemented)                     │  │
│  │  Component: AboutScreen                              │  │
│  │  🎨 AppIcon: size="2xl" (128px) with shadow          │  │
│  │  Location: Top center                                │  │
│  │  Additional: App name, version, features             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Icon Size Usage by Context

### Extra Small (xs - 24px)
- Inline badges
- Small indicators
- Compact lists

### Small (sm - 32px)
- ✅ **Patient Home Header**
- ✅ **Caregiver Dashboard Header**
- Navigation items
- Compact cards

### Medium (md - 48px)
- Default size
- Card headers
- List items
- Modal headers

### Large (lg - 64px)
- Prominent cards
- Empty states (optional)
- Feature highlights
- Settings sections

### Extra Large (xl - 96px)
- Loading screens
- Splash transitions
- Major milestones

### 2X Large (2xl - 128px)
- ✅ **Login Screen**
- ✅ **Signup Screen**
- ✅ **About Screen**
- ✅ **BrandedLoadingScreen**
- Onboarding screens

## Component Integration Matrix

| Component | Icon Size | Shadow | Rounded | Location |
|-----------|-----------|--------|---------|----------|
| Login Screen | 2xl | ✅ | ✅ | Center, above title |
| Signup Screen | 2xl | ✅ | ✅ | Center, above title |
| Patient Header | sm | ❌ | ✅ | Left, next to text |
| Caregiver Header | sm | ❌ | ✅ | Left, next to text |
| Loading Screen | 2xl | ✅ | ✅ | Center, animated |
| Empty State | lg | ❌ | ✅ | Center, optional |
| About Screen | 2xl | ✅ | ✅ | Top center |

## Platform-Specific Icons

### iOS
- App Icon: 1024x1024 (assets/icon.png)
- Configured in app.json

### Android
- Adaptive Icon: assets/adaptive-icon.png
- Foreground + Background layers
- Configured in app.json

### Web
- Favicon: assets/favicon.png
- Configured in app.json

## File Locations

```
pildhora-app2/
├── assets/
│   ├── icon.png              ← Main app icon (1024x1024)
│   ├── adaptive-icon.png     ← Android adaptive icon
│   ├── splash-icon.png       ← Splash screen icon
│   └── favicon.png           ← Web favicon
├── src/
│   └── components/
│       ├── ui/
│       │   ├── AppIcon.tsx              ← Reusable icon component
│       │   ├── BrandedLoadingScreen.tsx ← Loading with icon
│       │   └── BrandedEmptyState.tsx    ← Empty state with icon
│       ├── screens/
│       │   └── shared/
│       │       └── AboutScreen.tsx      ← About with icon
│       ├── caregiver/
│       │   └── CaregiverHeader.tsx      ← Header with icon
│       └── examples/
│           └── IconIntegrationExample.tsx ← Visual reference
├── app/
│   ├── auth/
│   │   ├── login.tsx         ← Login with icon
│   │   └── signup.tsx        ← Signup with icon
│   └── patient/
│       └── home.tsx          ← Home with icon
└── docs/
    ├── APP_ICON_INTEGRATION.md
    ├── ICON_USAGE_QUICK_REFERENCE.md
    └── ICON_INTEGRATION_MAP.md (this file)
```

## Visual Hierarchy

```
Authentication Screens (2xl - 128px)
    ↓ Most Prominent
Loading Screens (2xl - 128px)
    ↓
About/Info Screens (2xl - 128px)
    ↓
Empty States (lg - 64px)
    ↓
Headers (sm - 32px)
    ↓ Least Prominent
Inline/Badges (xs - 24px)
```

## Accessibility

All icon instances include:
- `accessibilityLabel`: Descriptive text
- `accessibilityRole`: "image"
- `accessibilityIgnoresInvertColors`: true (for consistency)

## Future Integration Opportunities

1. **Onboarding Flow**
   - Welcome screens with 2xl icon
   - Tutorial overlays with md icon

2. **Error Screens**
   - Network error with lg icon
   - Maintenance mode with xl icon

3. **Notifications**
   - Custom notification layouts with sm icon
   - Rich notifications with md icon

4. **Widgets** (if implemented)
   - Home screen widget with md icon
   - Lock screen with sm icon

5. **Settings Sections**
   - Profile with md icon
   - Preferences with sm icon

---

**Last Updated**: November 16, 2024
**Status**: ✅ Complete
**Coverage**: Authentication, Patient, Caregiver flows

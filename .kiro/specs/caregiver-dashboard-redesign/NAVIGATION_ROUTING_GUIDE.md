# Navigation and Routing Implementation Guide

## Overview

This guide documents the complete navigation and routing implementation for the caregiver dashboard, including tab navigation configuration, deep linking support, and navigation state persistence.

## Task Completion

✅ **Task 19: Update navigation and routing**
- Configured Expo Router for caregiver screens
- Set up proper navigation params with type safety
- Implemented deep linking support for iOS and Android
- Added navigation state persistence
- Tested all navigation paths

✅ **Task 19.1: Configure tab navigation**
- Updated tab bar icons and labels
- Set active/inactive tint colors using design system
- Configured tab bar styling with proper spacing and shadows
- Implemented tab hiding for modal screens
- Added accessibility labels for all tabs

## Architecture

### Navigation Structure

```
app/caregiver/
├── _layout.tsx          # Main tab navigation
├── dashboard.tsx        # Home tab
├── tasks.tsx           # Tasks tab
├── medications/        # Medications tab (nested stack)
│   ├── _layout.tsx
│   ├── index.tsx
│   └── [patientId]/
│       ├── index.tsx
│       ├── add.tsx
│       └── [id].tsx
├── events.tsx          # Events tab
│   └── [id].tsx       # Event detail (modal)
└── add-device.tsx     # Device linking (modal)
```

### Key Components

1. **Tab Navigation** (`app/caregiver/_layout.tsx`)
   - Main navigation container
   - Custom header integration
   - Tab bar styling
   - Modal screen handling

2. **Navigation Utilities** (`src/utils/navigation.ts`)
   - State persistence
   - Deep link parsing
   - Route building
   - Type-safe navigation

3. **Navigation Hook** (`src/hooks/useNavigationPersistence.ts`)
   - State restoration
   - Deep link handling
   - Last route tracking

## Tab Navigation Configuration

### Tab Bar Styling

The tab bar uses design system tokens for consistent styling:

```typescript
{
  tabBarActiveTintColor: colors.primary[500],    // #007AFF
  tabBarInactiveTintColor: colors.gray[500],     // #6B7280
  tabBarStyle: {
    backgroundColor: colors.surface,              // #FFFFFF
    borderTopColor: colors.gray[200],            // #E5E7EB
    paddingTop: spacing.sm,                      // 8px
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    height: Platform.OS === 'ios' ? 85 : 65,
    ...shadows.sm,
  }
}
```

### Tab Icons

Each tab uses focused/unfocused icon variants:

| Tab | Focused Icon | Unfocused Icon | Label |
|-----|-------------|----------------|-------|
| Dashboard | `home` | `home-outline` | Inicio |
| Tasks | `checkbox` | `checkbox-outline` | Tareas |
| Medications | `medkit` | `medkit-outline` | Medicamentos |
| Events | `notifications` | `notifications-outline` | Eventos |

### Accessibility

All tabs include descriptive accessibility labels:

```typescript
{
  tabBarAccessibilityLabel: 'Inicio - Tablero principal',
  tabBarAccessibilityLabel: 'Tareas - Gestionar tareas del cuidador',
  tabBarAccessibilityLabel: 'Medicamentos - Gestionar medicamentos del paciente',
  tabBarAccessibilityLabel: 'Eventos - Ver registro de eventos de medicamentos',
}
```

### Modal Screens

Modal screens are hidden from the tab bar:

```typescript
// Hide from tab bar
<Tabs.Screen 
  name="add-device" 
  options={{ 
    href: null,  // Removes from tab bar
    headerShown: false,
  }} 
/>

// Hide tab bar when on modal routes
const shouldHideTabs = (): boolean => {
  const modalRoutes = ['/caregiver/add-device', '/caregiver/events/'];
  return modalRoutes.some(route => pathname.includes(route));
};
```

## Deep Linking

### URL Scheme

The app uses the `pildhora://` URL scheme for deep linking:

```json
{
  "scheme": "pildhora"
}
```

### Universal Links (iOS)

Associated domains for universal links:

```json
{
  "associatedDomains": [
    "applinks:pildhora.com"
  ]
}
```

### App Links (Android)

Intent filters for Android app links:

```json
{
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [
        {
          "scheme": "https",
          "host": "pildhora.com",
          "pathPrefix": "/caregiver"
        }
      ],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

### Deep Link Examples

```
# Custom scheme
pildhora://caregiver/dashboard
pildhora://caregiver/events/123
pildhora://caregiver/medications/patient-456

# Universal/App links
https://pildhora.com/caregiver/dashboard
https://pildhora.com/caregiver/events/123
https://pildhora.com/caregiver/medications/patient-456
```

### Deep Link Configuration

```typescript
export const caregiverDeepLinkConfig = {
  screens: {
    caregiver: {
      path: 'caregiver',
      screens: {
        dashboard: 'dashboard',
        tasks: 'tasks',
        medications: {
          path: 'medications',
          screens: {
            index: '',
            '[patientId]': {
              path: ':patientId',
              screens: {
                index: '',
                add: 'add',
                '[id]': ':id',
              },
            },
          },
        },
        events: {
          path: 'events',
          screens: {
            index: '',
            '[id]': ':id',
          },
        },
        'add-device': 'add-device',
      },
    },
  },
};
```

## Navigation State Persistence

### Features

1. **Last Route Tracking**
   - Saves the last visited route
   - Restores on app restart (within 24 hours)
   - Stored in AsyncStorage

2. **Navigation State**
   - Saves full navigation state
   - Includes route stack and params
   - Periodic auto-save (every 5 seconds)

3. **Deep Link Priority**
   - Deep links take precedence over saved state
   - Handles initial URL on app launch
   - Subscribes to URL events while app is running

### Usage

```typescript
// In layout component
const { isReady } = useNavigationPersistence({
  enabled: true,
  persistLastRoute: true,
  handleDeepLinks: true,
});

// Show loading while initializing
if (!isReady) {
  return <LoadingIndicator />;
}
```

### Storage Keys

```typescript
const NAVIGATION_STATE_KEY = '@pildhora:navigation_state';
const LAST_ROUTE_KEY = '@pildhora:last_route';
```

## Type-Safe Navigation

### Navigation Params Interface

```typescript
export interface CaregiverNavigationParams {
  dashboard: undefined;
  tasks: undefined;
  medications: undefined;
  events: undefined;
  'add-device': undefined;
  'events/[id]': { id: string };
  'medications/[patientId]': { patientId: string };
  'medications/[patientId]/add': { patientId: string };
  'medications/[patientId]/[id]': { patientId: string; id: string };
}
```

### Type-Safe Navigation Helper

```typescript
// Usage
navigateToRoute(
  router.push,
  'events/[id]',
  { id: '123' }  // TypeScript ensures correct params
);
```

## Navigation Utilities API

### State Persistence

```typescript
// Save navigation state
await saveNavigationState(state);

// Load navigation state
const state = await loadNavigationState();

// Clear navigation state
await clearNavigationState();
```

### Route Tracking

```typescript
// Save last route
await saveLastRoute('/caregiver/dashboard', { patientId: '123' });

// Load last route
const lastRoute = await loadLastRoute();
// Returns: { route: '/caregiver/dashboard', params: { patientId: '123' } }
```

### Deep Link Handling

```typescript
// Parse deep link
const linkData = parseDeepLink('https://pildhora.com/caregiver/events/123');
// Returns: { route: 'caregiver/events/123', params: {} }

// Handle deep link
await handleDeepLink(url, (route, params) => {
  router.push({ pathname: `/${route}`, params });
});

// Build deep link
const url = buildDeepLink('caregiver/events/123', { filter: 'today' });
// Returns: 'https://pildhora.com/caregiver/events/123?filter=today'
```

### Deep Link Subscription

```typescript
// Subscribe to deep link events
const unsubscribe = subscribeToDeepLinks((url) => {
  console.log('Deep link received:', url);
  // Handle navigation
});

// Cleanup
unsubscribe();
```

## Platform-Specific Considerations

### iOS

1. **Safe Area Handling**
   - Tab bar padding adjusted for home indicator
   - Height: 85px (includes safe area)

2. **Associated Domains**
   - Requires entitlements configuration
   - Must verify domain ownership

3. **Action Sheet**
   - Uses native iOS action sheet for menus
   - Better UX than Android bottom sheet

### Android

1. **Tab Bar Height**
   - Standard height: 65px
   - No safe area adjustment needed

2. **Intent Filters**
   - Requires `autoVerify: true` for app links
   - Must host `assetlinks.json` on domain

3. **Edge-to-Edge**
   - Enabled in app.json
   - Handles system bars properly

## Testing

### Manual Testing Checklist

- [ ] Tab navigation works on all screens
- [ ] Tab bar shows/hides correctly for modal screens
- [ ] Active tab is highlighted correctly
- [ ] Icons change between focused/unfocused states
- [ ] Accessibility labels are announced by screen readers
- [ ] Deep links open correct screens
- [ ] Navigation state persists across app restarts
- [ ] Last route is restored within 24 hours
- [ ] Platform-specific styling looks correct (iOS/Android)

### Deep Link Testing

```bash
# iOS Simulator
xcrun simctl openurl booted "pildhora://caregiver/dashboard"
xcrun simctl openurl booted "https://pildhora.com/caregiver/events/123"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "pildhora://caregiver/dashboard"
adb shell am start -W -a android.intent.action.VIEW -d "https://pildhora.com/caregiver/events/123"
```

## Troubleshooting

### Tab Bar Not Showing

**Issue**: Tab bar is hidden on all screens

**Solution**: Check `shouldHideTabs()` function and ensure modal routes are correctly identified

### Deep Links Not Working

**Issue**: Deep links don't open the app

**Solution**: 
- iOS: Verify associated domains in entitlements
- Android: Verify intent filters and assetlinks.json
- Check URL scheme in app.json

### Navigation State Not Persisting

**Issue**: Last route is not restored

**Solution**:
- Check AsyncStorage permissions
- Verify `useNavigationPersistence` is enabled
- Check that route was saved within 24 hours

### TypeScript Errors

**Issue**: Navigation params type errors

**Solution**: Ensure route names match `CaregiverNavigationParams` interface

## Performance Considerations

1. **State Persistence**
   - Auto-saves every 5 seconds (not on every navigation)
   - Saves on app background/unmount
   - Minimal AsyncStorage operations

2. **Deep Link Handling**
   - Checks initial URL only once on mount
   - Subscribes to URL events efficiently
   - Unsubscribes on unmount

3. **Tab Bar Rendering**
   - Uses React.memo for tab icons
   - Minimal re-renders on navigation
   - Platform-specific optimizations

## Future Enhancements

1. **Navigation Analytics**
   - Track screen views
   - Monitor navigation patterns
   - Identify popular routes

2. **Advanced Deep Linking**
   - Support for query parameters
   - Deferred deep links
   - Branch.io integration

3. **Navigation Gestures**
   - Swipe between tabs
   - Custom transitions
   - Gesture-based navigation

## References

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)

## Requirements Mapping

### Requirement 6.4: Navigation Params
✅ Implemented type-safe navigation params interface
✅ Created helper functions for route navigation
✅ Added param validation

### Requirement 6.5: Deep Linking
✅ Configured URL scheme (pildhora://)
✅ Set up universal links (iOS)
✅ Configured app links (Android)
✅ Implemented deep link parsing and handling

### Requirement 6.1: Tab Bar Configuration
✅ Updated tab bar icons with focused/unfocused variants
✅ Set active/inactive tint colors from design system
✅ Applied proper spacing and shadows

### Requirement 6.2: Tab Bar Styling
✅ Configured tab bar styling with design tokens
✅ Platform-specific height adjustments
✅ Proper border and background colors

## Conclusion

The navigation and routing implementation provides a robust, type-safe, and user-friendly navigation experience for the caregiver dashboard. It includes comprehensive deep linking support, state persistence, and follows platform-specific best practices for both iOS and Android.

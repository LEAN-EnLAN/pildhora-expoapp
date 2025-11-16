# Navigation and Routing Quick Reference

## Tab Navigation

### Tab Configuration

```typescript
// Active/Inactive colors
tabBarActiveTintColor: colors.primary[500]    // #007AFF
tabBarInactiveTintColor: colors.gray[500]     // #6B7280

// Tab bar styling
backgroundColor: colors.surface               // #FFFFFF
borderTopColor: colors.gray[200]             // #E5E7EB
height: Platform.OS === 'ios' ? 85 : 65
```

### Tab Icons

| Tab | Icon (Focused) | Icon (Unfocused) |
|-----|---------------|------------------|
| Dashboard | `home` | `home-outline` |
| Tasks | `checkbox` | `checkbox-outline` |
| Medications | `medkit` | `medkit-outline` |
| Events | `notifications` | `notifications-outline` |

### Hide Tab Bar

```typescript
// For modal screens
options={{ href: null }}

// Dynamic hiding
const shouldHideTabs = () => {
  return pathname.includes('/add-device') || pathname.includes('/events/');
};
```

## Deep Linking

### URL Formats

```bash
# Custom scheme
pildhora://caregiver/dashboard
pildhora://caregiver/events/123

# Universal/App links
https://pildhora.com/caregiver/dashboard
https://pildhora.com/caregiver/events/123
```

### Test Deep Links

```bash
# iOS
xcrun simctl openurl booted "pildhora://caregiver/dashboard"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "pildhora://caregiver/dashboard"
```

## Navigation Utilities

### State Persistence

```typescript
// Save state
await saveNavigationState(state);

// Load state
const state = await loadNavigationState();

// Save last route
await saveLastRoute('/caregiver/dashboard', { patientId: '123' });

// Load last route
const lastRoute = await loadLastRoute();
```

### Deep Link Handling

```typescript
// Parse URL
const { route, params } = parseDeepLink(url);

// Handle deep link
await handleDeepLink(url, (route, params) => {
  router.push({ pathname: `/${route}`, params });
});

// Build deep link
const url = buildDeepLink('caregiver/events/123', { filter: 'today' });
```

### Subscribe to Deep Links

```typescript
const unsubscribe = subscribeToDeepLinks((url) => {
  // Handle URL
});

// Cleanup
unsubscribe();
```

## Navigation Hook

### Usage

```typescript
const { isReady } = useNavigationPersistence({
  enabled: true,
  persistLastRoute: true,
  handleDeepLinks: true,
});

if (!isReady) {
  return <LoadingIndicator />;
}
```

## Type-Safe Navigation

### Navigation Params

```typescript
interface CaregiverNavigationParams {
  dashboard: undefined;
  tasks: undefined;
  medications: undefined;
  events: undefined;
  'events/[id]': { id: string };
  'medications/[patientId]': { patientId: string };
}
```

### Navigate with Types

```typescript
navigateToRoute(
  router.push,
  'events/[id]',
  { id: '123' }
);
```

## Platform Differences

### iOS
- Tab bar height: 85px (includes safe area)
- Uses native action sheets
- Requires associated domains

### Android
- Tab bar height: 65px
- Uses bottom sheets
- Requires intent filters

## Storage Keys

```typescript
'@pildhora:navigation_state'  // Full navigation state
'@pildhora:last_route'         // Last visited route
```

## Common Routes

```typescript
'/caregiver/dashboard'                    // Dashboard
'/caregiver/tasks'                        // Tasks
'/caregiver/medications'                  // Medications list
'/caregiver/medications/[patientId]'      // Patient medications
'/caregiver/medications/[patientId]/add'  // Add medication
'/caregiver/events'                       // Events registry
'/caregiver/events/[id]'                  // Event detail
'/caregiver/add-device'                   // Device linking
```

## Accessibility

```typescript
// Tab accessibility labels
tabBarAccessibilityLabel: 'Inicio - Tablero principal'
tabBarAccessibilityLabel: 'Tareas - Gestionar tareas del cuidador'
tabBarAccessibilityLabel: 'Medicamentos - Gestionar medicamentos del paciente'
tabBarAccessibilityLabel: 'Eventos - Ver registro de eventos de medicamentos'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tab bar not showing | Check `shouldHideTabs()` logic |
| Deep links not working | Verify URL scheme and domain config |
| State not persisting | Check AsyncStorage permissions |
| TypeScript errors | Verify params match interface |

## Files Modified

- ✅ `app/caregiver/_layout.tsx` - Tab navigation config
- ✅ `app.json` - Deep linking config
- ✅ `src/utils/navigation.ts` - Navigation utilities
- ✅ `src/hooks/useNavigationPersistence.ts` - Persistence hook

## Requirements Met

- ✅ 6.1: Tab bar icons and labels
- ✅ 6.2: Active/inactive tint colors
- ✅ 6.4: Navigation params
- ✅ 6.5: Deep linking support

# Visual Enhancements Quick Reference

## Skeleton Loaders

### Import
```typescript
import {
  DeviceConnectivityCardSkeleton,
  LastMedicationStatusCardSkeleton,
  QuickActionsPanelSkeleton,
  PatientSelectorSkeleton
} from '../../src/components/caregiver/skeletons';
```

### Usage
```typescript
{loading ? <DeviceConnectivityCardSkeleton /> : <DeviceConnectivityCard {...props} />}
```

## Toast Notifications

### Import
```typescript
import { Toast, ToastType } from '../../src/components/ui';
```

### Usage
```typescript
<Toast
  message="Operation successful"
  type="success"  // 'success' | 'error' | 'info' | 'warning'
  autoDismiss={true}
  duration={3000}
  onDismiss={() => setShowToast(false)}
/>
```

## Loading Spinner

### Import
```typescript
import { LoadingSpinner } from '../../src/components/ui';
```

### Usage
```typescript
<LoadingSpinner 
  size="md"  // 'sm' | 'md' | 'lg'
  color={colors.primary[500]} 
/>
```

## Animated List Items

### Import
```typescript
import { AnimatedListItem } from '../../src/components/ui';
```

### Usage
```typescript
const renderItem = ({ item, index }) => (
  <AnimatedListItem index={index} delay={50}>
    <YourComponent {...item} />
  </AnimatedListItem>
);
```

## Card Press Animations

Cards automatically animate when `onPress` prop is provided:

```typescript
<Card 
  variant="elevated"
  onPress={() => handlePress()}
>
  {/* Content */}
</Card>
```

## Animation Timings

- **Fade-in**: 300ms
- **Press feedback**: 100-150ms
- **Toast entrance**: 300ms
- **Toast exit**: 200ms
- **List stagger**: 50ms delay per item

## Performance Tips

1. Always use `useNativeDriver: true`
2. Create animation values with `useRef`
3. Clean up animations in useEffect return
4. Memoize callbacks with `useCallback`
5. Use staggered delays for lists

## Accessibility

All components include:
- Proper accessibility roles
- Screen reader labels
- Live region announcements (toasts)
- Focus management support

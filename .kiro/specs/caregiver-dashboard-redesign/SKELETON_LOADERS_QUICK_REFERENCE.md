# Skeleton Loaders Quick Reference

## Import Statements

### Caregiver-Specific Skeletons

```typescript
import {
  DeviceConnectivityCardSkeleton,
  LastMedicationStatusCardSkeleton,
  QuickActionsPanelSkeleton,
  PatientSelectorSkeleton,
} from '../../src/components/caregiver/skeletons';
```

### General UI Skeletons

```typescript
import {
  SkeletonLoader,
  MedicationCardSkeleton,
  EventCardSkeleton,
  ListSkeleton,
} from '../../src/components/ui';
```

## Usage Patterns

### Dashboard Loading

```typescript
{loading ? (
  <>
    <PatientSelectorSkeleton />
    <View style={styles.content}>
      <DeviceConnectivityCardSkeleton />
      <LastMedicationStatusCardSkeleton />
      <QuickActionsPanelSkeleton />
    </View>
  </>
) : (
  <RealContent />
)}
```

### List Loading

```typescript
{loading ? (
  <ListSkeleton count={5} ItemSkeleton={EventCardSkeleton} />
) : (
  <FlatList data={items} renderItem={renderItem} />
)}
```

### Fade-In Animation

```typescript
// Setup
const fadeAnim = useRef(new Animated.Value(0)).current;

// Trigger
useEffect(() => {
  if (!loading && data.length > 0) {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  } else {
    fadeAnim.setValue(0);
  }
}, [loading, data.length, fadeAnim]);

// Apply
<Animated.View style={{ opacity: fadeAnim }}>
  <RealContent />
</Animated.View>
```

### Custom Skeleton

```typescript
<SkeletonLoader 
  width="80%" 
  height={20} 
  borderRadius={8}
  style={{ marginBottom: spacing.md }}
/>
```

## Component Reference

| Component | Use Case | Location |
|-----------|----------|----------|
| `PatientSelectorSkeleton` | Patient selector loading | Dashboard |
| `DeviceConnectivityCardSkeleton` | Device card loading | Dashboard |
| `LastMedicationStatusCardSkeleton` | Last event card loading | Dashboard |
| `QuickActionsPanelSkeleton` | Quick actions loading | Dashboard |
| `MedicationCardSkeleton` | Medication list loading | Medications screen |
| `EventCardSkeleton` | Event list loading | Events screen |
| `ListSkeleton` | Any list loading | All list screens |
| `SkeletonLoader` | Custom skeleton | Anywhere |

## Animation Specs

### Shimmer Animation

```typescript
{
  duration: 1000,      // 1 second per cycle
  opacity: [0.3, 0.7], // Dim to bright
  loop: true,          // Infinite
  useNativeDriver: true
}
```

### Fade-In Animation

```typescript
{
  duration: 400,       // 400ms
  toValue: 1,          // Full opacity
  useNativeDriver: true
}
```

## Props Reference

### SkeletonLoader

```typescript
interface SkeletonLoaderProps {
  width?: number | string;      // Default: '100%'
  height?: number | string;     // Default: 20
  borderRadius?: number;        // Default: borderRadius.md
  style?: ViewStyle;            // Additional styles
}
```

### ListSkeleton

```typescript
interface ListSkeletonProps {
  count?: number;               // Default: 3
  ItemSkeleton?: ComponentType; // Default: MedicationCardSkeleton
}
```

## Best Practices

### ✅ Do

- Show skeletons during initial load
- Match skeleton layout to real component
- Use fade-in animation for smooth transition
- Use native driver for animations
- Keep skeleton structure simple

### ❌ Don't

- Show skeletons for cached data
- Use skeletons for error states
- Animate skeleton appearance
- Make skeletons interactive
- Use complex skeleton structures

## Common Patterns

### Conditional Skeleton

```typescript
{loading ? <ComponentSkeleton /> : <RealComponent />}
```

### Multiple Skeletons

```typescript
{loading && (
  <>
    <Skeleton1 />
    <Skeleton2 />
    <Skeleton3 />
  </>
)}
```

### List with Skeleton

```typescript
<FlatList
  data={loading ? [] : items}
  renderItem={renderItem}
  ListEmptyComponent={loading ? <ListSkeleton /> : <EmptyState />}
/>
```

### Skeleton with Fade-In

```typescript
{loading ? (
  <Skeleton />
) : (
  <Animated.View style={{ opacity: fadeAnim }}>
    <RealContent />
  </Animated.View>
)}
```

## Troubleshooting

### Skeleton doesn't match layout

**Problem**: Skeleton layout differs from real component

**Solution**: 
- Check spacing values
- Verify border radius
- Match card padding
- Use same width percentages

### Animation is choppy

**Problem**: Animation not smooth

**Solution**:
- Ensure `useNativeDriver: true`
- Check for layout recalculations
- Verify no heavy operations during animation

### Skeleton appears briefly

**Problem**: Skeleton flashes before content

**Solution**:
- Add minimum loading time
- Use cached data if available
- Implement proper loading state management

### Layout shift when content loads

**Problem**: Content jumps when skeleton is replaced

**Solution**:
- Match skeleton dimensions exactly
- Use same padding/margins
- Test with real data dimensions

## File Locations

```
src/components/
├── caregiver/
│   └── skeletons/
│       ├── index.ts
│       ├── DeviceConnectivityCardSkeleton.tsx
│       ├── LastMedicationStatusCardSkeleton.tsx
│       ├── QuickActionsPanelSkeleton.tsx
│       └── PatientSelectorSkeleton.tsx
└── ui/
    └── SkeletonLoader.tsx (base + list skeletons)
```

## Related Documentation

- [SKELETON_LOADERS_VISUAL_GUIDE.md](./SKELETON_LOADERS_VISUAL_GUIDE.md) - Visual representations
- [TASK18.1_SKELETON_LOADERS_SUMMARY.md](./TASK18.1_SKELETON_LOADERS_SUMMARY.md) - Implementation details
- [ANIMATIONS_IMPLEMENTATION.md](../../docs/ANIMATIONS_IMPLEMENTATION.md) - Animation patterns
- [PERFORMANCE_OPTIMIZATIONS.md](../../docs/PERFORMANCE_OPTIMIZATIONS.md) - Performance tips

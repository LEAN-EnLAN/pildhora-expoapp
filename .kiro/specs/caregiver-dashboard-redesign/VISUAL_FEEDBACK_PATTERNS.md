# Visual Feedback Patterns

## Quick Visual Reference

This guide provides a visual reference for all interaction feedback patterns implemented in Task 18.2.

## 1. Button Press Feedback

### Animation Flow
```
Normal State          Press In              Press Out
┌──────────┐         ┌─────────┐          ┌──────────┐
│          │   →     │         │    →     │          │
│  Button  │         │ Button  │          │  Button  │
│          │         │         │          │          │
└──────────┘         └─────────┘          └──────────┘
Scale: 1.0           Scale: 0.95          Scale: 1.0
Opacity: 1.0         Opacity: 1.0         Opacity: 1.0
```

### Variants
```
Primary Button       Secondary Button     Danger Button
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Primary  │         │Secondary │         │  Danger  │
└──────────┘         └──────────┘         └──────────┘
Blue bg              Gray bg              Red bg
White text           Dark text            White text

Outline Button       Ghost Button
┌──────────┐         ┌──────────┐
│ Outline  │         │  Ghost   │
└──────────┘         └──────────┘
Transparent bg       Transparent bg
Blue border          No border
Blue text            Blue text
```

### Loading State
```
Normal               Loading
┌──────────┐         ┌──────────┐
│   Save   │   →     │    ⟳     │
└──────────┘         └──────────┘
                     Spinner shown
                     Button disabled
```

## 2. Card Press Feedback

### Animation Flow
```
Normal State          Press In              Press Out
┌────────────────┐   ┌───────────────┐    ┌────────────────┐
│                │   │               │    │                │
│  Card Content  │ → │ Card Content  │  → │  Card Content  │
│                │   │               │    │                │
└────────────────┘   └───────────────┘    └────────────────┘
Scale: 1.0           Scale: 0.98          Scale: 1.0
Opacity: 1.0         Opacity: 0.8         Opacity: 1.0
```

### Card Variants
```
Elevated Card        Outlined Card        Default Card
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│                │   │                │   │                │
│   Content      │   │   Content      │   │   Content      │
│                │   │                │   │                │
└────────────────┘   └────────────────┘   └────────────────┘
Shadow: md           Border: 1px          Shadow: sm
```

## 3. Quick Action Cards

### Grid Layout
```
Mobile (2x2)                    Tablet (1x4)
┌─────────┬─────────┐          ┌────┬────┬────┬────┐
│ Events  │  Meds   │          │Evts│Meds│Task│Dev │
├─────────┼─────────┤          └────┴────┴────┴────┘
│  Tasks  │ Device  │
└─────────┴─────────┘
```

### Card Animation
```
Normal                Press In              Press Out
┌───────────┐        ┌──────────┐         ┌───────────┐
│    📋     │        │   📋     │         │    📋     │
│           │   →    │          │    →    │           │
│  Events   │        │ Events   │         │  Events   │
└───────────┘        └──────────┘         └───────────┘
Scale: 1.0           Scale: 0.95          Scale: 1.0
Opacity: 1.0         Opacity: 0.7         Opacity: 1.0
```

## 4. Loading Spinners

### Inline Spinner
```
┌────────────────────────┐
│  Loading data...       │
│        ⟳               │
└────────────────────────┘
Size: small
Position: inline
```

### Overlay Spinner
```
┌──────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓  ┌──────────┐  ▓▓▓▓▓▓ │
│ ▓▓▓▓  │    ⟳     │  ▓▓▓▓▓▓ │
│ ▓▓▓▓  │ Loading  │  ▓▓▓▓▓▓ │
│ ▓▓▓▓  └──────────┘  ▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────┘
Size: large
Position: overlay
Background: semi-transparent
```

### Button Loading
```
Normal Button        Loading Button
┌──────────┐         ┌──────────┐
│   Save   │   →     │    ⟳     │
└──────────┘         └──────────┘
                     Disabled
                     Spinner shown
```

## 5. Toast Notifications

### Animation Flow
```
Hidden               Slide In              Visible
                     ↓
                     ┌────────────────┐
                     │ ✓ Success!     │
                     └────────────────┘
                     ↓
┌────────────────┐   ┌────────────────┐
│ ✓ Success!     │   │ ✓ Success!     │
└────────────────┘   └────────────────┘
Y: -50px             Y: 0px             Y: 0px
Opacity: 0           Opacity: 0.5       Opacity: 1.0
```

### Toast Types
```
Success Toast        Error Toast
┌────────────────┐   ┌────────────────┐
│ ✓ Success!     │   │ ✗ Error!       │
└────────────────┘   └────────────────┘
Green accent         Red accent

Warning Toast        Info Toast
┌────────────────┐   ┌────────────────┐
│ ⚠ Warning!     │   │ ℹ Info         │
└────────────────┘   └────────────────┘
Yellow accent        Blue accent
```

### Toast Position
```
┌──────────────────────────────┐
│         Top: 60px            │ ← Toast appears here
│ ┌────────────────────────┐   │
│ │ ✓ Medication saved     │   │
│ └────────────────────────┘   │
│                              │
│                              │
│        App Content           │
│                              │
│                              │
└──────────────────────────────┘
```

## 6. Content Fade-In

### Animation Flow
```
Loading              Fade In              Visible
┌────────────┐      ┌────────────┐      ┌────────────┐
│            │      │            │      │            │
│  ▭▭▭▭▭▭▭   │  →   │  Content   │  →   │  Content   │
│  ▭▭▭▭      │      │            │      │            │
└────────────┘      └────────────┘      └────────────┘
Skeleton            Opacity: 0.5        Opacity: 1.0
```

### Use Cases
```
Device Card          Medication Card      Event Card
┌────────────┐      ┌────────────┐      ┌────────────┐
│ Device     │      │ Aspirin    │      │ Created    │
│ Online     │  →   │ 100mg      │  →   │ Medication │
│ 85%        │      │ 2x daily   │      │ 2h ago     │
└────────────┘      └────────────┘      └────────────┘
Fade in: 300ms      Fade in: 300ms      Fade in: 300ms
```

## 7. Custom Press Feedback

### Using useVisualFeedback Hook
```typescript
const { scaleAnim, opacityAnim, handlePressIn, handlePressOut } = useVisualFeedback({
  pressedScale: 0.92,
  pressedOpacity: 0.6,
});
```

### Animation Flow
```
Normal               Press In              Press Out
┌────────────┐      ┌───────────┐        ┌────────────┐
│            │      │           │        │            │
│   Custom   │  →   │  Custom   │   →    │   Custom   │
│            │      │           │        │            │
└────────────┘      └───────────┘        └────────────┘
Scale: 1.0          Scale: 0.92          Scale: 1.0
Opacity: 1.0        Opacity: 0.6         Opacity: 1.0
```

## Animation Timing

### Spring Physics
```
Damping: 15
Stiffness: 150

Animation Curve:
1.0 ┤     ╭─────
    │    ╱
0.95┤   ╱
    │  ╱
0.9 ┤ ╱
    └─────────────
    0ms  100ms  200ms
```

### Fade Timing
```
Linear Fade:
1.0 ┤        ╱────
    │       ╱
0.5 ┤      ╱
    │     ╱
0.0 ┤────╱
    └─────────────
    0ms  150ms  300ms
```

## Color Coding

### Toast Colors
```
Success: Green
┌────────────────┐
│ ✓ Success      │
└────────────────┘
Background: #E6F7ED
Border: #10B981
Icon: #10B981

Error: Red
┌────────────────┐
│ ✗ Error        │
└────────────────┘
Background: #FEE2E2
Border: #EF4444
Icon: #EF4444

Warning: Yellow
┌────────────────┐
│ ⚠ Warning      │
└────────────────┘
Background: #FEF3C7
Border: #F59E0B
Icon: #F59E0B

Info: Blue
┌────────────────┐
│ ℹ Info         │
└────────────────┘
Background: #EFF6FF
Border: #3B82F6
Icon: #3B82F6
```

## Accessibility Indicators

### Touch Targets
```
Minimum Size: 44x44 points

Button                Card
┌──────────┐         ┌────────────────┐
│          │         │                │
│  44x44   │         │    120x120     │
│          │         │                │
└──────────┘         └────────────────┘
```

### Screen Reader Labels
```
Button:
- accessibilityRole: "button"
- accessibilityLabel: "Save medication"
- accessibilityHint: "Saves the medication to your list"
- accessibilityState: { disabled: false, busy: false }

Toast:
- accessibilityRole: "alert"
- accessibilityLiveRegion: "polite"
- accessibilityLabel: "success: Medication saved"

Loading:
- accessibilityState: { busy: true }
- accessibilityLabel: "Loading medications"
```

## Performance Metrics

### Target Performance
```
Animation FPS: 60
Initial Render: < 2s
Navigation: < 300ms
Toast Display: < 100ms
```

### Native Driver Usage
```
✅ All animations use native driver
✅ Offloaded to native thread
✅ No JS thread blocking
✅ Smooth 60 FPS performance
```

## Implementation Checklist

### For New Components
```
□ Use Button component for buttons
□ Use Card with onPress for pressable cards
□ Add loading state with LoadingSpinner
□ Show success toast after operations
□ Show error toast on failures
□ Use useVisualFeedback for custom feedback
□ Add fade-in when data loads
□ Ensure proper accessibility labels
```

### Animation Requirements
```
□ Use useNativeDriver: true
□ Memoize components with React.memo
□ Memoize callbacks with useCallback
□ Clean up timers on unmount
□ Handle animation interruptions
```

## Common Patterns

### Async Operation with Feedback
```typescript
const [loading, setLoading] = useState(false);
const { showToast } = useToast();

const handleSave = async () => {
  setLoading(true);
  try {
    await saveMedication();
    showToast({ message: 'Saved!', type: 'success' });
  } catch (error) {
    showToast({ message: 'Error saving', type: 'error' });
  } finally {
    setLoading(false);
  }
};

<Button loading={loading} onPress={handleSave}>
  Save
</Button>
```

### Data Loading with Fade
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  fetchData().then(result => {
    setData(result);
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  });
}, []);

{loading ? (
  <SkeletonLoader />
) : (
  <Animated.View style={{ opacity: fadeAnim }}>
    {/* Content */}
  </Animated.View>
)}
```

## Summary

All visual feedback patterns are:
- ✅ Consistent across components
- ✅ Accessible with proper labels
- ✅ Performant with native driver
- ✅ Well-documented with examples
- ✅ Easy to implement and maintain

Use this guide as a reference when implementing new components or updating existing ones.

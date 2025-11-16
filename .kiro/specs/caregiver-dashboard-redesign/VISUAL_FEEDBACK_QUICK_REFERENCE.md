# Visual Feedback Quick Reference

## Quick Usage Guide

### 1. Show Toast Notification

```typescript
import { useToast } from '../../contexts/ToastContext';

const { showToast } = useToast();

// Success
showToast({ message: 'Saved!', type: 'success' });

// Error
showToast({ message: 'Failed', type: 'error' });

// Warning
showToast({ message: 'Warning', type: 'warning' });

// Info
showToast({ message: 'Info', type: 'info' });
```

### 2. Show Loading Spinner

```typescript
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Inline
<LoadingSpinner size="small" />

// Overlay
{isLoading && (
  <LoadingSpinner size="large" overlay message="Loading..." />
)}
```

### 3. Button with Loading

```typescript
import { Button } from '../ui/Button';

<Button
  loading={isLoading}
  onPress={handleSave}
>
  Save
</Button>
```

### 4. Pressable Card

```typescript
import { Card } from '../ui/Card';

<Card onPress={handlePress}>
  <Text>Card content</Text>
</Card>
```

### 5. Custom Press Feedback

```typescript
import { useVisualFeedback } from '../../hooks/useVisualFeedback';

const { scaleAnim, opacityAnim, handlePressIn, handlePressOut } = useVisualFeedback();

<Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
  <TouchableOpacity
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}
    onPress={handlePress}
    activeOpacity={1}
  >
    <Text>Press me</Text>
  </TouchableOpacity>
</Animated.View>
```

## Component Checklist

When creating new components:

- [ ] Use `Button` for buttons (includes feedback)
- [ ] Use `Card` with `onPress` for pressable cards
- [ ] Add `loading` state for async operations
- [ ] Show success toast after successful operations
- [ ] Show error toast after failed operations
- [ ] Add fade-in animation when data loads
- [ ] Ensure proper accessibility labels

## Animation Values

### Button Press
- Scale: 1.0 → 0.95
- Duration: Spring (damping: 15, stiffness: 150)

### Card Press
- Scale: 1.0 → 0.98
- Opacity: 1.0 → 0.8
- Duration: Spring (damping: 15, stiffness: 150)

### Toast
- Slide: -50px → 0px
- Fade: 0 → 1
- Duration: 300ms
- Auto-dismiss: 3000ms

### Loading Fade
- Fade: 0 → 1
- Duration: 300ms

## Files Created

1. `src/contexts/ToastContext.tsx` - Toast provider and hook
2. `src/components/ui/LoadingSpinner.tsx` - Loading spinner component
3. `src/hooks/useVisualFeedback.ts` - Reusable press feedback hook
4. `src/components/examples/VisualFeedbackExample.tsx` - Example component

## Files Updated

All existing components already have press feedback:
- `src/components/ui/Button.tsx` ✅
- `src/components/ui/Card.tsx` ✅
- `src/components/caregiver/QuickActionsPanel.tsx` ✅
- `src/components/caregiver/DeviceConnectivityCard.tsx` ✅
- `src/components/caregiver/LastMedicationStatusCard.tsx` ✅
- `src/components/caregiver/MedicationEventCard.tsx` ✅

## Setup Required

Add ToastProvider to your app:

```typescript
import { ToastProvider } from './contexts/ToastContext';

<ToastProvider>
  <App />
</ToastProvider>
```

## Testing

Run visual feedback tests:
```bash
node test-visual-feedback.js
```

## Documentation

- Full Guide: `.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_GUIDE.md`
- Example: `src/components/examples/VisualFeedbackExample.tsx`

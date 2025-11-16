# Accessibility Testing Guide - Caregiver Dashboard

Quick reference for conducting accessibility tests on the caregiver dashboard.

## Quick Test Commands

```bash
# Run automated accessibility audit
node test-caregiver-accessibility-audit.js

# Run accessibility compliance check
node scripts/audit-accessibility-standalone.js
```

## Screen Reader Testing

### TalkBack (Android)

**Enable:**
Settings > Accessibility > TalkBack > Turn on

**Basic Gestures:**
- Swipe right: Next item
- Swipe left: Previous item
- Double-tap: Activate
- Two-finger swipe down: Read from top
- Two-finger swipe up: Read from current

**Test Checklist:**
```
Dashboard Screen:
□ Header announces "PILDHORA Caregiver Dashboard"
□ Patient selector announces patient names
□ Quick action cards announce purpose
□ Device status card reads connectivity
□ Last medication card provides context

Events Screen:
□ Filter controls are accessible
□ Event cards announce type and details
□ Date picker is navigable
□ Pull-to-refresh announces

Medications Screen:
□ Medication list is navigable
□ Add button announces purpose
□ Edit/delete actions are clear
□ Search field has label

Tasks Screen:
□ Task list is accessible
□ Checkboxes announce state
□ Add task form is labeled
□ Edit/delete work correctly
```

### VoiceOver (iOS)

**Enable:**
Settings > Accessibility > VoiceOver > Turn on

**Basic Gestures:**
- Swipe right: Next item
- Swipe left: Previous item
- Double-tap: Activate
- Two-finger swipe down: Read all
- Rotor: Adjust reading settings

**Test Checklist:**
```
Navigation:
□ Tab bar announces tab names
□ Screen titles are read
□ Back button is clear
□ Modals announce properly

Interactive Elements:
□ All buttons have labels
□ Form inputs are labeled
□ Switches announce state
□ Links are identifiable

Dynamic Content:
□ Loading states announce
□ Errors are read aloud
□ Success messages clear
□ Updates notify user
```

## Keyboard Navigation Testing

### Desktop/Web

**Test Flow:**
```
1. Tab through all elements
   □ Focus order is logical
   □ Focus indicator visible
   □ No keyboard traps

2. Test modals
   □ Focus trapped in modal
   □ Escape closes modal
   □ Focus returns correctly

3. Test forms
   □ Tab between fields
   □ Enter submits
   □ Arrows work in dropdowns
   □ Space toggles checkboxes
```

## Dynamic Type Testing

### iOS
Settings > Accessibility > Display & Text Size > Larger Text

### Android
Settings > Display > Font size

**Test at:**
- 100% (default)
- 150% (large)
- 200% (extra large)
- 300% (maximum)

**Verify:**
```
□ Text scales proportionally
□ No truncation
□ Layouts adapt
□ Touch targets remain accessible
□ No overlapping
□ Scrolling works
```

## Color Contrast Testing

### Tools
- Chrome DevTools Lighthouse
- https://webaim.org/resources/contrastchecker/
- Color Oracle (color blindness simulator)

**Test Scenarios:**
```
□ Normal vision: All readable
□ Protanopia (red-blind): No info lost
□ Deuteranopia (green-blind): Status clear
□ Tritanopia (blue-blind): Navigation works
□ High contrast mode: UI functional
```

## Touch Target Testing

### Physical Device Testing

**Test on:**
- Phone (small screen)
- Tablet (large screen)
- One-handed use
- Different orientations

**Verify:**
```
□ All buttons easily tappable
□ No accidental adjacent taps
□ Swipe gestures reliable
□ Long press clear
□ Drag and drop works (if used)
```

## Common Issues & Fixes

### Missing Accessibility Labels

**Problem:** Button without label
```typescript
// ❌ Bad
<TouchableOpacity onPress={handlePress}>
  <Icon name="close" />
</TouchableOpacity>

// ✅ Good
<TouchableOpacity 
  onPress={handlePress}
  accessibilityLabel="Close dialog"
  accessibilityRole="button"
>
  <Icon name="close" />
</TouchableOpacity>
```

### Color-Only Information

**Problem:** Status shown only by color
```typescript
// ❌ Bad
<View style={{ backgroundColor: isOnline ? 'green' : 'red' }} />

// ✅ Good
<View 
  style={{ backgroundColor: isOnline ? 'green' : 'red' }}
  accessibilityLabel={isOnline ? 'Device online' : 'Device offline'}
>
  <Text>{isOnline ? 'Online' : 'Offline'}</Text>
</View>
```

### Small Touch Targets

**Problem:** Button too small
```typescript
// ❌ Bad
<TouchableOpacity style={{ width: 30, height: 30 }}>
  <Icon name="edit" />
</TouchableOpacity>

// ✅ Good
<TouchableOpacity 
  style={{ width: 44, height: 44 }}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Icon name="edit" />
</TouchableOpacity>
```

### Hardcoded Font Sizes

**Problem:** Text doesn't scale
```typescript
// ❌ Bad
<Text style={{ fontSize: 16 }}>Hello</Text>

// ✅ Good
<Text style={{ fontSize: typography.fontSize.base }}>Hello</Text>
```

## Automated Test Results

### Latest Audit Summary

**Date:** 2025-11-16

| Category | Passed | Failed | Warnings |
|----------|--------|--------|----------|
| Screen Reader | 7 | 0 | 42 |
| Keyboard Nav | 2 | 1 | 3 |
| Color Contrast | 6 | 0 | 0 |
| Dynamic Type | 6 | 0 | 1 |
| Touch Targets | 10 | 0 | 1 |

**Overall:** 31 passed, 1 failed, 47 warnings

### Critical Issues

1. **Navigation tab labels missing** (app/caregiver/_layout.tsx)
   - Impact: Medium
   - Fix: Add tabBarAccessibilityLabel to each tab

### Non-Critical Warnings

Most warnings are false positives where:
- Accessibility is handled at parent level
- Labels are inherited from context
- Components are wrapped in accessible containers

## Quick Fixes

### Add Tab Navigation Labels

```typescript
// app/caregiver/_layout.tsx
<Tabs.Screen
  name="dashboard"
  options={{
    title: 'Dashboard',
    tabBarAccessibilityLabel: 'Dashboard tab',
    tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
  }}
/>
```

### Enhance Modal Focus

```typescript
// In modal components
<Modal
  visible={visible}
  onShow={() => {
    // Focus first element
    firstInputRef.current?.focus();
  }}
  onRequestClose={onClose}
>
  {/* Modal content */}
</Modal>
```

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [Expo Accessibility](https://docs.expo.dev/guides/accessibility/)

### Tools
- [Accessibility Inspector (iOS)](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXTestingApps.html)
- [Accessibility Scanner (Android)](https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.auditor)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Testing Services
- [UserTesting Accessibility](https://www.usertesting.com/solutions/accessibility-testing)
- [Fable](https://makeitfable.com/) - Testing with people with disabilities

## Compliance Checklist

### Before Release

- [x] Automated accessibility audit completed
- [x] Color contrast verified (WCAG AA)
- [x] Touch targets meet 44x44 minimum
- [x] Dynamic type support implemented
- [ ] TalkBack testing on Android
- [ ] VoiceOver testing on iOS
- [ ] Keyboard navigation verified
- [ ] High contrast mode tested
- [ ] Color blindness simulation tested

### Post-Release

- [ ] User feedback collected
- [ ] Real-world screen reader testing
- [ ] Accessibility improvements prioritized
- [ ] Regular accessibility audits scheduled

---

**Last Updated:** 2025-11-16  
**Next Review:** After manual testing completion

# Accessibility Labels Quick Reference

## Quick Checklist for Adding Accessibility

When creating or updating a component, ensure:

### ✅ Interactive Elements
- [ ] All buttons have `accessibilityLabel`
- [ ] All buttons have `accessibilityHint` (when action isn't obvious)
- [ ] All buttons have `accessibilityRole="button"`
- [ ] Touch targets are minimum 44x44pt

### ✅ Form Inputs
- [ ] All inputs have descriptive labels
- [ ] Error messages are announced
- [ ] Helper text is associated with input
- [ ] Search inputs have `accessibilityRole="search"`

### ✅ Lists
- [ ] FlatList has `accessibilityLabel` describing content
- [ ] FlatList has `accessibilityRole="list"`
- [ ] List items have descriptive labels

### ✅ State Communication
- [ ] Checkboxes use `accessibilityRole="checkbox"`
- [ ] Checkboxes have `accessibilityState={{ checked: boolean }}`
- [ ] Selected items have `accessibilityState={{ selected: boolean }}`
- [ ] Expandable items have `accessibilityState={{ expanded: boolean }}`

### ✅ Decorative Content
- [ ] Decorative icons have `accessible={false}`
- [ ] Background images are hidden from screen readers

### ✅ Alerts and Status
- [ ] Error messages use `accessibilityRole="alert"`
- [ ] Status updates are announced
- [ ] Loading states have descriptive text

## Common Patterns

### Button with Icon
```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Descriptive action name"
  accessibilityHint="What happens when pressed"
  accessibilityRole="button"
  style={{ minWidth: 44, minHeight: 44 }}
>
  <Ionicons name="icon-name" size={24} accessible={false} />
  <Text>Button Text</Text>
</TouchableOpacity>
```

### Checkbox
```typescript
<TouchableOpacity
  onPress={toggleCheck}
  accessibilityRole="checkbox"
  accessibilityState={{ checked: isChecked }}
  accessibilityLabel="Item name"
  accessibilityHint="Toggles selection"
  style={{ minWidth: 44, minHeight: 44 }}
>
  <Ionicons 
    name={isChecked ? 'checkbox' : 'square-outline'} 
    accessible={false}
  />
</TouchableOpacity>
```

### Search Input
```typescript
<TextInput
  placeholder="Search..."
  accessibilityLabel="Search medications"
  accessibilityHint="Type to filter results"
  accessibilityRole="search"
/>
```

### List
```typescript
<FlatList
  data={items}
  accessibilityLabel="List of medications"
  accessibilityRole="list"
  renderItem={({ item }) => (
    <TouchableOpacity
      accessibilityLabel={`Medication ${item.name}`}
      accessibilityHint="Tap to view details"
    >
      <Text>{item.name}</Text>
    </TouchableOpacity>
  )}
/>
```

### Alert/Banner
```typescript
<View
  accessibilityRole="alert"
  accessibilityLabel="Error: Unable to load data"
>
  <Ionicons name="alert-circle" accessible={false} />
  <Text>Error: Unable to load data</Text>
</View>
```

### Empty State
```typescript
<View
  accessible={true}
  accessibilityRole="text"
  accessibilityLabel="No items found. Add your first item to get started"
>
  <Ionicons name="folder-open-outline" accessible={false} />
  <Text>No items found</Text>
  <Text>Add your first item to get started</Text>
</View>
```

### Expandable Section
```typescript
<TouchableOpacity
  onPress={toggleExpanded}
  accessibilityLabel={isExpanded ? "Collapse section" : "Expand section"}
  accessibilityHint="Shows or hides additional content"
  accessibilityRole="button"
  accessibilityState={{ expanded: isExpanded }}
>
  <Ionicons 
    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
    accessible={false}
  />
  <Text>Section Title</Text>
</TouchableOpacity>
```

### Status Indicator
```typescript
<View
  accessible={true}
  accessibilityLabel={`Device status: ${isOnline ? 'Online' : 'Offline'}`}
  accessibilityRole="text"
>
  <View 
    style={{ 
      width: 10, 
      height: 10, 
      backgroundColor: isOnline ? 'green' : 'gray' 
    }}
    accessible={false}
  />
  <Text>{isOnline ? 'Online' : 'Offline'}</Text>
</View>
```

## Accessibility Roles

| Role | Use Case |
|------|----------|
| `button` | Buttons, touchable actions |
| `checkbox` | Checkboxes, toggles |
| `search` | Search inputs |
| `list` | Lists of items |
| `text` | Static text, labels |
| `header` | Section headers |
| `alert` | Error messages, warnings |
| `summary` | Summary information |
| `menu` | Navigation menus |
| `scrollbar` | Scrollable content |

## Accessibility States

| State | Use Case |
|-------|----------|
| `selected` | Selected items in lists |
| `checked` | Checkbox state |
| `expanded` | Expandable sections |
| `disabled` | Disabled controls |
| `busy` | Loading states |

## Touch Target Sizes

Minimum sizes for WCAG 2.1 Level AA compliance:

- **Minimum**: 44x44pt (iOS) / 48x48dp (Android)
- **Recommended**: 48x48pt for better usability
- **Spacing**: Minimum 8pt between targets

```typescript
const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## Label Writing Guidelines

### Good Labels
- ✅ "Emergency call button" - Clear and descriptive
- ✅ "Mark task as complete" - Action-oriented
- ✅ "Patient John Doe" - Includes context
- ✅ "Device status: Online, Battery: 85%" - Comprehensive

### Bad Labels
- ❌ "Button" - Too generic
- ❌ "Click here" - Not descriptive
- ❌ "Icon" - Doesn't explain purpose
- ❌ "Item" - Lacks context

### Hint Writing Guidelines

### Good Hints
- ✅ "Opens emergency call options for 911 or 112"
- ✅ "Toggles completion status for this task"
- ✅ "Navigates to medication details screen"

### Bad Hints
- ❌ "Tap to continue" - Too vague
- ❌ "Does something" - Not helpful
- ❌ Repeating the label - Redundant

## Testing Commands

### iOS VoiceOver
- Enable: Settings > Accessibility > VoiceOver
- Navigate: Swipe right/left
- Activate: Double tap
- Read from top: Two-finger swipe up

### Android TalkBack
- Enable: Settings > Accessibility > TalkBack
- Navigate: Swipe right/left
- Activate: Double tap
- Read from top: Swipe down then right

## Common Mistakes to Avoid

1. ❌ Forgetting to add labels to icon-only buttons
2. ❌ Using generic labels like "Button" or "Icon"
3. ❌ Not hiding decorative icons with `accessible={false}`
4. ❌ Touch targets smaller than 44x44pt
5. ❌ Not communicating state changes
6. ❌ Redundant announcements (icon + text both announced)
7. ❌ Missing hints for complex interactions
8. ❌ Not testing with actual screen readers

## Resources

- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
- [Accessibility Scanner (Android)](https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.auditor)

## Quick Audit Script

Use this checklist when reviewing a component:

```
Component: _________________

[ ] All buttons have labels
[ ] All buttons have hints (if needed)
[ ] All buttons have roles
[ ] Touch targets ≥ 44x44pt
[ ] Form inputs have labels
[ ] Lists have labels and roles
[ ] State is communicated
[ ] Decorative icons hidden
[ ] Alerts use role="alert"
[ ] Tested with screen reader
```

## Summary

Remember the three key principles:

1. **Label Everything**: Every interactive element needs a descriptive label
2. **Communicate State**: Users need to know the current state of controls
3. **Test Regularly**: Always test with actual screen readers

Following these guidelines ensures your app is accessible to all users, including those using assistive technologies.

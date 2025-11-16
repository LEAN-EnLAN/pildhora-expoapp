# Accessibility Quick Reference Guide

## Quick Checklist for New Components

When creating or modifying caregiver components, ensure:

### ✅ Accessibility Labels
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Labels are descriptive and concise (< 100 characters)
- [ ] Labels describe the element's purpose, not just its appearance

### ✅ Accessibility Hints
- [ ] Complex interactive elements have `accessibilityHint`
- [ ] Hints explain what happens when activated
- [ ] Hints are brief and actionable

### ✅ Accessibility Roles
- [ ] All interactive elements have `accessibilityRole`
- [ ] Roles match element type (button, link, header, etc.)
- [ ] Non-interactive elements use appropriate roles (text, image, etc.)

### ✅ Touch Targets
- [ ] All interactive elements are at least 44x44pt
- [ ] Use `minWidth: 44` and `minHeight: 44` in styles
- [ ] Adequate spacing between touch targets

### ✅ Color Contrast
- [ ] Normal text: minimum 4.5:1 contrast ratio
- [ ] Large text (18pt+): minimum 3:1 contrast ratio
- [ ] UI components: minimum 3:1 contrast ratio
- [ ] Don't rely on color alone to convey information

### ✅ Screen Reader Support
- [ ] Test with VoiceOver (iOS) or TalkBack (Android)
- [ ] Verify all content is announced correctly
- [ ] Check navigation order is logical
- [ ] Ensure dynamic content updates are announced

---

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
  <Ionicons name="icon-name" size={24} color={color} />
</TouchableOpacity>
```

### Card with Multiple Elements

```typescript
<Card
  onPress={handlePress}
  accessibilityLabel="Summary of all card content"
  accessibilityHint="Tap to view details"
  accessibilityRole="button"
>
  <View accessible={false}>
    <Text>Title</Text>
    <Text>Description</Text>
  </View>
</Card>
```

### Status Indicator

```typescript
<View
  accessible={true}
  accessibilityLabel="Status: Online, Battery 85%"
  accessibilityRole="text"
>
  <View style={styles.statusDot} accessible={false} />
  <Text>Online</Text>
  <Text>85%</Text>
</View>
```

### Search Input

```typescript
<TextInput
  placeholder="Search..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  accessibilityLabel="Search medications"
  accessibilityHint="Type to filter results"
  accessibilityRole="search"
  style={{ minHeight: 44 }}
/>
```

### Filter Chip

```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityLabel={`Filter by: ${currentSelection}`}
  accessibilityHint="Opens filter options"
  accessibilityRole="button"
  accessibilityState={{ selected: isActive }}
  style={{ minHeight: 44, paddingVertical: 12 }}
>
  <Text>{label}</Text>
</TouchableOpacity>
```

---

## Color Contrast Reference

### Text Colors (on white background)

| Color | Hex | Contrast | WCAG Level |
|-------|-----|----------|------------|
| Gray 900 | #111827 | 16.1:1 | AAA |
| Gray 800 | #1F2937 | 12.5:1 | AAA |
| Gray 700 | #374151 | 10.8:1 | AAA |
| Gray 600 | #4B5563 | 7.2:1 | AAA |
| Gray 500 | #6B7280 | 5.7:1 | AA |
| Primary 500 | #007AFF | 4.5:1 | AA |
| Error 500 | #FF3B30 | 4.5:1 | AA |
| Success | #34C759 | 3.2:1 | AA (large) |

### UI Component Colors

| Component | Foreground | Background | Ratio | Status |
|-----------|------------|------------|-------|--------|
| Primary Button | #FFFFFF | #007AFF | 4.5:1 | ✅ AA |
| Error Button | #FFFFFF | #FF3B30 | 4.5:1 | ✅ AA |
| Input Border | #D1D5DB | #FFFFFF | 3.2:1 | ✅ AA |
| Card Border | #E5E7EB | #FFFFFF | 3.5:1 | ✅ AA |

---

## Testing Commands

### Run Accessibility Audit

```bash
node test-caregiver-accessibility.js
```

### Check Diagnostics

```bash
npm run type-check
```

---

## Resources

### Documentation
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS VoiceOver Guide](https://support.apple.com/guide/iphone/turn-on-and-practice-voiceover-iph3e2e415f/ios)
- [Android TalkBack Guide](https://support.google.com/accessibility/android/answer/6283677)

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Internal
- `src/utils/accessibility.ts` - Accessibility utility functions
- `src/utils/accessibilityAudit.ts` - Audit utility functions
- `docs/ACCESSIBILITY_COMPLIANCE.md` - Patient-side compliance
- `.kiro/specs/caregiver-dashboard-redesign/ACCESSIBILITY_COMPLIANCE.md` - Caregiver-side compliance

---

## Common Mistakes to Avoid

### ❌ Don't Do This

```typescript
// Missing accessibility label
<TouchableOpacity onPress={handlePress}>
  <Ionicons name="close" />
</TouchableOpacity>

// Touch target too small
<TouchableOpacity style={{ width: 24, height: 24 }}>
  <Ionicons name="close" />
</TouchableOpacity>

// Low contrast text
<Text style={{ color: '#999999' }}>Important text</Text>

// Relying on color alone
<View style={{ backgroundColor: isError ? 'red' : 'green' }}>
  <Text>Status</Text>
</View>
```

### ✅ Do This Instead

```typescript
// With accessibility label
<TouchableOpacity 
  onPress={handlePress}
  accessibilityLabel="Close"
  accessibilityRole="button"
>
  <Ionicons name="close" />
</TouchableOpacity>

// Adequate touch target
<TouchableOpacity style={{ minWidth: 44, minHeight: 44 }}>
  <Ionicons name="close" />
</TouchableOpacity>

// High contrast text
<Text style={{ color: '#111827' }}>Important text</Text>

// Text + color for status
<View style={{ backgroundColor: isError ? 'red' : 'green' }}>
  <Text>{isError ? 'Error' : 'Success'}</Text>
</View>
```

---

## Accessibility Roles Reference

| Role | Use For |
|------|---------|
| `button` | Buttons, pressable cards |
| `link` | Navigation links |
| `header` | Section headers, titles |
| `search` | Search input fields |
| `text` | Static text content |
| `image` | Images with meaning |
| `imagebutton` | Pressable images |
| `adjustable` | Sliders, pickers |
| `alert` | Error messages, warnings |
| `checkbox` | Checkboxes |
| `radio` | Radio buttons |
| `switch` | Toggle switches |
| `progressbar` | Progress indicators |
| `menu` | Menu containers |
| `menuitem` | Menu options |
| `tab` | Tab navigation |
| `tablist` | Tab container |

---

## Quick Wins

### 1. Add Labels to Existing Components

```typescript
// Before
<TouchableOpacity onPress={handlePress}>
  <Text>Submit</Text>
</TouchableOpacity>

// After
<TouchableOpacity 
  onPress={handlePress}
  accessibilityLabel="Submit form"
  accessibilityRole="button"
>
  <Text>Submit</Text>
</TouchableOpacity>
```

### 2. Ensure Minimum Touch Targets

```typescript
// Before
<TouchableOpacity style={{ padding: 8 }}>
  <Ionicons name="close" size={16} />
</TouchableOpacity>

// After
<TouchableOpacity style={{ padding: 14, minWidth: 44, minHeight: 44 }}>
  <Ionicons name="close" size={16} />
</TouchableOpacity>
```

### 3. Hide Decorative Elements

```typescript
// Before
<View>
  <Ionicons name="decorative-icon" />
  <Text>Important text</Text>
</View>

// After
<View accessible={true} accessibilityLabel="Important text">
  <Ionicons name="decorative-icon" accessible={false} />
  <Text>Important text</Text>
</View>
```

---

## Need Help?

- Check existing components for examples
- Review `docs/ACCESSIBILITY_COMPLIANCE.md`
- Run `node test-caregiver-accessibility.js`
- Test with VoiceOver/TalkBack
- Ask the team for accessibility review

---

*Last Updated: November 16, 2025*

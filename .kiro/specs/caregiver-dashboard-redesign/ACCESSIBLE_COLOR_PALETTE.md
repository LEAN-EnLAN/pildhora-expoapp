# Accessible Color Palette

## Quick Reference for WCAG 2.1 AA Compliant Colors

This document provides the verified accessible color combinations for caregiver dashboard components. All colors meet WCAG 2.1 AA standards for contrast.

---

## Semantic Colors

### Error/Danger (Red)

```typescript
// For text and icons on light backgrounds
errorDark: '#B91C1C'      // Contrast: 5.91:1 ✅ AA
errorMedium: '#DC2626'    // Contrast: 4.83:1 ✅ AA

// Light backgrounds
errorLight: '#FEF2F2'     // For badge backgrounds

// Usage
<Text style={{ color: '#B91C1C' }}>Error message</Text>
<View style={{ backgroundColor: '#DC2626' }}>
  <Ionicons name="alert" color="#FFFFFF" />
</View>
```

### Warning (Orange)

```typescript
// For text and icons on light backgrounds
warningDark: '#B45309'    // Contrast: 4.73:1 ✅ AA

// Light backgrounds
warningLight: '#FFF7ED'   // For badge backgrounds

// Usage
<Text style={{ color: '#B45309' }}>Warning message</Text>
<Badge backgroundColor="#FFF7ED" textColor="#B45309" />
```

### Success (Green)

```typescript
// For text and icons on light backgrounds
successDark: '#15803D'    // Contrast: 4.51:1 ✅ AA

// Light backgrounds
successLight: '#E6F7ED'   // For badge backgrounds

// Usage
<Text style={{ color: '#15803D' }}>Success message</Text>
<Badge backgroundColor="#E6F7ED" textColor="#15803D" />
```

### Primary (Blue)

```typescript
// For text and icons on light backgrounds
primaryDark: '#0052A3'    // Contrast: 6.68:1 ✅ AA (Primary 700)

// Light backgrounds
primaryLight: '#E6F0FF'   // For badge backgrounds (Primary 50)

// Usage
<Text style={{ color: '#0052A3' }}>Primary text</Text>
<Badge backgroundColor="#E6F0FF" textColor="#0052A3" />
```

---

## Component-Specific Colors

### EventTypeBadge

```typescript
// Created Badge
{
  color: '#0052A3',        // Primary 700
  backgroundColor: '#E6F0FF', // Primary 50
  contrast: '6.68:1 ✅ AA'
}

// Updated Badge
{
  color: '#B45309',        // Dark Orange
  backgroundColor: '#FFF7ED', // Warning 50
  contrast: '4.73:1 ✅ AA'
}

// Deleted Badge
{
  color: '#B91C1C',        // Dark Red
  backgroundColor: '#FEF2F2', // Error 50
  contrast: '5.91:1 ✅ AA'
}

// Dose Taken Badge
{
  color: '#15803D',        // Dark Green
  backgroundColor: '#E6F7ED', // Light Green
  contrast: '4.51:1 ✅ AA'
}

// Dose Missed Badge
{
  color: '#B45309',        // Dark Orange
  backgroundColor: '#FFF7ED', // Warning 50
  contrast: '4.73:1 ✅ AA'
}
```

### CaregiverHeader

```typescript
// Emergency Button
{
  iconColor: '#FFFFFF',
  backgroundColor: '#DC2626', // Dark Red
  contrast: '4.83:1 ✅ AA'
}

// Account Button
{
  iconColor: '#FFFFFF',
  backgroundColor: '#374151', // Gray 700
  contrast: '10.31:1 ✅ AAA'
}
```

### ErrorState

```typescript
// Error Icon
{
  iconColor: '#DC2626',    // Dark Red
  backgroundColor: '#FFFFFF',
  contrast: '4.83:1 ✅ AA'
}
```

### OfflineIndicator

```typescript
// Warning Banner
{
  textColor: '#B45309',    // Dark Orange
  backgroundColor: '#FFF7ED', // Warning 50
  contrast: '4.73:1 ✅ AA'
}
```

---

## Gray Scale (Always Accessible)

```typescript
// Text on white backgrounds
gray900: '#111827'  // 17.74:1 ✅ AAA (Headings, primary text)
gray800: '#1F2937'  // 14.68:1 ✅ AAA (Body text)
gray700: '#374151'  // 10.31:1 ✅ AAA (Secondary text)
gray600: '#4B5563'  //  7.56:1 ✅ AAA (Tertiary text)
gray500: '#6B7280'  //  4.83:1 ✅ AA  (Muted text)

// Light backgrounds
gray50:  '#F9FAFB'  // For cards and chips
gray100: '#F3F4F6'  // For subtle backgrounds
gray200: '#E5E7EB'  // For borders
```

---

## Usage Guidelines

### 1. Text on Light Backgrounds

**Always use dark variants**:
- Error: `#B91C1C` or `#DC2626`
- Warning: `#B45309`
- Success: `#15803D`
- Primary: `#0052A3`
- Gray: `#111827` to `#6B7280`

### 2. Icons on Colored Backgrounds

**Use white icons on dark backgrounds**:
- Emergency button: White on `#DC2626`
- Account button: White on `#374151`
- Primary buttons: White on `#007AFF` or darker

### 3. Badges and Pills

**Use dark text on light backgrounds**:
```typescript
<Badge
  backgroundColor="#E6F0FF"  // Light background
  textColor="#0052A3"        // Dark text
/>
```

### 4. Large Text Exception

For text 18pt+ or 14pt+ bold, you can use slightly lighter colors:
- Minimum contrast: 3.0:1 (instead of 4.5:1)
- Still recommend using darker variants for better readability

---

## Testing Your Colors

### Manual Calculation

Use the contrast ratio formula:
```
ratio = (L1 + 0.05) / (L2 + 0.05)
```
Where L1 is the lighter color's relative luminance and L2 is the darker.

### Automated Testing

Run the audit script:
```bash
node scripts/audit-accessibility-standalone.js
```

### Online Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)

---

## Common Mistakes to Avoid

### ❌ Don't Use

```typescript
// Too light on light backgrounds
color: '#FF9500' on '#FFF7ED'  // 2.07:1 ❌
color: '#FF3B30' on '#FEF2F2'  // 3.24:1 ❌
color: '#34C759' on '#E8F5E9'  // 1.97:1 ❌
color: '#007AFF' on '#E6F0FF'  // 3.50:1 ❌
```

### ✅ Do Use

```typescript
// Dark variants on light backgrounds
color: '#B45309' on '#FFF7ED'  // 4.73:1 ✅
color: '#B91C1C' on '#FEF2F2'  // 5.91:1 ✅
color: '#15803D' on '#E6F7ED'  // 4.51:1 ✅
color: '#0052A3' on '#E6F0FF'  // 6.68:1 ✅
```

---

## Integration with Theme Tokens

Update your theme tokens file:

```typescript
// src/theme/tokens.ts

export const colors = {
  // ... existing colors ...
  
  // Accessible semantic colors
  accessible: {
    error: {
      dark: '#B91C1C',    // 5.91:1
      medium: '#DC2626',  // 4.83:1
      light: '#FEF2F2',
    },
    warning: {
      dark: '#B45309',    // 4.73:1
      light: '#FFF7ED',
    },
    success: {
      dark: '#15803D',    // 4.51:1
      light: '#E6F7ED',
    },
    primary: {
      dark: '#0052A3',    // 6.68:1 (Primary 700)
      light: '#E6F0FF',   // Primary 50
    },
  },
};
```

---

## Maintenance

### When Adding New Colors

1. Calculate contrast ratio using the audit script
2. Ensure minimum 4.5:1 for normal text
3. Ensure minimum 3.0:1 for large text
4. Test with actual components
5. Update this document

### Regular Audits

- Run audit script before each release
- Test with real users using screen readers
- Monitor accessibility feedback
- Update colors if standards change

---

## References

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Color Contrast](https://webaim.org/articles/contrast/)
- [Material Design Accessibility](https://material.io/design/color/text-legibility.html)

---

**Last Updated**: November 16, 2025  
**Compliance Level**: WCAG 2.1 AA  
**Audit Status**: ✅ All colors verified

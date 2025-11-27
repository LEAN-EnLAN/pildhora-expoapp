# Pildhora UI Style Guide

## Overview
This guide documents the successful design patterns implemented in the patient home medication list and provides a comprehensive reference for maintaining consistent UI throughout the Pildhora application.

## Core Design Principles

### 1. Card-Based Design
- Use rounded corners (`rounded-xl`) for modern appearance
- Apply subtle shadows (`shadow-sm`) for depth and visual hierarchy
- Add clean borders (`border border-gray-200`) for separation
- Ensure consistent padding (`p-4`) and margins (`mb-3`)

### 2. Spacing System
- Replace divider lines with gap spacing (`gap-3`)
- Use consistent margins between elements (`mb-1`, `mb-2`, `mb-3`)
- Apply proper padding within cards (`p-4`)
- Maintain visual breathing room throughout interface

### 3. Visual Hierarchy
- Clear typography hierarchy with font weights (`font-semibold`, `font-bold`)
- Proper text spacing with margin classes (`mb-1`)
- Consistent color scheme (`text-gray-900`, `text-gray-600`)
- High contrast for action buttons

## Component Patterns

### Medication Cards
```tsx
// Standard medication card pattern
<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-3">
  <View className="flex-row items-center justify-between">
    <View className="flex-1">
      <Text className="text-base font-semibold text-gray-900 mb-1">{item.name}</Text>
      <Text className="text-gray-600 mb-1">{item.dosage}</Text>
      <Text className="text-gray-600">{item.time}</Text>
    </View>
    <TouchableOpacity className="px-4 py-2 rounded-lg bg-gray-800 shadow-sm">
      <Text className="text-white font-semibold">Action</Text>
    </TouchableOpacity>
  </View>
```

### Container Sections
```tsx
// Standard container pattern
<View className="bg-white rounded-2xl p-4">
  <Text className="text-lg font-bold mb-2">Section Title</Text>
  {/* Content */}
</View>
```

### Header Pattern
```tsx
// Standard header pattern
<View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
  <View>
    <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
    <Text className="text-sm text-gray-500">Subtitle</Text>
  </View>
  <View className="flex-row items-center gap-3">
    {/* Action buttons */}
  </View>
</View>
```

### Button Patterns
```tsx
// Primary action button
<TouchableOpacity className="px-4 py-2 rounded-lg bg-blue-500">
  <Text className="text-white font-semibold">Action</Text>
</TouchableOpacity>

// Secondary action button
<TouchableOpacity className="px-3 py-2 rounded-lg bg-gray-800 shadow-sm">
  <Text className="text-white font-semibold">Secondary</Text>
</TouchableOpacity>

// Emergency button
<TouchableOpacity className="w-10 h-10 rounded-full bg-red-500 items-center justify-center shadow-sm">
  <Ionicons name="alert" size={20} color="#FFFFFF" />
</TouchableOpacity>
```

## Color Palette

### Primary Colors
- **Primary Blue**: `bg-blue-500` / `text-blue-600`
- **Success Green**: `bg-green-600` / `text-green-700`
- **Danger Red**: `bg-red-500` / `text-red-700`
- **Warning Orange**: `bg-orange-500` / `text-orange-600`

### Neutral Colors
- **White**: `bg-white` / `text-gray-900`
- **Gray 100**: `bg-gray-100` (background)
- **Gray 200**: `bg-gray-200` / `border-gray-200` (borders/dividers)
- **Gray 500**: `bg-gray-500` / `text-gray-500`
- **Gray 600**: `text-gray-600` (secondary text)
- **Gray 700**: `bg-gray-700` / `text-gray-700` (dark elements)
- **Gray 800**: `bg-gray-800` / `text-gray-800` (very dark elements)

## Typography Scale

### Headings
- **Title**: `text-2xl font-extrabold`
- **Section Title**: `text-lg font-bold`
- **Card Title**: `text-base font-semibold`
- **Body**: `text-base` (default)
- **Small**: `text-sm`
- **Caption**: `text-xs`

### Spacing Scale
- **XS**: `p-1`, `gap-1`
- **SM**: `p-2`, `gap-2`
- **MD**: `p-3`, `gap-3`
- **LG**: `p-4`, `gap-4`
- **XL**: `p-6`, `gap-6`

## Implementation Guidelines

### 1. Replace All Divider Lines
- Remove `ItemSeparatorComponent` from FlatList
- Replace with `gap-3` or `mb-3` spacing
- Never use `h-px bg-gray-200` separators

### 2. Apply Consistent Card Styling
- Every card should have: `rounded-xl p-4 shadow-sm border border-gray-200`
- Add `mb-3` between cards for clear separation
- Use `flex-1` for content areas that should expand

### 3. Maintain Visual Consistency
- Use same border radius throughout: `rounded-xl`
- Use same shadow intensity: `shadow-sm`
- Use consistent padding: `p-4` for cards, `px-4 py-2` for buttons
- Maintain consistent color scheme

### 4. Ensure Responsive Design
- Use flex layouts with proper gaps
- Avoid fixed widths where possible
- Test on different screen sizes
- Maintain touch targets (minimum 44px)

## Screens Requiring Updates

Based on current analysis, the following screens need UI consistency updates:

### High Priority
1. **Patient Medication List** (`app/patient/medications/index.tsx`)
   - Apply card-based design with shadows
   - Remove divider lines
   - Add proper spacing

2. **Patient History** (`app/patient/history/index.tsx`)
   - Update filter buttons to match card design
   - Apply consistent spacing to history items

3. **Medication Forms** (`app/patient/medications/add.tsx`, `app/patient/medications/[id].tsx`)
   - Update form sections to use card design
   - Apply consistent button styling

### Medium Priority
4. **Caregiver Dashboard** (`app/caregiver/dashboard.tsx`)
   - Ensure all cards follow consistent patterns
   - Verify spacing is uniform

5. **Patient Home** (`app/patient/home.tsx`) ✅ **COMPLETED**
   - Already updated with new design patterns
   - Serves as reference implementation

## Migration Strategy

### Phase 1: Foundation
1. Create reusable UI components for common patterns
2. Establish design tokens (colors, spacing, typography)
3. Update core layout components

### Phase 2: Implementation
1. Update high-priority screens first
2. Apply consistent patterns to medium-priority screens
3. Ensure all interactive elements follow new guidelines

### Phase 3: Refinement
1. Test across different screen sizes
2. Verify accessibility compliance
3. Optimize performance

## Success Metrics

### Before
- Distracting divider lines
- Inconsistent spacing
- "Scrappy" appearance
- Poor visual hierarchy

### After
- Clean card-based design
- Consistent spacing throughout
- Professional appearance
- Clear visual separation
- Improved readability

## Maintenance

To maintain UI consistency:
1. Always reference this guide before implementing new components
2. Use the documented patterns for similar UI elements
3. Test changes across different screen sizes
4. Update this guide when new patterns are established

This style guide ensures the entire Pildhora application maintains a consistent, professional appearance that enhances user experience and reduces visual clutter.
# Persistent Navigation Guide

## Overview

The caregiver layout now features **persistent header and bottom navigation** that stay fixed on screen across all tab screens. This provides a consistent, app-like experience with the navigation always accessible.

## Architecture

### Layout Structure

```
┌─────────────────────────────┐
│   Persistent Header (Top)   │ ← Always visible, fixed position
├─────────────────────────────┤
│                             │
│   Screen Content Area       │ ← Scrollable content with proper padding
│   (with padding for header  │
│    and bottom nav)          │
│                             │
├─────────────────────────────┤
│ Persistent Bottom Nav (5)   │ ← Always visible, fixed position
└─────────────────────────────┘
```

### Bottom Navigation Tabs (5 screens)

1. **Inicio** (dashboard) - Home icon
2. **Tareas** (tasks) - Checkbox icon
3. **Pacientes** (device-connection) - People icon
4. **Eventos** (events) - Notifications icon
5. **Medicamentos** (medications) - Medical icon

## Using ScreenWrapper Component

The `ScreenWrapper` component ensures all caregiver screens start BELOW the persistent header and don't get hidden behind the bottom tab bar.

### How It Works

The header is positioned absolutely at the top of the screen with `position: 'absolute'` and `zIndex: 1000`. Without proper padding, screen content would start at the top of the screen and be hidden behind the header.

`ScreenWrapper` adds:
- **Top padding** = header height (including safe area insets)
- **Bottom padding** = tab bar height

This pushes content down so it starts below the header and doesn't get cut off by the tab bar.

### Import the Component

```typescript
import { ScreenWrapper } from '../../src/components/caregiver';
```

### Wrap Your Screen Content

```typescript
export default function MyScreen() {
  return (
    <ScreenWrapper>
      <Container>
        <ScrollView>
          {/* Your content - automatically padded for header and bottom nav */}
        </ScrollView>
      </Container>
    </ScreenWrapper>
  );
}
```

### ScreenWrapper Props

- `children`: Your screen content
- `style`: Additional styles for the container
- `applyTopPadding`: Whether to apply top padding (default: true)
- `applyBottomPadding`: Whether to apply bottom padding (default: true)

## Manual Padding (Advanced)

If you need more control over padding, use the layout dimensions hook:

### Import the Hook

```typescript
import { useLayoutDimensions } from '../_layout';
```

### Get Layout Dimensions

```typescript
const { headerHeight, tabBarHeight, contentInsetTop, contentInsetBottom } = useLayoutDimensions();
```

### Apply Manual Padding

```typescript
<View style={{ flex: 1, paddingTop: contentInsetTop, paddingBottom: contentInsetBottom }}>
  {/* Your content */}
</View>
```

## Layout Dimensions

The layout provides these dimensions through context:

- **headerHeight**: Total header height including safe area insets
- **tabBarHeight**: Bottom tab bar height (90px iOS, 72px Android)
- **contentInsetTop**: Top padding for content (same as headerHeight)
- **contentInsetBottom**: Bottom padding for content (same as tabBarHeight)

## Example Implementations

### Simple Screen with ScrollView

```typescript
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../src/components/caregiver';

export default function MyScreen() {
  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <Text>Your content here</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
});
```

### Screen with FlatList

```typescript
import React from 'react';
import { FlatList, Text } from 'react-native';
import { ScreenWrapper } from '../../src/components/caregiver';

export default function MyListScreen() {
  const data = [/* your data */];

  return (
    <ScreenWrapper>
      <FlatList
        data={data}
        renderItem={({ item }) => <Text>{item.name}</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </ScreenWrapper>
  );
}
```

### Advanced: Manual Control

```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLayoutDimensions } from '../_layout';

export default function MyAdvancedScreen() {
  const { contentInsetTop, contentInsetBottom } = useLayoutDimensions();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: contentInsetTop,
          paddingBottom: contentInsetBottom,
          padding: 16,
        }}
      >
        {/* Your content */}
      </ScrollView>
    </View>
  );
}
```

## Benefits

1. **Consistent Navigation**: Header and tabs always visible
2. **Better UX**: Users can navigate without scrolling to top/bottom
3. **Modern Feel**: Matches native app patterns
4. **Proper Spacing**: Content automatically accounts for fixed elements
5. **Safe Areas**: Handles notches and home indicators correctly

## Migration Guide

### Before (Old Approach)

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyScreen() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      {/* Content */}
    </SafeAreaView>
  );
}
```

### After (New Approach)

```typescript
import { ScreenWrapper } from '../../src/components/caregiver';

export default function MyScreen() {
  return (
    <ScreenWrapper>
      {/* Content */}
    </ScreenWrapper>
  );
}
```

## Notes

- The header is hidden on the `add-device` screen (modal)
- Bottom navigation is always visible on all 5 main tabs
- Hidden screens (device-connection-confirm, add-device, patients) don't show in tabs
- All screens should use `ScreenWrapper` for proper spacing
- The layout automatically handles safe areas (notches, home indicators)

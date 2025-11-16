# FlatList Optimization Quick Reference

## Essential Optimizations Checklist

When implementing any FlatList in the caregiver dashboard, apply these optimizations:

### 1. Key Extractor (Required)

```typescript
const keyExtractor = useCallback((item: Type) => item.id, []);

<FlatList
  keyExtractor={keyExtractor}
  // ...
/>
```

### 2. Get Item Layout (Required)

```typescript
const getItemLayout = useCallback(
  (_data: ArrayLike<Type> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT, // Replace with actual height
    offset: ITEM_HEIGHT * index,
    index,
  }),
  []
);

<FlatList
  getItemLayout={getItemLayout}
  // ...
/>
```

### 3. Remove Clipped Subviews (Required)

```typescript
<FlatList
  removeClippedSubviews={true}
  // ...
/>
```

### 4. Batch Configuration (Required)

```typescript
<FlatList
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  // ...
/>
```

### 5. Memoized Render Callback (Required)

```typescript
const renderItem = useCallback(({ item }: { item: Type }) => (
  <ItemComponent item={item} onPress={handlePress} />
), [handlePress]);

<FlatList
  renderItem={renderItem}
  // ...
/>
```

## Complete Example

```typescript
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';

const ITEM_HEIGHT = 100; // Adjust based on your item

function MyList({ data, onItemPress }) {
  // Key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Get item layout
  const getItemLayout = useCallback(
    (_data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Render item
  const renderItem = useCallback(
    ({ item }) => (
      <ItemComponent item={item} onPress={onItemPress} />
    ),
    [onItemPress]
  );

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}
```

## Item Heights Reference

| Screen | Item Type | Height |
|--------|-----------|--------|
| Tasks | Task Card | 100px |
| Events | Event Card | 140px |
| Medications | Medication Card | 160px |

## Common Mistakes to Avoid

❌ **Don't**: Inline key extractor
```typescript
<FlatList keyExtractor={(item) => item.id} />
```

✅ **Do**: Memoize key extractor
```typescript
const keyExtractor = useCallback((item) => item.id, []);
<FlatList keyExtractor={keyExtractor} />
```

---

❌ **Don't**: Skip getItemLayout
```typescript
<FlatList data={data} renderItem={renderItem} />
```

✅ **Do**: Always provide getItemLayout
```typescript
<FlatList 
  data={data} 
  renderItem={renderItem}
  getItemLayout={getItemLayout}
/>
```

---

❌ **Don't**: Inline render function
```typescript
<FlatList renderItem={({ item }) => <Item item={item} />} />
```

✅ **Do**: Memoize render function
```typescript
const renderItem = useCallback(({ item }) => <Item item={item} />, []);
<FlatList renderItem={renderItem} />
```

## Performance Targets

- **Initial Render**: < 100ms for 20 items
- **Scroll FPS**: Consistent 60 FPS
- **Memory Usage**: Minimal with removeClippedSubviews
- **Layout Calculations**: Zero during scroll (pre-calculated)

## When NOT to Use These Optimizations

### Use ScrollView Instead When:

1. **Small Number of Items**: < 10 items that all fit on screen
2. **Complex Layouts**: Items with varying heights that can't be pre-calculated
3. **Nested Scrolling**: Horizontal scroll within vertical scroll
4. **Static Content**: Content that doesn't change or scroll

### Example: Dashboard (Uses ScrollView)

```typescript
// Dashboard has only 3-4 cards, so ScrollView is better
<ScrollView>
  <DeviceConnectivityCard />
  <LastMedicationStatusCard />
  <QuickActionsPanel />
</ScrollView>
```

## Debugging Performance Issues

### Check FlatList Performance

```typescript
<FlatList
  // Add debug props
  debug={__DEV__}
  onViewableItemsChanged={({ viewableItems }) => {
    console.log('Visible items:', viewableItems.length);
  }}
  // ...
/>
```

### Monitor Render Count

```typescript
const renderItem = useCallback(({ item }) => {
  console.log('Rendering item:', item.id);
  return <ItemComponent item={item} />;
}, []);
```

### Check Memory Usage

Use React Native Debugger or Flipper to monitor:
- Component render count
- Memory usage during scrolling
- FPS during rapid scrolling

## Additional Resources

- [Task 15.1 Implementation Summary](./TASK15.1_LIST_OPTIMIZATION_SUMMARY.md)
- [Performance Optimization Guide](./TASK15_PERFORMANCE_OPTIMIZATION_SUMMARY.md)
- [React Native FlatList Docs](https://reactnative.dev/docs/flatlist)

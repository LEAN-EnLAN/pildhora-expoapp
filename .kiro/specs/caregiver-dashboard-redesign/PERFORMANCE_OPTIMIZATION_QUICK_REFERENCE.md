# Performance Optimization Quick Reference

## 🎯 Performance Score: 70/100

### Quick Stats
- **Issues Found:** 17
- **High Impact:** 6
- **Medium Impact:** 7
- **Low Impact:** 4

---

## 🔴 Critical Fixes (Do First)

### 1. Fix Memory Leaks

```typescript
// ❌ BAD: No cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(query, handleUpdate);
}, []);

// ✅ GOOD: Always cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(query, handleUpdate);
  return () => unsubscribe();
}, []);
```

### 2. Memoize List Items

```typescript
// ❌ BAD: Re-renders on every scroll
const EventCard = ({ event }) => <View>...</View>;

// ✅ GOOD: Only re-renders when event changes
const EventCard = React.memo(({ event }) => (
  <View>...</View>
), (prev, next) => prev.event.id === next.event.id);
```

### 3. Add Caching

```typescript
// ❌ BAD: No caching
const { data } = useCollection(query);

// ✅ GOOD: SWR pattern with cache
const { data } = useCollectionSWR({
  cacheKey: 'events',
  query,
  initialData: cachedData,
});
```

---

## 🟡 High Priority Optimizations

### FlatList Props

```typescript
<FlatList
  // Required
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  
  // Performance boost
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### useCallback for Handlers

```typescript
// ❌ BAD: New function every render
const handlePress = (id) => navigate(id);

// ✅ GOOD: Stable reference
const handlePress = useCallback(
  (id) => navigate(id),
  [navigate]
);
```

### useMemo for Operations

```typescript
// ❌ BAD: Runs every render
const filtered = items.filter(i => i.active);

// ✅ GOOD: Only when dependencies change
const filtered = useMemo(
  () => items.filter(i => i.active),
  [items]
);
```

---

## 🟢 Medium Priority

### Query Limits

```typescript
// ❌ BAD: Fetches all documents
const q = query(collection(db, 'events'));

// ✅ GOOD: Limits results
const q = query(
  collection(db, 'events'),
  orderBy('timestamp', 'desc'),
  limit(50)
);
```

### Lazy Loading

```typescript
// ❌ BAD: Imports everything upfront
import HeavyComponent from './HeavyComponent';

// ✅ GOOD: Lazy loads when needed
const HeavyComponent = React.lazy(
  () => import('./HeavyComponent')
);
```

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial Render | < 2s | ⚠️ Needs work |
| List Scroll | 60 FPS | ⚠️ Needs work |
| Memory | < 100MB | ⚠️ Needs work |
| Network | < 500ms | ⚠️ Needs work |

---

## 🎯 Top 5 Actions

1. **Add React.memo** to list items → 60-80% fewer re-renders
2. **Optimize FlatList** props → 60 FPS scrolling
3. **Fix memory leaks** → Prevent crashes
4. **Add caching** → 70-90% fewer requests
5. **Limit queries** → 50% faster loads

---

## 📁 Files to Optimize

### High Priority
- `app/caregiver/dashboard.tsx`
- `app/caregiver/events.tsx`
- `app/caregiver/medications/[patientId]/index.tsx`
- `src/components/caregiver/PatientSelector.tsx`
- `src/hooks/useDeviceState.ts`

### Medium Priority
- `src/components/caregiver/CaregiverHeader.tsx`
- `src/components/caregiver/QuickActionsPanel.tsx`
- `src/components/caregiver/LastMedicationStatusCard.tsx`

---

## 🔧 Quick Fixes Checklist

- [ ] Add cleanup to all useEffect hooks
- [ ] Wrap list items with React.memo
- [ ] Add FlatList optimization props
- [ ] Implement caching with SWR
- [ ] Add query limits
- [ ] Wrap handlers in useCallback
- [ ] Wrap operations in useMemo
- [ ] Add retry logic for network errors

---

## 📈 Measuring Improvements

```typescript
// Before optimization
const startTime = performance.now();
// ... your code
const endTime = performance.now();
console.log(`Time: ${endTime - startTime}ms`);

// After optimization
// Compare the times to see improvement
```

---

## 🚀 Expected Results

After implementing all optimizations:

- **Score:** 70 → 90+
- **Render Time:** 2s → < 1s
- **Scroll FPS:** 45 → 60
- **Memory:** 120MB → < 80MB
- **Network:** 800ms → < 400ms

---

## 📚 Resources

- Full Report: `PERFORMANCE_AUDIT_REPORT.md`
- Detailed Summary: `TASK22.2_PERFORMANCE_AUDIT_SUMMARY.md`
- Audit Script: `test-caregiver-performance-audit.js`

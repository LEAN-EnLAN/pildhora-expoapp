# Code Quality Quick Reference

## Quick Commands

### Run Code Quality Check
```bash
node scripts/verify-code-quality.js
```

### Run TypeScript Check
```bash
npx tsc --noEmit
```

### Run Linter
```bash
npx eslint src/components/caregiver app/caregiver --ext .ts,.tsx
```

### Fix Linting Issues
```bash
npx eslint src/components/caregiver app/caregiver --ext .ts,.tsx --fix
```

## Code Quality Standards

### Component Template
```typescript
/**
 * ComponentName
 * 
 * Brief description of what the component does.
 * 
 * @param {Props} props - Component props
 * @returns {JSX.Element} Rendered component
 * 
 * @example
 * <ComponentName prop="value" />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import type { ComponentProps } from '../../types';

export interface ComponentNameProps {
  /** Prop description */
  prop: string;
  /** Optional prop description */
  optionalProp?: number;
}

export default function ComponentName({ prop, optionalProp }: ComponentNameProps) {
  // State
  const [state, setState] = useState<string>('');
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Handlers (memoized)
  const handleAction = useCallback(() => {
    // Handler logic
  }, []);
  
  // Render
  return (
    <View style={styles.container}>
      <Text>{prop}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
});
```

### Import Organization
```typescript
// 1. React and React Native
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Third-party libraries
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 3. Local components
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// 4. Local utilities
import { colors, spacing } from '../../theme/tokens';
import { formatDate } from '../../utils/dateUtils';

// 5. Types
import type { Patient } from '../../types';
```

### Error Handling
```typescript
try {
  await performAction();
} catch (error: unknown) {
  const categorized = categorizeError(error);
  console.error('[Component] Error:', categorized);
  setError(categorized.userMessage);
}
```

### Accessibility
```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Action description"
  accessibilityHint="What happens when pressed"
  accessibilityState={{ disabled: isDisabled }}
  accessible={true}
>
  <Text>Action</Text>
</TouchableOpacity>
```

### Performance Optimization
```typescript
// Memoize expensive computations
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// Memoize callbacks
const handlePress = useCallback((id: string) => {
  navigate(id);
}, [navigate]);

// Memoize components
const ListItem = React.memo(({ item }) => {
  return <View>...</View>;
});
```

## Naming Conventions

### Components
- **PascalCase**: `ComponentName`, `UserProfile`, `MedicationCard`

### Hooks
- **camelCase with 'use' prefix**: `useAuth`, `useLinkedPatients`, `useDeviceState`

### Constants
- **UPPER_SNAKE_CASE**: `MAX_RETRIES`, `API_ENDPOINT`, `DEFAULT_TIMEOUT`

### Variables and Functions
- **camelCase**: `userData`, `handleSubmit`, `isLoading`

### Types and Interfaces
- **PascalCase**: `User`, `MedicationEvent`, `DeviceState`
- **Props suffix for component props**: `ComponentNameProps`

### Files
- **Components**: PascalCase - `ComponentName.tsx`
- **Utilities**: camelCase - `dateUtils.ts`
- **Hooks**: camelCase - `useAuth.ts`

## Common Issues and Fixes

### Issue: Unused Imports
```typescript
// ❌ Bad
import React from 'react';
import { View, Text, Button } from 'react-native';

function Component() {
  return <View><Text>Hello</Text></View>;
}

// ✅ Good
import { View, Text } from 'react-native';

function Component() {
  return <View><Text>Hello</Text></View>;
}
```

### Issue: Missing Accessibility
```typescript
// ❌ Bad
<TouchableOpacity onPress={handlePress}>
  <Text>Submit</Text>
</TouchableOpacity>

// ✅ Good
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Submit form"
  accessibilityHint="Submits the form data"
>
  <Text>Submit</Text>
</TouchableOpacity>
```

### Issue: Using 'any' Type
```typescript
// ❌ Bad
function handleError(error: any) {
  console.error(error);
}

// ✅ Good
function handleError(error: unknown) {
  const err = error as Error;
  console.error(err.message);
}
```

### Issue: Missing Props Interface
```typescript
// ❌ Bad
export default function Component({ name, age }) {
  return <View>...</View>;
}

// ✅ Good
export interface ComponentProps {
  name: string;
  age: number;
}

export default function Component({ name, age }: ComponentProps) {
  return <View>...</View>;
}
```

### Issue: Unbalanced Try-Catch
```typescript
// ❌ Bad
try {
  await fetchData();
}
// Missing catch block

// ✅ Good
try {
  await fetchData();
} catch (error: unknown) {
  const categorized = categorizeError(error);
  setError(categorized.userMessage);
}
```

## Shared Utilities

### Event Utilities
```typescript
import {
  getEventTypeText,
  getEventTypeColor,
  getEventTypeIcon,
  formatEventTimestamp,
  sortEventsByTimestamp,
  filterEventsByDateRange,
  groupEventsByDate,
} from '../utils/eventUtils';

// Usage
const text = getEventTypeText('medication_created'); // 'Medicamento Creado'
const color = getEventTypeColor('dose_taken'); // '#10B981'
const icon = getEventTypeIcon('dose_missed'); // 'alert-circle'
const time = formatEventTimestamp(new Date()); // 'hace unos segundos'
```

### Date Utilities
```typescript
import {
  formatDate,
  formatTime,
  getRelativeTimeString,
  isToday,
  isTomorrow,
} from '../utils/dateUtils';
```

### Error Handling
```typescript
import { categorizeError } from '../utils/errorHandling';

try {
  await operation();
} catch (error: unknown) {
  const categorized = categorizeError(error);
  // categorized.category: 'network' | 'permission' | 'validation' | 'unknown'
  // categorized.userMessage: User-friendly error message
}
```

## Pre-Commit Checklist

- [ ] Run code quality check: `node scripts/verify-code-quality.js`
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Run linter: `npx eslint --ext .ts,.tsx .`
- [ ] All components have JSDoc documentation
- [ ] All interactive elements have accessibility props
- [ ] No unused imports
- [ ] No 'any' types
- [ ] All try blocks have catch blocks
- [ ] Naming conventions followed
- [ ] Code duplication eliminated

## Resources

### Documentation
- [Task 23.1 Completion Summary](.kiro/specs/caregiver-dashboard-redesign/TASK23.1_COMPLETION_SUMMARY.md)
- [Code Review and Refactoring Report](.kiro/specs/caregiver-dashboard-redesign/TASK23.1_CODE_REVIEW_REFACTORING.md)

### Scripts
- [Code Quality Verification](scripts/verify-code-quality.js)

### Utilities
- [Event Utilities](src/utils/eventUtils.ts)
- [Date Utilities](src/utils/dateUtils.ts)
- [Error Handling](src/utils/errorHandling.ts)

## Getting Help

### Common Questions

**Q: How do I fix unused imports?**
A: Remove the import statement or use the imported item in your code.

**Q: How do I add accessibility props?**
A: Add `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` to interactive elements.

**Q: How do I avoid 'any' type?**
A: Use `unknown` and type guards, or define proper interfaces.

**Q: Where should I put shared utilities?**
A: In `src/utils/` directory with descriptive names.

**Q: How do I document a component?**
A: Add JSDoc comment above the component with description, params, returns, and example.

### Contact

For questions about code quality standards, refer to:
- Design document: `.kiro/specs/caregiver-dashboard-redesign/design.md`
- Requirements document: `.kiro/specs/caregiver-dashboard-redesign/requirements.md`
- Task list: `.kiro/specs/caregiver-dashboard-redesign/tasks.md`

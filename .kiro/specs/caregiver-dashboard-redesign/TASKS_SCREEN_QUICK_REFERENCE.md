# Tasks Screen - Quick Reference Guide

## Component Location
`app/caregiver/tasks.tsx`

## Purpose
Simple note-taking feature for caregivers to manage their to-dos with full CRUD capabilities and completion tracking.

## Key Features

### 1. Task Management
- ✅ Create new tasks
- ✅ Mark tasks complete/incomplete
- ✅ Delete tasks with confirmation
- ✅ View all tasks in a list
- ✅ Empty state when no tasks

### 2. Visual Design
- Elevated Card components for each task
- Checkbox toggle with color-coded states
- Strikethrough styling for completed tasks
- Professional spacing and typography
- Smooth animations and feedback

### 3. Accessibility
- All interactive elements have labels
- Checkbox role with proper state
- Minimum 44x44 touch targets
- Screen reader support
- Error announcements

## Component Structure

```
TasksScreen
├── Header (Add Task Button)
├── Task List (FlatList)
│   └── Task Cards
│       ├── Checkbox + Title
│       └── Delete Button
└── Add Task Modal
    ├── Input Field
    └── Action Buttons
```

## Usage Example

```typescript
// The screen is automatically rendered by Expo Router
// at route: /caregiver/tasks

// Tasks are automatically scoped to the logged-in caregiver
// via the caregiverId field in Firestore
```

## Data Model

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  caregiverId: string;      // Scopes task to caregiver
  patientId: string;        // Optional patient association
  completed: boolean;       // Completion status
  dueDate: Date | string;   // Due date (not displayed in UI)
  createdAt: Date | string; // Creation timestamp
}
```

## Key Functions

### toggleCompletion
```typescript
const toggleCompletion = async (task: Task) => {
  await updateTask(task.id, { completed: !task.completed });
  mutate(); // Refresh data
};
```

### handleAddTask
```typescript
const handleAddTask = async () => {
  if (!newTaskText.trim()) {
    setNewTaskError('Por favor ingresa una descripción');
    return;
  }
  
  await addTask({
    title: newTaskText.trim(),
    caregiverId: user.id,
    completed: false,
    // ... other fields
  });
  
  mutate();
  setModalVisible(false);
};
```

### handleDeleteTask
```typescript
const handleDeleteTask = (taskId: string) => {
  Alert.alert(
    "Eliminar Tarea",
    "¿Estás seguro?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteTask(taskId);
          mutate();
        },
      },
    ]
  );
};
```

## Styling Reference

### Task Card
```typescript
<Card
  variant="elevated"
  padding="md"
  style={styles.taskCard}
>
  {/* Task content */}
</Card>
```

### Checkbox States
- **Uncompleted:** `square-outline` icon, `colors.gray[400]`
- **Completed:** `checkbox` icon, `colors.success`

### Task Title States
- **Active:** `colors.gray[900]`, `fontWeight.medium`
- **Completed:** `colors.gray[500]`, `fontWeight.normal`, strikethrough

### Add Task Button
```typescript
<Button
  variant="primary"
  size="md"
  fullWidth
  leftIcon={<Ionicons name="add" size={24} />}
>
  Nueva Tarea
</Button>
```

## Empty State

```typescript
<View style={styles.emptyStateContainer}>
  <Ionicons name="checkbox-outline" size={64} color={colors.gray[300]} />
  <Text style={styles.emptyStateTitle}>No hay tareas</Text>
  <Text style={styles.emptyStateDescription}>
    Crea tu primera tarea para comenzar a organizar tus pendientes
  </Text>
</View>
```

## Validation

### Task Creation
- Title must not be empty
- Title is trimmed before saving
- Error message displayed if validation fails
- Error clears when user starts typing

## Firestore Integration

### Query
```typescript
// Tasks are queried by caregiverId
const tasksQuery = query(
  collection(db, 'tasks'),
  where('caregiverId', '==', caregiverId),
  orderBy('createdAt', 'desc')
);
```

### Create
```typescript
await addDoc(collection(db, 'tasks'), {
  ...taskData,
  createdAt: Timestamp.now(),
});
```

### Update
```typescript
await updateDoc(doc(db, 'tasks', taskId), updates);
```

### Delete
```typescript
await deleteDoc(doc(db, 'tasks', taskId));
```

## Performance Optimizations

1. **Memoized Callbacks:**
   - `toggleCompletion` - useCallback
   - `handleAddTask` - useCallback
   - `handleDeleteTask` - useCallback
   - `renderTaskItem` - useCallback

2. **FlatList Optimization:**
   - Proper keyExtractor
   - Memoized renderItem
   - showsVerticalScrollIndicator={false}

3. **Data Fetching:**
   - useCollectionSWR for caching
   - Automatic revalidation
   - Optimistic updates with mutate()

## Accessibility Features

### Labels
```typescript
// Checkbox
accessibilityRole="checkbox"
accessibilityState={{ checked: item.completed }}
accessibilityLabel={item.completed ? 'Mark as incomplete' : 'Mark as complete'}

// Delete button
accessibilityRole="button"
accessibilityLabel="Delete task"
accessibilityHint={`Deletes task: ${item.title}`}

// Add button
accessibilityLabel="Add new task"
accessibilityHint="Opens dialog to create a new task"
```

### Touch Targets
- Checkbox container: 44x44 points
- Delete button: 44x44 points
- Add task button: 44+ points height

### Screen Reader
- Task cards announce title and completion status
- Error messages are announced with role="alert"
- Modal title is properly announced

## Common Patterns

### Opening Modal
```typescript
const handleOpenModal = () => {
  setNewTaskText('');
  setNewTaskError('');
  setModalVisible(true);
};
```

### Closing Modal
```typescript
const handleCloseModal = () => {
  setModalVisible(false);
  setNewTaskText('');
  setNewTaskError('');
};
```

### Error Handling
```typescript
try {
  await someOperation();
  mutate();
} catch (error) {
  console.error("Error:", error);
  Alert.alert("Error", "User-friendly message");
}
```

## Testing

### Unit Tests Location
`src/components/caregiver/__tests__/TasksScreen.test.tsx`

### Test Coverage
- Task rendering
- Completion toggle
- CRUD operations
- Caregiver scoping
- Validation
- Empty state

### Running Tests
```bash
npm test TasksScreen
```

## Troubleshooting

### Tasks not loading
- Check user authentication
- Verify caregiverId in query
- Check Firestore security rules

### Tasks not updating
- Verify mutate() is called after operations
- Check network connectivity
- Verify Firestore permissions

### Styling issues
- Ensure design system tokens are imported
- Check theme/tokens.ts for values
- Verify component variants are correct

## Future Enhancements

Potential improvements for future iterations:

1. **Due Dates:**
   - Display due date in task card
   - Sort by due date
   - Highlight overdue tasks

2. **Filtering:**
   - Filter by completion status
   - Search tasks by title
   - Sort by creation date

3. **Categories:**
   - Add task categories/tags
   - Color-code by category
   - Filter by category

4. **Priority:**
   - Add priority levels
   - Visual indicators for priority
   - Sort by priority

5. **Patient Association:**
   - Link tasks to specific patients
   - Filter by patient
   - Show patient name in task card

## Related Components

- `Card` - src/components/ui/Card.tsx
- `Button` - src/components/ui/Button.tsx
- `Input` - src/components/ui/Input.tsx
- `Modal` - src/components/ui/Modal.tsx

## Related Services

- `getTasksQuery` - src/services/firebase/tasks.ts
- `addTask` - src/services/firebase/tasks.ts
- `updateTask` - src/services/firebase/tasks.ts
- `deleteTask` - src/services/firebase/tasks.ts

## Related Hooks

- `useCollectionSWR` - src/hooks/useCollectionSWR.ts
- `useSelector` - Redux store access

## Design System Tokens Used

### Colors
- `colors.background` - #F2F2F7
- `colors.surface` - #FFFFFF
- `colors.primary[500]` - #007AFF
- `colors.success` - #34C759
- `colors.error[500]` - #FF3B30
- `colors.gray[*]` - Various gray shades

### Spacing
- `spacing.xs` - 4px
- `spacing.sm` - 8px
- `spacing.md` - 12px
- `spacing.lg` - 16px
- `spacing.xl` - 20px
- `spacing['2xl']` - 24px
- `spacing['3xl']` - 32px

### Typography
- `fontSize.xs` - 12px
- `fontSize.sm` - 14px
- `fontSize.base` - 16px
- `fontSize.lg` - 18px
- `fontSize.xl` - 20px
- `fontWeight.normal` - 400
- `fontWeight.medium` - 500
- `fontWeight.semibold` - 600

### Border Radius
- `borderRadius.md` - 12px
- `borderRadius.lg` - 16px

## Requirements Met

✅ 9.1 - Tasks screen preserved and functional
✅ 9.2 - Updated styling to match design system
✅ 9.3 - Tasks scoped to individual caregiver
✅ 9.4 - Proper data persistence
✅ 9.5 - Clean, minimal interface

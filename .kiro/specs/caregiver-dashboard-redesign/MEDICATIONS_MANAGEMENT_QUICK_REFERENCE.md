# Medications Management - Quick Reference Guide

## Overview
High-quality medications management interface for caregivers with full CRUD operations, search/filter, and automatic event generation.

## Screen Structure

### 1. Medication List (`/caregiver/medications/[patientId]`)
```
┌─────────────────────────────────────┐
│  Search: [🔍 Buscar medicamentos]  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ 💊 Aspirin                    │  │
│  │ 500 mg tablet                 │  │
│  │ 🕐 8:00 AM  🕐 8:00 PM       │  │
│  │ 📅 Every day                  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 💊 Ibuprofen [⚠️ Bajo]       │  │
│  │ 200 mg tablet                 │  │
│  │ 🕐 12:00 PM                   │  │
│  │ 📅 5 days per week            │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [+ Agregar Medicamento]            │
└─────────────────────────────────────┘
```

**Features:**
- Real-time search/filter
- Low inventory badges
- Animated list items
- Empty state handling
- Loading skeletons
- Error handling with retry

### 2. Add Medication (`/caregiver/medications/[patientId]/add`)
```
┌─────────────────────────────────────┐
│  ← Agregar Medicamento              │
├─────────────────────────────────────┤
│                                     │
│  [Medication Wizard - 4 Steps]     │
│                                     │
│  Step 1: Icon & Name               │
│  Step 2: Schedule                  │
│  Step 3: Dosage                    │
│  Step 4: Inventory (optional)      │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Full wizard integration
- Modern header with back button
- Patient and caregiver ID handling
- Success/error alerts
- Automatic event generation

### 3. Medication Detail/Edit (`/caregiver/medications/[patientId]/[id]`)
```
┌─────────────────────────────────────┐
│  Detail View (Default)              │
├─────────────────────────────────────┤
│  💊 Aspirin                         │
│  500 mg tablet                      │
│                                     │
│  Schedule:                          │
│  🕐 8:00 AM, 8:00 PM               │
│  📅 Every day                       │
│                                     │
│  Inventory:                         │
│  📦 45 doses remaining              │
│  ⚠️ Low: 10 doses                  │
│                                     │
│  [Editar] [Eliminar] [Rellenar]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Edit Mode (When editing)           │
├─────────────────────────────────────┤
│  [Medication Wizard - 3 Steps]     │
│                                     │
│  Step 1: Icon & Name               │
│  Step 2: Schedule                  │
│  Step 3: Dosage                    │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Detail view by default
- Edit mode with wizard
- Delete confirmation
- Refill functionality
- Automatic event generation

## Key Components

### MedicationCard
Displays medication information in a card format.

**Props:**
```typescript
{
  medication: Medication;
  onPress: () => void;
  showLowQuantityBadge?: boolean;
  currentQuantity?: number;
}
```

**Features:**
- Icon and name display
- Dosage information
- Scheduled times with chips
- Frequency display
- Low quantity badge (optional)

### MedicationWizard
Multi-step wizard for adding/editing medications.

**Props:**
```typescript
{
  mode: 'add' | 'edit';
  medication?: Medication;
  onComplete: (formData: MedicationFormData) => void;
  onCancel: () => void;
}
```

**Steps:**
1. **Icon & Name**: Select emoji and enter medication name
2. **Schedule**: Set times and frequency
3. **Dosage**: Enter dose value, unit, and quantity type
4. **Inventory**: Set initial quantity and threshold (add mode only)

### MedicationDetailView
Displays detailed medication information with actions.

**Props:**
```typescript
{
  medication: Medication;
  onEdit: () => void;
  onDelete: () => void;
  onRefillComplete: () => void;
}
```

**Features:**
- Complete medication details
- Inventory status
- Edit/Delete/Refill actions
- Low quantity banner

## Data Flow

### Adding a Medication
```
User fills wizard
    ↓
handleWizardComplete
    ↓
dispatch(addMedication)
    ↓
medicationsSlice.addMedication
    ↓
Firestore: medications collection
    ↓
Event: medication_created
    ↓
Event Queue → Sync to Firestore
```

### Updating a Medication
```
User edits in wizard
    ↓
handleWizardComplete
    ↓
dispatch(updateMedication)
    ↓
medicationsSlice.updateMedication
    ↓
Firestore: medications collection
    ↓
Event: medication_updated (with changes)
    ↓
Event Queue → Sync to Firestore
```

### Deleting a Medication
```
User taps delete
    ↓
Confirmation dialog
    ↓
handleDelete
    ↓
dispatch(deleteMedication)
    ↓
medicationsSlice.deleteMedication
    ↓
Event: medication_deleted
    ↓
Firestore: delete medication
    ↓
Event Queue → Sync to Firestore
```

## Event Generation

All CRUD operations automatically generate events:

### Created Event
```typescript
{
  eventType: 'created',
  medicationId: string,
  medicationName: string,
  medicationData: Medication,
  patientId: string,
  patientName: string,
  caregiverId: string,
  timestamp: string,
  syncStatus: 'pending'
}
```

### Updated Event
```typescript
{
  eventType: 'updated',
  medicationId: string,
  medicationName: string,
  medicationData: Medication,
  patientId: string,
  patientName: string,
  caregiverId: string,
  timestamp: string,
  syncStatus: 'pending',
  changes: [
    {
      field: string,
      oldValue: any,
      newValue: any
    }
  ]
}
```

### Deleted Event
```typescript
{
  eventType: 'deleted',
  medicationId: string,
  medicationName: string,
  medicationData: Medication,
  patientId: string,
  patientName: string,
  caregiverId: string,
  timestamp: string,
  syncStatus: 'pending'
}
```

## Search/Filter

### Search Implementation
```typescript
const filteredMedications = useMemo(() => {
  if (!searchQuery.trim()) return medications;
  
  const query = searchQuery.toLowerCase();
  return medications.filter(med => 
    med.name.toLowerCase().includes(query) ||
    med.doseUnit?.toLowerCase().includes(query) ||
    med.quantityType?.toLowerCase().includes(query)
  );
}, [medications, searchQuery]);
```

**Searchable Fields:**
- Medication name
- Dose unit (mg, ml, etc.)
- Quantity type (tablet, capsule, etc.)

## Error Handling

### Network Errors
```typescript
Alert.alert(
  'Error',
  'No se pudo guardar el medicamento. Por favor intenta de nuevo.',
  [
    { text: 'Reintentar', onPress: () => retry() },
    { text: 'Cancelar', style: 'cancel' }
  ]
);
```

### Validation Errors
- Inline error messages
- Form field highlighting
- Clear error descriptions

### Loading States
- Skeleton loaders during initial load
- Loading spinners for operations
- Disabled buttons during submission

## Accessibility

### Labels and Hints
```typescript
<Button
  accessibilityLabel="Agregar medicamento"
  accessibilityHint="Navega a la pantalla para agregar un nuevo medicamento"
>
  Agregar Medicamento
</Button>
```

### Touch Targets
- Minimum 44x44 points for all interactive elements
- Adequate spacing between elements

### Screen Reader Support
- Logical focus order
- Descriptive labels
- Status announcements

## Performance Optimizations

### List Virtualization
```typescript
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
/>
```

### Memoization
```typescript
const filteredMedications = useMemo(() => { ... }, [medications, searchQuery]);
const handleDelete = useCallback(() => { ... }, [medication, dispatch]);
const renderItem = useCallback(() => { ... }, [router, lowInventoryMeds]);
```

### Component Optimization
- React.memo for MedicationCard
- Lazy loading of wizard steps
- Efficient re-renders

## Common Use Cases

### 1. Add Medication for Patient
```typescript
// Navigate to add screen
router.push(`/caregiver/medications/${patientId}/add`);

// Fill wizard
// Step 1: Select emoji and name
// Step 2: Set schedule
// Step 3: Enter dosage
// Step 4: Set inventory (optional)

// Submit
// → Medication created
// → Event generated
// → Navigate back to list
```

### 2. Edit Medication
```typescript
// Tap medication in list
// → Navigate to detail view

// Tap "Editar"
// → Switch to edit mode (wizard)

// Make changes
// → Submit

// → Medication updated
// → Event generated with changes
// → Return to detail view
```

### 3. Delete Medication
```typescript
// From detail view, tap "Eliminar"
// → Confirmation dialog

// Confirm deletion
// → Medication deleted
// → Event generated
// → Navigate back to list
```

### 4. Search Medications
```typescript
// Type in search bar
// → List filters in real-time
// → Shows matching medications

// Clear search
// → Shows all medications
```

### 5. Refill Inventory
```typescript
// From detail view, tap "Rellenar"
// → Refill dialog opens

// Enter new quantity
// → Confirm

// → Inventory updated
// → Low quantity badge removed (if applicable)
```

## Integration Points

### Dashboard
```typescript
// Quick action to medications
<QuickActionsPanel
  onNavigate={(screen) => {
    if (screen === 'medications') {
      router.push(`/caregiver/medications/${patientId}`);
    }
  }}
/>
```

### Events Registry
```typescript
// Display medication events
<MedicationEventCard
  event={{
    eventType: 'created',
    medicationName: 'Aspirin',
    timestamp: '2024-01-15T10:30:00Z'
  }}
/>
```

### Device Management
```typescript
// Sync medication schedules to device
// → Alarms created on device
// → Device displays medication reminders
```

## Troubleshooting

### Issue: Medications not loading
**Solution:**
1. Check patient ID is valid
2. Verify Firestore permissions
3. Check network connection
4. Review Redux state

### Issue: Events not generating
**Solution:**
1. Verify caregiver ID is set
2. Check medicationEventService is initialized
3. Review event queue status
4. Check Firestore rules

### Issue: Search not working
**Solution:**
1. Verify searchQuery state is updating
2. Check filteredMedications memo dependencies
3. Review filter logic

### Issue: Wizard not saving
**Solution:**
1. Check form validation
2. Verify patient and caregiver IDs
3. Review Redux thunk errors
4. Check Firestore permissions

## Best Practices

### 1. Always Pass Caregiver ID
```typescript
const medicationData = {
  ...formData,
  patientId: pid,
  caregiverId: user.id, // Important!
};
```

### 2. Handle Loading States
```typescript
if (loading) {
  return <ListSkeleton count={4} ItemSkeleton={MedicationCardSkeleton} />;
}
```

### 3. Provide Error Recovery
```typescript
if (error) {
  return <ErrorMessage message={error} onRetry={handleRetry} />;
}
```

### 4. Use Confirmation Dialogs
```typescript
Alert.alert(
  'Eliminar Medicamento',
  `¿Estás seguro de que deseas eliminar "${medication.name}"?`,
  [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: handleDelete }
  ]
);
```

### 5. Optimize List Rendering
```typescript
const renderItem = useCallback(({ item, index }) => (
  <AnimatedListItem index={index} delay={50}>
    <MedicationCard medication={item} onPress={() => navigate(item.id)} />
  </AnimatedListItem>
), [navigate]);
```

## Conclusion

The medications management screen provides caregivers with a comprehensive, user-friendly interface for managing patient medications. With full CRUD operations, real-time search, automatic event generation, and proper error handling, it matches the quality of the patient-side implementation while maintaining consistency with the overall design system.

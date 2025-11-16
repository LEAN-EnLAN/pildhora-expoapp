# Event Detail View - Quick Reference

## Component Overview

**File**: `app/caregiver/events/[id].tsx`

**Purpose**: Display comprehensive information about a medication event with enhanced visual design and timeline view for changes.

## Key Components

### 1. EventHeader
```typescript
<EventHeader event={event} />
```
- Displays EventTypeBadge (lg size)
- Shows event icon, patient name, medication name
- Includes relative timestamp

### 2. ChangeDiffSection
```typescript
{event.eventType === 'updated' && event.changes && (
  <ChangeDiffSection changes={event.changes} />
)}
```
- Timeline view with dots and connecting lines
- Old/new value comparison
- Color-coded value containers

### 3. MedicationSnapshotSection
```typescript
<MedicationSnapshotSection medicationData={event.medicationData} />
```
- Icon-enhanced field display
- Complete medication information
- Null-safe rendering

### 4. PatientContactSection
```typescript
{patient && <PatientContactSection patient={patient} />}
```
- Contact information with icons
- Improved layout with backgrounds
- Adherence and last dose info

## Timeline View Structure

```typescript
function ChangeTimelineItem({ change, isLast }) {
  return (
    <View style={styles.timelineItem}>
      {/* Timeline connector */}
      <View style={styles.timelineConnector}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      
      {/* Change content */}
      <View style={styles.timelineContent}>
        <Text style={styles.changeField}>{fieldLabel}</Text>
        <View style={styles.changeValues}>
          <View style={styles.oldValue}>
            <Text style={styles.valueLabel}>Anterior</Text>
            <Text style={styles.oldValueText}>{oldValue}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} />
          <View style={styles.newValue}>
            <Text style={styles.valueLabel}>Nuevo</Text>
            <Text style={styles.newValueText}>{newValue}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
```

## Styling Quick Reference

### Card Variants
```typescript
<Card variant="elevated" padding="lg" style={styles.section}>
```

### Section Headers
```typescript
<View style={styles.sectionHeader}>
  <View style={styles.sectionIconContainer}>
    <Ionicons name="icon-name" size={24} color={colors.primary[500]} />
  </View>
  <Text style={styles.sectionTitle}>Title</Text>
</View>
```

### Timeline Styles
```typescript
timelineDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: colors.primary[500],
  borderWidth: 3,
  borderColor: colors.primary[100],
}

timelineLine: {
  flex: 1,
  width: 2,
  backgroundColor: colors.primary[100],
  marginTop: spacing.xs,
}
```

### Value Containers
```typescript
oldValue: {
  flex: 1,
  padding: spacing.md,
  backgroundColor: colors.error[50],
  borderRadius: borderRadius.md,
  borderLeftWidth: 3,
  borderLeftColor: colors.error[500],
}

newValue: {
  flex: 1,
  padding: spacing.md,
  backgroundColor: colors.success + '20',
  borderRadius: borderRadius.md,
  borderLeftWidth: 3,
  borderLeftColor: colors.success,
}
```

## Icon Mapping

### Medication Snapshot Icons
```typescript
const iconMap = {
  emoji: 'happy-outline',
  name: 'medical-outline',
  doseValue: 'water-outline',
  quantityType: 'cube-outline',
  times: 'time-outline',
  frequency: 'repeat-outline',
  trackInventory: 'layers-outline',
  lowQuantityThreshold: 'warning-outline',
};
```

### Patient Contact Icons
```typescript
const contactIcons = {
  name: 'person',
  email: 'mail',
  adherence: 'stats-chart',
  lastTaken: 'time',
};
```

## Helper Functions

### Get Event Type Icon
```typescript
function getEventTypeIcon(eventType: string) {
  switch (eventType) {
    case 'created':
      return { name: 'add-circle', color: colors.success, backgroundColor: '#E6F7ED' };
    case 'updated':
      return { name: 'create', color: colors.primary[500], backgroundColor: colors.primary[50] };
    case 'deleted':
      return { name: 'trash', color: colors.error[500], backgroundColor: colors.error[50] };
    default:
      return { name: 'information-circle', color: colors.info, backgroundColor: '#F0EFFF' };
  }
}
```

### Get Field Label
```typescript
function getFieldLabel(field: string): string {
  const fieldLabels: Record<string, string> = {
    name: 'Nombre',
    doseValue: 'Valor de dosis',
    doseUnit: 'Unidad',
    quantityType: 'Tipo',
    times: 'Horarios',
    frequency: 'Frecuencia',
    emoji: 'Icono',
    currentQuantity: 'Cantidad actual',
    lowQuantityThreshold: 'Umbral bajo',
    trackInventory: 'Seguimiento de inventario',
  };
  return fieldLabels[field] || field;
}
```

### Format Value
```typescript
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}
```

## Data Loading

### Load Event Data
```typescript
useEffect(() => {
  const loadEventData = async () => {
    try {
      const db = await getDbInstance();
      const eventDoc = await getDoc(doc(db, 'medicationEvents', id));
      
      if (!eventDoc.exists()) {
        throw new Error('Evento no encontrado');
      }
      
      const eventData = eventDoc.data();
      
      // Verify caregiver access
      if (eventData.caregiverId !== user.id) {
        throw new Error('No tienes permiso para ver este evento');
      }
      
      setEvent(loadedEvent);
      // Load patient data...
    } catch (err) {
      setError(err.message);
    }
  };
  
  loadEventData();
}, [id, user?.id]);
```

## Navigation

### View Medications
```typescript
const handleViewMedication = () => {
  router.push({
    pathname: '/caregiver/medications/[patientId]',
    params: { patientId: event.patientId },
  });
};
```

### Contact Patient
```typescript
const handleContactPatient = () => {
  Alert.alert('Contactar Paciente', `¿Cómo deseas contactar a ${patient.name}?`, [
    {
      text: 'Email',
      onPress: () => Linking.openURL(`mailto:${patient.email}`),
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
};
```

## Accessibility

### Labels
```typescript
accessibilityLabel={`${event.patientName} ${eventTypeText.toLowerCase()} ${event.medicationName} ${relativeTime}`}
accessibilityHint="Navega a la lista de medicamentos del paciente"
accessibilityRole="button"
```

### Touch Targets
- Minimum 44x44 points for all interactive elements
- Icon containers: 40x40px or larger
- Adequate spacing between elements

## Common Patterns

### Conditional Rendering
```typescript
{event.eventType === 'updated' && event.changes && event.changes.length > 0 && (
  <ChangeDiffSection changes={event.changes} />
)}

{medicationData.emoji && (
  <View style={styles.snapshotRow}>
    <Text>{medicationData.emoji}</Text>
  </View>
)}
```

### Loading State
```typescript
if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
      <Text style={styles.loadingText}>Cargando evento...</Text>
    </View>
  );
}
```

### Error State
```typescript
if (error || !event) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.error[500]} />
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorMessage}>{error || 'Evento no encontrado'}</Text>
      <Button variant="primary" onPress={() => router.back()}>Volver</Button>
    </View>
  );
}
```

## Performance Tips

1. **Memoization**: Use React.memo for sub-components if needed
2. **Keys**: Proper key usage in timeline items
3. **Conditional Rendering**: Only render sections with data
4. **Optimized Styles**: Use StyleSheet.create for all styles

## Testing

### Test Event Data
```typescript
const mockEvent: MedicationEvent = {
  id: 'event-123',
  eventType: 'updated',
  medicationId: 'med-456',
  medicationName: 'Aspirina',
  medicationData: {
    name: 'Aspirina',
    doseValue: 20,
    doseUnit: 'mg',
    times: ['09:00', '21:00'],
  },
  patientId: 'patient-789',
  patientName: 'Juan Pérez',
  caregiverId: 'caregiver-101',
  timestamp: new Date().toISOString(),
  syncStatus: 'synced',
  changes: [
    { field: 'doseValue', oldValue: 10, newValue: 20 },
    { field: 'times', oldValue: ['08:00', '20:00'], newValue: ['09:00', '21:00'] },
  ],
};
```

## Troubleshooting

### Issue: Timeline not showing
- Check if `event.eventType === 'updated'`
- Verify `event.changes` exists and has items

### Issue: Icons not displaying
- Ensure Ionicons is imported
- Check icon name spelling
- Verify icon size and color props

### Issue: Colors not matching design
- Use design system tokens (colors.primary[500], etc.)
- Check for hardcoded color values
- Verify token imports

## Related Files

- `src/components/caregiver/EventTypeBadge.tsx` - Event type badge component
- `src/theme/tokens.ts` - Design system tokens
- `src/utils/dateUtils.ts` - Date formatting utilities
- `src/types/index.ts` - TypeScript type definitions

## Design System Tokens

```typescript
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/theme/tokens';

// Colors
colors.primary[500]
colors.error[50]
colors.success
colors.gray[900]

// Spacing
spacing.xs  // 4px
spacing.sm  // 8px
spacing.md  // 12px
spacing.lg  // 16px
spacing.xl  // 24px

// Typography
typography.fontSize.xs
typography.fontSize.sm
typography.fontSize.base
typography.fontSize.lg
typography.fontSize.xl
typography.fontWeight.medium
typography.fontWeight.semibold
typography.fontWeight.bold

// Border Radius
borderRadius.sm
borderRadius.md
borderRadius.lg
borderRadius.full

// Shadows
shadows.sm
```

## Quick Checklist

- [ ] EventTypeBadge integrated
- [ ] Timeline view for changes
- [ ] Elevated card variants
- [ ] Icon containers styled
- [ ] Accessibility labels added
- [ ] Loading state implemented
- [ ] Error state handled
- [ ] Navigation working
- [ ] Design tokens used
- [ ] TypeScript types correct

# EventFilterControls Visual Guide

## Component Overview

The EventFilterControls component provides a comprehensive filtering interface for the medication events registry. It features a search bar and multiple filter chips that open modal dialogs for selection.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🔍  [Search by medication name...]              [×]        │
├─────────────────────────────────────────────────────────────┤
│  👤 Todos los pacientes ▼  📋 Todos los eventos ▼           │
│  📅 Todo el tiempo ▼  [× Limpiar]                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Search Bar

```
┌─────────────────────────────────────────────────────────────┐
│  🔍  Buscar por medicamento...                    [×]       │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Search icon on the left
- Placeholder text: "Buscar por medicamento..."
- Clear button (×) appears when text is entered
- Real-time filtering as user types
- Gray border, white background
- Rounded corners

**States:**
- Empty: Shows placeholder, no clear button
- With text: Shows entered text, clear button visible
- Active: Border color changes on focus

### 2. Filter Chips Row

```
┌──────────────────────────────────────────────────────────────┐
│  [👤 Todos los pacientes ▼]  [📋 Todos los eventos ▼]       │
│  [📅 Todo el tiempo ▼]  [× Limpiar]                         │
└──────────────────────────────────────────────────────────────┘
```

**Chip Types:**

#### Patient Filter Chip
```
┌─────────────────────────────┐
│  👤 Todos los pacientes  ▼  │
└─────────────────────────────┘
```
- Person icon
- Patient name or "Todos los pacientes"
- Chevron down icon
- **Active state**: Blue background, blue border
- **Inactive state**: White background, gray border

#### Event Type Filter Chip
```
┌──────────────────────────────┐
│  📋 Todos los eventos  ▼     │
└──────────────────────────────┘
```
- List icon
- Event type label or "Todos los eventos"
- Chevron down icon
- **Active state**: Blue background, blue border
- **Inactive state**: White background, gray border

#### Date Range Filter Chip
```
┌──────────────────────────────┐
│  📅 Todo el tiempo  ▼        │
└──────────────────────────────┘
```
- Calendar icon
- Date range label or "Todo el tiempo"
- Chevron down icon
- **Active state**: Blue background, blue border
- **Inactive state**: White background, gray border

#### Clear Filters Button
```
┌──────────────────┐
│  × Limpiar       │
└──────────────────┘
```
- Close circle icon
- "Limpiar" text
- Red background, red border
- Only visible when filters are active

### 3. Patient Selection Modal

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Filtrar por paciente                                 │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Todos los pacientes                        ✓   │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  Juan Pérez                                     │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  María García                                   │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  Carlos López                                   │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │              Cerrar                             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Semi-transparent dark overlay
- White card centered on screen
- Title: "Filtrar por paciente"
- Scrollable list of options
- Checkmark (✓) for selected option
- Active option has blue background
- Close button at bottom
- Tap outside to dismiss

### 4. Event Type Selection Modal

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Filtrar por tipo de evento                           │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Todos los eventos                          ✓   │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  ➕ Creados                                     │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  ✏️ Actualizados                                │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  🗑️ Eliminados                                  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │              Cerrar                             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Event Type Options:**
- **Todos los eventos**: No filter (default)
- **➕ Creados**: Green icon, shows medication creation events
- **✏️ Actualizados**: Blue icon, shows medication update events
- **🗑️ Eliminados**: Red icon, shows medication deletion events

### 5. Date Range Selection Modal

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Filtrar por fecha                                    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Todo el tiempo                             ✓   │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  Hoy                                            │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  Últimos 7 días                                 │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │  Este mes                                       │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │              Cerrar                             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Date Range Presets:**
- **Todo el tiempo**: No date filter (default)
- **Hoy**: Current day only
- **Últimos 7 días**: Past 7 days from now
- **Este mes**: Current month from day 1 to now

## Color Scheme

### Inactive State
- Background: `colors.surface` (white)
- Border: `colors.gray[300]` (light gray)
- Text: `colors.gray[700]` (dark gray)
- Icons: `colors.gray[600]` (medium gray)

### Active State
- Background: `colors.primary[50]` (light blue)
- Border: `colors.primary[500]` (primary blue)
- Text: `colors.primary[500]` (primary blue)
- Icons: `colors.primary[500]` (primary blue)

### Clear Button
- Background: `colors.error[50]` (light red)
- Border: `colors.error[500]` (error red)
- Text: `colors.error[500]` (error red)
- Icons: `colors.error[500]` (error red)

### Modal
- Overlay: `rgba(0, 0, 0, 0.5)` (50% black)
- Card background: `colors.surface` (white)
- Selected option background: `colors.primary[50]` (light blue)

## Interaction Flow

### Search Flow
```
1. User taps search bar
   ↓
2. Keyboard appears
   ↓
3. User types medication name
   ↓
4. Events filter in real-time
   ↓
5. User taps clear button (×) to reset
```

### Filter Selection Flow
```
1. User taps filter chip
   ↓
2. Modal opens with options
   ↓
3. User selects option
   ↓
4. Modal closes
   ↓
5. Chip updates with selection
   ↓
6. Events list updates
   ↓
7. Filter persists to AsyncStorage
```

### Clear Filters Flow
```
1. User has active filters
   ↓
2. Clear button appears
   ↓
3. User taps clear button
   ↓
4. All filters reset
   ↓
5. Events list shows all events
   ↓
6. Empty state persists to AsyncStorage
```

## Responsive Behavior

### Horizontal Scrolling
- Filter chips row scrolls horizontally if content exceeds screen width
- No horizontal scroll indicator shown
- Smooth scroll animation
- Right padding ensures last chip is fully visible

### Modal Sizing
- Modal width: 100% of screen with padding
- Max width: 400px (for tablets)
- Max height: 80% of screen
- Content scrolls if options exceed height

## Accessibility

### Touch Targets
- All interactive elements: minimum 44x44 points
- Extended hit slop for small icons
- Adequate spacing between chips

### Visual Feedback
- Active states clearly indicated with color
- Icons provide visual context
- Checkmarks confirm selections
- Loading states (if needed)

### Screen Reader Support
- Meaningful labels for all controls
- Descriptive placeholders
- Announced state changes
- Logical focus order

## State Persistence

### What Gets Saved
```json
{
  "patientId": "patient-123",
  "eventType": "created",
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "searchQuery": "aspirin"
}
```

### Storage Key
- Key: `@medication_event_filters`
- Location: AsyncStorage
- Format: JSON string
- Automatic serialization/deserialization

### Persistence Timing
- **Load**: On component mount
- **Save**: On every filter change
- **Clear**: When clear button pressed

## Integration Example

```typescript
import { EventFilterControls, EventFilters } from '../../src/components/caregiver/EventFilterControls';

// In your screen component
const [filters, setFilters] = useState<EventFilters>({});

<EventFilterControls
  filters={filters}
  onFiltersChange={setFilters}
  patients={[
    { id: '1', name: 'Juan Pérez' },
    { id: '2', name: 'María García' },
  ]}
/>
```

## Performance Considerations

1. **Memoization**: Filter handlers use callbacks to prevent re-renders
2. **Conditional Rendering**: Clear button only renders when needed
3. **Efficient Storage**: Only saves when filters actually change
4. **Debounced Search**: Search updates state directly for responsiveness
5. **Lazy Modals**: Modals only render when visible

## Best Practices

1. **Always provide patient list**: Even if empty, pass an empty array
2. **Handle filter changes**: Implement proper handler to update parent state
3. **Persist filters**: Let component handle AsyncStorage automatically
4. **Clear on logout**: Clear AsyncStorage when user logs out
5. **Test with data**: Verify with multiple patients and events

## Common Use Cases

### Single Patient
```typescript
<EventFilterControls
  filters={filters}
  onFiltersChange={setFilters}
  patients={[{ id: '1', name: 'Juan Pérez' }]}
/>
// Patient filter chip will still show but with only one option
```

### Multiple Patients
```typescript
<EventFilterControls
  filters={filters}
  onFiltersChange={setFilters}
  patients={[
    { id: '1', name: 'Juan Pérez' },
    { id: '2', name: 'María García' },
    { id: '3', name: 'Carlos López' },
  ]}
/>
// Patient filter chip shows all patients in modal
```

### No Patients
```typescript
<EventFilterControls
  filters={filters}
  onFiltersChange={setFilters}
  patients={[]}
/>
// Patient filter chip shows "Todos los pacientes" only
```

## Troubleshooting

### Filters Not Persisting
- Check AsyncStorage permissions
- Verify storage key is consistent
- Ensure JSON serialization works
- Check for errors in console

### Modal Not Opening
- Verify state variables are defined
- Check for conflicting modals
- Ensure TouchableOpacity is not disabled
- Verify Modal component is imported

### Filters Not Applying
- Check onFiltersChange callback
- Verify parent component updates state
- Ensure Firestore queries use filters
- Check client-side filter logic

### Search Not Working
- Verify searchQuery is in filters object
- Check case-insensitive comparison
- Ensure medication name field exists
- Verify useMemo dependencies

## Conclusion

The EventFilterControls component provides a comprehensive, user-friendly interface for filtering medication events. Its visual design follows the app's design system, and its functionality covers all common filtering scenarios while maintaining excellent performance and user experience.

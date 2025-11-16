# Type Documentation Quick Reference

## Overview

This guide provides quick access to the most commonly used types in the caregiver dashboard implementation. All types are fully documented with JSDoc comments in `src/types/index.ts`.

## How to Use This Guide

1. Find the type you need in the sections below
2. See the quick example
3. Hover over the type in your IDE for full documentation
4. Check `src/types/index.ts` for complete details

## Core Types

### User & Patient Types

```typescript
// User account
import { User, Patient, PatientWithDevice } from '@/types';

const user: User = {
  id: 'user-123',
  email: 'john@example.com',
  role: 'caregiver',
  name: 'John Doe',
  createdAt: new Date()
};

// Patient with device state
const patient: PatientWithDevice = {
  id: 'patient-123',
  name: 'Jane Doe',
  email: 'jane@example.com',
  caregiverId: 'caregiver-456',
  deviceId: 'DEVICE-001',
  createdAt: new Date(),
  deviceState: {
    is_online: true,
    battery_level: 85,
    current_status: 'PENDING'
  }
};
```

### Medication Types

```typescript
import { Medication, DOSE_UNITS, QUANTITY_TYPES } from '@/types';

const medication: Medication = {
  id: 'med-123',
  name: 'Aspirin',
  doseValue: '500',
  doseUnit: 'mg',
  quantityType: 'tablets',
  frequency: 'daily',
  times: ['08:00', '20:00'],
  patientId: 'patient-456',
  caregiverId: 'caregiver-789',
  createdAt: new Date(),
  updatedAt: new Date(),
  emoji: '💊',
  trackInventory: true,
  currentQuantity: 30
};

// Get dose unit label
const unit = DOSE_UNITS.find(u => u.id === 'mg');
console.log(unit?.label); // "mg (miligramos)"
```

### Event Types

```typescript
import { MedicationEvent, MedicationEventType } from '@/types';

const event: MedicationEvent = {
  id: 'event-123',
  eventType: 'updated',
  medicationId: 'med-456',
  medicationName: 'Aspirin',
  medicationData: { doseValue: '1000', doseUnit: 'mg' },
  patientId: 'patient-789',
  patientName: 'John Doe',
  caregiverId: 'caregiver-012',
  timestamp: new Date(),
  syncStatus: 'delivered',
  changes: [
    { field: 'doseValue', oldValue: '500', newValue: '1000' }
  ]
};
```

### Device Types

```typescript
import { DeviceState, DeviceConfig, DeviceLink } from '@/types';

// Real-time device state (from RTDB)
const deviceState: DeviceState = {
  is_online: true,
  battery_level: 85,
  current_status: 'PENDING',
  last_seen: Date.now()
};

// Device configuration (from Firestore)
const config: DeviceConfig = {
  deviceId: 'DEVICE-001',
  alarmMode: 'both',
  ledIntensity: 512,
  ledColor: { r: 255, g: 0, b: 0 },
  lastUpdated: new Date(),
  syncStatus: 'synced'
};

// Device link (patient-device-caregiver relationship)
const link: DeviceLink = {
  id: 'DEVICE-001_caregiver-123',
  deviceId: 'DEVICE-001',
  userId: 'caregiver-123',
  role: 'caregiver',
  status: 'active',
  linkedAt: new Date()
};
```

## Component Props Types

### Header & Navigation

```typescript
import { CaregiverHeaderProps, CaregiverScreen } from '@/types';

// Header props
const headerProps: CaregiverHeaderProps = {
  caregiverName: 'Dr. Smith',
  title: 'Dashboard',
  showScreenTitle: true,
  onLogout: handleLogout,
  onEmergency: handleEmergency
};

// Navigation type
const screen: CaregiverScreen = 'events';
router.push(`/caregiver/${screen}`);
```

### Dashboard Components

```typescript
import {
  QuickActionsPanelProps,
  DeviceConnectivityCardProps,
  LastMedicationStatusCardProps,
  PatientSelectorProps
} from '@/types';

// Quick actions
const quickActionsProps: QuickActionsPanelProps = {
  onNavigate: (screen) => router.push(`/caregiver/${screen}`)
};

// Device connectivity
const deviceProps: DeviceConnectivityCardProps = {
  deviceId: 'DEVICE-001',
  onManageDevice: () => router.push('/caregiver/add-device')
};

// Last medication status
const statusProps: LastMedicationStatusCardProps = {
  patientId: 'patient-123',
  caregiverId: 'caregiver-456',
  onViewAll: () => router.push('/caregiver/events')
};

// Patient selector
const selectorProps: PatientSelectorProps = {
  patients: linkedPatients,
  selectedPatientId: currentPatientId,
  onSelectPatient: setCurrentPatientId,
  loading: false
};
```

### Event Components

```typescript
import {
  EventFilterControlsProps,
  EventFilters,
  EventTypeBadgeProps,
  MedicationEventCardProps
} from '@/types';

// Event filters
const filters: EventFilters = {
  patientId: 'patient-123',
  eventType: 'created',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  searchQuery: 'aspirin'
};

// Filter controls
const filterProps: EventFilterControlsProps = {
  filters: currentFilters,
  onFiltersChange: setFilters,
  patients: linkedPatients
};

// Event badge
const badgeProps: EventTypeBadgeProps = {
  eventType: 'created',
  size: 'md'
};

// Event card
const cardProps: MedicationEventCardProps = {
  event: medicationEvent,
  onPress: () => router.push(`/caregiver/events/${event.id}`),
  showPatientName: true
};
```

### Error & Offline Components

```typescript
import { ErrorStateProps, OfflineIndicatorProps } from '@/types';

// Error state
const errorProps: ErrorStateProps = {
  title: 'Failed to Load',
  message: 'Could not load patient data. Please try again.',
  onRetry: handleRetry,
  showIcon: true
};

// Offline indicator
const offlineProps: OfflineIndicatorProps = {
  isOnline: false // Optional override
};
```

## State Management Types

### Dashboard State

```typescript
import { DashboardState } from '@/types';

const [state, setState] = useState<DashboardState>({
  selectedPatientId: null,
  patients: [],
  deviceStatus: null,
  lastEvent: null,
  loading: true,
  error: null
});
```

### Offline Support

```typescript
import { CachedPatientData, OfflineMedicationChange } from '@/types';

// Cache patient data
const cachedData: CachedPatientData = {
  patientId: 'patient-123',
  patient: patientData,
  medications: medicationsList,
  events: recentEvents,
  cachedAt: Date.now(),
  expiresAt: Date.now() + (24 * 60 * 60 * 1000)
};

// Queue offline change
const change: OfflineMedicationChange = {
  id: 'change-123',
  operation: 'update',
  medicationId: 'med-456',
  medicationData: { doseValue: '1000' },
  patientId: 'patient-789',
  caregiverId: 'caregiver-012',
  timestamp: Date.now(),
  synced: false
};
```

## Enums & Constants

### Intake Status

```typescript
import { IntakeStatus } from '@/types';

const status: IntakeStatus = IntakeStatus.TAKEN;

if (status === IntakeStatus.MISSED) {
  // Send reminder
}
```

### Event Types

```typescript
import { MedicationEventType, EventSyncStatus } from '@/types';

const eventType: MedicationEventType = 'created';
const syncStatus: EventSyncStatus = 'delivered';
```

## Common Patterns

### Fetching Patient Data

```typescript
import { Patient, PatientWithDevice, DeviceState } from '@/types';

// Fetch patients from Firestore
const patients: Patient[] = await fetchPatients(caregiverId);

// Add device state from RTDB
const patientsWithDevice: PatientWithDevice[] = await Promise.all(
  patients.map(async (patient) => {
    if (patient.deviceId) {
      const deviceState = await fetchDeviceState(patient.deviceId);
      return { ...patient, deviceState };
    }
    return patient;
  })
);
```

### Creating Medication Events

```typescript
import { MedicationEvent, MedicationEventChange } from '@/types';

// Create event with changes
const changes: MedicationEventChange[] = [
  { field: 'doseValue', oldValue: '500', newValue: '1000' },
  { field: 'times', oldValue: ['08:00'], newValue: ['08:00', '20:00'] }
];

const event: MedicationEvent = {
  id: generateId(),
  eventType: 'updated',
  medicationId: medication.id,
  medicationName: medication.name,
  medicationData: medication,
  patientId: patient.id,
  patientName: patient.name,
  caregiverId: caregiver.id,
  timestamp: new Date(),
  syncStatus: 'pending',
  changes
};
```

### Filtering Events

```typescript
import { EventFilters, MedicationEvent } from '@/types';

const filters: EventFilters = {
  patientId: selectedPatientId,
  eventType: 'created',
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
};

// Apply filters
const filteredEvents = events.filter(event => {
  if (filters.patientId && event.patientId !== filters.patientId) return false;
  if (filters.eventType && event.eventType !== filters.eventType) return false;
  if (filters.dateRange) {
    const eventDate = new Date(event.timestamp);
    if (eventDate < filters.dateRange.start || eventDate > filters.dateRange.end) {
      return false;
    }
  }
  return true;
});
```

## IDE Integration

### Viewing Documentation

1. **Hover**: Hover over any type to see full JSDoc documentation
2. **Go to Definition**: Cmd/Ctrl + Click to jump to type definition
3. **IntelliSense**: Type suggestions show documentation inline
4. **Quick Info**: Cmd/Ctrl + K, Cmd/Ctrl + I for quick info panel

### Example in VSCode

```typescript
// Hover over 'Patient' to see:
// - Interface description
// - Field descriptions
// - Usage examples
// - Related types
const patient: Patient = {
  // IntelliSense shows field descriptions as you type
  id: 'patient-123',
  name: 'John Doe',
  // ...
};
```

## Best Practices

### 1. Use Specific Types

```typescript
// ✅ Good - specific type
const eventType: MedicationEventType = 'created';

// ❌ Bad - generic string
const eventType: string = 'created';
```

### 2. Leverage Type Inference

```typescript
// ✅ Good - type inferred from DOSE_UNITS
const unit = DOSE_UNITS.find(u => u.id === 'mg');

// ❌ Bad - unnecessary type annotation
const unit: DoseUnit | undefined = DOSE_UNITS.find(u => u.id === 'mg');
```

### 3. Use Partial for Updates

```typescript
// ✅ Good - partial for updates
const updates: Partial<Medication> = {
  doseValue: '1000',
  doseUnit: 'mg'
};

// ❌ Bad - full type for partial data
const updates: Medication = {
  doseValue: '1000',
  // Missing required fields...
};
```

### 4. Document Component Props

```typescript
// ✅ Good - use defined props interface
interface MyComponentProps extends CaregiverHeaderProps {
  customProp: string;
}

// ❌ Bad - inline props without documentation
function MyComponent({ caregiverName, title, customProp }: {
  caregiverName?: string;
  title?: string;
  customProp: string;
}) {
  // ...
}
```

## Additional Resources

- **Full Documentation**: `src/types/index.ts`
- **Component Examples**: See component files in `src/components/caregiver/`
- **Usage Patterns**: Check screen files in `app/caregiver/`
- **Test Examples**: See test files in `src/components/caregiver/__tests__/`

## Getting Help

If you need clarification on any type:

1. Check the JSDoc comments in `src/types/index.ts`
2. Look at usage examples in component files
3. Review test files for real-world usage
4. Check this quick reference guide

---

**Last Updated**: Task 17.1 Completion
**Type Coverage**: 100%
**Documentation**: Complete

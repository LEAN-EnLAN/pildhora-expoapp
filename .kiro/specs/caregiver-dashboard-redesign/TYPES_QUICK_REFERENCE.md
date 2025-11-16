# Caregiver Dashboard Types - Quick Reference

## Import Statement

```typescript
import {
  // Navigation
  CaregiverScreen,
  
  // Component Props
  CaregiverHeaderProps,
  QuickActionsPanelProps,
  DeviceConnectivityCardProps,
  LastMedicationStatusCardProps,
  PatientSelectorProps,
  EventFilterControlsProps,
  EventTypeBadgeProps,
  MedicationEventCardProps,
  ErrorStateProps,
  OfflineIndicatorProps,
  
  // Data Models
  PatientWithDevice,
  EventFilters,
  DeviceLink,
  DashboardState,
  CachedPatientData,
  OfflineMedicationChange,
  
  // Existing Types
  Patient,
  DeviceState,
  MedicationEvent,
  MedicationEventType,
} from '../../types';
```

## Navigation Types

### CaregiverScreen
```typescript
type CaregiverScreen = 'dashboard' | 'events' | 'medications' | 'tasks' | 'add-device';

// Usage
const screen: CaregiverScreen = 'events';
router.push(`/caregiver/${screen}`);
```

## Component Props

### CaregiverHeaderProps
```typescript
interface CaregiverHeaderProps {
  caregiverName?: string;
  title?: string;
  showScreenTitle?: boolean;
  onLogout?: () => void;
  onEmergency?: () => void;
  onAccountMenu?: () => void;
}
```

### QuickActionsPanelProps
```typescript
interface QuickActionsPanelProps {
  onNavigate: (screen: CaregiverScreen) => void;
}
```

### DeviceConnectivityCardProps
```typescript
interface DeviceConnectivityCardProps {
  deviceId?: string;
  onManageDevice?: () => void;
  style?: any;
}
```

### LastMedicationStatusCardProps
```typescript
interface LastMedicationStatusCardProps {
  patientId?: string;
  caregiverId?: string;
  onViewAll?: () => void;
}
```

### PatientSelectorProps
```typescript
interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId?: string;
  onSelectPatient: (patientId: string) => void;
  loading?: boolean;
}
```

### EventFilterControlsProps
```typescript
interface EventFilterControlsProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  patients: Array<{ id: string; name: string }>;
}
```

### EventTypeBadgeProps
```typescript
interface EventTypeBadgeProps {
  eventType: MedicationEventType | 'medication_created' | 'medication_updated' | 
             'medication_deleted' | 'dose_taken' | 'dose_missed';
  size?: 'sm' | 'md' | 'lg';
}
```

### MedicationEventCardProps
```typescript
interface MedicationEventCardProps {
  event: MedicationEvent;
  onPress?: () => void;
  showPatientName?: boolean;
}
```

### ErrorStateProps
```typescript
interface ErrorStateProps {
  title?: string;
  message: string;
  category?: any; // ErrorCategory from errorHandling
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
}
```

### OfflineIndicatorProps
```typescript
interface OfflineIndicatorProps {
  isOnline?: boolean; // Optional override
}
```

## Data Models

### PatientWithDevice
```typescript
interface PatientWithDevice extends Patient {
  deviceState?: DeviceState;
  doseSegments?: DoseSegment[];
}

// Usage
const patient: PatientWithDevice = {
  id: 'patient-123',
  name: 'John Doe',
  email: 'john@example.com',
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

### EventFilters
```typescript
interface EventFilters {
  patientId?: string;
  eventType?: MedicationEventType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Usage
const filters: EventFilters = {
  patientId: 'patient-123',
  eventType: 'created',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  searchQuery: 'aspirin'
};
```

### DeviceLink
```typescript
interface DeviceLink {
  id: string; // Format: {deviceId}_{userId}
  deviceId: string;
  userId: string;
  role: 'patient' | 'caregiver';
  status: 'active' | 'inactive';
  linkedAt: Date | string;
  linkedBy?: string;
}
```

### DashboardState
```typescript
interface DashboardState {
  selectedPatientId: string | null;
  patients: PatientWithDevice[];
  deviceStatus: DeviceState | null;
  lastEvent: MedicationEvent | null;
  loading: boolean;
  error: Error | null;
}

// Usage
const [state, setState] = useState<DashboardState>({
  selectedPatientId: null,
  patients: [],
  deviceStatus: null,
  lastEvent: null,
  loading: true,
  error: null
});
```

### CachedPatientData
```typescript
interface CachedPatientData {
  patientId: string;
  patient: PatientWithDevice;
  medications: Medication[];
  events: MedicationEvent[];
  cachedAt: number;
  expiresAt: number;
}
```

### OfflineMedicationChange
```typescript
interface OfflineMedicationChange {
  id: string;
  operation: 'create' | 'update' | 'delete';
  medicationId?: string;
  medicationData?: Partial<Medication>;
  patientId: string;
  caregiverId: string;
  timestamp: number;
  synced: boolean;
  error?: string;
}
```

## Common Patterns

### Component with Props
```typescript
import React from 'react';
import { CaregiverHeaderProps } from '../../types';

export function CaregiverHeader({
  caregiverName,
  title,
  showScreenTitle = false,
  onLogout,
}: CaregiverHeaderProps) {
  // Component implementation
}
```

### State Management
```typescript
import { useState } from 'react';
import { DashboardState, PatientWithDevice } from '../../types';

function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    selectedPatientId: null,
    patients: [],
    deviceStatus: null,
    lastEvent: null,
    loading: true,
    error: null
  });
  
  // Use state
}
```

### Event Filtering
```typescript
import { EventFilters, MedicationEvent } from '../../types';

function filterEvents(
  events: MedicationEvent[],
  filters: EventFilters
): MedicationEvent[] {
  return events.filter(event => {
    if (filters.patientId && event.patientId !== filters.patientId) {
      return false;
    }
    if (filters.eventType && event.eventType !== filters.eventType) {
      return false;
    }
    // More filtering logic
    return true;
  });
}
```

### Type Guards
```typescript
import { PatientWithDevice, Patient } from '../../types';

function hasDeviceState(patient: Patient): patient is PatientWithDevice {
  return 'deviceState' in patient && patient.deviceState !== undefined;
}

// Usage
if (hasDeviceState(patient)) {
  console.log(patient.deviceState.battery_level);
}
```

## Type Utilities

### Partial Types
```typescript
// For updates
const partialMedication: Partial<Medication> = {
  name: 'Updated Name'
};
```

### Pick Types
```typescript
// Select specific fields
type PatientBasicInfo = Pick<Patient, 'id' | 'name' | 'email'>;
```

### Omit Types
```typescript
// Exclude specific fields
type PatientWithoutDates = Omit<Patient, 'createdAt'>;
```

## Best Practices

### 1. Always Import from Central Location
```typescript
// ✅ Good
import { CaregiverHeaderProps } from '../../types';

// ❌ Bad - Don't define locally
interface CaregiverHeaderProps { ... }
```

### 2. Use Type Annotations
```typescript
// ✅ Good
const screen: CaregiverScreen = 'events';

// ❌ Bad - Implicit any
const screen = 'events';
```

### 3. Leverage Type Inference
```typescript
// ✅ Good - Type inferred from function signature
function handleNavigate(screen: CaregiverScreen) {
  router.push(`/caregiver/${screen}`);
}

// Type is inferred
handleNavigate('events');
```

### 4. Use Optional Chaining
```typescript
// ✅ Good
const batteryLevel = patient.deviceState?.battery_level;

// ❌ Bad - Can throw error
const batteryLevel = patient.deviceState.battery_level;
```

### 5. Type Function Parameters
```typescript
// ✅ Good
function updateFilters(filters: EventFilters): void {
  // Implementation
}

// ❌ Bad - Implicit any
function updateFilters(filters) {
  // Implementation
}
```

## Common Type Errors and Solutions

### Error: Property does not exist
```typescript
// Error: Property 'deviceState' does not exist on type 'Patient'
const battery = patient.deviceState.battery_level;

// Solution: Use PatientWithDevice or optional chaining
const patient: PatientWithDevice = ...;
const battery = patient.deviceState?.battery_level;
```

### Error: Type is not assignable
```typescript
// Error: Type 'string' is not assignable to type 'CaregiverScreen'
const screen = 'invalid-screen';
router.push(`/caregiver/${screen}`);

// Solution: Use proper type
const screen: CaregiverScreen = 'events';
router.push(`/caregiver/${screen}`);
```

### Error: Cannot find name
```typescript
// Error: Cannot find name 'EventFilters'
const filters: EventFilters = {};

// Solution: Import the type
import { EventFilters } from '../../types';
const filters: EventFilters = {};
```

## Quick Tips

1. **Use IntelliSense**: Hover over types to see documentation
2. **Check Examples**: All types have usage examples in JSDoc
3. **Type Everything**: Don't rely on implicit any
4. **Use Strict Mode**: Enable strict TypeScript checking
5. **Leverage Generics**: Use built-in utility types (Partial, Pick, Omit)

## Resources

- **Type Definitions**: `src/types/index.ts`
- **Component Examples**: `src/components/caregiver/`
- **Documentation**: JSDoc comments in type definitions
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/

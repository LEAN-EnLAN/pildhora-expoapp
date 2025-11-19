# Project Structure

## Root Organization

```
pildhora-app/
├── app/                    # Expo Router screens (file-based routing)
├── src/                    # Source code
├── functions/              # Firebase Cloud Functions
├── hardware/               # ESP8266 firmware
├── scripts/                # Utility scripts and migrations
├── assets/                 # Static assets (images, icons)
└── .kiro/                  # Kiro configuration and specs
```

## App Directory (Expo Router)

File-based routing with role-specific screen organization:

```
app/
├── _layout.tsx             # Root layout with auth and navigation setup
├── index.tsx               # Entry point (redirects based on auth/role)
├── auth/                   # Authentication screens
│   ├── login.tsx
│   └── signup.tsx
├── patient/                # Patient-specific screens
│   ├── home.tsx            # Patient dashboard
│   ├── medications/        # Medication management
│   ├── history/            # Medication history
│   ├── device-provisioning.tsx
│   ├── device-settings.tsx
│   └── settings.tsx
└── caregiver/              # Caregiver-specific screens
    ├── _layout.tsx         # Caregiver layout with patient selector
    ├── dashboard.tsx       # Multi-patient dashboard
    ├── patients.tsx        # Patient list
    ├── medications/        # Medication CRUD for patients
    ├── events.tsx          # Event registry
    ├── tasks.tsx           # Task management
    ├── device-connection.tsx
    └── edit-profile.tsx
```

## Source Directory

```
src/
├── components/             # React components
│   ├── ui/                # Design system components (Button, Input, Modal, etc.)
│   ├── screens/           # Screen-specific components
│   │   ├── patient/       # Patient screen components
│   │   ├── caregiver/     # Caregiver screen components
│   │   └── shared/        # Shared screen components
│   ├── patient/           # Patient-specific composite components
│   │   └── medication-wizard/  # Medication wizard steps
│   ├── caregiver/         # Caregiver-specific composite components
│   ├── shared/            # Shared composite components
│   └── examples/          # Example/demo components
│
├── services/              # Business logic and API services
│   ├── firebase.ts        # Firebase initialization
│   ├── auth.ts            # Authentication service
│   ├── medications.ts     # Medication CRUD operations
│   ├── medicationEventService.ts  # Event generation and sync
│   ├── deviceLinking.ts   # Device linking logic
│   ├── deviceProvisioning.ts  # Device provisioning flow
│   ├── connectionCode.ts  # Connection code generation/validation
│   ├── alarmService.ts    # Native alarm scheduling
│   ├── inventoryService.ts  # Inventory tracking
│   └── ...                # Other domain services
│
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication state
│   ├── useMedications.ts  # Medication data fetching
│   ├── useDeviceState.ts  # Real-time device state from RTDB
│   ├── useCollectionSWR.ts  # SWR pattern for Firestore
│   └── ...                # Other custom hooks
│
├── store/                 # Redux state management
│   ├── index.ts           # Store configuration
│   └── slices/            # Redux Toolkit slices
│       ├── authSlice.ts   # Auth state
│       ├── medicationsSlice.ts  # Medications state
│       └── ...
│
├── types/                 # TypeScript type definitions
│   └── index.ts           # All interfaces and types
│
├── theme/                 # Design system
│   └── tokens.ts          # Design tokens (colors, spacing, typography)
│
├── utils/                 # Utility functions
│   ├── dateUtils.ts       # Date formatting and manipulation
│   ├── validation.ts      # Input validation
│   ├── errorHandling.ts   # Error handling utilities
│   ├── accessibility.ts   # Accessibility helpers
│   └── ...
│
├── contexts/              # React contexts
│   └── AccessibilityContext.tsx
│
└── i18n/                  # Internationalization
    └── translations/      # Translation files
        ├── en.ts          # English
        └── es.ts          # Spanish
```

## Key Conventions

### Component Organization

- **ui/**: Atomic, reusable design system components (Button, Input, Card, Modal)
- **screens/**: Components specific to particular screens, organized by role
- **patient/** & **caregiver/**: Role-specific composite components
- **shared/**: Components used across both roles

### Service Layer

- Each service handles a specific domain (auth, medications, devices, etc.)
- Services interact with Firebase and contain business logic
- Keep components thin, move logic to services

### Type Definitions

- All types centralized in `src/types/index.ts`
- Comprehensive JSDoc comments for each interface
- Export const arrays for enums (DOSE_UNITS, QUANTITY_TYPES)

### Naming Conventions

- **Components**: PascalCase (e.g., `MedicationCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMedications.ts`)
- **Services**: camelCase (e.g., `medicationEventService.ts`)
- **Utils**: camelCase (e.g., `dateUtils.ts`)
- **Types**: PascalCase for interfaces (e.g., `Medication`, `User`)

### File Structure Patterns

- One component per file
- Co-locate tests with `__tests__` directories
- Group related functionality in subdirectories
- Keep flat structure where possible, nest only when necessary

## Firebase Collections

**Firestore Collections:**
- `users` - User accounts (patient/caregiver)
- `medications` - Medication records
- `medicationEvents` - Medication lifecycle events
- `intakeRecords` - Dose intake tracking
- `devices` - Device metadata and configuration
- `deviceLinks` - Device-to-user relationships
- `connectionCodes` - Temporary linking codes
- `tasks` - Caregiver tasks
- `criticalEvents` - Critical notifications for caregivers
- `notificationPreferences` - User notification settings

**Realtime Database Paths:**
- `/devices/{deviceId}/state` - Real-time device state
- `/devices/{deviceId}/config` - Device configuration sync

## Documentation

- Comprehensive docs in `.kiro/specs/` organized by feature
- Implementation summaries, visual guides, and quick references
- Root-level markdown files for major features and fixes
- JSDoc comments on all public interfaces and functions

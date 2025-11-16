# Requirements Document

## Introduction

This specification defines the complete redesign of the caregiver dashboard and all caregiver-side features to match the quality, functionality, and visual design of the patient-side implementation. The redesign addresses critical architectural issues, removes deprecated features, consolidates overlapping functionality, and establishes a proper device-patient-caregiver linking system that enables both independent patient usage and supervised caregiving modes.

## Glossary

- **Caregiver Dashboard**: The main interface for caregivers to monitor and manage patient medications and device connectivity
- **Patient Linking System**: The mechanism that connects patients to devices via unique deviceID, and caregivers to patients through the same deviceID
- **Independent Mode**: Patient usage without device or caregiver supervision, with full medication tracking functionality
- **Caregiving Mode**: Patient usage with linked device and caregiver supervision, enabling physical device syncing and multi-caregiver access
- **Device Status Sync**: Real-time synchronization of device state (battery, connectivity, medication dispensing) between hardware and application
- **Event Registry**: Unified system for tracking all medication-related events (additions, modifications, deletions, dose completions)
- **Multi-Caregiver System**: Architecture supporting multiple caregivers accessing the same patient data through shared deviceID
- **Header Component**: Top navigation bar with branding, user info, and quick actions
- **Quick Actions Panel**: Dashboard section providing one-tap access to common caregiver tasks
- **Medication Status Card**: Visual component showing last medication event and current device connectivity

## Requirements

### Requirement 1: Device-Patient-Caregiver Linking Architecture

**User Story:** As a system architect, I want a clear linking hierarchy (patient → device → caregiver) so that the application supports both independent patient usage and supervised caregiving modes.

#### Acceptance Criteria

1. WHEN a patient account is created, THE System SHALL enable full medication tracking functionality without requiring device or caregiver linkage
2. WHEN a patient links a device using a unique deviceID, THE System SHALL enable device syncing features and create a caregiving access point
3. WHEN a caregiver enters a valid deviceID, THE System SHALL grant access to the associated patient's data and medication management features
4. WHERE multiple caregivers enter the same deviceID, THE System SHALL provide concurrent access to all caregivers for the associated patient
5. WHILE a patient has no linked device, THE System SHALL maintain independent mode with manual medication tracking and full feature access

### Requirement 2: Chat Feature Removal

**User Story:** As a product manager, I want the chat functionality completely removed from the codebase so that the project is not bloated with unused features.

#### Acceptance Criteria

1. THE System SHALL remove all chat-related UI components from the caregiver navigation
2. THE System SHALL delete all chat service files and Firebase chat queries
3. THE System SHALL remove chat-related database collections and security rules
4. THE System SHALL eliminate all references to chat functionality in routing and navigation
5. THE System SHALL remove chat dependencies from package configuration files

### Requirement 3: Reports and Registry Consolidation

**User Story:** As a caregiver, I want reports to be generated from the event registry so that I have a single source of truth for all medication events and can generate reports on demand.

#### Acceptance Criteria

1. THE System SHALL consolidate the reports and audit screens into a unified Event Registry interface
2. WHEN viewing the Event Registry, THE System SHALL display all medication lifecycle events (created, updated, deleted, doses taken)
3. WHEN a caregiver requests a report, THE System SHALL generate it from the existing event registry data
4. THE System SHALL provide filtering capabilities by date range, event type, and patient
5. THE System SHALL maintain the existing event detail view functionality for drill-down analysis

### Requirement 4: Dashboard Quick Actions and Status

**User Story:** As a caregiver, I want the dashboard start page to show quick settings/actions for each screen and display device connectivity with last medication status so that I can quickly assess patient status and navigate to relevant sections.

#### Acceptance Criteria

1. WHEN the caregiver opens the dashboard, THE System SHALL display quick action cards for each major section (Events, Medications, Tasks, Device Management)
2. THE System SHALL display a prominent Device Connectivity Card showing online/offline status and battery level
3. THE System SHALL display a Last Medication Status Card showing the most recent medication event with timestamp
4. WHEN a caregiver taps a quick action card, THE System SHALL navigate to the corresponding screen
5. THE System SHALL update device connectivity status in real-time using Firebase Realtime Database listeners

### Requirement 5: High-Quality Caregiver Header

**User Story:** As a caregiver, I want a header component matching the patient-side quality so that the interface feels consistent and professional across all screens.

#### Acceptance Criteria

1. THE System SHALL implement a caregiver header component with consistent styling, spacing, and visual hierarchy matching the patient header
2. THE System SHALL display the PILDHORA branding, caregiver name, and contextual screen title in the header
3. THE System SHALL provide quick access buttons for emergency contact and account menu in the header
4. THE System SHALL use the same design tokens (colors, typography, spacing) as the patient-side header
5. THE System SHALL include proper accessibility labels and touch targets for all header interactive elements

### Requirement 6: Layout and Header Redundancy Prevention

**User Story:** As a developer, I want to prevent double header issues caused by layout and index redundancy so that the UI renders correctly without duplicate navigation elements.

#### Acceptance Criteria

1. THE System SHALL use a single header implementation in the caregiver layout file
2. THE System SHALL configure Expo Router to prevent header duplication in nested routes
3. WHEN navigating between caregiver screens, THE System SHALL maintain a single header instance
4. THE System SHALL remove redundant header configurations from individual screen files
5. THE System SHALL test all caregiver navigation paths to verify single header rendering

### Requirement 7: Visual Enhancement with Backend Simplicity

**User Story:** As a product designer, I want non-cookie-cutter visual features implemented in a simple backend architecture so that the interface is engaging without adding unnecessary complexity.

#### Acceptance Criteria

1. THE System SHALL implement smooth animations for list items, cards, and transitions using React Native Animated API
2. THE System SHALL use visual feedback (loading states, success/error messages, skeleton loaders) matching patient-side patterns
3. THE System SHALL implement the same card variants (elevated, outlined) and component library as the patient side
4. THE System SHALL maintain simple data fetching patterns using existing hooks (useCollectionSWR) without adding new state management layers
5. THE System SHALL use the established design system tokens for all visual styling

### Requirement 8: Code Quality and Architecture Parity

**User Story:** As a developer, I want the caregiver codebase to match the patient-side code quality so that maintenance is easier and the codebase is consistent.

#### Acceptance Criteria

1. THE System SHALL refactor all caregiver screens to use TypeScript with proper type definitions
2. THE System SHALL implement error boundaries and error handling patterns matching the patient side
3. THE System SHALL use the same performance optimization techniques (memoization, virtualization, lazy loading)
4. THE System SHALL follow the same component structure and file organization as patient screens
5. THE System SHALL include proper loading states, empty states, and error states for all data-dependent components

### Requirement 9: Tasks Screen Preservation

**User Story:** As a caregiver, I want the tasks screen to remain functional as a simple note-taking feature so that I can track caregiver-specific to-dos.

#### Acceptance Criteria

1. THE System SHALL preserve the existing tasks screen functionality
2. THE System SHALL update the tasks screen styling to match the new design system
3. THE System SHALL ensure tasks are scoped to the individual caregiver account
4. THE System SHALL implement proper data persistence for task creation, editing, and deletion
5. THE System SHALL provide a clean, minimal interface for task management

### Requirement 10: Medication Management for Caregivers

**User Story:** As a caregiver, I want full medication management capabilities so that I can add, edit, and delete medications for my supervised patients.

#### Acceptance Criteria

1. WHEN a caregiver is linked to a patient via deviceID, THE System SHALL provide access to the patient's medication list
2. THE System SHALL enable caregivers to add new medications using the same wizard interface as patients
3. THE System SHALL allow caregivers to edit existing medication schedules, dosages, and settings
4. THE System SHALL permit caregivers to delete medications with proper confirmation dialogs
5. THE System SHALL generate medication lifecycle events for all caregiver actions and sync them to the event registry

### Requirement 11: Real-Time Device Status Integration

**User Story:** As a caregiver, I want real-time device status updates so that I can monitor patient device connectivity and battery levels without manual refresh.

#### Acceptance Criteria

1. WHEN a caregiver views the dashboard, THE System SHALL establish a Firebase Realtime Database listener for device state
2. THE System SHALL update device status (online/offline, battery level, current status) automatically when changes occur
3. THE System SHALL display visual indicators (colors, icons) reflecting device connectivity state
4. THE System SHALL show the last seen timestamp when a device is offline
5. THE System SHALL handle listener cleanup on component unmount to prevent memory leaks

### Requirement 12: Multi-Patient Support

**User Story:** As a caregiver, I want to manage multiple patients simultaneously so that I can provide care for multiple individuals using a single account.

#### Acceptance Criteria

1. WHEN a caregiver links multiple deviceIDs, THE System SHALL display all associated patients in a patient selector
2. THE System SHALL allow caregivers to switch between patients using a horizontal scrollable patient list
3. WHEN a patient is selected, THE System SHALL update all dashboard data to reflect the selected patient's information
4. THE System SHALL maintain separate event registries, medication lists, and device states for each patient
5. THE System SHALL persist the last selected patient across app sessions

### Requirement 13: Responsive and Accessible Design

**User Story:** As a caregiver with accessibility needs, I want the interface to be fully accessible and responsive so that I can use the application effectively regardless of device size or accessibility requirements.

#### Acceptance Criteria

1. THE System SHALL implement proper accessibility labels for all interactive elements
2. THE System SHALL support screen reader navigation with logical focus order
3. THE System SHALL provide sufficient touch target sizes (minimum 44x44 points) for all buttons and interactive elements
4. THE System SHALL use semantic color contrast ratios meeting WCAG AA standards
5. THE System SHALL adapt layouts responsively for different screen sizes (phone, tablet)

### Requirement 14: Performance Optimization

**User Story:** As a caregiver, I want the dashboard to load quickly and respond smoothly so that I can efficiently monitor and manage patient care.

#### Acceptance Criteria

1. THE System SHALL implement FlatList virtualization for all scrollable lists (patients, events, medications)
2. THE System SHALL use React.memo and useMemo for expensive computations and component renders
3. THE System SHALL lazy load images and heavy components using React.lazy and Suspense
4. THE System SHALL implement skeleton loaders for initial data fetching states
5. THE System SHALL achieve initial dashboard render in under 2 seconds on standard mobile devices

### Requirement 15: Error Handling and Offline Support

**User Story:** As a caregiver, I want graceful error handling and offline support so that temporary connectivity issues don't prevent me from viewing patient information.

#### Acceptance Criteria

1. WHEN network errors occur, THE System SHALL display user-friendly error messages with retry options
2. THE System SHALL cache recently viewed patient data for offline viewing
3. WHEN Firebase initialization fails, THE System SHALL provide diagnostic information and retry mechanisms
4. THE System SHALL queue medication changes made offline and sync them when connectivity is restored
5. THE System SHALL indicate offline status clearly in the UI with appropriate visual feedback

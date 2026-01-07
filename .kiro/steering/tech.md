# Technology Stack

## Framework & Core

- **React Native** (0.81.5) with **Expo** (v54) - Cross-platform mobile development
- **Expo Router** (v6) - File-based routing system
- **TypeScript** (v5.9) - Type safety throughout codebase

## State Management

- **Redux Toolkit** (v2.9) - Global state management
- **Redux Persist** - State persistence across sessions
- **SWR Pattern** - Data fetching with stale-while-revalidate strategy

## Backend & Database

- **Firebase**
  - Authentication - User auth with email/password and Google Sign-In
  - Firestore - Primary database for users, medications, events, tasks
  - Realtime Database (RTDB) - Device state synchronization
  - Cloud Functions - Backend logic and event processing
  - Storage - File uploads (reports, documents)

## UI & Styling

- **Design System** - Custom component library in `src/components/ui/`
- **Design Tokens** - Centralized styling in `src/theme/tokens.ts`
- **React Native Elements** + **React Native Paper** - Base component libraries
- **Expo Linear Gradient** - Gradient support
- **React Native Reanimated** - Animations

## Hardware & Connectivity

- **React Native BLE PLX** - Bluetooth Low Energy communication with ESP8266 devices
- **Expo Notifications** - Local and push notifications
- **Expo Haptics** - Tactile feedback

## Development Tools

- **Babel** - JavaScript transpilation with module resolver
- **dotenv-cli** - Environment variable management
- **patch-package** - NPM package patching

## Common Commands

```bash
# Development
npm start                    # Start Expo dev server (port 8082)
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator

# Environment Setup
# Copy .env.example to .env and fill in Firebase credentials
# All variables must start with EXPO_PUBLIC_ prefix

# Database Management
node scripts/migrate-user-onboarding.js        # Run user migration
node scripts/fix-inventory-medications.js      # Fix inventory data
node scripts/clean-firestore-data.js           # Clean test data

# Testing & Validation
node test-*.js              # Run specific integration tests
node scripts/verify-code-quality.js            # Code quality checks

# Firebase Deployment
firebase deploy --only firestore:rules         # Deploy security rules
firebase deploy --only functions               # Deploy Cloud Functions
```

## Architecture Patterns

- **Functional Components** - Use hooks, avoid class components
- **Custom Hooks** - Reusable logic in `src/hooks/`
- **Service Layer** - Business logic in `src/services/`
- **Type Safety** - All types defined in `src/types/index.ts`
- **Error Boundaries** - Graceful error handling with ErrorBoundary component
- **Offline Support** - Caching and queue management for offline scenarios

## Performance Optimizations

- **React.memo** - Prevent unnecessary re-renders
- **useMemo/useCallback** - Memoize expensive computations
- **FlatList optimization** - Virtualized lists with proper key extraction
- **Image optimization** - Lazy loading and caching
- **Code splitting** - Route-based lazy loading with Expo Router

## Accessibility

- **WCAG 2.1 AA Compliance** - Minimum contrast ratios, touch targets
- **Screen Reader Support** - Proper accessibility labels and hints
- **Keyboard Navigation** - Full keyboard support where applicable
- **Reduced Motion** - Respect user motion preferences

# Routing & Navigation Cleanup Plan

## Overview
This document outlines the cleanup of screen routing and navbar icons for production readiness.

## Changes Made

### 1. Removed Development/Testing Routes
- ❌ `app/device/provision/*` - Old device provisioning flow (replaced by wizard)
- ❌ `app/ui/textfields.tsx` - UI testing/showcase screen

### 2. Standardized Navigation Icons

#### Caregiver Tab Bar Icons
- **Dashboard**: `home` / `home-outline` ✅
- **Tasks**: `checkbox` / `checkbox-outline` ✅  
- **Medications**: `medkit` / `medkit-outline` ✅
- **Events**: `notifications` / `notifications-outline` ✅

#### Patient Quick Actions Icons
- **History**: `time-outline` ✅
- **Medications**: `medical-outline` ✅
- **Device**: `hardware-chip-outline` ✅

### 3. Production-Ready Routes

#### Authentication
- `/` - Welcome/splash screen
- `/auth/login` - Login screen
- `/auth/signup` - Signup screen

#### Patient Routes
- `/patient/home` - Main dashboard
- `/patient/medications` - Medication list
- `/patient/medications/add` - Add medication wizard
- `/patient/medications/[id]` - Medication detail
- `/patient/history` - Dose history
- `/patient/settings` - Settings
- `/patient/device-settings` - Device management
- `/patient/device-provisioning` - Device setup wizard

#### Caregiver Routes
- `/caregiver/dashboard` - Main dashboard (tab)
- `/caregiver/tasks` - Task management (tab)
- `/caregiver/medications` - Medication management (tab)
- `/caregiver/events` - Event registry (tab)
- `/caregiver/events/[id]` - Event detail
- `/caregiver/medications/[patientId]` - Patient medications
- `/caregiver/medications/[patientId]/add` - Add medication
- `/caregiver/medications/[patientId]/[id]` - Edit medication
- `/caregiver/device-connection` - Device connection flow
- `/caregiver/device-connection-confirm` - Connection confirmation
- `/caregiver/add-device` - Device management (modal)
- `/caregiver/settings` - Settings

### 4. Icon Consistency Standards

All icons follow Ionicons naming convention:
- Use `-outline` suffix for inactive/secondary states
- Use solid variant for active/primary states
- Consistent sizing: 24px for nav, 16-20px for inline, 48px+ for empty states

### 5. Accessibility Improvements
- All tab bar items have `accessibilityLabel` and `accessibilityHint`
- All icon buttons have proper ARIA labels
- Consistent color contrast ratios (WCAG AA compliant)

## Testing Checklist
- [ ] All navigation flows work correctly
- [ ] Tab bar icons display properly in active/inactive states
- [ ] No broken routes or 404 errors
- [ ] Deep linking works for all production routes
- [ ] Accessibility labels are present and accurate
- [ ] Icons are visually consistent across the app

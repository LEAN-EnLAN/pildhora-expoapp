# PILDHORA Caregiver Documentation Screenshot Guide

## Overview

This document specifies all screenshots needed for the caregiver documentation. Each screenshot should be taken on a real device with actual data (or realistic test data) to provide authentic visual guidance.

## Screenshot Specifications

### Technical Requirements

- **Format**: PNG or JPEG
- **Resolution**: Minimum 1080x1920 (portrait) or 1920x1080 (landscape)
- **Device**: Use iPhone 12/13 or Samsung Galaxy S21 for consistency
- **Annotations**: Add arrows, circles, or text overlays where helpful
- **File Naming**: Use descriptive names (e.g., `dashboard-overview.png`)
- **Storage**: Place in `docs/screenshots/caregiver/` directory

### Visual Guidelines

- Use consistent test data across screenshots
- Ensure good lighting and clear visibility
- Avoid personal/sensitive information
- Show realistic scenarios
- Include both light and dark mode versions where applicable

---

## Required Screenshots by Section

### 1. Onboarding Guide Screenshots

#### 1.1 Account Creation
**File**: `onboarding-signup.png`
**Shows**: Sign up screen with email and password fields
**Annotations**: 
- Arrow pointing to "Caregiver" role selection
- Highlight "Sign Up" button

#### 1.2 Email Verification
**File**: `onboarding-email-verification.png`
**Shows**: Email verification screen
**Annotations**:
- Show verification email in inbox
- Highlight verification link

#### 1.3 Device Linking
**File**: `onboarding-device-linking.png`
**Shows**: Device linking screen with device ID input
**Annotations**:
- Arrow pointing to device ID field
- Example device ID entered
- Highlight "Link Device" button

#### 1.4 First Dashboard View
**File**: `onboarding-first-dashboard.png`
**Shows**: Dashboard after first patient linked
**Annotations**:
- Label each section (Header, Device Status, Quick Actions)
- Highlight key features


### 2. Dashboard Screenshots

#### 2.1 Dashboard Overview
**File**: `dashboard-overview.png`
**Shows**: Complete dashboard with all components
**Annotations**:
- Label: CaregiverHeader
- Label: Patient Selector
- Label: Device Connectivity Card
- Label: Last Medication Status Card
- Label: Quick Actions Panel

#### 2.2 Patient Selector
**File**: `dashboard-patient-selector.png`
**Shows**: Patient selector with multiple patients
**Annotations**:
- Show 3-4 patient cards
- Highlight selected patient
- Show online/offline indicators

#### 2.3 Device Connectivity Card - Online
**File**: `dashboard-device-online.png`
**Shows**: Device connectivity card with online status
**Annotations**:
- Green dot indicator
- Battery level (e.g., 85%)
- "Manage Device" button

#### 2.4 Device Connectivity Card - Offline
**File**: `dashboard-device-offline.png`
**Shows**: Device connectivity card with offline status
**Annotations**:
- Gray dot indicator
- Last seen timestamp
- Battery level

#### 2.5 Last Medication Status Card
**File**: `dashboard-last-medication.png`
**Shows**: Last medication status card with event
**Annotations**:
- Event type badge (colored)
- Medication name
- Timestamp
- "View All Events" button

#### 2.6 Quick Actions Panel
**File**: `dashboard-quick-actions.png`
**Shows**: Four quick action cards
**Annotations**:
- Label each card (Events, Medications, Tasks, Device)
- Show icons clearly

### 3. Medication Management Screenshots

#### 3.1 Medication List
**File**: `medications-list.png`
**Shows**: List of patient medications
**Annotations**:
- Show 3-4 medication cards
- Highlight medication details (icon, name, dosage, schedule)
- Show "+" button for adding

#### 3.2 Medication Wizard - Step 1
**File**: `medications-wizard-step1.png`
**Shows**: Icon and name selection step
**Annotations**:
- Show emoji picker
- Highlight selected icon
- Show name input field

#### 3.3 Medication Wizard - Step 2
**File**: `medications-wizard-step2.png`
**Shows**: Dosage configuration step
**Annotations**:
- Dosage amount field
- Unit selector
- Quantity type selector

#### 3.4 Medication Wizard - Step 3
**File**: `medications-wizard-step3.png`
**Shows**: Schedule configuration step
**Annotations**:
- Frequency selector
- Time picker
- Multiple times shown
- "+" button to add times

#### 3.5 Medication Wizard - Step 4
**File**: `medications-wizard-step4.png`
**Shows**: Inventory tracking step
**Annotations**:
- Toggle for inventory tracking
- Current quantity field
- Low quantity threshold

#### 3.6 Medication Detail View
**File**: `medications-detail.png`
**Shows**: Detailed view of a medication
**Annotations**:
- All medication information
- Edit and Delete buttons
- Inventory status (if tracked)

#### 3.7 Medication Edit
**File**: `medications-edit.png`
**Shows**: Editing a medication
**Annotations**:
- Editable fields
- Save button
- Cancel option

#### 3.8 Low Quantity Alert
**File**: `medications-low-quantity.png`
**Shows**: Medication card with low quantity banner
**Annotations**:
- Orange/red banner
- Alert message
- Refill button

### 4. Events Registry Screenshots

#### 4.1 Events List
**File**: `events-list.png`
**Shows**: Chronological list of events
**Annotations**:
- Show different event types
- Color-coded badges
- Timestamps
- Medication names

#### 4.2 Event Type Badges
**File**: `events-badges.png`
**Shows**: All event type badges
**Annotations**:
- Blue: Medication Created
- Yellow: Medication Updated
- Red: Medication Deleted
- Green: Dose Taken
- Orange: Dose Missed

#### 4.3 Event Filter Controls
**File**: `events-filters.png`
**Shows**: Filter controls expanded
**Annotations**:
- Search bar
- Date range picker
- Event type filter
- Patient filter (if multiple)

#### 4.4 Event Detail View
**File**: `events-detail.png`
**Shows**: Detailed view of an event
**Annotations**:
- Event type and timestamp
- Medication information
- Patient name
- Change history (for updates)

#### 4.5 Event Change History
**File**: `events-change-history.png`
**Shows**: Change history for medication update
**Annotations**:
- Before/after values
- Fields that changed
- Timeline view

#### 4.6 Generate Report
**File**: `events-generate-report.png`
**Shows**: Report generation dialog
**Annotations**:
- Format options (PDF, CSV)
- Date range
- Share/save options

### 5. Device Management Screenshots

#### 5.1 Device Management Screen
**File**: `device-management.png`
**Shows**: List of linked devices
**Annotations**:
- Device ID
- Patient name
- Status (online/offline)
- Battery level
- Configure and Unlink buttons

#### 5.2 Link New Device
**File**: `device-link-new.png`
**Shows**: Link new device dialog
**Annotations**:
- Device ID input field
- Example device ID
- Link button

#### 5.3 Device Configuration
**File**: `device-configuration.png`
**Shows**: Device configuration panel
**Annotations**:
- Alarm mode selector
- Volume slider
- LED intensity slider
- Color picker

#### 5.4 Color Picker
**File**: `device-color-picker.png`
**Shows**: LED color picker expanded
**Annotations**:
- Color wheel or palette
- Selected color
- Preview

#### 5.5 Unlink Confirmation
**File**: `device-unlink-confirm.png`
**Shows**: Unlink device confirmation dialog
**Annotations**:
- Warning message
- Confirm and Cancel buttons

### 6. Tasks Screenshots

#### 6.1 Tasks List
**File**: `tasks-list.png`
**Shows**: List of caregiver tasks
**Annotations**:
- Completed tasks (checked)
- Incomplete tasks (unchecked)
- Edit and Delete options

#### 6.2 Add Task
**File**: `tasks-add.png`
**Shows**: Add new task interface
**Annotations**:
- Task input field
- Add button

#### 6.3 Task Completion
**File**: `tasks-completion.png`
**Shows**: Task being marked complete
**Annotations**:
- Checkbox animation
- Strikethrough text
- Visual feedback

### 7. Settings Screenshots

#### 7.1 Settings Menu
**File**: `settings-menu.png`
**Shows**: Main settings screen
**Annotations**:
- Profile section
- Notifications
- Privacy
- Security
- Help

#### 7.2 Notification Settings
**File**: `settings-notifications.png`
**Shows**: Notification preferences
**Annotations**:
- Toggle switches for each notification type
- Low battery alerts
- Missed dose alerts
- Device offline alerts

#### 7.3 Profile Settings
**File**: `settings-profile.png`
**Shows**: Profile information
**Annotations**:
- Name field
- Email field
- Role display
- Change password button

### 8. Header and Navigation Screenshots

#### 8.1 CaregiverHeader
**File**: `header-overview.png`
**Shows**: Caregiver header component
**Annotations**:
- PILDHORA logo
- Caregiver name
- Emergency button
- Account menu button

#### 8.2 Emergency Menu
**File**: `header-emergency-menu.png`
**Shows**: Emergency contact options
**Annotations**:
- 911 option
- 112 option (international)
- Cancel button

#### 8.3 Account Menu
**File**: `header-account-menu.png`
**Shows**: Account menu dropdown
**Annotations**:
- Settings option
- Device Management option
- Logout option

### 9. Error States Screenshots

#### 9.1 Network Error
**File**: `error-network.png`
**Shows**: Network error state
**Annotations**:
- Error icon
- Error message
- Retry button

#### 9.2 Empty State - No Patients
**File**: `error-empty-patients.png`
**Shows**: Dashboard with no linked patients
**Annotations**:
- Empty state illustration
- "Link Device" call-to-action

#### 9.3 Empty State - No Medications
**File**: `error-empty-medications.png`
**Shows**: Medications list with no medications
**Annotations**:
- Empty state message
- "Add Medication" button

#### 9.4 Empty State - No Events
**File**: `error-empty-events.png`
**Shows**: Events registry with no events
**Annotations**:
- Empty state message
- Helpful text

#### 9.5 Offline Indicator
**File**: `error-offline.png`
**Shows**: Offline mode indicator
**Annotations**:
- Offline banner at top
- Cached data shown
- Limited functionality message

### 10. Loading States Screenshots

#### 10.1 Dashboard Loading
**File**: `loading-dashboard.png`
**Shows**: Dashboard with skeleton loaders
**Annotations**:
- Skeleton for device card
- Skeleton for medication card
- Skeleton for quick actions

#### 10.2 List Loading
**File**: `loading-list.png`
**Shows**: List with skeleton items
**Annotations**:
- Multiple skeleton list items
- Loading indicator

### 11. Accessibility Screenshots

#### 11.1 Large Text
**File**: `accessibility-large-text.png`
**Shows**: Interface with large text enabled
**Annotations**:
- Show text scaling
- Proper layout adaptation

#### 11.2 Screen Reader Labels
**File**: `accessibility-screen-reader.png`
**Shows**: Interface with VoiceOver/TalkBack overlay
**Annotations**:
- Accessibility labels visible
- Focus indicators

### 12. Multi-Patient Scenarios

#### 12.1 Multiple Patients
**File**: `multi-patient-selector.png`
**Shows**: Patient selector with 4+ patients
**Annotations**:
- Scrollable list
- Different device statuses
- Selected patient highlighted

#### 12.2 Patient Switching
**File**: `multi-patient-switching.png`
**Shows**: Dashboard updating after patient switch
**Annotations**:
- Before/after comparison
- Data refresh indicator

### 13. Troubleshooting Screenshots

#### 13.1 Device Offline Troubleshooting
**File**: `troubleshoot-device-offline.png`
**Shows**: Device offline with troubleshooting steps
**Annotations**:
- Checklist of steps
- Visual indicators

#### 13.2 Login Error
**File**: `troubleshoot-login-error.png`
**Shows**: Login error message
**Annotations**:
- Error message
- Forgot password link
- Support contact

### 14. Advanced Features Screenshots

#### 14.1 Report Preview
**File**: `advanced-report-preview.png`
**Shows**: Generated report preview
**Annotations**:
- Report content
- Share options
- Download option

#### 14.2 Inventory Tracking
**File**: `advanced-inventory-tracking.png`
**Shows**: Medication with inventory tracking
**Annotations**:
- Current quantity
- Usage graph
- Refill prediction

#### 14.3 Adherence Statistics
**File**: `advanced-adherence-stats.png`
**Shows**: Patient adherence statistics
**Annotations**:
- Percentage
- Graph/chart
- Trend indicators

---

## Screenshot Organization

### Directory Structure

```
docs/
└── screenshots/
    └── caregiver/
        ├── onboarding/
        │   ├── signup.png
        │   ├── email-verification.png
        │   └── device-linking.png
        ├── dashboard/
        │   ├── overview.png
        │   ├── patient-selector.png
        │   ├── device-online.png
        │   └── device-offline.png
        ├── medications/
        │   ├── list.png
        │   ├── wizard-step1.png
        │   ├── wizard-step2.png
        │   └── detail.png
        ├── events/
        │   ├── list.png
        │   ├── filters.png
        │   └── detail.png
        ├── device/
        │   ├── management.png
        │   ├── configuration.png
        │   └── link-new.png
        ├── tasks/
        │   ├── list.png
        │   └── add.png
        ├── settings/
        │   ├── menu.png
        │   └── notifications.png
        ├── errors/
        │   ├── network.png
        │   ├── empty-patients.png
        │   └── offline.png
        └── loading/
            ├── dashboard.png
            └── list.png
```

---

## Screenshot Capture Process

### Preparation

1. **Set Up Test Environment**
   - Create test caregiver account
   - Link test devices
   - Add sample medications
   - Generate sample events

2. **Configure Device**
   - Clean device (no notifications)
   - Full battery
   - Good lighting
   - Stable connection

3. **Prepare Test Data**
   - Use realistic names (e.g., "John Doe")
   - Use common medications (e.g., "Aspirin 100mg")
   - Use realistic schedules
   - Include various event types

### Capture Guidelines

1. **Take Screenshot**
   - iOS: Press Volume Up + Side button
   - Android: Press Volume Down + Power button

2. **Annotate Screenshot**
   - Use tools like Skitch, Markup, or Photoshop
   - Add arrows, circles, text
   - Keep annotations clear and minimal
   - Use consistent colors

3. **Optimize Image**
   - Compress to reduce file size
   - Maintain readability
   - Target: < 500KB per image

4. **Name and Save**
   - Use descriptive names
   - Follow naming convention
   - Save in correct directory

---

## Integration with Documentation

### Markdown Syntax

```markdown
![Dashboard Overview](screenshots/caregiver/dashboard/overview.png)
*Figure 1: Dashboard showing all main components*
```

### Placement Guidelines

- Place screenshots immediately after describing the feature
- Include caption explaining what the screenshot shows
- Reference screenshots in text (e.g., "See Figure 1")
- Group related screenshots together

### Example Integration

```markdown
## Dashboard Overview

The dashboard is your home screen, providing a quick overview of all your patients.

![Dashboard Overview](screenshots/caregiver/dashboard/overview.png)
*The caregiver dashboard with all main components visible*

### Components

1. **Header** - Shows your name and quick actions
2. **Patient Selector** - Switch between patients
3. **Device Status** - Real-time connectivity
4. **Quick Actions** - Navigate to main features

![Patient Selector](screenshots/caregiver/dashboard/patient-selector.png)
*Patient selector showing multiple patients with online/offline status*
```

---

## Quality Checklist

Before finalizing screenshots, verify:

- [ ] All required screenshots captured
- [ ] Images are clear and readable
- [ ] Annotations are helpful and not cluttered
- [ ] Consistent test data across screenshots
- [ ] No personal/sensitive information visible
- [ ] File sizes optimized
- [ ] Proper naming convention used
- [ ] Saved in correct directories
- [ ] Both light and dark mode (where applicable)
- [ ] Multiple device sizes represented

---

## Maintenance

### When to Update Screenshots

- After UI changes
- After feature additions
- After design system updates
- When user feedback indicates confusion
- Quarterly review

### Version Control

- Keep old screenshots in `screenshots/archive/`
- Date stamp archived screenshots
- Document changes in CHANGELOG.md

---

## Tools and Resources

### Screenshot Tools

- **iOS**: Built-in screenshot + Markup
- **Android**: Built-in screenshot + Google Photos editor
- **Desktop**: Skitch, Snagit, Photoshop

### Annotation Tools

- Skitch (Mac, iOS)
- Markup (iOS)
- Google Photos (Android)
- Photoshop
- Figma

### Optimization Tools

- TinyPNG (online)
- ImageOptim (Mac)
- Squoosh (online)

---

*Last Updated: 2024*


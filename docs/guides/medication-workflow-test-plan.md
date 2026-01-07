# Medication Workflow Test Plan

## Overview
This test plan covers comprehensive testing of the medication workflow in the Pildhora app, including the new medication form components, backend data storage, migration functionality, and backward compatibility with existing data.

## Test Environment
- **Platform**: iOS and Android (if possible)
- **Firebase Project**: Pildhora (production or test environment)
- **Test Data**: Mix of new format medications and legacy format medications
- **User Roles**: Patient and Caregiver accounts

## Test Categories

### 1. Form Functionality Tests

#### 1.1 Add New Medication Form
**Test Case**: ADD-001 - Basic Form Functionality
- **Description**: Test all form components work correctly when adding a new medication
- **Steps**:
  1. Navigate to Add Medication screen
  2. Fill in all required fields with valid data
  3. Verify each form component responds correctly to user input
  4. Submit the form
- **Expected Results**:
  - All form fields accept input correctly
  - Validation works for each field
  - Medication is saved successfully
  - User is redirected back to medication list

**Test Case**: ADD-002 - Medication Name Input
- **Description**: Test medication name input validation and behavior
- **Test Data**:
  - Valid: "Aspirin", "Ibuprofen 500mg", "Vitamin D3"
  - Invalid: "", "a", "   " (empty/whitespace)
- **Expected Results**:
  - Auto-capitalization works correctly
  - Validation rejects empty names and names < 2 characters
  - Error messages display correctly

**Test Case**: ADD-003 - Dose Input Container
- **Description**: Test dose value and unit input functionality
- **Test Data**:
  - Valid values: "500", "10.5", "0.25"
  - Invalid values: "", "abc", "12.345" (too many decimals)
  - Units: Test all predefined units and custom units
- **Expected Results**:
  - Numeric input only allowed
  - Decimal validation works (max 2 decimal places)
  - Unit picker shows all options
  - Custom unit input works correctly

**Test Case**: ADD-004 - Quantity Type Selector
- **Description**: Test quantity type selection functionality
- **Test Data**:
  - Predefined types: Tablets, Capsules, Liquid, Cream, Inhaler, Drops, Spray, Other
  - Custom types: "Gummies", "Patches", "Lozenges"
- **Expected Results**:
  - All predefined types selectable
  - Custom types can be added and removed
  - Visual feedback shows selected types
  - Multiple types can be selected (though only first is saved)

**Test Case**: ADD-005 - Reminder Time Picker
- **Description**: Test time selection and management
- **Test Data**:
  - Times: "08:00", "14:30", "20:00"
  - Test adding, editing, and removing times
- **Expected Results**:
  - Time picker opens correctly
  - Times display in 12-hour format with AM/PM
  - Multiple times can be added
  - Times can be edited and removed

**Test Case**: ADD-006 - Reminder Days Selector
- **Description**: Test day selection functionality
- **Test Data**:
  - Individual days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  - Quick select: Weekdays, Weekends, All
- **Expected Results**:
  - Individual days can be toggled
  - Quick select options work correctly
  - Visual feedback shows selected days
  - At least one day must be selected

#### 1.2 Edit Existing Medication Form
**Test Case**: EDIT-001 - Edit New Format Medication
- **Description**: Test editing medications with new data structure
- **Steps**:
  1. Select a medication with new format (doseValue, doseUnit, quantityType)
  2. Modify various fields
  3. Save changes
- **Expected Results**:
  - Form pre-fills with correct data
  - All fields can be modified
  - Changes are saved correctly
  - Data integrity maintained

**Test Case**: EDIT-002 - Edit Legacy Format Medication
- **Description**: Test editing medications with legacy dosage format
- **Steps**:
  1. Select a medication with legacy format (dosage field only)
  2. Verify migration works correctly
  3. Modify fields and save
- **Expected Results**:
  - Legacy data migrates to new format correctly
  - Form displays migrated data properly
  - Changes save in new format
  - Legacy dosage field updated for compatibility

**Test Case**: EDIT-003 - Delete Medication
- **Description**: Test medication deletion functionality
- **Steps**:
  1. Select a medication for editing
  2. Tap delete button
  3. Confirm deletion
- **Expected Results**:
  - Confirmation prompt appears
  - Medication is deleted from database
  - User is redirected to medication list
  - Medication no longer appears in list

### 2. Data Structure and Migration Tests

#### 2.1 New Format Data Structure
**Test Case**: DATA-001 - New Format Creation
- **Description**: Verify new medications save with correct structure
- **Expected Structure**:
```javascript
{
  id: "string",
  name: "string",
  doseValue: "string",        // e.g., "500"
  doseUnit: "string",         // e.g., "mg"
  quantityType: "string",      // e.g., "Tablets"
  isCustomQuantityType: boolean,
  dosage: "string",           // Legacy: "500mg, Tablets"
  frequency: "string",
  times: ["string"],
  patientId: "string",
  caregiverId: "string",
  createdAt: Date,
  updatedAt: Date
}
```

#### 2.2 Legacy Data Migration
**Test Case**: MIG-001 - Legacy Format Parsing
- **Description**: Test migration of various legacy dosage formats
- **Test Data**:
  - "500mg, 10 tablets"
  - "10ml, 5ml"
  - "2 capsules"
  - "1 tablet"
  - "0.5mg, 1 tablet"
- **Expected Results**:
  - Dose value extracted correctly
  - Dose unit identified correctly
  - Quantity type normalized correctly
  - Custom types marked appropriately

**Test Case**: MIG-002 - Migration Script
- **Description**: Test the migration script functionality
- **Steps**:
  1. Run migration script with --dry-run flag
  2. Verify it identifies medications needing migration
  3. Run actual migration
  4. Verify data integrity post-migration
- **Expected Results**:
  - Script identifies all legacy medications
  - Migration preserves all data
  - New fields populated correctly
  - Legacy dosage field maintained

### 3. Display and List Tests

#### 3.1 Medication List Display
**Test Case**: LIST-001 - Mixed Format Display
- **Description**: Test medication list with mixed data formats
- **Steps**:
  1. Ensure database has both new and legacy format medications
  2. Navigate to medication list
  3. Verify all medications display correctly
- **Expected Results**:
  - New format medications display with doseValue + doseUnit + quantityType
  - Legacy format medications display with dosage field
  - All medications show name, frequency, and next dose time
  - No display errors or missing information

**Test Case**: LIST-002 - Empty State
- **Description**: Test medication list when no medications exist
- **Expected Results**:
  - Appropriate empty state message displayed
  - Add button still functional
  - No errors or crashes

### 4. Validation and Error Handling Tests

#### 4.1 Form Validation
**Test Case**: VAL-001 - Required Field Validation
- **Description**: Test validation of all required fields
- **Test Scenarios**:
  - Empty medication name
  - Empty dose value
  - No dose unit selected
  - No quantity type selected
  - No reminder times
  - No reminder days
- **Expected Results**:
  - Appropriate error messages for each field
  - Form submission blocked until all fields valid
  - Visual indicators (red borders) on invalid fields

**Test Case**: VAL-002 - Input Format Validation
- **Description**: Test validation of input formats
- **Test Scenarios**:
  - Non-numeric dose values
  - Invalid time formats
  - Extremely long medication names
  - Special characters in custom fields
- **Expected Results**:
  - Invalid formats rejected
  - Helpful error messages
  - Input sanitized where appropriate

#### 4.2 Error Handling
**Test Case**: ERR-001 - Network Errors
- **Description**: Test app behavior during network issues
- **Steps**:
  1. Disable network connection
  2. Attempt to add/edit medication
  3. Verify error handling
- **Expected Results**:
  - Appropriate error message displayed
  - App doesn't crash
  - Data preserved if possible

**Test Case**: ERR-002 - Permission Errors
- **Description**: Test behavior with insufficient permissions
- **Steps**:
  1. Try to access medications of another user
  2. Try to modify medications without proper role
- **Expected Results**:
  - Access denied appropriately
  - Clear error messages
  - No data leakage

### 5. Backend and Database Tests

#### 5.1 Firestore Operations
**Test Case**: DB-001 - CRUD Operations
- **Description**: Test all database operations
- **Operations**:
  - Create new medication
  - Read medication list
  - Update existing medication
  - Delete medication
- **Expected Results**:
  - All operations complete successfully
  - Data stored correctly in Firestore
  - Proper error handling for failures

**Test Case**: DB-002 - Data Integrity
- **Description**: Verify data integrity throughout operations
- **Checks**:
  - Required fields never null
  - Data types consistent
  - Relationships maintained (patientId, caregiverId)
  - Timestamps updated correctly

### 6. Cross-Platform Tests

#### 6.1 Platform-Specific Behavior
**Test Case**: PLATFORM-001 - iOS Specific
- **Description**: Test medication workflow on iOS
- **Focus Areas**:
  - DateTimePicker behavior
  - Modal presentations
  - Keyboard handling
  - Touch interactions

**Test Case**: PLATFORM-002 - Android Specific
- **Description**: Test medication workflow on Android
- **Focus Areas**:
  - DateTimePicker behavior
  - Back navigation
  - Material Design compliance
  - Hardware back button

### 7. Performance Tests

#### 7.1 Load Performance
**Test Case**: PERF-001 - Large Medication Lists
- **Description**: Test performance with many medications
- **Steps**:
  1. Create 50+ medications
  2. Navigate to medication list
  3. Test scrolling and interactions
- **Expected Results**:
  - List loads quickly
  - Smooth scrolling
  - No memory issues

### 8. Accessibility Tests

#### 8.1 Screen Reader Support
**Test Case**: A11Y-001 - VoiceOver/TalkBack
- **Description**: Test accessibility features
- **Checks**:
  - All form fields properly labeled
  - Buttons have accessible labels
  - Screen reader announces all important information
  - Navigation works with accessibility services

## Test Execution Plan

### Phase 1: Basic Functionality
1. Form component testing
2. Basic CRUD operations
3. Simple validation

### Phase 2: Data Migration
1. Legacy data parsing
2. Migration script execution
3. Backward compatibility verification

### Phase 3: Edge Cases
1. Error conditions
2. Network issues
3. Permission problems

### Phase 4: Integration
1. End-to-end workflows
2. Cross-platform testing
3. Performance testing

## Test Data Requirements

### Sample Medications (New Format)
```javascript
[
  {
    name: "Aspirin",
    doseValue: "500",
    doseUnit: "mg",
    quantityType: "Tablets",
    frequency: "Mon, Tue, Wed, Thu, Fri",
    times: ["08:00", "20:00"]
  },
  {
    name: "Vitamin D3",
    doseValue: "1000",
    doseUnit: "IU",
    quantityType: "Capsules",
    isCustomQuantityType: false,
    frequency: "Mon, Tue, Wed, Thu, Fri, Sat, Sun",
    times: ["09:00"]
  },
  {
    name: "Custom Medication",
    doseValue: "2.5",
    doseUnit: "ml",
    quantityType: "Custom Drops",
    isCustomQuantityType: true,
    frequency: "Sat, Sun",
    times: ["10:00", "18:00"]
  }
]
```

### Sample Medications (Legacy Format)
```javascript
[
  {
    name: "Old Aspirin",
    dosage: "500mg, 10 tablets",
    frequency: "Daily",
    times: ["08:00"]
  },
  {
    name: "Old Liquid Med",
    dosage: "10ml, 5ml",
    frequency: "Twice daily",
    times: ["08:00", "20:00"]
  }
]
```

## Success Criteria

### Must Pass
- All form components work correctly
- New medications save with proper structure
- Legacy medications migrate correctly
- No data loss during migration
- Basic validation works
- No crashes in normal usage

### Should Pass
- Error handling works gracefully
- Performance acceptable with large datasets
- Accessibility features functional
- Cross-platform consistency

### Could Pass
- Advanced validation scenarios
- Edge case handling
- Optimization opportunities

## Test Documentation

Each test case should include:
- Test case ID and title
- Preconditions
- Test steps
- Expected results
- Actual results
- Pass/Fail status
- Notes/Issues

## Issues to Track

During testing, track:
- Functional bugs
- UI/UX issues
- Performance problems
- Accessibility gaps
- Platform-specific issues
- Data inconsistencies
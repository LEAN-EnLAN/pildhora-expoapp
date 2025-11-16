# PILDHORA Caregiver User Guide

## Welcome to PILDHORA

PILDHORA is a comprehensive medication management system that helps caregivers monitor and manage medications for their patients. This guide will help you get started and make the most of the caregiver dashboard.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Patients](#managing-patients)
4. [Device Management](#device-management)
5. [Medication Management](#medication-management)
6. [Events Registry](#events-registry)
7. [Tasks](#tasks)
8. [Settings](#settings)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Getting Started

### Creating Your Account

1. **Download the App**
   - iOS: Download from the App Store
   - Android: Download from Google Play Store

2. **Sign Up**
   - Open the PILDHORA app
   - Tap "Sign Up"
   - Enter your email and create a password
   - Select "Caregiver" as your role
   - Complete your profile information

3. **Verify Your Email**
   - Check your email for a verification link
   - Click the link to verify your account
   - Return to the app and log in

### First Login

When you first log in, you'll see:
- An empty dashboard
- A prompt to link your first device
- Quick access to help resources

**Next Steps**:
1. Link a device to connect with a patient
2. Set up your profile
3. Explore the dashboard features

---

## Dashboard Overview

The dashboard is your home screen, providing a quick overview of all your patients and their medication status.

### Dashboard Components

#### 1. Header
- **PILDHORA Logo**: Tap to return to dashboard
- **Your Name**: Displays your caregiver name
- **Emergency Button** (🚨): Quick access to emergency contacts
- **Account Menu** (👤): Access settings and logout

#### 2. Patient Selector
If you manage multiple patients, you'll see a horizontal list of patient cards at the top of the dashboard.

**Features**:
- Swipe left/right to view all patients
- Tap a patient card to switch to that patient
- Green dot indicates device is online
- Gray dot indicates device is offline

#### 3. Device Connectivity Card
Shows real-time status of the selected patient's device.

**Information Displayed**:
- Online/Offline status
- Battery level (with icon)
- Last seen timestamp (when offline)
- "Manage Device" button

**Status Indicators**:
- 🟢 Green: Device is online
- ⚫ Gray: Device is offline
- 🔋 Battery icon: Shows current battery level
  - Green: > 50%
  - Yellow: 20-50%
  - Red: < 20%

#### 4. Last Medication Status Card
Displays the most recent medication event for the selected patient.

**Event Types**:
- 🔵 Blue: Medication created
- 🟡 Yellow: Medication updated
- 🔴 Red: Medication deleted
- 🟢 Green: Dose taken
- 🟠 Orange: Dose missed

**Information Shown**:
- Event type
- Medication name
- Time of event
- "View All Events" button

#### 5. Quick Actions Panel
Four large buttons for quick access to main features:

- **Events Registry** (🔔): View all medication events
- **Medications** (💊): Manage patient medications
- **Tasks** (✓): Your personal to-do list
- **Device** (📱): Manage device settings

---

## Managing Patients

### Linking Your First Patient

To manage a patient, you need to link their device:

1. **Get the Device ID**
   - Ask the patient for their device ID
   - Device ID is printed on the device
   - Format: Usually 5+ characters (e.g., "DEVICE-001")

2. **Link the Device**
   - Tap "Device" in Quick Actions
   - Tap "Link New Device"
   - Enter the device ID
   - Tap "Link Device"

3. **Confirmation**
   - You'll see a success message
   - The patient will appear in your dashboard
   - Device status will update automatically

### Managing Multiple Patients

You can manage multiple patients simultaneously:

1. **Add Another Patient**
   - Tap "Device" in Quick Actions
   - Tap "Link New Device"
   - Enter the new device ID
   - Tap "Link Device"

2. **Switch Between Patients**
   - Use the Patient Selector at the top of the dashboard
   - Swipe to see all patients
   - Tap a patient card to switch

3. **View Patient Information**
   - Patient name
   - Device status
   - Last medication event
   - Medication adherence (if available)

### Unlinking a Patient

If you no longer need to manage a patient:

1. Go to "Device" in Quick Actions
2. Find the device in your linked devices list
3. Tap "Unlink"
4. Confirm the action
5. The patient will be removed from your dashboard

**Note**: This does not delete the patient's account or data, it only removes your access.

---

## Device Management

### Device Status

The device connectivity card shows real-time information:

**Online Status**:
- Device is connected to the internet
- Medication alarms will work
- Configuration changes sync immediately

**Offline Status**:
- Device is not connected
- Shows last seen timestamp
- Medication alarms still work locally
- Configuration changes will sync when device comes online

### Device Configuration

To configure a patient's device:

1. **Access Device Settings**
   - Tap "Device" in Quick Actions
   - Find the device in your list
   - Tap "Configure"

2. **Alarm Settings**
   - **Alarm Mode**: Sound, Vibrate, Both, or Silent
   - **Volume**: Adjust alarm volume (0-100)

3. **LED Settings**
   - **LED Intensity**: Adjust brightness (0-100)
   - **LED Color**: Choose alarm light color
   - Tap the color picker to select a color

4. **Save Changes**
   - Tap "Save Configuration"
   - Changes sync to device automatically
   - You'll see a confirmation message

### Battery Management

Monitor device battery levels:

- **Green** (> 50%): Battery is good
- **Yellow** (20-50%): Battery is getting low
- **Red** (< 20%): Battery needs charging soon

**Low Battery Alert**:
- You'll receive a notification when battery is low
- Remind the patient to charge the device
- Device will continue working until battery is depleted

### Troubleshooting Device Issues

**Device Shows Offline**:
1. Check if device is powered on
2. Verify device has internet connection
3. Check if device is within WiFi range
4. Try restarting the device

**Configuration Not Syncing**:
1. Ensure device is online
2. Wait a few minutes for sync
3. Try saving configuration again
4. Check device firmware version

**Battery Draining Quickly**:
1. Reduce LED intensity
2. Lower alarm volume
3. Check for firmware updates
4. Contact support if issue persists

---

## Medication Management

### Viewing Medications

To see a patient's medications:

1. Select the patient from the Patient Selector
2. Tap "Medications" in Quick Actions
3. You'll see a list of all medications

**Medication Card Shows**:
- Medication icon (emoji)
- Medication name
- Dosage (e.g., "100 mg")
- Schedule (times and frequency)
- Inventory status (if tracked)

### Adding a New Medication

1. **Start the Wizard**
   - Tap "Medications" in Quick Actions
   - Tap the "+" button
   - The medication wizard will open

2. **Step 1: Icon and Name**
   - Choose an icon (emoji) for the medication
   - Enter the medication name
   - Tap "Next"

3. **Step 2: Dosage**
   - Enter dose amount (e.g., 100)
   - Select dose unit (mg, ml, etc.)
   - Choose quantity type (pill, liquid, cream)
   - Tap "Next"

4. **Step 3: Schedule**
   - Select frequency (Daily, Weekly, As Needed)
   - Add times for medication
   - Tap "+" to add more times
   - Tap "Next"

5. **Step 4: Inventory** (Optional)
   - Toggle "Track Inventory" if desired
   - Enter current quantity
   - Set low quantity alert threshold
   - Tap "Save"

6. **Confirmation**
   - Medication is added to the list
   - An event is created in the registry
   - Device is updated with new schedule

### Editing a Medication

1. Tap "Medications" in Quick Actions
2. Find the medication in the list
3. Tap the medication card
4. Tap "Edit"
5. Make your changes
6. Tap "Save"

**What You Can Edit**:
- Medication name
- Dosage amount and unit
- Schedule times
- Inventory settings
- Icon/emoji

**Note**: Changes are tracked in the Events Registry.

### Deleting a Medication

1. Tap "Medications" in Quick Actions
2. Find the medication in the list
3. Tap the medication card
4. Tap "Delete"
5. Confirm the deletion

**Important**:
- Deletion is permanent
- An event is created in the registry
- Device schedule is updated
- Patient will no longer receive alarms for this medication

### Inventory Tracking

If inventory tracking is enabled:

**Low Quantity Alerts**:
- You'll receive a notification when quantity is low
- A banner appears on the medication card
- Time to order a refill

**Updating Quantity**:
1. Tap the medication card
2. Tap "Update Inventory"
3. Enter new quantity
4. Tap "Save"

**Refill Reminders**:
- Set up automatic refill reminders
- Get notified X days before running out
- Track refill history

---

## Events Registry

The Events Registry shows a complete history of all medication-related activities.

### Viewing Events

1. Tap "Events Registry" in Quick Actions
2. You'll see a chronological list of events

**Event Types**:
- **Medication Created**: New medication added
- **Medication Updated**: Medication details changed
- **Medication Deleted**: Medication removed
- **Dose Taken**: Patient took a dose
- **Dose Missed**: Patient missed a scheduled dose

### Filtering Events

Use filters to find specific events:

1. **Search by Medication Name**
   - Tap the search bar
   - Type medication name
   - Results update automatically

2. **Filter by Date Range**
   - Tap "Date Range"
   - Select start and end dates
   - Tap "Apply"

3. **Filter by Event Type**
   - Tap "Event Type"
   - Select one or more types
   - Tap "Apply"

4. **Filter by Patient** (if managing multiple)
   - Tap "Patient"
   - Select patient
   - Tap "Apply"

### Event Details

To see full event details:

1. Tap an event in the list
2. View detailed information:
   - Event type and timestamp
   - Medication information
   - Patient name
   - Changes made (for updates)
   - Who made the change

### Change History

For medication updates, you can see what changed:

**Example**:
```
Dosage: 50 mg → 100 mg
Times: [08:00] → [08:00, 20:00]
```

This helps you track medication adjustments over time.

### Generating Reports

To generate a report:

1. Apply desired filters
2. Tap the menu icon (⋮)
3. Select "Generate Report"
4. Choose format (PDF, CSV)
5. Share or save the report

**Report Uses**:
- Doctor appointments
- Insurance claims
- Medication reviews
- Compliance tracking

---

## Tasks

The Tasks feature is your personal to-do list for caregiver activities.

### Creating a Task

1. Tap "Tasks" in Quick Actions
2. Tap the "+" button
3. Enter task description
4. Tap "Add"

**Task Examples**:
- "Call pharmacy for refill"
- "Schedule doctor appointment"
- "Update medication schedule"
- "Check device battery"

### Managing Tasks

**Mark as Complete**:
- Tap the checkbox next to a task
- Task will show as completed (strikethrough)
- Completed tasks move to the bottom

**Edit a Task**:
- Tap the task
- Edit the description
- Tap "Save"

**Delete a Task**:
- Swipe left on the task
- Tap "Delete"
- Confirm deletion

### Task Organization

**Tips for Effective Task Management**:
- Keep tasks specific and actionable
- Review tasks daily
- Delete completed tasks regularly
- Use tasks for reminders and follow-ups

---

## Settings

### Account Settings

Access settings from the account menu (👤):

1. **Profile**
   - Update your name
   - Change email
   - Update password

2. **Notifications**
   - Enable/disable push notifications
   - Set notification preferences
   - Configure alert sounds

3. **Privacy**
   - Review data usage
   - Manage permissions
   - Export your data

4. **Security**
   - Change password
   - Enable two-factor authentication
   - Review login history

### App Settings

**Language**:
- English
- Spanish (Español)

**Theme**:
- Light mode
- Dark mode
- System default

**Data Usage**:
- WiFi only
- Cellular data allowed
- Background sync

### Help and Support

**In-App Help**:
- Tap "Help" in settings
- Browse help articles
- Watch tutorial videos

**Contact Support**:
- Email: support@pildhora.com
- Phone: 1-800-PILDHORA
- Live chat: Available in app

---

## Troubleshooting

### Common Issues

#### Can't Log In

**Problem**: Login fails or shows error

**Solutions**:
1. Check your email and password
2. Ensure you have internet connection
3. Try "Forgot Password" to reset
4. Clear app cache and try again
5. Reinstall the app if needed

#### Device Won't Link

**Problem**: Device linking fails

**Solutions**:
1. Verify device ID is correct (minimum 5 characters)
2. Check that device is not already linked
3. Ensure you have internet connection
4. Try again in a few minutes
5. Contact support if issue persists

#### Events Not Showing

**Problem**: Events Registry is empty or not updating

**Solutions**:
1. Check internet connection
2. Pull down to refresh the list
3. Clear filters if applied
4. Wait a few minutes for sync
5. Restart the app

#### Medications Not Syncing

**Problem**: Medication changes don't appear on device

**Solutions**:
1. Ensure device is online
2. Check device connectivity status
3. Wait a few minutes for sync
4. Try editing medication again
5. Restart the device

#### App is Slow

**Problem**: App performance is poor

**Solutions**:
1. Close other apps
2. Restart your phone
3. Clear app cache
4. Check for app updates
5. Ensure you have enough storage

### Error Messages

**"Permission Denied"**
- You don't have access to this patient
- Verify device is linked correctly
- Contact patient to confirm device ID

**"Network Error"**
- Check your internet connection
- Try switching between WiFi and cellular
- Wait and try again

**"Device Not Found"**
- Verify device ID is correct
- Check that device exists
- Contact support for help

**"Session Expired"**
- Your login session has expired
- Log out and log back in
- Enable "Stay Logged In" in settings

---

## FAQ

### General Questions

**Q: How many patients can I manage?**
A: There's no limit. You can manage as many patients as needed.

**Q: Can multiple caregivers manage the same patient?**
A: Yes! Multiple caregivers can link to the same device and manage the same patient.

**Q: Is my data secure?**
A: Yes. All data is encrypted and stored securely. We follow industry best practices for data security.

**Q: Can I use the app offline?**
A: You can view cached data offline, but you need internet to sync changes.

**Q: How much does it cost?**
A: Contact sales for pricing information.

### Device Questions

**Q: What if the device battery dies?**
A: The device will stop working until recharged. Medication alarms won't sound.

**Q: Can I use the app without a device?**
A: The app is designed to work with PILDHORA devices. Some features require a device.

**Q: How do I update device firmware?**
A: Firmware updates happen automatically when the device is online.

**Q: What if I lose the device?**
A: Contact support immediately to deactivate the device and get a replacement.

### Medication Questions

**Q: Can I add medications for multiple times per day?**
A: Yes! You can add as many times as needed for each medication.

**Q: What if I make a mistake adding a medication?**
A: You can edit or delete medications at any time.

**Q: How do I know if a patient took their medication?**
A: Check the Events Registry for "Dose Taken" events.

**Q: Can I set up medication reminders?**
A: Yes, the device sends alarms at scheduled times.

### Privacy Questions

**Q: Who can see my patient's data?**
A: Only you, the patient, and other linked caregivers can see the data.

**Q: Can I export patient data?**
A: Yes, you can generate reports and export data from the Events Registry.

**Q: How long is data stored?**
A: Data is stored indefinitely unless you delete it.

**Q: Can I delete a patient's data?**
A: Only the patient can delete their own data. You can unlink from the patient.

---

## Tips for Success

### Best Practices

1. **Check Dashboard Daily**
   - Review device status
   - Check for missed doses
   - Monitor battery levels

2. **Keep Medications Updated**
   - Update schedules promptly
   - Track inventory regularly
   - Remove discontinued medications

3. **Use Events Registry**
   - Review events weekly
   - Generate reports for doctors
   - Track medication adherence

4. **Communicate with Patients**
   - Discuss medication changes
   - Explain device features
   - Address concerns promptly

5. **Stay Organized**
   - Use tasks for reminders
   - Set up notifications
   - Keep contact information current

### Keyboard Shortcuts

**iOS**:
- Swipe right: Go back
- Pull down: Refresh
- Long press: Quick actions

**Android**:
- Back button: Go back
- Swipe down: Refresh
- Menu button: More options

---

## Getting Help

### Support Resources

**Documentation**:
- User Guide (this document)
- Video tutorials
- FAQ section
- Troubleshooting guide

**Contact Support**:
- **Email**: support@pildhora.com
- **Phone**: 1-800-PILDHORA
- **Live Chat**: Available in app (Mon-Fri, 9am-5pm)
- **Emergency**: 24/7 support for critical issues

**Community**:
- User forum
- Facebook group
- Twitter: @PILDHORA

### Feedback

We value your feedback!

**Share Your Experience**:
- Rate the app in the store
- Submit feature requests
- Report bugs
- Suggest improvements

**Contact Us**:
- Email: feedback@pildhora.com
- In-app feedback form
- User surveys

---

## Updates and New Features

### Staying Updated

**App Updates**:
- Enable automatic updates in your device settings
- Check for updates regularly
- Read release notes for new features

**What's New**:
- Check the "What's New" section in settings
- Follow us on social media
- Subscribe to our newsletter

### Upcoming Features

We're constantly improving PILDHORA. Upcoming features include:
- Voice commands
- Medication interaction warnings
- Advanced analytics
- Telehealth integration
- Family sharing

---

## Conclusion

Thank you for using PILDHORA! We're committed to helping you provide the best care for your patients.

If you have any questions or need assistance, don't hesitate to contact our support team.

**Happy Caregiving!**

---

*Last Updated: 2024*
*Version: 2.0*

For the latest version of this guide, visit: https://pildhora.com/docs/caregiver-guide

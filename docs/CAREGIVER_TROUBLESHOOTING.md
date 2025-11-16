# PILDHORA Caregiver Troubleshooting Guide

## Overview

This guide provides detailed troubleshooting steps for common issues encountered by caregivers using the PILDHORA application. Follow the steps in order for each issue.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Device Linking Problems](#device-linking-problems)
3. [Connectivity Issues](#connectivity-issues)
4. [Medication Management Issues](#medication-management-issues)
5. [Events Registry Problems](#events-registry-problems)
6. [Performance Issues](#performance-issues)
7. [Data Sync Issues](#data-sync-issues)
8. [Notification Problems](#notification-problems)
9. [Device Configuration Issues](#device-configuration-issues)
10. [Error Messages](#error-messages)

---

## Authentication Issues

### Cannot Log In

**Symptoms**:
- Login button doesn't work
- "Invalid credentials" error
- App crashes on login

**Solutions**:

1. **Verify Credentials**
   ```
   ✓ Check email is correct
   ✓ Verify password (case-sensitive)
   ✓ Ensure no extra spaces
   ✓ Try copy-pasting password
   ```

2. **Check Internet Connection**
   ```
   ✓ Verify WiFi or cellular data is on
   ✓ Try opening a website in browser
   ✓ Switch between WiFi and cellular
   ✓ Restart your router if on WiFi
   ```

3. **Reset Password**
   ```
   1. Tap "Forgot Password"
   2. Enter your email
   3. Check email for reset link
   4. Create new password
   5. Try logging in again
   ```

4. **Clear App Cache**
   - **iOS**: Settings > General > iPhone Storage > PILDHORA > Delete App > Reinstall
   - **Android**: Settings > Apps > PILDHORA > Storage > Clear Cache

5. **Update App**
   ```
   1. Open App Store / Play Store
   2. Search for PILDHORA
   3. Tap "Update" if available
   4. Try logging in again
   ```

**Still Not Working?**
- Contact support: support@pildhora.com
- Provide: Email address, device type, error message

---

### Session Expired

**Symptoms**:
- "Session expired" message
- Automatically logged out
- Need to log in frequently

**Solutions**:

1. **Enable Stay Logged In**
   ```
   1. Log in to the app
   2. Check "Stay Logged In" option
   3. Complete login
   ```

2. **Check Date and Time**
   ```
   ✓ Ensure device date/time is correct
   ✓ Enable "Set Automatically"
   ✓ Verify timezone is correct
   ```

3. **Refresh Token**
   ```
   1. Log out completely
   2. Close the app
   3. Reopen and log in
   4. Session should be refreshed
   ```

4. **Check for App Updates**
   - Update to latest version
   - Older versions may have session issues

**Prevention**:
- Keep app updated
- Don't clear app data frequently
- Enable automatic login

---

### Wrong User Role

**Symptoms**:
- "Access denied" message
- Can't access caregiver features
- Redirected to patient interface

**Solutions**:

1. **Verify Account Role**
   ```
   1. Log in to the app
   2. Go to Settings > Profile
   3. Check "Role" field
   4. Should say "Caregiver"
   ```

2. **Contact Support to Change Role**
   ```
   Email: support@pildhora.com
   Subject: Role Change Request
   Include: Your email, desired role
   ```

3. **Create New Account**
   ```
   1. Log out of current account
   2. Tap "Sign Up"
   3. Select "Caregiver" role
   4. Complete registration
   ```

**Note**: Role cannot be changed by users for security reasons.

---

## Device Linking Problems

### Device ID Not Accepted

**Symptoms**:
- "Invalid device ID" error
- "Device ID too short" message
- Linking fails immediately

**Solutions**:

1. **Verify Device ID Format**
   ```
   ✓ Minimum 5 characters
   ✓ Only letters, numbers, hyphens, underscores
   ✓ No spaces or special characters
   ✓ Case-sensitive
   ```

2. **Check Device ID Source**
   ```
   ✓ Get ID from device label
   ✓ Ask patient for correct ID
   ✓ Verify no typos
   ✓ Try copying and pasting
   ```

3. **Common Mistakes**
   ```
   ✗ "DEV-1" (too short)
   ✗ "DEVICE 001" (contains space)
   ✗ "DEVICE#001" (invalid character)
   ✓ "DEVICE-001" (correct)
   ✓ "DEV_12345" (correct)
   ```

**Valid Examples**:
- DEVICE-001
- PILDHORA-ABC123
- DEV_12345
- PATIENT-DEVICE-001

---

### Device Already Linked

**Symptoms**:
- "Device already linked" error
- Can't link device
- Device shows as linked elsewhere

**Solutions**:

1. **Check Your Linked Devices**
   ```
   1. Go to Device Management
   2. Check if device is already in your list
   3. If yes, you're already linked
   ```

2. **Ask Patient to Unlink**
   ```
   If patient linked the device:
   1. Patient opens their app
   2. Goes to Device Settings
   3. Taps "Unlink Device"
   4. You can now link it
   ```

3. **Contact Other Caregivers**
   ```
   If another caregiver linked it:
   - Multiple caregivers can link same device
   - No need to unlink
   - Just link with same device ID
   ```

**Note**: Multiple caregivers can link to the same device simultaneously.

---

### Permission Denied

**Symptoms**:
- "Permission denied" error
- Can't complete linking
- Access denied message

**Solutions**:

1. **Check Authentication**
   ```
   1. Log out completely
   2. Log back in
   3. Try linking again
   ```

2. **Verify Internet Connection**
   ```
   ✓ Strong WiFi or cellular signal
   ✓ Not using VPN
   ✓ Firewall not blocking app
   ```

3. **Check Firebase Status**
   ```
   1. Visit status.firebase.google.com
   2. Verify all services are operational
   3. Wait if there's an outage
   ```

4. **Update App**
   ```
   1. Check for app updates
   2. Install latest version
   3. Try linking again
   ```

**Still Having Issues?**
- Contact support with device ID
- Provide screenshot of error
- Include your account email

---

## Connectivity Issues

### Device Shows Offline

**Symptoms**:
- Gray dot on device status
- "Last seen" timestamp shown
- Real-time updates not working

**Diagnostic Steps**:

1. **Check Device Power**
   ```
   ✓ Device is plugged in or charged
   ✓ Power indicator light is on
   ✓ Try unplugging and replugging
   ```

2. **Check Device Internet**
   ```
   ✓ Device WiFi is connected
   ✓ WiFi network has internet
   ✓ Other devices can connect
   ✓ Router is working properly
   ```

3. **Check Device Location**
   ```
   ✓ Device is within WiFi range
   ✓ No physical obstructions
   ✓ Not in metal enclosure
   ✓ Try moving closer to router
   ```

4. **Restart Device**
   ```
   1. Unplug device
   2. Wait 30 seconds
   3. Plug back in
   4. Wait for device to boot
   5. Check status in app
   ```

5. **Check App Connection**
   ```
   1. Pull down to refresh
   2. Check your phone's internet
   3. Try switching WiFi/cellular
   4. Restart the app
   ```

**Expected Behavior**:
- Device should show online within 1-2 minutes of connecting
- Status updates every 30 seconds
- "Last seen" updates when device goes offline

---

### Real-Time Updates Not Working

**Symptoms**:
- Device status doesn't update
- Need to manually refresh
- Changes don't sync

**Solutions**:

1. **Check Permissions**
   ```
   iOS:
   Settings > PILDHORA > Background App Refresh > On
   
   Android:
   Settings > Apps > PILDHORA > Battery > Unrestricted
   ```

2. **Verify Internet Connection**
   ```
   ✓ Stable connection (not intermittent)
   ✓ Not on airplane mode
   ✓ Data saver mode is off
   ```

3. **Restart App**
   ```
   1. Close app completely
   2. Clear from recent apps
   3. Reopen app
   4. Check if updates work
   ```

4. **Check Firebase Connection**
   ```
   1. Go to Settings > About
   2. Check "Connection Status"
   3. Should show "Connected"
   ```

**Troubleshooting**:
- Try manual refresh (pull down)
- Check if other features work
- Verify device is online
- Contact support if persists

---

## Medication Management Issues

### Cannot Add Medication

**Symptoms**:
- "Save" button doesn't work
- Wizard crashes
- Medication doesn't appear in list

**Solutions**:

1. **Complete All Required Fields**
   ```
   ✓ Medication name
   ✓ Dosage amount
   ✓ Dosage unit
   ✓ Quantity type
   ✓ At least one time
   ```

2. **Check Input Validation**
   ```
   ✓ Name: 1-100 characters
   ✓ Dosage: Positive number
   ✓ Times: Valid format (HH:mm)
   ✓ Quantity: Positive integer
   ```

3. **Verify Internet Connection**
   ```
   ✓ Connected to internet
   ✓ Not in airplane mode
   ✓ Try switching networks
   ```

4. **Clear Wizard and Retry**
   ```
   1. Tap "Cancel"
   2. Close wizard
   3. Wait a moment
   4. Start wizard again
   ```

5. **Check Storage Space**
   ```
   ✓ Device has available storage
   ✓ At least 100MB free
   ✓ Clear cache if needed
   ```

---

### Medication Not Syncing to Device

**Symptoms**:
- Medication added but device doesn't alarm
- Changes don't appear on device
- Schedule not updated

**Solutions**:

1. **Verify Device is Online**
   ```
   1. Check device connectivity card
   2. Ensure green dot (online)
   3. Wait if recently added
   ```

2. **Check Sync Status**
   ```
   1. Go to Events Registry
   2. Find medication created event
   3. Check sync status
   4. Should show "Delivered"
   ```

3. **Force Sync**
   ```
   1. Edit the medication
   2. Make a small change
   3. Save the medication
   4. Check device again
   ```

4. **Restart Device**
   ```
   1. Unplug device
   2. Wait 30 seconds
   3. Plug back in
   4. Wait for sync
   ```

**Sync Timeline**:
- Immediate: If device is online
- Delayed: If device is offline (syncs when online)
- Maximum: 5 minutes for sync

---

### Cannot Edit Medication

**Symptoms**:
- Edit button doesn't work
- Changes don't save
- "Access denied" error

**Solutions**:

1. **Verify Access**
   ```
   ✓ You're linked to the patient
   ✓ Device link is active
   ✓ You're logged in as caregiver
   ```

2. **Check Medication Ownership**
   ```
   ✓ Medication belongs to your patient
   ✓ Not deleted or archived
   ✓ Visible in medication list
   ```

3. **Retry Edit**
   ```
   1. Go back to medication list
   2. Pull down to refresh
   3. Try editing again
   ```

4. **Check Internet Connection**
   ```
   ✓ Connected to internet
   ✓ Stable connection
   ✓ Not timing out
   ```

---

## Events Registry Problems

### Events Not Showing

**Symptoms**:
- Empty events list
- Missing recent events
- Events don't load

**Solutions**:

1. **Check Filters**
   ```
   1. Tap "Filters"
   2. Clear all filters
   3. Tap "Apply"
   4. Check if events appear
   ```

2. **Refresh Events**
   ```
   1. Pull down on events list
   2. Wait for refresh
   3. Events should load
   ```

3. **Check Patient Selection**
   ```
   ✓ Correct patient selected
   ✓ Patient has medications
   ✓ Events exist for patient
   ```

4. **Verify Internet Connection**
   ```
   ✓ Connected to internet
   ✓ Not in offline mode
   ✓ Try switching networks
   ```

5. **Check Date Range**
   ```
   ✓ Date range includes recent dates
   ✓ Not filtering out all events
   ✓ Try "All Time" range
   ```

---

### Events Not Syncing

**Symptoms**:
- Events show "Pending" status
- Events don't appear in registry
- Sync indicator stuck

**Solutions**:

1. **Check Sync Status**
   ```
   1. Look for sync indicator
   2. Check pending count
   3. Wait for automatic sync
   ```

2. **Force Sync**
   ```
   1. Pull down to refresh
   2. Wait for sync to complete
   3. Check events again
   ```

3. **Check Internet Connection**
   ```
   ✓ Stable internet connection
   ✓ Not on metered connection
   ✓ Background sync enabled
   ```

4. **Clear Event Queue**
   ```
   1. Go to Settings
   2. Tap "Clear Event Queue"
   3. Confirm action
   4. Events will re-sync
   ```

**Sync Behavior**:
- Automatic: Every 5 minutes
- Manual: Pull to refresh
- Foreground: When app opens
- Background: When internet available

---

## Performance Issues

### App is Slow

**Symptoms**:
- Slow loading times
- Laggy scrolling
- Delayed responses

**Solutions**:

1. **Close Other Apps**
   ```
   1. Open recent apps
   2. Close unused apps
   3. Free up memory
   ```

2. **Restart App**
   ```
   1. Close PILDHORA completely
   2. Clear from recent apps
   3. Reopen app
   ```

3. **Clear Cache**
   ```
   iOS:
   Settings > General > iPhone Storage > PILDHORA > Offload App
   
   Android:
   Settings > Apps > PILDHORA > Storage > Clear Cache
   ```

4. **Check Storage Space**
   ```
   ✓ At least 500MB free
   ✓ Delete unused apps
   ✓ Clear photos/videos
   ```

5. **Update App**
   ```
   1. Check for updates
   2. Install latest version
   3. Performance improvements included
   ```

6. **Restart Device**
   ```
   1. Power off phone
   2. Wait 30 seconds
   3. Power back on
   4. Open app
   ```

---

### App Crashes

**Symptoms**:
- App closes unexpectedly
- Freezes and won't respond
- Black screen

**Solutions**:

1. **Update App**
   ```
   1. Check App Store / Play Store
   2. Install latest update
   3. Bug fixes included
   ```

2. **Restart Device**
   ```
   1. Power off completely
   2. Wait 30 seconds
   3. Power back on
   4. Try app again
   ```

3. **Reinstall App**
   ```
   1. Delete PILDHORA app
   2. Restart device
   3. Reinstall from store
   4. Log in again
   ```

4. **Check Device Compatibility**
   ```
   iOS: Requires iOS 13.0 or later
   Android: Requires Android 8.0 or later
   ```

5. **Report Crash**
   ```
   1. Note what you were doing
   2. Take screenshot if possible
   3. Email support@pildhora.com
   4. Include device model and OS version
   ```

---

## Data Sync Issues

### Changes Not Saving

**Symptoms**:
- Changes revert after saving
- Data doesn't persist
- "Save failed" error

**Solutions**:

1. **Check Internet Connection**
   ```
   ✓ Connected to internet
   ✓ Stable connection
   ✓ Not timing out
   ```

2. **Retry Save**
   ```
   1. Make changes again
   2. Tap "Save"
   3. Wait for confirmation
   4. Verify changes persisted
   ```

3. **Check Permissions**
   ```
   ✓ You have access to patient
   ✓ Device link is active
   ✓ Not in read-only mode
   ```

4. **Clear Cache and Retry**
   ```
   1. Clear app cache
   2. Restart app
   3. Make changes again
   4. Save and verify
   ```

---

### Offline Mode Issues

**Symptoms**:
- Can't view data offline
- "No internet" error
- Cached data not showing

**Solutions**:

1. **Enable Offline Mode**
   ```
   1. Go to Settings
   2. Enable "Offline Mode"
   3. Data will be cached
   ```

2. **Sync Before Going Offline**
   ```
   1. Open app while online
   2. View all needed data
   3. Data is cached automatically
   4. Available offline
   ```

3. **Check Cache Settings**
   ```
   1. Go to Settings > Data
   2. Check "Cache Size"
   3. Increase if needed
   4. Clear old cache
   ```

4. **Understand Limitations**
   ```
   ✓ Can view cached data
   ✗ Cannot make changes
   ✗ Cannot sync events
   ✗ Real-time updates disabled
   ```

---

## Notification Problems

### Not Receiving Notifications

**Symptoms**:
- No push notifications
- Missing alerts
- Silent notifications

**Solutions**:

1. **Check Notification Permissions**
   ```
   iOS:
   Settings > PILDHORA > Notifications > Allow Notifications
   
   Android:
   Settings > Apps > PILDHORA > Notifications > Enabled
   ```

2. **Check Notification Settings in App**
   ```
   1. Open PILDHORA
   2. Go to Settings > Notifications
   3. Enable desired notifications
   4. Save settings
   ```

3. **Check Do Not Disturb**
   ```
   ✓ Do Not Disturb is off
   ✓ Or PILDHORA is allowed
   ✓ Check scheduled DND times
   ```

4. **Check Battery Saver**
   ```
   Android:
   Settings > Battery > Battery Saver > Off
   Or add PILDHORA to exceptions
   ```

5. **Reinstall App**
   ```
   1. Delete app
   2. Reinstall from store
   3. Grant notification permission
   4. Test notifications
   ```

---

## Device Configuration Issues

### Configuration Not Saving

**Symptoms**:
- Settings revert to previous values
- "Save failed" error
- Changes don't apply

**Solutions**:

1. **Verify Device is Online**
   ```
   ✓ Device shows green dot
   ✓ Not offline
   ✓ Connected to internet
   ```

2. **Check Configuration Values**
   ```
   ✓ LED Intensity: 0-100
   ✓ Volume: 0-100
   ✓ Color: Valid hex code
   ✓ Alarm Mode: Valid option
   ```

3. **Retry Configuration**
   ```
   1. Go to Device Management
   2. Tap "Configure"
   3. Make changes
   4. Tap "Save"
   5. Wait for confirmation
   ```

4. **Check Device Firmware**
   ```
   1. View device details
   2. Check firmware version
   3. Update if available
   4. Retry configuration
   ```

---

### Alarm Not Working

**Symptoms**:
- Device doesn't alarm at scheduled times
- Silent alarms
- Missed medication alerts

**Solutions**:

1. **Check Alarm Configuration**
   ```
   ✓ Alarm Mode: Not set to "Silent"
   ✓ Volume: Greater than 0
   ✓ Device is powered on
   ```

2. **Verify Medication Schedule**
   ```
   1. Check medication times
   2. Ensure times are correct
   3. Verify frequency is set
   4. Check timezone
   ```

3. **Check Device Time**
   ```
   ✓ Device time is correct
   ✓ Timezone is correct
   ✓ Time synced with server
   ```

4. **Test Alarm**
   ```
   1. Go to Device Configuration
   2. Tap "Test Alarm"
   3. Device should alarm
   4. If not, contact support
   ```

---

## Error Messages

### "Permission Denied"

**Meaning**: You don't have access to perform this action

**Solutions**:
1. Verify you're logged in as caregiver
2. Check device link is active
3. Ensure you have access to patient
4. Try logging out and back in

---

### "Network Error"

**Meaning**: Cannot connect to server

**Solutions**:
1. Check internet connection
2. Try switching WiFi/cellular
3. Disable VPN if using
4. Wait and retry

---

### "Device Not Found"

**Meaning**: Device ID doesn't exist in system

**Solutions**:
1. Verify device ID is correct
2. Check for typos
3. Confirm device is registered
4. Contact support with device ID

---

### "Session Expired"

**Meaning**: Your login session has expired

**Solutions**:
1. Log out completely
2. Log back in
3. Enable "Stay Logged In"
4. Check device date/time

---

### "Invalid Input"

**Meaning**: Data entered doesn't meet requirements

**Solutions**:
1. Check field requirements
2. Verify format is correct
3. Remove special characters
4. Try different values

---

### "Sync Failed"

**Meaning**: Data couldn't sync to server

**Solutions**:
1. Check internet connection
2. Wait and retry
3. Pull down to refresh
4. Clear event queue

---

## Getting Additional Help

### Before Contacting Support

Gather this information:
- Your account email
- Device type and OS version
- App version
- Steps to reproduce issue
- Screenshots of error messages
- Device ID (if relevant)

### Contact Methods

**Email**: support@pildhora.com
- Response time: 24-48 hours
- Include all relevant information
- Attach screenshots

**Phone**: 1-800-PILDHORA
- Available: Mon-Fri, 9am-5pm EST
- Have account information ready
- Note ticket number

**Live Chat**: In-app
- Available: Mon-Fri, 9am-5pm EST
- Fastest response time
- Real-time assistance

**Emergency**: 24/7 Support
- For critical issues only
- Call: 1-800-PILDHORA-911
- Email: emergency@pildhora.com

---

## Preventive Maintenance

### Regular Tasks

**Daily**:
- Check device status
- Review events
- Monitor battery levels

**Weekly**:
- Update medications if needed
- Review tasks
- Check for app updates

**Monthly**:
- Clear app cache
- Review notification settings
- Update device configuration
- Generate reports

### Best Practices

1. Keep app updated
2. Maintain stable internet
3. Monitor device battery
4. Review events regularly
5. Communicate with patients
6. Back up important data
7. Test features periodically

---

*Last Updated: 2024*

For additional help, visit: https://pildhora.com/support

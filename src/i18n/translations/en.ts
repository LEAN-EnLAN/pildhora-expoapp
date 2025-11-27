/**
 * English Translations
 * 
 * Complete translation file for the device provisioning wizard
 * and connection code flows.
 */

export const en = {
  // Common
  common: {
    next: 'Next',
    back: 'Back',
    cancel: 'Cancel',
    continue: 'Continue',
    complete: 'Complete',
    save: 'Save',
    edit: 'Edit',
    retry: 'Retry',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    loading: 'Loading...',
    saving: 'Saving...',
    testing: 'Testing...',
    validating: 'Validating...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
  },

  // Diagnostics
  diagnostics: {
    title: 'Diagnostics',
    subtitle: 'Quick overview of issues and remediation steps',
    tabs: {
      devices: 'Devices',
      connection: 'Connection',
      medication: 'Medication',
      accessibility: 'Accessibility',
    },
    search: {
      placeholder: 'Search issues, messages or actions',
      accessibilityLabel: 'Search in diagnostics',
    },
    badge: {
      retry: 'Retry',
      attention: 'Attention',
      validate: 'Validate',
      newCode: 'New code',
    },
  },

  // Device Provisioning Wizard
  wizard: {
    title: 'Setup Device',
    progressLabel: 'Step {{current}} of {{total}}: {{step}}',
    
    // Step labels
    steps: {
      welcome: 'Welcome',
      deviceId: 'Device ID',
      verification: 'Verification',
      wifi: 'WiFi',
      preferences: 'Preferences',
      completion: 'Completed',
    },

    // Navigation
    navigation: {
      nextStep: 'Next step: {{step}}',
      previousStep: 'Previous step: {{step}}',
      cancelSetup: 'Cancel setup',
      completeSetup: 'Complete device setup',
      navigationControls: 'Wizard navigation controls',
    },

    // Keyboard shortcuts
    keyboard: {
      shortcuts: 'Available keyboard shortcuts: Right arrow or Page Down for next step, Left arrow or Page Up for previous step, Escape to cancel',
    },

    // Exit confirmation
    exit: {
      title: 'Exit Setup?',
      message: 'You have unsaved changes. Are you sure you want to exit?',
      confirm: 'Yes, exit',
      cancel: 'Continue setup',
    },

    // Continue setup prompt
    continueSetup: {
      title: 'Continue Setup',
      message: 'You have a setup in progress from {{time}} ago',
      continue: 'Continue where I left off',
      startFresh: 'Start fresh',
      step: 'Step {{current}} of {{total}}',
    },
  },

  // Welcome Step
  welcomeStep: {
    title: 'Welcome!',
    subtitle: "Let's set up your medication dispenser device",
    whatWeDo: 'What will we do?',
    description: 'This wizard will guide you step by step to configure your device. The process will take approximately 5 minutes.',
    
    stepsTitle: 'Setup steps',
    steps: {
      deviceId: {
        title: 'Enter device ID',
        description: 'Enter your device unique code',
      },
      verification: {
        title: 'Verify device',
        description: "We'll confirm your device is available",
      },
      wifi: {
        title: 'Configure WiFi',
        description: 'Connect your device to your WiFi network',
      },
      preferences: {
        title: 'Customize preferences',
        description: 'Adjust alarms, LED, and volume',
      },
    },

    deviceIdLocation: 'Where do I find the device ID?',
    deviceIdGuide: 'The device ID is a 5-100 character alphanumeric code located on:',
    locations: {
      bottom: '• Bottom of the device',
      box: '• Label on the product box',
      manual: '• User manual',
    },

    tipsTitle: 'Helpful tips',
    tips: {
      deviceNearby: 'Make sure your device is nearby and powered on',
      wifiPassword: 'Have your WiFi password ready',
      pauseResume: 'The process can be paused and resumed at any time',
    },

    helpButton: 'Need additional help?',
    accessibility: {
      announcement: 'Welcome to the device setup wizard',
      helpButton: 'Get additional help',
      helpButtonHint: 'Opens the support page in your browser',
    },
  },

  // Device ID Step
  deviceIdStep: {
    title: 'Device ID',
    subtitle: 'Enter your medication dispenser unique code',
    
    label: 'Device ID',
    placeholder: 'Ex: DEVICE-12345',
    
    validation: {
      required: 'Device ID is required',
      tooShort: 'ID must be at least 5 characters',
      tooLong: 'ID cannot be more than 100 characters',
      invalidChars: 'ID can only contain letters, numbers, hyphens, and underscores',
      checking: 'Checking availability...',
      valid: 'Valid and available ID',
    },

    helpTitle: 'Where do I find the ID?',
    helpText: 'The device ID is located on:',
    locations: {
      bottom: '• Bottom of the device',
      box: '• Label on the box',
      manual: '• User manual',
    },

    formatInfo: 'The ID must be 5-100 alphanumeric characters',

    troubleshooting: 'Having problems?',
    tips: {
      checkSpelling: 'Verify the ID is spelled correctly, without spaces',
      alreadyClaimed: 'If the device is already registered, contact support',
    },

    accessibility: {
      announcement: 'Step 2: Enter your device ID',
      fieldLabel: 'Device ID field',
      fieldHint: 'Enter the 5-100 character alphanumeric code located on your device',
    },
  },

  // Verification Step
  verificationStep: {
    title: {
      verifying: 'Verifying Device',
      success: 'Verification Successful!',
      error: 'Verification Error',
    },
    subtitle: {
      verifying: 'Please wait while we verify your device',
      success: 'Your device has been registered successfully',
      error: 'We could not verify your device',
    },

    steps: {
      checkingAvailability: 'Checking device availability...',
      registering: 'Registering device...',
      linking: 'Linking device to your account...',
      syncing: 'Syncing with server...',
      complete: 'Device verified successfully!',
      checkingLinks: 'Checking existing links...',
    },

    progressSteps: {
      checkAvailability: 'Check availability',
      registerDevice: 'Register device',
      linkAccount: 'Link to your account',
      sync: 'Sync',
    },

    success: {
      device: 'Device: {{deviceId}}',
      status: 'Status: Active and ready to configure',
      nextInfo: 'Next, we will configure the WiFi connection and your device preferences',
    },

    accessibility: {
      announcement: 'Step 3: Verifying your device',
      successAnnouncement: 'Device verified and linked successfully',
    },
  },

  // WiFi Config Step
  wifiConfigStep: {
    title: 'WiFi Configuration',
    subtitle: 'Connect your device to your WiFi network for automatic synchronization',

    ssidLabel: 'WiFi Network Name (SSID)',
    ssidPlaceholder: 'My WiFi Network',
    passwordLabel: 'WiFi Password',
    passwordPlaceholder: 'Minimum 8 characters',

    showPassword: 'Show password',
    hidePassword: 'Hide password',

    status: {
      testing: 'Testing connection...',
      success: 'Configuration saved successfully',
      connectionSuccess: 'Connection successful',
    },

    buttons: {
      save: 'Save Configuration',
      saving: 'Saving...',
      test: 'Test Connection',
      testing: 'Testing...',
      edit: 'Edit Configuration',
    },

    infoCards: {
      security: {
        title: 'Security',
        text: 'Your WiFi password is transmitted securely and stored encrypted',
      },
      autoSync: {
        title: 'Automatic synchronization',
        text: 'Once connected, your device will automatically sync medications and events',
      },
    },

    tips: {
      title: 'Tips',
      connectedNetwork: 'Make sure you are connected to the WiFi network you want to configure',
      passwordLength: 'The password must be at least 8 characters',
      deviceNearRouter: 'The device must be powered on and near the WiFi router',
    },

    accessibility: {
      announcement: 'Step 4: Configure your device WiFi connection',
      ssidField: 'WiFi network name field',
      ssidHint: 'Enter your WiFi network name',
      passwordField: 'WiFi password field',
      passwordHint: 'Enter your WiFi network password, minimum 8 characters',
      saveButton: 'Save WiFi configuration',
      saveButtonHint: 'Saves the WiFi configuration to the device',
      testButton: 'Test WiFi connection',
      testButtonHint: 'Verifies that the device connects to the WiFi network',
      editButton: 'Edit configuration',
      editButtonHint: 'Modify the WiFi configuration',
    },
  },

  // Preferences Step
  preferencesStep: {
    title: 'Device Preferences',
    subtitle: 'Customize how your device will notify you about your medications',

    alarmMode: {
      title: 'Alarm Mode',
      options: {
        sound: 'Sound',
        vibrate: 'Vibration',
        both: 'Both',
        silent: 'Silent',
      },
    },

    ledIntensity: {
      title: 'LED Intensity',
      value: '{{intensity}}%',
    },

    ledColor: {
      title: 'LED Color',
      description: 'Select the LED indicator color',
      buttonText: 'Open color picker',
      preview: 'LED preview',
    },

    volume: {
      title: 'Volume',
      value: '{{volume}}%',
    },

    buttons: {
      test: 'Test Alarm',
      testing: 'Testing...',
      save: 'Save Preferences',
      saving: 'Saving...',
      saved: 'Preferences Saved',
    },

    status: {
      saved: 'Preferences saved successfully',
      testActivated: 'Test alarm activated',
    },

    infoText: 'You can test the alarm before saving to make sure the settings are to your liking',

    accessibility: {
      announcement: 'Step 5: Configure your device preferences',
      alarmModeRadio: 'Alarm mode: {{mode}}',
      ledIntensitySlider: 'LED intensity slider control',
      volumeSlider: 'Volume slider control',
      colorPickerButton: 'Open color picker',
      colorPickerHint: 'Opens a picker to choose the LED color',
      testButton: 'Test alarm',
      testButtonHint: 'Activates a test alarm with the current settings',
      saveButton: 'Save preferences',
      saveButtonHint: 'Saves the preference settings to the device',
    },
  },

  // Completion Step
  completionStep: {
    title: 'Setup Complete!',
    subtitle: 'Your device is ready to help you manage your medications',

    summary: {
      title: 'Configuration Summary',
      device: 'Device',
      wifi: 'WiFi Network',
      wifiNotConfigured: 'Not configured',
      alarmMode: 'Alarm Mode',
      led: 'LED',
      ledIntensity: '{{intensity}}% intensity',
      volume: 'Volume',
      volumeValue: '{{volume}}%',
    },

    alarmModes: {
      sound: 'Sound Only',
      vibrate: 'Vibration Only',
      both: 'Sound and Vibration',
      silent: 'Silent',
    },

    nextSteps: {
      title: 'Next Steps',
      step1: {
        title: 'Add Medications',
        description: 'Start by adding your medications and schedules',
      },
      step2: {
        title: 'Configure Schedules',
        description: 'Set the schedules for each medication',
      },
      step3: {
        title: 'Receive Reminders',
        description: 'Your device will notify you when it\'s time to take your medications',
      },
    },

    tip: {
      title: 'Tip',
      text: 'You can modify your device settings at any time from the settings menu',
    },

    button: 'Go to Home',

    accessibility: {
      announcement: 'Step 6: Setup completed successfully',
      successAnnouncement: 'Setup complete. Your device is ready to use',
      goHomeButton: 'Go to home',
      goHomeButtonHint: 'Navigate to the patient home screen',
    },
  },

  // Device Provisioning Errors
  deviceErrors: {
    DEVICE_NOT_FOUND: {
      title: 'Device Not Found',
      message: 'We could not find the device with the provided ID',
      action: 'Verify the device ID and try again',
      steps: [
        'Verify that the ID is spelled correctly',
        'Make sure not to include spaces before or after the ID',
        'Check that the ID matches the one on your device',
        'The ID should be on the bottom of the device or on the box',
        'If the problem persists, contact technical support',
      ],
    },
    DEVICE_ALREADY_CLAIMED: {
      title: 'Device Already Registered',
      message: 'This device is already registered to another user',
      action: 'Verify the device ID or contact support',
      steps: [
        'Confirm that the device ID is correct',
        'If you purchased a used device, the previous owner must unlink it first',
        'If you are the legitimate owner, contact technical support with your proof of purchase',
        'Provide the device ID and your account information to support',
      ],
    },
    INVALID_DEVICE_ID: {
      title: 'Invalid ID',
      message: 'The device ID format is not valid',
      action: 'Enter a valid 5-100 character alphanumeric ID',
      steps: [
        'The ID must be between 5 and 100 characters',
        'Only letters, numbers, hyphens (-), and underscores (_) are allowed',
        'Do not include spaces or special characters',
        'Verify that you are copying the complete ID',
        'Valid format example: DEVICE-12345 or DEV_ABC123',
      ],
    },
    WIFI_CONFIG_FAILED: {
      title: 'WiFi Configuration Error',
      message: 'We could not configure the device WiFi connection',
      action: 'Verify the WiFi credentials and try again',
      steps: [
        'Verify that the WiFi network name (SSID) is correct',
        'Make sure the WiFi password is spelled correctly',
        'Confirm that your WiFi network is active and working',
        'The device only supports 2.4 GHz WiFi networks (not 5 GHz)',
        'Verify that your router does not have device restrictions',
        'Try restarting your router and the device',
        'If you use special characters in the password, verify they are compatible',
      ],
    },
    DEVICE_OFFLINE: {
      title: 'Device Offline',
      message: 'The device is not connected or not responding',
      action: 'Verify that the device is powered on and connected',
      steps: [
        'Verify that the device is powered on (LED light on)',
        'Make sure the device has battery or is connected to power',
        'Confirm that the device is within range of your WiFi network',
        'Try restarting the device (power off and on)',
        'Wait 1-2 minutes after powering on the device before continuing',
        'Verify that your WiFi network is working correctly',
        'If the problem persists, try configuring WiFi again',
      ],
    },
    PERMISSION_DENIED: {
      title: 'Permission Denied',
      message: 'You do not have permission to register this device',
      action: 'Verify your account and connection, or contact support',
      steps: [
        'Verify that you have logged in correctly',
        'Make sure you have a stable internet connection',
        'Log out and log back in',
        'Verify that your account is active and has no restrictions',
        'If the problem persists, contact technical support',
      ],
    },
    UNKNOWN: {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred during setup',
      action: 'Try again or contact support',
      steps: [
        'Verify your internet connection',
        'Try closing and reopening the application',
        'Make sure you have the latest version of the application',
        'If the problem persists, contact technical support',
      ],
    },
    retryButton: 'Retry',
    contactSupport: 'Contact Support',
    supportInfo: {
      email: 'support@pillhub.com',
      phone: '+1-800-PILLHUB',
      hours: 'Monday to Friday, 9:00 AM - 6:00 PM',
    },
  },

  // Connection Code Errors
  connectionErrors: {
    CODE_NOT_FOUND: {
      title: 'Code Not Found',
      message: 'We could not find the entered connection code',
      action: 'Verify the code and try again',
      steps: [
        'Verify that the code is spelled correctly',
        'Make sure not to include spaces before or after the code',
        'Codes are case-sensitive',
        'Confirm with the patient that the code is correct',
        'If the code was sent by message, copy and paste it directly',
      ],
    },
    CODE_EXPIRED: {
      title: 'Code Expired',
      message: 'This connection code has expired',
      action: 'Request a new code from the patient',
      steps: [
        'Connection codes expire after 24 hours for security',
        'Contact the patient and ask them to generate a new code',
        'The patient can generate a new code from their device settings',
        'Once you have the new code, enter it here',
      ],
    },
    CODE_ALREADY_USED: {
      title: 'Code Already Used',
      message: 'This connection code has already been used',
      action: 'Request a new code from the patient',
      steps: [
        'Connection codes can only be used once for security',
        'If you already used this code, you should have access to the patient\'s device',
        'Check your patient list to see if you are already connected',
        'If you need to connect again, request a new code from the patient',
        'The patient can generate multiple codes if needed',
      ],
    },
    INVALID_CODE_FORMAT: {
      title: 'Invalid Format',
      message: 'The connection code format is not valid',
      action: 'Enter a valid 6-8 character code',
      steps: [
        'The code must be between 6 and 8 characters',
        'Only uppercase letters and numbers are allowed',
        'Do not include spaces or special characters',
        'Valid format example: ABC123 or XYZ789AB',
        'If you copied the code, make sure not to include extra spaces',
      ],
    },
    DEVICE_NOT_FOUND: {
      title: 'Device Not Found',
      message: 'We could not find the device associated with this code',
      action: 'Contact the patient to verify the device status',
      steps: [
        'The device associated with this code does not exist or was deleted',
        'Contact the patient to confirm their device is registered',
        'The patient should verify their device in settings',
        'If the problem persists, the patient should contact technical support',
      ],
    },
    UNKNOWN: {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred while processing the code',
      action: 'Try again or contact support',
      steps: [
        'Verify your internet connection',
        'Try closing and reopening the application',
        'Make sure you have the latest version of the application',
        'If the problem persists, contact technical support',
      ],
    },
  },

  // Device Connection Screen
  deviceConnection: {
    title: 'Connect Device',
    subtitle: 'Enter the connection code provided by the patient to link their device',

    form: {
      title: 'Connection Code',
      description: 'The code must be 6-8 alphanumeric characters',
      label: 'Code',
      placeholder: 'Ex: ABC123',
      hint: '{{length}}/8 characters',
    },

    validation: {
      required: 'Please enter a connection code',
      tooShort: 'The code must be at least 6 characters',
      tooLong: 'The code cannot be more than 8 characters',
      invalidChars: 'The code can only contain letters and numbers',
      authError: 'Authentication error. Please log in again.',
      invalidOrExpired: 'Invalid or expired code',
      genericError: 'Error validating the code. Please try again.',
    },

    buttons: {
      continue: 'Continue',
      validating: 'Validating...',
      back: '← Back',
    },

    help: {
      title: 'Need help?',
      items: [
        'The patient must generate a code from their application',
        'Codes expire after 24 hours',
        'Each code can only be used once',
      ],
    },

    accessibility: {
      codeField: 'Connection code',
      codeFieldHint: 'Enter the 6-8 character code provided by the patient',
      validateButton: 'Validate code',
      validateButtonHint: 'Validates the connection code and starts the linking process',
      backButton: 'Back',
      backButtonHint: 'Return to the previous screen',
    },
  },
};

export type TranslationKeys = typeof en;

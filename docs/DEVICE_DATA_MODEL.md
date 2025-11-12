# Device Data Model and Pairing Process

This document outlines the data model for the `devices` collection in Firestore and the Realtime Database, as well as the process for pairing a device with a user account.

## Data Model

### Firestore

**`devices` collection:**

*   **`deviceId` (string):** The unique identifier for the device (e.g., "DEVICE-001").
*   **`owner` (string):** The UID of the user who owns the device.
*   **`name` (string):** A user-friendly name for the device (e.g., "Mom's Pillbox").
*   **`medication` (string):** The name of the medication to be dispensed.
*   **`dispenseTime` (string):** The time of day when the medication should be dispensed (e.g., "08:00").
*   **`lastDispensed` (timestamp):** The timestamp of the last time the medication was dispensed.
*   **`status` (string):** The current status of the device (e.g., "online", "offline", "dispensing").

### Realtime Database

**`devices/{deviceId}`:**

*   **`status` (string):** The current status of the device. This will be updated in real-time by the ESP8266.
*   **`dispense` (boolean):** A flag that the React Native app will set to `true` to trigger the dispensing process. The ESP8266 will set this back to `false` once the medication has been dispensed.

## Pairing Process

1.  The user navigates to the "Link Device" screen in the React Native app.
2.  The user enters the unique `deviceId` of their smart pillbox.
3.  The app creates a new document in the `devices` collection in Firestore with the `deviceId` and the user's `uid` as the `owner`.
4.  The ESP8266 is programmed with the same `deviceId`. When it connects to the internet, it will listen for changes to the `dispense` flag in the `devices/{deviceId}` path in the Realtime Database.
5.  When the user presses the "Dispense" button in the app, the app will set the `dispense` flag to `true`.
6.  The ESP8266 will detect the change and trigger the dispensing mechanism.
7.  Once the medication has been dispensed, the ESP8266 will set the `dispense` flag back to `false`.

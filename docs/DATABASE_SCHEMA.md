# Database Schema

## Overview
This document defines the data models for both Firebase Realtime Database (RTDB) and Firestore.

## Firebase Realtime Database (RTDB) Schema
The RTDB is used for real-time data and device state. The following schema is based on the "Digital Shadow" paradigm.

| Path                                    | Write Owner        | Description                                                                                             |
| --------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| `/users/{userID}/profile`               | App                | User profile information (Patient or Caregiver).                                                        |
| `/users/{userID}/caregivers/{caregiverID}` | App                | List of caregiver IDs monitoring this user.                                                            |
| `/users/{userID}/patients/{patientID}`  | App                | List of patient IDs this caregiver monitors.                                                           |
| `/devices/{deviceID}/config`            | App (Desired)      | The DESIRED state. The app writes here to control the device.                                           |
| `/devices/{deviceID}/config/led_mode`   | App                | LED mode (e.g., "PULSE", "STATIC", "OFF").                                                               |
| `/devices/{deviceID}/config/led_color_rgb` | App                | Color array (e.g., `[255, 0, 0]`).                                                                       |
| `/devices/{deviceID}/config/led_intensity` | App                | Brightness value (e.g., 800, range 0-1023 for PWM).                                                     |
| `/devices/{deviceID}/config/alarm_mode` | App                | Alarm mode (e.g., "BUZZER_ONLY", "LED_ONLY", "BOTH").                                                    |
| `/devices/{deviceID}/config/alarms`     | App                | Array of alarm objects (e.g., `[{ "id": "1", "time": "08:00", "compartment": "1" },...]`).               |
| `/devices/{deviceID}/state`             | Hardware (Reported)| The REPORTED state. The ESP8266 writes here to report its status.                                        |
| `/devices/{deviceID}/state/is_online`   | Hardware           | Boolean indicating connection status (set by the hardware).                                             |
| `/devices/{deviceID}/state/last_seen`   | Hardware           | Timestamp of the last time the hardware was online.                                                     |
| `/devices/{deviceID}/state/wifi_signal` | Hardware           | RSSI level (e.g., -60 dBm).                                                                              |
| `/devices/{deviceID}/state/battery_level`| Hardware           | Battery level (e.g., 85%).                                                                               |
| `/devices/{deviceID}/state/current_status`| Hardware           | Current state of the machine (e.g., "IDLE", "ALARM_SOUNDING", "DOSE_TAKEN").                               |
| `/devices/{deviceID}/state/last_dose_taken`| Hardware           | Object that records the last dose event (e.g., `{ "compartment": "1", "timestamp": "..." }`).            |
| `/adherence_logs/{userID}/{YYYY-MM-DD}` | Cloud Function     | Permanent adherence logs, written by the backend.                                                      |
| `/adherence_logs/{userID}/{...}/status` | Cloud Function     | Final status of the dose (e.g., "TAKEN", "MISSED").                                                      |
| `/adherence_logs/{userID}/{...}/confirmation_source` | Cloud Function     | Source of confirmation (e.g., "DEVICE", "MANUAL_APP").                                           |

## Firestore Schema
Firestore is used for metadata and linking.

- **`devices/{deviceID}`**:
  - `metadata`: General information about the device.
  - `linkedUsers`: A map of user UIDs to their roles (e.g., `{"<uid>": "patient"}`).
  - `desiredConfig`: The desired configuration of the device, which is mirrored to the RTDB by a Cloud Function.

- **`deviceLinks/{deviceID}_{uid}`**:
  - A document created for each link between a device and a user.
  - Used for easier querying and auditing of device links.

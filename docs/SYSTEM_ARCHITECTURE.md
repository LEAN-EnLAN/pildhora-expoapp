# System Architecture

## Overview
This document outlines the technical architecture of the Pildhora smart pillbox system. It consolidates information from the project's research, guide, and integration status documents to provide a single source of truth for all architectural decisions.

## Technical Architecture

### Frontend Stack
- **Framework**: React Native 0.72+ with Expo SDK 49+
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation 6.x (separate stacks for user types)
- **State Management**: Redux Toolkit 1.9+ with Redux Persist
- **Styling**: NativeWind 4.x (Tailwind CSS for React Native)
- **UI Components**:
  - React Native Elements 4.x (component library)
  - React Native Paper 5.x (Material Design)
  - React Native Vector Icons 10.x (icon sets)
- **Hardware Integration**: react-native-ble-plx 2.x (BLE connectivity)
- **Notifications**: Expo Notifications 0.20+ (push/local notifications)
- **Charts**: react-native-chart-kit 6.x (adherence visualizations)

### Backend Stack
- **Database**: Google Firestore (for metadata) and Firebase Realtime Database (for real-time device state)
- **Authentication**: Firebase Auth (multi-factor, social logins)
- **Serverless Functions**: Firebase Cloud Functions (Node.js 18)
- **AI/ML**: Google Vertex AI (Gemini 1.5 Pro for reports)
- **Analytics**: Firebase Analytics + Google Analytics 4
- **Storage**: Firebase Cloud Storage (user photos, reports)
- **Hosting**: Firebase Hosting (web admin panel if needed)

## Digital Shadow Paradigm
The core of the system is the "Digital Shadow" paradigm, which uses Firebase Realtime Database (RTDB) as a single source of truth for device state. This allows for robust, real-time, and bidirectional communication between the mobile app and the ESP8266 hardware.

Each physical pillbox has a unique document (node) in the RTDB, divided into two main JSON objects:
- **config**: The desired state of the device. The mobile app writes to this object to send commands (e.g., `led_intensity`).
- **state**: The reported state of the device. The ESP8266 hardware writes to this object to report its current state (e.g., `battery_level`).

This decoupled architecture ensures that the hardware and software can communicate asynchronously, and it allows the system to handle intermittent connectivity gracefully.

## Hybrid Data Model: RTDB and Firestore
The system uses a hybrid data model that leverages both Firebase Realtime Database (RTDB) and Firestore.

- **Realtime Database (RTDB)**: Used for real-time data and device state.
  - `devices/{deviceID}/state`: The current status of the device (e.g., `current_status`, `battery_level`).
  - `devices/{deviceID}/config`: The desired configuration of the device (e.g., `led_intensity`, `alarm_mode`).
  - `users/{uid}/devices/{deviceID}`: A client-side link that triggers backend mirroring.

- **Firestore**: Used for metadata and linking.
  - `devices/{deviceID}`: Metadata and a `linkedUsers` map of UID to role.
  - `deviceLinks/{deviceID}_{uid}`: One document per link for easier queries and audits.

## Cloud Functions
Serverless Cloud Functions are used to implement business logic and handle events in the system.

- **onUserDeviceLinked**: An RTDB trigger that fires when a new device is linked to a user. It sets up the necessary Firestore documents for the link.
- **onUserDeviceUnlinked**: An RTDB trigger that fires when a device is unlinked from a user. It cleans up the corresponding Firestore documents.
- **onDesiredConfigUpdated**: A Firestore trigger that fires when the `desiredConfig` of a device is updated. It mirrors the new configuration to the RTDB.
- **Missed Dose Flow**: A set of functions that use RTDB triggers and Cloud Tasks to detect missed doses and send notifications to caregivers.

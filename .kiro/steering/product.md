# Product Overview

Pildhora is a smart medication management system connecting elderly patients with healthcare caregivers through IoT-enabled pillboxes.

## Core Features

**Patient App**
- Simple medication reminders with one-tap confirmation
- Real-time pillbox connectivity status
- Accessible UI optimized for elderly users
- Device provisioning and WiFi configuration
- Medication inventory tracking

**Caregiver App**
- Multi-patient dashboard with real-time monitoring
- Full medication CRUD operations
- Event registry for medication changes and adherence
- Task scheduling and patient management
- Device linking via connection codes
- Critical event notifications

## User Roles

- **Patient**: Manages own medications, provisions device, can enable autonomous mode (data not shared)
- **Caregiver**: Manages medications for multiple patients, monitors adherence, receives alerts

## Hardware Integration

- ESP8266-based smart pillbox with BLE connectivity
- Real-time device state tracking (online status, battery, alarm status)
- Configurable LED colors, alarm modes, and volume
- WiFi-enabled for cloud synchronization

## Key Workflows

1. **Device Provisioning**: Patient sets up device with WiFi and links to account
2. **Caregiver Linking**: Patient generates connection code, caregiver enters code to link
3. **Medication Management**: Caregiver creates/edits medications with schedules and inventory
4. **Dose Tracking**: Device triggers alarms, patient confirms doses, events sync to caregiver
5. **Autonomous Mode**: Patient can disable caregiver access while maintaining app functionality

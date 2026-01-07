# Requirements Document

## Introduction

Esta funcionalidad implementa un sistema de demostración para el pastillero con horarios fijos predefinidos. Incluye una estructura de datos compatible con Firebase Realtime Database, componentes visuales para mostrar los horarios, un hook para escuchar el estado en tiempo real, y la integración completa en las vistas de paciente y cuidador.

## Glossary

- **Pastillero**: Dispositivo físico ESP8266 que dispensa medicación según horarios programados (hardware\esp8266_firmware\esp8266_firmware.ino)
- **RTDB**: Firebase Realtime Database, base de datos en tiempo real para sincronización de estado del dispositivo (EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://pildhora-app2-default-rtdb.firebaseio.com; EXPO_PUBLIC_FIREBASE_DEVICE_DATABASE_URL=https://devices-m1947.firebaseio.com)
- **Turno**: Período del día para dispensar medicación (mañana=0, mediodía=1, tarde=2, noche=3)
- **Día**: Índice numérico del día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
- **StatusCard**: Componente visual que muestra el estado actual del pastillero

## Requirements

### Requirement 1: Estructura de Datos del Pastillero

**User Story:** As a developer, I want a well-defined data structure for the pillbox demo schedules, so that I can store and retrieve schedule data consistently from Firebase RTDB.

#### Acceptance Criteria

1. THE PastilleroSchedule data structure SHALL define a schedule entry with properties: `turno` (number 0-3) and `hora` (string in HH:mm format).
2. THE PastilleroData constant SHALL contain exactly 7 schedule entries indexed by day number (0-6).
3. WHEN the uploadPastilleroData function is called, THE system SHALL write the schedule data to Firebase RTDB at path "/pastillero".
4. THE DEMO_PASTILLERO_DATA constant SHALL be exported for use in other components.
5. THE uploadPastilleroData function SHALL return a Promise that resolves on success or rejects with an error message.

### Requirement 2: Componente Visual de Horarios

**User Story:** As a user, I want to see the pillbox schedules displayed in a visually appealing list, so that I can quickly understand when medications are scheduled.

#### Acceptance Criteria

1. THE PastilleroScheduleList component SHALL display all 7 days of the week with their corresponding schedules using FlatList or ScrollView.
2. WHEN rendering a schedule item, THE component SHALL display the day name, shift name (mañana/mediodía/tarde/noche), and time in HH:mm format.
3. THE component SHALL apply color coding based on shift: yellow for mañana (turno=0), orange for mediodía (turno=1), blue for tarde (turno=2), purple for noche (turno=3).
4. WHEN the user taps the upload button, THE component SHALL call uploadPastilleroData and display a success or error alert.
5. THE component SHALL use a card-style design consistent with the existing UI design system.

### Requirement 3: Hook de Estado en Tiempo Real

**User Story:** As a developer, I want a custom hook to listen to the pillbox status in real-time, so that I can display live device information in the UI.

#### Acceptance Criteria

1. THE usePastilleroStatus hook SHALL listen to Firebase RTDB paths "/pastillero/ultimo_dispense" and "/pastillero/online".
2. THE hook SHALL return an object with properties: `ultimoDispense` (number timestamp), `online` (boolean), and `loading` (boolean).
3. WHILE the hook is mounted, THE system SHALL maintain an active RTDB listener using onValue.
4. WHEN the component unmounts, THE hook SHALL clean up the RTDB listener to prevent memory leaks.
5. IF the RTDB connection fails, THEN THE hook SHALL set loading to false and return null values for ultimoDispense and online.

### Requirement 4: Componente StatusCard

**User Story:** As a user, I want to see the current status of my pillbox at a glance, so that I can know if it's connected and when it last dispensed medication.

#### Acceptance Criteria

1. THE StatusCard component SHALL display a green indicator when online is true and a red indicator when online is false.
2. THE StatusCard component SHALL display the last dispense time in relative format (e.g., "hace 5 minutos").
3. THE StatusCard component SHALL calculate and display the next scheduled dose for today based on the horarios prop.
4. IF no doses are scheduled for today, THEN THE StatusCard SHALL display "Sin dosis programada para hoy".
5. THE StatusCard component SHALL use icons consistent with the existing design system.

### Requirement 5: Integración en Vistas de Paciente y Cuidador

**User Story:** As a patient or caregiver, I want to access the pillbox schedule and status from my dashboard, so that I can monitor medication schedules easily.

#### Acceptance Criteria

1. THE patient home screen SHALL include the StatusCard component showing real-time pillbox status.
2. THE caregiver dashboard SHALL include the StatusCard component for each linked patient with a device.
3. WHEN navigating to a dedicated schedule view, THE system SHALL display the PastilleroScheduleList component.
4. THE integration SHALL follow existing navigation patterns using Expo Router.
5. THE components SHALL be accessible and follow WCAG 2.1 AA compliance guidelines.

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User account interface
 * 
 * Represents a user account in the system. Users can be either patients
 * or caregivers. Patients manage their own medications, while caregivers
 * can manage medications for multiple patients through device linking.
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: 'user-123',
 *   email: 'john@example.com',
 *   role: 'patient',
 *   name: 'John Doe',
 *   createdAt: new Date(),
 *   onboardingComplete: false,
 *   onboardingStep: 'device_provisioning',
 *   patients: [] // Only for caregivers
 * };
 * ```
 */
export interface User {
  /** Unique identifier for the user document in Firestore */
  id: string;
  /** Email address used for authentication */
  email: string;
  /** User role determining access permissions and UI */
  role: 'patient' | 'caregiver';
  /** Full name of the user */
  name: string;
  /** Timestamp when the account was created. Can be Date object or ISO string after Firestore conversion */
  createdAt: Date | string;
  /** Array of patient IDs managed by this caregiver (only for caregiver role) */
  patients?: string[];
  /** Whether the user has completed the onboarding process */
  onboardingComplete: boolean;
  /** Current onboarding step (only present if onboarding is not complete) */
  onboardingStep?: 'device_provisioning' | 'device_connection' | 'complete';
  /** Device ID linked to this user (only for patients who have provisioned a device) */
  deviceId?: string;
  /** Whether the patient is in autonomous mode (data not shared with caregivers) */
  autonomousMode?: boolean;
}

// ============================================================================
// MEDICATION TYPES
// ============================================================================

/**
 * Medication interface
 * 
 * Represents a medication with dosage, schedule, and inventory tracking.
 * Supports both new separated dose/unit fields and legacy dosage field
 * for backward compatibility.
 * 
 * @example
 * ```typescript
 * const medication: Medication = {
 *   id: 'med-123',
 *   name: 'Aspirin',
 *   doseValue: '500',
 *   doseUnit: 'mg',
 *   quantityType: 'tablets',
 *   frequency: 'daily',
 *   times: ['08:00', '20:00'],
 *   patientId: 'patient-456',
 *   caregiverId: 'caregiver-789',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   emoji: '💊',
 *   trackInventory: true,
 *   currentQuantity: 30,
 *   initialQuantity: 60,
 *   lowQuantityThreshold: 10
 * };
 * ```
 */
export interface Medication {
  /** Unique identifier for the medication document in Firestore */
  id: string;
  /** Name of the medication */
  name: string;
  /** Numeric dose value (e.g., "500", "10", "0.5") - new field for separated dose */
  doseValue?: string;
  /** Unit of measurement (e.g., "mg", "ml", "g", "mcg") - new field for separated dose */
  doseUnit?: string;
  /** Form factor (e.g., "tablets", "capsules", "liquid") - new field for separated quantity */
  quantityType?: string;
  /** Flag indicating if quantityType is a custom user-defined value */
  isCustomQuantityType?: boolean;
  /** Legacy combined dosage field for backward compatibility (e.g., "500mg") */
  dosage?: string;
  /** Frequency of medication (e.g., "daily", "twice daily", "as needed") */
  frequency: string;
  /** Array of scheduled times in HH:mm format (e.g., ["08:00", "20:00"]) */
  times: string[];
  /** ID of the patient this medication belongs to */
  patientId: string;
  /** ID of the caregiver who manages this medication */
  caregiverId: string;
  /** Timestamp when the medication was created. Can be Date object or ISO string after Firestore conversion */
  createdAt: Date | string;
  /** Timestamp when the medication was last updated. Can be Date object or ISO string after Firestore conversion */
  updatedAt: Date | string;
  /** Emoji icon for visual identification in the UI */
  emoji?: string;
  /** Platform-specific alarm identifiers for native notifications */
  nativeAlarmIds?: string[];
  /** Whether inventory tracking is enabled for this medication */
  trackInventory: boolean;
  /** Current quantity remaining */
  currentQuantity?: number;
  /** Initial quantity when medication was added or last refilled */
  initialQuantity?: number;
  /** Threshold for low quantity alerts */
  lowQuantityThreshold?: number;
  /** Timestamp of the last refill. Can be Date object or ISO string after Firestore conversion */
  lastRefillDate?: Date | string;
}

/**
 * Dose units enumeration with Spanish labels
 * 
 * Defines all available dose units for medication dosage.
 * Used in the medication wizard dosage step for unit selection.
 * 
 * @example
 * ```typescript
 * const selectedUnit = DOSE_UNITS.find(u => u.id === 'mg');
 * console.log(selectedUnit?.label); // "mg (miligramos)"
 * ```
 */
export const DOSE_UNITS = [
  { id: 'mg', label: 'mg (miligramos)' },
  { id: 'g', label: 'g (gramos)' },
  { id: 'mcg', label: 'mcg (microgramos)' },
  { id: 'ml', label: 'ml (mililitros)' },
  { id: 'l', label: 'l (litros)' },
  { id: 'units', label: 'unidades' },
  { id: 'drops', label: 'gotas' },
  { id: 'sprays', label: 'sprays' },
  { id: 'puffs', label: 'inhalaciones' },
  { id: 'inhalations', label: 'inhalaciones' },
  { id: 'applications', label: 'aplicaciones' },
  { id: 'custom', label: 'Unidad personalizada' }
] as const;

/**
 * Type for dose unit ID
 * Extracted from DOSE_UNITS constant for type safety
 */
export type DoseUnitId = typeof DOSE_UNITS[number]['id'];

/**
 * Type for dose unit object
 * Includes id and label properties
 */
export type DoseUnit = typeof DOSE_UNITS[number];

/**
 * Quantity types enumeration with Spanish labels and icons
 * 
 * Defines all available medication form factors (tablets, liquid, etc.).
 * Used in the medication wizard for selecting medication type.
 * Each type includes an associated Ionicon name for visual representation.
 * 
 * @example
 * ```typescript
 * const selectedType = QUANTITY_TYPES.find(t => t.id === 'tablets');
 * console.log(selectedType?.label); // "Tabletas"
 * console.log(selectedType?.icon); // "medkit-outline"
 * ```
 */
export const QUANTITY_TYPES = [
  { id: 'tablets', label: 'Tabletas', icon: 'medkit-outline' },
  { id: 'capsules', label: 'Cápsulas', icon: 'medkit-outline' },
  { id: 'liquid', label: 'Líquido', icon: 'flask-outline' },
  { id: 'cream', label: 'Crema', icon: 'color-wand-outline' },
  { id: 'inhaler', label: 'Inhalador', icon: 'wind-outline' },
  { id: 'drops', label: 'Gotas', icon: 'water-outline' },
  { id: 'spray', label: 'Spray', icon: 'snow-outline' },
  { id: 'other', label: 'Otro', icon: 'help-circle-outline' }
] as const;

/**
 * Type for quantity type ID
 * Extracted from QUANTITY_TYPES constant for type safety
 */
export type QuantityTypeId = typeof QUANTITY_TYPES[number]['id'];

/**
 * Type for quantity type object
 * Includes id, label, and icon properties
 */
export type QuantityType = typeof QUANTITY_TYPES[number];

// ============================================================================
// TASK TYPES
// ============================================================================

/**
 * Task interface
 * 
 * Represents a caregiver to-do item. Tasks are scoped to individual
 * caregiver accounts and provide a simple note-taking feature.
 * 
 * @example
 * ```typescript
 * const task: Task = {
 *   id: 'task-123',
 *   title: 'Call pharmacy',
 *   description: 'Refill prescription for patient John',
 *   patientId: 'patient-456',
 *   caregiverId: 'caregiver-789',
 *   completed: false,
 *   dueDate: new Date('2024-12-31'),
 *   createdAt: new Date()
 * };
 * ```
 */
export interface Task {
  /** Unique identifier for the task document in Firestore */
  id: string;
  /** Task title or summary */
  title: string;
  /** Detailed task description */
  description: string;
  /** ID of the patient this task relates to */
  patientId: string;
  /** ID of the caregiver who owns this task */
  caregiverId: string;
  /** Whether the task has been completed */
  completed: boolean;
  /** Due date for the task. Can be Date object or ISO string after Firestore conversion */
  dueDate: Date | string;
  /** Timestamp when the task was created. Can be Date object or ISO string after Firestore conversion */
  createdAt: Date | string;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

/**
 * Report interface
 * 
 * Represents a generated report file (PDF, image, etc.) associated with
 * a patient. Reports can be medication adherence reports, medical documents,
 * or other patient-related files.
 * 
 * @example
 * ```typescript
 * const report: Report = {
 *   id: 'report-123',
 *   name: 'Monthly Adherence Report',
 *   fileUrl: 'https://storage.example.com/reports/report-123.pdf',
 *   fileType: 'pdf',
 *   patientId: 'patient-456',
 *   caregiverId: 'caregiver-789',
 *   createdAt: new Date()
 * };
 * ```
 */
export interface Report {
  /** Unique identifier for the report document in Firestore */
  id: string;
  /** Human-readable name of the report */
  name: string;
  /** URL to the report file in cloud storage */
  fileUrl: string;
  /** MIME type or file extension (e.g., 'pdf', 'image/jpeg') */
  fileType: string;
  /** ID of the patient this report relates to */
  patientId: string;
  /** ID of the caregiver who generated or uploaded this report */
  caregiverId: string;
  /** Timestamp when the report was created. Can be Date object or ISO string after Firestore conversion */
  createdAt: Date | string;
}

// ============================================================================
// AUDIT LOG TYPES (DEPRECATED - Use MedicationEvent instead)
// ============================================================================

/**
 * AuditLog interface (DEPRECATED)
 * 
 * Legacy audit log interface. New implementations should use the
 * MedicationEvent interface instead, which provides more structured
 * event tracking with type safety and change history.
 * 
 * @deprecated Use MedicationEvent interface for new event tracking
 * 
 * @example
 * ```typescript
 * // Old approach (deprecated)
 * const auditLog: AuditLog = {
 *   id: 'log-123',
 *   action: "Medication 'Aspirin' taken by John",
 *   timestamp: new Date(),
 *   userId: 'patient-456',
 *   caregiverId: 'caregiver-789'
 * };
 * 
 * // New approach (recommended)
 * const event: MedicationEvent = {
 *   id: 'event-123',
 *   eventType: 'created',
 *   medicationId: 'med-456',
 *   medicationName: 'Aspirin',
 *   // ... other fields
 * };
 * ```
 */
export interface AuditLog {
  /** Unique identifier for the audit log entry */
  id: string;
  /** Human-readable description of the action (e.g., "Medication 'Aspirin' taken by John") */
  action: string;
  /** Timestamp when the action occurred. Can be Date object or ISO string after Firestore conversion */
  timestamp: Date | string;
  /** ID of the user who performed the action (patient or caregiver) */
  userId: string;
  /** ID of the caregiver to scope the logs (for filtering) */
  caregiverId: string;
}

// ============================================================================
// DEVICE TYPES
// ============================================================================

/**
 * PillboxDevice interface
 * 
 * Represents a physical pillbox device connected via BLE (Bluetooth Low Energy).
 * Tracks connection status, battery level, and last seen timestamp.
 * 
 * @example
 * ```typescript
 * const device: PillboxDevice = {
 *   id: 'DEVICE-001',
 *   name: 'John\'s Pillbox',
 *   connected: true,
 *   batteryLevel: 85,
 *   lastSeen: new Date()
 * };
 * ```
 */
export interface PillboxDevice {
  /** Unique device identifier (typically the deviceID from hardware) */
  id: string;
  /** Human-readable device name */
  name: string;
  /** Whether the device is currently connected via BLE */
  connected: boolean;
  /** Battery level percentage (0-100) */
  batteryLevel?: number;
  /** Timestamp when the device was last seen. Can be Date object or ISO string after Firestore conversion */
  lastSeen: Date | string;
}

// ============================================================================
// MEDICATION INTAKE TYPES
// ============================================================================

/**
 * IntakeStatus enum
 * 
 * Defines the possible states of a medication dose intake.
 * Used to track whether a scheduled dose is pending, taken, or missed.
 * 
 * @example
 * ```typescript
 * const status: IntakeStatus = IntakeStatus.TAKEN;
 * if (status === IntakeStatus.MISSED) {
 *   // Send reminder notification
 * }
 * ```
 */
export enum IntakeStatus {
  /** Dose is scheduled but not yet taken */
  PENDING = 'pending',
  /** Dose has been taken */
  TAKEN = 'taken',
  /** Dose was not taken at the scheduled time */
  MISSED = 'missed',
  /** Dose was intentionally skipped by the patient */
  SKIPPED = 'skipped'
}

/**
 * IntakeRecord interface
 * 
 * Represents a record of a medication dose intake. Tracks whether a scheduled
 * dose was taken, missed, or is still pending. Includes duplicate prevention
 * via completion tokens and tracks the source (manual vs pillbox).
 * 
 * @example
 * ```typescript
 * const intake: IntakeRecord = {
 *   id: 'intake-123',
 *   medicationName: 'Aspirin',
 *   dosage: '500mg',
 *   scheduledTime: new Date('2024-01-15T08:00:00'),
 *   status: IntakeStatus.TAKEN,
 *   patientId: 'patient-456',
 *   takenAt: new Date('2024-01-15T08:05:00'),
 *   medicationId: 'med-789',
 *   completionToken: 'med-789-1705305600000',
 *   deviceSource: 'manual',
 *   caregiverId: 'caregiver-012'
 * };
 * ```
 */
export interface IntakeRecord {
  /** Unique identifier for the intake record */
  id: string;
  /** Name of the medication */
  medicationName: string;
  /** Dosage amount (e.g., "500mg", "2 tablets") */
  dosage: string;
  /** Scheduled time for this dose. Can be Date object or ISO string after Firestore conversion */
  scheduledTime: Date | string;
  /** Current status of the dose (pending, taken, missed, or skipped) */
  status: IntakeStatus;
  /** ID of the patient this intake record belongs to */
  patientId: string;
  /** Actual time when the dose was taken. Can be Date object or ISO string after Firestore conversion */
  takenAt?: Date | string;
  /** Optional reference to the medication document for enrichment */
  medicationId?: string;
  /** Unique token for duplicate prevention: `${medicationId}-${scheduledTime.getTime()}` */
  completionToken?: string;
  /** Source of the intake recording (manual entry or pillbox device) */
  deviceSource?: 'manual' | 'pillbox';
  /** ID of the caregiver for scoping (if managed by caregiver) */
  caregiverId?: string;
  /** Device ID that recorded this intake */
  deviceId?: string;
  /** Whether this intake was triggered by a topo alarm */
  topoTriggered?: boolean;
  /** Timestamp when topo alarm was triggered. Can be Date object or ISO string */
  topoTriggeredAt?: Date | string;
  /** Timestamp when the intake was completed (taken or missed). Can be Date object or ISO string */
  completedAt?: Date | string;
  /** How the intake was completed (app button, device button, timeout, etc.) */
  completedBy?: 'app' | 'device_button' | 'timeout' | 'manual';
  /** Whether this was recorded in autonomous mode */
  isAutonomous?: boolean;
  /** Timestamp when the record was created. Can be Date object or ISO string */
  createdAt?: Date | string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * ApiResponse interface
 * 
 * Generic wrapper for API responses. Provides consistent structure for
 * success/error handling across all API calls.
 * 
 * @template T - Type of the data payload
 * 
 * @example
 * ```typescript
 * // Success response
 * const response: ApiResponse<Medication> = {
 *   success: true,
 *   data: medication
 * };
 * 
 * // Error response
 * const errorResponse: ApiResponse<Medication> = {
 *   success: false,
 *   error: 'Medication not found'
 * };
 * ```
 */
export interface ApiResponse<T> {
  /** Whether the API call was successful */
  success: boolean;
  /** Response data (only present on success) */
  data?: T;
  /** Error message (only present on failure) */
  error?: string;
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

/**
 * Patient interface
 * 
 * Represents a patient in the system. Patients can be managed by caregivers
 * through device linking. The caregiverId field is essential for caregiver
 * dashboard queries to fetch only the patients assigned to a specific caregiver.
 * 
 * @example
 * ```typescript
 * const patient: Patient = {
 *   id: 'patient-123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   deviceId: 'DEVICE-001',
 *   caregiverId: 'caregiver-456',
 *   createdAt: new Date(),
 *   adherence: 85,
 *   lastTaken: '2 hours ago'
 * };
 * ```
 */
export interface Patient {
  /** Unique identifier for the patient document in Firestore */
  id: string;
  /** Full name of the patient */
  name: string;
  /** Email address of the patient */
  email: string;
  /** Optional ID of the linked pillbox device */
  deviceId?: string;
  /** 
   * Required field: ID of the caregiver user assigned to this patient.
   * This field is essential for the caregiver dashboard query to work properly.
   * It links the patient to their assigned caregiver and is used in Firestore queries
   * with where('caregiverId', '==', user.id) to fetch only the patients assigned
   * to the currently logged-in caregiver.
   */
  caregiverId: string;
  /** Timestamp when the patient record was created. Can be Date object or ISO string after Firestore conversion */
  createdAt: Date | string;
  /** Optional medication adherence percentage (0-100) */
  adherence?: number;
  /** Optional human-readable string indicating when the last medication dose was taken */
  lastTaken?: string;
}

/**
 * DeviceState interface
 * 
 * Represents the real-time state of a pillbox device from Firebase Realtime Database.
 * Updated by the device hardware and monitored by the application for connectivity,
 * battery level, and current operational status.
 * 
 * @example
 * ```typescript
 * const deviceState: DeviceState = {
 *   is_online: true,
 *   battery_level: 85,
 *   current_status: 'PENDING',
 *   last_event_at: Date.now(),
 *   last_seen: Date.now(),
 *   time_synced: true
 * };
 * ```
 */
export interface DeviceState {
  /** Whether the device is currently online and connected */
  is_online: boolean;
  /** Battery level percentage (0-100) */
  battery_level: number;
  /** Current operational status of the device */
  current_status: 'PENDING' | 'ALARM_SOUNDING' | 'DOSE_TAKEN' | 'DOSE_MISSED' | 'idle' | 'dispensing' | 'alarm_active' | 'error';
  /** Timestamp of the last event (Unix timestamp in milliseconds) */
  last_event_at?: number;
  /** Timestamp when the device was last seen (Unix timestamp in milliseconds) */
  last_seen?: number;
  /** Whether the device time is synchronized with the server */
  time_synced?: boolean;
  /** WiFi signal strength in dBm (e.g., -50 to -90) */
  wifi_signal_strength?: number;
  /** Alarm mode configuration ('off' | 'sound' | 'led' | 'both') */
  alarm_mode?: 'off' | 'sound' | 'led' | 'both';
  /** LED intensity level (0-1023) */
  led_intensity?: number;
  /** LED color RGB values */
  led_color_rgb?: [number, number, number];
}

/**
 * DoseSegment interface
 * 
 * Represents a time segment for the DoseRing visualization component.
 * Used to display medication adherence in a circular timeline format,
 * showing which doses were taken, missed, or are pending.
 * 
 * @example
 * ```typescript
 * const segment: DoseSegment = {
 *   startHour: 8,
 *   endHour: 12,
 *   status: 'DOSE_TAKEN'
 * };
 * ```
 */
export interface DoseSegment {
  /** Starting hour of the segment (0-23) */
  startHour: number;
  /** Ending hour of the segment (0-23) */
  endHour: number;
  /** Status of doses in this time segment */
  status: 'PENDING' | 'DOSE_TAKEN' | 'DOSE_MISSED';
}

/**
 * PatientWithDevice interface
 * 
 * Extends the Patient interface with real-time device state information.
 * Used in dashboard views to display patient information alongside their
 * device connectivity status and dose adherence visualization.
 * 
 * @example
 * ```typescript
 * const patientWithDevice: PatientWithDevice = {
 *   id: 'patient-123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   caregiverId: 'caregiver-456',
 *   deviceId: 'DEVICE-001',
 *   createdAt: new Date(),
 *   deviceState: {
 *     is_online: true,
 *     battery_level: 85,
 *     current_status: 'PENDING'
 *   },
 *   doseSegments: [
 *     { startHour: 8, endHour: 12, status: 'DOSE_TAKEN' },
 *     { startHour: 12, endHour: 20, status: 'PENDING' }
 *   ]
 * };
 * ```
 */
export interface PatientWithDevice extends Patient {
  /** Real-time device state from Firebase RTDB */
  deviceState?: DeviceState;
  /** Optional dose segments for DoseRing visualization */
  doseSegments?: DoseSegment[];
}

// ============================================================================
// DEVICE CONFIGURATION TYPES
// ============================================================================

/**
 * DeviceConfig interface
 * 
 * Represents the configuration settings for a pillbox device.
 * Includes alarm mode, LED settings, and sync status. Configuration
 * is stored in Firestore and mirrored to RTDB via Cloud Functions.
 * 
 * @example
 * ```typescript
 * const config: DeviceConfig = {
 *   deviceId: 'DEVICE-001',
 *   alarmMode: 'both',
 *   ledIntensity: 512,
 *   ledColor: { r: 255, g: 0, b: 0 },
 *   lastUpdated: new Date(),
 *   syncStatus: 'synced'
 * };
 * ```
 */
export interface DeviceConfig {
  /** Device identifier */
  deviceId: string;
  /** Alarm notification mode */
  alarmMode: 'off' | 'sound' | 'led' | 'both';
  /** LED brightness intensity (0-1023) */
  ledIntensity: number;
  /** LED color in RGB format */
  ledColor: {
    /** Red component (0-255) */
    r: number;
    /** Green component (0-255) */
    g: number;
    /** Blue component (0-255) */
    b: number;
  };
  /** Timestamp when configuration was last updated. Can be Date object or ISO string after Firestore conversion */
  lastUpdated: Date | string;
  /** Synchronization status with device hardware */
  syncStatus?: 'synced' | 'pending' | 'error';
}

/**
 * Device interface
 * 
 * Represents a physical medication dispensing device in Firestore.
 * Each device belongs to exactly one patient (primaryPatientId) and can
 * be linked to multiple caregivers through deviceLink documents.
 * 
 * The device document stores provisioning status, configuration, and metadata.
 * Real-time device state (online status, battery, etc.) is stored in RTDB.
 * 
 * @example
 * ```typescript
 * const device: Device = {
 *   id: 'DEVICE-001',
 *   primaryPatientId: 'patient-123',
 *   provisioningStatus: 'active',
 *   provisionedAt: new Date(),
 *   provisionedBy: 'patient-123',
 *   wifiConfigured: true,
 *   wifiSSID: 'HomeNetwork',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   desiredConfig: {
 *     alarmMode: 'both',
 *     ledIntensity: 75,
 *     ledColor: '#3B82F6',
 *     volume: 75
 *   }
 * };
 * ```
 */
export interface Device {
  /** Unique device identifier (matches hardware device ID) */
  id: string;
  /** ID of the patient who owns this device */
  primaryPatientId: string;
  
  /** Desired device configuration (written by app, read by device) */
  desiredConfig: {
    /** Alarm notification mode */
    alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';
    /** LED brightness intensity (0-100) */
    ledIntensity: number;
    /** LED color as hex string (e.g., '#3B82F6') */
    ledColor: string;
    /** Volume level (0-100) */
    volume: number;
  };
  /** Current device configuration (reported by device) */
  currentConfig?: {
    /** Alarm notification mode */
    alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';
    /** LED brightness intensity (0-100) */
    ledIntensity: number;
    /** LED color as hex string */
    ledColor: string;
    /** Volume level (0-100) */
    volume: number;
  };
  
  /** Current provisioning status of the device */
  provisioningStatus: 'pending' | 'active' | 'inactive';
  /** Timestamp when device was provisioned. Can be Date object or ISO string after Firestore conversion */
  provisionedAt?: Date | string;
  /** ID of the user who provisioned the device (typically the patient) */
  provisionedBy: string;
  
  /** Whether WiFi has been configured on the device */
  wifiConfigured: boolean;
  /** WiFi network SSID (stored for reference, password not stored) */
  wifiSSID?: string;
  
  /** Device firmware version (reported by device) */
  firmwareVersion?: string;
  /** Timestamp when device was last seen online. Can be Date object or ISO string after Firestore conversion */
  lastSeen?: Date | string;
  /** Timestamp when device document was created. Can be Date object or ISO string after Firestore conversion */
  createdAt: Date | string;
  /** Timestamp when device document was last updated. Can be Date object or ISO string after Firestore conversion */
  updatedAt: Date | string;
}

// ============================================================================
// NOTIFICATION PREFERENCES TYPES
// ============================================================================

/**
 * NotificationPreferences interface
 * 
 * Represents user notification preferences including enabled status,
 * permission status, and notification modality hierarchy.
 * 
 * @example
 * ```typescript
 * const prefs: NotificationPreferences = {
 *   userId: 'user-123',
 *   enabled: true,
 *   permissionStatus: 'granted',
 *   hierarchy: ['push', 'email', 'sms'],
 *   customModalities: ['slack'],
 *   lastUpdated: new Date()
 * };
 * ```
 */
export interface NotificationPreferences {
  /** User ID these preferences belong to */
  userId: string;
  /** Whether notifications are enabled */
  enabled: boolean;
  /** System permission status for notifications */
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  /** Ordered list of notification modalities (e.g., ['push', 'email', 'sms']) */
  hierarchy: string[];
  /** Custom notification modalities added by user */
  customModalities: string[];
  /** Timestamp when preferences were last updated. Can be Date object or ISO string after Firestore conversion */
  lastUpdated: Date | string;
}

// ============================================================================
// MEDICATION EVENT TYPES
// ============================================================================

/**
 * MedicationEventType
 * 
 * Defines the types of medication lifecycle events that can occur.
 * Used for tracking medication changes and notifying caregivers.
 * 
 * @example
 * ```typescript
 * const eventType: MedicationEventType = 'created';
 * ```
 */
export type MedicationEventType = 'created' | 'updated' | 'deleted';

/**
 * EventSyncStatus
 * 
 * Defines the synchronization status of an event with the caregiver
 * notification system.
 * 
 * @example
 * ```typescript
 * const syncStatus: EventSyncStatus = 'delivered';
 * ```
 */
export type EventSyncStatus = 'pending' | 'delivered' | 'failed';

/**
 * MedicationEventChange interface
 * 
 * Represents a single field change in a medication update event.
 * Tracks the field name, old value, and new value for audit purposes.
 * 
 * @example
 * ```typescript
 * const change: MedicationEventChange = {
 *   field: 'doseValue',
 *   oldValue: '500',
 *   newValue: '1000'
 * };
 * ```
 */
export interface MedicationEventChange {
  /** Name of the field that changed */
  field: string;
  /** Previous value before the change */
  oldValue: any;
  /** New value after the change */
  newValue: any;
}

/**
 * MedicationEvent interface
 * 
 * Represents a medication lifecycle event (created, updated, deleted).
 * Used for the caregiver notification system and event registry.
 * Includes a snapshot of medication data and change tracking for updates.
 * 
 * @example
 * ```typescript
 * const event: MedicationEvent = {
 *   id: 'event-123',
 *   eventType: 'updated',
 *   medicationId: 'med-456',
 *   medicationName: 'Aspirin',
 *   medicationData: { doseValue: '1000', doseUnit: 'mg' },
 *   patientId: 'patient-789',
 *   patientName: 'John Doe',
 *   caregiverId: 'caregiver-012',
 *   timestamp: new Date(),
 *   syncStatus: 'delivered',
 *   changes: [
 *     { field: 'doseValue', oldValue: '500', newValue: '1000' }
 *   ]
 * };
 * ```
 */
export interface MedicationEvent {
  /** Unique identifier for the event */
  id: string;
  /** Type of medication event */
  eventType: MedicationEventType;
  /** ID of the medication this event relates to */
  medicationId: string;
  /** Name of the medication */
  medicationName: string;
  /** Snapshot of medication data at the time of the event */
  medicationData: Partial<Medication>;
  /** ID of the patient this medication belongs to */
  patientId: string;
  /** Name of the patient */
  patientName: string;
  /** ID of the caregiver managing this medication */
  caregiverId: string;
  /** Timestamp when the event occurred. Can be Date object or ISO string after Firestore conversion */
  timestamp: Date | string;
  /** Synchronization status with caregiver notification system */
  syncStatus: EventSyncStatus;
  /** Array of field changes (only for update events) */
  changes?: MedicationEventChange[];
}

// ============================================================================
// CAREGIVER DASHBOARD TYPES
// ============================================================================

/**
 * Available caregiver screens for navigation
 * 
 * Used by QuickActionsPanel and navigation components to type-safely
 * navigate between caregiver screens.
 * 
 * @example
 * ```typescript
 * const screen: CaregiverScreen = 'events';
 * router.push(`/caregiver/${screen}`);
 * ```
 */
export type CaregiverScreen = 'dashboard' | 'events' | 'medications' | 'tasks' | 'add-device';

/**
 * Patient with device state for caregiver dashboard
 * 
 * Extends the base Patient interface with real-time device state information
 * from Firebase Realtime Database. Used in dashboard views to display
 * patient information alongside their device connectivity status.
 * 
 * @example
 * ```typescript
 * const patient: PatientWithDevice = {
 *   id: 'patient-123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   caregiverId: 'caregiver-456',
 *   deviceId: 'DEVICE-001',
 *   createdAt: new Date(),
 *   deviceState: {
 *     is_online: true,
 *     battery_level: 85,
 *     current_status: 'PENDING',
 *     last_event_at: Date.now()
 *   }
 * };
 * ```
 */
export interface PatientWithDevice extends Patient {
  /** Real-time device state from Firebase RTDB */
  deviceState?: DeviceState;
  /** Optional dose segments for DoseRing visualization */
  doseSegments?: DoseSegment[];
}

/**
 * Event filters for medication event registry
 * 
 * Defines the available filters for the event registry screen.
 * All filters are optional and can be combined. Filters are persisted
 * to AsyncStorage for user convenience.
 * 
 * @example
 * ```typescript
 * const filters: EventFilters = {
 *   patientId: 'patient-123',
 *   eventType: 'created',
 *   dateRange: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-01-31')
 *   },
 *   searchQuery: 'aspirin'
 * };
 * ```
 */
export interface EventFilters {
  /** Filter by specific patient ID */
  patientId?: string;
  /** Filter by medication event type */
  eventType?: MedicationEventType;
  /** Filter by date range (inclusive) */
  dateRange?: {
    /** Start date of the range */
    start: Date;
    /** End date of the range */
    end: Date;
  };
  /** Search query for medication name (client-side filtering) */
  searchQuery?: string;
}

/**
 * Props for CaregiverHeader component
 * 
 * Defines the interface for the high-quality caregiver header component
 * that matches patient-side design quality.
 * 
 * @example
 * ```typescript
 * <CaregiverHeader
 *   caregiverName="Dr. Smith"
 *   title="Dashboard"
 *   showScreenTitle={true}
 *   onLogout={handleLogout}
 *   onEmergency={handleEmergency}
 * />
 * ```
 */
export interface CaregiverHeaderProps {
  /** Display name of the caregiver */
  caregiverName?: string;
  /** Screen title to display */
  title?: string;
  /** Whether to show the screen title below branding */
  showScreenTitle?: boolean;
  /** Callback when logout is triggered */
  onLogout?: () => void;
  /** Callback when emergency button is pressed */
  onEmergency?: () => void;
  /** Callback when account menu is opened */
  onAccountMenu?: () => void;
}

/**
 * Props for QuickActionsPanel component
 * 
 * Dashboard quick actions panel providing one-tap access to common
 * caregiver tasks with smooth animations and responsive layout.
 * 
 * @example
 * ```typescript
 * <QuickActionsPanel
 *   onNavigate={(screen) => router.push(`/caregiver/${screen}`)}
 * />
 * ```
 */
export interface QuickActionsPanelProps {
  /** Callback when an action card is pressed */
  onNavigate: (screen: CaregiverScreen) => void;
}

/**
 * Props for DeviceConnectivityCard component
 * 
 * Displays real-time device connectivity status with battery level,
 * online/offline indicator, and last seen timestamp. Includes device
 * management and unlinking functionality for caregivers.
 * 
 * @example
 * ```typescript
 * <DeviceConnectivityCard
 *   deviceId="DEVICE-001"
 *   patientId="patient-123"
 *   onManageDevice={() => router.push('/caregiver/add-device')}
 *   onDeviceUnlinked={() => refreshPatientData()}
 * />
 * ```
 */
export interface DeviceConnectivityCardProps {
  /** Device identifier */
  deviceId?: string;
  /** Patient ID (required for unlinking functionality) */
  patientId?: string;
  /** Callback when "Manage Device" button is pressed */
  onManageDevice?: () => void;
  /** Callback when device is successfully unlinked */
  onDeviceUnlinked?: () => void;
  /** Optional style prop for custom styling */
  style?: any;
}

/**
 * Props for LastMedicationStatusCard component
 * 
 * Shows the most recent medication event with event type badge,
 * medication name, and timestamp. Fetches the latest event from Firestore
 * based on patient and caregiver IDs.
 * 
 * @example
 * ```typescript
 * <LastMedicationStatusCard
 *   patientId="patient-123"
 *   caregiverId="caregiver-456"
 *   onViewAll={() => router.push('/caregiver/events')}
 * />
 * ```
 */
export interface LastMedicationStatusCardProps {
  /** Patient ID to filter events */
  patientId?: string;
  /** Caregiver ID to filter events */
  caregiverId?: string;
  /** Callback when "View All Events" button is pressed */
  onViewAll?: () => void;
}

/**
 * Props for PatientSelector component
 * 
 * Horizontal scrollable list of patient chips for multi-patient support.
 * Shows patient name and device status indicator with smooth animations.
 * 
 * @example
 * ```typescript
 * <PatientSelector
 *   patients={linkedPatients}
 *   selectedPatientId={currentPatientId}
 *   onSelectPatient={(id) => setCurrentPatientId(id)}
 *   loading={false}
 * />
 * ```
 */
export interface PatientSelectorProps {
  /** Array of patients linked to the caregiver */
  patients: Patient[];
  /** Currently selected patient ID */
  selectedPatientId?: string;
  /** Callback when a patient is selected */
  onSelectPatient: (patientId: string) => void;
  /** Whether the component is loading data */
  loading?: boolean;
}

/**
 * Props for EventFilterControls component
 * 
 * Filter controls for the event registry with search, patient filter,
 * event type filter, and date range filter. Persists state to AsyncStorage.
 * 
 * @example
 * ```typescript
 * <EventFilterControls
 *   filters={currentFilters}
 *   onFiltersChange={setFilters}
 *   patients={linkedPatients}
 * />
 * ```
 */
export interface EventFilterControlsProps {
  /** Current active filters */
  filters: EventFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: EventFilters) => void;
  /** Array of patients for patient filter dropdown */
  patients: Array<{ id: string; name: string }>;
}

/**
 * Props for EventTypeBadge component
 * 
 * Color-coded badge for medication event types with consistent styling.
 * Supports both short names (created, updated, deleted) and full names
 * (medication_created, dose_taken, etc.) for flexibility.
 * 
 * Color scheme:
 * - created/medication_created: Blue (primary)
 * - updated/medication_updated: Orange (warning)
 * - deleted/medication_deleted: Red (error)
 * - dose_taken: Green (success)
 * - dose_missed: Orange (warning)
 * 
 * @example
 * ```typescript
 * // Short event type name
 * <EventTypeBadge eventType="created" size="md" />
 * 
 * // Full event type name
 * <EventTypeBadge eventType="dose_taken" size="sm" />
 * 
 * // Large badge for emphasis
 * <EventTypeBadge eventType="deleted" size="lg" />
 * ```
 */
export interface EventTypeBadgeProps {
  /** Type of medication event - supports both short and full event type names */
  eventType: MedicationEventType | 'medication_created' | 'medication_updated' | 'medication_deleted' | 'dose_taken' | 'dose_missed';
  /** Optional size variant (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for MedicationEventCard component
 * 
 * Card component for displaying medication events in the event registry.
 * Shows event type badge, medication name, patient name, timestamp, and
 * optional changes summary for update events.
 * 
 * Features:
 * - Color-coded event type icon
 * - Patient name and action verb
 * - Medication name in quotes
 * - Change summary for updates (e.g., "Changed dose: 500 → 1000")
 * - Relative timestamp (e.g., "2 hours ago")
 * - Chevron indicator for navigation
 * 
 * @example
 * ```typescript
 * // Basic usage
 * <MedicationEventCard
 *   event={medicationEvent}
 *   onPress={() => router.push(`/caregiver/events/${event.id}`)}
 * />
 * 
 * // With patient name visible (for multi-patient views)
 * <MedicationEventCard
 *   event={medicationEvent}
 *   onPress={handlePress}
 *   showPatientName={true}
 * />
 * ```
 */
export interface MedicationEventCardProps {
  /** Medication event to display */
  event: MedicationEvent;
  /** Callback when card is pressed (for navigation to detail view) */
  onPress?: () => void;
  /** Whether to show the patient name (useful for multi-patient views, default: true) */
  showPatientName?: boolean;
}

/**
 * Props for ErrorState component
 * 
 * Error state display with user-friendly message and retry button.
 * Used throughout caregiver screens for consistent error handling.
 * Supports error categorization for appropriate icon and title selection.
 * 
 * @example
 * ```typescript
 * <ErrorState
 *   title="Failed to Load"
 *   message="Could not load patient data. Please try again."
 *   onRetry={handleRetry}
 * />
 * ```
 */
export interface ErrorStateProps {
  /** Error title (optional, will be auto-generated from category if not provided) */
  title?: string;
  /** Error message */
  message: string;
  /** Error category for icon and title selection (imported from errorHandling utils) */
  category?: any; // Using any to avoid circular dependency with errorHandling
  /** Callback when retry button is pressed */
  onRetry?: () => void;
  /** Label for retry button */
  retryLabel?: string;
  /** Whether to show the error icon */
  showIcon?: boolean;
}

/**
 * Props for OfflineIndicator component
 * 
 * Banner component that displays when the app is offline.
 * Shows cached data indicator and sync status. Automatically detects
 * network changes unless overridden.
 * 
 * @example
 * ```typescript
 * <OfflineIndicator />
 * <OfflineIndicator isOnline={false} />
 * ```
 */
export interface OfflineIndicatorProps {
  /** Optional override for online status (for testing or manual control) */
  isOnline?: boolean;
}

/**
 * ConnectionCodeData interface
 * 
 * Represents a time-limited connection code that allows caregivers to link
 * to a patient's device. Codes are generated by patients and used by caregivers
 * to establish device links.
 * 
 * Connection code workflow:
 * 1. Patient generates code via generateCode() → creates connectionCode document
 * 2. Patient shares code with caregiver (verbally, text, etc.)
 * 3. Caregiver enters code in app → validates via validateCode()
 * 4. Caregiver confirms connection → useCode() marks code as used and creates deviceLink
 * 5. Code becomes invalid after use or expiration
 * 
 * Security features:
 * - Time-limited (default 24 hours, max 7 days)
 * - Single-use only (marked as used after first use)
 * - Cryptographically random generation
 * - Avoids ambiguous characters (0/O, 1/I, etc.)
 * 
 * @example
 * ```typescript
 * // Valid unused code
 * const codeData: ConnectionCodeData = {
 *   code: 'ABC123',
 *   deviceId: 'DEVICE-001',
 *   patientId: 'patient-456',
 *   patientName: 'John Doe',
 *   expiresAt: new Date('2024-12-31'),
 *   used: false
 * };
 * 
 * // Used code
 * const usedCode: ConnectionCodeData = {
 *   code: 'XYZ789',
 *   deviceId: 'DEVICE-001',
 *   patientId: 'patient-456',
 *   patientName: 'John Doe',
 *   expiresAt: new Date('2024-12-31'),
 *   used: true,
 *   usedBy: 'caregiver-789',
 *   usedAt: new Date('2024-12-15')
 * };
 * ```
 */
export interface ConnectionCodeData {
  /** The connection code itself (6-8 alphanumeric characters) */
  code: string;
  /** ID of the device this code links to */
  deviceId: string;
  /** ID of the patient who owns the device */
  patientId: string;
  /** Name of the patient for display purposes */
  patientName: string;
  /** Expiration timestamp for the code */
  expiresAt: Date;
  /** Whether the code has been used */
  used: boolean;
  /** ID of the caregiver who used the code (if used) */
  usedBy?: string;
  /** Timestamp when the code was used (if used) */
  usedAt?: Date;
}

/**
 * DeviceLink interface
 * 
 * Represents the relationship between a device and a user (patient or caregiver).
 * Stored in Firestore deviceLinks collection with composite ID format.
 * 
 * The device linking system enables:
 * - Patients to link their account to a physical pillbox device
 * - Caregivers to access patient data by linking to the same device
 * - Multiple caregivers to manage the same patient through shared device access
 * 
 * Linking flow:
 * 1. Patient links device via deviceID → creates patient deviceLink
 * 2. Caregiver enters same deviceID → creates caregiver deviceLink
 * 3. Both users now have access to shared medication data
 * 
 * @example
 * ```typescript
 * // Patient device link
 * const patientLink: DeviceLink = {
 *   id: 'DEVICE-001_patient-123',
 *   deviceId: 'DEVICE-001',
 *   userId: 'patient-123',
 *   role: 'patient',
 *   status: 'active',
 *   linkedAt: new Date(),
 *   linkedBy: 'patient-123'
 * };
 * 
 * // Caregiver device link (same device)
 * const caregiverLink: DeviceLink = {
 *   id: 'DEVICE-001_caregiver-456',
 *   deviceId: 'DEVICE-001',
 *   userId: 'caregiver-456',
 *   role: 'caregiver',
 *   status: 'active',
 *   linkedAt: new Date(),
 *   linkedBy: 'caregiver-456'
 * };
 * ```
 */
export interface DeviceLink {
  /** Composite ID in format: {deviceId}_{userId} */
  id: string;
  /** Device identifier (e.g., "DEVICE-001") */
  deviceId: string;
  /** User ID (patient or caregiver) */
  userId: string;
  /** User role (determines access permissions) */
  role: 'patient' | 'caregiver';
  /** Link status (active links are used for access control) */
  status: 'active' | 'inactive';
  /** Timestamp when link was created. Can be Date object or ISO string after Firestore conversion */
  linkedAt: Date | string;
  /** Optional ID of user who created the link (for audit purposes) */
  linkedBy?: string;
}

/**
 * DashboardState interface
 * 
 * Represents the state of the caregiver dashboard screen including
 * selected patient, linked patients, device status, and latest event.
 * 
 * State management:
 * - selectedPatientId: Persisted to AsyncStorage for session continuity
 * - patients: Fetched from Firestore via deviceLinks collection
 * - deviceStatus: Real-time updates from Firebase RTDB
 * - lastEvent: Latest medication event from Firestore
 * - loading: True during initial data fetch
 * - error: Populated on fetch failures
 * 
 * @example
 * ```typescript
 * // Initial state
 * const [dashboardState, setDashboardState] = useState<DashboardState>({
 *   selectedPatientId: null,
 *   patients: [],
 *   deviceStatus: null,
 *   lastEvent: null,
 *   loading: true,
 *   error: null
 * });
 * 
 * // After data load
 * setDashboardState({
 *   selectedPatientId: 'patient-123',
 *   patients: [patient1, patient2],
 *   deviceStatus: { is_online: true, battery_level: 85, ... },
 *   lastEvent: { eventType: 'created', ... },
 *   loading: false,
 *   error: null
 * });
 * ```
 */
export interface DashboardState {
  /** Currently selected patient ID (null if no selection) */
  selectedPatientId: string | null;
  /** Array of patients linked to the caregiver with device state */
  patients: PatientWithDevice[];
  /** Real-time device status for selected patient (null if no device or not selected) */
  deviceStatus: DeviceState | null;
  /** Most recent medication event for selected patient (null if no events) */
  lastEvent: MedicationEvent | null;
  /** Whether data is currently being loaded */
  loading: boolean;
  /** Error object if data loading failed (null if no error) */
  error: Error | null;
}

/**
 * CachedPatientData interface
 * 
 * Structure for caching patient data in AsyncStorage for offline support.
 * Includes timestamp for cache invalidation and expiration.
 * 
 * Cache strategy:
 * - Data is cached after successful fetch from Firestore
 * - Cache is used when offline or during initial load
 * - Cache expires after 24 hours (configurable)
 * - Cache is invalidated when patient switches or data is updated
 * 
 * Storage key format: `@patient_cache_${patientId}`
 * 
 * @example
 * ```typescript
 * // Creating cached data
 * const cachedData: CachedPatientData = {
 *   patientId: 'patient-123',
 *   patient: patientData,
 *   medications: medicationsList,
 *   events: recentEvents,
 *   cachedAt: Date.now(),
 *   expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
 * };
 * 
 * // Saving to AsyncStorage
 * await AsyncStorage.setItem(
 *   `@patient_cache_${patientId}`,
 *   JSON.stringify(cachedData)
 * );
 * 
 * // Loading from cache
 * const cached = await AsyncStorage.getItem(`@patient_cache_${patientId}`);
 * if (cached) {
 *   const data: CachedPatientData = JSON.parse(cached);
 *   if (Date.now() < data.expiresAt) {
 *     // Use cached data
 *   }
 * }
 * ```
 */
export interface CachedPatientData {
  /** Patient ID this cache belongs to */
  patientId: string;
  /** Cached patient data with device state */
  patient: PatientWithDevice;
  /** Cached medications list */
  medications: Medication[];
  /** Cached recent events (typically last 50) */
  events: MedicationEvent[];
  /** Unix timestamp (milliseconds) when data was cached */
  cachedAt: number;
  /** Unix timestamp (milliseconds) when cache expires */
  expiresAt: number;
}

/**
 * OfflineMedicationChange interface
 * 
 * Represents a medication change made while offline that needs to be
 * synced when connectivity is restored.
 * 
 * Offline queue workflow:
 * 1. User makes medication change while offline
 * 2. Change is added to queue in AsyncStorage
 * 3. UI shows "pending sync" indicator
 * 4. When connectivity restored, queue is processed
 * 5. Each change is synced to Firestore
 * 6. On success, change is marked as synced
 * 7. On failure, error is stored for retry
 * 
 * Storage key: `@offline_medication_queue`
 * 
 * @example
 * ```typescript
 * // Creating a queue item for offline update
 * const queueItem: OfflineMedicationChange = {
 *   id: 'change-123',
 *   operation: 'update',
 *   medicationId: 'med-456',
 *   medicationData: {
 *     doseValue: '1000',
 *     doseUnit: 'mg'
 *   },
 *   patientId: 'patient-789',
 *   caregiverId: 'caregiver-012',
 *   timestamp: Date.now(),
 *   synced: false
 * };
 * 
 * // Creating a queue item for offline creation
 * const createItem: OfflineMedicationChange = {
 *   id: 'change-456',
 *   operation: 'create',
 *   medicationData: newMedication,
 *   patientId: 'patient-789',
 *   caregiverId: 'caregiver-012',
 *   timestamp: Date.now(),
 *   synced: false
 * };
 * 
 * // After sync failure
 * const failedItem: OfflineMedicationChange = {
 *   ...queueItem,
 *   synced: false,
 *   error: 'Network timeout'
 * };
 * ```
 */
export interface OfflineMedicationChange {
  /** Unique change ID (generated with UUID) */
  id: string;
  /** Type of operation performed */
  operation: 'create' | 'update' | 'delete';
  /** Medication ID (required for update/delete, undefined for create) */
  medicationId?: string;
  /** Medication data (required for create/update, undefined for delete) */
  medicationData?: Partial<Medication>;
  /** Patient ID this change belongs to */
  patientId: string;
  /** Caregiver ID who made the change */
  caregiverId: string;
  /** Unix timestamp (milliseconds) when change was made */
  timestamp: number;
  /** Whether the change has been successfully synced to Firestore */
  synced: boolean;
  /** Optional error message if sync failed (for retry logic) */
  error?: string;
}

// External module declarations
// (No external module declarations needed at this time)


// ============================================================================
// PASTILLERO SCHEDULE TYPES
// ============================================================================

/**
 * TurnoType
 * 
 * Represents the time slot index for medication dispensing.
 * Each turno corresponds to a specific time of day.
 * 
 * @example
 * ```typescript
 * const turno: TurnoType = 0; // Mañana (08:00)
 * ```
 */
export type TurnoType = 0 | 1 | 2 | 3; // 0=mañana, 1=mediodía, 2=tarde, 3=noche

/**
 * DiaType
 * 
 * Represents the day of the week index (0=domingo, 6=sábado).
 * Follows JavaScript Date.getDay() convention.
 * 
 * @example
 * ```typescript
 * const dia: DiaType = 1; // Lunes
 * ```
 */
export type DiaType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * DemoScheduleEntry interface
 * 
 * Represents a single schedule entry for the pastillero demo.
 * Contains both numeric indices and human-readable names for display.
 * 
 * @example
 * ```typescript
 * const entry: DemoScheduleEntry = {
 *   dia: 1,
 *   turno: 0,
 *   hora: '08:00',
 *   diaName: 'Lunes',
 *   turnoName: 'Mañana'
 * };
 * ```
 */
export interface DemoScheduleEntry {
  /** Day of the week (0=domingo, 6=sábado) */
  dia: DiaType;
  /** Time slot index (0=mañana, 1=mediodía, 2=tarde, 3=noche) */
  turno: TurnoType;
  /** Time in HH:mm format */
  hora: string;
  /** Day name in Spanish */
  diaName: string;
  /** Turno name in Spanish */
  turnoName: string;
}

/**
 * PastilleroStatus interface
 * 
 * Represents the real-time status of a pastillero device from RTDB.
 * 
 * @example
 * ```typescript
 * const status: PastilleroStatus = {
 *   ultimoDispense: 1701432000000,
 *   online: true
 * };
 * ```
 */
export interface PastilleroStatus {
  /** Unix timestamp of the last dispense event (milliseconds) */
  ultimoDispense: number | null;
  /** Whether the device is currently online */
  online: boolean;
}

/**
 * PastilleroCommands interface
 * 
 * Represents the RTDB commands structure for the pastillero device.
 * Each boolean indicates whether an alarm is active for that day+turno combination.
 * Keys match the existing Firebase RTDB structure (lowercase with ñ).
 * 
 * @example
 * ```typescript
 * const commands: PastilleroCommands = {
 *   domingomañana: false,
 *   lunesmañana: true,  // Alarm active for Monday morning
 *   // ... other combinations
 * };
 * ```
 */
export interface PastilleroCommands {
  'domingomañana': boolean;
  'domingomediodia': boolean;
  'domingotarde': boolean;
  'domingonoche': boolean;
  'lunesmañana': boolean;
  'lunesmediodia': boolean;
  'lunestarde': boolean;
  'lunesnoche': boolean;
  'martesmañana': boolean;
  'martesmediodia': boolean;
  'martestarde': boolean;
  'martesnoche': boolean;
  'miercolesmañana': boolean;
  'miercolesmediodia': boolean;
  'miercolestarde': boolean;
  'miercolesnoche': boolean;
  'juevesmañana': boolean;
  'juevesmediodia': boolean;
  'juevestarde': boolean;
  'juevesnoche': boolean;
  'viernesmañana': boolean;
  'viernesmediodia': boolean;
  'viernestarde': boolean;
  'viernesnoche': boolean;
  'sabadomañana': boolean;
  'sabadomediodia': boolean;
  'sabadotarde': boolean;
  'sabadonoche': boolean;
  /** Optional topo alarm flag */
  topo?: boolean;
  /** Optional LED state flag */
  led?: boolean;
}

/**
 * StatusCardProps interface
 * 
 * Props for the StatusCard component that displays pastillero status.
 * 
 * @example
 * ```typescript
 * <StatusCard
 *   online={true}
 *   ultimoDispense={1701432000000}
 *   horarios={DEMO_PASTILLERO_SCHEDULE}
 * />
 * ```
 */
export interface StatusCardProps {
  /** Whether the device is online */
  online: boolean;
  /** Unix timestamp of last dispense (milliseconds) */
  ultimoDispense: number | null;
  /** Array of scheduled entries for calculating next dose */
  horarios: DemoScheduleEntry[];
}

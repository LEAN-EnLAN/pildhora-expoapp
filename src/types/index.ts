// User types
export interface User {
  id: string;
  email: string;
  role: 'patient' | 'caregiver';
  name: string;
  createdAt: Date | string; // Can be Date object or ISO string after Firestore conversion
}

// Medication types
export interface Medication {
  id: string;
  name: string;
  // New fields for separated dose and quantity
  doseValue?: string;        // Numeric value only (e.g., "500", "10", "0.5")
  doseUnit?: string;          // Unit (e.g., "mg", "ml", "g", "mcg")
  quantityType?: string;       // Form factor (e.g., "Tablets", "Capsules", "Liquid")
  isCustomQuantityType?: boolean; // Flag for custom quantity types
  // Legacy field for backward compatibility
  dosage?: string;
  frequency: string;
  times: string[];
  patientId: string;
  caregiverId: string;
  createdAt: Date | string; // Can be Date object or ISO string after Firestore conversion
  updatedAt: Date | string; // Can be Date object or ISO string after Firestore conversion
}

// Dose units enumeration
export const DOSE_UNITS = [
  { id: 'mg', label: 'mg (milligrams)' },
  { id: 'g', label: 'g (grams)' },
  { id: 'mcg', label: 'mcg (micrograms)' },
  { id: 'ml', label: 'ml (milliliters)' },
  { id: 'l', label: 'l (liters)' },
  { id: 'units', label: 'units' },
  { id: 'drops', label: 'drops' },
  { id: 'sprays', label: 'sprays' },
  { id: 'puffs', label: 'puffs' },
  { id: 'custom', label: 'Custom unit' }
] as const;

// Quantity types enumeration
export const QUANTITY_TYPES = [
  { id: 'tablets', label: 'Tablets', icon: 'medkit-outline' },
  { id: 'capsules', label: 'Capsules', icon: 'medkit-outline' },
  { id: 'liquid', label: 'Liquid', icon: 'flask-outline' },
  { id: 'cream', label: 'Cream', icon: 'color-wand-outline' },
  { id: 'inhaler', label: 'Inhaler', icon: 'wind-outline' },
  { id: 'drops', label: 'Drops', icon: 'water-outline' },
  { id: 'spray', label: 'Spray', icon: 'snow-outline' },
  { id: 'other', label: 'Other', icon: 'help-circle-outline' }
] as const;

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  patientId: string;
  caregiverId: string;
  completed: boolean;
  dueDate: Date | string; // Can be Date object or ISO string after Firestore conversion
  createdAt: Date | string; // Can be Date object or ISO string after Firestore conversion
}

// BLE device types
export interface PillboxDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  lastSeen: Date | string; // Can be Date object or ISO string after Firestore conversion
}

// Medication intake types
export enum IntakeStatus {
  PENDING = 'pending',
  TAKEN = 'taken',
  MISSED = 'missed'
}

export interface IntakeRecord {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: Date | string; // Can be Date object or ISO string after Firestore conversion
  status: IntakeStatus;
  patientId: string;
  takenAt?: Date | string; // Can be Date object or ISO string after Firestore conversion
  // Optional linkage to the medication document for enrichment
  medicationId?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Patient types for caregiver dashboard
export interface Patient {
  /** Unique identifier for the patient document in Firestore */
  id: string;
  /** Full name of the patient */
  name: string;
  /** Email address of the patient */
  email: string;
  /** Optional ID of the linked pillbox device */
  deviceId?: string;
  /** Required field: ID of the caregiver user assigned to this patient.
   *  This field is essential for the caregiver dashboard query to work properly.
   *  It links the patient to their assigned caregiver and is used in Firestore queries
   *  with where('caregiverId', '==', user.id) to fetch only the patients assigned
   *  to the currently logged-in caregiver. */
  caregiverId: string;
  /** Timestamp when the patient record was created. Can be Date object or ISO string after Firestore conversion */
  createdAt: Date | string;
  /** Optional medication adherence percentage (0-100) */
  adherence?: number;
  /** Optional human-readable string indicating when the last medication dose was taken */
  lastTaken?: string;
}

// Device state for real-time monitoring
export interface DeviceState {
  is_online: boolean;
  battery_level: number;
  current_status: 'PENDING' | 'ALARM_SOUNDING' | 'DOSE_TAKEN' | 'DOSE_MISSED';
  last_event_at?: number;
}

// Dose segment for DoseRing component
export interface DoseSegment {
  startHour: number;
  endHour: number;
  status: 'PENDING' | 'DOSE_TAKEN' | 'DOSE_MISSED';
}

// Patient with device state for dashboard
export interface PatientWithDevice extends Patient {
  deviceState?: DeviceState;
  doseSegments?: DoseSegment[];
}
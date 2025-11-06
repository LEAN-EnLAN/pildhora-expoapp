// User types
export interface User {
  id: string;
  email: string;
  role: 'patient' | 'caregiver';
  name: string;
  createdAt: Date;
}

// Medication types
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  patientId: string;
  caregiverId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  patientId: string;
  caregiverId: string;
  completed: boolean;
  dueDate: Date;
  createdAt: Date;
}

// BLE device types
export interface PillboxDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  lastSeen: Date;
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
  scheduledTime: Date;
  status: IntakeStatus;
  patientId: string;
  takenAt?: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Patient types for caregiver dashboard
export interface Patient {
  id: string;
  name: string;
  email: string;
  deviceId?: string;
  caregiverId: string;
  createdAt: Date;
  adherence?: number;
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
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

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
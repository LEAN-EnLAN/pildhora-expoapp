/**
 * Topo Alarm Service
 * 
 * Handles intake recording and caregiver notifications when topo alarms
 * are triggered and resolved.
 */
import { getDbInstance } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Medication, IntakeStatus } from '../types';

export type TopoResolutionType = 'taken' | 'missed' | 'skipped';

export interface TopoResolutionData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  patientId: string;
  patientName: string;
  caregiverId?: string;
  deviceId?: string;
  scheduledTime: Date;
  resolution: TopoResolutionType;
  isAutonomous: boolean;
}

/**
 * Record the intake when a topo alarm is resolved
 */
export async function recordTopoIntake(data: TopoResolutionData): Promise<string> {
  console.log('[TopoAlarmService] Recording intake:', data);

  const db = await getDbInstance();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const status = data.resolution === 'taken' 
    ? IntakeStatus.TAKEN 
    : IntakeStatus.MISSED;

  const intakeData = {
    medicationId: data.medicationId,
    medicationName: data.medicationName,
    dosage: data.dosage,
    scheduledTime: data.scheduledTime.toISOString(),
    status,
    takenAt: data.resolution === 'taken' ? new Date().toISOString() : null,
    patientId: data.patientId,
    caregiverId: data.caregiverId || null,
    deviceId: data.deviceId || 'pillbox',
    deviceSource: data.isAutonomous ? 'manual' : 'pillbox',
    isAutonomous: data.isAutonomous,
    topoTriggered: true,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'intakeRecords'), intakeData);
  console.log('[TopoAlarmService] Intake recorded:', docRef.id);

  return docRef.id;
}

/**
 * Create a critical event for caregiver notification
 */
export async function createTopoCriticalEvent(
  eventType: 'topo_started' | 'topo_taken' | 'topo_missed' | 'topo_timeout',
  data: {
    patientId: string;
    patientName: string;
    caregiverId: string;
    medicationName?: string;
    deviceId?: string;
  }
): Promise<void> {
  console.log('[TopoAlarmService] Creating critical event:', eventType, data);

  const db = await getDbInstance();
  if (!db) {
    console.warn('[TopoAlarmService] Database not initialized');
    return;
  }

  // Don't create events if no caregiver
  if (!data.caregiverId) {
    console.log('[TopoAlarmService] No caregiver, skipping critical event');
    return;
  }

  const eventMessages: Record<string, { title: string; message: string }> = {
    topo_started: {
      title: '⏰ Hora de medicación',
      message: `Es hora de que ${data.patientName} tome ${data.medicationName || 'su medicación'}`,
    },
    topo_taken: {
      title: '✅ Medicación tomada',
      message: `${data.patientName} ha tomado ${data.medicationName || 'su medicación'}`,
    },
    topo_missed: {
      title: '⚠️ Medicación omitida',
      message: `${data.patientName} ha omitido ${data.medicationName || 'su medicación'}`,
    },
    topo_timeout: {
      title: '🚨 Medicación no tomada',
      message: `${data.patientName} no ha respondido a la alarma de ${data.medicationName || 'medicación'}`,
    },
  };

  const { title, message } = eventMessages[eventType] || {
    title: 'Evento de medicación',
    message: `Evento de ${data.patientName}`,
  };

  const eventData = {
    eventType,
    patientId: data.patientId,
    patientName: data.patientName,
    caregiverId: data.caregiverId,
    medicationName: data.medicationName || null,
    deviceId: data.deviceId || null,
    title,
    message,
    read: false,
    notificationSent: false,
    timestamp: serverTimestamp(),
  };

  await addDoc(collection(db, 'criticalEvents'), eventData);
  console.log('[TopoAlarmService] Critical event created');
}

/**
 * Get the scheduled time for a medication based on current time
 */
export function getScheduledTimeForMedication(medication: Medication): Date {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeDecimal = currentHour + currentMinute / 60;

  let closestTime = medication.times?.[0] || '08:00';
  let closestDiff = Infinity;

  for (const time of medication.times || []) {
    const [hh, mm] = time.split(':').map(Number);
    if (isNaN(hh)) continue;

    const timeDecimal = hh + (mm || 0) / 60;
    const diff = Math.abs(timeDecimal - currentTimeDecimal);

    if (diff < closestDiff) {
      closestDiff = diff;
      closestTime = time;
    }
  }

  const [hours, minutes] = closestTime.split(':').map(Number);
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes || 0, 0, 0);

  return scheduledTime;
}

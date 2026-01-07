/**
 * Pastillero Service
 * 
 * Service for managing pastillero demo schedules and RTDB synchronization.
 * Provides constants for demo data and functions for uploading schedules.
 */

import { ref, update } from 'firebase/database';
import { deviceRdb } from './firebase';
import type { DemoScheduleEntry, TurnoType, DiaType, PastilleroCommands } from '../types';

/** Day names in Spanish for RTDB keys (lowercase, no accents) */
export const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

/** Turno names for RTDB keys (lowercase with ñ to match existing Firebase data) */
export const TURNOS = ['mañana', 'mediodia', 'tarde', 'noche'] as const;

/** Day names in Spanish for display (with proper capitalization) */
export const DIAS_DISPLAY = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

/** Turno names in Spanish for display (with accents) */
export const TURNOS_DISPLAY = ['Mañana', 'Mediodía', 'Tarde', 'Noche'] as const;

/** Fixed schedules by turno index → time string */
export const HORARIOS_TURNO: Record<TurnoType, string> = {
  0: '08:00', // Mañana
  1: '12:30', // Mediodía
  2: '17:00', // Tarde
  3: '21:00', // Noche
};


/** Turno color mapping for UI display */
export const TURNO_COLORS: Record<TurnoType, string> = {
  0: '#F59E0B', // Mañana - yellow/warning
  1: '#F97316', // Mediodía - orange
  2: '#3B82F6', // Tarde - blue/primary
  3: '#8B5CF6', // Noche - purple
};

/**
 * Demo pastillero schedule with 7 entries (one per day).
 * Each entry specifies a day, turno, and the corresponding time.
 */
export const DEMO_PASTILLERO_SCHEDULE: DemoScheduleEntry[] = [
  { dia: 1, turno: 0, hora: '08:00', diaName: 'Lunes', turnoName: 'Mañana' },
  { dia: 2, turno: 1, hora: '12:30', diaName: 'Martes', turnoName: 'Mediodía' },
  { dia: 3, turno: 2, hora: '17:00', diaName: 'Miércoles', turnoName: 'Tarde' },
  { dia: 4, turno: 3, hora: '21:00', diaName: 'Jueves', turnoName: 'Noche' },
  { dia: 5, turno: 0, hora: '08:00', diaName: 'Viernes', turnoName: 'Mañana' },
  { dia: 6, turno: 1, hora: '12:30', diaName: 'Sábado', turnoName: 'Mediodía' },
  { dia: 0, turno: 2, hora: '17:00', diaName: 'Domingo', turnoName: 'Tarde' },
];

/**
 * Creates a DemoScheduleEntry from day and turno indices.
 * Useful for generating custom schedules.
 */
export function createScheduleEntry(dia: DiaType, turno: TurnoType): DemoScheduleEntry {
  return {
    dia,
    turno,
    hora: HORARIOS_TURNO[turno],
    diaName: DIAS_DISPLAY[dia],
    turnoName: TURNOS_DISPLAY[turno],
  };
}

/**
 * Gets the next scheduled dose for today based on current time.
 * Returns null if no doses are scheduled for today.
 */
export function getNextScheduledDoseToday(
  schedule: DemoScheduleEntry[],
  now: Date = new Date()
): DemoScheduleEntry | null {
  const today = now.getDay() as DiaType;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // Find today's entries that are still upcoming
  const todayEntries = schedule
    .filter(entry => entry.dia === today && entry.hora > currentTime)
    .sort((a, b) => a.hora.localeCompare(b.hora));
  
  return todayEntries[0] || null;
}

/**
 * Generates RTDB commands object from a schedule array.
 * Initializes all 28 day+turno combinations to false, then sets scheduled entries to true.
 * 
 * @param schedule - Array of schedule entries to activate
 * @returns Object with all 28 day+turno keys as booleans
 */
export function generateRtdbCommands(
  schedule: DemoScheduleEntry[] = DEMO_PASTILLERO_SCHEDULE
): PastilleroCommands {
  // Initialize all 28 day+turno combinations to false
  const commands: Record<string, boolean> = {};
  DIAS.forEach(dia => {
    TURNOS.forEach(turno => {
      commands[`${dia}${turno}`] = false;
    });
  });
  
  // Set only scheduled entries to true
  schedule.forEach(entry => {
    const diaKey = DIAS[entry.dia];
    const turnoKey = TURNOS[entry.turno];
    commands[`${diaKey}${turnoKey}`] = true;
  });
  
  return commands as PastilleroCommands;
}

/**
 * Uploads pastillero schedule data to Firebase RTDB.
 * Writes to /devices/{deviceId}/commands path.
 * 
 * @param deviceId - The device ID to write commands to
 * @param schedule - Optional schedule array (defaults to DEMO_PASTILLERO_SCHEDULE)
 * @returns Promise that resolves on success or rejects with error
 */
export async function uploadPastilleroData(
  deviceId: string,
  schedule: DemoScheduleEntry[] = DEMO_PASTILLERO_SCHEDULE
): Promise<void> {
  if (!deviceId) {
    throw new Error('Device ID is required');
  }
  
  try {
    const commands = generateRtdbCommands(schedule);
    const commandsRef = ref(deviceRdb, `/devices/${deviceId}/commands`);
    await update(commandsRef, commands);
    console.log(`[PastilleroService] Successfully uploaded schedule to device ${deviceId}`);
  } catch (error) {
    console.error('[PastilleroService] Failed to upload schedule:', error);
    throw new Error(
      `Failed to upload pastillero schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

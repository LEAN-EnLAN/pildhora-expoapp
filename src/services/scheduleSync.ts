/**
 * Schedule Sync Service
 * 
 * Syncs medication schedules to Firebase RTDB commands.
 * Maps medication times to turnos (mañana/mediodia/tarde/noche) and
 * updates the device commands in RTDB.
 */

import { ref, update } from 'firebase/database';
import { getDeviceRdbInstance } from './firebase';
import type { Medication } from '../types';

/** Day abbreviations used in medication frequency */
const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Spanish day names for RTDB keys */
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/** Turno names for RTDB keys */
const TURNOS = ['mañana', 'mediodia', 'tarde', 'noche'] as const;

/**
 * Maps a time string (HH:mm) to a turno index
 * - mañana: 06:00 - 10:59
 * - mediodia: 11:00 - 14:59
 * - tarde: 15:00 - 19:59
 * - noche: 20:00 - 05:59
 */
export function timeToTurno(timeStr: string): typeof TURNOS[number] {
  const [hours] = timeStr.split(':').map(Number);
  
  if (hours >= 6 && hours < 11) return 'mañana';
  if (hours >= 11 && hours < 15) return 'mediodia';
  if (hours >= 15 && hours < 20) return 'tarde';
  return 'noche';
}

/**
 * Maps day abbreviation (Mon, Tue, etc.) to Spanish day name
 */
function dayAbbrevToSpanish(abbrev: string): string | null {
  const index = DAY_ABBREVS.indexOf(abbrev);
  return index >= 0 ? DIAS[index] : null;
}

/**
 * Generates RTDB commands from medications array.
 * Analyzes each medication's times and frequency to determine
 * which turno+dia combinations should be active.
 * 
 * @param medications - Array of medications to process
 * @returns Object with all 28 turno+dia keys as booleans
 */
export function generateCommandsFromMedications(
  medications: Medication[]
): Record<string, boolean> {
  // Initialize all turno+dia combinations to false
  const commands: Record<string, boolean> = {};
  DIAS.forEach(dia => {
    TURNOS.forEach(turno => {
      commands[`${dia}${turno}`] = false;
    });
  });
  
  console.log('[ScheduleSync] Processing medications:', medications.length);
  
  // Process each medication
  medications.forEach(med => {
    // Handle frequency as either array or comma-separated string
    let days: string[];
    if (Array.isArray(med.frequency)) {
      // If it's already an array (from wizard state)
      days = med.frequency;
    } else {
      // If it's a string (from Firestore), split by comma
      days = (med.frequency || '').split(',').map(d => d.trim()).filter(d => d.length > 0);
    }
    
    console.log(`[ScheduleSync] Med "${med.name}": frequency="${JSON.stringify(med.frequency)}" (type: ${typeof med.frequency}), times=${JSON.stringify(med.times)}, parsed days=${JSON.stringify(days)}`);
    
    // For each scheduled time, determine turno and activate for each day
    (med.times || []).forEach(time => {
      const turno = timeToTurno(time);
      
      days.forEach(dayAbbrev => {
        const diaSpanish = dayAbbrevToSpanish(dayAbbrev);
        if (diaSpanish) {
          const key = `${diaSpanish}${turno}`;
          commands[key] = true;
          console.log(`[ScheduleSync]   -> ${dayAbbrev} ${time} => ${key} = true`);
        } else {
          console.log(`[ScheduleSync]   -> Unknown day abbrev: "${dayAbbrev}"`);
        }
      });
    });
  });
  
  return commands;
}

/**
 * Syncs medication schedules to Firebase RTDB.
 * Reads medications, maps times to turnos, and updates device commands.
 * 
 * @param deviceId - The device ID to update
 * @param medications - Array of medications to sync
 * @returns Promise that resolves on success
 */
export async function syncScheduleToRtdb(
  deviceId: string,
  medications: Medication[]
): Promise<void> {
  if (!deviceId) {
    throw new Error('Device ID is required');
  }
  
  const rtdb = await getDeviceRdbInstance();
  if (!rtdb) {
    throw new Error('Could not connect to RTDB');
  }
  
  const commands = generateCommandsFromMedications(medications);
  const commandsRef = ref(rtdb, `/devices/${deviceId}/commands`);
  
  await update(commandsRef, commands);
  
  console.log('[ScheduleSync] Successfully synced schedule to RTDB');
  console.log('[ScheduleSync] Active turnos:', 
    Object.entries(commands)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(', ') || 'none'
  );
}

/**
 * Gets a summary of which turnos would be active for given medications.
 * Useful for previewing before sync.
 */
export function getScheduleSummary(medications: Medication[]): {
  activeTurnos: string[];
  totalMedications: number;
  totalDoses: number;
} {
  const commands = generateCommandsFromMedications(medications);
  const activeTurnos = Object.entries(commands)
    .filter(([_, v]) => v)
    .map(([k]) => k);
  
  const totalDoses = medications.reduce(
    (sum, med) => sum + (med.times?.length || 0),
    0
  );
  
  return {
    activeTurnos,
    totalMedications: medications.length,
    totalDoses,
  };
}

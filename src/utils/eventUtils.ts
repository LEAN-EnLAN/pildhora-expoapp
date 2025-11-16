/**
 * Event Utilities
 * 
 * Shared utility functions for medication event handling and formatting.
 * Eliminates code duplication across components.
 */

import { MedicationEventType } from '../types';

/**
 * Get human-readable text for event type
 * 
 * @param {MedicationEventType} eventType - The event type
 * @returns {string} Human-readable event type text
 * 
 * @example
 * getEventTypeText('medication_created') // Returns 'Medicamento Creado'
 */
export function getEventTypeText(eventType: MedicationEventType): string {
  const eventTypeMap: Record<MedicationEventType, string> = {
    medication_created: 'Medicamento Creado',
    medication_updated: 'Medicamento Actualizado',
    medication_deleted: 'Medicamento Eliminado',
    dose_taken: 'Dosis Tomada',
    dose_missed: 'Dosis Perdida',
  };

  return eventTypeMap[eventType] || eventType;
}

/**
 * Get event type color
 * 
 * @param {MedicationEventType} eventType - The event type
 * @returns {string} Color hex code for the event type
 * 
 * @example
 * getEventTypeColor('dose_taken') // Returns '#10B981' (green)
 */
export function getEventTypeColor(eventType: MedicationEventType): string {
  const colorMap: Record<MedicationEventType, string> = {
    medication_created: '#3B82F6', // Blue
    medication_updated: '#F59E0B', // Yellow
    medication_deleted: '#EF4444', // Red
    dose_taken: '#10B981', // Green
    dose_missed: '#F97316', // Orange
  };

  return colorMap[eventType] || '#6B7280'; // Default gray
}

/**
 * Get event type icon name
 * 
 * @param {MedicationEventType} eventType - The event type
 * @returns {string} Ionicons icon name for the event type
 * 
 * @example
 * getEventTypeIcon('medication_created') // Returns 'add-circle'
 */
export function getEventTypeIcon(eventType: MedicationEventType): string {
  const iconMap: Record<MedicationEventType, string> = {
    medication_created: 'add-circle',
    medication_updated: 'create',
    medication_deleted: 'trash',
    dose_taken: 'checkmark-circle',
    dose_missed: 'alert-circle',
  };

  return iconMap[eventType] || 'information-circle';
}

/**
 * Format event timestamp to relative time
 * 
 * @param {Date | string} timestamp - The event timestamp
 * @returns {string} Relative time string (e.g., "hace 2 horas")
 * 
 * @example
 * formatEventTimestamp(new Date()) // Returns 'hace unos segundos'
 */
export function formatEventTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'hace unos segundos';
  } else if (diffMin < 60) {
    return `hace ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
  } else if (diffHour < 24) {
    return `hace ${diffHour} hora${diffHour !== 1 ? 's' : ''}`;
  } else if (diffDay < 7) {
    return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Sort events by timestamp (newest first)
 * 
 * @param {Array} events - Array of medication events
 * @returns {Array} Sorted array of events
 */
export function sortEventsByTimestamp<T extends { timestamp: Date | string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const dateA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
    const dateB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filter events by date range
 * 
 * @param {Array} events - Array of medication events
 * @param {Date} startDate - Start date of range
 * @param {Date} endDate - End date of range
 * @returns {Array} Filtered array of events
 */
export function filterEventsByDateRange<T extends { timestamp: Date | string }>(
  events: T[],
  startDate: Date,
  endDate: Date
): T[] {
  return events.filter(event => {
    const eventDate = typeof event.timestamp === 'string' ? new Date(event.timestamp) : event.timestamp;
    return eventDate >= startDate && eventDate <= endDate;
  });
}

/**
 * Group events by date
 * 
 * @param {Array} events - Array of medication events
 * @returns {Object} Events grouped by date string
 */
export function groupEventsByDate<T extends { timestamp: Date | string }>(
  events: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  events.forEach(event => {
    const eventDate = typeof event.timestamp === 'string' ? new Date(event.timestamp) : event.timestamp;
    const dateKey = eventDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(event);
  });

  return grouped;
}

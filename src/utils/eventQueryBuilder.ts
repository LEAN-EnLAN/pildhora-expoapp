import {
  collection,
  query,
  where,
  orderBy,
  limit,
  Query,
  DocumentData,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { MedicationEventType } from '../types';
import { EventFilters } from '../components/caregiver/EventFilterControls';

/**
 * Build a dynamic Firestore query based on active filters
 * 
 * This function constructs a Firestore query with the appropriate constraints
 * based on the provided filters. It handles:
 * - Caregiver filtering (always applied)
 * - Patient filtering (optional)
 * - Event type filtering (optional)
 * - Date range filtering (optional)
 * 
 * Note: Firestore requires composite indexes for queries with multiple where clauses
 * and orderBy. The indexes are defined in firestore.indexes.json.
 * 
 * @param db - Firestore database instance
 * @param caregiverId - ID of the caregiver (always required)
 * @param filters - Active filters from EventFilterControls
 * @param maxResults - Maximum number of results to return (default: 50)
 * @returns Firestore query with applied constraints
 */
export function buildEventQuery(
  db: Firestore,
  caregiverId: string,
  filters: EventFilters,
  maxResults: number = 50
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [];

  // Always filter by caregiver - this is the base constraint
  constraints.push(where('caregiverId', '==', caregiverId));

  // Apply patient filter if specified
  if (filters.patientId) {
    constraints.push(where('patientId', '==', filters.patientId));
  }

  // Apply event type filter if specified
  if (filters.eventType) {
    constraints.push(where('eventType', '==', filters.eventType));
  }

  // Apply date range filter if specified
  // Note: Firestore requires that if you use inequality operators (>=, <=),
  // the orderBy must be on the same field or come after all equality filters
  if (filters.dateRange) {
    const startTimestamp = Timestamp.fromDate(filters.dateRange.start);
    const endTimestamp = Timestamp.fromDate(filters.dateRange.end);
    
    constraints.push(where('timestamp', '>=', startTimestamp));
    constraints.push(where('timestamp', '<=', endTimestamp));
  }

  // Add ordering - must be on timestamp since we're filtering by it
  constraints.push(orderBy('timestamp', 'desc'));

  // Add limit to prevent excessive data transfer
  constraints.push(limit(maxResults));

  // Build and return the query
  return query(collection(db, 'medicationEvents'), ...constraints);
}

/**
 * Apply client-side search filter to events
 * 
 * Firestore doesn't support full-text search or case-insensitive partial matching,
 * so we implement medication name search on the client side after fetching results.
 * 
 * @param events - Array of medication events from Firestore
 * @param searchQuery - Search string to match against medication names
 * @returns Filtered array of events matching the search query
 */
export function applyClientSideSearch<T extends { medicationName: string }>(
  events: T[],
  searchQuery?: string
): T[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return events;
  }

  const searchLower = searchQuery.toLowerCase().trim();
  
  return events.filter(event =>
    event.medicationName.toLowerCase().includes(searchLower)
  );
}

/**
 * Validate filter combinations for Firestore compatibility
 * 
 * Firestore has limitations on query combinations:
 * - Can only use inequality operators on one field
 * - orderBy must be on the same field as inequality operators
 * - Composite indexes required for multiple where clauses
 * 
 * @param filters - Active filters to validate
 * @returns Object with validation result and any error message
 */
export function validateFilterCombination(
  filters: EventFilters
): { valid: boolean; error?: string } {
  // Check if date range is used with other inequality operators
  // (Currently we only use date range for inequalities, so this is always valid)
  
  // All our filter combinations are valid with proper indexes
  return { valid: true };
}

/**
 * Get required Firestore index configuration for current filters
 * 
 * This function returns the index configuration needed for the current
 * filter combination. Useful for debugging index-related errors.
 * 
 * @param filters - Active filters
 * @returns Index configuration object
 */
export function getRequiredIndexConfig(filters: EventFilters): {
  collectionGroup: string;
  queryScope: string;
  fields: Array<{ fieldPath: string; order?: string; arrayConfig?: string }>;
} {
  const fields: Array<{ fieldPath: string; order?: string; arrayConfig?: string }> = [
    { fieldPath: 'caregiverId', order: 'ASCENDING' },
  ];

  if (filters.patientId) {
    fields.push({ fieldPath: 'patientId', order: 'ASCENDING' });
  }

  if (filters.eventType) {
    fields.push({ fieldPath: 'eventType', order: 'ASCENDING' });
  }

  if (filters.dateRange) {
    fields.push({ fieldPath: 'timestamp', order: 'DESCENDING' });
  } else {
    fields.push({ fieldPath: 'timestamp', order: 'DESCENDING' });
  }

  return {
    collectionGroup: 'medicationEvents',
    queryScope: 'COLLECTION',
    fields,
  };
}

/**
 * Format filter summary for display
 * 
 * Creates a human-readable summary of active filters
 * 
 * @param filters - Active filters
 * @param patientName - Name of selected patient (if any)
 * @returns Human-readable filter summary
 */
export function formatFilterSummary(
  filters: EventFilters,
  patientName?: string
): string {
  const parts: string[] = [];

  if (filters.patientId && patientName) {
    parts.push(`Paciente: ${patientName}`);
  }

  if (filters.eventType) {
    const typeLabels: Record<MedicationEventType, string> = {
      created: 'Creados',
      updated: 'Actualizados',
      deleted: 'Eliminados',
    };
    parts.push(`Tipo: ${typeLabels[filters.eventType]}`);
  }

  if (filters.dateRange) {
    const start = filters.dateRange.start.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
    const end = filters.dateRange.end.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
    parts.push(`Fecha: ${start} - ${end}`);
  }

  if (filters.searchQuery) {
    parts.push(`Búsqueda: "${filters.searchQuery}"`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Sin filtros';
}

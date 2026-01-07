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
 * - Patient filtering (required - either specific patient or all linked patients)
 * - Event type filtering (optional)
 * - Date range filtering (optional)
 * 
 * Note: Firestore requires composite indexes for queries with multiple where clauses
 * and orderBy. The indexes are defined in firestore.indexes.json.
 * 
 * IMPORTANT: Events are stored with patientId, not caregiverId. Caregivers access
 * events through their linked patients via deviceLinks.
 * 
 * @param db - Firestore database instance
 * @param caregiverId - ID of the caregiver (used for logging, not querying)
 * @param filters - Active filters from EventFilterControls
 * @param maxResults - Maximum number of results to return (default: 50)
 * @param linkedPatientIds - Array of patient IDs the caregiver has access to
 * @returns Firestore query with applied constraints, or null if no patients
 */
export function buildEventQuery(
  db: Firestore,
  caregiverId: string,
  filters: Partial<EventFilters>,
  maxResults: number = 50,
  linkedPatientIds?: string[]
): Query<DocumentData> | null {
  const constraints: QueryConstraint[] = [];

  // Determine which patient(s) to query for
  if (filters.patientId) {
    // Specific patient selected
    constraints.push(where('patientId', '==', filters.patientId));
  } else if (linkedPatientIds && linkedPatientIds.length > 0) {
    // No specific patient - query for first linked patient
    // Note: Firestore 'in' operator supports up to 10 values
    // For more patients, we'd need to make multiple queries
    const patientsToQuery = linkedPatientIds.slice(0, 10);
    constraints.push(where('patientId', 'in', patientsToQuery));
  } else {
    // No patients to query - return null to indicate no query should be made
    console.log('[buildEventQuery] No linked patients available for caregiver', caregiverId);
    return null;
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

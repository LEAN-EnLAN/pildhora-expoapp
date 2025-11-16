/**
 * Event Query Builder Unit Tests
 * 
 * Tests for the eventQueryBuilder utility functions including:
 * - Firestore query building with various filter combinations
 * - Client-side search filtering
 * - Filter validation
 * - Index configuration generation
 * 
 * Run tests with: npm test
 */

import {
  buildEventQuery,
  applyClientSideSearch,
  validateFilterCombination,
  getRequiredIndexConfig,
  formatFilterSummary,
} from '../eventQueryBuilder';
import { EventFilters } from '../../components/caregiver/EventFilterControls';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, name) => ({ _type: 'collection', name })),
  query: jest.fn((collection, ...constraints) => ({
    _type: 'query',
    collection,
    constraints,
  })),
  where: jest.fn((field, op, value) => ({ _type: 'where', field, op, value })),
  orderBy: jest.fn((field, direction) => ({ _type: 'orderBy', field, direction })),
  limit: jest.fn((count) => ({ _type: 'limit', count })),
  Timestamp: {
    fromDate: jest.fn((date) => ({ _type: 'timestamp', date })),
  },
}));

describe('buildEventQuery', () => {
  const mockDb = {} as any;
  const caregiverId = 'caregiver-123';

  /**
   * Test 1: Query with no filters (caregiver only)
   */
  it('builds query with caregiver filter only when no other filters provided', () => {
    const filters: EventFilters = {};
    const query = buildEventQuery(mockDb, caregiverId, filters);

    expect(query.constraints).toHaveLength(3); // caregiver where, orderBy, limit
    expect(query.constraints[0]).toMatchObject({
      _type: 'where',
      field: 'caregiverId',
      op: '==',
      value: caregiverId,
    });
    expect(query.constraints[1]).toMatchObject({
      _type: 'orderBy',
      field: 'timestamp',
      direction: 'desc',
    });
    expect(query.constraints[2]).toMatchObject({
      _type: 'limit',
      count: 50,
    });
  });

  /**
   * Test 2: Query with patient filter
   */
  it('adds patient filter when patientId is provided', () => {
    const filters: EventFilters = {
      patientId: 'patient-456',
    };
    const query = buildEventQuery(mockDb, caregiverId, filters);

    expect(query.constraints).toHaveLength(4);
    expect(query.constraints[1]).toMatchObject({
      _type: 'where',
      field: 'patientId',
      op: '==',
      value: 'patient-456',
    });
  });

  /**
   * Test 3: Query with event type filter
   */
  it('adds event type filter when eventType is provided', () => {
    const filters: EventFilters = {
      eventType: 'created',
    };
    const query = buildEventQuery(mockDb, caregiverId, filters);

    expect(query.constraints).toHaveLength(4);
    expect(query.constraints[1]).toMatchObject({
      _type: 'where',
      field: 'eventType',
      op: '==',
      value: 'created',
    });
  });

  /**
   * Test 4: Query with date range filter
   */
  it('adds date range filters when dateRange is provided', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');
    const filters: EventFilters = {
      dateRange: { start, end },
    };
    const query = buildEventQuery(mockDb, caregiverId, filters);

    expect(query.constraints).toHaveLength(5); // caregiver, start date, end date, orderBy, limit
    expect(query.constraints[1]).toMatchObject({
      _type: 'where',
      field: 'timestamp',
      op: '>=',
    });
    expect(query.constraints[2]).toMatchObject({
      _type: 'where',
      field: 'timestamp',
      op: '<=',
    });
  });

  /**
   * Test 5: Query with patient and event type filters
   */
  it('combines patient and event type filters correctly', () => {
    const filters: EventFilters = {
      patientId: 'patient-456',
      eventType: 'updated',
    };
    const query = buildEventQuery(mockDb, caregiverId, filters);

    expect(query.constraints).toHaveLength(5);
    expect(query.constraints[1].field).toBe('patientId');
    expect(query.constraints[2].field).toBe('eventType');
  });

  /**
   * Test 6: Query with all filters combined
   */
  it('combines all filters correctly', () => {
    const filters: EventFilters = {
      patientId: 'patient-456',
      eventType: 'deleted',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    };
    const query = buildEventQuery(mockDb, caregiverId, filters);

    expect(query.constraints).toHaveLength(7); // caregiver, patient, eventType, 2 date, orderBy, limit
    expect(query.constraints[0].field).toBe('caregiverId');
    expect(query.constraints[1].field).toBe('patientId');
    expect(query.constraints[2].field).toBe('eventType');
    expect(query.constraints[3].field).toBe('timestamp');
    expect(query.constraints[4].field).toBe('timestamp');
  });

  /**
   * Test 7: Custom max results limit
   */
  it('uses custom maxResults when provided', () => {
    const filters: EventFilters = {};
    const query = buildEventQuery(mockDb, caregiverId, filters, 100);

    const limitConstraint = query.constraints.find((c: any) => c._type === 'limit');
    expect(limitConstraint).toMatchObject({
      _type: 'limit',
      count: 100,
    });
  });

  /**
   * Test 8: Always orders by timestamp descending
   */
  it('always orders by timestamp in descending order', () => {
    const filters: EventFilters = {
      patientId: 'patient-456',
    };
    const query = buildEventQuery(mockDb, caregiverId, filters);

    const orderByConstraint = query.constraints.find((c: any) => c._type === 'orderBy');
    expect(orderByConstraint).toMatchObject({
      _type: 'orderBy',
      field: 'timestamp',
      direction: 'desc',
    });
  });

  /**
   * Test 9: Converts dates to Firestore timestamps
   */
  it('converts Date objects to Firestore Timestamps for date range', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');
    const filters: EventFilters = {
      dateRange: { start, end },
    };

    buildEventQuery(mockDb, caregiverId, filters);

    expect(Timestamp.fromDate).toHaveBeenCalledWith(start);
    expect(Timestamp.fromDate).toHaveBeenCalledWith(end);
  });
});

describe('applyClientSideSearch', () => {
  const mockEvents = [
    { id: '1', medicationName: 'Aspirin', eventType: 'created' as const },
    { id: '2', medicationName: 'Ibuprofen', eventType: 'updated' as const },
    { id: '3', medicationName: 'Paracetamol', eventType: 'deleted' as const },
    { id: '4', medicationName: 'Acetaminophen', eventType: 'created' as const },
  ];

  /**
   * Test 10: Returns all events when no search query
   */
  it('returns all events when searchQuery is undefined', () => {
    const result = applyClientSideSearch(mockEvents, undefined);
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockEvents);
  });

  /**
   * Test 11: Returns all events when search query is empty
   */
  it('returns all events when searchQuery is empty string', () => {
    const result = applyClientSideSearch(mockEvents, '');
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockEvents);
  });

  /**
   * Test 12: Returns all events when search query is whitespace
   */
  it('returns all events when searchQuery is only whitespace', () => {
    const result = applyClientSideSearch(mockEvents, '   ');
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockEvents);
  });

  /**
   * Test 13: Case-insensitive partial match
   */
  it('performs case-insensitive partial matching', () => {
    const result = applyClientSideSearch(mockEvents, 'asp');
    expect(result).toHaveLength(1);
    expect(result[0].medicationName).toBe('Aspirin');
  });

  /**
   * Test 14: Multiple matches
   */
  it('returns multiple matches when search matches multiple medications', () => {
    const result = applyClientSideSearch(mockEvents, 'a');
    expect(result).toHaveLength(3); // Aspirin, Paracetamol, Acetaminophen
  });

  /**
   * Test 15: No matches
   */
  it('returns empty array when no medications match', () => {
    const result = applyClientSideSearch(mockEvents, 'xyz');
    expect(result).toHaveLength(0);
  });

  /**
   * Test 16: Exact match
   */
  it('returns exact match when full medication name is searched', () => {
    const result = applyClientSideSearch(mockEvents, 'Ibuprofen');
    expect(result).toHaveLength(1);
    expect(result[0].medicationName).toBe('Ibuprofen');
  });

  /**
   * Test 17: Trims whitespace from search query
   */
  it('trims whitespace from search query', () => {
    const result = applyClientSideSearch(mockEvents, '  aspirin  ');
    expect(result).toHaveLength(1);
    expect(result[0].medicationName).toBe('Aspirin');
  });

  /**
   * Test 18: Handles special characters
   */
  it('handles special characters in search query', () => {
    const eventsWithSpecialChars = [
      { id: '1', medicationName: 'Aspirin-100', eventType: 'created' as const },
      { id: '2', medicationName: 'Ibuprofen (Generic)', eventType: 'updated' as const },
    ];
    const result = applyClientSideSearch(eventsWithSpecialChars, '(generic)');
    expect(result).toHaveLength(1);
    expect(result[0].medicationName).toBe('Ibuprofen (Generic)');
  });
});

describe('validateFilterCombination', () => {
  /**
   * Test 19: All filter combinations are valid
   */
  it('validates all filter combinations as valid', () => {
    const filters: EventFilters = {
      patientId: 'patient-123',
      eventType: 'created',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
      searchQuery: 'Aspirin',
    };

    const result = validateFilterCombination(filters);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  /**
   * Test 20: Empty filters are valid
   */
  it('validates empty filters as valid', () => {
    const filters: EventFilters = {};
    const result = validateFilterCombination(filters);
    expect(result.valid).toBe(true);
  });

  /**
   * Test 21: Date range only is valid
   */
  it('validates date range only as valid', () => {
    const filters: EventFilters = {
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    };
    const result = validateFilterCombination(filters);
    expect(result.valid).toBe(true);
  });
});

describe('getRequiredIndexConfig', () => {
  /**
   * Test 22: Index config for no filters
   */
  it('returns basic index config when no filters provided', () => {
    const filters: EventFilters = {};
    const config = getRequiredIndexConfig(filters);

    expect(config.collectionGroup).toBe('medicationEvents');
    expect(config.queryScope).toBe('COLLECTION');
    expect(config.fields).toHaveLength(2); // caregiverId, timestamp
    expect(config.fields[0]).toMatchObject({
      fieldPath: 'caregiverId',
      order: 'ASCENDING',
    });
    expect(config.fields[1]).toMatchObject({
      fieldPath: 'timestamp',
      order: 'DESCENDING',
    });
  });

  /**
   * Test 23: Index config with patient filter
   */
  it('includes patientId in index config when patient filter is active', () => {
    const filters: EventFilters = {
      patientId: 'patient-123',
    };
    const config = getRequiredIndexConfig(filters);

    expect(config.fields).toHaveLength(3);
    expect(config.fields[1]).toMatchObject({
      fieldPath: 'patientId',
      order: 'ASCENDING',
    });
  });

  /**
   * Test 24: Index config with event type filter
   */
  it('includes eventType in index config when event type filter is active', () => {
    const filters: EventFilters = {
      eventType: 'created',
    };
    const config = getRequiredIndexConfig(filters);

    expect(config.fields).toHaveLength(3);
    expect(config.fields[1]).toMatchObject({
      fieldPath: 'eventType',
      order: 'ASCENDING',
    });
  });

  /**
   * Test 25: Index config with all filters
   */
  it('includes all fields in index config when all filters are active', () => {
    const filters: EventFilters = {
      patientId: 'patient-123',
      eventType: 'updated',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    };
    const config = getRequiredIndexConfig(filters);

    expect(config.fields).toHaveLength(4);
    expect(config.fields[0].fieldPath).toBe('caregiverId');
    expect(config.fields[1].fieldPath).toBe('patientId');
    expect(config.fields[2].fieldPath).toBe('eventType');
    expect(config.fields[3].fieldPath).toBe('timestamp');
  });

  /**
   * Test 26: Timestamp always has DESCENDING order
   */
  it('always sets timestamp order to DESCENDING', () => {
    const filters: EventFilters = {
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    };
    const config = getRequiredIndexConfig(filters);

    const timestampField = config.fields.find(f => f.fieldPath === 'timestamp');
    expect(timestampField?.order).toBe('DESCENDING');
  });
});

describe('formatFilterSummary', () => {
  /**
   * Test 27: Summary with no filters
   */
  it('returns "Sin filtros" when no filters are active', () => {
    const filters: EventFilters = {};
    const summary = formatFilterSummary(filters);
    expect(summary).toBe('Sin filtros');
  });

  /**
   * Test 28: Summary with patient filter
   */
  it('includes patient name in summary', () => {
    const filters: EventFilters = {
      patientId: 'patient-123',
    };
    const summary = formatFilterSummary(filters, 'John Doe');
    expect(summary).toContain('Paciente: John Doe');
  });

  /**
   * Test 29: Summary with event type filter
   */
  it('includes event type in summary', () => {
    const filters: EventFilters = {
      eventType: 'created',
    };
    const summary = formatFilterSummary(filters);
    expect(summary).toContain('Tipo: Creados');
  });

  /**
   * Test 30: Summary with date range filter
   */
  it('includes date range in summary', () => {
    const filters: EventFilters = {
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    };
    const summary = formatFilterSummary(filters);
    expect(summary).toContain('Fecha:');
  });

  /**
   * Test 31: Summary with search query
   */
  it('includes search query in summary', () => {
    const filters: EventFilters = {
      searchQuery: 'Aspirin',
    };
    const summary = formatFilterSummary(filters);
    expect(summary).toContain('Búsqueda: "Aspirin"');
  });

  /**
   * Test 32: Summary with multiple filters
   */
  it('combines multiple filters with bullet separator', () => {
    const filters: EventFilters = {
      patientId: 'patient-123',
      eventType: 'updated',
      searchQuery: 'Medication',
    };
    const summary = formatFilterSummary(filters, 'Jane Smith');
    
    expect(summary).toContain('Paciente: Jane Smith');
    expect(summary).toContain('Tipo: Actualizados');
    expect(summary).toContain('Búsqueda: "Medication"');
    expect(summary).toContain(' • ');
  });

  /**
   * Test 33: Event type labels are correct
   */
  it('uses correct Spanish labels for event types', () => {
    const createdSummary = formatFilterSummary({ eventType: 'created' });
    expect(createdSummary).toContain('Creados');

    const updatedSummary = formatFilterSummary({ eventType: 'updated' });
    expect(updatedSummary).toContain('Actualizados');

    const deletedSummary = formatFilterSummary({ eventType: 'deleted' });
    expect(deletedSummary).toContain('Eliminados');
  });

  /**
   * Test 34: Handles missing patient name gracefully
   */
  it('handles missing patient name when patientId is provided', () => {
    const filters: EventFilters = {
      patientId: 'patient-123',
    };
    const summary = formatFilterSummary(filters); // No patient name provided
    expect(summary).toBe('Sin filtros'); // Should not include patient filter without name
  });
});

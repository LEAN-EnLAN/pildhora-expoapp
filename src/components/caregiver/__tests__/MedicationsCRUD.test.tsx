/**
 * Medications CRUD Operations Unit Tests
 * 
 * Tests for medication Create, Read, Update, Delete operations
 * and event generation for caregivers
 * 
 * Run tests with: npm test
 */

import { 
  generateMedicationCreatedEvent,
  generateMedicationUpdatedEvent,
  generateMedicationDeletedEvent,
  createAndEnqueueEvent,
  medicationEventService,
} from '../../../services/medicationEventService';
import { Medication } from '../../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase
jest.mock('../../../services/firebase', () => ({
  getDbInstance: jest.fn(() => Promise.resolve({
    collection: jest.fn(),
  })),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'event-123' })),
  Timestamp: {
    fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000 })),
  },
}));

describe('Medication Event Generation', () => {
  const mockMedication: Medication = {
    id: 'med-123',
    name: 'Aspirin',
    doseValue: 100,
    doseUnit: 'mg',
    quantityType: 'pill',
    frequency: 'daily',
    times: ['08:00', '20:00'],
    patientId: 'patient-456',
    caregiverId: 'caregiver-789',
    emoji: '💊',
    trackInventory: true,
    currentQuantity: 50,
    lowQuantityThreshold: 10,
  };

  const patientName = 'John Doe';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: Generate medication created event
   */
  it('generates correct medication created event', () => {
    const event = generateMedicationCreatedEvent(mockMedication, patientName);

    expect(event.eventType).toBe('created');
    expect(event.medicationId).toBe('med-123');
    expect(event.medicationName).toBe('Aspirin');
    expect(event.patientId).toBe('patient-456');
    expect(event.patientName).toBe('John Doe');
    expect(event.caregiverId).toBe('caregiver-789');
    expect(event.syncStatus).toBe('pending');
    expect(event.medicationData).toEqual(mockMedication);
  });

  /**
   * Test 2: Generate medication updated event with changes
   */
  it('generates medication updated event with tracked changes', () => {
    const oldMedication = { ...mockMedication };
    const newMedication = {
      ...mockMedication,
      doseValue: 200,
      times: ['09:00', '21:00'],
      currentQuantity: 45,
    };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    expect(event.eventType).toBe('updated');
    expect(event.medicationId).toBe('med-123');
    expect(event.medicationName).toBe('Aspirin');
    expect(event.changes).toBeDefined();
    expect(event.changes?.length).toBeGreaterThan(0);

    // Check specific changes
    const doseChange = event.changes?.find(c => c.field === 'doseValue');
    expect(doseChange).toBeDefined();
    expect(doseChange?.oldValue).toBe(100);
    expect(doseChange?.newValue).toBe(200);

    const timesChange = event.changes?.find(c => c.field === 'times');
    expect(timesChange).toBeDefined();
    expect(timesChange?.oldValue).toEqual(['08:00', '20:00']);
    expect(timesChange?.newValue).toEqual(['09:00', '21:00']);
  });

  /**
   * Test 3: Generate medication updated event with no changes
   */
  it('generates medication updated event with no changes when medications are identical', () => {
    const oldMedication = { ...mockMedication };
    const newMedication = { ...mockMedication };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    expect(event.eventType).toBe('updated');
    expect(event.changes).toBeUndefined();
  });

  /**
   * Test 4: Generate medication deleted event
   */
  it('generates correct medication deleted event', () => {
    const event = generateMedicationDeletedEvent(mockMedication, patientName);

    expect(event.eventType).toBe('deleted');
    expect(event.medicationId).toBe('med-123');
    expect(event.medicationName).toBe('Aspirin');
    expect(event.patientId).toBe('patient-456');
    expect(event.patientName).toBe('John Doe');
    expect(event.caregiverId).toBe('caregiver-789');
    expect(event.syncStatus).toBe('pending');
    expect(event.medicationData).toEqual(mockMedication);
  });

  /**
   * Test 5: Track name change in update event
   */
  it('tracks medication name change in update event', () => {
    const oldMedication = { ...mockMedication };
    const newMedication = { ...mockMedication, name: 'Aspirin 100mg' };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    const nameChange = event.changes?.find(c => c.field === 'name');
    expect(nameChange).toBeDefined();
    expect(nameChange?.oldValue).toBe('Aspirin');
    expect(nameChange?.newValue).toBe('Aspirin 100mg');
  });

  /**
   * Test 6: Track frequency change in update event
   */
  it('tracks frequency change in update event', () => {
    const oldMedication = { ...mockMedication };
    const newMedication = { ...mockMedication, frequency: 'twice-daily' };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    const frequencyChange = event.changes?.find(c => c.field === 'frequency');
    expect(frequencyChange).toBeDefined();
    expect(frequencyChange?.oldValue).toBe('daily');
    expect(frequencyChange?.newValue).toBe('twice-daily');
  });

  /**
   * Test 7: Track inventory settings change
   */
  it('tracks inventory tracking changes in update event', () => {
    const oldMedication = { ...mockMedication, trackInventory: false };
    const newMedication = { ...mockMedication, trackInventory: true };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    const trackInventoryChange = event.changes?.find(c => c.field === 'trackInventory');
    expect(trackInventoryChange).toBeDefined();
    expect(trackInventoryChange?.oldValue).toBe(false);
    expect(trackInventoryChange?.newValue).toBe(true);
  });

  /**
   * Test 8: Track emoji change
   */
  it('tracks emoji change in update event', () => {
    const oldMedication = { ...mockMedication, emoji: '💊' };
    const newMedication = { ...mockMedication, emoji: '💉' };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    const emojiChange = event.changes?.find(c => c.field === 'emoji');
    expect(emojiChange).toBeDefined();
    expect(emojiChange?.oldValue).toBe('💊');
    expect(emojiChange?.newValue).toBe('💉');
  });

  /**
   * Test 9: Track quantity type change
   */
  it('tracks quantity type change in update event', () => {
    const oldMedication = { ...mockMedication, quantityType: 'pill' };
    const newMedication = { ...mockMedication, quantityType: 'liquid' };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    const quantityTypeChange = event.changes?.find(c => c.field === 'quantityType');
    expect(quantityTypeChange).toBeDefined();
    expect(quantityTypeChange?.oldValue).toBe('pill');
    expect(quantityTypeChange?.newValue).toBe('liquid');
  });

  /**
   * Test 10: Track multiple changes simultaneously
   */
  it('tracks multiple changes in a single update event', () => {
    const oldMedication = { ...mockMedication };
    const newMedication = {
      ...mockMedication,
      doseValue: 200,
      doseUnit: 'g',
      frequency: 'twice-daily',
      currentQuantity: 30,
    };

    const event = generateMedicationUpdatedEvent(oldMedication, newMedication, patientName);

    expect(event.changes?.length).toBe(4);
    expect(event.changes?.some(c => c.field === 'doseValue')).toBe(true);
    expect(event.changes?.some(c => c.field === 'doseUnit')).toBe(true);
    expect(event.changes?.some(c => c.field === 'frequency')).toBe(true);
    expect(event.changes?.some(c => c.field === 'currentQuantity')).toBe(true);
  });
});

describe('createAndEnqueueEvent', () => {
  const mockMedication: Medication = {
    id: 'med-123',
    name: 'Aspirin',
    doseValue: 100,
    doseUnit: 'mg',
    quantityType: 'pill',
    frequency: 'daily',
    times: ['08:00'],
    patientId: 'patient-456',
    caregiverId: 'caregiver-789',
    emoji: '💊',
  };

  const patientName = 'John Doe';

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the event queue
    medicationEventService.clearQueue();
  });

  /**
   * Test 11: Create and enqueue created event
   */
  it('creates and enqueues medication created event', async () => {
    await createAndEnqueueEvent(mockMedication, patientName, 'created');

    const pendingCount = await medicationEventService.getPendingCount();
    expect(pendingCount).toBe(1);

    const events = await medicationEventService.getAllEvents();
    expect(events[0].eventType).toBe('created');
    expect(events[0].medicationName).toBe('Aspirin');
  });

  /**
   * Test 12: Create and enqueue updated event
   */
  it('creates and enqueues medication updated event', async () => {
    const newMedication = { ...mockMedication, doseValue: 200 };

    await createAndEnqueueEvent(mockMedication, patientName, 'updated', newMedication);

    const pendingCount = await medicationEventService.getPendingCount();
    expect(pendingCount).toBe(1);

    const events = await medicationEventService.getAllEvents();
    expect(events[0].eventType).toBe('updated');
    expect(events[0].changes).toBeDefined();
  });

  /**
   * Test 13: Create and enqueue deleted event
   */
  it('creates and enqueues medication deleted event', async () => {
    await createAndEnqueueEvent(mockMedication, patientName, 'deleted');

    const pendingCount = await medicationEventService.getPendingCount();
    expect(pendingCount).toBe(1);

    const events = await medicationEventService.getAllEvents();
    expect(events[0].eventType).toBe('deleted');
  });

  /**
   * Test 14: Throws error for update without new medication
   */
  it('throws error when creating update event without new medication data', async () => {
    await expect(
      createAndEnqueueEvent(mockMedication, patientName, 'updated')
    ).rejects.toThrow('newMedication is required for update events');
  });

  /**
   * Test 15: Skips event creation when no caregiver assigned
   */
  it('skips event creation when medication has no caregiver', async () => {
    const medicationWithoutCaregiver = { ...mockMedication, caregiverId: undefined };

    await createAndEnqueueEvent(medicationWithoutCaregiver, patientName, 'created');

    const pendingCount = await medicationEventService.getPendingCount();
    expect(pendingCount).toBe(0);
  });

  /**
   * Test 16: Multiple events can be enqueued
   */
  it('enqueues multiple events correctly', async () => {
    await createAndEnqueueEvent(mockMedication, patientName, 'created');
    
    const newMedication = { ...mockMedication, doseValue: 200 };
    await createAndEnqueueEvent(mockMedication, patientName, 'updated', newMedication);
    
    await createAndEnqueueEvent(mockMedication, patientName, 'deleted');

    const pendingCount = await medicationEventService.getPendingCount();
    expect(pendingCount).toBe(3);

    const events = await medicationEventService.getAllEvents();
    expect(events[0].eventType).toBe('created');
    expect(events[1].eventType).toBe('updated');
    expect(events[2].eventType).toBe('deleted');
  });

  /**
   * Test 17: Events have unique IDs
   */
  it('generates unique IDs for each event', async () => {
    await createAndEnqueueEvent(mockMedication, patientName, 'created');
    await createAndEnqueueEvent(mockMedication, patientName, 'created');

    const events = await medicationEventService.getAllEvents();
    expect(events[0].id).not.toBe(events[1].id);
  });

  /**
   * Test 18: Events have timestamps
   */
  it('adds timestamps to enqueued events', async () => {
    await createAndEnqueueEvent(mockMedication, patientName, 'created');

    const events = await medicationEventService.getAllEvents();
    expect(events[0].timestamp).toBeDefined();
    expect(typeof events[0].timestamp).toBe('string');
  });

  /**
   * Test 19: Events are marked as pending
   */
  it('marks enqueued events as pending', async () => {
    await createAndEnqueueEvent(mockMedication, patientName, 'created');

    const events = await medicationEventService.getAllEvents();
    expect(events[0].syncStatus).toBe('pending');
  });

  /**
   * Test 20: Event includes complete medication data
   */
  it('includes complete medication data in event', async () => {
    await createAndEnqueueEvent(mockMedication, patientName, 'created');

    const events = await medicationEventService.getAllEvents();
    expect(events[0].medicationData).toEqual(mockMedication);
  });
});

describe('MedicationEventService Queue Management', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await medicationEventService.clearQueue();
  });

  /**
   * Test 21: Get pending count returns correct value
   */
  it('returns correct pending event count', async () => {
    const mockMedication: Medication = {
      id: 'med-123',
      name: 'Aspirin',
      doseValue: 100,
      doseUnit: 'mg',
      quantityType: 'pill',
      frequency: 'daily',
      times: ['08:00'],
      patientId: 'patient-456',
      caregiverId: 'caregiver-789',
      emoji: '💊',
    };

    await createAndEnqueueEvent(mockMedication, 'John Doe', 'created');
    await createAndEnqueueEvent(mockMedication, 'John Doe', 'created');

    const count = await medicationEventService.getPendingCount();
    expect(count).toBe(2);
  });

  /**
   * Test 22: Clear queue removes all events
   */
  it('clears all events from queue', async () => {
    const mockMedication: Medication = {
      id: 'med-123',
      name: 'Aspirin',
      doseValue: 100,
      doseUnit: 'mg',
      quantityType: 'pill',
      frequency: 'daily',
      times: ['08:00'],
      patientId: 'patient-456',
      caregiverId: 'caregiver-789',
      emoji: '💊',
    };

    await createAndEnqueueEvent(mockMedication, 'John Doe', 'created');
    await createAndEnqueueEvent(mockMedication, 'John Doe', 'created');

    await medicationEventService.clearQueue();

    const count = await medicationEventService.getPendingCount();
    expect(count).toBe(0);
  });

  /**
   * Test 23: Get all events returns array
   */
  it('returns all events as array', async () => {
    const mockMedication: Medication = {
      id: 'med-123',
      name: 'Aspirin',
      doseValue: 100,
      doseUnit: 'mg',
      quantityType: 'pill',
      frequency: 'daily',
      times: ['08:00'],
      patientId: 'patient-456',
      caregiverId: 'caregiver-789',
      emoji: '💊',
    };

    await createAndEnqueueEvent(mockMedication, 'John Doe', 'created');

    const events = await medicationEventService.getAllEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(1);
  });

  /**
   * Test 24: Sync status tracking
   */
  it('tracks sync status correctly', async () => {
    const mockMedication: Medication = {
      id: 'med-123',
      name: 'Aspirin',
      doseValue: 100,
      doseUnit: 'mg',
      quantityType: 'pill',
      frequency: 'daily',
      times: ['08:00'],
      patientId: 'patient-456',
      caregiverId: 'caregiver-789',
      emoji: '💊',
    };

    await createAndEnqueueEvent(mockMedication, 'John Doe', 'created');

    const events = await medicationEventService.getAllEvents();
    expect(events[0].syncStatus).toBe('pending');
  });

  /**
   * Test 25: Event queue persists data
   */
  it('persists event queue to storage', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    
    const mockMedication: Medication = {
      id: 'med-123',
      name: 'Aspirin',
      doseValue: 100,
      doseUnit: 'mg',
      quantityType: 'pill',
      frequency: 'daily',
      times: ['08:00'],
      patientId: 'patient-456',
      caregiverId: 'caregiver-789',
      emoji: '💊',
    };

    await createAndEnqueueEvent(mockMedication, 'John Doe', 'created');

    // Verify AsyncStorage.setItem was called
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});


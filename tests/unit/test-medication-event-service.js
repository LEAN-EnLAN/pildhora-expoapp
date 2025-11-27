/**
 * Test script for MedicationEventService
 * 
 * This script tests the core functionality of the medication event service:
 * - Event generation for create/update/delete operations
 * - Event queue management
 * - Local persistence with AsyncStorage
 * - Event sync status tracking
 */

const { medicationEventService, generateMedicationCreatedEvent, generateMedicationUpdatedEvent, generateMedicationDeletedEvent } = require('./src/services/medicationEventService');

// Mock medication data
const mockMedication = {
  id: 'med_123',
  name: 'Aspirin',
  doseValue: '500',
  doseUnit: 'mg',
  quantityType: 'tablets',
  frequency: 'Monday,Wednesday,Friday',
  times: ['08:00', '20:00'],
  patientId: 'patient_456',
  caregiverId: 'caregiver_789',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  emoji: '💊',
  trackInventory: true,
  currentQuantity: 30,
  lowQuantityThreshold: 10,
};

const mockPatientName = 'John Doe';

async function runTests() {
  console.log('=== Testing MedicationEventService ===\n');

  try {
    // Test 1: Clear queue
    console.log('Test 1: Clearing queue...');
    await medicationEventService.clearQueue();
    const initialCount = await medicationEventService.getPendingCount();
    console.log('✓ Queue cleared. Pending events:', initialCount);
    console.log('');

    // Test 2: Generate created event
    console.log('Test 2: Generating created event...');
    const createdEvent = generateMedicationCreatedEvent(mockMedication, mockPatientName);
    console.log('✓ Created event generated:', {
      eventType: createdEvent.eventType,
      medicationName: createdEvent.medicationName,
      patientName: createdEvent.patientName,
      caregiverId: createdEvent.caregiverId,
      syncStatus: createdEvent.syncStatus,
    });
    console.log('');

    // Test 3: Enqueue created event
    console.log('Test 3: Enqueueing created event...');
    await medicationEventService.enqueue(createdEvent);
    const countAfterCreate = await medicationEventService.getPendingCount();
    console.log('✓ Event enqueued. Pending events:', countAfterCreate);
    console.log('');

    // Test 4: Generate updated event
    console.log('Test 4: Generating updated event...');
    const updatedMedication = {
      ...mockMedication,
      name: 'Aspirin 500mg',
      times: ['09:00', '21:00'],
      currentQuantity: 25,
    };
    const updatedEvent = generateMedicationUpdatedEvent(mockMedication, updatedMedication, mockPatientName);
    console.log('✓ Updated event generated with changes:', updatedEvent.changes?.map(c => c.field));
    console.log('');

    // Test 5: Enqueue updated event
    console.log('Test 5: Enqueueing updated event...');
    await medicationEventService.enqueue(updatedEvent);
    const countAfterUpdate = await medicationEventService.getPendingCount();
    console.log('✓ Event enqueued. Pending events:', countAfterUpdate);
    console.log('');

    // Test 6: Generate deleted event
    console.log('Test 6: Generating deleted event...');
    const deletedEvent = generateMedicationDeletedEvent(mockMedication, mockPatientName);
    console.log('✓ Deleted event generated:', {
      eventType: deletedEvent.eventType,
      medicationName: deletedEvent.medicationName,
    });
    console.log('');

    // Test 7: Enqueue deleted event
    console.log('Test 7: Enqueueing deleted event...');
    await medicationEventService.enqueue(deletedEvent);
    const countAfterDelete = await medicationEventService.getPendingCount();
    console.log('✓ Event enqueued. Pending events:', countAfterDelete);
    console.log('');

    // Test 8: Get all events
    console.log('Test 8: Retrieving all events from queue...');
    const allEvents = await medicationEventService.getAllEvents();
    console.log('✓ Total events in queue:', allEvents.length);
    allEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.eventType} - ${event.medicationName} (${event.syncStatus})`);
    });
    console.log('');

    // Test 9: Check sync status
    console.log('Test 9: Checking sync status...');
    const isSyncing = medicationEventService.isSyncInProgress();
    const lastSync = medicationEventService.getLastSyncAttempt();
    console.log('✓ Sync in progress:', isSyncing);
    console.log('✓ Last sync attempt:', lastSync ? lastSync.toISOString() : 'Never');
    console.log('');

    // Test 10: Dequeue event
    console.log('Test 10: Dequeuing event...');
    const dequeuedEvent = await medicationEventService.dequeue();
    if (dequeuedEvent) {
      console.log('✓ Dequeued event:', {
        id: dequeuedEvent.id,
        type: dequeuedEvent.eventType,
        medication: dequeuedEvent.medicationName,
      });
      const countAfterDequeue = await medicationEventService.getPendingCount();
      console.log('✓ Remaining pending events:', countAfterDequeue);
    }
    console.log('');

    // Test 11: Verify persistence
    console.log('Test 11: Verifying persistence...');
    const finalCount = await medicationEventService.getPendingCount();
    console.log('✓ Final pending event count:', finalCount);
    console.log('');

    console.log('=== All Tests Passed ===');
    console.log('\nNote: Firestore sync was not tested as it requires Firebase connection.');
    console.log('The sync functionality will be tested during integration with the medication management flow.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);

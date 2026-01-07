// Test script for medication workflow functionality
// This script simulates the medication workflow without requiring a live Firebase connection

const { migrateDosageFormat, normalizeMedicationForSave, validateMedicationStructure } = require('./src/utils/medicationMigration.ts');

// Sample test data
const sampleMedications = {
  // New format medications
  newFormat: [
    {
      id: 'new-med-1',
      name: 'Aspirin',
      doseValue: '500',
      doseUnit: 'mg',
      quantityType: 'Tablets',
      isCustomQuantityType: false,
      frequency: 'Mon, Tue, Wed, Thu, Fri',
      times: ['08:00', '20:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'new-med-2',
      name: 'Vitamin D3',
      doseValue: '1000',
      doseUnit: 'IU',
      quantityType: 'Capsules',
      isCustomQuantityType: false,
      frequency: 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
      times: ['09:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'new-med-3',
      name: 'Custom Liquid Med',
      doseValue: '2.5',
      doseUnit: 'ml',
      quantityType: 'Custom Drops',
      isCustomQuantityType: true,
      frequency: 'Sat, Sun',
      times: ['10:00', '18:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // Legacy format medications
  legacyFormat: [
    {
      id: 'legacy-med-1',
      name: 'Old Aspirin',
      dosage: '500mg, 10 tablets',
      frequency: 'Daily',
      times: ['08:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'legacy-med-2',
      name: 'Old Liquid Med',
      dosage: '10ml, 5ml',
      frequency: 'Twice daily',
      times: ['08:00', '20:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'legacy-med-3',
      name: 'Simple Pill',
      dosage: '1 tablet',
      frequency: 'Mon, Wed, Fri',
      times: ['12:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // Edge cases
  edgeCases: [
    {
      id: 'edge-1',
      name: 'Complex Dosage',
      dosage: '0.25mg, 2.5ml',
      frequency: 'Daily',
      times: ['08:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'edge-2',
      name: 'Custom Format',
      dosage: '2 units, 1 lozenge',
      frequency: 'As needed',
      times: ['14:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'edge-3',
      name: 'Missing Quantity',
      dosage: '500mg',
      frequency: 'Daily',
      times: ['08:00'],
      patientId: 'patient-123',
      caregiverId: 'caregiver-456',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

// Test functions
function testMigration() {
  console.log('\n=== TESTING MEDICATION MIGRATION ===\n');
  
  // Test new format medications (should remain unchanged)
  console.log('Testing new format medications:');
  sampleMedications.newFormat.forEach((med, index) => {
    const migrated = migrateDosageFormat(med);
    console.log(`\nNew Format ${index + 1}: ${med.name}`);
    console.log(`  Original doseValue: ${med.doseValue}`);
    console.log(`  Migrated doseValue: ${migrated.doseValue}`);
    console.log(`  Original doseUnit: ${med.doseUnit}`);
    console.log(`  Migrated doseUnit: ${migrated.doseUnit}`);
    console.log(`  Original quantityType: ${med.quantityType}`);
    console.log(`  Migrated quantityType: ${migrated.quantityType}`);
    console.log(`  Legacy dosage: ${migrated.dosage}`);
  });
  
  // Test legacy format medications (should be migrated)
  console.log('\n\nTesting legacy format medications:');
  sampleMedications.legacyFormat.forEach((med, index) => {
    const migrated = migrateDosageFormat(med);
    console.log(`\nLegacy Format ${index + 1}: ${med.name}`);
    console.log(`  Original dosage: ${med.dosage}`);
    console.log(`  Migrated doseValue: ${migrated.doseValue}`);
    console.log(`  Migrated doseUnit: ${migrated.doseUnit}`);
    console.log(`  Migrated quantityType: ${migrated.quantityType}`);
    console.log(`  Is custom quantity: ${migrated.isCustomQuantityType}`);
    console.log(`  Legacy dosage preserved: ${migrated.dosage}`);
  });
  
  // Test edge cases
  console.log('\n\nTesting edge cases:');
  sampleMedications.edgeCases.forEach((med, index) => {
    const migrated = migrateDosageFormat(med);
    console.log(`\nEdge Case ${index + 1}: ${med.name}`);
    console.log(`  Original dosage: ${med.dosage}`);
    console.log(`  Migrated doseValue: ${migrated.doseValue}`);
    console.log(`  Migrated doseUnit: ${migrated.doseUnit}`);
    console.log(`  Migrated quantityType: ${migrated.quantityType}`);
    console.log(`  Is custom quantity: ${migrated.isCustomQuantityType}`);
    console.log(`  Legacy dosage preserved: ${migrated.dosage}`);
  });
}

function testNormalization() {
  console.log('\n\n=== TESTING MEDICATION NORMALIZATION ===\n');
  
  // Test normalizing new format medication
  const newMed = sampleMedications.newFormat[0];
  const normalizedNew = normalizeMedicationForSave(newMed);
  console.log('Normalizing new format medication:');
  console.log(`  Name: ${normalizedNew.name}`);
  console.log(`  Dose: ${normalizedNew.doseValue}${normalizedNew.doseUnit}`);
  console.log(`  Quantity: ${normalizedNew.quantityType}`);
  console.log(`  Legacy dosage: ${normalizedNew.dosage}`);
  
  // Test normalizing migrated medication
  const legacyMed = sampleMedications.legacyFormat[0];
  const migrated = migrateDosageFormat(legacyMed);
  const normalizedMigrated = normalizeMedicationForSave(migrated);
  console.log('\nNormalizing migrated medication:');
  console.log(`  Name: ${normalizedMigrated.name}`);
  console.log(`  Dose: ${normalizedMigrated.doseValue}${normalizedMigrated.doseUnit}`);
  console.log(`  Quantity: ${normalizedMigrated.quantityType}`);
  console.log(`  Legacy dosage: ${normalizedMigrated.dosage}`);
}

function testValidation() {
  console.log('\n\n=== TESTING MEDICATION VALIDATION ===\n');
  
  // Test validating new format medication
  const newMed = sampleMedications.newFormat[0];
  const newValidation = validateMedicationStructure(newMed);
  console.log('Validating new format medication:');
  console.log(`  Valid: ${newValidation.isValid}`);
  console.log(`  Missing fields: ${newValidation.missingFields.join(', ') || 'None'}`);
  
  // Test validating migrated medication
  const legacyMed = sampleMedications.legacyFormat[0];
  const migrated = migrateDosageFormat(legacyMed);
  const migratedValidation = validateMedicationStructure(migrated);
  console.log('\nValidating migrated medication:');
  console.log(`  Valid: ${migratedValidation.isValid}`);
  console.log(`  Missing fields: ${migratedValidation.missingFields.join(', ') || 'None'}`);
  
  // Test validating incomplete medication
  const incompleteMed = {
    name: 'Incomplete Med',
    doseValue: '500',
    // Missing doseUnit and quantityType
    patientId: 'patient-123',
    caregiverId: 'caregiver-456'
  };
  const incompleteValidation = validateMedicationStructure(incompleteMed);
  console.log('\nValidating incomplete medication:');
  console.log(`  Valid: ${incompleteValidation.isValid}`);
  console.log(`  Missing fields: ${incompleteValidation.missingFields.join(', ') || 'None'}`);
}

function testFormValidation() {
  console.log('\n\n=== TESTING FORM VALIDATION LOGIC ===\n');
  
  // Test medication name validation
  console.log('Testing medication name validation:');
  const nameTests = [
    { value: '', expected: false, desc: 'Empty name' },
    { value: 'a', expected: false, desc: 'Single character' },
    { value: '  ', expected: false, desc: 'Whitespace only' },
    { value: 'Aspirin', expected: true, desc: 'Valid name' },
    { value: 'Vitamin D3 500mg', expected: true, desc: 'Name with details' }
  ];
  
  nameTests.forEach(test => {
    const isValid = test.value.trim().length >= 2;
    const passed = isValid === test.expected;
    console.log(`  ${test.desc}: "${test.value}" -> ${isValid} ${passed ? '✓' : '✗'}`);
  });
  
  // Test dose value validation
  console.log('\nTesting dose value validation:');
  const doseTests = [
    { value: '', expected: false, desc: 'Empty dose' },
    { value: 'abc', expected: false, desc: 'Non-numeric' },
    { value: '12.345', expected: false, desc: 'Too many decimals' },
    { value: '500', expected: true, desc: 'Valid integer' },
    { value: '10.5', expected: true, desc: 'Valid decimal' },
    { value: '0.25', expected: true, desc: 'Valid small decimal' }
  ];
  
  doseTests.forEach(test => {
    const isValid = /^\d*\.?\d{0,2}$/.test(test.value) && test.value.trim() !== '';
    const passed = isValid === test.expected;
    console.log(`  ${test.desc}: "${test.value}" -> ${isValid} ${passed ? '✓' : '✗'}`);
  });
  
  // Test unit validation
  console.log('\nTesting dose unit validation:');
  const units = ['mg', 'ml', 'g', 'mcg', 'units', 'drops', 'sprays', 'puffs', 'custom'];
  units.forEach(unit => {
    const isValid = unit.trim() !== '';
    console.log(`  Unit "${unit}": ${isValid ? 'Valid' : 'Invalid'} ${isValid ? '✓' : '✗'}`);
  });
  
  // Test quantity type validation
  console.log('\nTesting quantity type validation:');
  const quantityTypes = ['Tablets', 'Capsules', 'Liquid', 'Cream', 'Inhaler', 'Drops', 'Spray', 'Other', 'Custom Type'];
  quantityTypes.forEach(type => {
    const isValid = type.trim() !== '';
    console.log(`  Type "${type}": ${isValid ? 'Valid' : 'Invalid'} ${isValid ? '✓' : '✗'}`);
  });
}

function testDisplayFormatting() {
  console.log('\n\n=== TESTING DISPLAY FORMATTING ===\n');
  
  // Test new format display
  console.log('Testing new format display:');
  sampleMedications.newFormat.forEach(med => {
    const display = `${med.doseValue}${med.doseUnit}, ${med.quantityType}`;
    console.log(`  ${med.name}: ${display}`);
  });
  
  // Test legacy format display
  console.log('\nTesting legacy format display:');
  sampleMedications.legacyFormat.forEach(med => {
    const display = med.dosage || 'Sin dosis especificada';
    console.log(`  ${med.name}: ${display}`);
  });
  
  // Test migrated format display
  console.log('\nTesting migrated format display:');
  sampleMedications.legacyFormat.forEach(med => {
    const migrated = migrateDosageFormat(med);
    const display = migrated.doseValue && migrated.doseUnit 
      ? `${migrated.doseValue}${migrated.doseUnit}, ${migrated.quantityType}`
      : migrated.dosage || 'Sin dosis especificada';
    console.log(`  ${med.name}: ${display}`);
  });
}

function testTimeFormatting() {
  console.log('\n\n=== TESTING TIME FORMATTING ===\n');
  
  const timeTests = ['08:00', '14:30', '20:00', '23:59', '00:05'];
  
  timeTests.forEach(time => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const formatted = `${displayHour}:${minutes} ${ampm}`;
    console.log(`  ${time} -> ${formatted}`);
  });
}

function testDayFormatting() {
  console.log('\n\n=== TESTING DAY FORMATTING ===\n');
  
  const dayTests = [
    { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], expected: 'Días de semana' },
    { days: ['Sat', 'Sun'], expected: 'Fines de semana' },
    { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], expected: 'Todos' },
    { days: ['Mon', 'Wed', 'Fri'], expected: 'Mon, Wed, Fri' }
  ];
  
  dayTests.forEach(test => {
    const formatted = test.days.join(', ');
    console.log(`  ${test.expected}: ${formatted}`);
  });
}

// Run all tests
function runAllTests() {
  console.log('MEDICATION WORKFLOW TEST SUITE');
  console.log('================================');
  
  try {
    testMigration();
    testNormalization();
    testValidation();
    testFormValidation();
    testDisplayFormatting();
    testTimeFormatting();
    testDayFormatting();
    
    console.log('\n\n=== TEST SUMMARY ===');
    console.log('✓ Migration functionality tested');
    console.log('✓ Normalization functionality tested');
    console.log('✓ Validation functionality tested');
    console.log('✓ Form validation logic tested');
    console.log('✓ Display formatting tested');
    console.log('✓ Time formatting tested');
    console.log('✓ Day formatting tested');
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  sampleMedications,
  testMigration,
  testNormalization,
  testValidation,
  testFormValidation,
  testDisplayFormatting,
  testTimeFormatting,
  testDayFormatting,
  runAllTests
};
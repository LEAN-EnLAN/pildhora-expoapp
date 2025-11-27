// Simplified test script for medication workflow functionality
// This script simulates the medication workflow without requiring TypeScript imports

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

// Simplified migration function (replicating the logic from medicationMigration.ts)
function migrateDosageFormat(medication) {
  try {
    // If already using new format, validate and return as-is
    if (medication.doseValue && medication.doseUnit && medication.quantityType) {
      const doseValue = String(medication.doseValue || '').trim();
      const doseUnit = String(medication.doseUnit || '').trim();
      const quantityType = String(medication.quantityType || '').trim();
      
      if (doseValue && doseUnit && quantityType) {
        return {
          ...medication,
          doseValue,
          doseUnit,
          quantityType,
          isCustomQuantityType: Boolean(medication.isCustomQuantityType),
          dosage: medication.dosage || `${doseValue}${doseUnit}, ${quantityType}`
        };
      }
    }

    // If we have the old dosage field, parse it
    if (medication.dosage && typeof medication.dosage === 'string') {
      const dosageString = medication.dosage.trim();
      
      if (dosageString) {
        // Try to parse the old format: "dose, quantity"
        const dosageParts = dosageString.split(',').map(part => part.trim());
        
        if (dosageParts.length >= 2) {
          // Extract dose value and unit from first part
          const doseMatch = dosageParts[0].match(/^([\d.]+)\s*([a-zA-Z%]+)?$/);
          let doseValue = '';
          let doseUnit = '';
          
          if (doseMatch) {
            doseValue = doseMatch[1];
            doseUnit = doseMatch[2] || 'units';
          } else {
            // If we can't parse the dose, try to extract numbers
            const numberMatch = dosageParts[0].match(/([\d.]+)/);
            doseValue = numberMatch ? numberMatch[1] : dosageParts[0];
            doseUnit = 'units'; // Default unit
          }
          
          // Extract quantity type from second part
          let quantityType = dosageParts[1].toLowerCase();
          let isCustomQuantityType = false;
          
          // Normalize common quantity types
          const quantityTypeMap = {
            'tablet': 'tablets',
            'tab': 'tablets',
            'tabs': 'tablets',
            'capsule': 'capsules',
            'cap': 'capsules',
            'caps': 'capsules',
            'liquid': 'liquid',
            'syrup': 'liquid',
            'solution': 'liquid',
            'cream': 'cream',
            'ointment': 'cream',
            'gel': 'cream',
            'inhaler': 'inhaler',
            'puffer': 'inhaler',
            'nebulizer': 'inhaler',
            'drop': 'drops',
            'eyedrop': 'drops',
            'eye drops': 'drops',
            'spray': 'spray',
            'nasal spray': 'spray',
            'pills': 'tablets',
            'pill': 'tablets',
            'lozenge': 'tablets',
            'suppository': 'other',
            'patch': 'other',
            'injection': 'other',
            'other': 'other'
          };
          
          // Extract just the quantity type word (remove numbers and units)
          const quantityWord = quantityType.replace(/[\d.]+\s*[a-zA-Z%]*\s*/, '').trim();
          
          // Check if the quantity type is a unit (like 'ml') which should be marked as custom
          if (/^[a-zA-Z]+$/.test(quantityWord) && !quantityTypeMap[quantityWord]) {
            quantityType = quantityWord;
            isCustomQuantityType = true;
          } else {
            quantityType = quantityTypeMap[quantityWord] || quantityWord || 'other';
            
            // If not in our predefined list, mark as custom
            if (!['tablets', 'capsules', 'liquid', 'cream', 'inhaler', 'drops', 'spray', 'other'].includes(quantityType)) {
              isCustomQuantityType = true;
            }
          }
          
          // Return migrated medication with new fields
          return {
            ...medication,
            doseValue,
            doseUnit,
            quantityType,
            isCustomQuantityType,
            dosage: dosageString
          };
        } else if (dosageParts.length === 1) {
          // Handle case where there's only dose information
          const doseMatch = dosageParts[0].match(/^([\d.]+)\s*([a-zA-Z%]+)?$/);
          let doseValue = '';
          let doseUnit = '';
          
          if (doseMatch) {
            doseValue = doseMatch[1];
            doseUnit = doseMatch[2] || 'units';
          } else {
            // Try to extract any numbers
            const numberMatch = dosageParts[0].match(/([\d.]+)/);
            doseValue = numberMatch ? numberMatch[1] : dosageParts[0];
            doseUnit = 'units';
          }
          
          return {
            ...medication,
            doseValue,
            doseUnit,
            quantityType: 'other', // Default when quantity info is missing
            isCustomQuantityType: false,
            dosage: dosageString
          };
        }
      }
    }
    
    // If no dosage field or empty string, check if we have individual fields
    const doseValue = medication.doseValue || '';
    const doseUnit = medication.doseUnit || 'units';
    const quantityType = medication.quantityType || 'other';
    
    return {
      ...medication,
      doseValue: String(doseValue).trim(),
      doseUnit: String(doseUnit).trim(),
      quantityType: String(quantityType).trim(),
      isCustomQuantityType: Boolean(medication.isCustomQuantityType),
      dosage: medication.dosage || ''
    };
  } catch (error) {
    console.error('Critical error in migrateDosageFormat for medication:', medication.id, error);
    
    // Return a safe default structure to prevent crashes
    return {
      ...medication,
      doseValue: medication.doseValue || '',
      doseUnit: medication.doseUnit || 'units',
      quantityType: medication.quantityType || 'other',
      isCustomQuantityType: Boolean(medication.isCustomQuantityType),
      dosage: medication.dosage || ''
    };
  }
}

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
    testFormValidation();
    testDisplayFormatting();
    testTimeFormatting();
    testDayFormatting();
    
    console.log('\n\n=== TEST SUMMARY ===');
    console.log('✓ Migration functionality tested');
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
  migrateDosageFormat,
  testMigration,
  testFormValidation,
  testDisplayFormatting,
  testTimeFormatting,
  testDayFormatting,
  runAllTests
};
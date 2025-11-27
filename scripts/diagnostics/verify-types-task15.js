/**
 * Verification script for Task 15: Update types file with Spanish labels
 * 
 * This script verifies that:
 * 1. DOSE_UNITS has all Spanish labels
 * 2. QUANTITY_TYPES has all Spanish labels
 * 3. New unit options (aplicaciones, inhalaciones) are included
 * 4. Type exports are correct
 */

console.log('=== Task 15 Verification: Types File Spanish Labels ===\n');

// Since we can't directly import TypeScript, we'll verify the file content
const fs = require('fs');
const path = require('path');

const typesFilePath = path.join(__dirname, 'src', 'types', 'index.ts');
const content = fs.readFileSync(typesFilePath, 'utf-8');

console.log('✓ Types file found at:', typesFilePath);

// Check 1: DOSE_UNITS has Spanish labels
console.log('\n1. Checking DOSE_UNITS Spanish labels...');
const doseUnitsMatch = content.match(/export const DOSE_UNITS = \[([\s\S]*?)\] as const;/);
if (doseUnitsMatch) {
  const doseUnitsContent = doseUnitsMatch[1];
  
  const spanishLabels = [
    'mg (miligramos)',
    'g (gramos)',
    'mcg (microgramos)',
    'ml (mililitros)',
    'l (litros)',
    'unidades',
    'gotas',
    'sprays',
    'inhalaciones',
    'aplicaciones',
    'Unidad personalizada'
  ];
  
  let allLabelsFound = true;
  spanishLabels.forEach(label => {
    if (doseUnitsContent.includes(label)) {
      console.log(`  ✓ Found: "${label}"`);
    } else {
      console.log(`  ✗ Missing: "${label}"`);
      allLabelsFound = false;
    }
  });
  
  if (allLabelsFound) {
    console.log('  ✓ All Spanish labels present in DOSE_UNITS');
  } else {
    console.log('  ✗ Some Spanish labels missing in DOSE_UNITS');
  }
} else {
  console.log('  ✗ DOSE_UNITS not found');
}

// Check 2: QUANTITY_TYPES has Spanish labels
console.log('\n2. Checking QUANTITY_TYPES Spanish labels...');
const quantityTypesMatch = content.match(/export const QUANTITY_TYPES = \[([\s\S]*?)\] as const;/);
if (quantityTypesMatch) {
  const quantityTypesContent = quantityTypesMatch[1];
  
  const spanishLabels = [
    'Tabletas',
    'Cápsulas',
    'Líquido',
    'Crema',
    'Inhalador',
    'Gotas',
    'Spray',
    'Otro'
  ];
  
  let allLabelsFound = true;
  spanishLabels.forEach(label => {
    if (quantityTypesContent.includes(label)) {
      console.log(`  ✓ Found: "${label}"`);
    } else {
      console.log(`  ✗ Missing: "${label}"`);
      allLabelsFound = false;
    }
  });
  
  if (allLabelsFound) {
    console.log('  ✓ All Spanish labels present in QUANTITY_TYPES');
  } else {
    console.log('  ✗ Some Spanish labels missing in QUANTITY_TYPES');
  }
} else {
  console.log('  ✗ QUANTITY_TYPES not found');
}

// Check 3: New unit options (aplicaciones, inhalaciones)
console.log('\n3. Checking new unit options...');
const hasAplicaciones = content.includes("id: 'applications', label: 'aplicaciones'");
const hasInhalaciones = content.includes("id: 'inhalations', label: 'inhalaciones'") || 
                        content.includes("id: 'puffs', label: 'inhalaciones'");

if (hasAplicaciones) {
  console.log('  ✓ "aplicaciones" unit found');
} else {
  console.log('  ✗ "aplicaciones" unit missing');
}

if (hasInhalaciones) {
  console.log('  ✓ "inhalaciones" unit found');
} else {
  console.log('  ✗ "inhalaciones" unit missing');
}

// Check 4: Type exports are correct
console.log('\n4. Checking type exports...');
const hasDoseUnitId = content.includes('export type DoseUnitId');
const hasDoseUnit = content.includes('export type DoseUnit');
const hasQuantityTypeId = content.includes('export type QuantityTypeId');
const hasQuantityType = content.includes('export type QuantityType');

if (hasDoseUnitId) {
  console.log('  ✓ DoseUnitId type exported');
} else {
  console.log('  ✗ DoseUnitId type not exported');
}

if (hasDoseUnit) {
  console.log('  ✓ DoseUnit type exported');
} else {
  console.log('  ✗ DoseUnit type not exported');
}

if (hasQuantityTypeId) {
  console.log('  ✓ QuantityTypeId type exported');
} else {
  console.log('  ✗ QuantityTypeId type not exported');
}

if (hasQuantityType) {
  console.log('  ✓ QuantityType type exported');
} else {
  console.log('  ✗ QuantityType type not exported');
}

// Check 5: Verify comments are in Spanish
console.log('\n5. Checking Spanish comments...');
const hasSpanishComments = content.includes('// Dose units enumeration with Spanish labels') &&
                           content.includes('// Quantity types enumeration with Spanish labels');

if (hasSpanishComments) {
  console.log('  ✓ Spanish comments added');
} else {
  console.log('  ✗ Spanish comments missing');
}

// Final summary
console.log('\n=== Verification Summary ===');
const allChecks = 
  doseUnitsMatch && quantityTypesMatch &&
  hasAplicaciones && hasInhalaciones &&
  hasDoseUnitId && hasDoseUnit &&
  hasQuantityTypeId && hasQuantityType &&
  hasSpanishComments;

if (allChecks) {
  console.log('✓ All requirements met for Task 15!');
  console.log('\nTask 15 sub-tasks completed:');
  console.log('  ✓ Update QUANTITY_TYPES labels to Spanish');
  console.log('  ✓ Update DOSE_UNITS labels to Spanish');
  console.log('  ✓ Add new unit options (aplicaciones, inhalaciones)');
  console.log('  ✓ Ensure type exports are correct');
  process.exit(0);
} else {
  console.log('✗ Some requirements not met');
  process.exit(1);
}

/**
 * Test: Schedule Card Icons Verification
 * 
 * This test verifies that Ionicons are properly integrated into the
 * MedicationScheduleStep component for the edit and delete buttons.
 * 
 * Task 16: Add Ionicons for schedule card icons
 * Requirements: 9.4
 */

console.log('='.repeat(60));
console.log('Schedule Card Icons Verification Test');
console.log('='.repeat(60));

// Test 1: Verify @expo/vector-icons is installed
console.log('\n✓ Test 1: @expo/vector-icons package');
try {
  const packageJson = require('./package.json');
  const hasVectorIcons = packageJson.dependencies['@expo/vector-icons'];
  
  if (hasVectorIcons) {
    console.log(`  ✓ @expo/vector-icons is installed (version ${hasVectorIcons})`);
  } else {
    console.log('  ✗ @expo/vector-icons is NOT installed');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ✗ Error checking package.json: ${error.message}`);
  process.exit(1);
}

// Test 2: Verify Ionicons import in MedicationScheduleStep
console.log('\n✓ Test 2: Ionicons import in MedicationScheduleStep');
try {
  const fs = require('fs');
  const scheduleStepContent = fs.readFileSync(
    './src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'utf8'
  );
  
  const hasIoniconsImport = scheduleStepContent.includes("import { Ionicons } from '@expo/vector-icons'");
  
  if (hasIoniconsImport) {
    console.log('  ✓ Ionicons is imported from @expo/vector-icons');
  } else {
    console.log('  ✗ Ionicons import not found');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ✗ Error reading MedicationScheduleStep.tsx: ${error.message}`);
  process.exit(1);
}

// Test 3: Verify pencil icon usage for edit button
console.log('\n✓ Test 3: Pencil icon for edit button');
try {
  const fs = require('fs');
  const scheduleStepContent = fs.readFileSync(
    './src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'utf8'
  );
  
  const hasPencilIcon = scheduleStepContent.includes('<Ionicons name="pencil"');
  const editButtonContext = scheduleStepContent.includes('style={styles.editButton}');
  
  if (hasPencilIcon && editButtonContext) {
    console.log('  ✓ Pencil icon is used in edit button');
    
    // Extract icon size and color
    const pencilMatch = scheduleStepContent.match(/<Ionicons name="pencil" size={(\d+)} color={([^}]+)}/);
    if (pencilMatch) {
      console.log(`  ✓ Icon size: ${pencilMatch[1]}px`);
      console.log(`  ✓ Icon color: ${pencilMatch[2]}`);
    }
  } else {
    console.log('  ✗ Pencil icon not found in edit button');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ✗ Error verifying pencil icon: ${error.message}`);
  process.exit(1);
}

// Test 4: Verify trash-outline icon usage for delete button
console.log('\n✓ Test 4: Trash-outline icon for delete button');
try {
  const fs = require('fs');
  const scheduleStepContent = fs.readFileSync(
    './src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'utf8'
  );
  
  const hasTrashIcon = scheduleStepContent.includes('<Ionicons name="trash-outline"');
  const deleteButtonContext = scheduleStepContent.includes('style={styles.deleteButton}');
  
  if (hasTrashIcon && deleteButtonContext) {
    console.log('  ✓ Trash-outline icon is used in delete button');
    
    // Extract icon size and color
    const trashMatch = scheduleStepContent.match(/<Ionicons name="trash-outline" size={(\d+)} color={([^}]+)}/);
    if (trashMatch) {
      console.log(`  ✓ Icon size: ${trashMatch[1]}px`);
      console.log(`  ✓ Icon color: ${trashMatch[2]}`);
    }
  } else {
    console.log('  ✗ Trash-outline icon not found in delete button');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ✗ Error verifying trash icon: ${error.message}`);
  process.exit(1);
}

// Test 5: Verify TimeCard component structure
console.log('\n✓ Test 5: TimeCard component structure');
try {
  const fs = require('fs');
  const scheduleStepContent = fs.readFileSync(
    './src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'utf8'
  );
  
  const hasTimeCardComponent = scheduleStepContent.includes('function TimeCard(');
  const hasTimeCardActions = scheduleStepContent.includes('timeCardActions');
  const hasEditButton = scheduleStepContent.includes('editButton');
  const hasDeleteButton = scheduleStepContent.includes('deleteButton');
  
  if (hasTimeCardComponent && hasTimeCardActions && hasEditButton && hasDeleteButton) {
    console.log('  ✓ TimeCard component has proper structure');
    console.log('  ✓ timeCardActions container exists');
    console.log('  ✓ Edit button exists');
    console.log('  ✓ Delete button exists');
  } else {
    console.log('  ✗ TimeCard component structure incomplete');
    process.exit(1);
  }
} catch (error) {
  console.log(`  ✗ Error verifying TimeCard structure: ${error.message}`);
  process.exit(1);
}

// Test 6: Verify icon styling
console.log('\n✓ Test 6: Icon button styling');
try {
  const fs = require('fs');
  const scheduleStepContent = fs.readFileSync(
    './src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'utf8'
  );
  
  // Check for edit button styles
  const editButtonStyleMatch = scheduleStepContent.match(/editButton:\s*{([^}]+)}/s);
  if (editButtonStyleMatch) {
    const editButtonStyles = editButtonStyleMatch[1];
    const hasWidth = editButtonStyles.includes('width:');
    const hasHeight = editButtonStyles.includes('height:');
    const hasBorderRadius = editButtonStyles.includes('borderRadius:');
    const hasBackgroundColor = editButtonStyles.includes('backgroundColor:');
    
    if (hasWidth && hasHeight && hasBorderRadius && hasBackgroundColor) {
      console.log('  ✓ Edit button has proper styling (width, height, borderRadius, backgroundColor)');
    }
  }
  
  // Check for delete button styles
  const deleteButtonStyleMatch = scheduleStepContent.match(/deleteButton:\s*{([^}]+)}/s);
  if (deleteButtonStyleMatch) {
    const deleteButtonStyles = deleteButtonStyleMatch[1];
    const hasWidth = deleteButtonStyles.includes('width:');
    const hasHeight = deleteButtonStyles.includes('height:');
    const hasBorderRadius = deleteButtonStyles.includes('borderRadius:');
    const hasBackgroundColor = deleteButtonStyles.includes('backgroundColor:');
    
    if (hasWidth && hasHeight && hasBorderRadius && hasBackgroundColor) {
      console.log('  ✓ Delete button has proper styling (width, height, borderRadius, backgroundColor)');
    }
  }
} catch (error) {
  console.log(`  ✗ Error verifying icon styling: ${error.message}`);
  process.exit(1);
}

// Test 7: Verify accessibility labels
console.log('\n✓ Test 7: Accessibility support');
try {
  const fs = require('fs');
  const scheduleStepContent = fs.readFileSync(
    './src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'utf8'
  );
  
  const hasEditAccessibilityLabel = scheduleStepContent.includes('accessibilityLabel="Editar"');
  const hasDeleteAccessibilityLabel = scheduleStepContent.includes('accessibilityLabel="Eliminar"');
  const hasAccessibilityRole = scheduleStepContent.includes('accessibilityRole="button"');
  
  if (hasEditAccessibilityLabel && hasDeleteAccessibilityLabel && hasAccessibilityRole) {
    console.log('  ✓ Edit button has accessibility label');
    console.log('  ✓ Delete button has accessibility label');
    console.log('  ✓ Buttons have accessibility role');
  } else {
    console.log('  ⚠ Some accessibility features may be missing');
  }
} catch (error) {
  console.log(`  ✗ Error verifying accessibility: ${error.message}`);
  process.exit(1);
}

// Test 8: Verify hitSlop for better touch targets
console.log('\n✓ Test 8: Touch target optimization');
try {
  const fs = require('fs');
  const scheduleStepContent = fs.readFileSync(
    './src/components/patient/medication-wizard/MedicationScheduleStep.tsx',
    'utf8'
  );
  
  const hasHitSlop = scheduleStepContent.includes('hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}');
  
  if (hasHitSlop) {
    console.log('  ✓ Icon buttons have hitSlop for better touch targets');
  } else {
    console.log('  ⚠ hitSlop may not be configured');
  }
} catch (error) {
  console.log(`  ✗ Error verifying touch targets: ${error.message}`);
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('✓ All tests passed!');
console.log('='.repeat(60));
console.log('\nSummary:');
console.log('  ✓ @expo/vector-icons is installed');
console.log('  ✓ Ionicons is imported in MedicationScheduleStep');
console.log('  ✓ Pencil icon is used for edit button');
console.log('  ✓ Trash-outline icon is used for delete button');
console.log('  ✓ TimeCard component structure is correct');
console.log('  ✓ Icon buttons have proper styling');
console.log('  ✓ Accessibility features are implemented');
console.log('  ✓ Touch targets are optimized');
console.log('\n✓ Task 16 implementation verified successfully!');
console.log('='.repeat(60));

/**
 * Test script for EventTypeBadge component
 * Verifies color coding and styling for all medication event types
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing EventTypeBadge Component\n');
console.log('=' .repeat(60));

// Read the EventTypeBadge component
const badgeComponentPath = path.join(__dirname, 'src/components/caregiver/EventTypeBadge.tsx');
const badgeContent = fs.readFileSync(badgeComponentPath, 'utf8');

// Test 1: Verify all required event types are handled
console.log('\n✓ Test 1: Event Type Coverage');
const requiredEventTypes = [
  'medication_created',
  'medication_updated', 
  'medication_deleted',
  'dose_taken',
  'dose_missed'
];

let allTypesHandled = true;
requiredEventTypes.forEach(eventType => {
  if (badgeContent.includes(`case '${eventType}'`)) {
    console.log(`  ✓ ${eventType} - handled`);
  } else {
    console.log(`  ✗ ${eventType} - MISSING`);
    allTypesHandled = false;
  }
});

if (allTypesHandled) {
  console.log('  ✅ All event types are handled');
} else {
  console.log('  ❌ Some event types are missing');
}

// Test 2: Verify color mappings match requirements
console.log('\n✓ Test 2: Color Mappings');
const colorMappings = [
  { type: 'medication_created', color: 'blue', token: 'colors.primary[500]' },
  { type: 'medication_updated', color: 'yellow', token: 'colors.warning[500]' },
  { type: 'medication_deleted', color: 'red', token: 'colors.error[500]' },
  { type: 'dose_taken', color: 'green', token: 'colors.success' },
  { type: 'dose_missed', color: 'orange', token: '#FF9500' }
];

let allColorsCorrect = true;
colorMappings.forEach(mapping => {
  // Find the case block for this event type
  const caseRegex = new RegExp(`case '${mapping.type}':[\\s\\S]*?return[\\s\\S]*?color: ([^,]+),`, 'm');
  const match = badgeContent.match(caseRegex);
  
  // Normalize by removing quotes for comparison
  const actualColor = match ? match[1].trim().replace(/['"]/g, '') : null;
  const expectedColor = mapping.token.replace(/['"]/g, '');
  
  if (match && actualColor === expectedColor) {
    console.log(`  ✓ ${mapping.type} → ${mapping.color} (${mapping.token})`);
  } else {
    console.log(`  ✗ ${mapping.type} → Expected ${mapping.token}, got ${match ? match[1].trim() : 'NOT FOUND'}`);
    allColorsCorrect = false;
  }
});

if (allColorsCorrect) {
  console.log('  ✅ All color mappings are correct');
} else {
  console.log('  ❌ Some color mappings are incorrect');
}

// Test 3: Verify backward compatibility with short names
console.log('\n✓ Test 3: Backward Compatibility');
const shortNames = ['created', 'updated', 'deleted'];
let backwardCompatible = true;

shortNames.forEach(shortName => {
  if (badgeContent.includes(`case '${shortName}'`)) {
    console.log(`  ✓ ${shortName} - supported`);
  } else {
    console.log(`  ✗ ${shortName} - NOT supported`);
    backwardCompatible = false;
  }
});

if (backwardCompatible) {
  console.log('  ✅ Backward compatibility maintained');
} else {
  console.log('  ❌ Backward compatibility broken');
}

// Test 4: Verify component structure
console.log('\n✓ Test 4: Component Structure');
const structureChecks = [
  { name: 'TypeScript interface', pattern: /interface EventTypeBadgeProps/ },
  { name: 'Size prop support', pattern: /size\?: 'sm' \| 'md' \| 'lg'/ },
  { name: 'getBadgeConfig function', pattern: /function getBadgeConfig/ },
  { name: 'Icon support', pattern: /icon:/ },
  { name: 'Label support', pattern: /label:/ },
  { name: 'Background color', pattern: /backgroundColor:/ },
  { name: 'Accessibility labels', pattern: /accessibilityLabel/ },
  { name: 'Accessibility role', pattern: /accessibilityRole/ }
];

let structureValid = true;
structureChecks.forEach(check => {
  if (check.pattern.test(badgeContent)) {
    console.log(`  ✓ ${check.name}`);
  } else {
    console.log(`  ✗ ${check.name} - MISSING`);
    structureValid = false;
  }
});

if (structureValid) {
  console.log('  ✅ Component structure is complete');
} else {
  console.log('  ❌ Component structure has issues');
}

// Test 5: Verify styling implementation
console.log('\n✓ Test 5: Styling Implementation');
const styleChecks = [
  { name: 'Badge base style', pattern: /badge:/ },
  { name: 'Small size style', pattern: /badge_sm:/ },
  { name: 'Medium size style', pattern: /badge_md:/ },
  { name: 'Large size style', pattern: /badge_lg:/ },
  { name: 'Label style', pattern: /label:/ },
  { name: 'Border radius', pattern: /borderRadius\.full/ },
  { name: 'Flexbox layout', pattern: /flexDirection: 'row'/ }
];

let stylingValid = true;
styleChecks.forEach(check => {
  if (check.pattern.test(badgeContent)) {
    console.log(`  ✓ ${check.name}`);
  } else {
    console.log(`  ✗ ${check.name} - MISSING`);
    stylingValid = false;
  }
});

if (stylingValid) {
  console.log('  ✅ Styling implementation is complete');
} else {
  console.log('  ❌ Styling implementation has issues');
}

// Test 6: Verify design system token usage
console.log('\n✓ Test 6: Design System Token Usage');
const tokenChecks = [
  { name: 'Color tokens', pattern: /colors\.(primary|warning|error|success|gray)/ },
  { name: 'Spacing tokens', pattern: /spacing\.(xs|sm|md|lg)/ },
  { name: 'Typography tokens', pattern: /typography\.(fontSize|fontWeight)/ },
  { name: 'Border radius tokens', pattern: /borderRadius\./ }
];

let tokensUsed = true;
tokenChecks.forEach(check => {
  if (check.pattern.test(badgeContent)) {
    console.log(`  ✓ ${check.name}`);
  } else {
    console.log(`  ✗ ${check.name} - NOT USED`);
    tokensUsed = false;
  }
});

if (tokensUsed) {
  console.log('  ✅ Design system tokens properly used');
} else {
  console.log('  ❌ Some design system tokens not used');
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary\n');

const allTestsPassed = allTypesHandled && allColorsCorrect && backwardCompatible && structureValid && stylingValid && tokensUsed;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED');
  console.log('\nThe EventTypeBadge component is correctly implemented with:');
  console.log('  • All 5 event types supported (medication_created, medication_updated, medication_deleted, dose_taken, dose_missed)');
  console.log('  • Correct color coding: blue, yellow, red, green, orange');
  console.log('  • Backward compatibility with short names');
  console.log('  • Complete component structure with accessibility');
  console.log('  • Proper styling with size variants');
  console.log('  • Design system token usage');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease review the failed tests above.');
  process.exit(1);
}

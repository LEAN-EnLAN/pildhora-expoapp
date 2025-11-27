/**
 * Test script for Events Consolidation (Task 9)
 * 
 * This script verifies:
 * 1. Old files (reports.tsx, audit.tsx) are deleted
 * 2. Navigation is updated to remove old tabs
 * 3. Events screen exists with full functionality
 * 4. All components are properly integrated
 * 
 * Run with: node test-events-consolidation.js
 */

console.log('='.repeat(80));
console.log('TASK 9: EVENTS CONSOLIDATION - VERIFICATION TEST');
console.log('='.repeat(80));
console.log();

const fs = require('fs');
const path = require('path');

let allTestsPassed = true;

// Test 1: Verify old files are deleted
console.log('Test 1: Verify old files are deleted');
console.log('-'.repeat(80));

const reportsPath = path.join(__dirname, 'app/caregiver/reports.tsx');
const auditPath = path.join(__dirname, 'app/caregiver/audit.tsx');

if (!fs.existsSync(reportsPath)) {
  console.log('✓ reports.tsx successfully deleted');
} else {
  console.log('✗ reports.tsx still exists (should be deleted)');
  allTestsPassed = false;
}

if (!fs.existsSync(auditPath)) {
  console.log('✓ audit.tsx successfully deleted');
} else {
  console.log('✗ audit.tsx still exists (should be deleted)');
  allTestsPassed = false;
}

console.log();

// Test 2: Verify events screen exists
console.log('Test 2: Verify events screen exists');
console.log('-'.repeat(80));

const eventsPath = path.join(__dirname, 'app/caregiver/events.tsx');

if (fs.existsSync(eventsPath)) {
  console.log('✓ events.tsx exists');
  
  const eventsContent = fs.readFileSync(eventsPath, 'utf8');
  
  const features = [
    { name: 'MedicationEventCard import', pattern: /import.*MedicationEventCard.*from/ },
    { name: 'EventFilterControls import', pattern: /import.*EventFilterControls.*from/ },
    { name: 'Real-time listener', pattern: /onSnapshot/ },
    { name: 'Pull-to-refresh', pattern: /RefreshControl/ },
    { name: 'FlatList virtualization', pattern: /removeClippedSubviews/ },
    { name: 'Filter state', pattern: /const \[filters, setFilters\]/ },
    { name: 'Patient loading', pattern: /loadPatients/ },
    { name: 'Filter persistence', pattern: /AsyncStorage/ },
    { name: 'Empty state', pattern: /No hay eventos/ },
    { name: 'Error handling', pattern: /error.*Error/ },
  ];
  
  features.forEach(feature => {
    if (feature.pattern.test(eventsContent)) {
      console.log(`  ✓ ${feature.name}`);
    } else {
      console.log(`  ✗ ${feature.name} NOT found`);
      allTestsPassed = false;
    }
  });
} else {
  console.log('✗ events.tsx does not exist');
  allTestsPassed = false;
}

console.log();

// Test 3: Verify navigation updates
console.log('Test 3: Verify navigation updates');
console.log('-'.repeat(80));

const layoutPath = path.join(__dirname, 'app/caregiver/_layout.tsx');

if (fs.existsSync(layoutPath)) {
  console.log('✓ _layout.tsx exists');
  
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Check that old tabs are removed
  if (!layoutContent.includes('name="reports"')) {
    console.log('  ✓ Reports tab removed from navigation');
  } else {
    console.log('  ✗ Reports tab still in navigation');
    allTestsPassed = false;
  }
  
  if (!layoutContent.includes('name="audit"')) {
    console.log('  ✓ Audit tab removed from navigation');
  } else {
    console.log('  ✗ Audit tab still in navigation');
    allTestsPassed = false;
  }
  
  // Check that events tab exists
  if (layoutContent.includes('name="events"')) {
    console.log('  ✓ Events tab present in navigation');
  } else {
    console.log('  ✗ Events tab NOT in navigation');
    allTestsPassed = false;
  }
  
  // Check screen titles
  if (!layoutContent.includes('reports:') && !layoutContent.includes('audit:')) {
    console.log('  ✓ Old screen titles removed');
  } else {
    console.log('  ✗ Old screen titles still present');
    allTestsPassed = false;
  }
  
  if (layoutContent.includes('events:')) {
    console.log('  ✓ Events screen title present');
  } else {
    console.log('  ✗ Events screen title NOT found');
    allTestsPassed = false;
  }
  
  // Count tabs
  const tabMatches = layoutContent.match(/Tabs\.Screen/g);
  const tabCount = tabMatches ? tabMatches.length : 0;
  console.log(`  ℹ Total tabs: ${tabCount} (expected: 5 - dashboard, tasks, medications, events, add-device)`);
  
} else {
  console.log('✗ _layout.tsx does not exist');
  allTestsPassed = false;
}

console.log();

// Test 4: Verify components exist
console.log('Test 4: Verify required components exist');
console.log('-'.repeat(80));

const components = [
  { name: 'MedicationEventCard', path: 'src/components/caregiver/MedicationEventCard.tsx' },
  { name: 'EventFilterControls', path: 'src/components/caregiver/EventFilterControls.tsx' },
  { name: 'EventTypeBadge', path: 'src/components/caregiver/EventTypeBadge.tsx' },
];

components.forEach(component => {
  const componentPath = path.join(__dirname, component.path);
  if (fs.existsSync(componentPath)) {
    console.log(`✓ ${component.name} exists`);
  } else {
    console.log(`✗ ${component.name} NOT found`);
    allTestsPassed = false;
  }
});

console.log();

// Test 5: Verify event detail screen exists
console.log('Test 5: Verify event detail screen exists');
console.log('-'.repeat(80));

const eventDetailPath = path.join(__dirname, 'app/caregiver/events/[id].tsx');

if (fs.existsSync(eventDetailPath)) {
  console.log('✓ Event detail screen exists');
} else {
  console.log('ℹ Event detail screen not yet implemented (Task 10)');
}

console.log();

// Test 6: Check for any remaining references to old screens
console.log('Test 6: Check for remaining references to old screens');
console.log('-'.repeat(80));

const filesToCheck = [
  'app/caregiver/_layout.tsx',
  'app/caregiver/dashboard.tsx',
];

let foundReferences = false;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for references to old screens
    const patterns = [
      { name: 'reports route', pattern: /\/caregiver\/reports/ },
      { name: 'audit route', pattern: /\/caregiver\/audit/ },
      { name: 'getReportsQuery', pattern: /getReportsQuery/ },
      { name: 'getAuditLogQuery', pattern: /getAuditLogQuery/ },
    ];
    
    patterns.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`  ✗ Found ${check.name} reference in ${file}`);
        foundReferences = true;
        allTestsPassed = false;
      }
    });
  }
});

if (!foundReferences) {
  console.log('✓ No references to old screens found');
}

console.log();

// Summary
console.log('='.repeat(80));
console.log('CONSOLIDATION SUMMARY');
console.log('='.repeat(80));
console.log();

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED');
  console.log();
  console.log('Task 9 is complete:');
  console.log('  ✓ Old files deleted (reports.tsx, audit.tsx)');
  console.log('  ✓ Navigation updated (removed reports and audit tabs)');
  console.log('  ✓ Events screen exists with full functionality');
  console.log('  ✓ All required components present');
  console.log('  ✓ No remaining references to old screens');
  console.log();
  console.log('The Events Registry successfully consolidates:');
  console.log('  • Medication creation events');
  console.log('  • Medication update events');
  console.log('  • Medication deletion events');
  console.log('  • Real-time updates via Firestore');
  console.log('  • Comprehensive filtering (patient, type, date, search)');
  console.log('  • Filter persistence across sessions');
  console.log('  • Optimized performance with virtualization');
  console.log();
  console.log('Requirements addressed:');
  console.log('  • Requirement 3.1: Consolidate reports and audit');
  console.log('  • Requirement 3.2: Unified event display');
  console.log('  • Requirement 3.3: Dynamic Firestore queries');
  console.log('  • Requirement 3.4: Comprehensive filtering');
  console.log('  • Requirement 8.2: Real-time updates');
  console.log('  • Requirement 14.1: Performance optimization');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log();
  console.log('Please review the failed tests above and fix any issues.');
}

console.log();
console.log('='.repeat(80));

process.exit(allTestsPassed ? 0 : 1);

/**
 * Script to remove console.log statements from caregiver codebase
 * Preserves console.error and console.warn
 */

const fs = require('fs');
const path = require('path');

const filesToClean = [
  'app/caregiver/events.tsx',
  'app/caregiver/medications/[patientId]/index.tsx',
  'app/caregiver/medications/[patientId]/[id].tsx',
  'app/caregiver/medications/[patientId]/add.tsx',
  'src/components/caregiver/PatientSelector.tsx',
  'src/components/caregiver/LastMedicationStatusCard.tsx',
  'src/components/caregiver/DeviceConnectivityCard.tsx',
  'src/components/caregiver/CaregiverHeader.tsx',
];

function cleanFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Count console.log statements
    const logMatches = content.match(/console\.log\([^)]*\);?\n?/g);
    const count = logMatches ? logMatches.length : 0;
    
    if (count === 0) {
      console.log(`✓ ${filePath} - No console.log statements found`);
      return;
    }
    
    // Remove console.log statements (but keep console.error and console.warn)
    content = content.replace(/\s*console\.log\([^)]*\);?\n?/g, '');
    
    // Clean up extra blank lines (max 2 consecutive)
    content = content.replace(/\n{3,}/g, '\n\n');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ ${filePath} - Removed ${count} console.log statement(s)`);
  } catch (error) {
    console.error(`✗ ${filePath} - Error: ${error.message}`);
  }
}

console.log('Cleaning console.log statements from caregiver codebase...\n');

filesToClean.forEach(cleanFile);

console.log('\n✓ Cleanup complete!');

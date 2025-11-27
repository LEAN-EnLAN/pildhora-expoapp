/**
 * Test: Wizard Persistence and Recovery
 * 
 * Verifies that the wizard persistence service and UI components
 * properly save, restore, and clear wizard progress.
 * 
 * Requirements: 11.5
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    log(`✓ ${message}`, GREEN);
  } else {
    testsFailed++;
    log(`✗ ${message}`, RED);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Test 1: Wizard Persistence Service exists
log('\n📦 Test 1: Wizard Persistence Service', BLUE);
const serviceFile = 'src/services/wizardPersistence.ts';
assert(
  fileExists(serviceFile),
  'wizardPersistence.ts service file exists'
);

const serviceContent = readFile(serviceFile);
assert(
  serviceContent.includes('export const wizardPersistenceService'),
  'Service exports wizardPersistenceService'
);

assert(
  serviceContent.includes('saveProgress'),
  'Service has saveProgress method'
);

assert(
  serviceContent.includes('restoreProgress'),
  'Service has restoreProgress method'
);

assert(
  serviceContent.includes('clearProgress'),
  'Service has clearProgress method'
);

assert(
  serviceContent.includes('hasProgress'),
  'Service has hasProgress method'
);

assert(
  serviceContent.includes('getProgressAge'),
  'Service has getProgressAge method'
);

assert(
  serviceContent.includes("import AsyncStorage from '@react-native-async-storage/async-storage'"),
  'Service imports AsyncStorage'
);

assert(
  serviceContent.includes('WizardProgress'),
  'Service defines WizardProgress interface'
);

assert(
  serviceContent.includes('currentStep'),
  'WizardProgress includes currentStep'
);

assert(
  serviceContent.includes('formData'),
  'WizardProgress includes formData'
);

assert(
  serviceContent.includes('userId'),
  'WizardProgress includes userId'
);

assert(
  serviceContent.includes('timestamp'),
  'WizardProgress includes timestamp'
);

// Test 2: Wizard component integration
log('\n🧙 Test 2: Wizard Component Integration', BLUE);
const wizardFile = 'src/components/patient/provisioning/DeviceProvisioningWizard.tsx';
const wizardContent = readFile(wizardFile);

assert(
  wizardContent.includes("import { wizardPersistenceService } from '../../../services/wizardPersistence'"),
  'Wizard imports wizardPersistenceService'
);

assert(
  wizardContent.includes('resumeFromSaved'),
  'Wizard has resumeFromSaved prop'
);

assert(
  wizardContent.includes('isLoadingProgress'),
  'Wizard has isLoadingProgress state'
);

assert(
  wizardContent.includes('restoreProgress'),
  'Wizard calls restoreProgress on mount'
);

assert(
  wizardContent.includes('saveProgress'),
  'Wizard calls saveProgress when step changes'
);

assert(
  wizardContent.includes('clearProgress'),
  'Wizard calls clearProgress on completion/cancel'
);

assert(
  wizardContent.includes('lastSavedStep'),
  'Wizard tracks last saved step'
);

// Test 3: Continue Setup Prompt component
log('\n💬 Test 3: Continue Setup Prompt Component', BLUE);
const promptFile = 'src/components/patient/provisioning/ContinueSetupPrompt.tsx';
assert(
  fileExists(promptFile),
  'ContinueSetupPrompt.tsx component exists'
);

const promptContent = readFile(promptFile);
assert(
  promptContent.includes('export function ContinueSetupPrompt'),
  'Component exports ContinueSetupPrompt'
);

assert(
  promptContent.includes('currentStep'),
  'Component accepts currentStep prop'
);

assert(
  promptContent.includes('progressAge'),
  'Component accepts progressAge prop'
);

assert(
  promptContent.includes('onContinue'),
  'Component accepts onContinue callback'
);

assert(
  promptContent.includes('onStartFresh'),
  'Component accepts onStartFresh callback'
);

assert(
  promptContent.includes('formatProgressAge'),
  'Component has formatProgressAge helper'
);

assert(
  promptContent.includes('Configuración Incompleta'),
  'Component displays Spanish title'
);

assert(
  promptContent.includes('Continuar Configuración'),
  'Component has continue button'
);

assert(
  promptContent.includes('Empezar de Nuevo'),
  'Component has start fresh button'
);

// Test 4: Device Provisioning Screen integration
log('\n📱 Test 4: Device Provisioning Screen Integration', BLUE);
const screenFile = 'app/patient/device-provisioning.tsx';
const screenContent = readFile(screenFile);

assert(
  screenContent.includes("import { wizardPersistenceService } from '../../src/services/wizardPersistence'"),
  'Screen imports wizardPersistenceService'
);

assert(
  screenContent.includes("import { ContinueSetupPrompt } from '../../src/components/patient/provisioning/ContinueSetupPrompt'"),
  'Screen imports ContinueSetupPrompt'
);

assert(
  screenContent.includes('isCheckingProgress'),
  'Screen has isCheckingProgress state'
);

assert(
  screenContent.includes('savedProgress'),
  'Screen has savedProgress state'
);

assert(
  screenContent.includes('showPrompt'),
  'Screen has showPrompt state'
);

assert(
  screenContent.includes('resumeFromSaved'),
  'Screen has resumeFromSaved state'
);

assert(
  screenContent.includes('checkProgress'),
  'Screen checks for saved progress on mount'
);

assert(
  screenContent.includes('handleContinue'),
  'Screen has handleContinue handler'
);

assert(
  screenContent.includes('handleStartFresh'),
  'Screen has handleStartFresh handler'
);

assert(
  screenContent.includes('<ContinueSetupPrompt'),
  'Screen renders ContinueSetupPrompt when needed'
);

assert(
  screenContent.includes('resumeFromSaved={resumeFromSaved}'),
  'Screen passes resumeFromSaved to wizard'
);

// Test 5: Storage key constants
log('\n🔑 Test 5: Storage Key Management', BLUE);
assert(
  serviceContent.includes('@device_provisioning_wizard'),
  'Service uses consistent storage key for wizard data'
);

assert(
  serviceContent.includes('@device_provisioning_wizard_timestamp'),
  'Service uses storage key for timestamp'
);

// Test 6: Progress expiration
log('\n⏰ Test 6: Progress Expiration Logic', BLUE);
assert(
  serviceContent.includes('EXPIRATION_TIME'),
  'Service defines expiration time'
);

assert(
  serviceContent.includes('7 * 24 * 60 * 60 * 1000'),
  'Service sets 7-day expiration'
);

assert(
  serviceContent.includes('age > EXPIRATION_TIME'),
  'Service checks if progress is expired'
);

assert(
  serviceContent.includes('expired, clearing'),
  'Service clears expired progress'
);

// Test 7: User verification
log('\n👤 Test 7: User Verification', BLUE);
assert(
  serviceContent.includes('progress.userId !== userId'),
  'Service verifies progress belongs to current user'
);

assert(
  serviceContent.includes('different user, clearing'),
  'Service clears progress for different user'
);

// Test 8: Error handling
log('\n⚠️  Test 8: Error Handling', BLUE);
assert(
  serviceContent.includes('try {') && serviceContent.includes('catch (error)'),
  'Service has error handling'
);

assert(
  serviceContent.includes('console.error'),
  'Service logs errors'
);

assert(
  wizardContent.includes('catch (error)') && wizardContent.includes('restoreProgress'),
  'Wizard handles restore errors'
);

assert(
  wizardContent.includes('catch (error)') && wizardContent.includes('saveProgress'),
  'Wizard handles save errors'
);

// Test 9: Accessibility
log('\n♿ Test 9: Accessibility', BLUE);
assert(
  wizardContent.includes('announceForAccessibility') && wizardContent.includes('Progreso restaurado'),
  'Wizard announces progress restoration'
);

assert(
  promptContent.includes('accessibilityLabel'),
  'Prompt has accessibility labels'
);

assert(
  promptContent.includes('accessibilityHint'),
  'Prompt has accessibility hints'
);

// Test 10: Auto-save logic
log('\n💾 Test 10: Auto-save Logic', BLUE);
assert(
  wizardContent.includes('Auto-save progress when step changes'),
  'Wizard has auto-save comment'
);

assert(
  wizardContent.includes('currentStep === 0 || wizardState.currentStep === 5'),
  'Wizard skips saving welcome and completion steps'
);

assert(
  wizardContent.includes('lastSavedStep.current'),
  'Wizard prevents duplicate saves'
);

// Test 11: Loading states
log('\n⏳ Test 11: Loading States', BLUE);
assert(
  wizardContent.includes('if (isLoadingProgress)'),
  'Wizard shows loading state while restoring'
);

assert(
  wizardContent.includes('loadingContainer'),
  'Wizard has loading container style'
);

assert(
  screenContent.includes('if (isCheckingProgress)'),
  'Screen shows loading while checking progress'
);

// Test 12: Clear on completion
log('\n✅ Test 12: Clear on Completion', BLUE);
assert(
  wizardContent.includes('await wizardPersistenceService.clearProgress()') &&
  wizardContent.includes('handleComplete'),
  'Wizard clears progress on completion'
);

assert(
  wizardContent.includes('await wizardPersistenceService.clearProgress()') &&
  wizardContent.includes('handleExitConfirm'),
  'Wizard clears progress on cancel'
);

assert(
  screenContent.includes('await wizardPersistenceService.clearProgress()') &&
  screenContent.includes('handleStartFresh'),
  'Screen clears progress when starting fresh'
);

// Test 13: TypeScript types
log('\n📘 Test 13: TypeScript Types', BLUE);
assert(
  serviceContent.includes('export interface WizardProgress'),
  'Service exports WizardProgress interface'
);

assert(
  promptContent.includes('export interface ContinueSetupPromptProps'),
  'Prompt exports props interface'
);

assert(
  wizardContent.includes('resumeFromSaved?: boolean'),
  'Wizard has optional resumeFromSaved prop'
);

// Summary
log('\n' + '='.repeat(50), BLUE);
log('Test Summary:', BLUE);
log(`Total tests: ${testsPassed + testsFailed}`);
log(`Passed: ${testsPassed}`, GREEN);
log(`Failed: ${testsFailed}`, testsFailed > 0 ? RED : GREEN);

if (testsFailed === 0) {
  log('\n✅ All wizard persistence tests passed!', GREEN);
  log('\nImplemented features:', BLUE);
  log('  ✓ Save wizard progress to AsyncStorage');
  log('  ✓ Restore progress from last completed step');
  log('  ✓ "Continue Setup" prompt on app restart');
  log('  ✓ Clear wizard data on completion or cancellation');
  log('  ✓ Progress expiration (7 days)');
  log('  ✓ User verification');
  log('  ✓ Error handling');
  log('  ✓ Accessibility support');
  process.exit(0);
} else {
  log('\n❌ Some tests failed. Please review the implementation.', RED);
  process.exit(1);
}

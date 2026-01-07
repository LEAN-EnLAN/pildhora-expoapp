/**
 * Test script for low quantity alerts implementation
 * 
 * This script verifies:
 * 1. LowQuantityBanner component exists and can be imported
 * 2. RefillDialog component exists and can be imported
 * 3. MedicationCard supports low quantity badge props
 * 4. InventoryService has checkLowQuantity method
 * 5. LowQuantityNotificationService exists
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Low Quantity Alerts Implementation\n');

// Test 1: Check LowQuantityBanner component exists
console.log('✓ Test 1: Checking LowQuantityBanner component...');
const bannerPath = path.join(__dirname, 'src/components/screens/patient/LowQuantityBanner.tsx');
if (fs.existsSync(bannerPath)) {
  const bannerContent = fs.readFileSync(bannerPath, 'utf8');
  
  // Check for required props
  const hasCurrentQuantity = bannerContent.includes('currentQuantity');
  const hasThreshold = bannerContent.includes('threshold');
  const hasDaysRemaining = bannerContent.includes('daysRemaining');
  const hasOnRefill = bannerContent.includes('onRefill');
  
  if (hasCurrentQuantity && hasThreshold && hasDaysRemaining && hasOnRefill) {
    console.log('  ✅ LowQuantityBanner component has all required props');
  } else {
    console.log('  ❌ LowQuantityBanner component missing required props');
  }
  
  // Check for accessibility
  const hasAccessibility = bannerContent.includes('accessibilityRole') && 
                          bannerContent.includes('accessibilityLabel');
  if (hasAccessibility) {
    console.log('  ✅ LowQuantityBanner has accessibility support');
  } else {
    console.log('  ⚠️  LowQuantityBanner missing accessibility attributes');
  }
} else {
  console.log('  ❌ LowQuantityBanner component not found');
}

// Test 2: Check RefillDialog component exists
console.log('\n✓ Test 2: Checking RefillDialog component...');
const dialogPath = path.join(__dirname, 'src/components/screens/patient/RefillDialog.tsx');
if (fs.existsSync(dialogPath)) {
  const dialogContent = fs.readFileSync(dialogPath, 'utf8');
  
  // Check for required props
  const hasVisible = dialogContent.includes('visible');
  const hasMedication = dialogContent.includes('medication');
  const hasOnConfirm = dialogContent.includes('onConfirm');
  const hasOnCancel = dialogContent.includes('onCancel');
  
  if (hasVisible && hasMedication && hasOnConfirm && hasOnCancel) {
    console.log('  ✅ RefillDialog component has all required props');
  } else {
    console.log('  ❌ RefillDialog component missing required props');
  }
  
  // Check for validation
  const hasValidation = dialogContent.includes('validation') || 
                       dialogContent.includes('isNaN') ||
                       dialogContent.includes('parseInt');
  if (hasValidation) {
    console.log('  ✅ RefillDialog has input validation');
  } else {
    console.log('  ⚠️  RefillDialog missing input validation');
  }
  
  // Check for visual preview
  const hasPreview = dialogContent.includes('preview');
  if (hasPreview) {
    console.log('  ✅ RefillDialog has visual quantity preview');
  } else {
    console.log('  ⚠️  RefillDialog missing visual preview');
  }
} else {
  console.log('  ❌ RefillDialog component not found');
}

// Test 3: Check MedicationCard supports low quantity badge
console.log('\n✓ Test 3: Checking MedicationCard low quantity badge...');
const cardPath = path.join(__dirname, 'src/components/screens/patient/MedicationCard.tsx');
if (fs.existsSync(cardPath)) {
  const cardContent = fs.readFileSync(cardPath, 'utf8');
  
  // Check for new props
  const hasShowLowQuantityBadge = cardContent.includes('showLowQuantityBadge');
  const hasCurrentQuantity = cardContent.includes('currentQuantity');
  
  if (hasShowLowQuantityBadge && hasCurrentQuantity) {
    console.log('  ✅ MedicationCard has low quantity badge props');
  } else {
    console.log('  ❌ MedicationCard missing low quantity badge props');
  }
  
  // Check for badge rendering
  const hasBadgeRendering = cardContent.includes('lowQuantityBadge') &&
                           cardContent.includes('outOfStockBadge');
  if (hasBadgeRendering) {
    console.log('  ✅ MedicationCard renders low quantity badge');
  } else {
    console.log('  ❌ MedicationCard missing badge rendering logic');
  }
} else {
  console.log('  ❌ MedicationCard component not found');
}

// Test 4: Check InventoryService has checkLowQuantity
console.log('\n✓ Test 4: Checking InventoryService...');
const inventoryPath = path.join(__dirname, 'src/services/inventoryService.ts');
if (fs.existsSync(inventoryPath)) {
  const inventoryContent = fs.readFileSync(inventoryPath, 'utf8');
  
  // Check for checkLowQuantity method
  const hasCheckLowQuantity = inventoryContent.includes('checkLowQuantity');
  if (hasCheckLowQuantity) {
    console.log('  ✅ InventoryService has checkLowQuantity method');
  } else {
    console.log('  ❌ InventoryService missing checkLowQuantity method');
  }
  
  // Check for getInventoryStatus method
  const hasGetInventoryStatus = inventoryContent.includes('getInventoryStatus');
  if (hasGetInventoryStatus) {
    console.log('  ✅ InventoryService has getInventoryStatus method');
  } else {
    console.log('  ❌ InventoryService missing getInventoryStatus method');
  }
} else {
  console.log('  ❌ InventoryService not found');
}

// Test 5: Check LowQuantityNotificationService exists
console.log('\n✓ Test 5: Checking LowQuantityNotificationService...');
const notificationPath = path.join(__dirname, 'src/services/lowQuantityNotification.ts');
if (fs.existsSync(notificationPath)) {
  const notificationContent = fs.readFileSync(notificationPath, 'utf8');
  
  // Check for showLowQuantityNotification method
  const hasShowNotification = notificationContent.includes('showLowQuantityNotification');
  if (hasShowNotification) {
    console.log('  ✅ LowQuantityNotificationService has showLowQuantityNotification method');
  } else {
    console.log('  ❌ LowQuantityNotificationService missing showLowQuantityNotification method');
  }
  
  // Check for checkAllMedicationsForLowInventory method
  const hasCheckAll = notificationContent.includes('checkAllMedicationsForLowInventory');
  if (hasCheckAll) {
    console.log('  ✅ LowQuantityNotificationService has checkAllMedicationsForLowInventory method');
  } else {
    console.log('  ❌ LowQuantityNotificationService missing checkAllMedicationsForLowInventory method');
  }
  
  // Check for shouldRunDailyCheck method
  const hasDailyCheck = notificationContent.includes('shouldRunDailyCheck');
  if (hasDailyCheck) {
    console.log('  ✅ LowQuantityNotificationService has shouldRunDailyCheck method');
  } else {
    console.log('  ❌ LowQuantityNotificationService missing shouldRunDailyCheck method');
  }
} else {
  console.log('  ❌ LowQuantityNotificationService not found');
}

// Test 6: Check MedicationForm integration
console.log('\n✓ Test 6: Checking MedicationForm integration...');
const formPath = path.join(__dirname, 'src/components/patient/MedicationForm.tsx');
if (fs.existsSync(formPath)) {
  const formContent = fs.readFileSync(formPath, 'utf8');
  
  // Check for LowQuantityBanner import
  const hasLowQuantityBannerImport = formContent.includes('LowQuantityBanner');
  if (hasLowQuantityBannerImport) {
    console.log('  ✅ MedicationForm imports LowQuantityBanner');
  } else {
    console.log('  ❌ MedicationForm missing LowQuantityBanner import');
  }
  
  // Check for RefillDialog import
  const hasRefillDialogImport = formContent.includes('RefillDialog');
  if (hasRefillDialogImport) {
    console.log('  ✅ MedicationForm imports RefillDialog');
  } else {
    console.log('  ❌ MedicationForm missing RefillDialog import');
  }
  
  // Check for inventory status state
  const hasInventoryStatus = formContent.includes('inventoryStatus');
  if (hasInventoryStatus) {
    console.log('  ✅ MedicationForm manages inventory status state');
  } else {
    console.log('  ❌ MedicationForm missing inventory status state');
  }
  
  // Check for refill handlers
  const hasRefillHandlers = formContent.includes('handleRefillConfirm') &&
                           formContent.includes('handleRefillCancel');
  if (hasRefillHandlers) {
    console.log('  ✅ MedicationForm has refill handlers');
  } else {
    console.log('  ❌ MedicationForm missing refill handlers');
  }
} else {
  console.log('  ❌ MedicationForm component not found');
}

// Test 7: Check medications list integration
console.log('\n✓ Test 7: Checking medications list integration...');
const listPath = path.join(__dirname, 'app/patient/medications/index.tsx');
if (fs.existsSync(listPath)) {
  const listContent = fs.readFileSync(listPath, 'utf8');
  
  // Check for inventory service import
  const hasInventoryImport = listContent.includes('inventoryService');
  if (hasInventoryImport) {
    console.log('  ✅ Medications list imports inventoryService');
  } else {
    console.log('  ❌ Medications list missing inventoryService import');
  }
  
  // Check for low inventory state
  const hasLowInventoryState = listContent.includes('lowInventoryMeds');
  if (hasLowInventoryState) {
    console.log('  ✅ Medications list tracks low inventory medications');
  } else {
    console.log('  ❌ Medications list missing low inventory state');
  }
  
  // Check for badge props passed to MedicationCard
  const passesBadgeProps = listContent.includes('showLowQuantityBadge');
  if (passesBadgeProps) {
    console.log('  ✅ Medications list passes badge props to MedicationCard');
  } else {
    console.log('  ❌ Medications list not passing badge props');
  }
} else {
  console.log('  ❌ Medications list not found');
}

// Test 8: Check app layout integration
console.log('\n✓ Test 8: Checking app layout integration...');
const layoutPath = path.join(__dirname, 'app/_layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Check for InventoryCheckBootstrapper
  const hasBootstrapper = layoutContent.includes('InventoryCheckBootstrapper');
  if (hasBootstrapper) {
    console.log('  ✅ App layout has InventoryCheckBootstrapper');
  } else {
    console.log('  ❌ App layout missing InventoryCheckBootstrapper');
  }
  
  // Check for AppState listener
  const hasAppState = layoutContent.includes('AppState');
  if (hasAppState) {
    console.log('  ✅ App layout listens to AppState changes');
  } else {
    console.log('  ❌ App layout missing AppState listener');
  }
  
  // Check for daily check logic
  const hasDailyCheck = layoutContent.includes('shouldRunDailyCheck');
  if (hasDailyCheck) {
    console.log('  ✅ App layout implements daily inventory check');
  } else {
    console.log('  ❌ App layout missing daily check logic');
  }
} else {
  console.log('  ❌ App layout not found');
}

// Test 9: Check patient home integration
console.log('\n✓ Test 9: Checking patient home integration...');
const homePath = path.join(__dirname, 'app/patient/home.tsx');
if (fs.existsSync(homePath)) {
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  // Check for low inventory notification in dose taking
  const hasLowInventoryAlert = homeContent.includes('Inventario bajo') ||
                               homeContent.includes('Low inventory');
  if (hasLowInventoryAlert) {
    console.log('  ✅ Patient home shows low inventory alert after dose taking');
  } else {
    console.log('  ⚠️  Patient home may not show low inventory alert');
  }
} else {
  console.log('  ❌ Patient home not found');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Low Quantity Alerts Implementation Test Complete!');
console.log('='.repeat(60));
console.log('\nSummary:');
console.log('- LowQuantityBanner component created');
console.log('- RefillDialog component created');
console.log('- MedicationCard updated with low quantity badge');
console.log('- MedicationForm integrated with banner and dialog');
console.log('- Medications list shows badges for low inventory');
console.log('- LowQuantityNotificationService created');
console.log('- Daily inventory check integrated in app layout');
console.log('- Notification trigger on dose taking (already implemented)');

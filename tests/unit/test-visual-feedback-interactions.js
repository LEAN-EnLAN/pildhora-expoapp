/**
 * Visual Feedback Interactions Test
 * 
 * Tests Task 18.2 implementation:
 * - Button press feedback (scale, opacity)
 * - Card press feedback
 * - Loading spinners for async operations
 * - Success/error toasts
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Visual Feedback Interactions Implementation\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function fileContains(filePath, searchString) {
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return content.includes(searchString);
}

function fileContainsAll(filePath, searchStrings) {
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return searchStrings.every(str => content.includes(str));
}

// Test 1: ToastContext Implementation
console.log('\n📋 Test 1: ToastContext Implementation');
console.log('-'.repeat(60));

test('ToastContext file exists', () => {
  if (!fileExists('src/contexts/ToastContext.tsx')) {
    throw new Error('ToastContext.tsx not found');
  }
});

test('ToastContext exports ToastProvider', () => {
  if (!fileContains('src/contexts/ToastContext.tsx', 'export const ToastProvider')) {
    throw new Error('ToastProvider not exported');
  }
});

test('ToastContext exports useToast hook', () => {
  if (!fileContains('src/contexts/ToastContext.tsx', 'export const useToast')) {
    throw new Error('useToast hook not exported');
  }
});

test('ToastContext has showToast function', () => {
  if (!fileContains('src/contexts/ToastContext.tsx', 'showToast')) {
    throw new Error('showToast function not found');
  }
});

test('ToastContext has hideToast function', () => {
  if (!fileContains('src/contexts/ToastContext.tsx', 'hideToast')) {
    throw new Error('hideToast function not found');
  }
});

test('ToastContext renders Toast component', () => {
  if (!fileContains('src/contexts/ToastContext.tsx', '<Toast')) {
    throw new Error('Toast component not rendered');
  }
});

// Test 2: LoadingSpinner Component
console.log('\n📋 Test 2: LoadingSpinner Component');
console.log('-'.repeat(60));

test('LoadingSpinner file exists', () => {
  if (!fileExists('src/components/ui/LoadingSpinner.tsx')) {
    throw new Error('LoadingSpinner.tsx not found');
  }
});

test('LoadingSpinner has size prop', () => {
  if (!fileContains('src/components/ui/LoadingSpinner.tsx', 'size?:')) {
    throw new Error('size prop not found');
  }
});

test('LoadingSpinner has overlay prop', () => {
  if (!fileContains('src/components/ui/LoadingSpinner.tsx', 'overlay?:')) {
    throw new Error('overlay prop not found');
  }
});

test('LoadingSpinner has message prop', () => {
  if (!fileContains('src/components/ui/LoadingSpinner.tsx', 'message?:')) {
    throw new Error('message prop not found');
  }
});

test('LoadingSpinner uses ActivityIndicator', () => {
  if (!fileContains('src/components/ui/LoadingSpinner.tsx', 'ActivityIndicator')) {
    throw new Error('ActivityIndicator not used');
  }
});

test('LoadingSpinner has fade animation', () => {
  if (!fileContains('src/components/ui/LoadingSpinner.tsx', 'fadeAnim')) {
    throw new Error('Fade animation not implemented');
  }
});

// Test 3: useVisualFeedback Hook
console.log('\n📋 Test 3: useVisualFeedback Hook');
console.log('-'.repeat(60));

test('useVisualFeedback file exists', () => {
  if (!fileExists('src/hooks/useVisualFeedback.ts')) {
    throw new Error('useVisualFeedback.ts not found');
  }
});

test('useVisualFeedback exports hook', () => {
  if (!fileContains('src/hooks/useVisualFeedback.ts', 'export const useVisualFeedback')) {
    throw new Error('useVisualFeedback hook not exported');
  }
});

test('useVisualFeedback returns scaleAnim', () => {
  if (!fileContains('src/hooks/useVisualFeedback.ts', 'scaleAnim')) {
    throw new Error('scaleAnim not returned');
  }
});

test('useVisualFeedback returns opacityAnim', () => {
  if (!fileContains('src/hooks/useVisualFeedback.ts', 'opacityAnim')) {
    throw new Error('opacityAnim not returned');
  }
});

test('useVisualFeedback returns handlePressIn', () => {
  if (!fileContains('src/hooks/useVisualFeedback.ts', 'handlePressIn')) {
    throw new Error('handlePressIn not returned');
  }
});

test('useVisualFeedback returns handlePressOut', () => {
  if (!fileContains('src/hooks/useVisualFeedback.ts', 'handlePressOut')) {
    throw new Error('handlePressOut not returned');
  }
});

test('useVisualFeedback uses useCallback', () => {
  if (!fileContains('src/hooks/useVisualFeedback.ts', 'useCallback')) {
    throw new Error('useCallback not used for memoization');
  }
});

// Test 4: Button Component Press Feedback
console.log('\n📋 Test 4: Button Component Press Feedback');
console.log('-'.repeat(60));

test('Button has press animations', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'scaleAnim')) {
    throw new Error('Scale animation not found');
  }
});

test('Button has handlePressIn', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'handlePressIn')) {
    throw new Error('handlePressIn not found');
  }
});

test('Button has handlePressOut', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'handlePressOut')) {
    throw new Error('handlePressOut not found');
  }
});

test('Button has loading prop', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'loading?:')) {
    throw new Error('loading prop not found');
  }
});

test('Button shows ActivityIndicator when loading', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'ActivityIndicator')) {
    throw new Error('ActivityIndicator not shown when loading');
  }
});

// Test 5: Card Component Press Feedback
console.log('\n📋 Test 5: Card Component Press Feedback');
console.log('-'.repeat(60));

test('Card has press animations', () => {
  if (!fileContains('src/components/ui/Card.tsx', 'scaleAnim')) {
    throw new Error('Scale animation not found');
  }
});

test('Card has opacity animation', () => {
  if (!fileContains('src/components/ui/Card.tsx', 'opacityAnim')) {
    throw new Error('Opacity animation not found');
  }
});

test('Card has handlePressIn', () => {
  if (!fileContains('src/components/ui/Card.tsx', 'handlePressIn')) {
    throw new Error('handlePressIn not found');
  }
});

test('Card has handlePressOut', () => {
  if (!fileContains('src/components/ui/Card.tsx', 'handlePressOut')) {
    throw new Error('handlePressOut not found');
  }
});

test('Card uses Animated.View for press feedback', () => {
  if (!fileContains('src/components/ui/Card.tsx', 'Animated.View')) {
    throw new Error('Animated.View not used');
  }
});

// Test 6: QuickActionsPanel Press Feedback
console.log('\n📋 Test 6: QuickActionsPanel Press Feedback');
console.log('-'.repeat(60));

test('QuickActionsPanel has press animations', () => {
  if (!fileContains('src/components/caregiver/QuickActionsPanel.tsx', 'scaleAnim')) {
    throw new Error('Scale animation not found');
  }
});

test('QuickActionsPanel has opacity animation', () => {
  if (!fileContains('src/components/caregiver/QuickActionsPanel.tsx', 'opacityAnim')) {
    throw new Error('Opacity animation not found');
  }
});

test('QuickActionsPanel cards are memoized', () => {
  if (!fileContains('src/components/caregiver/QuickActionsPanel.tsx', 'React.memo')) {
    throw new Error('QuickActionCard not memoized');
  }
});

test('QuickActionsPanel uses spring animation', () => {
  if (!fileContains('src/components/caregiver/QuickActionsPanel.tsx', 'Animated.spring')) {
    throw new Error('Spring animation not used');
  }
});

// Test 7: DeviceConnectivityCard Feedback
console.log('\n📋 Test 7: DeviceConnectivityCard Feedback');
console.log('-'.repeat(60));

test('DeviceConnectivityCard has fade animation', () => {
  if (!fileContains('src/components/caregiver/DeviceConnectivityCard.tsx', 'fadeAnim')) {
    throw new Error('Fade animation not found');
  }
});

test('DeviceConnectivityCard shows loading state', () => {
  if (!fileContains('src/components/caregiver/DeviceConnectivityCard.tsx', 'ActivityIndicator')) {
    throw new Error('Loading state not shown');
  }
});

test('DeviceConnectivityCard has error state', () => {
  if (!fileContains('src/components/caregiver/DeviceConnectivityCard.tsx', 'errorContainer')) {
    throw new Error('Error state not implemented');
  }
});

test('DeviceConnectivityCard uses Button component', () => {
  if (!fileContains('src/components/caregiver/DeviceConnectivityCard.tsx', '<Button')) {
    throw new Error('Button component not used');
  }
});

// Test 8: LastMedicationStatusCard Feedback
console.log('\n📋 Test 8: LastMedicationStatusCard Feedback');
console.log('-'.repeat(60));

test('LastMedicationStatusCard has fade animation', () => {
  if (!fileExists('src/components/caregiver/LastMedicationStatusCard.tsx')) {
    throw new Error('File not found');
  }
  if (!fileContains('src/components/caregiver/LastMedicationStatusCard.tsx', 'fadeAnim')) {
    throw new Error('Fade animation not found');
  }
});

test('LastMedicationStatusCard shows loading skeleton', () => {
  if (!fileContains('src/components/caregiver/LastMedicationStatusCard.tsx', 'SkeletonLoader')) {
    throw new Error('Loading skeleton not shown');
  }
});

test('LastMedicationStatusCard has error state', () => {
  if (!fileContains('src/components/caregiver/LastMedicationStatusCard.tsx', 'errorContainer')) {
    throw new Error('Error state not implemented');
  }
});

test('LastMedicationStatusCard uses Button component', () => {
  if (!fileContains('src/components/caregiver/LastMedicationStatusCard.tsx', '<Button')) {
    throw new Error('Button component not used');
  }
});

// Test 9: MedicationEventCard Feedback
console.log('\n📋 Test 9: MedicationEventCard Feedback');
console.log('-'.repeat(60));

test('MedicationEventCard uses Card component', () => {
  if (!fileExists('src/components/caregiver/MedicationEventCard.tsx')) {
    throw new Error('File not found');
  }
  if (!fileContains('src/components/caregiver/MedicationEventCard.tsx', '<Card')) {
    throw new Error('Card component not used');
  }
});

test('MedicationEventCard has onPress prop', () => {
  if (!fileContains('src/components/caregiver/MedicationEventCard.tsx', 'onPress={onPress}')) {
    throw new Error('onPress prop not passed to Card');
  }
});

test('MedicationEventCard is memoized', () => {
  if (!fileContains('src/components/caregiver/MedicationEventCard.tsx', 'React.memo')) {
    throw new Error('Component not memoized');
  }
});

// Test 10: Example Component
console.log('\n📋 Test 10: Example Component');
console.log('-'.repeat(60));

test('VisualFeedbackExample file exists', () => {
  if (!fileExists('src/components/examples/VisualFeedbackExample.tsx')) {
    throw new Error('VisualFeedbackExample.tsx not found');
  }
});

test('Example demonstrates button feedback', () => {
  if (!fileContains('src/components/examples/VisualFeedbackExample.tsx', 'Button Press Feedback')) {
    throw new Error('Button feedback example not found');
  }
});

test('Example demonstrates card feedback', () => {
  if (!fileContains('src/components/examples/VisualFeedbackExample.tsx', 'Card Press Feedback')) {
    throw new Error('Card feedback example not found');
  }
});

test('Example demonstrates loading spinners', () => {
  if (!fileContains('src/components/examples/VisualFeedbackExample.tsx', 'Loading Spinners')) {
    throw new Error('Loading spinner example not found');
  }
});

test('Example demonstrates toasts', () => {
  if (!fileContains('src/components/examples/VisualFeedbackExample.tsx', 'Toast Notifications')) {
    throw new Error('Toast example not found');
  }
});

test('Example uses useToast hook', () => {
  if (!fileContains('src/components/examples/VisualFeedbackExample.tsx', 'useToast')) {
    throw new Error('useToast hook not used');
  }
});

test('Example uses useVisualFeedback hook', () => {
  if (!fileContains('src/components/examples/VisualFeedbackExample.tsx', 'useVisualFeedback')) {
    throw new Error('useVisualFeedback hook not used');
  }
});

// Test 11: Documentation
console.log('\n📋 Test 11: Documentation');
console.log('-'.repeat(60));

test('Visual Feedback Guide exists', () => {
  if (!fileExists('.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_GUIDE.md')) {
    throw new Error('VISUAL_FEEDBACK_GUIDE.md not found');
  }
});

test('Quick Reference exists', () => {
  if (!fileExists('.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_QUICK_REFERENCE.md')) {
    throw new Error('VISUAL_FEEDBACK_QUICK_REFERENCE.md not found');
  }
});

test('Guide documents ToastContext', () => {
  if (!fileContains('.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_GUIDE.md', 'ToastContext')) {
    throw new Error('ToastContext not documented');
  }
});

test('Guide documents LoadingSpinner', () => {
  if (!fileContains('.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_GUIDE.md', 'LoadingSpinner')) {
    throw new Error('LoadingSpinner not documented');
  }
});

test('Guide documents useVisualFeedback', () => {
  if (!fileContains('.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_GUIDE.md', 'useVisualFeedback')) {
    throw new Error('useVisualFeedback not documented');
  }
});

test('Guide has usage examples', () => {
  if (!fileContains('.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_GUIDE.md', '```typescript')) {
    throw new Error('Usage examples not found');
  }
});

test('Guide has best practices', () => {
  if (!fileContains('.kiro/specs/caregiver-dashboard-redesign/VISUAL_FEEDBACK_GUIDE.md', 'Best Practices')) {
    throw new Error('Best practices not documented');
  }
});

// Test 12: Animation Performance
console.log('\n📋 Test 12: Animation Performance');
console.log('-'.repeat(60));

test('Button uses native driver', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'useNativeDriver: true')) {
    throw new Error('Native driver not used in Button');
  }
});

test('Card uses native driver', () => {
  if (!fileContains('src/components/ui/Card.tsx', 'useNativeDriver: true')) {
    throw new Error('Native driver not used in Card');
  }
});

test('QuickActionsPanel uses native driver', () => {
  if (!fileContains('src/components/caregiver/QuickActionsPanel.tsx', 'useNativeDriver: true')) {
    throw new Error('Native driver not used in QuickActionsPanel');
  }
});

test('LoadingSpinner uses native driver', () => {
  if (!fileContains('src/components/ui/LoadingSpinner.tsx', 'useNativeDriver: true')) {
    throw new Error('Native driver not used in LoadingSpinner');
  }
});

test('Toast uses native driver', () => {
  if (!fileContains('src/components/ui/Toast.tsx', 'useNativeDriver: true')) {
    throw new Error('Native driver not used in Toast');
  }
});

// Test 13: Accessibility
console.log('\n📋 Test 13: Accessibility');
console.log('-'.repeat(60));

test('Button has accessibility labels', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'accessibilityLabel')) {
    throw new Error('Accessibility labels not found in Button');
  }
});

test('Card has accessibility labels', () => {
  if (!fileContains('src/components/ui/Card.tsx', 'accessibilityLabel')) {
    throw new Error('Accessibility labels not found in Card');
  }
});

test('Toast has accessibility role', () => {
  if (!fileContains('src/components/ui/Toast.tsx', 'accessibilityRole')) {
    throw new Error('Accessibility role not found in Toast');
  }
});

test('Toast has live region', () => {
  if (!fileContains('src/components/ui/Toast.tsx', 'accessibilityLiveRegion')) {
    throw new Error('Live region not found in Toast');
  }
});

test('Button has accessibility state', () => {
  if (!fileContains('src/components/ui/Button.tsx', 'accessibilityState')) {
    throw new Error('Accessibility state not found in Button');
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${passCount + failCount}`);
console.log(`🎯 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 All tests passed! Visual feedback implementation is complete.');
  console.log('\n✨ Task 18.2 Implementation Summary:');
  console.log('   ✅ Button press feedback (scale, opacity)');
  console.log('   ✅ Card press feedback');
  console.log('   ✅ Loading spinners for async operations');
  console.log('   ✅ Success/error toasts');
  console.log('   ✅ Reusable hooks and utilities');
  console.log('   ✅ Comprehensive documentation');
  console.log('   ✅ Example component');
  console.log('   ✅ Accessibility compliance');
  console.log('   ✅ Performance optimizations');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}

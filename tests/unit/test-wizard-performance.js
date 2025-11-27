/**
 * Performance Optimization Verification Test
 * 
 * This test verifies that the medication wizard components have been properly
 * optimized with React.memo, useCallback, and other performance best practices.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Medication Wizard Performance Optimizations...\n');

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function addResult(category, message) {
  results[category].push(message);
}

// Read component files
const componentsDir = path.join(__dirname, 'src', 'components', 'patient', 'medication-wizard');

const files = [
  'MedicationIconNameStep.tsx',
  'MedicationScheduleStep.tsx',
  'MedicationDosageStep.tsx'
];

console.log('📋 Checking component files...\n');

files.forEach(filename => {
  const filePath = path.join(componentsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    addResult('failed', `❌ ${filename}: File not found`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const componentName = filename.replace('.tsx', '');

  console.log(`\n🔎 Analyzing ${componentName}...`);

  // Check 1: React.memo usage
  const hasMemo = content.includes('React.memo(function');
  if (hasMemo) {
    addResult('passed', `✅ ${componentName}: Uses React.memo for main component`);
    console.log('  ✅ React.memo: Found');
  } else {
    addResult('failed', `❌ ${componentName}: Missing React.memo wrapper`);
    console.log('  ❌ React.memo: Not found');
  }

  // Check 2: useCallback usage
  const useCallbackCount = (content.match(/useCallback\(/g) || []).length;
  if (useCallbackCount > 0) {
    addResult('passed', `✅ ${componentName}: Uses useCallback (${useCallbackCount} instances)`);
    console.log(`  ✅ useCallback: ${useCallbackCount} instances found`);
  } else {
    addResult('warnings', `⚠️  ${componentName}: No useCallback found - consider optimizing callbacks`);
    console.log('  ⚠️  useCallback: Not found');
  }

  // Check 3: useMemo usage for expensive computations
  const useMemoCount = (content.match(/useMemo\(/g) || []).length;
  if (useMemoCount > 0) {
    addResult('passed', `✅ ${componentName}: Uses useMemo (${useMemoCount} instances)`);
    console.log(`  ✅ useMemo: ${useMemoCount} instances found`);
  } else {
    addResult('warnings', `⚠️  ${componentName}: No useMemo found - check if expensive computations exist`);
    console.log('  ⚠️  useMemo: Not found');
  }

  // Check 4: Debounced validation
  const hasDebounce = content.includes('useDebouncedCallback');
  if (hasDebounce) {
    addResult('passed', `✅ ${componentName}: Uses debounced validation`);
    console.log('  ✅ Debounced validation: Found');
  } else {
    console.log('  ℹ️  Debounced validation: Not applicable or not found');
  }

  // Check 5: Inline function definitions (anti-pattern)
  const inlineFunctions = content.match(/\s+on\w+\s*=\s*{\s*\(\)/g) || [];
  if (inlineFunctions.length > 0) {
    addResult('warnings', `⚠️  ${componentName}: Found ${inlineFunctions.length} potential inline function definitions`);
    console.log(`  ⚠️  Inline functions: ${inlineFunctions.length} potential issues found`);
  } else {
    addResult('passed', `✅ ${componentName}: No inline function definitions detected`);
    console.log('  ✅ Inline functions: None detected');
  }

  // Check 6: Sub-component memoization
  const subComponentMemos = (content.match(/const \w+ = React\.memo\(function/g) || []).length;
  if (subComponentMemos > 0) {
    addResult('passed', `✅ ${componentName}: Has ${subComponentMemos} memoized sub-components`);
    console.log(`  ✅ Sub-component memos: ${subComponentMemos} found`);
  }

  // Check 7: Proper dependency arrays
  const emptyDepsCount = (content.match(/\[\s*\]/g) || []).length;
  const depsWithVarsCount = (content.match(/\[[\w\s,\.]+\]/g) || []).length;
  console.log(`  ℹ️  Dependency arrays: ${emptyDepsCount} empty, ${depsWithVarsCount} with dependencies`);
});

// Check performance utilities
console.log('\n\n🔧 Checking performance utilities...\n');

const perfUtilsPath = path.join(__dirname, 'src', 'utils', 'performance.ts');
if (fs.existsSync(perfUtilsPath)) {
  const perfContent = fs.readFileSync(perfUtilsPath, 'utf8');
  
  const hasDebounce = perfContent.includes('useDebouncedCallback');
  const hasThrottle = perfContent.includes('useThrottle');
  const hasFlatListOpts = perfContent.includes('getFlatListOptimizationProps');
  
  if (hasDebounce) {
    addResult('passed', '✅ Performance utils: useDebouncedCallback available');
    console.log('  ✅ useDebouncedCallback: Available');
  }
  if (hasThrottle) {
    addResult('passed', '✅ Performance utils: useThrottle available');
    console.log('  ✅ useThrottle: Available');
  }
  if (hasFlatListOpts) {
    addResult('passed', '✅ Performance utils: FlatList optimizations available');
    console.log('  ✅ FlatList optimizations: Available');
  }
} else {
  addResult('failed', '❌ Performance utilities file not found');
  console.log('  ❌ performance.ts: Not found');
}

// Print summary
console.log('\n\n' + '='.repeat(60));
console.log('📊 PERFORMANCE OPTIMIZATION VERIFICATION SUMMARY');
console.log('='.repeat(60) + '\n');

console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}\n`);

if (results.passed.length > 0) {
  console.log('✅ PASSED CHECKS:');
  results.passed.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (results.failed.length > 0) {
  console.log('❌ FAILED CHECKS:');
  results.failed.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  results.warnings.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

// Overall result
const overallPass = results.failed.length === 0;

if (overallPass) {
  console.log('✅ OVERALL: All critical performance optimizations are in place!');
  console.log('\n📝 Recommendations:');
  console.log('   1. Profile components with React DevTools to verify render counts');
  console.log('   2. Test on low-end devices to ensure smooth performance');
  console.log('   3. Monitor for memory leaks during extended use');
  console.log('   4. Verify scroll performance maintains 60fps');
} else {
  console.log('❌ OVERALL: Some critical optimizations are missing.');
  console.log('   Please review the failed checks above.');
}

console.log('\n' + '='.repeat(60) + '\n');

// Exit with appropriate code
process.exit(overallPass ? 0 : 1);

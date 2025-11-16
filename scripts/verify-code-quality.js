/**
 * Code Quality Verification Script
 * 
 * Performs comprehensive code quality checks on the caregiver dashboard codebase:
 * - Reviews code for quality issues
 * - Identifies duplicated code
 * - Checks for unused imports
 * - Verifies consistent naming conventions
 * - Validates TypeScript types
 * - Checks accessibility compliance
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

// Configuration
const config = {
  caregiverComponentsDir: 'src/components/caregiver',
  caregiverScreensDir: 'app/caregiver',
  caregiverHooksDir: 'src/hooks',
  caregiverServicesDir: 'src/services',
  caregiverTypesFile: 'src/types/index.ts',
};

// Results tracking
const results = {
  totalFiles: 0,
  issues: [],
  duplicates: [],
  unusedImports: [],
  namingIssues: [],
  typeIssues: [],
  accessibilityIssues: [],
  passed: 0,
  failed: 0,
};

/**
 * Main execution function
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}===========================================`);
  console.log(`Code Quality Verification`);
  console.log(`===========================================${colors.reset}\n`);

  try {
    // 1. Review code quality
    console.log(`${colors.bright}1. Reviewing Code Quality...${colors.reset}`);
    await reviewCodeQuality();

    // 2. Check for duplicated code
    console.log(`\n${colors.bright}2. Checking for Duplicated Code...${colors.reset}`);
    await checkDuplicatedCode();

    // 3. Check for unused imports
    console.log(`\n${colors.bright}3. Checking for Unused Imports...${colors.reset}`);
    await checkUnusedImports();

    // 4. Verify naming conventions
    console.log(`\n${colors.bright}4. Verifying Naming Conventions...${colors.reset}`);
    await verifyNamingConventions();

    // 5. Validate TypeScript types
    console.log(`\n${colors.bright}5. Validating TypeScript Types...${colors.reset}`);
    await validateTypeScript();

    // 6. Check accessibility compliance
    console.log(`\n${colors.bright}6. Checking Accessibility Compliance...${colors.reset}`);
    await checkAccessibility();

    // Print summary
    printSummary();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`${colors.red}Error during verification:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Review code quality
 */
async function reviewCodeQuality() {
  const files = getAllFiles([
    config.caregiverComponentsDir,
    config.caregiverScreensDir,
  ]);

  results.totalFiles = files.length;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const issues = [];

    // Check for console.log statements (should be removed in production)
    const consoleLogMatches = content.match(/console\.log\(/g);
    if (consoleLogMatches && consoleLogMatches.length > 0) {
      issues.push(`Found ${consoleLogMatches.length} console.log statement(s)`);
    }

    // Check for TODO comments
    const todoMatches = content.match(/\/\/\s*TODO:/gi);
    if (todoMatches && todoMatches.length > 0) {
      issues.push(`Found ${todoMatches.length} TODO comment(s)`);
    }

    // Check for proper JSDoc comments on exported functions/components
    if (content.includes('export default') || content.includes('export function') || content.includes('export const')) {
      const hasJSDoc = content.includes('/**');
      if (!hasJSDoc) {
        issues.push('Missing JSDoc documentation for exported items');
      }
    }

    // Check for proper error handling
    const tryBlocks = (content.match(/try\s*{/g) || []).length;
    const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
    if (tryBlocks !== catchBlocks) {
      issues.push('Mismatched try-catch blocks');
    }

    if (issues.length > 0) {
      results.issues.push({
        file: path.relative(process.cwd(), file),
        issues,
      });
      results.failed++;
    } else {
      results.passed++;
    }
  }

  console.log(`${colors.green}✓ Reviewed ${files.length} files${colors.reset}`);
  if (results.issues.length > 0) {
    console.log(`${colors.yellow}⚠ Found issues in ${results.issues.length} file(s)${colors.reset}`);
  }
}

/**
 * Check for duplicated code
 */
async function checkDuplicatedCode() {
  const files = getAllFiles([
    config.caregiverComponentsDir,
    config.caregiverScreensDir,
  ]);

  const codeBlocks = new Map();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract function bodies (simplified)
    const functionMatches = content.matchAll(/(?:function|const)\s+(\w+)\s*[=\(][\s\S]*?{([\s\S]*?)}/g);
    
    for (const match of functionMatches) {
      const functionName = match[1];
      const functionBody = match[2].trim();
      
      // Skip very small functions
      if (functionBody.length < 100) continue;
      
      // Normalize whitespace for comparison
      const normalized = functionBody.replace(/\s+/g, ' ');
      
      if (codeBlocks.has(normalized)) {
        const existing = codeBlocks.get(normalized);
        results.duplicates.push({
          original: existing,
          duplicate: {
            file: path.relative(process.cwd(), file),
            function: functionName,
          },
        });
      } else {
        codeBlocks.set(normalized, {
          file: path.relative(process.cwd(), file),
          function: functionName,
        });
      }
    }
  }

  if (results.duplicates.length > 0) {
    console.log(`${colors.yellow}⚠ Found ${results.duplicates.length} potential duplicate(s)${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ No significant code duplication detected${colors.reset}`);
  }
}

/**
 * Check for unused imports
 */
async function checkUnusedImports() {
  const files = getAllFiles([
    config.caregiverComponentsDir,
    config.caregiverScreensDir,
  ]);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Extract imports
    const imports = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('import ')) {
        // Extract imported names
        const match = line.match(/import\s+(?:{([^}]+)}|(\w+))/);
        if (match) {
          const namedImports = match[1] ? match[1].split(',').map(s => s.trim()) : [];
          const defaultImport = match[2];
          
          if (defaultImport) imports.push(defaultImport);
          imports.push(...namedImports);
        }
      }
    }

    // Check if each import is used
    const unusedInFile = [];
    for (const importName of imports) {
      // Skip type imports
      if (importName.startsWith('type ')) continue;
      
      const cleanName = importName.replace(/\s+as\s+\w+/, '').trim();
      
      // Count occurrences (excluding the import line itself)
      const regex = new RegExp(`\\b${cleanName}\\b`, 'g');
      const matches = content.match(regex) || [];
      
      // If only appears once (the import itself), it's unused
      if (matches.length <= 1) {
        unusedInFile.push(cleanName);
      }
    }

    if (unusedInFile.length > 0) {
      results.unusedImports.push({
        file: path.relative(process.cwd(), file),
        unused: unusedInFile,
      });
    }
  }

  if (results.unusedImports.length > 0) {
    console.log(`${colors.yellow}⚠ Found unused imports in ${results.unusedImports.length} file(s)${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ No unused imports detected${colors.reset}`);
  }
}

/**
 * Verify naming conventions
 */
async function verifyNamingConventions() {
  const files = getAllFiles([
    config.caregiverComponentsDir,
    config.caregiverScreensDir,
  ]);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const issues = [];

    // Check component names (should be PascalCase)
    const componentMatches = content.matchAll(/(?:function|const)\s+([A-Z]\w+)\s*[=\(]/g);
    for (const match of componentMatches) {
      const name = match[1];
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        issues.push(`Component name '${name}' should be PascalCase`);
      }
    }

    // Check hook names (should start with 'use')
    const hookMatches = content.matchAll(/(?:function|const)\s+(use\w+)\s*[=\(]/g);
    for (const match of hookMatches) {
      const name = match[1];
      if (!/^use[A-Z][a-zA-Z0-9]*$/.test(name)) {
        issues.push(`Hook name '${name}' should follow useXxx pattern`);
      }
    }

    // Check constant names (should be UPPER_SNAKE_CASE for true constants)
    const constMatches = content.matchAll(/const\s+([A-Z_][A-Z0-9_]*)\s*=/g);
    for (const match of constMatches) {
      const name = match[1];
      if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
        issues.push(`Constant name '${name}' should be UPPER_SNAKE_CASE`);
      }
    }

    if (issues.length > 0) {
      results.namingIssues.push({
        file: path.relative(process.cwd(), file),
        issues,
      });
    }
  }

  if (results.namingIssues.length > 0) {
    console.log(`${colors.yellow}⚠ Found naming issues in ${results.namingIssues.length} file(s)${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ All naming conventions followed${colors.reset}`);
  }
}

/**
 * Validate TypeScript types
 */
async function validateTypeScript() {
  const files = getAllFiles([
    config.caregiverComponentsDir,
    config.caregiverScreensDir,
  ]);

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const issues = [];

    // Check for 'any' type usage (should be avoided)
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 0) {
      issues.push(`Found ${anyMatches.length} usage(s) of 'any' type`);
    }

    // Check for proper interface/type definitions
    const propsInterfaces = content.match(/interface\s+\w+Props/g);
    const exportedComponents = content.match(/export\s+(?:default\s+)?(?:function|const)\s+[A-Z]\w+/g);
    
    if (exportedComponents && exportedComponents.length > 0 && (!propsInterfaces || propsInterfaces.length === 0)) {
      // Check if component has props
      if (content.includes('(props') || content.includes('({')) {
        issues.push('Component with props missing Props interface definition');
      }
    }

    if (issues.length > 0) {
      results.typeIssues.push({
        file: path.relative(process.cwd(), file),
        issues,
      });
    }
  }

  if (results.typeIssues.length > 0) {
    console.log(`${colors.yellow}⚠ Found TypeScript issues in ${results.typeIssues.length} file(s)${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ TypeScript types properly defined${colors.reset}`);
  }
}

/**
 * Check accessibility compliance
 */
async function checkAccessibility() {
  const files = getAllFiles([
    config.caregiverComponentsDir,
    config.caregiverScreensDir,
  ]);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const issues = [];

    // Check for TouchableOpacity without accessibility props
    const touchableMatches = content.matchAll(/<TouchableOpacity[\s\S]*?>/g);
    for (const match of touchableMatches) {
      const element = match[0];
      if (!element.includes('accessibilityLabel') && !element.includes('accessible={false}')) {
        issues.push('TouchableOpacity missing accessibilityLabel');
      }
      if (!element.includes('accessibilityRole')) {
        issues.push('TouchableOpacity missing accessibilityRole');
      }
    }

    // Check for Pressable without accessibility props
    const pressableMatches = content.matchAll(/<Pressable[\s\S]*?>/g);
    for (const match of pressableMatches) {
      const element = match[0];
      if (!element.includes('accessibilityLabel') && !element.includes('accessible={false}')) {
        issues.push('Pressable missing accessibilityLabel');
      }
    }

    // Check for Text components that should have accessibility
    const textMatches = content.matchAll(/<Text[\s\S]*?>/g);
    let textCount = 0;
    let accessibleTextCount = 0;
    for (const match of textMatches) {
      textCount++;
      const element = match[0];
      if (element.includes('accessibilityLabel') || element.includes('accessibilityRole')) {
        accessibleTextCount++;
      }
    }

    // If less than 30% of Text components have accessibility props, flag it
    if (textCount > 5 && accessibleTextCount / textCount < 0.3) {
      issues.push(`Low accessibility coverage: only ${accessibleTextCount}/${textCount} Text components have accessibility props`);
    }

    if (issues.length > 0) {
      results.accessibilityIssues.push({
        file: path.relative(process.cwd(), file),
        issues,
      });
    }
  }

  if (results.accessibilityIssues.length > 0) {
    console.log(`${colors.yellow}⚠ Found accessibility issues in ${results.accessibilityIssues.length} file(s)${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Accessibility compliance verified${colors.reset}`);
  }
}

/**
 * Print summary of results
 */
function printSummary() {
  console.log(`\n${colors.bright}${colors.cyan}===========================================`);
  console.log(`Summary`);
  console.log(`===========================================${colors.reset}\n`);

  console.log(`Total files reviewed: ${colors.bright}${results.totalFiles}${colors.reset}`);
  console.log(`Files passed: ${colors.green}${results.passed}${colors.reset}`);
  console.log(`Files with issues: ${colors.yellow}${results.failed}${colors.reset}\n`);

  // Print detailed issues
  if (results.issues.length > 0) {
    console.log(`${colors.bright}Code Quality Issues:${colors.reset}`);
    results.issues.forEach(({ file, issues }) => {
      console.log(`  ${colors.yellow}${file}${colors.reset}`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    });
    console.log('');
  }

  if (results.duplicates.length > 0) {
    console.log(`${colors.bright}Duplicated Code:${colors.reset}`);
    results.duplicates.slice(0, 5).forEach(({ original, duplicate }) => {
      console.log(`  ${colors.yellow}${original.file}:${original.function}${colors.reset}`);
      console.log(`    duplicated in ${duplicate.file}:${duplicate.function}`);
    });
    if (results.duplicates.length > 5) {
      console.log(`  ... and ${results.duplicates.length - 5} more`);
    }
    console.log('');
  }

  if (results.unusedImports.length > 0) {
    console.log(`${colors.bright}Unused Imports:${colors.reset}`);
    results.unusedImports.slice(0, 5).forEach(({ file, unused }) => {
      console.log(`  ${colors.yellow}${file}${colors.reset}`);
      console.log(`    ${unused.join(', ')}`);
    });
    if (results.unusedImports.length > 5) {
      console.log(`  ... and ${results.unusedImports.length - 5} more files`);
    }
    console.log('');
  }

  if (results.namingIssues.length > 0) {
    console.log(`${colors.bright}Naming Convention Issues:${colors.reset}`);
    results.namingIssues.slice(0, 3).forEach(({ file, issues }) => {
      console.log(`  ${colors.yellow}${file}${colors.reset}`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    });
    if (results.namingIssues.length > 3) {
      console.log(`  ... and ${results.namingIssues.length - 3} more files`);
    }
    console.log('');
  }

  if (results.typeIssues.length > 0) {
    console.log(`${colors.bright}TypeScript Issues:${colors.reset}`);
    results.typeIssues.slice(0, 3).forEach(({ file, issues }) => {
      console.log(`  ${colors.yellow}${file}${colors.reset}`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    });
    if (results.typeIssues.length > 3) {
      console.log(`  ... and ${results.typeIssues.length - 3} more files`);
    }
    console.log('');
  }

  if (results.accessibilityIssues.length > 0) {
    console.log(`${colors.bright}Accessibility Issues:${colors.reset}`);
    results.accessibilityIssues.slice(0, 3).forEach(({ file, issues }) => {
      console.log(`  ${colors.yellow}${file}${colors.reset}`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    });
    if (results.accessibilityIssues.length > 3) {
      console.log(`  ... and ${results.accessibilityIssues.length - 3} more files`);
    }
    console.log('');
  }

  // Overall status
  const totalIssues = results.issues.length + results.duplicates.length + 
                      results.unusedImports.length + results.namingIssues.length +
                      results.typeIssues.length + results.accessibilityIssues.length;

  if (totalIssues === 0) {
    console.log(`${colors.green}${colors.bright}✓ All checks passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠ Found ${totalIssues} issue(s) that should be addressed${colors.reset}\n`);
  }
}

/**
 * Get all files recursively from directories
 */
function getAllFiles(dirs) {
  const files = [];

  function traverse(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!item.startsWith('.') && item !== 'node_modules' && item !== '__tests__') {
          traverse(fullPath);
        }
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }

  dirs.forEach(dir => traverse(dir));
  return files;
}

// Run the script
main();

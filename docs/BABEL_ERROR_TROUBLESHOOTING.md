# Babel Plugin Error Troubleshooting Guide

## Error Message
```
ERROR  node_modules\expo\AppEntry.js: [BABEL] C:\path\to\project\node_modules\expo\AppEntry.js: .plugins is not a valid Plugin property
```

## Root Cause Analysis

This error typically occurs when:
1. **Cached Babel configuration** from previous NativeWind versions
2. **Conflicting plugin versions** in node_modules
3. **Metro bundler cache** containing old transformations
4. **Dependency resolution conflicts** between local and EAS builds

## Immediate Fix Steps

### Step 1: Complete Cache Clearing
```bash
# Clear all caches in sequence
npm cache clean --force
npx expo start --clear
npx expo start --reset-cache
```

### Step 2: Clean Reinstall
```bash
# Remove all node_modules and lock files
rm -rf node_modules package-lock.json

# Fresh install
npm install
```

### Step 3: Verify Configuration
Run the validation script:
```bash
# On Windows
scripts\validate-nativewind-migration.bat

# Or PowerShell
powershell -ExecutionPolicy Bypass -File scripts\validate-nativewind-migration.ps1
```

### Step 4: Test with Minimal Configuration
Create a temporary minimal babel.config.js:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      'nativewind/babel',
    ],
  };
};
```

If this works, gradually add other plugins back.

## Advanced Troubleshooting

### Check for Conflicting Dependencies
```bash
# Check for multiple Babel versions
npm ls @babel/core

# Check for multiple NativeWind versions
npm ls nativewind

# Check for conflicting plugins
npm ls babel-plugin-module-resolver
```

### Verify Metro Configuration
Ensure your metro.config.js doesn't conflict with Babel:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove any custom Babel configuration from Metro
// Babel should only be configured in babel.config.js

module.exports = config;
```

### EAS Build Specific Issues

#### Lockfile Synchronization
```bash
# Ensure consistent lockfile
rm package-lock.json
npm install

# Verify lockfile integrity
npm ci

# Test EAS build locally first
eas build --platform ios --profile development --local
```

#### Environment Variables
Check for conflicting environment variables:
```bash
# Clear Expo environment
unset EXPO_BABEL_EXPERIMENTAL
unset EXPO_NO_DOTENV

# Set production environment for testing
set NODE_ENV=production
```

## Common Pitfalls and Solutions

### 1. Plugin Ordering Issues
**Problem**: Plugins in wrong order
**Solution**: Ensure `'nativewind/babel'` is first

```javascript
// CORRECT
plugins: [
  'nativewind/babel',        // MUST be first
  'module-resolver',
  'react-native-reanimated/plugin', // MUST be last
]
```

### 2. Duplicate Plugin Registration
**Problem**: Same plugin registered multiple times
**Solution**: Check for duplicates in babel.config.js

### 3. Version Mismatches
**Problem**: Incompatible dependency versions
**Solution**: Use exact versions:

```json
{
  "dependencies": {
    "nativewind": "^4.1.19"
  },
  "devDependencies": {
    "tailwindcss": "3.3.2",
    "babel-preset-expo": "^54.0.6"
  }
}
```

### 4. Metro Cache Corruption
**Problem**: Metro cache contains stale transformations
**Solution**: Complete Metro reset:

```bash
# Reset Metro cache completely
npx expo r -c

# Or manually delete cache
rm -rf .expo
```

## Diagnostic Commands

### Check Babel Transformation
```bash
# Test Babel transformation directly
npx babel --presets babel-preset-expo --plugins nativewind/babel app/_layout.tsx
```

### Verify Metro Bundler
```bash
# Check Metro configuration
npx expo config --type introspect

# Test Metro bundling
npx expo export --platform ios
```

### Debug EAS Build
```bash
# Get detailed EAS build logs
eas build --platform ios --profile development --verbose

# Check EAS build configuration
eas build:list --limit=1 --platform=ios
```

## Prevention Strategies

### 1. Consistent Environment Setup
```bash
# Use same Node.js version locally and in EAS
node --version  # Should match EAS build environment

# Use npm instead of yarn for consistency
npm install
```

### 2. Lockfile Management
```bash
# Always commit package-lock.json
git add package-lock.json
git commit -m "Update lockfile"

# Use npm ci for builds
npm ci  # Not npm install
```

### 3. Cache Strategy
```json
// In eas.json
{
  "build": {
    "production": {
      "cache": {
        "disabled": false,
        "key": "nativewind-v4-${hash}"
      }
    }
  }
}
```

## Emergency Rollback

If all else fails, rollback to working state:

```bash
# Restore backup files
cp babel.config.js.backup babel.config.js
cp package.json.backup package.json

# Reinstall old version
npm install nativewind@2.x
npm install

# Clear caches
npm cache clean --force
npx expo start --clear
```

## Getting Help

1. **Check NativeWind Issues**: [GitHub Issues](https://github.com/nativewind/nativewind/issues)
2. **Expo Forums**: [Community Support](https://forums.expo.dev/)
3. **Discord**: Real-time help in Expo Discord

## Quick Fix Script

Run the automated fix script:
```bash
# On Windows
scripts\fix-babel-error.bat

# This will:
# 1. Clear all caches
# 2. Reinstall dependencies
# 3. Verify configuration
# 4. Test build
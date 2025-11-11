# NativeWind v4 Migration Command Reference

## Quick Migration Commands

### 1. Pre-Migration Backup
```bash
# Create backup of critical configuration files
cp package.json package.json.backup
cp babel.config.js babel.config.js.backup
cp tailwind.config.js tailwind.config.js.backup
cp eas.json eas.json.backup
```

### 2. Dependency Management
```bash
# Remove old NativeWind and related packages
npm uninstall nativewind tailwindcss

# Install NativeWind v4
npm install nativewind@^4.1.19

# Install tailwindcss ONLY if needed (see guide for details)
npm install --save-dev tailwindcss@3.3.2

# Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 3. EAS Build Commands
```bash
# Clear EAS build cache
eas build:clear-cache

# Test local build before remote
eas build --platform ios --profile development --local

# Build with cache invalidation
eas build --platform all --profile preview --clear-cache

# Dry run to verify configuration
eas build --platform all --profile production --dry-run
```

### 4. Verification Commands
```bash
# Check Babel configuration
npx babel --version

# Verify Metro bundler
npx expo start --no-dev --minify

# TypeScript compilation check
npx tsc --noEmit

# Bundle analysis
npx expo start --bundle-output bundle.js
```

## Troubleshooting Commands

### Dependency Resolution Issues
```bash
# Verify package integrity
npm audit
npm audit fix

# Check for conflicting packages
npm ls nativewind
npm ls tailwindcss

# Rebuild patches (if using patch-package)
npm run postinstall
```

### Cache Clearing Sequence
```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Clear Expo cache
npx expo start --clear

# 3. Clear Metro cache
npx expo start --reset-cache

# 4. Clear EAS cache
eas build:clear-cache

# 5. Clear watchman (macOS/Linux)
watchman watch-del-all
```

### Build Environment Diagnostics
```bash
# Check Node.js version
node --version

# Check Expo CLI version
npx expo --version

# Check EAS CLI version
eas --version

# Verify environment variables
echo $NODE_ENV
echo $EXPO_PUBLIC_ENABLE_PUSH_REGISTRATION
```

## Migration Validation Script

Create a script to validate your migration:

```bash
#!/bin/bash
# migration-check.sh

echo "🔍 NativeWind v4 Migration Validation"
echo "====================================="

# Check NativeWind version
echo "📦 Checking NativeWind version..."
npm ls nativewind

# Check Babel configuration
echo "🔧 Checking Babel configuration..."
if grep -q "nativewind/babel" babel.config.js; then
    echo "✅ Babel plugin found"
else
    echo "❌ Babel plugin missing"
fi

# Check tailwind.config.js
echo "🎨 Checking Tailwind configuration..."
if ! grep -q "nativewind/preset" tailwind.config.js; then
    echo "✅ No v2 preset found"
else
    echo "❌ v2 preset still present"
fi

# Check TypeScript definitions
echo "📝 Checking TypeScript definitions..."
if [ -f "nativewind-env.d.ts" ]; then
    echo "✅ Type definitions present"
else
    echo "❌ Type definitions missing"
fi

echo "✨ Validation complete!"
```

## Emergency Rollback Commands

```bash
# Restore configuration files
cp package.json.backup package.json
cp babel.config.js.backup babel.config.js
cp tailwind.config.js.backup tailwind.config.js
cp eas.json.backup eas.json

# Reinstall old version
npm install nativewind@2.x
npm install

# Clear caches
npm cache clean --force
npx expo start --clear
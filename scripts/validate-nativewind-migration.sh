#!/bin/bash
# NativeWind v4 Migration Validation Script

echo "🔍 NativeWind v4 Migration Validation"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if required files exist
echo "📁 Checking required files..."
files_exist=0

if [ -f "package.json" ]; then
    print_status 0 "package.json found"
else
    print_status 1 "package.json missing"
    files_exist=1
fi

if [ -f "babel.config.js" ]; then
    print_status 0 "babel.config.js found"
else
    print_status 1 "babel.config.js missing"
    files_exist=1
fi

if [ -f "tailwind.config.js" ]; then
    print_status 0 "tailwind.config.js found"
else
    print_status 1 "tailwind.config.js missing"
    files_exist=1
fi

if [ -f "eas.json" ]; then
    print_status 0 "eas.json found"
else
    print_status 1 "eas.json missing"
    files_exist=1
fi

if [ -f "nativewind-env.d.ts" ]; then
    print_status 0 "nativewind-env.d.ts found"
else
    print_status 1 "nativewind-env.d.ts missing"
    files_exist=1
fi

if [ $files_exist -ne 0 ]; then
    echo -e "${RED}❌ Some required files are missing. Please check your project structure.${NC}"
    exit 1
fi

# Check NativeWind version
echo ""
echo "📦 Checking NativeWind version..."
if command -v npm &> /dev/null; then
    nativewind_version=$(npm ls nativewind 2>/dev/null | grep nativewind | head -1 | sed 's/.*@//')
    if [[ $nativewind_version == 4.* ]]; then
        print_status 0 "NativeWind v4 found: $nativewind_version"
    else
        print_status 1 "NativeWind v4 not found. Current version: $nativewind_version"
    fi
else
    print_warning "npm not found in PATH"
fi

# Check tailwindcss version
echo ""
echo "🎨 Checking Tailwind CSS version..."
if command -v npm &> /dev/null; then
    tailwind_version=$(npm ls tailwindcss 2>/dev/null | grep tailwindcss | head -1 | sed 's/.*@//')
    if [[ $tailwind_version == 3.3.2 ]]; then
        print_status 0 "Tailwind CSS 3.3.2 found: $tailwind_version"
    elif [ -z "$tailwind_version" ]; then
        print_warning "Tailwind CSS not installed (may be OK for basic usage)"
    else
        print_warning "Tailwind CSS version mismatch: $tailwind_version (expected 3.3.2 or not installed)"
    fi
else
    print_warning "npm not found in PATH"
fi

# Check Babel configuration
echo ""
echo "🔧 Checking Babel configuration..."
if grep -q "nativewind/babel" babel.config.js; then
    print_status 0 "NativeWind Babel plugin found"
    
    # Check if it's the first plugin
    plugin_line=$(grep -n "nativewind/babel" babel.config.js | cut -d: -f1)
    if [ $plugin_line -eq 7 ]; then
        print_status 0 "NativeWind Babel plugin is correctly positioned"
    else
        print_warning "NativeWind Babel plugin may not be in optimal position"
    fi
else
    print_status 1 "NativeWind Babel plugin not found"
fi

# Check tailwind.config.js for v2 remnants
echo ""
echo "🎨 Checking Tailwind configuration..."
if grep -q "nativewind/preset" tailwind.config.js; then
    print_status 1 "v2 preset found in tailwind.config.js (should be removed)"
else
    print_status 0 "No v2 preset found in tailwind.config.js"
fi

if grep -q "Using NativeWind v2" tailwind.config.js; then
    print_status 1 "v2 comment found in tailwind.config.js"
else
    print_status 0 "No v2 comments found in tailwind.config.js"
fi

# Check EAS configuration
echo ""
echo "🏗️  Checking EAS configuration..."
if grep -q "cache" eas.json; then
    print_status 0 "Cache configuration found in eas.json"
else
    print_warning "No cache configuration found in eas.json"
fi

if grep -q "nativewind-v4" eas.json; then
    print_status 0 "NativeWind v4 cache key found in eas.json"
else
    print_warning "NativeWind v4 cache key not found in eas.json"
fi

# Check TypeScript definitions
echo ""
echo "📝 Checking TypeScript definitions..."
if [ -f "nativewind-env.d.ts" ]; then
    if grep -q "nativewind/types" nativewind-env.d.ts; then
        print_status 0 "NativeWind type definitions found"
    else
        print_status 1 "NativeWind type definitions missing"
    fi
fi

# Check for common issues
echo ""
echo "🔍 Checking for common issues..."

# Check for duplicate plugins in babel.config.js
plugin_count=$(grep -c "nativewind/babel" babel.config.js)
if [ $plugin_count -eq 1 ]; then
    print_status 0 "No duplicate NativeWind plugins found"
else
    print_status 1 "Multiple NativeWind plugins found ($plugin_count)"
fi

# Check for syntax errors in config files
echo ""
echo "🧪 Testing configuration syntax..."

if command -v node &> /dev/null; then
    # Test babel.config.js syntax
    if node -c babel.config.js 2>/dev/null; then
        print_status 0 "babel.config.js syntax is valid"
    else
        print_status 1 "babel.config.js has syntax errors"
    fi
    
    # Test tailwind.config.js syntax
    if node -c tailwind.config.js 2>/dev/null; then
        print_status 0 "tailwind.config.js syntax is valid"
    else
        print_status 1 "tailwind.config.js has syntax errors"
    fi
    
    # Test eas.json syntax
    if node -e "JSON.parse(require('fs').readFileSync('eas.json', 'utf8'))" 2>/dev/null; then
        print_status 0 "eas.json syntax is valid"
    else
        print_status 1 "eas.json has syntax errors"
    fi
else
    print_warning "Node.js not found in PATH, skipping syntax checks"
fi

# Summary
echo ""
echo "📊 Migration Validation Summary"
echo "================================"

# Provide next steps
echo ""
print_info "Next steps:"
echo "1. Run 'npm install' to install new dependencies"
echo "2. Clear caches: 'npm cache clean --force' and 'npx expo start --clear'"
echo "3. Test local development: 'npx expo start'"
echo "4. Test EAS build: 'eas build --platform ios --profile development --local'"
echo ""
print_info "If you encounter issues, check the migration guide at:"
echo "docs/NATIVEWIND_V4_MIGRATION_GUIDE.md"

echo ""
echo "✨ Validation complete!"
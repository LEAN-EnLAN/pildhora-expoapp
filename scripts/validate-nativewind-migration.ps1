# NativeWind v4 Migration Validation Script for PowerShell

Write-Host "NativeWind v4 Migration Validation" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$passedChecks = 0
$totalChecks = 0

function Check-File {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    if (Test-Path $FilePath) {
        Write-Host "[PASS] $Description found" -ForegroundColor Green
        $script:passedChecks++
    } else {
        Write-Host "[FAIL] $Description missing" -ForegroundColor Red
    }
    $script:totalChecks++
}

function Check-Content {
    param(
        [string]$FilePath,
        [string]$SearchText,
        [string]$Description,
        [bool]$ShouldExist = $true
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        $contains = $content -like "*$SearchText*"
        
        if ($ShouldExist -and $contains) {
            Write-Host "[PASS] $Description" -ForegroundColor Green
            $script:passedChecks++
        } elseif (-not $ShouldExist -and -not $contains) {
            Write-Host "[PASS] $Description" -ForegroundColor Green
            $script:passedChecks++
        } else {
            Write-Host "[FAIL] $Description" -ForegroundColor Red
        }
    } else {
        Write-Host "[FAIL] $Description (file not found)" -ForegroundColor Red
    }
    $script:totalChecks++
}

# Check required files
Write-Host "`nChecking required files..." -ForegroundColor Yellow
Check-File "package.json" "package.json"
Check-File "babel.config.js" "babel.config.js"
Check-File "tailwind.config.js" "tailwind.config.js"
Check-File "eas.json" "eas.json"
Check-File "nativewind-env.d.ts" "nativewind-env.d.ts"

# Check NativeWind in package.json
Write-Host "`nChecking NativeWind version..." -ForegroundColor Yellow
try {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.dependencies.PSObject.Properties.Name -contains "nativewind") {
        Write-Host "[PASS] NativeWind found in package.json" -ForegroundColor Green
        $passedChecks++
    } else {
        Write-Host "[FAIL] NativeWind not found in package.json" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Error reading package.json" -ForegroundColor Red
}
$totalChecks++

# Check tailwindcss in package.json
Write-Host "`nChecking Tailwind CSS version..." -ForegroundColor Yellow
try {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.devDependencies.PSObject.Properties.Name -contains "tailwindcss") {
        Write-Host "[PASS] Tailwind CSS found in package.json" -ForegroundColor Green
        $passedChecks++
    } else {
        Write-Host "[WARN] Tailwind CSS not installed (may be OK for basic usage)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Error reading package.json" -ForegroundColor Yellow
}
$totalChecks++

# Check Babel configuration
Write-Host "`nChecking Babel configuration..." -ForegroundColor Yellow
Check-Content "babel.config.js" "nativewind/babel" "NativeWind Babel plugin found"

# Check Tailwind configuration
Write-Host "`nChecking Tailwind configuration..." -ForegroundColor Yellow
Check-Content "tailwind.config.js" "nativewind/preset" "No v2 preset found in tailwind.config.js" $false
Check-Content "tailwind.config.js" "Using NativeWind v2" "No v2 comments found in tailwind.config.js" $false

# Check EAS configuration
Write-Host "`nChecking EAS configuration..." -ForegroundColor Yellow
Check-Content "eas.json" "cache" "Cache configuration found in eas.json"
Check-Content "eas.json" "nativewind-v4" "NativeWind v4 cache key found in eas.json"

# Check TypeScript definitions
Write-Host "`nChecking TypeScript definitions..." -ForegroundColor Yellow
Check-Content "nativewind-env.d.ts" "nativewind/types" "NativeWind type definitions found"

# Summary
Write-Host "`nMigration Validation Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Passed: $passedChecks/$totalChecks checks" -ForegroundColor $(if ($passedChecks -eq $totalChecks) { "Green" } else { "Yellow" })

# Next steps
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm install' to install new dependencies"
Write-Host "2. Clear caches: 'npm cache clean --force' and 'npx expo start --clear'"
Write-Host "3. Test local development: 'npx expo start'"
Write-Host "4. Test EAS build: 'eas build --platform ios --profile development --local'"
Write-Host "`nIf you encounter issues, check the migration guide at:"
Write-Host "docs/NATIVEWIND_V4_MIGRATION_GUIDE.md"

Write-Host "`nValidation complete!" -ForegroundColor Green

# Keep window open if run from Explorer
if ($Host.Name -eq "ConsoleHost") {
    Write-Host "`nPress any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
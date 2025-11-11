@echo off
REM NativeWind v4 Migration Validation Script for Windows

echo NativeWind v4 Migration Validation
echo =====================================

REM Initialize counters
set /a total_checks=0
set /a passed_checks=0

REM Function to check if file exists
:check_file
if exist "%~1" (
    echo [PASS] %~2 found
    set /a passed_checks+=1
) else (
    echo [FAIL] %~2 missing
)
set /a total_checks+=1
goto :eof

REM Check required files
echo Checking required files...

call :check_file "package.json" "package.json"
call :check_file "babel.config.js" "babel.config.js"
call :check_file "tailwind.config.js" "tailwind.config.js"
call :check_file "eas.json" "eas.json"
call :check_file "nativewind-env.d.ts" "nativewind-env.d.ts"

echo.

REM Check NativeWind version
echo Checking NativeWind version...
for /f "tokens=*" %%i in ('npm ls nativewind 2^>nul ^| findstr nativewind') do set nativewind_line=%%i
if "%nativewind_line%" neq "" (
    echo [PASS] NativeWind found in package.json
    set /a passed_checks+=1
) else (
    echo [FAIL] NativeWind not found in package.json
)
set /a total_checks+=1

REM Check tailwindcss version
echo.
echo Checking Tailwind CSS version...
for /f "tokens=*" %%i in ('npm ls tailwindcss 2^>nul ^| findstr tailwindcss') do set tailwind_line=%%i
if "%tailwind_line%" neq "" (
    echo [PASS] Tailwind CSS found in package.json
    set /a passed_checks+=1
) else (
    echo [WARN] Tailwind CSS not installed (may be OK for basic usage)
)
set /a total_checks+=1

REM Check Babel configuration
echo.
echo Checking Babel configuration...
findstr /C:"nativewind/babel" babel.config.js >nul
if %errorlevel% equ 0 (
    echo [PASS] NativeWind Babel plugin found
    set /a passed_checks+=1
) else (
    echo [FAIL] NativeWind Babel plugin not found
)
set /a total_checks+=1

REM Check for v2 preset in tailwind.config.js
echo.
echo Checking Tailwind configuration...
findstr /C:"nativewind/preset" tailwind.config.js >nul
if %errorlevel% equ 1 (
    echo [PASS] No v2 preset found in tailwind.config.js
    set /a passed_checks+=1
) else (
    echo [FAIL] v2 preset found in tailwind.config.js (should be removed)
)
set /a total_checks+=1

findstr /C:"Using NativeWind v2" tailwind.config.js >nul
if %errorlevel% equ 1 (
    echo [PASS] No v2 comments found in tailwind.config.js
    set /a passed_checks+=1
) else (
    echo [FAIL] v2 comment found in tailwind.config.js
)
set /a total_checks+=1

REM Check EAS configuration
echo.
echo Checking EAS configuration...
findstr /C:"cache" eas.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Cache configuration found in eas.json
    set /a passed_checks+=1
) else (
    echo [WARN] No cache configuration found in eas.json
)
set /a total_checks+=1

findstr /C:"nativewind-v4" eas.json >nul
if %errorlevel% equ 0 (
    echo [PASS] NativeWind v4 cache key found in eas.json
    set /a passed_checks+=1
) else (
    echo [WARN] NativeWind v4 cache key not found in eas.json
)
set /a total_checks+=1

REM Check TypeScript definitions
echo.
echo Checking TypeScript definitions...
findstr /C:"nativewind/types" nativewind-env.d.ts >nul
if %errorlevel% equ 0 (
    echo [PASS] NativeWind type definitions found
    set /a passed_checks+=1
) else (
    echo [FAIL] NativeWind type definitions missing
)
set /a total_checks+=1

REM Summary
echo.
echo Migration Validation Summary
echo ================================
echo Passed: %passed_checks%/%total_checks% checks

REM Provide next steps
echo.
echo Next steps:
echo 1. Run 'npm install' to install new dependencies
echo 2. Clear caches: 'npm cache clean --force' and 'npx expo start --clear'
echo 3. Test local development: 'npx expo start'
echo 4. Test EAS build: 'eas build --platform ios --profile development --local'
echo.
echo If you encounter issues, check the migration guide at:
echo docs/NATIVEWIND_V4_MIGRATION_GUIDE.md

echo.
echo Validation complete!

pause

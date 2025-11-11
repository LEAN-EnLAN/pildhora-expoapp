@echo off
REM Fix Babel Plugin Error for NativeWind v4 Migration

echo Fixing Babel Plugin Error
echo ========================

echo Step 1: Clearing npm cache...
npm cache clean --force

echo.
echo Step 2: Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 3: Clearing Expo cache...
npx expo start --clear --non-interactive 2>nul
timeout /t 2 >nul

echo.
echo Step 4: Clearing Metro cache...
npx expo start --reset-cache --non-interactive 2>nul
timeout /t 2 >nul

echo.
echo Step 5: Installing dependencies...
npm install

echo.
echo Step 6: Rebuilding patches (if using patch-package)...
npm run postinstall 2>nul

echo.
echo Step 7: Verifying Babel configuration...
node -e "console.log('Babel config syntax:', require('./babel.config.js') ? 'VALID' : 'INVALID')"

echo.
echo Step 8: Testing Metro bundler...
npx expo start --no-dev --minify --non-interactive 2>nul
timeout /t 5 >nul

echo.
echo Babel error fix complete!
echo.
echo If the error persists, try:
echo 1. Restart your terminal/IDE
echo 2. Run: npx expo install --fix
echo 3. Check for conflicting Babel plugins in node_modules

pause
@echo off
echo Updating Firestore security rules...
firebase deploy --only firestore:rules
echo.
echo Firestore rules updated successfully!
echo.
echo The changes should resolve the "Failed to load data" and "insufficient permissions" errors.
echo.
pause
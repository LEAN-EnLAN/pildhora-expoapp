# Security Fix: Removed Exposed Credentials

## Issue
Google Cloud Service Account credentials were hardcoded in the following files:
- `fix-missing-patient-ids.js`
- `fix-tomas-setup.js`

## Actions Taken

### 1. Removed Hardcoded Credentials
Both files have been updated to load credentials from environment variables instead of hardcoding them.

### 2. Updated .gitignore
Added patterns to prevent future credential files from being committed:
```
*serviceAccount*.json
*service-account*.json
firebase-adminsdk-*.json
```

### 3. Created Documentation
Created `CREDENTIALS_SETUP.md` with instructions for:
- Setting up credentials securely
- Using environment variables
- Security best practices
- Steps to take if credentials are exposed

## Next Steps (CRITICAL)

### ⚠️ IMMEDIATE ACTION REQUIRED:

1. **Revoke the exposed credentials in Firebase Console:**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Find the service account: `firebase-adminsdk-fbsvc@pildhora-app2.iam.gserviceaccount.com`
   - Delete or disable this service account key (ID: `1684b37985d23022861880afb92ba74e2bc1934d`)
   - Generate a new private key

2. **Clean Git history** (the credentials are still in your Git history):
   ```bash
   # Option 1: Use BFG Repo-Cleaner (recommended)
   # Download from: https://rtyley.github.io/bfg-repo-cleaner/
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Option 2: Use git filter-branch
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch fix-missing-patient-ids.js fix-tomas-setup.js" \
     --prune-empty --tag-name-filter cat -- --all
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push to remote** (⚠️ coordinate with your team first):
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

4. **Set up new credentials** following the instructions in `CREDENTIALS_SETUP.md`

5. **Notify your team** to:
   - Pull the cleaned repository
   - Update their local credentials
   - Never commit credentials again

## Files Modified
- ✅ `fix-missing-patient-ids.js` - Removed hardcoded credentials
- ✅ `fix-tomas-setup.js` - Removed hardcoded credentials
- ✅ `.gitignore` - Added credential file patterns
- ✅ `CREDENTIALS_SETUP.md` - Created setup documentation
- ✅ `SECURITY_FIX_SUMMARY.md` - This file

## Prevention
- All scripts now require environment variables
- .gitignore updated to block credential files
- Documentation provided for secure setup
- Team should be trained on credential security

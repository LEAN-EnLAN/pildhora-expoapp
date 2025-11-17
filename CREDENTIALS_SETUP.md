# Firebase Credentials Setup

## ⚠️ IMPORTANT: Never commit credentials to Git!

This project requires Firebase service account credentials to run admin scripts. Follow these steps to set up credentials securely:

## Setup Instructions

### Option 1: Using a Service Account JSON File (Recommended)

1. Download your Firebase service account JSON file from the Firebase Console:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the file as `serviceAccount.json` in the project root (this file is gitignored)

2. Set the environment variable:
   ```bash
   # Windows (PowerShell)
   $env:GOOGLE_APPLICATION_CREDENTIALS="./serviceAccount.json"
   
   # Windows (CMD)
   set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
   
   # Linux/Mac
   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
   ```

3. Run your script:
   ```bash
   node fix-missing-patient-ids.js
   ```

### Option 2: Using Environment Variable

1. Copy your service account JSON content

2. Set it as an environment variable:
   ```bash
   # Windows (PowerShell)
   $env:FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   
   # Linux/Mac
   export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

3. Run your script:
   ```bash
   node fix-missing-patient-ids.js
   ```

### Option 3: Using .env File (Local Development)

1. Create a `.env` file in the project root (this file is gitignored)

2. Add your credentials:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
   ```
   
   OR
   
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```

3. The scripts will automatically load from `.env`

## Security Best Practices

✅ DO:
- Store credentials in environment variables
- Use `.gitignore` to exclude credential files
- Rotate credentials if they're exposed
- Use different service accounts for dev/prod

❌ DON'T:
- Commit credentials to Git
- Share credentials in chat/email
- Use production credentials in development
- Store credentials in code files

## If Credentials Were Exposed

If you accidentally committed credentials:

1. **Immediately revoke the exposed credentials** in Firebase Console
2. Generate new credentials
3. Remove credentials from Git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch fix-missing-patient-ids.js fix-tomas-setup.js" \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. Force push to remote (⚠️ coordinate with team first)
5. Update all team members to use new credentials

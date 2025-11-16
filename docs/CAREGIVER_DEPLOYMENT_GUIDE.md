# Caregiver Dashboard Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the caregiver dashboard redesign to production. Follow these steps carefully to ensure a smooth deployment with minimal downtime.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Security Rules Deployment](#security-rules-deployment)
5. [Application Deployment](#application-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring and Alerts](#monitoring-and-alerts)

---

## Pre-Deployment Checklist

### Code Review

- [ ] All code changes reviewed and approved
- [ ] All tests passing (unit, integration, E2E)
- [ ] No console errors or warnings
- [ ] TypeScript compilation successful
- [ ] ESLint checks passing
- [ ] Accessibility audit completed

### Documentation

- [ ] API documentation updated
- [ ] Database schema documented
- [ ] User guides created
- [ ] Troubleshooting guide prepared
- [ ] Deployment guide reviewed

### Testing

- [ ] Manual testing on iOS completed
- [ ] Manual testing on Android completed
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] Accessibility testing completed
- [ ] Multi-patient scenarios tested

### Infrastructure

- [ ] Firebase project configured
- [ ] Firestore indexes created
- [ ] Security rules tested in emulator
- [ ] Cloud Functions deployed (if any)
- [ ] Environment variables configured
- [ ] Backup procedures verified

### Communication

- [ ] Stakeholders notified of deployment
- [ ] Maintenance window scheduled
- [ ] Support team briefed
- [ ] User communication prepared
- [ ] Rollback plan documented

---

## Environment Setup

### 1. Configure Firebase Project

Ensure your Firebase project is properly configured:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select project
firebase use production
```

### 2. Environment Variables

Create or update `.env` file:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# Realtime Database URL
FIREBASE_DATABASE_URL=your_database_url

# Environment
NODE_ENV=production
```

### 3. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify no vulnerabilities
npm audit

# Update critical packages if needed
npm audit fix
```

### 4. Build Application

```bash
# Clean previous builds
npm run clean

# Build for production
npm run build

# Verify build output
ls -la dist/
```

---

## Database Migration

### 1. Backup Existing Data

**Firestore Backup**:
```bash
# Export Firestore data
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)

# Verify backup
gsutil ls gs://your-bucket/backups/
```

**RTDB Backup**:
```bash
# Export RTDB data
firebase database:get / > rtdb-backup-$(date +%Y%m%d).json

# Verify backup
ls -lh rtdb-backup-*.json
```

### 2. Create Firestore Indexes

Deploy required indexes:

```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Verify indexes in Firebase Console
# Navigate to Firestore > Indexes
```

**Required Indexes**:
- medicationEvents: patientId + timestamp
- medicationEvents: caregiverId + timestamp
- medicationEvents: patientId + eventType + timestamp
- deviceLinks: userId + role + status
- deviceLinks: deviceId + status
- medications: patientId + deletedAt
- tasks: caregiverId + completed

### 3. Run Migration Scripts

If migrating from legacy system:

```bash
# Run migration script
npm run migrate:caregiver

# Verify migration
npm run verify:migration
```

**Migration Script** (`scripts/migrate-caregiver-data.ts`):
```typescript
import { getDbInstance } from '../src/services/firebase';
import { collection, getDocs, query, where, setDoc, doc, serverTimestamp } from 'firebase/firestore';

async function migrateDeviceLinks() {
  const db = await getDbInstance();
  
  // Get all patients with deviceId
  const patientsQuery = query(
    collection(db!, 'users'),
    where('role', '==', 'patient'),
    where('deviceId', '!=', null)
  );
  
  const patients = await getDocs(patientsQuery);
  
  for (const patientDoc of patients.docs) {
    const patient = patientDoc.data();
    const deviceId = patient.deviceId;
    const patientId = patient.uid;
    
    // Create device link
    const linkId = `${deviceId}_${patientId}`;
    await setDoc(doc(db!, 'deviceLinks', linkId), {
      deviceId,
      userId: patientId,
      role: 'patient',
      status: 'active',
      linkedAt: serverTimestamp(),
      linkedBy: patientId,
    });
    
    console.log(`Created device link: ${linkId}`);
  }
}

// Run migration
migrateDeviceLinks().catch(console.error);
```

### 4. Validate Data Integrity

```bash
# Run validation script
npm run validate:data
```

**Validation Checks**:
- All patients with deviceId have corresponding deviceLinks
- All deviceLinks reference valid devices
- All medications have valid patientId
- All events have valid medicationId and patientId

---

## Security Rules Deployment

### 1. Test Security Rules Locally

```bash
# Start Firebase emulator
firebase emulators:start

# Run security rules tests
npm run test:security-rules
```

### 2. Deploy Firestore Rules

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules:get
```

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isCaregiver() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'caregiver';
    }
    
    function hasDeviceAccess(deviceId) {
      return exists(/databases/$(database)/documents/deviceLinks/$(deviceId + '_' + request.auth.uid));
    }
    
    // deviceLinks collection
    match /deviceLinks/{linkId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      allow create: if isAuthenticated();
      
      allow update, delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }
    
    // medicationEvents collection
    match /medicationEvents/{eventId} {
      allow read: if isAuthenticated() && (
        resource.data.caregiverId == request.auth.uid ||
        resource.data.patientId == request.auth.uid
      );
      
      allow write: if isAuthenticated();
    }
    
    // medications collection
    match /medications/{medicationId} {
      allow read: if isAuthenticated() && (
        resource.data.patientId == request.auth.uid ||
        resource.data.caregiverId == request.auth.uid
      );
      
      allow write: if isAuthenticated();
    }
    
    // tasks collection
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated() && 
        resource.data.caregiverId == request.auth.uid;
    }
  }
}
```

### 3. Deploy RTDB Rules

```bash
# Deploy RTDB security rules
firebase deploy --only database

# Verify deployment
firebase database:rules:get
```

**RTDB Rules** (`database.rules.json`):
```json
{
  "rules": {
    "devices": {
      "$deviceId": {
        "state": {
          ".read": "auth != null && root.child('users').child(auth.uid).child('devices').child($deviceId).val() === true",
          ".write": "auth != null"
        },
        "config": {
          ".read": "auth != null && root.child('users').child(auth.uid).child('devices').child($deviceId).val() === true",
          ".write": "auth != null && root.child('users').child(auth.uid).child('devices').child($deviceId).val() === true"
        }
      }
    },
    "users": {
      "$userId": {
        "devices": {
          ".read": "auth != null && auth.uid === $userId",
          ".write": "auth != null && auth.uid === $userId"
        }
      }
    }
  }
}
```

---

## Application Deployment

### 1. Build for Production

```bash
# Clean and build
npm run clean
npm run build

# Verify build
npm run verify:build
```

### 2. Deploy to Expo/EAS

**For Expo Go**:
```bash
# Publish update
expo publish --release-channel production
```

**For EAS Build**:
```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 3. Deploy Cloud Functions (if any)

```bash
# Deploy functions
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

### 4. Deploy Hosting (if applicable)

```bash
# Deploy hosting
firebase deploy --only hosting

# Verify deployment
firebase hosting:channel:list
```

---

## Post-Deployment Verification

### 1. Smoke Tests

Run these tests immediately after deployment:

**Authentication**:
- [ ] Caregiver can log in
- [ ] Patient can log in
- [ ] Role verification works
- [ ] Session persistence works

**Device Linking**:
- [ ] Caregiver can link device
- [ ] Device link appears in dashboard
- [ ] Device status updates in real-time
- [ ] Caregiver can unlink device

**Dashboard**:
- [ ] Dashboard loads without errors
- [ ] Quick actions work
- [ ] Device connectivity card shows correct status
- [ ] Last medication status displays

**Events Registry**:
- [ ] Events list loads
- [ ] Filtering works
- [ ] Event detail view works
- [ ] Real-time updates work

**Medications**:
- [ ] Medication list loads
- [ ] Can add new medication
- [ ] Can edit medication
- [ ] Can delete medication
- [ ] Events are generated

**Tasks**:
- [ ] Tasks list loads
- [ ] Can create task
- [ ] Can complete task
- [ ] Can delete task

### 2. Performance Checks

```bash
# Run performance tests
npm run test:performance

# Check bundle size
npm run analyze:bundle

# Monitor initial load time
npm run measure:load-time
```

**Performance Targets**:
- Initial dashboard render: < 2 seconds
- List scroll: 60 FPS
- Navigation transitions: < 300ms
- Data fetch with cache: < 500ms

### 3. Error Monitoring

Check error logs:

```bash
# Firebase Console > Crashlytics
# Check for new errors

# Sentry (if configured)
# Review error reports

# Application logs
# Check for console errors
```

### 4. Analytics Verification

Verify analytics are tracking:

```bash
# Firebase Console > Analytics
# Check for events:
# - caregiver_login
# - device_linked
# - medication_created
# - event_viewed
```

---

## Rollback Procedures

### If Issues Are Detected

### 1. Immediate Rollback

**Expo/EAS**:
```bash
# Rollback to previous version
expo publish --release-channel production --rollback
```

**Cloud Functions**:
```bash
# Rollback functions
firebase functions:rollback
```

### 2. Database Rollback

**Firestore**:
```bash
# Restore from backup
gcloud firestore import gs://your-bucket/backups/YYYYMMDD
```

**RTDB**:
```bash
# Restore from backup
firebase database:set / rtdb-backup-YYYYMMDD.json
```

### 3. Security Rules Rollback

```bash
# Rollback Firestore rules
firebase firestore:rules:release --version PREVIOUS_VERSION

# Rollback RTDB rules
firebase database:rules:release --version PREVIOUS_VERSION
```

### 4. Communication

- [ ] Notify stakeholders of rollback
- [ ] Update status page
- [ ] Inform support team
- [ ] Document issues encountered

---

## Monitoring and Alerts

### 1. Set Up Monitoring

**Firebase Performance Monitoring**:
```typescript
// In app initialization
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

**Custom Metrics**:
```typescript
// Track custom metrics
const trace = perf.trace('caregiver_dashboard_load');
trace.start();
// ... load dashboard
trace.stop();
```

### 2. Configure Alerts

**Firebase Console > Alerts**:
- High error rate (> 5% of requests)
- Slow queries (> 1 second)
- High memory usage (> 80%)
- Crash rate (> 1%)

**Email Notifications**:
- Security rule violations
- Unusual traffic patterns
- Database quota exceeded
- Function errors

### 3. Health Checks

Create automated health checks:

```typescript
// scripts/health-check.ts
async function healthCheck() {
  const checks = [
    checkFirestoreConnection(),
    checkRTDBConnection(),
    checkAuthService(),
    checkSecurityRules(),
  ];
  
  const results = await Promise.all(checks);
  
  if (results.some(r => !r.healthy)) {
    sendAlert('Health check failed');
  }
}

// Run every 5 minutes
setInterval(healthCheck, 5 * 60 * 1000);
```

### 4. Dashboard Monitoring

Monitor these metrics:

**User Metrics**:
- Active caregivers
- Active patients
- Device links created
- Medications managed

**Performance Metrics**:
- Average load time
- API response time
- Error rate
- Crash rate

**Business Metrics**:
- Daily active users
- Feature adoption rate
- User retention
- Support tickets

---

## Troubleshooting

### Common Issues

**Issue**: Users can't log in
- **Check**: Firebase Auth configuration
- **Solution**: Verify API keys and auth domain

**Issue**: Device linking fails
- **Check**: Security rules and device ID format
- **Solution**: Review security rules and validation logic

**Issue**: Real-time updates not working
- **Check**: RTDB connection and listeners
- **Solution**: Verify RTDB rules and listener setup

**Issue**: Events not syncing
- **Check**: Network connectivity and event queue
- **Solution**: Check sync service and retry logic

**Issue**: Performance degradation
- **Check**: Query performance and indexes
- **Solution**: Optimize queries and add indexes

### Debug Mode

Enable debug logging:

```typescript
// In development
if (__DEV__) {
  console.log('[Debug] Enabled');
  // Enable Firebase debug logging
  firebase.setLogLevel('debug');
}
```

### Support Contacts

- **Firebase Support**: firebase-support@google.com
- **Development Team**: dev-team@pildhora.com
- **On-Call Engineer**: oncall@pildhora.com

---

## Maintenance

### Regular Tasks

**Daily**:
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Monitor user feedback

**Weekly**:
- [ ] Review analytics
- [ ] Check database size
- [ ] Prune old cache entries
- [ ] Update documentation

**Monthly**:
- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Backup verification

### Updates

**Minor Updates**:
```bash
# Build and publish
npm run build
expo publish --release-channel production
```

**Major Updates**:
- Follow full deployment process
- Schedule maintenance window
- Notify users in advance
- Prepare rollback plan

---

## Success Criteria

Deployment is successful when:

- [ ] All smoke tests pass
- [ ] Performance targets met
- [ ] No critical errors in logs
- [ ] User feedback is positive
- [ ] Analytics show normal usage
- [ ] Support tickets are minimal

---

## Post-Deployment Tasks

### Week 1

- [ ] Monitor error rates daily
- [ ] Review user feedback
- [ ] Address critical issues
- [ ] Update documentation
- [ ] Conduct team retrospective

### Week 2-4

- [ ] Analyze usage patterns
- [ ] Optimize based on metrics
- [ ] Plan next iteration
- [ ] Update roadmap

---

## Documentation Updates

After deployment, update:

- [ ] API documentation
- [ ] User guides
- [ ] Troubleshooting guide
- [ ] Architecture documentation
- [ ] This deployment guide

---

## Conclusion

Following this guide ensures a smooth deployment of the caregiver dashboard redesign. Always test thoroughly, monitor closely, and be prepared to rollback if issues arise.

For questions or issues during deployment, contact the development team immediately.

Last Updated: 2024

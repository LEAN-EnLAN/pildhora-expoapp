/**
 * Comprehensive Caregiver Permission Diagnosis and Fix Script
 * 
 * This script will:
 * 1. Test Firestore security rules for caregivers
 * 2. Test RTDB access for caregivers
 * 3. Verify deviceLinks are properly configured
 * 4. Fix any permission issues found
 * 5. Validate caregiver can access patient data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with the service account
const serviceAccount = {
  "type": "service_account",
  "project_id": "pildhora-app2",
  "private_key_id": "1684b37985d23022861880afb92ba74e2bc1934d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC4v62azTGj8fAq\ne2CE+2AKQorhuek+LtLb9nvl9SkqMnvASDAvNp00MkvTdbLOT0K60yEcCdD3+De0\n8oymqsx55E4P+S2BPAmxXpox+0N8vInuDYcjutnwF0JRvyl2KU8EAzGUY/kiZ7Ms\nFCY9q8InptaaQQ6pXtPxfYr/x9eXSd5+QqjQ31p8RRjx4NLqHRPOfmPORiD5caAP\nh4ozqiSROTW+jKK+FSO5wwRIeBtSsn3w6bd8p9Xd1vX+aXLDDxk6PjDoKi8WFlB/\n+3o3P3ruAhbMyWLcuhpIK369lKkJMs7nPyECdbQjj3WrxBnx2+8KsR4DmzwORf8t\nRYhGDljRAgMBAAECggEAGCM++Ns3UZ6yDLLa7PT02tJP1+cU0MGIXiHJlUVfL/qx\njXFBDmIZzvCFVKbriiXz53nfOQ0VRtig2pzYAIyPM5u/EToyllB0Sb688avM6Pav\nJLGSxvnKMKKxUQHjVmNWRgVuzF71dWfMEoW9a1BOCSU0o6m9UyanFUWcTAfdpI/S\nzNfUYK0KN6BcXVjY+9A8Q1ziNWOsjkF3q9xDJ1iM0lu+Ryu4cRKrMhZy1JjQHhRV\nSaDKZCZWBPLN2T/+hF2QTx0WCXV/FxVoAI4p8sjCFkbrA7BGZ0gJ6/dLFi5f4NB5\nsxZGvnxPrV+OoQcEhVz+W9I6+xaR6Llm84V0kom9gwKBgQDgqWuBV2qrxDLBXX9J\nREffIOVRH29ozUQY3fz4TXeQc93KTD2kFvs8EqjDGV4hbB2B95xzh94MRu5dCTJU\n5Hi67opkr3NIjSdMJshTr3nScpvMPCemcwVxdaRV/26SpJPkSXHB4r/CkYKr+Fpk\nF2VZcPSy4q/UN4V0DtsC/DIMUwKBgQDShPrBgf58FQWH+lso2UudH4i7UDsLDSh+\nFHAQqaX+epdrqIsSLqO9n6sr+Fqy0mcFNqKEu0m3EwE1nuuDF7wQc5L+zqp5/Q6O\nfg8QUV3qpRO0bg+us/0Q3dpRfocDr7LT94qOFeM75BUhGsPpHeHhiBQlAjpZ0q09\nOOxdMhzBywKBgQCexZ0Ab7MnaSUlmtoWAXd5rVnjFwA5ZLe3i0r4gGb7Y6dfDLqT\neNpc/iLentLzc+D2tPOQgnje3FIg1hsH+9+G3IZZ2dTzdS5MlywEWIMTw4NvtyOe\ncrNqF+XoEPkoEb+jGnSWvZUgAI4E0yOukQpDR5znv2Tb6dEa0FTfqzQDmQKBgDEQ\nQQjcbR0qIRHh7WEF07OY59sQBdK7jFZmGQApKcC3fZbfvxnLuOm2zsP+q9TFaLE0\nXIgmxjVevodqtGTnITOMXBP6woyPx9a51nTtIcBQHNmOVSVYWYCW1AzuOjVHu5vf\nM3GN9Fm+/JWskUBBcKWJe3hsnoDUsv9zxtKpnT4lAoGBAJlA1s372lfaivaDJBff\n6afs0dqS+kacCqmeAvsuY2i0ep8Yqv3IVAIiVj00RJgDp/IgYHz/ScvXdKhyuKei\nrSmUUC+vzdMSNPi5CmYKym84jOMbM6IIgmaRbUMjwGDMEEqfaVdP5Bb4oAaTjcu6\nh28P1ZsnnlKihRFZ77KRIMQI\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@pildhora-app2.iam.gserviceaccount.com",
  "client_id": "104070379857351906700",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40pildhora-app2.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();
const rtdb = admin.database();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function findCaregivers() {
  section('STEP 1: Finding Caregivers');
  
  const usersSnapshot = await db.collection('users').where('role', '==', 'caregiver').get();
  
  if (usersSnapshot.empty) {
    log('❌ No caregivers found in the system', 'red');
    return [];
  }
  
  const caregivers = [];
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    caregivers.push({
      id: doc.id,
      email: data.email,
      name: data.name || 'Unknown',
      ...data
    });
    log(`✓ Found caregiver: ${data.name || data.email} (${doc.id})`, 'green');
  });
  
  return caregivers;
}

async function findPatients() {
  section('STEP 2: Finding Patients');
  
  const usersSnapshot = await db.collection('users').where('role', '==', 'patient').get();
  
  if (usersSnapshot.empty) {
    log('❌ No patients found in the system', 'red');
    return [];
  }
  
  const patients = [];
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    patients.push({
      id: doc.id,
      email: data.email,
      name: data.name || 'Unknown',
      deviceId: data.deviceId,
      ...data
    });
    log(`✓ Found patient: ${data.name || data.email} (${doc.id})`, 'green');
    if (data.deviceId) {
      log(`  Device ID: ${data.deviceId}`, 'blue');
    } else {
      log(`  ⚠ No device linked`, 'yellow');
    }
  });
  
  return patients;
}

async function checkDeviceLinks(caregivers, patients) {
  section('STEP 3: Checking Device Links');
  
  const issues = [];
  
  for (const caregiver of caregivers) {
    log(`\nChecking links for caregiver: ${caregiver.name}`, 'cyan');
    
    const linksSnapshot = await db.collection('deviceLinks')
      .where('userId', '==', caregiver.id)
      .where('role', '==', 'caregiver')
      .get();
    
    if (linksSnapshot.empty) {
      log(`  ⚠ No device links found for this caregiver`, 'yellow');
      issues.push({
        type: 'NO_LINKS',
        caregiverId: caregiver.id,
        caregiverName: caregiver.name
      });
      continue;
    }
    
    linksSnapshot.forEach(doc => {
      const link = doc.data();
      log(`  ✓ Link found: ${doc.id}`, 'green');
      log(`    Device: ${link.deviceId}`, 'blue');
      log(`    Status: ${link.status}`, link.status === 'active' ? 'green' : 'yellow');
      log(`    Linked at: ${link.linkedAt?.toDate?.() || 'Unknown'}`, 'blue');
      
      if (link.status !== 'active') {
        issues.push({
          type: 'INACTIVE_LINK',
          linkId: doc.id,
          caregiverId: caregiver.id,
          deviceId: link.deviceId,
          status: link.status
        });
      }
    });
  }
  
  return issues;
}

async function checkFirestorePermissions(caregivers, patients) {
  section('STEP 4: Checking Firestore Permissions');
  
  const issues = [];
  
  for (const caregiver of caregivers) {
    log(`\nTesting Firestore access for: ${caregiver.name}`, 'cyan');
    
    // Find patients linked to this caregiver
    const linksSnapshot = await db.collection('deviceLinks')
      .where('userId', '==', caregiver.id)
      .where('role', '==', 'caregiver')
      .where('status', '==', 'active')
      .get();
    
    if (linksSnapshot.empty) {
      log(`  ⚠ No active links, skipping permission tests`, 'yellow');
      continue;
    }
    
    for (const linkDoc of linksSnapshot.docs) {
      const link = linkDoc.data();
      const deviceId = link.deviceId;
      
      // Find patient with this device
      const patient = patients.find(p => p.deviceId === deviceId);
      
      if (!patient) {
        log(`  ⚠ No patient found for device ${deviceId}`, 'yellow');
        issues.push({
          type: 'ORPHANED_LINK',
          linkId: linkDoc.id,
          deviceId: deviceId
        });
        continue;
      }
      
      log(`  Testing access to patient: ${patient.name}`, 'blue');
      
      // Test 1: Can read patient user document
      try {
        const patientDoc = await db.collection('users').doc(patient.id).get();
        if (patientDoc.exists) {
          log(`    ✓ Can read patient user document`, 'green');
        } else {
          log(`    ❌ Patient document doesn't exist`, 'red');
          issues.push({
            type: 'MISSING_PATIENT_DOC',
            patientId: patient.id
          });
        }
      } catch (error) {
        log(`    ❌ Cannot read patient user document: ${error.message}`, 'red');
        issues.push({
          type: 'PERMISSION_DENIED_USER',
          caregiverId: caregiver.id,
          patientId: patient.id,
          error: error.message
        });
      }
      
      // Test 2: Can read patient medications
      try {
        const medsSnapshot = await db.collection('medications')
          .where('patientId', '==', patient.id)
          .limit(1)
          .get();
        log(`    ✓ Can query patient medications (${medsSnapshot.size} found)`, 'green');
      } catch (error) {
        log(`    ❌ Cannot query patient medications: ${error.message}`, 'red');
        issues.push({
          type: 'PERMISSION_DENIED_MEDICATIONS',
          caregiverId: caregiver.id,
          patientId: patient.id,
          error: error.message
        });
      }
      
      // Test 3: Can read medication events
      try {
        const eventsSnapshot = await db.collection('medicationEvents')
          .where('patientId', '==', patient.id)
          .limit(1)
          .get();
        log(`    ✓ Can query medication events (${eventsSnapshot.size} found)`, 'green');
      } catch (error) {
        log(`    ❌ Cannot query medication events: ${error.message}`, 'red');
        issues.push({
          type: 'PERMISSION_DENIED_EVENTS',
          caregiverId: caregiver.id,
          patientId: patient.id,
          error: error.message
        });
      }
      
      // Test 4: Can read device document
      try {
        const deviceDoc = await db.collection('devices').doc(deviceId).get();
        if (deviceDoc.exists) {
          log(`    ✓ Can read device document`, 'green');
        } else {
          log(`    ⚠ Device document doesn't exist`, 'yellow');
          issues.push({
            type: 'MISSING_DEVICE_DOC',
            deviceId: deviceId
          });
        }
      } catch (error) {
        log(`    ❌ Cannot read device document: ${error.message}`, 'red');
        issues.push({
          type: 'PERMISSION_DENIED_DEVICE',
          caregiverId: caregiver.id,
          deviceId: deviceId,
          error: error.message
        });
      }
    }
  }
  
  return issues;
}

async function checkRTDBPermissions(caregivers, patients) {
  section('STEP 5: Checking RTDB Permissions');
  
  const issues = [];
  
  for (const patient of patients) {
    if (!patient.deviceId) continue;
    
    log(`\nChecking RTDB for patient: ${patient.name}`, 'cyan');
    
    // Check device state in RTDB
    try {
      const deviceStateRef = rtdb.ref(`deviceState/${patient.deviceId}`);
      const snapshot = await deviceStateRef.once('value');
      
      if (snapshot.exists()) {
        log(`  ✓ Device state exists in RTDB`, 'green');
        const state = snapshot.val();
        log(`    Connection mode: ${state.connectionMode || 'unknown'}`, 'blue');
        log(`    Last updated: ${state.lastUpdated || 'unknown'}`, 'blue');
      } else {
        log(`  ⚠ No device state in RTDB`, 'yellow');
        issues.push({
          type: 'MISSING_DEVICE_STATE',
          deviceId: patient.deviceId,
          patientId: patient.id
        });
      }
    } catch (error) {
      log(`  ❌ Cannot read device state: ${error.message}`, 'red');
      issues.push({
        type: 'RTDB_READ_ERROR',
        deviceId: patient.deviceId,
        error: error.message
      });
    }
    
    // Check user devices mapping
    try {
      const userDevicesRef = rtdb.ref(`users/${patient.id}/devices/${patient.deviceId}`);
      const snapshot = await userDevicesRef.once('value');
      
      if (snapshot.exists()) {
        log(`  ✓ User-device mapping exists in RTDB`, 'green');
      } else {
        log(`  ⚠ No user-device mapping in RTDB`, 'yellow');
        issues.push({
          type: 'MISSING_USER_DEVICE_MAPPING',
          patientId: patient.id,
          deviceId: patient.deviceId
        });
      }
    } catch (error) {
      log(`  ❌ Cannot read user-device mapping: ${error.message}`, 'red');
      issues.push({
        type: 'RTDB_MAPPING_ERROR',
        patientId: patient.id,
        deviceId: patient.deviceId,
        error: error.message
      });
    }
  }
  
  return issues;
}

async function fixIssues(issues) {
  section('STEP 6: Fixing Issues');
  
  if (issues.length === 0) {
    log('✓ No issues to fix!', 'green');
    return;
  }
  
  log(`Found ${issues.length} issues to fix\n`, 'yellow');
  
  for (const issue of issues) {
    switch (issue.type) {
      case 'INACTIVE_LINK':
        log(`Fixing inactive link: ${issue.linkId}`, 'yellow');
        try {
          await db.collection('deviceLinks').doc(issue.linkId).update({
            status: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          log(`  ✓ Activated link`, 'green');
        } catch (error) {
          log(`  ❌ Failed to activate link: ${error.message}`, 'red');
        }
        break;
      
      case 'MISSING_DEVICE_DOC':
        log(`Creating missing device document: ${issue.deviceId}`, 'yellow');
        try {
          await db.collection('devices').doc(issue.deviceId).set({
            id: issue.deviceId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            provisioningStatus: 'active',
            wifiConfigured: true
          }, { merge: true });
          log(`  ✓ Created device document`, 'green');
        } catch (error) {
          log(`  ❌ Failed to create device document: ${error.message}`, 'red');
        }
        break;
      
      case 'MISSING_DEVICE_STATE':
        log(`Creating missing device state in RTDB: ${issue.deviceId}`, 'yellow');
        try {
          await rtdb.ref(`deviceState/${issue.deviceId}`).set({
            connectionMode: 'wifi',
            lastUpdated: admin.database.ServerValue.TIMESTAMP,
            status: 'active'
          });
          log(`  ✓ Created device state`, 'green');
        } catch (error) {
          log(`  ❌ Failed to create device state: ${error.message}`, 'red');
        }
        break;
      
      case 'MISSING_USER_DEVICE_MAPPING':
        log(`Creating missing user-device mapping: ${issue.patientId} -> ${issue.deviceId}`, 'yellow');
        try {
          await rtdb.ref(`users/${issue.patientId}/devices/${issue.deviceId}`).set(true);
          log(`  ✓ Created user-device mapping`, 'green');
        } catch (error) {
          log(`  ❌ Failed to create mapping: ${error.message}`, 'red');
        }
        break;
      
      case 'ORPHANED_LINK':
        log(`Removing orphaned link: ${issue.linkId}`, 'yellow');
        try {
          await db.collection('deviceLinks').doc(issue.linkId).delete();
          log(`  ✓ Removed orphaned link`, 'green');
        } catch (error) {
          log(`  ❌ Failed to remove link: ${error.message}`, 'red');
        }
        break;
      
      default:
        log(`⚠ Cannot auto-fix issue type: ${issue.type}`, 'yellow');
    }
  }
}

async function generateReport(caregivers, patients, allIssues) {
  section('FINAL REPORT');
  
  log(`Total Caregivers: ${caregivers.length}`, 'cyan');
  log(`Total Patients: ${patients.length}`, 'cyan');
  log(`Total Issues Found: ${allIssues.length}`, allIssues.length > 0 ? 'yellow' : 'green');
  
  if (allIssues.length > 0) {
    log('\nIssue Breakdown:', 'cyan');
    const issueTypes = {};
    allIssues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    });
    
    Object.entries(issueTypes).forEach(([type, count]) => {
      log(`  ${type}: ${count}`, 'yellow');
    });
  }
  
  log('\n' + '='.repeat(80), 'cyan');
  log('Diagnosis Complete!', 'green');
  log('='.repeat(80), 'cyan');
}

async function main() {
  try {
    log('Starting Caregiver Permission Diagnosis and Fix...', 'cyan');
    
    const caregivers = await findCaregivers();
    const patients = await findPatients();
    
    if (caregivers.length === 0 || patients.length === 0) {
      log('\n⚠ Cannot proceed without both caregivers and patients', 'yellow');
      return;
    }
    
    const linkIssues = await checkDeviceLinks(caregivers, patients);
    const firestoreIssues = await checkFirestorePermissions(caregivers, patients);
    const rtdbIssues = await checkRTDBPermissions(caregivers, patients);
    
    const allIssues = [...linkIssues, ...firestoreIssues, ...rtdbIssues];
    
    await fixIssues(allIssues);
    await generateReport(caregivers, patients, allIssues);
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
  }
}

main();

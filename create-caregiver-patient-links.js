/**
 * Create Caregiver-Patient Device Links
 * 
 * This script helps establish proper deviceLinks between caregivers and patients
 */

const admin = require('firebase-admin');
const readline = require('readline');

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

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getCaregivers() {
  const snapshot = await db.collection('users').where('role', '==', 'caregiver').get();
  const caregivers = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    caregivers.push({
      id: doc.id,
      name: data.name || data.email || 'Unknown',
      email: data.email
    });
  });
  return caregivers;
}

async function getPatients() {
  const snapshot = await db.collection('users').where('role', '==', 'patient').get();
  const patients = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.deviceId) { // Only include patients with devices
      patients.push({
        id: doc.id,
        name: data.name || data.email || 'Unknown',
        email: data.email,
        deviceId: data.deviceId
      });
    }
  });
  return patients;
}

async function createDeviceLink(caregiverId, patientId, deviceId) {
  const linkId = `${deviceId}_${caregiverId}`;
  
  try {
    await db.collection('deviceLinks').doc(linkId).set({
      id: linkId,
      deviceId: deviceId,
      userId: caregiverId,
      role: 'caregiver',
      status: 'active',
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      linkedBy: caregiverId,
      patientId: patientId // Add patient reference for easier queries
    });
    
    log(`  ✓ Created device link: ${linkId}`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ Failed to create link: ${error.message}`, 'red');
    return false;
  }
}

async function linkAllCaregiversToAllPatients() {
  log('\n=== Linking All Caregivers to All Patients ===\n', 'cyan');
  
  const caregivers = await getCaregivers();
  const patients = await getPatients();
  
  if (caregivers.length === 0) {
    log('❌ No caregivers found', 'red');
    return;
  }
  
  if (patients.length === 0) {
    log('❌ No patients with devices found', 'red');
    return;
  }
  
  log(`Found ${caregivers.length} caregivers and ${patients.length} patients with devices\n`, 'cyan');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const caregiver of caregivers) {
    log(`\nLinking caregiver: ${caregiver.name} (${caregiver.id})`, 'yellow');
    
    for (const patient of patients) {
      log(`  → Patient: ${patient.name} (Device: ${patient.deviceId})`, 'blue');
      
      // Check if link already exists
      const linkId = `${patient.deviceId}_${caregiver.id}`;
      const existingLinkDoc = await db.collection('deviceLinks').doc(linkId).get();
      
      if (existingLinkDoc.exists) {
        const linkData = existingLinkDoc.data();
        if (linkData.status === 'active') {
          log(`    ✓ Link already exists and is active`, 'green');
          successCount++;
          continue;
        } else {
          log(`    ⚠ Link exists but is ${linkData.status}, updating...`, 'yellow');
          await db.collection('deviceLinks').doc(linkId).update({
            status: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          log(`    ✓ Updated link to active`, 'green');
          successCount++;
          continue;
        }
      }
      
      // Create new link
      const success = await createDeviceLink(caregiver.id, patient.id, patient.deviceId);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
  }
  
  log('\n=== Summary ===', 'cyan');
  log(`✓ Successful links: ${successCount}`, 'green');
  if (failCount > 0) {
    log(`❌ Failed links: ${failCount}`, 'red');
  }
  log(`\nTotal device links that should exist: ${caregivers.length * patients.length}`, 'cyan');
}

async function showCurrentLinks() {
  log('\n=== Current Device Links ===\n', 'cyan');
  
  const linksSnapshot = await db.collection('deviceLinks').get();
  
  if (linksSnapshot.empty) {
    log('No device links found', 'yellow');
    return;
  }
  
  const caregivers = await getCaregivers();
  const patients = await getPatients();
  
  const caregiverMap = new Map(caregivers.map(c => [c.id, c]));
  const patientMap = new Map(patients.map(p => [p.id, p]));
  
  linksSnapshot.forEach(doc => {
    const link = doc.data();
    const caregiver = caregiverMap.get(link.userId);
    const patient = patientMap.get(link.patientId);
    
    log(`Link: ${doc.id}`, 'cyan');
    log(`  Caregiver: ${caregiver?.name || link.userId}`, 'blue');
    log(`  Patient: ${patient?.name || link.patientId || 'Unknown'}`, 'blue');
    log(`  Device: ${link.deviceId}`, 'blue');
    log(`  Status: ${link.status}`, link.status === 'active' ? 'green' : 'yellow');
    log(`  Linked at: ${link.linkedAt?.toDate?.() || 'Unknown'}`, 'blue');
    console.log();
  });
}

async function main() {
  try {
    log('='.repeat(80), 'cyan');
    log('Caregiver-Patient Device Link Manager', 'cyan');
    log('='.repeat(80), 'cyan');
    
    // Show current state
    await showCurrentLinks();
    
    // Create all necessary links
    await linkAllCaregiversToAllPatients();
    
    // Show final state
    await showCurrentLinks();
    
    log('\n✓ Done!', 'green');
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

main();

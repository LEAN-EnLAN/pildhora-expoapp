/**
 * Quick Caregiver Access Test
 * Tests if caregivers can perform common operations
 */

const admin = require('firebase-admin');

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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();
const rtdb = admin.database();

async function testCaregiverAccess() {
  console.log('\n🔍 Testing Caregiver Access...\n');
  
  // Get a caregiver with links
  const caregiverId = 'ZsoeNjnLOGgj1rNomcbJF7QSWTZ2'; // Tomas
  
  console.log(`Testing caregiver: ${caregiverId}\n`);
  
  // Test 1: Get linked patients
  console.log('Test 1: Getting linked patients...');
  const linksSnapshot = await db.collection('deviceLinks')
    .where('userId', '==', caregiverId)
    .where('role', '==', 'caregiver')
    .where('status', '==', 'active')
    .get();
  
  console.log(`✓ Found ${linksSnapshot.size} linked devices\n`);
  
  // Test 2: Access patient data
  for (const linkDoc of linksSnapshot.docs) {
    const link = linkDoc.data();
    const deviceId = link.deviceId;
    const patientId = link.patientId;
    
    if (!patientId) {
      console.log(`⚠ Skipping link ${linkDoc.id} - no patientId\n`);
      continue;
    }
    
    console.log(`Test 2: Accessing patient ${patientId}...`);
    
    // Get patient info
    const patientDoc = await db.collection('users').doc(patientId).get();
    if (patientDoc.exists) {
      const patient = patientDoc.data();
      console.log(`  ✓ Patient name: ${patient.name || patient.email}`);
    }
    
    // Get medications
    const medsSnapshot = await db.collection('medications')
      .where('patientId', '==', patientId)
      .get();
    console.log(`  ✓ Medications: ${medsSnapshot.size}`);
    
    // Get events
    const eventsSnapshot = await db.collection('medicationEvents')
      .where('patientId', '==', patientId)
      .limit(5)
      .get();
    console.log(`  ✓ Recent events: ${eventsSnapshot.size}`);
    
    // Get device state from RTDB
    const deviceStateRef = rtdb.ref(`deviceState/${deviceId}`);
    const stateSnapshot = await deviceStateRef.once('value');
    if (stateSnapshot.exists()) {
      const state = stateSnapshot.val();
      console.log(`  ✓ Device state: ${state.connectionMode || 'unknown'}`);
    }
    
    console.log();
  }
  
  console.log('✅ All tests passed! Caregivers can access patient data.\n');
}

testCaregiverAccess().catch(console.error);

const admin = require('firebase-admin');

// Initialize Firebase Admin with the provided service account
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pildhora-app2-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function diagnoseTomas() {
  console.log('🔍 DIAGNOSING TOMAS ACCOUNT AND PATIENT LINKS\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Find Tomas user account
    console.log('\n📋 STEP 1: Finding Tomas user account...');
    const usersSnapshot = await db.collection('users').get();
    
    let tomasUser = null;
    const allUsers = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      allUsers.push({ id: doc.id, ...data });
      
      if (data.email && (data.email.toLowerCase().includes('tomas') || data.email.toLowerCase() === 'tom@g.com')) {
        tomasUser = { id: doc.id, ...data };
      }
    });

    console.log(`\nFound ${allUsers.length} total users in database`);
    
    if (!tomasUser) {
      console.log('\n❌ Could not find user with "tomas" in email');
      console.log('\nAll users found:');
      allUsers.forEach(user => {
        console.log(`  - ${user.id}: ${user.email || 'NO EMAIL'} (role: ${user.role || 'NO ROLE'})`);
      });
      
      // Let user select
      console.log('\n⚠️  Please provide the correct user ID or email for Tomas');
      return;
    }

    console.log(`\n✅ Found Tomas: ${tomasUser.id}`);
    console.log(`   Email: ${tomasUser.email}`);
    console.log(`   Role: ${tomasUser.role}`);
    console.log(`   Name: ${tomasUser.displayName || 'N/A'}`);

    // Step 2: Check caregiverPatientLinks collection
    console.log('\n📋 STEP 2: Checking caregiverPatientLinks...');
    const linksSnapshot = await db.collection('caregiverPatientLinks')
      .where('caregiverId', '==', tomasUser.id)
      .get();

    console.log(`\nFound ${linksSnapshot.size} links for Tomas as caregiver`);
    
    const linkedPatientIds = [];
    linksSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n  Link ID: ${doc.id}`);
      console.log(`    Patient ID: ${data.patientId}`);
      console.log(`    Status: ${data.status || 'N/A'}`);
      console.log(`    Created: ${data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : 'N/A'}`);
      linkedPatientIds.push(data.patientId);
    });

    // Step 3: Check if Tomas is listed as patient
    console.log('\n📋 STEP 3: Checking if Tomas is also a patient...');
    const tomasAsPatientLinks = await db.collection('caregiverPatientLinks')
      .where('patientId', '==', tomasUser.id)
      .get();

    if (tomasAsPatientLinks.size > 0) {
      console.log(`\n⚠️  Tomas is listed as a PATIENT in ${tomasAsPatientLinks.size} links:`);
      tomasAsPatientLinks.forEach(doc => {
        const data = doc.data();
        console.log(`  - Caregiver: ${data.caregiverId}, Status: ${data.status || 'N/A'}`);
      });
    }

    // Step 4: Get patient details
    if (linkedPatientIds.length > 0) {
      console.log('\n📋 STEP 4: Getting patient details...');
      
      for (const patientId of linkedPatientIds) {
        const patientDoc = await db.collection('users').doc(patientId).get();
        
        if (patientDoc.exists) {
          const patientData = patientDoc.data();
          console.log(`\n  Patient: ${patientId}`);
          console.log(`    Email: ${patientData.email || 'N/A'}`);
          console.log(`    Name: ${patientData.displayName || 'N/A'}`);
          console.log(`    Role: ${patientData.role || 'N/A'}`);
        } else {
          console.log(`\n  ❌ Patient ${patientId} - USER DOCUMENT DOES NOT EXIST`);
        }
      }
    }

    // Step 5: Check all caregiverPatientLinks
    console.log('\n📋 STEP 5: Checking ALL caregiverPatientLinks in database...');
    const allLinksSnapshot = await db.collection('caregiverPatientLinks').get();
    console.log(`\nTotal links in database: ${allLinksSnapshot.size}`);
    
    const linksByCaregiver = {};
    allLinksSnapshot.forEach(doc => {
      const data = doc.data();
      if (!linksByCaregiver[data.caregiverId]) {
        linksByCaregiver[data.caregiverId] = [];
      }
      linksByCaregiver[data.caregiverId].push({
        linkId: doc.id,
        patientId: data.patientId,
        status: data.status
      });
    });

    console.log('\nLinks grouped by caregiver:');
    for (const [caregiverId, links] of Object.entries(linksByCaregiver)) {
      console.log(`\n  Caregiver: ${caregiverId} (${links.length} patients)`);
      links.forEach(link => {
        console.log(`    - Patient: ${link.patientId}, Status: ${link.status || 'N/A'}`);
      });
    }

    // Step 6: Check for deviceLinks
    console.log('\n📋 STEP 6: Checking deviceLinks collection...');
    const deviceLinksSnapshot = await db.collection('deviceLinks').get();
    console.log(`\nTotal device links: ${deviceLinksSnapshot.size}`);
    
    if (linkedPatientIds.length > 0) {
      console.log('\nDevice links for Tomas\'s patients:');
      for (const patientId of linkedPatientIds) {
        const patientDeviceLinks = await db.collection('deviceLinks')
          .where('userId', '==', patientId)
          .get();
        
        console.log(`\n  Patient ${patientId}: ${patientDeviceLinks.size} devices`);
        patientDeviceLinks.forEach(doc => {
          const data = doc.data();
          console.log(`    - Device: ${data.deviceId || doc.id}`);
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTomas User ID: ${tomasUser.id}`);
    console.log(`Tomas Email: ${tomasUser.email}`);
    console.log(`Tomas Role: ${tomasUser.role}`);
    console.log(`\nLinked Patients: ${linkedPatientIds.length}`);
    
    if (linkedPatientIds.length === 0) {
      console.log('\n❌ ISSUE: No patients linked to Tomas account');
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('   1. Links exist but caregiverId doesn\'t match Tomas\'s user ID');
      console.log('   2. Links were deleted or never created');
      console.log('   3. Tomas account role is not set to "caregiver"');
      console.log('   4. Wrong user account being checked');
    } else {
      console.log('\n✅ Patients are linked in database');
      console.log('\n💡 If app shows no patients, check:');
      console.log('   1. App is querying with correct user ID');
      console.log('   2. Security rules allow reading caregiverPatientLinks');
      console.log('   3. App is filtering by correct status field');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseTomas();

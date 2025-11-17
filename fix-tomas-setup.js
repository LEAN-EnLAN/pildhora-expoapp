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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixTomasSetup() {
  console.log('🔧 FIXING TOMAS CAREGIVER SETUP\n');

  try {
    const usersSnapshot = await db.collection('users').get();
    
    const allUsers = [];
    let tomasUser = null;
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      allUsers.push({ id: doc.id, ...data });
      
      if (data.email && (data.email.toLowerCase().includes('tom') || data.email === 'tom@g.com')) {
        tomasUser = { id: doc.id, ...data };
      }
    });

    console.log(`Found ${allUsers.length} users\n`);
    allUsers.forEach(u => console.log(`  ${u.email || 'NO EMAIL'} (${u.role || 'NO ROLE'})`));

    if (!tomasUser) {
      console.log('\n❌ Could not find Tomas');
      process.exit(1);
    }

    console.log(`\n✅ Found: ${tomasUser.email} (ID: ${tomasUser.id})`);

    // Update role
    console.log('\n📋 Updating role to caregiver...');
    await db.collection('users').doc(tomasUser.id).update({ role: 'caregiver' });
    console.log('✅ Role updated');

    // Find patients
    const patients = allUsers.filter(u => u.id !== tomasUser.id && (u.role === 'patient' || !u.role));
    console.log(`\n📋 Found ${patients.length} patients to link`);

    // Create links
    for (const patient of patients) {
      await db.collection('caregiverPatientLinks').add({
        caregiverId: tomasUser.id,
        patientId: patient.id,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Linked: ${patient.email || patient.id}`);
    }

    console.log(`\n✅ COMPLETE: ${patients.length} patients linked to Tomas`);

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    process.exit(0);
  }
}

fixTomasSetup();

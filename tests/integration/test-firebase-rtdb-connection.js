/**
 * Test Firebase RTDB Connection
 * Run: node test-firebase-rtdb-connection.js
 * 
 * This script tests reading and writing to Firebase RTDB
 * to verify the connection before uploading to ESP8266
 */

const https = require('https');

// Configuration - MUST match ESP8266 firmware
const FIREBASE_HOST = 'devices-m1947.firebaseio.com';
const FIREBASE_SECRET = 'Af53UVDofDdlEN1OlTabfM4Tp98mkEK3Uuk24ZWc';
const DEVICE_ID = 'TEST-DEVICE-001';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = `https://${FIREBASE_HOST}${path}?auth=${FIREBASE_SECRET}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${method}] Status: ${res.statusCode}`);
        console.log(`[${method}] Response: ${data}`);
        resolve({ status: res.statusCode, data: JSON.parse(data || 'null') });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Firebase RTDB Connection Test');
  console.log('='.repeat(60));
  console.log(`Host: ${FIREBASE_HOST}`);
  console.log(`Device ID: ${DEVICE_ID}`);
  console.log('');

  try {
    // Test 1: Read current topo value
    console.log('\n--- TEST 1: Read /devices/{deviceId}/commands/topo ---');
    const readResult = await makeRequest('GET', `/devices/${DEVICE_ID}/commands/topo.json`);
    console.log(`Current topo value: ${readResult.data}`);

    // Test 2: Write topo = true
    console.log('\n--- TEST 2: Write topo = true ---');
    const writeTrue = await makeRequest('PUT', `/devices/${DEVICE_ID}/commands/topo.json`, true);
    console.log(`Write result: ${writeTrue.status === 200 ? 'SUCCESS' : 'FAILED'}`);

    // Test 3: Read again to verify
    console.log('\n--- TEST 3: Verify write ---');
    const verifyResult = await makeRequest('GET', `/devices/${DEVICE_ID}/commands/topo.json`);
    console.log(`Verified topo value: ${verifyResult.data}`);

    // Test 4: Write topo = false (reset)
    console.log('\n--- TEST 4: Reset topo = false ---');
    const writeFalse = await makeRequest('PUT', `/devices/${DEVICE_ID}/commands/topo.json`, false);
    console.log(`Reset result: ${writeFalse.status === 200 ? 'SUCCESS' : 'FAILED'}`);

    // Test 5: Update device state
    console.log('\n--- TEST 5: Update device state ---');
    const stateUpdate = await makeRequest('PATCH', `/devices/${DEVICE_ID}/state.json`, {
      online: true,
      lastSeen: Date.now(),
      testFromNode: true
    });
    console.log(`State update result: ${stateUpdate.status === 200 ? 'SUCCESS' : 'FAILED'}`);

    // Test 6: Read full device data
    console.log('\n--- TEST 6: Read full device data ---');
    const fullDevice = await makeRequest('GET', `/devices/${DEVICE_ID}.json`);
    console.log('Full device data:', JSON.stringify(fullDevice.data, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('All tests completed!');
    console.log('='.repeat(60));

    // Summary
    const allPassed = readResult.status === 200 && 
                      writeTrue.status === 200 && 
                      writeFalse.status === 200;
    
    if (allPassed) {
      console.log('\n✅ Firebase connection is working correctly!');
      console.log('You can now upload the firmware to ESP8266.');
    } else {
      console.log('\n❌ Some tests failed. Check:');
      console.log('   1. Firebase RTDB URL is correct');
      console.log('   2. Database secret is valid');
      console.log('   3. Security rules allow read/write');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nPossible issues:');
    console.log('1. Wrong Firebase host URL');
    console.log('2. Invalid database secret');
    console.log('3. Network connectivity issues');
    console.log('4. Security rules blocking access');
  }
}

runTests();

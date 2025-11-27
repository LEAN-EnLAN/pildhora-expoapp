/**
 * Test Device Commands
 * Run: node test-device-commands.js
 * 
 * Tests sending commands to the ESP8266 device via Firebase RTDB
 */

const https = require('https');

const FIREBASE_HOST = 'devices-m1947.firebaseio.com';
const FIREBASE_SECRET = 'Af53UVDofDdlEN1OlTabfM4Tp98mkEK3Uuk24ZWc';
const DEVICE_ID = 'TEST-DEVICE-001';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = `https://${FIREBASE_HOST}${path}?auth=${FIREBASE_SECRET}`;
    
    const req = https.request(url, { method, headers: { 'Content-Type': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });

    req.on('error', reject);
    if (body !== null) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function testCommands() {
  console.log('='.repeat(60));
  console.log('Device Commands Test');
  console.log('='.repeat(60));
  console.log(`Device: ${DEVICE_ID}\n`);

  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'topo':
      console.log('Sending TOPO command...');
      await makeRequest('PATCH', `/devices/${DEVICE_ID}/commands.json`, { topo: true });
      console.log('✅ TOPO command sent! Device should dispense medication.');
      break;

    case 'buzzer':
      console.log('Sending BUZZER command...');
      await makeRequest('PATCH', `/devices/${DEVICE_ID}/commands.json`, { buzzer: true });
      console.log('✅ BUZZER command sent!');
      break;

    case 'led':
      const color = args[1] || '0,255,0'; // Default green
      console.log(`Sending LED command with color: ${color}`);
      await makeRequest('PATCH', `/devices/${DEVICE_ID}/commands.json`, { led: true, ledColor: color });
      console.log('✅ LED command sent!');
      break;

    case 'reboot':
      console.log('Sending REBOOT command...');
      await makeRequest('PATCH', `/devices/${DEVICE_ID}/commands.json`, { reboot: true });
      console.log('✅ REBOOT command sent!');
      break;

    case 'clear':
      console.log('Clearing all commands...');
      await makeRequest('PUT', `/devices/${DEVICE_ID}/commands.json`, {
        topo: false, buzzer: false, led: false, ledColor: '0,0,0', reboot: false
      });
      console.log('✅ All commands cleared!');
      break;

    case 'status':
    default:
      console.log('Reading device status...');
      const result = await makeRequest('GET', `/devices/${DEVICE_ID}.json`);
      console.log('\nDevice Data:');
      console.log(JSON.stringify(result.data, null, 2));
      break;
  }

  console.log('\n' + '='.repeat(60));
  console.log('Usage: node test-device-commands.js [command] [args]');
  console.log('Commands: topo, buzzer, led [R,G,B], reboot, clear, status');
  console.log('='.repeat(60));
}

testCommands().catch(console.error);

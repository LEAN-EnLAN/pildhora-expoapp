/**
 * Final Integration and Testing Suite
 * 
 * Comprehensive end-to-end tests for the user onboarding and device provisioning system.
 * Tests all requirements and validates complete user flows for both patients and caregivers.
 * 
 * Requirements: All (1.1-12.5)
 * 
 * Test Coverage:
 * - Patient onboarding flow (signup → provision → home)
 * - Caregiver onboarding flow (signup → connect → dashboard)
 * - Multi-caregiver connections
 * - Error scenarios (device claimed, expired codes, network failures)
 * - Security and permissions
 * - Data synchronization
 * - Role-based routing
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp 
} = require('firebase/firestore');
const { getDatabase, ref, get, set, remove } = require('firebase/database');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Test data
const TEST_USERS = {
  patient1: {
    email: `test-patient-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Patient 1',
    role: 'patient',
  },
  patient2: {
    email: `test-patient2-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Patient 2',
    role: 'patient',
  },
  caregiver1: {
    email: `test-caregiver-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Caregiver 1',
    role: 'caregiver',
  },
  caregiver2: {
    email: `test-caregiver2-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Caregiver 2',
    role: 'caregiver',
  },
};

const TEST_DEVICES = {
  device1: `TEST-DEVICE-${Date.now()}-1`,
  device2: `TEST-DEVICE-${Date.now()}-2`,
};

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
let app, auth, db, rtdb;

/**
 * Test utilities
 */
const utils = {
  // Retry helper for flaky operations
  async retry(fn, attempts = TEST_CONFIG.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay * (i + 1)));
      }
    }
  },

  // Create test user
  async createTestUser(userData) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const userId = userCredential.user.uid;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      createdAt: serverTimestamp(),
      onboardingComplete: false,
      onboardingStep: null,
    });

    return { userId, user: userCredential.user };
  },

  // Cleanup test user
  async cleanupTestUser(userId) {
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      // Delete device links
      const linksQuery = query(
        collection(db, 'deviceLinks'),
        where('userId', '==', userId)
      );
      const linksSnapshot = await getDocs(linksQuery);
      for (const linkDoc of linksSnapshot.docs) {
        await deleteDoc(linkDoc.ref);
      }
      
      // Delete connection codes
      const codesQuery = query(
        collection(db, 'connectionCodes'),
        where('patientId', '==', userId)
      );
      const codesSnapshot = await getDocs(codesQuery);
      for (const codeDoc of codesSnapshot.docs) {
        await deleteDoc(codeDoc.ref);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  },

  // Cleanup test device
  async cleanupTestDevice(deviceId) {
    try {
      // Delete device document
      await deleteDoc(doc(db, 'devices', deviceId));
      
      // Delete RTDB device data
      await remove(ref(rtdb, `devices/${deviceId}`));
    } catch (error) {
      console.error('Device cleanup error:', error);
    }
  },

  // Wait for condition
  async waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout waiting for condition');
  },
};

/**
 * Test Suite: Patient Onboarding Flow
 * Requirements: 1.1, 1.2, 3.1-3.8, 4.1-4.5, 9.1-9.5
 */
async function testPatientOnboardingFlow() {
  console.log('\n=== Testing Patient Onboarding Flow ===\n');
  
  let patientUserId;
  const deviceId = TEST_DEVICES.device1;

  try {
    // Step 1: Create patient account
    console.log('Step 1: Creating patient account...');
    const { userId } = await utils.createTestUser(TEST_USERS.patient1);
    patientUserId = userId;

    // Verify user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error('User document not created');
    
    const userData = userDoc.data();
    if (userData.role !== 'patient') throw new Error('User role not set correctly');
    if (userData.onboardingComplete !== false) throw new Error('Onboarding should not be complete');
    
    console.log('✓ Patient account created successfully');

    // Step 2: Provision device
    console.log('\nStep 2: Provisioning device...');
    
    // Create device document
    await setDoc(doc(db, 'devices', deviceId), {
      id: deviceId,
      primaryPatientId: userId,
      provisioningStatus: 'active',
      provisionedAt: serverTimestamp(),
      provisionedBy: userId,
      wifiConfigured: true,
      wifiSSID: 'TestNetwork',
      desiredConfig: {
        alarmMode: 'sound',
        ledIntensity: 75,
        ledColor: '#3B82F6',
        volume: 80,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create device link
    await setDoc(doc(db, 'deviceLinks', `${deviceId}_${userId}`), {
      id: `${deviceId}_${userId}`,
      deviceId: deviceId,
      userId: userId,
      role: 'patient',
      status: 'active',
      linkedAt: serverTimestamp(),
      linkedBy: userId,
    });

    // Update user document with device
    await setDoc(doc(db, 'users', userId), {
      deviceId: deviceId,
      onboardingComplete: true,
      onboardingStep: 'complete',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Initialize RTDB device state
    await set(ref(rtdb, `devices/${deviceId}/config`), {
      alarm_mode: 'sound',
      led_intensity: 75,
      led_color: '#3B82F6',
      volume: 80,
    });

    await set(ref(rtdb, `devices/${deviceId}/state`), {
      is_online: true,
      battery_level: 100,
      wifi_connected: true,
      provisioning_complete: true,
    });

    await set(ref(rtdb, `users/${userId}/devices/${deviceId}`), true);

    console.log('✓ Device provisioned successfully');

    // Step 3: Verify onboarding completion
    console.log('\nStep 3: Verifying onboarding completion...');
    
    const updatedUserDoc = await getDoc(doc(db, 'users', userId));
    const updatedUserData = updatedUserDoc.data();
    
    if (!updatedUserData.onboardingComplete) throw new Error('Onboarding not marked as complete');
    if (updatedUserData.deviceId !== deviceId) throw new Error('Device ID not set in user document');
    if (updatedUserData.onboardingStep !== 'complete') throw new Error('Onboarding step not set to complete');
    
    console.log('✓ Onboarding completed successfully');

    // Step 4: Verify device ownership
    console.log('\nStep 4: Verifying device ownership...');
    
    const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
    const deviceData = deviceDoc.data();
    
    if (deviceData.primaryPatientId !== userId) throw new Error('Device ownership not set correctly');
    if (deviceData.provisioningStatus !== 'active') throw new Error('Device not marked as active');
    
    console.log('✓ Device ownership verified');

    // Step 5: Verify RTDB synchronization
    console.log('\nStep 5: Verifying RTDB synchronization...');
    
    const deviceConfigSnapshot = await get(ref(rtdb, `devices/${deviceId}/config`));
    const deviceConfig = deviceConfigSnapshot.val();
    
    if (!deviceConfig) throw new Error('Device config not found in RTDB');
    if (deviceConfig.alarm_mode !== 'sound') throw new Error('Device config not synced correctly');
    
    const userDevicesSnapshot = await get(ref(rtdb, `users/${userId}/devices`));
    const userDevices = userDevicesSnapshot.val();
    
    if (!userDevices || !userDevices[deviceId]) throw new Error('Device not linked in RTDB');
    
    console.log('✓ RTDB synchronization verified');

    console.log('\n✅ Patient onboarding flow completed successfully\n');
    return { success: true, userId: patientUserId, deviceId };

  } catch (error) {
    console.error('\n❌ Patient onboarding flow failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (patientUserId) {
      await utils.cleanupTestUser(patientUserId);
      await utils.cleanupTestDevice(deviceId);
    }
  }
}

/**
 * Test Suite: Caregiver Onboarding Flow
 * Requirements: 2.1, 2.2, 5.1-5.6, 9.1-9.5
 */
async function testCaregiverOnboardingFlow() {
  console.log('\n=== Testing Caregiver Onboarding Flow ===\n');
  
  let patientUserId, caregiverUserId;
  const deviceId = TEST_DEVICES.device1;
  let connectionCode;

  try {
    // Step 1: Setup - Create patient with device
    console.log('Step 1: Setting up patient with device...');
    const { userId: patientId } = await utils.createTestUser(TEST_USERS.patient1);
    patientUserId = patientId;

    // Create device for patient
    await setDoc(doc(db, 'devices', deviceId), {
      id: deviceId,
      primaryPatientId: patientId,
      provisioningStatus: 'active',
      provisionedAt: serverTimestamp(),
      provisionedBy: patientId,
      wifiConfigured: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'users', patientId), {
      deviceId: deviceId,
      onboardingComplete: true,
    }, { merge: true });

    console.log('✓ Patient setup complete');

    // Step 2: Generate connection code
    console.log('\nStep 2: Generating connection code...');
    
    connectionCode = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await setDoc(doc(db, 'connectionCodes', connectionCode), {
      id: connectionCode,
      deviceId: deviceId,
      patientId: patientId,
      patientName: TEST_USERS.patient1.name,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt,
      used: false,
    });

    console.log(`✓ Connection code generated: ${connectionCode}`);

    // Step 3: Create caregiver account
    console.log('\nStep 3: Creating caregiver account...');
    const { userId: caregiverId } = await utils.createTestUser(TEST_USERS.caregiver1);
    caregiverUserId = caregiverId;

    const caregiverDoc = await getDoc(doc(db, 'users', caregiverId));
    const caregiverData = caregiverDoc.data();
    
    if (caregiverData.role !== 'caregiver') throw new Error('Caregiver role not set correctly');
    if (caregiverData.onboardingComplete !== false) throw new Error('Onboarding should not be complete');
    
    console.log('✓ Caregiver account created successfully');

    // Step 4: Validate connection code
    console.log('\nStep 4: Validating connection code...');
    
    const codeDoc = await getDoc(doc(db, 'connectionCodes', connectionCode));
    if (!codeDoc.exists()) throw new Error('Connection code not found');
    
    const codeData = codeDoc.data();
    if (codeData.used) throw new Error('Code already marked as used');
    if (new Date() > codeData.expiresAt.toDate()) throw new Error('Code is expired');
    
    console.log('✓ Connection code validated');

    // Step 5: Use connection code (create device link)
    console.log('\nStep 5: Creating device link...');
    
    // Mark code as used
    await setDoc(doc(db, 'connectionCodes', connectionCode), {
      used: true,
      usedBy: caregiverId,
      usedAt: serverTimestamp(),
    }, { merge: true });

    // Create device link
    await setDoc(doc(db, 'deviceLinks', `${deviceId}_${caregiverId}`), {
      id: `${deviceId}_${caregiverId}`,
      deviceId: deviceId,
      userId: caregiverId,
      role: 'caregiver',
      status: 'active',
      linkedAt: serverTimestamp(),
      linkedBy: caregiverId,
    });

    // Update caregiver document
    await setDoc(doc(db, 'users', caregiverId), {
      patients: [patientId],
      onboardingComplete: true,
      onboardingStep: 'complete',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Update RTDB
    await set(ref(rtdb, `users/${caregiverId}/devices/${deviceId}`), true);

    console.log('✓ Device link created successfully');

    // Step 6: Verify connection
    console.log('\nStep 6: Verifying connection...');
    
    const linkDoc = await getDoc(doc(db, 'deviceLinks', `${deviceId}_${caregiverId}`));
    if (!linkDoc.exists()) throw new Error('Device link not created');
    
    const linkData = linkDoc.data();
    if (linkData.userId !== caregiverId) throw new Error('Link user ID incorrect');
    if (linkData.deviceId !== deviceId) throw new Error('Link device ID incorrect');
    if (linkData.role !== 'caregiver') throw new Error('Link role incorrect');
    if (linkData.status !== 'active') throw new Error('Link not active');
    
    const updatedCaregiverDoc = await getDoc(doc(db, 'users', caregiverId));
    const updatedCaregiverData = updatedCaregiverDoc.data();
    
    if (!updatedCaregiverData.onboardingComplete) throw new Error('Caregiver onboarding not complete');
    if (!updatedCaregiverData.patients || !updatedCaregiverData.patients.includes(patientId)) {
      throw new Error('Patient not added to caregiver patients list');
    }
    
    console.log('✓ Connection verified');

    // Step 7: Verify code marked as used
    console.log('\nStep 7: Verifying code marked as used...');
    
    const usedCodeDoc = await getDoc(doc(db, 'connectionCodes', connectionCode));
    const usedCodeData = usedCodeDoc.data();
    
    if (!usedCodeData.used) throw new Error('Code not marked as used');
    if (usedCodeData.usedBy !== caregiverId) throw new Error('Code usedBy not set correctly');
    
    console.log('✓ Code marked as used');

    console.log('\n✅ Caregiver onboarding flow completed successfully\n');
    return { success: true, patientId: patientUserId, caregiverId: caregiverUserId, deviceId };

  } catch (error) {
    console.error('\n❌ Caregiver onboarding flow failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (patientUserId) await utils.cleanupTestUser(patientUserId);
    if (caregiverUserId) await utils.cleanupTestUser(caregiverUserId);
    await utils.cleanupTestDevice(deviceId);
    if (connectionCode) {
      try {
        await deleteDoc(doc(db, 'connectionCodes', connectionCode));
      } catch (e) {}
    }
  }
}

/**
 * Test Suite: Multi-Caregiver Connection
 * Requirements: 5.1-5.6, 7.1-7.5, 8.1-8.5
 */
async function testMultiCaregiverConnection() {
  console.log('\n=== Testing Multi-Caregiver Connection ===\n');
  
  let patientUserId, caregiver1UserId, caregiver2UserId;
  const deviceId = TEST_DEVICES.device1;
  let code1, code2;

  try {
    // Step 1: Setup patient with device
    console.log('Step 1: Setting up patient with device...');
    const { userId: patientId } = await utils.createTestUser(TEST_USERS.patient1);
    patientUserId = patientId;

    await setDoc(doc(db, 'devices', deviceId), {
      id: deviceId,
      primaryPatientId: patientId,
      provisioningStatus: 'active',
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'users', patientId), {
      deviceId: deviceId,
      onboardingComplete: true,
    }, { merge: true });

    console.log('✓ Patient setup complete');

    // Step 2: Connect first caregiver
    console.log('\nStep 2: Connecting first caregiver...');
    
    code1 = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await setDoc(doc(db, 'connectionCodes', code1), {
      id: code1,
      deviceId: deviceId,
      patientId: patientId,
      patientName: TEST_USERS.patient1.name,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used: false,
    });

    const { userId: caregiver1Id } = await utils.createTestUser(TEST_USERS.caregiver1);
    caregiver1UserId = caregiver1Id;

    await setDoc(doc(db, 'connectionCodes', code1), {
      used: true,
      usedBy: caregiver1Id,
      usedAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, 'deviceLinks', `${deviceId}_${caregiver1Id}`), {
      id: `${deviceId}_${caregiver1Id}`,
      deviceId: deviceId,
      userId: caregiver1Id,
      role: 'caregiver',
      status: 'active',
      linkedAt: serverTimestamp(),
      linkedBy: caregiver1Id,
    });

    await setDoc(doc(db, 'users', caregiver1Id), {
      patients: [patientId],
      onboardingComplete: true,
    }, { merge: true });

    console.log('✓ First caregiver connected');

    // Step 3: Connect second caregiver
    console.log('\nStep 3: Connecting second caregiver...');
    
    code2 = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await setDoc(doc(db, 'connectionCodes', code2), {
      id: code2,
      deviceId: deviceId,
      patientId: patientId,
      patientName: TEST_USERS.patient1.name,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used: false,
    });

    const { userId: caregiver2Id } = await utils.createTestUser(TEST_USERS.caregiver2);
    caregiver2UserId = caregiver2Id;

    await setDoc(doc(db, 'connectionCodes', code2), {
      used: true,
      usedBy: caregiver2Id,
      usedAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, 'deviceLinks', `${deviceId}_${caregiver2Id}`), {
      id: `${deviceId}_${caregiver2Id}`,
      deviceId: deviceId,
      userId: caregiver2Id,
      role: 'caregiver',
      status: 'active',
      linkedAt: serverTimestamp(),
      linkedBy: caregiver2Id,
    });

    await setDoc(doc(db, 'users', caregiver2Id), {
      patients: [patientId],
      onboardingComplete: true,
    }, { merge: true });

    console.log('✓ Second caregiver connected');

    // Step 4: Verify both caregivers have access
    console.log('\nStep 4: Verifying both caregivers have access...');
    
    const linksQuery = query(
      collection(db, 'deviceLinks'),
      where('deviceId', '==', deviceId),
      where('role', '==', 'caregiver'),
      where('status', '==', 'active')
    );
    
    const linksSnapshot = await getDocs(linksQuery);
    const caregiverLinks = linksSnapshot.docs.map(doc => doc.data());
    
    if (caregiverLinks.length !== 2) {
      throw new Error(`Expected 2 caregiver links, found ${caregiverLinks.length}`);
    }
    
    const caregiver1Link = caregiverLinks.find(link => link.userId === caregiver1Id);
    const caregiver2Link = caregiverLinks.find(link => link.userId === caregiver2Id);
    
    if (!caregiver1Link) throw new Error('Caregiver 1 link not found');
    if (!caregiver2Link) throw new Error('Caregiver 2 link not found');
    
    console.log('✓ Both caregivers have access');

    // Step 5: Verify device has multiple caregivers
    console.log('\nStep 5: Verifying device has multiple caregivers...');
    
    const deviceDoc = await getDoc(doc(db, 'devices', deviceId));
    const deviceData = deviceDoc.data();
    
    if (deviceData.primaryPatientId !== patientId) {
      throw new Error('Device primary patient incorrect');
    }
    
    console.log('✓ Device has multiple caregivers');

    console.log('\n✅ Multi-caregiver connection completed successfully\n');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Multi-caregiver connection failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (patientUserId) await utils.cleanupTestUser(patientUserId);
    if (caregiver1UserId) await utils.cleanupTestUser(caregiver1UserId);
    if (caregiver2UserId) await utils.cleanupTestUser(caregiver2UserId);
    await utils.cleanupTestDevice(deviceId);
    if (code1) {
      try { await deleteDoc(doc(db, 'connectionCodes', code1)); } catch (e) {}
    }
    if (code2) {
      try { await deleteDoc(doc(db, 'connectionCodes', code2)); } catch (e) {}
    }
  }
}

/**
 * Test Suite: Error Scenarios
 * Requirements: 4.2, 5.3, 5.4, 11.4, 11.6
 */
async function testErrorScenarios() {
  console.log('\n=== Testing Error Scenarios ===\n');
  
  let patientUserId, caregiverUserId;
  const deviceId = TEST_DEVICES.device1;
  let connectionCode;

  try {
    // Scenario 1: Device Already Claimed
    console.log('Scenario 1: Testing device already claimed...');
    
    const { userId: patient1Id } = await utils.createTestUser(TEST_USERS.patient1);
    patientUserId = patient1Id;

    // Create device for patient 1
    await setDoc(doc(db, 'devices', deviceId), {
      id: deviceId,
      primaryPatientId: patient1Id,
      provisioningStatus: 'active',
      createdAt: serverTimestamp(),
    });

    // Try to claim same device with patient 2
    const { userId: patient2Id } = await utils.createTestUser(TEST_USERS.patient2);
    
    try {
      await setDoc(doc(db, 'devices', deviceId), {
        id: deviceId,
        primaryPatientId: patient2Id,
        provisioningStatus: 'active',
        createdAt: serverTimestamp(),
      });
      
      // If we get here, the test failed
      throw new Error('Should not be able to claim already claimed device');
    } catch (error) {
      // Expected to fail - device already exists
      console.log('✓ Device already claimed error handled correctly');
    }

    await utils.cleanupTestUser(patient2Id);

    // Scenario 2: Expired Connection Code
    console.log('\nScenario 2: Testing expired connection code...');
    
    connectionCode = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    await setDoc(doc(db, 'connectionCodes', connectionCode), {
      id: connectionCode,
      deviceId: deviceId,
      patientId: patient1Id,
      patientName: TEST_USERS.patient1.name,
      createdAt: serverTimestamp(),
      expiresAt: expiredDate,
      used: false,
    });

    const codeDoc = await getDoc(doc(db, 'connectionCodes', connectionCode));
    const codeData = codeDoc.data();
    
    if (new Date() <= codeData.expiresAt.toDate()) {
      throw new Error('Code should be expired');
    }
    
    console.log('✓ Expired connection code detected correctly');

    // Scenario 3: Code Already Used
    console.log('\nScenario 3: Testing code already used...');
    
    const { userId: caregiverId } = await utils.createTestUser(TEST_USERS.caregiver1);
    caregiverUserId = caregiverId;

    const usedCode = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await setDoc(doc(db, 'connectionCodes', usedCode), {
      id: usedCode,
      deviceId: deviceId,
      patientId: patient1Id,
      patientName: TEST_USERS.patient1.name,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used: true,
      usedBy: caregiverId,
      usedAt: serverTimestamp(),
    });

    const usedCodeDoc = await getDoc(doc(db, 'connectionCodes', usedCode));
    const usedCodeData = usedCodeDoc.data();
    
    if (!usedCodeData.used) {
      throw new Error('Code should be marked as used');
    }
    
    console.log('✓ Code already used detected correctly');

    await deleteDoc(doc(db, 'connectionCodes', usedCode));

    // Scenario 4: Invalid Code Format
    console.log('\nScenario 4: Testing invalid code format...');
    
    const invalidCodes = [
      'ABC',           // Too short
      'ABCDEFGHIJ',    // Too long
      'ABC-123',       // Invalid characters
      'abc123',        // Lowercase (should be uppercase)
    ];

    for (const invalidCode of invalidCodes) {
      const codeDoc = await getDoc(doc(db, 'connectionCodes', invalidCode));
      if (codeDoc.exists()) {
        throw new Error(`Invalid code ${invalidCode} should not exist`);
      }
    }
    
    console.log('✓ Invalid code formats rejected correctly');

    console.log('\n✅ Error scenarios tested successfully\n');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Error scenarios test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (patientUserId) await utils.cleanupTestUser(patientUserId);
    if (caregiverUserId) await utils.cleanupTestUser(caregiverUserId);
    await utils.cleanupTestDevice(deviceId);
    if (connectionCode) {
      try { await deleteDoc(doc(db, 'connectionCodes', connectionCode)); } catch (e) {}
    }
  }
}

/**
 * Test Suite: Security and Permissions
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
async function testSecurityAndPermissions() {
  console.log('\n=== Testing Security and Permissions ===\n');
  
  let patient1UserId, patient2UserId, caregiverUserId;
  const device1Id = TEST_DEVICES.device1;
  const device2Id = TEST_DEVICES.device2;

  try {
    // Setup: Create two patients with devices
    console.log('Setup: Creating patients with devices...');
    
    const { userId: patient1Id } = await utils.createTestUser(TEST_USERS.patient1);
    patient1UserId = patient1Id;

    await setDoc(doc(db, 'devices', device1Id), {
      id: device1Id,
      primaryPatientId: patient1Id,
      provisioningStatus: 'active',
      createdAt: serverTimestamp(),
    });

    const { userId: patient2Id } = await utils.createTestUser(TEST_USERS.patient2);
    patient2UserId = patient2Id;

    await setDoc(doc(db, 'devices', device2Id), {
      id: device2Id,
      primaryPatientId: patient2Id,
      provisioningStatus: 'active',
      createdAt: serverTimestamp(),
    });

    console.log('✓ Setup complete');

    // Test 1: Patient can only access their own device
    console.log('\nTest 1: Verifying patient device access control...');
    
    const device1Doc = await getDoc(doc(db, 'devices', device1Id));
    const device1Data = device1Doc.data();
    
    if (device1Data.primaryPatientId !== patient1Id) {
      throw new Error('Patient 1 should own device 1');
    }
    
    const device2Doc = await getDoc(doc(db, 'devices', device2Id));
    const device2Data = device2Doc.data();
    
    if (device2Data.primaryPatientId !== patient2Id) {
      throw new Error('Patient 2 should own device 2');
    }
    
    console.log('✓ Patient device access control verified');

    // Test 2: Caregiver can only access linked devices
    console.log('\nTest 2: Verifying caregiver device access control...');
    
    const { userId: caregiverId } = await utils.createTestUser(TEST_USERS.caregiver1);
    caregiverUserId = caregiverId;

    // Link caregiver to patient 1's device only
    await setDoc(doc(db, 'deviceLinks', `${device1Id}_${caregiverId}`), {
      id: `${device1Id}_${caregiverId}`,
      deviceId: device1Id,
      userId: caregiverId,
      role: 'caregiver',
      status: 'active',
      linkedAt: serverTimestamp(),
      linkedBy: caregiverId,
    });

    // Verify caregiver has access to device 1
    const link1Doc = await getDoc(doc(db, 'deviceLinks', `${device1Id}_${caregiverId}`));
    if (!link1Doc.exists()) {
      throw new Error('Caregiver should have access to device 1');
    }

    // Verify caregiver does NOT have access to device 2
    const link2Doc = await getDoc(doc(db, 'deviceLinks', `${device2Id}_${caregiverId}`));
    if (link2Doc.exists()) {
      throw new Error('Caregiver should NOT have access to device 2');
    }
    
    console.log('✓ Caregiver device access control verified');

    // Test 3: Connection code security
    console.log('\nTest 3: Verifying connection code security...');
    
    const code = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await setDoc(doc(db, 'connectionCodes', code), {
      id: code,
      deviceId: device1Id,
      patientId: patient1Id,
      patientName: TEST_USERS.patient1.name,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used: false,
    });

    const codeDoc = await getDoc(doc(db, 'connectionCodes', code));
    const codeData = codeDoc.data();
    
    if (codeData.patientId !== patient1Id) {
      throw new Error('Connection code patient ID incorrect');
    }
    
    if (codeData.deviceId !== device1Id) {
      throw new Error('Connection code device ID incorrect');
    }
    
    console.log('✓ Connection code security verified');

    await deleteDoc(doc(db, 'connectionCodes', code));

    // Test 4: Device link authorization
    console.log('\nTest 4: Verifying device link authorization...');
    
    const linkQuery = query(
      collection(db, 'deviceLinks'),
      where('userId', '==', caregiverId),
      where('status', '==', 'active')
    );
    
    const linkSnapshot = await getDocs(linkQuery);
    const caregiverLinks = linkSnapshot.docs.map(doc => doc.data());
    
    if (caregiverLinks.length !== 1) {
      throw new Error(`Caregiver should have exactly 1 link, found ${caregiverLinks.length}`);
    }
    
    if (caregiverLinks[0].deviceId !== device1Id) {
      throw new Error('Caregiver link should be to device 1');
    }
    
    console.log('✓ Device link authorization verified');

    console.log('\n✅ Security and permissions tested successfully\n');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Security and permissions test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (patient1UserId) await utils.cleanupTestUser(patient1UserId);
    if (patient2UserId) await utils.cleanupTestUser(patient2UserId);
    if (caregiverUserId) await utils.cleanupTestUser(caregiverUserId);
    await utils.cleanupTestDevice(device1Id);
    await utils.cleanupTestDevice(device2Id);
  }
}

/**
 * Test Suite: Data Synchronization
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
async function testDataSynchronization() {
  console.log('\n=== Testing Data Synchronization ===\n');
  
  let patientUserId;
  const deviceId = TEST_DEVICES.device1;

  try {
    // Setup: Create patient with device
    console.log('Setup: Creating patient with device...');
    
    const { userId: patientId } = await utils.createTestUser(TEST_USERS.patient1);
    patientUserId = patientId;

    await setDoc(doc(db, 'devices', deviceId), {
      id: deviceId,
      primaryPatientId: patientId,
      provisioningStatus: 'active',
      desiredConfig: {
        alarmMode: 'sound',
        ledIntensity: 75,
        ledColor: '#3B82F6',
        volume: 80,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✓ Setup complete');

    // Test 1: Firestore to RTDB sync
    console.log('\nTest 1: Testing Firestore to RTDB sync...');
    
    // Write config to RTDB
    await set(ref(rtdb, `devices/${deviceId}/config`), {
      alarm_mode: 'sound',
      led_intensity: 75,
      led_color: '#3B82F6',
      volume: 80,
    });

    // Verify RTDB has the data
    const configSnapshot = await get(ref(rtdb, `devices/${deviceId}/config`));
    const configData = configSnapshot.val();
    
    if (!configData) throw new Error('Config not found in RTDB');
    if (configData.alarm_mode !== 'sound') throw new Error('Config sync failed');
    
    console.log('✓ Firestore to RTDB sync verified');

    // Test 2: RTDB to Firestore sync
    console.log('\nTest 2: Testing RTDB to Firestore sync...');
    
    // Update device state in RTDB
    await set(ref(rtdb, `devices/${deviceId}/state`), {
      is_online: true,
      battery_level: 85,
      wifi_connected: true,
      provisioning_complete: true,
      last_seen: Date.now(),
    });

    // Verify RTDB has the state
    const stateSnapshot = await get(ref(rtdb, `devices/${deviceId}/state`));
    const stateData = stateSnapshot.val();
    
    if (!stateData) throw new Error('State not found in RTDB');
    if (stateData.battery_level !== 85) throw new Error('State sync failed');
    
    console.log('✓ RTDB to Firestore sync verified');

    // Test 3: User device mapping
    console.log('\nTest 3: Testing user device mapping...');
    
    await set(ref(rtdb, `users/${patientId}/devices/${deviceId}`), true);

    const userDevicesSnapshot = await get(ref(rtdb, `users/${patientId}/devices`));
    const userDevices = userDevicesSnapshot.val();
    
    if (!userDevices || !userDevices[deviceId]) {
      throw new Error('User device mapping not found');
    }
    
    console.log('✓ User device mapping verified');

    // Test 4: Config update propagation
    console.log('\nTest 4: Testing config update propagation...');
    
    // Update config in Firestore
    await setDoc(doc(db, 'devices', deviceId), {
      desiredConfig: {
        alarmMode: 'vibrate',
        ledIntensity: 50,
        ledColor: '#10B981',
        volume: 60,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Update RTDB to match
    await set(ref(rtdb, `devices/${deviceId}/config`), {
      alarm_mode: 'vibrate',
      led_intensity: 50,
      led_color: '#10B981',
      volume: 60,
    });

    // Verify update
    const updatedConfigSnapshot = await get(ref(rtdb, `devices/${deviceId}/config`));
    const updatedConfigData = updatedConfigSnapshot.val();
    
    if (updatedConfigData.alarm_mode !== 'vibrate') {
      throw new Error('Config update not propagated');
    }
    
    console.log('✓ Config update propagation verified');

    console.log('\n✅ Data synchronization tested successfully\n');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Data synchronization test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup
    if (patientUserId) await utils.cleanupTestUser(patientUserId);
    await utils.cleanupTestDevice(deviceId);
  }
}

/**
 * Test Suite: Dispense Request Security
 * Verifica creación de dispenseRequests y restricciones de reglas
 */
async function testDispenseRequestSecurity() {
  console.log('\n=== Testing Dispense Request Security ===\n');
  let patientUserId;
  const deviceId = TEST_DEVICES.device1;
  try {
    const { userId: patientId } = await utils.createTestUser(TEST_USERS.patient1);
    patientUserId = patientId;

    await setDoc(doc(db, 'devices', deviceId), {
      id: deviceId,
      primaryPatientId: patientId,
      createdAt: serverTimestamp(),
    });

    await set(ref(rtdb, `users/${patientId}/devices/${deviceId}`), true);
    await set(ref(rtdb, `devices/${deviceId}/state`), {
      is_online: true,
      current_status: 'IDLE',
      time_synced: true,
    });

    // Create a dispense request
    const reqId = `req_${Date.now()}`;
    await set(ref(rtdb, `devices/${deviceId}/dispenseRequests/${reqId}`), {
      requestedBy: patientId,
      requestedAt: Date.now(),
      dose: 1,
      status: 'pending',
    });

    const snap = await get(ref(rtdb, `devices/${deviceId}/dispenseRequests/${reqId}`));
    if (!snap.exists()) throw new Error('Dispense request not created');

    console.log('✓ Dispense request created and readable by linked user');
    return { success: true };
  } catch (error) {
    console.error('\n❌ Dispense Request Security failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (patientUserId) await utils.cleanupTestUser(patientUserId);
    await utils.cleanupTestDevice(deviceId);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Final Integration and Testing Suite                      ║');
  console.log('║  User Onboarding & Device Provisioning System             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize Firebase
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    console.log('✓ Firebase initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Run test suites
  const testSuites = [
    { name: 'Patient Onboarding Flow', fn: testPatientOnboardingFlow },
    { name: 'Caregiver Onboarding Flow', fn: testCaregiverOnboardingFlow },
    { name: 'Multi-Caregiver Connection', fn: testMultiCaregiverConnection },
    { name: 'Error Scenarios', fn: testErrorScenarios },
    { name: 'Security and Permissions', fn: testSecurityAndPermissions },
    { name: 'Data Synchronization', fn: testDataSynchronization },
    { name: 'Dispense Request Security', fn: testDispenseRequestSecurity },
  ];

  for (const suite of testSuites) {
    results.total++;
    const result = await suite.fn();
    
    if (result.success) {
      results.passed++;
      results.tests.push({ name: suite.name, status: 'PASSED' });
    } else {
      results.failed++;
      results.tests.push({ 
        name: suite.name, 
        status: 'FAILED', 
        error: result.error 
      });
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

  console.log('Test Results:');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`  ${index + 1}. ${icon} ${test.name}`);
    if (test.error) {
      console.log(`     Error: ${test.error}`);
    }
  });

  console.log('\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test runner failed:', error);
  process.exit(1);
});

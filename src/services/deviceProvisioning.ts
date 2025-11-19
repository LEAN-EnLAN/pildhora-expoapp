import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc
} from 'firebase/firestore';
import { getDbInstance, getRdbInstance } from './firebase';
import { ref, set } from 'firebase/database';

// Test Device IDs that bypass backend validation
const TEST_DEVICE_IDS = ['TEST-DEVICE-001', 'TEST-DEVICE-002', 'PILDHORA-TEST-01'];

export interface ProvisioningData {
    deviceId: string;
    userId: string;
    wifiSSID?: string;
    wifiPassword?: string;
    alarmMode: 'sound' | 'vibrate' | 'both' | 'silent';
    ledIntensity: number;
    ledColor: string;
    volume: number;
}

/**
 * Check if a device exists in the database
 */
export const checkDeviceExists = async (deviceId: string): Promise<boolean> => {
    // Always return true for test devices
    if (TEST_DEVICE_IDS.includes(deviceId)) {
        return true;
    }

    try {
        const db = await getDbInstance();
        if (!db) throw new Error('Database connection failed');

        const deviceRef = doc(db, 'devices', deviceId);
        const deviceDoc = await getDoc(deviceRef);

        return deviceDoc.exists();
    } catch (error) {
        console.error('[DeviceProvisioning] Error checking device existence:', error);
        throw error;
    }
};

/**
 * Provision a device for a user
 */
export const provisionDevice = async (data: ProvisioningData): Promise<void> => {
    try {
        const db = await getDbInstance();
        const rdb = await getRdbInstance();

        if (!db || !rdb) throw new Error('Database connection failed');

        const { deviceId, userId } = data;

        // Handle Test Devices
        if (TEST_DEVICE_IDS.includes(deviceId)) {
            await provisionTestDevice(db, rdb, data);
            return;
        }

        // 1. Verify device is not already claimed
        const deviceRef = doc(db, 'devices', deviceId);
        const deviceDoc = await getDoc(deviceRef);

        if (!deviceDoc.exists()) {
            throw { code: 'DEVICE_NOT_FOUND', message: 'Device not found' };
        }

        const deviceData = deviceDoc.data();
        if (deviceData.primaryPatientId && deviceData.primaryPatientId !== userId) {
            throw { code: 'DEVICE_ALREADY_CLAIMED', message: 'Device already claimed by another user' };
        }

        // 2. Update Device Document in Firestore
        await updateDoc(deviceRef, {
            primaryPatientId: userId,
            status: 'active',
            lastProvisionedAt: serverTimestamp(),
            wifiConfigured: !!data.wifiSSID,
            settings: {
                alarmMode: data.alarmMode,
                ledIntensity: data.ledIntensity,
                ledColor: data.ledColor,
                volume: data.volume,
            }
        });

        // 3. Create/Update User's Device Link
        // This depends on your data model. Assuming users have a 'devices' subcollection or array.
        // Here we'll add it to a 'patient_devices' collection for mapping
        const patientDeviceRef = doc(db, 'users', userId, 'devices', deviceId);
        await setDoc(patientDeviceRef, {
            deviceId: deviceId,
            role: 'admin', // The provisioner becomes the admin
            addedAt: serverTimestamp(),
            name: 'Mi Pildhora', // Default name
        });

        // 4. Update Realtime Database Config
        const rdbConfigRef = ref(rdb, `devices/${deviceId}/config`);
        await set(rdbConfigRef, {
            wifi_ssid: data.wifiSSID || '',
            wifi_password: data.wifiPassword || '',
            alarm_mode: data.alarmMode === 'silent' ? 'off' : (data.alarmMode === 'vibrate' ? 'led' : data.alarmMode),
            led_intensity: Math.round((data.ledIntensity / 100) * 1023),
            led_color: hexToRgb(data.ledColor),
            volume: data.volume,
            updated_at: Date.now(),
            provisioned: true,
            owner_id: userId
        });

    } catch (error) {
        console.error('[DeviceProvisioning] Error provisioning device:', error);
        throw error;
    }
};

/**
 * Helper to provision a test device
 */
const provisionTestDevice = async (db: any, rdb: any, data: ProvisioningData) => {
    const { deviceId, userId } = data;

    console.log(`[DeviceProvisioning] Provisioning TEST DEVICE: ${deviceId}`);

    // Create dummy device doc if it doesn't exist
    const deviceRef = doc(db, 'devices', deviceId);
    await setDoc(deviceRef, {
        serialNumber: deviceId,
        model: 'Pildhora Test Unit',
        status: 'active',
        primaryPatientId: userId,
        isTestDevice: true,
        createdAt: serverTimestamp(),
        lastProvisionedAt: serverTimestamp(),
        settings: {
            alarmMode: data.alarmMode,
            ledIntensity: data.ledIntensity,
            ledColor: data.ledColor,
            volume: data.volume,
        }
    }, { merge: true });

    // Link to user
    const patientDeviceRef = doc(db, 'users', userId, 'devices', deviceId);
    await setDoc(patientDeviceRef, {
        deviceId: deviceId,
        role: 'admin',
        addedAt: serverTimestamp(),
        name: 'Pildhora de Prueba',
        isTestDevice: true
    });

    // Update RDB (Mocking the hardware response)
    const rdbConfigRef = ref(rdb, `devices/${deviceId}/config`);
    await set(rdbConfigRef, {
        wifi_ssid: data.wifiSSID || 'TEST_WIFI',
        wifi_password: 'TEST_PASSWORD',
        provisioned: true,
        owner_id: userId,
        updated_at: Date.now()
    });

    // Simulate device state in RDB
    const rdbStateRef = ref(rdb, `devices/${deviceId}/state`);
    await set(rdbStateRef, {
        online: true,
        wifi_connected: true,
        battery_level: 100,
        last_seen: Date.now()
    });
};

// Helper for color conversion
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : { r: 0, g: 0, b: 0 };
};

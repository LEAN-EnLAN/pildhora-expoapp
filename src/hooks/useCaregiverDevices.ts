import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { getDbInstance, getDeviceRdbInstance } from '../services/firebase';
import { ref, get } from 'firebase/database';
import { PatientWithDevice, DeviceState } from '../types';

export interface CaregiverLinkedDevice {
    deviceId: string;
    linkedAt: Date | string;
    status: 'active' | 'inactive';
    patient?: PatientWithDevice;
    deviceState?: DeviceState;
}

interface UseCaregiverDevicesOptions {
    caregiverId: string | null;
    enabled?: boolean;
}

interface UseCaregiverDevicesResult {
    devices: CaregiverLinkedDevice[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch ALL devices linked to a caregiver, including those without patients.
 * 
 * This hook queries the deviceLinks collection to find all devices linked to the caregiver,
 * then fetches the corresponding patient data (if any) and device state for each device.
 * 
 * @param options - Hook configuration
 * @returns Linked devices data, loading state, error, and refetch function
 */
export function useCaregiverDevices({
    caregiverId,
    enabled = true,
}: UseCaregiverDevicesOptions): UseCaregiverDevicesResult {
    const [devices, setDevices] = useState<CaregiverLinkedDevice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const hasFetchedRef = useRef(false);
    const fetchDevicesRef = useRef<(() => Promise<void>) | null>(null);

    const fetchDevices = useCallback(async () => {
        if (!caregiverId || !enabled) {
            return;
        }

        console.log('[useCaregiverDevices] Starting fetch for caregiver:', caregiverId);
        setIsLoading(true);
        setError(null);

        try {
            const db = await getDbInstance();
            const rdb = await getDeviceRdbInstance();

            if (!db || !rdb) {
                throw new Error('Firebase services not available');
            }

            // 1. Get all device links for this caregiver
            const deviceLinksQuery = query(
                collection(db, 'deviceLinks'),
                where('userId', '==', caregiverId),
                where('role', '==', 'caregiver'),
                where('status', '==', 'active')
            );

            const deviceLinksSnapshot = await getDocs(deviceLinksQuery);

            if (deviceLinksSnapshot.empty) {
                console.log('[useCaregiverDevices] No device links found');
                setDevices([]);
                setIsLoading(false);
                return;
            }

            const links = deviceLinksSnapshot.docs.map(doc => doc.data());
            console.log('[useCaregiverDevices] Found', links.length, 'device links');

            // 2. For each link, fetch patient and device state in parallel
            const devicePromises = links.map(async (link) => {
                const deviceId = link.deviceId;
                let patient: PatientWithDevice | undefined;
                let deviceState: DeviceState | undefined;

                try {
                    // A. Try to find a patient with this deviceId
                    const patientQuery = query(
                        collection(db, 'users'),
                        where('role', '==', 'patient'),
                        where('deviceId', '==', deviceId),
                        limit(1)
                    );
                    const patientSnapshot = await getDocs(patientQuery);

                    if (!patientSnapshot.empty) {
                        const patientDoc = patientSnapshot.docs[0];
                        const data = patientDoc.data();
                        patient = {
                            id: patientDoc.id,
                            ...data,
                            deviceId,
                            createdAt: data.createdAt?.toDate?.() || data.createdAt,
                        } as PatientWithDevice;
                    }

                    // B. Fetch device state from RTDB
                    const deviceStateRef = ref(rdb, `devices/${deviceId}/state`);
                    const deviceStateSnapshot = await get(deviceStateRef);
                    if (deviceStateSnapshot.exists()) {
                        deviceState = deviceStateSnapshot.val() as DeviceState;
                    }

                } catch (err) {
                    console.error(`[useCaregiverDevices] Error fetching details for device ${deviceId}:`, err);
                }

                return {
                    deviceId,
                    linkedAt: link.linkedAt?.toDate?.() || link.linkedAt,
                    status: link.status,
                    patient,
                    deviceState
                } as CaregiverLinkedDevice;
            });

            const results = await Promise.all(devicePromises);
            setDevices(results);
            setIsLoading(false);

        } catch (err: any) {
            console.error('[useCaregiverDevices] Error fetching devices:', err);
            setError(err);
            setIsLoading(false);
        }

        hasFetchedRef.current = true;
    }, [caregiverId, enabled]);

    fetchDevicesRef.current = fetchDevices;

    useEffect(() => {
        if (!caregiverId || !enabled) {
            setIsLoading(false);
            return;
        }

        hasFetchedRef.current = false;
        fetchDevices();
    }, [caregiverId, enabled, fetchDevices]);

    const refetch = useCallback(async () => {
        hasFetchedRef.current = false;
        await fetchDevices();
    }, [fetchDevices]);

    return {
        devices,
        isLoading,
        error,
        refetch
    };
}

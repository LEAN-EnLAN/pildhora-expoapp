import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AppDispatch, RootState } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { startDeviceListener, stopDeviceListener } from '../../src/store/slices/deviceSlice';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import {
  getDbInstance,
  waitForFirebaseInitialization,
  isFirebaseReady,
  getInitializationError,
  reinitializeFirebase
} from '../../src/services/firebase';
import DoseRing from '../../src/components/DoseRing';
import { Card, Button, Container } from '../../src/components/ui';
import { Patient, PatientWithDevice, Task, DoseSegment, IntakeRecord, IntakeStatus } from '../../src/types';

export default function CaregiverDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { state: deviceState, listening } = useSelector((state: RootState) => state.device);
  const [patientsWithDevices, setPatientsWithDevices] = useState<PatientWithDevice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithDevice | null>(null);

  // State for patient-specific data
  const [patientIntakes, setPatientIntakes] = useState<IntakeRecord[]>([]);
  const [patientIntakesLoading, setPatientIntakesLoading] = useState(false);
  const [patientIntakesError, setPatientIntakesError] = useState<Error | null>(null);

  const [adherence, setAdherence] = useState<{ adherence: number; doseSegments: DoseSegment[] } | null>(null);
  const [adherenceLoading, setAdherenceLoading] = useState(false);
  const [adherenceError, setAdherenceError] = useState<Error | null>(null);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Cuidador');

  const generateMockDoseSegments = (adherence: number): DoseSegment[] => {
    // This is a mock implementation. In a real app, you'd generate
    // segments based on actual medication schedules and intake records.
    return [
      { startHour: 8, endHour: 9, status: adherence > 25 ? 'DOSE_TAKEN' : 'PENDING' },
      { startHour: 13, endHour: 14, status: adherence > 50 ? 'DOSE_TAKEN' : 'PENDING' },
      { startHour: 20, endHour: 21, status: adherence > 75 ? 'DOSE_TAKEN' : 'PENDING' },
    ];
  };

  // State for queries and initialization
  const [patientsQuery, setPatientsQuery] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize Firebase and create queries with improved error handling
  useEffect(() => {
    const initializeQueries = async () => {
      try {
        console.log('[CaregiverDashboard] Starting Firebase initialization...');
        setInitializationError(null);

        // Wait for Firebase initialization with timeout
        const initPromise = waitForFirebaseInitialization();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase initialization timeout')), 10000)
        );

        await Promise.race([initPromise, timeoutPromise]);
        console.log('[CaregiverDashboard] Firebase initialized successfully');

        const db = await getDbInstance();
        if (!db) {
          throw new Error('Database instance not available after initialization');
        }

        if (user) {
          console.log('[CaregiverDashboard] Creating queries for user:', user.id);

          // Use user's Firebase UID for queries
          const patientsQ = query(
            collection(db, 'users'),
            where('role', '==', 'patient'),
            where('caregiverId', '==', user.id),
            orderBy('createdAt', 'desc')
          );
          console.log('[CaregiverDashboard] Patients query created');
          setPatientsQuery(patientsQ);
        } else {
          console.warn('[CaregiverDashboard] No user available for query creation');
        }

        setIsInitialized(true);
      } catch (error: any) {
        console.error('[CaregiverDashboard] Error initializing queries:', error);
        setInitializationError(error);
        setIsInitialized(true); // Set to true even on error to avoid infinite loading
      }
    };

    initializeQueries();
  }, [user, retryCount]);

  // Function to retry initialization
  const handleRetryInitialization = async () => {
    console.log('[CaregiverDashboard] Retrying Firebase initialization...');
    setRetryCount(prev => prev + 1);
    setIsInitialized(false);
    setInitializationError(null);

    try {
      await reinitializeFirebase();
    } catch (error) {
      console.error('[CaregiverDashboard] Error during reinitialization:', error);
    }
  };

  const cacheKey = user?.id ? `patients:${user.id}` : null;
  const {
    data: patients = [],
    source: patientsSource,
    isLoading: patientsLoading,
    error: patientsError
  } = useCollectionSWR<Patient>({
    cacheKey,
    query: isInitialized && !initializationError && cacheKey ? patientsQuery : null,
  });

  // Log patients query results
  useEffect(() => {
    console.log('[CaregiverDashboard] Patients query state:', {
      isLoading: patientsLoading,
      error: patientsError,
      dataCount: patients.length,
      source: patientsSource,
      isInitialized,
      hasInitializationError: !!initializationError
    });
    if (patientsError) {
      console.error('[CaregiverDashboard] Patients query error details:', patientsError);
    }
  }, [patientsLoading, patientsError, patients.length, patientsSource, isInitialized, initializationError]);



  // Fetch patient intakes and adherence when a patient is selected
  useEffect(() => {
    if (selectedPatient && isInitialized) {
      const functions = getFunctions();

      // Fetch Intakes
      const fetchPatientIntakes = async () => {
        setPatientIntakesLoading(true);
        setPatientIntakesError(null);
        try {
          const getPatientIntakeRecords = httpsCallable(functions, 'getPatientIntakeRecords');
          const result = await getPatientIntakeRecords({ patientId: selectedPatient.id });
          const data = result.data as { intakes: IntakeRecord[] };
          // Convert ISO strings back to Date objects
          const intakesWithDates = data.intakes.map(intake => ({
            ...intake,
            scheduledTime: new Date(intake.scheduledTime),
            takenAt: intake.takenAt ? new Date(intake.takenAt) : null,
          }));
          setPatientIntakes(intakesWithDates);
        } catch (error: any) {
          console.error('Error fetching patient intakes:', error);
          setPatientIntakesError(error);
        } finally {
          setPatientIntakesLoading(false);
        }
      };

      // Fetch Adherence
      const fetchAdherence = async () => {
        setAdherenceLoading(true);
        setAdherenceError(null);
        try {
          const getPatientAdherence = httpsCallable(functions, 'getPatientAdherence');
          const result = await getPatientAdherence({ patientId: selectedPatient.id });
          const data = result.data as { adherence: number, doseSegments: DoseSegment[] };
          setAdherence(data);
        } catch (error: any) {
          console.error('Error fetching adherence:', error);
          setAdherenceError(error);
        } finally {
          setAdherenceLoading(false);
        }
      };

      fetchPatientIntakes();
      fetchAdherence();
    }
  }, [selectedPatient, isInitialized]);

  // Combine patients with device states and dose segments
  useEffect(() => {
    const enhancedPatients = patients.map((patient: Patient) => ({
      ...patient,
      deviceState: patient.deviceId ? deviceState : undefined,
      doseSegments: adherence?.doseSegments || [], // Use real or empty segments
    } as PatientWithDevice));
    setPatientsWithDevices(enhancedPatients);

    // Auto-select first patient if none selected
    if (enhancedPatients.length > 0 && !selectedPatient) {
      setSelectedPatient(enhancedPatients[0]);
    }
  }, [patients, deviceState, adherence]);

  // Start device listener for the first patient with a device
  useEffect(() => {
    const firstPatientWithDevice = patients.find(p => p.deviceId);
    if (firstPatientWithDevice?.deviceId && !listening) {
      dispatch(startDeviceListener(firstPatientWithDevice.deviceId));
    }

    return () => {
      if (listening) {
        dispatch(stopDeviceListener());
      }
    };
  }, [patients, dispatch, listening]);

  const handleEmergency = () => {
    setModalVisible(true);
  };

  const callEmergency = (number: string) => {
    try {
      Linking.openURL(`tel:${number}`);
    } catch (e) {
      // noop; on web this may not work
    }
    setModalVisible(false);
  };

  const handlePatientSelect = (patient: PatientWithDevice) => {
    setSelectedPatient(patient);
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("default", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("default", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };



  // Show initialization error with retry option
  if (initializationError) {
    return (
      <Container className="flex-1 bg-gray-100">
        <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <View>
            <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
            <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
          </View>
          <Button
            variant="secondary"
            onPress={async () => {
              await dispatch(logout());
              router.replace('/');
            }}
          >
            Salir
          </Button>
        </View>
        <View className="p-4">
          <Card className="bg-red-100 border border-red-200 rounded-2xl p-4">
            <Text className="text-red-800 text-center font-semibold mb-2">
              Error de inicialización de Firebase
            </Text>
            <Text className="text-red-700 text-center text-sm mb-4">
              {initializationError.message || 'No se pudo conectar con los servicios de Firebase'}
            </Text>
            <Button
              variant="primary"
              onPress={handleRetryInitialization}
            >
              Reintentar
            </Button>
          </Card>
        </View>
      </Container>
    );
  }

  // Show error if patients failed to load
  if (patientsError) {
    const isIndexError = patientsError?.message?.includes('requires an index');

    return (
      <Container className="flex-1 bg-gray-100">
        <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <View>
            <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
            <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
          </View>
          <Button
            variant="secondary"
            onPress={async () => {
              await dispatch(logout());
              router.replace('/auth/signup');
            }}
          >
            <Ionicons name="log-out" size={20} color="#374151" />
          </Button>
        </View>
        <View className="p-4">
          <Card className="bg-orange-100 border border-orange-200 rounded-2xl p-4">
            <Text className="text-orange-800 text-center font-semibold mb-2">
              {isIndexError ? 'Configuración en progreso' : 'Error al cargar datos'}
            </Text>
            <Text className="text-orange-700 text-center text-sm mb-4">
              {isIndexError
                ? 'Los índices de la base de datos se están configurando. Esto puede tardar unos minutos. Por favor, intenta nuevamente en breve.'
                : (patientsError?.message || 'Verifica tu conexión e intenta nuevamente.')
              }
            </Text>
            <Button
              variant="primary"
              size="medium"
              onPress={handleRetryInitialization}
              accessibilityLabel="Reintentar"
              accessibilityHint="Intentar cargar datos nuevamente"
            />
        </View>
      </View>
      </Container >
    );
  }

  return (
    <Container className="flex-1">
      {/* Patient Selector */}
      {patientsLoading && (
        <View className="p-4 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
      {patientsWithDevices.length > 0 && (
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
            {patientsWithDevices.map((patient) => (
              <Button
                key={patient.id}
                variant={selectedPatient?.id === patient.id ? 'primary' : 'secondary'}
                onPress={() => handlePatientSelect(patient)}
              >
                {patient.name}
              </Button>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {patientsLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4">Cargando pacientes...</Text>
          </View>
        ) : selectedPatient ? (
          <View className="p-4">
            <Card className="bg-white rounded-2xl p-4 items-center">
              <Text className="text-2xl font-bold mb-4">Adherencia Diaria</Text>
              {adherenceLoading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : (
                <DoseRing
                  size={250}
                  strokeWidth={20}
                  segments={adherence?.doseSegments || []}
                  accessibilityLabel={`Anillo de dosis de ${selectedPatient.name}`}
                />
              )}
            </View>

            <Card className="bg-white rounded-2xl p-4 mt-4">
              <Text className="text-xl font-bold mb-4">Dispositivo</Text>
              {selectedPatient.deviceState ? (
                <>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="watch-outline" size={24} color="gray" />
                      <Text className="text-lg ml-2">Nivel de Batería</Text>
                    </View>
                    <Text className="text-lg font-semibold">{selectedPatient.deviceState.battery_level}%</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-4">
                    <View className="flex-row items-center">
                      <Ionicons name="wifi-outline" size={24} color="gray" />
                      <Text className="text-lg ml-2">Estado</Text>
                    </View>
                    <Text className={`text-lg font-semibold ${selectedPatient.deviceState.is_online ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedPatient.deviceState.is_online ? 'En Línea' : 'Desconectado'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text className="text-gray-500">No hay dispositivo vinculado.</Text>
              )}
              <Button
                variant="primary"
                onPress={() => router.push({ pathname: '/caregiver/chat', params: { patientId: selectedPatient.id, patientName: selectedPatient.name }})}
              >
                Chatear con {selectedPatient.name}
              </Button>
            </Card>
          </View>
      ) : (
      <View className="flex-1 justify-center items-center py-20">
        <Ionicons name="people-outline" size={48} color="#9CA3AF" />
        <Text className="text-gray-600 mt-4 text-center">
          No hay pacientes asignados a tu cuenta
        </Text>
        <Text className="text-gray-500 text-sm text-center mt-1">
          Usa el botón de abajo para vincular un nuevo dispositivo.
        </Text>
        <Button
          variant="primary"
          onPress={() => router.push('/caregiver/add-device')}
        >
          Vincular Dispositivo
        </Button>
      </View>
        )}
    </ScrollView>
      {/* Add Patient FAB */ }
  <Button
    variant="primary"
    className="absolute bottom-6 right-6 rounded-full w-16 h-16 justify-center items-center"
    onPress={() => router.push('/caregiver/add-device')}
  >
    <Ionicons name="add-outline" size={32} color="white" />
  </Button>
    </Container >
  );
}

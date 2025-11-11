import React, { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
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
import { Card, NativeButton } from '../../src/components/ui';
import { Patient, PatientWithDevice, Task, DoseSegment, IntakeRecord, IntakeStatus } from '../../src/types';

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default function CaregiverDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { state: deviceState, listening } = useSelector((state: RootState) => state.device);
  const [refreshing, setRefreshing] = useState(false);
  const [patientsWithDevices, setPatientsWithDevices] = useState<PatientWithDevice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithDevice | null>(null);
  const [patientIntakes, setPatientIntakes] = useState<IntakeRecord[]>([]);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Cuidador');

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

  const {
    data: patients = [],
    source: patientsSource,
    isLoading: patientsLoading,
    error: patientsError
  } = useCollectionSWR<Patient>({
    cacheKey: `patients:${user?.id}`,
    query: isInitialized && !initializationError ? patientsQuery : null,
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



  // Fetch patient intakes when a patient is selected
  useEffect(() => {
    if (selectedPatient && isInitialized) {
      const fetchPatientIntakes = async () => {
        try {
          const db = await getDbInstance();
          const intakesQuery = query(
            collection(db, 'intakeRecords'),
            where('patientId', '==', selectedPatient.id),
            orderBy('scheduledTime', 'desc'),
            orderBy('scheduledTime', 'desc')
          );
          
          // For now, use mock data for intakes
          const mockIntakes: IntakeRecord[] = [
            {
              id: 'intake-1',
              medicationName: 'Aspirin',
              dosage: '100mg',
              scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              status: IntakeStatus.TAKEN,
              patientId: selectedPatient.id,
              takenAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            {
              id: 'intake-2', 
              medicationName: 'Vitamin D',
              dosage: '1000IU',
              scheduledTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
              status: IntakeStatus.TAKEN,
              patientId: selectedPatient.id,
              takenAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            }
          ];
          setPatientIntakes(mockIntakes);
        } catch (error) {
          console.error('Error fetching patient intakes:', error);
        }
      };

      fetchPatientIntakes();
    }
  }, [selectedPatient, isInitialized]);

  // Combine patients with device states and dose segments
  useEffect(() => {
    const enhancedPatients = patients.map((patient: Patient) => {
      // Generate mock dose segments based on adherence
      const doseSegments = generateMockDoseSegments(patient.adherence || 0);

      return {
        ...patient,
        deviceState: patient.deviceId ? deviceState : undefined,
        doseSegments,
      } as PatientWithDevice;
    });

    setPatientsWithDevices(enhancedPatients);
    
    // Auto-select first patient if none selected
    if (enhancedPatients.length > 0 && !selectedPatient) {
      setSelectedPatient(enhancedPatients[0]);
    }
  }, [patients, deviceState]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // If there's an initialization error, retry initialization
    if (initializationError) {
      await handleRetryInitialization();
    }
    
    // The SWR hook will automatically refresh on remount or query change
    setTimeout(() => setRefreshing(false), 1000);
  };

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
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <View>
            <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
            <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
          </View>
          <TouchableOpacity className="px-3 py-2 rounded-lg bg-gray-400 items-center justify-center" onPress={async () => {
            await dispatch(logout());
            router.replace('/');
          }}>
            <Text className="text-white font-bold text-center">Salir</Text>
          </TouchableOpacity>
        </View>
        <View className="p-4">
          <View className="bg-red-100 border border-red-200 rounded-2xl p-4">
            <Text className="text-red-800 text-center font-semibold mb-2">
              Error de inicialización de Firebase
            </Text>
            <Text className="text-red-700 text-center text-sm mb-4">
              {initializationError.message || 'No se pudo conectar con los servicios de Firebase'}
            </Text>
            <TouchableOpacity
              className="bg-blue-600 rounded-lg p-3 items-center"
              onPress={handleRetryInitialization}
            >
              <Text className="text-white font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if patients failed to load
  if (patientsError) {
    const isIndexError = patientsError?.message?.includes('requires an index');
    
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <View>
            <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
            <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
          </View>
          <NativeButton
            icon={<Ionicons name="log-out" size={20} color="#FFFFFF" />}
            variant="icon"
            size="small"
            onPress={async () => {
              await dispatch(logout());
              router.replace('/auth/signup');
            }}
            accessibilityLabel="Salir"
            accessibilityHint="Cerrar sesión y volver al registro"
          />
        </View>
        <View className="p-4">
          <View className="bg-orange-100 border border-orange-200 rounded-2xl p-4">
            <Text className="text-orange-800 text-center font-semibold mb-2">
              {isIndexError ? 'Configuración en progreso' : 'Error al cargar datos'}
            </Text>
            <Text className="text-orange-700 text-center text-sm mb-4">
              {isIndexError 
                ? 'Los índices de la base de datos se están configurando. Esto puede tardar unos minutos. Por favor, intenta nuevamente en breve.'
                : (patientsError?.message || 'Verifica tu conexión e intenta nuevamente.')
              }
            </Text>
            <NativeButton
              title="Reintentar"
              variant="primary"
              size="medium"
              onPress={handleRefresh}
              accessibilityLabel="Reintentar"
              accessibilityHint="Intentar cargar datos nuevamente"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      {/* Patient Selector */}
      {patientsWithDevices.length > 0 && (
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
            {patientsWithDevices.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                className={`px-4 py-2 rounded-full ${
                  selectedPatient?.id === patient.id
                    ? 'bg-blue-600'
                    : 'bg-gray-200 border border-gray-300'
                }`}
                onPress={() => handlePatientSelect(patient)}
              >
                <Text
                  className={`font-semibold ${
                    selectedPatient?.id === patient.id ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {patient.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {selectedPatient ? (
          <View className="p-4">
            <View className="bg-white rounded-2xl p-4 items-center">
              <Text className="text-2xl font-bold mb-4">Adherencia Diaria</Text>
              <DoseRing
                size={250}
                strokeWidth={20}
                segments={selectedPatient.doseSegments || []}
                accessibilityLabel={`Anillo de dosis de ${selectedPatient.name}`}
              />
            </View>

            <View className="bg-white rounded-2xl p-4 mt-4">
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
              <NativeButton
                title={`Chatear con ${selectedPatient.name}`}
                variant="primary"
                size="medium"
                onPress={() => router.push({ pathname: '/caregiver/chat', params: { patientId: selectedPatient.id, patientName: selectedPatient.name }})}
                accessibilityLabel={`Chatear con ${selectedPatient.name}`}
                accessibilityHint={`Abrir chat con ${selectedPatient.name}`}
              />
            </View>
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
            <NativeButton
              title="Vincular Dispositivo"
              variant="primary"
              size="medium"
              onPress={() => router.push('/caregiver/add-device')}
              accessibilityLabel="Vincular Dispositivo"
              accessibilityHint="Agregar nuevo dispositivo para paciente"
            />
          </View>
        )}
      </ScrollView>
      {/* Add Patient FAB */}
      <NativeButton
        icon={<Ionicons name="add-outline" size={32} color="white" />}
        variant="icon"
        size="large"
        onPress={() => router.push('/caregiver/add-device')}
        style={styles.fab}
        accessibilityLabel="Agregar paciente"
        accessibilityHint="Agregar nuevo paciente o dispositivo"
      />
    </>
  );
}

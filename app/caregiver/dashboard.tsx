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
import AdherenceProgressChart from '../../src/components/AdherenceProgressChart';
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

  const [patientIntakes, setPatientIntakes] = useState<IntakeRecord[]>([]);
  const [patientIntakesLoading, setPatientIntakesLoading] = useState(false);
  const [patientIntakesError, setPatientIntakesError] = useState<Error | null>(null);

  const [adherence, setAdherence] = useState<{ adherence: number; doseSegments: DoseSegment[] } | null>(null);
  const [adherenceLoading, setAdherenceLoading] = useState(false);
  const [adherenceError, setAdherenceError] = useState<Error | null>(null);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Cuidador');

  const [patientsQuery, setPatientsQuery] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const initializeQueries = async () => {
      try {
        setInitializationError(null);
        const initPromise = waitForFirebaseInitialization();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase initialization timeout')), 10000)
        );
        await Promise.race([initPromise, timeoutPromise]);
        const db = await getDbInstance();
        if (!db) {
          throw new Error('Database instance not available after initialization');
        }
        if (user) {
          const patientsQ = query(
            collection(db, 'users'),
            where('role', '==', 'patient'),
            where('caregiverId', '==', user.id),
            orderBy('createdAt', 'desc')
          );
          setPatientsQuery(patientsQ);
        }
        setIsInitialized(true);
      } catch (error: any) {
        setInitializationError(error);
        setIsInitialized(true);
      }
    };
    initializeQueries();
  }, [user, retryCount]);

  const handleRetryInitialization = async () => {
    setRetryCount(prev => prev + 1);
    setIsInitialized(false);
    setInitializationError(null);
    try {
      await reinitializeFirebase();
    } catch (error) {
      console.error('Error during reinitialization:', error);
    }
  };

  const cacheKey = user?.id ? `patients:${user.id}` : null;
  const { data: patients = [], source: patientsSource, isLoading: patientsLoading, error: patientsError } = useCollectionSWR<Patient>({
    cacheKey,
    query: isInitialized && !initializationError && cacheKey ? patientsQuery : null,
  });

  useEffect(() => {
    if (selectedPatient && isInitialized) {
      const functions = getFunctions();
      const fetchPatientIntakes = async () => {
        setPatientIntakesLoading(true);
        setPatientIntakesError(null);
        try {
          const getPatientIntakeRecords = httpsCallable(functions, 'getPatientIntakeRecords');
          const result = await getPatientIntakeRecords({ patientId: selectedPatient.id });
          const data = result.data as { intakes: IntakeRecord[] };
          const intakesWithDates = data.intakes.map(intake => ({
            ...intake,
            scheduledTime: new Date(intake.scheduledTime),
            takenAt: intake.takenAt ? new Date(intake.takenAt) : undefined,
          }));
          setPatientIntakes(intakesWithDates);
        } catch (error: any) {
          setPatientIntakesError(error);
        } finally {
          setPatientIntakesLoading(false);
        }
      };
      const fetchAdherence = async () => {
        setAdherenceLoading(true);
        setAdherenceError(null);
        try {
          const getPatientAdherence = httpsCallable(functions, 'getPatientAdherence');
          const result = await getPatientAdherence({ patientId: selectedPatient.id });
          const data = result.data as { adherence: number, doseSegments: DoseSegment[] };
          setAdherence(data);
        } catch (error: any) {
          setAdherenceError(error);
        } finally {
          setAdherenceLoading(false);
        }
      };
      fetchPatientIntakes();
      fetchAdherence();
    }
  }, [selectedPatient, isInitialized]);

  useEffect(() => {
    const enhancedPatients = patients.map((patient: Patient) => ({
      ...patient,
      deviceState: patient.deviceId ? deviceState : undefined,
    } as PatientWithDevice));
    setPatientsWithDevices(enhancedPatients);
    if (enhancedPatients.length > 0 && !selectedPatient) {
      setSelectedPatient(enhancedPatients[0]);
    }
  }, [patients, deviceState, adherence]);

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

  const handlePatientSelect = (patient: PatientWithDevice) => {
    setSelectedPatient(patient);
  };

  if (initializationError) {
    return (
      <Container style={styles.flex1}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>PILDHORA</Text>
            <Text style={styles.headerSubtitle}>Hola, {displayName}</Text>
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
        <View style={styles.content}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Error de inicialización de Firebase</Text>
            <Text style={styles.errorMessage}>{initializationError.message || 'No se pudo conectar con los servicios de Firebase'}</Text>
            <Button variant="primary" onPress={handleRetryInitialization}>Reintentar</Button>
          </Card>
        </View>
      </Container>
    );
  }

  if (patientsError) {
    const isIndexError = patientsError?.message?.includes('requires an index');
    return (
      <Container style={styles.flex1}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>PILDHORA</Text>
            <Text style={styles.headerSubtitle}>Hola, {displayName}</Text>
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
        <View style={styles.content}>
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>{isIndexError ? 'Configuración en progreso' : 'Error al cargar datos'}</Text>
            <Text style={styles.warningMessage}>
              {isIndexError ? 'Los índices de la base de datos se están configurando. Esto puede tardar unos minutos. Por favor, intenta nuevamente en breve.' : (patientsError?.message || 'Verifica tu conexión e intenta nuevamente.')}
            </Text>
            <Button variant="primary" size="medium" onPress={handleRetryInitialization} accessibilityLabel="Reintentar" accessibilityHint="Intentar cargar datos nuevamente" />
          </Card>
        </View>
      </Container>
    );
  }

  return (
    <Container style={styles.flex1}>
      {patientsLoading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
      {patientsWithDevices.length > 0 && (
        <View style={styles.patientSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientScrollView}>
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

      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
        {patientsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Cargando pacientes...</Text>
          </View>
        ) : selectedPatient ? (
          <View style={styles.content}>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Adherencia Diaria</Text>
              {adherenceLoading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : (
                <AdherenceProgressChart
                  progress={adherence ? adherence.adherence / 100 : 0}
                  size={250}
                />
              )}
            </Card>

            <Card style={styles.deviceCard}>
              <Text style={styles.deviceTitle}>Dispositivo</Text>
              {selectedPatient.deviceState ? (
                <>
                  <View style={styles.deviceRow}>
                    <View style={styles.deviceInfo}>
                      <Ionicons name="watch-outline" size={24} color="gray" />
                      <Text style={styles.deviceLabel}>Nivel de Batería</Text>
                    </View>
                    <Text style={styles.deviceValue}>{selectedPatient.deviceState.battery_level}%</Text>
                  </View>
                  <View style={styles.deviceRowSpaced}>
                    <View style={styles.deviceInfo}>
                      <Ionicons name="wifi-outline" size={24} color="gray" />
                      <Text style={styles.deviceLabel}>Estado</Text>
                    </View>
                    <Text style={[styles.deviceValue, selectedPatient.deviceState.is_online ? styles.online : styles.offline]}>
                      {selectedPatient.deviceState.is_online ? 'En Línea' : 'Desconectado'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noDevice}>No hay dispositivo vinculado.</Text>
              )}
              <Button
                variant="primary"
                onPress={() => router.push({ pathname: '/caregiver/chat', params: { patientId: selectedPatient.id, patientName: selectedPatient.name } })}
              >
                Chatear con {selectedPatient.name}
              </Button>
            </Card>
          </View>
        ) : (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No hay pacientes asignados a tu cuenta</Text>
            <Text style={styles.emptySubtext}>Usa el botón de abajo para vincular un nuevo dispositivo.</Text>
            <Button variant="primary" onPress={() => router.push('/caregiver/add-device')}>Vincular Dispositivo</Button>
          </View>
        )}
      </ScrollView>
      <Button
        variant="primary"
        style={styles.fab}
        onPress={() => router.push('/caregiver/add-device')}
      >
        <Ionicons name="add-outline" size={32} color="white" />
      </Button>
    </Container>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  content: { padding: 16 },
  errorCard: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 16, padding: 16 },
  errorTitle: { color: '#991B1B', textAlign: 'center', fontWeight: '600', marginBottom: 8 },
  errorMessage: { color: '#B91C1C', textAlign: 'center', fontSize: 14, marginBottom: 16 },
  warningCard: { backgroundColor: '#FFEDD5', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 16, padding: 16 },
  warningTitle: { color: '#9A3412', textAlign: 'center', fontWeight: '600', marginBottom: 8 },
  warningMessage: { color: '#C2410C', textAlign: 'center', fontSize: 14, marginBottom: 16 },
  loadingIndicator: { padding: 16, alignItems: 'center' },
  patientSelector: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  patientScrollView: { gap: 12 },
  scrollContent: { paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  loadingText: { color: '#4B5563', marginTop: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center' },
  cardTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  deviceCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginTop: 16 },
  deviceTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  deviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deviceRowSpaced: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  deviceInfo: { flexDirection: 'row', alignItems: 'center' },
  deviceLabel: { fontSize: 18, marginLeft: 8 },
  deviceValue: { fontSize: 18, fontWeight: '600' },
  online: { color: '#10B981' },
  offline: { color: '#EF4444' },
  noDevice: { color: '#6B7280' },
  emptyText: { color: '#4B5563', marginTop: 16, textAlign: 'center' },
  emptySubtext: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, borderRadius: 32, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
});

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Alert, Modal, Linking, ScrollView, ActionSheetIOS, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Container } from '../../src/components/ui';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { fetchMedications } from '../../src/store/slices/medicationsSlice';
import { startIntakesSubscription, stopIntakesSubscription } from '../../src/store/slices/intakesSlice';
import AdherenceProgressChart from '../../src/components/AdherenceProgressChart';
import { Card, Button } from '../../src/components/ui';
import { startDeviceListener, stopDeviceListener } from '../../src/store/slices/deviceSlice';
import { Medication, DoseSegment, IntakeStatus } from '../../src/types';
import { getDbInstance, getRdbInstance } from '../../src/services/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, get as rdbGet } from 'firebase/database';

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const getTodayAbbrev = () => DAY_ABBREVS[new Date().getDay()];
const parseTimeToHour = (t?: string) => {
  if (!t) return null;
  const [hh, mm] = t.split(':').map((x) => parseInt(x, 10));
  if (isNaN(hh)) return null;
  return hh + (isNaN(mm) ? 0 : mm / 60);
};
const formatHourDecimal = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(hh)}:${pad(mm)}`;
};
const isScheduledToday = (med: Medication) => {
  const freq = med.frequency || '';
  const days = freq.split(',').map((s) => s.trim());
  return days.includes(getTodayAbbrev());
};
const getNextTimeToday = (med: Medication) => {
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const times = (med.times || []).map((t) => parseTimeToHour(t)).filter((v): v is number => v !== null);
  const upcoming = times.filter((h) => h >= nowHour).sort((a, b) => a - b);
  return upcoming.length ? upcoming[0] : null;
};

export default function PatientHome() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { medications, loading } = useSelector((state: RootState) => state.medications);
  const { intakes } = useSelector((state: RootState) => state.intakes);
  const deviceSlice = useSelector((state: RootState) => (state as any).device);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Paciente');
  const patientId = user?.id;

  const [modalVisible, setModalVisible] = useState(false);
  const [takingLoading, setTakingLoading] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  useEffect(() => {
    if (patientId) {
      dispatch(fetchMedications(patientId));
      dispatch(startIntakesSubscription(patientId));
    }
    return () => {
      if (patientId) {
        dispatch(stopIntakesSubscription());
      }
    };
  }, [patientId, dispatch]);

  useEffect(() => {
    const initDevice = async () => {
      try {
        if (!patientId) return;
        const rdb = await getRdbInstance();
        if (!rdb) return;
        const snap = await rdbGet(ref(rdb, `users/${patientId}/devices`));
        const val = snap.val() || {};
        const ids = Object.keys(val);
        if (ids.length) {
          setActiveDeviceId(ids[0]);
          if (!deviceSlice?.listening) {
            dispatch(startDeviceListener(ids[0]));
          }
        }
      } catch {}
    };
    initDevice();
    return () => {
      if (deviceSlice?.listening) {
        dispatch(stopDeviceListener());
      }
    };
  }, [patientId]);

  const adherencePercentage = useMemo(() => {
    const todaysMeds = medications.filter(isScheduledToday);
    if (todaysMeds.length === 0) return 1; // Perfect adherence if no meds scheduled

    let totalDoses = 0;
    todaysMeds.forEach(med => {
      totalDoses += med.times.length;
    });

    if (totalDoses === 0) return 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueTaken = new Set<string>();
    intakes.forEach((intake) => {
      const intakeDate = new Date(intake.scheduledTime);
      if (intakeDate >= today && intake.status === IntakeStatus.TAKEN) {
        const medKey = intake.medicationId || intake.medicationName;
        const timeKey = intakeDate.toISOString();
        uniqueTaken.add(`${medKey}-${timeKey}`);
      }
    });
    const takenUnique = uniqueTaken.size;
    const ratio = takenUnique / totalDoses;
    return Math.min(1, Math.max(0, ratio));
  }, [medications, intakes]);

  const upcoming = useMemo(() => {
    const candidates = medications
      .filter(isScheduledToday)
      .map((m) => ({ med: m, next: getNextTimeToday(m) }))
      .filter((x) => x.next !== null) as { med: Medication; next: number }[];
    candidates.sort((a, b) => a.next - b.next);
    return candidates.length ? candidates[0] : null;
  }, [medications]);

  const alreadyTakenUpcoming = useMemo(() => {
    if (!upcoming) return false;
    const next = upcoming.next;
    const hh = Math.floor(next);
    const mm = Math.round((next - hh) * 60);
    const scheduledDate = new Date();
    scheduledDate.setHours(hh, mm, 0, 0);
    const scheduledMs = scheduledDate.getTime();
    return intakes.some((intake) => {
      if (intake.status !== IntakeStatus.TAKEN) return false;
      const intakeMs = new Date(intake.scheduledTime).getTime();
      const matchesTime = intakeMs === scheduledMs;
      const matchesMed = intake.medicationId
        ? intake.medicationId === upcoming.med.id
        : intake.medicationName === upcoming.med.name;
      return matchesTime && matchesMed;
    });
  }, [upcoming, intakes]);

  const handleHistory = () => router.push('/patient/history');
  const handleEmergency = () => handleEmergencyPress();
  const callEmergency = (number: string) => {
    try {
      Linking.openURL(`tel:${number}`);
    } catch (e) {
      // noop
    }
    setModalVisible(false);
  };

  const handleEmergencyPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Llamar 911', 'Llamar 112'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) callEmergency('911');
          else if (buttonIndex === 2) callEmergency('112');
        }
      );
    } else {
      setModalVisible(true);
    }
  };
  const handleLogout = async () => {
    try {
      await dispatch(logout());
      router.replace('/auth/signup');
    } catch (error) {
      router.replace('/auth/signup');
    }
  };

  const handleAccountMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Salir de sesión', 'Configuraciones', 'Mi dispositivo'],
          cancelButtonIndex: 0,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleLogout();
          else if (buttonIndex === 2) handleConfiguraciones();
          else if (buttonIndex === 3) handleMiDispositivo();
        }
      );
    } else {
      setAccountMenuVisible(!accountMenuVisible);
    }
  };

  const handleConfiguraciones = () => router.push('/patient/settings');
  const handleMiDispositivo = () => router.push('/patient/link-device');

  const handleTakeUpcomingMedication = async () => {
    try {
      if (!upcoming) {
        Alert.alert('Sin dosis', 'No hay una dosis programada próxima para hoy.');
        return;
      }
      if (!patientId) {
        Alert.alert('Sesión requerida', 'Inicia sesión para registrar la toma.');
        return;
      }
      setTakingLoading(true);
      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore no disponible');
      }
      const hh = Math.floor(upcoming.next);
      const mm = Math.round((upcoming.next - hh) * 60);
      const scheduledDate = new Date();
      scheduledDate.setHours(hh, mm, 0, 0);
      await addDoc(collection(db, 'intakeRecords'), {
        medicationName: upcoming.med.name,
        dosage: upcoming.med.dosage || '',
        scheduledTime: Timestamp.fromDate(scheduledDate),
        status: IntakeStatus.TAKEN,
        patientId,
        takenAt: Timestamp.now(),
        ...(upcoming.med.id ? { medicationId: upcoming.med.id } : {}),
        caregiverId: upcoming.med.caregiverId,
      } as any);
      Alert.alert('Registrado', 'Se registró la toma de la dosis.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar la toma.');
    } finally {
      setTakingLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top','bottom']} style={styles.container}>
      <Container style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PILDHORA</Text>
          <Text style={styles.headerSubtitle}>Hola, {displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Button variant="danger" size="sm" onPress={handleEmergency}>
            <Ionicons name="alert" size={20} color="#FFFFFF" />
          </Button>
          <Button variant="secondary" size="sm" onPress={handleAccountMenu}>
            <Ionicons name="person" size={20} color="#374151" />
          </Button>
        </View>
      </View>

      {Platform.OS !== 'ios' && (
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Emergencia</Text>
                <Text style={styles.modalSubtitle}>Selecciona una opción:</Text>
                <View style={styles.modalActions}>
                  <Button variant="danger" size="lg" onPress={() => callEmergency('911')}>Llamar 911</Button>
                  <Button variant="secondary" size="lg" onPress={() => callEmergency('112')}>Llamar 112</Button>
                  <Button variant="secondary" size="lg" onPress={() => setModalVisible(false)}>Cancelar</Button>
                </View>
              </View>
            </View>

            {deviceSlice?.state ? (
              <View style={styles.contentPadding}>
                <Card>
                  <Text style={styles.cardTitle}>Mi dispositivo</Text>
                  <View style={styles.upcomingContainer}>
                    <View>
                      <Text style={styles.upcomingMedInfo}>Estado: {deviceSlice.state.current_status || 'N/D'}</Text>
                      <Text style={styles.upcomingMedInfo}>Batería: {typeof deviceSlice.state.battery_level === 'number' ? `${deviceSlice.state.battery_level}%` : 'N/D'}</Text>
                      <Text style={styles.upcomingMedInfo}>Conexión: {deviceSlice.state.is_online ? 'En línea' : 'Desconectado'}</Text>
                    </View>
                  </View>
                </Card>
              </View>
            ) : null}
          </View>
        </Modal>
      )}

      {Platform.OS !== 'ios' && (
        <Modal visible={accountMenuVisible} transparent animationType="fade" onRequestClose={() => setAccountMenuVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Cuenta</Text>
                <Text style={styles.modalSubtitle}>Selecciona una opción:</Text>
                <View style={styles.modalActions}>
                  <Button variant="danger" size="lg" onPress={() => { setAccountMenuVisible(false); handleLogout(); }}>Salir de sesión</Button>
                  <Button variant="secondary" size="lg" onPress={() => { setAccountMenuVisible(false); handleConfiguraciones(); }}>Configuraciones</Button>
                  <Button variant="secondary" size="lg" onPress={() => { setAccountMenuVisible(false); handleMiDispositivo(); }}>Mi dispositivo</Button>
                  <Button variant="secondary" size="lg" onPress={() => setAccountMenuVisible(false)}>Cancelar</Button>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <FlatList
        data={medications.filter(isScheduledToday)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            <View style={styles.contentPadding}>
              <Card>
                <Text style={styles.cardTitle}>Estado del día</Text>
                <View style={styles.doseRingContainer}>
                  <AdherenceProgressChart progress={adherencePercentage} />
                </View>
              </Card>
            </View>

            <View style={styles.contentPadding}>
              <Card>
                <Text style={styles.cardTitle}>Próxima dosis</Text>
                {upcoming ? (
                  <View style={styles.upcomingContainer}>
                    <View>
                      <Text style={styles.upcomingMedName}>{upcoming.med.name}</Text>
                      <Text style={styles.upcomingMedInfo}>{upcoming.med.dosage}</Text>
                      <Text style={styles.upcomingMedInfo}>{formatHourDecimal(upcoming.next)}</Text>
                    </View>
                    {deviceSlice?.deviceID ? (
                      <Text style={styles.upcomingMedInfo}>Controlado por el dispositivo</Text>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        onPress={handleTakeUpcomingMedication}
                        disabled={takingLoading}
                      >
                        Tomar medicación
                      </Button>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noUpcoming}>No hay dosis próximas para hoy.</Text>
                )}
              </Card>
            </View>

            <View style={styles.cardPadding}>
              <Card>
                <View style={styles.historyContainer}>
                  <View style={styles.historyInfo}>
                    <Ionicons name="time" size={22} color="#1C1C1E" />
                    <View>
                      <Text style={styles.cardTitle}>Historial</Text>
                      <Text style={styles.historySubtitle}>Dosis y eventos anteriores</Text>
                    </View>
                  </View>
                  <Button variant="primary" size="sm" onPress={handleHistory}>Abrir</Button>
                </View>
              </Card>
            </View>

            <View style={styles.cardPadding}>
              <View style={styles.todayHeader}>
                <Text style={styles.cardTitle}>Hoy</Text>
                <Link href="/patient/medications" asChild>
                  <Button variant="primary" size="md" onPress={() => {}}>Mis Medicamentos</Button>
                </Link>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <View style={styles.cardPadding}>
            <Card>
              <View style={styles.medicationContainer}>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{item.name}</Text>
                  <Text style={styles.medicationDosage}>{item.dosage}</Text>
                  {(() => {
                    const next = getNextTimeToday(item);
                    return next !== null ? <Text style={styles.medicationDosage}>Próxima: {formatHourDecimal(next)}</Text> : null;
                  })()}
                </View>
                <Link href={`/patient/medications/${item.id}`} asChild>
                  <Button variant="secondary" size="sm" onPress={() => {}}>Abrir</Button>
                </Link>
              </View>
            </Card>
          </View>
        )}
      />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  modalView: { backgroundColor: 'white', width: '100%', maxWidth: 384, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 5 },
  modalContent: { padding: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  modalSubtitle: { color: '#4B5563', marginBottom: 24, textAlign: 'center' },
  modalActions: { gap: 12 },
  contentPadding: { paddingHorizontal: 16, paddingTop: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  doseRingContainer: { alignItems: 'center', justifyContent: 'center' },
  upcomingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upcomingMedName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  upcomingMedInfo: { color: '#4B5563' },
  noUpcoming: { color: '#6B7280' },
  cardPadding: { paddingHorizontal: 16, marginTop: 8 },
  historyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historySubtitle: { color: '#4B5563' },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  medicationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  medicationInfo: { flex: 1 },
  medicationName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  medicationDosage: { color: '#4B5563', marginBottom: 4 },
});

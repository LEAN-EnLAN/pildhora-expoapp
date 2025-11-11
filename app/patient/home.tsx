import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Alert, Modal, Linking, ScrollView, ActionSheetIOS, Platform } from 'react-native';
import { Container } from '../../src/components/ui';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { fetchMedications } from '../../src/store/slices/medicationsSlice';
import DoseRing from '../../src/components/DoseRing';
import { Card, Button } from '../../src/components/ui';
import { Medication, DoseSegment, IntakeStatus } from '../../src/types';
import { getDbInstance } from '../../src/services/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

// Helpers to align with medications folder style (mobile-first, simple data transforms)
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

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Paciente');
  const patientId = user?.id;

  const [modalVisible, setModalVisible] = useState(false);
  const [takingLoading, setTakingLoading] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  useEffect(() => {
    if (patientId) dispatch(fetchMedications(patientId));
  }, [patientId]);

  // Build dose ring segments from today's scheduled times (1-hour arcs)
  const doseSegments: DoseSegment[] = useMemo(() => {
    const todays = medications.filter(isScheduledToday);
    const segments: DoseSegment[] = [];
    todays.forEach((m) => {
      (m.times || []).forEach((t) => {
        const h = parseTimeToHour(t);
        if (h !== null) {
          segments.push({ startHour: Math.floor(h), endHour: Math.min(Math.floor(h) + 1, 24), status: 'PENDING' });
        }
      });
    });
    // Fallback: if no meds, show three evenly spaced pending segments for visual consistency
    if (!segments.length) {
      return [
        { startHour: 8, endHour: 9, status: 'PENDING' },
        { startHour: 13, endHour: 14, status: 'PENDING' },
        { startHour: 20, endHour: 21, status: 'PENDING' },
      ];
    }
    return segments;
  }, [medications]);

  // Compute upcoming medication card
  const upcoming = useMemo(() => {
    const candidates = medications
      .filter(isScheduledToday)
      .map((m) => ({ med: m, next: getNextTimeToday(m) }))
      .filter((x) => x.next !== null) as { med: Medication; next: number }[];
    candidates.sort((a, b) => a.next - b.next);
    return candidates.length ? candidates[0] : null;
  }, [medications]);

  const handleHistory = () => router.push('/patient/history');
  const handleEmergency = () => {
    handleEmergencyPress();
  };
  const callEmergency = (number: string) => {
    try {
      Linking.openURL(`tel:${number}`);
    } catch (e) {
      // noop; on web this may not work
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
          if (buttonIndex === 1) {
            callEmergency('911');
          } else if (buttonIndex === 2) {
            callEmergency('112');
          }
        }
      );
    } else {
      setModalVisible(true);
    }
  };
  const handleLogout = async () => {
    try {
      console.log('[PatientHome] Starting logout process...');
      await dispatch(logout());
      console.log('[PatientHome] Logout successful, redirecting to signup...');
      router.replace('/auth/signup');
    } catch (error) {
      console.error('[PatientHome] Logout error:', error);
      // Even if logout fails, try to redirect to signup
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
          if (buttonIndex === 1) {
            handleLogout();
          } else if (buttonIndex === 2) {
            handleConfiguraciones();
          } else if (buttonIndex === 3) {
            handleMiDispositivo();
          }
        }
      );
    } else {
      setAccountMenuVisible(!accountMenuVisible);
    }
  };

  const handleConfiguraciones = () => {
    // TODO: Navigate to settings page when implemented
    Alert.alert('Próximamente', 'La página de configuraciones estará disponible pronto.');
  };

  const handleMiDispositivo = () => {
    router.push('/patient/link-device');
  };

  const handleTakeUpcomingMedication = async () => {
    if (!upcoming || !patientId) {
      Alert.alert('Información faltante', 'No se encontró una dosis próxima o el usuario no está autenticado.');
      return;
    }
    try {
      setTakingLoading(true);
      const next = upcoming.next;
      const hh = Math.floor(next);
      const mm = Math.round((next - hh) * 60);
      const scheduledDate = new Date();
      scheduledDate.setHours(hh, mm, 0, 0);

      const db = await getDbInstance();
      if (db) {
        await addDoc(collection(db, 'intakeRecords'), {
          medicationName: upcoming.med.name,
          dosage: upcoming.med.dosage,
          scheduledTime: scheduledDate,
          status: IntakeStatus.TAKEN,
          patientId,
          takenAt: Timestamp.now(),
          // Optional linkage for future queries
          medicationId: upcoming.med.id,
        });
      }

      Alert.alert('Registrado', 'Se registró la toma de la medicación correctamente.');
    } catch (e) {
      console.error('Error writing intake record', e);
      Alert.alert('Error', 'No se pudo escribir el registro en la base de datos.');
    } finally {
      setTakingLoading(false);
    }
  };

  return (
    <Container className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
          <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          {/* Emergency icon-only button */}
          <Button
            variant="danger"
            size="sm"
            onPress={handleEmergency}
          >
            <Ionicons name="alert" size={20} color="#FFFFFF" />
          </Button>
          
          {/* Account button with action sheet */}
          <Button
            variant="secondary"
            size="sm"
            onPress={handleAccountMenu}
          >
            <Ionicons name="person" size={20} color="#374151" />
          </Button>
        </View>
      </View>

      {/* Emergency Modal (Android only) */}
      {Platform.OS !== 'ios' && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
              <View className="p-6">
                <Text className="text-2xl font-bold text-gray-900 mb-2">Emergencia</Text>
                <Text className="text-gray-600 mb-6 text-center">Selecciona una opción:</Text>
                <View className="gap-3">
                  <Button
                    variant="danger"
                    size="lg"
                    onPress={() => callEmergency('911')}
                  >
                    Llamar 911
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onPress={() => callEmergency('112')}
                  >
                    Llamar 112
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onPress={() => setModalVisible(false)}
                  >
                    Cancelar
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Today's schedule list */}
      <FlatList
        data={medications.filter(isScheduledToday)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {/* DoseRing section */}
            <View className="p-4">
              <Card>
                <Text className="text-lg font-bold mb-2">Estado del día</Text>
                <View className="items-center justify-center">
                  <DoseRing size={220} strokeWidth={18} segments={doseSegments} accessibilityLabel="Anillo de dosis del día" />
                </View>
              </Card>
            </View>

            {/* Upcoming medication */}
            <View className="px-4">
              <Card>
                <Text className="text-lg font-bold mb-2">Próxima dosis</Text>
                {upcoming ? (
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-base font-semibold text-gray-900">{upcoming.med.name}</Text>
                      <Text className="text-gray-600">{upcoming.med.dosage}</Text>
                      <Text className="text-gray-600">{formatHourDecimal(upcoming.next)}</Text>
                    </View>
                    <Button
                      variant="primary"
                      size="md"
                      onPress={handleTakeUpcomingMedication}
                      disabled={takingLoading}
                    >
                      {takingLoading ? 'Cargando...' : 'Tomar medicación'}
                    </Button>
                  </View>
                ) : (
                  <Text className="text-gray-500">No hay dosis próximas para hoy.</Text>
                )}
              </Card>
            </View>

            {/* History widget moved from header */}
            <View className="px-4 mt-2">
              <Card>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="time" size={22} color="#1C1C1E" />
                    <View>
                      <Text className="text-lg font-bold">Historial</Text>
                      <Text className="text-gray-600">Dosis y eventos anteriores</Text>
                    </View>
                  </View>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={handleHistory}
                  >
                    Abrir
                  </Button>
                </View>
              </Card>
            </View>

            <View className="px-4 mt-2">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold">Hoy</Text>
                <Link href="/patient/medications" asChild>
                  <Button
                    variant="primary"
                    size="md"
                  >
                    Mis Medicamentos
                  </Button>
                </Link>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <View className="px-4 mt-2">
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">{item.name}</Text>
                  <Text className="text-gray-600 mb-1">{item.dosage}</Text>
                  {(() => {
                    const next = getNextTimeToday(item);
                    return next !== null ? (
                      <Text className="text-gray-600">Próxima: {formatHourDecimal(next)}</Text>
                    ) : null;
                  })()}
                </View>
                <Link href={`/patient/medications/${item.id}`} asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                  >
                    Abrir
                  </Button>
                </Link>
              </View>
            </Card>
          </View>
        )}
      />
    </Container>
  );
}

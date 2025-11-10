import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, Linking, ScrollView, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { fetchMedications } from '../../src/store/slices/medicationsSlice';
import DoseRing from '../../src/components/DoseRing';
import { Medication, DoseSegment, IntakeStatus } from '../../src/types';
import { getDbInstance } from '../../src/services/firebase';
import { addDoc, collection } from 'firebase/firestore';

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
          takenAt: new Date(),
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
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Android dropdown menu */}
      {Platform.OS !== 'ios' && accountMenuVisible && (
        <>
          <TouchableOpacity
            className="absolute inset-0 z-40 bg-black/20"
            onPress={() => setAccountMenuVisible(false)}
            activeOpacity={1}
          />
          <View className="absolute right-4 top-16 bg-white rounded-2xl shadow-xl border border-gray-200 min-w-56 z-50 overflow-hidden">
            <TouchableOpacity
              className="px-4 py-4 border-b border-gray-100 flex-row items-center active:bg-gray-50"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#374151" />
              <Text className="ml-3 text-gray-700 font-medium text-base">Salir de sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-4 border-b border-gray-100 flex-row items-center active:bg-gray-50"
              onPress={handleConfiguraciones}
            >
              <Ionicons name="settings-outline" size={20} color="#374151" />
              <Text className="ml-3 text-gray-700 font-medium text-base">Configuraciones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-4 flex-row items-center active:bg-gray-50"
              onPress={handleMiDispositivo}
            >
              <Ionicons name="hardware-chip-outline" size={20} color="#374151" />
              <Text className="ml-3 text-gray-700 font-medium text-base">Mi dispositivo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
          <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          {/* Emergency icon-only button */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-red-500 items-center justify-center shadow-sm"
            onPress={handleEmergency}
            accessibilityLabel="Emergencia"
            accessibilityHint="Toca para ver opciones de emergencia"
          >
            <Ionicons name="alert" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Account button with action sheet */}
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center shadow-sm"
            onPress={handleAccountMenu}
            accessibilityLabel="Cuenta"
            accessibilityHint="Toca para ver opciones de cuenta"
          >
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
                  <TouchableOpacity
                    className="bg-red-600 rounded-xl px-4 py-4 items-center shadow-sm active:bg-red-700"
                    onPress={() => callEmergency('911')}
                  >
                    <Text className="text-white font-bold text-lg">Llamar 911</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-orange-500 rounded-xl px-4 py-4 items-center shadow-sm active:bg-orange-600"
                    onPress={() => callEmergency('112')}
                  >
                    <Text className="text-white font-bold text-lg">Llamar 112</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-gray-100 rounded-xl px-4 py-4 items-center active:bg-gray-200"
                    onPress={() => setModalVisible(false)}
                  >
                    <Text className="text-gray-800 font-semibold text-lg">Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Scrollable Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* DoseRing section */}
        <View className="p-4">
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-lg font-bold mb-2">Estado del día</Text>
          <View className="items-center justify-center">
            <DoseRing size={220} strokeWidth={18} segments={doseSegments} accessibilityLabel="Anillo de dosis del día" />
          </View>
        </View>
      </View>

      {/* Upcoming medication */}
      <View className="px-4">
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-lg font-bold mb-2">Próxima dosis</Text>
          {upcoming ? (
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-gray-900">{upcoming.med.name}</Text>
                <Text className="text-gray-600">{upcoming.med.dosage}</Text>
                <Text className="text-gray-600">{formatHourDecimal(upcoming.next)}</Text>
              </View>
              <TouchableOpacity
                className={`px-4 py-2 rounded-lg ${takingLoading ? 'bg-green-400' : 'bg-green-600'} items-center justify-center`}
                onPress={handleTakeUpcomingMedication}
                disabled={takingLoading}
              >
                <Text className="text-white font-bold">Tomar medicación</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-gray-500">No hay dosis próximas para hoy.</Text>
          )}
        </View>
      </View>

      {/* History widget moved from header */}
      <View className="px-4 mt-2">
        <View className="bg-white rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Ionicons name="time" size={22} color="#1C1C1E" />
              <View>
                <Text className="text-lg font-bold">Historial</Text>
                <Text className="text-gray-600">Dosis y eventos anteriores</Text>
              </View>
            </View>
            <TouchableOpacity className="px-3 py-2 rounded-lg bg-blue-500" onPress={handleHistory}>
              <Text className="text-white font-semibold">Abrir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Today's schedule list */}
      <View className="px-4 mt-2">
        <Card className="rounded-2xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Hoy</Text>
            <Link href="/patient/medications" asChild>
              <TouchableOpacity className="px-3 py-2 rounded-lg bg-blue-500">
                <Text className="text-white font-semibold">Mis Medicamentos</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {loading ? (
            <Text className="text-gray-600">Cargando...</Text>
          ) : (
            <View className="gap-3">
              {medications.filter(isScheduledToday).map((item) => (
                <View key={item.id} className="flex-row items-center justify-between">
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
                    <TouchableOpacity className="px-4 py-2 rounded-lg bg-gray-800 shadow-sm">
                      <Text className="text-white font-semibold">Abrir</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

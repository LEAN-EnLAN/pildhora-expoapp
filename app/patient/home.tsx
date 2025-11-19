import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, Linking, ActionSheetIOS, Platform, StyleSheet, Animated, TouchableOpacity, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { fetchMedications } from '../../src/store/slices/medicationsSlice';
import { startIntakesSubscription, stopIntakesSubscription } from '../../src/store/slices/intakesSlice';
import { Card, Button, Modal, LoadingSpinner, AnimatedListItem, AppIcon, BrandedLoadingScreen } from '../../src/components/ui';
import { UpcomingDoseCard } from '../../src/components/screens/patient/UpcomingDoseCard';
import { DeviceStatusCard } from '../../src/components/screens/patient/DeviceStatusCard';
import { MedicationListItem } from '../../src/components/screens/patient/MedicationListItem';
import { startDeviceListener, stopDeviceListener } from '../../src/store/slices/deviceSlice';
import { Medication, IntakeStatus } from '../../src/types';
import { getDbInstance, getRdbInstance } from '../../src/services/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, get as rdbGet } from 'firebase/database';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens';
import { PremiumAdherenceChart } from '../../src/components/shared/PremiumAdherenceChart';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Medication>);

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

  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [takingLoading, setTakingLoading] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;

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

  // Initialize and refresh device list
  const initDevice = useCallback(async () => {
    console.log('[Home] initDevice called, patientId:', patientId);
    try {
      if (!patientId) {
        console.log('[Home] No patientId, skipping device init');
        return;
      }
      const rdb = await getRdbInstance();
      if (!rdb) {
        console.log('[Home] RTDB not available');
        return;
      }

      // Get all linked devices for this user
      console.log('[Home] Fetching devices from users/${patientId}/devices');
      const snap = await rdbGet(ref(rdb, `users/${patientId}/devices`));
      const val = snap.val() || {};
      const deviceIds = Object.keys(val);

      console.log('[Home] Found linked devices:', deviceIds);
      console.log('[Home] Device data:', val);

      if (deviceIds.length === 0) {
        if (user?.deviceId) {
          console.log('[Home] No devices in RTDB, but user has deviceId in profile. Using that:', user.deviceId);
          setActiveDeviceId(user.deviceId);
          if (!deviceSlice?.listening) {
            dispatch(startDeviceListener(user.deviceId));
          }
        } else {
          console.log('[Home] No devices found, setting activeDeviceId to null');
          setActiveDeviceId(null);
          // Stop listening if we were listening to a device
          if (deviceSlice?.listening) {
            dispatch(stopDeviceListener());
          }
        }
        return;
      }

      // If only one device, use it
      if (deviceIds.length === 1) {
        console.log('[Home] Single device found:', deviceIds[0]);
        setActiveDeviceId(deviceIds[0]);
        if (!deviceSlice?.listening) {
          dispatch(startDeviceListener(deviceIds[0]));
        }
        return;
      }

      // If multiple devices, find the most recently active one
      const deviceStates = await Promise.all(
        deviceIds.map(async (id) => {
          try {
            const stateSnap = await rdbGet(ref(rdb, `devices/${id}/state`));
            const state = stateSnap.val() || {};
            return {
              id,
              isOnline: state.is_online || false,
              lastSeen: state.last_seen || 0,
            };
          } catch {
            return { id, isOnline: false, lastSeen: 0 };
          }
        })
      );

      // Prioritize: 1) Online devices, 2) Most recently seen
      const sortedDevices = deviceStates.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return b.lastSeen - a.lastSeen;
      });

      const selectedDevice = sortedDevices[0].id;
      console.log('[Home] Selected device from multiple:', selectedDevice);
      setActiveDeviceId(selectedDevice);

      if (!deviceSlice?.listening) {
        dispatch(startDeviceListener(selectedDevice));
      }
    } catch (error) {
      console.error('[Home] Error initializing device:', error);
    }
  }, [patientId, dispatch, deviceSlice?.listening]);

  // Initialize device on mount
  useEffect(() => {
    initDevice();

    return () => {
      if (deviceSlice?.listening) {
        dispatch(stopDeviceListener());
      }
    };
  }, [patientId, dispatch]);

  // Re-check devices when app comes to foreground (e.g., after linking a device)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[Home] App became active, refreshing devices');
        initDevice();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [initDevice]);

  // Refresh device list when screen comes into focus (e.g., navigating back from link-device page)
  useFocusEffect(
    useCallback(() => {
      console.log('[Home] Screen focused, refreshing devices');
      initDevice();
    }, [initDevice])
  );

  const adherenceData = useMemo(() => {
    const todaysMeds = medications.filter(isScheduledToday);
    if (todaysMeds.length === 0) return { takenCount: 0, totalCount: 0 };

    let totalDoses = 0;
    todaysMeds.forEach(med => {
      totalDoses += med.times.length;
    });

    if (totalDoses === 0) return { takenCount: 0, totalCount: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use unique dose identifiers to prevent counting duplicates
    const uniqueTaken = new Set<string>();
    intakes.forEach((intake) => {
      const intakeDate = new Date(intake.scheduledTime);
      if (intakeDate >= today && intake.status === IntakeStatus.TAKEN) {
        const medKey = intake.medicationId || intake.medicationName;
        // Create completion token: medicationId-scheduledTimeMs
        const scheduledMs = intakeDate.getTime();
        const completionToken = `${medKey}-${scheduledMs}`;
        uniqueTaken.add(completionToken);
      }
    });

    console.log('[Adherence] Today meds:', todaysMeds.length);
    console.log('[Adherence] Total doses:', totalDoses);
    console.log('[Adherence] Total intakes:', intakes.length);
    console.log('[Adherence] Unique doses taken today:', uniqueTaken.size);

    return { takenCount: uniqueTaken.size, totalCount: totalDoses };
  }, [medications, intakes]);

  const upcoming = useMemo(() => {
    const candidates = medications
      .filter(isScheduledToday)
      .map((m) => ({ med: m, next: getNextTimeToday(m) }))
      .filter((x) => x.next !== null) as { med: Medication; next: number }[];
    candidates.sort((a, b) => a.next - b.next);
    return candidates.length ? candidates[0] : null;
  }, [medications]);

  const upcomingCompletionStatus = useMemo(() => {
    if (!upcoming) return { isCompleted: false, completedAt: undefined };
    const next = upcoming.next;
    const hh = Math.floor(next);
    const mm = Math.round((next - hh) * 60);
    const scheduledDate = new Date();
    scheduledDate.setHours(hh, mm, 0, 0);
    const scheduledMs = scheduledDate.getTime();

    const completedIntake = intakes.find((intake) => {
      if (intake.status !== IntakeStatus.TAKEN) return false;
      const intakeMs = new Date(intake.scheduledTime).getTime();
      const timeDiff = Math.abs(intakeMs - scheduledMs);
      const matchesTime = timeDiff < 60000; // 1 minute tolerance
      const matchesMed = intake.medicationId
        ? intake.medicationId === upcoming.med.id
        : intake.medicationName === upcoming.med.name;
      return matchesTime && matchesMed;
    });

    if (completedIntake && completedIntake.takenAt) {
      return {
        isCompleted: true,
        completedAt: new Date(completedIntake.takenAt)
      };
    }

    return { isCompleted: false, completedAt: undefined };
  }, [upcoming, intakes]);

  const handleHistory = useCallback(() => {
    router.push('/patient/history');
  }, [router]);

  const callEmergency = useCallback((number: string) => {
    try {
      Linking.openURL(`tel:${number}`);
    } catch (e) {
      // noop
    }
    setEmergencyModalVisible(false);
  }, []);

  const handleEmergencyPress = useCallback(() => {
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
      setEmergencyModalVisible(true);
    }
  }, [callEmergency]);

  const handleEmergency = useCallback(() => {
    handleEmergencyPress();
  }, [handleEmergencyPress]);

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout());
      router.replace('/auth/signup');
    } catch (error) {
      router.replace('/auth/signup');
    }
  }, [dispatch, router]);

  const handleConfiguraciones = useCallback(() => {
    router.push('/patient/settings');
  }, [router]);

  const handleMiDispositivo = useCallback(() => {
    router.push('/patient/device-settings');
  }, [router]);



  const handleAccountMenu = useCallback(() => {
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
  }, [handleLogout, handleConfiguraciones, handleMiDispositivo, accountMenuVisible]);

  const handleTakeUpcomingMedication = useCallback(async () => {
    try {
      if (!upcoming) {
        Alert.alert('Sin dosis', 'No hay una dosis programada próxima para hoy.');
        return;
      }
      if (!patientId) {
        Alert.alert('Sesión requerida', 'Inicia sesión para registrar la toma.');
        return;
      }

      console.log('[TakeMedication] Starting...');
      console.log('[TakeMedication] Medication:', upcoming.med.name);
      console.log('[TakeMedication] Patient ID:', patientId);

      setTakingLoading(true);

      const hh = Math.floor(upcoming.next);
      const mm = Math.round((upcoming.next - hh) * 60);
      const scheduledDate = new Date();
      scheduledDate.setHours(hh, mm, 0, 0);

      // Check if dose has already been taken (duplicate prevention)
      if (upcoming.med.id) {
        const { canTakeDose } = await import('../../src/services/doseCompletionTracker');
        const checkResult = await canTakeDose(upcoming.med.id, scheduledDate);

        if (!checkResult.canTake) {
          console.log('[TakeMedication] Dose already taken:', checkResult.reason);
          Alert.alert('Dosis ya registrada', checkResult.reason || 'Esta dosis ya fue registrada.');
          setTakingLoading(false);
          return;
        }
      }

      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore no disponible');
      }

      const intakeData = {
        medicationName: upcoming.med.name,
        dosage: upcoming.med.dosage || '',
        scheduledTime: Timestamp.fromDate(scheduledDate),
        status: IntakeStatus.TAKEN,
        patientId,
        takenAt: Timestamp.now(),
        ...(upcoming.med.id ? { medicationId: upcoming.med.id } : {}),
        caregiverId: upcoming.med.caregiverId,
      };

      console.log('[TakeMedication] Writing intake record:', intakeData);

      const docRef = await addDoc(collection(db, 'intakeRecords'), intakeData as any);

      console.log('[TakeMedication] Successfully written with ID:', docRef.id);

      // Decrement inventory if tracking is enabled
      if (upcoming.med.id && upcoming.med.trackInventory) {
        try {
          const { inventoryService } = await import('../../src/services/inventoryService');
          const doseAmount = inventoryService.parseDoseAmount(upcoming.med);

          await inventoryService.decrementInventory(upcoming.med.id, doseAmount);

          // Check if inventory is now low
          const isLow = await inventoryService.checkLowQuantity(upcoming.med.id);

          if (isLow) {
            const status = await inventoryService.getInventoryStatus(upcoming.med.id);
            console.log('[TakeMedication] Low inventory detected:', status);

            // Show low inventory warning
            Alert.alert(
              'Inventario bajo',
              `Quedan ${status.currentQuantity} dosis de ${upcoming.med.name}. Considera reabastecer pronto.`,
              [{ text: 'Entendido' }]
            );
          }
        } catch (inventoryError) {
          // Log error but don't block the dose recording
          console.error('[TakeMedication] Error updating inventory:', inventoryError);
        }
      }

      Alert.alert('Registrado', 'Se registró la toma de la dosis.');
    } catch (e: any) {
      console.error('[TakeMedication] Error:', e);
      Alert.alert('Error', e?.message || 'No se pudo registrar la toma.');
    } finally {
      setTakingLoading(false);
    }
  }, [upcoming, patientId]);

  const deviceStatus = useMemo(() => {
    type DeviceStatusType = 'idle' | 'dispensing' | 'error' | 'offline' | 'pending';

    console.log('[Home] Computing deviceStatus:', {
      hasDeviceSlice: !!deviceSlice,
      hasState: !!deviceSlice?.state,
      activeDeviceId,
      state: deviceSlice?.state
    });

    if (!deviceSlice?.state) {
      console.log('[Home] No device state available, returning offline status');
      return {
        deviceId: activeDeviceId,
        batteryLevel: null,
        status: 'offline' as DeviceStatusType,
        isOnline: false,
      };
    }

    const rawStatus = deviceSlice.state.current_status;
    const isOnline = !!deviceSlice.state.is_online;

    let normalizedStatus: DeviceStatusType = 'offline';

    if (!isOnline) {
      normalizedStatus = 'offline';
    } else {
      switch (rawStatus) {
        case 'PENDING':
        case 'pending':
          normalizedStatus = 'pending';
          break;
        case 'dispensing':
        case 'DISPENSING':
          normalizedStatus = 'dispensing';
          break;
        case 'error':
        case 'ERROR':
        case 'ALARM_SOUNDING':
        case 'alarm_active':
          normalizedStatus = 'error';
          break;
        case 'idle':
        case 'IDLE':
        case 'DOSE_TAKEN':
        case 'DOSE_MISSED':
        default:
          normalizedStatus = 'idle';
          break;
      }
    }

    const result = {
      deviceId: activeDeviceId,
      batteryLevel: deviceSlice.state.battery_level,
      status: normalizedStatus,
      isOnline,
    };

    console.log('[Home] Device status computed:', result);
    return result;
  }, [deviceSlice, activeDeviceId]);

  const renderMedicationItem = useCallback(({ item, index }: { item: Medication; index: number }) => (
    <AnimatedListItem index={index} delay={50}>
      <View style={styles.medicationItem}>
        <MedicationListItem
          medicationName={item.name}
          dosage={item.dosage || ''}
          times={item.times || []}
          onPress={() => router.push(`/patient/medications/${item.id}`)}
        />
      </View>
    </AnimatedListItem>
  ), [router]);

  if (loading) {
    return <BrandedLoadingScreen message="Cargando información..." />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.brandingContainer}>
              <AppIcon size="sm" showShadow={false} rounded={true} />
              <Text style={styles.headerTitle}>PILDHORA</Text>
            </View>
            <Text style={styles.headerSubtitle}>Hola, {displayName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleEmergency}
              accessibilityLabel="Botón de emergencia"
              accessibilityHint="Llama a servicios de emergencia"
              accessibilityRole="button"
            >
              <Ionicons name="alert-circle" size={28} color={colors.error[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleAccountMenu}
              accessibilityLabel="Menú de cuenta"
              accessibilityHint="Abre opciones de cuenta y configuración"
              accessibilityRole="button"
            >
              <Ionicons name="person-circle-outline" size={28} color={colors.gray[700]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Modal */}
        {Platform.OS !== 'ios' && (
          <Modal
            visible={emergencyModalVisible}
            onClose={() => setEmergencyModalVisible(false)}
            title="Emergencia"
            size="sm"
            animationType="slide"
          >
            <Text style={styles.modalSubtitle}>Selecciona una opción:</Text>
            <View style={styles.modalActions}>
              <Button variant="danger" size="lg" fullWidth onPress={() => callEmergency('911')}>
                Llamar 911
              </Button>
              <Button variant="secondary" size="lg" fullWidth onPress={() => callEmergency('112')}>
                Llamar 112
              </Button>
              <Button variant="secondary" size="lg" fullWidth onPress={() => setEmergencyModalVisible(false)}>
                Cancelar
              </Button>
            </View>
          </Modal>
        )}

        {/* Account Menu Modal */}
        {Platform.OS !== 'ios' && (
          <Modal
            visible={accountMenuVisible}
            onClose={() => setAccountMenuVisible(false)}
            title="Cuenta"
            size="sm"
            animationType="slide"
          >
            <Text style={styles.modalSubtitle}>Selecciona una opción:</Text>
            <View style={styles.modalActions}>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onPress={() => {
                  setAccountMenuVisible(false);
                  handleLogout();
                }}
              >
                Salir de sesión
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => {
                  setAccountMenuVisible(false);
                  handleConfiguraciones();
                }}
              >
                Configuraciones
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => {
                  setAccountMenuVisible(false);
                  handleMiDispositivo();
                }}
              >
                Mi dispositivo
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => setAccountMenuVisible(false)}
              >
                Cancelar
              </Button>
            </View>
          </Modal>
        )}

        {/* Main Content */}
        <AnimatedFlatList
          data={medications.filter(isScheduledToday)}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={() => (
            <>


              {/* Upcoming Dose Card - Autonomous Mode (Manual) */}
              {upcoming && !deviceStatus.isOnline && (
                <View style={styles.section}>
                  <UpcomingDoseCard
                    medicationName={upcoming.med.name}
                    dosage={upcoming.med.dosage || ''}
                    scheduledTime={formatHourDecimal(upcoming.next)}
                    onTakeMedication={handleTakeUpcomingMedication}
                    loading={takingLoading}
                    isCompleted={upcomingCompletionStatus.isCompleted}
                    completedAt={upcomingCompletionStatus.completedAt}
                  />
                </View>
              )}

              {/* Upcoming Dose Card - Caregiving Mode (Automatic) */}
              {upcoming && deviceStatus.isOnline && (
                <View style={styles.section}>
                  <Card variant="elevated" padding="lg">
                    <View style={styles.upcomingHeader}>
                      <Ionicons name="time-outline" size={24} color={colors.primary[500]} />
                      <Text style={styles.cardTitle}>Próxima dosis</Text>
                    </View>
                    <View style={styles.upcomingContent}>
                      <View style={styles.upcomingInfo}>
                        <Text style={styles.upcomingMedName}>{upcoming.med.name}</Text>
                        <Text style={styles.upcomingMedInfo}>{upcoming.med.dosage}</Text>
                        <View style={styles.timeChip}>
                          <Ionicons name="alarm-outline" size={16} color={colors.primary[500]} />
                          <Text style={styles.timeChipText}>{formatHourDecimal(upcoming.next)}</Text>
                        </View>
                      </View>
                      <View style={styles.deviceBadge}>
                        <Ionicons name="hardware-chip-outline" size={16} color={colors.primary[500]} />
                        <Text style={styles.deviceBadgeText}>Automático</Text>
                      </View>
                    </View>
                  </Card>
                </View>
              )}

              {!upcoming && (
                <View style={styles.section}>
                  <Card variant="outlined" padding="lg">
                    <View style={styles.emptyUpcoming}>
                      <Ionicons name="checkmark-circle-outline" size={48} color={colors.success[500]} />
                      <Text style={styles.emptyUpcomingTitle}>¡Todo listo!</Text>
                      <Text style={styles.emptyUpcomingText}>
                        No hay más dosis programadas para hoy
                      </Text>
                    </View>
                  </Card>
                </View>
              )}

              {/* Device Status Card */}
              <View style={styles.section}>
                <DeviceStatusCard
                  deviceId={activeDeviceId || undefined}
                />
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => router.push('/patient/medications')}
                    accessibilityLabel="Ver medicamentos"
                    accessibilityHint="Muestra todos tus medicamentos"
                    accessibilityRole="button"
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="medkit" size={24} color={colors.primary[500]} />
                    </View>
                    <Text style={styles.quickActionTitle} numberOfLines={1}>Medicamentos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={handleHistory}
                    accessibilityLabel="Ver historial"
                    accessibilityHint="Muestra el historial de dosis y eventos"
                    accessibilityRole="button"
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="time-outline" size={24} color={colors.primary[500]} />
                    </View>
                    <Text style={styles.quickActionTitle} numberOfLines={1}>Historial</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => router.push('/patient/device-settings')}
                    accessibilityLabel="Dispositivo"
                    accessibilityHint="Gestiona tu dispositivo Pillbox"
                    accessibilityRole="button"
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="hardware-chip-outline" size={24} color={colors.primary[500]} />
                    </View>
                    <Text style={styles.quickActionTitle} numberOfLines={1}>Dispositivo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Adherence Chart (Complementary) */}
              <View style={styles.section}>
                <Card variant="elevated" padding="lg">
                  <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                    <PremiumAdherenceChart
                      taken={adherenceData.takenCount}
                      total={adherenceData.totalCount}
                      size={180}
                      strokeWidth={15}
                    />
                  </View>
                </Card>
              </View>

              {/* Today's Medications Header */}
              {medications.filter(isScheduledToday).length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Medicamentos de hoy</Text>
                    <Text style={styles.sectionCount}>
                      {medications.filter(isScheduledToday).length}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
          renderItem={renderMedicationItem}
          ListEmptyComponent={() => (
            <View style={styles.emptyMedicationsContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyMedicationsTitle}>Sin medicamentos hoy</Text>
              <Text style={styles.emptyMedicationsText}>
                No tienes medicamentos programados para hoy
              </Text>
              <Button
                variant="primary"
                size="md"
                onPress={() => router.push('/patient/medications')}
                style={styles.emptyMedicationsButton}
              >
                Ver todos los medicamentos
              </Button>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  headerLeft: {
    flex: 1,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary[500],
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  modalActions: {
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginLeft: spacing.sm,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  upcomingContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingMedName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  upcomingMedInfo: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  timeChipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  deviceBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  emptyUpcoming: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyUpcomingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyUpcomingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  sectionCount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  medicationItem: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  emptyMedicationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyMedicationsTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyMedicationsText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyMedicationsButton: {
    marginTop: spacing.md,
  },
});

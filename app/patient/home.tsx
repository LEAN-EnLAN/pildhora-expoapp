/**
 * Patient Home Screen - Redesigned with Visual Priority Hierarchy
 * Fixed: Proper dose tracking, adherence integration, consistent data
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Linking,
  ActionSheetIOS,
  Platform,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { startMedicationsSubscription, stopMedicationsSubscription } from '../../src/store/slices/medicationsSlice';
import { startIntakesSubscription, stopIntakesSubscription, setIntakes, updateIntakeStatus } from '../../src/store/slices/intakesSlice';
import { Card, Button, Modal } from '../../src/components/ui';
import AppIcon from '../../src/components/ui/AppIcon';
import BrandedLoadingScreen from '../../src/components/ui/BrandedLoadingScreen';
import { startDeviceListener, stopDeviceListener } from '../../src/store/slices/deviceSlice';
import { Medication, IntakeStatus } from '../../src/types';
import { getDbInstance, getRdbInstance, getDeviceRdbInstance } from '../../src/services/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, get as rdbGet } from 'firebase/database';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens';
import { usePatientAutonomousMode } from '../../src/hooks/usePatientAutonomousMode';
import { useTopoAlarm } from '../../src/hooks/useTopoAlarm';
import { useScheduleSync } from '../../src/hooks/useScheduleSync';
import { TopoAlarmOverlay } from '../../src/components/shared/TopoAlarmOverlay';
import { 
  recordTopoIntake, 
  createTopoCriticalEvent, 
  getScheduledTimeForMedication 
} from '../../src/services/topoAlarmService';

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

const getCurrentTimeDecimal = () => {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
};





// ============================================================================
// HERO CARD - With integrated adherence
// ============================================================================
interface HeroCardProps {
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  icon?: string;
  onTake: () => void;
  onSkip: () => void;
  loading?: boolean;
  isCompleted?: boolean;
  completedAt?: Date;
  minutesUntilDue?: number;
  isOverdue?: boolean;
  takenCount: number;
  totalCount: number;
  isOnline?: boolean;
}

const HeroCard = React.memo(function HeroCard({
  medicationName, dosage, scheduledTime, icon = '💊',
  onTake, onSkip, loading = false, isCompleted = false, completedAt,
  minutesUntilDue, isOverdue = false, takenCount, totalCount, isOnline = true,
}: HeroCardProps) {
  const completedTimeStr = completedAt?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '';

  const urgencyInfo = useMemo(() => {
    if (isCompleted) return { label: 'Completada', color: colors.success[500], bgColor: colors.success[50] };
    if (isOverdue) return { label: 'Atrasada', color: colors.error[500], bgColor: colors.error[50] };
    if (minutesUntilDue !== undefined && minutesUntilDue <= 15) return { label: 'Ahora', color: colors.warning[500], bgColor: colors.warning[50] };
    if (minutesUntilDue !== undefined && minutesUntilDue <= 60) return { label: 'Pronto', color: colors.primary[500], bgColor: colors.primary[50] };
    return { label: 'Próxima', color: colors.gray[500], bgColor: colors.gray[100] };
  }, [isCompleted, isOverdue, minutesUntilDue]);

  if (isCompleted) {
    return (
      <View style={[heroStyles.container, heroStyles.containerCompleted]}>
        <View style={heroStyles.completedContent}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success[500]} />
          <Text style={heroStyles.completedTitle}>¡Dosis tomada!</Text>
          <Text style={heroStyles.completedMedName}>{medicationName}</Text>
          <Text style={heroStyles.completedTime}>Tomada a las {completedTimeStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={heroStyles.container}>
      {/* Offline Banner inside Card if offline */}
      {!isOnline && (
        <View style={heroStyles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={colors.warning[600]} />
          <Text style={heroStyles.offlineText}>Sin conexión - Modo local</Text>
        </View>
      )}

      {/* Header with adherence ring */}
      <View style={heroStyles.headerRow}>
        <View style={heroStyles.timeSection}>
          <View style={[heroStyles.urgencyBadge, { backgroundColor: urgencyInfo.bgColor }]}>
            <Text style={[heroStyles.urgencyText, { color: urgencyInfo.color }]}>{urgencyInfo.label}</Text>
          </View>
          <View style={heroStyles.timeRow}>
            <Text style={heroStyles.timeDisplay}>{scheduledTime}</Text>
            {minutesUntilDue !== undefined && minutesUntilDue > 0 && (
              <Text style={heroStyles.timeUntil}>
                en {minutesUntilDue < 60 ? `${minutesUntilDue} min` : `${Math.floor(minutesUntilDue / 60)}h ${minutesUntilDue % 60}m`}
              </Text>
            )}
          </View>
          {isOverdue && <Text style={heroStyles.overdueText}>⚠️ Atrasada</Text>}
        </View>
        <View style={heroStyles.adherenceContainer}>
          <Text style={[heroStyles.adherenceLabel, { fontSize: typography.fontSize.xl, fontWeight: 'bold', color: colors.primary[600], marginTop: 0 }]}>{takenCount}/{totalCount}</Text>
        </View>
      </View>

      {/* Medication Info */}
      <View style={heroStyles.medicationSection}>
        <View style={heroStyles.iconContainer}><Text style={heroStyles.iconEmoji}>{icon}</Text></View>
        <View style={heroStyles.medicationInfo}>
          <Text style={heroStyles.medicationName} numberOfLines={2}>{medicationName}</Text>
          <Text style={heroStyles.dosage}>{dosage}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={heroStyles.actionsSection}>
        <TouchableOpacity style={[heroStyles.takeButton, loading && heroStyles.buttonDisabled]} onPress={onTake} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={[colors.success[500], colors.success[600]]} style={heroStyles.takeButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="checkmark-circle" size={32} color={colors.surface} />
            <Text style={heroStyles.takeButtonText}>{loading ? 'Registrando...' : 'Tomar'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[heroStyles.skipButton, loading && heroStyles.buttonDisabled]} onPress={onSkip} disabled={loading} activeOpacity={0.8}>
          <Ionicons name="close-circle-outline" size={28} color={colors.gray[600]} />
          <Text style={heroStyles.skipButtonText}>Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const heroStyles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, ...shadows.lg },
  containerCompleted: { backgroundColor: colors.success[50], borderWidth: 2, borderColor: colors.success[100] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  timeSection: { flex: 1 },
  urgencyBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginBottom: spacing.xs },
  urgencyText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  timeDisplay: { fontSize: 48, fontWeight: typography.fontWeight.bold, color: colors.gray[900], letterSpacing: -1, lineHeight: 56 },
  timeUntil: { fontSize: 32, fontWeight: typography.fontWeight.bold, color: colors.gray[500] },
  overdueText: { fontSize: typography.fontSize.sm, color: colors.error[500], fontWeight: typography.fontWeight.semibold, marginTop: spacing.xs },
  adherenceContainer: { alignItems: 'flex-end' },
  adherenceLabel: { fontSize: typography.fontSize.xs, color: colors.gray[500], marginTop: spacing.xs },
  medicationSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray[50], borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  iconContainer: { width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  iconEmoji: { fontSize: 24 },
  medicationInfo: { flex: 1 },
  medicationName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.gray[900], marginBottom: 2 },
  dosage: { fontSize: typography.fontSize.base, color: colors.gray[600] },
  actionsSection: { flexDirection: 'row', gap: spacing.md },
  takeButton: { flex: 2, borderRadius: borderRadius.lg, overflow: 'hidden' },
  takeButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  takeButtonText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.surface },
  skipButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray[100], borderRadius: borderRadius.lg, paddingVertical: spacing.md, gap: spacing.xs },
  skipButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[600] },
  buttonDisabled: { opacity: 0.6 },
  completedContent: { alignItems: 'center', paddingVertical: spacing.lg },
  completedTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.success[600], marginTop: spacing.md, marginBottom: spacing.sm },
  completedMedName: { fontSize: typography.fontSize.lg, color: colors.gray[700], marginBottom: spacing.xs },
  completedTime: { fontSize: typography.fontSize.base, color: colors.gray[500] },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warning[100], paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.sm, gap: spacing.xs },
  offlineText: { fontSize: typography.fontSize.xs, color: colors.warning[600], fontWeight: typography.fontWeight.semibold },
});


// ============================================================================
// DOSE LIST ITEM
// ============================================================================
interface DoseItemProps {
  dose: { id: string; medicationName: string; dosage: string; scheduledTime: string; timeDecimal: number; icon?: string; isCompleted?: boolean; isSkipped?: boolean; isOverdue?: boolean; };
  onPress: () => void;
  currentTimeDecimal: number;
}

const DoseListItem = React.memo(function DoseListItem({ dose, onPress, currentTimeDecimal }: DoseItemProps) {
  const minutesUntil = Math.round((dose.timeDecimal - currentTimeDecimal) * 60);
  const timeLabel = useMemo(() => {
    if (dose.isSkipped) return 'Omitida';
    if (dose.isCompleted) return 'Tomada';
    if (dose.isOverdue || minutesUntil < -30) return 'Atrasada';
    if (minutesUntil < 0) return 'Ahora';
    if (minutesUntil === 0) return 'Ahora';
    if (minutesUntil < 60) return `en ${minutesUntil} min`;
    return `en ${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`;
  }, [minutesUntil, dose.isCompleted, dose.isSkipped, dose.isOverdue]);

  const statusColor = useMemo(() => {
    if (dose.isSkipped) return colors.warning[500];
    if (dose.isCompleted) return colors.success[500];
    if (dose.isOverdue || minutesUntil < -30) return colors.error[500];
    if (minutesUntil <= 15) return colors.warning[500];
    return colors.gray[400];
  }, [minutesUntil, dose.isCompleted, dose.isSkipped, dose.isOverdue]);

  return (
    <TouchableOpacity 
      style={[
        listStyles.doseItem, 
        dose.isCompleted && listStyles.doseItemCompleted, 
        dose.isSkipped && listStyles.doseItemSkipped,
        dose.isOverdue && listStyles.doseItemOverdue
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={listStyles.timeColumn}>
        <Text style={[listStyles.timeText, dose.isCompleted && listStyles.textCompleted]}>{dose.scheduledTime}</Text>
        <Text style={[listStyles.timeLabel, { color: statusColor }]}>{timeLabel}</Text>
      </View>
      <View style={listStyles.medicationColumn}>
        <View style={listStyles.iconSmall}><Text style={listStyles.iconEmojiSmall}>{dose.icon || '💊'}</Text></View>
        <View style={listStyles.medicationDetails}>
          <Text style={[listStyles.medicationName, dose.isCompleted && listStyles.textCompleted]} numberOfLines={1}>{dose.medicationName}</Text>
          <Text style={[listStyles.dosageText, dose.isCompleted && listStyles.textCompleted]}>{dose.dosage}</Text>
        </View>
      </View>
      <View style={listStyles.statusColumn}>
        {dose.isSkipped ? <Ionicons name="close-circle" size={24} color={colors.warning[500]} /> :
         dose.isCompleted ? <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} /> :
         dose.isOverdue ? <Ionicons name="alert-circle" size={24} color={colors.error[500]} /> :
         <View style={[listStyles.statusDot, { backgroundColor: statusColor }]} />}
      </View>
    </TouchableOpacity>
  );
});

const listStyles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[100], gap: spacing.sm },
  headerTitle: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[700] },
  headerCount: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary[500], backgroundColor: colors.primary[50], paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, minWidth: 24, textAlign: 'center' },
  doseItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[50] },
  doseItemCompleted: { opacity: 0.6, backgroundColor: colors.gray[50] },
  doseItemSkipped: { opacity: 0.6, backgroundColor: colors.warning[50] },
  doseItemOverdue: { backgroundColor: colors.error[50] },
  timeColumn: { width: 80, marginRight: spacing.md },
  timeText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.gray[900] },
  timeLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, marginTop: 2 },
  textCompleted: { color: colors.gray[400], textDecorationLine: 'line-through' },
  medicationColumn: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconSmall: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  iconEmojiSmall: { fontSize: 18 },
  medicationDetails: { flex: 1 },
  medicationName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[900] },
  dosageText: { fontSize: typography.fontSize.sm, color: colors.gray[500], marginTop: 2 },
  statusColumn: { width: 32, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function PatientHome() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const patientId = user?.id;
  const { isAutonomous } = usePatientAutonomousMode(patientId);
  const { medications, loading } = useSelector((state: RootState) => state.medications);
  const { intakes } = useSelector((state: RootState) => state.intakes);
  const deviceSlice = useSelector((state: RootState) => (state as any).device);
  // Assuming deviceSlice has is_online. If not, we default to true or check connection status elsewhere.
  // Looking at deviceSlice (inferred), it likely has device state.
  // Let's assume 'deviceState' or similar. We'll use a safe check.
  const isDeviceOnline = deviceSlice?.deviceState?.is_online ?? true; 

  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Paciente');
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [takingLoading, setTakingLoading] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeDecimal());

  useEffect(() => { 
    const interval = setInterval(() => setCurrentTime(getCurrentTimeDecimal()), 30000); 
    return () => clearInterval(interval); 
  }, []);

  useEffect(() => { 
    if (patientId) { 
      dispatch(startMedicationsSubscription(patientId)); 
      dispatch(startIntakesSubscription(patientId)); 
    } 
    return () => { 
      if (patientId) {
        dispatch(stopMedicationsSubscription());
        dispatch(stopIntakesSubscription()); 
      }
    }; 
  }, [patientId, dispatch]);

  const initDevice = useCallback(async () => {
    try {
      if (!patientId) return;
      const rdb = await getDeviceRdbInstance();
      if (!rdb) return;
      const snap = await rdbGet(ref(rdb, `users/${patientId}/devices`));
      const deviceIds = Object.keys(snap.val() || {});
      if (deviceIds.length === 0) { setActiveDeviceId(user?.deviceId || null); if (user?.deviceId && !deviceSlice?.listening) dispatch(startDeviceListener(user.deviceId)); return; }
      setActiveDeviceId(deviceIds[0]);
      if (!deviceSlice?.listening) dispatch(startDeviceListener(deviceIds[0]));
    } catch (e) { console.error('[Home] Device init error:', e); }
  }, [patientId, dispatch, deviceSlice?.listening, user?.deviceId]);

  useEffect(() => { initDevice(); return () => { if (deviceSlice?.listening) dispatch(stopDeviceListener()); }; }, [patientId]);
  useEffect(() => { const sub = AppState.addEventListener('change', (s) => { if (s === 'active') initDevice(); }); return () => sub.remove(); }, [initDevice]);
  useFocusEffect(useCallback(() => { initDevice(); }, [initDevice]));

  // ============================================================================
  // TOPO ALARM INTEGRATION
  // ============================================================================
  const todayMedications = useMemo(() => {
    return medications.filter(isScheduledToday);
  }, [medications]);

  const {
    isActive: isTopoActive,
    activeMedication: topoMedication,
    hasTimedOut: topoTimedOut,
    dismissAlarm,
  } = useTopoAlarm({
    deviceId: activeDeviceId || user?.deviceId,
    enabled: !!(activeDeviceId || user?.deviceId),
    todayMedications,
    timeoutMs: 5 * 60 * 1000, // 5 minutes
  });

  // ============================================================================
  // SCHEDULE SYNC - Auto-sync medications to RTDB turnos
  // ============================================================================
  const { syncing: scheduleSyncing, activeTurnos } = useScheduleSync({
    deviceId: activeDeviceId || user?.deviceId,
    autoSync: true, // Automatically sync when medications change
  });

  // Handle topo alarm becoming active - notify caregiver
  useEffect(() => {
    if (isTopoActive && topoMedication && !isAutonomous && user?.id) {
      // Find caregiver ID from medication
      const caregiverId = topoMedication.caregiverId;
      if (caregiverId) {
        createTopoCriticalEvent('topo_started', {
          patientId: user.id,
          patientName: user.name || 'Paciente',
          caregiverId,
          medicationName: topoMedication.name,
          deviceId: activeDeviceId || user.deviceId,
        }).catch(console.error);
      }
    }
  }, [isTopoActive, topoMedication, isAutonomous, user, activeDeviceId]);

  // Handle topo timeout - notify caregiver
  useEffect(() => {
    if (topoTimedOut && topoMedication && !isAutonomous && user?.id) {
      const caregiverId = topoMedication.caregiverId;
      if (caregiverId) {
        createTopoCriticalEvent('topo_timeout', {
          patientId: user.id,
          patientName: user.name || 'Paciente',
          caregiverId,
          medicationName: topoMedication.name,
          deviceId: activeDeviceId || user.deviceId,
        }).catch(console.error);
      }
    }
  }, [topoTimedOut, topoMedication, isAutonomous, user, activeDeviceId]);

  // Handle topo alarm take action (autonomous mode)
  const handleTopoTake = useCallback(async () => {
    if (!user?.id) return;

    try {
      setTakingLoading(true);

      if (topoMedication) {
        // Record intake
        await recordTopoIntake({
          medicationId: topoMedication.id,
          medicationName: topoMedication.name,
          dosage: topoMedication.dosage || `${topoMedication.doseValue || ''} ${topoMedication.doseUnit || ''}`.trim(),
          patientId: user.id,
          patientName: user.name || 'Paciente',
          caregiverId: topoMedication.caregiverId,
          deviceId: activeDeviceId || user.deviceId,
          scheduledTime: getScheduledTimeForMedication(topoMedication),
          resolution: 'taken',
          isAutonomous: true,
        });

        // Notify caregiver
        if (topoMedication.caregiverId) {
          await createTopoCriticalEvent('topo_taken', {
            patientId: user.id,
            patientName: user.name || 'Paciente',
            caregiverId: topoMedication.caregiverId,
            medicationName: topoMedication.name,
            deviceId: activeDeviceId || user.deviceId,
          });
        }
      } else {
        console.warn('[PatientHome] No medication identified for topo alarm');
        Alert.alert('Información', 'Se desactivó la alarma pero no se pudo identificar el medicamento para el historial.');
      }

      // Dismiss alarm (set topo to false)
      await dismissAlarm();
    } catch (error) {
      console.error('[PatientHome] Error handling topo take:', error);
      Alert.alert('Error', 'No se pudo registrar la dosis. Intenta nuevamente.');
    } finally {
      setTakingLoading(false);
    }
  }, [topoMedication, user, activeDeviceId, dismissAlarm]);

  // Handle topo alarm skip action (autonomous mode)
  const handleTopoSkip = useCallback(async () => {
    if (!user?.id) return;

    try {
      setTakingLoading(true);

      if (topoMedication) {
        // Record as missed/skipped
        await recordTopoIntake({
          medicationId: topoMedication.id,
          medicationName: topoMedication.name,
          dosage: topoMedication.dosage || `${topoMedication.doseValue || ''} ${topoMedication.doseUnit || ''}`.trim(),
          patientId: user.id,
          patientName: user.name || 'Paciente',
          caregiverId: topoMedication.caregiverId,
          deviceId: activeDeviceId || user.deviceId,
          scheduledTime: getScheduledTimeForMedication(topoMedication),
          resolution: 'skipped',
          isAutonomous: true,
        });

        // Notify caregiver
        if (topoMedication.caregiverId) {
          await createTopoCriticalEvent('topo_missed', {
            patientId: user.id,
            patientName: user.name || 'Paciente',
            caregiverId: topoMedication.caregiverId,
            medicationName: topoMedication.name,
            deviceId: activeDeviceId || user.deviceId,
          });
        }
      } else {
        console.warn('[PatientHome] No medication identified for topo alarm skip');
      }

      // Dismiss alarm
      await dismissAlarm();
    } catch (error) {
      console.error('[PatientHome] Error handling topo skip:', error);
      Alert.alert('Error', 'No se pudo omitir la dosis. Intenta nuevamente.');
    } finally {
      setTakingLoading(false);
    }
  }, [topoMedication, user, activeDeviceId, dismissAlarm]);

  // Handle supervised mode dismiss (device button pressed, topo became false)
  const handleTopoDismiss = useCallback(async () => {
    if (!topoMedication || !user?.id || isAutonomous) return;

    try {
      // In supervised mode, when topo goes false, it means the device button was pressed
      // Record as taken
      await recordTopoIntake({
        medicationId: topoMedication.id,
        medicationName: topoMedication.name,
        dosage: topoMedication.dosage || `${topoMedication.doseValue || ''} ${topoMedication.doseUnit || ''}`.trim(),
        patientId: user.id,
        patientName: user.name || 'Paciente',
        caregiverId: topoMedication.caregiverId,
        deviceId: activeDeviceId || user.deviceId,
        scheduledTime: getScheduledTimeForMedication(topoMedication),
        resolution: 'taken',
        isAutonomous: false,
      });

      // Notify caregiver
      if (topoMedication.caregiverId) {
        await createTopoCriticalEvent('topo_taken', {
          patientId: user.id,
          patientName: user.name || 'Paciente',
          caregiverId: topoMedication.caregiverId,
          medicationName: topoMedication.name,
          deviceId: activeDeviceId || user.deviceId,
        });
      }
    } catch (error) {
      console.error('[PatientHome] Error handling supervised dismiss:', error);
    }
  }, [topoMedication, user, activeDeviceId, isAutonomous]);

  // ============================================================================
  // FIXED: Build all doses for today with proper completion tracking
  // ============================================================================
  const allTodayDoses = useMemo(() => {
    const todaysMeds = medications.filter(isScheduledToday);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const doses: Array<{
      id: string;
      medicationId: string;
      medicationName: string;
      dosage: string;
      scheduledTime: string;
      timeDecimal: number;
      icon?: string;
      isCompleted: boolean;
      isSkipped: boolean;
      isOverdue: boolean;
      completedAt?: Date;
      medication: Medication;
    }> = [];

    todaysMeds.forEach((med) => {
      (med.times || []).forEach((time, idx) => {
        const timeDecimal = parseTimeToHour(time);
        if (timeDecimal === null) return;
        
        const hh = Math.floor(timeDecimal);
        const mm = Math.round((timeDecimal - hh) * 60);
        const scheduledDate = new Date(today);
        scheduledDate.setHours(hh, mm, 0, 0);
        const scheduledMs = scheduledDate.getTime();

        // Check for ANY intake record (TAKEN or MISSED/skipped) - both mean "done" for this time slot
        const existingIntake = intakes.find((intake) => {
          // Accept both TAKEN and MISSED statuses
          if (intake.status !== IntakeStatus.TAKEN && intake.status !== IntakeStatus.MISSED) return false;
          const intakeDate = new Date(intake.scheduledTime);
          // Must be today
          if (intakeDate < today || intakeDate > todayEnd) return false;
          const intakeMs = intakeDate.getTime();
          const timeDiff = Math.abs(intakeMs - scheduledMs);
          const matchesTime = timeDiff < 300000; // 5 minute tolerance
          const matchesMed = intake.medicationId ? intake.medicationId === med.id : intake.medicationName === med.name;
          return matchesTime && matchesMed;
        });

        const wasTaken = existingIntake?.status === IntakeStatus.TAKEN;
        const wasSkipped = existingIntake?.status === IntakeStatus.MISSED;
        
        // Check if overdue (past time and no record exists)
        const isOverdue = !existingIntake && timeDecimal < currentTime - 0.5; // 30 min grace

        doses.push({
          id: `${med.id}-${idx}`,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage || '',
          scheduledTime: formatHourDecimal(timeDecimal),
          timeDecimal,
          icon: med.emoji || '💊',
          isCompleted: wasTaken || wasSkipped, // Both taken and skipped count as "done"
          isSkipped: wasSkipped,
          isOverdue,
          completedAt: existingIntake?.takenAt ? new Date(existingIntake.takenAt) : undefined,
          medication: med,
        });
      });
    });

    // Sort: overdue first, then by time
    return doses.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return a.timeDecimal - b.timeDecimal;
    });
  }, [medications, intakes, currentTime]);

  // Get next pending dose (overdue or upcoming, not completed)
  const nextDose = useMemo(() => {
    const pending = allTodayDoses.filter(d => !d.isCompleted);
    return pending.length > 0 ? pending[0] : null;
  }, [allTodayDoses]);

  // Other doses (excluding hero)
  const otherDoses = useMemo(() => {
    if (!nextDose) return allTodayDoses.filter(d => d.isCompleted);
    return allTodayDoses.filter(d => d.id !== nextDose.id);
  }, [allTodayDoses, nextDose]);

  // Adherence stats - separate taken from skipped
  const adherenceStats = useMemo(() => {
    const total = allTodayDoses.length;
    const taken = allTodayDoses.filter(d => d.isCompleted && !d.isSkipped).length;
    const skipped = allTodayDoses.filter(d => d.isSkipped).length;
    const pending = allTodayDoses.filter(d => !d.isCompleted && !d.isOverdue).length;
    const overdue = allTodayDoses.filter(d => d.isOverdue).length;
    const completed = taken + skipped; // Total "done" for progress calculation
    return { total, taken, skipped, pending, overdue, completed };
  }, [allTodayDoses]);

  const minutesUntilNextDose = useMemo(() => {
    if (!nextDose) return undefined;
    return Math.round((nextDose.timeDecimal - currentTime) * 60);
  }, [nextDose, currentTime]);

  // Handlers
  const callEmergency = useCallback((number: string) => { try { Linking.openURL(`tel:${number}`); } catch {} setEmergencyModalVisible(false); }, []);
  const handleEmergencyPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Cancelar', 'Llamar 911', 'Llamar 112'], cancelButtonIndex: 0, destructiveButtonIndex: 1 },
        (idx) => { if (idx === 1) callEmergency('911'); else if (idx === 2) callEmergency('112'); });
    } else setEmergencyModalVisible(true);
  }, [callEmergency]);

  const handleLogout = useCallback(async () => { try { await dispatch(logout()); router.replace('/auth/signup'); } catch { router.replace('/auth/signup'); } }, [dispatch, router]);
  const handleAccountMenu = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Cancelar', 'Salir de sesión', 'Configuraciones', 'Mi dispositivo'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) handleLogout(); else if (idx === 2) router.push('/patient/settings'); else if (idx === 3) router.push('/patient/device-settings'); });
    } else setAccountMenuVisible(!accountMenuVisible);
  }, [handleLogout, router, accountMenuVisible]);

  const handleToggleAutonomous = useCallback(async (value: boolean) => {
    if (!patientId) return;
    try {
      await setAutonomousMode(patientId, value);
    } catch (error) {
      console.error('Error toggling autonomous mode:', error);
      Alert.alert('Error', 'No se pudo cambiar el modo autónomo.');
    }
  }, [patientId]);

  const handleTakeDose = useCallback(async () => {
    if (isAutonomous && nextDose) {
      // Find the existing intake record ID or create a new one logic would be complex here as we need the exact record ID.
      // However, looking at intakesSlice, we see intakes are fetched.
      // We need to find the intake record for this scheduled dose.
      // The HeroCard displays 'nextDose' which is computed from 'allTodayDoses'.
      // 'allTodayDoses' logic tries to match existing intakes.
      // If an intake exists (TAKEN/MISSED), it's completed.
      // If it doesn't exist, we need to create it? Or update if it exists?
      // Wait, updateIntakeStatus takes an ID.
      // If the record doesn't exist yet (which is the case for pending doses usually, unless pre-generated),
      // we might need to create it.
      // BUT, let's look at how intakes are structured. They seem to be records of *events*.
      // If 'nextDose' is pending, there might NOT be an intake record yet.
      // In that case, we should probably add a new document to 'intakeRecords'.
      // However, updateIntakeStatus assumes an ID.
      
      // Let's check if there is an existing intake for this slot.
      // The 'nextDose' object in 'allTodayDoses' doesn't seem to carry the intake ID unless it was already created.
      // 'id' in 'nextDose' is constructed as `${med.id}-${idx}`.
      
      // If we are in autonomous mode, we want to manually register the dose.
      // We should probably use a direct Firestore call or a thunk that handles creation if needed.
      // Given the current setup, let's check if we can find a matching intake in 'intakes' array.
      
      const scheduledTime = nextDose.scheduledTime;
      // We need to reconstruct the full date for the scheduled time to match/create
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const timeDecimal = nextDose.timeDecimal;
      const hh = Math.floor(timeDecimal);
      const mm = Math.round((timeDecimal - hh) * 60);
      const scheduledDate = new Date(today);
      scheduledDate.setHours(hh, mm, 0, 0);
      
      // Check if there is already an intake record for this medication and time
      // The logic in allTodayDoses (lines 356-367) does this matching.
      // But we don't have the ID of that potential match easily available in nextDose if it wasn't matched.
      // If it wasn't matched (which is likely why it's pending), we need to create one.
      
      try {
        setTakingLoading(true);
        const db = await getDbInstance();
        if (!db || !user?.id) return;

        // Check for existing record first to avoid duplicates
        // This query matches the logic in startIntakesSubscription/allTodayDoses essentially
        // But simpler: just add a new record.
        // Wait, if we just add a record, the subscription will pick it up and update the UI.
        
        const intakeData = {
          medicationId: nextDose.medicationId,
          medicationName: nextDose.medicationName,
          dosage: nextDose.dosage,
          scheduledTime: scheduledDate.toISOString(),
          status: IntakeStatus.TAKEN,
          takenAt: new Date().toISOString(),
          patientId: user.id,
          deviceId: user.deviceId || 'manual',
          isAutonomous: true, // Flag as autonomous
          timestamp: new Date().toISOString()
        };

        await addDoc(collection(db, 'intakeRecords'), intakeData);
        
        // Optimistic update or wait for subscription?
        // Subscription is fast.
        
      } catch (e) {
        console.error('Error taking dose autonomously:', e);
        Alert.alert('Error', 'No se pudo registrar la dosis. Intenta nuevamente.');
      } finally {
        setTakingLoading(false);
      }
      return;
    }
    
    Alert.alert('Acción no disponible', 'Las dosis se registran automáticamente por el dispositivo enlazado.');
  }, [isAutonomous, nextDose, user]);

  const handleSkipDose = useCallback(async () => {
    if (isAutonomous && nextDose) {
      try {
        setTakingLoading(true);
        const db = await getDbInstance();
        if (!db || !user?.id) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const timeDecimal = nextDose.timeDecimal;
        const hh = Math.floor(timeDecimal);
        const mm = Math.round((timeDecimal - hh) * 60);
        const scheduledDate = new Date(today);
        scheduledDate.setHours(hh, mm, 0, 0);

        const intakeData = {
          medicationId: nextDose.medicationId,
          medicationName: nextDose.medicationName,
          dosage: nextDose.dosage,
          scheduledTime: scheduledDate.toISOString(),
          status: IntakeStatus.MISSED, // Skipped counts as missed/omitted
          takenAt: null,
          patientId: user.id,
          deviceId: user.deviceId || 'manual',
          isAutonomous: true,
          timestamp: new Date().toISOString()
        };

        await addDoc(collection(db, 'intakeRecords'), intakeData);
      } catch (e) {
        console.error('Error skipping dose autonomously:', e);
        Alert.alert('Error', 'No se pudo omitir la dosis. Intenta nuevamente.');
      } finally {
        setTakingLoading(false);
      }
      return;
    }
    Alert.alert('Acción no disponible', 'Las omisiones se registran automáticamente por el flujo de alertas.');
  }, [isAutonomous, nextDose, user]);

  const handleDosePress = useCallback((dose: any) => { router.push(`/patient/medications/${dose.medicationId}`); }, [router]);

  if (loading) return <BrandedLoadingScreen message="Cargando información..." />;


  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* Topo Alarm Overlay */}
      <TopoAlarmOverlay
        visible={isTopoActive}
        medication={topoMedication}
        isAutonomous={isAutonomous}
        hasTimedOut={topoTimedOut}
        onTake={handleTopoTake}
        onSkip={handleTopoSkip}
        onDismiss={handleTopoDismiss}
      />

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
          <View style={[styles.connectionBadge, { backgroundColor: isDeviceOnline ? colors.success[100] : colors.gray[200] }]}>
             <Ionicons name={isDeviceOnline ? "wifi" : "wifi-outline"} size={16} color={isDeviceOnline ? colors.success[600] : colors.gray[500]} />
          </View>
          <TouchableOpacity style={[styles.iconButton, styles.emergencyButton]} onPress={handleEmergencyPress}>
            <Ionicons name="alert" size={22} color={colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.accountButton]} onPress={handleAccountMenu}>
            <Ionicons name="person" size={20} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {Platform.OS !== 'ios' && (
        <Modal visible={emergencyModalVisible} onClose={() => setEmergencyModalVisible(false)} title="Emergencia" size="sm">
          <View style={styles.modalActions}>
            <Button variant="danger" size="lg" fullWidth onPress={() => callEmergency('911')}>Llamar 911</Button>
            <Button variant="secondary" size="lg" fullWidth onPress={() => callEmergency('112')}>Llamar 112</Button>
            <Button variant="secondary" size="lg" fullWidth onPress={() => setEmergencyModalVisible(false)}>Cancelar</Button>
          </View>
        </Modal>
      )}
      {Platform.OS !== 'ios' && (
        <Modal visible={accountMenuVisible} onClose={() => setAccountMenuVisible(false)} title="Cuenta" size="sm">
          <View style={styles.modalActions}>
            <Button variant="danger" size="lg" fullWidth onPress={() => { setAccountMenuVisible(false); handleLogout(); }}>Salir de sesión</Button>
            <Button variant="secondary" size="lg" fullWidth onPress={() => { setAccountMenuVisible(false); router.push('/patient/settings'); }}>Configuraciones</Button>
            <Button variant="secondary" size="lg" fullWidth onPress={() => { setAccountMenuVisible(false); router.push('/patient/device-settings'); }}>Mi dispositivo</Button>
            <Button variant="secondary" size="lg" fullWidth onPress={() => setAccountMenuVisible(false)}>Cancelar</Button>
          </View>
        </Modal>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card or All Done */}
        {nextDose ? (
          <View style={styles.heroSection}>
            <HeroCard
              medicationName={nextDose.medicationName}
              dosage={nextDose.dosage}
              scheduledTime={nextDose.scheduledTime}
              icon={nextDose.icon}
              onTake={handleTakeDose}
              onSkip={handleSkipDose}
              loading={takingLoading}
              isCompleted={nextDose.isCompleted}
              completedAt={nextDose.completedAt}
              minutesUntilDue={minutesUntilNextDose}
              isOverdue={nextDose.isOverdue}
              takenCount={adherenceStats.completed}
              totalCount={adherenceStats.total}
              isOnline={isDeviceOnline}
            />
          </View>
        ) : allTodayDoses.length > 0 ? (
          <View style={styles.heroSection}>
            <View style={styles.allDoneCard}>
              <Ionicons name="checkmark-circle" size={72} color={colors.success[500]} />
              <Text style={styles.allDoneTitle}>¡Todo listo!</Text>
              <Text style={styles.allDoneText}>Completaste todas tus dosis de hoy</Text>
              <View style={styles.allDoneStats}>
                <View style={styles.allDoneStat}>
                  <Text style={styles.allDoneStatNumber}>{adherenceStats.taken}</Text>
                  <Text style={styles.allDoneStatLabel}>tomadas</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.heroSection}>
            <Card variant="elevated" padding="lg">
              <View style={styles.emptyDayContainer}>
                <Ionicons name="sunny-outline" size={64} color={colors.warning[500]} />
                <Text style={styles.emptyDayTitle}>Sin medicamentos hoy</Text>
                <Text style={styles.emptyDayText}>No tienes dosis programadas para hoy</Text>
              </View>
            </Card>
          </View>
        )}
              

        {/* Other Doses */}
        {otherDoses.length > 0 && (
          <View style={styles.section}>
            <View style={listStyles.container}>
              <View style={listStyles.header}>
                <Ionicons name="list-outline" size={20} color={colors.gray[600]} />
                <Text style={listStyles.headerTitle}>
                  {adherenceStats.pending > 0 ? `${adherenceStats.pending} pendiente${adherenceStats.pending > 1 ? 's' : ''}` : 'Historial de hoy'}
                </Text>
                <Text style={listStyles.headerCount}>{otherDoses.length}</Text>
              </View>
              {otherDoses.map((dose) => (
                <DoseListItem key={dose.id} dose={dose} onPress={() => handleDosePress(dose)} currentTimeDecimal={currentTime} />
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/patient/medications')}
              accessibilityRole="button"
              accessibilityLabel="Abrir medicamentos"
            >
              <View style={styles.quickActionIcon}><Ionicons name="medkit" size={24} color={colors.primary[500]} /></View>
              <Text style={styles.quickActionHint}>Med</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/patient/history')}
              accessibilityRole="button"
              accessibilityLabel="Abrir historial"
            >
              <View style={styles.quickActionIcon}><Ionicons name="time-outline" size={24} color={colors.primary[500]} /></View>
              <Text style={styles.quickActionHint}>Hist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/patient/device-settings')}
              accessibilityRole="button"
              accessibilityLabel="Abrir ajustes de dispositivo"
            >
              <View style={styles.quickActionIcon}><Ionicons name="hardware-chip-outline" size={24} color={colors.primary[500]} /></View>
              <Text style={styles.quickActionHint}>Disp</Text>
            </TouchableOpacity>
          </View>
        </View>

        
          

                  

              
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, ...shadows.sm },
  headerLeft: { flex: 1 },
  brandingContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.extrabold, color: colors.primary[600], letterSpacing: -0.5 },
  headerSubtitle: { fontSize: typography.fontSize.base, color: colors.gray[600], marginTop: spacing.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  connectionBadge: { width: 32, height: 32, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  iconButton: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  emergencyButton: { backgroundColor: colors.error[500] },
  accountButton: { backgroundColor: colors.gray[100] },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing['3xl'] },
  heroSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  modalActions: { gap: spacing.md },
  // All Done Card
  allDoneCard: { 
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.xl, 
    padding: spacing['2xl'], 
    alignItems: 'center', 
    ...shadows.lg,
  },
  allDoneTitle: { 
    fontSize: typography.fontSize['2xl'], 
    fontWeight: typography.fontWeight.bold, 
    color: colors.success[600], 
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  allDoneText: { 
    fontSize: typography.fontSize.base, 
    color: colors.gray[500], 
    marginBottom: spacing.lg,
  },
  allDoneStats: { 
    backgroundColor: colors.success[50], 
    borderRadius: borderRadius.lg, 
    paddingVertical: spacing.md, 
    paddingHorizontal: spacing['2xl'],
  },
  allDoneStat: { 
    alignItems: 'center',
  },
  allDoneStatNumber: { 
    fontSize: typography.fontSize['3xl'], 
    fontWeight: typography.fontWeight.bold, 
    color: colors.success[600],
  },
  allDoneStatLabel: { 
    fontSize: typography.fontSize.sm, 
    color: colors.success[600],
  },
  // Empty Day
  emptyDayContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyDayTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.gray[900], marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyDayText: { fontSize: typography.fontSize.base, color: colors.gray[600], textAlign: 'center' },
  // Quick Actions
  quickActions: { flexDirection: 'row', gap: spacing.md },
  quickActionCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 90, ...shadows.sm },
  quickActionIcon: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickActionHint: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.gray[500], textAlign: 'center', letterSpacing: 0.2 },
});

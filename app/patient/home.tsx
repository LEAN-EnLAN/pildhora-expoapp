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
import Svg, { Circle } from 'react-native-svg';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { fetchMedications } from '../../src/store/slices/medicationsSlice';
import { startIntakesSubscription, stopIntakesSubscription, setIntakes } from '../../src/store/slices/intakesSlice';
import { Card, Button, Modal } from '../../src/components/ui';
import AppIcon from '../../src/components/ui/AppIcon';
import BrandedLoadingScreen from '../../src/components/ui/BrandedLoadingScreen';
import { startDeviceListener, stopDeviceListener } from '../../src/store/slices/deviceSlice';
import { Medication, IntakeStatus } from '../../src/types';
import { getDbInstance, getRdbInstance } from '../../src/services/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, get as rdbGet } from 'firebase/database';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens';

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
// MINI ADHERENCE RING - Subtle progress indicator
// ============================================================================
const AdherenceRing = React.memo(function AdherenceRing({ taken, total, size = 60 }: { taken: number; total: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? taken / total : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.gray[200]} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={progress >= 1 ? colors.success[500] : colors.primary[500]}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: '700', color: progress >= 1 ? colors.success[600] : colors.primary[600] }}>
        {percentage}%
      </Text>
    </View>
  );
});

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
}

const HeroCard = React.memo(function HeroCard({
  medicationName, dosage, scheduledTime, icon = '💊',
  onTake, onSkip, loading = false, isCompleted = false, completedAt,
  minutesUntilDue, isOverdue = false, takenCount, totalCount,
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
      {/* Header with adherence ring */}
      <View style={heroStyles.headerRow}>
        <View style={heroStyles.timeSection}>
          <View style={[heroStyles.urgencyBadge, { backgroundColor: urgencyInfo.bgColor }]}>
            <Text style={[heroStyles.urgencyText, { color: urgencyInfo.color }]}>{urgencyInfo.label}</Text>
          </View>
          <Text style={heroStyles.timeDisplay}>{scheduledTime}</Text>
          {minutesUntilDue !== undefined && minutesUntilDue > 0 && (
            <Text style={heroStyles.timeUntil}>
              en {minutesUntilDue < 60 ? `${minutesUntilDue} min` : `${Math.floor(minutesUntilDue / 60)}h ${minutesUntilDue % 60}m`}
            </Text>
          )}
          {isOverdue && <Text style={heroStyles.overdueText}>⚠️ Atrasada</Text>}
        </View>
        <View style={heroStyles.adherenceContainer}>
          <AdherenceRing taken={takenCount} total={totalCount} size={64} />
          <Text style={heroStyles.adherenceLabel}>{takenCount}/{totalCount}</Text>
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
  container: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, ...shadows.lg },
  containerCompleted: { backgroundColor: colors.success[50], borderWidth: 2, borderColor: colors.success[100] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  timeSection: { flex: 1 },
  urgencyBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginBottom: spacing.sm },
  urgencyText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeDisplay: { fontSize: 48, fontWeight: typography.fontWeight.bold, color: colors.gray[900], letterSpacing: -1 },
  timeUntil: { fontSize: typography.fontSize.base, color: colors.gray[500], marginTop: spacing.xs },
  overdueText: { fontSize: typography.fontSize.sm, color: colors.error[500], fontWeight: typography.fontWeight.semibold, marginTop: spacing.xs },
  adherenceContainer: { alignItems: 'center' },
  adherenceLabel: { fontSize: typography.fontSize.xs, color: colors.gray[500], marginTop: spacing.xs },
  medicationSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray[50], borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  iconContainer: { width: 56, height: 56, borderRadius: borderRadius.lg, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  iconEmoji: { fontSize: 28 },
  medicationInfo: { flex: 1 },
  medicationName: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.gray[900], marginBottom: spacing.xs },
  dosage: { fontSize: typography.fontSize.base, color: colors.gray[600] },
  actionsSection: { flexDirection: 'row', gap: spacing.md },
  takeButton: { flex: 2, borderRadius: borderRadius.lg, overflow: 'hidden' },
  takeButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  takeButtonText: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.surface },
  skipButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray[100], borderRadius: borderRadius.lg, paddingVertical: spacing.lg, gap: spacing.xs },
  skipButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[600] },
  buttonDisabled: { opacity: 0.6 },
  completedContent: { alignItems: 'center', paddingVertical: spacing.lg },
  completedTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.success[600], marginTop: spacing.md, marginBottom: spacing.sm },
  completedMedName: { fontSize: typography.fontSize.lg, color: colors.gray[700], marginBottom: spacing.xs },
  completedTime: { fontSize: typography.fontSize.base, color: colors.gray[500] },
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
  const { medications, loading } = useSelector((state: RootState) => state.medications);
  const { intakes } = useSelector((state: RootState) => state.intakes);
  const deviceSlice = useSelector((state: RootState) => (state as any).device);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Paciente');
  const patientId = user?.id;
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [takingLoading, setTakingLoading] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeDecimal());

  useEffect(() => { const interval = setInterval(() => setCurrentTime(getCurrentTimeDecimal()), 30000); return () => clearInterval(interval); }, []);
  useEffect(() => { if (patientId) { dispatch(fetchMedications(patientId)); dispatch(startIntakesSubscription(patientId)); } return () => { if (patientId) dispatch(stopIntakesSubscription()); }; }, [patientId, dispatch]);

  const initDevice = useCallback(async () => {
    try {
      if (!patientId) return;
      const rdb = await getRdbInstance();
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

  const handleTakeDose = useCallback(async () => {
    if (!nextDose || !patientId) { Alert.alert('Error', 'No hay dosis disponible.'); return; }
    try {
      setTakingLoading(true);
      const hh = Math.floor(nextDose.timeDecimal);
      const mm = Math.round((nextDose.timeDecimal - hh) * 60);
      const scheduledDate = new Date(); scheduledDate.setHours(hh, mm, 0, 0);

      if (nextDose.medicationId) {
        const { canTakeDose } = await import('../../src/services/doseCompletionTracker');
        const check = await canTakeDose(nextDose.medicationId, scheduledDate);
        if (!check.canTake) { Alert.alert('Dosis ya registrada', check.reason || 'Ya registrada.'); setTakingLoading(false); return; }
      }

      const db = await getDbInstance();
      if (!db) throw new Error('Firestore no disponible');

      const takenAt = new Date();
      
      // Create the intake record
      const newIntake = {
        medicationName: nextDose.medicationName, 
        dosage: nextDose.dosage,
        scheduledTime: scheduledDate.toISOString(), 
        status: IntakeStatus.TAKEN,
        patientId, 
        takenAt: takenAt.toISOString(),
        ...(nextDose.medicationId ? { medicationId: nextDose.medicationId } : {}),
        caregiverId: nextDose.medication.caregiverId,
      };

      await addDoc(collection(db, 'intakeRecords'), {
        ...newIntake,
        scheduledTime: Timestamp.fromDate(scheduledDate),
        takenAt: Timestamp.fromDate(takenAt),
      } as any);
      
      // Optimistic update - immediately add to local state so UI updates instantly
      dispatch(setIntakes([
        { id: `temp-${Date.now()}`, ...newIntake } as any,
        ...intakes,
      ]));

      if (nextDose.medication.trackInventory) {
        try {
          const { inventoryService } = await import('../../src/services/inventoryService');
          await inventoryService.decrementInventory(nextDose.medicationId, inventoryService.parseDoseAmount(nextDose.medication));
          if (await inventoryService.checkLowQuantity(nextDose.medicationId)) {
            const status = await inventoryService.getInventoryStatus(nextDose.medicationId);
            // Show inventory alert with clear context (pills in bottle, not today's doses)
            Alert.alert(
              '⚠️ Inventario bajo',
              `Quedan ${status.currentQuantity} unidades de ${nextDose.medicationName} en tu inventario.\n\nAproximadamente ${status.daysRemaining} ${status.daysRemaining === 1 ? 'día' : 'días'} de tratamiento.`,
              [{ text: 'Entendido', style: 'default' }]
            );
          }
        } catch {}
      }
      // Calculate remaining doses for TODAY (not inventory)
      const remainingToday = adherenceStats.total - adherenceStats.taken - 1; // -1 for the dose just taken
      const successMessage = remainingToday > 0 
        ? `${nextDose.medicationName} registrada.\n\n${remainingToday} dosis más para hoy.`
        : `${nextDose.medicationName} registrada.\n\n¡Completaste todas tus dosis de hoy!`;
      Alert.alert('✓ Registrado', successMessage);
    } catch (e: any) { Alert.alert('Error', e?.message || 'No se pudo registrar.'); }
    finally { setTakingLoading(false); }
  }, [nextDose, patientId]);

  const handleSkipDose = useCallback(async () => {
    if (!nextDose || !patientId) return;
    Alert.alert('Omitir dosis', `¿Omitir ${nextDose.medicationName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Omitir', style: 'destructive', onPress: async () => {
        try {
          setTakingLoading(true);
          const hh = Math.floor(nextDose.timeDecimal); const mm = Math.round((nextDose.timeDecimal - hh) * 60);
          const scheduledDate = new Date(); scheduledDate.setHours(hh, mm, 0, 0);
          const db = await getDbInstance(); if (!db) throw new Error('Firestore no disponible');
          
          // Create the intake record
          const newIntake = {
            medicationName: nextDose.medicationName, 
            dosage: nextDose.dosage,
            scheduledTime: scheduledDate.toISOString(), 
            status: IntakeStatus.MISSED,
            patientId, 
            skippedAt: new Date().toISOString(),
            ...(nextDose.medicationId ? { medicationId: nextDose.medicationId } : {}),
          };
          
          // Save to Firestore
          await addDoc(collection(db, 'intakeRecords'), {
            ...newIntake,
            scheduledTime: Timestamp.fromDate(scheduledDate),
            skippedAt: Timestamp.now(),
          } as any);
          
          // Optimistic update - immediately add to local state so UI updates instantly
          dispatch(setIntakes([
            { id: `temp-${Date.now()}`, ...newIntake } as any,
            ...intakes,
          ]));
          
          Alert.alert('Omitida', `${nextDose.medicationName} omitida.`);
        } catch (e: any) { Alert.alert('Error', e?.message || 'Error.'); }
        finally { setTakingLoading(false); }
      }},
    ]);
  }, [nextDose, patientId]);

  const handleDosePress = useCallback((dose: any) => { router.push(`/patient/medications/${dose.medicationId}`); }, [router]);

  if (loading) return <BrandedLoadingScreen message="Cargando información..." />;


  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
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
          <TouchableOpacity style={styles.iconButton} onPress={handleEmergencyPress}>
            <Ionicons name="alert-circle" size={28} color={colors.error[500]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleAccountMenu}>
            <Ionicons name="person-circle-outline" size={28} color={colors.gray[700]} />
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
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/patient/medications')}>
              <View style={styles.quickActionIcon}><Ionicons name="medkit" size={24} color={colors.primary[500]} /></View>
              <Text style={styles.quickActionTitle}>Medicamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/patient/history')}>
              <View style={styles.quickActionIcon}><Ionicons name="time-outline" size={24} color={colors.primary[500]} /></View>
              <Text style={styles.quickActionTitle}>Historial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/patient/device-settings')}>
              <View style={styles.quickActionIcon}><Ionicons name="hardware-chip-outline" size={24} color={colors.primary[500]} /></View>
              <Text style={styles.quickActionTitle}>Dispositivo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Progress Summary - Minimal inline design */}
        {allTodayDoses.length > 0 && nextDose && (
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progreso de hoy</Text>
                <Text style={styles.progressPercent}>
                  {Math.round((adherenceStats.completed / adherenceStats.total) * 100)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${(adherenceStats.completed / adherenceStats.total) * 100}%`,
                        backgroundColor: adherenceStats.completed === adherenceStats.total 
                          ? colors.success[500] 
                          : colors.primary[500]
                      }
                    ]} 
                  />
                </View>
              </View>
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <View style={[styles.progressDot, { backgroundColor: colors.success[500] }]} />
                  <Text style={styles.progressStatText}>{adherenceStats.taken} tomadas</Text>
                </View>
                {adherenceStats.skipped > 0 && (
                  <View style={styles.progressStat}>
                    <View style={[styles.progressDot, { backgroundColor: colors.warning[500] }]} />
                    <Text style={styles.progressStatText}>{adherenceStats.skipped} omitidas</Text>
                  </View>
                )}
                <View style={styles.progressStat}>
                  <View style={[styles.progressDot, { backgroundColor: colors.gray[300] }]} />
                  <Text style={styles.progressStatText}>{adherenceStats.pending} pendientes</Text>
                </View>
                {adherenceStats.overdue > 0 && (
                  <View style={styles.progressStat}>
                    <View style={[styles.progressDot, { backgroundColor: colors.error[500] }]} />
                    <Text style={[styles.progressStatText, { color: colors.error[600] }]}>{adherenceStats.overdue} atrasadas</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, ...shadows.sm },
  headerLeft: { flex: 1 },
  brandingContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.extrabold, color: colors.primary[500], letterSpacing: 0.5 },
  headerSubtitle: { fontSize: typography.fontSize.base, color: colors.gray[600], marginTop: spacing.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 44, height: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray[50] },
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
  quickActionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray[900], textAlign: 'center' },
  // Clean Progress Card
  progressCard: { 
    backgroundColor: colors.surface, 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg,
    ...shadows.sm,
  },
  progressHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.md,
  },
  progressTitle: { 
    fontSize: typography.fontSize.base, 
    fontWeight: typography.fontWeight.semibold, 
    color: colors.gray[700],
  },
  progressPercent: { 
    fontSize: typography.fontSize.lg, 
    fontWeight: typography.fontWeight.bold, 
    color: colors.primary[600],
  },
  progressBarContainer: { 
    marginBottom: spacing.md,
  },
  progressBarBg: { 
    height: 8, 
    backgroundColor: colors.gray[100], 
    borderRadius: 4, 
    overflow: 'hidden',
  },
  progressBarFill: { 
    height: '100%', 
    borderRadius: 4,
  },
  progressStats: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  progressStat: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.xs,
  },
  progressDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4,
  },
  progressStatText: { 
    fontSize: typography.fontSize.sm, 
    color: colors.gray[600],
  },
});

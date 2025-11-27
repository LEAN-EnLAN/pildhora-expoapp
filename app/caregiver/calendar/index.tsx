import React, { useState, useEffect, useMemo, useCallback } from 'react';
<<<<<<< Updated upstream
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, orderBy, getFirestore } from 'firebase/firestore';

import { RootState } from '../../../src/store';
import { MedicationEvent, Medication } from '../../../src/types';
import { ScreenWrapper } from '../../../src/components/caregiver';
import { Container } from '../../../src/components/ui';
import { CalendarView } from '../../../src/components/caregiver/calendar/CalendarView';
import { DayDetail } from '../../../src/components/caregiver/calendar/DayDetail';
import { AdherenceChart, AdherenceDay } from '../../../src/components/caregiver/calendar/AdherenceChart';
import { OfflineIndicator } from '../../../src/components/caregiver/OfflineIndicator';
import { ErrorState } from '../../../src/components/caregiver/ErrorState';
import { colors, spacing } from '../../../src/theme/tokens';

import { useCollectionSWR } from '../../../src/hooks/useCollectionSWR';
import { useLinkedPatients } from '../../../src/hooks/useLinkedPatients';
import { getDbInstance } from '../../../src/services/firebase';
import { categorizeError } from '../../../src/utils/errorHandling';

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Get linked patients
  const { patients } = useLinkedPatients({
    caregiverId: user?.id || null,
    enabled: !!user?.id,
  });

  // Calculate month range for query
  const monthRange = useMemo(() => {
    return {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    };
  }, [currentDate]);

  // Query events for the current month
  const [eventsQuery, setEventsQuery] = useState<any>(null);

  useEffect(() => {
    const buildQuery = async () => {
      if (!user?.id || patients.length === 0) {
        setEventsQuery(null);
        return;
      }

      const db = await getDbInstance();
      if (!db) return;

      // We fetch all events for the patients to calculate adherence correctly across the month
      // Optimally, we would filter by date range in Firestore, but for now we'll fetch recent history
      // or implement a month-based query if the index exists.
      // Given the previous implementation, let's try to filter by date if possible, 
      // or fetch a reasonable amount and filter client-side.
      
      // Note: Firestore range queries on 'timestamp' are good.
      // But we need to filter by patientId IN [...] which requires a specific index with timestamp.
      // If we don't have that index, we might need to query per patient or just fetch last N events.
      // Let's assume we can fetch by patientId (if single) or just fetch all for caregiver's patients.
      
      // For simplicity and to ensure we get data, let's use the existing pattern of fetching by patientId
      // If multiple patients, we might need multiple queries or a composite query.
      // Let's assume we select the first patient or aggregate.
      // The dashboard selected a patient. Here, the calendar should probably show ALL or allow selection.
      // User said: "comprehensive calendar system".
      // Let's query events for all linked patients.
      
      const patientIds = patients.map(p => p.id);
      if (patientIds.length === 0) return;

      // Querying with 'in' operator for patientId and range for timestamp requires index.
      // Fallback: Query by patientId 'in' and client-side filter for date, limit to reasonable number (e.g. 500)
      setEventsQuery(query(
        collection(db, 'medicationEvents'),
        where('patientId', 'in', patientIds.slice(0, 10)), // Limit to 10 patients for 'in' query limit
        orderBy('timestamp', 'desc'),
        // limit(500) // Fetch enough for the month
      ));
    };

    buildQuery();
  }, [user?.id, patients, currentDate]); // Re-build if month changes? No, just fetch all and filter client side for now to be safe.

  const { data: allEvents = [], isLoading: eventsLoading, error: eventsError, mutate } = useCollectionSWR<MedicationEvent>({
    cacheKey: `calendar_events:${user?.id}:${monthRange.start.getTime()}`, // Update cache key when month changes
    query: eventsQuery,
    initialData: [],
    realtime: true,
  });
=======
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getFirestore } from 'firebase/firestore';

import { RootState, AppDispatch } from '../../../src/store';
import { IntakeRecord, IntakeStatus, MedicationEvent, Medication } from '../../../src/types';
import { startIntakesSubscription, stopIntakesSubscription } from '../../../src/store/slices/intakesSlice';
import { ScreenWrapper } from '../../../src/components/caregiver/ScreenWrapper';
import { Container } from '../../../src/components/ui/Container';
import { ErrorState } from '../../../src/components/caregiver/ErrorState';
import { OfflineIndicator } from '../../../src/components/caregiver/OfflineIndicator';
import { MedicationEventCard } from '../../../src/components/caregiver/MedicationEventCard';
import { CalendarView } from '../../../src/components/caregiver/calendar/CalendarView';
import { AdherenceChart, AdherenceDay } from '../../../src/components/caregiver/calendar/AdherenceChart';
import { colors, spacing, borderRadius, typography } from '../../../src/theme/tokens';
import { categorizeError } from '../../../src/utils/errorHandling';
import { buildEventQuery } from '../../../src/utils/eventQueryBuilder';
import { useCollectionSWR } from '../../../src/hooks/useCollectionSWR';
import { getTasksQuery } from '../../../src/services/firebase/tasks';
import { Task } from '../../../src/types';

// ... existing imports

export default function CalendarScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { intakes } = useSelector((state: RootState) => state.intakes || { intakes: [] }); // Safe access

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const monthRange = useMemo(() => ({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }), [currentDate]);
  const db = getFirestore();
  const eventsQuery = useMemo(() => {
    if (!user?.id) return null as any;
    return buildEventQuery(db, user.id, { patientId: selectedPatientId || undefined, dateRange: { start: monthRange.start, end: monthRange.end } }, 500);
  }, [db, user?.id, selectedPatientId, monthRange.start, monthRange.end]);
  const { data: eventsData = [], isLoading: eventsLoading, error: eventsError, mutate } = useCollectionSWR<MedicationEvent>({ query: eventsQuery, cacheKey: `events:${user?.id}:${selectedPatientId || 'all'}:${format(monthRange.start,'yyyy-MM')}` });
  const allEvents: MedicationEvent[] = eventsData;

  const [tasksQuery, setTasksQuery] = useState<any>(null);
  useEffect(() => {
    if (user?.id) {
      getTasksQuery(user.id).then(setTasksQuery).catch(() => {});
    }
  }, [user?.id]);
  const { data: caregiverTasks = [] } = useCollectionSWR<Task>({ query: tasksQuery, cacheKey: user?.id ? `tasks:${user.id}` : null });

  const dayTasks = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0,0,0,0);
    const end = new Date(selectedDate);
    end.setHours(23,59,59,999);
    return caregiverTasks.filter(t => {
      const ts = (t.dueDate as any)?.toMillis ? (t.dueDate as any).toMillis() : new Date(t.dueDate as any).getTime();
      return ts >= start.getTime() && ts <= end.getTime();
    });
  }, [caregiverTasks, selectedDate]);

  const availabilitySlots = useMemo(() => ([
    { start: '08:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ]), []);

  const SELECTED_PATIENT_KEY = '@caregiver_selected_patient';

  useEffect(() => {
    const loadSelectedPatient = async () => {
      try {
        const saved = await AsyncStorage.getItem(SELECTED_PATIENT_KEY);
        if (saved) setSelectedPatientId(saved);
      } catch {}
    };
    loadSelectedPatient();
  }, []);

  const getEventStatus = useCallback((e: MedicationEvent) => {
    if (e.eventType === 'dose_taken') return 'taken';
    if (e.eventType === 'dose_missed') return 'missed';
    if (e.eventType === 'dose_skipped') return 'skipped';
    return 'other';
  }, []);
  // ...

  // Subscribe to intakes when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      (dispatch as any)(startIntakesSubscription(selectedPatientId));
    }
    return () => {
      (dispatch as any)(stopIntakesSubscription());
    };
  }, [selectedPatientId, dispatch]);

  // ... (eventsQuery logic remains same)

  // ... (useCollectionSWR logic remains same)

  // Merge events and intakes
  const mergedEvents = useMemo(() => {
    // Convert intakes to MedicationEvent format
    const intakeEvents: MedicationEvent[] = (intakes || []).map(intake => {
      let eventType: any = 'dose_taken';
      if (intake.status === 'missed') eventType = 'dose_missed';
      if (intake.status === 'skipped') eventType = 'dose_skipped';
      const patient = patients.find(p => p.id === intake.patientId);
      return {
        id: `intake_${intake.id}`,
        eventType,
        patientId: intake.patientId,
        patientName: patient?.name || 'Paciente',
        caregiverId: user?.id || '',
        medicationId: intake.medicationId || 'unknown',
        medicationName: intake.medicationName,
        medicationData: {},
        timestamp: intake.takenAt || intake.scheduledTime,
        syncStatus: 'delivered'
      };
    });

    return [...allEvents, ...intakeEvents].sort((a, b) => {
       const timeA = new Date(a.timestamp).getTime();
       const timeB = new Date(b.timestamp).getTime();
       return timeB - timeA; // Descending
    });
  }, [allEvents, intakes, user?.id]);
>>>>>>> Stashed changes

  // Filter events for the displayed month and selected date
  const { monthEvents, selectedDayEvents } = useMemo(() => {
    const monthStart = monthRange.start.getTime();
    const monthEnd = monthRange.end.getTime();
    
<<<<<<< Updated upstream
    const mEvents = allEvents.filter(e => {
      // Handle timestamp: Firestore Timestamp or number/string
      const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : new Date(e.timestamp).getTime();
=======
    const mEvents = mergedEvents.filter(e => {
      const ts = (e.timestamp as any)?.toMillis ? (e.timestamp as any).toMillis() : new Date(e.timestamp as any).getTime();
>>>>>>> Stashed changes
      return ts >= monthStart && ts <= monthEnd;
    });

    const selectedStart = new Date(selectedDate);
    selectedStart.setHours(0, 0, 0, 0);
    const selectedEnd = new Date(selectedDate);
    selectedEnd.setHours(23, 59, 59, 999);

<<<<<<< Updated upstream
    const dEvents = allEvents.filter(e => {
      const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : new Date(e.timestamp).getTime();
=======
    const dEvents = mergedEvents.filter(e => {
      const ts = (e.timestamp as any)?.toMillis ? (e.timestamp as any).toMillis() : new Date(e.timestamp as any).getTime();
>>>>>>> Stashed changes
      return ts >= selectedStart.getTime() && ts <= selectedEnd.getTime();
    });

    return { monthEvents: mEvents, selectedDayEvents: dEvents };
<<<<<<< Updated upstream
  }, [allEvents, monthRange, selectedDate]);
=======
  }, [mergedEvents, monthRange, selectedDate]);

  const hasConflicts = useMemo(() => {
    const slots: Record<string, number> = {};
    const addSlot = (ts: number) => {
      const key = format(new Date(ts), 'yyyy-MM-dd HH');
      slots[key] = (slots[key] || 0) + 1;
    };
    selectedDayEvents.forEach(e => {
      const ts = (e.timestamp as any)?.toMillis ? (e.timestamp as any).toMillis() : new Date(e.timestamp as any).getTime();
      addSlot(ts);
    });
    dayTasks.forEach(t => {
      const ts = (t.dueDate as any)?.toMillis ? (t.dueDate as any).toMillis() : new Date(t.dueDate as any).getTime();
      addSlot(ts);
    });
    return Object.values(slots).some(count => count > 1);
  }, [selectedDayEvents, dayTasks]);

  // ... rest of the file (adherenceData, selectedDayStats, weeklyStats) uses monthEvents/selectedDayEvents so they will auto-update

>>>>>>> Stashed changes

  // Calculate Adherence Data for dots
  const adherenceData = useMemo(() => {
    const data: Record<string, { status: 'complete' | 'partial' | 'missed' | 'none' }> = {};
    
    // Group events by day
    const eventsByDay: Record<string, MedicationEvent[]> = {};
    monthEvents.forEach(e => {
<<<<<<< Updated upstream
      const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : e.timestamp
=======
      const ts = (e.timestamp as any)?.toMillis ? (e.timestamp as any).toMillis() : e.timestamp as any;
>>>>>>> Stashed changes
      const dateStr = format(new Date(ts), 'yyyy-MM-dd');
      if (!eventsByDay[dateStr]) eventsByDay[dateStr] = [];
      eventsByDay[dateStr].push(e);
    });

    // Determine status for each day (Simplified logic)
    // "complete": All scheduled taken (requires medication schedule, which we don't have easily here without fetching all meds)
    // For now, let's use a heuristic based on event types:
    // If any 'missed' event -> 'missed' or 'partial'
    // If only 'taken' -> 'complete'
    // If 'skipped' -> 'partial'
    
    Object.keys(eventsByDay).forEach(dateStr => {
      const dayEvents = eventsByDay[dateStr];
<<<<<<< Updated upstream
      const hasMissed = dayEvents.some(e => e.status === 'missed');
      const hasSkipped = dayEvents.some(e => e.status === 'skipped');
      const hasTaken = dayEvents.some(e => e.status === 'taken');
=======
      const hasMissed = dayEvents.some(e => getEventStatus(e) === 'missed');
      const hasSkipped = dayEvents.some(e => getEventStatus(e) === 'skipped');
      const hasTaken = dayEvents.some(e => getEventStatus(e) === 'taken');
>>>>>>> Stashed changes

      let status: 'complete' | 'partial' | 'missed' | 'none' = 'none';
      
      if (hasMissed) status = 'missed';
      else if (hasSkipped) status = 'partial';
      else if (hasTaken) status = 'complete';
      
      data[dateStr] = { status };
    });

    return data;
  }, [monthEvents]);

  // Calculate Selected Day Stats
  const selectedDayStats = useMemo(() => {
    let taken = 0;
    let missed = 0;
    let skipped = 0;

    selectedDayEvents.forEach(e => {
<<<<<<< Updated upstream
      if (e.status === 'taken') taken++;
      if (e.status === 'missed') missed++;
      if (e.status === 'skipped') skipped++;
=======
      const s = getEventStatus(e);
      if (s === 'taken') taken++;
      if (s === 'missed') missed++;
      if (s === 'skipped') skipped++;
>>>>>>> Stashed changes
    });

    return {
      taken,
      missed,
      skipped,
      total: taken + missed + skipped // Only counts recorded events
    };
  }, [selectedDayEvents]);

  // Calculate Weekly Stats for AdherenceChart
  const weeklyStats = useMemo(() => {
    // Week surrounding selected date
<<<<<<< Updated upstream
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday start
=======
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
>>>>>>> Stashed changes
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const now = new Date();

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayStart = day.getTime();
      const dayEnd = new Date(day).setHours(23, 59, 59, 999);

<<<<<<< Updated upstream
      const dayEvents = allEvents.filter(e => {
        const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : new Date(e.timestamp).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });

      const taken = dayEvents.filter(e => e.status === 'taken').length;
=======
      const dayEvents = mergedEvents.filter((e: MedicationEvent) => {
        const ts = (e.timestamp as any)?.toMillis ? (e.timestamp as any).toMillis() : new Date(e.timestamp as any).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });

      const taken = dayEvents.filter(e => getEventStatus(e) === 'taken').length;
>>>>>>> Stashed changes
      const total = dayEvents.length;
      
      const isFuture = day > now;
      
      let percentage = 0;
      if (total > 0) {
        percentage = Math.round((taken / total) * 100);
      }

      let status: AdherenceDay['status'] = 'good';
      if (isFuture) {
          status = 'future';
      } else if (total === 0) {
          status = 'future'; // Treat no data as future/gray for now
      } else {
          if (percentage >= 80) status = 'good';
          else if (percentage >= 50) status = 'warning';
          else status = 'bad';
      }

      return {
        day: format(day, 'EEE', { locale: es }), // e.g. 'dom'
        percentage,
        status,
        dateStr
      };
    });
  }, [selectedDate, allEvents]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }, [mutate]);

  const handleEventPress = (event: MedicationEvent) => {
    // Navigate to medication detail if patientId and medicationId are present
    if (event.patientId && event.medicationId) {
      router.push({
        pathname: '/caregiver/medications/[patientId]/[id]',
        params: { patientId: event.patientId, id: event.medicationId }
      });
    } else {
      console.warn('Event missing patientId or medicationId', event);
    }
  };

  if (eventsError) {
    const categorized = categorizeError(eventsError);
    return (
      <ScreenWrapper>
        <Container style={styles.container}>
          <ErrorState
            category={categorized.category}
            message={categorized.userMessage}
            onRetry={mutate}
          />
        </Container>
      </ScreenWrapper>
    );
  }

<<<<<<< Updated upstream
=======
  // Get selected patient name
  const selectedPatientName = useMemo(() => {
    if (!selectedPatientId) return 'Todos los pacientes';
    const patient = patients.find((p: any) => p.id === selectedPatientId);
    return patient ? patient.name : 'Paciente desconocido';
  }, [selectedPatientId, patients]);

  // Render header with calendar and chart
  const renderHeader = () => (
    <View>
      {/* Patient Header */}
      <View style={styles.patientHeader}>
        <View style={styles.patientBadge}>
          <Ionicons name="person" size={16} color={colors.primary[600]} />
          <Text style={styles.patientHeaderText}>{selectedPatientName}</Text>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <CalendarView
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onMonthChange={setCurrentDate}
          adherenceData={adherenceData}
        />
      </View>

      <View style={styles.chartContainer}>
        <AdherenceChart 
          weeklyStats={weeklyStats} 
          loading={eventsLoading && !allEvents.length} 
        />
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }} accessible accessibilityLabel="Agenda del cuidador">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Ionicons name="calendar" size={16} color={colors.primary[600]} />
          <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.gray[800] }}>Agenda del cuidador</Text>
        </View>
        <Text style={{ color: colors.gray[600], marginTop: spacing.xs }}>Disponible: {availabilitySlots.map(s => `${s.start}–${s.end}`).join(', ')}</Text>
        {dayTasks.length === 0 ? (
          <Text style={{ color: colors.gray[500], marginTop: spacing.xs }}>Sin tareas para este día</Text>
        ) : (
          dayTasks.map(t => (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}>
              <Ionicons name={t.completed ? 'checkmark-circle' : 'time-outline'} size={18} color={t.completed ? colors.success[500] : colors.primary[600]} />
              <Text style={{ color: colors.gray[800] }}>{t.title}</Text>
            </View>
          ))
        )}
      </View>

      {/* Day Detail Header */}
      <View style={styles.dayDetailHeader}>
        <Text style={styles.dateTitle}>
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
        </Text>
        {hasConflicts && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs }} accessible accessibilityRole="alert" accessibilityLabel="Conflicto de horario">
            <Ionicons name="alert" size={16} color={colors.error[500]} />
            <Text style={{ color: colors.error[600], fontSize: typography.fontSize.sm }}>Conflicto de horario detectado</Text>
          </View>
        )}
        
        {/* Stats Summary Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.success[50] }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[500]} />
            </View>
            <View>
              <Text style={styles.statValue}>{selectedDayStats.taken}</Text>
              <Text style={styles.statLabel}>Tomadas</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.error[50] }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
            </View>
            <View>
              <Text style={styles.statValue}>{selectedDayStats.missed}</Text>
              <Text style={styles.statLabel}>Olvidadas</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
             <View style={[styles.statIcon, { backgroundColor: colors.warning[50] }]}>
              <Ionicons name="remove-circle" size={20} color={colors.warning[500]} />
            </View>
            <View>
              <Text style={styles.statValue}>{selectedDayStats.skipped}</Text>
              <Text style={styles.statLabel}>Saltadas</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

>>>>>>> Stashed changes
  return (
    <ScreenWrapper>
      <OfflineIndicator />
      <Container style={styles.container}>
<<<<<<< Updated upstream
        <ScrollView
=======
        <FlatList
          data={selectedDayEvents}
          renderItem={({ item }) => (
            <MedicationEventCard 
              event={item} 
              onPress={() => handleEventPress(item)} 
            />
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="calendar-clear-outline" size={48} color={colors.gray[300]} />
              </View>
              <Text style={styles.emptyTitle}>Sin actividad</Text>
              <Text style={styles.emptyText}>No hay eventos registrados para este día</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
>>>>>>> Stashed changes
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
<<<<<<< Updated upstream
        >
          <View style={styles.calendarContainer}>
            <CalendarView
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onMonthChange={setCurrentDate}
              adherenceData={adherenceData}
            />
          </View>

          <View style={styles.chartContainer}>
            <AdherenceChart 
              weeklyStats={weeklyStats} 
              loading={eventsLoading && !allEvents.length} 
            />
          </View>

          <View style={styles.detailContainer}>
            <DayDetail
              date={selectedDate}
              events={selectedDayEvents}
              stats={selectedDayStats}
              loading={eventsLoading && !allEvents.length}
              onEventPress={handleEventPress}
            />
          </View>
        </ScrollView>
=======
          accessibilityRole="list"
          accessible={true}
          accessibilityLabel="Lista de eventos del día"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
>>>>>>> Stashed changes
      </Container>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
<<<<<<< Updated upstream
=======
  patientHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.xs,
  },
  patientHeaderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[800],
  },
>>>>>>> Stashed changes
  calendarContainer: {
    padding: spacing.md,
  },
  chartContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
<<<<<<< Updated upstream
  detailContainer: {
    flex: 1,
    minHeight: 400, // Ensure minimum height for list
=======
  dayDetailHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  dateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    lineHeight: 24,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  separator: {
    height: spacing.sm,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    marginTop: spacing.md,
    backgroundColor: 'white',
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
>>>>>>> Stashed changes
  },
});

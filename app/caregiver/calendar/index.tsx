import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

  // Filter events for the displayed month and selected date
  const { monthEvents, selectedDayEvents } = useMemo(() => {
    const monthStart = monthRange.start.getTime();
    const monthEnd = monthRange.end.getTime();
    
    const mEvents = allEvents.filter(e => {
      // Handle timestamp: Firestore Timestamp or number/string
      const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : new Date(e.timestamp).getTime();
      return ts >= monthStart && ts <= monthEnd;
    });

    const selectedStart = new Date(selectedDate);
    selectedStart.setHours(0, 0, 0, 0);
    const selectedEnd = new Date(selectedDate);
    selectedEnd.setHours(23, 59, 59, 999);

    const dEvents = allEvents.filter(e => {
      const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : new Date(e.timestamp).getTime();
      return ts >= selectedStart.getTime() && ts <= selectedEnd.getTime();
    });

    return { monthEvents: mEvents, selectedDayEvents: dEvents };
  }, [allEvents, monthRange, selectedDate]);

  // Calculate Adherence Data for dots
  const adherenceData = useMemo(() => {
    const data: Record<string, { status: 'complete' | 'partial' | 'missed' | 'none' }> = {};
    
    // Group events by day
    const eventsByDay: Record<string, MedicationEvent[]> = {};
    monthEvents.forEach(e => {
      const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : e.timestamp
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
      const hasMissed = dayEvents.some(e => e.status === 'missed');
      const hasSkipped = dayEvents.some(e => e.status === 'skipped');
      const hasTaken = dayEvents.some(e => e.status === 'taken');

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
      if (e.status === 'taken') taken++;
      if (e.status === 'missed') missed++;
      if (e.status === 'skipped') skipped++;
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
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday start
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const now = new Date();

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayStart = day.getTime();
      const dayEnd = new Date(day).setHours(23, 59, 59, 999);

      const dayEvents = allEvents.filter(e => {
        const ts = e.timestamp instanceof Object && 'toMillis' in e.timestamp ? e.timestamp.toMillis() : new Date(e.timestamp).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });

      const taken = dayEvents.filter(e => e.status === 'taken').length;
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

  return (
    <ScreenWrapper>
      <OfflineIndicator />
      <Container style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
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
      </Container>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  calendarContainer: {
    padding: spacing.md,
  },
  chartContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  detailContainer: {
    flex: 1,
    minHeight: 400, // Ensure minimum height for list
  },
});

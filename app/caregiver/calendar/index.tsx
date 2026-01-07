import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, orderBy } from 'firebase/firestore';

import { RootState } from '../../../src/store';
import { IntakeRecord, IntakeStatus } from '../../../src/types';
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
      
      // Query intakeRecords for adherence tracking
      // intakeRecords have status field (taken, missed, skipped, pending)
      
      const patientIds = patients.map(p => p.id);
      if (patientIds.length === 0) return;

      // Querying with 'in' operator for patientId - limit to 10 patients for Firestore 'in' query limit
      setEventsQuery(query(
        collection(db, 'intakeRecords'),
        where('patientId', 'in', patientIds.slice(0, 10)),
        orderBy('scheduledTime', 'desc'),
      ));
    };

    buildQuery();
  }, [user?.id, patients, currentDate]); // Re-build if month changes? No, just fetch all and filter client side for now to be safe.

  const { data: allRecords = [], isLoading: eventsLoading, error: eventsError, mutate } = useCollectionSWR<IntakeRecord>({
    cacheKey: `calendar_intake:${user?.id}:${monthRange.start.getTime()}`,
    query: eventsQuery,
    initialData: [],
    realtime: true,
  });

  // Helper to get timestamp from IntakeRecord
  const getRecordTimestamp = (record: IntakeRecord): number => {
    const ts = record.scheduledTime;
    if (ts instanceof Object && 'toMillis' in ts) return (ts as any).toMillis();
    return new Date(ts as string | Date).getTime();
  };

  // Filter records for the displayed month and selected date
  const { monthRecords, selectedDayRecords } = useMemo(() => {
    const monthStart = monthRange.start.getTime();
    const monthEnd = monthRange.end.getTime();
    
    const mRecords = allRecords.filter(r => {
      const ts = getRecordTimestamp(r);
      return ts >= monthStart && ts <= monthEnd;
    });

    const selectedStart = new Date(selectedDate);
    selectedStart.setHours(0, 0, 0, 0);
    const selectedEnd = new Date(selectedDate);
    selectedEnd.setHours(23, 59, 59, 999);

    const dRecords = allRecords.filter(r => {
      const ts = getRecordTimestamp(r);
      return ts >= selectedStart.getTime() && ts <= selectedEnd.getTime();
    });

    return { monthRecords: mRecords, selectedDayRecords: dRecords };
  }, [allRecords, monthRange, selectedDate]);

  // Calculate Adherence Data for dots
  const adherenceData = useMemo(() => {
    const data: Record<string, { status: 'complete' | 'partial' | 'missed' | 'none' }> = {};
    
    // Group records by day
    const recordsByDay: Record<string, IntakeRecord[]> = {};
    monthRecords.forEach(r => {
      const ts = getRecordTimestamp(r);
      const dateStr = format(new Date(ts), 'yyyy-MM-dd');
      if (!recordsByDay[dateStr]) recordsByDay[dateStr] = [];
      recordsByDay[dateStr].push(r);
    });

    // Determine status for each day based on IntakeStatus
    Object.keys(recordsByDay).forEach(dateStr => {
      const dayRecords = recordsByDay[dateStr];
      const hasMissed = dayRecords.some(r => r.status === IntakeStatus.MISSED);
      const hasSkipped = dayRecords.some(r => r.status === IntakeStatus.SKIPPED);
      const hasTaken = dayRecords.some(r => r.status === IntakeStatus.TAKEN);

      let status: 'complete' | 'partial' | 'missed' | 'none' = 'none';
      
      if (hasMissed) status = 'missed';
      else if (hasSkipped) status = 'partial';
      else if (hasTaken) status = 'complete';
      
      data[dateStr] = { status };
    });

    return data;
  }, [monthRecords]);

  // Calculate Selected Day Stats
  const selectedDayStats = useMemo(() => {
    let taken = 0;
    let missed = 0;
    let skipped = 0;

    selectedDayRecords.forEach(r => {
      if (r.status === IntakeStatus.TAKEN) taken++;
      if (r.status === IntakeStatus.MISSED) missed++;
      if (r.status === IntakeStatus.SKIPPED) skipped++;
    });

    return {
      taken,
      missed,
      skipped,
      total: taken + missed + skipped
    };
  }, [selectedDayRecords]);

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

      const dayRecords = allRecords.filter(r => {
        const ts = getRecordTimestamp(r);
        return ts >= dayStart && ts <= dayEnd;
      });

      const taken = dayRecords.filter(r => r.status === IntakeStatus.TAKEN).length;
      const total = dayRecords.length;
      
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
  }, [selectedDate, allRecords]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }, [mutate]);

  const handleRecordPress = (record: IntakeRecord) => {
    // Navigate to medication detail if patientId and medicationId are present
    if (record.patientId && record.medicationId) {
      router.push({
        pathname: '/caregiver/medications/[patientId]/[id]',
        params: { patientId: record.patientId, id: record.medicationId }
      });
    } else {
      console.warn('Record missing patientId or medicationId', record);
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
              loading={eventsLoading && !allRecords.length} 
            />
          </View>

          <View style={styles.detailContainer}>
            <DayDetail
              date={selectedDate}
              records={selectedDayRecords}
              stats={selectedDayStats}
              loading={eventsLoading && !allRecords.length}
              onRecordPress={handleRecordPress}
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

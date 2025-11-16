import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { getDbInstance } from '../../src/services/firebase';
import { RootState } from '../../src/store';
import { MedicationEvent, Patient } from '../../src/types';
import { MedicationEventCard } from '../../src/components/caregiver/MedicationEventCard';
import { EventFilterControls, EventFilters } from '../../src/components/caregiver/EventFilterControls';
import { Container, ListSkeleton, EventCardSkeleton, AnimatedListItem } from '../../src/components/ui';
import { ErrorBoundary } from '../../src/components/shared/ErrorBoundary';
import { ErrorState } from '../../src/components/caregiver/ErrorState';
import { OfflineIndicator } from '../../src/components/caregiver/OfflineIndicator';
import { patientDataCache } from '../../src/services/patientDataCache';
import { offlineQueueManager } from '../../src/services/offlineQueueManager';
import { categorizeError } from '../../src/utils/errorHandling';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { buildEventQuery, applyClientSideSearch } from '../../src/utils/eventQueryBuilder';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';

// Pagination: Limit events per page for better performance
const EVENTS_PER_PAGE = 50;

// Static initial data for instant rendering (SWR pattern)
const STATIC_INITIAL_EVENTS: MedicationEvent[] = [];

function MedicationEventRegistryContent() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [isOnline, setIsOnline] = useState(true);

  /**
   * Cache key for SWR pattern
   * Includes filters to ensure proper cache invalidation
   */
  const cacheKey = useMemo(() => {
    if (!user?.id) return null;

    const filterKey = [
      filters.patientId || 'all',
      filters.eventType || 'all',
      filters.dateRange ? `${filters.dateRange.start.getTime()}-${filters.dateRange.end.getTime()}` : 'all',
    ].join(':');

    return `events:${user.id}:${filterKey}`;
  }, [user?.id, filters.patientId, filters.eventType, filters.dateRange]);

  /**
   * Build Firestore query based on filters
   * Use useEffect to handle async query building
   */
  const [resolvedQuery, setResolvedQuery] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) {
      setResolvedQuery(null);
      return;
    }

    const fetchQuery = async () => {
      const db = await getDbInstance();
      if (!db) {
        setResolvedQuery(null);
        return;
      }

      const query = await buildEventQuery(
        db,
        user.id,
        {
          patientId: filters.patientId,
          eventType: filters.eventType,
          dateRange: filters.dateRange,
        },
        EVENTS_PER_PAGE
      );

      setResolvedQuery(query);
    };

    fetchQuery();
  }, [user?.id, filters.patientId, filters.eventType, filters.dateRange]);

  // Always call useCollectionSWR to maintain hook order
  // Pass null query when not ready - the hook will handle this gracefully
  const {
    data: allEvents,
    source,
    isLoading: loading,
    error: swrError,
    mutate,
  } = useCollectionSWR<MedicationEvent>({
    cacheKey: cacheKey || 'events:loading',
    query: resolvedQuery,
    initialData: STATIC_INITIAL_EVENTS,
    realtime: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache TTL
    onSuccess: (data) => {
      // Cache events for offline use
      if (user?.id && data.length > 0) {
        patientDataCache.cacheEvents(user.id, data).catch(err => {
          console.error('[MedicationEventRegistry] Error caching events:', err);
        });
      }
    },
    onError: (err) => {
      console.error('[MedicationEventRegistry] Error fetching events:', err);
    },
  });

  /**
   * Monitor network status
   */
  useEffect(() => {
    const checkOnlineStatus = () => {
      const status = offlineQueueManager.isNetworkOnline();
      setIsOnline(status);
    };

    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 5000);

    return () => clearInterval(interval);
  }, []);



  /**
   * Load patients for filter dropdown
   */
  useEffect(() => {
    if (!user?.id) return;

    const loadPatients = async () => {
      try {
        const db = await getDbInstance();
        if (!db) return;

        const patientsQuery = query(
          collection(db, 'patients'),
          where('caregiverId', '==', user.id)
        );

        const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
          const patientData: Patient[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            patientData.push({
              id: doc.id,
              name: data.name,
              email: data.email,
              caregiverId: data.caregiverId,
              createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : data.createdAt,
              deviceId: data.deviceId,
              adherence: data.adherence,
              lastTaken: data.lastTaken,
            });
          });
          setPatients(patientData);
        });

        return unsubscribe;
      } catch (error) {
        console.error('[MedicationEventRegistry] Error loading patients:', error);
      }
    };

    loadPatients();
  }, [user?.id]);



  /**
   * Apply client-side search filter to events
   * Firestore doesn't support full-text search, so we filter medication names on the client
   * Memoized for performance
   */
  const events = useMemo(() => {
    return applyClientSideSearch(allEvents, filters.searchQuery);
  }, [allEvents, filters.searchQuery]);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Handle pull-to-refresh
   * Uses SWR mutate to trigger refetch
   */
  const handleRefresh = useCallback(() => {
    if (!isOnline) {
      // Can't refresh when offline
      return;
    }

    setRefreshing(true);
    mutate(); // Trigger SWR refetch
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [isOnline, mutate]);

  /**
   * Handle retry on error
   * Uses SWR mutate to trigger refetch
   */
  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  /**
   * Handle event card press - navigate to event detail
   */
  const handleEventPress = useCallback((event: MedicationEvent) => {
    router.push({
      pathname: '/caregiver/events/[id]',
      params: { id: event.id }
    });
  }, [router]);

  /**
   * Render individual event item
   * Memoized to prevent unnecessary re-renders
   * Wrapped with AnimatedListItem for smooth entrance animations
   */
  const renderEventItem = useCallback(({ item, index }: { item: MedicationEvent; index: number }) => (
    <AnimatedListItem index={index} delay={50}>
      <MedicationEventCard
        event={item}
        onPress={() => handleEventPress(item)}
      />
    </AnimatedListItem>
  ), [handleEventPress]);

  /**
   * Key extractor for FlatList optimization
   * Using event ID ensures stable keys across renders
   */
  const keyExtractor = useCallback((item: MedicationEvent) => item.id, []);

  /**
   * Get item layout for FlatList optimization
   * Provides exact dimensions for better scroll performance
   */
  const getItemLayout = useCallback(
    (_data: ArrayLike<MedicationEvent> | null | undefined, index: number) => ({
      length: 140, // Approximate height of event card + separator
      offset: 140 * index,
      index,
    }),
    []
  );

  /**
   * Categorize error for better user messaging
   * MUST be called before any conditional returns to maintain hook order
   */
  const categorizedError = useMemo(() => {
    if (!swrError) return null;
    return categorizeError(swrError);
  }, [swrError]);

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    return (
      <View 
        style={styles.emptyState}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="No hay eventos. Los cambios de medicamentos de tus pacientes aparecerán aquí"
      >
        <Ionicons name="notifications-off-outline" size={64} color={colors.gray[400]} accessible={false} />
        <Text style={styles.emptyTitle}>No hay eventos</Text>
        <Text style={styles.emptySubtitle}>
          Los cambios de medicamentos de tus pacientes aparecerán aquí
        </Text>
      </View>
    );
  };

  /**
   * Render loading state with skeleton loaders
   */
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <Container style={styles.container}>
          <ListSkeleton count={5} ItemSkeleton={EventCardSkeleton} />
        </Container>
      </SafeAreaView>
    );
  }

  /**
   * Render error state (only if no cached data available)
   */
  if (categorizedError && source !== 'cache' && allEvents.length === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <Container style={styles.container}>
          <OfflineIndicator isOnline={isOnline} />
          <ErrorState
            category={categorizedError.category}
            message={categorizedError.userMessage || categorizedError.message || 'Error al cargar eventos'}
            onRetry={handleRetry}
          />
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Container style={styles.container}>
        <OfflineIndicator isOnline={isOnline} />
        
        {/* Cached Data Warning */}
        {source === 'cache' && (
          <View 
            style={styles.cachedDataBanner}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="Mostrando datos guardados. Conéctate para actualizar."
          >
            <Ionicons name="information-circle" size={20} color={colors.warning[500]} />
            <Text style={styles.cachedDataText}>
              Mostrando datos guardados. Conéctate para actualizar.
            </Text>
          </View>
        )}

        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <EventFilterControls
              filters={filters}
              onFiltersChange={handleFiltersChange}
              patients={patients.map(p => ({ id: p.id, name: p.name }))}
            />
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
              enabled={isOnline}
              accessibilityLabel="Actualizar eventos"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          accessible={true}
          accessibilityLabel="Lista de eventos de medicamentos"
          accessibilityRole="list"
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          getItemLayout={getItemLayout}
        />
      </Container>
    </SafeAreaView>
  );
}

/**
 * Main component wrapped with error boundary
 */
export default function MedicationEventRegistry() {
  return (
    <ErrorBoundary>
      <MedicationEventRegistryContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  cachedDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning[200],
  },
  cachedDataText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning[500],
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[700],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

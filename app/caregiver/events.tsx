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
import { Ionicons } from '@expo/vector-icons';
import { getDbInstance } from '../../src/services/firebase';
import { RootState } from '../../src/store';
import { MedicationEvent } from '../../src/types';
import { MedicationEventCard } from '../../src/components/caregiver/MedicationEventCard';
import { EventFilterControls, EventFilters } from '../../src/components/caregiver/EventFilterControls';
import { Container, ListSkeleton, EventCardSkeleton, AnimatedListItem } from '../../src/components/ui';
import { ErrorBoundary } from '../../src/components/shared/ErrorBoundary';
import { ErrorState } from '../../src/components/caregiver/ErrorState';
import { ScreenWrapper } from '../../src/components/caregiver';
import { OfflineIndicator } from '../../src/components/caregiver/OfflineIndicator';
import { patientDataCache } from '../../src/services/patientDataCache';
import { offlineQueueManager } from '../../src/services/offlineQueueManager';
import { categorizeError } from '../../src/utils/errorHandling';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { buildEventQuery, applyClientSideSearch } from '../../src/utils/eventQueryBuilder';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { useLinkedPatients } from '../../src/hooks/useLinkedPatients';
import { useScrollViewPadding } from '../../src/hooks/useScrollViewPadding';

// Pagination: Limit events per page for better performance
const EVENTS_PER_PAGE = 50;

// Static initial data for instant rendering (SWR pattern)
const STATIC_INITIAL_EVENTS: MedicationEvent[] = [];

function MedicationEventRegistryContent() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Layout dimensions for proper spacing
  const { contentPaddingBottom } = useScrollViewPadding();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [isOnline, setIsOnline] = useState(true);

  // Fetch linked patients using the proper hook
  const { patients } = useLinkedPatients({
    caregiverId: user?.id || null,
    enabled: !!user?.id,
  });

  /**
   * Cache key for SWR pattern
   * Includes filters to ensure proper cache invalidation
   * Uses stable date timestamps to prevent infinite refresh loops
   */
  const cacheKey = useMemo(() => {
    if (!user?.id) return null;

    // Create stable date range key by using timestamps
    // This prevents Date object reference changes from invalidating the cache
    const dateRangeKey = filters.dateRange 
      ? `${filters.dateRange.start.getTime()}-${filters.dateRange.end.getTime()}`
      : 'all';

    const filterKey = [
      filters.patientId || 'all',
      filters.eventType || 'all',
      dateRangeKey,
    ].join(':');

    return `events:${user.id}:${filterKey}`;
  }, [
    user?.id, 
    filters.patientId, 
    filters.eventType, 
    // Use stable timestamp values instead of Date object references
    // Only call getTime() if the date exists
    filters.dateRange?.start?.getTime(),
    filters.dateRange?.end?.getTime(),
  ]);

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

    // Don't query events if caregiver has no linked patients
    // This prevents permission errors when caregiver hasn't completed onboarding
    if (patients.length === 0) {
      console.log('[Events] No linked patients - skipping query');
      setResolvedQuery(null);
      return;
    }

    const fetchQuery = async () => {
      const db = await getDbInstance();
      if (!db) {
        setResolvedQuery(null);
        return;
      }

      // Extract patient IDs for query
      const linkedPatientIds = patients.map(p => p.id);

      const query = buildEventQuery(
        db,
        user.id,
        {
          patientId: filters.patientId,
          eventType: filters.eventType,
          dateRange: filters.dateRange,
        },
        EVENTS_PER_PAGE,
        linkedPatientIds // Pass linked patient IDs
      );

      setResolvedQuery(query);
    };

    fetchQuery();
  }, [
    user?.id, 
    patients, // Watch the entire patients array
    filters.patientId, 
    filters.eventType,
    // Use stable timestamp values instead of Date object references
    // Only call getTime() if the date exists
    filters.dateRange?.start?.getTime(),
    filters.dateRange?.end?.getTime(),
  ]);

  // Memoize callbacks to prevent infinite loops in useCollectionSWR
  const handleSuccess = useCallback((data: MedicationEvent[]) => {
    // Cache events for offline use
    if (user?.id && data.length > 0) {
      patientDataCache.cacheEvents(user.id, data).catch(err => {
        console.error('[MedicationEventRegistry] Error caching events:', err);
      });
    }
  }, [user?.id]);

  const handleError = useCallback((err: Error) => {
    console.error('[MedicationEventRegistry] Error fetching events:', err);
  }, []);

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
    realtime: false, // Disabled to prevent infinite refresh loops - use pull-to-refresh instead
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache TTL
    onSuccess: handleSuccess,
    onError: handleError,
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
   * Patients are now loaded via useLinkedPatients hook
   * This properly queries deviceLinks collection instead of non-existent patients collection
   */



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
      <ScreenWrapper>
        <Container style={styles.container}>
          <ListSkeleton count={5} ItemSkeleton={EventCardSkeleton} />
        </Container>
      </ScreenWrapper>
    );
  }

  /**
   * Render error state (only if no cached data available)
   */
  if (categorizedError && source !== 'cache' && allEvents.length === 0) {
    return (
      <ScreenWrapper>
        <Container style={styles.container}>
          <OfflineIndicator isOnline={isOnline} />
          <ErrorState
            category={categorizedError.category}
            message={categorizedError.userMessage || categorizedError.message || 'Error al cargar eventos'}
            onRetry={handleRetry}
          />
        </Container>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
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
          contentContainerStyle={[styles.listContent, { paddingBottom: contentPaddingBottom }]}
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
    </ScreenWrapper>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    // paddingBottom is applied dynamically via useScrollViewPadding hook
    flexGrow: 1,
  },
  separator: {
    height: spacing.lg,
  },
  cachedDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning[200],
    marginBottom: spacing.sm,
  },
  cachedDataText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning[600],
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
    maxWidth: 280,
  },
});

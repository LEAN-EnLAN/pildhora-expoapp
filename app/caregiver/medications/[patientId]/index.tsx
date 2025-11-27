import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { RootState, AppDispatch } from '../../../../src/store';
import { fetchMedications } from '../../../../src/store/slices/medicationsSlice';
import { Medication } from '../../../../src/types';
import { Button, AnimatedListItem, ListSkeleton, MedicationCardSkeleton } from '../../../../src/components/ui';
import { MedicationCard } from '../../../../src/components/screens/patient';
import { ErrorBoundary } from '../../../../src/components/shared/ErrorBoundary';
import { ErrorState } from '../../../../src/components/caregiver/ErrorState';
import { OfflineIndicator } from '../../../../src/components/caregiver/OfflineIndicator';
import { ScreenWrapper } from '../../../../src/components/caregiver';
import { patientDataCache } from '../../../../src/services/patientDataCache';
import { useNetworkStatus } from '../../../../src/hooks/useNetworkStatus';
import { useScrollViewPadding } from '../../../../src/hooks/useScrollViewPadding';
import { categorizeError } from '../../../../src/utils/errorHandling';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../../src/theme/tokens';
import { inventoryService } from '../../../../src/services/inventoryService';
import { PremiumAdherenceChart } from '../../../../src/components/shared/PremiumAdherenceChart';
import { startIntakesSubscription, stopIntakesSubscription } from '../../../../src/store/slices/intakesSlice';
import { IntakeStatus } from '../../../../src/types';
import { Card } from '../../../../src/components/ui';

function CaregiverMedicationsIndexContent() {
  const { patientId } = useLocalSearchParams();
  const pid = Array.isArray(patientId) ? patientId[0] : patientId;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { medications, loading, error } = useSelector((state: RootState) => state.medications);
  const { intakes } = useSelector((state: RootState) => state.intakes);
  const [lowInventoryMeds, setLowInventoryMeds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [cachedMedications, setCachedMedications] = useState<Medication[]>([]);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // Network status
  const networkStatus = useNetworkStatus();
  const isOnline = networkStatus.isOnline;

  // Layout dimensions for proper spacing
  const { contentPaddingBottom } = useScrollViewPadding();

  /**
   * Load cached medications on mount
   */
  useEffect(() => {
    const loadCachedMedications = async () => {
      if (!pid) return;

      try {
        const cached = await patientDataCache.getCachedMedications(pid);
        if (cached) {
          setCachedMedications(cached);
        }
      } catch (error) {
        console.error('[CaregiverMedicationsIndex] Error loading cached medications:', error);
      }
    };

    loadCachedMedications();
  }, [pid]);

  // Subscribe to intakes for real-time adherence
  useEffect(() => {
    if (pid) {
      dispatch(startIntakesSubscription(pid));
    }
    return () => {
      dispatch(stopIntakesSubscription());
    };
  }, [pid, dispatch]);

  const adherenceData = useMemo(() => {
    const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const getTodayAbbrev = () => DAY_ABBREVS[new Date().getDay()];
    const isScheduledToday = (med: Medication) => {
      const freq = med.frequency || '';
      const days = freq.split(',').map((s) => s.trim());
      return days.includes(getTodayAbbrev());
    };

    const todaysMeds = medications.filter(isScheduledToday);
    if (todaysMeds.length === 0) return { takenCount: 0, totalCount: 0 };

    let totalDoses = 0;
    todaysMeds.forEach(med => {
      totalDoses += med.times.length;
    });

    if (totalDoses === 0) return { takenCount: 0, totalCount: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueTaken = new Set<string>();
    intakes.forEach((intake) => {
      const intakeDate = new Date(intake.scheduledTime);
      if (intakeDate >= today && intake.status === IntakeStatus.TAKEN) {
        const medKey = intake.medicationId || intake.medicationName;
        const scheduledMs = intakeDate.getTime();
        const completionToken = `${medKey}-${scheduledMs}`;
        uniqueTaken.add(completionToken);
      }
    });

    return { takenCount: uniqueTaken.size, totalCount: totalDoses };
  }, [medications, intakes]);

  // Fetch medications on mount and when screen comes into focus
  // This ensures the list refreshes after adding a new medication
  useFocusEffect(
    useCallback(() => {
      if (pid && isOnline) {
        dispatch(fetchMedications(pid));
      }
    }, [pid, dispatch, isOnline])
  );

  /**
   * Cache medications when loaded
   */
  useEffect(() => {
    const cacheMedications = async () => {
      if (medications.length > 0 && pid) {
        try {
          await patientDataCache.cacheMedications(pid, medications); setUsingCachedData(false);
        } catch (error) {
          console.error('[CaregiverMedicationsIndex] Error caching medications:', error);
        }
      }
    };

    cacheMedications();
  }, [medications, pid]);

  // Check inventory status for all medications
  useEffect(() => {
    const checkInventoryStatus = async () => {
      const lowMeds = new Set<string>();

      for (const med of medications) {
        if (med.trackInventory && med.id) {
          try {
            const isLow = await inventoryService.checkLowQuantity(med.id);
            if (isLow) {
              lowMeds.add(med.id);
            }
          } catch (error) {
            console.error('[CaregiverMedicationsIndex] Error checking inventory:', error);
          }
        }
      }

      setLowInventoryMeds(lowMeds);
    };

    if (medications.length > 0) {
      checkInventoryStatus();
    }
  }, [medications]);

  // Filter medications based on search query
  // Use cached data if offline or error occurred
  const filteredMedications = useMemo(() => {
    let meds = medications;

    // Fallback to cached data if needed
    if (meds.length === 0 && (error || !isOnline) && cachedMedications.length > 0) {
      meds = cachedMedications;
      setUsingCachedData(true);
    }

    if (!searchQuery.trim()) return meds;

    const query = searchQuery.toLowerCase();
    return meds.filter(med =>
      med.name.toLowerCase().includes(query) ||
      med.doseUnit?.toLowerCase().includes(query) ||
      med.quantityType?.toLowerCase().includes(query)
    );
  }, [medications, cachedMedications, searchQuery, error, isOnline]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (pid && isOnline) {
      dispatch(fetchMedications(pid));
    }
  }, [pid, dispatch, isOnline]);

  // Note: Delete functionality is handled in the detail view (MedicationDetailView)
  // The Redux slice automatically generates deletion events when deleteMedication is called

  /**
   * Render medication item with animation
   * Memoized to prevent unnecessary re-renders
   */
  const renderMedicationItem = useCallback(({ item, index }: { item: Medication; index: number }) => {
    const showLowBadge = lowInventoryMeds.has(item.id);

    return (
      <AnimatedListItem index={index} delay={50} style={styles.medicationItem}>
        <MedicationCard
          medication={item}
          onPress={() => router.push(`/caregiver/medications/${pid}/${item.id}`)}
          showLowQuantityBadge={showLowBadge}
          currentQuantity={item.currentQuantity}
        />
      </AnimatedListItem>
    );
  }, [router, pid, lowInventoryMeds]);

  /**
   * Key extractor for FlatList optimization
   * Using medication ID ensures stable keys across renders
   */
  const keyExtractor = useCallback((item: Medication) => item.id, []);

  /**
   * Get item layout for FlatList optimization
   * Provides exact dimensions for better scroll performance
   */
  const getItemLayout = useCallback(
    (_data: ArrayLike<Medication> | null | undefined, index: number) => ({
      length: 160, // Approximate height of medication card + margin
      offset: 160 * index,
      index,
    }),
    []
  );

  // Render search bar
  const renderSearchBar = useCallback(() => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={colors.gray[400]} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar medicamentos..."
        placeholderTextColor={colors.gray[400]}
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessibilityLabel="Buscar medicamentos"
        accessibilityHint="Ingresa el nombre del medicamento para filtrar la lista"
      />
      {searchQuery.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setSearchQuery('')}
          accessibilityLabel="Limpiar búsqueda"
        >
          <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
        </Button>
      )}
    </View>
  ), [searchQuery]);

  const renderHeader = useCallback(() => (
    <View>
      <View style={styles.chartContainer}>
        <Card variant="elevated" padding="lg">
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Adherencia Hoy</Text>
          </View>
          <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
            <PremiumAdherenceChart
              taken={adherenceData.takenCount}
              total={adherenceData.totalCount}
              size={220}
              strokeWidth={18}
            />
          </View>
        </Card>
      </View>
      {renderSearchBar()}
    </View>
  ), [adherenceData, renderSearchBar, router, pid]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search-outline" size={64} color={colors.gray[400]} />
          </View>
          <Text style={styles.emptyTitle}>No se encontraron medicamentos</Text>
          <Text style={styles.emptyDescription}>
            No hay medicamentos que coincidan con "{searchQuery}"
          </Text>
          <Button
            variant="secondary"
            size="lg"
            onPress={() => setSearchQuery('')}
            accessibilityLabel="Limpiar búsqueda"
          >
            Limpiar Búsqueda
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.gray[400]} />
        </View>
        <Text style={styles.emptyTitle}>No hay medicamentos</Text>
        <Text style={styles.emptyDescription}>
          Agrega el primer medicamento para este paciente
        </Text>
        <Button
          variant="primary"
          size="lg"
          onPress={() => router.push(`/caregiver/medications/${pid}/add`)}
          accessibilityLabel="Agregar primer medicamento"
          accessibilityHint="Navega a la pantalla para agregar un nuevo medicamento"
        >
          Agregar Medicamento
        </Button>
      </View>
    );
  }, [searchQuery, router, pid]);

  // Render add button
  const renderAddButton = useCallback(() => {
    if (medications.length === 0) return null;

    return (
      <View style={styles.addButtonContainer}>
        <Button
          variant="primary"
          size="lg"
          onPress={() => router.push(`/caregiver/medications/${pid}/add`)}
          leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />}
          accessibilityLabel="Agregar medicamento"
          accessibilityHint="Navega a la pantalla para agregar un nuevo medicamento"
        >
          Agregar Medicamento
        </Button>
      </View>
    );
  }, [medications.length, router, pid]);

  // Loading state with skeleton loaders
  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <ListSkeleton count={4} ItemSkeleton={MedicationCardSkeleton} />
        </View>
      </ScreenWrapper>
    );
  }

  // Error state (only if no cached data available)
  if (error && !usingCachedData && cachedMedications.length === 0) {
    const categorized = categorizeError(error);
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <OfflineIndicator isOnline={isOnline} />
          <ErrorState
            category={categorized.category}
            message={categorized.userMessage}
            onRetry={handleRetry}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Cached Data Warning */}
      {usingCachedData && (
        <View style={styles.cachedDataBanner}>
          <Ionicons name="information-circle" size={20} color={colors.warning[500]} />
          <Text style={styles.cachedDataText}>
            Mostrando datos guardados. Conéctate para actualizar.
          </Text>
        </View>
      )}

      <FlatList
        data={filteredMedications}
        keyExtractor={keyExtractor}
        renderItem={renderMedicationItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: contentPaddingBottom }]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderAddButton}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </View>
  );
}

/**
 * Main component wrapped with error boundary
 */
export default function CaregiverMedicationsIndex() {
  return (
    <ErrorBoundary>
      <CaregiverMedicationsIndexContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  listContent: {
    padding: spacing.lg,
    // paddingBottom is applied dynamically via useScrollViewPadding hook
  },
  medicationItem: {
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    paddingVertical: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  addButtonContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  chartContainer: {
    marginBottom: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
});

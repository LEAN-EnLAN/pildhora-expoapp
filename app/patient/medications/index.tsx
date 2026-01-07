import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../../src/store';
import { fetchMedications } from '../../../src/store/slices/medicationsSlice';
import { Medication } from '../../../src/types';
import { AppBar, ErrorMessage, ListSkeleton, MedicationCardSkeleton } from '../../../src/components/ui';
import { MedicationCard } from '../../../src/components/screens/patient';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/theme/tokens';
import { inventoryService } from '../../../src/services/inventoryService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MedicationsIndex() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { medications, loading, error } = useSelector((state: RootState) => state.medications);
  const patientId = user?.id;
  const [lowInventoryMeds, setLowInventoryMeds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (patientId) dispatch(fetchMedications(patientId));
  }, [patientId, dispatch]);

  useEffect(() => {
    const checkInventoryStatus = async () => {
      const lowMeds = new Set<string>();
      for (const med of medications) {
        if (med.trackInventory && med.id) {
          try {
            const isLow = await inventoryService.checkLowQuantity(med.id);
            if (isLow) lowMeds.add(med.id);
          } catch (error) {
            console.error('[MedicationsIndex] Error checking inventory:', error);
          }
        }
      }
      setLowInventoryMeds(lowMeds);
    };
    if (medications.length > 0) checkInventoryStatus();
  }, [medications]);

  const handleRetry = useCallback(() => {
    if (patientId) dispatch(fetchMedications(patientId));
  }, [patientId, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (patientId) await dispatch(fetchMedications(patientId));
    setRefreshing(false);
  }, [patientId, dispatch]);

  // Deduplicate medications by ID to prevent duplicate key errors
  const uniqueMedications = useMemo(() => {
    const seen = new Set<string>();
    return medications.filter(med => {
      if (seen.has(med.id)) {
        return false;
      }
      seen.add(med.id);
      return true;
    });
  }, [medications]);

  const stats = useMemo(() => {
    const total = uniqueMedications.length;
    const withAlarms = uniqueMedications.filter(m => m.times && m.times.length > 0).length;
    const lowStock = lowInventoryMeds.size;
    return { total, withAlarms, lowStock };
  }, [uniqueMedications, lowInventoryMeds]);

  const renderMedicationItem = useCallback(({ item }: { item: Medication }) => {
    const showLowBadge = lowInventoryMeds.has(item.id);
    return (
      <MedicationCard
        medication={item}
        onPress={() => router.push(`/patient/medications/${item.id}`)}
        showLowQuantityBadge={showLowBadge}
        currentQuantity={item.currentQuantity}
      />
    );
  }, [router, lowInventoryMeds]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      {/* Resumen compacto */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.total}</Text>
          <Text style={styles.summaryLabel}>total</Text>
        </View>
        <View style={styles.summaryDot} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.withAlarms}</Text>
          <Text style={styles.summaryLabel}>con alarma</Text>
        </View>
        {stats.lowStock > 0 && (
          <>
            <View style={styles.summaryDot} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.warningText]}>{stats.lowStock}</Text>
              <Text style={[styles.summaryLabel, styles.warningText]}>stock bajo</Text>
            </View>
          </>
        )}
      </View>
    </View>
  ), [stats]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="medical-outline" size={48} color={colors.gray[300]} />
      </View>
      <Text style={styles.emptyTitle}>Sin medicamentos</Text>
      <Text style={styles.emptyDescription}>
        Agrega tu primer medicamento para comenzar
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/patient/medications/add')}
        accessibilityLabel="Agregar primer medicamento"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Agregar medicamento</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <AppBar
          title="Medicamentos"
          showBackButton={true}
          onBackPress={() => router.push('/patient/home')}
          rightActionIcon={<Ionicons name="add" size={24} color={colors.gray[800]} />}
          onRightActionPress={() => router.push('/patient/medications/add')}
        />
        <View style={styles.loadingHeader}>
          <View style={styles.skeletonSummary} />
        </View>
        <ListSkeleton count={4} ItemSkeleton={MedicationCardSkeleton} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <AppBar
          title="Medicamentos"
          showBackButton={true}
          onBackPress={() => router.push('/patient/home')}
          rightActionIcon={<Ionicons name="add" size={24} color={colors.gray[800]} />}
          onRightActionPress={() => router.push('/patient/medications/add')}
        />
        <View style={styles.errorContainer}>
          <ErrorMessage message={error} onRetry={handleRetry} variant="inline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <AppBar
        title="Medicamentos"
        showBackButton={true}
        onBackPress={() => router.push('/patient/home')}
        rightActionIcon={<Ionicons name="add" size={24} color={colors.gray[800]} />}
        onRightActionPress={() => router.push('/patient/medications/add')}
      />
      <FlatList
        data={uniqueMedications}
        keyExtractor={(item) => item.id}
        renderItem={renderMedicationItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={uniqueMedications.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingHeader: {
    padding: spacing.md,
  },
  skeletonSummary: {
    height: 32,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
    marginHorizontal: spacing.md,
  },
  warningText: {
    color: colors.warning[600],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});

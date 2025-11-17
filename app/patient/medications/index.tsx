import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '../../../src/store';
import { fetchMedications } from '../../../src/store/slices/medicationsSlice';
import { Medication } from '../../../src/types';
import { Button, ErrorMessage, AnimatedListItem, ListSkeleton, MedicationCardSkeleton } from '../../../src/components/ui';
import { MedicationCard } from '../../../src/components/screens/patient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../src/theme/tokens';
import { inventoryService } from '../../../src/services/inventoryService';

export default function MedicationsIndex() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { medications, loading, error } = useSelector((state: RootState) => state.medications);
  const deviceSlice = useSelector((state: RootState) => (state as any).device);
  const patientId = user?.id;
  const [lowInventoryMeds, setLowInventoryMeds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (patientId) dispatch(fetchMedications(patientId));
  }, [patientId, dispatch]);

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
            console.error('[MedicationsIndex] Error checking inventory:', error);
          }
        }
      }
      
      setLowInventoryMeds(lowMeds);
    };

    if (medications.length > 0) {
      checkInventoryStatus();
    }
  }, [medications]);

  // Check if device is connected
  const isDeviceConnected = useMemo(() => {
    return deviceSlice?.state?.is_online || false;
  }, [deviceSlice]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (patientId) {
      dispatch(fetchMedications(patientId));
    }
  }, [patientId, dispatch]);

  // Render medication item with animation
  const renderMedicationItem = useCallback(({ item, index }: { item: Medication; index: number }) => {
    const showLowBadge = lowInventoryMeds.has(item.id);
    
    return (
      <AnimatedListItem index={index} delay={50} style={styles.medicationItem}>
        <MedicationCard
          medication={item}
          onPress={() => router.push(`/patient/medications/${item.id}`)}
          showLowQuantityBadge={showLowBadge}
          currentQuantity={item.currentQuantity}
        />
      </AnimatedListItem>
    );
  }, [router, lowInventoryMeds]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={64} color={colors.gray[400]} />
      </View>
      <Text style={styles.emptyTitle}>No hay medicamentos</Text>
      <Text style={styles.emptyDescription}>
        Agrega tu primer medicamento para comenzar a gestionar tu tratamiento
      </Text>
      <Button
        variant="primary"
        size="lg"
        onPress={() => router.push('/patient/medications/add')}
        accessibilityLabel="Agregar primer medicamento"
        accessibilityHint="Navega a la pantalla para agregar un nuevo medicamento"
      >
        Agregar Medicamento
      </Button>
    </View>
  ), [router]);

  // Render mode indicator when device is connected
  const renderModeIndicator = useCallback(() => {
    if (!isDeviceConnected) return null;

    return (
      <View style={styles.modeIndicator}>
        <View style={styles.modeIndicatorContent}>
          <Ionicons name="link" size={20} color={typeof colors.info === 'string' ? colors.info : colors.info[500]} />
          <Text style={styles.modeIndicatorText}>
            Modo cuidador activo - Los medicamentos son gestionados por tu cuidador
          </Text>
        </View>
      </View>
    );
  }, [isDeviceConnected]);

  // Loading state with skeleton loaders
  if (loading) {
    return (
      <View style={styles.container}>
        <ListSkeleton count={4} ItemSkeleton={MedicationCardSkeleton} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <ErrorMessage
            message={error}
            onRetry={handleRetry}
            variant="inline"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={renderMedicationItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderModeIndicator}
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  medicationItem: {
    marginBottom: spacing.md,
  },
  modeIndicator: {
    backgroundColor: colors.info + '15',
    borderLeftWidth: 4,
    borderLeftColor: typeof colors.info === 'string' ? colors.info : colors.info[500],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modeIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIndicatorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    marginLeft: spacing.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
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
});

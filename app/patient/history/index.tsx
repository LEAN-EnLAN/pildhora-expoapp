import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../src/store";
import { fetchMedications } from "../../../src/store/slices/medicationsSlice";
import { startIntakesSubscription, stopIntakesSubscription, deleteAllIntakes, updateIntakeStatus } from "../../../src/store/slices/intakesSlice";
import { IntakeRecord, IntakeStatus } from "../../../src/types";
import { waitForFirebaseInitialization } from "../../../src/services/firebase";
import { LoadingSpinner, ErrorMessage, Modal, Button } from "../../../src/components/ui";
import { HistoryFilterBar, HistoryRecordCard } from "../../../src/components/screens/patient";
import { colors, spacing, typography, borderRadius, shadows } from "../../../src/theme/tokens";

type EnrichedIntakeRecord = IntakeRecord & {
  medication?: {
    id: string;
    name: string;
    dosage: string;
  };
};

export default function HistoryScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { medications } = useSelector((state: RootState) => state.medications);
  
  const { intakes, loading, error } = useSelector((state: RootState) => state.intakes);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "taken" | "missed">("all");
  const [isInitialized, setIsInitialized] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const patientId = user?.id;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await waitForFirebaseInitialization();
        setIsInitialized(true);
      } catch (error: any) {
        // Firebase initialization failed - error will be handled by error state
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (!patientId || !isInitialized) return;
    dispatch(startIntakesSubscription(patientId));
    return () => {
      dispatch(stopIntakesSubscription());
    };
  }, [patientId, isInitialized, dispatch]);

  useEffect(() => {
    if (patientId && isInitialized) {
      dispatch(fetchMedications(patientId));
    }
  }, [patientId, isInitialized, dispatch]);

  // Memoize filtered history
  const filteredHistory = useMemo(() => {
    return intakes.filter((record) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "taken") return record.status === IntakeStatus.TAKEN;
      if (selectedFilter === "missed") return record.status === IntakeStatus.MISSED;
      return true;
    });
  }, [intakes, selectedFilter]);

  // Memoize enriched and grouped history
  const groupedHistory = useMemo(() => {
    const enriched = filteredHistory.map((record) => {
      const med = medications.find((m) => m.id === record.medicationId);
      return {
        ...record,
        medication: med ? { id: med.id, name: med.name, dosage: med.dosage } : undefined,
      } as EnrichedIntakeRecord;
    });

    const grouped = enriched.reduce((acc, record) => {
      const date = new Date(record.scheduledTime).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {} as Record<string, EnrichedIntakeRecord[]>);

    return Object.entries(grouped).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredHistory, medications]);

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    all: intakes.length,
    taken: intakes.filter(r => r.status === IntakeStatus.TAKEN).length,
    missed: intakes.filter(r => r.status === IntakeStatus.MISSED).length,
  }), [intakes]);

  const handleClearAllData = useCallback(async () => {
    try {
      if (!patientId) return;
      await dispatch(deleteAllIntakes(patientId)).unwrap();
      setShowClearAllModal(false);
    } catch (error: any) {
      // Error clearing history - modal will close and error state will be shown if needed
      setShowClearAllModal(false);
    }
  }, [patientId, dispatch]);

  const handleMarkAsMissed = useCallback(async (recordId: string) => {
    try {
      await dispatch(updateIntakeStatus({ id: recordId, status: IntakeStatus.MISSED })).unwrap();
    } catch (error: any) {
      // Error marking as missed - error state will be shown if needed
    }
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    setIsInitialized(false);
  }, []);

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" });

  // Render empty state based on filter
  const renderEmptyState = () => {
    let icon: keyof typeof Ionicons.glyphMap = "time-outline";
    let title = "No hay registros en el historial";
    let description = "Los registros de medicamentos aparecerán aquí";

    if (selectedFilter === "taken") {
      icon = "checkmark-circle-outline";
      title = "No hay medicamentos tomados";
      description = "Los medicamentos que tomes aparecerán aquí";
    } else if (selectedFilter === "missed") {
      icon = "close-circle-outline";
      title = "No hay medicamentos olvidados";
      description = "Los medicamentos olvidados aparecerán aquí";
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name={icon} size={64} color={colors.gray[400]} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyDescription}>{description}</Text>
      </View>
    );
  };

  if (loading || !isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner 
            size="large" 
            message={!isInitialized ? "Inicializando aplicación..." : "Cargando historial..."} 
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ErrorMessage 
            message={error}
            onRetry={handleRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            accessibilityLabel="Volver"
            accessibilityHint="Regresa a la pantalla anterior"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial</Text>
        </View>
        {intakes.length > 0 && (
          <TouchableOpacity 
            onPress={() => setShowClearAllModal(true)} 
            style={styles.clearAllHeaderButton}
            accessibilityLabel="Limpiar historial"
            accessibilityHint="Elimina todos los registros del historial"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={24} color={colors.error[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Bar */}
      <HistoryFilterBar
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        counts={filterCounts}
      />

      {/* History List */}
      <ScrollView style={styles.historyList} contentContainerStyle={styles.historyListContent}>
        {filteredHistory.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {groupedHistory.map(([date, records]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                {records.map((record) => (
                  <HistoryRecordCard
                    key={record.id}
                    record={record}
                    medication={record.medication}
                    onMarkAsMissed={handleMarkAsMissed}
                  />
                ))}
              </View>
            ))}
            
            {/* Clear All Section */}
            {intakes.length > 0 && (
              <View style={styles.clearAllSection}>
                <Button
                  variant="danger"
                  onPress={() => setShowClearAllModal(true)}
                  leftIcon={<Ionicons name="trash-outline" size={20} color="#FFFFFF" />}
                  accessibilityLabel="Limpiar todo el historial"
                  accessibilityHint="Elimina todos los registros del historial permanentemente"
                >
                  Limpiar todo el historial
                </Button>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Limpiar Historial"
        size="sm"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            ¿Estás seguro de que quieres limpiar todos los datos del historial? Esta acción no se puede deshacer.
          </Text>
          <View style={styles.modalActions}>
            <Button
              variant="secondary"
              onPress={() => setShowClearAllModal(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onPress={handleClearAllData}
              style={styles.modalButton}
            >
              Limpiar todo
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.gray[900],
  },
  clearAllHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  dateGroup: {
    marginBottom: spacing['2xl'],
  },
  dateHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  clearAllSection: {
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  modalContent: {
    gap: spacing.lg,
  },
  modalText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

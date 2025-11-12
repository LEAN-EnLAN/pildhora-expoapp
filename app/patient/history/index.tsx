import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../src/store";
import { fetchMedications } from "../../../src/store/slices/medicationsSlice";
import { startIntakesSubscription, stopIntakesSubscription, deleteAllIntakes, updateIntakeStatus } from "../../../src/store/slices/intakesSlice";
import { IntakeRecord, IntakeStatus } from "../../../src/types";
import { waitForFirebaseInitialization } from "../../../src/services/firebase";

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

  const patientId = user?.id;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await waitForFirebaseInitialization();
        setIsInitialized(true);
      } catch (error: any) {
        Alert.alert(
          "Error de Conexión",
          "No se pudo conectar con la base de datos. Por favor, verifica tu conexión a internet e intenta nuevamente.",
          [{ text: "OK" }]
        );
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

  const groupHistoryByDate = () => {
    const enriched = intakes.map((record) => {
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
  };

  const filteredHistory = intakes.filter((record) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "taken") return record.status === IntakeStatus.TAKEN;
    if (selectedFilter === "missed") return record.status === IntakeStatus.MISSED;
    return true;
  });

  const groupedHistory = groupHistoryByDate();

  const handleClearAllData = () => {
    Alert.alert(
      "Limpiar todos los datos",
      "¿Estás seguro de que quieres limpiar todos los datos del historial? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar todo",
          style: "destructive",
          onPress: async () => {
            try {
              if (!patientId) return;
              const result = await dispatch(deleteAllIntakes(patientId)).unwrap();
              Alert.alert("Éxito", `Se han eliminado ${result.deleted} registros del historial`);
            } catch (error: any) {
              const errorMessage = error?.message || "No se pudieron eliminar los datos";
              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsMissed = async (recordId: string) => {
    try {
      await dispatch(updateIntakeStatus({ id: recordId, status: IntakeStatus.MISSED })).unwrap();
      Alert.alert("Actualizado", "El registro ha sido marcado como olvidado.");
    } catch (error: any) {
      const errorMessage = error?.message || "No se pudo actualizar el estado del registro.";
      Alert.alert("Error", errorMessage);
    }
  };

  const formatTime = (date: Date | string) => new Date(date).toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" });

  if (loading || !isInitialized) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.infoText}>
          {!isInitialized ? "Inicializando aplicación..." : "Cargando historial..."}
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Error de Conexión</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setIsInitialized(false)}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === "all" && styles.filterButtonAll]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text style={[styles.filterText, selectedFilter === "all" && styles.filterTextSelected]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === "taken" && styles.filterButtonTaken]}
            onPress={() => setSelectedFilter("taken")}
          >
            <Text style={[styles.filterText, selectedFilter === "taken" && styles.filterTextSelected]}>Tomados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === "missed" && styles.filterButtonMissed]}
            onPress={() => setSelectedFilter("missed")}
          >
            <Text style={[styles.filterText, selectedFilter === "missed" && styles.filterTextSelected]}>Olvidados</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.historyList}>
        {filteredHistory.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="time-outline" size={48} color="#9CA3AF" />
            <Text style={styles.infoText}>
              {selectedFilter === "all" ? "No hay registros en el historial" : selectedFilter === "taken" ? "No hay medicamentos tomados" : "No hay medicamentos olvidados"}
            </Text>
          </View>
        ) : (
          groupedHistory.map(([date, records]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{formatDate(date)}</Text>
              {records.map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordMain}>
                    <View style={[styles.statusIndicator, record.status === IntakeStatus.TAKEN ? styles.statusTaken : styles.statusMissed]} />
                    <View style={styles.recordDetails}>
                      <Text style={styles.medName}>{record.medication?.name || record.medicationName}</Text>
                      <Text style={styles.medDosage}>{record.medication?.dosage || record.dosage}</Text>
                      <Text style={styles.medTime}>{formatTime(record.scheduledTime)}</Text>
                    </View>
                    <View style={[styles.statusBadge, record.status === IntakeStatus.TAKEN ? styles.badgeTaken : styles.badgeMissed]}>
                      <Ionicons name={record.status === IntakeStatus.TAKEN ? "checkmark-circle" : "close-circle"} size={16} color={record.status === IntakeStatus.TAKEN ? "#10B981" : "#EF4444"} />
                      <Text style={[styles.badgeText, record.status === IntakeStatus.TAKEN ? styles.textTaken : styles.textMissed]}>
                        {record.status === IntakeStatus.TAKEN ? "Tomado" : "Olvidado"}
                      </Text>
                    </View>
                  </View>
                  {record.takenAt && <Text style={styles.takenAtText}>Tomado a las {formatTime(record.takenAt)}</Text>}
                  {record.status !== IntakeStatus.MISSED && (
                    <View style={styles.recordActions}>
                      <TouchableOpacity style={styles.missedButton} onPress={() => handleMarkAsMissed(record.id)}>
                        <Text style={styles.missedButtonText}>Marcar como olvidado</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
        {intakes.length > 0 && (
          <View style={styles.clearAllSection}>
            <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAllData}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.clearAllText}>Limpiar todo el historial</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    centered: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', padding: 24 },
    infoText: { color: '#4B5563', marginTop: 16, textAlign: 'center' },
    errorTitle: { color: '#B91C1C', marginTop: 16, textAlign: 'center', fontWeight: '600' },
    errorText: { color: '#4B5563', marginTop: 8, textAlign: 'center' },
    retryButton: { marginTop: 24, backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryButtonText: { color: 'white', fontWeight: '600' },
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
    filterBar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    filterScrollView: { gap: 8 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F3F4F6' },
    filterButtonAll: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
    filterButtonTaken: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
    filterButtonMissed: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
    filterText: { fontWeight: '600', color: '#374151' },
    filterTextSelected: { color: 'white' },
    historyList: { flex: 1, padding: 16 },
    dateGroup: { marginBottom: 24 },
    dateHeader: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 12 },
    recordCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    recordMain: { flexDirection: 'row', alignItems: 'center' },
    statusIndicator: { width: 4, height: 48, borderRadius: 2, marginRight: 12 },
    statusTaken: { backgroundColor: '#22C55E' },
    statusMissed: { backgroundColor: '#EF4444' },
    recordDetails: { flex: 1 },
    medName: { fontWeight: '600', color: '#111827', fontSize: 16 },
    medDosage: { color: '#4B5563', fontSize: 14 },
    medTime: { color: '#6B7280', fontSize: 14 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
    badgeTaken: { backgroundColor: '#D1FAE5' },
    badgeMissed: { backgroundColor: '#FEE2E2' },
    badgeText: { marginLeft: 4, fontSize: 14, fontWeight: '500' },
    textTaken: { color: '#065F46' },
    textMissed: { color: '#991B1B' },
    takenAtText: { color: '#6B7280', fontSize: 12, marginTop: 8, marginLeft: 16 },
    recordActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    missedButton: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: '#FCA5A5' },
    missedButtonText: { color: '#B91C1C', fontWeight: '600', fontSize: 14 },
    clearAllSection: { paddingVertical: 24 },
    clearAllButton: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    clearAllText: { color: '#B91C1C', fontWeight: '600', marginLeft: 8 },
});

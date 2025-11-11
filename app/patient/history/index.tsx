import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState, AppDispatch } from "../../../src/store";
import { fetchMedications } from "../../../src/store/slices/medicationsSlice";
import { startIntakesSubscription, stopIntakesSubscription, deleteAllIntakes, updateIntakeStatus } from "../../../src/store/slices/intakesSlice";
import { IntakeRecord, IntakeStatus } from "../../../src/types";
import { waitForFirebaseInitialization } from "../../../src/services/firebase";
// Real-time data is now handled by Redux intakesSlice

type EnrichedIntakeRecord = IntakeRecord & {
  medication?: {
    id: string;
    name: string;
    dosage: string;
  };
};

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { medications } = useSelector((state: RootState) => state.medications);
  
  const { intakes, loading, error } = useSelector((state: RootState) => state.intakes);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "taken" | "missed">("all");
  const [isInitialized, setIsInitialized] = useState(false);

  const patientId = user?.id;

  // Wait for Firebase initialization before starting subscriptions
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await waitForFirebaseInitialization();
        setIsInitialized(true);
      } catch (error: any) {
        console.error('[History] Firebase initialization error:', error);
        Alert.alert(
          t("patient.history.connectionError"),
          t("patient.history.connectionErrorMessage"),
          [{ text: t("patient.history.ok") }]
        );
      }
    };

    initializeApp();
  }, []);

  // Subscribe to real-time intakes via Redux slice (server-side ordered)
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

  // No longer load mock history; real-time subscription via Redux handles updates

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
      t("patient.history.clearAllDataTitle"),
      t("patient.history.clearAllDataMessage"),
      [
        {
          text: t("patient.history.cancel"),
          style: "cancel",
        },
        {
          text: t("patient.history.clearAll"),
          style: "destructive",
          onPress: async () => {
            try {
              if (!patientId) return;
              const result = await dispatch(deleteAllIntakes(patientId)).unwrap();
              Alert.alert(t("patient.history.success"), t("patient.history.deletedRecords", { count: result.deleted }));
            } catch (error: any) {
              console.error("Error clearing data:", error);
              const errorMessage = error?.message || t("patient.history.errorDeleting");
              Alert.alert(t("patient.history.error"), errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsMissed = async (recordId: string) => {
    try {
      await dispatch(updateIntakeStatus({ id: recordId, status: IntakeStatus.MISSED })).unwrap();
      Alert.alert(t("patient.history.updated"), t("patient.history.recordMarkedAsMissed"));
    } catch (error: any) {
      console.error("Error updating intake status:", error);
      const errorMessage = error?.message || t("patient.history.errorUpdating");
      Alert.alert(t("patient.history.error"), errorMessage);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("default", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("default", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || !isInitialized) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <Text className="text-gray-600">
          {!isInitialized ? t("patient.history.initializing") : t("patient.history.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center px-6">
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text className="text-red-600 mt-4 text-center font-semibold">
          {t("patient.history.connectionError")}
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error}
        </Text>
        <TouchableOpacity
          className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
          onPress={() => {
            // Reset the initialization state to trigger a retry
            setIsInitialized(false);
            // This will trigger the initialization useEffect again
          }}
        >
          <Text className="text-white font-semibold">{t("patient.history.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3"
          >
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-gray-900">{t("patient.history.title")}</Text>
        </View>
      </View>

      {/* Filters */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-2"
        >
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              selectedFilter === "all"
                ? "bg-green-600"
                : "bg-gray-200 border border-gray-300"
            }`}
            onPress={() => setSelectedFilter("all")}
            activeOpacity={selectedFilter === "all" ? 0.8 : 1}
            accessibilityRole="button"
            accessibilityLabel={t("patient.history.showAll")}
            accessibilityState={selectedFilter === "all" ? { selected: true } : undefined}
          >
            <Text
              className={`font-semibold ${
                selectedFilter === "all" ? "text-white" : "text-gray-700"
              }`}
            >
              {t("patient.history.all")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              selectedFilter === "taken"
                ? "bg-green-600"
                : "bg-gray-200 border border-gray-300"
            }`}
            onPress={() => setSelectedFilter("taken")}
            activeOpacity={selectedFilter === "taken" ? 0.8 : 1}
            accessibilityRole="button"
            accessibilityLabel={t("patient.history.showTaken")}
            accessibilityState={selectedFilter === "taken" ? { selected: true } : undefined}
          >
            <Text
              className={`font-semibold ${
                selectedFilter === "taken" ? "text-white" : "text-gray-700"
              }`}
            >
              {t("patient.history.taken")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              selectedFilter === "missed"
                ? "bg-red-600"
                : "bg-gray-200 border border-gray-300"
            }`}
            onPress={() => setSelectedFilter("missed")}
            activeOpacity={selectedFilter === "missed" ? 0.8 : 1}
            accessibilityRole="button"
            accessibilityLabel={t("patient.history.showMissed")}
            accessibilityState={selectedFilter === "missed" ? { selected: true } : undefined}
          >
            <Text
              className={`font-semibold ${
                selectedFilter === "missed" ? "text-white" : "text-gray-700"
              }`}
            >
              {t("patient.history.missed")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* History List */}
      <ScrollView className="flex-1 px-4 py-4">
        {filteredHistory.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="time-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              {selectedFilter === "all"
                ? t("patient.history.noRecords")
                : selectedFilter === "taken"
                ? t("patient.history.noTaken")
                : t("patient.history.noMissed")}
            </Text>
          </View>
        ) : (
          groupedHistory.map(([date, records]) => (
            <View key={date} className="mb-6">
              <Text className="text-sm font-semibold text-gray-600 mb-3">
                {formatDate(date)}
              </Text>
              {records.map((record) => (
                <View
                  key={record.id}
                  className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
                >
                  <View className="flex-row items-center">
                    {/* Status indicator */}
                    <View
                      className={`w-1 h-12 rounded-full mr-3 ${
                        record.status === IntakeStatus.TAKEN
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    
                    {/* Medication info */}
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 text-base">
                        {record.medication?.name || record.medicationName}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {record.medication?.dosage || record.dosage}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {formatTime(record.scheduledTime)}
                      </Text>
                    </View>
                    
                    {/* Status badge */}
                    <View
                      className={`px-3 py-1 rounded-full flex-row items-center ${
                        record.status === IntakeStatus.TAKEN
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <Ionicons
                        name={record.status === IntakeStatus.TAKEN ? "checkmark-circle" : "close-circle"}
                        size={16}
                        color={record.status === IntakeStatus.TAKEN ? "#10B981" : "#EF4444"}
                      />
                      <Text
                        className={`ml-1 text-sm font-medium ${
                          record.status === IntakeStatus.TAKEN ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {record.status === IntakeStatus.TAKEN ? t("patient.history.taken") : t("patient.history.missed")}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Taken time if available */}
                  {record.takenAt && (
                    <Text className="text-gray-500 text-xs mt-2 ml-4">
                      {t("patient.history.takenAt", { time: formatTime(record.takenAt) })}
                    </Text>
                  )}

                  {/* Actions */}
                  {record.status !== IntakeStatus.MISSED && (
                    <View className="flex-row justify-end mt-3">
                      <TouchableOpacity
                        className="px-3 py-1 rounded-full border border-red-300"
                        onPress={() => handleMarkAsMissed(record.id)}
                      >
                        <Text className="text-red-600 font-semibold text-sm">
                          {t("patient.history.markAsMissed")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}

        {/* Clear data button */}
        {intakes.length > 0 && (
          <View className="py-6">
            <TouchableOpacity
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center justify-center"
              onPress={handleClearAllData}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text className="text-red-600 font-semibold ml-2">
                {t("patient.history.clearHistory")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

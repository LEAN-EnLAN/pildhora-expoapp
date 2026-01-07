/**
 * PatientSelector Component
 * 
 * Horizontal scrollable list of patient chips for multi-patient support.
 * Allows caregivers to switch between multiple patients they manage.
 * 
 * Features:
 * - Horizontal scrollable list of patient chips
 * - Selected state highlighting
 * - Patient name and device status indicator
 * - Smooth scroll animations
 * - Empty state handling
 * - Persistent selection via AsyncStorage
 * - Automatic data refresh on patient change
 * 
 * @example
 * <PatientSelector
 *   patients={patients}
 *   selectedPatientId={selectedId}
 *   onSelectPatient={handleSelectPatient}
 *   loading={false}
 * />
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import { PatientWithDevice } from '../../types';
import { useDeviceState } from '../../hooks/useDeviceState';

// AsyncStorage key for persisting selected patient
const SELECTED_PATIENT_KEY = '@caregiver_selected_patient_id';

export interface PatientSelectorProps {
  /** Array of patients with optional device state */
  patients: PatientWithDevice[];
  /** Currently selected patient ID */
  selectedPatientId?: string;
  /** Callback when a patient is selected */
  onSelectPatient: (patientId: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Callback when data should be refreshed */
  onRefresh?: () => void;
}

export default function PatientSelector({
  patients,
  selectedPatientId,
  onSelectPatient,
  loading = false,
  onRefresh,
}: PatientSelectorProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Load last selected patient from AsyncStorage on mount
   */
  useEffect(() => {
    loadLastSelectedPatient();
  }, []);

  /**
   * Fade in animation when component mounts
   */
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  /**
   * Load the last selected patient ID from AsyncStorage
   */
  const loadLastSelectedPatient = async () => {
    try {
      const savedPatientId = await AsyncStorage.getItem(SELECTED_PATIENT_KEY);

      if (savedPatientId && patients.length > 0) {
        // Check if the saved patient ID exists in current patients list
        const patientExists = patients.some(p => p.id === savedPatientId);

        if (patientExists && savedPatientId !== selectedPatientId) {
          onSelectPatient(savedPatientId);
        } else if (!patientExists && patients.length > 0 && !selectedPatientId) {
          // If saved patient doesn't exist, select first patient
          onSelectPatient(patients[0].id);
        }
      } else if (patients.length > 0 && !selectedPatientId) {
        // No saved selection, select first patient
        onSelectPatient(patients[0].id);
      }
    } catch (error) {
      console.error('[PatientSelector] Failed to load last selected patient:', error);
      // Fallback to first patient if error occurs
      if (patients.length > 0 && !selectedPatientId) {
        onSelectPatient(patients[0].id);
      }
    }
  };

  /**
   * Save selected patient ID to AsyncStorage
   */
  const saveSelectedPatient = async (patientId: string) => {
    try {
      await AsyncStorage.setItem(SELECTED_PATIENT_KEY, patientId);
    } catch (error) {
      console.error('[PatientSelector] Failed to save selected patient:', error);
    }
  };

  /**
   * Handle patient chip press
   */
  const handlePatientPress = useCallback((patientId: string) => {
    if (patientId === selectedPatientId) {
      return; // Already selected
    }

    // Save to AsyncStorage (non-blocking)
    saveSelectedPatient(patientId);

    // Update selection immediately for smooth transition
    onSelectPatient(patientId);

    // Note: We don't trigger onRefresh here to prevent reloading
    // The dashboard will handle data fetching based on selectedPatientId change
  }, [selectedPatientId, onSelectPatient]);

  /**
   * Render empty state
   */
  if (!loading && patients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color={colors.gray[400]} />
        <Text style={styles.emptyTitle}>No hay pacientes vinculados</Text>
        <Text style={styles.emptyDescription}>
          Vincula un dispositivo para comenzar a gestionar pacientes
        </Text>
      </View>
    );
  }

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Cargando pacientes...</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={styles.label}>Pacientes</Text>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        accessible={true}
        accessibilityLabel="Patient selector"
        accessibilityHint="Scroll horizontally to view and select patients"
      >
        {patients.map((patient, index) => {
          const isSelected = patient.id === selectedPatientId;

          return (
            <PatientChip
              key={patient.id}
              patient={patient}
              isSelected={isSelected}
              onPress={() => handlePatientPress(patient.id)}
              isFirst={index === 0}
              isLast={index === patients.length - 1}
            />
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

/**
 * PatientChip Component
 * Individual patient chip with selection state and device status
 */
interface PatientChipProps {
  patient: PatientWithDevice;
  isSelected: boolean;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function PatientChip({
  patient,
  isSelected,
  onPress,
  isFirst,
  isLast,
}: PatientChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Fetch real-time device state
  const { deviceState } = useDeviceState({
    deviceId: patient.deviceId,
    enabled: !!patient.deviceId
  });

  // Determine status color based on real-time state or fallback to patient data
  const statusColor = useMemo(() => {
    if (!patient.deviceId) return colors.gray[400];

    // Use real-time state if available
    if (deviceState) {
      return deviceState.is_online ? colors.success[500] : colors.gray[400];
    }

    // Fallback to passed patient data
    if (patient.deviceState) {
      return patient.deviceState.is_online ? colors.success[500] : colors.gray[400];
    }

    return colors.gray[400];
  }, [patient.deviceId, patient.deviceState, deviceState]);

  // Determine status text
  const statusText = useMemo(() => {
    if (!patient.deviceId) return 'Sin dispositivo';

    // Use real-time state if available
    if (deviceState) {
      return deviceState.is_online ? 'En línea' : 'Desconectado';
    }

    // Fallback to passed patient data
    if (patient.deviceState) {
      return patient.deviceState.is_online ? 'En línea' : 'Desconectado';
    }

    return 'Estado desconocido';
  }, [patient.deviceId, patient.deviceState, deviceState]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        isFirst && { marginLeft: 0 },
        isLast && { marginRight: 0 },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          isSelected && styles.chipSelected,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Patient ${patient.name}`}
        accessibilityHint={`${isSelected ? 'Currently selected' : 'Tap to select'} patient ${patient.name}. Device status: ${statusText}`}
        accessibilityState={{ selected: isSelected }}
        accessible={true}
      >
        {/* Patient info */}
        <View style={styles.chipContent}>
          <View style={styles.chipHeader}>
            <Text
              style={[
                styles.chipName,
                isSelected && styles.chipNameSelected,
              ]}
              numberOfLines={1}
            >
              {patient.name}
            </Text>

            {/* Device status indicator */}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor },
              ]}
              accessible={true}
              accessibilityLabel={`Device status: ${statusText}`}
            />
          </View>

          {/* Device status text */}
          <Text
            style={[
              styles.chipStatus,
              isSelected && styles.chipStatusSelected,
            ]}
            numberOfLines={1}
          >
            {statusText}
          </Text>
        </View>

        {/* Selected indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    paddingLeft: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    minWidth: 150,
    maxWidth: 180,
    ...shadows.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
    ...shadows.colored.primary,
  },
  chipContent: {
    gap: spacing.xs,
  },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chipName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    flex: 1,
  },
  chipNameSelected: {
    color: colors.surface,
  },
  chipStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[500],
  },
  chipStatusSelected: {
    color: colors.primary[100],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  emptyContainer: {
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
});

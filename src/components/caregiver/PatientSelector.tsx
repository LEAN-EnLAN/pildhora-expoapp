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

import React, { useEffect, useRef, useCallback } from 'react';
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
   * Get device status indicator color
   */
  const getDeviceStatusColor = (patient: PatientWithDevice): string => {
    if (!patient.deviceId || !patient.deviceState) {
      return colors.gray[400]; // No device
    }
    
    return patient.deviceState.is_online ? colors.success[500] : colors.gray[400];
  };

  /**
   * Get device status text
   */
  const getDeviceStatusText = (patient: PatientWithDevice): string => {
    if (!patient.deviceId) {
      return 'Sin dispositivo';
    }
    
    if (!patient.deviceState) {
      return 'Estado desconocido';
    }
    
    return patient.deviceState.is_online ? 'En línea' : 'Desconectado';
  };

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
          const statusColor = getDeviceStatusColor(patient);
          const statusText = getDeviceStatusText(patient);

          return (
            <PatientChip
              key={patient.id}
              patient={patient}
              isSelected={isSelected}
              statusColor={statusColor}
              statusText={statusText}
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
  statusColor: string;
  statusText: string;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function PatientChip({
  patient,
  isSelected,
  statusColor,
  statusText,
  onPress,
  isFirst,
  isLast,
}: PatientChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    paddingLeft: spacing.md,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  chip: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
    minWidth: 160,
    maxWidth: 200,
    ...shadows.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
    ...shadows.md,
  },
  chipContent: {
    gap: spacing.xs,
  },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  chipName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    flex: 1,
  },
  chipNameSelected: {
    color: colors.primary[700],
  },
  chipStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
  },
  chipStatusSelected: {
    color: colors.primary[600],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  emptyContainer: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
    color: colors.gray[600],
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  loadingContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
});

import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { MedicationWizard, MedicationFormData } from '../../../../src/components/patient/medication-wizard';
import { addMedication } from '../../../../src/store/slices/medicationsSlice';
import { AppDispatch, RootState } from '../../../../src/store';
import { Medication } from '../../../../src/types';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../src/theme/tokens';
import { getPatientById } from '../../../../src/services/firebase/user';
import { createAndEnqueueEvent } from '../../../../src/services/medicationEventService';

export default function CaregiverAddMedicationScreen() {
  const { patientId } = useLocalSearchParams();
  const pid = Array.isArray(patientId) ? patientId[0] : patientId;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientName, setPatientName] = useState<string>('');

  // Fetch patient name for event generation
  useEffect(() => {
    const loadPatientName = async () => {
      if (pid) {
        try {
          const patient = await getPatientById(pid);
          if (patient) {
            setPatientName(patient.name);
          }
        } catch (err) {
          console.error('[CaregiverAddMedicationScreen] Error loading patient:', err);
        }
      }
    };
    loadPatientName();
  }, [pid]);

  // Handle navigation back
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(async (formData: MedicationFormData) => {
    if (!user?.id || !pid) {
      Alert.alert('Error', 'Información de usuario o paciente no disponible');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare medication data from wizard form data
      const medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        emoji: formData.emoji,
        doseValue: formData.doseValue,
        doseUnit: formData.doseUnit,
        quantityType: formData.quantityType,
        times: formData.times,
        frequency: formData.frequency.join(', '),
        nativeAlarmIds: formData.nativeAlarmIds || [],
        patientId: pid,
        caregiverId: user.id, // Caregiver ID
        trackInventory: formData.initialQuantity !== undefined,
        currentQuantity: formData.initialQuantity,
        initialQuantity: formData.initialQuantity,
        lowQuantityThreshold: formData.lowQuantityThreshold,
      };

      // Dispatch the add medication action (this will save to Firestore)
      const result = await dispatch(addMedication(medicationData)).unwrap();

      // Generate medication created event with patient name
      if (patientName && result.id) {
        try {
          await createAndEnqueueEvent(
            { ...result, caregiverId: user.id } as Medication,
            patientName,
            'created'
          );        } catch (eventError) {
          // Log event creation error but don't fail the medication creation
          console.error('[CaregiverAddMedicationScreen] Failed to create medication event:', eventError);
        }
      }

      // Show success message
      Alert.alert(
        'Éxito',
        'Medicamento agregado correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('[CaregiverAddMedicationScreen] Error adding medication:', error);
      
      // Show error with retry option
      Alert.alert(
        'Error',
        error.message || 'No se pudo guardar el medicamento. Por favor intenta de nuevo.',
        [
          {
            text: 'Reintentar',
            onPress: () => handleWizardComplete(formData),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [user, pid, dispatch, router, patientName]);

  // Handle wizard cancellation
  const handleWizardCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Volver"
            accessibilityHint="Regresa a la pantalla anterior"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agregar Medicamento</Text>
        </View>
      </View>

      {/* Medication Wizard */}
      <View 
        style={{ flex: 1 }}
        accessibilityLabel="Formulario de agregar medicamento"
        accessibilityHint="Completa los pasos para agregar un nuevo medicamento al paciente"
      >
        <MedicationWizard
          mode="add"
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
});

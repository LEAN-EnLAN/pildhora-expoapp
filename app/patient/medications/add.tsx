import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { MedicationWizard, MedicationFormData } from '../../../src/components/patient/medication-wizard';
import { addMedication } from '../../../src/store/slices/medicationsSlice';
import { AppDispatch, RootState } from '../../../src/store';
import { Medication } from '../../../src/types';
import { AppBar } from '../../../src/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/theme/tokens';

export default function AddMedicationScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle navigation back
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(async (formData: MedicationFormData) => {
    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado');
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
        patientId: user.id,
        caregiverId: user.id, // For now, patient is their own caregiver
        trackInventory: formData.initialQuantity !== undefined,
        currentQuantity: formData.initialQuantity,
        initialQuantity: formData.initialQuantity,
        lowQuantityThreshold: formData.lowQuantityThreshold,
      };

      // Dispatch the add medication action
      const result = await dispatch(addMedication(medicationData)).unwrap();

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
      console.error('[AddMedicationScreen] Error adding medication:', error);
      
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
  }, [user, dispatch, router]);

  // Handle wizard cancellation
  const handleWizardCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <AppBar
        title="Agregar Medicamento"
        showBackButton={true}
        onBackPress={handleBack}
      />

      {/* Medication Wizard */}
      <MedicationWizard
        mode="add"
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
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
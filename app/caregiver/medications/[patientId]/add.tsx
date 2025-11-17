import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MedicationWizard, MedicationFormData } from '../../../../src/components/patient/medication-wizard';
import { ScreenWrapper } from '../../../../src/components/caregiver';
import { addMedication } from '../../../../src/store/slices/medicationsSlice';
import { AppDispatch, RootState } from '../../../../src/store';
import { Medication } from '../../../../src/types';
import { colors } from '../../../../src/theme/tokens';
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
    <ScreenWrapper applyBottomPadding={true}>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Alert, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../../src/store';
import { updateMedication, deleteMedication, fetchMedications } from '../../../../src/store/slices/medicationsSlice';
import { MedicationWizard, MedicationFormData } from '../../../../src/components/patient/medication-wizard';
import { MedicationDetailView } from '../../../../src/components/screens/patient/MedicationDetailView';
import { DeleteMedicationDialog } from '../../../../src/components/ui';
import { ScreenWrapper } from '../../../../src/components/caregiver';
import { Medication } from '../../../../src/types';
import { colors, spacing, typography } from '../../../../src/theme/tokens';
import { getPatientById } from '../../../../src/services/firebase/user';
import { createAndEnqueueEvent } from '../../../../src/services/medicationEventService';

export default function CaregiverMedicationDetailScreen() {
  const { id, patientId } = useLocalSearchParams();
  const medId = Array.isArray(id) ? id[0] : id;
  const pid = Array.isArray(patientId) ? patientId[0] : patientId;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const medication = useSelector((state: RootState) => 
    state.medications.medications.find(m => m.id === medId)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
          console.error('[CaregiverMedicationDetailScreen] Error loading patient:', err);
        }
      }
    };
    loadPatientName();
  }, [pid]);

  // Handle edit button press
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle delete button press - show enhanced dialog
  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  // Handle confirmed deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!medication?.id || !user?.id) {
      return;
    }

    try {
      // Generate deletion event before deleting
      if (patientName) {
        try {
          await createAndEnqueueEvent(
            { ...medication, caregiverId: user.id } as Medication,
            patientName,
            'deleted'
          );
        } catch (eventError) {
          // Log event creation error but don't fail the medication deletion
          console.error('[CaregiverMedicationDetailScreen] Failed to create medication event:', eventError);
        }
      }

      // Delete the medication
      await dispatch(deleteMedication(medication.id)).unwrap();
      setShowDeleteDialog(false);
      Alert.alert('Éxito', 'Medicamento eliminado correctamente');
      router.back();
    } catch (error: any) {
      console.error('[CaregiverMedicationDetailScreen] Error deleting medication:', error);
      setShowDeleteDialog(false);
      Alert.alert('Error', error.message || 'No se pudo eliminar el medicamento');
    }
  }, [medication, dispatch, router, patientName, user]);

  // Handle refill complete
  const handleRefillComplete = useCallback(() => {
    // Refresh medications to get updated inventory
    if (pid) {
      dispatch(fetchMedications(pid));
    }
  }, [pid, dispatch]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(async (formData: MedicationFormData) => {
    if (!medication?.id || !user?.id) {
      Alert.alert('Error', 'Medicamento no encontrado');
      return;
    }

    try {
      // Prepare medication updates from wizard form data
      const updates: Partial<Medication> = {};
      
      // Check each field and only include if changed
      if (formData.name !== medication.name) {
        updates.name = formData.name;
      }
      
      if (formData.emoji !== medication.emoji) {
        updates.emoji = formData.emoji;
      }
      
      if (formData.doseValue !== medication.doseValue) {
        updates.doseValue = formData.doseValue;
      }
      
      if (formData.doseUnit !== medication.doseUnit) {
        updates.doseUnit = formData.doseUnit;
      }
      
      if (formData.quantityType !== medication.quantityType) {
        updates.quantityType = formData.quantityType;
      }
      
      // Compare arrays for times
      const timesChanged = JSON.stringify(formData.times) !== JSON.stringify(medication.times);
      if (timesChanged) {
        updates.times = formData.times;
      }
      
      // Compare frequency
      const currentFrequency = medication.frequency || '';
      const newFrequency = formData.frequency.join(', ');
      if (newFrequency !== currentFrequency) {
        updates.frequency = newFrequency;
      }
      
      // Update alarms if schedule changed
      if (timesChanged || newFrequency !== currentFrequency || formData.name !== medication.name || formData.emoji !== medication.emoji) {
        updates.nativeAlarmIds = formData.nativeAlarmIds || [];
      }
      
      // If no fields changed, just exit edit mode
      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      // Dispatch the update medication action
      await dispatch(updateMedication({ id: medication.id, updates })).unwrap();

      // Generate medication updated event with patient name
      if (patientName) {
        try {
          const updatedMedication = { ...medication, ...updates, caregiverId: user.id } as Medication;
          await createAndEnqueueEvent(
            { ...medication, caregiverId: user.id } as Medication,
            patientName,
            'updated',
            updatedMedication
          );        } catch (eventError) {
          // Log event creation error but don't fail the medication update
          console.error('[CaregiverMedicationDetailScreen] Failed to create medication event:', eventError);
        }
      }

      // Show success message and exit edit mode
      Alert.alert('Éxito', 'Medicamento actualizado correctamente');
      setIsEditing(false);
    } catch (error: any) {
      console.error('[CaregiverMedicationDetailScreen] Error updating medication:', error);
      
      // Show error with retry option
      Alert.alert(
        'Error',
        error.message || 'No se pudo actualizar el medicamento. Por favor intenta de nuevo.',
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
    }
  }, [medication, dispatch, patientName, user]);

  // Handle wizard cancellation
  const handleWizardCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Show error if medication not found
  if (!medication) {
    return (
      <ScreenWrapper applyBottomPadding={true}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Medicamento no encontrado</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Show wizard when editing
  if (isEditing) {
    return (
      <ScreenWrapper applyBottomPadding={true}>
        <MedicationWizard
          mode="edit"
          medication={medication}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </ScreenWrapper>
    );
  }

  // Show detail view by default
  return (
    <ScreenWrapper applyBottomPadding={true}>
      <MedicationDetailView
        medication={medication}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefillComplete={handleRefillComplete}
      />
      <DeleteMedicationDialog
        visible={showDeleteDialog}
        medication={medication}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error[500],
    textAlign: 'center',
  },
});

import React, { useCallback, useState } from 'react';
import { StyleSheet, Alert, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../src/store';
import { updateMedication, deleteMedication, fetchMedications } from '../../../src/store/slices/medicationsSlice';
import { MedicationWizard, MedicationFormData } from '../../../src/components/patient/medication-wizard';
import { MedicationDetailView } from '../../../src/components/screens/patient/MedicationDetailView';
import { DeleteMedicationDialog, AppBar } from '../../../src/components/ui';
import { Medication } from '../../../src/types';
import { colors, spacing, typography } from '../../../src/theme/tokens';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const medId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const medication = useSelector((state: RootState) => 
    state.medications.medications.find(m => m.id === medId)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    if (!medication?.id) {
      return;
    }

    try {
      await dispatch(deleteMedication(medication.id)).unwrap();
      setShowDeleteDialog(false);
      Alert.alert('Éxito', 'Medicamento eliminado correctamente');
      router.back();
    } catch (error: any) {
      console.error('[MedicationDetailScreen] Error deleting medication:', error);
      setShowDeleteDialog(false);
      Alert.alert('Error', error.message || 'No se pudo eliminar el medicamento');
    }
  }, [medication, dispatch, router]);

  // Handle refill complete
  const handleRefillComplete = useCallback(() => {
    // Refresh medications to get updated inventory
    if (user?.id) {
      dispatch(fetchMedications(user.id));
    }
  }, [user?.id, dispatch]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(async (formData: MedicationFormData) => {
    if (!medication?.id) {
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

      // Show success message and exit edit mode
      Alert.alert('Éxito', 'Medicamento actualizado correctamente');
      setIsEditing(false);
    } catch (error: any) {
      console.error('[MedicationDetailScreen] Error updating medication:', error);
      
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
  }, [medication, dispatch]);

  // Handle wizard cancellation
  const handleWizardCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Show error if medication not found
  if (!medication) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <AppBar
          title="Detalles"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Medicamento no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show wizard when editing
  if (isEditing) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <AppBar
          title="Editar Medicamento"
          showBackButton={true}
          onBackPress={handleWizardCancel}
        />
        <MedicationWizard
          mode="edit"
          medication={medication}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </SafeAreaView>
    );
  }

  // Show detail view by default
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <AppBar
        title="Detalles del medicamento"
        showBackButton={true}
        onBackPress={() => router.back()}
      />
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
    </SafeAreaView>
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

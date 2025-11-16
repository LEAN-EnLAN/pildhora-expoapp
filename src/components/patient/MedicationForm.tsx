import React, { useEffect, useState } from 'react';
import { ScrollView, Alert, StyleSheet, View, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addMedication, updateMedication, deleteMedication } from '../../store/slices/medicationsSlice';
import { Medication, DOSE_UNITS, QUANTITY_TYPES } from '../../types';
import { useRouter } from 'expo-router';
import MedicationNameInput from './medication-form/MedicationNameInput';
import DoseInputContainer from './medication-form/DoseInputContainer';
import QuantityTypeSelector from './medication-form/QuantityTypeSelector';
import ReminderTimePicker from './medication-form/ReminderTimePicker';
import ReminderDaysSelector from './medication-form/ReminderDaysSelector';
import { Button, Card, Container, Modal } from '../ui';
import { colors, spacing, typography } from '../../theme/tokens';
import { LowQuantityBanner } from '../screens/patient/LowQuantityBanner';
import { RefillDialog } from '../screens/patient/RefillDialog';
import { inventoryService } from '../../services/inventoryService';

type Mode = 'add' | 'edit';

interface Props {
  mode: Mode;
  medication?: Medication | undefined;
  onDelete?: () => void;
  patientIdOverride?: string;
  caregiverIdOverride?: string;
}

interface FormState {
  name: string;
  doseValue: string;
  doseUnit: string;
  quantityTypes: string[];
  reminderTimes: string[];
  reminderDays: string[];
}

interface FormErrors {
  name?: string;
  doseValue?: string;
  doseUnit?: string;
  quantityTypes?: string;
  reminderTimes?: string;
  reminderDays?: string;
}

export default function MedicationForm({ mode, medication, onDelete, patientIdOverride, caregiverIdOverride }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const patientId = patientIdOverride || user?.id;
  const caregiverId = caregiverIdOverride || (user?.role === 'caregiver' ? user.id : '');

  const [form, setForm] = useState<FormState>({
    name: '',
    doseValue: '',
    doseUnit: '',
    quantityTypes: [],
    reminderTimes: ['08:00'],
    reminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRefillDialog, setShowRefillDialog] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState<{
    currentQuantity: number;
    isLow: boolean;
    daysRemaining: number;
    estimatedRunOutDate: Date;
  } | null>(null);

  // Migration function for backward compatibility
  const migrateMedicationData = (medication: any): FormState => {
    // Check if already using new format
    if (medication.doseValue && medication.doseUnit) {
      return {
        name: medication.name || '',
        doseValue: medication.doseValue || '',
        doseUnit: medication.doseUnit || '',
        quantityTypes: medication.quantityType ? [medication.quantityType] : [],
        reminderTimes: medication.times || ['08:00'],
        reminderDays: medication.frequency ? medication.frequency.split(',').map((s: string) => s.trim()) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      };
    }

    // Parse legacy dosage format
    if (medication.dosage && medication.dosage.includes(',')) {
      const [dosePart, quantityPart] = medication.dosage.split(',').map((s: string) => s.trim());

      // Extract dose value and unit
      const doseMatch = dosePart.match(/^([\d.]+)\s*([a-zA-Z%]+)?$/);
      const doseValue = doseMatch?.[1] || dosePart;
      const doseUnit = doseMatch?.[2] || 'mg';

      return {
        name: medication.name || '',
        doseValue,
        doseUnit,
        quantityTypes: [quantityPart || 'Tablets'],
        reminderTimes: medication.times || ['08:00'],
        reminderDays: medication.frequency ? medication.frequency.split(',').map((s: string) => s.trim()) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      };
    }

    // Fallback for unknown formats
    return {
      name: medication.name || '',
      doseValue: medication.dosage || '',
      doseUnit: 'mg',
      quantityTypes: ['Tablets'],
      reminderTimes: medication.times || ['08:00'],
      reminderDays: medication.frequency ? medication.frequency.split(',').map((s: string) => s.trim()) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    };
  };

  // Prefill when editing
  useEffect(() => {
    if (mode === 'edit' && medication) {
      setForm(migrateMedicationData(medication));
    }
  }, [mode, medication?.id]);

  // Load inventory status when editing
  useEffect(() => {
    const loadInventoryStatus = async () => {
      if (mode === 'edit' && medication?.id && medication.trackInventory) {
        try {
          const status = await inventoryService.getInventoryStatus(medication.id);
          setInventoryStatus(status);
        } catch (error) {
          console.error('[MedicationForm] Error loading inventory status:', error);
        }
      }
    };

    loadInventoryStatus();
  }, [mode, medication?.id, medication?.trackInventory]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'El nombre del medicamento es requerido';
    } else if (form.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Dose validation
    if (!form.doseValue.trim()) {
      newErrors.doseValue = 'El valor de la dosis es requerido';
    } else if (!/^\d*\.?\d{0,2}$/.test(form.doseValue)) {
      newErrors.doseValue = 'Por favor ingrese un valor de dosis válido';
    }

    // Unit validation
    if (!form.doseUnit) {
      newErrors.doseUnit = 'Por favor seleccione una unidad de dosis';
    }

    // Quantity type validation
    if (form.quantityTypes.length === 0) {
      newErrors.quantityTypes = 'Por favor seleccione un tipo de medicamento';
    }

    // Time validation
    if (form.reminderTimes.length === 0) {
      newErrors.reminderTimes = 'Por favor seleccione al menos una hora de recordatorio';
    }

    // Days validation
    if (form.reminderDays.length === 0) {
      newErrors.reminderDays = 'Por favor seleccione al menos un día';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitForm = async () => {
    if (!patientId) {
      Alert.alert('Error', 'Información de usuario no disponible');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrija los errores en el formulario');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare medication data with new format
      const medicationData = {
        name: form.name.trim(),
        doseValue: form.doseValue,
        doseUnit: form.doseUnit,
        quantityType: form.quantityTypes[0], // For now, use first selected type
        isCustomQuantityType: !QUANTITY_TYPES.some(t => t.label === form.quantityTypes[0]),
        frequency: form.reminderDays.join(', '),
        times: form.reminderTimes,
        patientId,
        caregiverId,
        // Keep legacy dosage field for backward compatibility
        dosage: `${form.doseValue}${form.doseUnit}, ${form.quantityTypes[0]}`,
        // Inventory tracking - default to false for new medications
        trackInventory: medication?.trackInventory || false,
      };

      if (mode === 'add') {
        const newMed: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = medicationData;
        await dispatch(addMedication(newMed));
      } else if (mode === 'edit' && medication?.id) {
        const updates: Partial<Medication> = medicationData;
        await dispatch(updateMedication({ id: medication.id, updates }));
      }

      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el medicamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePress = () => {
    if (mode !== 'edit' || !medication?.id) return;
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!medication?.id) return;
    
    setShowDeleteModal(false);
    
    try {
      await dispatch(deleteMedication(medication.id));
      if (onDelete) onDelete();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el medicamento');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleRefillConfirm = async (newQuantity: number) => {
    if (!medication?.id) return;

    try {
      await inventoryService.refillInventory(medication.id, newQuantity);
      
      // Reload inventory status
      const status = await inventoryService.getInventoryStatus(medication.id);
      setInventoryStatus(status);
      
      setShowRefillDialog(false);
    } catch (error) {
      console.error('[MedicationForm] Error refilling inventory:', error);
      throw error;
    }
  };

  const handleRefillCancel = () => {
    setShowRefillDialog(false);
  };

  return (
    <Container>
      <ScrollView>
        <Card>
          {/* Low Quantity Banner - Only show in edit mode with inventory tracking */}
          {mode === 'edit' && 
           medication?.trackInventory && 
           inventoryStatus?.isLow && 
           medication.lowQuantityThreshold !== undefined && (
            <LowQuantityBanner
              currentQuantity={inventoryStatus.currentQuantity}
              threshold={medication.lowQuantityThreshold}
              daysRemaining={inventoryStatus.daysRemaining}
              onRefill={() => setShowRefillDialog(true)}
            />
          )}

          {/* Medication Name */}
          <MedicationNameInput
            value={form.name}
            onChangeText={(text) => setForm((s) => ({ ...s, name: text }))}
            error={errors.name}
          />

          {/* Dose Input */}
          <DoseInputContainer
            doseValue={form.doseValue}
            doseUnit={form.doseUnit}
            onDoseValueChange={(value) => setForm((s) => ({ ...s, doseValue: value }))}
            onDoseUnitChange={(unit) => setForm((s) => ({ ...s, doseUnit: unit }))}
            doseValueError={errors.doseValue}
            doseUnitError={errors.doseUnit}
          />

          {/* Quantity Type Selector */}
          <QuantityTypeSelector
            selectedTypes={form.quantityTypes}
            onTypesChange={(types) => setForm((s) => ({ ...s, quantityTypes: types }))}
            error={errors.quantityTypes}
          />

          {/* Reminder Time Picker */}
          <ReminderTimePicker
            times={form.reminderTimes}
            onTimesChange={(times) => setForm((s) => ({ ...s, reminderTimes: times }))}
            error={errors.reminderTimes}
          />

          {/* Reminder Days Selector */}
          <ReminderDaysSelector
            selectedDays={form.reminderDays}
            onDaysChange={(days) => setForm((s) => ({ ...s, reminderDays: days }))}
            error={errors.reminderDays}
          />

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Button
              onPress={handleCancel}
              variant="secondary"
              size="lg"
              style={styles.actionButton}
              accessibilityLabel="Cancelar"
              accessibilityHint="Cancela la edición y regresa a la pantalla anterior"
            >
              Cancelar
            </Button>
            <Button
              onPress={submitForm}
              variant="primary"
              size="lg"
              loading={isSubmitting}
              style={styles.actionButton}
              accessibilityLabel={mode === 'add' ? 'Guardar medicamento' : 'Actualizar medicamento'}
              accessibilityHint={mode === 'add' ? 'Guarda el nuevo medicamento' : 'Guarda los cambios del medicamento'}
            >
              {mode === 'add' ? 'Guardar' : 'Actualizar'}
            </Button>
          </View>
        </Card>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={handleDeleteCancel}
        title="Eliminar Medicamento"
        size="sm"
        animationType="slide"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalMessage}>
            ¿Estás seguro de que quieres eliminar este medicamento? Esta acción no se puede deshacer.
          </Text>
          <View style={styles.modalActions}>
            <Button
              onPress={handleDeleteCancel}
              variant="secondary"
              size="md"
              style={styles.modalButton}
              accessibilityLabel="Cancelar eliminación"
              accessibilityHint="Cierra el diálogo sin eliminar el medicamento"
            >
              Cancelar
            </Button>
            <Button
              onPress={handleDeleteConfirm}
              variant="danger"
              size="md"
              style={styles.modalButton}
              accessibilityLabel="Confirmar eliminación"
              accessibilityHint="Elimina permanentemente el medicamento"
            >
              Eliminar
            </Button>
          </View>
        </View>
      </Modal>

      {/* Refill Dialog */}
      {medication && (
        <RefillDialog
          visible={showRefillDialog}
          medication={medication}
          onConfirm={handleRefillConfirm}
          onCancel={handleRefillCancel}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  modalContent: {
    paddingVertical: spacing.sm,
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

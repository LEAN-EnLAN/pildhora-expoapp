import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addMedication, updateMedication } from '../../store/slices/medicationsSlice';
import { Medication, DOSE_UNITS, QUANTITY_TYPES } from '../../types';
import { useRouter } from 'expo-router';
import MedicationNameInput from './medication-form/MedicationNameInput';
import DoseInputContainer from './medication-form/DoseInputContainer';
import QuantityTypeSelector from './medication-form/QuantityTypeSelector';
import ReminderTimePicker from './medication-form/ReminderTimePicker';
import ReminderDaysSelector from './medication-form/ReminderDaysSelector';
import { Button, Card, Container } from '../ui';

type Mode = 'add' | 'edit';

interface Props {
  mode: Mode;
  medication?: Medication | undefined;
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

export default function MedicationForm({ mode, medication }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const patientId = user?.id;

  const [form, setForm] = useState<FormState>({
    name: '',
    doseValue: '',
    doseUnit: '',
    quantityTypes: [],
    reminderTimes: ['08:00'],
    reminderDays: ['Mon','Tue','Wed','Thu','Fri'],
  });

  const [errors, setErrors] = useState<FormErrors>({});

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
        reminderDays: medication.frequency ? medication.frequency.split(',').map((s: string) => s.trim()) : ['Mon','Tue','Wed','Thu','Fri'],
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
        reminderDays: medication.frequency ? medication.frequency.split(',').map((s: string) => s.trim()) : ['Mon','Tue','Wed','Thu','Fri'],
      };
    }
    
    // Fallback for unknown formats
    return {
      name: medication.name || '',
      doseValue: medication.dosage || '',
      doseUnit: 'mg',
      quantityTypes: ['Tablets'],
      reminderTimes: medication.times || ['08:00'],
      reminderDays: medication.frequency ? medication.frequency.split(',').map((s: string) => s.trim()) : ['Mon','Tue','Wed','Thu','Fri'],
    };
  };

  // Prefill when editing
  useEffect(() => {
    if (mode === 'edit' && medication) {
      setForm(migrateMedicationData(medication));
    }
  }, [mode, medication?.id]);

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

    // Get caregiverId from user if available
    const caregiverId = user?.role === 'caregiver' ? user.id : '';

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
    };

    if (mode === 'add') {
      const newMed: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = medicationData;
      await dispatch(addMedication(newMed));
    } else if (mode === 'edit' && medication?.id) {
      const updates: Partial<Medication> = medicationData;
      await dispatch(updateMedication({ id: medication.id, updates }));
    }

    router.back();
  };

import { ScrollView } from 'react-native';

// ... (imports)

// ... (component code)

  return (
    <Container>
      <ScrollView>
        <Card>
          <Text style={styles.title}>
            {mode === 'add' ? 'Añadir Medicamento' : 'Editar Medicamento'}
          </Text>

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

        {/* Submit Button */}
        <Button
          onPress={submitForm}
          variant="primary"
          size="lg"
          className="mt-4"
        >
          {mode === 'add' ? 'Guardar' : 'Actualizar'}
        </Button>
        </Card>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
});
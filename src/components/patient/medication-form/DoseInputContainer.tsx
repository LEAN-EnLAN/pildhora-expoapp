import React, { useState } from 'react';
import { View, Text, TextInput, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DOSE_UNITS } from '../../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface Props {
  doseValue: string;
  doseUnit: string;
  onDoseValueChange: (value: string) => void;
  onDoseUnitChange: (unit: string) => void;
  doseValueError?: string;
  doseUnitError?: string;
}

export default function DoseInputContainer({
  doseValue,
  doseUnit,
  onDoseValueChange,
  onDoseUnitChange,
  doseValueError,
  doseUnitError,
}: Props) {
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const handleUnitChange = (unit: string) => {
    if (unit === 'custom') {
      setShowCustomUnit(true);
      setShowUnitPicker(false);
    } else {
      setShowCustomUnit(false);
      onDoseUnitChange(unit);
      setShowUnitPicker(false);
    }
  };

  const handleCustomUnitSubmit = () => {
    if (customUnit.trim()) {
      onDoseUnitChange(customUnit.trim());
      setShowCustomUnit(false);
    }
  };

  const handleDoseValueChange = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, '');
    const parts = numericText.split('.');
    if (parts.length > 2 || (parts[1] && parts[1].length > 2)) {
      return;
    }
    onDoseValueChange(numericText);
  };

  const getSelectedUnitLabel = () => {
    const unit = DOSE_UNITS.find(u => u.id === doseUnit);
    return unit ? unit.label : 'Seleccionar';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dosis</Text>
      <View style={styles.inputRow}>
        <View style={styles.flex1}>
          <TextInput
            style={[styles.textInput, doseValueError ? styles.inputError : styles.inputBorder]}
            placeholder="500"
            value={doseValue}
            onChangeText={handleDoseValueChange}
            keyboardType="numeric"
          />
          {doseValueError && <Text style={styles.errorText}>{doseValueError}</Text>}
        </View>
        
        <View style={styles.flex1_5}>
          <Button
            onPress={() => setShowUnitPicker(true)}
            style={[styles.unitButton, doseUnitError ? styles.inputError : styles.inputBorder]}
            variant="secondary"
          >
            <View style={styles.unitButtonContent}>
              <Text style={[styles.unitButtonText, doseUnit ? styles.textGray800 : styles.textGray400]}>
                {getSelectedUnitLabel()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </View>
          </Button>
          {doseUnitError && <Text style={styles.errorText}>{doseUnitError}</Text>}
        </View>
      </View>
      
      {showCustomUnit && (
        <View style={styles.marginTop2}>
          <TextInput
            style={styles.textInput}
            placeholder="Ingrese unidad personalizada"
            value={customUnit}
            onChangeText={setCustomUnit}
            onSubmitEditing={handleCustomUnitSubmit}
          />
        </View>
      )}

      <Modal
        visible={showUnitPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seleccionar Unidad</Text>
            <ScrollView style={styles.marginBottom4}>
              {DOSE_UNITS.map((unit) => (
                <Button
                  key={unit.id}
                  onPress={() => handleUnitChange(unit.id)}
                  style={[styles.unitOptionButton, doseUnit === unit.id ? styles.selectedUnit : styles.unselectedUnit]}
                  variant="secondary"
                >
                  <View style={styles.unitOptionContent}>
                    <Text style={styles.textGray800}>{unit.label}</Text>
                    {doseUnit === unit.id && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </View>
                </Button>
              ))}
            </ScrollView>
            <Button
              onPress={() => setShowUnitPicker(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  flex1_5: {
    flex: 1.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    height: 48,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputBorder: {
    borderColor: '#D1D5DB',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
  },
  unitButton: {
    height: 48,
    justifyContent: 'center',
  },
  unitButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  unitButtonText: {
    fontSize: 16,
  },
  textGray800: {
    color: '#1F2937',
  },
  textGray400: {
    color: '#9CA3AF',
  },
  marginTop2: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  marginBottom4: {
    marginBottom: 16,
  },
  unitOptionButton: {
    marginBottom: 8,
  },
  selectedUnit: {
    backgroundColor: '#DBEAFE',
  },
  unselectedUnit: {
    backgroundColor: '#F9FAFB',
  },
  unitOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});

import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Modal, ScrollView } from 'react-native';
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
    <View className="mb-4">
      <Text className="text-lg font-bold mb-2 text-gray-800">Dosis</Text>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <TextInput
            className={`border rounded-lg p-3 bg-white text-base h-12 ${doseValueError ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="500"
            value={doseValue}
            onChangeText={handleDoseValueChange}
            keyboardType="numeric"
          />
          {doseValueError && <Text className="text-red-500 mt-1">{doseValueError}</Text>}
        </View>
        
        <View className="flex-1.5">
          <Button
            onPress={() => setShowUnitPicker(true)}
            className={`h-12 justify-center ${doseUnitError ? 'border-red-500' : 'border-gray-300'}`}
            variant="secondary"
          >
            <View className="flex-row justify-between items-center w-full">
              <Text className={`text-base ${doseUnit ? 'text-gray-800' : 'text-gray-400'}`}>
                {getSelectedUnitLabel()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </View>
          </Button>
          {doseUnitError && <Text className="text-red-500 mt-1">{doseUnitError}</Text>}
        </View>
      </View>
      
      {showCustomUnit && (
        <View className="mt-2">
          <TextInput
            className="border border-gray-300 rounded-lg p-3 bg-white text-base h-12"
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
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <Card className="w-full max-w-md max-h-[80%]">
            <Text className="text-xl font-bold mb-4 text-center">Seleccionar Unidad</Text>
            <ScrollView className="mb-4">
              {DOSE_UNITS.map((unit) => (
                <Button
                  key={unit.id}
                  onPress={() => handleUnitChange(unit.id)}
                  className={`mb-2 ${doseUnit === unit.id ? 'bg-blue-100' : 'bg-gray-50'}`}
                  variant="secondary"
                >
                  <View className="flex-row justify-between items-center w-full">
                    <Text className="text-gray-800">{unit.label}</Text>
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
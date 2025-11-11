import React, { useState, useMemo } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QUANTITY_TYPES } from '../../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface Props {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  error?: string;
}

export default function QuantityTypeSelector({ selectedTypes, onTypesChange, error }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const [customType, setCustomType] = useState('');

  const handleTypeToggle = (type: string) => {
    onTypesChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter(t => t !== type)
        : [...selectedTypes, type]
    );
  };

  const handleAddCustomType = () => {
    if (customType.trim() && !selectedTypes.includes(customType.trim())) {
      onTypesChange([...selectedTypes, customType.trim()]);
      setCustomType('');
    }
  };

  const getTypeIcon = (type: string) => {
    const foundType = QUANTITY_TYPES.find(t => t.label === type);
    return foundType ? foundType.icon : 'help-circle-outline';
  };

  return (
    <View className="mb-4">
      <Text className="text-lg font-bold mb-2 text-gray-800">Tipo de Medicamento</Text>
      <View className="min-h-[48px]">
        {selectedTypes.length === 0 ? (
          <Button onPress={() => setShowSelector(true)} variant="secondary" className="justify-center">
            <View className="flex-row items-center gap-2">
              <Text className="text-blue-500 font-semibold">Añadir tipo</Text>
              <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
            </View>
          </Button>
        ) : (
          <View className="flex-row flex-wrap gap-2 items-center">
            {selectedTypes.map((type) => (
              <View key={type} className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5 gap-1.5">
                <Ionicons name={getTypeIcon(type) as any} size={16} color="#374151" />
                <Text className="text-sm text-gray-800 font-medium">{type}</Text>
                <TouchableOpacity onPress={() => onTypesChange(selectedTypes.filter(t => t !== type))}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <Button onPress={() => setShowSelector(true)} variant="secondary" className="p-1 rounded-full h-8 w-8">
              <Ionicons name="add" size={16} color="#3B82F6" />
            </Button>
          </View>
        )}
      </View>
      {error && <Text className="text-red-500 mt-1">{error}</Text>}

      <Modal visible={showSelector} transparent={true} animationType="slide" onRequestClose={() => setShowSelector(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <Card className="w-full max-w-md max-h-[90%]">
            <Text className="text-xl font-bold mb-4 text-center">Seleccionar Tipo</Text>
            <ScrollView className="mb-4">
              {QUANTITY_TYPES.map((type) => (
                <Button
                  key={type.id}
                  onPress={() => handleTypeToggle(type.label)}
                  className={`mb-2 ${selectedTypes.includes(type.label) ? 'bg-blue-100' : 'bg-gray-50'}`}
                  variant="secondary"
                >
                  <View className="flex-row justify-between items-center w-full">
                    <View className="flex-row items-center gap-3">
                      <Ionicons name={type.icon as any} size={20} color="#374151" />
                      <Text className="text-gray-800">{type.label}</Text>
                    </View>
                    {selectedTypes.includes(type.label) && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </View>
                </Button>
              ))}
            </ScrollView>

            <View className="my-2">
              <Text className="font-semibold mb-2 text-gray-700">Tipo personalizado:</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg p-3 bg-white"
                  placeholder="Ej: Inhalador"
                  value={customType}
                  onChangeText={setCustomType}
                  onSubmitEditing={handleAddCustomType}
                />
                <Button onPress={handleAddCustomType} disabled={!customType.trim()}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </Button>
              </View>
            </View>

            <Button onPress={() => setShowSelector(false)} variant="primary" className="mt-4">
              Listo
            </Button>
          </Card>
        </View>
      </Modal>
    </View>
  );
}
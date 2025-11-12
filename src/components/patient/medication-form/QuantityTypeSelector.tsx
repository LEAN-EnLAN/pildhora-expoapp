import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActionSheetIOS, Modal, ScrollView, Platform } from 'react-native';
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
  const [modalVisible, setModalVisible] = useState(false);
  const selectedType = selectedTypes[0] || 'Seleccionar';

  const handlePress = () => {
    const options = [...QUANTITY_TYPES.map(t => t.label), 'Cancelar'];
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options,
          cancelButtonIndex: cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            onTypesChange([options[buttonIndex]]);
          }
        }
      );
    } else {
      setModalVisible(true);
    }
  };

  const handleSelectAndroid = (type: string) => {
    onTypesChange([type]);
    setModalVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tipo de Medicamento</Text>
      <Button onPress={handlePress} variant="secondary" style={styles.button}>
        <Text style={styles.buttonText}>{selectedType}</Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </Button>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {Platform.OS === 'android' && (
         <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
                <Card style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Seleccionar Tipo</Text>
                    <ScrollView>
                        {QUANTITY_TYPES.map(type => (
                            <TouchableOpacity
                                key={type.id}
                                style={styles.option}
                                onPress={() => handleSelectAndroid(type.label)}
                            >
                                <Ionicons name={type.icon} size={24} color="#374151" />
                                <Text style={styles.optionText}>{type.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <Button variant="secondary" onPress={() => setModalVisible(false)} style={styles.marginTop4}>
                        Cancelar
                    </Button>
                </Card>
            </View>
         </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1F2937' },
  button: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: 48, backgroundColor: '#F3F4F6', borderRadius: 8 },
  buttonText: { fontSize: 16, color: '#1F2937' },
  errorText: { color: '#EF4444', marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  optionText: { fontSize: 18, marginLeft: 12 },
  marginTop4: { marginTop: 16 }
});

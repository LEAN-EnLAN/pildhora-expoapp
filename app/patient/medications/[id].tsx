import React from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../src/store';
import MedicationForm from '../../../src/components/patient/MedicationForm';
import { deleteMedication } from '../../../src/store/slices/medicationsSlice';
import { Button } from '../../../src/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams();
  const medId = Array.isArray(id) ? id[0] : id;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const medication = useSelector((state: RootState) => state.medications.medications.find(m => m.id === medId));

  const handleDelete = () => {
    Alert.alert(
        "Eliminar Medicamento",
        "¿Estás seguro de que quieres eliminar este medicamento?",
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    if (!medId) return;
                    await dispatch(deleteMedication(medId));
                    router.back();
                }
            }
        ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Medicamento</Text>
        <TouchableOpacity onPress={handleDelete} style={[styles.iconButton, styles.deleteButton]}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <MedicationForm mode="edit" medication={medication} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
});

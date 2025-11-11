import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../src/store';
import MedicationForm from '../../../src/components/patient/MedicationForm';
import { deleteMedication } from '../../../src/store/slices/medicationsSlice';

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams();
  const medId = Array.isArray(id) ? id[0] : id;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const medication = useSelector((state: RootState) => state.medications.medications.find(m => m.id === medId));

  const handleDelete = async () => {
    if (!medId) return;
    await dispatch(deleteMedication(medId));
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <MedicationForm mode="edit" medication={medication} />
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

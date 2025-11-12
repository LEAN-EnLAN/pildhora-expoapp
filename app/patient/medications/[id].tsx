import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
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
    <View style={styles.container}>
        <View style={styles.header}>
            <Button variant="secondary" onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#374151" />
            </Button>
            <Text style={styles.title}>Editar Medicamento</Text>
            <Button variant="danger" onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="white" />
            </Button>
        </View>
        <ScrollView>
            <View style={styles.content}>
                <MedicationForm mode="edit" medication={medication} />
            </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
});

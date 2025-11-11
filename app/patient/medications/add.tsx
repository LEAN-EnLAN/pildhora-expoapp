import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import MedicationForm from '../../../src/components/patient/MedicationForm';

export default function AddMedicationScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Añadir Medicamento</Text>
        <MedicationForm mode="add" />
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

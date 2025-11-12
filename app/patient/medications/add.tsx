import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import MedicationForm from '../../../src/components/patient/MedicationForm';
import { Button } from '../../../src/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AddMedicationScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Button variant="secondary" onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#374151" />
            </Button>
            <Text style={styles.title}>Añadir Medicamento</Text>
            <View style={{width: 50}} />
        </View>
        <ScrollView>
            <View style={styles.content}>
                <MedicationForm mode="add" />
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
  }
});

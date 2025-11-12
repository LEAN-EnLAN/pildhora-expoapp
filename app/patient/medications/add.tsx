import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MedicationForm from '../../../src/components/patient/MedicationForm';

export default function AddMedicationScreen() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <MedicationForm mode="add" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  }
});

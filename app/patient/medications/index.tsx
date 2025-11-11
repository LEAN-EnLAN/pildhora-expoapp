import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { RootState, AppDispatch } from '../../../src/store';
import { fetchMedications } from '../../../src/store/slices/medicationsSlice';
import { Medication } from '../../../src/types';
import { Card } from '../../../src/components/ui';

export default function MedicationsIndex() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { medications, loading } = useSelector((state: RootState) => state.medications);
  const patientId = user?.id;

  useEffect(() => {
    if (patientId) dispatch(fetchMedications(patientId));
  }, [patientId]);

  // Helper function to format medication display
  const formatMedicationDisplay = (medication: Medication) => {
    // Check if using new format
    if (medication.doseValue && medication.doseUnit) {
      const dose = `${medication.doseValue}${medication.doseUnit}`;
      const quantity = medication.quantityType || t('patient.medications.tablets');
      return `${dose}, ${quantity}`;
    }

    // Fallback to legacy format
    return medication.dosage || t('patient.medications.noDoseSpecified');
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('patient.medications.myMedications')}</Text>
        <Link href="/patient/medications/add" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>{t('patient.medications.add')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>{t('patient.medications.loading')}</Text>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.cardContent}>
                <Text style={styles.medicationName}>{item.name}</Text>
                <Text style={styles.medicationDosage}>{formatMedicationDisplay(item)}</Text>
                <Text style={styles.medicationFrequency}>{item.frequency}</Text>
                {item.times?.length ? (
                  <Text style={styles.nextDose}>
                    {t('patient.medications.next', { time: formatTimeDisplay(item.times[0]) })}
                  </Text>
                ) : null}
              </View>
              <Link href={`/patient/medications/${item.id}`} asChild>
                <TouchableOpacity style={styles.openButton}>
                  <Text style={styles.openButtonText}>{t('patient.medications.open')}</Text>
                </TouchableOpacity>
              </Link>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  cardContent: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  medicationFrequency: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  nextDose: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  openButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  openButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

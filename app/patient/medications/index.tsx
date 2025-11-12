import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useRouter } from 'expo-router';
import { RootState, AppDispatch } from '../../../src/store';
import { fetchMedications } from '../../../src/store/slices/medicationsSlice';
import { Medication } from '../../../src/types';
import { Card, Button } from '../../../src/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function MedicationsIndex() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { medications, loading, error } = useSelector((state: RootState) => state.medications);
  const patientId = user?.id;

  useEffect(() => {
    if (patientId) dispatch(fetchMedications(patientId));
  }, [patientId]);

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderItem = ({ item }: { item: Medication }) => (
    <Card style={styles.card}>
        <View style={styles.cardBody}>
            <Ionicons name="medkit-outline" size={32} color="#3B82F6" />
            <View style={styles.medInfo}>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medDetail}>{`${item.doseValue}${item.doseUnit}, ${item.quantityType}`}</Text>
                <Text style={styles.medDetail}>{item.times?.map(formatTimeDisplay).join(', ')}</Text>
            </View>
        </View>
        <Button
            variant="secondary"
            onPress={() => router.push(`/patient/medications/${item.id}`)}
        >
            Ver Detalles
        </Button>
    </Card>
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loading} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyView}>
                <Text style={styles.emptyText}>No hay medicamentos.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loading: {
      marginTop: 50
  },
  errorText: {
      textAlign: 'center',
      marginTop: 20,
      color: 'red'
  },
  listContent: {
      padding: 16
  },
  emptyView: {
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280'
  },
  card: {
    marginBottom: 16
  },
  cardBody: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16
  },
  medInfo: {
      marginLeft: 16,
      flex: 1
  },
  medName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4
  },
  medDetail: {
    fontSize: 14,
    color: '#6B7280'
  }
});

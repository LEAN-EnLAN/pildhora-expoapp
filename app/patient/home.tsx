import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function PatientHome() {
  const router = useRouter();

  // Mock data - will be replaced with Redux state
  const upcomingMedications = [
    { id: '1', name: 'Aspirin', time: '08:00', taken: false },
    { id: '2', name: 'Vitamin D', time: '12:00', taken: true },
  ];

  const handleTakeMedication = (id: string) => {
    // TODO: Implement medication taking logic
    console.log('Take medication:', id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.subtitle}>Here are your medications for today</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcomingMedications.map((med) => (
          <View key={med.id} style={styles.medicationCard}>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Text style={styles.medicationTime}>{med.time}</Text>
            </View>
            <TouchableOpacity
              style={[styles.takeButton, med.taken && styles.takenButton]}
              onPress={() => handleTakeMedication(med.id)}
              disabled={med.taken}
            >
              <Text style={[styles.takeButtonText, med.taken && styles.takenButtonText]}>
                {med.taken ? 'Taken' : 'Take'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pillbox Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Connected</Text>
          <Text style={styles.batteryText}>Battery: 85%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back to Role Selection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  medicationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  medicationTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  takeButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  takenButton: {
    backgroundColor: '#E5E5EA',
  },
  takeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  takenButtonText: {
    color: '#8E8E93',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
  },
  batteryText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  backButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
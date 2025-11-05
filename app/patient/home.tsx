import { Text, View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  takenButton: {
    backgroundColor: '#E5E7EB',
  },
  availableButton: {
    backgroundColor: '#34C759',
  },
  takenButtonText: {
    fontWeight: '600',
    color: '#8E8E93',
  },
  availableButtonText: {
    fontWeight: '600',
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34C759',
  },
  batteryText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  backButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

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
        <Text style={styles.headerTitle}>Good morning!</Text>
        <Text style={styles.headerSubtitle}>Here are your medications for today</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming</Text>
        {upcomingMedications.map((med) => (
          <View key={med.id} style={styles.medicationItem}>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Text style={styles.medicationTime}>{med.time}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.takeButton,
                med.taken ? styles.takenButton : styles.availableButton
              ]}
              onPress={() => handleTakeMedication(med.id)}
              disabled={med.taken}
            >
              <Text style={[
                styles.availableButtonText,
                med.taken && styles.takenButtonText
              ]}>
                {med.taken ? 'Taken' : 'Take'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pillbox Status</Text>
        <View style={styles.statusContainer}>
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
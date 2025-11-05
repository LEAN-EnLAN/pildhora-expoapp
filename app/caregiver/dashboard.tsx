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
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  patientDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  adherenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goodAdherence: {
    backgroundColor: '#34C759',
  },
  warningAdherence: {
    backgroundColor: '#FF9500',
  },
  adherenceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  taskPatient: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  leftButton: {
    marginRight: 8,
  },
  rightButton: {
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default function CaregiverDashboard() {
  const router = useRouter();

  // Mock data
  const patients = [
    { id: '1', name: 'John Doe', adherence: 85, lastTaken: '2 hours ago' },
    { id: '2', name: 'Jane Smith', adherence: 92, lastTaken: '30 minutes ago' },
  ];

  const recentTasks = [
    { id: '1', title: 'Refill prescription', patient: 'John Doe', completed: false },
    { id: '2', title: 'Schedule doctor visit', patient: 'Jane Smith', completed: true },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Caregiver Dashboard</Text>
        <Text style={styles.headerSubtitle}>Monitor your patients</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Patient Overview</Text>
        {patients.map((patient) => (
          <View key={patient.id} style={styles.patientItem}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientDetails}>
                Adherence: {patient.adherence}% | Last taken: {patient.lastTaken}
              </Text>
            </View>
            <View style={[
                styles.adherenceBadge,
                patient.adherence > 80 ? styles.goodAdherence : styles.warningAdherence
              ]}>
              <Text style={styles.adherenceText}>{patient.adherence}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Tasks</Text>
        {recentTasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskPatient}>{task.patient}</Text>
            </View>
            <View style={[
                styles.adherenceBadge,
                task.completed ? styles.completedBadge : styles.pendingBadge
              ]}>
              <Text style={styles.adherenceText}>
                {task.completed ? 'Done' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.leftButton]}>
          <Text style={styles.buttonText}>Add Medication</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.rightButton]}>
          <Text style={styles.buttonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back to Role Selection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
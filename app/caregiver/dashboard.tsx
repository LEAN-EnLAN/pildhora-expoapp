import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

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
        <Text style={styles.greeting}>Caregiver Dashboard</Text>
        <Text style={styles.subtitle}>Monitor your patients</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Overview</Text>
        {patients.map((patient) => (
          <View key={patient.id} style={styles.patientCard}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientDetails}>
                Adherence: {patient.adherence}% | Last taken: {patient.lastTaken}
              </Text>
            </View>
            <View style={[styles.adherenceIndicator, { backgroundColor: patient.adherence > 80 ? '#34C759' : '#FF9500' }]}>
              <Text style={styles.adherenceText}>{patient.adherence}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        {recentTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskPatient}>{task.patient}</Text>
            </View>
            <View style={[styles.taskStatus, task.completed && styles.completedStatus]}>
              <Text style={[styles.taskStatusText, task.completed && styles.completedStatusText]}>
                {task.completed ? 'Done' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Add Medication</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Generate Report</Text>
        </TouchableOpacity>
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
  patientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
  adherenceIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adherenceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
  taskStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FF9500',
  },
  completedStatus: {
    backgroundColor: '#34C759',
  },
  taskStatusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  completedStatusText: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
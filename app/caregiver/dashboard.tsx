import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
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
    <ScrollView className="flex-1 bg-background">
      <View className="p-5 bg-white mb-4">
        <Text className="text-2xl font-bold text-text">Caregiver Dashboard</Text>
        <Text className="text-base text-textSecondary mt-1">Monitor your patients</Text>
      </View>

      <View className="bg-white mx-4 mb-4 rounded-xl p-4">
        <Text className="text-lg font-semibold text-text mb-3">Patient Overview</Text>
        {patients.map((patient) => (
          <View key={patient.id} className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-base font-medium text-text">{patient.name}</Text>
              <Text className="text-sm text-textSecondary mt-0.5">
                Adherence: {patient.adherence}% | Last taken: {patient.lastTaken}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full ${patient.adherence > 80 ? 'bg-success' : 'bg-warning'}`}>
              <Text className="text-white font-semibold text-sm">{patient.adherence}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="bg-white mx-4 mb-4 rounded-xl p-4">
        <Text className="text-lg font-semibold text-text mb-3">Recent Tasks</Text>
        {recentTasks.map((task) => (
          <View key={task.id} className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-base font-medium text-text">{task.title}</Text>
              <Text className="text-sm text-textSecondary mt-0.5">{task.patient}</Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full ${task.completed ? 'bg-success' : 'bg-warning'}`}>
              <Text className="text-white font-semibold text-sm">
                {task.completed ? 'Done' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View className="flex-row mx-4 mb-4">
        <TouchableOpacity className="flex-1 bg-primary p-4 rounded-xl items-center mr-2">
          <Text className="text-white text-base font-semibold">Add Medication</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-primary p-4 rounded-xl items-center ml-2">
          <Text className="text-white text-base font-semibold">Generate Report</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="bg-primary m-4 p-4 rounded-xl items-center" onPress={() => router.back()}>
        <Text className="text-white text-base font-semibold">Back to Role Selection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
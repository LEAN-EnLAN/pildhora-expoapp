import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
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
    <ScrollView className="flex-1 bg-background">
      <View className="p-5 bg-white mb-4">
        <Text className="text-2xl font-bold text-text">Good morning!</Text>
        <Text className="text-base text-textSecondary mt-1">Here are your medications for today</Text>
      </View>

      <View className="bg-white mx-4 mb-4 rounded-xl p-4">
        <Text className="text-lg font-semibold text-text mb-3">Upcoming</Text>
        {upcomingMedications.map((med) => (
          <View key={med.id} className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-base font-medium text-text">{med.name}</Text>
              <Text className="text-sm text-textSecondary mt-0.5">{med.time}</Text>
            </View>
            <TouchableOpacity
              className={`px-5 py-2 rounded-full ${med.taken ? 'bg-gray-200' : 'bg-success'}`}
              onPress={() => handleTakeMedication(med.id)}
              disabled={med.taken}
            >
              <Text className={`font-semibold ${med.taken ? 'text-textSecondary' : 'text-white'}`}>
                {med.taken ? 'Taken' : 'Take'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View className="bg-white mx-4 mb-4 rounded-xl p-4">
        <Text className="text-lg font-semibold text-text mb-3">Pillbox Status</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-medium text-success">Connected</Text>
          <Text className="text-sm text-textSecondary">Battery: 85%</Text>
        </View>
      </View>

      <TouchableOpacity className="bg-primary m-4 p-4 rounded-xl items-center" onPress={() => router.back()}>
        <Text className="text-white text-base font-semibold">Back to Role Selection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
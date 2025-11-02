import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  const handleRoleSelect = (role: 'patient' | 'caregiver') => {
    // For now, navigate to respective screens
    if (role === 'patient') {
      router.push('/patient/home');
    } else {
      router.push('/caregiver/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Pildhora</Text>
      <Text style={styles.subtitle}>Smart Pillbox Management</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.patientButton]}
          onPress={() => handleRoleSelect('patient')}
        >
          <Text style={styles.buttonText}>I'm a Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.caregiverButton]}
          onPress={() => handleRoleSelect('caregiver')}
        >
          <Text style={styles.buttonText}>I'm a Caregiver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  patientButton: {
    backgroundColor: '#34C759',
  },
  caregiverButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
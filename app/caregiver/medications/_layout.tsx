import { Stack } from 'expo-router';

export default function CaregiverMedicationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Seleccionar Paciente',
          headerShown: false, // Disable header to prevent duplication
        }} 
      />
      <Stack.Screen 
        name="[patientId]" 
        options={{ 
          headerShown: false, // Disable header for patient-specific medication screens
        }} 
      />
    </Stack>
  );
}

import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';

export default function CaregiverLayout() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Role guard: only allow caregivers to access caregiver screens
    if (!isAuthenticated || user?.role !== 'caregiver') {
      router.replace('/');
    }
  }, [isAuthenticated, user?.role]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" options={{ title: 'Caregiver Dashboard' }} />
    </Stack>
  );
}

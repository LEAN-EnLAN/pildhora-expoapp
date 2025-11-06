import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';

export default function PatientLayout() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Role guard: only allow patients to access patient screens
    if (!isAuthenticated || user?.role !== 'patient') {
      router.replace('/');
    }
  }, [isAuthenticated, user?.role]);

  return (
    <Stack>
      <Stack.Screen name="home" options={{ title: 'Patient Home' }} />
      <Stack.Screen name="link-device" options={{ title: 'Enlazar Dispositivo' }} />
    </Stack>
  );
}

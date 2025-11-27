import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/tokens';

export default function PatientLayout() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Role guard: only allow patients to access patient screens
    // Add a small delay to allow logout to complete properly
    const timer = setTimeout(() => {
      if (!isAuthenticated || user?.role !== 'patient') {
        console.log('[PatientLayout] Redirecting - Auth:', isAuthenticated, 'Role:', user?.role);
        router.replace('/');
      }
    }, 300); // Increased delay to allow logout to complete

    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.role]);

  return (
    <View style={styles.layoutContainer}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="medications" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="device-settings" />
        <Stack.Screen name="device-provisioning" />
        <Stack.Screen name="edit-profile" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

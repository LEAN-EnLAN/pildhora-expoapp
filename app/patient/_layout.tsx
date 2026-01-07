import { Stack, useRouter, Link } from 'expo-router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';

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
        <Stack.Screen
          name="device-settings"
          options={{
            headerShown: true,
            title: 'Ajustes del dispositivo',
            headerRight: () => (
              <Link href="/patient/device-provisioning" asChild>
                <Pressable
                  accessibilityLabel="Ir a aprovisionamiento"
                  accessibilityRole="button"
                  accessibilityHint="Abre el asistente de aprovisionamiento del dispositivo"
                  hitSlop={10}
                >
                  <Ionicons name="construct-outline" size={24} color={colors.primary[600]} />
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen
          name="device-provisioning"
          options={{
            headerShown: true,
            title: 'Aprovisionamiento',
            headerRight: () => (
              <Link href="/patient/device-settings" asChild>
                <Pressable
                  accessibilityLabel="Ir a ajustes"
                  accessibilityRole="button"
                  accessibilityHint="Abre los ajustes del dispositivo"
                  hitSlop={10}
                >
                  <Ionicons name="settings-outline" size={24} color={colors.primary[600]} />
                </Pressable>
              </Link>
            ),
          }}
        />
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

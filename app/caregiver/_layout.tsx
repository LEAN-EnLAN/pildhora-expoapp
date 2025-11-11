import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import CaregiverHeader from '../../src/components/CaregiverHeader';

export default function CaregiverLayout() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'caregiver') {
      router.replace('/');
    }
  }, [isAuthenticated, user?.role]);

  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/auth/login');
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => (
          <CaregiverHeader
            title={route.name === 'dashboard' ? 'Inicio' : route.name.charAt(0).toUpperCase() + route.name.slice(1)}
            showScreenTitle={route.name !== 'dashboard'}
            onLogout={handleLogout}
          />
        ),
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: 'Registro',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      {/* This screen is not in the tab bar and will be pushed as a modal */}
      <Tabs.Screen name="chat" options={{ href: null, presentation: 'modal' }} />
      <Tabs.Screen name="add-device" options={{ href: null, presentation: 'modal', title: 'Vincular Dispositivo' }} />
    </Tabs>
  );
}

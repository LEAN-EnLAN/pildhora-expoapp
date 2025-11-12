import { Tabs, useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import CaregiverHeader from '../../src/components/CaregiverHeader';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDbInstance } from '../../src/services/firebase';

export default function CaregiverLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [checkedPatients, setCheckedPatients] = useState(false);
  const [hasPatients, setHasPatients] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'caregiver') {
      router.replace('/');
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    const checkPatients = async () => {
      if (!user?.id) return;
      try {
        const db = await getDbInstance();
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'patient'),
          where('caregiverId', '==', user.id)
        );
        const snap = await getDocs(q);
        const any = !snap.empty;
        setHasPatients(any);
        setCheckedPatients(true);
        if (!any && !pathname.endsWith('/add-device')) {
          router.replace('/caregiver/add-device');
        }
      } catch {
        setHasPatients(false);
        setCheckedPatients(true);
        if (!pathname.endsWith('/add-device')) {
          router.replace('/caregiver/add-device');
        }
      }
    };
    checkPatients();
  }, [user?.id, pathname]);

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
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="add-device" options={{ href: null, title: 'Vincular Dispositivo' }} />
    </Tabs>
  );
}

import { Tabs, useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { CaregiverHeader } from '../../src/components/caregiver';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDbInstance } from '../../src/services/firebase';
import { colors, spacing, typography, shadows } from '../../src/theme/tokens';
import { useNavigationPersistence } from '../../src/hooks/useNavigationPersistence';

export default function CaregiverLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [checkedPatients, setCheckedPatients] = useState(false);
  const [hasPatients, setHasPatients] = useState<boolean>(true);
  
  // Navigation persistence and deep linking (temporarily disabled for debugging)
  const { isReady: isNavigationReady } = useNavigationPersistence({
    enabled: false,
    persistLastRoute: false,
    handleDeepLinks: false,
  });

  // Temporarily disable automatic auth-based redirect to avoid nav loops while debugging
  // useEffect(() => {
  //   if (!isAuthenticated || user?.role !== 'caregiver') {
  //     router.replace('/');
  //   }
  // }, [isAuthenticated, user?.role]);

  useEffect(() => {
    const checkPatients = async () => {
      if (!user?.id) return;
      try {
        const db = await getDbInstance();
        if (!db) {
          setHasPatients(false);
          setCheckedPatients(true);
          return;
        }
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'patient'),
          where('caregiverId', '==', user.id)
        );
        const snap = await getDocs(q);
        const any = !snap.empty;
        setHasPatients(any);
        setCheckedPatients(true);
      } catch {
        setHasPatients(false);
        setCheckedPatients(true);
      }
    };
    checkPatients();
  }, [user?.id, pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/auth/login');
  };

  // Get screen title based on route name
  const getScreenTitle = (routeName: string): string => {
    const titles: Record<string, string> = {
      dashboard: 'Inicio',
      tasks: 'Tareas',
      medications: 'Medicamentos',
      events: 'Eventos',
      'add-device': 'Vincular Dispositivo',
    };
    return titles[routeName] || routeName.charAt(0).toUpperCase() + routeName.slice(1);
  };

  // Check if current route should hide tabs (modal screens)
  const shouldHideTabs = (): boolean => {
    const modalRoutes = ['/caregiver/add-device', '/caregiver/events/'];
    return modalRoutes.some(route => pathname.includes(route));
  };

  // Show loading indicator while navigation is initializing
  if (!isNavigationReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <>
      {/* Single custom header for all caregiver screens */}
      <CaregiverHeader
        caregiverName={user?.name}
        title={getScreenTitle(pathname.split('/').pop() || 'dashboard')}
        showScreenTitle={pathname !== '/caregiver/dashboard'}
        onLogout={handleLogout}
      />
      
      <Tabs
        screenOptions={{
          headerShown: false, // Disable default header for all screens
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: colors.gray[400],
          tabBarStyle: [
            styles.tabBar,
            shouldHideTabs() && styles.tabBarHidden,
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: styles.tabBarIcon,
          tabBarItemStyle: styles.tabBarItem,
          tabBarAllowFontScaling: true,
          tabBarHideOnKeyboard: Platform.OS === 'android',
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Inicio - Tablero principal del cuidador',
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tareas',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "checkbox" : "checkbox-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Tareas - Gestionar tareas del cuidador',
          }}
        />
        <Tabs.Screen
          name="medications"
          options={{
            title: 'Medicamentos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "medkit" : "medkit-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Medicamentos - Gestionar medicamentos del paciente',
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Eventos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "notifications" : "notifications-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Eventos - Ver registro de eventos de medicamentos',
          }}
        />
        {/* Modal screens - hidden from tab bar */}
        <Tabs.Screen 
          name="add-device" 
          options={{ 
            href: null, 
            title: 'Vincular Dispositivo',
            headerShown: false,
          }} 
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    height: Platform.OS === 'ios' ? 88 : 68,
    ...shadows.sm,
  },
  tabBarHidden: {
    display: 'none',
  },
  tabBarLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
    letterSpacing: 0.3,
  },
  tabBarIcon: {
    marginBottom: -2,
  },
  tabBarItem: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
});

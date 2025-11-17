import { Tabs, useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { CaregiverHeader } from '../../src/components/caregiver';
import { colors, spacing, typography, shadows, borderRadius } from '../../src/theme/tokens';
import { useNavigationPersistence } from '../../src/hooks/useNavigationPersistence';

export default function CaregiverLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  // Navigation persistence and deep linking (temporarily disabled for debugging)
  const { isReady: isNavigationReady } = useNavigationPersistence({
    enabled: false,
    persistLastRoute: false,
    handleDeepLinks: false,
  });

  useEffect(() => {
    // Role guard: only allow caregivers to access caregiver screens
    // Add a small delay to allow logout to complete properly
    const timer = setTimeout(() => {
      if (!isAuthenticated || user?.role !== 'caregiver') {
        console.log('[CaregiverLayout] Redirecting - Auth:', isAuthenticated, 'Role:', user?.role);
        router.replace('/');
      }
    }, 300); // Delay to allow logout to complete

    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.role, router]);



  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/auth/login');
  };

  // Get screen title based on route name
  const getScreenTitle = (routeName: string): string => {
    const titles: Record<string, string> = {
      dashboard: 'Inicio',
      tasks: 'Tareas',
      'device-connection': 'Pacientes y Dispositivos',
      events: 'Eventos',
      'add-device': 'Vincular Dispositivo',
    };
    return titles[routeName] || routeName.charAt(0).toUpperCase() + routeName.slice(1);
  };

  // Check if current route should hide tabs (modal screens)
  const shouldHideTabs = (): boolean => {
    const modalRoutes = ['/caregiver/add-device', '/caregiver/events/', '/caregiver/medications/'];
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
      {/* Single custom header for all caregiver screens except add-device */}
      {pathname !== '/caregiver/add-device' && (
        <CaregiverHeader
          caregiverName={user?.name}
          title={getScreenTitle(pathname.split('/').pop() || 'dashboard')}
          showScreenTitle={pathname !== '/caregiver/dashboard'}
          onLogout={handleLogout}
        />
      )}
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.gray[500],
          tabBarStyle: [
            styles.tabBar,
            shouldHideTabs() && styles.tabBarHidden,
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: styles.tabBarIcon,
          tabBarItemStyle: styles.tabBarItem,
          tabBarAllowFontScaling: false,
          tabBarHideOnKeyboard: Platform.OS === 'android',
          tabBarBackground: () => (
            <View style={styles.tabBarBackground} />
          ),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Inicio - Tablero principal del cuidador',
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarLabel: 'Tareas',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'checkbox' : 'checkbox-outline'} 
                size={size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Tareas - Gestionar tareas del cuidador',
          }}
        />
        {/* Modal screens and nested routes - hidden from tab bar */}
        <Tabs.Screen 
          name="device-connection" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="events" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="add-device" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="device-connection-confirm" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="medications" 
          options={{ 
            href: null,
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
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] + spacing.sm : spacing.lg,
    paddingHorizontal: spacing.md,
    height: Platform.OS === 'ios' ? 90 : 72,
    ...shadows.xl,
    // Modern elevated effect
    ...(Platform.OS === 'ios' && {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    }),
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing['2xl'],
    borderTopRightRadius: spacing['2xl'],
  },
  tabBarHidden: {
    display: 'none',
  },
  tabBarLabel: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs - 2,
    letterSpacing: 0.3,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  tabBarItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs - 2,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs - 2,
  },
});

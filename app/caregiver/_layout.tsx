import { Tabs, useRouter, usePathname } from 'expo-router';
import { useEffect, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaregiverHeader } from '../../src/components/caregiver';
import CaregiverTabBar from '../../src/navigation/CaregiverTabBar';
import { colors, spacing, shadows, borderRadius } from '../../src/theme/tokens';
import { useNavigationPersistence } from '../../src/hooks/useNavigationPersistence';

// Layout dimensions context for child screens to use
export const LayoutDimensionsContext = createContext({
  headerHeight: 0,
  tabBarHeight: 0,
  contentInsetTop: 0,
  contentInsetBottom: 0,
});

export const useLayoutDimensions = () => useContext(LayoutDimensionsContext);

export default function CaregiverLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  // Navigation persistence and deep linking (temporarily disabled for debugging)
  const { isReady: isNavigationReady } = useNavigationPersistence({
    enabled: false,
    persistLastRoute: false,
    handleDeepLinks: false,
  });

  // Calculate layout dimensions
  const HEADER_HEIGHT = 90; // Base header height
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 65; // Height for icon-only tabs
  const headerHeight = HEADER_HEIGHT + insets.top;
  const tabBarHeight = TAB_BAR_HEIGHT;
  const contentInsetTop = headerHeight;
  const contentInsetBottom = tabBarHeight;

  const layoutDimensions = {
    headerHeight,
    tabBarHeight,
    contentInsetTop,
    contentInsetBottom,
  };

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
    // Handle nested medication routes
    if (pathname.includes('/medications/') && pathname.includes('/add')) {
      return 'Agregar Medicamento';
    }
    if (pathname.includes('/medications/') && !pathname.endsWith('/medications/index')) {
      return 'Medicamentos';
    }
    
    const titles: Record<string, string> = {
      dashboard: 'Inicio',
      tasks: 'Tareas',
      patients: 'Pacientes',
      'device-connection': 'Vincular Paciente',
      calendar: 'Calendario',
      'medications': 'Medicamentos',
      'add-device': 'Vincular Dispositivo',
      'settings': 'Ajustes',
      'edit-profile': 'Editar Perfil',
    };
    return titles[routeName] || routeName.charAt(0).toUpperCase() + routeName.slice(1);
  };

  // Check if current route should hide tabs (modal screens)
  const shouldHideTabs = (): boolean => {
    const modalRoutes = ['/caregiver/add-device'];
    // Hide tabs for nested medication routes (but not the index)
    if (pathname.includes('/caregiver/medications/') && pathname !== '/caregiver/medications/index') {
      return true;
    }
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
    <LayoutDimensionsContext.Provider value={layoutDimensions}>
      <View style={styles.layoutContainer}>
        {/* Persistent header for all caregiver screens except add-device and dashboard (which has custom header) */}
        {pathname !== '/caregiver/add-device' && pathname !== '/caregiver/dashboard' && (
          <View style={styles.headerContainer}>
            <CaregiverHeader
              caregiverName={user?.name}
              title={getScreenTitle(pathname.split('/').pop() || 'dashboard')}
              showScreenTitle={pathname !== '/caregiver/dashboard'}
              onLogout={handleLogout}
            />
          </View>
        )}
        
        <Tabs
          tabBar={(props) => <CaregiverTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary[600],
            tabBarInactiveTintColor: colors.gray[400],
            tabBarShowLabel: false,
            tabBarAllowFontScaling: false,
            tabBarHideOnKeyboard: true,
            detachInactiveScreens: true,
          }}
        >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <Ionicons 
                  name={focused ? 'home' : 'home-outline'} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
            tabBarAccessibilityLabel: 'Inicio - Tablero principal del cuidador',
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <Ionicons 
                  name={focused ? 'checkbox' : 'checkbox-outline'} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
            tabBarAccessibilityLabel: 'Tareas - Gestionar tareas del cuidador',
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <Ionicons 
                  name={focused ? 'people' : 'people-outline'} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
            tabBarAccessibilityLabel: 'Pacientes - Gestionar pacientes y dispositivos vinculados',
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <Ionicons 
                  name={focused ? 'calendar' : 'calendar-outline'} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
            tabBarAccessibilityLabel: 'Calendario - Ver registro de eventos y adherencia',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <Ionicons 
                  name={focused ? 'settings' : 'settings-outline'} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
            tabBarAccessibilityLabel: 'Ajustes - Configuración del cuidador',
          }}
        />
        {/* Hidden screens - not shown in tab bar */}
        <Tabs.Screen name="medications" options={{ href: null }} />
        <Tabs.Screen name="device-connection" options={{ href: null }} />
        <Tabs.Screen name="add-device" options={{ href: null }} />
        <Tabs.Screen name="device-connection-confirm" options={{ href: null }} />
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
        </Tabs>
      </View>
    </LayoutDimensionsContext.Provider>
  );
}

const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.surface,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  tabBarItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapperActive: {
    backgroundColor: colors.primary[50],
  },
});

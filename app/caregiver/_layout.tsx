import { Tabs, useRouter, usePathname } from 'expo-router';
import { useEffect, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaregiverHeader } from '../../src/components/caregiver';
import { colors, spacing, typography, shadows, borderRadius } from '../../src/theme/tokens';
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
  const HEADER_HEIGHT = 100; // Base header height (increased for more spacing)
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 90 : 72;
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
      events: 'Eventos',
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
        {/* Persistent header for all caregiver screens except add-device */}
        {pathname !== '/caregiver/add-device' && (
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
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary[600],
            tabBarInactiveTintColor: colors.gray[500],
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarIconStyle: styles.tabBarIcon,
            tabBarItemStyle: styles.tabBarItem,
            tabBarAllowFontScaling: false,
            tabBarHideOnKeyboard: false,
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
        <Tabs.Screen
          name="patients"
          options={{
            tabBarLabel: 'Pacientes',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'people' : 'people-outline'} 
                size={size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Pacientes - Gestionar pacientes y dispositivos vinculados',
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            tabBarLabel: 'Eventos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'notifications' : 'notifications-outline'} 
                size={size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Eventos - Ver registro de eventos de medicamentos',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarLabel: 'Ajustes',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'settings' : 'settings-outline'} 
                size={size} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Ajustes - Configuración del cuidador',
          }}
        />
        {/* Modal screens and nested routes - hidden from tab bar */}
        <Tabs.Screen 
          name="medications" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="device-connection" 
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
          name="edit-profile" 
          options={{ 
            href: null,
          }} 
        />
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
    backgroundColor: colors.background,
    ...shadows.md,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] + spacing.sm : spacing.lg,
    paddingHorizontal: spacing.md,
    height: Platform.OS === 'ios' ? 90 : 72,
    ...shadows.xl,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing['2xl'],
    borderTopRightRadius: spacing['2xl'],
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

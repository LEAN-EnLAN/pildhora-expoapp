import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  StatusBar,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../src/store';
import { checkAuthState } from '../src/store/slices/authSlice';
import { getPostAuthRoute } from '../src/services/routing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../src/theme/tokens';
import { AppIcon, Button } from '../src/components/ui';
import { TestTopoButton, TestFortuButton, DeveloperToolsSection } from '../src/components/shared';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WelcomeScreen] Rendering error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error[500]} />
          <Text style={styles.errorTitle}>Algo salió mal</Text>
          <Text style={styles.errorMessage}>
            No pudimos cargar la pantalla de bienvenida.
          </Text>
          <Button onPress={this.handleRetry} variant="primary">
            Intentar de nuevo
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Feature Item Component
 * Renders a single feature with icon and text
 */
const FeatureItem = memo(({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconContainer}>
      <Ionicons name={icon} size={20} color={colors.primary[600]} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
));

/**
 * Landing View Component
 * The initial view shown to the user
 */
const LandingView = memo(({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) => {

  return (
    <View style={styles.viewContainer}>
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <AppIcon size="2xl" showShadow={true} rounded={true} />
        </View>
        <Text style={styles.appName}>Pildhora</Text>
        <Text style={styles.tagline}>Tu salud, simplificada.</Text>
        <Text style={styles.description}>
          Gestión inteligente de medicamentos para pacientes y cuidadores.
          Nunca más olvides una dosis.
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <FeatureItem icon="notifications-outline" text="Recordatorios" />
        <View style={styles.featureDivider} />
        <FeatureItem icon="people-outline" text="Cuidadores" />
        <View style={styles.featureDivider} />
        <FeatureItem icon="stats-chart-outline" text="Seguimiento" />
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity
          onPress={onStart}
          activeOpacity={0.9}
          style={styles.startButtonContainer}
          accessibilityLabel="Comenzar ahora"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[colors.primary[600], colors.primary[400]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>Comenzar ahora</Text>
            <View style={styles.startButtonIcon}>
              <Ionicons name="arrow-forward" size={20} color={colors.primary[600]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onLogin}
          style={styles.loginLink}
          accessibilityLabel="Iniciar sesión si ya tienes cuenta"
        >
          <Text style={styles.loginText}>
            ¿Ya tienes cuenta? <Text style={styles.loginTextBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>

        {/* Developer Tools - Hidden by default, tap 5 times to reveal */}
        <DeveloperToolsSection>
          <TestTopoButton />
          <TestFortuButton />
        </DeveloperToolsSection>
      </View>
    </View>
  );
});

/**
 * Role Card Component
 * Selectable card for user role
 */
const RoleCard = memo(({
  role,
  title,
  description,
  icon,
  color,
  bgColor,
  onSelect
}: {
  role: 'patient' | 'caregiver';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  onSelect: (role: 'patient' | 'caregiver') => void;
}) => (
  <TouchableOpacity
    style={styles.roleCard}
    onPress={() => onSelect(role)}
    activeOpacity={0.9}
    accessibilityLabel={`Seleccionar perfil de ${title}`}
    accessibilityRole="button"
  >
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC']}
      style={styles.roleCardGradient}
    >
      <View style={[styles.roleIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.roleContent}>
        <Text style={styles.roleName}>{title}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
      </View>
    </LinearGradient>
  </TouchableOpacity>
));

/**
 * Role Selection View Component
 * Allows user to choose between Patient and Caregiver
 */
const RoleSelectionView = memo(({
  onBack,
  onSelect,
  onLogin
}: {
  onBack: () => void;
  onSelect: (role: 'patient' | 'caregiver') => void;
  onLogin: () => void;
}) => {
  return (
    <View style={styles.viewContainer}>
      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Volver a la pantalla de inicio"
          accessibilityRole="button"
        >
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
          </View>
        </TouchableOpacity>
        <Text style={styles.roleTitle}>Elige tu perfil</Text>
        <Text style={styles.roleSubtitle}>¿Cómo deseas utilizar Pildhora?</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        <RoleCard
          role="patient"
          title="Paciente"
          description="Quiero gestionar mis propios medicamentos y recibir recordatorios."
          icon="person"
          color={colors.primary[500]}
          bgColor="#EFF6FF"
          onSelect={onSelect}
        />

        <RoleCard
          role="caregiver"
          title="Cuidador"
          description="Quiero ayudar a un familiar o paciente a gestionar su salud."
          icon="heart"
          color={colors.success[500]}
          bgColor="#F0FDF4"
          onSelect={onSelect}
        />
      </ScrollView>

      <View style={styles.footerSection}>
        <TouchableOpacity
          onPress={onLogin}
          accessibilityLabel="Iniciar sesión"
        >
          <Text style={styles.loginText}>
            ¿Ya tienes cuenta? <Text style={styles.loginTextBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function WelcomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, initializing } = useSelector((state: RootState) => state.auth);
  const [isRouting, setIsRouting] = useState(false);
  const [viewState, setViewState] = useState<'landing' | 'roles'>('landing');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Track performance metrics
  const renderStartTime = useRef(Date.now());

  useEffect(() => {
    const timeToRender = Date.now() - renderStartTime.current;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WelcomeScreen] Initial render took ${timeToRender}ms`);
    }

    // Check auth state
    dispatch(checkAuthState());

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dispatch]);

  // Handle automatic routing
  useEffect(() => {
    const handleRouting = async () => {
      if (!initializing && !loading && isAuthenticated && user) {
        setIsRouting(true);
        try {
          const route = await getPostAuthRoute(user);
          router.replace(route);
        } catch (error: any) {
          console.error('[Index] Routing error:', error);
          Alert.alert(
            'Error de conexión',
            'No pudimos conectarnos. Por favor verifica tu internet.',
            [{ text: 'OK', onPress: () => setIsRouting(false) }]
          );
          setIsRouting(false);
        }
      }
    };

    handleRouting();
  }, [isAuthenticated, user, loading, initializing, router]);

  const handleStart = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewState('roles');
  }, []);

  const handleBackToLanding = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewState('landing');
  }, []);

  const handleRoleSelect = useCallback((role: 'patient' | 'caregiver') => {
    router.push(`/auth/signup?role=${role}`);
  }, [router]);

  const handleLogin = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  if (loading || initializing || isRouting) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={['#F0F9FF', '#E0F2FE']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative background elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <Animated.View
            style={[
              styles.contentWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {viewState === 'landing' ? (
              <LandingView onStart={handleStart} onLogin={handleLogin} />
            ) : (
              <RoleSelectionView
                onBack={handleBackToLanding}
                onSelect={handleRoleSelect}
                onLogin={handleLogin}
              />
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  // Error Boundary Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  viewContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
  },

  // Decorative Elements
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary[100],
    opacity: 0.4,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.success[100],
    opacity: 0.3,
  },

  // Landing Styles
  heroSection: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing['xl'],
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
    ...shadows.lg,
    shadowColor: colors.primary[200],
  },
  appName: {
    fontSize: 48,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing['3xl'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
  },
  featureDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.md,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.md,
  },
  startButtonContainer: {
    width: '100%',
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.lg,
    ...shadows.lg,
    shadowColor: colors.primary[500],
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  startButtonGradient: {
    paddingVertical: 18, // Slightly taller
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  startButtonIcon: {
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginLink: {
    padding: spacing.sm,
  },
  loginText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  loginTextBold: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },

  // Role Selection Styles
  headerSection: {
    width: '100%',
    marginBottom: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    marginTop: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.xs,
    zIndex: 10,
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  roleTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  roleSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },
  scrollView: {
    width: '100%',
    flex: 1,
  },
  cardsContainer: {
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  roleCard: {
    width: '100%',
    borderRadius: borderRadius.xl,
    ...shadows.md,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.md,
  },
  roleCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  roleName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  footerSection: {
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },
});

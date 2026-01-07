import { useState, useEffect, useRef } from 'react';
import { Text, View, Alert, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { signIn, logout, signInWithGoogle } from '../../src/store/slices/authSlice';
import { RootState, AppDispatch } from '../../src/store';
import { getAuthInstance } from '../../src/services/firebase';
import { Button, AppIcon } from '../../src/components/ui';
import { PHTextField } from '../../src/components/ui/PHTextField';
import { getPostAuthRoute } from '../../src/services/routing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, isAuthenticated, user, initializing } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const handleRouting = async () => {
      if (!initializing && isAuthenticated && user) {
        setIsRouting(true);
        try {
          const route = await getPostAuthRoute(user);
          router.replace(route);
        } catch (error: any) {
          console.error('[LoginScreen] Routing error:', error);
          Alert.alert('Error de navegación', error.userMessage || 'No se pudo determinar la ruta.');
          setIsRouting(false);
        }
      }
    };

    handleRouting();
  }, [isAuthenticated, user, initializing, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos para continuar.');
      return;
    }
    if (loading || isRouting) return;
    
    if (isAuthenticated && user) {
      setIsRouting(true);
      try {
        const route = await getPostAuthRoute(user);
        router.replace(route);
      } catch (error: any) {
        setIsRouting(false);
      }
      return;
    }

    try {
      setIsRouting(true);
      const result = await dispatch(signIn({ email: email.trim(), password })).unwrap();
      const route = await getPostAuthRoute(result);
      router.replace(route);
    } catch (error: any) {
      setIsRouting(false);
      const message = typeof error === 'string' ? error : (error?.message || 'Error desconocido');
      let friendly = message;
      if (message.includes('auth/wrong-password') || message.includes('INVALID_LOGIN_CREDENTIALS')) {
        friendly = 'Contraseña o correo incorrectos. Intenta nuevamente.';
      } else if (message.includes('auth/user-not-found')) {
        friendly = 'No existe una cuenta con ese correo.';
      } else if (message.includes('auth/too-many-requests')) {
        friendly = 'Demasiados intentos. Espera un momento y vuelve a intentar.';
      }
      Alert.alert('Error de inicio de sesión', friendly);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || isRouting) return;
    try {
      setIsRouting(true);
      const result = await dispatch(signInWithGoogle({})).unwrap();
      const route = await getPostAuthRoute(result);
      router.replace(route);
    } catch (error: any) {
      setIsRouting(false);
      const message = typeof error === 'string' ? error : (error?.message || 'Error desconocido');
      Alert.alert('Error de Google', message);
    }
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  const handleLogout = async () => {
    await dispatch(logout());
    try { 
      const authInstance = await getAuthInstance();
      if (authInstance) await authInstance.signOut(); 
    } catch {}
    Alert.alert('Sesión cerrada', 'Has cerrado sesión. Ahora puedes iniciar con otra cuenta.');
  };

  if (isRouting) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#EFF6FF', '#DBEAFE']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Iniciando sesión...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#DBEAFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {isAuthenticated && user && (
                <View style={styles.loggedInContainer}>
                  <Text style={styles.loggedInText}>
                    Ya iniciaste sesión como {user.email || user.name}.
                  </Text>
                  <TouchableOpacity onPress={handleLogout} style={styles.logoutLink}>
                    <Text style={styles.logoutLinkText}>Cerrar Sesión</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.iconWrapper}>
                  <AppIcon size="xl" showShadow={true} rounded={true} />
                </View>
                <Text style={styles.title}>Bienvenido de nuevo</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Correo electrónico</Text>
                  <PHTextField
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Contraseña</Text>
                  <PHTextField
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secure
                  />
                </View>

                <Button
                  onPress={handleLogin}
                  disabled={loading || isRouting}
                  variant="primary"
                  size="lg"
                  style={styles.loginButton}
                >
                  {loading || isRouting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>O</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  onPress={handleGoogleLogin}
                  disabled={loading || isRouting}
                  variant="secondary"
                  size="lg"
                  style={styles.googleButton}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="logo-google" size={20} color={colors.gray[700]} />
                    <Text style={{ color: colors.gray[700], fontWeight: '600' }}>Continuar con Google</Text>
                  </View>
                </Button>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
                <TouchableOpacity onPress={navigateToSignup} style={styles.signupLink}>
                  <Text style={styles.signupLinkText}>Regístrate</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                <Text style={styles.backLinkText}>Volver al inicio</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  loggedInContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  loggedInText: {
    color: '#92400E',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
  },
  logoutLink: {
    padding: spacing.xs,
  },
  logoutLinkText: {
    color: '#B45309',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  loginButton: {
    marginTop: spacing.sm,
    width: '100%',
    height: 56,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.gray[400],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  googleButton: {
    width: '100%',
    height: 56,
    borderColor: colors.gray[300],
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.gray[600],
    fontSize: typography.fontSize.base,
  },
  signupLink: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  signupLinkText: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
  },
  backLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.sm,
  },
  backLinkText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
  },
});

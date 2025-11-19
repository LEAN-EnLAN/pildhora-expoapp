import { useState, useEffect, useRef } from 'react';
import { Text, View, Alert, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { signUp, signInWithGoogle } from '../../src/store/slices/authSlice';
import { RootState, AppDispatch } from '../../src/store';
import { Button, AppIcon } from '../../src/components/ui';
import { PHTextField } from '../../src/components/ui/PHTextField';
import { getPostAuthRoute } from '../../src/services/routing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens';

const { width } = Dimensions.get('window');

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
  const [isRouting, setIsRouting] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, isAuthenticated, user, initializing } = useSelector((state: RootState) => state.auth);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.role && (params.role === 'patient' || params.role === 'caregiver')) {
      setRole(params.role as 'patient' | 'caregiver');
    }

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
  }, [params.role]);

  useEffect(() => {
    const handleRouting = async () => {
      if (!initializing && isAuthenticated && user) {
        setIsRouting(true);
        try {
          const route = await getPostAuthRoute(user);
          router.replace(route);
        } catch (error: any) {
          console.error('[SignupScreen] Routing error:', error);
          Alert.alert('Error de navegación', error.userMessage || 'No se pudo determinar la ruta.');
          setIsRouting(false);
        }
      }
    };

    handleRouting();
  }, [isAuthenticated, user, initializing, router]);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos para continuar.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Por favor verifica que las contraseñas sean iguales.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
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
      const result = await dispatch(signUp({ email, password, name, role })).unwrap();
      const route = await getPostAuthRoute(result);

      Alert.alert('¡Bienvenido!', 'Tu cuenta ha sido creada exitosamente.', [
        {
          text: 'Comenzar',
          onPress: () => {
            router.replace(route);
          },
        },
      ]);
    } catch (error) {
      setIsRouting(false);
      Alert.alert('Error de registro', error as string);
    }
  };

  const navigateToLogin = () => {
    router.replace('/auth/login');
  };

  const handleGoogleSignup = async () => {
    if (loading || isRouting) return;
    try {
      setIsRouting(true);
      const result = await dispatch(signInWithGoogle({ role })).unwrap();
      const route = await getPostAuthRoute(result);
      router.replace(route);
    } catch (error: any) {
      setIsRouting(false);
      const message = typeof error === 'string' ? error : (error?.message || 'Error desconocido');
      Alert.alert('Error de Google', message);
    }
  };

  if (isRouting) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#EFF6FF', '#DBEAFE']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
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
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.iconWrapper}>
                  <AppIcon size="xl" showShadow={true} rounded={true} />
                </View>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Comienza tu viaje hacia una mejor salud</Text>
              </View>

              {/* Role Selection */}
              <View style={styles.roleSection}>
                <Text style={styles.sectionLabel}>¿Cómo usarás la app?</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    onPress={() => setRole('patient')}
                    style={[
                      styles.roleCard,
                      role === 'patient' && styles.roleCardSelected
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.roleIconContainer,
                      role === 'patient' ? styles.roleIconSelected : styles.roleIconUnselected
                    ]}>
                      <Ionicons
                        name="person"
                        size={24}
                        color={role === 'patient' ? '#FFFFFF' : colors.gray[500]}
                      />
                    </View>
                    <Text style={[
                      styles.roleText,
                      role === 'patient' && styles.roleTextSelected
                    ]}>Paciente</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRole('caregiver')}
                    style={[
                      styles.roleCard,
                      role === 'caregiver' && styles.roleCardSelected
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.roleIconContainer,
                      role === 'caregiver' ? styles.roleIconSelected : styles.roleIconUnselected
                    ]}>
                      <Ionicons
                        name="heart"
                        size={24}
                        color={role === 'caregiver' ? '#FFFFFF' : colors.gray[500]}
                      />
                    </View>
                    <Text style={[
                      styles.roleText,
                      role === 'caregiver' && styles.roleTextSelected
                    ]}>Cuidador</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Nombre completo</Text>
                  <PHTextField
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

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
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChangeText={setPassword}
                    secure
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                  <PHTextField
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secure
                  />
                </View>

                <Button
                  onPress={handleSignup}
                  disabled={loading || isRouting}
                  variant="primary"
                  size="lg"
                  style={styles.signupButton}
                >
                  {loading || isRouting ? 'Creando cuenta...' : 'Registrarse'}
                </Button>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>O</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  onPress={handleGoogleSignup}
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
                <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
                <TouchableOpacity onPress={navigateToLogin} style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Iniciar sesión</Text>
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
  roleSection: {
    marginBottom: spacing.xl,
    width: '100%',
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  roleCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: '#EFF6FF',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  roleIconSelected: {
    backgroundColor: colors.primary[500],
  },
  roleIconUnselected: {
    backgroundColor: colors.gray[100],
  },
  roleText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
  },
  roleTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
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
  signupButton: {
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
  loginLink: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  loginLinkText: {
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

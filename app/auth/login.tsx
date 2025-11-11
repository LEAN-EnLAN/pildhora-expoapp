import { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { signIn, logout } from '../../src/store/slices/authSlice';
import { RootState, AppDispatch } from '../../src/store';
import { getAuthInstance } from '../../src/services/firebase';

// Disable shadow styles on web to avoid RN Web generating boxShadow CSS
const commonShadow = Platform.select({
  web: {},
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 384,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    backgroundColor: '#007AFF',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...commonShadow,
  },
  logoText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
    fontSize: 16,
    ...Platform.select({
      web: {},
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  passwordContainer: {
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    ...commonShadow,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signUpText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  signUpLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backContainer: {
    alignItems: 'center',
  },
  backText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated, user, initializing } = useSelector((state: RootState) => state.auth);

  // If a user is already authenticated, show a helpful banner and option to log out.
  // This avoids confusion where an existing session could redirect unexpectedly.
  useEffect(() => {
    // Check if user is already authenticated and redirect if needed
    if (!initializing && isAuthenticated && user) {
      console.log('[Login] User already authenticated, redirecting to appropriate page');
      if (user.role === 'patient') {
        router.replace('/patient/home');
      } else {
        router.replace('/caregiver/dashboard');
      }
    }
  }, [isAuthenticated, user, initializing, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.login.errorTitle'), t('auth.login.fillAllFields'));
      return;
    }

    // Prevent duplicate login attempts
    if (loading) {
      console.log('[Login] Login already in progress, ignoring duplicate request');
      return;
    }

    // Check if user is already authenticated
    if (isAuthenticated && user) {
      console.log('[Login] User already authenticated, redirecting to appropriate page');
      if (user.role === 'patient') {
        router.replace('/patient/home');
      } else {
        router.replace('/caregiver/dashboard');
      }
      return;
    }

    try {
      const result = await dispatch(signIn({ email: email.trim(), password })).unwrap();
      // La navegación será manejada por el cambio de estado de autenticación
      if (result.role === 'patient') {
        router.replace('/patient/home');
      } else {
        router.replace('/caregiver/dashboard');
      }
    } catch (error: any) {
      // Mensajes más amigables para errores comunes de Firebase Auth
      const message = typeof error === 'string' ? error : (error?.message || 'Error desconocido');
      let friendly = message;
      if (message.includes('auth/wrong-password')) friendly = t('auth.login.wrongPassword');
      if (message.includes('auth/user-not-found')) friendly = t('auth.login.userNotFound');
      if (message.includes('auth/too-many-requests')) friendly = t('auth.login.tooManyRequests');
      Alert.alert(t('auth.login.loginErrorTitle'), friendly);
    }
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  const handleLogout = async () => {
    // Cerrar sesión para limpiar cualquier sesión existente y estado de autenticación persistido
    await dispatch(logout());
    // También aseguramos que la sesión de Firebase Auth se cierre
    try { 
      const authInstance = await getAuthInstance();
      if (authInstance) await authInstance.signOut(); 
    } catch {}
    Alert.alert(t('auth.login.sessionClosedTitle'), t('auth.login.sessionClosedMessage'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <View style={styles.formContainer}>
          {/* Session Banner */}
          {isAuthenticated && user ? (
            <View style={{ backgroundColor: '#FFF3CD', borderColor: '#FFEEBA', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: '#856404' }}>
                {t('auth.login.loggedInAs', { user: user.email || user.name })}
              </Text>
              <TouchableOpacity onPress={handleLogout} style={{ marginTop: 8 }}>
                <Text style={{ color: '#007AFF', fontWeight: '600' }}>{t('auth.login.logout')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.welcomeTitle}>{t('auth.login.welcomeBack')}</Text>
            <Text style={styles.welcomeSubtitle}>{t('auth.login.loginToYourAccount')}</Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.login.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.login.enterYourEmail')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.passwordContainer}>
            <Text style={styles.inputLabel}>{t('auth.login.password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.login.enterYourPassword')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>
              {loading ? t('auth.login.loggingIn') : t('auth.login.login')}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>{t('auth.login.noAccount')}</Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={styles.signUpLink}>{t('auth.login.signUp')}</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backContainer} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('auth.login.backToRoleSelection')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

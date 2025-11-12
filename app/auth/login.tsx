import { useEffect, useState } from 'react';
import { Text, View, TextInput, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { signIn, logout } from '../../src/store/slices/authSlice';
import { RootState, AppDispatch } from '../../src/store';
import { getAuthInstance } from '../../src/services/firebase';
import { Button, Card, Container } from '../../src/components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated, user, initializing } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!initializing && isAuthenticated && user) {
      if (user.role === 'patient') {
        router.replace('/patient/home');
      } else {
        router.replace('/caregiver/dashboard');
      }
    }
  }, [isAuthenticated, user, initializing, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (loading) return;
    if (isAuthenticated && user) {
      if (user.role === 'patient') {
        router.replace('/patient/home');
      } else {
        router.replace('/caregiver/dashboard');
      }
      return;
    }
    try {
      const result = await dispatch(signIn({ email: email.trim(), password })).unwrap();
      if (result.role === 'patient') {
        router.replace('/patient/home');
      } else {
        router.replace('/caregiver/dashboard');
      }
    } catch (error: any) {
      const message = typeof error === 'string' ? error : (error?.message || 'Error desconocido');
      let friendly = message;
      if (message.includes('auth/wrong-password')) friendly = 'Contraseña incorrecta. Intenta nuevamente.';
      if (message.includes('auth/user-not-found')) friendly = 'No existe una cuenta con ese correo.';
      if (message.includes('auth/too-many-requests')) friendly = 'Demasiados intentos. Espera un momento y vuelve a intentar.';
      Alert.alert('Error de inicio de sesión', friendly);
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

  return (
    <Container style={styles.flex1}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Card style={styles.card}>
          {isAuthenticated && user && (
            <View style={styles.loggedInContainer}>
              <Text style={styles.loggedInText}>
                Ya iniciaste sesión como {user.email || user.name}.
              </Text>
              <Button onPress={handleLogout} variant="secondary" size="sm" style={styles.logoutButton}>
                Cerrar Sesión
              </Button>
            </View>
          )}

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>Inicia sesión en tu cuenta de Pildhora</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu correo"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Button
            onPress={handleLogin}
            disabled={loading}
            variant="primary"
            size="lg"
            style={styles.loginButton}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>¿No tienes una cuenta? </Text>
            <Button onPress={navigateToSignup} style={styles.signupButton}>
              Regístrate
            </Button>
          </View>

          <View style={styles.backButtonContainer}>
            <Button onPress={() => router.back()} style={styles.backButton}>
              ← Volver a la selección de rol
            </Button>
          </View>

        </Card>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 384,
    padding: 24,
  },
  loggedInContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  loggedInText: {
    color: '#92400E',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#3B82F6',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loginButton: {
    width: '100%',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#6B7280',
  },
  signupButton: {
    padding: 0,
  },
  backButtonContainer: {
    marginTop: 16,
  },
  backButton: {
    padding: 0,
  },
});

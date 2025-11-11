import { useState, useEffect } from 'react';
import { Text, View, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { signUp } from '../../src/store/slices/authSlice';
import { RootState, AppDispatch } from '../../src/store';
import { Button, Card, Container } from '../../src/components/ui';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, isAuthenticated, user, initializing } = useSelector((state: RootState) => state.auth);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.role && (params.role === 'patient' || params.role === 'caregiver')) {
      setRole(params.role as 'patient' | 'caregiver');
    }
  }, [params.role]);

  useEffect(() => {
    if (!initializing && isAuthenticated && user) {
      if (user.role === 'patient') {
        router.replace('/patient/home');
      } else {
        router.replace('/caregiver/dashboard');
      }
    }
  }, [isAuthenticated, user, initializing, router]);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
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
      const result = await dispatch(signUp({ email, password, name, role })).unwrap();
      Alert.alert('Éxito', '¡Cuenta creada exitosamente!', [
        {
          text: 'Aceptar',
          onPress: () => {
            if (result.role === 'patient') {
              router.replace('/patient/home');
            } else {
              router.replace('/caregiver/dashboard');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error de registro', error as string);
    }
  };

  const navigateToLogin = () => {
    router.replace('/auth/login');
  };

  return (
    <Container style={styles.flex1}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Únete a Pildhora hoy</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre completo"
              value={name}
              onChangeText={setName}
            />
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Soy:</Text>
            <View style={styles.roleContainer}>
              <Button
                onPress={() => setRole('patient')}
                style={[styles.roleButton, styles.marginRight2, role === 'patient' ? styles.patientSelected : styles.roleUnselected]}
                variant={role === 'patient' ? 'primary' : 'secondary'}
              >
                Paciente
              </Button>
              <Button
                onPress={() => setRole('caregiver')}
                style={[styles.roleButton, styles.marginLeft2, role === 'caregiver' ? styles.caregiverSelected : styles.roleUnselected]}
                variant={role === 'caregiver' ? 'primary' : 'secondary'}
              >
                Cuidador
              </Button>
            </View>
          </View>

          <Button
            onPress={handleSignup}
            disabled={loading}
            variant="primary"
            size="lg"
            style={styles.signupButton}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </Button>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
            <Button onPress={navigateToLogin} style={styles.loginButton}>
              Iniciar sesión
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
  roleContainer: {
    flexDirection: 'row',
  },
  roleButton: {
    flex: 1,
  },
  marginRight2: {
    marginRight: 8,
  },
  marginLeft2: {
    marginLeft: 8,
  },
  patientSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  caregiverSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  roleUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  signupButton: {
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#6B7280',
  },
  loginButton: {
    padding: 0,
  },
  backButtonContainer: {
    marginTop: 16,
  },
  backButton: {
    padding: 0,
  },
});

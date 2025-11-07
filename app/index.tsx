import { useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../src/store';
import { checkAuthState } from '../src/store/slices/authSlice';

// Avoid React Native Web generating boxShadow CSS by removing shadow props on web
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 16,
  },
  logoContainer: {
    width: 128,
    height: 128,
    backgroundColor: '#007AFF',
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...commonShadow,
  },
  logoText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 32,
  },
  patientButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...commonShadow,
  },
  caregiverButton: {
    backgroundColor: '#34C759',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    ...commonShadow,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  signInText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default function WelcomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check if user is already authenticated
    dispatch(checkAuthState());
  }, [dispatch]);

  useEffect(() => {
    // Redirect based on auth state
    if (!loading) {
      if (isAuthenticated && user) {
        if (user.role === 'patient') {
          router.replace('/patient/home');
        } else {
          router.replace('/caregiver/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, loading, router]);

  const handleRoleSelect = (role: 'patient' | 'caregiver') => {
    // Navigate to signup with pre-selected role
    router.push(`/auth/signup?role=${role}`);
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo/Icon */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>P</Text>
      </View>

      {/* Welcome Text */}
      <Text style={styles.welcomeTitle}>Welcome to Pildhora</Text>
      <Text style={styles.welcomeSubtitle}>Smart Pillbox Management System</Text>

      {/* Role Selection Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.patientButton}
          onPress={() => handleRoleSelect('patient')}
        >
          <Text style={styles.buttonText}>I'm a Patient</Text>
          <Text style={styles.buttonSubtext}>Manage my medications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.caregiverButton}
          onPress={() => handleRoleSelect('caregiver')}
        >
          <Text style={styles.buttonText}>I'm a Caregiver</Text>
          <Text style={styles.buttonSubtext}>Monitor patient medications</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.signInText}>Ya tienes una cuenta? Inicia Sesion!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
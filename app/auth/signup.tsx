import { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { signUp } from '../../src/store/slices/authSlice';
import { RootState, AppDispatch } from '../../src/store';

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  confirmPasswordContainer: {
    marginBottom: 24,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  roleButtonContainer: {
    flexDirection: 'row',
  },
  roleButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roleButtonSelected: {
    borderColor: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  caregiverButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    marginLeft: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  caregiverButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  roleButtonTextSelected: {
    color: '#34C759',
  },
  caregiverButtonTextSelected: {
    color: '#007AFF',
  },
  signUpButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signInText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  signInLink: {
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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const params = useLocalSearchParams();

  useEffect(() => {
    // Set role from URL parameter if provided
    if (params.role && (params.role === 'patient' || params.role === 'caregiver')) {
      setRole(params.role as 'patient' | 'caregiver');
    }
  }, [params.role]);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const result = await dispatch(signUp({ email, password, name, role })).unwrap();
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
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
      Alert.alert('Signup Failed', error as string);
    }
  };

  const navigateToLogin = () => {
    router.replace('/auth/login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <View style={styles.formContainer}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtitle}>Join Pildhora today</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.confirmPasswordContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'patient' && styles.roleButtonSelected
                ]}
                onPress={() => setRole('patient')}
              >
                <Text style={[
                  styles.roleButtonText,
                  role === 'patient' && styles.roleButtonTextSelected
                ]}>
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.caregiverButton,
                  role === 'caregiver' && styles.caregiverButtonSelected
                ]}
                onPress={() => setRole('caregiver')}
              >
                <Text style={[
                  styles.roleButtonText,
                  role === 'caregiver' && styles.caregiverButtonTextSelected
                ]}>
                  Caregiver
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signUpButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backContainer} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back to Role Selection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
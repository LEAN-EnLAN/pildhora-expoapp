import { useState, useEffect } from 'react';
import { Text, View, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
    <Container className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center p-4"
      >
        <Card className="w-full max-w-sm p-6">
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-blue-500 rounded-full justify-center items-center mb-4 shadow-lg">
              <Text className="text-white text-5xl font-bold">P</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800">Crear cuenta</Text>
            <Text className="text-gray-500 mt-1">Únete a Pildhora hoy</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Nombre completo</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 bg-white text-base shadow-sm"
              placeholder="Ingresa tu nombre completo"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Correo electrónico</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 bg-white text-base shadow-sm"
              placeholder="Ingresa tu correo"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Contraseña</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 bg-white text-base shadow-sm"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Confirmar contraseña</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 bg-white text-base shadow-sm"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">Soy:</Text>
            <View className="flex-row">
              <Button
                onPress={() => setRole('patient')}
                className={`flex-1 mr-2 ${role === 'patient' ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'}`}
                variant={role === 'patient' ? 'primary' : 'secondary'}
              >
                Paciente
              </Button>
              <Button
                onPress={() => setRole('caregiver')}
                className={`flex-1 ml-2 ${role === 'caregiver' ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'}`}
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
            className="w-full"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </Button>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-500">¿Ya tienes una cuenta? </Text>
            <Button onPress={navigateToLogin} className="p-0">
              Iniciar sesión
            </Button>
          </View>

          <View className="mt-4">
            <Button onPress={() => router.back()} className="p-0">
              ← Volver a la selección de rol
            </Button>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Container>
  );
}
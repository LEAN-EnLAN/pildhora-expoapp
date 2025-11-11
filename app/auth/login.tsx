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
    <Container className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center p-4"
      >
        <Card className="w-full max-w-sm p-6">
          {isAuthenticated && user && (
            <View className="bg-yellow-100 border border-yellow-200 p-3 rounded-lg mb-4">
              <Text className="text-yellow-800 text-center">
                Ya iniciaste sesión como {user.email || user.name}.
              </Text>
              <Button onPress={handleLogout} variant="secondary" size="sm" className="mt-2">
                Cerrar Sesión
              </Button>
            </View>
          )}

          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-blue-500 rounded-full justify-center items-center mb-4 shadow-lg">
              <Text className="text-white text-5xl font-bold">P</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800">Bienvenido de nuevo</Text>
            <Text className="text-gray-500 mt-1">Inicia sesión en tu cuenta de Pildhora</Text>
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

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Contraseña</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 bg-white text-base shadow-sm"
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
            className="w-full"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-500">¿No tienes una cuenta? </Text>
            <Button onPress={navigateToSignup} className="p-0">
              Regístrate
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

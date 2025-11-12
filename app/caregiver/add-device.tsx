import React, { useState } from 'react';
import { Text, View, TextInput, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../src/store';
import { doc, getDoc } from 'firebase/firestore';
import { getDbInstance } from '../../src/services/firebase';
import { startDeviceListener } from '../../src/store/slices/deviceSlice';

type Step = 'enterId' | 'linking' | 'success' | 'error';

export default function AddPatientScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [step, setStep] = useState<Step>('enterId');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [foundPatientName, setFoundPatientName] = useState<string>('');
  const [deviceId, setDeviceId] = useState('');

  const handleLink = async () => {
    setStep('linking');
    try {
      const db = await getDbInstance();
      const deviceRef = doc(db, 'devices', deviceId.trim());
      const snap = await getDoc(deviceRef);
      if (!snap.exists()) {
        Alert.alert('Aviso', 'No se encontró el dispositivo en la base de datos. Asegúrate de que el ESP8266 esté conectado a Wi‑Fi y enviando su estado.');
      }
      dispatch(startDeviceListener(deviceId.trim()));
      setFoundPatientName('');
      setStep('success');
    } catch (error: any) {
      console.error("Error finding patient by device:", error);
      setErrorMessage(error.message || 'Ocurrió un error al verificar el dispositivo.');
      setStep('error');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'enterId':
        return (
          <View style={styles.center}>
            <Text style={styles.title}>Vincular ESP8266 por Wi‑Fi</Text>
            <Text style={styles.subtitle}>Ingresa el ID del dispositivo (por ejemplo, el MAC o identificador asignado).</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: esp8266-ABC123"
              value={deviceId}
              onChangeText={setDeviceId}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={handleLink} style={styles.button} disabled={!deviceId.trim()}>
              <Text style={styles.buttonText}>Vincular</Text>
            </TouchableOpacity>
          </View>
        );
      case 'linking':
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.statusText}>Vinculando dispositivo...</Text>
          </View>
        );
      case 'success':
        return (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={80} color="green" />
            <Text style={styles.title}>Dispositivo Vinculado</Text>
            <Text style={styles.subtitle}>
              El dispositivo ha sido vinculado y se iniciará la lectura de estado.
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.button}>
              <Text style={styles.buttonText}>Hecho</Text>
            </TouchableOpacity>
          </View>
        );
      case 'error':
        return (
          <View style={styles.center}>
            <Ionicons name="close-circle" size={80} color="red" />
            <Text style={styles.title}>Error</Text>
            <Text style={styles.subtitle}>
              {errorMessage || 'No se pudo vincular el dispositivo.'}
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.button}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Vincular Dispositivo' }} />
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statusText: {
    marginTop: 16,
    fontSize: 18,
    color: '#4B5563',
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

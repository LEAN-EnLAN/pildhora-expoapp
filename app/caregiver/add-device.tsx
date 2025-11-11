import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../src/store';
import { initializeBLE, scanForDevices } from '../../src/store/slices/bleSlice';
import { Device } from 'react-native-ble-plx';
import { findPatientByDevice } from '../../src/services/firebase/user';

type Step = 'initializing' | 'scanning' | 'selectDevice' | 'linking' | 'success' | 'error';

export default function AddPatientScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { devices, scanning, error: bleError } = useSelector((state: RootState) => state.ble);
  
  const [step, setStep] = useState<Step>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [foundPatientName, setFoundPatientName] = useState<string>('');

  useEffect(() => {
    dispatch(initializeBLE()).then(() => {
      dispatch(scanForDevices());
    });
  }, [dispatch]);

  useEffect(() => {
    if (scanning) {
      setStep('scanning');
    } else if (devices.length > 0) {
      setStep('selectDevice');
    }
    if (bleError) {
      setStep('error');
      setErrorMessage(bleError);
    }
  }, [scanning, devices, bleError]);

  const handleSelectDevice = async (device: Device) => {
    setStep('linking');
    try {
      const patient = await findPatientByDevice(device.id);
      if (patient) {
        setFoundPatientName(patient.name);
        setStep('success');
      } else {
        setErrorMessage('Este dispositivo no está registrado a ningún paciente.');
        setStep('error');
      }
    } catch (error: any) {
      console.error("Error finding patient by device:", error);
      setErrorMessage(error.message || 'Ocurrió un error al verificar el dispositivo.');
      setStep('error');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'initializing':
      case 'scanning':
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.statusText}>
              {step === 'initializing' ? 'Iniciando Bluetooth...' : 'Buscando dispositivos...'}
            </Text>
          </View>
        );
      case 'selectDevice':
        return (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<Text style={styles.listHeader}>Selecciona un Dispositivo</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectDevice(item)}
                style={styles.deviceItem}
              >
                <Text style={styles.deviceName}>{item.name || 'Dispositivo Desconocido'}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
                <Ionicons name="chevron-forward" size={24} color="gray" />
              </TouchableOpacity>
            )}
          />
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
              El dispositivo ha sido vinculado correctamente al paciente {foundPatientName}.
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Vincular Dispositivo' }} />
      {renderContent()}
    </View>
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
  listHeader: {
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  deviceItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceName: {
    fontWeight: '600',
    fontSize: 16,
  },
  deviceId: {
    color: '#6B7280',
    fontSize: 12,
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

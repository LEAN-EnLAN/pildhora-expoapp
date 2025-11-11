import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../src/store';
import { initializeBLE, scanForDevices } from '../../src/store/slices/bleSlice';
import { Device } from 'react-native-ble-plx';
import { findPatientByDevice } from '../../src/services/firebase/user';

type Step = 'initializing' | 'scanning' | 'selectDevice' | 'linking' | 'success' | 'error';

export default function AddPatientScreen() {
  const { t } = useTranslation();
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
        setErrorMessage(t('caregiver.addDevice.noPatient'));
        setStep('error');
      }
    } catch (error: any) {
      console.error("Error finding patient by device:", error);
      setErrorMessage(error.message || t('caregiver.addDevice.errorChecking'));
      setStep('error');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'initializing':
      case 'scanning':
        return (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-lg text-gray-600">
              {step === 'initializing' ? t('caregiver.addDevice.initializing') : t('caregiver.addDevice.scanning')}
            </Text>
          </View>
        );
      case 'selectDevice':
        return (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<Text className="p-4 text-xl font-bold">{t('caregiver.addDevice.selectDevice')}</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectDevice(item)}
                className="bg-white p-4 m-2 rounded-lg flex-row items-center justify-between"
              >
                <Text className="font-semibold text-base">{item.name || t('caregiver.addDevice.unknownDevice')}</Text>
                <Text className="text-gray-500 text-xs">{item.id}</Text>
                <Ionicons name="chevron-forward" size={24} color="gray" />
              </TouchableOpacity>
            )}
          />
        );
      case 'linking':
        return (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-lg text-gray-600">{t('caregiver.addDevice.linking')}</Text>
          </View>
        );
      case 'success':
        return (
          <View className="flex-1 justify-center items-center p-4">
            <Ionicons name="checkmark-circle" size={80} color="green" />
            <Text className="mt-4 text-2xl font-bold text-center">{t('caregiver.addDevice.deviceLinked')}</Text>
            <Text className="text-gray-600 text-center mt-2">
              {t('caregiver.addDevice.deviceLinkedTo', { patientName: foundPatientName })}
            </Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-blue-500 p-3 rounded-lg mt-6 w-full items-center">
              <Text className="text-white text-center font-bold">{t('caregiver.addDevice.done')}</Text>
            </TouchableOpacity>
          </View>
        );
      case 'error':
        return (
          <View className="flex-1 justify-center items-center p-4">
            <Ionicons name="close-circle" size={80} color="red" />
            <Text className="mt-4 text-2xl font-bold text-center">{t('caregiver.addDevice.error')}</Text>
            <Text className="text-gray-600 text-center mt-2">
              {errorMessage || t('caregiver.addDevice.couldNotLink')}
            </Text>
            <TouchableOpacity onPress={() => router.back()} className="bg-blue-500 p-3 rounded-lg mt-6 w-full items-center">
              <Text className="text-white text-center font-bold">{t('caregiver.addDevice.close')}</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      <Stack.Screen options={{ headerShown: true, title: t('caregiver.addDevice.title') }} />
      {renderContent()}
    </View>
  );
}

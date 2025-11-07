import React, { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { AppDispatch, RootState } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { startDeviceListener, stopDeviceListener } from '../../src/store/slices/deviceSlice';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { db } from '../../src/services/firebase';
import DoseRing from '../../src/components/DoseRing';
import SkeletonLoader from '../../src/components/SkeletonLoader';
import DataSourceBadge from '../../src/components/DataSourceBadge';
import { Patient, PatientWithDevice, Task, DoseSegment } from '../../src/types';

// Static default data for immediate rendering
const STATIC_PATIENTS: Patient[] = [
  {
    id: 'patient-1',
    name: 'John Doe',
    email: 'john@example.com',
    caregiverId: 'caregiver-1',
    createdAt: new Date(),
    adherence: 85,
    lastTaken: '2 hours ago'
  },
  {
    id: 'patient-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    caregiverId: 'caregiver-1',
    createdAt: new Date(),
    adherence: 92,
    lastTaken: '30 minutes ago'
  },
];

const STATIC_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Refill prescription',
    description: 'Contact pharmacy for refill',
    patientId: 'patient-1',
    caregiverId: 'caregiver-1',
    completed: false,
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    createdAt: new Date()
  },
  {
    id: 'task-2',
    title: 'Schedule doctor visit',
    description: 'Annual checkup appointment',
    patientId: 'patient-2',
    caregiverId: 'caregiver-1',
    completed: true,
    dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
    createdAt: new Date()
  },
];

// Generate mock dose segments for demonstration
const generateMockDoseSegments = (adherence: number): DoseSegment[] => {
  const segments: DoseSegment[] = [];
  const hoursPerDose = 24 / 4; // 4 doses per day

  for (let i = 0; i < 4; i++) {
    const startHour = i * hoursPerDose;
    const endHour = (i + 1) * hoursPerDose;

    // Determine status based on adherence percentage
    let status: DoseSegment['status'] = 'PENDING';
    if (Math.random() * 100 < adherence) {
      status = 'DOSE_TAKEN';
    } else if (Math.random() > 0.5) {
      status = 'DOSE_MISSED';
    }

    segments.push({ startHour, endHour, status });
  }

  return segments;
};



export default function CaregiverDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { state: deviceState, listening } = useSelector((state: RootState) => state.device);
  const [refreshing, setRefreshing] = useState(false);
  const [patientsWithDevices, setPatientsWithDevices] = useState<PatientWithDevice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Cuidador');

  // Fetch patients using SWR pattern
  const patientsQuery = useMemo(() => {
    console.log('[CaregiverDashboard] Creating patients query, user:', user);
    if (!user) {
      console.log('[CaregiverDashboard] No user found, skipping patients query');
      return null;
    }
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'patient'),
      where('caregiverId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    console.log('[CaregiverDashboard] Patients query created:', q);
    return q;
  }, [user]);

  const {
    data: patients = [],
    source: patientsSource,
    isLoading: patientsLoading,
    error: patientsError
  } = useCollectionSWR<Patient>({
    cacheKey: `patients:${user?.id}`,
    query: patientsQuery,
    initialData: STATIC_PATIENTS,
  });

  // Log patients query results
  useEffect(() => {
    console.log('[CaregiverDashboard] Patients query state:', {
      isLoading: patientsLoading,
      error: patientsError,
      dataCount: patients.length,
      source: patientsSource
    });
    if (patientsError) {
      console.error('[CaregiverDashboard] Patients query error details:', patientsError);
    }
  }, [patientsLoading, patientsError, patients.length, patientsSource]);

  // Fetch tasks using SWR pattern
  const tasksQuery = useMemo(() => {
    console.log('[CaregiverDashboard] Creating tasks query, user:', user);
    if (!user) {
      console.log('[CaregiverDashboard] No user found, skipping tasks query');
      return null;
    }
    const q = query(
      collection(db, 'tasks'),
      where('caregiverId', '==', user.id),
      orderBy('dueDate', 'asc')
    );
    console.log('[CaregiverDashboard] Tasks query created:', q);
    return q;
  }, [user]);

  const {
    data: tasks = [],
    source: tasksSource,
    isLoading: tasksLoading,
    error: tasksError
  } = useCollectionSWR<Task>({
    cacheKey: `tasks:${user?.id}`,
    query: tasksQuery,
    initialData: STATIC_TASKS,
  });

  // Log tasks query results
  useEffect(() => {
    console.log('[CaregiverDashboard] Tasks query state:', {
      isLoading: tasksLoading,
      error: tasksError,
      dataCount: tasks.length,
      source: tasksSource
    });
    if (tasksError) {
      console.error('[CaregiverDashboard] Tasks query error details:', tasksError);
    }
  }, [tasksLoading, tasksError, tasks.length, tasksSource]);

  // Combine patients with device states and dose segments
  useEffect(() => {
    const enhancedPatients = patients.map((patient: Patient) => {
      // Generate mock dose segments based on adherence
      const doseSegments = generateMockDoseSegments(patient.adherence || 0);

      return {
        ...patient,
        deviceState: patient.deviceId ? deviceState : undefined,
        doseSegments,
      } as PatientWithDevice;
    });

    setPatientsWithDevices(enhancedPatients);
  }, [patients, deviceState]);

  // Start device listener for the first patient with a device
  useEffect(() => {
    const firstPatientWithDevice = patients.find(p => p.deviceId);
    if (firstPatientWithDevice?.deviceId && !listening) {
      dispatch(startDeviceListener(firstPatientWithDevice.deviceId));
    }

    return () => {
      if (listening) {
        dispatch(stopDeviceListener());
      }
    };
  }, [patients, dispatch, listening]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // The SWR hook will automatically refresh on remount or query change
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleEmergency = () => {
    setModalVisible(true);
  };

  const callEmergency = (number: string) => {
    try {
      Linking.openURL(`tel:${number}`);
    } catch (e) {
      // noop; on web this may not work
    }
    setModalVisible(false);
  };

  const renderPatientItem = ({ item }: { item: PatientWithDevice }) => (
    <View
      className="bg-gray-50 rounded-xl p-4"
      accessible={true}
      accessibilityLabel={`Patient: ${item.name}, Adherence: ${item.adherence}%`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
          <Text className="text-sm text-gray-600">
            Adherencia: {item.adherence}% | Última dosis: {item.lastTaken}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          (item.adherence || 0) > 80 ? 'bg-green-500' : 'bg-orange-500'
        }`}>
          <Text className="text-white font-semibold text-sm">{item.adherence}%</Text>
        </View>
      </View>

      {/* DoseRing visualization */}
      <View className="items-center justify-center my-4">
        <DoseRing
          segments={item.doseSegments || []}
          accessibilityLabel={`Dose adherence visualization for ${item.name}`}
        />
      </View>

      {/* Device status */}
      {item.deviceState && (
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
          <Text className="text-xs text-gray-600">
            Batería: {item.deviceState.battery_level}%
          </Text>
          <Text className={`text-xs font-medium ${
            item.deviceState.is_online ? 'text-green-600' : 'text-red-600'
          }`}>
            {item.deviceState.is_online ? 'En línea' : 'Desconectado'}
          </Text>
          <DataSourceBadge source={patientsSource} />
        </View>
      )}
    </View>
  );

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View
      className="flex-row items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
      accessible={true}
      accessibilityLabel={`Task: ${item.title} for patient ${item.patientId}, Status: ${item.completed ? 'Completed' : 'Pending'}`}
    >
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{item.title}</Text>
        <Text className="text-sm text-gray-600">
          Paciente: {patients.find(p => p.id === item.patientId)?.name || 'Desconocido'}
        </Text>
      </View>
      <View className={`px-3 py-1 rounded-full ${
        item.completed ? 'bg-green-500' : 'bg-orange-500'
      }`}>
        <Text className="text-white font-semibold text-sm">
          {item.completed ? 'Completado' : 'Pendiente'}
        </Text>
      </View>
    </View>
  );

  const renderPatientSkeleton = () => (
    <View className="bg-gray-50 rounded-xl p-4 mb-4">
      <SkeletonLoader height={20} width="60%" style={{ marginBottom: 8 }} />
      <SkeletonLoader height={16} width="40%" style={{ marginBottom: 16 }} />
      <SkeletonLoader height={120} width={120} style={{ alignSelf: 'center', marginBottom: 16 }} />
      <SkeletonLoader height={14} width="80%" />
    </View>
  );

  const renderTaskSkeleton = () => (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-200">
      <View className="flex-1">
        <SkeletonLoader height={16} width="70%" style={{ marginBottom: 4 }} />
        <SkeletonLoader height={14} width="50%" />
      </View>
      <SkeletonLoader height={20} width={60} />
    </View>
  );

  // Show error if both patients and tasks failed to load
  if (patientsError && tasksError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <View>
            <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
            <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
          </View>
          <TouchableOpacity className="px-3 py-2 rounded-lg bg-gray-400 items-center justify-center" onPress={async () => {
            await dispatch(logout());
            router.replace('/');
          }}>
            <Text className="text-white font-bold text-center">Salir</Text>
          </TouchableOpacity>
        </View>
        <View className="p-4">
          <View className="bg-red-100 border border-red-200 rounded-2xl p-4">
            <Text className="text-red-800 text-center font-semibold">
              Error al cargar datos. Verifica tu conexión e intenta nuevamente.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900">PILDHORA</Text>
          <Text className="text-sm text-gray-500">Hola, {displayName}</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {/* Emergency icon-only button */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-red-500 items-center justify-center"
            onPress={handleEmergency}
            accessibilityLabel="Emergencia"
            accessibilityHint="Toca para ver opciones de emergencia"
          >
            <Ionicons name="ios-alert" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity className="px-3 py-2 rounded-lg bg-gray-400 items-center justify-center" onPress={async () => {
            await dispatch(logout());
            router.replace('/');
          }}>
            <Text className="text-white font-bold text-center">Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center">
          <View className="bg-white w-11/12 max-w-md rounded-2xl p-4">
            <Text className="text-xl font-bold mb-2">Emergencia</Text>
            <Text className="text-gray-600 mb-4">Selecciona una opción:</Text>
            <View className="gap-3">
              <TouchableOpacity
                className="bg-red-600 rounded-lg px-4 py-3 items-center"
                onPress={() => callEmergency('911')}
              >
                <Text className="text-white font-bold">Llamar 911</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-orange-500 rounded-lg px-4 py-3 items-center"
                onPress={() => callEmergency('112')}
              >
                <Text className="text-white font-bold">Llamar 112</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-200 rounded-lg px-4 py-3 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-800 font-semibold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scrollable Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Patient Overview */}
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold">Resumen de Pacientes</Text>
              <DataSourceBadge source={patientsSource} />
            </View>
            {patientsLoading ? (
              <>
                {renderPatientSkeleton()}
                {renderPatientSkeleton()}
              </>
            ) : (
              patientsWithDevices.map((patient) => (
                <View key={patient.id} className="mb-4 last:mb-0">
                  {renderPatientItem({ item: patient })}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Tasks */}
        <View className="px-4">
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold">Tareas Recientes</Text>
              <DataSourceBadge source={tasksSource} />
            </View>
            {tasksLoading ? (
              <>
                {renderTaskSkeleton()}
                {renderTaskSkeleton()}
              </>
            ) : (
              tasks.map((task) => (
                <View key={task.id} className="mb-3 last:mb-0">
                  {renderTaskItem({ item: task })}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="p-4">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-xl p-4 items-center"
              accessible={true}
              accessibilityLabel="Añadir medicación"
              accessibilityHint="Navegar a pantalla de añadir medicación"
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold mt-1">Añadir Medicación</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-green-600 rounded-xl p-4 items-center"
              accessible={true}
              accessibilityLabel="Generar reporte"
              accessibilityHint="Generar reporte de adherencia para pacientes"
            >
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold mt-1">Generar Reporte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  patientItem: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    padding: 12,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  patientDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  adherenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goodAdherence: {
    backgroundColor: '#34C759',
  },
  warningAdherence: {
    backgroundColor: '#FF9500',
  },
  adherenceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  doseRingContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  deviceStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deviceStatusText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  onlineStatus: {
    color: '#34C759',
    fontWeight: '500',
  },
  offlineStatus: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  taskPatient: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  leftButton: {
    marginRight: 8,
  },
  rightButton: {
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FF3B30',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function CaregiverDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { state: deviceState, listening } = useSelector((state: RootState) => state.device);
  const [refreshing, setRefreshing] = useState(false);
  const [patientsWithDevices, setPatientsWithDevices] = useState<PatientWithDevice[]>([]);

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

  const renderPatientItem = ({ item }: { item: PatientWithDevice }) => (
    <View 
      style={styles.patientItem}
      accessible={true}
      accessibilityLabel={`Patient: ${item.name}, Adherence: ${item.adherence}%`}
    >
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientDetails}>
            Adherence: {item.adherence}% | Last taken: {item.lastTaken}
          </Text>
        </View>
        <View style={[
            styles.adherenceBadge,
            (item.adherence || 0) > 80 ? styles.goodAdherence : styles.warningAdherence
          ]}>
          <Text style={styles.adherenceText}>{item.adherence}%</Text>
        </View>
      </View>
      
      {/* DoseRing visualization */}
      <View style={styles.doseRingContainer}>
        <DoseRing 
          segments={item.doseSegments || []}
          accessibilityLabel={`Dose adherence visualization for ${item.name}`}
        />
      </View>
      
      {/* Device status */}
      {item.deviceState && (
        <View style={styles.deviceStatusContainer}>
          <Text style={styles.deviceStatusText}>
            Battery: {item.deviceState.battery_level}%
          </Text>
          <Text style={[
            styles.deviceStatusText,
            item.deviceState.is_online ? styles.onlineStatus : styles.offlineStatus
          ]}>
            {item.deviceState.is_online ? 'Online' : 'Offline'}
          </Text>
          <DataSourceBadge source={patientsSource} />
        </View>
      )}
    </View>
  );

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View 
      style={styles.taskItem}
      accessible={true}
      accessibilityLabel={`Task: ${item.title} for patient ${item.patientId}, Status: ${item.completed ? 'Completed' : 'Pending'}`}
    >
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskPatient}>
          Patient: {patients.find(p => p.id === item.patientId)?.name || 'Unknown'}
        </Text>
      </View>
      <View style={[
          styles.adherenceBadge,
          item.completed ? styles.completedBadge : styles.pendingBadge
        ]}>
        <Text style={styles.adherenceText}>
          {item.completed ? 'Done' : 'Pending'}
        </Text>
      </View>
    </View>
  );

  const renderPatientSkeleton = () => (
    <View style={styles.patientItem}>
      <SkeletonLoader height={20} width="60%" style={{ marginBottom: 8 }} />
      <SkeletonLoader height={16} width="40%" style={{ marginBottom: 16 }} />
      <SkeletonLoader height={120} width={120} style={{ alignSelf: 'center', marginBottom: 16 }} />
      <SkeletonLoader height={14} width="80%" />
    </View>
  );

  const renderTaskSkeleton = () => (
    <View style={styles.taskItem}>
      <SkeletonLoader height={16} width="70%" />
      <SkeletonLoader height={20} width={60} />
    </View>
  );

  // Show error if both patients and tasks failed to load
  if (patientsError && tasksError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Caregiver Dashboard</Text>
          <Text style={styles.headerSubtitle}>Monitor your patients</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load data. Please check your connection and try again.
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={async () => {
          await dispatch(logout());
          router.replace('/');
        }}>
          <Text style={styles.buttonText}>Log Out and Return</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={[]} // Empty data since we're using ListHeaderComponent for content
      renderItem={() => null}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Caregiver Dashboard</Text>
            <Text style={styles.headerSubtitle}>Monitor your patients</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Patient Overview</Text>
              <DataSourceBadge source={patientsSource} />
            </View>
            {patientsLoading ? (
              <>
                {renderPatientSkeleton()}
                {renderPatientSkeleton()}
              </>
            ) : (
              patientsWithDevices.map((patient) => (
                <View key={patient.id}>
                  {renderPatientItem({ item: patient })}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Tasks</Text>
              <DataSourceBadge source={tasksSource} />
            </View>
            {tasksLoading ? (
              <>
                {renderTaskSkeleton()}
                {renderTaskSkeleton()}
              </>
            ) : (
              tasks.map((task) => (
                <View key={task.id}>
                  {renderTaskItem({ item: task })}
                </View>
              ))
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.leftButton]}
              accessible={true}
              accessibilityLabel="Add medication"
              accessibilityHint="Navigate to add medication screen"
            >
              <Text style={styles.buttonText}>Add Medication</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.rightButton]}
              accessible={true}
              accessibilityLabel="Generate report"
              accessibilityHint="Generate adherence report for patients"
            >
              <Text style={styles.buttonText}>Generate Report</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={async () => {
              await dispatch(logout());
              router.replace('/');
            }}
            accessible={true}
            accessibilityLabel="Log out and return to home"
          >
            <Text style={styles.buttonText}>Log Out and Return</Text>
          </TouchableOpacity>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      keyExtractor={() => 'dashboard'}
    />
  );
}

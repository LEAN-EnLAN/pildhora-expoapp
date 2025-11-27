import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Animated,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../src/store/slices/authSlice';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../src/store';
import { useLinkedPatients } from '../../src/hooks/useLinkedPatients';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useScrollViewPadding } from '../../src/hooks/useScrollViewPadding';
import {
  waitForFirebaseInitialization,
} from '../../src/services/firebase';
import { Button, Container, Modal } from '../../src/components/ui';
import { PatientWithDevice } from '../../src/types';
import { ScreenWrapper, CaregiverHeader } from '../../src/components/caregiver';
import { AutonomousModeBanner } from '../../src/components/caregiver/AutonomousModeBanner';
import { usePatientAutonomousMode } from '../../src/hooks/usePatientAutonomousMode';
import { ErrorBoundary } from '../../src/components/shared/ErrorBoundary';
import { TestTopoButton } from '../../src/components/shared';
import { ErrorState } from '../../src/components/caregiver/ErrorState';
import { OfflineIndicator } from '../../src/components/caregiver/OfflineIndicator';
import { patientDataCache } from '../../src/services/patientDataCache';
import { categorizeError } from '../../src/utils/errorHandling';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceState } from '../../src/hooks/useDeviceState';

// Components
import { StatusRibbon } from '../../src/components/caregiver/dashboard/StatusRibbon';
import { CompactDeviceCard } from '../../src/components/caregiver/dashboard/CompactDeviceCard';
<<<<<<< Updated upstream
=======
import TopoSessionOverlay from '../../src/components/session/TopoSessionOverlay';
>>>>>>> Stashed changes

const SELECTED_PATIENT_KEY = '@caregiver_selected_patient';

function CaregiverDashboardContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Layout dimensions
  const { contentPaddingBottom } = useScrollViewPadding();
  
  // State management
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<any | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cachedPatients, setCachedPatients] = useState<PatientWithDevice[]>([]);
  const [usingCachedData, setUsingCachedData] = useState(false);
  
  // Network status
  const networkStatus = useNetworkStatus();
  const isOnline = networkStatus.isOnline;
  
  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Per-patient state cache
  const [patientStateCache] = useState<Map<string, {
    lastViewed: Date;
    deviceId?: string;
  }>>(new Map());

  // Get caregiver UID
  const caregiverUid = getAuth()?.currentUser?.uid || user?.id || null;

  // Load cached patient data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      if (!caregiverUid) return;
      try {
        const cached = await AsyncStorage.getItem(`@cached_patients_${caregiverUid}`);
        if (cached) {
          const patients = JSON.parse(cached);
          setCachedPatients(patients);
        }
      } catch (error) {
        // Silently fail
      }
    };
    loadCachedData();
  }, [caregiverUid]);

  // Initialize Firebase
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        setInitializationError(null);
        const initPromise = waitForFirebaseInitialization();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase initialization timeout')), 10000)
        );
        await Promise.race([initPromise, timeoutPromise]);
        setIsInitialized(true);
      } catch (error: any) {
        const categorized = categorizeError(error);
        setInitializationError(categorized);
        setIsInitialized(true);
        if (cachedPatients.length > 0) {
          setUsingCachedData(true);
        }
      }
    };
    initializeFirebase();
  }, [retryCount, cachedPatients.length]);

  // Load last selected patient
  useEffect(() => {
    const loadSelectedPatient = async () => {
      try {
        const savedPatientId = await AsyncStorage.getItem(SELECTED_PATIENT_KEY);
        if (savedPatientId) {
          setSelectedPatientId(savedPatientId);
        }
      } catch (error) {
        // Silently fail
      }
    };
    loadSelectedPatient();
  }, []);

  // Handle retry
  const handleRetryInitialization = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    setIsInitialized(false);
    setInitializationError(null);
    // La inicialización se reintenta mediante el efecto y el contador
  }, []);

  // Fetch linked patients
  const {
    patients: linkedPatients,
    isLoading: patientsLoading,
    error: patientsError,
    refetch: refetchPatients,
  } = useLinkedPatients({
    caregiverId: caregiverUid,
    enabled: isInitialized && !initializationError && isOnline,
  });

  // Cache patient data
  useEffect(() => {
    const cacheData = async () => {
      if (linkedPatients.length > 0 && caregiverUid) {
        try {
          await AsyncStorage.setItem(
            `@cached_patients_${caregiverUid}`,
            JSON.stringify(linkedPatients)
          );
          for (const patient of linkedPatients) {
            await patientDataCache.cachePatient(patient);
          }
          setUsingCachedData(false);
        } catch (error) {
          // Silently fail
        }
      }
    };
    cacheData();
  }, [linkedPatients, caregiverUid]);

  // Memoize patients with fallback
  const patientsWithDevices = useMemo<PatientWithDevice[]>(() => {
    if (linkedPatients.length > 0) return linkedPatients;
    if ((usingCachedData || !isOnline || patientsError) && cachedPatients.length > 0) {
      return cachedPatients;
    }
    return [];
  }, [linkedPatients, cachedPatients, usingCachedData, isOnline, patientsError]);

  // Auto-select patient
  useEffect(() => {
    if (!selectedPatientId && patientsWithDevices.length > 0) {
      const firstPatientId = patientsWithDevices[0].id;
      setSelectedPatientId(firstPatientId);
      AsyncStorage.setItem(SELECTED_PATIENT_KEY, firstPatientId).catch(() => {});
    }
  }, [selectedPatientId, patientsWithDevices]);

  // Animation
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (!patientsLoading && patientsWithDevices.length > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [patientsLoading, patientsWithDevices.length, fadeAnim]);

  // Get selected patient
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patientsWithDevices.find(p => p.id === selectedPatientId) || null;
  }, [selectedPatientId, patientsWithDevices]);

  // Handle patient select
  const handlePatientSelect = useCallback((patientId: string) => {
    if (patientId === selectedPatientId) return;
    
    patientStateCache.set(patientId, {
      lastViewed: new Date(),
      deviceId: patientsWithDevices.find(p => p.id === patientId)?.deviceId,
    });
    
    setSelectedPatientId(patientId);
    AsyncStorage.setItem(SELECTED_PATIENT_KEY, patientId).catch(() => {});
  }, [selectedPatientId, patientStateCache, patientsWithDevices]);

  // --- Data Fetching for Dashboard Content ---

  // 1. Device State
  const { deviceState, isLoading: deviceLoading } = useDeviceState({
    deviceId: selectedPatient?.deviceId,
    enabled: !!selectedPatient?.deviceId && isOnline,
  });

  // Navigation
  const handleNavigate = useCallback((screen: 'calendar' | 'medications' | 'tasks' | 'add-device') => {
    router.push(`/caregiver/${screen}`);
  }, [router]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    refetchPatients();
    // Re-verify firebase connection
    if (!isOnline) {
       handleRetryInitialization();
    }
  }, [refetchPatients, isOnline, handleRetryInitialization]);

<<<<<<< Updated upstream
=======
  const [patientMenuVisible, setPatientMenuVisible] = useState(false);

>>>>>>> Stashed changes
  // --- Render ---

  // Error States
  if ((initializationError || patientsError) && !usingCachedData && cachedPatients.length === 0) {
    const error = initializationError || patientsError;
    const categorized = categorizeError(error);
    return (
      <ScreenWrapper>
        <Container style={styles.container}>
          <ErrorState
            category={categorized.category}
            message={categorized.userMessage}
            onRetry={handleRetryInitialization}
          />
        </Container>
      </ScreenWrapper>
    );
  }

  // Derived props for components
  const deviceStatus = {
    isOnline: deviceState?.is_online ?? false,
    batteryLevel: deviceState?.battery_level,
    lastSeen: deviceState?.last_seen,
    signalStrength: deviceState?.wifi_signal_strength,
  };

  const isLoading = patientsLoading;

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
<<<<<<< Updated upstream

  return (
    <ScreenWrapper applyTopPadding={false}>
=======

  const handlePatientSelectFromMenu = (patientId: string) => {
    handlePatientSelect(patientId);
    setPatientMenuVisible(false);
  };

  return (
    <ScreenWrapper applyTopPadding={false}>
      {selectedPatient?.deviceId && selectedPatient?.id && (
        <TopoSessionOverlay patientId={selectedPatient.id} deviceId={selectedPatient.deviceId} supervised={true} />
      )}
>>>>>>> Stashed changes
      <OfflineIndicator />
      
      {/* Custom Header with Patient Selector */}
      <View style={{ zIndex: 1000 }}>
        <CaregiverHeader
          caregiverName={user?.name}
          onLogout={handleLogout}
          showScreenTitle={false}
        >
           <View style={styles.headerPatientSelector}>
              <View style={styles.labelRow}>
                <Ionicons name="person-circle-outline" size={14} color={colors.primary[600]} />
                <Text style={styles.headerLabel}>PACIENTE</Text>
              </View>
              <TouchableOpacity 
                style={styles.patientSelectorButton}
<<<<<<< Updated upstream
                onPress={() => {
                  if (patientsWithDevices.length > 1) {
                    const currentIndex = patientsWithDevices.findIndex(p => p.id === selectedPatientId);
                    const nextIndex = (currentIndex + 1) % patientsWithDevices.length;
                    handlePatientSelect(patientsWithDevices[nextIndex].id);
                  }
                }}
                activeOpacity={0.7}
                disabled={patientsWithDevices.length <= 1}
=======
                onPress={() => setPatientMenuVisible(true)}
                activeOpacity={0.7}
>>>>>>> Stashed changes
              >
                <Text style={styles.headerPatientName} numberOfLines={1}>
                  {selectedPatient?.name || 'Seleccionar'}
                </Text>
<<<<<<< Updated upstream
                {patientsWithDevices.length > 1 && (
                  <Ionicons name="chevron-down" size={14} color={colors.primary[600]} />
                )}
=======
                <Ionicons name="chevron-down" size={14} color={colors.primary[600]} />
>>>>>>> Stashed changes
              </TouchableOpacity>
            </View>
        </CaregiverHeader>
      </View>
<<<<<<< Updated upstream
=======

      {/* Patient Selection Modal */}
      <Modal
        visible={patientMenuVisible}
        onClose={() => setPatientMenuVisible(false)}
        title="Seleccionar Paciente"
        size="sm"
      >
        <View style={{ gap: spacing.md }}>
          {patientsWithDevices.length <= 1 ? (
             <View style={{ padding: spacing.md, alignItems: 'center' }}>
               <Text style={{ color: colors.gray[500], textAlign: 'center' }}>
                 No hay otros pacientes disponibles.
               </Text>
             </View>
          ) : (
            patientsWithDevices.map((patient) => (
              <Button
                key={patient.id}
                variant={patient.id === selectedPatientId ? 'primary' : 'outline'}
                size="lg"
                fullWidth
                onPress={() => handlePatientSelectFromMenu(patient.id)}
                leftIcon={<Ionicons name="person" size={18} color={patient.id === selectedPatientId ? 'white' : colors.primary[600]} />}
              >
                {patient.name}
              </Button>
            ))
          )}
          
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => router.push('/caregiver/device-connection')}
            style={{ marginTop: spacing.sm }}
            leftIcon={<Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />}
          >
            Vincular nuevo paciente
          </Button>
        </View>
      </Modal>
>>>>>>> Stashed changes
      
      {/* Fixed Status Ribbon (Device Status Only) */}
      <View style={styles.statusRibbonContainer}>
        <StatusRibbon
          deviceStatus={deviceStatus}
        />
      </View>

      <Container style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading && !fadeAnim} onRefresh={onRefresh} />
          }
          accessible={true}
          accessibilityLabel="Dashboard content"
        >
          {usingCachedData && (
             <View style={styles.cachedDataBanner} accessible={true} accessibilityRole="alert">
               <Ionicons name="information-circle" size={20} color={colors.warning[500]} />
               <Text style={styles.cachedDataText}>Mostrando datos guardados</Text>
             </View>
          )}

          {/* Autonomous Mode Banner */}
          {selectedPatient && <AutonomousModeBannerWrapper patientId={selectedPatient.id} />}

          {patientsWithDevices.length === 0 ? (
             <EmptyState onAddDevice={() => handleNavigate('add-device')} />
          ) : (
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              
              {/* Device Card */}
              <CompactDeviceCard
                deviceId={selectedPatient?.deviceId}
                deviceName={selectedPatient?.deviceId ? `Dispositivo ${selectedPatient.deviceId}` : 'Dispositivo'}
                isOnline={deviceStatus.isOnline}
                batteryLevel={deviceStatus.batteryLevel}
                lastSeen={deviceStatus.lastSeen}
                signalStrength={deviceStatus.signalStrength}
                loading={deviceLoading}
              />

              {/* Quick Actions */}
              <View style={styles.quickActionsContainer}>
                <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                <View style={styles.actionButtonsRow}>
                  <QuickActionButton 
                    icon="calendar" 
                    label="Calendario" 
                    onPress={() => handleNavigate('calendar')} 
                    color={colors.primary[500]}
                  />
                  <QuickActionButton 
                    icon="medkit" 
                    label="Medicamentos" 
                    onPress={() => handleNavigate('medications')} 
                    color={colors.info[500]}
                  />
                </View>
              </View>

              {/* Device Actions */}
              <View style={styles.deviceActions}>
                <TestTopoButton deviceId={selectedPatient?.deviceId || 'TEST-DEVICE-001'} />
                
                <Button 
                  variant="outline"
                  onPress={() => handleNavigate('add-device')}
                  style={{ marginTop: spacing.md }}
                  leftIcon={<Ionicons name="settings-outline" size={18} color={colors.primary[600]} />}
                >
                  Configurar Dispositivo
                </Button>
              </View>

            </Animated.View>
          )}
        </ScrollView>
      </Container>
    </ScreenWrapper>
  );
}

// Sub-components
function AutonomousModeBannerWrapper({ patientId }: { patientId: string }) {
  const { isAutonomous, isLoading } = usePatientAutonomousMode(patientId);
  if (isLoading || !isAutonomous) return null;
  return (
    <View style={styles.bannerContainer}>
      <AutonomousModeBanner 
        message="Modo autónomo activado"
        size="md"
      />
    </View>
  );
}

function EmptyState({ onAddDevice }: { onAddDevice: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.gray[400]} />
      <Text style={styles.emptyTitle}>No hay pacientes</Text>
      <Text style={styles.emptyDescription}>
        Vincula un dispositivo para comenzar
      </Text>
      <Button 
        variant="primary" 
        size="lg"
        onPress={onAddDevice}
        style={styles.emptyButton}
      >
        Vincular Dispositivo
      </Button>
    </View>
  );
}

function QuickActionButton({ icon, label, onPress, color }: { icon: any, label: string, onPress: () => void, color: string }) {
  return (
    <TouchableOpacity 
      style={styles.quickActionButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CaregiverDashboard() {
  return (
    <ErrorBoundary>
      <CaregiverDashboardContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  cachedDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  cachedDataText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[500],
  },
  bannerContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  deviceActions: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.md,
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    width: '100%',
  },
  quickActionsContainer: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[700],
  },
  headerPatientSelector: {
    marginTop: spacing.xs,
<<<<<<< Updated upstream
    marginLeft: spacing.xs,
=======
>>>>>>> Stashed changes
  },
  headerLabel: {
    fontSize: 10,
    color: colors.gray[500],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  patientSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerPatientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  statusRibbonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
});

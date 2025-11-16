import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../src/store';
import { useLinkedPatients } from '../../src/hooks/useLinkedPatients';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import {
  waitForFirebaseInitialization,
  reinitializeFirebase
} from '../../src/services/firebase';
import { Button, Container } from '../../src/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatientWithDevice } from '../../src/types';
import PatientSelector from '../../src/components/caregiver/PatientSelector';
import { DeviceConnectivityCard } from '../../src/components/caregiver/DeviceConnectivityCard';
import { LastMedicationStatusCard } from '../../src/components/caregiver/LastMedicationStatusCard';
import QuickActionsPanel from '../../src/components/caregiver/QuickActionsPanel';
import {
  DeviceConnectivityCardSkeleton,
  LastMedicationStatusCardSkeleton,
  QuickActionsPanelSkeleton,
  PatientSelectorSkeleton,
} from '../../src/components/caregiver/skeletons';
import { ErrorBoundary } from '../../src/components/shared/ErrorBoundary';
import { ErrorState } from '../../src/components/caregiver/ErrorState';
import { OfflineIndicator } from '../../src/components/caregiver/OfflineIndicator';
import { patientDataCache } from '../../src/services/patientDataCache';
import { categorizeError } from '../../src/utils/errorHandling';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';

const SELECTED_PATIENT_KEY = '@caregiver_selected_patient';

function CaregiverDashboardContent() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
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
  
  // Fade-in animation for content
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Per-patient state cache to maintain data when switching between patients
  // This improves UX by showing cached data immediately while fresh data loads
  const [patientStateCache] = useState<Map<string, {
    lastViewed: Date;
    deviceId?: string;
  }>>(new Map());

  // Get caregiver UID
  const caregiverUid = getAuth()?.currentUser?.uid || user?.id || null;



  /**
   * Load cached patient data on mount
   */
  useEffect(() => {
    const loadCachedData = async () => {
      if (!caregiverUid) return;

      try {
        // Try to load cached patients
        const cached = await AsyncStorage.getItem(`@cached_patients_${caregiverUid}`);
        if (cached) {
          const patients = JSON.parse(cached);
          setCachedPatients(patients);
        }
      } catch (error) {
        // Silently fail - cached data is optional
      }
    };

    loadCachedData();
  }, [caregiverUid]);

  /**
   * Initialize Firebase
   */
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        setInitializationError(null);
        
        // Wait for Firebase initialization with timeout
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
        
        // If we have cached data, allow offline mode
        if (cachedPatients.length > 0) {
          setUsingCachedData(true);
        }
      }
    };
    
    initializeFirebase();
  }, [retryCount, cachedPatients.length]);

  /**
   * Load last selected patient from AsyncStorage
   */
  useEffect(() => {
    const loadSelectedPatient = async () => {
      try {
        const savedPatientId = await AsyncStorage.getItem(SELECTED_PATIENT_KEY);
        if (savedPatientId) {
          setSelectedPatientId(savedPatientId);
        }
      } catch (error) {
        // Silently fail - will auto-select first patient
      }
    };

    loadSelectedPatient();
  }, []);

  /**
   * Handle retry initialization
   */
  const handleRetryInitialization = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    setIsInitialized(false);
    setInitializationError(null);
    try {
      await reinitializeFirebase();
    } catch (error) {
      // Error will be caught by initialization effect
    }
  }, []);

  /**
   * Fetch linked patients via deviceLinks collection
   * Uses custom hook with SWR pattern and real-time updates
   */
  const {
    patients: linkedPatients,
    isLoading: patientsLoading,
    error: patientsError,
    refetch: refetchPatients,
  } = useLinkedPatients({
    caregiverId: caregiverUid,
    enabled: isInitialized && !initializationError && isOnline,
  });

  /**
   * Cache patient data when loaded
   */
  useEffect(() => {
    const cacheData = async () => {
      if (linkedPatients.length > 0 && caregiverUid) {
        try {
          // Cache the patients list
          await AsyncStorage.setItem(
            `@cached_patients_${caregiverUid}`,
            JSON.stringify(linkedPatients)
          );

          // Cache individual patient data
          for (const patient of linkedPatients) {
            await patientDataCache.cachePatient(patient);
          }

          setUsingCachedData(false);
        } catch (error) {
          // Silently fail - caching is optional
        }
      }
    };

    cacheData();
  }, [linkedPatients, caregiverUid]);

  /**
   * Memoize patients with device state
   * Use cached data if offline or error occurred
   */
  const patientsWithDevices = useMemo<PatientWithDevice[]>(() => {
    if (linkedPatients.length > 0) {
      return linkedPatients;
    }
    
    // Fallback to cached data if offline or error
    if ((usingCachedData || !isOnline || patientsError) && cachedPatients.length > 0) {
      return cachedPatients;
    }
    
    return [];
  }, [linkedPatients, cachedPatients, usingCachedData, isOnline, patientsError]);

  /**
   * Auto-select first patient if none selected
   */
  useEffect(() => {
    if (!selectedPatientId && patientsWithDevices.length > 0) {
      const firstPatientId = patientsWithDevices[0].id;
      setSelectedPatientId(firstPatientId);
      AsyncStorage.setItem(SELECTED_PATIENT_KEY, firstPatientId).catch(() => {
        // Silently fail - selection will persist in memory
      });
    }
  }, [selectedPatientId, patientsWithDevices]);

  /**
   * Fade in content when data is loaded
   */
  useEffect(() => {
    if (!patientsLoading && patientsWithDevices.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [patientsLoading, patientsWithDevices.length, fadeAnim]);

  /**
   * Get selected patient object
   */
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patientsWithDevices.find(p => p.id === selectedPatientId) || null;
  }, [selectedPatientId, patientsWithDevices]);

  /**
   * Handle patient selection
   * Updates selected patient ID, persists to storage, and triggers data refresh
   */
  const handlePatientSelect = useCallback((patientId: string) => {
    // Only update if different patient
    if (patientId === selectedPatientId) {
      return;
    }
    
    // Update patient state cache with last viewed time
    patientStateCache.set(patientId, {
      lastViewed: new Date(),
      deviceId: patientsWithDevices.find(p => p.id === patientId)?.deviceId,
    });
    
    setSelectedPatientId(patientId);
    
    // Persist selection to AsyncStorage
    AsyncStorage.setItem(SELECTED_PATIENT_KEY, patientId).catch(() => {
      // Silently fail - selection will persist in memory
    });
  }, [selectedPatientId, patientStateCache, patientsWithDevices]);

  /**
   * Handle data refresh when patient changes
   */
  const handleRefreshData = useCallback(() => {
    refetchPatients();
  }, [refetchPatients]);

  /**
   * Handle navigation to different screens
   */
  const handleNavigate = useCallback((screen: 'events' | 'medications' | 'tasks' | 'add-device') => {
    router.push(`/caregiver/${screen}`);
  }, [router]);

  /**
   * Render initialization error state (only if no cached data available)
   */
  if (initializationError && !usingCachedData && cachedPatients.length === 0) {
    const categorized = categorizeError(initializationError);
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <Container style={styles.container}>
          <ErrorState
            category={categorized.category}
            message={categorized.userMessage}
            onRetry={handleRetryInitialization}
          />
        </Container>
      </SafeAreaView>
    );
  }

  /**
   * Render patients error state (only if no cached data available)
   */
  if (patientsError && !usingCachedData && cachedPatients.length === 0) {
    const categorized = categorizeError(patientsError);
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <Container style={styles.container}>
          <ErrorState
            category={categorized.category}
            message={categorized.userMessage}
            onRetry={handleRetryInitialization}
          />
        </Container>
      </SafeAreaView>
    );
  }

  /**
   * Render main dashboard
   */
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <Container style={styles.container}>
        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Cached Data Warning */}
        {usingCachedData && (
          <View 
            style={styles.cachedDataBanner}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="Mostrando datos guardados. Conéctate para actualizar."
          >
            <Ionicons name="information-circle" size={20} color={colors.warning[500]} />
            <Text style={styles.cachedDataText}>
              Mostrando datos guardados. Conéctate para actualizar.
            </Text>
          </View>
        )}

        {/* Patient Selector (only shown if multiple patients) */}
        {patientsLoading ? (
          <PatientSelectorSkeleton />
        ) : patientsWithDevices.length > 0 ? (
          <PatientSelector
            patients={patientsWithDevices}
            selectedPatientId={selectedPatientId || undefined}
            onSelectPatient={handlePatientSelect}
            loading={patientsLoading}
            onRefresh={handleRefreshData}
          />
        ) : null}

        {/* Main Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          accessible={true}
          accessibilityLabel="Dashboard content"
          accessibilityRole="scrollbar"
        >
          {patientsLoading ? (
            // Loading state with skeletons
            <View style={styles.content}>
              <DeviceConnectivityCardSkeleton />
              <LastMedicationStatusCardSkeleton />
              <QuickActionsPanelSkeleton />
            </View>
          ) : patientsWithDevices.length === 0 ? (
            // Empty state - no patients
            <View 
              style={styles.emptyContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="No hay pacientes vinculados. Vincula un dispositivo para comenzar a gestionar pacientes"
            >
              <Ionicons name="people-outline" size={64} color={colors.gray[400]} accessible={false} />
              <Text style={styles.emptyTitle}>No hay pacientes vinculados</Text>
              <Text style={styles.emptyDescription}>
                Vincula un dispositivo para comenzar a gestionar pacientes
              </Text>
              <Button 
                variant="primary" 
                size="lg"
                onPress={() => handleNavigate('add-device')}
                style={styles.emptyButton}
                accessibilityLabel="Vincular dispositivo"
                accessibilityHint="Navega a la pantalla de gestión de dispositivos para vincular un nuevo dispositivo"
              >
                Vincular Dispositivo
              </Button>
            </View>
          ) : selectedPatient ? (
            // Dashboard content with selected patient
            // Key prop ensures components re-mount when patient changes for clean state transitions
            // Wrapped with fade-in animation for smooth content appearance
            <Animated.View 
              style={[
                styles.content, 
                { opacity: fadeAnim }
              ]} 
              key={selectedPatient.id}
            >
              {/* Device Connectivity Card */}
              <DeviceConnectivityCard
                key={`device-${selectedPatient.id}`}
                deviceId={selectedPatient.deviceId}
                patientId={selectedPatient.id}
                onManageDevice={() => handleNavigate('add-device')}
                onDeviceUnlinked={() => {
                  console.log('[Dashboard] Device unlinked, refreshing patient data');
                  // Refresh patient list to update device status
                  refetchPatients();
                }}
                style={styles.card}
              />

              {/* Last Medication Status Card */}
              <LastMedicationStatusCard
                key={`medication-${selectedPatient.id}`}
                patientId={selectedPatient.id}
                caregiverId={caregiverUid || undefined}
                onViewAll={() => handleNavigate('events')}
              />

              {/* Quick Actions Panel */}
              <QuickActionsPanel onNavigate={handleNavigate} />
            </Animated.View>
          ) : (
            // No patient selected (shouldn't happen with PatientSelector)
            <View 
              style={styles.emptyContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="Selecciona un paciente. Elige un paciente de la lista superior para ver su información"
            >
              <Ionicons name="hand-left-outline" size={64} color={colors.gray[400]} accessible={false} />
              <Text style={styles.emptyTitle}>Selecciona un paciente</Text>
              <Text style={styles.emptyDescription}>
                Elige un paciente de la lista superior para ver su información
              </Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
}

/**
 * Main dashboard component wrapped with error boundary
 */
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  // Cached data banner
  cachedDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning[200],
  },
  cachedDataText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning[500],
    fontWeight: typography.fontWeight.medium,
  },
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'] * 2, // 64px
    paddingHorizontal: spacing.lg,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[700],
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  emptyButton: {
    marginTop: spacing.xl,
  },
});

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { syncScheduleToRtdb, getScheduleSummary } from '../../services/scheduleSync';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import { Medication } from '../../types';
import { getDbInstance } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface TestScheduleSyncButtonProps {
  deviceId?: string;
  patientId?: string;
}

/**
 * TestScheduleSyncButton Component
 * 
 * Button to manually test the schedule sync functionality.
 * Fetches medications for the specified patient and syncs to RTDB.
 */
export const TestScheduleSyncButton = ({ deviceId, patientId }: TestScheduleSyncButtonProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMeds, setFetchingMeds] = useState(false);
  const [lastSync, setLastSync] = useState<string[] | null>(null);

  // Fetch medications for the patient
  useEffect(() => {
    const fetchMedications = async () => {
      if (!patientId) {
        setMedications([]);
        return;
      }

      setFetchingMeds(true);
      try {
        const db = await getDbInstance();
        if (!db) {
          console.error('[TestScheduleSync] No database instance');
          return;
        }

        const q = query(
          collection(db, 'medications'),
          where('patientId', '==', patientId)
        );
        
        const snapshot = await getDocs(q);
        const meds: Medication[] = [];
        snapshot.forEach(doc => {
          meds.push({ id: doc.id, ...doc.data() } as Medication);
        });
        
        console.log(`[TestScheduleSync] Fetched ${meds.length} medications for patient ${patientId}`);
        setMedications(meds);
      } catch (error) {
        console.error('[TestScheduleSync] Error fetching medications:', error);
      } finally {
        setFetchingMeds(false);
      }
    };

    fetchMedications();
  }, [patientId]);

  const handlePress = useCallback(async () => {
    if (!deviceId) {
      Alert.alert('Error', 'No hay dispositivo vinculado');
      return;
    }

    if (!patientId) {
      Alert.alert('Error', 'No hay paciente seleccionado');
      return;
    }

    if (medications.length === 0) {
      Alert.alert('Sin medicaciones', 'No hay medicaciones para sincronizar');
      return;
    }

    // DEBUG: Show medication data before sync
    const debugInfo = medications.map(med => 
      `• ${med.name}\n  freq: "${med.frequency}"\n  times: ${JSON.stringify(med.times)}`
    ).join('\n\n');
    
    console.log('[TestScheduleSync] Medications data:', debugInfo);

    setLoading(true);
    try {
      // Get summary first
      const summary = getScheduleSummary(medications);
      
      // Sync to RTDB
      await syncScheduleToRtdb(deviceId, medications);
      
      setLastSync(summary.activeTurnos);
      
      Alert.alert(
        '✅ Sync Exitoso',
        `Se sincronizaron ${summary.totalMedications} medicaciones.\n\n` +
        `Turnos activos (${summary.activeTurnos.length}):\n` +
        (summary.activeTurnos.length > 0 
          ? summary.activeTurnos.map(t => `• ${t}`).join('\n')
          : '(ninguno)')
      );
    } catch (error: any) {
      console.error('Schedule Sync Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId, patientId, medications]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={loading || fetchingMeds}
        accessibilityLabel="Sincronizar horarios"
        accessibilityHint="Sincroniza los horarios de medicaciones al dispositivo"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[colors.info[500], colors.info[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <View style={styles.contentContainer}>
            <View style={styles.leftSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="sync-outline" size={24} color="white" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>Sync Schedule</Text>
                <Text style={styles.subtitle}>
                  {fetchingMeds ? 'Cargando...' : `${medications.length} medicaciones`}
                </Text>
              </View>
            </View>

            <View style={styles.rightSection}>
              {loading || fetchingMeds ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.statusContainer}>
                  <Ionicons name="calendar-outline" size={16} color="white" />
                  <Text style={styles.statusText}>
                    {lastSync ? `${lastSync.length} turnos` : 'Probar'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Show last synced turnos */}
      {lastSync && lastSync.length > 0 && (
        <View style={styles.turnosContainer}>
          <Text style={styles.turnosTitle}>Turnos activos:</Text>
          <View style={styles.turnosList}>
            {lastSync.slice(0, 6).map((turno) => (
              <View key={turno} style={styles.turnoChip}>
                <Text style={styles.turnoText}>{turno}</Text>
              </View>
            ))}
            {lastSync.length > 6 && (
              <Text style={styles.moreText}>+{lastSync.length - 6} más</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  button: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    minHeight: 72,
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.fontSize.xs,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  statusText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  turnosContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  turnosTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  turnosList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  turnoChip: {
    backgroundColor: colors.info[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  turnoText: {
    fontSize: typography.fontSize.xs,
    color: colors.info[600],
    fontWeight: typography.fontWeight.medium,
  },
  moreText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    alignSelf: 'center',
  },
});

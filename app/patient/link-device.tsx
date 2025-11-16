import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { linkDeviceToUser, unlinkDeviceFromUser, checkDevelopmentRuleStatus } from '../../src/services/deviceLinking';
import { getDbInstance, getRdbInstance, getAuthInstance } from '../../src/services/firebase';
import { ref, get, push, set } from 'firebase/database';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Button, Input, Card, LoadingSpinner, ErrorMessage, SuccessMessage, AnimatedListItem, Collapsible, Modal } from '../../src/components/ui';
import { DeviceConfigPanel } from '../../src/components/shared/DeviceConfigPanel';
import { colors, spacing, typography } from '../../src/theme/tokens';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: { 
    padding: spacing.xl, 
    backgroundColor: colors.surface, 
    marginBottom: spacing.lg 
  },
  headerTitle: { 
    fontSize: typography.fontSize['2xl'], 
    fontWeight: typography.fontWeight.bold, 
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  cardContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  deviceCard: {
    marginBottom: spacing.lg,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deviceId: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  statsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  statsValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  expandButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
    marginLeft: spacing.xs,
  },
  configSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  actionButtons: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: spacing.lg,
  },
  diagnosticSection: {
    marginTop: spacing.sm,
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  diagnosticStatus: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
});

type DeviceStatsLocal = Record<string, {
  battery: number | null;
  status: string | null;
  alarmMode: 'off' | 'sound' | 'led' | 'both';
  ledIntensity: number;
  ledColor: { r: number; g: number; b: number };
  saving?: boolean;
  saveError?: string | null;
}>;

export default function LinkDeviceScreen() {
  const router = useRouter();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [deviceId, setDeviceId] = useState('');
  const [linkedDevices, setLinkedDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [unlinkingDevice, setUnlinkingDevice] = useState<string | null>(null);
  const [dispensingDevice, setDispensingDevice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deviceStats, setDeviceStats] = useState<DeviceStatsLocal>({});
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState<string | null>(null);
  const [dispenseFeedback, setDispenseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function refreshLinkedDevices() {
    if (!userId) return;
    try {
      setLoadingDevices(true);
      const auth = await getAuthInstance();
      const dbInst = await getDbInstance();
      if (!auth || !dbInst) {
        setLoadingDevices(false);
        console.warn('Database not available');
        return;
      }
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        setLoadingDevices(false);
        setError('Estado de autenticación inválido');
        return;
      }
      
      // Read the user's active device links from Firestore
      const qLinks = query(
        collection(dbInst, 'deviceLinks'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const linksSnap = await getDocs(qLinks);
      let ids = linksSnap.docs.map((d) => (d.data() as any).deviceId).filter(Boolean);
      // Fallback: if no Firestore links found yet, read from RTDB user links
      if (!ids.length) {
        try {
          const rdbInst = await getRdbInstance();
          if (rdbInst) {
            const snap = await get(ref(rdbInst, `users/${userId}/devices`));
            const val = snap.val() || {};
            ids = Object.keys(val);
          }
        } catch { }
      }
      setLinkedDevices(ids);

      const statsMap: Record<string, any> = {};
      const docs = await Promise.all(ids.map(async (id) => {
        try {
          const devDoc = await getDoc(doc(dbInst, 'devices', id));
          return { id, devDoc };
        } catch {
          return { id, devDoc: null };
        }
      }));
      for (const { id, devDoc } of docs) {
        try {
          const devData = devDoc && devDoc.exists() ? devDoc.data() : {} as any;
          const desired = (devData as any)?.desiredConfig || {};
          const alarmMode = (desired?.alarm_mode as 'off' | 'sound' | 'led' | 'both') ?? 'off';
          const ledIntensity = (desired?.led_intensity as number) ?? 512;
          const ledColorArr = (desired?.led_color_rgb as [number, number, number]) ?? [255, 0, 0];
          const ledColor = { r: ledColorArr[0], g: ledColorArr[1], b: ledColorArr[2] };
          const last = (devData as any)?.lastKnownState || {};
          let battery: number | null = null;
          const rawBattery = last?.battery ?? last?.batteryPercent ?? last?.battery_percentage ?? last?.battery_level ?? null;
          if (typeof rawBattery === 'number') {
            battery = Math.round(rawBattery);
          } else if (typeof rawBattery === 'string') {
            const parsed = parseFloat(rawBattery);
            battery = isNaN(parsed) ? null : Math.round(parsed);
          }
          let status: string | null = null;
          try {
            const rdbInst = await getRdbInstance();
            if (rdbInst) {
              const snap = await get(ref(rdbInst, `devices/${id}/state`));
              const stateVal = snap.val() || {};
              status = stateVal?.current_status || 'N/D';
              if (typeof stateVal?.battery_level === 'number') {
                battery = Math.round(stateVal.battery_level);
              }
            }
          } catch (e) {
            console.error('Error fetching status from RTDB', e);
          }
          statsMap[id] = { battery, status, alarmMode, ledIntensity, ledColor, saving: false, saveError: null };
        } catch (e) {
          statsMap[id] = { battery: null, status: null, alarmMode: 'off', ledIntensity: 512, ledColor: { r: 255, g: 0, b: 0 }, saving: false, saveError: 'No se pudo leer datos del dispositivo (Firestore).' };
        }
      }
      setDeviceStats(statsMap);
    } catch (e: any) {
      setError(e.message || 'Error al cargar dispositivos');
    } finally {
      setLoadingDevices(false);
    }
  }

  useEffect(() => {
    refreshLinkedDevices();
    // Check development rule status on component mount
    checkDevelopmentRuleStatus().catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (successMessage === 'Solicitud de dispensaci��n enviada') {
      setDispenseFeedback({
        type: 'success',
        message: 'Solicitud de dispensaci��n enviada',
      });
      setSuccessMessage(null);
    }
  }, [successMessage]);

  useEffect(() => {
    if (!error) return;

    if (error.startsWith('No se puede dispensar') || error === 'No se pudo dispensar') {
      setDispenseFeedback({
        type: 'error',
        message: error,
      });
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (!successMessage) return;

    if (successMessage.startsWith('Solicitud de dispensaci')) {
      setDispenseFeedback({
        type: 'success',
        message: successMessage,
      });
      setSuccessMessage(null);
    }
  }, [successMessage]);

  const handleLink = async () => {
    console.log('[DEBUG] handleLink called');
    setError(null);
    setSuccessMessage(null);

    // Log Redux state
    console.log('[DEBUG] Redux auth state:', {
      userId,
      isAuthenticated: !!userId,
      deviceId: deviceId.trim()
    });

    if (!userId) {
      console.error('[DEBUG] No userId in Redux state');
      setError('Debes iniciar sesión para enlazar un dispositivo.');
      return;
    }
    if (!deviceId.trim()) {
      console.error('[DEBUG] No deviceId provided');
      setError('Ingresa un Device ID válido.');
      return;
    }

    try {
      console.log('[DEBUG] Starting device linking process...');
      setLoading(true);
      await linkDeviceToUser(userId, deviceId.trim());
      console.log('[DEBUG] Device linking successful, refreshing device list...');
      setSuccessMessage('Dispositivo enlazado exitosamente');
      setDeviceId('');
      await refreshLinkedDevices();
      console.log('[DEBUG] Device list refreshed successfully');
    } catch (e: any) {
      console.error('[DEBUG] Device linking failed:', {
        error: e,
        message: e.message,
        code: e.code,
        stack: e.stack
      });
      setError(e.message || 'No se pudo enlazar el dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (id: string) => {
    setError(null);
    setSuccessMessage(null);
    setDispensingDevice(id);
    
    try {
      const rdb = await getRdbInstance();
      const auth = await getAuthInstance();
      if (!rdb) {
        throw new Error('Realtime Database not available');
      }
      const stateSnap = await get(ref(rdb, `devices/${id}/state`));
      const current = stateSnap.val() || {};
      const isIdle = current?.current_status === 'idle' || current?.current_status === 'IDLE';
      const timeSynced = current?.time_synced === true;
      if (!isIdle || !timeSynced) {
        throw new Error('No se puede dispensar: el dispositivo no está listo');
      }
      const reqRef = push(ref(rdb, `devices/${id}/dispenseRequests`));
      const payload = {
        triggerId: `${auth?.currentUser?.uid || 'app'}_${Date.now()}`,
        requestedBy: auth?.currentUser?.uid || 'app',
        requestedAt: Date.now(),
      };
      await set(reqRef, payload);
      setSuccessMessage('Solicitud de dispensación enviada');
    } catch (e: any) {
      setError(e.message || 'No se pudo dispensar');
    } finally {
      setDispensingDevice(null);
    }
  };

  const handleUnlink = async (id: string) => {
    setError(null);
    setSuccessMessage(null);
    if (!userId) {
      setError('Debes iniciar sesión para desenlazar un dispositivo.');
      return;
    }
    try {
      setUnlinkingDevice(id);
      await unlinkDeviceFromUser(userId, id);
      setSuccessMessage('Dispositivo desenlazado exitosamente');
      await refreshLinkedDevices();
    } catch (e: any) {
      setError(e.message || 'No se pudo desenlazar el dispositivo');
    } finally {
      setUnlinkingDevice(null);
    }
  };

  const toggleDeviceExpanded = (id: string) => {
    setExpandedDevices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const saveDeviceConfig = async (id: string, config: {
    alarmMode: 'off' | 'sound' | 'led' | 'both';
    ledIntensity: number;
    ledColor: { r: number; g: number; b: number };
  }) => {
    setError(null);
    setSuccessMessage(null);
    setDeviceStats((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), saving: true, saveError: null } }));
    
    try {
      const auth = await getAuthInstance();
      if (!auth || !auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('Usuario no autenticado');
      }
      
      const dbInst = await getDbInstance();
      if (!dbInst) {
        throw new Error('Database not available');
      }
      
      // Persist minimal config to Firestore desiredConfig; Cloud Function will mirror to RTDB
      const payload = {
        led_intensity: config.ledIntensity,
        led_color_rgb: [config.ledColor.r, config.ledColor.g, config.ledColor.b],
        alarm_mode: config.alarmMode,
      };
      await setDoc(
        doc(dbInst, 'devices', id),
        {
          desiredConfig: payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      
      // Update local state
      setDeviceStats((prev) => ({ 
        ...prev, 
        [id]: { 
          ...(prev[id] || {}), 
          alarmMode: config.alarmMode,
          ledIntensity: config.ledIntensity,
          ledColor: config.ledColor,
          saving: false,
          saveError: null,
        } 
      }));
      
      setSuccessMessage('Configuración guardada exitosamente');
    } catch (e: any) {
      const errorMsg = e?.message || 'Error al guardar configuración';
      setDeviceStats((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), saving: false, saveError: errorMsg } }));
      setError(errorMsg);
    }
  };

  const diagnoseFirestoreConnection = async () => {
    setDiagnosticStatus('Comprobando...');
    try {
      const auth = await getAuthInstance();
      const dbInst = await getDbInstance();
      if (!auth || !dbInst || !auth.currentUser) {
        setDiagnosticStatus('Servicios no disponibles o usuario no autenticado');
        return;
      }
      const uid = auth.currentUser.uid;
      const testRef = doc(dbInst, 'diagnostics', uid);
      await setDoc(testRef, { ok: true, at: serverTimestamp() }, { merge: true });
      const snap = await getDoc(testRef);
      setDiagnosticStatus(snap.exists() ? 'Conexión verificada' : 'Fallo en verificación');
    } catch (e: any) {
      setDiagnosticStatus(e?.code === 'permission-denied' ? 'Permiso denegado por reglas' : e?.message || 'Error de conexión');
    }
  };

  return (
    <SafeAreaView edges={['top','bottom']} style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Enlazar Dispositivo</Text>
          <Text style={styles.headerSubtitle}>
            Agrega tu Pillbox para habilitar estado en tiempo real y notificaciones.
          </Text>
          <Button 
            onPress={() => router.push('/device/provision')} 
            variant="secondary" 
            size="md"
          >
            Provisionar nuevo dispositivo
          </Button>
        </View>

        {/* Success/Error Messages */}
        {successMessage && (
          <View style={[styles.cardContainer, styles.messageContainer]}>
            <SuccessMessage
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            />
          </View>
        )}

        {error && (
          <View style={[styles.cardContainer, styles.messageContainer]}>
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
              variant="banner"
            />
          </View>
        )}

        {/* Link Device Section */}
        <View style={styles.cardContainer}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.sectionTitle}>Ingresar Device ID</Text>
            <Input
              placeholder="DEVICE-001"
              value={deviceId}
              onChangeText={setDeviceId}
              autoCapitalize="none"
              variant="outlined"
              size="md"
              containerStyle={{ marginBottom: spacing.md }}
            />
            <View style={{ gap: spacing.sm }}>
              <Button 
                onPress={handleLink} 
                loading={loading}
                disabled={loading || !deviceId.trim()}
                fullWidth
              >
                Enlazar
              </Button>
              <Button
                onPress={() => deviceId.trim() && handleUnlink(deviceId.trim())}
                variant="danger"
                loading={!!deviceId.trim() && unlinkingDevice === deviceId.trim()}
                disabled={!deviceId.trim() || loading || (!!unlinkingDevice && unlinkingDevice === deviceId.trim())}
                fullWidth
              >
                Desenlazar
              </Button>
            </View>
          </Card>
        </View>

        {/* Linked Devices Section */}
        <View style={styles.cardContainer}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.sectionTitle}>Dispositivos Enlazados</Text>
            
            {loadingDevices ? (
              <LoadingSpinner 
                size="small" 
                message="Cargando dispositivos..." 
              />
            ) : linkedDevices.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No hay dispositivos enlazados.
                </Text>
              </View>
            ) : (
              linkedDevices.map((id, index) => {
                const stats = deviceStats[id];
                const isExpanded = expandedDevices.has(id);
                
                return (
                  <AnimatedListItem key={id} index={index} delay={100}>
                    <Card 
                      variant="outlined" 
                      padding="md"
                      style={styles.deviceCard}
                    >
                    {/* Device Header */}
                    <View style={styles.deviceHeader}>
                      <Text style={styles.deviceId}>{id}</Text>
                      <Button
                        onPress={() => handleUnlink(id)}
                        variant="danger"
                        size="sm"
                        loading={unlinkingDevice === id}
                        disabled={unlinkingDevice === id}
                      >
                        Desenlazar
                      </Button>
                    </View>

                    {/* Device Stats */}
                    <View style={styles.statsRow}>
                      <Text style={styles.statsLabel}>Batería</Text>
                      <Text style={styles.statsValue}>
                        {stats?.battery != null ? `${stats?.battery}%` : 'N/D'}
                      </Text>
                    </View>
                    
                    <View style={styles.statsRow}>
                      <Text style={styles.statsLabel}>Estado</Text>
                      <Text style={styles.statsValue}>
                        {stats?.status ?? 'N/D'}
                      </Text>
                    </View>

                    {/* Expand/Collapse Button */}
                    <TouchableOpacity 
                      style={styles.expandButton}
                      onPress={() => toggleDeviceExpanded(id)}
                      accessibilityLabel={isExpanded ? 'Ocultar configuración' : 'Mostrar configuración'}
                      accessibilityRole="button"
                    >
                      <Text style={styles.expandButtonText}>
                        {isExpanded ? '▼ Ocultar configuración' : '▶ Mostrar configuración'}
                      </Text>
                    </TouchableOpacity>

                    {/* Device Configuration Panel (Expanded) */}
                    {stats && (
                      <Collapsible collapsed={!isExpanded}>
                        <View style={styles.configSection}>
                          <DeviceConfigPanel
                            deviceId={id}
                            initialAlarmMode={stats.alarmMode}
                            initialLedIntensity={stats.ledIntensity}
                            initialLedColor={stats.ledColor}
                            onSave={(config) => saveDeviceConfig(id, config)}
                            loading={stats.saving}
                          />
                          
                          {stats.saveError && (
                            <ErrorMessage
                              message={stats.saveError}
                              variant="inline"
                              onDismiss={() => {
                                setDeviceStats((prev) => ({
                                  ...prev,
                                  [id]: { ...(prev[id] || {}), saveError: null }
                                }));
                              }}
                            />
                          )}
                        </View>
                      </Collapsible>
                    )}

                    {/* Dispense Button */}
                    <View style={styles.actionButtons}>
                      <Button 
                        onPress={() => handleDispense(id)}
                        variant="primary"
                        fullWidth
                        loading={dispensingDevice === id}
                        disabled={dispensingDevice === id}
                      >
                        Dispensar
                      </Button>
                    </View>
                  </Card>
                  </AnimatedListItem>
                );
              })
            )}
          </Card>
        </View>

        {/* Diagnostic Section */}
        <View style={styles.cardContainer}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.sectionTitle}>Diagnóstico de Firestore</Text>
            <View style={styles.diagnosticSection}>
              <View style={styles.diagnosticRow}>
                <Button 
                  onPress={diagnoseFirestoreConnection}
                  variant="secondary"
                  size="md"
                >
                  Probar conexión
                </Button>
                <Text style={styles.diagnosticStatus}>
                  {diagnosticStatus ?? 'Sin pruebas'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Back Button */}
        <View style={styles.cardContainer}>
          <Button 
            onPress={() => router.back()}
            variant="outline"
            fullWidth
          >
            Volver
          </Button>
        </View>
      </ScrollView>

      {/* Dispense feedback modal */}
      <Modal
        visible={!!dispenseFeedback}
        onClose={() => setDispenseFeedback(null)}
        title={dispenseFeedback?.type === 'success' ? 'Dispensaci��n enviada' : 'No se pudo dispensar'}
        size="sm"
      >
        <View style={{ gap: spacing.md }}>
          {dispenseFeedback?.type === 'success' ? (
            <SuccessMessage
              message={dispenseFeedback.message}
              autoDismiss={false}
            />
          ) : (
            <ErrorMessage
              message={dispenseFeedback?.message || ''}
              variant="inline"
              onDismiss={() => setDispenseFeedback(null)}
            />
          )}
          <Button
            onPress={() => setDispenseFeedback(null)}
            variant={dispenseFeedback?.type === 'success' ? 'primary' : 'secondary'}
            fullWidth
          >
            Entendido
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

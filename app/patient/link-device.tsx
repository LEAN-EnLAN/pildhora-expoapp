import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { linkDeviceToUser, unlinkDeviceFromUser } from '../../src/services/deviceLinking';
import { rdb, db } from '../../src/services/firebase';
import { ref, get, set } from 'firebase/database';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, backgroundColor: 'white', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  card: { backgroundColor: 'white', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  buttonSecondary: { backgroundColor: '#FF3B30' },
  buttonText: { color: 'white', fontWeight: '600' },
  listItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  listItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemText: { fontSize: 16, color: '#1C1C1E', fontWeight: '600' },
  statsSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F1F3', gap: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FAFAFA' },
  chipActive: { borderColor: '#007AFF', backgroundColor: '#E6F0FF' },
  swatchesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallButton: { backgroundColor: '#E5E7EB', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  smallButtonText: { color: '#1C1C1E', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#8E8E93' },
});

export default function LinkDeviceScreen() {
  const router = useRouter();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [deviceId, setDeviceId] = useState('');
  const [linkedDevices, setLinkedDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceStats, setDeviceStats] = useState<Record<string, {
    battery: number | null;
    alarmMode: 'off' | 'sound' | 'led' | 'both';
    ledIntensity: number; // 0-1023 typical
    ledColor: [number, number, number];
    saving?: boolean;
    saveError?: string | null;
  }>>({});

  async function refreshLinkedDevices() {
    if (!userId) return;
    try {
      // Read the user's active device links from Firestore
      const qLinks = query(
        collection(db, 'deviceLinks'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const linksSnap = await getDocs(qLinks);
      let ids = linksSnap.docs.map((d) => (d.data() as any).deviceId).filter(Boolean);
      // Fallback: if no Firestore links found yet, read from RTDB user links
      if (!ids.length) {
        try {
          const snap = await get(ref(rdb, `users/${userId}/devices`));
          const val = snap.val() || {};
          ids = Object.keys(val);
        } catch {}
      }
      setLinkedDevices(ids);

      // Fetch desiredConfig and lastKnownState for each device from Firestore devices/{id}
      const statsMap: Record<string, any> = {};
      for (const id of ids) {
        try {
          const devDoc = await getDoc(doc(db, 'devices', id));
          const devData = devDoc.exists() ? devDoc.data() : {} as any;
          const desired = (devData as any)?.desiredConfig || {};
          const alarmMode = (desired?.alarm_mode as 'off' | 'sound' | 'led' | 'both') ?? 'off';
          const ledIntensity = (desired?.led_intensity as number) ?? 512;
          const ledColorArr = (desired?.led_color_rgb as [number, number, number]) ?? [255, 0, 0];

          // Prefer Firestore lastKnownState mirrored by Cloud Function; fall back to null
          const last = (devData as any)?.lastKnownState || {};
          let battery: number | null = null;
          const rawBattery = last?.battery ?? last?.batteryPercent ?? last?.battery_percentage ?? last?.battery_level ?? null;
          if (typeof rawBattery === 'number') {
            battery = Math.round(rawBattery);
          } else if (typeof rawBattery === 'string') {
            const parsed = parseFloat(rawBattery);
            battery = isNaN(parsed) ? null : Math.round(parsed);
          }

          statsMap[id] = {
            battery,
            alarmMode,
            ledIntensity,
            ledColor: ledColorArr,
            saving: false,
            saveError: null,
          };
        } catch (e) {
          statsMap[id] = {
            battery: null,
            alarmMode: 'off',
            ledIntensity: 512,
            ledColor: [255, 0, 0],
            saving: false,
            saveError: 'No se pudo leer datos del dispositivo (Firestore).',
          };
        }
      }
      setDeviceStats(statsMap);
    } catch (e: any) {
      setError(e.message || 'Error al cargar dispositivos');
    }
  }

  useEffect(() => {
    refreshLinkedDevices();
  }, [userId]);

  const handleLink = async () => {
    setError(null);
    if (!userId) {
      setError('Debes iniciar sesión para enlazar un dispositivo.');
      return;
    }
    if (!deviceId.trim()) {
      setError('Ingresa un Device ID válido.');
      return;
    }
    try {
      setLoading(true);
      await linkDeviceToUser(userId, deviceId.trim());
      setDeviceId('');
      await refreshLinkedDevices();
    } catch (e: any) {
      setError(e.message || 'No se pudo enlazar el dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (id: string) => {
    setError(null);
    if (!userId) {
      setError('Debes iniciar sesión para desenlazar un dispositivo.');
      return;
    }
    try {
      setLoading(true);
      await unlinkDeviceFromUser(userId, id);
      await refreshLinkedDevices();
    } catch (e: any) {
      setError(e.message || 'No se pudo desenlazar el dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const setAlarmMode = (id: string, mode: 'off' | 'sound' | 'led' | 'both') => {
    setDeviceStats((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), alarmMode: mode }
    }));
  };

  const adjustIntensity = (id: string, delta: number) => {
    setDeviceStats((prev) => {
      const current = prev[id] || { ledIntensity: 512 } as any;
      let next = Math.max(0, Math.min(1023, (current.ledIntensity ?? 512) + delta));
      return { ...prev, [id]: { ...(prev[id] || {}), ledIntensity: next } };
    });
  };

  const setColor = (id: string, rgb: [number, number, number]) => {
    setDeviceStats((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ledColor: rgb }
    }));
  };

  const saveDeviceConfig = async (id: string) => {
    setDeviceStats((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), saving: true, saveError: null } }));
    try {
      const cfg = deviceStats[id];
      if (!cfg) throw new Error('Sin configuración local');
      // Persist minimal config to Firestore desiredConfig; Cloud Function will mirror to RTDB
      const payload = {
        led_intensity: cfg.ledIntensity,
        led_color_rgb: cfg.ledColor,
        alarm_mode: cfg.alarmMode,
      };
      await setDoc(
        doc(db, 'devices', id),
        {
          desiredConfig: payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setDeviceStats((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), saving: false } }));
    } catch (e: any) {
      setDeviceStats((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), saving: false, saveError: e?.message || 'Error al guardar configuración' } }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enlazar Dispositivo</Text>
        <Text style={styles.infoText}>Agrega tu Pillbox para habilitar estado en tiempo real y notificaciones.</Text>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Ingresar Device ID</Text>
        <TextInput
          style={styles.input}
          placeholder="DEVICE-001"
          value={deviceId}
          onChangeText={setDeviceId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleLink} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Enlazando...' : 'Enlazar'}</Text>
        </TouchableOpacity>
        {error && <Text style={{ color: '#FF3B30' }}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Dispositivos Enlazados</Text>
        {linkedDevices.length === 0 ? (
          <Text style={styles.infoText}>No hay dispositivos enlazados.</Text>
        ) : (
          linkedDevices.map((id) => {
            const stats = deviceStats[id];
            const colorHex = stats?.ledColor ? `#${stats.ledColor.map((c) => c.toString(16).padStart(2, '0')).join('')}` : '#000000';
            return (
              <View key={id} style={styles.listItem}>
                <View style={styles.listItemRow}>
                  <Text style={styles.listItemText}>{id}</Text>
                  <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => handleUnlink(id)}>
                    <Text style={styles.buttonText}>Desenlazar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.statsSection}>
                  <View style={styles.statsRow}>
                    <Text style={styles.infoText}>Batería</Text>
                    <Text style={{ fontWeight: '600', color: '#1C1C1E' }}>{stats?.battery != null ? `${stats?.battery}%` : 'N/D'}</Text>
                  </View>
                  <View>
                    <Text style={styles.infoText}>Modo de alarma</Text>
                    <View style={styles.chipRow}>
                      {['off','sound','led','both'].map((mode) => (
                        <TouchableOpacity
                          key={mode}
                          style={[styles.chip, stats?.alarmMode === mode ? styles.chipActive : null]}
                          onPress={() => setAlarmMode(id, mode as any)}
                        >
                          <Text style={{ color: '#1C1C1E' }}>
                            {mode === 'off' ? 'Apagado' : mode === 'sound' ? 'Sonido' : mode === 'led' ? 'Luz' : 'Ambos'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View>
                    <View style={styles.statsRow}>
                      <Text style={styles.infoText}>Intensidad LED</Text>
                      <Text style={{ fontWeight: '600', color: '#1C1C1E' }}>{stats?.ledIntensity ?? 512}</Text>
                    </View>
                    <View style={styles.controlRow}>
                      <TouchableOpacity style={styles.smallButton} onPress={() => adjustIntensity(id, -64)}>
                        <Text style={styles.smallButtonText}>-64</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallButton} onPress={() => adjustIntensity(id, +64)}>
                        <Text style={styles.smallButtonText}>+64</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View>
                    <View style={styles.statsRow}>
                      <Text style={styles.infoText}>Color LED</Text>
                      <View style={[styles.swatch, { backgroundColor: colorHex }]} />
                    </View>
                    <View style={styles.swatchesRow}>
                      {[
                        [255,0,0], [0,255,0], [0,0,255], [255,255,0], [0,255,255], [255,0,255], [255,255,255], [0,0,0]
                      ].map((rgb, idx) => (
                        <TouchableOpacity key={idx} style={[styles.swatch, { backgroundColor: `#${rgb.map(c=>c.toString(16).padStart(2,'0')).join('')}` }]} onPress={() => setColor(id, rgb as [number,number,number])} />
                      ))}
                    </View>
                  </View>
                  <View style={styles.statsRow}>
                    <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => saveDeviceConfig(id)} disabled={stats?.saving}>
                      <Text style={styles.buttonText}>{stats?.saving ? 'Guardando...' : 'Guardar cambios'}</Text>
                    </TouchableOpacity>
                  </View>
                  {stats?.saveError ? <Text style={{ color: '#FF3B30' }}>{stats?.saveError}</Text> : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

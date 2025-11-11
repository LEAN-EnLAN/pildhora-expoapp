import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import ColorPickerScaffold from '../../src/components/ColorPickerScaffold';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { linkDeviceToUser, unlinkDeviceFromUser, checkDevelopmentRuleStatus } from '../../src/services/deviceLinking';
import { rdb, db } from '../../src/services/firebase';
import { ref, get } from 'firebase/database';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const { t } = useTranslation();
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
      // Check if database is available
      if (!db) {
        console.warn('Database not available');
        return;
      }
      
      // Read the user's active device links from Firestore
      const qLinks = query(
        collection(db, 'deviceLinks'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const linksSnap = await getDocs(qLinks);
      let ids = linksSnap.docs.map((d) => (d.data() as any).deviceId).filter(Boolean);
      // Fallback: if no Firestore links found yet, read from RTDB user links
      if (!ids.length && rdb) {
        try {
          const snap = await get(ref(rdb, `users/${userId}/devices`));
          const val = snap.val() || {};
          ids = Object.keys(val);
        } catch { }
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
            saveError: t('patient.linkDevice.couldNotReadDeviceData'),
          };
        }
      }
      setDeviceStats(statsMap);
    } catch (e: any) {
      setError(e.message || t('patient.linkDevice.errorLoadingDevices'));
    }
  }

  useEffect(() => {
    refreshLinkedDevices();
    // Check development rule status on component mount
    checkDevelopmentRuleStatus().catch(console.error);
  }, [userId]);

  const handleLink = async () => {
    console.log('[DEBUG] handleLink called');
    setError(null);

    // Log Redux state
    console.log('[DEBUG] Redux auth state:', {
      userId,
      isAuthenticated: !!userId,
      deviceId: deviceId.trim()
    });

    if (!userId) {
      console.error('[DEBUG] No userId in Redux state');
      setError(t('patient.linkDevice.loginToLink'));
      return;
    }
    if (!deviceId.trim()) {
      console.error('[DEBUG] No deviceId provided');
      setError(t('patient.linkDevice.enterValidDeviceId'));
      return;
    }

    try {
      console.log('[DEBUG] Starting device linking process...');
      setLoading(true);
      await linkDeviceToUser(userId, deviceId.trim());
      console.log('[DEBUG] Device linking successful, refreshing device list...');
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
      setError(e.message || t('patient.linkDevice.couldNotLink'));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (id: string) => {
    setError(null);
    if (!userId) {
      setError(t('patient.linkDevice.loginToUnlink'));
      return;
    }
    try {
      setLoading(true);
      await unlinkDeviceFromUser(userId, id);
      await refreshLinkedDevices();
    } catch (e: any) {
      setError(e.message || t('patient.linkDevice.couldNotUnlink'));
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

  const setIntensity = (id: string, value: number) => {
    setDeviceStats((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ledIntensity: Math.max(0, Math.min(1023, Math.round(value))) }
    }));
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
  };

  const saveDeviceConfig = async (id: string) => {
    setDeviceStats((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), saving: true, saveError: null } }));
    try {
      const cfg = deviceStats[id];
      if (!cfg) throw new Error(t('patient.linkDevice.noLocalConfig'));
      
      // Check if database is available
      if (!db) {
        throw new Error('Database not available');
      }
      
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
      setDeviceStats((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), saving: false, saveError: e?.message || t('patient.linkDevice.errorSavingConfig') } }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('patient.linkDevice.title')}</Text>
        <Text style={styles.infoText}>{t('patient.linkDevice.subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{t('patient.linkDevice.enterDeviceId')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('patient.linkDevice.deviceIdPlaceholder')}
          value={deviceId}
          onChangeText={setDeviceId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleLink} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? t('patient.linkDevice.linking') : t('patient.linkDevice.link')}</Text>
        </TouchableOpacity>
        {error && <Text style={{ color: '#FF3B30' }}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{t('patient.linkDevice.linkedDevices')}</Text>
        {linkedDevices.length === 0 ? (
          <Text style={styles.infoText}>{t('patient.linkDevice.noLinkedDevices')}</Text>
        ) : (
          linkedDevices.map((id) => {
            const stats = deviceStats[id];
            const colorHex = stats?.ledColor ? `#${stats.ledColor.map((c) => c.toString(16).padStart(2, '0')).join('')}` : '#000000';
            return (
              <View key={id} style={styles.listItem}>
                <View style={styles.listItemRow}>
                  <Text style={styles.listItemText}>{id}</Text>
                  <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => handleUnlink(id)}>
                    <Text style={styles.buttonText}>{t('patient.linkDevice.unlink')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.statsSection}>
                  <View style={styles.statsRow}>
                    <Text style={styles.infoText}>{t('patient.linkDevice.battery')}</Text>
                    <Text style={{ fontWeight: '600', color: '#1C1C1E' }}>{stats?.battery != null ? `${stats?.battery}%` : t('patient.linkDevice.na')}</Text>
                  </View>
                  <View>
                    <Text style={styles.infoText}>{t('patient.linkDevice.alarmMode')}</Text>
                    <View style={styles.chipRow}>
                      {['off', 'sound', 'led', 'both'].map((mode) => (
                        <TouchableOpacity
                          key={mode}
                          style={[styles.chip, stats?.alarmMode === mode ? styles.chipActive : null]}
                          onPress={() => setAlarmMode(id, mode as any)}
                        >
                          <Text style={{ color: '#1C1C1E' }}>
                            {t(`patient.linkDevice.${mode}`)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View>
                    <View style={styles.statsRow}>
                      <Text style={styles.infoText}>{t('patient.linkDevice.ledIntensity')}</Text>
                      <Text style={{ fontWeight: '600', color: '#1C1C1E' }}>{stats?.ledIntensity ?? 512}</Text>
                    </View>
                    <Slider
                      minimumValue={0}
                      maximumValue={1023}
                      step={1}
                      value={stats?.ledIntensity ?? 512}
                      onValueChange={(val) => setIntensity(id, val)}
                      style={{ marginVertical: 8 }}
                      minimumTrackTintColor="#007AFF"
                      maximumTrackTintColor="#D1D5DB"
                    />
                  </View>
                  <View>
                    <View style={styles.statsRow}>
                      <Text style={styles.infoText}>{t('patient.linkDevice.ledColor')}</Text>
                      <View style={[styles.swatch, { backgroundColor: colorHex }]} />
                    </View>
                    <ColorPickerScaffold
                      value={colorHex}
                      onCompleteJS={({ hex }) => {
                        setColor(id, hexToRgb(hex));
                      }}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                  <View style={styles.statsRow}>
                    <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => saveDeviceConfig(id)} disabled={stats?.saving}>
                      <Text style={styles.buttonText}>{stats?.saving ? t('patient.linkDevice.saving') : t('patient.linkDevice.saveChanges')}</Text>
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
          <Text style={styles.buttonText}>{t('patient.linkDevice.back')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

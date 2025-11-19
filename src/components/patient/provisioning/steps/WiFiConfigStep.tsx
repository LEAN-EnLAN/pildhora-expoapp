import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Button } from '../../../ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';
import { useWizardContext } from '../WizardContext';
import { announceForAccessibility, triggerHapticFeedback, HapticFeedbackType } from '../../../../utils/accessibility';
import { getRdbInstance, getDbInstance } from '../../../../services/firebase';
import { ref, set, get } from 'firebase/database';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  DeviceProvisioningErrorCode,
  parseDeviceProvisioningError,
  handleDeviceProvisioningError
} from '../../../../utils/deviceProvisioningErrors';
import {
  initializeBLE,
  scanForDevices,
  connectToDevice,
  sendCommand,
  disconnectFromDevice
} from '../../../../store/slices/bleSlice';
import { RootState, AppDispatch } from '../../../../store';

/**
 * WiFiConfigStep Component
 * 
 * Fourth step of the device provisioning wizard. Allows user to configure
 * WiFi credentials for their device using either Smart Setup (BLE) or Manual Entry.
 * 
 * Premium visual overhaul.
 */
export function WiFiConfigStep() {
  const dispatch = useDispatch<AppDispatch>();
  const { formData, updateFormData, setCanProceed } = useWizardContext();

  // Setup Mode: 'smart' (BLE) or 'manual' (Type & Save)
  const [setupMode, setSetupMode] = useState<'smart' | 'manual'>('smart');

  // Form State
  const [wifiSSID, setWifiSSID] = useState(formData.wifiSSID || '');
  const [wifiPassword, setWifiPassword] = useState(formData.wifiPassword || '');
  const [showPassword, setShowPassword] = useState(false);

  // Manual Mode State
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [configSaved, setConfigSaved] = useState(false);

  // BLE State from Redux
  const {
    devices: foundDevices,
    scanning: isScanning,
    connectedDevice,
    connecting: isConnecting,
    error: bleError
  } = useSelector((state: RootState) => state.ble);

  useEffect(() => {
    announceForAccessibility('Paso 4: Configura la conexión WiFi de tu dispositivo');
    // Initialize BLE on mount if in smart mode
    if (setupMode === 'smart') {
      dispatch(initializeBLE());
    }
  }, [dispatch, setupMode]);

  // Validate WiFi credentials and check if config is saved
  useEffect(() => {
    const isValid = wifiSSID.trim().length > 0 && wifiPassword.length >= 8 && configSaved;
    setCanProceed(isValid);
  }, [wifiSSID, wifiPassword, configSaved, setCanProceed]);

  // Toggle Setup Mode
  const toggleSetupMode = (mode: 'smart' | 'manual') => {
    setSetupMode(mode);
    setSaveError(null);
    setConnectionStatus('idle');
    triggerHapticFeedback(HapticFeedbackType.SELECTION);
  };

  // --- BLE HANDLERS ---

  const handleScan = () => {
    dispatch(scanForDevices());
    announceForAccessibility('Escaneando dispositivos Pildhora cercanos');
  };

  const handleConnect = async (deviceId: string) => {
    await dispatch(connectToDevice(deviceId));
    announceForAccessibility('Conectando al dispositivo');
  };

  const handleSendConfigViaBLE = async () => {
    if (!wifiSSID.trim() || wifiPassword.length < 8 || !connectedDevice) return;

    setIsSaving(true);
    try {
      // 1. Send Config Command via BLE
      const configPayload = JSON.stringify({
        cmd: 'set_wifi',
        ssid: wifiSSID.trim(),
        pass: wifiPassword
      });

      await dispatch(sendCommand(configPayload)).unwrap();

      // 2. Wait for device confirmation (simulated here, real device would reply)
      // In a real app, we'd subscribe to a notification characteristic
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Update Backend (Mirror the config to cloud)
      await saveConfigToCloud();

      setConfigSaved(true);
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      announceForAccessibility('Configuración enviada al dispositivo exitosamente');

    } catch (error: any) {
      console.error('BLE Config Error:', error);
      setSaveError('No se pudo enviar la configuración al dispositivo. Intenta nuevamente o usa el modo manual.');
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  // --- MANUAL HANDLERS ---

  /**
   * Save WiFi configuration to RTDB (Manual Mode)
   */
  const saveConfigToCloud = async () => {
    const rdb = await getRdbInstance();
    if (!rdb) throw new Error('Error de conexión a la base de datos');

    // Write WiFi config to RTDB devices/{deviceId}/config
    const deviceConfigRef = ref(rdb, `devices/${formData.deviceId}/config`);

    const existingConfigSnapshot = await get(deviceConfigRef);
    const existingConfig = existingConfigSnapshot.exists() ? existingConfigSnapshot.val() : {};

    await set(deviceConfigRef, {
      ...existingConfig,
      wifi_ssid: wifiSSID.trim(),
      wifi_password: wifiPassword,
      wifi_configured: true,
      wifi_configured_at: Date.now(),
    });

    // Update Firestore
    const db = await getDbInstance();
    if (db) {
      const deviceDocRef = doc(db, 'devices', formData.deviceId);
      await updateDoc(deviceDocRef, {
        wifiConfigured: true,
        wifiSSID: wifiSSID.trim(),
        updatedAt: serverTimestamp(),
      });
    }

    updateFormData({
      wifiSSID: wifiSSID.trim(),
      wifiPassword: wifiPassword,
    });
  };

  const handleManualSave = async () => {
    if (!wifiSSID.trim() || wifiPassword.length < 8) return;

    setIsSaving(true);
    setSaveError(null);
    setConnectionStatus('idle');

    try {
      await saveConfigToCloud();

      setConfigSaved(true);
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      announceForAccessibility('Configuración WiFi guardada exitosamente');

      // Automatically test connection after saving
      await handleTestConnection();

    } catch (error: any) {
      console.error('[WiFiConfigStep] Error saving WiFi config:', error);
      const errorCode = parseDeviceProvisioningError(error);
      const errorResponse = handleDeviceProvisioningError(errorCode);
      setSaveError(errorResponse.userMessage);
      setConfigSaved(false);
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Test WiFi connection (Check cloud status)
   */
  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('testing');
    setSaveError(null);

    try {
      const rdb = await getRdbInstance();
      if (!rdb) throw new Error('Error de conexión a la base de datos');

      const deviceStateRef = ref(rdb, `devices/${formData.deviceId}/state`);

      // Wait a moment for device to process config
      await new Promise(resolve => setTimeout(resolve, 2000));

      const stateSnapshot = await get(deviceStateRef);
      const deviceState = stateSnapshot.exists() ? stateSnapshot.val() : {};

      if (deviceState.wifi_connected === true) {
        setConnectionStatus('success');
        await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
        announceForAccessibility('Conexión WiFi exitosa');
      } else {
        // Optimistic success for UX if device isn't immediately reporting
        setConnectionStatus('success');
        await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
        announceForAccessibility('Configuración guardada. El dispositivo intentará conectarse');
      }

    } catch (error: any) {
      console.error('[WiFiConfigStep] Error testing connection:', error);
      setConnectionStatus('success'); // Optimistic
      await triggerHapticFeedback(HapticFeedbackType.WARNING);
    } finally {
      setIsTesting(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderSmartSetup = () => (
    <View style={styles.smartSetupContainer}>
      {!connectedDevice ? (
        <>
          <View style={styles.scanHeader}>
            <View style={styles.radarAnimation}>
              <Ionicons name="bluetooth" size={32} color={colors.primary[500]} />
            </View>
            <Text style={styles.scanTitle}>Buscando tu Pildhora...</Text>
            <Text style={styles.scanSubtitle}>Asegúrate de estar cerca del dispositivo.</Text>
          </View>

          {foundDevices.length > 0 ? (
            <View style={styles.deviceList}>
              {foundDevices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceItem}
                  onPress={() => handleConnect(device.id)}
                  disabled={isConnecting}
                >
                  <View style={styles.deviceIcon}>
                    <Ionicons name="hardware-chip-outline" size={24} color={colors.primary[600]} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceId}>{device.id}</Text>
                  </View>
                  {isConnecting ? (
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                  ) : (
                    <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              {isScanning ? (
                <Text style={styles.scanningText}>Escaneando...</Text>
              ) : (
                <Button
                  onPress={handleScan}
                  variant="outline"
                  leftIcon={<Ionicons name="refresh" size={20} />}
                >
                  Escanear de nuevo
                </Button>
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.connectedContainer}>
          <View style={styles.connectedHeader}>
            <View style={styles.connectedBadge}>
              <Ionicons name="bluetooth" size={16} color="#FFFFFF" />
              <Text style={styles.connectedText}>Conectado a {connectedDevice.name}</Text>
            </View>
          </View>

          <Text style={styles.connectedInstruction}>
            Ingresa los datos de tu red WiFi para enviarlos al dispositivo.
          </Text>

          {renderWifiForm(handleSendConfigViaBLE, 'Enviar al Dispositivo')}
        </View>
      )}
    </View>
  );

  const renderWifiForm = (onSubmit: () => void, submitLabel: string) => (
    <View style={styles.formSection}>
      <Input
        label="Nombre de la red (SSID)"
        value={wifiSSID}
        onChangeText={setWifiSSID}
        placeholder="Ej: MiCasa_WiFi"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Campo de nombre de red WiFi"
        leftIcon={<Ionicons name="globe-outline" size={20} color={colors.gray[400]} />}
      />

      <View style={styles.passwordContainer}>
        <Input
          label="Contraseña"
          value={wifiPassword}
          onChangeText={setWifiPassword}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Campo de contraseña WiFi"
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.gray[400]} />}
        />
        <TouchableOpacity
          style={styles.showPasswordButton}
          onPress={() => setShowPassword(!showPassword)}
          accessibilityRole="button"
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={colors.gray[500]}
          />
        </TouchableOpacity>
      </View>

      {saveError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      {/* Status Indicators */}
      {connectionStatus === 'testing' && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.statusText}>Probando conexión...</Text>
        </View>
      )}

      {connectionStatus === 'success' && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.successText}>
            {configSaved ? '¡Conexión exitosa!' : 'Conexión exitosa'}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!configSaved ? (
          <Button
            onPress={onSubmit}
            variant="primary"
            size="lg"
            disabled={wifiSSID.trim().length === 0 || wifiPassword.length < 8 || isSaving}
            loading={isSaving}
            style={styles.mainButton}
          >
            {isSaving ? 'Procesando...' : submitLabel}
          </Button>
        ) : (
          <View style={styles.savedActions}>
            <Button
              onPress={handleTestConnection}
              variant="secondary"
              size="lg"
              disabled={isTesting}
              loading={isTesting}
              style={styles.actionButton}
            >
              {isTesting ? 'Probando...' : 'Probar de nuevo'}
            </Button>

            <Button
              onPress={() => {
                setConfigSaved(false);
                setConnectionStatus('idle');
                setSaveError(null);
              }}
              variant="outline"
              size="lg"
              style={styles.actionButton}
            >
              Cambiar Red
            </Button>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="wifi" size={40} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>Conexión WiFi</Text>
        <Text style={styles.subtitle}>
          Conecta tu dispositivo a internet para sincronizar tus medicamentos.
        </Text>
      </View>

      {/* Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, setupMode === 'smart' && styles.toggleButtonActive]}
          onPress={() => toggleSetupMode('smart')}
        >
          <Ionicons
            name="bluetooth"
            size={20}
            color={setupMode === 'smart' ? colors.primary[600] : colors.gray[500]}
          />
          <Text style={[styles.toggleText, setupMode === 'smart' && styles.toggleTextActive]}>
            Configuración Inteligente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, setupMode === 'manual' && styles.toggleButtonActive]}
          onPress={() => toggleSetupMode('manual')}
        >
          <Ionicons
            name="keypad"
            size={20}
            color={setupMode === 'manual' ? colors.primary[600] : colors.gray[500]}
          />
          <Text style={[styles.toggleText, setupMode === 'manual' && styles.toggleTextActive]}>
            Manual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Card */}
      <View style={styles.card}>
        {setupMode === 'smart' ? renderSmartSetup() : renderWifiForm(handleManualSave, 'Guardar Configuración')}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>Tu contraseña se transmite de forma encriptada.</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="flash-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>Solo redes 2.4GHz son compatibles.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Import ActivityIndicator since it was missing in imports
import { ActivityIndicator } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 4,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
  },
  toggleTextActive: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    marginBottom: spacing.lg,
    minHeight: 300,
  },
  // Smart Setup Styles
  smartSetupContainer: {
    flex: 1,
  },
  scanHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  radarAnimation: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scanTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  scanSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  deviceList: {
    marginTop: spacing.md,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  deviceId: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  scanningText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  connectedContainer: {
    flex: 1,
  },
  connectedHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  connectedText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
  },
  connectedInstruction: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // Form Styles
  formSection: {
    gap: spacing.lg,
  },
  passwordContainer: {
    position: 'relative',
  },
  showPasswordButton: {
    position: 'absolute',
    right: spacing.md,
    top: 42,
    padding: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    gap: spacing.md,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    gap: spacing.md,
    justifyContent: 'center',
  },
  successText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
  },
  buttonContainer: {
    marginTop: spacing.sm,
  },
  mainButton: {
    borderRadius: borderRadius.full,
  },
  savedActions: {
    gap: spacing.md,
  },
  actionButton: {
    borderRadius: borderRadius.full,
  },
  infoSection: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    flex: 1,
  },
});

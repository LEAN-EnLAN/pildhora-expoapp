import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';
import { useWizardContext } from '../WizardContext';
import { announceForAccessibility, triggerHapticFeedback, HapticFeedbackType } from '../../../../utils/accessibility';
import { getRdbInstance, getDeviceRdbInstance } from '../../../../services/firebase';
import { ref, set, get } from 'firebase/database';

/**
 * WiFiConfigStep Component
 * 
 * Fourth step of the device provisioning wizard. Allows user to configure
 * WiFi credentials for their device using either Smart Setup (BLE) or Manual Entry.
 * 
 * Premium visual overhaul.
 */
export function WiFiConfigStep() {
  const { formData, setCanProceed } = useWizardContext();
  const [isTesting, setIsTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    announceForAccessibility('Paso 4: Verificar conexión del dispositivo');
  }, []);

  useEffect(() => {
    const isValid = configSaved;
    setCanProceed(isValid);
  }, [configSaved, setCanProceed]);

  const sendCommandFlag = async (key: string, value: any) => {
    const rdb = await getDeviceRdbInstance();
    if (!rdb) throw new Error('Error de conexión a la base de datos');
    const cmdRef = ref(rdb, `devices/${formData.deviceId}/commands/${key}`);
    await set(cmdRef, value);
  };

  /**
   * Test WiFi connection (Check cloud status)
   */
  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('testing');
    setSaveError(null);

    try {
      const rdb = await getDeviceRdbInstance();
      if (!rdb) throw new Error('Error de conexión a la base de datos');
      const deviceStateRef = ref(rdb, `devices/${formData.deviceId}/state`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const stateSnapshot = await get(deviceStateRef);
      const deviceState = stateSnapshot.exists() ? stateSnapshot.val() : {};
      const isOnline = deviceState.is_online === true;
      if (isOnline) {
        setConnectionStatus('success');
        setConfigSaved(true);
        await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
        announceForAccessibility('Dispositivo en línea');
      } else {
        setConnectionStatus('failed');
        setConfigSaved(false);
        await triggerHapticFeedback(HapticFeedbackType.WARNING);
        announceForAccessibility('No se detecta el dispositivo en línea');
      }
    } catch (error: any) {
      console.error('[WiFiConfigStep] Error testing connection:', error);
      setConnectionStatus('failed');
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
    } finally {
      setIsTesting(false);
    }
  };

  const handleBuzzTest = async () => {
    try {
      await sendCommandFlag('buzzer', true);
      await triggerHapticFeedback(HapticFeedbackType.SELECTION);
    } catch (error: any) {
      console.error('[WiFiConfigStep] Error enviando buzzer:', error);
      setSaveError('No se pudo enviar el comando al dispositivo.');
    }
  };

  const handleLedTest = async () => {
    try {
      await sendCommandFlag('ledColor', '0,255,0');
      await sendCommandFlag('led', true);
      await triggerHapticFeedback(HapticFeedbackType.SELECTION);
    } catch (error: any) {
      console.error('[WiFiConfigStep] Error enviando LED:', error);
      setSaveError('No se pudo enviar el comando al dispositivo.');
    }
  };

  // --- RENDER HELPERS ---

  const renderConnectivityCard = () => (
    <View style={styles.card}>
      {saveError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}
      {connectionStatus === 'testing' && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.statusText}>Probando conexión...</Text>
        </View>
      )}
      {connectionStatus === 'success' && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success[500]} />
          <Text style={styles.successText}>¡Conexión exitosa!</Text>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button
          onPress={handleTestConnection}
          variant="primary"
          size="lg"
          disabled={isTesting}
          loading={isTesting}
          style={styles.mainButton}
        >
          {isTesting ? 'Probando...' : 'Probar conexión'}
        </Button>
        <View style={styles.savedActions}>
          <Button
            onPress={handleBuzzTest}
            variant="secondary"
            size="lg"
            style={styles.actionButton}
          >
            Emitir sonido
          </Button>
          <Button
            onPress={handleLedTest}
            variant="outline"
            size="lg"
            style={styles.actionButton}
          >
            Luz verde
          </Button>
        </View>
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
          Verifica que tu dispositivo esté en línea y responda a comandos.
        </Text>
      </View>
      {renderConnectivityCard()}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>La comunicación usa HTTPS entre el dispositivo y Firebase.</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="flash-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>El dispositivo trabaja en redes 2.4GHz.</Text>
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
    color: colors.success[500],
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

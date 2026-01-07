/**
 * Device Settings Screen (Redesigned)
 * 
 * A comprehensive device management screen for patients that includes:
 * - Device information display (ID, firmware, WiFi, battery, status)
 * - Real-time device state monitoring via RTDB
 * - Device configuration (alarm mode, LED settings)
 * - Privacy controls (autonomous mode toggle)
 * - Caregiver management (view connected, revoke access)
 * - Connection code generation and management
 * - Device linking/unlinking
 * 
 * Architecture:
 * - Uses useDeviceSettings hook for all state management
 * - Modular components for each section
 * - Real-time updates via Firebase RTDB subscription
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../src/store';
import { checkAuthState } from '../../src/store/slices/authSlice';
import { ErrorMessage, SuccessMessage } from '../../src/components/ui';
import { useDeviceSettings } from '../../src/hooks/useDeviceSettings';
import { deviceActionsService } from '../../src/services/deviceActions';
import {
  DeviceInfoCard,
  DeviceConfigSection,
  PrivacySharingSection,
  ConnectionCodesSection,
  DeviceManagementSection,
  LinkDeviceForm,
} from '../../src/components/patient/device-settings';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function DeviceSettingsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const canDispense = user?.role === 'caregiver';

  const [refreshing, setRefreshing] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Use the comprehensive device settings hook
  const {
    deviceId,
    deviceInfo,
    deviceState,
    isOnline,
    deviceConfig,
    savingConfig,
    caregivers,
    caregiversLoading,
    connectionCodes,
    codesLoading,
    autonomousMode,
    togglingAutonomousMode,
    linkDevice,
    unlinkDevice,
    generateConnectionCode,
    revokeCode,
    revokeCaregiver,
    toggleAutonomousMode,
    saveConfig,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    refresh,
  } = useDeviceSettings({
    userId: user?.id,
    deviceId: user?.deviceId,
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    // Also refresh auth state to get latest deviceId
    await dispatch(checkAuthState());
    setRefreshing(false);
  }, [refresh, dispatch]);

  // Handle device linking
  const handleLinkDevice = useCallback(async (newDeviceId: string) => {
    await linkDevice(newDeviceId);
    // Refresh auth state to update Redux
    await dispatch(checkAuthState());
  }, [linkDevice, dispatch]);

  // Handle device unlinking
  const handleUnlinkDevice = useCallback(async () => {
    setUnlinking(true);
    try {
      await unlinkDevice();
      await dispatch(checkAuthState());
    } finally {
      setUnlinking(false);
    }
  }, [unlinkDevice, dispatch]);

  // Handle dispense action
  const handleDispense = useCallback(async () => {
    if (!deviceId || !user?.id) return;
    
    setDispensing(true);
    try {
      const result = await deviceActionsService.dispenseManualDose(deviceId, user.id);
      if (result.success) {
        Alert.alert('Éxito', result.message || 'Solicitud de dispensación enviada');
      } else {
        Alert.alert('Error', result.message || 'No se pudo dispensar');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al dispensar');
    } finally {
      setDispensing(false);
    }
  }, [deviceId, user?.id]);

  // Handle connection code generation
  const handleGenerateCode = useCallback(async () => {
    setGeneratingCode(true);
    try {
      return await generateConnectionCode();
    } finally {
      setGeneratingCode(false);
    }
  }, [generateConnectionCode]);

  // Handle caregiver revocation with confirmation
  const handleRevokeCaregiver = useCallback((caregiverId: string, caregiverName: string) => {
    Alert.alert(
      'Revocar Acceso',
      `¿Estás seguro de que deseas revocar el acceso de ${caregiverName}?\n\nYa no podrán ver tu información de medicamentos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: () => revokeCaregiver(caregiverId, caregiverName),
        }
      ]
    );
  }, [revokeCaregiver]);

  // Handle autonomous mode toggle with confirmation
  const handleToggleAutonomousMode = useCallback((newValue: boolean) => {
    const modeLabel = newValue ? 'Modo Autónomo' : 'Modo Supervisado';
    const warningMessage = newValue
      ? `Al activar el Modo Autónomo:\n\n• Tus cuidadores NO verán nuevos eventos de medicamentos\n• Podrán ver el historial anterior\n• Verán "Modo autónomo activado" en tu información actual\n\n¿Deseas continuar?`
      : `Al desactivar el Modo Autónomo:\n\n• Tus cuidadores volverán a ver tus eventos de medicamentos en tiempo real\n• Tendrán acceso completo a tu información\n\n¿Deseas continuar?`;

    Alert.alert(
      `Cambiar a ${modeLabel}`,
      warningMessage,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => toggleAutonomousMode(newValue) }
      ]
    );
  }, [toggleAutonomousMode]);

  // Handle ID copy feedback
  const handleCopyId = useCallback(() => {
    Alert.alert('Copiado', 'ID del dispositivo copiado al portapapeles');
  }, []);

  // Render the "Link Device" screen if no device is linked
  if (!deviceId) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Screen Header */}
          <View style={styles.screenHeader}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="settings-outline" size={24} color={colors.primary[600]} />
            </View>
            <Text style={styles.screenTitle}>Configuración del Dispositivo</Text>
            <Text style={styles.screenSubtitle}>
              Vincula y gestiona tu dispositivo PildHora
            </Text>
          </View>

          {/* Messages */}
          {success && (
            <View style={styles.messageContainer}>
              <SuccessMessage
                message={success}
                onDismiss={clearSuccess}
                autoDismiss
                duration={5000}
              />
            </View>
          )}
          {error && (
            <View style={styles.messageContainer}>
              <ErrorMessage
                message={error}
                onDismiss={clearError}
                variant="banner"
              />
            </View>
          )}

          {/* Link Device Form */}
          <View style={styles.section}>
            <LinkDeviceForm
              onLink={handleLinkDevice}
              linking={loading}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render the full device settings screen
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Screen Header */}
        <View style={styles.screenHeader}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="settings-outline" size={24} color={colors.primary[600]} />
          </View>
          <Text style={styles.screenTitle}>Configuración del Dispositivo</Text>
          <Text style={styles.screenSubtitle}>
            Gestiona tu dispositivo y controla quién puede ver tu información
          </Text>
        </View>

        {/* Messages */}
        {success && (
          <View style={styles.messageContainer}>
            <SuccessMessage
              message={success}
              onDismiss={clearSuccess}
              autoDismiss
              duration={5000}
            />
          </View>
        )}
        {error && (
          <View style={styles.messageContainer}>
            <ErrorMessage
              message={error}
              onDismiss={clearError}
              variant="banner"
            />
          </View>
        )}

        {/* Device Info Card */}
        <View style={styles.section}>
          <DeviceInfoCard
            deviceId={deviceId}
            deviceInfo={deviceInfo}
            deviceState={deviceState}
            isOnline={isOnline}
            onCopyId={handleCopyId}
          />
        </View>

        {/* Device Configuration */}
        <View style={styles.section}>
          <DeviceConfigSection
            deviceId={deviceId}
            config={deviceConfig}
            onSave={saveConfig}
            saving={savingConfig}
            onDispense={canDispense ? handleDispense : undefined}
            dispensing={canDispense ? dispensing : false}
          />
        </View>

        {/* Privacy & Sharing */}
        <View style={styles.section}>
          <PrivacySharingSection
            autonomousMode={autonomousMode}
            onToggleAutonomousMode={handleToggleAutonomousMode}
            togglingAutonomousMode={togglingAutonomousMode}
            caregivers={caregivers}
            caregiversLoading={caregiversLoading}
            onRevokeCaregiver={handleRevokeCaregiver}
          />
        </View>

        {/* Connection Codes */}
        <View style={styles.section}>
          <ConnectionCodesSection
            codes={connectionCodes}
            loading={codesLoading}
            generatingCode={generatingCode}
            onGenerateCode={handleGenerateCode}
            onRevokeCode={revokeCode}
          />
        </View>

        {/* Device Management */}
        <View style={styles.section}>
          <DeviceManagementSection
            deviceId={deviceId}
            onUnlink={handleUnlinkDevice}
            unlinking={unlinking}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  screenHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    marginBottom: spacing.md,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  screenTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});

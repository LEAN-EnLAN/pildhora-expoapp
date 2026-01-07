import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SuccessMessage } from '../ui/SuccessMessage';
import { ErrorMessage } from '../ui/ErrorMessage';
import { NotificationSettings } from './NotificationSettings';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  setNotificationsEnabled,
  setNotificationHierarchy,
  setNotificationPermissionStatus,
  addModality,
  removeModality,
  savePreferencesToBackend,
  savePermissionsToBackend,
} from '../../store/slices/preferencesSlice';
import { deleteAccount } from '../../store/slices/authSlice';
import * as Notifications from 'expo-notifications';
import { ensurePushTokensRegistered } from '../../services/notifications/push';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import { useRouter } from 'expo-router';
import { useUserRole } from '../../hooks/useUserRole';
import { Ionicons } from '@expo/vector-icons';
import { useScrollViewPadding } from '../../hooks/useScrollViewPadding';

/**
 * Modern Role-based Settings Screen
 * 
 * Completely redesigned with:
 * - Modern card-based layout with gradients
 * - Improved visual hierarchy
 * - Better organization and grouping
 * - Enhanced accessibility
 * - Smooth animations and interactions
 * - Quick actions and shortcuts
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function RoleBasedSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((s: RootState) => s.auth);
  const prefs = useSelector((s: RootState) => s.preferences);
  const { isPatient } = useUserRole();
  const uid = user?.id || '';

  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['profile']));

  useEffect(() => {
    let mounted = true;
    Notifications.getPermissionsAsync().then((r) => {
      if (!mounted) return;
      const status = r.status as 'granted' | 'denied' | 'undetermined';
      setNotifStatus(status);
      dispatch(setNotificationPermissionStatus(status));
    });
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      dispatch(setNotificationsEnabled(enabled));
      if (uid) {
        await dispatch(savePreferencesToBackend(uid));
        showSuccess(enabled ? 'Notificaciones habilitadas' : 'Notificaciones deshabilitadas');
      }
    } catch (error) {
      showError('Error al guardar preferencias');
    }
  };

  const handleRequestNotifications = async () => {
    try {
      const res = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      } as any);
      const status = res.status as 'granted' | 'denied' | 'undetermined';
      setNotifStatus(status);
      dispatch(setNotificationPermissionStatus(status));

      if (status === 'granted' && uid) {
        await ensurePushTokensRegistered(uid);
        await dispatch(savePermissionsToBackend(uid));
        showSuccess('Permisos de notificación concedidos');
      } else if (status === 'denied') {
        showError('Permisos de notificación denegados');
      }
    } catch (error) {
      showError('Error al solicitar permisos');
    }
  };

  const handleUpdateHierarchy = async (hierarchy: string[]) => {
    try {
      dispatch(setNotificationHierarchy(hierarchy));
      if (uid) {
        await dispatch(savePreferencesToBackend(uid));
        showSuccess('Prioridad actualizada');
      }
    } catch (error) {
      showError('Error al actualizar prioridad');
    }
  };

  const handleAddModality = async (name: string) => {
    try {
      dispatch(addModality(name));

      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync(name, {
            name,
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
          });
        } catch (e) {
          console.warn('Failed to create notification channel:', e);
        }
      }

      if (uid) {
        await dispatch(savePreferencesToBackend(uid));
        showSuccess(`Modalidad "${name}" agregada`);
      }
    } catch (error) {
      showError('Error al agregar modalidad');
    }
  };

  const handleRemoveModality = async (name: string) => {
    try {
      dispatch(removeModality(name));
      if (uid) {
        await dispatch(savePreferencesToBackend(uid));
        showSuccess(`Modalidad "${name}" eliminada`);
      }
    } catch (error) {
      showError('Error al eliminar modalidad');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus datos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteAccount()).unwrap();
              // Router will handle redirection based on auth state change
            } catch (error: any) {
              showError(error || 'Error al eliminar la cuenta');
            }
          },
        },
      ]
    );
  };

  const defaultModalities = ['urgent', 'medication', 'general'];
  const customModalities = prefs.notifications.hierarchy.filter((m) => !defaultModalities.includes(m));

  // Get proper padding for scrollable content
  const { contentPaddingBottom } = useScrollViewPadding();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success/Error Messages */}
        {successMessage && (
          <View style={styles.messageContainer}>
            <SuccessMessage
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
              autoDismiss={true}
              duration={3000}
            />
          </View>
        )}

        {errorMessage && (
          <View style={styles.messageContainer}>
            <ErrorMessage
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              variant="banner"
            />
          </View>
        )}

        {/* Profile Section - Collapsible */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('profile')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="person-circle-outline" size={24} color={colors.primary[500]} />
              <Text style={styles.sectionHeaderTitle}>Perfil</Text>
            </View>
            <Ionicons
              name={expandedSections.has('profile') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.has('profile') && (
            <Card variant="elevated" padding="lg" style={styles.sectionCard}>
              <View style={styles.profileContainer}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {(user?.name || (isPatient ? 'P' : 'C')).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || (isPatient ? 'Paciente' : 'Cuidador')}</Text>
                  <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                  <View style={styles.roleBadge}>
                    <Ionicons name={isPatient ? 'person' : 'people'} size={12} color={colors.primary[600]} />
                    <Text style={styles.roleBadgeText}>{isPatient ? 'Paciente' : 'Cuidador'}</Text>
                  </View>
                </View>
              </View>
              <Button
                variant="primary"
                size="md"
                onPress={() => router.push(isPatient ? '/patient/edit-profile' : '/caregiver/edit-profile')}
                style={styles.editButton}
                accessibilityLabel="Editar perfil"
              >
                Editar perfil
              </Button>
            </Card>
          )}
        </View>

        {/* Device/Patient Management Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('management')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name={isPatient ? 'hardware-chip-outline' : 'people-outline'}
                size={24}
                color={colors.info[500]}
              />
              <Text style={styles.sectionHeaderTitle}>
                {isPatient ? 'Dispositivo' : 'Pacientes'}
              </Text>
            </View>
            <Ionicons
              name={expandedSections.has('management') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.has('management') && (
            <Card variant="elevated" padding="lg" style={styles.sectionCard}>
              <Text style={styles.cardDescription}>
                {isPatient
                  ? 'Gestiona tu dispositivo Pillbox y las conexiones de cuidadores'
                  : 'Gestiona las conexiones con tus pacientes'}
              </Text>

              {isPatient && user?.deviceId && (
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceInfoRow}>
                    <Text style={styles.deviceInfoLabel}>ID del dispositivo</Text>
                    <Text style={styles.deviceInfoValue}>{user.deviceId}</Text>
                  </View>
                  <View style={styles.deviceStatusBadge}>
                    <View style={styles.deviceStatusDot} />
                    <Text style={styles.deviceStatusText}>Conectado</Text>
                  </View>
                </View>
              )}

              <Button
                variant="primary"
                size="md"
                onPress={() => router.push(isPatient ? '/patient/device-settings' : '/caregiver/add-device')}
                style={styles.managementButton}
                accessibilityLabel={isPatient ? 'Gestionar dispositivo' : 'Gestionar pacientes'}
              >
                {isPatient ? 'Gestionar dispositivo' : 'Gestionar pacientes'}
              </Button>
            </Card>
          )}
        </View>

        {/* Notification Settings Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="notifications-outline" size={24} color={colors.warning[500]} />
              <Text style={styles.sectionHeaderTitle}>Notificaciones</Text>
            </View>
            <Ionicons
              name={expandedSections.has('notifications') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.has('notifications') && (
            <View style={styles.sectionCard}>
              <NotificationSettings
                enabled={prefs.notifications.enabled}
                permissionStatus={notifStatus}
                hierarchy={prefs.notifications.hierarchy}
                customModalities={customModalities}
                onToggleEnabled={handleToggleNotifications}
                onUpdateHierarchy={handleUpdateHierarchy}
                onAddModality={handleAddModality}
                onRemoveModality={handleRemoveModality}
                onRequestPermission={handleRequestNotifications}
              />
            </View>
          )}
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error[600], marginTop: spacing.xl }]}>Zona de Peligro</Text>
          <Card variant="outlined" padding="lg" style={StyleSheet.flatten([styles.sectionCard, { borderColor: colors.error[500], backgroundColor: colors.error[50] }])}>
            <Text style={[styles.cardDescription, { color: colors.error[700] }]}>
              Si eliminas tu cuenta, perderás todos tus datos y no podrás recuperarlos.
            </Text>
            <Button
              variant="outline"
              size="md"
              onPress={handleDeleteAccount}
              style={{ borderColor: colors.error[500] }}
              accessibilityLabel="Eliminar cuenta"
            >
              Eliminar cuenta
            </Button>
          </Card>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    // paddingBottom is applied dynamically via useScrollViewPadding hook
  },
  messageContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  sectionCard: {
    marginTop: spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    textAlign: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  editButton: {
    marginTop: spacing.sm,
  },
  cardDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  deviceInfo: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  deviceInfoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },
  deviceInfoValue: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: typography.fontWeight.semibold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  deviceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success[500],
  },
  deviceStatusText: {
    fontSize: typography.fontSize.xs,
    color: colors.success[600],
    fontWeight: typography.fontWeight.medium,
  },
  managementButton: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.sm,
  },
});

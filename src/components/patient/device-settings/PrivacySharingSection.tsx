import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { CaregiverListItem } from './CaregiverListItem';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';
import type { LinkedCaregiver } from '../../../hooks/useDeviceSettings';

interface PrivacySharingSectionProps {
  autonomousMode: boolean;
  onToggleAutonomousMode: (enabled: boolean) => void;
  togglingAutonomousMode: boolean;
  caregivers: LinkedCaregiver[];
  caregiversLoading: boolean;
  onRevokeCaregiver: (id: string, name: string) => void;
}

export const PrivacySharingSection: React.FC<PrivacySharingSectionProps> = React.memo(({
  autonomousMode,
  onToggleAutonomousMode,
  togglingAutonomousMode,
  caregivers,
  caregiversLoading,
  onRevokeCaregiver,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Privacidad y Compartir
      </Text>
      <Text style={styles.sectionSubtitle}>
        Controla quién puede ver tu información de medicamentos
      </Text>

      {/* Autonomous Mode Card */}
      <Card variant="elevated" padding="lg" style={styles.modeCard}>
        <View style={styles.modeHeader}>
          <View style={styles.modeIconContainer}>
            <Ionicons
              name={autonomousMode ? 'eye-off' : 'eye'}
              size={24}
              color={autonomousMode ? colors.warning[600] : colors.primary[600]}
            />
          </View>
          
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>
              {autonomousMode ? 'Modo Autónomo' : 'Modo Supervisado'}
            </Text>
            <Text style={styles.modeDescription}>
              {autonomousMode
                ? 'Tus datos no se comparten con cuidadores'
                : 'Tus cuidadores pueden ver tu información'}
            </Text>
          </View>

          <Switch
            value={autonomousMode}
            onValueChange={onToggleAutonomousMode}
            disabled={togglingAutonomousMode}
            trackColor={{ false: colors.gray[300], true: colors.warning[200] }}
            thumbColor={autonomousMode ? colors.warning[600] : colors.gray[50]}
            ios_backgroundColor={colors.gray[300]}
            accessibilityLabel={autonomousMode ? 'Desactivar modo autónomo' : 'Activar modo autónomo'}
            accessibilityHint={autonomousMode 
              ? 'Permite que tus cuidadores vean tu información' 
              : 'Oculta tu información de los cuidadores'}
          />
        </View>

        {/* Caregiver count info */}
        {caregivers.length > 0 && (
          <View style={styles.modeWarning}>
            <Ionicons name="information-circle" size={16} color={colors.gray[600]} />
            <Text style={styles.modeWarningText}>
              {autonomousMode
                ? `${caregivers.length} cuidador${caregivers.length > 1 ? 'es' : ''} conectado${caregivers.length > 1 ? 's' : ''} (sin acceso a datos nuevos)`
                : `${caregivers.length} cuidador${caregivers.length > 1 ? 'es' : ''} con acceso completo`}
            </Text>
          </View>
        )}
      </Card>

      {/* Connected Caregivers */}
      <Text style={styles.subsectionTitle} accessibilityRole="header">
        Cuidadores Conectados
      </Text>

      {caregiversLoading ? (
        <Card variant="elevated" padding="lg">
          <Text style={styles.loadingText}>Cargando cuidadores...</Text>
        </Card>
      ) : caregivers.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.emptyStateTitle}>
              No hay cuidadores conectados
            </Text>
            <Text style={styles.emptyStateText}>
              Genera un código de conexión para compartir con un cuidador
            </Text>
          </View>
        </Card>
      ) : (
        caregivers.map((caregiver) => (
          <CaregiverListItem
            key={caregiver.id}
            caregiver={caregiver}
            onRevoke={onRevokeCaregiver}
            disabled={togglingAutonomousMode}
          />
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  modeCard: {
    marginBottom: spacing.lg,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modeInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  modeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },
  modeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  modeWarningText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    flex: 1,
    lineHeight: 16,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});

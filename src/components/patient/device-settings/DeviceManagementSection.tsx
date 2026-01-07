import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

interface DeviceManagementSectionProps {
  deviceId: string;
  onUnlink: () => Promise<void>;
  unlinking: boolean;
}

export const DeviceManagementSection: React.FC<DeviceManagementSectionProps> = React.memo(({
  deviceId,
  onUnlink,
  unlinking,
}) => {
  const router = useRouter();

  const handleUnlink = () => {
    Alert.alert(
      'Desvincular Dispositivo',
      '¿Estás seguro de que deseas desvincular este dispositivo?\n\nDejarás de tener acceso a sus funciones y los cuidadores conectados perderán acceso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await onUnlink();
            } catch (err) {
              // Error handled by parent
            }
          }
        }
      ]
    );
  };

  const handleReconfigureWifi = () => {
    router.push('/patient/device-provisioning');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Gestión del Dispositivo
      </Text>
      <Text style={styles.sectionSubtitle}>
        Opciones avanzadas de configuración y mantenimiento
      </Text>

      <Card variant="elevated" padding="lg">
        {/* WiFi Reconfiguration */}
        <View style={styles.actionItem}>
          <View style={styles.actionInfo}>
            <View style={[styles.actionIcon, styles.wifiIcon]}>
              <Ionicons name="wifi-outline" size={20} color={colors.primary[600]} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Configurar WiFi</Text>
              <Text style={styles.actionDescription}>
                Cambia la red WiFi del dispositivo
              </Text>
            </View>
          </View>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleReconfigureWifi}
            disabled={unlinking}
            accessibilityLabel="Configurar WiFi del dispositivo"
            accessibilityHint="Abre el asistente para conectar el dispositivo a una nueva red WiFi"
          >
            Configurar
          </Button>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Unlink Device */}
        <View style={styles.actionItem}>
          <View style={styles.actionInfo}>
            <View style={[styles.actionIcon, styles.dangerIcon]}>
              <Ionicons name="unlink-outline" size={20} color={colors.error[600]} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Desvincular Dispositivo</Text>
              <Text style={styles.actionDescription}>
                Elimina la conexión con este dispositivo
              </Text>
            </View>
          </View>
          <Button
            variant="danger"
            size="sm"
            onPress={handleUnlink}
            loading={unlinking}
            disabled={unlinking}
            accessibilityLabel="Desvincular dispositivo"
            accessibilityHint="Elimina la conexión entre tu cuenta y este dispositivo"
          >
            Desvincular
          </Button>
        </View>
      </Card>

      {/* Warning Card */}
      <Card variant="outlined" padding="md" style={styles.warningCard}>
        <View style={styles.warningContent}>
          <Ionicons name="warning-outline" size={20} color={colors.warning[600]} />
          <Text style={styles.warningText}>
            Al desvincular el dispositivo, perderás acceso a todas sus funciones y los cuidadores conectados ya no podrán ver tu información.
          </Text>
        </View>
      </Card>
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  wifiIcon: {
    backgroundColor: colors.primary[100],
  },
  dangerIcon: {
    backgroundColor: colors.error[100],
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.md,
  },
  warningCard: {
    marginTop: spacing.md,
    backgroundColor: colors.warning[50],
    borderColor: colors.warning[200],
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning[600],
    lineHeight: 20,
  },
});

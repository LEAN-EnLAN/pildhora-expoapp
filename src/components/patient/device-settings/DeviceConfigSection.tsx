import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Collapsible } from '../../ui/Collapsible';
import { DeviceConfigPanel } from '../../shared/DeviceConfigPanel';
import { colors, spacing, typography } from '../../../theme/tokens';
import type { DeviceConfigInput } from '../../../hooks/useDeviceSettings';

interface DeviceConfigSectionProps {
  deviceId: string;
  config: DeviceConfigInput | null;
  onSave: (config: DeviceConfigInput) => Promise<void>;
  saving: boolean;
  onDispense?: () => Promise<void>;
  dispensing?: boolean;
}

export const DeviceConfigSection: React.FC<DeviceConfigSectionProps> = React.memo(({
  deviceId,
  config,
  onSave,
  saving,
  onDispense,
  dispensing = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleSave = useCallback(async (newConfig: DeviceConfigInput) => {
    try {
      await onSave(newConfig);
    } catch (err) {
      // Error handled by parent
    }
  }, [onSave]);

  const handleDispense = useCallback(async () => {
    if (!onDispense) return;

    Alert.alert(
      'Dispensar Medicamento',
      '¿Deseas enviar una señal de dispensación al dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Dispensar',
          onPress: async () => {
            try {
              await onDispense();
            } catch (err) {
              // Error handled by parent
            }
          }
        }
      ]
    );
  }, [onDispense]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Configuración del Dispositivo
      </Text>
      <Text style={styles.sectionSubtitle}>
        Ajusta las opciones de alarma y LED de tu dispositivo
      </Text>

      <Card variant="elevated" padding="lg">
        {/* Quick Actions */}
        {onDispense && (
          <View style={styles.quickActions}>
            <Button
              variant="primary"
              onPress={handleDispense}
              loading={dispensing}
              disabled={dispensing || saving}
              fullWidth
              accessibilityLabel="Dispensar medicamento"
              accessibilityHint="Envía una señal al dispositivo para dispensar medicamento"
            >
              <View style={styles.buttonContent}>
                <Ionicons name="medical-outline" size={20} color={colors.surface} />
                <Text style={styles.buttonText}>Dispensar Medicamento</Text>
              </View>
            </Button>
          </View>
        )}

        {/* Expand/Collapse Toggle */}
        <Button
          variant="ghost"
          onPress={() => setExpanded(!expanded)}
          style={styles.expandButton}
          accessibilityLabel={expanded ? 'Ocultar configuración avanzada' : 'Mostrar configuración avanzada'}
        >
          <View style={styles.expandContent}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.primary[500]}
            />
            <Text style={styles.expandText}>
              {expanded ? 'Ocultar configuración' : 'Configuración avanzada'}
            </Text>
          </View>
        </Button>

        {/* Collapsible Config Panel */}
        <Collapsible collapsed={!expanded}>
          <View style={styles.configContainer}>
            {config ? (
              <DeviceConfigPanel
                deviceId={deviceId}
                initialAlarmMode={config.alarmMode}
                initialLedIntensity={config.ledIntensity}
                initialLedColor={config.ledColor}
                onSave={handleSave}
                loading={saving}
              />
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando configuración...</Text>
              </View>
            )}
          </View>
        </Collapsible>
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
  quickActions: {
    marginBottom: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
  expandButton: {
    paddingVertical: spacing.sm,
  },
  expandContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  expandText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
  },
  configContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
});

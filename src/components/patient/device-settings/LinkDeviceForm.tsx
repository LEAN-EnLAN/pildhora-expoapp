import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

interface LinkDeviceFormProps {
  onLink: (deviceId: string) => Promise<void>;
  linking: boolean;
}

export const LinkDeviceForm: React.FC<LinkDeviceFormProps> = React.memo(({
  onLink,
  linking,
}) => {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLink = useCallback(async () => {
    const trimmedId = deviceId.trim();
    
    if (!trimmedId) {
      setError('Por favor, ingresa un ID de dispositivo');
      return;
    }

    if (trimmedId.length < 5) {
      setError('El ID debe tener al menos 5 caracteres');
      return;
    }

    setError(null);

    try {
      await onLink(trimmedId);
      setDeviceId('');
    } catch (err: any) {
      setError(err.userMessage || 'Error al vincular dispositivo');
    }
  }, [deviceId, onLink]);

  const handleGoToProvisioning = useCallback(() => {
    router.push('/patient/device-provisioning');
  }, [router]);

  return (
    <View style={styles.container}>
      <Card variant="elevated" padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="link-outline" size={48} color={colors.primary[600]} />
          </View>
          <Text style={styles.title}>Vincular Dispositivo</Text>
          <Text style={styles.subtitle}>
            Ingresa el ID único de tu dispositivo PildHora para comenzar a gestionar tus medicamentos.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>ID del dispositivo</Text>
          <Input
            value={deviceId}
            onChangeText={(text) => {
              setDeviceId(text);
              setError(null);
            }}
            placeholder="Ej: DEVICE-001"
            autoCapitalize="characters"
            error={error || undefined}
            accessibilityLabel="ID del dispositivo"
            accessibilityHint="Ingresa el ID que se encuentra en la parte posterior de tu dispositivo"
          />
          <Text style={styles.inputHint}>
            El ID se encuentra en la parte posterior de tu dispositivo
          </Text>
        </View>

        {/* Link Button */}
        <Button
          variant="primary"
          onPress={handleLink}
          loading={linking}
          disabled={linking || !deviceId.trim()}
          fullWidth
          accessibilityLabel="Vincular dispositivo"
          accessibilityHint="Vincula el dispositivo a tu cuenta para gestionarlo desde la app"
        >
          Vincular Dispositivo
        </Button>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Alternative Option */}
        <View style={styles.alternativeSection}>
          <Text style={styles.alternativeText}>
            ¿Dispositivo nuevo sin configurar?
          </Text>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleGoToProvisioning}
            disabled={linking}
            accessibilityLabel="Ir a configuración completa"
            accessibilityHint="Abre el asistente de configuración para dispositivos nuevos"
          >
            Configuración Completa
          </Button>
        </View>
      </Card>

      {/* Help Card */}
      <Card variant="outlined" padding="lg" style={styles.helpCard}>
        <View style={styles.helpHeader}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
        </View>
        <Text style={styles.helpText}>
          • Verifica que el ID esté escrito correctamente{'\n'}
          • El ID distingue entre mayúsculas y minúsculas{'\n'}
          • Si es un dispositivo nuevo, usa "Configuración Completa"{'\n'}
          • Contacta soporte si tienes problemas
        </Text>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  inputHint: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.xl,
  },
  alternativeSection: {
    alignItems: 'center',
  },
  alternativeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  helpCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.gray[50],
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  helpTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 22,
  },
});

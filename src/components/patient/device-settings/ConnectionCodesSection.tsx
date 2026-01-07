import React from 'react';
import { View, Text, StyleSheet, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { ConnectionCodeCard } from './ConnectionCodeCard';
import { colors, spacing, typography } from '../../../theme/tokens';
import type { ConnectionCodeData } from '../../../types';

interface ConnectionCodesSectionProps {
  codes: ConnectionCodeData[];
  loading: boolean;
  generatingCode: boolean;
  onGenerateCode: () => Promise<string>;
  onRevokeCode: (code: string) => void;
}

export const ConnectionCodesSection: React.FC<ConnectionCodesSectionProps> = React.memo(({
  codes,
  loading,
  generatingCode,
  onGenerateCode,
  onRevokeCode,
}) => {
  const handleGenerateCode = async () => {
    try {
      const code = await onGenerateCode();
      
      // Offer to share the code
      setTimeout(() => {
        Alert.alert(
          'Código Generado',
          `Tu código de conexión es: ${code}\n\n¿Deseas compartirlo?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Compartir', onPress: () => handleShareCode(code) }
          ]
        );
      }, 300);
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleShareCode = async (code: string) => {
    try {
      await Share.share({
        message: `Código de conexión para dispositivo de medicamentos: ${code}\n\nEste código expira en 24 horas.`,
        title: 'Código de Conexión',
      });
    } catch (err) {
      console.error('[ConnectionCodesSection] Error sharing code:', err);
    }
  };

  const handleRevokeCode = (code: string) => {
    Alert.alert(
      'Revocar Código',
      '¿Estás seguro de que deseas revocar este código? No podrá ser utilizado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Revocar', style: 'destructive', onPress: () => onRevokeCode(code) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Códigos de Conexión
          </Text>
          <Text style={styles.sectionSubtitle}>
            Códigos activos para conectar nuevos cuidadores
          </Text>
        </View>
      </View>

      {/* Generate Button */}
      <Button
        variant="primary"
        size="md"
        onPress={handleGenerateCode}
        loading={generatingCode}
        disabled={generatingCode}
        style={styles.generateButton}
        accessibilityLabel="Generar nuevo código de conexión"
        accessibilityHint="Genera un código temporal de 24 horas para compartir con un cuidador"
      >
        <View style={styles.buttonContent}>
          <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
          <Text style={styles.buttonText}>Generar Código</Text>
        </View>
      </Button>

      {/* Codes List */}
      {loading ? (
        <Card variant="elevated" padding="lg">
          <Text style={styles.loadingText}>Cargando códigos...</Text>
        </Card>
      ) : codes.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <View style={styles.emptyState}>
            <Ionicons name="key-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.emptyStateTitle}>
              No hay códigos activos
            </Text>
            <Text style={styles.emptyStateText}>
              Genera un código para compartir con un cuidador
            </Text>
          </View>
        </Card>
      ) : (
        codes.map((codeData) => (
          <ConnectionCodeCard
            key={codeData.code}
            codeData={codeData}
            onShare={handleShareCode}
            onRevoke={handleRevokeCode}
            disabled={generatingCode}
          />
        ))
      )}

      {/* Help Card */}
      <Card variant="outlined" padding="lg" style={styles.helpCard}>
        <View style={styles.helpHeader}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.helpTitle}>¿Cómo funciona?</Text>
        </View>
        <Text style={styles.helpText}>
          1. Genera un código de conexión{'\n'}
          2. Comparte el código con tu cuidador{'\n'}
          3. El cuidador ingresa el código en su app{'\n'}
          4. Una vez conectado, podrá ver y gestionar tus medicamentos
        </Text>
        <Text style={styles.helpNote}>
          Los códigos expiran en 24 horas y solo pueden usarse una vez.
        </Text>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
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
    lineHeight: 20,
  },
  generateButton: {
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
  },
  helpCard: {
    marginTop: spacing.md,
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
    marginBottom: spacing.sm,
  },
  helpNote: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

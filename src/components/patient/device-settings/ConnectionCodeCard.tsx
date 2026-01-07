import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';
import type { ConnectionCodeData } from '../../../types';

interface ConnectionCodeCardProps {
  codeData: ConnectionCodeData;
  onShare: (code: string) => void;
  onRevoke: (code: string) => void;
  disabled?: boolean;
}

export const ConnectionCodeCard: React.FC<ConnectionCodeCardProps> = React.memo(({
  codeData,
  onShare,
  onRevoke,
  disabled = false,
}) => {
  const formatExpirationTime = (): string => {
    const now = new Date();
    const expiresAt = codeData.expiresAt instanceof Date 
      ? codeData.expiresAt 
      : new Date(codeData.expiresAt);
    
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Expira en ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `Expira en ${minutes}m`;
    } else {
      return 'Expira pronto';
    }
  };

  const isExpired = (): boolean => {
    const expiresAt = codeData.expiresAt instanceof Date 
      ? codeData.expiresAt 
      : new Date(codeData.expiresAt);
    return expiresAt.getTime() <= Date.now();
  };

  const expired = isExpired();

  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      style={expired ? [styles.container, styles.expiredContainer] : styles.container}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, expired && styles.expiredIcon]}>
          <Ionicons 
            name={expired ? 'time-outline' : 'key'} 
            size={24} 
            color={expired ? colors.gray[500] : colors.success[600]} 
          />
        </View>
        
        <View style={styles.info}>
          <Text 
            style={[styles.code, expired && styles.expiredText]} 
            numberOfLines={1}
            accessibilityLabel={`Código de conexión: ${codeData.code}`}
          >
            {codeData.code}
          </Text>
          <Text style={[styles.expiration, expired && styles.expiredText]}>
            {formatExpirationTime()}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => onShare(codeData.code)}
          disabled={disabled || expired}
          style={styles.actionButton}
          accessibilityLabel="Compartir código"
          accessibilityHint="Comparte el código usando tus apps disponibles"
        >
          <View style={styles.buttonContent}>
            <Ionicons name="share-outline" size={16} color={colors.gray[700]} />
            <Text style={styles.buttonText}>Compartir</Text>
          </View>
        </Button>

        <Button
          variant="danger"
          size="sm"
          onPress={() => onRevoke(codeData.code)}
          disabled={disabled}
          style={styles.actionButton}
          accessibilityLabel="Revocar código"
          accessibilityHint="Inhabilita el código para que ya no pueda usarse"
        >
          <View style={styles.buttonContent}>
            <Ionicons name="trash-outline" size={16} color={colors.surface} />
            <Text style={styles.buttonTextDanger}>Revocar</Text>
          </View>
        </Button>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  expiredContainer: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  expiredIcon: {
    backgroundColor: colors.gray[100],
  },
  info: {
    flex: 1,
  },
  code: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  expiration: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  expiredText: {
    color: colors.gray[500],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  buttonTextDanger: {
    fontSize: typography.fontSize.sm,
    color: colors.surface,
    fontWeight: typography.fontWeight.medium,
  },
});

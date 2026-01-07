import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';
import type { LinkedCaregiver } from '../../../hooks/useDeviceSettings';

interface CaregiverListItemProps {
  caregiver: LinkedCaregiver;
  onRevoke: (id: string, name: string) => void;
  disabled?: boolean;
}

export const CaregiverListItem: React.FC<CaregiverListItemProps> = React.memo(({
  caregiver,
  onRevoke,
  disabled = false,
}) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card variant="elevated" padding="md" style={styles.container}>
      <View style={styles.row}>
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.primary[600]} />
          </View>
          
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {caregiver.name}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {caregiver.email}
            </Text>
            <Text style={styles.date}>
              Conectado: {formatDate(caregiver.linkedAt)}
            </Text>
          </View>
        </View>

        <Button
          variant="danger"
          size="sm"
          onPress={() => onRevoke(caregiver.id, caregiver.name)}
          disabled={disabled}
          accessibilityLabel={`Revocar acceso de ${caregiver.name}`}
          accessibilityHint="Elimina el acceso de este cuidador a tu información"
        >
          Revocar
        </Button>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  email: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: 2,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
});

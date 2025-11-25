import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import { Medication } from '../../../types';

interface MedicationCardProps {
  medication: Medication;
  onPress: () => void;
  showLowQuantityBadge?: boolean;
  currentQuantity?: number;
  index?: number;
}

const getAccentColor = (emoji?: string): string => {
  if (!emoji) return colors.primary[500];
  const colorMap: Record<string, string> = {
    '💊': '#3B82F6',
    '💉': '#8B5CF6',
    '🩹': '#F59E0B',
    '💧': '#06B6D4',
    '🧴': '#EC4899',
    '🩺': '#10B981',
    '🌡️': '#EF4444',
    '😷': '#6366F1',
  };
  return colorMap[emoji] || colors.primary[500];
};

export const MedicationCard: React.FC<MedicationCardProps> = React.memo(({
  medication,
  onPress,
  showLowQuantityBadge = false,
  currentQuantity,
}) => {
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const displayHour = hour % 12 || 12;
    const ampm = hour >= 12 ? 'pm' : 'am';
    return `${displayHour}:${minutes}${ampm}`;
  };

  const getDosageText = (): string => {
    if (medication.doseValue && medication.doseUnit) {
      return `${medication.doseValue} ${medication.doseUnit}`;
    }
    return medication.dosage || '';
  };

  const accentColor = getAccentColor(medication.emoji);
  const isOutOfStock = currentQuantity === 0;
  const timesCount = medication.times?.length || 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityLabel={`${medication.name}, ${getDosageText()}`}
      accessibilityHint="Toca para ver detalles"
      accessibilityRole="button"
    >
      {/* Indicador lateral de color */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
      
      <View style={styles.content}>
        {/* Fila principal */}
        <View style={styles.mainRow}>
          {/* Emoji */}
          <View style={[styles.emojiBox, { backgroundColor: accentColor + '12' }]}>
            {medication.emoji ? (
              <Text style={styles.emoji}>{medication.emoji}</Text>
            ) : (
              <Ionicons name="medical" size={22} color={accentColor} />
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{medication.name}</Text>
            <Text style={styles.dosage}>{getDosageText()}</Text>
          </View>

          {/* Badge de stock bajo o flecha */}
          {showLowQuantityBadge ? (
            <View style={[styles.badge, isOutOfStock ? styles.badgeError : styles.badgeWarning]}>
              <Text style={styles.badgeText}>{isOutOfStock ? 'Agotado' : 'Bajo'}</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
          )}
        </View>

        {/* Horarios - solo si hay */}
        {timesCount > 0 && (
          <View style={styles.timesRow}>
            <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.timesText}>
              {medication.times.slice(0, 3).map(formatTime).join(' · ')}
              {timesCount > 3 && ` +${timesCount - 3}`}
            </Text>
          </View>
        )}

        {/* Inventario - solo si está activo */}
        {medication.trackInventory && currentQuantity !== undefined && (
          <View style={styles.inventoryRow}>
            <View style={styles.inventoryBarBg}>
              <View
                style={[
                  styles.inventoryBarFill,
                  {
                    width: `${Math.min((currentQuantity / (medication.lowQuantityThreshold || 30)) * 100, 100)}%`,
                    backgroundColor: isOutOfStock ? colors.error[400] : showLowQuantityBadge ? colors.warning[400] : colors.success[400],
                  },
                ]}
              />
            </View>
            <Text style={styles.inventoryText}>{currentQuantity} restantes</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

MedicationCard.displayName = 'MedicationCard';


const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  accentLine: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 22,
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
  dosage: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeWarning: {
    backgroundColor: colors.warning[100],
  },
  badgeError: {
    backgroundColor: colors.error[100],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.xs,
  },
  timesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  inventoryBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  inventoryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  inventoryText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
});

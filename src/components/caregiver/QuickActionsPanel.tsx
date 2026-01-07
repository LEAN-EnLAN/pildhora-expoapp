/**
 * QuickActionsPanel Component
 * 
 * Dashboard quick actions panel providing one-tap access to common caregiver tasks.
 * Displays action cards in a responsive grid layout with smooth animations.
 * 
 * Features:
 * - Responsive grid layout (2x2 on mobile, 1x4 on tablets)
 * - Smooth press animations (scale, opacity)
 * - Icon colors matching design system
 * - Proper accessibility labels and touch targets
 * - Navigation handlers for each action
 * 
 * @example
 * <QuickActionsPanel
 *   onNavigate={(screen) => router.push(`/caregiver/${screen}`)}
 * />
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';

/**
 * Available caregiver screens for navigation
 */
export type CaregiverScreen = 'events' | 'medications' | 'tasks' | 'add-device';

export interface QuickActionsPanelProps {
  /** Callback when an action card is pressed */
  onNavigate: (screen: CaregiverScreen) => void;
}

/**
 * Quick action card configuration
 */
interface QuickAction {
  id: CaregiverScreen;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  accessibilityLabel: string;
  accessibilityHint: string;
}

/**
 * Quick actions configuration
 */
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'events',
    title: 'Eventos',
    icon: 'notifications-outline',
    color: typeof colors.primary === 'string' ? colors.primary : colors.primary[500],
    accessibilityLabel: 'Events Registry',
    accessibilityHint: 'Opens the events registry to view all medication events',
  },
  {
    id: 'medications',
    title: 'Medicamentos',
    icon: 'medkit-outline',
    color: typeof colors.success === 'string' ? colors.success : colors.success[500],
    accessibilityLabel: 'Medications Management',
    accessibilityHint: 'Opens medications management to add, edit, or delete medications',
  },
  {
    id: 'tasks',
    title: 'Tareas',
    icon: 'checkbox-outline',
    color: typeof colors.warning === 'string' ? colors.warning : colors.warning[500],
    accessibilityLabel: 'Tasks',
    accessibilityHint: 'Opens tasks screen to manage caregiver to-dos',
  },
  {
    id: 'add-device',
    title: 'Dispositivo',
    icon: 'hardware-chip-outline',
    color: typeof colors.info === 'string' ? colors.info : colors.info[500],
    accessibilityLabel: 'Device Management',
    accessibilityHint: 'Opens device management to link or configure devices',
  },
];

/**
 * Individual quick action card with press animations
 * Memoized to prevent unnecessary re-renders
 */
const QuickActionCard: React.FC<{
  action: QuickAction;
  onPress: () => void;
  isTablet: boolean;
}> = React.memo(({ action, onPress, isTablet }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  /**
   * Handles press in animation
   * Scales down to 0.95 and reduces opacity for tactile feedback
   */
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Handles press out animation
   * Returns to original scale and full opacity with spring animation
   */
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        isTablet && styles.cardWrapperTablet,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={action.accessibilityLabel}
        accessibilityHint={action.accessibilityHint}
        accessible={true}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
          <Ionicons name={action.icon} size={32} color={action.color} />
        </View>
        <Text style={styles.cardTitle}>{action.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

/**
 * QuickActionsPanel Component
 */
export default function QuickActionsPanel({ onNavigate }: QuickActionsPanelProps) {
  const { width } = useWindowDimensions();
  
  // Determine if device is tablet (width > 768px)
  const isTablet = width > 768;

  /**
   * Handles action card press
   * Memoized to prevent unnecessary re-renders of child components
   */
  const handleActionPress = useCallback((screen: CaregiverScreen) => {
    onNavigate(screen);
  }, [onNavigate]);

  return (
    <View
      style={styles.container}
      accessibilityRole="menu"
      accessibilityLabel="Quick actions panel"
    >
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      
      <View style={[styles.grid, isTablet && styles.gridTablet]}>
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.id}
            action={action}
            onPress={() => handleActionPress(action.id)}
            isTablet={isTablet}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[500],
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  gridTablet: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  cardWrapper: {
    width: '48%',
    aspectRatio: 1.1,
  },
  cardWrapperTablet: {
    width: '23%',
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
    minHeight: 100,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    textAlign: 'center',
  },
});

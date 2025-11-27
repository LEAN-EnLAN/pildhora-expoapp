import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initialExpanded?: boolean;
  rightContent?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'compact';
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  initialExpanded = true,
  rightContent,
  icon,
  variant = 'default',
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const rotateAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[
      styles.container, 
      variant === 'compact' && styles.containerCompact
    ]}>
      <TouchableOpacity
        style={[styles.header, variant === 'compact' && styles.headerCompact]}
        onPress={toggleExpand}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Colapsar' : 'Expandir'} sección ${title}`}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={variant === 'compact' ? 18 : 20} 
              color={colors.primary[600]} 
              style={styles.icon}
            />
          )}
          <Text style={[styles.title, variant === 'compact' && styles.titleCompact]}>
            {title}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {rightContent}
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.gray[500]}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  containerCompact: {
    marginBottom: spacing.sm,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  titleCompact: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});

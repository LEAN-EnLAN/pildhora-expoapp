import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Animated, StyleProp } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style,
  variant = 'default',
  padding = 'md',
  onPress,
  header,
  footer,
  accessibilityLabel,
  accessibilityHint
}) => {
  // Animation values for press feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const cardStyle = [
    styles.card,
    styles[variant],
    styles[`padding_${padding}`],
    style
  ];

  const content = (
    <>
      {header && <View style={styles.header}>{header}</View>}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </>
  );
  
  /**
   * Handle press in animation
   * Scales down to 0.98 and reduces opacity for tactile feedback
   */
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Handle press out animation
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
  
  if (onPress) {
    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <TouchableOpacity 
          style={cardStyle} 
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || 'Card'}
          accessibilityHint={accessibilityHint}
          accessible={true}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View 
      style={cardStyle}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  default: {
    ...shadows.sm,
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.sm,
  },
  padding_md: {
    padding: spacing.md,
  },
  padding_lg: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  content: {
    // Content wrapper for potential future styling
  },
  footer: {
    marginTop: spacing.md,
  },
});

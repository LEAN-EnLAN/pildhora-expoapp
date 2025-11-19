import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  color?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  onRemove,
  variant = 'default',
  color = 'primary',
  size = 'md',
  leftIcon,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getColorScheme = () => {
    const schemes = {
      primary: {
        bg: colors.primary[500],
        bgLight: colors.primary[50],
        border: colors.primary[500],
        text: colors.primary[500],
        textInverse: '#FFFFFF',
      },
      secondary: {
        bg: colors.gray[500],
        bgLight: colors.gray[100],
        border: colors.gray[500],
        text: colors.gray[700],
        textInverse: '#FFFFFF',
      },
      success: {
        bg: colors.success[500],
        bgLight: colors.success[50],
        border: colors.success[500],
        text: colors.success[500],
        textInverse: '#FFFFFF',
      },
      error: {
        bg: colors.error[500],
        bgLight: colors.error[50],
        border: colors.error[500],
        text: colors.error[500],
        textInverse: '#FFFFFF',
      },
    };
    return schemes[color];
  };

  const colorScheme = getColorScheme();

  const getBackgroundColor = () => {
    if (variant === 'filled' || selected) {
      return colorScheme.bg;
    }
    if (variant === 'outlined') {
      return 'transparent';
    }
    return colorScheme.bgLight;
  };

  const getTextColor = () => {
    if (variant === 'filled' || selected) {
      return colorScheme.textInverse;
    }
    return colorScheme.text;
  };

  const chipStyle = [
    styles.chip,
    styles[`size_${size}`],
    {
      backgroundColor: getBackgroundColor(),
    },
    variant === 'outlined' && {
      borderWidth: 1.5,
      borderColor: colorScheme.border,
    },
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`textSize_${size}`],
    {
      color: getTextColor(),
    },
  ];

  const content = (
    <>
      {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
      <Text style={textStyle} numberOfLines={1}>
        {label}
      </Text>
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          disabled={disabled}
          accessibilityLabel={`Remove ${label}`}
          accessibilityHint={`Removes ${label} from selection`}
          accessibilityRole="button"
          accessible={true}
        >
          <Text style={[styles.removeIcon, { color: getTextColor() }]}>✕</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={chipStyle}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || (selected ? `${label} is selected` : `Select ${label}`)}
          accessibilityState={{ selected, disabled }}
          accessible={true}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View 
      style={chipStyle}
      accessible={true}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="text"
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    minHeight: 24,
  },
  size_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: typography.fontWeight.medium,
  },
  textSize_sm: {
    fontSize: typography.fontSize.xs,
  },
  textSize_md: {
    fontSize: typography.fontSize.sm,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  removeButton: {
    marginLeft: spacing.xs,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
});

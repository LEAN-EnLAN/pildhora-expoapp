import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Platform } from 'react-native';
import { COLORS } from '@/utils/constants';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'text' | 'icon';
type ButtonSize = 'small' | 'medium' | 'large';

interface NativeButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export const NativeButton: React.FC<NativeButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  const primaryColor = COLORS.primary;
  const textColor = COLORS.text;
  const backgroundColor = COLORS.background;
  const borderColor = COLORS.textSecondary;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Platform.OS === 'ios' ? 8 : 4,
      overflow: 'hidden',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 32,
      },
      medium: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: primaryColor,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: primaryColor,
      },
      destructive: {
        backgroundColor: '#FF3B30',
      },
      text: {
        backgroundColor: 'transparent',
        paddingHorizontal: 8,
        paddingVertical: 4,
      },
      icon: {
        backgroundColor: 'transparent',
        paddingHorizontal: 8,
        paddingVertical: 8,
        width: size === 'small' ? 32 : size === 'medium' ? 44 : 52,
        height: size === 'small' ? 32 : size === 'medium' ? 44 : 52,
        borderRadius: size === 'small' ? 16 : size === 'medium' ? 22 : 26,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
      ...(Platform.OS === 'android' && variant !== 'text' && variant !== 'icon' && {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
      }),
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      small: {
        fontSize: 14,
      },
      medium: {
        fontSize: 16,
      },
      large: {
        fontSize: 18,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: primaryColor,
      },
      destructive: {
        color: '#FFFFFF',
      },
      text: {
        color: primaryColor,
      },
      icon: {
        display: 'none',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : primaryColor} />;
    }

    if (variant === 'icon' && icon) {
      return icon;
    }

    return (
      <>
        {icon && variant !== 'icon' && <>{icon}</>}
        {title && <Text style={getTextStyle()}>{title}</Text>}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default NativeButton;
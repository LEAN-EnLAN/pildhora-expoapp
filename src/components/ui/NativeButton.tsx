import React, { useState, ReactNode } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator,
  AccessibilityProps,
  StyleProp
} from 'react-native';

interface NativeButtonProps extends AccessibilityProps {
  title?: string;
  icon?: ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'text' | 'icon';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * NativeButton - Platform-appropriate button component following native design guidelines
 * 
 * Features:
 * - iOS: SF Pro font, system colors, appropriate touch targets
 * - Android: Material Design elevation, ripple effects, proper typography
 * - Minimum 48x48dp touch targets for accessibility
 * - Native-style press states and animations
 * - Proper accessibility attributes
 */
export const NativeButton: React.FC<NativeButtonProps> = ({
  title,
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessible = true,
  accessibilityRole = 'button',
  accessibilityLabel = title,
  accessibilityHint,
  ...rest
}) => {
  const [pressed, setPressed] = useState(false);

  // Platform-specific styling
  const getVariantStyles = (): ViewStyle => {
    if (Platform.OS === 'ios') {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: disabled ? '#C7C7CC' : '#007AFF',
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 44, // iOS minimum touch target
            minWidth: icon ? 44 : 88,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'secondary':
          return {
            backgroundColor: disabled ? '#F2F2F7' : 'white',
            borderWidth: icon ? 0 : 1,
            borderColor: disabled ? '#C7C7CC' : '#007AFF',
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 44,
            minWidth: icon ? 44 : 88,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'destructive':
          return {
            backgroundColor: disabled ? '#C7C7CC' : '#FF3B30',
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 44,
            minWidth: icon ? 44 : 88,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'text':
          return {
            backgroundColor: 'transparent',
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 44,
            minWidth: icon ? 44 : 88,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'icon':
          return {
            backgroundColor: disabled ? '#F2F2F7' : 'transparent',
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
          };
      }
    } else {
      // Android Material Design
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: disabled ? '#E0E0E0' : '#1976D2',
            elevation: disabled ? 0 : pressed ? 4 : 2,
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 48, // Android minimum touch target
            minWidth: icon ? 48 : 96,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'secondary':
          return {
            backgroundColor: 'transparent',
            borderWidth: icon ? 0 : 1,
            borderColor: disabled ? '#E0E0E0' : '#1976D2',
            elevation: 0,
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 48,
            minWidth: icon ? 48 : 96,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'destructive':
          return {
            backgroundColor: disabled ? '#E0E0E0' : '#D32F2F',
            elevation: disabled ? 0 : pressed ? 4 : 2,
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 48,
            minWidth: icon ? 48 : 96,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'text':
          return {
            backgroundColor: 'transparent',
            elevation: 0,
            paddingHorizontal: icon ? 12 : 16,
            minHeight: 48,
            minWidth: icon ? 48 : 96,
            justifyContent: 'center',
            alignItems: 'center',
          };
        case 'icon':
          return {
            backgroundColor: disabled ? '#F5F5F5' : 'transparent',
            width: 48,
            height: 48,
            borderRadius: 24,
            elevation: 0,
            justifyContent: 'center',
            alignItems: 'center',
          };
      }
    }
    // Fallback
    return {} as ViewStyle;
  };

  const getTextStyles = (): TextStyle => {
    const baseSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
    
    if (Platform.OS === 'ios') {
      return {
        fontSize: baseSize,
        fontFamily: 'System',
        fontWeight: 600,
        color: variant === 'secondary' && !disabled ? '#007AFF' : 
               variant === 'text' && !disabled ? '#007AFF' : 
               variant === 'destructive' && !disabled ? 'white' : 
               'white',
        textAlign: 'center',
      };
    } else {
      return {
        fontSize: baseSize,
        fontFamily: 'Roboto-Medium',
        fontWeight: 500,
        color: variant === 'secondary' && !disabled ? '#1976D2' : 
               variant === 'text' && !disabled ? '#1976D2' : 
               variant === 'destructive' && !disabled ? 'white' : 
               'white',
        textAlign: 'center',
        letterSpacing: variant === 'text' ? 0 : 0.5,
        textTransform: variant === 'text' ? 'none' : 'uppercase',
      };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    if (variant === 'icon') {
      return {} as ViewStyle; // Icon variant handles sizing in getVariantStyles
    }
    
    switch (size) {
      case 'small':
        return {
          paddingVertical: Platform.OS === 'ios' ? 6 : 8,
          minWidth: Platform.OS === 'ios' ? 60 : 64,
        };
      case 'large':
        return {
          paddingVertical: Platform.OS === 'ios' ? 14 : 16,
          minWidth: Platform.OS === 'ios' ? 120 : 128,
        };
      default: // medium
        return {
          paddingVertical: Platform.OS === 'ios' ? 10 : 12,
          minWidth: Platform.OS === 'ios' ? 88 : 96,
        };
    }
  };

  const buttonStyles: StyleProp<ViewStyle> = [
    styles.button,
    getVariantStyles(),
    getSizeStyles(),
    pressed && !disabled && styles.pressed,
    style,
  ];

  // Icon variant doesn't show text
  const showText = title && variant !== 'icon';

  const textStyles: StyleProp<TextStyle> = [
    getTextStyles(),
    textStyle,
    loading && styles.loadingText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'secondary' || variant === 'text' ? '#007AFF' : 'white'}
        />
      ) : (
        <>
          {icon && icon}
          {showText && (
            <Text style={textStyles} numberOfLines={1}>
              {title}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  loadingText: {
    opacity: 0,
  },
});

export default NativeButton;

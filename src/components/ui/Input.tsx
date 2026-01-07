import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TextInputProps, 
  Animated,
  ViewStyle 
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  required = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(borderColorAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error[500] : colors.gray[300], colors.primary[500]],
  });

  const inputContainerStyle = [
    styles.inputContainer,
    styles[variant],
    styles[`size_${size}`],
    error && styles.inputContainerError,
    isFocused && styles.inputContainerFocused,
  ];

  const inputStyle = [
    styles.input,
    styles[`inputSize_${size}`],
    leftIcon ? styles.inputWithLeftIcon : null,
    rightIcon ? styles.inputWithRightIcon : null,
    style,
  ].filter(Boolean);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <Animated.View 
        style={[
          inputContainerStyle,
          variant === 'outlined' && { borderColor }
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={inputStyle}
          placeholderTextColor={colors.gray[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={`${label || textInputProps.placeholder || 'Text input'}${required ? ', required' : ''}${error ? ', invalid' : ''}`}
          accessibilityHint={error ? `Error: ${error}` : helperText}
          accessible={true}
          {...textInputProps}
        />
        
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </Animated.View>

      {(error || helperText) && (
        <View 
          style={styles.messageContainer}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion={error ? "assertive" : "polite"}
        >
          {error ? (
            <Text style={styles.errorText} accessibilityLabel={`Error: ${error}`}>
              {error}
            </Text>
          ) : (
            <Text style={styles.helperText}>{helperText}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
  },
  required: {
    color: colors.error[500],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  filled: {
    backgroundColor: colors.gray[100],
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.gray[300],
  },
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 36,
  },
  size_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  size_lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  inputContainerFocused: {
    // Focus styles handled by animation
  },
  inputContainerError: {
    borderColor: colors.error[500],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    padding: 0, // Remove default padding
  },
  inputSize_sm: {
    fontSize: typography.fontSize.sm,
  },
  inputSize_md: {
    fontSize: typography.fontSize.base,
  },
  inputSize_lg: {
    fontSize: typography.fontSize.lg,
  },
  inputWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: spacing.sm,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  messageContainer: {
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
});

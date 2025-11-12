import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  style
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`]
  ];
  
  const content = typeof children === 'string'
    ? <Text style={textStyle}>{children}</Text>
    : children;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={buttonStyle}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#E5E7EB',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#1F2937',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smText: {
    fontSize: 16,
  },
  mdText: {
    fontSize: 18,
  },
  lgText: {
    fontSize: 20,
  },
});

import React from 'react';
import { TouchableOpacity, Text, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = "" 
}) => {
  const baseClasses = "rounded-xl justify-center items-center";
  const variantClasses = {
    primary: "bg-blue-500",
    secondary: "bg-gray-200",
    danger: "bg-red-500"
  };
  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-5 py-4"
  };
  const textClasses = {
    primary: "text-white",
    secondary: "text-gray-800",
    danger: "text-white"
  };
  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl"
  };
  
  const content = typeof children === 'string'
    ? <Text className={`${textClasses[variant]} ${textSizeClasses[size]} font-semibold`}>{children}</Text>
    : children;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {content}
    </TouchableOpacity>
  );
};
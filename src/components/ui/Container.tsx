import React from 'react';
import { View, ViewStyle } from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  className = "", 
  padding = 'md' 
}) => {
  const paddingClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  return (
    <View className={`bg-gray-100 ${paddingClasses[padding]} ${className}`}>
      {children}
    </View>
  );
};
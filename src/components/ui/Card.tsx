import React from 'react';
import { View, TouchableOpacity, Text, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = "", 
  shadow = true, 
  border = false
}) => {
  const cardClasses = `bg-white rounded-2xl p-6 ${shadow ? 'shadow-md' : ''} ${border ? 'border border-gray-200' : ''} ${className}`;
  
  return (
    <View className={cardClasses}>
      {children}
    </View>
  );
};
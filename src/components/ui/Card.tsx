import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: boolean;
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style,
  shadow = true, 
  border = false
}) => {
  const cardStyle = [
    styles.card,
    shadow && styles.shadow,
    border && styles.border,
    style
  ];
  
  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  border: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});

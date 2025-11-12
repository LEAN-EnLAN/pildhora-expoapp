import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  style,
  padding = 'md' 
}) => {
  const containerStyle = [
    styles.container,
    styles[padding],
    style
  ];
  
  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  sm: {
    padding: 8,
  },
  md: {
    padding: 16,
  },
  lg: {
    padding: 24,
  },
  xl: {
    padding: 32,
  },
});

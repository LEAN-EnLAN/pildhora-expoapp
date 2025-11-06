import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  width = '100%', 
  height = 20, 
  style 
}) => {
  return (
    <View 
      style={[
        styles.skeleton, 
        { width, height },
        style
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E1E1',
    borderRadius: 4,
    opacity: 0.7,
  },
});

export default SkeletonLoader;
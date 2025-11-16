import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../../ui/Card';
import { SkeletonLoader } from '../../ui/SkeletonLoader';
import { spacing, borderRadius } from '../../../theme/tokens';

/**
 * DeviceConnectivityCardSkeleton
 * 
 * Skeleton loader for DeviceConnectivityCard component
 * Displays during initial data load for better perceived performance
 */
export const DeviceConnectivityCardSkeleton: React.FC = () => {
  return (
    <Card variant="elevated" padding="lg">
      {/* Title */}
      <SkeletonLoader 
        width="60%" 
        height={20} 
        style={{ marginBottom: spacing.lg }} 
      />
      
      {/* Device ID */}
      <SkeletonLoader 
        width="40%" 
        height={14} 
        style={{ marginBottom: spacing.md }} 
      />
      
      {/* Status and Battery Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <SkeletonLoader 
            width="50%" 
            height={14} 
            style={{ marginBottom: spacing.xs }} 
          />
          <View style={styles.valueContainer}>
            <SkeletonLoader 
              width={10} 
              height={10} 
              borderRadius={5} 
            />
            <SkeletonLoader 
              width={60} 
              height={18} 
              style={{ marginLeft: spacing.sm }} 
            />
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <SkeletonLoader 
            width="50%" 
            height={14} 
            style={{ marginBottom: spacing.xs }} 
          />
          <View style={styles.valueContainer}>
            <SkeletonLoader 
              width={10} 
              height={10} 
              borderRadius={5} 
            />
            <SkeletonLoader 
              width={50} 
              height={18} 
              style={{ marginLeft: spacing.sm }} 
            />
          </View>
        </View>
      </View>
      
      {/* Manage Device Button */}
      <SkeletonLoader 
        width="100%" 
        height={36} 
        borderRadius={borderRadius.xl}
        style={{ marginTop: spacing.md }} 
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  infoItem: {
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SkeletonLoader } from '../../ui/SkeletonLoader';
import { spacing, borderRadius } from '../../../theme/tokens';

/**
 * QuickActionsPanelSkeleton
 * 
 * Skeleton loader for QuickActionsPanel component
 * Displays during initial data load for better perceived performance
 * Adapts to tablet/mobile layouts
 */
export const QuickActionsPanelSkeleton: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <View style={styles.container}>
      {/* Section title skeleton */}
      <SkeletonLoader 
        width="40%" 
        height={24} 
        style={{ marginBottom: spacing.lg, marginLeft: spacing.lg }} 
      />
      
      {/* Quick actions grid */}
      <View style={[styles.grid, isTablet && styles.gridTablet]}>
        {[1, 2, 3, 4].map((index) => (
          <View 
            key={index} 
            style={[
              styles.cardWrapper,
              isTablet && styles.cardWrapperTablet,
            ]}
          >
            <View style={styles.card}>
              {/* Icon circle */}
              <SkeletonLoader 
                width={64} 
                height={64} 
                borderRadius={borderRadius.full}
                style={{ marginBottom: spacing.md }}
              />
              
              {/* Title */}
              <SkeletonLoader 
                width="70%" 
                height={16} 
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  gridTablet: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  cardWrapper: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: spacing.sm,
  },
  cardWrapperTablet: {
    width: '23%',
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});

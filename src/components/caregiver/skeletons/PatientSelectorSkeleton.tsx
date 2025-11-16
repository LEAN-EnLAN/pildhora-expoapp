import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '../../ui/SkeletonLoader';
import { spacing, borderRadius, colors } from '../../../theme/tokens';

/**
 * PatientSelectorSkeleton
 * 
 * Skeleton loader for PatientSelector component
 * Displays during initial data load for better perceived performance
 */
export const PatientSelectorSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Label */}
      <SkeletonLoader 
        width={80} 
        height={14} 
        style={{ marginBottom: spacing.sm, marginLeft: spacing.lg }} 
      />
      
      {/* Patient chips */}
      <View style={styles.scrollContent}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.chip}>
            {/* Patient name */}
            <SkeletonLoader 
              width="70%" 
              height={16} 
              style={{ marginBottom: spacing.xs }} 
            />
            
            {/* Status row */}
            <View style={styles.statusRow}>
              <SkeletonLoader 
                width={8} 
                height={8} 
                borderRadius={borderRadius.full} 
              />
              <SkeletonLoader 
                width={80} 
                height={12} 
                style={{ marginLeft: spacing.xs }} 
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
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  chip: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 160,
    maxWidth: 200,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

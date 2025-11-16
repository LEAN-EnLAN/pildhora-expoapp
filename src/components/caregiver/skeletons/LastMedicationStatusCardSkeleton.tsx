import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../../ui/Card';
import { SkeletonLoader } from '../../ui/SkeletonLoader';
import { spacing, borderRadius } from '../../../theme/tokens';

/**
 * LastMedicationStatusCardSkeleton
 * 
 * Skeleton loader for LastMedicationStatusCard component
 * Displays during initial data load for better perceived performance
 */
export const LastMedicationStatusCardSkeleton: React.FC = () => {
  return (
    <Card variant="outlined" padding="md">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <SkeletonLoader 
            width={20} 
            height={20} 
            borderRadius={10} 
          />
          <SkeletonLoader 
            width={120} 
            height={20} 
            style={{ marginLeft: spacing.sm }} 
          />
        </View>

        {/* Event content */}
        <View style={styles.content}>
          {/* Event type badge */}
          <SkeletonLoader 
            width="40%" 
            height={32} 
            borderRadius={borderRadius.full} 
          />

          {/* Medication name */}
          <View style={styles.medicationRow}>
            <SkeletonLoader 
              width={18} 
              height={18} 
              borderRadius={9} 
            />
            <SkeletonLoader 
              width="70%" 
              height={18} 
              style={{ marginLeft: spacing.sm }} 
            />
          </View>

          {/* Patient name */}
          <View style={styles.patientRow}>
            <SkeletonLoader 
              width={16} 
              height={16} 
              borderRadius={8} 
            />
            <SkeletonLoader 
              width="50%" 
              height={16} 
              style={{ marginLeft: spacing.sm }} 
            />
          </View>

          {/* Timestamp */}
          <View style={styles.timestampRow}>
            <SkeletonLoader 
              width={16} 
              height={16} 
              borderRadius={8} 
            />
            <SkeletonLoader 
              width="40%" 
              height={14} 
              style={{ marginLeft: spacing.sm }} 
            />
          </View>
        </View>

        {/* View All button */}
        <View style={styles.footer}>
          <SkeletonLoader 
            width="60%" 
            height={36} 
            borderRadius={borderRadius.xl} 
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    gap: spacing.md,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    marginTop: spacing.sm,
  },
});

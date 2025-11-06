import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type DataSource = 'static' | 'cache' | 'firestore';

interface DataSourceBadgeProps {
  source: DataSource;
}

const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ source }) => {
  const getBadgeStyle = (source: DataSource) => {
    switch (source) {
      case 'static':
        return styles.staticBadge;
      case 'cache':
        return styles.cacheBadge;
      case 'firestore':
        return styles.liveBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getBadgeText = (source: DataSource) => {
    switch (source) {
      case 'static':
        return 'STATIC';
      case 'cache':
        return 'CACHE';
      case 'firestore':
        return 'LIVE';
      default:
        return 'UNKNOWN';
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle(source)]}>
      <Text style={styles.badgeText}>{getBadgeText(source)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  staticBadge: {
    backgroundColor: '#8E8E93', // Gray
  },
  cacheBadge: {
    backgroundColor: '#007AFF', // Blue
  },
  liveBadge: {
    backgroundColor: '#34C759', // Green
  },
  defaultBadge: {
    backgroundColor: '#FF9500', // Orange
  },
});

export default DataSourceBadge;
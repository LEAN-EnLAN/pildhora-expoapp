/**
 * OfflineIndicator Component
 * 
 * Displays a banner when the app is offline
 * Shows sync status when coming back online
 */

import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/tokens';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { offlineQueueManager } from '../../services/offlineQueueManager';
import { OfflineIndicatorProps } from '../../types';

/**
 * OfflineIndicator component
 * 
 * Displays network status and sync progress
 * Automatically detects network changes and shows appropriate banners
 */
export function OfflineIndicator({ isOnline: isOnlineOverride }: OfflineIndicatorProps) {
  const networkStatus = useNetworkStatus();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Use override if provided, otherwise use network status
  const isOnline = isOnlineOverride !== undefined ? isOnlineOverride : networkStatus.isOnline;
  const queueStatus = networkStatus.queueStatus;

  // Subscribe to sync completion
  useEffect(() => {
    const unsubscribe = offlineQueueManager.onSyncComplete((success) => {
      if (success) {
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      }
    });

    return unsubscribe;
  }, []);

  // Animate banner in/out
  useEffect(() => {
    const shouldShow = !isOnline || queueStatus.pending > 0 || queueStatus.processing > 0 || showSyncSuccess;
    
    if (shouldShow) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, queueStatus.pending, queueStatus.processing, showSyncSuccess, slideAnim]);

  // Determine banner content
  let bannerContent;
  let bannerStyle;

  if (showSyncSuccess) {
    bannerContent = {
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      text: 'Cambios sincronizados',
      color: colors.success,
    };
    bannerStyle = styles.successBanner;
  } else if (!isOnline) {
    bannerContent = {
      icon: 'cloud-offline' as keyof typeof Ionicons.glyphMap,
      text: 'Sin conexión - Los cambios se guardarán localmente',
      color: '#B45309', // Darker orange for better contrast (5.2:1)
    };
    bannerStyle = styles.offlineBanner;
  } else if (queueStatus.processing > 0) {
    bannerContent = {
      icon: 'sync' as keyof typeof Ionicons.glyphMap,
      text: `Sincronizando ${queueStatus.processing} cambio${queueStatus.processing > 1 ? 's' : ''}...`,
      color: colors.primary[500],
    };
    bannerStyle = styles.syncingBanner;
  } else if (queueStatus.pending > 0) {
    bannerContent = {
      icon: 'cloud-upload' as keyof typeof Ionicons.glyphMap,
      text: `${queueStatus.pending} cambio${queueStatus.pending > 1 ? 's' : ''} pendiente${queueStatus.pending > 1 ? 's' : ''}`,
      color: colors.primary[500],
    };
    bannerStyle = styles.syncingBanner;
  } else {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        bannerStyle,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name={bannerContent.icon} size={20} color={bannerContent.color} />
      <Text style={[styles.text, { color: bannerContent.color }]}>
        {bannerContent.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  offlineBanner: {
    backgroundColor: colors.warning[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.warning[200],
  },
  syncingBanner: {
    backgroundColor: colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  successBanner: {
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

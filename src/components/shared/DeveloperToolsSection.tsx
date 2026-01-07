import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DeveloperToolsSectionProps {
  children: React.ReactNode;
  /** Number of taps required to reveal the section (default: 5) */
  tapCountToReveal?: number;
  /** Time window in ms for tap sequence (default: 3000) */
  tapTimeWindow?: number;
  /** Force visibility regardless of environment */
  forceVisible?: boolean;
}

/**
 * DeveloperToolsSection
 * 
 * A collapsible container for debug/test tools that:
 * - Is hidden by default in production
 * - Can be revealed via a hidden tap gesture (5 taps in 3 seconds)
 * - Shows a subtle indicator when collapsed
 * - Maintains full functionality of contained tools
 * 
 * Usage:
 * <DeveloperToolsSection>
 *   <TestTopoButton deviceId={deviceId} />
 *   <TestScheduleSyncButton deviceId={deviceId} />
 * </DeveloperToolsSection>
 */
export const DeveloperToolsSection = ({
  children,
  tapCountToReveal = 5,
  tapTimeWindow = 3000,
  forceVisible = false,
}: DeveloperToolsSectionProps) => {
  const isDevelopment = __DEV__ || forceVisible;
  
  // State
  const [isRevealed, setIsRevealed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isDevelopment);
  const [tapCount, setTapCount] = useState(0);
  
  // Refs
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rotateAnim = useRef(new Animated.Value(isDevelopment ? 1 : 0)).current;

  // Handle hidden tap gesture to reveal section
  const handleHiddenTap = useCallback(() => {
    if (isRevealed) return;

    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Clear existing timer
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    // Check if we've reached the required tap count
    if (newCount >= tapCountToReveal) {
      setIsRevealed(true);
      setIsExpanded(true);
      setTapCount(0);
      
      // Animate expansion
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      return;
    }

    // Reset tap count after time window
    tapTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, tapTimeWindow);
  }, [tapCount, tapCountToReveal, tapTimeWindow, isRevealed, rotateAnim]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
    
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnim]);

  // Hide section completely
  const hideSection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRevealed(false);
    setIsExpanded(false);
    setTapCount(0);
    rotateAnim.setValue(0);
  }, [rotateAnim]);

  // Rotation interpolation for chevron
  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // In production, show only the hidden tap area until revealed
  if (!isDevelopment && !isRevealed) {
    return (
      <TouchableOpacity
        onPress={handleHiddenTap}
        activeOpacity={1}
        style={styles.hiddenTapArea}
        accessibilityLabel="Developer tools area"
        accessibilityHint={`Tap ${tapCountToReveal} times quickly to reveal developer tools`}
      >
        {/* Subtle visual hint - only visible if user is looking for it */}
        {tapCount > 0 && (
          <View style={styles.tapProgressContainer}>
            {Array.from({ length: tapCountToReveal }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.tapProgressDot,
                  i < tapCount && styles.tapProgressDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        onPress={toggleExpanded}
        style={styles.header}
        activeOpacity={0.7}
        accessibilityLabel="Developer tools section"
        accessibilityHint={isExpanded ? 'Tap to collapse' : 'Tap to expand'}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="code-slash" size={14} color={colors.warning[600]} />
          </View>
          <Text style={styles.headerTitle}>Dev Tools</Text>
          {!isDevelopment && (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEBUG</Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {!isDevelopment && (
            <TouchableOpacity
              onPress={hideSection}
              style={styles.hideButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Hide developer tools"
            >
              <Ionicons name="close" size={16} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons name="chevron-up" size={20} color={colors.gray[500]} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
  },
  devBadge: {
    backgroundColor: colors.warning[500],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  devBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: 'white',
    letterSpacing: 0.5,
  },
  hideButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  hiddenTapArea: {
    height: 20,
    marginTop: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapProgressContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tapProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[300],
  },
  tapProgressDotActive: {
    backgroundColor: colors.warning[500],
  },
});

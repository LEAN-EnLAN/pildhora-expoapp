/**
 * AppIcon Component
 * 
 * Reusable component for displaying the Pildhora app icon throughout the application.
 * Supports multiple sizes and variants for different use cases.
 * 
 * @example
 * // Default size (medium)
 * <AppIcon />
 * 
 * // Large size for splash/loading screens
 * <AppIcon size="xl" />
 * 
 * // Small size for inline use
 * <AppIcon size="sm" />
 * 
 * // With custom style
 * <AppIcon size="lg" style={{ marginBottom: 20 }} />
 */

import React from 'react';
import { Image, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';
import { borderRadius, shadows } from '../../theme/tokens';

export interface AppIconProps {
  /** Size variant of the icon */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show shadow around the icon */
  showShadow?: boolean;
  /** Whether to show rounded corners */
  rounded?: boolean;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Custom style for the image */
  imageStyle?: ImageStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
  '2xl': 128,
};

export default function AppIcon({
  size = 'md',
  showShadow = false,
  rounded = true,
  style,
  imageStyle,
  accessibilityLabel = 'Pildhora app icon',
}: AppIconProps) {
  const iconSize = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: iconSize,
          height: iconSize,
        },
        rounded && {
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
        },
        showShadow && shadows.md,
        style,
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Image
        source={require('../../../assets/icon.png')}
        style={[
          {
            width: iconSize,
            height: iconSize,
          },
          imageStyle,
        ]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

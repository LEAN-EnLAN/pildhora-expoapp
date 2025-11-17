/**
 * ScreenWrapper Component
 * 
 * Wrapper component for caregiver screens that handles proper padding
 * for persistent header and bottom navigation.
 * 
 * This ensures content starts BELOW the fixed header and doesn't get hidden
 * behind the bottom tab bar. The header is positioned absolutely at the top,
 * so this component adds top padding equal to the header height to push
 * content down.
 * 
 * Usage:
 * ```tsx
 * <ScreenWrapper>
 *   <Container>
 *     <ScrollView>
 *       // Your content here
 *     </ScrollView>
 *   </Container>
 * </ScreenWrapper>
 * ```
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useLayoutDimensions } from '../../../app/caregiver/_layout';
import { colors } from '../../theme/tokens';

interface ScreenWrapperProps {
  children: ReactNode;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Whether to apply top padding (default: true) */
  applyTopPadding?: boolean;
  /** 
   * Whether to apply bottom padding (default: false)
   * Note: For screens with ScrollView, apply bottom padding to ScrollView's contentContainerStyle instead
   * Only set to true for screens without ScrollView
   */
  applyBottomPadding?: boolean;
}

export function ScreenWrapper({
  children,
  style,
  applyTopPadding = true,
  applyBottomPadding = false,
}: ScreenWrapperProps) {
  const { contentInsetTop, contentInsetBottom } = useLayoutDimensions();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: applyTopPadding ? contentInsetTop : 0,
          paddingBottom: applyBottomPadding ? contentInsetBottom : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

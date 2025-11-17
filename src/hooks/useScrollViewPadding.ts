/**
 * useScrollViewPadding Hook
 * 
 * Provides proper padding values for ScrollView/FlatList contentContainerStyle
 * to ensure content doesn't get hidden behind the bottom tab bar.
 * 
 * Usage:
 * ```tsx
 * const { contentPaddingBottom } = useScrollViewPadding();
 * 
 * <ScrollView contentContainerStyle={{ paddingBottom: contentPaddingBottom }}>
 *   // content
 * </ScrollView>
 * ```
 */

import { useLayoutDimensions } from '../../app/caregiver/_layout';
import { spacing } from '../theme/tokens';

export function useScrollViewPadding() {
  const { contentInsetBottom } = useLayoutDimensions();
  
  // Add extra spacing for visual comfort
  const contentPaddingBottom = contentInsetBottom + spacing.lg;
  
  return {
    contentPaddingBottom,
    tabBarHeight: contentInsetBottom,
  };
}

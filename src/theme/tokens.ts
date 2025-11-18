/**
 * Design System Tokens
 * 
 * Centralized design tokens for consistent styling across the application.
 * Includes color palette, spacing, typography, border radius, and shadow definitions.
 */

/**
 * Color Palette
 * Provides primary, semantic, neutral, and surface colors
 * Enhanced with gradient support and modern color scales
 */
export const colors = {
  // Primary palette - Modern blue with depth
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',  // Main primary - vibrant blue
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Semantic colors with depth
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',  // Main success
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    500: '#F59E0B',  // Main warning
    600: '#D97706',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',  // Main error
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EEF2FF',
    500: '#6366F1',  // Main info
    600: '#4F46E5',
  },
  
  // Neutral palette - Refined grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Surface colors with elevation
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#F8FAFC',
  
  // Gradient colors
  gradients: {
    primary: ['#3B82F6', '#2563EB'],
    success: ['#22C55E', '#16A34A'],
    sunset: ['#F59E0B', '#EF4444'],
    ocean: ['#3B82F6', '#6366F1'],
  },
};

/**
 * Spacing Scale
 * Consistent spacing values for margins, padding, and gaps
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

/**
 * Typography System
 * Font sizes, weights, and line heights
 */
export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * Border Radius Scale
 * Consistent border radius values for rounded corners
 */
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

/**
 * Shadow Definitions
 * Elevation shadows for cards and elevated surfaces
 * Enhanced with more depth and modern shadow styles
 */
export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
  // Colored shadows for special effects
  colored: {
    primary: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    success: {
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};

/**
 * Type Definitions
 */
export type ColorPalette = typeof colors;
export type SpacingScale = typeof spacing;
export type TypographySystem = typeof typography;
export type BorderRadiusScale = typeof borderRadius;
export type ShadowDefinitions = typeof shadows;

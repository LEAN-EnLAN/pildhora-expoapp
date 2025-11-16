/**
 * useVisualFeedback Hook
 * 
 * Provides reusable press animation logic for interactive components.
 * Returns animation values and handlers for consistent visual feedback.
 * 
 * @example
 * const { scaleAnim, opacityAnim, handlePressIn, handlePressOut } = useVisualFeedback();
 * 
 * <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
 *   <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
 *     <Text>Press me</Text>
 *   </TouchableOpacity>
 * </Animated.View>
 */

import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface VisualFeedbackConfig {
  /** Scale value when pressed (default: 0.95) */
  pressedScale?: number;
  /** Opacity value when pressed (default: 0.7) */
  pressedOpacity?: number;
  /** Animation duration in ms (default: 100) */
  duration?: number;
  /** Spring damping (default: 15) */
  damping?: number;
  /** Spring stiffness (default: 150) */
  stiffness?: number;
}

interface VisualFeedbackReturn {
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
  handlePressIn: () => void;
  handlePressOut: () => void;
}

export const useVisualFeedback = (config: VisualFeedbackConfig = {}): VisualFeedbackReturn => {
  const {
    pressedScale = 0.95,
    pressedOpacity = 0.7,
    duration = 100,
    damping = 15,
    stiffness = 150,
  } = config;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: pressedScale,
        useNativeDriver: true,
        damping,
        stiffness,
      }),
      Animated.timing(opacityAnim, {
        toValue: pressedOpacity,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, pressedScale, pressedOpacity, duration, damping, stiffness]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping,
        stiffness,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, duration, damping, stiffness]);

  return {
    scaleAnim,
    opacityAnim,
    handlePressIn,
    handlePressOut,
  };
};

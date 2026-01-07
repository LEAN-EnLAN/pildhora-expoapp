import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, LayoutChangeEvent, ViewStyle } from 'react-native';

interface CollapsibleProps {
  children: React.ReactNode;
  collapsed: boolean;
  style?: ViewStyle;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  collapsed,
  style,
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only animate after we've measured the content
    if (!isMeasured || contentHeight === 0) return;

    if (collapsed) {
      // Collapse animation
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Expand animation
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: contentHeight,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 250,
          delay: 50,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [collapsed, contentHeight, isMeasured]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= 0) return;

    // Allow height to update if children change size
    if (!isMeasured || height !== contentHeight) {
      setContentHeight(height);
      setIsMeasured(true);

      // Set initial state based on collapsed prop
      if (collapsed) {
        animatedHeight.setValue(0);
        animatedOpacity.setValue(0);
      } else {
        animatedHeight.setValue(height);
        animatedOpacity.setValue(1);
      }
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          height: isMeasured ? animatedHeight : 'auto',
          opacity: isMeasured ? animatedOpacity : (collapsed ? 0 : 1),
          overflow: 'hidden',
        },
      ]}
    >
      <View 
        onLayout={handleLayout}
        // Keep measurement view out of flow to avoid doubling content height
        pointerEvents="none"
        style={{ position: 'absolute', opacity: 0, width: '100%' }}
      >
        {children}
      </View>
      <View>{children}</View>
    </Animated.View>
  );
};

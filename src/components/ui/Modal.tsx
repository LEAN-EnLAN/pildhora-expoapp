import React, { useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  animationType?: 'fade' | 'slide';
  showCloseButton?: boolean;
  closeOnOverlayPress?: boolean;
  contentStyle?: ViewStyle;
  fitContent?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  title,
  size = 'md',
  animationType = 'slide',
  showCloseButton = true,
  closeOnOverlayPress = true,
  contentStyle,
  fitContent = false,
}) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Constrain modal height at runtime to avoid layouts that exceed the viewport on slower layout passes
  const computedHeights = React.useMemo(() => {
    // Leave room for safe areas and header/footer paddings; fall back to 90% of screen height
    const safeMax = Math.max(320, screenHeight - (insets.top + insets.bottom + spacing.xl * 2));
    const maxHeight = Math.min(screenHeight * 0.9, safeMax);

    // Maintain existing size ratios but convert to concrete pixel values to avoid percent rounding issues
    const sizeRatios: Record<NonNullable<ModalProps['size']>, { min: number; max: number }> = {
      sm: { min: 0.3, max: 0.45 },
      md: { min: 0.4, max: 0.65 },
      lg: { min: 0.5, max: 0.85 },
      full: { min: 0.95, max: 0.95 },
    };

    const ratios = sizeRatios[size];
    return {
      minHeight: screenHeight * ratios.min,
      maxHeight: Math.min(screenHeight * ratios.max, maxHeight),
    };
  }, [screenHeight, insets.top, insets.bottom, size]);

  useEffect(() => {
    if (visible) {
      // Reset animations
      slideAnim.setValue(animationType === 'slide' ? SCREEN_HEIGHT : 0);
      scaleAnim.setValue(0.9);
      overlayOpacity.setValue(0);

      // Animate in with smooth spring
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        animationType === 'slide'
          ? Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            })
          : Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }),
      ]).start();
    } else {
      // Animate out quickly
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        animationType === 'slide'
          ? Animated.timing(slideAnim, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            })
          : Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 250,
              useNativeDriver: true,
            }),
      ]).start();
    }
  }, [visible, animationType]);

  const handleOverlayPress = () => {
    if (closeOnOverlayPress) {
      onClose();
    }
  };

  // Determine if this is a bottom sheet or centered modal
  const isBottomSheet = animationType === 'slide' && !fitContent;
  const isCentered = fitContent || animationType === 'fade';

  const modalContentStyle = [
    styles.modalContent,
    isBottomSheet && styles.bottomSheet,
    isCentered && styles.centeredModal,
    !isBottomSheet && !isCentered && styles[`size_${size}`],
    isCentered && styles[`centered_${size}`],
    { maxHeight: computedHeights.maxHeight, minHeight: computedHeights.minHeight },
    contentStyle,
  ];

  const containerStyle = [
    styles.container,
    isCentered && styles.containerCenter,
  ];

  const animatedStyle = animationType === 'slide' 
    ? { transform: [{ translateY: slideAnim }] }
    : { 
        transform: [{ scale: scaleAnim }],
        opacity: overlayOpacity,
      };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            modalContentStyle,
            animatedStyle,
          ]}
        >
          {(title || showCloseButton) && (
            <View 
              style={styles.header}
              accessible={true}
              accessibilityRole="header"
            >
              {title && (
                <Text 
                  style={styles.title}
                  accessibilityRole="header"
                  accessible={true}
                >
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityLabel={`Cerrar ${title || 'modal'}`}
                  accessibilityHint="Cierra el modal y regresa a la pantalla anterior"
                  accessibilityRole="button"
                  accessible={true}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.body, 
              { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }
            ]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  containerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    ...shadows.xl,
  },
  bottomSheet: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    width: '100%',
    maxHeight: '90%',
    minHeight: '30%',
  },
  centeredModal: {
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  size_sm: {
    maxHeight: '45%',
    minHeight: '30%',
  },
  size_md: {
    maxHeight: '65%',
    minHeight: '40%',
  },
  size_lg: {
    maxHeight: '85%',
    minHeight: '50%',
  },
  size_full: {
    maxHeight: '95%',
    minHeight: '95%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  centered_sm: {
    maxHeight: '50%',
  },
  centered_md: {
    maxHeight: '70%',
  },
  centered_lg: {
    maxHeight: '85%',
  },
  centered_full: {
    maxHeight: '95%',
    width: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  closeButtonText: {
    fontSize: typography.fontSize.xl,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xl,
  },
  scrollView: {
    flex: 1,
  },
  body: {
    padding: spacing.xl,
  },
});

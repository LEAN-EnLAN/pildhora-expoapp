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
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        animationType === 'slide'
          ? Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 90,
            })
          : Animated.timing(slideAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        animationType === 'slide'
          ? Animated.timing(slideAnim, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            })
          : Animated.timing(slideAnim, {
              toValue: 0,
              duration: 0,
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

  const modalContentStyle = [
    styles.modalContent,
    fitContent ? styles.fitContent : styles[`size_${size}`],
    contentStyle,
  ];

  const containerStyle = [
    styles.container,
    fitContent && styles.containerCenter,
  ];

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
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
            {
              transform: [{ translateY: animationType === 'slide' ? slideAnim : 0 }],
              opacity: animationType === 'fade' ? overlayOpacity : 1,
            },
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
                  accessibilityLabel={`Close ${title || 'modal'}`}
                  accessibilityHint="Closes the modal and returns to previous screen"
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
            contentContainerStyle={[styles.body, { paddingBottom: spacing.lg + insets.bottom }]}
            showsVerticalScrollIndicator={true}
            bounces={true}
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
    alignItems: 'center',
  },
  containerCenter: {
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    width: '100%',
    maxHeight: '90%',
    ...shadows.lg,
  },
  fitContent: {
    borderRadius: borderRadius.xl,
    maxHeight: '90%',
    width: '100%',
  },
  size_sm: {
    maxHeight: '40%',
  },
  size_md: {
    maxHeight: '60%',
  },
  size_lg: {
    maxHeight: '80%',
  },
  size_full: {
    maxHeight: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  closeButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  body: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});

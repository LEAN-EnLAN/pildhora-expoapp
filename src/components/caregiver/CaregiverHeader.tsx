/**
 * CaregiverHeader Component
 * 
 * High-quality header for caregiver screens matching patient-side design quality.
 * Displays PILDHORA branding, caregiver name, and quick action buttons.
 * 
 * Features:
 * - Consistent styling with design system tokens
 * - Emergency call button with modal
 * - Account menu button with modal
 * - Platform-specific ActionSheet for iOS
 * - Proper accessibility labels and touch targets
 * - Smooth animations and visual feedback
 * 
 * @example
 * <CaregiverHeader
 *   caregiverName="Dr. Smith"
 *   title="Dashboard"
 *   showScreenTitle={true}
 *   onLogout={handleLogout}
 * />
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  ActionSheetIOS,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppIcon } from '../ui';

export interface CaregiverHeaderProps {
  /** Display name of the caregiver */
  caregiverName?: string;
  /** Screen title to display */
  title?: string;
  /** Whether to show the screen title below branding */
  showScreenTitle?: boolean;
  /** Callback when logout is triggered */
  onLogout?: () => void;
  /** Callback when emergency button is pressed */
  onEmergency?: () => void;
  /** Callback when account menu is opened */
  onAccountMenu?: () => void;
}

export default function CaregiverHeader({
  caregiverName,
  title,
  showScreenTitle = false,
  onLogout,
  onEmergency,
  onAccountMenu,
}: CaregiverHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Modal visibility state
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  
  // Animation refs for button press feedback
  const emergencyButtonScale = useRef(new Animated.Value(1)).current;
  const accountButtonScale = useRef(new Animated.Value(1)).current;

  /**
   * Handles emergency button press
   * Shows emergency call modal with 911/112 options
   */
  const handleEmergencyPress = () => {
    if (onEmergency) {
      onEmergency();
    }
    
    if (Platform.OS === 'ios') {
      // Use iOS ActionSheet for native feel
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Llamada de Emergencia',
          message: 'Selecciona el número de emergencia',
          options: ['Cancelar', 'Llamar 911', 'Llamar 112'],
          destructiveButtonIndex: undefined,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            Linking.openURL('tel:911');
          } else if (buttonIndex === 2) {
            Linking.openURL('tel:112');
          }
        }
      );
    } else {
      // Use custom modal for Android
      setEmergencyModalVisible(true);
    }
  };

  /**
   * Handles account menu button press
   * Shows account menu modal with logout, settings, device management options
   */
  const handleAccountMenuPress = () => {
    if (onAccountMenu) {
      onAccountMenu();
    }
    
    if (Platform.OS === 'ios') {
      // Use iOS ActionSheet for native feel
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Menú de Cuenta',
          options: [
            'Cancelar',
            'Configuraciones',
            'Gestión de Dispositivos',
            'Cerrar Sesión',
          ],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Navigate to settings (to be implemented)
          } else if (buttonIndex === 2) {
            // Navigate to device management
            router.push('/caregiver/add-device');
          } else if (buttonIndex === 3) {
            // Logout
            if (onLogout) {
              onLogout();
            }
          }
        }
      );
    } else {
      // Use custom modal for Android
      setAccountMenuVisible(true);
    }
  };

  /**
   * Handles emergency call
   */
  const handleEmergencyCall = (number: string) => {
    setEmergencyModalVisible(false);
    Linking.openURL(`tel:${number}`);
  };

  /**
   * Handles account menu actions
   */
  const handleAccountAction = (action: 'settings' | 'devices' | 'logout') => {
    setAccountMenuVisible(false);
    
    if (action === 'settings') {
    } else if (action === 'devices') {
      router.push('/caregiver/add-device');
    } else if (action === 'logout' && onLogout) {
      onLogout();
    }
  };

  /**
   * Button press animation
   */
  const animateButtonPress = (animValue: Animated.Value, pressed: boolean) => {
    Animated.spring(animValue, {
      toValue: pressed ? 0.9 : 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.md,
          },
        ]}
      >
        {/* Left section: Branding and title */}
        <View style={styles.leftSection}>
          <View style={styles.brandingContainer}>
            <AppIcon size="sm" showShadow={false} rounded={true} />
            <Text
              style={styles.logo}
              accessibilityRole="header"
              accessibilityLabel="PILDHORA"
            >
              PILDHORA
            </Text>
          </View>
          {caregiverName && (
            <Text
              style={styles.caregiverName}
              accessibilityLabel={`Caregiver: ${caregiverName}`}
            >
              {caregiverName}
            </Text>
          )}
          {showScreenTitle && title && (
            <Text
              style={styles.screenTitle}
              accessibilityLabel={`Current screen: ${title}`}
            >
              {title}
            </Text>
          )}
        </View>

        {/* Right section: Action buttons */}
        <View style={styles.actionsContainer}>
          {/* Emergency button */}
          <Animated.View
            style={{
              transform: [{ scale: emergencyButtonScale }],
            }}
          >
            <TouchableOpacity
              style={[styles.actionButton, styles.emergencyButton]}
              onPress={handleEmergencyPress}
              onPressIn={() => animateButtonPress(emergencyButtonScale, true)}
              onPressOut={() => animateButtonPress(emergencyButtonScale, false)}
              accessibilityLabel="Emergency call button"
              accessibilityHint="Opens emergency call options for 911 or 112"
              accessibilityRole="button"
              accessible={true}
            >
              <Ionicons name="alert" size={22} color={colors.surface} />
            </TouchableOpacity>
          </Animated.View>

          {/* Account menu button */}
          <Animated.View
            style={{
              transform: [{ scale: accountButtonScale }],
            }}
          >
            <TouchableOpacity
              style={[styles.actionButton, styles.accountButton]}
              onPress={handleAccountMenuPress}
              onPressIn={() => animateButtonPress(accountButtonScale, true)}
              onPressOut={() => animateButtonPress(accountButtonScale, false)}
              accessibilityLabel="Account menu button"
              accessibilityHint="Opens account menu with settings, device management, and logout options"
              accessibilityRole="button"
              accessible={true}
            >
              <Ionicons name="person" size={22} color={colors.surface} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Emergency Modal (Android) */}
      <Modal
        visible={emergencyModalVisible}
        onClose={() => setEmergencyModalVisible(false)}
        title="Llamada de Emergencia"
        size="sm"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            Selecciona el número de emergencia que deseas llamar
          </Text>
          
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onPress={() => handleEmergencyCall('911')}
            style={styles.modalButton}
            leftIcon={<Ionicons name="call" size={20} color={colors.surface} />}
            accessibilityLabel="Call 911"
            accessibilityHint="Initiates emergency call to 911"
          >
            Llamar 911
          </Button>
          
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onPress={() => handleEmergencyCall('112')}
            style={styles.modalButton}
            leftIcon={<Ionicons name="call" size={20} color={colors.surface} />}
            accessibilityLabel="Call 112"
            accessibilityHint="Initiates emergency call to 112"
          >
            Llamar 112
          </Button>
          
          <Button
            variant="outline"
            size="md"
            fullWidth
            onPress={() => setEmergencyModalVisible(false)}
            accessibilityLabel="Cancel"
            accessibilityHint="Closes emergency call modal"
          >
            Cancelar
          </Button>
        </View>
      </Modal>

      {/* Account Menu Modal (Android) */}
      <Modal
        visible={accountMenuVisible}
        onClose={() => setAccountMenuVisible(false)}
        title="Menú de Cuenta"
        size="sm"
      >
        <View style={styles.modalContent}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => handleAccountAction('settings')}
            style={styles.modalButton}
            leftIcon={<Ionicons name="settings-outline" size={20} color={colors.gray[700]} />}
            accessibilityLabel="Settings"
            accessibilityHint="Opens settings screen"
          >
            Configuraciones
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => handleAccountAction('devices')}
            style={styles.modalButton}
            leftIcon={<Ionicons name="hardware-chip-outline" size={20} color={colors.gray[700]} />}
            accessibilityLabel="Device management"
            accessibilityHint="Opens device management screen"
          >
            Gestión de Dispositivos
          </Button>
          
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onPress={() => handleAccountAction('logout')}
            style={styles.modalButton}
            leftIcon={<Ionicons name="log-out-outline" size={20} color={colors.surface} />}
            accessibilityLabel="Logout"
            accessibilityHint="Logs out of caregiver account"
          >
            Cerrar Sesión
          </Button>
          
          <Button
            variant="outline"
            size="md"
            fullWidth
            onPress={() => setAccountMenuVisible(false)}
            accessibilityLabel="Cancel"
            accessibilityHint="Closes account menu"
          >
            Cancelar
          </Button>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  leftSection: {
    flex: 1,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  caregiverName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  screenTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    marginTop: spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  emergencyButton: {
    backgroundColor: '#DC2626', // Darker red for better contrast with white icon (4.8:1)
  },
  accountButton: {
    backgroundColor: colors.gray[700],
  },
  modalContent: {
    gap: spacing.md,
  },
  modalDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  modalButton: {
    marginBottom: spacing.xs,
  },
});

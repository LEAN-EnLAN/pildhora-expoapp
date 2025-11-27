import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens'
import { motion } from '../../theme/motion'

interface AppBarProps {
  title: string
  showBackButton?: boolean
  onBackPress?: () => void
  rightActionIcon?: React.ReactNode
  onRightActionPress?: () => void
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightActionIcon,
  onRightActionPress,
}) => {
  const backScale = useRef(new Animated.Value(1)).current
  const rightScale = useRef(new Animated.Value(1)).current

  const animatePress = (anim: Animated.Value, pressed: boolean) => {
    Animated.spring(anim, {
      toValue: pressed ? motion.scale.pressed : 1,
      useNativeDriver: true,
      ...motion.spring.snappy,
    }).start()
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <Animated.View style={{ transform: [{ scale: backScale }] }}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              onPressIn={() => animatePress(backScale, true)}
              onPressOut={() => animatePress(backScale, false)}
              accessibilityLabel="Volver"
              accessibilityHint="Regresa a la pantalla anterior"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.gray[800]} />
            </TouchableOpacity>
          </Animated.View>
        )}
        <Text 
          style={styles.title} 
          accessibilityRole="header"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>

      {rightActionIcon && (
        <Animated.View style={{ transform: [{ scale: rightScale }] }}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRightActionPress}
            onPressIn={() => animatePress(rightScale, true)}
            onPressOut={() => animatePress(rightScale, false)}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightActionIcon}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, // Slightly reduced for better density
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    // Use a custom shadow that is cleaner
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  title: {
    fontSize: typography.fontSize['xl'], // Slightly smaller to prevent wrapping on small screens
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    flex: 1,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
})

export default AppBar

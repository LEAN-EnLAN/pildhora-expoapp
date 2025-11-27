import React, { useMemo } from 'react'
import { View, Pressable, Platform, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, borderRadius } from '../theme/tokens'

type TabBarProps = {
  state: any
  descriptors: Record<string, any>
  navigation: any
}

const iconForRoute = (name: string, focused: boolean) => {
  if (name === 'dashboard') return focused ? 'home' : 'home-outline'
  if (name === 'tasks') return focused ? 'checkbox' : 'checkbox-outline'
  if (name === 'patients') return focused ? 'people' : 'people-outline'
  if (name === 'calendar') return focused ? 'calendar' : 'calendar-outline'
  if (name === 'settings') return focused ? 'settings' : 'settings-outline'
  return focused ? 'ellipse' : 'ellipse-outline'
}

export default function CaregiverTabBar({ state, descriptors, navigation }: TabBarProps) {
  const routes = useMemo(() => {
    const allowed = new Set(['dashboard', 'tasks', 'patients', 'calendar', 'settings'])
    return state.routes.filter((r: any) => allowed.has(r.name))
  }, [state.routes])

  return (
    <View style={styles.container}>
      {routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key]
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name
        const isFocused = state.index === index

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
        }

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key })
        }

        const onKeyDown = (e: any) => {
          if (Platform.OS === 'web') {
            if (e.key === 'Enter' || e.key === ' ') onPress()
          }
        }

        const iconName = iconForRoute(route.name, isFocused)

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel}
            accessibilityState={isFocused ? { selected: true } : {}}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            onKeyDown={onKeyDown}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.item, isFocused && styles.itemFocused]}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name={iconName as any} size={24} color={isFocused ? colors.primary[600] : colors.gray[400]} />
            </View>
            {options.tabBarShowLabel !== false && (
              <Text style={[styles.label, { color: isFocused ? colors.primary[700] : colors.gray[500] }]}>{label}</Text>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.md,
    paddingHorizontal: spacing.md,
    height: Platform.OS === 'ios' ? 80 : 65,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
  },
  itemFocused: {
    backgroundColor: colors.primary[50],
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 12,
  },
})

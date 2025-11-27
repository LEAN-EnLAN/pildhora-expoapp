import React, { useMemo, useState } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme/tokens'
import { useTranslation } from '../../src/hooks/useTranslation'
import { DeviceProvisioningErrorCode, handleDeviceProvisioningError } from '../../src/utils/deviceProvisioningErrors'
import { ConnectionCodeErrorCode, handleConnectionCodeError } from '../../src/utils/connectionCodeErrors'
import { useScrollViewPadding } from '../../src/hooks/useScrollViewPadding'

type TabKey = 'dispositivos' | 'conexion' | 'accesibilidad' | 'medicacion'

const TABS: Array<{ key: TabKey; labelKey: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'dispositivos', labelKey: 'diagnostics.tabs.devices', icon: 'hardware-chip-outline' },
  { key: 'conexion', labelKey: 'diagnostics.tabs.connection', icon: 'link-outline' },
  { key: 'medicacion', labelKey: 'diagnostics.tabs.medication', icon: 'medkit-outline' },
  { key: 'accesibilidad', labelKey: 'diagnostics.tabs.accessibility', icon: 'accessibility-outline' },
]

const sampleDeviceErrors: DeviceProvisioningErrorCode[] = [
  DeviceProvisioningErrorCode.DEVICE_NOT_FOUND,
  DeviceProvisioningErrorCode.DEVICE_OFFLINE,
  DeviceProvisioningErrorCode.WIFI_CONFIG_FAILED,
]

const sampleConnErrors: ConnectionCodeErrorCode[] = [
  ConnectionCodeErrorCode.CODE_NOT_FOUND,
  ConnectionCodeErrorCode.CODE_EXPIRED,
  ConnectionCodeErrorCode.INVALID_CODE_FORMAT,
]

export default function Diagnostics() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('dispositivos')
  const [query, setQuery] = useState('')
  const { contentPaddingBottom } = useScrollViewPadding()

  const deviceItems = useMemo(() => {
    return sampleDeviceErrors.map((code) => ({ code, data: handleDeviceProvisioningError(code) }))
  }, [])

  const connItems = useMemo(() => {
    return sampleConnErrors.map((code) => ({ code, data: handleConnectionCodeError(code) }))
  }, [])

  const filterText = query.trim().toLowerCase()

  const filteredDeviceItems = useMemo(() => {
    if (!filterText) return deviceItems
    return deviceItems.filter(({ data }) =>
      [data.userMessage, data.suggestedAction, ...(data.troubleshootingSteps || [])]
        .join(' ')
        .toLowerCase()
        .includes(filterText)
    )
  }, [deviceItems, filterText])

  const filteredConnItems = useMemo(() => {
    if (!filterText) return connItems
    return connItems.filter(({ data }) =>
      [data.userMessage, data.suggestedAction, ...(data.troubleshootingSteps || [])]
        .join(' ')
        .toLowerCase()
        .includes(filterText)
    )
  }, [connItems, filterText])

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('diagnostics.title')}</Text>
        <Text style={styles.subtitle}>{t('diagnostics.subtitle')}</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? colors.primary[600] : colors.gray[600]} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{t(tab.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.gray[500]} />
        <TextInput
          placeholder={t('diagnostics.search.placeholder')}
          placeholderTextColor={colors.gray[400]}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          accessibilityLabel={t('diagnostics.search.accessibilityLabel')}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        {activeTab === 'dispositivos' && (
          <View style={styles.section}>
            {filteredDeviceItems.map(({ code, data }) => (
              <View key={code} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeWarn}><Text style={styles.badgeWarnText}>{data.retryable ? t('diagnostics.badge.retry') : t('diagnostics.badge.attention')}</Text></View>
                  <Text style={styles.cardTitle}>{data.userMessage}</Text>
                </View>
                <Text style={styles.cardAction}>{data.suggestedAction}</Text>
                {(data.troubleshootingSteps || []).slice(0, 4).map((s, idx) => (
                  <Text key={idx} style={styles.cardStep}>• {s}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'conexion' && (
          <View style={styles.section}>
            {filteredConnItems.map(({ code, data }) => (
              <View key={code} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeInfo}><Text style={styles.badgeInfoText}>{data.retryable ? t('diagnostics.badge.validate') : t('diagnostics.badge.newCode')}</Text></View>
                  <Text style={styles.cardTitle}>{data.userMessage}</Text>
                </View>
                <Text style={styles.cardAction}>{data.suggestedAction}</Text>
                {(data.troubleshootingSteps || []).slice(0, 4).map((s, idx) => (
                  <Text key={idx} style={styles.cardStep}>• {s}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'medicacion' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sin integración aún</Text>
              <Text style={styles.cardAction}>Próximamente: inventario, dosis atrasadas y adherencia.</Text>
            </View>
          </View>
        )}

        {activeTab === 'accesibilidad' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chequeos rápidos</Text>
              <Text style={styles.cardStep}>• Contraste AA en textos principales</Text>
              <Text style={styles.cardStep}>• Enfoque visible en botones y enlaces</Text>
              <Text style={styles.cardStep}>• Lectores de pantalla: etiquetas y roles</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.gray[900] },
  subtitle: { fontSize: typography.fontSize.base, color: colors.gray[600], marginTop: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.gray[100] },
  tabActive: { backgroundColor: colors.primary[50] },
  tabLabel: { fontSize: typography.fontSize.sm, color: colors.gray[700], fontWeight: typography.fontWeight.medium },
  tabLabelActive: { color: colors.primary[600], fontWeight: typography.fontWeight.semibold },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, ...shadows.sm },
  searchInput: { flex: 1, fontSize: typography.fontSize.base, color: colors.gray[900] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  section: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray[900] },
  cardAction: { fontSize: typography.fontSize.sm, color: colors.gray[700], marginBottom: spacing.sm },
  cardStep: { fontSize: typography.fontSize.sm, color: colors.gray[600] },
  badgeWarn: { backgroundColor: colors.warning[50], borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeWarnText: { color: colors.warning[600], fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  badgeInfo: { backgroundColor: colors.primary[50], borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeInfoText: { color: colors.primary[600], fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
})

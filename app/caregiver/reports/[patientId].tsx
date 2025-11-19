import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../src/store';
import { ScreenWrapper } from '../../../src/components/caregiver';
import { PremiumAdherenceChart } from '../../../src/components/shared/PremiumAdherenceChart';
import { Card, Button } from '../../../src/components/ui';
import { colors, spacing, typography, borderRadius } from '../../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { IntakeStatus } from '../../../src/types';
import { startIntakesSubscription, stopIntakesSubscription } from '../../../src/store/slices/intakesSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PatientReportsScreen() {
    const { patientId } = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const pid = Array.isArray(patientId) ? patientId[0] : patientId;

    const { intakes } = useSelector((state: RootState) => state.intakes);
    const { medications } = useSelector((state: RootState) => state.medications);

    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

    // Subscribe to intakes
    useEffect(() => {
        if (pid) {
            dispatch(startIntakesSubscription(pid));
        }
        return () => {
            dispatch(stopIntakesSubscription());
        };
    }, [pid, dispatch]);

    // --- Data Processing ---

    // 1. Daily Adherence (Today)
    const dailyData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter intakes for today
        const todaysIntakes = intakes.filter(i => {
            const d = new Date(i.scheduledTime);
            return d >= today && d < new Date(today.getTime() + 86400000);
        });

        const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const getTodayAbbrev = () => DAY_ABBREVS[new Date().getDay()];
        const isScheduledToday = (med: any) => {
            const freq = med.frequency || '';
            const days = freq.split(',').map((s: string) => s.trim());
            return days.includes(getTodayAbbrev());
        };

        const todaysMeds = medications.filter(isScheduledToday);
        let totalDoses = 0;
        todaysMeds.forEach(med => {
            totalDoses += (med.times || []).length;
        });

        const uniqueTaken = new Set<string>();
        todaysIntakes.forEach((intake) => {
            if (intake.status === IntakeStatus.TAKEN) {
                const medKey = intake.medicationId || intake.medicationName;
                const scheduledMs = new Date(intake.scheduledTime).getTime();
                const completionToken = `${medKey}-${scheduledMs}`;
                uniqueTaken.add(completionToken);
            }
        });

        return {
            taken: uniqueTaken.size,
            total: totalDoses,
            percentage: totalDoses > 0 ? Math.round((uniqueTaken.size / totalDoses) * 100) : 0
        };
    }, [medications, intakes]);

    // 2. Weekly Data (Last 7 days)
    const weeklyData = useMemo(() => {
        const labels = [];
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const dayName = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()];
            labels.push(dayName);

            // Find intakes for this day
            const dayIntakes = intakes.filter(intake => {
                const idate = new Date(intake.scheduledTime);
                return idate >= d && idate < new Date(d.getTime() + 86400000);
            });

            const taken = dayIntakes.filter(i => i.status === IntakeStatus.TAKEN).length;
            data.push(taken);
        }

        return {
            labels,
            datasets: [{ data }]
        };
    }, [intakes]);

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Reportes de Adherencia</Text>
                </View>

                {/* Time Range Selector */}
                <View style={styles.tabContainer}>
                    {(['day', 'week'] as const).map((range) => (
                        <TouchableOpacity
                            key={range}
                            style={[styles.tab, timeRange === range && styles.activeTab]}
                            onPress={() => setTimeRange(range)}
                        >
                            <Text style={[styles.tabText, timeRange === range && styles.activeTabText]}>
                                {range === 'day' ? 'Hoy' : 'Semana'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                {timeRange === 'day' ? (
                    <View style={styles.section}>
                        <Card variant="elevated" padding="lg" style={styles.mainChartCard}>
                            <Text style={styles.chartTitle}>Resumen del Día</Text>
                            <View style={styles.chartWrapper}>
                                <PremiumAdherenceChart
                                    taken={dailyData.taken}
                                    total={dailyData.total}
                                    size={260}
                                    strokeWidth={22}
                                />
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{dailyData.taken}</Text>
                                    <Text style={styles.statLabel}>Tomadas</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{Math.max(0, dailyData.total - dailyData.taken)}</Text>
                                    <Text style={styles.statLabel}>Pendientes</Text>
                                </View>
                            </View>
                        </Card>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Card variant="elevated" padding="lg">
                            <Text style={styles.chartTitle}>Progreso Semanal</Text>
                            <Text style={styles.chartSubtitle}>Dosis tomadas en los últimos 7 días</Text>

                            <BarChart
                                data={weeklyData}
                                width={SCREEN_WIDTH - 64}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={{
                                    backgroundColor: colors.surface,
                                    backgroundGradientFrom: colors.surface,
                                    backgroundGradientTo: colors.surface,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => colors.primary[500],
                                    labelColor: (opacity = 1) => colors.gray[600],
                                    barPercentage: 0.7,
                                    propsForBackgroundLines: {
                                        strokeDasharray: "", // solid lines
                                        stroke: colors.gray[100]
                                    }
                                }}
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16,
                                    paddingRight: 32, // Fix for right label clipping
                                }}
                                showValuesOnTopOfBars
                            />
                        </Card>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    backButton: {
        marginRight: spacing.md,
        padding: spacing.xs,
    },
    title: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.gray[900],
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.gray[100],
        borderRadius: borderRadius.lg,
        padding: 4,
        marginBottom: spacing.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    activeTab: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.gray[500],
    },
    activeTabText: {
        color: colors.gray[900],
        fontWeight: typography.fontWeight.semibold,
    },
    section: {
        gap: spacing.lg,
    },
    mainChartCard: {
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.gray[900],
        marginBottom: spacing.xs,
        alignSelf: 'flex-start',
    },
    chartSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.gray[500],
        marginBottom: spacing.lg,
        alignSelf: 'flex-start',
    },
    chartWrapper: {
        marginVertical: spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.gray[900],
    },
    statLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.gray[500],
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.gray[200],
    },
});

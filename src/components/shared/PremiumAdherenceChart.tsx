import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
    useDerivedValue,
    interpolateColor
} from 'react-native-reanimated';
import { colors, typography, spacing, shadows } from '../../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PremiumAdherenceChartProps {
    taken: number;
    total: number;
    size?: number;
    showLabel?: boolean;
    strokeWidth?: number;
}

export const PremiumAdherenceChart: React.FC<PremiumAdherenceChartProps> = ({
    taken,
    total,
    size = 200,
    showLabel = true,
    strokeWidth = 20,
}) => {
    const percentage = total > 0 ? Math.min(1, Math.max(0, taken / total)) : 0;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(percentage, {
            duration: 1500,
            easing: Easing.out(Easing.exp),
        });
    }, [percentage]);

    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset = circumference * (1 - progress.value);
        return {
            strokeDashoffset,
        };
    });

    // Color interpolation based on progress
    // Red -> Orange -> Green
    // We can't easily animate gradient colors in SVG with Reanimated directly without some tricks,
    // so we'll stick to a nice static gradient or a dynamic solid color.
    // For "premium" look, a gradient is better. Let's use a fixed premium gradient.

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                <Defs>
                    <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.primary[400]} />
                        <Stop offset="100%" stopColor={colors.primary[600]} />
                    </LinearGradient>
                    <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.gray[100]} />
                        <Stop offset="100%" stopColor={colors.gray[200]} />
                    </LinearGradient>
                </Defs>

                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#bgGradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Progress Circle */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            {showLabel && (
                <View style={styles.labelContainer}>
                    <Text style={styles.percentageText}>
                        {Math.round(percentage * 100)}%
                    </Text>
                    <Text style={styles.subText}>
                        {taken} de {total}
                    </Text>
                    <Text style={styles.labelText}>Completado</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    labelContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 48,
        fontWeight: '800',
        color: colors.gray[900],
        includeFontPadding: false,
    },
    subText: {
        fontSize: 16,
        color: colors.gray[500],
        fontWeight: '600',
        marginTop: -4,
    },
    labelText: {
        fontSize: 14,
        color: colors.gray[400],
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

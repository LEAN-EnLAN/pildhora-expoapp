import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Animated,
    Easing,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, set, onValue, off } from 'firebase/database';
import { getDeviceRdbInstance } from '../../services/firebase';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';

interface TestFortuButtonProps {
    deviceId?: string;
}

/**
 * TestFortuButton
 *
 * Mirrors the TestTopoButton but toggles the `fortu` command in RTDB.
 * Useful for development/testing flows where setting `fortu=true` in
 * the device commands path is needed.
 */
export const TestFortuButton = ({ deviceId = 'TEST-DEVICE-001' }: TestFortuButtonProps) => {
    const [state, setState] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const setup = async () => {
            const rdb = await getDeviceRdbInstance();
            if (!rdb) return;
            const pathRef = ref(rdb, `devices/${deviceId}/commands/fortu`);
            const cb = (snap: any) => {
                const v = snap.val();
                setState(typeof v === 'boolean' ? v : !!v);
            };
            onValue(pathRef, cb);
            unsubscribe = () => off(pathRef, 'value', cb as any);
        };
        setup();
        return () => { if (unsubscribe) unsubscribe(); };
    }, [deviceId]);

    useEffect(() => {
        let animation: Animated.CompositeAnimation;
        if (state) {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            );
            animation.start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => { if (animation) animation.stop(); };
    }, [state]);

    const handlePress = useCallback(async () => {
        setLoading(true);
        try {
            const rdb = await getDeviceRdbInstance();
            if (!rdb) { Alert.alert('Error', 'Firebase Database not initialized'); return; }
            const actionPath = `devices/${deviceId}/commands/fortu`;
            await set(ref(rdb, actionPath), true);
            Alert.alert('Éxito', `Se ha enviado fortu=true al dispositivo ${deviceId}.`);
        } catch (error: any) {
            console.error('Test Fortu Error:', error);
            Alert.alert('Error', error.message || String(error));
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    const handleStop = useCallback(async () => {
        setLoading(true);
        try {
            const rdb = await getDeviceRdbInstance();
            if (!rdb) { Alert.alert('Error', 'Firebase Database not initialized'); return; }
            const actionPath = `devices/${deviceId}/commands/fortu`;
            await set(ref(rdb, actionPath), false);
        } catch (error: any) {
            console.error('Stop Fortu Error:', error);
            Alert.alert('Error', error.message || String(error));
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    const getStatusText = () => {
        if (state === null) return 'Desconectado';
        return state ? 'ACTIVO' : 'INACTIVO';
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                disabled={loading || state === true}
                accessibilityLabel="Probar Fortu"
            >
                <LinearGradient
                    colors={state ? colors.gradients.sunset : [colors.primary[500], colors.primary[600]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                >
                    <View style={styles.contentContainer}>
                        <View style={styles.leftSection}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="pulse" size={24} color="white" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>Forzar Fortu</Text>
                                <Text style={styles.subtitle}>{deviceId}</Text>
                            </View>
                        </View>

                        <View style={styles.rightSection}>
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <View style={styles.statusContainer}>
                                    <Animated.View
                                        style={[
                                            styles.statusDot,
                                            { backgroundColor: state ? 'white' : 'rgba(255,255,255,0.5)' },
                                            state && { transform: [{ scale: pulseAnim }] }
                                        ]}
                                    />
                                    <Text style={styles.statusText}>{getStatusText()}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            {state && (
                <TouchableOpacity
                    onPress={handleStop}
                    activeOpacity={0.8}
                    disabled={loading}
                    style={styles.stopButton}
                >
                    <Ionicons name="stop-circle" size={20} color="white" />
                    <Text style={styles.stopButtonText}>Apagar Fortu</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: spacing.lg,
        ...shadows.md,
    },
    button: {
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        minHeight: 72,
        justifyContent: 'center',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: { justifyContent: 'center' },
    title: { color: 'white', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
    subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.fontSize.xs },
    rightSection: { alignItems: 'flex-end' },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        gap: spacing.xs,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { color: 'white', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.error[600],
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    stopButtonText: { color: 'white', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
});

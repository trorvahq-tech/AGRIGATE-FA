import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface NotificationToastProps {
    visible: boolean;
    onTimerEnd: () => void;
    title?: string;
    message?: string;
    duration?: number;
}

export default function NotificationToast({
    visible,
    onTimerEnd,
    title = "Reset code has been sent",
    message = "Check your SMS on +234xxxxx000 for the reset code",
    duration = 3
}: NotificationToastProps) {
    const { colors, isDarkMode } = useTheme();
    const [secondsLeft, setSecondsLeft] = useState(duration);

    const pan = useRef(new Animated.ValueXY()).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: Animated.event(
                [null, { dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -50) {
                    Animated.parallel([
                        Animated.timing(pan.y, {
                            toValue: -150,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        })
                    ]).start(() => {
                        onTimerEnd();
                    });
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            setSecondsLeft(duration);
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);

            const interval = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        onTimerEnd();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [visible, duration, onTimerEnd]);

    if (!visible) return null;

    const radius = 13;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - secondsLeft / duration);

    return (
        <View style={StyleSheet.absoluteFill} className="z-50 items-center justify-center">
            {/* Blur Overlay */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? '#0A0C118F' : '#4342428F' }]}>
                <BlurView
                    intensity={Platform.OS === 'android' ? 30 : 5}
                    tint={isDarkMode ? 'dark' : 'light'}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Toast Container with Gesture Handlers */}
            <Animated.View
                style={[
                    styles.toastContainer,
                    {
                        transform: [{ translateY: pan.y }],
                        opacity: opacity,
                        backgroundColor: colors.card,
                        shadowColor: isDarkMode ? '#FFFFFF' : '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDarkMode ? 0.15 : 0.1,
                        shadowRadius: 12,
                        elevation: 10,
                    }
                ]}
                {...panResponder.panHandlers}
            >
                <View className="flex-1 mr-4">
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
                </View>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <Svg width="30" height="30" viewBox="0 0 30 30">
                        {/* Background Circle */}
                        <Circle
                            cx="15"
                            cy="15"
                            r={radius}
                            fill="transparent"
                            stroke={colors.border}
                            strokeWidth="2"
                        />
                        {/* Progress Circle (Eclipse) */}
                        <Circle
                            cx="15"
                            cy="15"
                            r={radius}
                            fill="transparent"
                            stroke={colors.text}
                            strokeWidth="2"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin="15, 15"
                        />
                    </Svg>
                    <View style={styles.timerTextContainer}>
                        <Text style={[styles.timerText, { color: colors.text }]}>
                            {secondsLeft.toString().padStart(2, '0')}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 55,
        width: width * 0.90,
        height: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0A0C11CC',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#5B616D',
        lineHeight: 20,
    },
    timerContainer: {
        width: 30,
        height: 30,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    timerTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0A0C11CC',
    },
});

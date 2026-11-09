import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface SecureAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onChangePassword: () => void;
}

export default function SecureAccountModal({ visible, onClose, onChangePassword }: SecureAccountModalProps) {
    const { colors, isDarkMode } = useTheme();
    const [secondsLeft, setSecondsLeft] = useState(5);

    useEffect(() => {
        if (visible) {
            setSecondsLeft(5);
            const interval = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        onClose();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [visible, onClose]);

    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - secondsLeft / 5);

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            style={styles.modal}
            backdropColor="#000000"
            backdropOpacity={isDarkMode ? 0.7 : 0.5}
            animationIn="zoomIn"
            animationOut="zoomOut"
        >
            <View style={[styles.container, { backgroundColor: colors.card }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Secure Your Account</Text>
                    <View style={[styles.timerContainer, { backgroundColor: colors.inputBackground }]}>
                        <Svg width="32" height="32" viewBox="0 0 32 32">
                            {/* Background Circle */}
                            <Circle
                                cx="16"
                                cy="16"
                                r={radius}
                                fill="transparent"
                                stroke={colors.border}
                                strokeWidth="2"
                            />
                            {/* Progress Circle (Eclipse) */}
                            <Circle
                                cx="16"
                                cy="16"
                                r={radius}
                                fill="transparent"
                                stroke={colors.text}
                                strokeWidth="2"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                rotation="-90"
                                origin="16, 16"
                            />
                        </Svg>
                        <View style={styles.timerTextContainer}>
                            <Text style={[styles.timerText, { color: colors.text }]}>
                                {secondsLeft.toString().padStart(2, '0')}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.description, { color: colors.textMuted }]}>
                    For security reasons, you need to change your password before continuing.
                </Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.border }]} onPress={onClose}>
                        <Text style={[styles.outlineButtonText, { color: colors.textMuted }]}>Do it later</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.fillButton} onPress={onChangePassword}>
                        <Text style={styles.fillButtonText}>Change Password</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: {
        margin: 20,
        justifyContent: 'center',
    },
    container: {
        backgroundColor: '#F5F9F9',
        borderRadius: 20,
        padding: 20,
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0A0C11',
    },
    timerContainer: {
        width: 32,
        height: 32,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'white',
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
        fontSize: 12,
        fontWeight: '600',
        color: '#0A0C11',
    },
    description: {
        fontSize: 14,
        color: '#5B616D',
        lineHeight: 20,
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
    },
    outlineButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E6E7EC',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    outlineButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5B616D',
    },
    fillButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fillButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
});

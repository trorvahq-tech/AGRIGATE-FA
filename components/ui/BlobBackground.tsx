import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BlobBackgroundProps {
    children: React.ReactNode;
}

export default function BlobBackground({ children }: BlobBackgroundProps) {
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={styles.container}>
            {/* Base background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

            {/* Full screen gradient from top-right corner */}
            <LinearGradient
                colors={isDarkMode
                    ? ['rgba(14, 111, 106, 0.15)', 'transparent', 'transparent']
                    : ['rgba(47, 125, 50, 0.08)', 'transparent', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0.5 }}
            />

            {/* Full screen gradient from left side */}
            <LinearGradient
                colors={isDarkMode
                    ? ['rgba(14, 111, 106, 0.1)', 'transparent', 'transparent']
                    : ['rgba(47, 125, 50, 0.05)', 'transparent', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.4 }}
                end={{ x: 0.5, y: 0.6 }}
            />

            {/* Full screen gradient from bottom */}
            <LinearGradient
                colors={isDarkMode
                    ? ['transparent', 'transparent', 'rgba(14, 111, 106, 0.12)']
                    : ['transparent', 'transparent', 'rgba(47, 125, 50, 0.06)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Subtle center ambient */}
            <LinearGradient
                colors={isDarkMode
                    ? ['transparent', 'rgba(14, 111, 106, 0.05)', 'transparent']
                    : ['transparent', 'rgba(47, 125, 50, 0.02)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0.3 }}
                end={{ x: 0.5, y: 0.7 }}
            />

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    content: {
        flex: 1,
    },
});

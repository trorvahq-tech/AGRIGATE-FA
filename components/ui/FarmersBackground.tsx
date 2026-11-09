import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function FarmersBackground() {
    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base White Layer */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />

            {/* Colored Circles Container */}
            <View style={StyleSheet.absoluteFill}>
                {/* 1. Teal blur (top-left) */}
                <View
                    style={{
                        position: 'absolute',
                        width: 144,
                        height: 144,
                        borderRadius: 72,
                        backgroundColor: 'rgba(14, 111, 106, 0.49)',
                        opacity: 1,
                        left: -10,
                        top: 0,
                    }}
                />

                {/* 2. Teal blur (middle-left) */}
                <View
                    style={{
                        position: 'absolute',
                        width: 144,
                        height: 144,
                        borderRadius: 72,
                        backgroundColor: 'rgba(14, 111, 106, 0.49)',
                        opacity: 0.6,
                        left: -52,
                        top: 200,
                    }}
                />

                {/* 3. Beige blur (upper-center) */}
                <View
                    style={{
                        position: 'absolute',
                        width: 144,
                        height: 143,
                        borderRadius: 72,
                        backgroundColor: '#C9B79C',
                        opacity: 1,
                        left: 120,
                        top: 73,
                    }}
                />

                {/* 4. Beige blur (center) */}
                <View
                    style={{
                        position: 'absolute',
                        width: 144,
                        height: 143,
                        borderRadius: 72,
                        backgroundColor: '#C9B79C',
                        opacity: 0.6,
                        left: 120,
                        top: 150,
                    }}
                />

                {/* 5. Green blur (bottom-center) */}
                <View
                    style={{
                        position: 'absolute',
                        width: 144,
                        height: 143,
                        borderRadius: 72,
                        backgroundColor: '#2F7D32',
                        opacity: 0.6,
                        left: 107,
                        top: 200,
                    }}
                />

                {/* 6. Green blur (top-right) */}
                <View
                    style={{
                        position: 'absolute',
                        width: 144,
                        height: 143,
                        borderRadius: 72,
                        backgroundColor: '#2F7D32',
                        opacity: 1,
                        left: 200,
                        top: -80,
                    }}
                />

                {/* 7. Green blur (center-right) */}
                <View
                    style={{
                        position: 'absolute',
                        width: 144,
                        height: 143,
                        borderRadius: 72,
                        backgroundColor: '#2F7D32',
                        opacity: 0.6,
                        left: 200,
                        top: 200,
                    }}
                />
            </View>

            {/* Blur Overlay - blurs the colored circles */}
            <BlurView
                style={StyleSheet.absoluteFill}
                intensity={80}
                tint="light"
            />
        </View>
    );
}

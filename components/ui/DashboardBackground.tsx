import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, Filter } from 'react-native-svg';

export default function DashboardBackground() {
    return (
        <View style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: 0.1 }]} />
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <Filter id="blur200">
                        <FeGaussianBlur in="SourceGraphic" stdDeviation="100" />
                    </Filter>
                </Defs>

                {/* 1. Green Blob (#2F7D32) */}
                <Circle
                    cx="0"
                    cy="80"
                    r="120"
                    fill="#2F7D32"
                    opacity="0.6"
                    filter="url(#blur200)"
                />

                {/* 2. Teal Blob (#0E6F6A7D) */}
                <Circle
                    cx="100%"
                    cy="200"
                    r="120"
                    fill="#0E6F6A"
                    fillOpacity="0.49"
                    opacity="0.8"
                    filter="url(#blur200)"
                />
            </Svg>
        </View>
    );
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, Filter } from 'react-native-svg';

export default function FarmersTabBackground() {
    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base White Layer */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />

            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <Filter id="blur100">
                        <FeGaussianBlur in="SourceGraphic" stdDeviation="50" />
                    </Filter>
                    <Filter id="blur75">
                        <FeGaussianBlur in="SourceGraphic" stdDeviation="37.5" />
                    </Filter>
                </Defs>

                {/* 1. Teal blur (top-left) 
                    left: -10px, top: 0px, w: 144, h: 144 -> cx: 62, cy: 72 
                    bg: rgba(14, 111, 106, 0.49), opacity: 1 (layer) -> fillOpacity: 0.49
                */}
                <Circle
                    cx="62"
                    cy="72"
                    r="72"
                    fill="#0E6F6A"
                    fillOpacity="0.49"
                    opacity="1"
                    filter="url(#blur100)"
                />

                {/* 2. Teal blur (middle-left) 
                    left: -52px, top: 200px -> cx: 20, cy: 272
                    opacity: 0.6
                */}
                <Circle
                    cx="20"
                    cy="272"
                    r="72"
                    fill="#0E6F6A"
                    fillOpacity="0.49"
                    opacity="0.6"
                    filter="url(#blur100)"
                />

                {/* 3. Beige blur (upper-center) 
                    left: 120px, top: 73px -> cx: 192, cy: 145 (rounded)
                    bg: #C9B79C, opacity: 1
                */}
                <Circle
                    cx="192"
                    cy="145"
                    r="72"
                    fill="#C9B79C"
                    opacity="1"
                    filter="url(#blur75)"
                />

                {/* 4. Beige blur (center) 
                    left: 120px, top: 150px -> cx: 192, cy: 222
                    opacity: 0.6
                */}
                <Circle
                    cx="192"
                    cy="222"
                    r="72"
                    fill="#C9B79C"
                    opacity="0.6"
                    filter="url(#blur75)"
                />

                {/* 5. Green blur (bottom-center) 
                    left: 107px, top: 200px -> cx: 179, cy: 272
                    bg: #2F7D32, opacity: 0.6
                */}
                <Circle
                    cx="179"
                    cy="272"
                    r="72"
                    fill="#2F7D32"
                    opacity="0.6"
                    filter="url(#blur100)"
                />

                {/* 6. Green blur (top-right) 
                    left: 200px, top: -80px -> cx: 272, cy: -8
                    bg: #2F7D32, opacity: 1
                */}
                <Circle
                    cx="272"
                    cy="-8"
                    r="72"
                    fill="#2F7D32"
                    opacity="1"
                    filter="url(#blur100)"
                />

                {/* 7. Green blur (center-right) 
                    left: 200px, top: 200px -> cx: 272, cy: 272
                    bg: #2F7D32, opacity: 0.6
                */}
                <Circle
                    cx="272"
                    cy="272"
                    r="72"
                    fill="#2F7D32"
                    opacity="0.6"
                    filter="url(#blur100)"
                />
            </Svg>
        </View>
    );
}

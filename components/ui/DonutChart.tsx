import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface DonutDataItem {
    value: number;
    color: string;
}

export interface DonutChartProps {
    data: DonutDataItem[];
    size?: number;
    strokeWidth?: number;
    centerLabel?: React.ReactNode;
    centerSubLabel?: React.ReactNode;
}

export default function DonutChart({
    data,
    size = 120,
    strokeWidth = 14,
    centerLabel,
    centerSubLabel,
}: DonutChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    let currentAngle = 0;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#F3F4F6"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {data.map((item, index) => {
                        if (total === 0 || item.value === 0) return null;
                        const segmentPercent = item.value / total;
                        const segmentAngle = segmentPercent * 360;
                        const strokeLength = segmentPercent * circumference;

                        const gap = data.filter(d => d.value > 0).length > 1 ? 4 : 0;
                        const finalStrokeLength = Math.max(0, strokeLength - gap);
                        const dashArray = `${finalStrokeLength} ${circumference}`;

                        const circleRotation = currentAngle;
                        currentAngle += segmentAngle;

                        return (
                            <Circle
                                key={index}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={dashArray}
                                strokeLinecap="round"
                                rotation={circleRotation}
                                origin={`${size / 2}, ${size / 2}`}
                            />
                        );
                    })}
                </G>
            </Svg>
            {(centerLabel || centerSubLabel) && (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    {centerLabel && (
                        <Text style={{
                            fontSize: size * 0.18,
                            fontWeight: '800',
                            color: '#1F2937',
                            marginBottom: -size * 0.02
                        }}>
                            {centerLabel}
                        </Text>
                    )}
                    {centerSubLabel && (
                        <Text style={{
                            fontSize: size * 0.08,
                            fontWeight: '600',
                            color: '#6B7280',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            {centerSubLabel}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

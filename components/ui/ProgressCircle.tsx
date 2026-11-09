import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressCircleProps {
    progress: number; // 0 to 1
    size?: number;
    strokeWidth?: number;
    progressColor?: string;
    showBackground?: boolean;
    backgroundColor?: string;
    children?: React.ReactNode;
}

export default function ProgressCircle({
    progress,
    size = 64,
    strokeWidth = 1,
    progressColor = '#FFFFFF',
    showBackground = false,
    backgroundColor = 'transparent',
    children,
}: ProgressCircleProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                {/* Background circle - only show if explicitly enabled */}
                {showBackground && (
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={backgroundColor}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                )}
                {/* Progress arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={progressColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="360"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            {children}
        </View>
    );
}

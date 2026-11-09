import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function FarmerDetailsBackground() {
    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base White Layer */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />

        </View>
    );
}

import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface CustomBackNavBarProps {
    title: string;
    onBackPress?: () => void;
    backgroundColor?: string;
    textColor?: string;
    blurIntensity?: number;
    backButtonBackgroundColor?: string;
    iconColor?: string;
    onSaveDraft?: () => void;
    showDraftButton?: boolean;
    onRightPress?: () => void;
    rightIcon?: React.ReactNode;
    rightButtonBackgroundColor?: string;
}

export default function CustomBackNavBar({
    title,
    onBackPress,
    backgroundColor = '#FFFFFF',
    textColor = '#0A0C11B2',
    blurIntensity = 10,
    backButtonBackgroundColor = '#FFFFFF',
    iconColor,
    onSaveDraft,
    showDraftButton,
    onRightPress,
    rightIcon,
    rightButtonBackgroundColor
}: CustomBackNavBarProps) {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(agent)');
        }
    };

    const finalIconColor = iconColor || textColor;
    const finalBackButtonBg = isDarkMode ? colors.card : backButtonBackgroundColor;
    const finalTextColor = isDarkMode ? colors.textSecondary : textColor;
    const finalBgColor = isDarkMode ? colors.navbarBackground : backgroundColor;

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={[styles.shadowContainer, { backgroundColor: 'transparent', shadowColor: isDarkMode ? '#FFFFFF' : '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDarkMode ? 0.15 : 0.4, shadowRadius: 8, elevation: 20 }]}>
                <View style={[styles.container, { backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.01)' : finalBgColor }]}>
                    <BlurView
                        intensity={Platform.OS === 'android' ? 80 : blurIntensity}
                        tint={colors.blurTint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.6)' }]}
                    />
                    <View style={styles.navContent}>
                        <TouchableOpacity
                            onPress={handleBack}
                            style={[styles.backButton, { backgroundColor: finalBackButtonBg }]}
                        >
                            <Feather name="chevron-left" size={24} color={isDarkMode ? colors.textSecondary : finalIconColor} />
                        </TouchableOpacity>

                        <Text style={[styles.navTitle, { color: finalTextColor }]}>{title}</Text>

                        {onSaveDraft || showDraftButton ? (
                            <TouchableOpacity
                                onPress={onSaveDraft}
                                style={[styles.backButton, { backgroundColor: rightButtonBackgroundColor || finalBackButtonBg }]}
                                activeOpacity={0.7}
                                accessibilityLabel="Save Draft"
                            >
                                <Ionicons name="bookmark-outline" size={20} color={finalIconColor || '#0E6F6A'} />
                            </TouchableOpacity>
                        ) : onRightPress ? (
                            <TouchableOpacity
                                onPress={onRightPress}
                                style={[styles.backButton, { backgroundColor: rightButtonBackgroundColor || finalBackButtonBg }]}
                                activeOpacity={0.7}
                            >
                                {rightIcon || <Feather name="more-vertical" size={20} color={finalIconColor} />}
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 40 }} />
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        zIndex: 10,
        width: '100%',
    },
    shadowContainer: {
        width: width * 0.95,
        height: 62,
        marginTop: 10,
        borderRadius: 16,
        // Standard Shadow Props
        shadowColor: '#00000033',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 8,
        backgroundColor: 'transparent',
    },
    container: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    navContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

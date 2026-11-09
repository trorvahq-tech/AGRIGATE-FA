import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [crashReports, setCrashReports] = useState(true);

    const navigateToLegal = (title: string) => {
        router.push({ pathname: '/legal', params: { title } });
    };

    const switchTrackColor = { false: isDarkMode ? colors.cardSecondary : "white", true: isDarkMode ? colors.cardSecondary : "white" };

    const renderSwitch = (value: boolean, setValue: (val: boolean) => void) => (
        <View style={styles.switchWrapper}>
            <Switch
                trackColor={switchTrackColor}
                thumbColor={value ? "#0E6F6A" : "#A3A3A3"}
                ios_backgroundColor={isDarkMode ? colors.cardSecondary : "white"}
                onValueChange={setValue}
                className='shadow-sm'
                value={value}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} />

            <CustomBackNavBar title="About" onBackPress={() => router.replace("/(agent)/settings")} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} className='!py-1'>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.text }]}>Version</Text>
                            <Text style={[styles.value, { color: colors.textMuted }]}>1.01</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.text }]}>Build</Text>
                            <Text style={[styles.value, { color: colors.textMuted }]}>5</Text>
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} className='!py-3'>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Get help</Text>

                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.text }]}>Send crash reports</Text>
                            {renderSwitch(crashReports, setCrashReports)}
                        </View>
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                            {"Automatically send crash reports to AgriGATE's service provider"}
                        </Text>

                        <TouchableOpacity style={[styles.row, { marginTop: 12 }]} onPress={() => router.push('/(agent)/helpCenter')}>
                            <Text style={[styles.label, { color: colors.text }]}>Help Center</Text>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} className='!py-3'>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Legal</Text>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Terms of service')}>
                            <Text style={[styles.label, { color: colors.text }]}>Terms of service</Text>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Privacy policy')}>
                            <Text style={[styles.label, { color: colors.text }]}>Privacy policy</Text>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Cookie use')}>
                            <Text style={[styles.label, { color: colors.text }]}>Cookie use</Text>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Legal notices')}>
                            <Text style={[styles.label, { color: colors.text }]}>Legal notices</Text>
                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.copyright, { color: colors.textMuted }]}>Copyright 2025</Text>

                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Keep default, overridden by inline style
    },

    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white', // Keep default, overridden by inline style
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 12,
        paddingBottom: 40,
        gap: 16,
    },
    card: {
        backgroundColor: '#FFFFFF', // Keep default, overridden by inline style
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5', // Likely unused but should be theme aware if used
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0A0C11E5', // Keep default, overridden by inline style
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0A0C1199', // Keep default, overridden by inline style
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0A0C11E5', // Keep default, overridden by inline style
        marginBottom: 4,
    },
    helperText: {
        fontSize: 14,
        color: '#0A0C11E5', // Keep default, overridden by inline style
        marginTop: -8,
        marginBottom: 4,
        lineHeight: 18,
    },
    copyright: {
        textAlign: 'center',
        fontSize: 16,
        color: '#0A0C1199', // Keep default, overridden by inline style
        marginTop: 5,
    },
    switchWrapper: {

        overflow: 'hidden',
        padding: 2,
        backgroundColor: 'transparent',
    },
});

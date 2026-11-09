import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [crashReports, setCrashReports] = useState(true);

    const navigateToLegal = (title: string) => {
        router.push({ pathname: '/(operators)/legal' as any, params: { title } });
    };

    const switchTrackColor = { false: colors.textMuted, true: colors.primary };

    const renderSwitch = (value: boolean, setValue: (val: boolean) => void) => (
        <View style={styles.switchWrapper}>
            <Switch
                trackColor={switchTrackColor}
                thumbColor={value ? "#ffffff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
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

            <CustomBackNavBar title="About" onBackPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(operators)/settings");
            }} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.card, { backgroundColor: colors.card }]} className='!py-1'>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.text }]}>Version</Text>
                            <Text style={[styles.value, { color: colors.textMuted }]}>1.01</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.text }]}>Build</Text>
                            <Text style={[styles.value, { color: colors.textMuted }]}>5</Text>
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card }]} className='!py-3'>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Get help</Text>

                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.text }]}>Send crash reports</Text>
                            {renderSwitch(crashReports, setCrashReports)}
                        </View>
                        <Text style={[styles.helperText, { color: colors.textMuted }]}>
                            {"Automatically send crash reports to AgriGATE's service provider"}
                        </Text>

                        <TouchableOpacity style={[styles.row, { marginTop: 12 }]} onPress={() => Alert.alert('Help Center', 'For operator support, please contact operations@agrigate.io')}>
                            <Text style={[styles.label, { color: colors.text }]}>Help Center</Text>
                            <Feather name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card }]} className='!py-3'>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Legal</Text>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Terms of service')}>
                            <Text style={[styles.label, { color: colors.text }]}>Terms of service</Text>
                            <Feather name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Privacy policy')}>
                            <Text style={[styles.label, { color: colors.text }]}>Privacy policy</Text>
                            <Feather name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Cookie use')}>
                            <Text style={[styles.label, { color: colors.text }]}>Cookie use</Text>
                            <Feather name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.row} onPress={() => navigateToLegal('Legal notices')}>
                            <Text style={[styles.label, { color: colors.text }]}>Legal notices</Text>
                            <Feather name="chevron-right" size={20} color={colors.textMuted} />
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
        // backgroundColor: '#F5F5F5',
    },

    mainContainer: {
        flex: 1,
        marginTop: 135,
        marginHorizontal: 12,
        marginBottom: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        overflow: 'hidden',
        // backgroundColor: 'white',
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
        // backgroundColor: '#FFFFFF',
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
        borderBottomColor: '#F5F5F5',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        // color: '#0A0C11E5',
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        // color: '#0A0C1199',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '600',
        // color: '#0A0C11E5',
        marginBottom: 4,
    },
    helperText: {
        fontSize: 14,
        // color: '#0A0C11E5',
        marginTop: -8,
        marginBottom: 4,
        lineHeight: 18,
    },
    copyright: {
        textAlign: 'center',
        fontSize: 16,
        // color: '#0A0C1199',
        marginTop: 5,
    },
    switchWrapper: {

        overflow: 'hidden',
        padding: 2,
        backgroundColor: 'transparent',
    },
});

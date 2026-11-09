import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const DEVICES = [
    { id: '1', name: 'Windows', active: 'Last active today at 8:45 am', icon: 'monitor' },
    { id: '2', name: 'Windows', active: 'Last active today at 8:45 am', icon: 'monitor' },
    { id: '3', name: 'macOS', active: 'Last active today at 9:15 am', icon: 'monitor' }, // Feather doesn't have specific OS icons, using monitor/smartphone
    { id: '4', name: 'Linux', active: 'Last active today at 10:00 am', icon: 'monitor' },
];

export default function DevicesScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Devices" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.listContainer}>
                        {DEVICES.map((device) => (
                            <View key={device.id} style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.inputBackground }]}>
                                    <Feather name={device.icon as any} size={20} color={colors.textSecondary} />
                                </View>
                                <View style={styles.deviceInfo}>
                                    <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                                    <Text style={[styles.deviceActive, { color: colors.textMuted }]}>{device.active}</Text>
                                </View>
                            </View>
                        ))}
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
        backgroundColor: '#F5F5F5', // Overridden
    },
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 20,
        backgroundColor: 'white', // Overridden
        borderRadius: 16,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 16,
        flexGrow: 1,
    },
    listContainer: {
        gap: 12,
        marginBottom: 24,
    },
    deviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        gap: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F9FAFB', // Overridden
        alignItems: 'center',
        justifyContent: 'center',
    },
    deviceInfo: {
        flex: 1,
        gap: 4,
    },
    deviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11', // Overridden
    },
    deviceActive: {
        fontSize: 12,
        color: '#0A0C1199', // Overridden
    },
    copyright: {
        textAlign: 'center',
        fontSize: 16,
        color: '#0A0C1199', // Overridden
        // marginTop: 'auto',
        marginBottom: 8,
    },
});

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

export default function AccountStatusScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Account status" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Account Details */}
                    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Account details</Text>

                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Account type</Text>
                            <Text style={[styles.value, { color: colors.text }]}>Field agent</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>User ID</Text>
                            <Text style={[styles.value, { color: colors.text }]}>FA - 10234</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Status</Text>
                            <Text style={[styles.value, { color: colors.text }]}>Active</Text>
                        </View>
                    </View>

                    {/* Login Activity */}
                    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Login activity</Text>

                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Last login</Text>
                            <Text style={[styles.value, { color: colors.text }]}>Today, 10:42 am</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Last login location</Text>
                            <Text style={[styles.value, { color: colors.text }]}>Ibadan, Nigeria</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Device</Text>
                            <Text style={[styles.value, { color: colors.text }]}>Andriod- Samsung A32</Text>
                        </View>
                    </View>

                    {/* Security */}
                    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Security</Text>

                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textMuted }]}>Password last changed</Text>
                            <Text style={[styles.value, { fontWeight: '600', color: colors.text }]}>14 days ago</Text>
                        </View>
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
        gap: 16,
        flexGrow: 1,
    },
    sectionCard: {
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        gap: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11', // Overridden
        marginBottom: 4,
    },
    row: {
        gap: 4,
    },
    label: {
        fontSize: 12,
        color: '#0A0C1199', // Overridden
    },
    value: {
        fontSize: 14,
        color: '#0A0C11', // Overridden
        fontWeight: '500',
    },
    copyright: {
        textAlign: 'center',
        fontSize: 16,
        color: '#0A0C1199', // Overridden
        // marginTop: 'auto',
        marginBottom: 8,
    },
});

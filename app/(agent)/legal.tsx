import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LegalScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { title } = useLocalSearchParams();
    const screenTitle = typeof title === 'string' ? title : 'Legal';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} />

            <CustomBackNavBar title={screenTitle} onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/about')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} className=''>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{screenTitle}</Text>
                        <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                            {"Automatically send crash reports to AgriGATE's service provider"}
                        </Text>
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
        // Background color handled inline
    },
    // deleted styles

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
        backgroundColor: 'white', // Overridden
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
        backgroundColor: '#FFFFFF', // Overridden
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000', // Override based on mode
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,

    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0A0C11E5', // Overridden
        marginBottom: 12,
    },
    placeholderText: {
        fontSize: 14,
        color: '#0A0C1199', // Overridden
        lineHeight: 20,
    },
    copyright: {
        textAlign: 'center',
        fontSize: 16,
        color: '#0A0C1199', // Overridden
        marginTop: 5,
    },
});

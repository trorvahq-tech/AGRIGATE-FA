import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

export default function FeedbackScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Feedback" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={styles.contentWrapper}
                >
                    <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Feedback</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                            placeholder="Type your feedback here..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            textAlignVertical="top"
                        />

                        <TouchableOpacity style={styles.submitButton} onPress={() => router.replace('/(agent)/settings')}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.copyright, { color: colors.textMuted }]}>Copyright 2025</Text>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background color handled inline
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
    contentWrapper: {
        flex: 1,
        padding: 16,
    },
    formCard: {
        // flex: 1,
        height: 400,
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        gap: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#0A0C11B2', // Overridden
    },
    textArea: {
        flex: 1, // fill remaining space
        backgroundColor: '#F9FAFB', // Overridden
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#0A0C11', // Overridden
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
    },
    submitButton: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    copyright: {
        textAlign: 'center',
        fontSize: 16,
        color: '#0A0C1199', // Overridden
        marginTop: 16,
    },
});

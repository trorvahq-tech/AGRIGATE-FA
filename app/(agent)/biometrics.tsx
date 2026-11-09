import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';

export default function BiometricsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [fingerprintEnabled, setFingerprintEnabled] = useState(true);
    const [faceIdEnabled, setFaceIdEnabled] = useState(true);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const switchTrackColor = { false: isDarkMode ? colors.cardSecondary : "white", true: isDarkMode ? colors.cardSecondary : "white" };

    const renderSwitch = (value: boolean, setValue: (val: boolean) => void) => (
        <View style={styles.switchWrapper}>
            <Switch
                trackColor={switchTrackColor}
                thumbColor={value ? "#0E6F6A" : "#A3A3A3"}
                ios_backgroundColor={isDarkMode ? colors.cardSecondary : "white"}
                className='shadow-sm'
                onValueChange={setValue}
                value={value}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
        </View>
    );

    const handleDone = () => {
        setShowSuccessToast(true);
        // Navigate back after delay
        setTimeout(() => {
            setShowSuccessToast(false);
            router.replace('/(agent)/settings');
        }, 2000);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Biometrics" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <View style={styles.contentWrapper}>
                    <Text style={[styles.description, { color: colors.text }]}>
                        For your security, please update your password.
                    </Text>

                    <View style={[styles.optionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.optionRow}>
                            <Text style={[styles.optionLabel, { color: colors.text }]}>Finger print for login</Text>
                            {renderSwitch(fingerprintEnabled, setFingerprintEnabled)}
                        </View>
                        <View style={styles.optionRow}>
                            <Text style={[styles.optionLabel, { color: colors.text }]}>Face ID for login</Text>
                            {renderSwitch(faceIdEnabled, setFaceIdEnabled)}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Success Toast */}
            <NotificationToast
                visible={showSuccessToast}
                onTimerEnd={() => setShowSuccessToast(false)}
                title="Saved"
                message="This may take a few moments."
                duration={2}
            />
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
    contentWrapper: {
        padding: 16,
        gap: 24,
    },
    description: {
        fontSize: 14,
        color: '#0A0C11', // Overridden
        lineHeight: 20,
    },
    optionsContainer: {
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
    optionLabel: {
        fontSize: 14,
        color: '#0A0C11', // Overridden
        fontWeight: '500',
    },
    switchWrapper: {
        padding: 2,
    },
    doneButton: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

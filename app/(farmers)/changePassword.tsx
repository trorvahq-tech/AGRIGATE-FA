import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const handleSave = () => {
        // Here you would add validation logic
        setShowSuccessToast(true);
        // Navigate back after delay
        setTimeout(() => {
            setShowSuccessToast(false);
            router.back();
        }, 3000);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Image source={require('../../assets/images/agentDashboardBg.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar
                title="Change Password"
                onBackPress={() => router.back()}
                textColor={colors.text}
                backButtonBackgroundColor={colors.backgroundSecondary}
                iconColor={colors.text} // Dark icon on white background
                backgroundColor={colors.glassBackground}
                blurIntensity={20}
            />

            <View
                style={{
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.05,
                    shadowRadius: 16,
                    elevation: 5,
                    flex: 1,
                    marginTop: 135,
                }}
                className="flex-1 w-[95%] mx-auto mt-5 mb-10 rounded-[16px] overflow-hidden"
            >
                {/* Background Gradient */}
                <Image source={require('../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                <BlurView
                    intensity={isDarkMode ? 40 : 100}
                    tint={isDarkMode ? "dark" : "light"}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.3)' }]}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.contentWrapper} showsVerticalScrollIndicator={false}>

                    <Text style={[styles.description, { color: colors.text }]}>
                        For your security, please update your password.
                    </Text>

                    {/* Guidelines Container */}
                    <View style={[styles.guidelinesContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.guidelinesTitle, { color: colors.textMuted }]}>Password Guidelines</Text>
                        <View style={styles.guidelinesList}>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>At least one uppercase</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>Must be at least 8 characters</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>Include one number</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>Do not reuse your previous password</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>Avoid using your name or ID</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>At least one lowercase</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>At least one special character</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textMuted }]} /><Text style={[styles.bulletText, { color: colors.textMuted }]}>At least one symbol</Text></View>
                        </View>
                    </View>

                    {/* Input Fields */}
                    <View style={styles.inputsWrapper}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Password</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Input new password"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!isPasswordVisible}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                                    <Feather name={isPasswordVisible ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Confirm Password</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!isConfirmPasswordVisible}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                                    <Feather name={isConfirmPasswordVisible ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                </ScrollView>
                </KeyboardAvoidingView>
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Change Password</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Success Toast */}
            <NotificationToast
                visible={showSuccessToast}
                onTimerEnd={() => setShowSuccessToast(false)}
                title="Password changed successfully"
                message="You can now log in with your new password"
                duration={3}
            />
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassy bg
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)', // Glassy border
    },
    contentWrapper: {
        padding: 10, // Increased padding as requested "content enters container well"
        paddingTop: 24,
        gap: 24,
    },
    description: {
        fontSize: 16,
        color: '#0A0C11',
        lineHeight: 20,
    },
    guidelinesContainer: {
        // backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        paddingVertical: 24,
        borderWidth: 1,
        // borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    guidelinesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5B616D',
        marginBottom: 12,
    },
    guidelinesList: {
        gap: 8,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bullet: {
        width: 4,
        height: 4,
        borderRadius: 2,
        // backgroundColor: '#5B616D',
    },
    bulletText: {
        fontSize: 14,
        color: '#5B616D',
    },
    inputsWrapper: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 12,
        color: '#0A0C1199',
    },
    inputContainer: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        // borderColor: '#F3F4F6',
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#0A0C11',
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    footer: {
        padding: 16,
        paddingBottom: 24,
    },
    saveButton: {
        height: 52,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

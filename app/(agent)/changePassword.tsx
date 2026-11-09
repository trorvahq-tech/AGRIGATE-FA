import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';
import { useChangePassword } from '../../hooks/api/useAuth';
import { toast } from 'sonner-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const changePasswordMutation = useChangePassword();

    const handleSave = async () => {
        if (!password) {
            toast.error('Please enter a new password');
            return;
        }
        if (password.length < 10) {
            toast.error('Password must be at least 10 characters');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsSaving(true);
        try {
            await changePasswordMutation.mutateAsync({ newPassword: password });
            
            const userStr = await AsyncStorage.getItem('auth_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.mustChangePassword = false;
                await AsyncStorage.setItem('auth_user', JSON.stringify(user));
            }

            setShowSuccessToast(true);
            setTimeout(() => {
                setShowSuccessToast(false);
                router.replace('/(agent)');
            }, 3000);
        } catch (error: any) {
            const msg = error?.response?.data?.error || error?.message || 'Failed to change password';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Change Password" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                {/* Background Gradient */}
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

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
                    <View style={[styles.guidelinesContainer, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                        <Text style={[styles.guidelinesTitle, { color: colors.textSecondary }]}>Password Guidelines</Text>
                        <View style={styles.guidelinesList}>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>At least one uppercase</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>Must be at least 8 characters</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>Include one number</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>Do not reuse your previous password</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>Avoid using your name or ID</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>At least one lowercase</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>At least one special character</Text></View>
                            <View style={styles.bulletRow}><View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} /><Text style={[styles.bulletText, { color: colors.textSecondary }]}>At least one symbol</Text></View>
                        </View>
                    </View>

                    {/* Input Fields */}
                    <View style={styles.inputsWrapper}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Password</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Input new password"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!isPasswordVisible}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                                    <Feather name={isPasswordVisible ? "eye" : "eye-off"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Confirm Password</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!isConfirmPasswordVisible}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                                    <Feather name={isConfirmPasswordVisible ? "eye" : "eye-off"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Password</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Success Toast */}
            <NotificationToast
                visible={showSuccessToast}
                onTimerEnd={() => setShowSuccessToast(false)}
                title="Password Changed"
                message="This may take a few moments."
                duration={3}
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
        fontSize: 16,
        color: '#0A0C11', // Overridden
        lineHeight: 20,
    },
    guidelinesContainer: {
        backgroundColor: '#FFFFFF', // Overridden
        borderRadius: 12,
        padding: 16,
        paddingVertical: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        // Shadow if seen in design, usually guidelines are flat or outlined. Let's stick to outline as seen in image card-like look.
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
        backgroundColor: '#5B616D',
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
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#0A0C11', // Overridden
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    saveButton: {
        height: 52,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

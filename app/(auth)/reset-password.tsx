import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlobBackground from '../../components/ui/BlobBackground';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';

const LOGIN_IMAGE = require('../../assets/images/loginImage.png');

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const handleSavePassword = () => {
        // Handle save logic
        setShowSuccessToast(true);
    };

    const handleTimerEnd = () => {
        setShowSuccessToast(false);
        // Navigate back to login or home
        router.dismissAll();
        router.replace('/(auth)/login');
    };

    return (
        <BlobBackground>
            <StatusBar style={colors.statusBarStyle} hidden={false} />
            {/* Success Toast Overlay */}
            <NotificationToast
                visible={showSuccessToast}
                onTimerEnd={handleTimerEnd}
                title="Password reset successful"
                message="You can now log in with your new password"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                            {/* Header Image Section */}
                            <View className="p-[10px] w-full">
                                <View className="w-full h-[465px] relative rounded-[24px] overflow-hidden">
                                    <Image
                                        source={LOGIN_IMAGE}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={1000}
                                    />
                                    {/* Overlay Text */}
                                    <View className="absolute bottom-8 left-6 right-6">
                                        <Text className="text-white text-[32px] font-bold mb-2">Set a new password</Text>
                                        <Text className="text-white text-[14px] opacity-90">Use the credentials sent to you by your admin</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="px-6 pt-6 pb-10 gap-5">
                                {/* New Password */}
                                <View className="gap-[6px]">
                                    <Text style={{ color: colors.textMuted }} className="text-[12px] font-medium">New password</Text>
                                    <View className="relative w-full">
                                        <TextInput
                                            className="w-full h-[48px] rounded-[12px] px-4 pr-12 text-sm shadow-sm"
                                            placeholder="Enter your new password"
                                            placeholderTextColor={colors.textMuted}
                                            secureTextEntry={!showPassword}
                                            style={{ elevation: 2, shadowColor: isDarkMode ? 'transparent' : '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, backgroundColor: colors.inputBackground, color: colors.text }}
                                        />
                                        <Pressable
                                            onPress={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-0 bottom-0 justify-center"
                                        >
                                            <Ionicons
                                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={20}
                                                color={colors.textMuted}
                                            />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Confirm New Password */}
                                <View className="gap-[6px]">
                                    <Text style={{ color: colors.textMuted }} className="text-[12px] font-medium">Confirm New password</Text>
                                    <View className="relative w-full">
                                        <TextInput
                                            className="w-full h-[48px] rounded-[12px] px-4 pr-12 text-sm shadow-sm"
                                            placeholder="Confirm your new password"
                                            placeholderTextColor={colors.textMuted}
                                            secureTextEntry={!showConfirmPassword}
                                            style={{ elevation: 2, shadowColor: isDarkMode ? 'transparent' : '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, backgroundColor: colors.inputBackground, color: colors.text }}
                                        />
                                        <Pressable
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-0 bottom-0 justify-center"
                                        >
                                            <Ionicons
                                                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={20}
                                                color={colors.textMuted}
                                            />
                                        </Pressable>
                                    </View>
                                </View>

                                <Pressable
                                    className="w-full h-[48px] rounded-[16px] items-center justify-center mt-3"
                                    style={{ backgroundColor: colors.primary }}
                                    onPress={handleSavePassword}
                                >
                                    <Text className="text-white text-base font-semibold">Save new password</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </BlobBackground>
    );
}

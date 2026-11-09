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

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [showToast, setShowToast] = useState(false);

    const handleGetCode = () => {
        setShowToast(true);
    };

    const handleTimerEnd = () => {
        setShowToast(false);
        router.push('/(auth)/verification-code');
    };

    return (
        <BlobBackground>
            <StatusBar style={colors.statusBarStyle} hidden={false} />
            {/* Notification Toast Overlay */}
            <NotificationToast
                visible={showToast}
                onTimerEnd={handleTimerEnd}
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
                                        <Text className="text-white text-[32px] font-bold mb-2">Forgot password?</Text>
                                        <Text className="text-white text-[14px] opacity-90">Enter your phone number to get a reset code.</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="px-6 pt-6 pb-10 gap-5">
                                <View className="gap-[6px]">
                                    <Text style={{ color: colors.textMuted }} className="text-[12px] font-medium">Email address/ Phone number</Text>
                                    <TextInput
                                        className="w-full h-[48px] rounded-[12px] px-4 text-sm shadow-sm"
                                        placeholder="Enter your phone number or email"
                                        placeholderTextColor={colors.textMuted}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        style={{ elevation: 2, shadowColor: isDarkMode ? 'transparent' : '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, backgroundColor: colors.inputBackground, color: colors.text }}
                                    />
                                </View>

                                <Pressable
                                    className="w-full h-[48px] rounded-[16px] items-center justify-center mt-3"
                                    style={{ backgroundColor: colors.primary }}
                                    onPress={handleGetCode}
                                >
                                    <Text className="text-white text-base font-semibold">Get code</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </BlobBackground>
    );
}

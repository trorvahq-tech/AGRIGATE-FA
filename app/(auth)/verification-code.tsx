import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlobBackground from '../../components/ui/BlobBackground';
import { useTheme } from '../../context/ThemeContext';

const LOGIN_IMAGE = require('../../assets/images/loginImage.png');

export default function VerificationCodeScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputRefs = useRef<Array<any>>([]);

    const handleVerify = () => {
        // Handle verification logic
        console.log("Verify code pressed", otp.join(''));
        router.push('/(auth)/reset-password');
    };

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Move to next input if text is entered
        if (text && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
        // Move to previous input if backspace is pressed (handled in onKeyPress)
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <BlobBackground>
            <StatusBar style={colors.statusBarStyle} hidden={false} />
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
                                        <Text className="text-white text-[32px] font-bold mb-2">Enter Code</Text>
                                        <Text className="text-white text-[14px] opacity-90">Check your SMS on +2348000000000 for the reset code.</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="px-6 pt-6 pb-10 gap-5">
                                <View className="gap-[6px]">
                                    <Text style={{ color: colors.textMuted }} className="text-[12px] font-medium">Enter code</Text>
                                    {/* OTP Inputs */}
                                    <View className="flex-row gap-4">
                                        {otp.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                                className="w-[64px] h-[64px] rounded-[12px] text-center text-2xl font-bold shadow-sm"
                                                maxLength={1}
                                                keyboardType="number-pad"
                                                value={digit}
                                                onChangeText={(text) => handleOtpChange(text, index)}
                                                onKeyPress={(e) => handleKeyPress(e, index)}
                                                style={{ elevation: 2, shadowColor: isDarkMode ? 'transparent' : '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, backgroundColor: colors.inputBackground, color: colors.text }}
                                            />
                                        ))}
                                    </View>
                                    {/* Resend Code */}
                                    <View className="flex-row self-end mt-2">
                                        <Text style={{ color: colors.textMuted }} className="text-[14px]">Didn't get code? </Text>
                                        <Pressable>
                                            <Text style={{ color: colors.primary }} className="font-semibold text-[14px]">Resend code</Text>
                                        </Pressable>
                                    </View>
                                </View>

                                <Pressable
                                    className="w-full h-[48px] rounded-[16px] items-center justify-center mt-3"
                                    style={{ backgroundColor: colors.primary }}
                                    onPress={handleVerify}
                                >
                                    <Text className="text-white text-base font-semibold">Verify code</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </BlobBackground>
    );
}

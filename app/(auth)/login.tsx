import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BlobBackground from '../../components/ui/BlobBackground';
import { useTheme } from '../../context/ThemeContext';
import { useLogin } from '../../hooks/api/useAuth';

const LOGIN_IMAGE = require('../../assets/images/loginImage.png');

export default function LoginScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { role } = useLocalSearchParams<{ role?: string }>();
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const loginMutation = useLogin();

    const handleLogin = async () => {
        const loginEmail = email.trim();
        if (!loginEmail) {
            toast.error('Please enter email or phone number');
            return;
        }
        if (!password) {
            toast.error('Password is required');
            return;
        }

        try {
            await loginMutation.mutateAsync({ email: loginEmail, password });
            toast.success('Login Successful');
        } catch (error: any) {
            const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to authenticate. Please verify your connection and try again.';
            toast.error(message);
        }
    };

    return (
        <BlobBackground>
            <StatusBar style={colors.statusBarStyle} hidden={false} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
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
                                        <Text className="text-white text-[40px] font-bold mb-2">Welcome Back</Text>
                                        <Text className="text-white text-[14px] opacity-90">Use the credentials sent to you by your admin</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Form Section */}
                            <View className="px-6 pt-6 pb-10 gap-5">
                                <View className="gap-[6px]">
                                    <Text style={{ color: colors.textMuted }} className="text-[12px] font-medium">Email address/ Phone number</Text>
                                    <TextInput
                                        className="w-full h-[48px] rounded-[12px] px-4 text-sm shadow-sm"
                                        placeholder="Enter your phone number or email"
                                        placeholderTextColor={colors.textMuted}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={setEmail}
                                        style={{ elevation: 2, shadowColor: isDarkMode ? 'transparent' : '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, backgroundColor: colors.inputBackground, color: colors.text }}
                                    />
                                </View>

                                <View className="gap-[6px]">
                                    <Text style={{ color: colors.textMuted }} className="text-[12px] font-medium">Password</Text>
                                    <View className="relative w-full">
                                        <TextInput
                                            className="w-full h-[48px] rounded-[12px] px-4 pr-12 text-sm shadow-sm"
                                            placeholder="Enter your password"
                                            placeholderTextColor={colors.textMuted}
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                            style={{ elevation: 2, shadowColor: isDarkMode ? 'transparent' : '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, backgroundColor: colors.inputBackground, color: colors.text }}
                                        />
                                        <Pressable
                                            onPress={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-0 bottom-0 justify-center"
                                        >
                                            <Ionicons
                                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={20}
                                                color={colors.textSecondary}
                                            />
                                        </Pressable>
                                    </View>
                                    <Pressable className="self-end mt-2" onPress={() => router.push('/(auth)/forgot-password')}>
                                        <Text style={{ color: colors.textMuted }} className="font-medium text-[14px]">Forgot Password?</Text>
                                    </Pressable>
                                </View>

                                <Pressable
                                    className="w-full h-[48px] rounded-[16px] items-center justify-center mt-3"
                                    style={{ backgroundColor: colors.primary, opacity: loginMutation.isPending ? 0.7 : 1 }}
                                    onPress={handleLogin}
                                    disabled={loginMutation.isPending}
                                >
                                    <Text className="text-white text-base font-semibold">
                                        {loginMutation.isPending ? 'Logging in...' : 'Login'}
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </BlobBackground>
    );
}

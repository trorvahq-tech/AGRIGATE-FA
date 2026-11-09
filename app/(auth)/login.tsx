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
const FA_LOGO = require('../../assets/images/fa_logo.png');
const VCM_LOGO = require('../../assets/images/vcm_logo.png');

export default function LoginScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { role } = useLocalSearchParams<{ role?: string }>();
    const [showPassword, setShowPassword] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<'fa' | 'vcm'>(role === 'vcm' ? 'vcm' : 'fa');

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
            await AsyncStorage.setItem('@selected_program', selectedProgram);
            await loginMutation.mutateAsync({ email: loginEmail, password });
            toast.success(`Login Successful as ${selectedProgram === 'vcm' ? 'VCM' : 'Field Agent'}`);
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
                            contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Header Image Section */}
                            <View className="p-[10px] w-full">
                                <View className="w-full h-[260px] relative rounded-[24px] overflow-hidden">
                                    <Image
                                        source={LOGIN_IMAGE}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={1000}
                                    />
                                    {/* Overlay Text */}
                                    <View className="absolute bottom-6 left-6 right-6">
                                        <Text className="text-white text-[32px] font-bold mb-1">Welcome Back</Text>
                                        <Text className="text-white text-[13px] opacity-90">Choose your program and log in to your portal</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Program Selection: FA vs VCM side-by-side */}
                            <View className="px-6 pt-3 pb-2">
                                <Text style={{ color: colors.textMuted }} className="text-[12px] font-semibold uppercase tracking-wider mb-2.5">
                                    Select Program
                                </Text>
                                <View className="flex-row gap-3">
                                    {/* Field Agent (FA) Option */}
                                    <Pressable
                                        onPress={() => setSelectedProgram('fa')}
                                        className="flex-1 rounded-[18px] p-3 items-center justify-between border-2 relative"
                                        style={{
                                            backgroundColor: selectedProgram === 'fa'
                                                ? (isDarkMode ? '#064e3b33' : '#f0fdf4')
                                                : (isDarkMode ? '#18181b' : '#ffffff'),
                                            borderColor: selectedProgram === 'fa'
                                                ? colors.primary
                                                : (isDarkMode ? '#27272a' : '#e4e4e7'),
                                            elevation: selectedProgram === 'fa' ? 3 : 1,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: selectedProgram === 'fa' ? 0.12 : 0.05,
                                            shadowRadius: 3,
                                        }}
                                    >
                                        {selectedProgram === 'fa' && (
                                            <View
                                                className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center z-10"
                                                style={{ backgroundColor: colors.primary }}
                                            >
                                                <Ionicons name="checkmark" size={12} color="#ffffff" />
                                            </View>
                                        )}
                                        <View className="w-full h-[52px] items-center justify-center">
                                            <Image
                                                source={FA_LOGO}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="contain"
                                            />
                                        </View>
                                        <Text
                                            className="text-[12px] font-bold mt-1 text-center"
                                            style={{ color: selectedProgram === 'fa' ? colors.primary : colors.text }}
                                            numberOfLines={1}
                                        >
                                            Field Agent (FA)
                                        </Text>
                                    </Pressable>

                                    {/* Value Chain Manager (VCM) Option */}
                                    <Pressable
                                        onPress={() => setSelectedProgram('vcm')}
                                        className="flex-1 rounded-[18px] p-3 items-center justify-between border-2 relative"
                                        style={{
                                            backgroundColor: selectedProgram === 'vcm'
                                                ? (isDarkMode ? '#064e3b33' : '#f0fdf4')
                                                : (isDarkMode ? '#18181b' : '#ffffff'),
                                            borderColor: selectedProgram === 'vcm'
                                                ? colors.primary
                                                : (isDarkMode ? '#27272a' : '#e4e4e7'),
                                            elevation: selectedProgram === 'vcm' ? 3 : 1,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: selectedProgram === 'vcm' ? 0.12 : 0.05,
                                            shadowRadius: 3,
                                        }}
                                    >
                                        {selectedProgram === 'vcm' && (
                                            <View
                                                className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center z-10"
                                                style={{ backgroundColor: colors.primary }}
                                            >
                                                <Ionicons name="checkmark" size={12} color="#ffffff" />
                                            </View>
                                        )}
                                        <View className="w-full h-[52px] items-center justify-center">
                                            <Image
                                                source={VCM_LOGO}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="contain"
                                            />
                                        </View>
                                        <Text
                                            className="text-[12px] font-bold mt-1 text-center"
                                            style={{ color: selectedProgram === 'vcm' ? colors.primary : colors.text }}
                                            numberOfLines={1}
                                        >
                                            Value Chain (VCM)
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Form Section */}
                            <View className="px-6 pt-3 pb-8 gap-4">
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
                                        {loginMutation.isPending ? 'Logging in...' : `Log In as ${selectedProgram === 'vcm' ? 'VCM' : 'Field Agent'}`}
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

import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import SecureAccountModal from '../../components/SecureAccountModal';
import CustomNavBar from '../../components/ui/CustomNavBar';

import { useTheme } from '../../context/ThemeContext';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const FARMER_ICON = require('../../assets/images/farmerWithFork.png');

export default function FarmerHomeScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [isSecureModalVisible, setIsSecureModalVisible] = useState(true);

    const handleNavigateToChangePassword = () => {
        setIsSecureModalVisible(false); // Close modal when navigating
        router.push('/(farmers)/changePassword' as any);
    };
    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            <SecureAccountModal
                visible={isSecureModalVisible}
                onClose={() => setIsSecureModalVisible(false)}
                onChangePassword={handleNavigateToChangePassword}
            />

            <Image
                source={DASHBOARD_BG}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />

            <CustomNavBar textColor={colors.text} />


            <View className="flex-1 pt-[150px] pb-[90px]">


                <View className="px-5">
                    <Text className="text-[48px] font-bold mt-5 leading-tight" style={{ color: "white" }}>Overview</Text>
                    <Text className="text-base" style={{ color: "white" }}>Here's your day at a glance</Text>
                </View>


                <View
                    style={{
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.05,
                        shadowRadius: 16,
                        elevation: 5,
                    }}
                    className="flex-1 w-[95%] mx-auto mt-5 mb-10 rounded-[16px] overflow-hidden"
                >
                    {/* Background Gradient */}
                    <Image source={require('../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <BlurView
                        intensity={80}
                        tint={isDarkMode ? 'dark' : 'light'}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                    />

                    <View className="flex-1 p-3 ">

                        {/* Status Cards Row */}
                        <View className="flex-row justify-between mb-5">
                            {/* Card 1: Farms */}
                            <View className="w-[48%] h-[80px] rounded-[12px] overflow-hidden" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}>
                                <BlurView
                                    intensity={120}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                                />
                                <View className="flex-1">
                                    {/* Top Section */}
                                    <View className="h-[44px] flex-row items-center gap-1 px-3">
                                        <Image source={FARMER_ICON} style={{ width: 18, height: 18 }} />
                                        <Text className="text-[12px] font-medium" style={{ color: isDarkMode ? colors.text : '#0A0C11CC' }}>Farms</Text>
                                    </View>
                                    {/* Bottom Section (Interlapping) */}
                                    <View
                                        className="flex-1 justify-center px-3"
                                        style={{
                                            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
                                            borderTopLeftRadius: 12,
                                            borderTopRightRadius: 12,
                                            marginTop: -8,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: -2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 3,
                                            elevation: 3,
                                        }}
                                    >
                                        <Text className="text-xl font-bold" style={{ color: isDarkMode ? colors.text : '#0A0C11' }}>0</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Card 2: Activities */}
                            <View className="w-[48%] h-[80px] rounded-[12px] overflow-hidden" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}>
                                <BlurView
                                    intensity={120}
                                    tint={isDarkMode ? 'dark' : 'light'}
                                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                                />
                                <View className="flex-1">
                                    {/* Top Section */}
                                    <View className="h-[44px] flex-row items-center gap-1 px-3">
                                        <Image source={FARMER_ICON} style={{ width: 18, height: 18 }} />
                                        <Text className="text-[12px] font-medium" style={{ color: isDarkMode ? colors.text : '#0A0C11CC' }}>Unsynced</Text>
                                    </View>
                                    {/* Bottom Section (Interlapping) */}
                                    <View
                                        className="flex-1 justify-center px-3"
                                        style={{
                                            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
                                            borderTopLeftRadius: 12,
                                            borderTopRightRadius: 12,
                                            marginTop: -8,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: -2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 3,
                                            elevation: 3,
                                        }}
                                    >
                                        <Text className="text-xl font-bold" style={{ color: isDarkMode ? colors.text : '#0A0C11' }}>0</Text>
                                    </View>
                                </View>
                            </View>
                        </View>


                        {/* Recent Activities - Adjusted to fill remaining space properly */}
                        <View className="flex-1 rounded-[16px] p-4 overflow-hidden border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-base font-semibold" style={{ color: colors.text }}>Recent activities</Text>
                                <View className="flex-row items-center gap-1">
                                    <Text className="text-[#0E6F6A] text-[12px]">See More</Text>
                                    <Feather name="chevron-right" size={14} color="#0E6F6A" />
                                </View>
                            </View>

                            <View className="flex-1 items-center justify-center opacity-80">
                                <Text className="text-lg font-medium mb-2" style={{ color: colors.text }}>No activities recorded yet</Text>
                                <Text className="text-center text-sm px-6 leading-5" style={{ color: colors.textMuted }}>
                                    Activities you record on farms will appear here for easy tracking and reporting.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

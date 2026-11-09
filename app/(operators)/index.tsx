import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useTasks } from '../../hooks/api/useTasks';
import { useFarms } from '../../hooks/api/useFarms';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const FARMER_ICON = require('../../assets/images/farmerWithFork.png');

export interface OperatorTaskItem {
    id: string;
    name: string;
    machine: string;
    duration: string;
    status: string;
}

export interface OperatorRecentTaskItem {
    id: string;
    title: string;
    subtitle: string;
    time: string;
    status: string;
}

export default function OperatorHomeScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { data: apiTasks } = useTasks();
    const { data: apiFarms } = useFarms();

    const taskList = useMemo(() => {
        if (!apiTasks) return [];
        if (Array.isArray(apiTasks)) return apiTasks;
        if (Array.isArray((apiTasks as any).data)) return (apiTasks as any).data;
        return [];
    }, [apiTasks]);

    const todaysTasks: OperatorTaskItem[] = useMemo(() => {
        return taskList.slice(0, 5).map((t: any) => ({
            id: String(t.id),
            name: t.stageName || t.name || 'Field Activity',
            machine: t.metadata?.machine || t.machine || 'Assigned Equipment',
            duration: t.metadata?.duration || '1-2 hrs',
            status: t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Pending',
        }));
    }, [taskList]);

    const recentTasks: OperatorRecentTaskItem[] = useMemo(() => {
        return taskList.slice(0, 5).map((t: any) => ({
            id: String(t.id),
            title: t.stageName || t.name || 'Field Activity',
            subtitle: t.farmerName ? `Farmer: ${t.farmerName}` : (t.farmName || 'Field Operation'),
            time: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent',
            status: t.status === 'completed' ? 'Completed' : 'Pending',
        }));
    }, [taskList]);
    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <StatusBar style="light" hidden={false} />

            <Image
                source={DASHBOARD_BG}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />

            <CustomNavBar textColor="white" />


            <View className="flex-1 pt-[140px] pb-[90px]">


                <View className="px-5">
                    <Text className="text-[48px] font-bold text-white mt-5 leading-tight">Overview</Text>
                    <Text className="text-base text-white">Here's your day at a glance</Text>
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
                        tint="light"
                        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                    />

                    <View className="flex-1 p-3 ">

                        {/* Status Cards Row */}
                        <View className="flex-row justify-between mb-5">
                            {/* Card 1: Tasks */}
                            <View className="w-[32%] h-[80px] rounded-[12px] overflow-hidden bg-white/30">
                                <BlurView
                                    intensity={120}
                                    tint="light"
                                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                                />
                                <View className="flex-1">
                                    {/* Top Section */}
                                    <View className="h-[44px] flex-row items-center gap-1 px-3">
                                        <Image source={FARMER_ICON} style={{ width: 18, height: 18 }} />
                                        <Text className="text-[11px] text-[#0A0C11CC] font-medium">Today's Tasks</Text>
                                    </View>
                                    {/* Bottom Section (Interlapping) */}
                                    <View
                                        className="flex-1 bg-white/40 justify-center px-3"
                                        style={{
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
                                        <Text className="text-xl font-bold text-[#0A0C11]">{apiTasks?.total ?? taskList.length}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Card 2: Farms */}
                            <View className="w-[32%] h-[80px] rounded-[12px] overflow-hidden bg-white/30">
                                <BlurView
                                    intensity={120}
                                    tint="light"
                                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                                />
                                <View className="flex-1">
                                    {/* Top Section */}
                                    <View className="h-[44px] flex-row items-center gap-1 px-3">
                                        <Image source={FARMER_ICON} style={{ width: 18, height: 18 }} />
                                        <Text className="text-[11px] text-[#0A0C11CC] font-medium">Farms</Text>
                                    </View>
                                    {/* Bottom Section (Interlapping) */}
                                    <View
                                        className="flex-1 bg-white/40 justify-center px-3"
                                        style={{
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
                                        <Text className="text-xl font-bold text-[#0A0C11]">{apiFarms?.length || 0}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Card 3: Unsynced */}
                            <View className="w-[32%] h-[80px] rounded-[12px] overflow-hidden bg-white/30">
                                <BlurView
                                    intensity={120}
                                    tint="light"
                                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                                />
                                <View className="flex-1">
                                    {/* Top Section */}
                                    <View className="h-[44px] flex-row items-center gap-1 px-3">
                                        <Image source={FARMER_ICON} style={{ width: 18, height: 18 }} />
                                        <Text className="text-[11px] text-[#0A0C11CC] font-medium">Unsynced</Text>
                                    </View>
                                    {/* Bottom Section (Interlapping) */}
                                    <View
                                        className="flex-1 bg-white/40 justify-center px-3"
                                        style={{
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
                                        <Text className="text-xl font-bold text-[#0A0C11]">0</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row gap-3 mb-5 px-1">
                            <TouchableOpacity
                                className="flex-1 h-[48px] bg-background border-[#0E6F6A] border-1 border rounded-[16px] items-center justify-center shadow-sm"
                                onPress={() => router.push('/(operators)/report-issue' as any)}
                            >
                                <View className="flex-row items-center gap-1">
                                    <Text className="text-[#0E6F6A] font-semibold text-[16px]">+ Log machine issue</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Today's Task Section */}
                        <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-[16px] p-4 overflow-hidden border mb-3">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text style={{ color: colors.text }} className="text-base font-semibold">Today's Task</Text>
                            </View>

                            {/* Horizontal Scrolling Task Cards */}
                            {todaysTasks.length === 0 ? (
                                <View style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>No tasks assigned for today</Text>
                                </View>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 12 }}
                                >
                                    {todaysTasks.map((task: OperatorTaskItem) => (
                                        <TouchableOpacity
                                            key={task.id}
                                            style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
                                            onPress={() => router.push('/(operators)/taskDetails')}
                                        >
                                            {/* Pending Badge */}
                                            <View style={styles.pendingBadge}>
                                                <Text style={styles.pendingBadgeText}>{task.status}</Text>
                                            </View>

                                            {/* Task Name */}
                                            <Text style={[styles.taskName, { color: colors.text }]}>{task.name}</Text>

                                            {/* Machine */}
                                            <Text style={[styles.taskDetail, { color: colors.textMuted }]}>Machine: {task.machine}</Text>

                                            {/* Duration */}
                                            <Text style={[styles.taskDetail, { color: colors.textMuted }]}>Duration: {task.duration}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                        {/* Recent Activities - Adjusted to fill remaining space properly */}
                        <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-1 rounded-[16px] p-4 overflow-hidden border">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text style={{ color: colors.text }} className="text-base font-semibold">Recent Tasks</Text>
                                <View className="flex-row items-center gap-1">
                                    <Text className="text-[#0E6F6A] text-[12px]">See More</Text>
                                    <Feather name="chevron-right" size={14} color="#0E6F6A" />
                                </View>
                            </View>

                            <View className="gap-4">
                                {recentTasks.length === 0 ? (
                                    <View style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>No recent operator activities</Text>
                                    </View>
                                ) : (
                                    recentTasks.map((task: OperatorRecentTaskItem) => (
                                        <View key={task.id} style={[styles.recentTaskCard, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                            <View style={styles.recentTaskLeft}>
                                                <View style={[styles.recentTaskIconContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                                    <Image source={require('../../assets/images/crop.png')} style={styles.recentTaskIcon} contentFit="contain" />
                                                </View>
                                            <View>
                                                <Text style={[styles.recentTaskTitle, { color: colors.text }]}>{task.title}</Text>
                                                <Text style={[styles.recentTaskSubtitle, { color: colors.textMuted }]}>{task.subtitle}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.recentTaskRight}>
                                            <Text style={[styles.recentTaskTime, { color: colors.textMuted }]}>{task.time}</Text>
                                            <View style={[
                                                styles.statusBadgeBase,
                                                task.status === 'Completed' ? styles.completedBadge : styles.pendingBadgeRecent
                                            ]}>
                                                <Text style={[
                                                    styles.statusBadgeTextBase,
                                                    task.status === 'Completed' ? styles.completedBadgeText : styles.pendingBadgeTextRecent
                                                ]}>{task.status}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    taskCard: {
        width: 150,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        // borderWidth: 1,
        borderColor: '#E8E8E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    pendingBadge: {
        backgroundColor: '#86500614',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    pendingBadgeText: {
        color: '#865006',
        fontSize: 11,
        fontWeight: '600',
    },
    taskName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11',
        marginBottom: 6,
    },
    taskDetail: {
        fontSize: 11,
        color: '#0A0C11B2',
        marginBottom: 2,
    },
    recentTaskCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 2,
    },
    recentTaskLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    recentTaskIconContainer: {
        width: 36,
        height: 36,
        backgroundColor: 'white',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    recentTaskIcon: {
        width: 32,
        height: 32,
    },
    recentTaskTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11',
    },
    recentTaskSubtitle: {
        fontSize: 12,
        color: '#0A0C1199',
    },
    recentTaskRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    recentTaskTime: {
        fontSize: 10,
        color: '#0A0C1199',
    },
    statusBadgeBase: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusBadgeTextBase: {
        fontSize: 10,
        fontWeight: '600',
    },
    completedBadge: {
        backgroundColor: '#0041361A',
    },
    completedBadgeText: {
        color: '#004136',
        // paddingHorizontal: 10,
        // paddingVertical: 6,
        // borderRadius: 20,
        // alignSelf: 'flex-start',
        // marginBottom: 8,

    },
    pendingBadgeRecent: {
        backgroundColor: '#86500614',
    },
    pendingBadgeTextRecent: {
        color: '#865006',
    },
});

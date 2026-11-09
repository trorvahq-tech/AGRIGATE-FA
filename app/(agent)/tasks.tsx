import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const { width } = Dimensions.get('window');

import React, { useMemo, useState } from 'react';
import { useTasks } from '../../hooks/api/useTasks';
import { useFarmers } from '../../hooks/api/useFarmers';
import { useMe } from '../../hooks/api/useAuth';
import { format, isToday, isTomorrow, parseISO, isBefore } from '../../services/dateUtils';
import SyncDataModal from '../../components/ui/SyncDataModal';
import { useSyncStatus } from '../../services/syncService';

const isCallTask = (task: any) => {
    if (task.channel === 'call') return true;
    if (task.channel === 'visit') return false;
    const code = task.stageCode || task.stage_code || '';
    return ['PS-01', 'PS-02', 'PS-03', 'MS-01', 'LS-01', 'END-02', 'END-03', 'T1-01', 'T1-02', 'T2-01', 'T3-01'].some(c => code.startsWith(c)) ||
           /plan|seed|finance|supply|outcome|availability/i.test(task.stageName || task.stage_name || '');
};

const isVisitTask = (task: any) => {
    if (task.channel === 'visit') return true;
    if (task.channel === 'call') return false;
    const code = task.stageCode || task.stage_code || '';
    return ['PS-04', 'ES-01', 'ES-02', 'ES-03', 'MS-02', 'MS-03', 'MS-04', 'LS-02', 'END-01', 'T1-03', 'T1-04', 'T1-05', 'T1-06', 'T2-02', 'T2-03', 'T2-04', 'T2-05', 'T3-02', 'T3-03', 'T3-04', 'T3-05'].some(c => code.startsWith(c)) ||
           /location|land|planting|germination|application|practice|condition|harvest|storage|weeding/i.test(task.stageName || task.stage_name || '');
};

export default function TasksScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [showSyncModal, setShowSyncModal] = useState(false);
    const { lastSyncShort } = useSyncStatus();

    const { data: apiTasksData, isLoading: tasksLoading } = useTasks({ limit: 100 });
    const { data: apiFarmers } = useFarmers();
    const { data: meData } = useMe();

    const greetingName = useMemo(() => {
        return meData?.staff?.firstName || meData?.staff?.fullName?.split(' ')[0] || meData?.email?.split('@')[0] || 'Agent';
    }, [meData]);

    // Dynamically calculate dynamic counts and cards
    const stats = useMemo(() => {
        const tasks = apiTasksData?.data || [];
        
        let callCount = 0;
        let callOverdue = 0;
        
        let visitCount = 0;
        let visitToday = 0;
        
        let validationCount = 0;
        let validationToday = 0;
        
        let completedCount = 0;

        tasks.forEach((t: any) => {
            if (t.status === 'completed') {
                completedCount++;
                return;
            }

            const plannedDate = t.sclsPlannedDate ? parseISO(t.sclsPlannedDate) : null;
            const isOverdue = t.status === 'overdue' || (plannedDate && isBefore(plannedDate, new Date()) && !isToday(plannedDate));
            const isDueToday = plannedDate && isToday(plannedDate);

            if (t.status === 'awaiting_validation') {
                validationCount++;
                if (isDueToday) validationToday++;
            } else if (isCallTask(t)) {
                callCount++;
                if (isOverdue) callOverdue++;
            } else if (isVisitTask(t)) {
                visitCount++;
                if (isDueToday) visitToday++;
            }
        });

        return {
            callCount,
            callOverdue,
            visitCount,
            visitToday,
            validationCount,
            validationToday,
            completedCount
        };
    }, [apiTasksData]);

    const overdueTasks = useMemo(() => {
        const tasks = apiTasksData?.data || [];
        return tasks.filter((t: any) => {
            if (t.status === 'completed') return false;
            const plannedDate = t.sclsPlannedDate ? parseISO(t.sclsPlannedDate) : null;
            return t.status === 'overdue' || (plannedDate && isBefore(plannedDate, new Date()) && !isToday(plannedDate));
        }).map((t: any) => {
            const farmer = apiFarmers?.find((f: any) => f.id === t.farmerId);
            const initials = farmer ? (farmer.fullName || farmer.name || 'FR').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'FR';
            return {
                id: t.id,
                title: t.stageName || 'Task',
                subtitle: farmer ? (farmer.fullName || farmer.name) : 'Farmer',
                tagText: isCallTask(t) ? 'CALL' : 'VISIT',
                tagDate: t.sclsPlannedDate ? format(parseISO(t.sclsPlannedDate), 'MMM d, yyyy') : '—',
                badgeText: 'HIGH',
                btnText: isCallTask(t) ? 'Call' : 'Visit',
                initials,
                initialsBg: '#FEF2F2',
                iconColor: '#EF4444',
                icon: isCallTask(t) ? 'call' : 'eye',
            };
        });
    }, [apiTasksData, apiFarmers]);

    const todayTasks = useMemo(() => {
        const tasks = apiTasksData?.data || [];
        return tasks.filter((t: any) => {
            if (t.status === 'completed') return false;
            const plannedDate = t.sclsPlannedDate ? parseISO(t.sclsPlannedDate) : null;
            return plannedDate && isToday(plannedDate);
        }).map((t: any) => {
            const farmer = apiFarmers?.find((f: any) => f.id === t.farmerId);
            const initials = farmer ? (farmer.fullName || farmer.name || 'FR').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'FR';
            return {
                id: t.id,
                title: t.stageName || 'Task',
                subtitle: farmer ? (farmer.fullName || farmer.name) : 'Farmer',
                tagText: isCallTask(t) ? 'CALL' : 'VISIT',
                tagDate: 'Today',
                btnText: isCallTask(t) ? 'Call' : 'Visit',
                initials,
                initialsBg: '#FFF7ED',
                iconColor: '#F97316',
                icon: isCallTask(t) ? 'call' : 'eye',
                avatars: [1],
            };
        });
    }, [apiTasksData, apiFarmers]);

    const upcomingTasks = useMemo(() => {
        const tasks = apiTasksData?.data || [];
        return tasks.filter((t: any) => {
            if (t.status === 'completed') return false;
            const plannedDate = t.sclsPlannedDate ? parseISO(t.sclsPlannedDate) : null;
            return plannedDate && !isToday(plannedDate) && !isBefore(plannedDate, new Date());
        }).map((t: any) => {
            const farmer = apiFarmers?.find((f: any) => f.id === t.farmerId);
            const initials = farmer ? (farmer.fullName || farmer.name || 'FR').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'FR';
            return {
                id: t.id,
                title: t.stageName || 'Task',
                subtitle: farmer ? (farmer.fullName || farmer.name) : 'Farmer',
                tagText: isCallTask(t) ? 'CALL' : 'VISIT',
                tagDate: t.sclsPlannedDate ? format(parseISO(t.sclsPlannedDate), 'MMM d, yyyy') : '—',
                btnText: isCallTask(t) ? 'Call' : 'Visit',
                initials,
                initialsBg: '#EFF6FF',
                iconColor: '#3B82F6',
                icon: isCallTask(t) ? 'call' : 'eye',
                avatars: [1],
            };
        });
    }, [apiTasksData, apiFarmers]);


    const SUMMARY_CARDS = useMemo(() => [
        { title: 'Needs Call', route: '/needs-call', primaryCount: stats.callCount, primaryColor: '#EF4444', bgColor: '#FEF2F2', subtitle: `Overdue (${stats.callOverdue})`, icon: 'call', subtitleColor: '#EF4444' },
        { title: 'Needs Visit', route: '/needs-visit', primaryCount: stats.visitCount, primaryColor: '#F97316', bgColor: '#FFF7ED', subtitle: `Due today (${stats.visitToday})`, icon: 'eye', subtitleColor: '#F97316' },
        { title: 'Awaiting Validation', route: '/awaiting-validation', primaryCount: stats.validationCount, primaryColor: '#EAB308', bgColor: '#FEFCE8', subtitle: `Due today (${stats.validationToday})`, icon: 'time', subtitleColor: '#EAB308' },
        { title: 'Completed', route: null, primaryCount: stats.completedCount, primaryColor: '#22C55E', bgColor: '#F0FDF4', subtitle: 'This week', icon: 'checkmark-circle-outline', subtitleColor: '#22C55E' },
    ], [stats]);

    const handleTaskPress = (type: string) => {
        const normalizedType = type.toUpperCase();
        if (normalizedType === 'CALL') router.push('/(agent)/call-farmer');
        else if (normalizedType === 'VISIT') router.push('/(agent)/visit-farmer');
        else if (normalizedType === 'VALIDATE') router.push('/(agent)/task-awaiting-validation');
        else if (normalizedType === 'TRAINING') router.push('/(agent)/mtgTraining');
    };


    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" hidden={false} />

            <Image
                source={DASHBOARD_BG}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />

            <CustomBackNavBar 
                title="Tasks" 
                onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)' as any)} 
                textColor="white" 
                blurIntensity={Platform.OS === 'ios' ? 20 : 10} 
                backgroundColor="transparent"
                backButtonBackgroundColor="rgba(255,255,255,0.2)"
                iconColor="white"
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 155, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══════ GREETING HEADER ═══════ */}
                <View style={[styles.greetingRow, { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greetingText}>Hi {greetingName}</Text>
                        <Text style={styles.greetingSubtext}>Stay on track. Here are your tasks.</Text>
                    </View>
                    <TouchableOpacity style={styles.syncStatusTop} onPress={() => setShowSyncModal(true)}>
                        <Ionicons name="cloud-done-outline" size={14} color="#fff" />
                        <Text style={styles.syncStatusTopText}>Last sync: {lastSyncShort}</Text>
                        <Ionicons name="checkmark-circle" size={14} color="#86EFAC" />
                    </TouchableOpacity>
                </View>

                {/* ═══════ MAIN WHITE CONTAINER ═══════ */}
                <View style={styles.mainWhiteContainer}>

                    {/* Summary Cards */}
                    <View style={styles.summaryScroll}>
                        {SUMMARY_CARDS.map((card, idx) => (
                            <TouchableOpacity key={idx} style={styles.summaryCard} onPress={() => { if (card.route) router.push(card.route as any); }}>
                                <View style={styles.summaryIconCountRow}>
                                    <View style={[styles.summaryIconBg, { backgroundColor: card.bgColor }]}>
                                        <Ionicons name={card.icon as any} size={14} color={card.primaryColor} />
                                    </View>
                                    <Text style={[styles.summaryCount, { color: card.primaryColor }]}>{card.primaryCount}</Text>
                                </View>
                                <Text style={styles.summaryTitle}>{card.title}</Text>
                                <View style={styles.summaryFooter}>
                                    <Text style={[styles.summarySub, { color: card.subtitleColor }]}>{card.subtitle}</Text>
                                    <Feather name="chevron-right" size={10} color="#6B7280" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Filter Tabs Row */}
                    <View style={styles.filterTabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsScroll}>
                            <TouchableOpacity style={styles.filterTabActive}>
                                <Text style={styles.filterTabActiveText}>All Tasks (102)</Text>
                                <View style={styles.filterTabActiveIndicator} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterTab}>
                                <Text style={styles.filterTabText}>Overdue (23)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterTab}>
                                <Text style={styles.filterTabText}>Due Today (24)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterTab}>
                                <Text style={styles.filterTabText}>Upcoming (55)</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Highly Priority section */}
                    <View style={[styles.sectionContainer, styles.sectionRed]}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                                <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>HIGH PRIORITY <Text style={{ fontWeight: 'normal' }}>(Overdue)</Text></Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.sectionCountText, { color: '#EF4444' }]}>23 tasks</Text>
                                <Feather name="chevron-up" size={18} color="#6B7280" />
                            </View>
                        </View>
                        <View style={styles.sectionListWrapper}>
                            {overdueTasks.map((task: any, idx: number) => (
                                <TouchableOpacity 
                                    key={task.id} 
                                    style={[styles.taskRow, idx !== overdueTasks.length - 1 && styles.taskRowBorder]}
                                    onPress={() => handleTaskPress(task.tagText)}
                                >
                                    <View style={styles.taskAvatarCol}>
                                        <View style={[styles.taskInitialsBg, { backgroundColor: task.initialsBg }]}>
                                            <Text style={[styles.taskInitialsText, { color: task.iconColor }]}>{task.initials}</Text>
                                        </View>
                                        <Ionicons name="call" size={16} color={task.iconColor} style={styles.taskOverlapIcon} />
                                    </View>
                                    <View style={styles.taskContentCol}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                                        <View style={styles.taskTagRow}>
                                            <Text style={[styles.taskTagLabel, { color: task.iconColor }]}>{task.tagText}</Text>
                                            <Text style={styles.taskTagDate}>{task.tagDate}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.taskActionCol}>
                                        <Text style={[styles.taskBadge, { color: task.iconColor }]}>{task.badgeText}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <TouchableOpacity style={styles.taskActionBtn} onPress={() => handleTaskPress(task.tagText)}>
                                                <Text style={styles.taskActionBtnText}>{task.btnText}</Text>
                                            </TouchableOpacity>
                                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.viewAllRow}>
                                <Text style={[styles.viewAllText, { color: '#EF4444' }]}>View all overdue tasks</Text>
                                <Feather name="chevron-down" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Due Today section */}
                    <View style={[styles.sectionContainer, styles.sectionOrange]}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="time-outline" size={18} color="#F97316" />
                                <Text style={[styles.sectionTitle, { color: '#F97316' }]}>DUE TODAY</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.sectionCountText, { color: '#F97316' }]}>24 tasks</Text>
                                <Feather name="chevron-up" size={18} color="#6B7280" />
                            </View>
                        </View>
                        <View style={styles.sectionListWrapper}>
                            {todayTasks.map((task: any, idx: number) => (
                                <TouchableOpacity 
                                    key={task.id} 
                                    style={[styles.taskRow, idx !== todayTasks.length - 1 && styles.taskRowBorder]}
                                    onPress={() => handleTaskPress(task.tagText)}
                                >
                                    <View style={styles.taskAvatarCol}>
                                        <View style={[styles.taskInitialsBg, { backgroundColor: task.initialsBg }]}>
                                            <Text style={[styles.taskInitialsText, { color: task.iconColor }]}>{task.initials}</Text>
                                        </View>
                                        <Ionicons name={task.icon as any} size={16} color={task.iconColor} style={styles.taskOverlapIcon} />
                                    </View>
                                    <View style={styles.taskContentCol}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                                        <View style={styles.taskTagRow}>
                                            <Text style={[styles.taskTagLabel, { color: task.iconColor }]}>{task.tagText}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Ionicons name="time-outline" size={12} color="#6B7280" />
                                                <Text style={styles.taskTagDate}>{task.tagDate}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.taskActionCol}>
                                        <View style={styles.taskAvatarsWrap}>
                                            {task.avatars.map((a: any, i: number) => (
                                                <Image key={i} source={{ uri: `https://i.pravatar.cc/100?u=${task.id}${i}` }} style={[styles.multiAvatarItem, { marginLeft: i > 0 ? -10 : 0 }]} />
                                            ))}
                                            {task.moreCount && (
                                                <View style={[styles.multiAvatarMore, { marginLeft: -10 }]}>
                                                    <Text style={styles.multiAvatarMoreText}>{task.moreCount}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <TouchableOpacity style={styles.taskActionBtn} onPress={() => handleTaskPress(task.tagText)}>
                                                <Text style={styles.taskActionBtnText}>{task.btnText}</Text>
                                            </TouchableOpacity>
                                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.viewAllRow}>
                                <Text style={[styles.viewAllText, { color: '#F97316' }]}>View all due today tasks</Text>
                                <Feather name="chevron-down" size={16} color="#F97316" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Upcoming section */}
                    <View style={[styles.sectionContainer, styles.sectionBlue]}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                                <Text style={[styles.sectionTitle, { color: '#3B82F6' }]}>UPCOMING</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.sectionCountText, { color: '#3B82F6' }]}>55 tasks</Text>
                                <Feather name="chevron-up" size={18} color="#6B7280" />
                            </View>
                        </View>
                        <View style={styles.sectionListWrapper}>
                            {upcomingTasks.map((task: any, idx: number) => (
                                <TouchableOpacity 
                                    key={task.id} 
                                    style={[styles.taskRow, idx !== upcomingTasks.length - 1 && styles.taskRowBorder]}
                                    onPress={() => handleTaskPress(task.tagText)}
                                >
                                    <View style={styles.taskAvatarCol}>
                                        <View style={[styles.taskInitialsBg, { backgroundColor: task.initialsBg }]}>
                                            <Text style={[styles.taskInitialsText, { color: task.iconColor }]}>{task.initials}</Text>
                                        </View>
                                        <Ionicons name={task.icon as any} size={16} color={task.iconColor} style={styles.taskOverlapIcon} />
                                    </View>
                                    <View style={styles.taskContentCol}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                                        <View style={styles.taskTagRow}>
                                            <Text style={[styles.taskTagLabel, { color: task.iconColor }]}>{task.tagText}</Text>
                                            <Text style={styles.taskTagDate}>{task.tagDate}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.taskActionCol}>
                                        <View style={styles.taskAvatarsWrap}>
                                            {task.avatars.map((a: any, i: number) => (
                                                <Image key={i} source={{ uri: `https://i.pravatar.cc/100?u=${task.id}${i}` }} style={[styles.multiAvatarItem, { marginLeft: i > 0 ? -10 : 0 }]} />
                                            ))}
                                            {task.moreCount && (
                                                <View style={[styles.multiAvatarMore, { marginLeft: -10 }]}>
                                                    <Text style={styles.multiAvatarMoreText}>{task.moreCount}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <TouchableOpacity style={styles.taskActionBtn} onPress={() => handleTaskPress(task.tagText)}>
                                                <Text style={styles.taskActionBtnText}>{task.btnText}</Text>
                                            </TouchableOpacity>
                                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.viewAllRow}>
                                <Text style={[styles.viewAllText, { color: '#3B82F6' }]}>View all upcoming tasks</Text>
                                <Feather name="chevron-down" size={16} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </ScrollView>

            <SyncDataModal
                visible={showSyncModal}
                onClose={() => setShowSyncModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    // Greeting
    greetingRow: {
        marginBottom: 16,
        marginTop: 0,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        position: 'relative',
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    greetingText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    greetingSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500'
    },
    syncStatusTop: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(20, 60, 40, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    syncStatusTopText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600'
    },

    // Main Container
    mainWhiteContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 24,
        paddingBottom: 60,
        minHeight: Dimensions.get('window').height - 200,
    },

    summaryScroll: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    summaryCard: {
        width: '23.5%', // Slightly under 25% to account for gap
        height: 100, // Fixed height for uniformity
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 8,
        justifyContent: 'space-between', // Keeps elements evenly spaced vertically
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    summaryIconCountRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // allow stacking if needed
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryIconBg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryCount: {
        fontSize: 16, // reduced from 22
        fontWeight: '800',
    },
    summaryTitle: {
        fontSize: 10, // reduced from 14
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    summaryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summarySub: {
        fontSize: 9, // reduced from 11
        fontWeight: '600',
    },

    // Filter Tabs
    filterTabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // space between tabs and filter
        paddingHorizontal: 16,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterTabsScroll: {
        flexDirection: 'row',
        gap: 12,
        paddingRight: 12,
    },
    filterTabActive: {
        paddingVertical: 12,
        position: 'relative',
    },
    filterTabActiveText: {
        fontSize: 11, // reduced to fit
        fontWeight: '700',
        color: '#065F46',
    },
    filterTabActiveIndicator: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#065F46',
        borderRadius: 3,
    },
    filterTab: {
        paddingVertical: 12,
    },
    filterTabText: {
        fontSize: 11, // reduced
        fontWeight: '600',
        color: '#6B7280',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginLeft: 4,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    filterBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
    },

    // Sections
    sectionContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: '#FCFCFD',
        overflow: 'hidden',
    },
    sectionRed: { borderColor: '#FEE2E2', backgroundColor: '#FEF2F240' },
    sectionOrange: { borderColor: '#FFEDD5', backgroundColor: '#FFF7ED40' },
    sectionBlue: { borderColor: '#DBEAFE', backgroundColor: '#EFF6FF40' },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6', // Will override below safely if needed
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    sectionCountText: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionListWrapper: {
        paddingHorizontal: 16,
    },
    taskRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        alignItems: 'center',
    },
    taskRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    taskAvatarCol: {
        position: 'relative',
        marginRight: 12,
    },
    taskInitialsBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskInitialsText: {
        fontSize: 14,
        fontWeight: '700',
    },
    taskOverlapIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        overflow: 'hidden',
    },
    taskContentCol: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    taskSubtitle: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 6,
    },
    taskTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    taskTagLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    taskTagDate: {
        fontSize: 10,
        color: '#6B7280',
    },
    taskActionCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    taskBadge: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 8,
    },
    taskActionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#065F46', // Assuming standard green action
        backgroundColor: '#FFFFFF',
    },
    taskActionBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
    },
    taskAvatarsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    multiAvatarItem: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    multiAvatarMore: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    multiAvatarMoreText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#374151',
    },
    viewAllRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '600',
    }
});

import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, Dimensions, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskService } from '../../services/taskService';

import { useTasks } from '../../hooks/api/useTasks';
import { useFarmers } from '../../hooks/api/useFarmers';
import { format, isToday, isTomorrow, parseISO, isBefore } from '../../services/dateUtils';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const { width } = Dimensions.get('window');

const isCallTask = (task: any) => {
    if (task.channel === 'call') return true;
    if (task.channel === 'visit') return false;
    const code = task.stageCode || task.stage_code || '';
    return ['PS-01', 'PS-02', 'PS-03', 'MS-01', 'LS-01', 'END-02', 'END-03', 'T1-01', 'T1-02', 'T2-01', 'T3-01'].some(c => code.startsWith(c)) ||
           /plan|seed|finance|supply|outcome|meeting|absentee|follow-up|availability/i.test(task.stageName || task.stage_name || '');
};

export default function NeedsCallScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    const { data: apiTasksData, isLoading: tasksLoading } = useTasks({ limit: 100 });
    const { data: apiFarmers, isLoading: farmersLoading } = useFarmers();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
        overdue: true,
        today: true,
        absentees: true,
        custom: true,
    });

    // Custom call categories created by the agent
    const [customCategories, setCustomCategories] = React.useState<{ id: string; name: string; reason: string; farmerIds: string[] }[]>([]);
    const [showNewCategoryModal, setShowNewCategoryModal] = React.useState(false);
    const [newCatName, setNewCatName] = React.useState('');
    const [newCatReason, setNewCatReason] = React.useState('');

    const [absenteeTasks, setAbsenteeTasks] = React.useState<any[]>([]);

    const loadAbsenteeTasks = React.useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('absentee_followup_tasks');
            if (stored) {
                const list = JSON.parse(stored).filter((t: any) => t.status !== 'completed');
                setAbsenteeTasks(list);
            }
        } catch (err) {
            console.warn("Failed to load simulated absentee tasks:", err);
        }
    }, []);

    React.useEffect(() => {
        loadAbsenteeTasks();
    }, [loadAbsenteeTasks]);

    const [showDialer, setShowDialer] = React.useState(false);
    const [activeCallIdx, setActiveCallIdx] = React.useState(0);
    const [dialerState, setDialerState] = React.useState<'countdown' | 'feedback' | 'finished'>('countdown');
    const [countdownVal, setCountdownVal] = React.useState(5);
    const [callOutcome, setCallOutcome] = React.useState<'answered' | 'busy' | 'no_answer'>('answered');
    const [callNotes, setCallNotes] = React.useState('');

    const handleCall = (phone: string, e: any) => {
        e.stopPropagation();
        Linking.openURL(`tel:${phone}`);
    };

    // Process tasks and join with farmers
    const callTasks = React.useMemo(() => {
        const dbTasks = apiTasksData?.data || [];
        const allTasksList = [...dbTasks, ...absenteeTasks];
        
        if (allTasksList.length === 0 || !apiFarmers) return [];
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const tomorrowStr = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

        return allTasksList
            .filter((t: any) => isCallTask(t) && t.status !== 'completed' && t.status !== 'awaiting_validation')
            .map((t: any) => {
                const farmer = apiFarmers.find((f: any) => f.id === t.farmerId);
                if (!farmer) return null;

                const plannedDate = t.sclsPlannedDate ? parseISO(t.sclsPlannedDate) : new Date();
                const isOverdue = t.status === 'overdue' || (t.sclsPlannedDate && isBefore(plannedDate, new Date()) && !isToday(plannedDate));
                const isDueToday = t.sclsPlannedDate && isToday(plannedDate);
                const isDueTomorrow = t.sclsPlannedDate && isTomorrow(plannedDate);

                let statusText = 'Pending';
                let statusColor = '#EAB308';
                if (isOverdue) {
                    statusText = 'Overdue';
                    statusColor = '#EF4444';
                } else if (isDueToday) {
                    statusText = 'Due Today';
                    statusColor = '#F97316';
                } else if (isDueTomorrow) {
                    statusText = 'Due Tomorrow';
                    statusColor = '#3B82F6';
                }

                return {
                    id: t.id,
                    task: t,
                    farmer,
                    name: farmer.name || farmer.fullName || 'Unknown Farmer',
                    farm: farmer.community || 'Kaduna Farm',
                    crop: `${t.stageName || 'Crop Activity'}`,
                    tag: t.stageCode || 'CALL',
                    dateLabel: `Planned: ${t.sclsPlannedDate ? format(parseISO(t.sclsPlannedDate), 'MMM d, yyyy') : 'No Date'}`,
                    statusText,
                    statusColor,
                    isOverdue,
                    isDueToday,
                    isDueTomorrow,
                    phone: farmer.phone || '08031234567'
                };
            })
            .filter(Boolean) as any[];
    }, [apiTasksData, apiFarmers, absenteeTasks]);

    const handleCompleteTask = React.useCallback(async (item: any, e: any) => {
        if (e && e.stopPropagation) e.stopPropagation();
        
        Alert.alert(
            "Log Call Outcome",
            `Mark follow-up call with ${item.name} as completed?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        if (item.id.startsWith('absentee-')) {
                            const stored = await AsyncStorage.getItem('absentee_followup_tasks');
                            if (stored) {
                                const list = JSON.parse(stored);
                                const idx = list.findIndex((x: any) => x.id === item.id);
                                if (idx !== -1) {
                                    list[idx].status = 'completed';
                                    await AsyncStorage.setItem('absentee_followup_tasks', JSON.stringify(list));
                                    loadAbsenteeTasks();
                                }
                            }
                        } else {
                            try {
                                await taskService.setStatus(item.id, 'completed');
                            } catch (err) {
                                console.warn("Failed to complete task:", err);
                            }
                        }
                        Alert.alert("Call Logged", `Successfully logged follow-up call task with ${item.name}.`);
                    }
                }
            ]
        );
    }, [loadAbsenteeTasks]);

    // Section toggle
    const toggleSection = (key: string) =>
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    // Create new custom call category
    const handleCreateCategory = () => {
        if (!newCatName.trim()) return;
        const id = `cat-${Date.now()}`;
        setCustomCategories(prev => [...prev, { id, name: newCatName.trim(), reason: newCatReason.trim(), farmerIds: [] }]);
        setNewCatName('');
        setNewCatReason('');
        setShowNewCategoryModal(false);
    };

    // Filtered tasks with search
    const applySearch = (tasks: any[]) => {
        if (!searchQuery.trim()) return tasks;
        const q = searchQuery.toLowerCase();
        return tasks.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.farm.toLowerCase().includes(q) ||
            t.phone.includes(q)
        );
    };

    const overdueTasks = applySearch(callTasks.filter(t => t.isOverdue));
    const todayTasks = applySearch(callTasks.filter(t => t.isDueToday));
    const tomorrowTasks = applySearch(callTasks.filter(t => t.isDueTomorrow));
    const absenteeFiltered = applySearch(absenteeTasks.map((t: any) => {
        const farmer = apiFarmers?.find((f: any) => f.id === t.farmerId);
        return {
            id: t.id,
            task: t,
            farmer,
            name: farmer?.name || farmer?.fullName || t.farmerName || 'Unknown Farmer',
            farm: farmer?.community || t.location || '—',
            crop: t.stageName || 'MTG Absentee',
            tag: 'MTG-ABSENT',
            dateLabel: t.sclsPlannedDate ? `MTG Date: ${t.sclsPlannedDate}` : 'MTG Date: —',
            statusText: 'Missed MTG',
            statusColor: '#F59E0B',
            isOverdue: false, isDueToday: false, isDueTomorrow: false,
            phone: farmer?.phone || '—'
        };
    }).filter(t => t.farmer));

    const filteredTasks = React.useMemo(() => {
        return [...overdueTasks, ...todayTasks];
    }, [overdueTasks, todayTasks]);

    React.useEffect(() => {
        let timer: any;
        if (showDialer && dialerState === 'countdown' && countdownVal > 0) {
            timer = setTimeout(() => {
                setCountdownVal(prev => prev - 1);
            }, 1000);
        } else if (showDialer && dialerState === 'countdown' && countdownVal === 0) {
            const task = filteredTasks[activeCallIdx];
            if (task) {
                Linking.openURL(`tel:${task.phone}`);
            }
            setDialerState('feedback');
        }
        return () => clearTimeout(timer);
    }, [showDialer, dialerState, countdownVal, filteredTasks, activeCallIdx]);

    const startAutoDialer = () => {
        if (!filteredTasks || filteredTasks.length === 0) {
            Alert.alert("No Calls", "There are no pending call tasks in the current view to sequence.");
            return;
        }
        setActiveCallIdx(0);
        setCountdownVal(5);
        setDialerState('countdown');
        setCallNotes('');
        setShowDialer(true);
    };

    const handleNextCall = async () => {
        const currentTask = filteredTasks[activeCallIdx];
        if (currentTask) {
            if (currentTask.id.startsWith('absentee-')) {
                const stored = await AsyncStorage.getItem('absentee_followup_tasks');
                if (stored) {
                    const list = JSON.parse(stored);
                    const idx = list.findIndex((x: any) => x.id === currentTask.id);
                    if (idx !== -1) {
                        list[idx].status = 'completed';
                        await AsyncStorage.setItem('absentee_followup_tasks', JSON.stringify(list));
                        loadAbsenteeTasks();
                    }
                }
            } else {
                try {
                    await taskService.setStatus(currentTask.id, 'completed');
                } catch (err) {
                    console.warn("Failed to complete task in dialer:", err);
                }
            }
        }

        Alert.alert("Outcome Logged", `Saved call outcome details for ${filteredTasks[activeCallIdx]?.name || 'farmer'}.`);
        if (activeCallIdx + 1 < filteredTasks.length) {
            setActiveCallIdx(prev => prev + 1);
            setCountdownVal(5);
            setDialerState('countdown');
            setCallNotes('');
        } else {
            setDialerState('finished');
        }
    };

    // Computed counts for the collapsible sections badge displays
    const counts = React.useMemo(() => ({
        overdue: callTasks.filter(t => t.isOverdue).length,
        today: callTasks.filter(t => t.isDueToday).length,
        tomorrow: callTasks.filter(t => t.isDueTomorrow).length,
        total: callTasks.length,
        absentees: absenteeTasks.length,
    }), [callTasks, absenteeTasks]);

    // Renderers
    const renderFarmerCard = (item: any, idx: number) => (
        <TouchableOpacity key={idx} style={styles.listItem} onPress={() => router.push({ pathname: '/(agent)/call-farmer', params: { taskId: item.id } })}>
            <View style={styles.avatarContainer}>
                <Image source={require('../../assets/images/whoLogin2.png')} style={styles.avatarImg} contentFit="cover" />
                <View style={[styles.avatarOverlay, { backgroundColor: item.statusColor + '20' }]} />
            </View>
            <View style={styles.listContent}>
                <Text style={styles.listName}>{item.name}</Text>
                <View style={styles.listRow}>
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <Text style={styles.listSubText}>{item.farm}</Text>
                </View>
                <View style={styles.listRow}>
                    <Ionicons name="leaf-outline" size={12} color="#6B7280" />
                    <Text style={styles.listSubText}>{item.crop}</Text>
                </View>
                <View style={[styles.listRow, { marginTop: 4 }]}>
                    <Text style={[styles.tagText, { color: item.statusColor, backgroundColor: item.statusColor + '18' }]}>{item.tag}</Text>
                    <Text style={styles.tagDate}> • {item.dateLabel}</Text>
                </View>
            </View>
            <View style={styles.listActionCol}>
                <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.statusText}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={(e) => handleCall(item.phone, e)}>
                        <Ionicons name="call-outline" size={12} color="#065F46" />
                        <Text style={styles.actionBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}
                        onPress={(e) => handleCompleteTask(item, e)}
                    >
                        <Ionicons name="checkmark-circle-outline" size={12} color="#10B981" />
                        <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Log</Text>
                    </TouchableOpacity>
                    <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderSection = ({
        key, title, subtitle, color, bgColor, icon, tasks, extra
    }: { key: string; title: string; subtitle: string; color: string; bgColor: string; icon: string; tasks: any[]; extra?: React.ReactNode }) => {
        const isOpen = expandedSections[key];
        return (
            <View key={key} style={[styles.sectionCard, { borderLeftColor: color }]}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(key)}>
                    <View style={[styles.sectionIconBg, { backgroundColor: bgColor }]}>
                        <Ionicons name={icon as any} size={15} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
                        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
                    </View>
                    <View style={[styles.sectionCountBadge, { backgroundColor: color }]}>
                        <Text style={styles.sectionCountText}>{tasks.length}</Text>
                    </View>
                    <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={color} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {isOpen && (
                    <View style={styles.sectionBody}>
                        {extra}
                        {tasks.length === 0 ? (
                            <View style={styles.sectionEmpty}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#D1D5DB" />
                                <Text style={styles.sectionEmptyText}>No farmers in this category</Text>
                            </View>
                        ) : (
                            tasks.map((item, idx) => renderFarmerCard(item, idx))
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" hidden={false} />

            <View style={styles.headerBgWrapper}>
                <Image source={DASHBOARD_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>

            <CustomBackNavBar title="Needs Call" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/tasks')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.headerTextWrapper}>
                    <Text style={styles.headerTitle}>{counts.total + counts.absentees} farmers need a call</Text>
                    <Text style={styles.headerSubtitle}>Broken down by urgency, meeting attendance & custom categories.</Text>
                </View>

                <View style={styles.contentCard}>

                    {/* Summary stat pills */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
                        {[
                            { label: 'Overdue', count: counts.overdue, color: '#EF4444', bg: '#FEF2F2' },
                            { label: 'Due Today', count: counts.today, color: '#F97316', bg: '#FFF7ED' },
                            { label: 'Tomorrow', count: counts.tomorrow, color: '#3B82F6', bg: '#EFF6FF' },
                            { label: 'Absentees', count: counts.absentees, color: '#F59E0B', bg: '#FFFBEB' },
                            { label: 'Custom', count: customCategories.length, color: '#8B5CF6', bg: '#F5F3FF' },
                        ].map((pill, i) => (
                            <View key={i} style={[styles.statPill, { backgroundColor: pill.bg, borderColor: pill.color + '44' }]}>
                                <Text style={[styles.statPillCount, { color: pill.color }]}>{pill.count}</Text>
                                <Text style={[styles.statPillLabel, { color: pill.color }]}>{pill.label}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Search */}
                    <View style={styles.searchSortContainer}>
                        <View style={styles.searchBox}>
                            <Feather name="search" size={18} color="#9CA3AF" />
                            <TextInput
                                placeholder="Search farmers by name, farm or phone..."
                                style={styles.searchInput}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* ── OVERDUE SECTION ── */}
                    {renderSection({
                        key: 'overdue',
                        title: 'All Overdue Calls',
                        subtitle: 'Tasks past their planned date — call immediately',
                        color: '#EF4444',
                        bgColor: '#FEF2F2',
                        icon: 'alert-circle',
                        tasks: overdueTasks,
                    })}

                    {/* ── DUE TODAY SECTION ── */}
                    {renderSection({
                        key: 'today',
                        title: 'Due Today',
                        subtitle: 'Calls scheduled for today',
                        color: '#F97316',
                        bgColor: '#FFF7ED',
                        icon: 'today',
                        tasks: todayTasks,
                    })}

                    {/* ── MTG ABSENTEES SECTION ── */}
                    {renderSection({
                        key: 'absentees',
                        title: 'MTG Absentees',
                        subtitle: 'Farmers who missed a meeting and were not in attendance',
                        color: '#F59E0B',
                        bgColor: '#FFFBEB',
                        icon: 'people',
                        tasks: absenteeFiltered,
                        extra: absenteeFiltered.length === 0 ? (
                            <View style={styles.absenteeInfoBanner}>
                                <Ionicons name="information-circle-outline" size={14} color="#92400E" />
                                <Text style={styles.absenteeInfoText}>Farmers marked absent from group meetings will appear here for a follow-up call.</Text>
                            </View>
                        ) : undefined,
                    })}

                    {/* ── CUSTOM CALL CATEGORIES ── */}
                    <View style={[styles.sectionCard, { borderLeftColor: '#8B5CF6' }]}>
                        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('custom')}>
                            <View style={[styles.sectionIconBg, { backgroundColor: '#F5F3FF' }]}>
                                <Ionicons name="layers" size={15} color="#8B5CF6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sectionTitle, { color: '#8B5CF6' }]}>Custom Call Categories</Text>
                                <Text style={styles.sectionSubtitle}>Agent-defined call groups by reason</Text>
                            </View>
                            <View style={[styles.sectionCountBadge, { backgroundColor: '#8B5CF6' }]}>
                                <Text style={styles.sectionCountText}>{customCategories.length}</Text>
                            </View>
                            <Feather name={expandedSections.custom ? 'chevron-up' : 'chevron-down'} size={18} color="#8B5CF6" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        {expandedSections.custom && (
                            <View style={styles.sectionBody}>
                                {/* Create new category */}
                                <TouchableOpacity style={styles.newCategoryBtn} onPress={() => setShowNewCategoryModal(true)}>
                                    <Ionicons name="add-circle" size={16} color="#8B5CF6" />
                                    <Text style={styles.newCategoryBtnText}>Create New Call Category</Text>
                                </TouchableOpacity>

                                {customCategories.length === 0 ? (
                                    <View style={styles.sectionEmpty}>
                                        <Ionicons name="layers-outline" size={20} color="#D1D5DB" />
                                        <Text style={styles.sectionEmptyText}>No custom categories yet. Create one above.</Text>
                                    </View>
                                ) : (
                                    customCategories.map((cat) => (
                                        <View key={cat.id} style={styles.customCatCard}>
                                            <View style={styles.customCatHeader}>
                                                <View style={[styles.sectionIconBg, { backgroundColor: '#EDE9FE' }]}>
                                                    <Ionicons name="call" size={13} color="#8B5CF6" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.customCatName}>{cat.name}</Text>
                                                    {cat.reason ? <Text style={styles.customCatReason}>{cat.reason}</Text> : null}
                                                </View>
                                                <View style={[styles.sectionCountBadge, { backgroundColor: '#8B5CF6' }]}>
                                                    <Text style={styles.sectionCountText}>{cat.farmerIds.length}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.addFarmerToCatBtn}
                                                onPress={() => Alert.alert('Add Farmers', 'Farmer selection for custom categories coming soon.')}
                                            >
                                                <Ionicons name="person-add-outline" size={13} color="#8B5CF6" />
                                                <Text style={styles.addFarmerToCatBtnText}>Add Farmers to this Category</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 20 }} />
                </View>
            </ScrollView>

            {/* Auto Call FAB */}
            <TouchableOpacity style={styles.floatingFooter} activeOpacity={0.9} onPress={startAutoDialer}>
                <View style={styles.footerIconBg}>
                    <Ionicons name="call-outline" size={20} color="#065F46" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.footerTitle}>Make calls faster</Text>
                    <Text style={styles.footerSubtitle}>Use the auto call feature to call multiple farmers in sequence.</Text>
                </View>
                <TouchableOpacity style={styles.footerBtn} onPress={startAutoDialer}>
                    <Ionicons name="headset" size={16} color="white" />
                    <Text style={styles.footerBtnText}>Start Auto Call</Text>
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Auto Call Dialer Modal */}
            <Modal visible={showDialer} animationType="slide" transparent={true} onRequestClose={() => setShowDialer(false)}>
                <View style={styles.dialerModalOverlay}>
                    <View style={styles.dialerModalContainer}>
                        <View style={styles.dialerHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="headset" size={20} color="#065F46" />
                                <Text style={styles.dialerHeaderTitle}>Auto Call Sequencer</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowDialer(false)}>
                                <Ionicons name="close" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dialerProgressContainer}>
                            <Text style={styles.dialerProgressText}>
                                Calling Farmer {activeCallIdx + 1} of {overdueTasks.length + todayTasks.length}
                            </Text>
                            <View style={styles.dialerProgressBarBg}>
                                <View style={[styles.dialerProgressBarFill, { width: `${((activeCallIdx + 1) / Math.max(1, overdueTasks.length + todayTasks.length)) * 100}%` }]} />
                            </View>
                        </View>

                        {dialerState === 'countdown' && (
                            <View style={styles.dialerStateContent}>
                                <Text style={styles.dialerStateLabel}>Up Next</Text>
                                <Text style={styles.dialerFarmerName}>{[...overdueTasks, ...todayTasks][activeCallIdx]?.name}</Text>
                                <Text style={styles.dialerFarmerSub}>{[...overdueTasks, ...todayTasks][activeCallIdx]?.farm} · {[...overdueTasks, ...todayTasks][activeCallIdx]?.phone}</Text>
                                <View style={styles.dialerCircleTimer}>
                                    <Text style={styles.dialerTimerText}>{countdownVal}</Text>
                                    <Text style={styles.dialerTimerSub}>Dialing in...</Text>
                                </View>
                                <TouchableOpacity style={styles.dialerActionBtnPrimary} onPress={() => setCountdownVal(0)}>
                                    <Ionicons name="call" size={18} color="white" />
                                    <Text style={styles.dialerActionBtnText}>Dial Now</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {dialerState === 'feedback' && (
                            <ScrollView contentContainerStyle={styles.dialerStateContent} showsVerticalScrollIndicator={false}>
                                <Text style={styles.dialerStateLabel}>Dialed & Call Finished</Text>
                                <Text style={styles.dialerFarmerName}>{[...overdueTasks, ...todayTasks][activeCallIdx]?.name}</Text>
                                <Text style={styles.dialerFarmerSub}>{[...overdueTasks, ...todayTasks][activeCallIdx]?.phone}</Text>
                                <Text style={styles.dialerOutcomeTitle}>Did you connect with the farmer?</Text>
                                <View style={styles.dialerOutcomeRow}>
                                    {[
                                        { key: 'answered', label: 'Connected', color: '#10B981', bgColor: '#ECFDF5' },
                                        { key: 'busy', label: 'Line Busy', color: '#F59E0B', bgColor: '#FFFBEB' },
                                        { key: 'no_answer', label: 'No Answer', color: '#EF4444', bgColor: '#FEF2F2' }
                                    ].map((opt) => {
                                        const selected = callOutcome === opt.key;
                                        return (
                                            <TouchableOpacity
                                                key={opt.key}
                                                style={[styles.dialerOutcomeChip, { backgroundColor: selected ? opt.color : opt.bgColor, borderColor: opt.color }, selected && { borderWidth: 1 }]}
                                                onPress={() => setCallOutcome(opt.key as any)}
                                            >
                                                <Text style={[styles.dialerOutcomeText, { color: selected ? 'white' : opt.color, fontWeight: '700' }]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <Text style={styles.dialerNotesLabel}>Call Notes / Verification Details</Text>
                                <TextInput
                                    placeholder="Enter response notes here..."
                                    placeholderTextColor="#94A3B8"
                                    value={callNotes}
                                    onChangeText={setCallNotes}
                                    multiline
                                    style={styles.dialerNotesInput}
                                />
                                <TouchableOpacity style={[styles.dialerActionBtnPrimary, { backgroundColor: '#10B981' }]} onPress={handleNextCall}>
                                    <Ionicons name="checkmark-circle" size={18} color="white" />
                                    <Text style={styles.dialerActionBtnText}>Log & Call Next Stop</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}

                        {dialerState === 'finished' && (
                            <View style={styles.dialerStateContent}>
                                <View style={styles.dialerSuccessCircle}>
                                    <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                                </View>
                                <Text style={styles.dialerFarmerName}>Dialer Queue Completed!</Text>
                                <Text style={styles.dialerFarmerSub}>All call tasks in sequence have been successfully processed and logged.</Text>
                                <TouchableOpacity style={styles.dialerActionBtnPrimary} onPress={() => setShowDialer(false)}>
                                    <Text style={styles.dialerActionBtnText}>Return to Queue</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {dialerState !== 'finished' && (
                            <TouchableOpacity style={styles.dialerPauseBtn} onPress={() => setShowDialer(false)}>
                                <Ionicons name="pause" size={16} color="#64748B" />
                                <Text style={styles.dialerPauseBtnText}>Pause Sequencer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── CREATE CUSTOM CATEGORY MODAL ── */}
            <Modal visible={showNewCategoryModal} animationType="slide" transparent onRequestClose={() => setShowNewCategoryModal(false)}>
                <View style={styles.dialerModalOverlay}>
                    <View style={[styles.dialerModalContainer, { paddingBottom: 32 }]}>
                        <View style={styles.dialerHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="layers" size={20} color="#8B5CF6" />
                                <Text style={[styles.dialerHeaderTitle, { color: '#8B5CF6' }]}>New Call Category</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowNewCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.catModalLabel}>Category Name *</Text>
                        <TextInput
                            style={styles.catModalInput}
                            placeholder="e.g. Missed Field Visit, Pending Loan Review"
                            placeholderTextColor="#9CA3AF"
                            value={newCatName}
                            onChangeText={setNewCatName}
                        />

                        <Text style={styles.catModalLabel}>Reason / Description</Text>
                        <TextInput
                            style={[styles.catModalInput, { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                            placeholder="Describe why farmers in this category need a call..."
                            placeholderTextColor="#9CA3AF"
                            value={newCatReason}
                            onChangeText={setNewCatReason}
                            multiline
                        />

                        <Text style={styles.catModalLabel}>Quick Reasons</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {['Missed Field Visit', 'Loan Review Due', 'Input Delivery Pending', 'No MTG Attendance', 'Crop Assessment Due', 'Outstanding Payment'].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.quickReasonPill, newCatReason === r && styles.quickReasonPillActive]}
                                        onPress={() => setNewCatReason(r)}
                                    >
                                        <Text style={[styles.quickReasonText, newCatReason === r && { color: '#8B5CF6', fontWeight: '700' }]}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.dialerActionBtnPrimary, { backgroundColor: '#8B5CF6', opacity: newCatName.trim() ? 1 : 0.5 }]}
                            onPress={handleCreateCategory}
                            disabled={!newCatName.trim()}
                        >
                            <Ionicons name="add-circle" size={18} color="white" />
                            <Text style={styles.dialerActionBtnText}>Create Category</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    headerBgWrapper: {
        height: 250,
        position: 'absolute',
        top: 0, left: 0, right: 0
    },
    headerTextWrapper: {
        marginTop: 155, // below navbar
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500'
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    contentCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingBottom: 24,
        flex: 1,
    },
    summaryScroll: {
        paddingHorizontal: 16,
        gap: 12,
        paddingBottom: 16,
    },
    summaryCard: {
        width: 110,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    summaryIconCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryCount: {
        fontSize: 20,
        fontWeight: '700'
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    summarySub: {
        fontSize: 10,
        fontWeight: '500'
    },
    searchSortContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 16,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 13,
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 44,
        gap: 6,
    },
    sortBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151'
    },
    tabsContainer: {
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 16,
    },
    tabsScroll: {
        flexDirection: 'row',
        gap: 24,
    },
    tabItem: {
        paddingVertical: 12,
        position: 'relative',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#065F46',
        fontWeight: '700',
    },
    tabActiveIndicator: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#065F46',
        borderRadius: 3,
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    listItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'flex-start',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFill,
    },
    listContent: {
        flex: 1,
    },
    listName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    listSubText: {
        fontSize: 12,
        color: '#6B7280',
    },
    tagText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagDate: {
        fontSize: 10,
        color: '#6B7280',
    },
    listActionCol: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 60,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#065F46',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 4,
    },
    actionBtnText: {
        color: '#065F46',
        fontSize: 12,
        fontWeight: '600',
    },
    // New Collapsible Section and Stat Pill Styles
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        gap: 6,
    },
    statPillCount: {
        fontSize: 14,
        fontWeight: '800',
    },
    statPillLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderLeftWidth: 4,
        marginHorizontal: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    sectionIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    sectionSubtitle: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    sectionCountBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionCountText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    sectionBody: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingHorizontal: 14,
        paddingBottom: 10,
    },
    sectionEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 6,
    },
    sectionEmptyText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    absenteeInfoBanner: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginVertical: 10,
        gap: 8,
    },
    absenteeInfoText: {
        flex: 1,
        fontSize: 11,
        color: '#92400E',
        fontWeight: '500',
    },
    newCategoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#8B5CF6',
        borderRadius: 10,
        paddingVertical: 8,
        marginVertical: 10,
        gap: 6,
        borderStyle: 'dashed',
    },
    newCategoryBtnText: {
        color: '#8B5CF6',
        fontSize: 12,
        fontWeight: '700',
    },
    customCatCard: {
        backgroundColor: '#F9F8FF',
        borderWidth: 1,
        borderColor: '#E9E3FF',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    customCatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    customCatName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#312E81',
    },
    customCatReason: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    addFarmerToCatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F3FF',
        borderRadius: 8,
        paddingVertical: 6,
        gap: 6,
    },
    addFarmerToCatBtnText: {
        color: '#8B5CF6',
        fontSize: 11,
        fontWeight: '700',
    },
    catModalLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 6,
    },
    catModalInput: {
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 13,
        color: '#1E293B',
        marginBottom: 16,
    },
    quickReasonPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickReasonPillActive: {
        backgroundColor: '#F5F3FF',
        borderColor: '#C7D2FE',
    },
    quickReasonText: {
        fontSize: 11,
        color: '#374151',
        fontWeight: '600',
    },
    floatingFooter: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    footerIconBg: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#065F46',
        marginBottom: 2,
    },
    footerSubtitle: {
        fontSize: 11,
        color: '#065F46',
        opacity: 0.8,
    },
    footerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#065F46',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    footerBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },

    // Dialer Modal Styles
    dialerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dialerModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        minHeight: 460,
    },
    dialerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dialerHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    dialerProgressContainer: {
        marginBottom: 20,
    },
    dialerProgressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
    },
    dialerProgressBarBg: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    dialerProgressBarFill: {
        height: '100%',
        backgroundColor: '#065F46',
        borderRadius: 3,
    },
    dialerStateContent: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    dialerStateLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    dialerFarmerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 4,
    },
    dialerFarmerSub: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
    },
    dialerCircleTimer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        marginBottom: 30,
    },
    dialerTimerText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#065F46',
    },
    dialerTimerSub: {
        fontSize: 9,
        color: '#065F46',
        fontWeight: '600',
        marginTop: 2,
    },
    dialerActionBtnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E6F6A',
        height: 48,
        width: '100%',
        borderRadius: 12,
        gap: 8,
        marginBottom: 12,
    },
    dialerActionBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    dialerOutcomeTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    dialerOutcomeRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dialerOutcomeChip: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: 10,
        borderWidth: 0,
    },
    dialerOutcomeText: {
        fontSize: 11,
    },
    dialerNotesLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    dialerNotesInput: {
        width: '100%',
        minHeight: 70,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#1E293B',
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    dialerSuccessCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    dialerPauseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    dialerPauseBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    }
});

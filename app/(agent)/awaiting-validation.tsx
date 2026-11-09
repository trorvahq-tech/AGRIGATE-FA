import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

import { useTasks } from '../../hooks/api/useTasks';
import { useFarmers } from '../../hooks/api/useFarmers';
import { format, parseISO, isToday, isTomorrow, isBefore } from '../../services/dateUtils';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const { width } = Dimensions.get('window');

export default function AwaitingValidationScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    const { data: apiTasksData, isLoading: tasksLoading } = useTasks({ limit: 100 });
    const { data: apiFarmers, isLoading: farmersLoading } = useFarmers();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedTab, setSelectedTab] = React.useState<'all' | 'overdue' | 'today' | 'tomorrow'>('all');

    // Process tasks and join with farmers
    const validationTasks = React.useMemo(() => {
        if (!apiTasksData?.data || !apiFarmers) return [];

        return apiTasksData.data
            .filter((t: any) => t.status === 'awaiting_validation')
            .map((t: any) => {
                const farmer = apiFarmers.find((f: any) => f.id === t.farmerId);
                if (!farmer) return null;

                const plannedDate = t.sclsPlannedDate ? parseISO(t.sclsPlannedDate) : new Date();
                const isOverdue = t.sclsPlannedDate && isBefore(plannedDate, new Date()) && !isToday(plannedDate);
                const isDueToday = t.sclsPlannedDate && isToday(plannedDate);
                const isDueTomorrow = t.sclsPlannedDate && isTomorrow(plannedDate);

                let dateLabel = 'Completed';
                if (t.farmerStatedStartedDate) {
                    dateLabel = `Completed: ${format(parseISO(t.farmerStatedStartedDate), 'MMM d, yyyy')}`;
                }

                return {
                    id: t.id,
                    task: t,
                    farmer,
                    title: `${t.stageName || 'Crop Activity'} completed`,
                    farm: `${farmer.name || farmer.fullName || 'Unknown'} • ${farmer.community || 'Kaduna Farm'}`,
                    crop: 'Crop Activity Verification',
                    tag: t.stageCode || 'VALIDATE',
                    dateLabel,
                    dateStr: t.farmerStatedStartedDate ? format(parseISO(t.farmerStatedStartedDate), 'MMM d, yyyy • h:mm a') : 'Unknown Date',
                    statusText: 'AWAITING VALIDATION',
                    icon: 'images',
                    isOverdue,
                    isDueToday,
                    isDueTomorrow
                };
            })
            .filter(Boolean) as any[];
    }, [apiTasksData, apiFarmers]);

    // Apply Search and Tab Filters
    const filteredTasks = React.useMemo(() => {
        let result = validationTasks;

        if (selectedTab === 'overdue') {
            result = result.filter(t => t.isOverdue);
        } else if (selectedTab === 'today') {
            result = result.filter(t => t.isDueToday);
        } else if (selectedTab === 'tomorrow') {
            result = result.filter(t => t.isDueTomorrow);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.farm.toLowerCase().includes(query) ||
                t.title.toLowerCase().includes(query)
            );
        }

        return result;
    }, [validationTasks, selectedTab, searchQuery]);

    // Summary counts
    const counts = React.useMemo(() => {
        const overdue = validationTasks.filter(t => t.isOverdue).length;
        const today = validationTasks.filter(t => t.isDueToday).length;
        const tomorrow = validationTasks.filter(t => t.isDueTomorrow).length;
        return { overdue, today, tomorrow, total: validationTasks.length };
    }, [validationTasks]);

    const SUMMARY_CARDS = [
        { title: 'Overdue', count: counts.overdue, color: '#EF4444', bgColor: '#FEF2F2', subtitle: 'Action required', icon: 'alert' },
        { title: 'Due Today', count: counts.today, color: '#F97316', bgColor: '#FFF7ED', subtitle: 'Review today', icon: 'calendar' },
        { title: 'Due Tomorrow', count: counts.tomorrow, color: '#3B82F6', bgColor: '#EFF6FF', subtitle: 'Review tomorrow', icon: 'time' },
        { title: 'Total Queue', count: counts.total, color: '#10B981', bgColor: '#ECFDF5', subtitle: 'Total validation requests', icon: 'checkmark-circle' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" hidden={false} />

            <View style={styles.headerBgWrapper}>
                <Image source={DASHBOARD_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>

            <CustomBackNavBar title="Awaiting Validation" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/tasks')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.headerTextWrapper}>
                    <Text style={[styles.headerSubtitle, { color: 'white', fontSize: 16, fontWeight: '700' }]}>{counts.total} tasks awaiting validation</Text>
                    <Text style={[styles.headerSubtitle, { color: 'white', fontSize: 13, marginTop: 4 }]}>Tasks completed and waiting for review by supervisors or admins.</Text>
                </View>

                <View style={styles.contentCard}>

                    {/* Summary Cards */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
                        {SUMMARY_CARDS.map((card, idx) => (
                            <View key={idx} style={styles.summaryCard}>
                                <View style={styles.summaryIconCountRow}>
                                    <View style={[styles.summaryIconBg, { backgroundColor: card.bgColor }]}>
                                        <Ionicons name={card.icon as any} size={16} color={card.color} />
                                    </View>
                                    <Text style={[styles.summaryCount, { color: card.color }]}>{card.count}</Text>
                                </View>
                                <Text style={styles.summaryTitle}>{card.title}</Text>
                                <Text style={[styles.summarySub, { color: '#6B7280' }]} numberOfLines={1}>{card.subtitle}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Search & Sort */}
                    <View style={styles.searchSortContainer}>
                        <View style={styles.searchBox}>
                            <Feather name="search" size={18} color="#9CA3AF" />
                            <TextInput
                                placeholder="Search tasks by farmer or crop..."
                                style={styles.searchInput}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                            {[
                                { key: 'all', label: `All (${counts.total})` },
                                { key: 'overdue', label: `Overdue (${counts.overdue})` },
                                { key: 'today', label: `Due Today (${counts.today})` },
                                { key: 'tomorrow', label: `Due Tomorrow (${counts.tomorrow})` }
                            ].map((tab) => {
                                const isActive = selectedTab === tab.key;
                                return (
                                    <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => setSelectedTab(tab.key as any)}>
                                        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                                        {isActive && <View style={styles.tabActiveIndicator} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Warning Banner */}
                    <View style={styles.warningBanner}>
                        <Ionicons name="information-circle-outline" size={18} color="#D97706" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.warningTitle}>Validation pending</Text>
                            <Text style={styles.warningText}>These tasks are completed in the field and waiting for supervisor or admin validation.</Text>
                        </View>
                    </View>

                    {/* List */}
                    <View style={styles.listContainer}>
                        {tasksLoading || farmersLoading ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF' }}>Loading validation tasks from database...</Text>
                            </View>
                        ) : filteredTasks.length === 0 ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <Text style={{ color: '#9CA3AF' }}>No tasks awaiting validation in this tab.</Text>
                            </View>
                        ) : filteredTasks.map((item, idx) => (
                            <TouchableOpacity key={idx} style={styles.listItem} onPress={() => router.push({ pathname: '/(agent)/task-awaiting-validation', params: { taskId: item.id } })}>
                                <View style={styles.avatarWrapper}>
                                    <View style={styles.avatarContainer}>
                                        <Image source={require('../../assets/images/whoLogin2.png')} style={styles.avatarImg} contentFit="cover" />
                                        <View style={[styles.avatarOverlay, { backgroundColor: '#05966920' }]} />
                                    </View>
                                    <View style={styles.avatarIconSub}>
                                        <Ionicons name={item.icon as any} size={10} color="#059669" />
                                    </View>
                                </View>
                                <View style={styles.listContent}>
                                    <Text style={styles.listName}>{item.title}</Text>
                                    <View style={styles.listRow}>
                                        <Ionicons name="location-outline" size={12} color="#6B7280" />
                                        <Text style={styles.listSubText}>{item.farm}</Text>
                                    </View>
                                    <View style={styles.listRow}>
                                        <Ionicons name="leaf-outline" size={12} color="#6B7280" />
                                        <Text style={styles.listSubText}>{item.crop}</Text>
                                    </View>
                                    <View style={[styles.listRow, { marginTop: 4 }]}>
                                        <Text style={[styles.tagText, { color: '#059669', backgroundColor: '#D1FAE5' }]}>{item.tag}</Text>
                                        <Text style={styles.tagDate}> • {item.dateLabel}</Text>
                                    </View>
                                </View>
                                <View style={styles.listActionCol}>
                                    <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
                                        <Text style={styles.timeText}>Completed on</Text>
                                        <Text style={styles.dateTimeText}>{item.dateStr}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.awaitingText}>{item.statusText}</Text>
                                        <Feather name="chevron-right" size={20} color="#9CA3AF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.floatingFooter}>
                <View style={styles.footerIconBg}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#065F46" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.footerTitle}>Validation process</Text>
                    <Text style={styles.footerSubtitle}>Supervisors will review task details, photos and notes before validating or requesting changes.</Text>
                </View>
                <TouchableOpacity style={styles.footerBtn}>
                    <Ionicons name="information-circle-outline" size={16} color="#065F46" />
                    <Text style={styles.footerBtnTextLight}>Learn more</Text>
                </TouchableOpacity>
            </View>
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
    headerSubtitle: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '500'
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100, // Make room for floating footer
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
    warningBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFFBEB',
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginBottom: 16,
    },
    warningTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 2,
    },
    warningText: {
        fontSize: 11,
        color: '#92400E',
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
    avatarWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
    avatarIconSub: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        fontSize: 9,
        fontWeight: '800',
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
    },
    timeText: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 2,
    },
    dateTimeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
    },
    awaitingText: {
        color: '#D97706',
        fontSize: 10,
        fontWeight: '800',
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
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#065F46',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    footerBtnTextLight: {
        color: '#065F46',
        fontSize: 12,
        fontWeight: '700',
    }
});

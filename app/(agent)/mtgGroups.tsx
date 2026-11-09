import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MTG_GROUPS: any[] = [];

type StatusFilter = 'all' | 'active' | 'in_progress' | 'inactive';

const STATUS_CONFIG = {
    active: { label: 'Active', color: '#0E6F6A', bg: '#0E6F6A20' },
    in_progress: { label: 'In Progress', color: '#E59F0B', bg: '#E59F0B20' },
    inactive: { label: 'Inactive', color: '#BC3434', bg: '#BC343420' },
};

export default function MtgGroupsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [regionFilter, setRegionFilter] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const fetchMtgs = async () => {
            try {
                const res = await api.get('/mtgs');
                if (active && res.data && Array.isArray(res.data.data)) {
                    const mapped = res.data.data.map((g: any) => ({
                        id: g.id,
                        name: g.name,
                        region: g.community || 'Kaduna',
                        farmerCount: g.farmer_count || 0,
                        avgCompletion: g.farmer_count > 0 ? 80 : 0,
                        activeFarms: (g.farmer_count || 0) * 2,
                        lastTraining: '3 days ago',
                        lastTrainingTopic: 'Soil Health',
                        status: g.farmer_count > 0 ? 'active' : 'in_progress',
                        vcm: 'You',
                        weeklyActivity: 5,
                    }));
                    setGroups(mapped);
                }
            } catch (err) {
                console.warn("Failed to load live MTGs, falling back to offline data...", err);
                if (active) {
                    setGroups(MTG_GROUPS);
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchMtgs();
        return () => {
            active = false;
        };
    }, []);

    const regions = useMemo(() => {
        const regionSet = new Set(groups.map((g) => g.region));
        return Array.from(regionSet) as string[];
    }, [groups]);

    const displayGroups = useMemo(() => {
        let filtered = groups;
        if (statusFilter !== 'all') {
            filtered = filtered.filter((g) => g.status === statusFilter);
        }
        if (regionFilter) {
            filtered = filtered.filter((g) => g.region === regionFilter);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((g) =>
                g.name.toLowerCase().includes(query) ||
                g.id.toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [groups, statusFilter, regionFilter, searchQuery]);

    const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (regionFilter ? 1 : 0);

    const clearFilters = () => {
        setStatusFilter('all');
        setRegionFilter(null);
    };

    // Summary stats
    const totalFarmers = groups.reduce((sum, g) => sum + g.farmerCount, 0);
    const avgCompletion = groups.length > 0 ? Math.round(groups.reduce((sum, g) => sum + g.avgCompletion, 0) / groups.length) : 0;

    const renderGroupCard = ({ item }: { item: typeof MTG_GROUPS[0] }) => {
        const statusCfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/(agent)/mtgDetails', params: { groupId: item.id, groupName: item.name } })}
                style={[styles.groupCard, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
            >
                {/* Top Row: Name + Status */}
                <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.groupRegion, { color: colors.textMuted }]}>{item.region}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
                        <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                </View>

                {/* Metrics Row */}
                <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                        <Feather name="users" size={14} color={colors.textMuted} />
                        <Text style={[styles.metricValue, { color: colors.text }]}>{item.farmerCount}</Text>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Farmers</Text>
                    </View>
                    <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.metricItem}>
                        <Feather name="bar-chart-2" size={14} color={colors.textMuted} />
                        <Text style={[styles.metricValue, { color: colors.text }]}>{item.avgCompletion}%</Text>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Completion</Text>
                    </View>
                    <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.metricItem}>
                        <Ionicons name="leaf-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.metricValue, { color: colors.text }]}>{item.activeFarms}</Text>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Farms</Text>
                    </View>
                </View>

                {/* Completion Progress Bar */}
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressBarFill, { width: `${item.avgCompletion}%`, backgroundColor: item.avgCompletion >= 70 ? '#0E6F6A' : item.avgCompletion >= 40 ? '#E59F0B' : '#BC3434' }]} />
                </View>

                {/* Bottom Row: Last Training */}
                <View style={styles.cardBottomRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="book-open" size={12} color={colors.textMuted} />
                        <Text style={[styles.trainingText, { color: colors.textMuted }]}>
                            {item.lastTrainingTopic} · {item.lastTraining}
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.textMuted} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            <CustomNavBar title={t('mtg_groups_title')} backgroundColor={isDarkMode ? colors.navbarBackground : "#0E6F6A0D"} textColor={colors.textSecondary} blurIntensity={10} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image
                    source={require('../../assets/images/backgroundGradient.png')}
                    style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]}
                    contentFit="cover"
                />

                <View style={styles.innerContainer}>
                    {/* Summary Stats */}
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.background : '#0E6F6A08', borderColor: colors.border }]}>
                            <Text style={[styles.summaryValue, { color: '#0E6F6A' }]}>{groups.length}</Text>
                            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('mtg_total_groups')}</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.background : '#0E6F6A08', borderColor: colors.border }]}>
                            <Text style={[styles.summaryValue, { color: '#0E6F6A' }]}>{totalFarmers}</Text>
                            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('mtg_total_farmers')}</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.background : '#0E6F6A08', borderColor: colors.border }]}>
                            <Text style={[styles.summaryValue, { color: '#0E6F6A' }]}>{avgCompletion}%</Text>
                            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('mtg_avg_completion')}</Text>
                        </View>
                    </View>

                    {/* Search + Filter */}
                    <View style={styles.searchRow}>
                        <View style={[styles.searchBar, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <TextInput
                                placeholder={t('mtg_search_groups')}
                                placeholderTextColor={colors.textMuted}
                                style={{ flex: 1, color: colors.text, fontSize: 14 }}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <Feather name="search" size={20} color={colors.textMuted} />
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowFilterModal(true)}
                            style={styles.filterButton}
                        >
                            <Feather name="filter" size={20} color="white" />
                            {activeFilterCount > 0 && (
                                <View style={styles.filterBadge}>
                                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Active Filter Chips */}
                    {activeFilterCount > 0 && (
                        <View style={styles.chipRow}>
                            {statusFilter !== 'all' && (
                                <TouchableOpacity onPress={() => setStatusFilter('all')} style={styles.chip}>
                                    <Text style={styles.chipText}>{STATUS_CONFIG[statusFilter].label}</Text>
                                    <Feather name="x" size={14} color="#0E6F6A" />
                                </TouchableOpacity>
                            )}
                            {regionFilter && (
                                <TouchableOpacity onPress={() => setRegionFilter(null)} style={styles.chip}>
                                    <Text style={styles.chipText}>{regionFilter}</Text>
                                    <Feather name="x" size={14} color="#0E6F6A" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.clearText}>{t('mtg_clear_all')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Create Group CTA */}
                    <View style={styles.ctaContainer}>
                        <TouchableOpacity
                            onPress={() => router.push('/(agent)/createMtg')}
                            style={styles.ctaButton}
                        >
                            <Text style={styles.ctaText}>
                                <Text style={{ fontSize: 20 }}>+</Text> {t('mtg_create_group')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Groups List */}
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#0E6F6A" />
                        </View>
                    ) : displayGroups.length > 0 ? (
                        <FlatList
                            data={displayGroups}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={renderGroupCard}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            {activeFilterCount > 0 || searchQuery.trim() ? (
                                <>
                                    <Feather name="search" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
                                    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('mtg_no_groups_found')}</Text>
                                    <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                                        {t('mtg_adjust_filters')}
                                    </Text>
                                    <TouchableOpacity onPress={() => { clearFilters(); setSearchQuery(''); }} style={{ marginTop: 16 }}>
                                        <Text style={{ color: '#0E6F6A', fontWeight: '600', fontSize: 14 }}>{t('mtg_clear_filters')}</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="people-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                                    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('mtg_no_groups_yet')}</Text>
                                    <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                                        {t('mtg_start_creating')}
                                    </Text>
                                    <View style={{ paddingHorizontal: 16, width: '100%' }}>
                                        <TouchableOpacity
                                            onPress={() => router.push('/(agent)/createMtg')}
                                            style={[styles.ctaButton, { marginTop: 24, backgroundColor: '#0E6F6A' }]}
                                        >
                                            <Text style={[styles.ctaText, { color: 'white' }]}>
                                                <Text style={{ fontSize: 20 }}>+</Text> {t('mtg_create_group')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* Filter Modal */}
            <Modal visible={showFilterModal} transparent animationType="slide">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowFilterModal(false)}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('mtg_filter_groups')}</Text>
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.modalReset}>{t('mtg_reset')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Status Filter */}
                        <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>{t('mtg_status')}</Text>
                        <View style={styles.filterOptionsRow}>
                            {(['all', 'active', 'in_progress', 'inactive'] as StatusFilter[]).map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setStatusFilter(status)}
                                    style={[
                                        styles.filterOption,
                                        {
                                            backgroundColor: statusFilter === status ? '#0E6F6A' : isDarkMode ? colors.background : '#F1F5F9',
                                            borderWidth: statusFilter === status ? 0 : 1,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                >
                                    <Text style={{ color: statusFilter === status ? 'white' : colors.text, fontSize: 13, fontWeight: '600' }}>
                                        {status === 'all' ? 'All' : status === 'active' ? 'Active' : status === 'in_progress' ? 'In Progress' : 'Inactive'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Region Filter */}
                        <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>{t('mtg_region')}</Text>
                        <View style={styles.filterOptionsRow}>
                            <TouchableOpacity
                                onPress={() => setRegionFilter(null)}
                                style={[
                                    styles.filterOption,
                                    {
                                        backgroundColor: regionFilter === null ? '#0E6F6A' : isDarkMode ? colors.background : '#F1F5F9',
                                        borderWidth: regionFilter === null ? 0 : 1,
                                        borderColor: colors.border,
                                    }
                                ]}
                            >
                                <Text style={{ color: regionFilter === null ? 'white' : colors.text, fontSize: 13, fontWeight: '600' }}>All</Text>
                            </TouchableOpacity>
                            {regions.map((region) => (
                                <TouchableOpacity
                                    key={region}
                                    onPress={() => setRegionFilter(region)}
                                    style={[
                                        styles.filterOption,
                                        {
                                            backgroundColor: regionFilter === region ? '#0E6F6A' : isDarkMode ? colors.background : '#F1F5F9',
                                            borderWidth: regionFilter === region ? 0 : 1,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                >
                                    <Text style={{ color: regionFilter === region ? 'white' : colors.text, fontSize: 13, fontWeight: '600' }}>{region}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Apply */}
                        <TouchableOpacity
                            onPress={() => setShowFilterModal(false)}
                            style={styles.applyButton}
                        >
                            <Text style={styles.applyButtonText}>
                                {t('mtg_apply_filters')} {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                            </Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 130,
        borderRadius: 16,
        overflow: 'hidden',
    },
    innerContainer: {
        flex: 1,
        paddingTop: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 12,
    },
    searchBar: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    filterButton: {
        width: 48,
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#BC3434',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0E6F6A15',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    chipText: {
        color: '#0E6F6A',
        fontSize: 12,
        fontWeight: '600',
    },
    clearText: {
        color: '#BC3434',
        fontSize: 12,
        fontWeight: '600',
        paddingVertical: 6,
    },
    ctaContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    ctaButton: {
        height: 48,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: {
        color: '#0E6F6A',
        fontWeight: '600',
        fontSize: 16,
    },
    groupCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    groupRegion: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    metricItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    metricDivider: {
        width: 1,
        height: 28,
    },
    progressBarBg: {
        height: 4,
        borderRadius: 2,
        marginBottom: 12,
    },
    progressBarFill: {
        height: 4,
        borderRadius: 2,
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trainingText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#9CA3AF',
        alignSelf: 'center',
        marginBottom: 20,
        opacity: 0.3,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalReset: {
        color: '#BC3434',
        fontSize: 14,
        fontWeight: '600',
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    filterOptionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    filterOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    applyButton: {
        height: 52,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});

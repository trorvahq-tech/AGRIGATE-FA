import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useFarmers } from '../../hooks/api/useFarmers';
import { useTasks } from '../../hooks/api/useTasks';
import {
    VCM_ACTIVITY_DICTIONARY,
    TOTAL_VCM_SEASONAL_POINTS,
    CONTRACTED_VCM_FEE_NAIRA,
    ATTEMPT_STATUS_CONFIGS,
} from '../../constants/vcmSeasonalSpec';

const { width } = Dimensions.get('window');

interface SeasonData {
    id: string;
    name: string;
}

const SEASONS_LIST: SeasonData[] = [
    {
        id: 'season-2026-dry',
        name: 'Dry Season 2026',
    },
    {
        id: 'season-2025-rainy',
        name: 'Rainy Season 2025',
    },
    {
        id: 'season-2025-dry',
        name: 'Dry Season 2025',
    }
];

export default function VcmScorecardScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    const { data: farmersData } = useFarmers();
    const { data: tasksData } = useTasks({ limit: 100 });

    const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

    const farmersList = useMemo(() => {
        return Array.isArray(farmersData) ? farmersData : [];
    }, [farmersData]);

    const tasksList = useMemo(() => {
        return Array.isArray(tasksData?.data) ? tasksData.data : [];
    }, [tasksData]);

    const currentSeason = SEASONS_LIST[selectedSeasonIdx] || SEASONS_LIST[0];

    // Compute dynamically based on actual Juriya seasonal spec data (100 Pts / ₦100 per pt)
    const earningsStats = useMemo(() => {
        const farmersCount = farmersList.length;
        if (farmersCount === 0) {
            return {
                farmersCount: 0,
                totalEarned: 0,
                potential: 0,
                completionPercent: 0,
                pending: 0,
                phase1Earned: 0,
                phase2Earned: 0,
                phase3Earned: 0,
                avgPoints: 0,
            };
        }

        let multiplier = 1.0;
        if (currentSeason.id === 'season-2025-rainy') multiplier = 0.85;
        if (currentSeason.id === 'season-2025-dry') multiplier = 0.6;

        const effectiveFarmersCount = Math.round(farmersCount * multiplier);
        const potential = effectiveFarmersCount * CONTRACTED_VCM_FEE_NAIRA;

        // Group activity IDs according to Juriya spec milestones
        const g1Ids = ['PS-01', 'PS-02', 'PS-03', 'PS-04', 'ES-01', 'ES-02', 'ES-03'];
        const g2Ids = ['MS-01', 'MS-02', 'MS-03', 'MS-04'];
        const g3Ids = ['LS-01', 'LS-02', 'END-01', 'END-02', 'END-03'];

        const activitiesList = Object.values(VCM_ACTIVITY_DICTIONARY);

        let totalPointsEarnedAcrossAll = 0;
        let phase1PointsAcrossAll = 0;
        let phase2PointsAcrossAll = 0;
        let phase3PointsAcrossAll = 0;

        farmersList.forEach((farmer: any) => {
            const farmerTasks = tasksList.filter((t: any) => t.farmerId === farmer.id);
            const completedFarmerTasks = farmerTasks.filter((t: any) => 
                t.status === 'completed' || ATTEMPT_STATUS_CONFIGS[t.status as keyof typeof ATTEMPT_STATUS_CONFIGS]?.countsForPayment
            );

            let fPoints = 0;
            let fP1 = 0;
            let fP2 = 0;
            let fP3 = 0;

            if (completedFarmerTasks.length > 0) {
                let matchedByCode = false;
                completedFarmerTasks.forEach((t: any) => {
                    const code = (t.stageCode || t.stageId || '').toUpperCase();
                    const spec = VCM_ACTIVITY_DICTIONARY[code as keyof typeof VCM_ACTIVITY_DICTIONARY];
                    if (spec) {
                        matchedByCode = true;
                        fPoints += spec.points;
                        if (g1Ids.includes(spec.id)) fP1 += spec.points;
                        else if (g2Ids.includes(spec.id)) fP2 += spec.points;
                        else if (g3Ids.includes(spec.id)) fP3 += spec.points;
                    }
                });

                // Fallback: If task objects use sequential stage indexing rather than codes
                if (!matchedByCode) {
                    completedFarmerTasks.slice(0, activitiesList.length).forEach((_, idx) => {
                        const act = activitiesList[idx];
                        if (act) {
                            fPoints += act.points;
                            if (g1Ids.includes(act.id)) fP1 += act.points;
                            else if (g2Ids.includes(act.id)) fP2 += act.points;
                            else if (g3Ids.includes(act.id)) fP3 += act.points;
                        }
                    });
                }
            }

            fPoints = Math.min(TOTAL_VCM_SEASONAL_POINTS, fPoints);
            totalPointsEarnedAcrossAll += fPoints;
            phase1PointsAcrossAll += Math.min(46, fP1);
            phase2PointsAcrossAll += Math.min(27, fP2);
            phase3PointsAcrossAll += Math.min(27, fP3);
        });

        const avgPoints = farmersCount > 0 ? Math.round(totalPointsEarnedAcrossAll / farmersCount) : 0;
        
        // Payout: Points * ₦100 (since ₦10,000 max / 100 pts)
        const totalEarned = Math.round(totalPointsEarnedAcrossAll * 100 * multiplier);
        const phase1Earned = Math.round(phase1PointsAcrossAll * 100 * multiplier);
        const phase2Earned = Math.round(phase2PointsAcrossAll * 100 * multiplier);
        const phase3Earned = Math.round(phase3PointsAcrossAll * 100 * multiplier);

        const completionPercent = potential > 0 ? Math.min(100, Math.round((totalEarned / potential) * 100)) : 0;
        const pending = Math.max(0, potential - totalEarned);

        return {
            farmersCount: effectiveFarmersCount,
            totalEarned,
            potential,
            completionPercent,
            pending,
            phase1Earned,
            phase2Earned,
            phase3Earned,
            avgPoints,
        };
    }, [farmersList, tasksList, currentSeason]);

    // Real farmer breakdown based on points and API tasks
    const farmersBreakdown = useMemo(() => {
        if (farmersList.length === 0) {
            return [];
        }

        const activitiesList = Object.values(VCM_ACTIVITY_DICTIONARY);

        return farmersList.map((f: any) => {
            const farmerTasks = tasksList.filter((t: any) => t.farmerId === f.id);
            const completedFarmerTasks = farmerTasks.filter((t: any) => 
                t.status === 'completed' || ATTEMPT_STATUS_CONFIGS[t.status as keyof typeof ATTEMPT_STATUS_CONFIGS]?.countsForPayment
            );

            let points = 0;
            let matchedByCode = false;
            completedFarmerTasks.forEach((t: any) => {
                const code = (t.stageCode || t.stageId || '').toUpperCase();
                const spec = VCM_ACTIVITY_DICTIONARY[code as keyof typeof VCM_ACTIVITY_DICTIONARY];
                if (spec) {
                    matchedByCode = true;
                    points += spec.points;
                }
            });

            if (!matchedByCode && completedFarmerTasks.length > 0) {
                completedFarmerTasks.slice(0, activitiesList.length).forEach((_, idx) => {
                    const act = activitiesList[idx];
                    if (act) points += act.points;
                });
            }

            const pointsEarned = Math.min(TOTAL_VCM_SEASONAL_POINTS, points);
            // ₦100 per pt => max ₦10,000 per farmer
            const earnedAmount = pointsEarned * 100;
            const compliance = pointsEarned; // percentage out of 100 pts

            return {
                id: f.id,
                name: f.fullName || f.name || 'Farmer',
                phone: f.phone || 'N/A',
                compliance,
                tasksCompleted: completedFarmerTasks.length,
                totalTasks: activitiesList.length,
                pointsEarned,
                earnedAmount
            };
        });
    }, [farmersList, tasksList]);

    const filteredFarmers = useMemo(() => {
        return farmersBreakdown.filter(f => 
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.phone.includes(searchQuery)
        );
    }, [farmersBreakdown, searchQuery]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            
            <CustomNavBar 
                title="VCM Earnings & Scorecard" 
                backgroundColor={isDarkMode ? colors.navbarBackground : '#0E6F6A0D'} 
                textColor={colors.textSecondary} 
            />

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══════ HEADER CARD ═══════ */}
                <View style={styles.headerCard}>
                    <View style={styles.headerRow}>
                        <View style={{ gap: 4 }}>
                            <Text style={styles.headerSub}>Active Season</Text>
                            <TouchableOpacity 
                                style={styles.seasonSelector}
                                onPress={() => setShowSeasonDropdown(!showSeasonDropdown)}
                            >
                                <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.seasonText}>{currentSeason.name}</Text>
                                <Ionicons name="chevron-down-outline" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{earningsStats.farmersCount} Farmers Supported</Text>
                        </View>
                    </View>

                    {/* Season Dropdown List Overlay */}
                    {showSeasonDropdown && (
                        <View style={styles.dropdownMenu}>
                            {SEASONS_LIST.map((season, idx) => (
                                <TouchableOpacity 
                                    key={season.id} 
                                    style={[styles.dropdownItem, idx === selectedSeasonIdx && styles.dropdownItemActive]}
                                    onPress={() => {
                                        setSelectedSeasonIdx(idx);
                                        setShowSeasonDropdown(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownItemText, idx === selectedSeasonIdx && styles.dropdownItemTextActive]}>
                                        {season.name}
                                    </Text>
                                    {idx === selectedSeasonIdx && (
                                        <Ionicons name="checkmark" size={16} color="#0E6F6A" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Financial Summary Block */}
                    <View style={styles.financialSummary}>
                        <View style={{ gap: 4 }}>
                            <Text style={styles.financialLabel}>Total Fee Earned To Date</Text>
                            <Text style={styles.financialAmount}>
                                ₦{earningsStats.totalEarned.toLocaleString()}{' '}
                                <Text style={styles.financialTotal}>/ ₦{earningsStats.potential.toLocaleString()}</Text>
                            </Text>
                            <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 }}>
                                ₦100 / pt / farmer basis (₦10,000 max per farmer)
                            </Text>
                        </View>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressPercent}>{earningsStats.avgPoints} Pts</Text>
                            <Text style={styles.progressSub}>Avg Score</Text>
                        </View>
                    </View>

                    {/* Horizontal Progress Bar */}
                    <View style={styles.progressBarWrapper}>
                        <View style={[styles.progressBar, { width: `${earningsStats.completionPercent}%` }]} />
                    </View>
                    <View style={styles.progressInfoRow}>
                        <Text style={styles.progressInfoText}>{earningsStats.completionPercent}% Achieved</Text>
                        <Text style={styles.progressInfoTextRight}>
                            ₦{earningsStats.pending.toLocaleString()} Pending
                        </Text>
                    </View>
                </View>

                {/* ═══════ DETAILED FEE BREAKDOWN ═══════ */}
                <Text style={styles.sectionTitle}>Juriya Milestone Breakdown (100 Pts Total)</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    
                    {/* Milestone 1: Pre & Early Season (46 Pts) */}
                    <View style={styles.breakdownItem}>
                        <View style={styles.breakdownIconWrapper}>
                            <Ionicons name="calendar-outline" size={20} color="#0E6F6A" />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.breakdownTitleText, { color: colors.text }]}>Pre & Early Season (46 Pts)</Text>
                            <Text style={styles.breakdownSubtitle}>PS-01 to ES-03 • Up to ₦4,600 / farmer</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                            <Text style={[styles.breakdownEarned, { color: colors.text }]}>₦{earningsStats.phase1Earned.toLocaleString()}</Text>
                            <Text style={styles.breakdownCap}>Max: ₦{(earningsStats.farmersCount * 4600).toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Milestone 2: Mid-Season Verification (27 Pts) */}
                    <View style={styles.breakdownItem}>
                        <View style={styles.breakdownIconWrapper}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#0E6F6A" />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.breakdownTitleText, { color: colors.text }]}>Mid-Season Monitoring (27 Pts)</Text>
                            <Text style={styles.breakdownSubtitle}>MS-01 to MS-04 • Up to ₦2,700 / farmer</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                            <Text style={[styles.breakdownEarned, { color: colors.text }]}>₦{earningsStats.phase2Earned.toLocaleString()}</Text>
                            <Text style={styles.breakdownCap}>Max: ₦{(earningsStats.farmersCount * 2700).toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Milestone 3: Late & End Season Harvest (27 Pts) */}
                    <View style={styles.breakdownItem}>
                        <View style={styles.breakdownIconWrapper}>
                            <Ionicons name="cube-outline" size={20} color="#0E6F6A" />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.breakdownTitleText, { color: colors.text }]}>Harvest & Aggregation (27 Pts)</Text>
                            <Text style={styles.breakdownSubtitle}>LS-01 to END-03 • Up to ₦2,700 / farmer</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                            <Text style={[styles.breakdownEarned, { color: colors.text }]}>₦{earningsStats.phase3Earned.toLocaleString()}</Text>
                            <Text style={styles.breakdownCap}>Max: ₦{(earningsStats.farmersCount * 2700).toLocaleString()}</Text>
                        </View>
                    </View>

                </View>

                {/* ═══════ FARMER WISE CONTRIBUTION LIST ═══════ */}
                <View style={styles.listHeaderRow}>
                    <Text style={styles.sectionTitle}>Farmer Contribution List</Text>
                    <Text style={styles.countText}>{filteredFarmers.length} Farmers</Text>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput 
                        placeholder="Search farmer name or phone..."
                        placeholderTextColor={colors.textMuted}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Farmers List */}
                <View style={styles.farmersList}>
                    {filteredFarmers.map((farmer) => (
                        <View 
                            key={farmer.id} 
                            style={[styles.farmerRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={styles.farmerMain}>
                                <View style={styles.farmerAvatar}>
                                    <Text style={styles.avatarText}>{farmer.name.substring(0,2).toUpperCase()}</Text>
                                </View>
                                <View style={{ gap: 2 }}>
                                    <Text style={[styles.farmerName, { color: colors.text }]}>{farmer.name}</Text>
                                    <Text style={styles.farmerPhone}>{farmer.phone}</Text>
                                </View>
                            </View>

                            <View style={styles.farmerMetrics}>
                                <View style={styles.complianceBadge}>
                                    <Text style={styles.complianceLabel}>Juriya Pts</Text>
                                    <Text style={[
                                        styles.complianceValue, 
                                        { color: farmer.compliance >= 85 ? '#10B981' : farmer.compliance >= 70 ? '#F59E0B' : '#EF4444' }
                                    ]}>
                                        {farmer.pointsEarned} Pts
                                    </Text>
                                </View>

                                <View style={styles.contributionCol}>
                                    <Text style={styles.contributionLabel}>Contribution</Text>
                                    <Text style={[styles.contributionValue, { color: colors.text }]}>
                                        ₦{farmer.earnedAmount.toLocaleString()}
                                    </Text>
                                    <Text style={styles.validationProgress}>
                                        {farmer.tasksCompleted}/{farmer.totalTasks} Milestones
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                    
                    {filteredFarmers.length === 0 && (
                        <View style={styles.emptyState}>
                            <Feather name="users" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {searchQuery ? 'No matching farmers found' : 'No farmers assigned or registered yet'}
                            </Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 155,
        paddingBottom: 110,
        paddingHorizontal: 16,
    },
    headerCard: {
        backgroundColor: '#0E6F6A',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#0E6F6A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
        marginBottom: 24,
        position: 'relative',
        zIndex: 100,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerSub: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: 11,
        fontWeight: '600',
    },
    seasonSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        marginTop: 2,
    },
    seasonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    badgeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 65,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        padding: 8,
        zIndex: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    dropdownItemActive: {
        backgroundColor: '#F0FDF4',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
    },
    dropdownItemTextActive: {
        color: '#0E6F6A',
        fontWeight: '700',
    },
    financialSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
        paddingTop: 20,
    },
    financialLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    financialAmount: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
        marginTop: 2,
    },
    financialTotal: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.75)',
    },
    progressCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#86EFAC',
    },
    progressPercent: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    progressSub: {
        color: '#86EFAC',
        fontSize: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    progressBarWrapper: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        marginTop: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#86EFAC',
        borderRadius: 4,
    },
    progressInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    progressInfoText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
    },
    progressInfoTextRight: {
        color: '#86EFAC',
        fontSize: 11,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#065F46',
        marginTop: 24,
        marginBottom: 12,
    },
    card: {
        borderRadius: 18,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    breakdownIconWrapper: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: 'rgba(14, 111, 106, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    breakdownTitleText: {
        fontSize: 14,
        fontWeight: '700',
    },
    breakdownSubtitle: {
        color: '#9CA3AF',
        fontSize: 11,
    },
    breakdownEarned: {
        fontSize: 15,
        fontWeight: '800',
    },
    breakdownCap: {
        color: '#9CA3AF',
        fontSize: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 12,
    },
    countText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 14,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        gap: 8,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        margin: 0,
        padding: 0,
    },
    farmersList: {
        gap: 12,
    },
    farmerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 1,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    farmerMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    farmerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(14, 111, 106, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#0E6F6A',
        fontWeight: '800',
        fontSize: 14,
    },
    farmerName: {
        fontSize: 14,
        fontWeight: '700',
    },
    farmerPhone: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    farmerMetrics: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    complianceBadge: {
        alignItems: 'center',
        gap: 2,
    },
    complianceLabel: {
        color: '#9CA3AF',
        fontSize: 9,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    complianceValue: {
        fontSize: 13,
        fontWeight: '800',
    },
    contributionCol: {
        alignItems: 'flex-end',
        gap: 2,
    },
    contributionLabel: {
        color: '#9CA3AF',
        fontSize: 9,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    contributionValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    validationProgress: {
        color: '#9CA3AF',
        fontSize: 10,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
    }
});

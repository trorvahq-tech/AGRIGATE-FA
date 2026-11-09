import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
    ActivityId,
    calculateVcmPayment,
    SEASONAL_STAGES,
    VCM_ACTIVITY_DICTIONARY,
    ATTEMPT_STATUS_CONFIGS,
    AttemptStatus,
} from '../../constants/vcmSeasonalSpec';

interface CompletedActivityRecord {
    activityId: ActivityId;
    status: AttemptStatus;
    date: string;
    pointsEarned: number;
    notes?: string;
}

interface VcmScorecardCardProps {
    farmerName?: string;
    farmerId?: string;
    completedActivities?: CompletedActivityRecord[];
    onLogActivityPress?: (activityId?: ActivityId) => void;
    isFarmerProfile?: boolean;
    onStagePress?: (stageId: string) => void;
    totalFarmers?: number;
    totalEarned?: number;
    totalPotential?: number;
    loggedActivitiesCount?: number;
    clusters?: { name: string; farmers: number; avgScore: number; earnedNaira: number; potentialNaira: number }[];
}

const DEFAULT_FULL_WORKED_THROUGH_ACTIVITIES: CompletedActivityRecord[] = [
    { activityId: 'PS-01', status: 'completed', date: '2026-05-10', pointsEarned: 5 },
    { activityId: 'PS-02', status: 'completed', date: '2026-05-12', pointsEarned: 5 },
    { activityId: 'PS-03', status: 'completed', date: '2026-05-15', pointsEarned: 5 },
    { activityId: 'PS-04', status: 'completed', date: '2026-05-20', pointsEarned: 5 },
    { activityId: 'ES-01', status: 'completed', date: '2026-06-02', pointsEarned: 6 },
    { activityId: 'ES-02', status: 'completed', date: '2026-06-10', pointsEarned: 10 },
    { activityId: 'ES-03', status: 'farmer_unavailable', date: '2026-06-18', pointsEarned: 10, notes: 'Farmer away at market; attempt logged' },
    { activityId: 'MS-01', status: 'completed', date: '2026-06-25', pointsEarned: 5 },
    { activityId: 'MS-02', status: 'completed', date: '2026-07-02', pointsEarned: 7 },
    { activityId: 'MS-03', status: 'completed', date: '2026-07-10', pointsEarned: 8 },
    { activityId: 'MS-04', status: 'completed', date: '2026-07-18', pointsEarned: 7 },
    { activityId: 'LS-01', status: 'completed', date: '2026-07-25', pointsEarned: 5 },
    { activityId: 'LS-02', status: 'completed', date: '2026-08-01', pointsEarned: 10 },
    { activityId: 'END-01', status: 'farm_inaccessible', date: '2026-08-05', pointsEarned: 5, notes: 'Road flooded; supervisor escalated' },
    { activityId: 'END-02', status: 'completed', date: '2026-08-10', pointsEarned: 4 },
];

const MTG_PORTFOLIO_CLUSTERS = [
    { name: 'MTG-01 (Kano North Cluster)', farmers: 25, avgScore: 89.2, earnedNaira: 223000, potentialNaira: 250000 },
    { name: 'MTG-02 (Zaria East Cluster)', farmers: 30, avgScore: 87.0, earnedNaira: 261000, potentialNaira: 300000 },
    { name: 'MTG-03 (Kaduna South Cluster)', farmers: 25, avgScore: 85.6, earnedNaira: 214000, potentialNaira: 250000 },
    { name: 'MTG-04 (Soba Central Cluster)', farmers: 20, avgScore: 88.0, earnedNaira: 176000, potentialNaira: 200000 },
];

export default function VcmScorecardCard({
    farmerName,
    farmerId = 'VCM-SEASON-2026',
    completedActivities = [],
    onLogActivityPress,
    isFarmerProfile = false,
    onStagePress,
    totalFarmers = 0,
    totalEarned = 0,
    totalPotential,
    loggedActivitiesCount,
    clusters,
}: VcmScorecardCardProps) {
    const { colors, isDarkMode } = useTheme();
    const [expandAll, setExpandAll] = useState(true);
    const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
        pre_season: true,
        early_season: true,
        mid_season: true,
        late_season: true,
        end_season: true,
    });

    const toggleStage = (stageId: string) => {
        setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
    };

    const toggleExpandAll = () => {
        const nextState = !expandAll;
        setExpandAll(nextState);
        setExpandedStages({
            pre_season: nextState,
            early_season: nextState,
            mid_season: nextState,
            late_season: nextState,
            end_season: nextState,
        });
    };

    // Calculate total points earned based on valid completed / legitimate attempt status
    const completedMap = new Map<ActivityId, CompletedActivityRecord>(
        completedActivities.map((act) => [act.activityId, act])
    );

    let totalPointsEarned = 0;
    let completedCount = 0;
    let attemptCount = 0;

    Object.values(VCM_ACTIVITY_DICTIONARY).forEach((spec) => {
        const record = completedMap.get(spec.id);
        if (record && ATTEMPT_STATUS_CONFIGS[record.status]?.countsForPayment) {
            totalPointsEarned += spec.points;
            if (record.status === 'completed') {
                completedCount++;
            } else {
                attemptCount++;
            }
        }
    });

    const totalPortfolioFarmers = totalFarmers;
    const totalEarnedNaira = totalEarned;
    const totalPotentialNaira = totalPotential ?? (totalPortfolioFarmers * 10000);
    const totalPendingNaira = Math.max(0, totalPotentialNaira - totalEarnedNaira);
    const earnedPercentage = totalPotentialNaira > 0 ? ((totalEarnedNaira / totalPotentialNaira) * 100).toFixed(1) : '0';
    const totalLoggedCount = loggedActivitiesCount ?? completedCount;
    const activeClusters = clusters ?? (totalPortfolioFarmers > 0 ? MTG_PORTFOLIO_CLUSTERS : []);
    const displayName = farmerName || (totalPortfolioFarmers > 0 ? `All Assigned Farmers (${totalPortfolioFarmers})` : 'Assigned Farmers (0)');

    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
            {/* Main Scorecard Header */}
            {!isFarmerProfile ? (
                <View style={styles.headerRow}>
                    <View style={styles.titleContainer}>
                        <View style={[styles.iconBadge, { backgroundColor: '#0E6F6A1A' }]}>
                            <Ionicons name="cash" size={24} color="#0E6F6A" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>VCM Portfolio Scorecard & Earnings</Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                {totalPortfolioFarmers} Supported Farmers • {activeClusters.length} MTG Clusters
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.feePill, { backgroundColor: '#F0FDF4' }]}>
                        <Text style={[styles.feePillText, { color: '#0E6F6A' }]}>₦{totalEarnedNaira.toLocaleString()}</Text>
                        <Text style={[styles.feePillSub, { color: '#64748B' }]}>/ ₦{totalPotentialNaira.toLocaleString()} Potential</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.headerRow}>
                    <View style={styles.titleContainer}>
                        <View style={[styles.iconBadge, { backgroundColor: '#0E6F6A1A' }]}>
                            <Ionicons name="clipboard" size={24} color="#0E6F6A" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>17 Seasonal Activities Tracker</Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                Track milestones & logs for {displayName}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.feePill, { backgroundColor: '#F0FDF4' }]}>
                        <Text style={[styles.feePillText, { color: '#0E6F6A' }]}>{completedCount}/17</Text>
                        <Text style={[styles.feePillSub, { color: '#64748B' }]}>Completed</Text>
                    </View>
                </View>
            )}

            {!isFarmerProfile && (
                <>
                    {/* Score Metric & Financial Summary Box */}
                    <View style={styles.financialCard}>
                        <View style={styles.financialRow}>
                            <View>
                                <Text style={styles.financialLabel}>Total VCM Fee Earned To Date</Text>
                                <Text style={styles.financialValue}>₦{totalEarnedNaira.toLocaleString()}</Text>
                                <Text style={styles.financialSub}>Across {totalPortfolioFarmers} farmers (₦10,000 max fee per farmer)</Text>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.financialPercent}>{earnedPercentage}% Earned</Text>
                                <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '700', marginTop: 2 }}>
                                    Pending: ₦{totalPendingNaira.toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, parseFloat(earnedPercentage)))}%` }]} />
                        </View>
                    </View>

                    {/* Summary Stat Grid */}
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryGridCol}>
                            <Text style={styles.summaryGridNum}>{totalPortfolioFarmers}</Text>
                            <Text style={styles.summaryGridLabel}>Farmers Supported</Text>
                        </View>
                        <View style={styles.summaryGridDivider} />
                        <View style={styles.summaryGridCol}>
                            <Text style={[styles.summaryGridNum, { color: '#10B981' }]}>{totalLoggedCount.toLocaleString()}</Text>
                            <Text style={styles.summaryGridLabel}>Logged Activities</Text>
                        </View>
                        <View style={styles.summaryGridDivider} />
                        <View style={styles.summaryGridCol}>
                            <Text style={[styles.summaryGridNum, { color: '#0E6F6A' }]}>₦{totalEarnedNaira.toLocaleString()}</Text>
                            <Text style={styles.summaryGridLabel}>VCM Money Made</Text>
                        </View>
                    </View>

                    {/* MTG Portfolio Breakdown Section */}
                    <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 4 }]}>MTG Farmer Cluster Earnings</Text>
                    
                    <View style={{ gap: 8, marginBottom: 14 }}>
                        {activeClusters.length > 0 ? (
                            activeClusters.map((mtg, idx) => (
                                <View key={idx} style={styles.mtgCardRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.mtgTitle}>{mtg.name}</Text>
                                        <Text style={styles.mtgSub}>{mtg.farmers} Farmers • {mtg.avgScore} Avg Scorecard Pts</Text>
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.mtgEarned}>₦{mtg.earnedNaira.toLocaleString()}</Text>
                                        <Text style={styles.mtgPotential}>/ ₦{mtg.potentialNaira.toLocaleString()}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
                                    No MTG farmer clusters assigned yet.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Request Fee Payout Button */}
                    <TouchableOpacity
                        style={styles.payoutBtn}
                        onPress={() => {
                            if (totalEarnedNaira > 0) {
                                Alert.alert('VCM Fee Disbursement Requested', `Your milestone payment request for ₦${totalEarnedNaira.toLocaleString()} across ${totalPortfolioFarmers} verified farmers has been submitted to SCL Finance for review.`);
                            } else {
                                Alert.alert('No Available Payout', 'You do not have any earned milestone fees to request for disbursement yet.');
                            }
                        }}
                    >
                        <Ionicons name="card" size={18} color="white" />
                        <Text style={styles.payoutBtnText}>Request VCM Fee Payout (₦{totalEarnedNaira.toLocaleString()})</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Stage Accordion Header & Toggle All */}
            <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Full 17 Activity IDs Worked-Through</Text>
                <TouchableOpacity style={styles.toggleAllBtn} onPress={toggleExpandAll}>
                    <Text style={styles.toggleAllBtnText}>{expandAll ? 'Collapse All' : 'Expand All'}</Text>
                </TouchableOpacity>
            </View>

            {/* 5 Seasonal Stages Breakdown */}
            {SEASONAL_STAGES.map((stage) => {
                const stageActivities = Object.values(VCM_ACTIVITY_DICTIONARY).filter((a) => a.stage === stage.id);
                const stageCompletedCount = stageActivities.filter((a) => completedMap.has(a.id)).length;
                const stagePointsEarned = stageActivities.reduce((sum, a) => {
                    const rec = completedMap.get(a.id);
                    return rec && ATTEMPT_STATUS_CONFIGS[rec.status]?.countsForPayment ? sum + a.points : sum;
                }, 0);
                const stageTotalPoints = stageActivities.reduce((sum, a) => sum + a.points, 0);

                // Progressive unlocking checks
                const STAGE_ORDER = ['pre_season', 'early_season', 'mid_season', 'late_season', 'end_season'];
                const isStageUnlocked = (stageId: string) => {
                    const idx = STAGE_ORDER.indexOf(stageId);
                    if (idx <= 0) return true; // Pre-Season is always unlocked

                    for (let i = 0; i < idx; i++) {
                        const prevStageId = STAGE_ORDER[i];
                        const prevStageActivities = Object.values(VCM_ACTIVITY_DICTIONARY).filter((a) => a.stage === prevStageId);
                        
                        const allDone = prevStageActivities.every((a) => {
                            const rec = completedMap.get(a.id);
                            return rec && (rec.status === 'completed' || rec.status === 'farmer_unavailable' || rec.status === 'farm_inaccessible');
                        });

                        if (!allDone) return false;
                    }
                    return true;
                };

                const unlocked = isStageUnlocked(stage.id);
                const isCompleted = stageCompletedCount === stageActivities.length;
                
                // If it is farmer profile page, we NEVER expand in-place. We navigate forward instead.
                const isExpanded = !isFarmerProfile && unlocked && (expandedStages[stage.id] ?? true);

                return (
                    <View
                        key={stage.id}
                        style={[
                            styles.stageBox,
                            {
                                backgroundColor: !unlocked 
                                    ? (isDarkMode ? '#1E293B' : '#F1F5F9')
                                    : isCompleted
                                        ? (isDarkMode ? '#064E3B10' : '#ECFDF5')
                                        : (isDarkMode ? '#0F172A' : '#F8FAFC'),
                                borderColor: !unlocked 
                                    ? (isDarkMode ? '#334155' : '#E2E8F0')
                                    : isCompleted
                                        ? '#A7F3D0'
                                        : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                                opacity: unlocked ? 1 : 0.6,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.stageHeader}
                            onPress={() => {
                                if (!unlocked) {
                                    Alert.alert('Stage Locked', 'Please complete all activities in the previous stage before starting this phase.');
                                    return;
                                }
                                if (isFarmerProfile && onStagePress) {
                                    onStagePress(stage.id);
                                } else {
                                    setExpandedStages(prev => ({ ...prev, [stage.id]: !prev[stage.id] }));
                                }
                            }}
                            activeOpacity={unlocked ? 0.7 : 1}
                        >
                            <View style={styles.stageHeaderLeft}>
                                <Ionicons
                                    name={!unlocked 
                                        ? 'lock-closed-outline'
                                        : isCompleted 
                                            ? 'checkmark-circle' 
                                            : 'ellipse-outline'}
                                    size={20}
                                    color={!unlocked 
                                        ? '#94A3B8'
                                        : isCompleted 
                                            ? '#10B981' 
                                            : '#0E6F6A'}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        styles.stageTitle, 
                                        { 
                                            color: !unlocked ? '#94A3B8' : colors.text,
                                            textDecorationLine: !unlocked ? 'none' : 'none',
                                            fontWeight: '700'
                                        }
                                    ]}>
                                        {stage.label}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: !unlocked ? '#94A3B8' : colors.textSecondary }}>
                                        {!unlocked ? 'Locked until previous stage is fully completed' : stage.description}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.stageHeaderRight}>
                                {unlocked ? (
                                    <View style={[styles.stagePointsTag, { backgroundColor: isCompleted ? '#D1FAE5' : 'rgba(14, 111, 106, 0.1)' }]}>
                                        <Text style={[styles.stagePointsTagText, { color: isCompleted ? '#065F46' : '#0E6F6A' }]}>
                                            {stageCompletedCount}/{stageActivities.length} Done
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={[styles.stagePointsTag, { backgroundColor: '#E2E8F0' }]}>
                                        <Text style={[styles.stagePointsTagText, { color: '#64748B' }]}>Locked</Text>
                                    </View>
                                )}
                                {unlocked && (
                                    <Feather 
                                        name={isFarmerProfile ? 'chevron-right' : isExpanded ? 'chevron-up' : 'chevron-down'} 
                                        size={18} 
                                        color={colors.textSecondary} 
                                    />
                                )}
                            </View>
                        </TouchableOpacity>

                        {isExpanded && (
                            <View style={styles.activityList}>
                                {stageActivities.map((act) => {
                                    const record = completedMap.get(act.id);
                                    const statusConfig = record ? ATTEMPT_STATUS_CONFIGS[record.status] : ATTEMPT_STATUS_CONFIGS['no_attempt'];

                                    return (
                                        <View key={act.id} style={[styles.activityRow, { borderTopColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                                            <View style={styles.activityInfo}>
                                                <View style={styles.actTitleRow}>
                                                    <Text style={[styles.actId, { color: colors.primary }]}>{act.id}</Text>
                                                    <Text style={[styles.actName, { color: colors.text }]} numberOfLines={1}>
                                                        {act.title}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.actIndicator, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {act.managementIndicator}
                                                </Text>
                                                {record && (
                                                    <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                                                        Logged: {record.date} {record.notes ? `• ${record.notes}` : ''}
                                                    </Text>
                                                )}
                                            </View>

                                            <View style={styles.activityRight}>
                                                <Text style={[styles.actPoints, { color: colors.text }]}>+{act.points} pts</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: statusConfig.badgeBg }]}>
                                                    <Text style={[styles.statusBadgeText, { color: statusConfig.badgeColor }]}>
                                                        {statusConfig.label}
                                                    </Text>
                                                </View>


                                                {!record && onLogActivityPress && (
                                                    <TouchableOpacity
                                                        style={[styles.logBtn, { backgroundColor: colors.primary }]}
                                                        onPress={() => onLogActivityPress(act.id)}
                                                    >
                                                        <Text style={styles.logBtnText}>Log</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    cardSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    feePill: {
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    feePillText: {
        fontSize: 16,
        fontWeight: '800',
    },
    feePillSub: {
        fontSize: 10,
        fontWeight: '600',
    },

    financialCard: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
    },
    financialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    financialLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    financialValue: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0E6F6A',
    },
    financialSub: {
        fontSize: 10,
        color: '#64748B',
    },
    financialPercent: {
        fontSize: 15,
        fontWeight: '800',
        color: '#10B981',
    },

    payoutBtn: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 14,
    },
    payoutBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },

    mtgCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    mtgTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    mtgSub: {
        fontSize: 10,
        color: '#64748B',
    },
    mtgEarned: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0E6F6A',
    },
    mtgPotential: {
        fontSize: 10,
        color: '#94A3B8',
    },

    progressTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
        backgroundColor: '#10B981',
    },
    summaryGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
    },
    summaryGridCol: {
        alignItems: 'center',
    },
    summaryGridNum: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    summaryGridLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
    },
    summaryGridDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#CBD5E1',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 4,
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '700',
    },
    toggleAllBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    toggleAllBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    stageBox: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        overflow: 'hidden',
    },
    stageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    stageHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    stageTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    stageHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stagePointsTag: {
        backgroundColor: 'rgba(14, 111, 106, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    stagePointsTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    activityList: {
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    activityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    activityInfo: {
        flex: 1,
        paddingRight: 8,
    },
    actTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    actId: {
        fontSize: 11,
        fontWeight: '800',
    },
    actName: {
        fontSize: 13,
        fontWeight: '600',
    },
    actIndicator: {
        fontSize: 11,
    },
    activityRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    actPoints: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    logBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 2,
    },
    logBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
});

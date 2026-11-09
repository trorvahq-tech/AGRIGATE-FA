import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import {
    ActivityId,
    ATTEMPT_STATUS_CONFIGS,
    SEASONAL_STAGES,
    SeasonalStage,
    VCM_ACTIVITY_DICTIONARY,
} from '../../constants/vcmSeasonalSpec';
import { vcmActivityService, CompletedActivityRecord } from '../../services/vcmActivityService';

const { width } = Dimensions.get('window');

export default function StageDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();

    const stageId = (params.stageId as SeasonalStage) || 'pre_season';
    const farmerName = (params.farmerName as string) || 'Farmer Profile';
    const farmerId = (params.farmerId as string) || 'FARM-2026';
    const farmerIdParam = (params.farmerIdParam as string) || (params.farmerId as string) || '1';

    const [farmerActivities, setFarmerActivities] = useState<CompletedActivityRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const loadActivities = async () => {
        try {
            const data = await vcmActivityService.getFarmerActivities(farmerIdParam);
            setFarmerActivities(data);
        } catch (e) {
            console.warn('Failed to load farmer activities in stageDetails:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActivities();
    }, [farmerIdParam, params.ts]);

    const stageSpec = useMemo(() => {
        return SEASONAL_STAGES.find(s => s.id === stageId);
    }, [stageId]);

    const stageActivities = useMemo(() => {
        return Object.values(VCM_ACTIVITY_DICTIONARY).filter(a => a.stage === stageId);
    }, [stageId]);

    const completedMap = useMemo(() => {
        return new Map<ActivityId, CompletedActivityRecord>(
            farmerActivities.map(act => [act.activityId, act])
        );
    }, [farmerActivities]);

    const stats = useMemo(() => {
        const total = stageActivities.length;
        const completed = stageActivities.filter(a => completedMap.has(a.id)).length;
        const pointsEarned = stageActivities.reduce((sum, a) => {
            const rec = completedMap.get(a.id);
            return rec && ATTEMPT_STATUS_CONFIGS[rec.status]?.countsForPayment ? sum + a.points : sum;
        }, 0);
        const totalPoints = stageActivities.reduce((sum, a) => sum + a.points, 0);

        return { total, completed, pointsEarned, totalPoints };
    }, [stageActivities, completedMap]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style="light" hidden={false} />

            <CustomBackNavBar
                title={`${stageSpec?.label || 'Stage'} Details`}
                onBackPress={() => {
                    if (params.farmerIdParam) {
                        router.replace({
                            pathname: '/(agent)/farmerDetails',
                            params: { id: params.farmerIdParam }
                        });
                    } else {
                        router.replace('/(agent)/farmers');
                    }
                }}
                textColor="white"
                blurIntensity={Platform.OS === 'ios' ? 20 : 10}
                backgroundColor="transparent"
                backButtonBackgroundColor="rgba(255,255,255,0.2)"
                iconColor="white"
            />

            <Image
                source={require('../../assets/images/agentDashboardBg.png')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: 155, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Stage Summary Card */}
                <View style={styles.headerContainer}>
                    <Text style={styles.farmerLabel}>FARMER PROFILE ACTIVITIES</Text>
                    <Text style={styles.farmerName}>{farmerName}</Text>
                    <Text style={styles.farmerId}>ID: {farmerId}</Text>

                    <View style={styles.summaryCard}>
                        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCol}>
                                <Text style={styles.summaryVal}>{stats.completed} / {stats.total}</Text>
                                <Text style={styles.summaryLbl}>Completed</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryCol}>
                                <Text style={styles.summaryVal}>{stats.pointsEarned} / {stats.totalPoints}</Text>
                                <Text style={styles.summaryLbl}>Points Earned</Text>
                            </View>
                        </View>
                        <View style={styles.progressTrack}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { width: `${(stats.completed / stats.total) * 100}%` }
                                ]} 
                            />
                        </View>
                    </View>
                </View>

                {/* Activities Checklist */}
                <View style={styles.activitiesContainer}>
                    <Text style={styles.sectionHeading}>Activities in {stageSpec?.label}</Text>
                    
                    <View style={{ gap: 12 }}>
                        {stageActivities.map((act) => {
                            const record = completedMap.get(act.id);
                            const statusConfig = record ? ATTEMPT_STATUS_CONFIGS[record.status] : ATTEMPT_STATUS_CONFIGS['no_attempt'];
                            const isLogged = !!record;
                            const isUnlocked = vcmActivityService.isActivityUnlocked(act.id, farmerActivities);

                            return (
                                <TouchableOpacity 
                                    key={act.id} 
                                    style={[
                                        styles.activityCard, 
                                        { 
                                            backgroundColor: !isUnlocked 
                                                ? (isDarkMode ? '#1E293B' : '#F8FAFC')
                                                : colors.card,
                                            borderColor: !isUnlocked 
                                                ? (isDarkMode ? '#334155' : '#E2E8F0')
                                                : isLogged
                                                    ? '#A7F3D0'
                                                    : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                                            opacity: isUnlocked ? 1 : 0.65,
                                        }
                                    ]}
                                    onPress={() => {
                                        if (!isUnlocked) {
                                            Alert.alert('Activity Locked', 'Please complete the previous activity before logging this task.');
                                            return;
                                        }
                                        router.push({
                                            pathname: '/(agent)/logActivities',
                                            params: { 
                                                activityId: act.id, 
                                                stage: stageId, 
                                                farmerName: farmerName, 
                                                farmerId: farmerId, 
                                                farmerIdParam: params.farmerIdParam 
                                            }
                                        });
                                    }}
                                    activeOpacity={isUnlocked ? 0.7 : 1}
                                >
                                    <View style={styles.actHeader}>
                                        <View style={styles.actTitleGroup}>
                                            <Ionicons 
                                                name={!isUnlocked ? 'lock-closed' : isLogged ? 'checkmark-circle' : 'ellipse-outline'} 
                                                size={16} 
                                                color={!isUnlocked ? '#94A3B8' : isLogged ? '#10B981' : colors.primary} 
                                            />
                                            <Text style={[styles.actId, { color: !isUnlocked ? '#94A3B8' : colors.primary }]}>{act.id}</Text>
                                            <Text style={[styles.actTitle, { color: !isUnlocked ? '#94A3B8' : colors.text }]} numberOfLines={1}>
                                                {act.title}
                                            </Text>
                                        </View>
                                        <View style={[styles.pointsTag, { backgroundColor: isUnlocked ? (colors.primary + '15') : '#E2E8F0' }]}>
                                            <Text style={[styles.pointsTagText, { color: isUnlocked ? colors.primary : '#64748B' }]}>+{act.points} pts</Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.actObjective, { color: colors.textSecondary }]}>
                                        {act.objective}
                                    </Text>
                                    <Text style={[styles.actIndicator, { color: colors.textSecondary }]}>
                                        Indicator: {act.managementIndicator}
                                    </Text>

                                    <View style={styles.divider} />

                                    <View style={styles.footerRow}>
                                        <View style={styles.statusCol}>
                                            <View style={[styles.statusBadge, { backgroundColor: !isUnlocked ? '#E2E8F0' : statusConfig.badgeBg }]}>
                                                <Text style={[styles.statusBadgeText, { color: !isUnlocked ? '#64748B' : statusConfig.badgeColor }]}>
                                                    {!isUnlocked ? 'Locked' : statusConfig.label}
                                                </Text>
                                            </View>
                                            {record && (
                                                <Text style={styles.logTimeText}>
                                                    Logged: {record.date}
                                                </Text>
                                            )}
                                        </View>

                                        {!isUnlocked ? (
                                            <View style={[styles.logBtn, { backgroundColor: '#E2E8F0' }]}>
                                                <Feather name="lock" size={12} color="#64748B" />
                                                <Text style={[styles.logBtnText, { color: '#64748B' }]}>Locked</Text>
                                            </View>
                                        ) : !isLogged ? (
                                            <View style={[styles.logBtn, { backgroundColor: colors.primary }]}>
                                                <Ionicons name="create-outline" size={14} color="white" />
                                                <Text style={styles.logBtnText}>Log Input</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.logBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' }]}>
                                                <Feather name="edit-2" size={12} color="#475569" />
                                                <Text style={[styles.logBtnText, { color: '#475569' }]}>Edit / View</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    farmerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1,
        marginBottom: 2,
    },
    farmerName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    farmerId: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryCol: {
        alignItems: 'center',
    },
    summaryVal: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0E6F6A',
    },
    summaryLbl: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(14, 111, 106, 0.2)',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(14, 111, 106, 0.1)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: '#0E6F6A',
    },
    activitiesContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 24,
        paddingHorizontal: 20,
        minHeight: Dimensions.get('window').height - 300,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
    },
    activityCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    actHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    actTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    actId: {
        fontSize: 12,
        fontWeight: '800',
    },
    actTitle: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    pointsTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    pointsTagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    actObjective: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 6,
    },
    actIndicator: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusCol: {
        flex: 1,
        alignItems: 'flex-start',
        gap: 4,
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
    logTimeText: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
    },
    logBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    checkedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    checkedText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '700',
    },
});

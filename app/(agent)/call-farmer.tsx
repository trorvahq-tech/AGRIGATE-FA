import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMe } from '../../hooks/api/useAuth';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const { width } = Dimensions.get('window');

const TALKING_POINTS = [
    { id: 1, text: 'Confirm if land preparation is complete' },
    { id: 2, text: 'Confirm planting start date' },
    { id: 3, text: 'Discuss seed and fertilizer availability' },
    { id: 4, text: 'Identify any challenges or support needed' },
];

export default function CallFarmerScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { data: meData } = useMe();
    const officerName = meData?.staff?.fullName || meData?.staff?.firstName || 'Assigned Officer';
    const params = useLocalSearchParams<{
        farmerName?: string;
        farmName?: string;
        phone?: string;
        crop?: string;
        area?: string;
        location?: string;
        stage?: string;
        season?: string;
        taskId?: string;
    }>();

    const farmerName = params.farmerName || 'Farmer';
    const farmName = params.farmName || 'Farm';
    const phone = params.phone || '—';
    const initials = farmerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FR';
    const crop = params.crop || '—';
    const area = params.area || '—';
    const location = params.location || '—';
    const currentStage = params.stage || 'Not Started';
    const season = params.season || 'Current Season';

    const handleCallNow = () => {
        if (phone && phone !== '—') {
            Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" hidden={false} />

            <View style={styles.headerBgWrapper}>
                <Image source={DASHBOARD_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>

            <CustomBackNavBar 
                title="Call Farmer" 
                onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/needs-call')} 
                rightIcon={<Feather name="more-horizontal" size={24} color="#111827" />}
                onRightPress={() => {}}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Farmer Profile Card */}
                <View style={[styles.card, styles.profileCard]}>
                    <View style={styles.profileRow}>
                        <View style={[styles.profileAvatarBg, { backgroundColor: '#FEF2F2' }]}>
                            <Text style={[styles.profileAvatarText, { color: '#EF4444' }]}>{initials}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <View style={styles.profileNameRow}>
                                <Text style={styles.profileName}>{farmerName}</Text>
                                <View style={styles.farmerTag}>
                                    <Text style={styles.farmerTagText}>Farmer</Text>
                                </View>
                            </View>

                            <View style={styles.profileRowItem}>
                                <Ionicons name="location-outline" size={14} color="#6B7280" />
                                <Text style={styles.profileSubText}>{farmName}</Text>
                            </View>
                            <View style={[styles.profileRowItem, { paddingLeft: 22 }]}>
                                <Text style={styles.profileSubText}>{location}</Text>
                            </View>
                            <View style={styles.profileRowItem}>
                                <Ionicons name="leaf-outline" size={14} color="#6B7280" />
                                <Text style={styles.profileSubText}>{crop} • {area}</Text>
                            </View>
                            <View style={styles.profileRowItem}>
                                <Ionicons name="call-outline" size={14} color="#065F46" />
                                <Text style={[styles.profileSubText, { color: '#065F46', fontWeight: '600' }]}>{phone}</Text>
                            </View>
                        </View>

                        <View style={styles.profileRightCol}>
                            <Text style={styles.dueTodayBadge}>Active</Text>
                            <View style={{ alignItems: 'flex-end', marginTop: 16, marginBottom: 8 }}>
                                <Text style={styles.visitTimeLbl}>Contact</Text>
                                <Text style={styles.visitTimeVal}>Direct Line</Text>
                            </View>
                            <TouchableOpacity style={styles.startVisitSubBtn} onPress={handleCallNow}>
                                <Ionicons name="call" size={14} color="#065F46" />
                                <Text style={styles.startVisitSubBtnText}>Call Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.contentBody}>

                    {/* Call Purpose */}
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRowFlex}>
                            <Text style={styles.sectionTitle}>Call Purpose</Text>
                            <Text style={styles.callTagText}>CALL</Text>
                        </View>
                        <Text style={styles.purposeText}>Follow up with farmer on current farm activities and advisory.</Text>
                    </View>

                    {/* Farm & Crop Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Farm & Crop Details</Text>
                        <View style={styles.cardOutline}>
                            <View style={styles.statsRow}>
                                <View style={styles.statBoxCenter}>
                                    <View>
                                        <Text style={styles.statLabel}>Farm Name</Text>
                                        <Text style={styles.statValue}>{farmName}</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxCenter}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
                                        <Ionicons name="leaf" size={16} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Crop</Text>
                                        <Text style={styles.statValue}>{crop}</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxCenter}>
                                    <View style={[styles.statIconBg, { backgroundColor: '#F3F4F6' }]}>
                                        <Ionicons name="leaf-outline" size={16} color="#4B5563" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Current Stage</Text>
                                        <Text style={[styles.statValue, { color: '#059669', fontSize: 11 }]}>{currentStage}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.statsRow, { borderBottomWidth: 0, paddingBottom: 0, paddingTop: 16 }]}>
                                <View style={styles.statBoxCenter}>
                                    <View>
                                        <Text style={styles.statLabel}>Location</Text>
                                        <Text style={styles.statValue}>{location}</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxCenter}>
                                    <View>
                                        <Text style={styles.statLabel}>Farm Size</Text>
                                        <Text style={styles.statValue}>{area}</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxCenter}>
                                    <View>
                                        <Text style={styles.statLabel}>Season</Text>
                                        <Text style={styles.statValue}>{season}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Notes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Notes</Text>
                        <TouchableOpacity style={styles.notesCard}>
                            <View style={styles.notesContent}>
                                <View style={styles.notesTitleRow}>
                                    <Ionicons name="document-text" size={14} color="#D97706" />
                                    <Text style={styles.notesTitleText}>Previous notes</Text>
                                </View>
                                <Text style={styles.notesText}>Farmer was preparing land. Waiting for fertilizer delivery.{'\n'}Follow up on May 12 to confirm planting date.</Text>
                                <Text style={styles.notesMeta}>Last updated: May 8, 2025 by {officerName}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Call History */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Call History</Text>
                            <Text style={styles.viewAllText}>View all</Text>
                        </View>
                        <View style={styles.historyList}>
                            <View style={styles.historyRow}>
                                <View style={styles.historyIconBgGreen}>
                                    <Ionicons name="call" size={14} color="#059669" />
                                </View>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyType}>Outgoing Call</Text>
                                    <Text style={styles.historyDate}>May 8, 2025 • 10:15 AM • 3m 45s</Text>
                                </View>
                                <Text style={styles.historyResult}>Spoke with Musa</Text>
                            </View>
                            <View style={styles.historyRow}>
                                <View style={styles.historyIconBgBlue}>
                                    <Ionicons name="call" size={14} color="#3B82F6" />
                                </View>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyType}>Outgoing Call</Text>
                                    <Text style={styles.historyDate}>May 5, 2025 • 11:20 AM • -- 2m 10s</Text>
                                </View>
                                <Text style={styles.historyResult}>No answer</Text>
                            </View>
                        </View>
                    </View>

                    {/* Talking Points */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Talking Points</Text>
                        <View style={styles.checklistContainer}>
                            {TALKING_POINTS.map((item, idx) => (
                                <View key={item.id} style={styles.checklistItem}>
                                    <View style={styles.checkboxChecked}>
                                        <Ionicons name="checkmark" size={14} color="white" />
                                    </View>
                                    <Text style={styles.checkText}>{item.text}</Text>
                                    <Feather name="more-vertical" size={16} color="#D1D5DB" />
                                </View>
                            ))}
                        </View>
                    </View>

                </View>
            </ScrollView>

            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleCallNow}>
                    <Ionicons name="call" size={18} color="white" />
                    <Text style={styles.primaryActionText}>Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryActionBtn}>
                    <Ionicons name="document-text-outline" size={18} color="#065F46" />
                    <Text style={styles.secondaryActionText}>Log Call & Notes</Text>
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
    navBarWrapper: {
        position: 'relative'
    },
    navIcons: {
        position: 'absolute',
        bottom: 12,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        zIndex: 20
    },
    navIconBtn: {
        padding: 4,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 155,
        paddingBottom: 100, // For floating actions
    },
    contentBody: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        minHeight: Dimensions.get('window').height,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        zIndex: 5,
    },
    profileCard: {
        marginBottom: -10, // overlap background
    },
    profileRow: {
        flexDirection: 'row',
    },
    profileAvatarBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    profileAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F97316',
    },
    profileInfo: {
        flex: 1,
        gap: 4,
    },
    profileNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    farmerTag: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    farmerTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
    },
    profileRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    profileSubText: {
        fontSize: 12,
        color: '#4B5563',
    },
    profileRightCol: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    dueTodayBadge: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    visitTimeLbl: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 2,
    },
    visitTimeVal: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
    },
    startVisitSubBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#065F46',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 4,
    },
    startVisitSubBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitleRowFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    callTagText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    purposeText: {
        fontSize: 14,
        color: '#374151',
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    taskIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFBEB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitleRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    highPriorityTag: {
        fontSize: 8,
        fontWeight: '800',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    taskDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    taskDateText: {
        fontSize: 12,
        color: '#6B7280',
    },
    viewTaskBtn: {
        borderWidth: 1,
        borderColor: '#065F46',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 8,
    },
    viewTaskBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
    },
    cardOutline: {
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
    },
    statBoxCenter: {
        flexDirection: 'row',
        alignItems: 'flex-start', // top align
        gap: 8,
        flex: 1,
    },
    statIconBg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
    },
    notesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFBEB',
    },
    notesContent: {
        flex: 1,
        marginRight: 16,
    },
    notesTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    notesTitleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400E',
    },
    notesText: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
        marginBottom: 12,
    },
    notesMeta: {
        fontSize: 11,
        color: '#D97706',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
    },
    historyList: {
        gap: 16,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyIconBgGreen: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyIconBgBlue: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyType: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 11,
        color: '#6B7280',
    },
    historyResult: {
        fontSize: 12,
        color: '#4B5563',
    },
    checklistContainer: {
        gap: 12,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxChecked: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#065F46',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 32, // Safe area
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 10,
    },
    primaryActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#065F46',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    primaryActionText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#DCFCE7',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    secondaryActionText: {
        color: '#065F46',
        fontSize: 15,
        fontWeight: '600',
    }
});

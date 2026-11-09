import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTasks } from '../../hooks/api/useTasks';
import { useFarmers } from '../../hooks/api/useFarmers';
import { useMe } from '../../hooks/api/useAuth';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const { width } = Dimensions.get('window');

const CHECKLIST_ITEMS = [
    { id: 1, text: 'Assess land preparation and field conditions' },
    { id: 2, text: 'Verify if planting has started' },
    { id: 3, text: 'Check seed rate and planting method' },
    { id: 4, text: 'Discuss fertilizer plan and application timing' },
    { id: 5, text: 'Identify challenges or support needed' },
    { id: 6, text: 'Take field photos and add notes' },
];

export default function VisitFarmerScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { data: meData } = useMe();
    const officerName = meData?.staff?.fullName || meData?.staff?.firstName || 'Assigned Officer';
    const params = useLocalSearchParams();
    const taskId = params.taskId as string;

    const { data: tasksData } = useTasks({ limit: 100 });
    const { data: farmers } = useFarmers();

    const currentTask = (tasksData?.data || []).find((t: any) => t.id === taskId);
    const farmer = (farmers || []).find((f: any) => f.id === currentTask?.farmerId);

    const farmerName = (params.farmerName as string) || farmer?.name || farmer?.fullName || currentTask?.farmerName || 'Registered Farmer';
    const farmerInitials = farmerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'RF';
    const farmName = (params.farmName as string) || farmer?.community || 'Field Location';
    const farmLocation = (params.location as string) || farmer?.address || farmer?.location?.state?.name || 'Assigned Zone';
    const cropStr = (params.crop as string) || currentTask?.stageName || 'Field Crop';
    const farmerPhone = (params.phone as string) || farmer?.phone || '—';

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" hidden={false} />

            <View style={styles.headerBgWrapper}>
                <Image source={DASHBOARD_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>

            <CustomBackNavBar 
                title="Visit Farmer" 
                onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/needs-visit')} 
                rightIcon={<Feather name="more-horizontal" size={24} color="#111827" />}
                onRightPress={() => {}}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Farmer Profile Card */}
                <View style={[styles.card, styles.profileCard]}>
                    <View style={styles.profileRow}>
                        <View style={styles.profileAvatarBg}>
                            <Text style={styles.profileAvatarText}>{farmerInitials}</Text>
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
                                <Text style={styles.profileSubText}>{farmLocation}</Text>
                            </View>
                            <View style={styles.profileRowItem}>
                                <Ionicons name="leaf-outline" size={14} color="#6B7280" />
                                <Text style={styles.profileSubText}>{cropStr}</Text>
                            </View>
                            <View style={styles.profileRowItem}>
                                <Ionicons name="call-outline" size={14} color="#065F46" />
                                <Text style={[styles.profileSubText, { color: '#065F46', fontWeight: '600' }]}>{farmerPhone}</Text>
                            </View>
                        </View>

                        <View style={styles.profileRightCol}>
                            <Text style={styles.dueTodayBadge}>Due today</Text>
                            <View style={{ alignItems: 'flex-end', marginTop: 16, marginBottom: 8 }}>
                                <Text style={styles.visitTimeLbl}>Visit time</Text>
                                <Text style={styles.visitTimeVal}>10:30 AM – 12:30 PM</Text>
                            </View>
                            <TouchableOpacity style={styles.startVisitSubBtn}>
                                <Ionicons name="walk" size={14} color="#065F46" />
                                <Text style={styles.startVisitSubBtnText}>Start Visit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.contentBody}>
                    {/* Purpose of visit */}
                    <TouchableOpacity style={styles.purposeCard}>
                        <Ionicons name="information-circle-outline" size={20} color="#D97706" />
                        <View style={styles.purposeContent}>
                            <Text style={styles.sectionTitleSmall}>Purpose of visit</Text>
                            <Text style={styles.purposeDesc}>Assess planting progress and provide guidance on fertilizer application.</Text>
                        </View>
                        <Feather name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Visit Task */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Visit Task</Text>
                        <View style={styles.taskCard}>
                            <View style={styles.taskIconBg}>
                                <Ionicons name="walk" size={18} color="#D97706" />
                            </View>
                            <View style={styles.taskInfo}>
                                <View style={styles.taskTitleRow}>
                                    <Text style={styles.taskTitle}>Visit Bako Farm for planting assessment</Text>
                                    <Text style={styles.highPriorityTag}>HIGH PRIORITY</Text>
                                </View>
                                <View style={styles.taskDateRow}>
                                    <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                                    <Text style={styles.taskDateText}>Planned: May 11, 2025  •  Due: May 11, 2025</Text>
                                </View>
                                <Text style={styles.taskTypeText}>Task type: Visit</Text>
                            </View>
                            <TouchableOpacity style={styles.viewTaskBtn}>
                                <Text style={styles.viewTaskBtnText}>View Task</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Farm & Crop Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Farm & Crop Details</Text>
                        <View style={styles.cardOutline}>
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <View style={styles.statIconBg}>
                                        <Ionicons name="leaf" size={16} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Crop</Text>
                                        <Text style={styles.statValue}>Rice (FARO 44)</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxCenter}>
                                    <View style={styles.statIconBg}>
                                        <Ionicons name="map" size={16} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Farm Size</Text>
                                        <Text style={styles.statValue}>1.8 ha</Text>
                                    </View>
                                </View>
                                <View style={styles.statBox}>
                                    <View style={styles.statIconBg}>
                                        <Ionicons name="calendar" size={16} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Season</Text>
                                        <Text style={styles.statValue}>2025 Main Season</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.stageRow}>
                                <Text style={styles.stageLabel}>Current Stage <Text style={styles.stageTag}>Planting</Text></Text>
                                <Text style={styles.stageLabel}>Planned Area <Text style={{ color: '#111827' }}>1.8 ha</Text></Text>
                            </View>
                        </View>
                    </View>

                    {/* Farmer Notes */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.iconTitleRow}>
                                <View style={styles.yellowIconBg}>
                                    <Ionicons name="document-text-outline" size={16} color="#D97706" />
                                </View>
                                <Text style={styles.sectionTitle}>Farmer Notes</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.notesCard}>
                            <View style={styles.notesContent}>
                                <Text style={styles.notesText}>Farmer started land preparation on May 5.{'\n'}Seeds received. Waiting for rain to complete planting.</Text>
                                <Text style={styles.notesMeta}>Last updated: May 8, 2025 by {officerName}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Visit Checklist */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.iconTitleRow}>
                                <View style={styles.greenIconBg}>
                                    <Ionicons name="checkmark-done-outline" size={16} color="#065F46" />
                                </View>
                                <Text style={styles.sectionTitle}>Visit Checklist</Text>
                            </View>
                            <Text style={styles.checklistCount}>0 of 6 completed</Text>
                        </View>
                        <View style={styles.checklistContainer}>
                            {CHECKLIST_ITEMS.map((item, idx) => (
                                <View key={item.id} style={styles.checklistItem}>
                                    <View style={styles.checkboxEmpty} />
                                    <Text style={styles.checkText}>{item.text}</Text>
                                    <Feather name="more-vertical" size={16} color="#D1D5DB" />
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Attachments */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.iconTitleRow}>
                                <View style={styles.greenIconBg}>
                                    <Ionicons name="attach" size={16} color="#065F46" />
                                </View>
                                <Text style={styles.sectionTitle}>Attachments</Text>
                            </View>
                        </View>
                        <View style={styles.attachmentsCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.attachTitle}>No attachments yet</Text>
                                <Text style={styles.attachSub}>Add photos, documents or files from your visit.</Text>
                            </View>
                            <TouchableOpacity style={styles.attachBtn}>
                                <Feather name="plus" size={16} color="#065F46" />
                                <Text style={styles.attachBtnText}>Add Attachment</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.primaryActionBtn}>
                    <Ionicons name="walk" size={18} color="white" />
                    <Text style={styles.primaryActionText}>Start Visit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryActionBtn}>
                    <Ionicons name="calendar-outline" size={18} color="#4B5563" />
                    <Text style={styles.secondaryActionText}>Reschedule Visit</Text>
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
        color: '#F97316',
        backgroundColor: '#FFF7ED',
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
    purposeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    purposeContent: {
        flex: 1,
        marginHorizontal: 12,
    },
    sectionTitleSmall: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    purposeDesc: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
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
    taskTypeText: {
        fontSize: 11,
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
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
    },
    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    statBoxCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#F3F4F6',
        paddingHorizontal: 12,
    },
    statIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
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
    stageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
    },
    stageLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    stageTag: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    iconTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    yellowIconBg: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#FFFBEB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    greenIconBg: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    notesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FAFAFA',
    },
    notesContent: {
        flex: 1,
        marginRight: 16,
    },
    notesText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
        marginBottom: 12,
    },
    notesMeta: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    checklistCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
    },
    checklistContainer: {
        gap: 12,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxEmpty: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        marginRight: 12,
    },
    checkText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
    },
    attachmentsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FAFAFA',
    },
    attachTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    attachSub: {
        fontSize: 11,
        color: '#6B7280',
    },
    attachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#065F46',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    attachBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
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
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    secondaryActionText: {
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '600',
    }
});

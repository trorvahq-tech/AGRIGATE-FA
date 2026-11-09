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

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');


export default function TaskAwaitingValidationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const taskId = params.taskId as string;
    
    const { data: tasksData } = useTasks({ limit: 100 });
    const { data: farmers } = useFarmers();
    const { data: meData } = useMe();
    const officerName = meData?.staff?.fullName || meData?.staff?.firstName || 'Field Officer';
    
    const currentTask = (tasksData?.data || []).find((t: any) => t.id === taskId);
    const farmer = (farmers || []).find((f: any) => f.id === currentTask?.farmerId);
    
    const farmerName = farmer?.name || farmer?.fullName || currentTask?.farmerName || 'Registered Farmer';
    const farmerInitials = farmerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'RF';
    const farmLocation = farmer?.community || farmer?.address || 'Field Location';
    const farmerPhone = farmer?.phone || '—';
    const stageTitle = currentTask?.stageName ? `${currentTask.stageName} completed` : 'Activity Completed';
    const stageCode = currentTask?.stageCode || 'VALIDATION';
    const plannedDate = currentTask?.sclsPlannedDate || 'Pending Schedule';
    const startedDate = currentTask?.farmerStatedStartedDate || currentTask?.sclsPlannedDate || 'Recent';
    const photos: string[] = (currentTask && Array.isArray((currentTask as any).photos)) ? (currentTask as any).photos : [];

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" hidden={false} />

            <View style={styles.headerBgWrapper}>
                <Image source={DASHBOARD_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>

            <CustomBackNavBar 
                title="Task Awaiting Validation" 
                onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/awaiting-validation')} 
                rightIcon={<Feather name="more-horizontal" size={24} color="#111827" />}
                onRightPress={() => {}}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Farmer Profile Card */}
                <View style={[styles.card, styles.profileCard]}>
                    <View style={styles.profileRow}>
                        <View style={[styles.profileAvatarBg, { backgroundColor: '#FCE7F3' }]}>
                            <Text style={[styles.profileAvatarText, { color: '#BE185D' }]}>{farmerInitials}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <View style={styles.profileTitleRow}>
                                <Text style={styles.profileTitle}>{stageTitle}</Text>
                            </View>

                            <View style={styles.profileMetaRow}>
                                <View style={styles.greenTag}>
                                    <Text style={styles.greenTagText}>{stageCode}</Text>
                                </View>
                                <Text style={styles.metaDot}>•</Text>
                                <Text style={styles.metaText}>{`Completed: ${startedDate}`}</Text>
                            </View>

                            <View style={[styles.profileRowItem, { marginTop: 12 }]}>
                                <Feather name="user" size={14} color="#6B7280" />
                                <Text style={styles.profileSubText}>{farmerName}</Text>
                                <View style={styles.farmerTag}>
                                    <Text style={styles.farmerTagText}>Farmer</Text>
                                </View>
                            </View>

                            <View style={styles.profileRowItem}>
                                <Ionicons name="location-outline" size={14} color="#6B7280" />
                                <View>
                                    <Text style={styles.profileSubText}>{farmLocation}</Text>
                                    <Text style={styles.profileSubText}>{farmer?.location?.state?.name || "State Region"}</Text>
                                </View>
                            </View>

                            <View style={styles.profileRowItem}>
                                <Ionicons name="leaf-outline" size={14} color="#6B7280" />
                                <Text style={styles.profileSubText}>{stageTitle}</Text>
                            </View>
                            <View style={styles.profileRowItem}>
                                <Ionicons name="call-outline" size={14} color="#065F46" />
                                <Text style={[styles.profileSubText, { color: '#065F46', fontWeight: '600' }]}>{farmerPhone}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.topRightBadge}>
                        <Text style={styles.awaitingBadge}>AWAITING VALIDATION</Text>
                    </View>

                    <View style={styles.profileActions}>
                        <View style={{ flex: 1 }} />
                        <View style={{ alignItems: 'flex-end' }}>
                            <TouchableOpacity style={styles.viewSubmissionBtn}>
                                <Ionicons name="eye-outline" size={16} color="#065F46" />
                                <Text style={styles.viewSubmissionText}>View Submission</Text>
                            </TouchableOpacity>
                            <Text style={styles.submittedByText}>{`Assigned: ${currentTask?.assignedStaffId ? "VCM Officer" : "Field Staff"}`}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.contentBody}>

                    {/* Warning Banner */}
                    <View style={styles.warningBanner}>
                        <Ionicons name="information-circle-outline" size={20} color="#D97706" />
                        <View style={styles.warningContent}>
                            <Text style={styles.warningTitle}>This task is completed in the field</Text>
                            <Text style={styles.warningDesc}>Waiting for supervisor or admin validation.</Text>
                        </View>
                    </View>

                    {/* Task Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Task Details</Text>
                        <View style={styles.cardOutline}>
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <View style={styles.statIconBg}>
                                        <Ionicons name="calendar-outline" size={16} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Planned Date</Text>
                                        <Text style={styles.statValue}>{plannedDate}</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxCenter}>
                                    <View style={styles.statIconBg}>
                                        <Ionicons name="calendar-outline" size={16} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Completed On</Text>
                                        <Text style={styles.statValue}>May 8, 2025 • 2:45 PM</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxCenter}>
                                    <View style={styles.statIconBg}>
                                        <Feather name="user" size={16} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Completed By</Text>
                                        <Text style={styles.statValue}>{officerName}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.descSection}>
                                <Text style={styles.descLabel}>Task Description</Text>
                                <Text style={styles.descText}>Farmer has completed land preparation for the planned maize field.{'\n'}Land is ready for planting.</Text>
                            </View>
                        </View>
                    </View>

                    {/* Field Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Field Information</Text>
                        <View style={styles.cardOutline}>
                            <View style={styles.statsRowFlex}>
                                <View style={styles.statBoxMini}>
                                    <View style={styles.statIconBgMini}>
                                        <Ionicons name="map-outline" size={14} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Farm Size</Text>
                                        <Text style={styles.statValue}>2.5 ha</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxMiniCenter}>
                                    <View style={styles.statIconBgMini}>
                                        <Ionicons name="expand-outline" size={14} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Planned Area</Text>
                                        <Text style={styles.statValue}>2.5 ha</Text>
                                    </View>
                                </View>
                                <View style={styles.statBoxMiniCenter}>
                                    <View style={styles.statIconBgMini}>
                                        <Ionicons name="leaf-outline" size={14} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Current Stage</Text>
                                        <View style={styles.greenTag}>
                                            <Text style={styles.greenTagText}>Land Preparation</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.statBoxMiniCenter}>
                                    <View style={styles.statIconBgMini}>
                                        <Ionicons name="leaf-outline" size={14} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Season</Text>
                                        <Text style={styles.statValue}>2025 Main Season</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.locationCropRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.statLabel}>Location</Text>
                                    <Text style={styles.statValue}>Aba 154, Kaduna State</Text>
                                </View>
                                <View style={styles.cropCard}>
                                    <View style={styles.statIconBgMini}>
                                        <Ionicons name="leaf" size={14} color="#059669" />
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>Crop</Text>
                                        <Text style={styles.statValue}>Maize (SARA)</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Submission Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Submission Summary</Text>
                        <View style={styles.cardOutline}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <View style={styles.subItemRow}>
                                        <View style={styles.statIconBgMini}>
                                            <Ionicons name="checkmark-done-outline" size={14} color="#059669" />
                                        </View>
                                        <View>
                                            <Text style={styles.subTitle}>What was done</Text>
                                            <Text style={styles.subDesc}>Land cleared, ploughed and harrowed.{'\n'}Field is level and ready for planting.</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.subItemRow, { marginTop: 24 }]}>
                                        <View style={styles.statIconBgMini}>
                                            <Ionicons name="chatbubble-outline" size={14} color="#059669" />
                                        </View>
                                        <View>
                                            <Text style={styles.subTitle}>Notes from Field Officer</Text>
                                            <Text style={styles.subDesc}>Land preparation completed successfully.{'\n'}Farmer is ready to proceed with planting once seeds are available.</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                                    <View style={styles.subItemRow}>
                                        <View style={styles.statIconBgMini}>
                                            <Ionicons name="camera-outline" size={14} color="#059669" />
                                        </View>
                                        <View>
                                            <Text style={styles.subTitle}>Photos Submitted</Text>
                                            <Text style={styles.subDescSmall}>4 photos</Text>
                                        </View>
                                    </View>
                                    <View style={styles.photosGrid}>
                                        {photos.length > 0 ? (
                                            photos.map((uri, idx) => (
                                                <Image key={idx} source={{ uri }} style={styles.photoItem} />
                                            ))
                                        ) : (
                                            <Text style={{ color: '#6B7280', fontSize: 13, paddingVertical: 8 }}>No field validation photos attached</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Validation History */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Validation History</Text>
                        <View style={styles.cardOutlineFlex}>
                            <View style={styles.historyLeft}>
                                <View style={styles.historyIconBg}>
                                    <Ionicons name="time-outline" size={16} color="#8B5CF6" />
                                </View>
                                <View>
                                    <Text style={styles.historyTitle}>No validation yet</Text>
                                    <Text style={styles.historyDesc}>This task is waiting for supervisor or admin review.</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.viewHistoryBtn}>
                                <Ionicons name="time-outline" size={14} color="#374151" />
                                <Text style={styles.viewHistoryText}>View History</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* What happens next */}
                    <View style={styles.section}>
                        <View style={styles.cardOutlineFlexStart}>
                            <View style={styles.happensIconBg}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.happensTitle}>What happens next?</Text>
                                <Text style={styles.happensDesc}>A supervisor or admin will review this task.{'\n'}You will be notified once it is validated.</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </ScrollView>

            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.outlineActionBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color="#065F46" />
                    <Text style={styles.outlineActionText}>Add Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineActionBtn}>
                    <Ionicons name="time-outline" size={18} color="#4B5563" />
                    <Text style={[styles.outlineActionText, { color: '#4B5563' }]}>Request Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryActionBtn}>
                    <Ionicons name="paper-plane" size={18} color="white" />
                    <Text style={styles.primaryActionText}>Notify Supervisor</Text>
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
        position: 'relative'
    },
    profileCard: {
        marginBottom: -10, // overlap background
    },
    profileRow: {
        flexDirection: 'row',
    },
    profileAvatarBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 4
    },
    profileAvatarText: {
        fontSize: 18,
        fontWeight: '700',
    },
    profileInfo: {
        flex: 1,
    },
    profileTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 60, // make space for badge
        marginBottom: 8
    },
    profileTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    topRightBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    awaitingBadge: {
        fontSize: 8,
        fontWeight: '700',
        color: '#D97706'
    },
    profileMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4
    },
    greenTag: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    greenTagText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#059669',
    },
    metaDot: {
        color: '#9CA3AF',
        fontSize: 10
    },
    metaText: {
        fontSize: 10,
        color: '#6B7280'
    },
    farmerTag: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8
    },
    farmerTagText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#059669',
    },
    profileRowItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 6
    },
    profileSubText: {
        fontSize: 12,
        color: '#4B5563',
        marginBottom: 2
    },
    profileActions: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 12
    },
    viewSubmissionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#065F46',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
        marginBottom: 6
    },
    viewSubmissionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#065F46',
    },
    submittedByText: {
        fontSize: 10,
        color: '#6B7280'
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    warningContent: {
        flex: 1,
        marginLeft: 12,
    },
    warningTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    warningDesc: {
        fontSize: 12,
        color: '#4B5563',
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
    cardOutline: {
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
    },
    cardOutlineFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
    },
    cardOutlineFlexStart: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
        marginBottom: 16
    },
    statsRowFlex: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
        marginBottom: 16
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
        borderColor: '#F3F4F6',
        paddingLeft: 12,
    },
    statBoxMini: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6
    },
    statBoxMiniCenter: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        borderLeftWidth: 1,
        borderColor: '#F3F4F6'
    },
    statIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIconBgMini: {
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
        textAlign: 'left'
    },
    statValue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#111827',
    },
    descSection: {
        paddingTop: 4
    },
    descLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 6
    },
    descText: {
        fontSize: 12,
        color: '#374151',
        lineHeight: 18
    },
    locationCropRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cropCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 8
    },
    subItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8
    },
    subTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4
    },
    subDesc: {
        fontSize: 11,
        color: '#4B5563',
        lineHeight: 16
    },
    subDescSmall: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 6
    },
    photosGrid: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
        marginLeft: 32 // Offset to match icon width + gap visually if needed
    },
    photoItem: {
        width: 40,
        height: 40,
        borderRadius: 6
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1
    },
    historyIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3E8FF', // purple light
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2
    },
    historyDesc: {
        fontSize: 11,
        color: '#6B7280'
    },
    viewHistoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6
    },
    viewHistoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151'
    },
    happensIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    happensTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4
    },
    happensDesc: {
        fontSize: 12,
        color: '#4B5563',
        lineHeight: 18
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
    outlineActionBtn: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingVertical: 14,
        gap: 6,
    },
    outlineActionText: {
        color: '#065F46',
        fontSize: 12,
        fontWeight: '600',
    },
    primaryActionBtn: {
        flex: 1.6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#065F46',
        borderRadius: 8,
        paddingVertical: 14,
        gap: 6,
    },
    primaryActionText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    }
});

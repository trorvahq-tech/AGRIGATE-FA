import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useMe } from '../../hooks/api/useAuth';
import { StepIndicator, formatCurrency } from './mtgFundingInputs';

export default function MtgFundingSummaryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();
    const { data: meData } = useMe();

    const officerName = meData?.staff?.firstName 
        ? `${meData.staff.firstName} ${meData.staff.lastName || ''} (VCM)`.trim() 
        : (meData?.email ? `${meData.email} (VCM)` : 'Field Officer (VCM)');

    const groupName = (params.groupName as string) || (params.mtgName as string) || 'MTG Group';
    const totalAmount = Number(params.totalAmount) || 0;
    const requiredReserve = Number(params.requiredReserve) || Math.round(totalAmount * 0.20);
    const bankBalance = Number(params.bankBalance) || 0;
    const isEligible = bankBalance >= requiredReserve && requiredReserve > 0;
    const reservePercent = totalAmount > 0 ? Math.round((bankBalance / totalAmount) * 100) : 0;

    const timeline = useMemo(() => [
        {
            id: 1,
            title: 'Request Submitted',
            subtitle: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            status: 'completed' as const,
            icon: 'checkmark-circle' as const,
            color: '#059669',
            bgColor: '#D1FAE5',
        },
        {
            id: 2,
            title: 'Under Review',
            subtitle: 'Microfinance Bank',
            status: 'active' as const,
            icon: 'ellipse' as const,
            color: '#D97706',
            bgColor: '#FEF9C3',
        },
        {
            id: 3,
            title: 'Approved',
            subtitle: 'Pending',
            status: 'pending' as const,
            icon: 'ellipse-outline' as const,
            color: '#9CA3AF',
            bgColor: '#F3F4F6',
        },
        {
            id: 4,
            title: 'Disbursed',
            subtitle: 'Pending',
            status: 'pending' as const,
            icon: 'ellipse-outline' as const,
            color: '#9CA3AF',
            bgColor: '#F3F4F6',
        },
    ], []);

    const parsedAllocations = useMemo(() => {
        try {
            if (params.allocations) {
                return JSON.parse(params.allocations as string);
            }
        } catch (e) {
            console.error("Failed to parse allocations", e);
        }
        return null;
    }, [params.allocations]);

    const INPUT_CATALOG_LOCAL = [
        { id: 'seeds', name: 'Organic Seeds (Non-GMO Maize)', unit: 'bag' },
        { id: 'npk', name: 'Liquid Bio-Fertilizer (Organic)', unit: 'bag' },
        { id: 'urea', name: 'Neem Cake Bio-fertilizer', unit: 'bag' },
        { id: 'herbicide', name: 'Bio-char Soil Conditioner', unit: 'Litre' },
        { id: 'pesticide', name: 'Neem Oil Biopesticide', unit: 'Litre' },
    ];

    interface SummaryItem {
        name: string;
        qty: string;
    }

    const reviewItems: SummaryItem[] = useMemo(() => {
        if (!parsedAllocations) {
            return [];
        }

        const summary: Record<string, { qty: number, name: string, unit: string }> = {};

        // 1. Process farmer allocations
        const farmersList = Array.isArray(parsedAllocations) ? parsedAllocations : (parsedAllocations.farmers || []);
        farmersList.forEach((f: any) => {
            if (f.items && Array.isArray(f.items)) {
                f.items.forEach((item: any) => {
                    const cat = INPUT_CATALOG_LOCAL.find(c => c.id === item.id);
                    if (cat && item.qty > 0) {
                        if (!summary[item.id]) {
                            summary[item.id] = { qty: 0, name: cat.name, unit: cat.unit + 's' };
                        }
                        summary[item.id].qty += item.qty;
                    }
                });
            }
        });

        // 2. Process communal bulk inputs
        const bulkList = parsedAllocations.bulk || (Array.isArray(parsedAllocations) && params.entryMode === 'bulk' ? parsedAllocations : []);
        if (Array.isArray(bulkList)) {
            bulkList.forEach((item: any) => {
                const cat = INPUT_CATALOG_LOCAL.find(c => c.id === item.id);
                if (cat && item.qty > 0) {
                    if (!summary[item.id]) {
                        summary[item.id] = { qty: 0, name: cat.name, unit: cat.unit + 's' };
                    }
                    summary[item.id].qty += item.qty;
                }
            });
        }

        const list = Object.keys(summary).map((key) => ({
            name: summary[key].name,
            qty: `${summary[key].qty} ${summary[key].unit}`
        }));

        return list;
    }, [parsedAllocations, params.entryMode]);

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#F9FAFB' }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title="Request Summary"
                onBackPress={() => router.navigate({ pathname: '/mtgFundingReview', params: { groupName, totalAmount: totalAmount.toString() } })}
                backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                textColor={colors.text}
                iconColor="#065F46"
                blurIntensity={20}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <StepIndicator currentStep={4} />

                {/* Success Banner */}
                <View style={styles.successBanner}>
                    <View style={styles.successIconBg}>
                        <Ionicons name="checkmark-circle" size={24} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.successTitle}>Request Submitted Successfully!</Text>
                        <Text style={styles.successSubtitle}>Your funding request has been sent for review.</Text>
                    </View>
                </View>

                {/* Request Summary */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Request Summary</Text>
                        <TouchableOpacity style={styles.editBtn}>
                            <Feather name="edit-2" size={14} color="#065F46" />
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>MTG Name</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{groupName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Request Type</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>Organic Inputs & Bio-fertilizer</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Total Loan Requested</Text>
                        <Text style={styles.detailValueGreen}>{formatCurrency(totalAmount)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>MTG Bank Balance (Reserve)</Text>
                        <Text style={[styles.detailValueGreen, { color: isEligible ? '#065F46' : '#DC2626' }]}>
                            {formatCurrency(bankBalance)} ({reservePercent}%)
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Submitted By</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{officerName}</Text>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Submission Date</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                </View>

                {/* Input Items */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Input Items ({reviewItems.length})</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewDetailsText}>View details</Text>
                        </TouchableOpacity>
                    </View>

                    {reviewItems.length === 0 ? (
                        <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 13 }}>No items allocated</Text>
                        </View>
                    ) : (
                        reviewItems.map((item, idx) => (
                            <View key={idx} style={[styles.inputRow, { borderBottomColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                                <Text style={[styles.inputName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={[styles.inputQty, { color: colors.textMuted }]}>{item.qty}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Biometric Verification & Audit Seal */}
                <View style={[styles.card, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5', borderColor: '#10B981' }]}>
                    <View style={styles.cardHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="shield-checkmark" size={20} color="#059669" />
                            <Text style={[styles.cardTitle, { color: '#065F46' }]}>Biometric Consent Verified</Text>
                        </View>
                        <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>LIVENESS PASSED</Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: 13, color: isDarkMode ? colors.text : '#065F46', marginBottom: 8, lineHeight: 18 }}>
                        Affirmative biometric consent was cryptographically signed on-device by <Text style={{ fontWeight: '700' }}>{(params.farmerName as string) || 'MTG Representative'}</Text>.
                    </Text>
                    <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(5, 150, 105, 0.2)', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: isDarkMode ? colors.textSecondary : '#047857' }}>Audit Event Ref:</Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: isDarkMode ? colors.text : '#065F46', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                            {(params.biometricConsentId as string) || 'CONSENT-SEALED'}
                        </Text>
                    </View>
                </View>

                {/* Approval Status */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 20 }]}>Approval Status</Text>

                    {timeline.map((item, idx) => (
                        <View key={item.id} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                                <View style={[styles.timelineDot, { backgroundColor: item.bgColor }]}>
                                    <Ionicons name={item.icon} size={16} color={item.color} />
                                </View>
                                {idx < timeline.length - 1 && (
                                    <View style={[styles.timelineLine, {
                                        backgroundColor: item.status === 'completed' ? '#059669' : isDarkMode ? '#475569' : '#E5E7EB'
                                    }]} />
                                )}
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={[styles.timelineTitle, {
                                    color: item.status === 'pending' ? (isDarkMode ? '#64748B' : '#9CA3AF') : colors.text
                                }]}>{item.title}</Text>
                                <Text style={[styles.timelineSubtitle, {
                                    color: item.status === 'active' ? item.color : colors.textMuted
                                }]}>{item.subtitle}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Info Notice */}
                <View style={[styles.noticeCard, { borderColor: '#BBF7D0' }]}>
                    <Ionicons name="information-circle-outline" size={20} color="#065F46" />
                    <Text style={styles.noticeText}>
                        You will be notified once the bank makes a decision on this request.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => router.navigate({ pathname: '/mtgDetails', params: { groupName } })}
                >
                    <Text style={styles.doneBtnText}>Go to MTG Dashboard</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 155, paddingHorizontal: 16 },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        gap: 12,
    },
    successIconBg: {},
    successTitle: { fontSize: 15, fontWeight: '700', color: '#065F46', marginBottom: 2 },
    successSubtitle: { fontSize: 12, color: '#059669' },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    editBtnText: { fontSize: 12, fontWeight: '600', color: '#065F46' },
    viewDetailsText: { fontSize: 12, fontWeight: '600', color: '#065F46' },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailLabel: { fontSize: 13 },
    detailValue: { fontSize: 13, fontWeight: '600', textAlign: 'right', maxWidth: '55%' },
    detailValueGreen: { fontSize: 13, fontWeight: '700', color: '#065F46', textAlign: 'right' },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    inputName: { fontSize: 13, fontWeight: '500', flex: 1 },
    inputQty: { fontSize: 13, fontWeight: '600' },
    moreItemsRow: { paddingTop: 10 },
    moreItemsText: { fontSize: 12, fontWeight: '500' },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 36,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineLine: {
        width: 2,
        height: 28,
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
        marginLeft: 12,
        paddingBottom: 16,
    },
    timelineTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    timelineSubtitle: { fontSize: 12 },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        gap: 10,
    },
    noticeText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 18 },
    bottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: 16,
        paddingBottom: 34,
        borderTopWidth: 1,
    },
    doneBtn: {
        backgroundColor: '#065F46',
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

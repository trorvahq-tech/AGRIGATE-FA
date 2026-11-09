import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/apiClient';
import { useState, useMemo } from 'react';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { StepIndicator, formatCurrency } from './mtgFundingInputs';
import FarmerBiometricConsentModal from '../../components/FarmerBiometricConsentModal';
import { FarmerInputConsentRecord } from '../../services/biometrics';

export default function MtgFundingReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();

    const groupName = (params.groupName as string) || (params.mtgName as string) || 'MTG Group';
    const totalAmount = Number(params.totalAmount) || 0;
    const requiredReserve = Number(params.requiredReserve) || Math.round(totalAmount * 0.20);
    const bankBalance = Number(params.bankBalance) || 0;
    const creditScore = Number(params.creditScore) || (bankBalance >= requiredReserve && requiredReserve > 0 ? 88 : 45);
    const isEligible = bankBalance >= requiredReserve;
    const reservePercent = totalAmount > 0 ? Math.round((bankBalance / totalAmount) * 100) : 0;

    const [submitting, setSubmitting] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [verifiedConsent, setVerifiedConsent] = useState<FarmerInputConsentRecord | null>(null);

    const farmerId = (params.farmerId as string) || '';
    const farmerName = (params.farmerName as string) || 'MTG Representative';

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

    interface ReviewItem {
        id: number | string;
        name: string;
        qty: number;
        unit: string;
    }

    // Calculate aggregated items from allocations (combines both individual farmer items and bulk items)
    const reviewItems: ReviewItem[] = useMemo(() => {
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

        const list = Object.keys(summary).map((key, index) => ({
            id: index,
            name: summary[key].name,
            qty: summary[key].qty,
            unit: summary[key].unit
        }));

        return list;
    }, [parsedAllocations, params.entryMode]);

    const handleSubmit = async () => {
        if (!verifiedConsent) {
            setShowConsentModal(true);
            return;
        }
        await executeSubmission(verifiedConsent);
    };

    const executeSubmission = async (consentRecord: FarmerInputConsentRecord) => {
        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const payload = {
                mtgId: (params.groupId as string) || '',
                amountRequested: totalAmount,
                purpose: `Organic inputs request for ${groupName}.`,
                items: parsedAllocations || [],
                equityReserveBalance: bankBalance,
                requiredReserve,
                creditScore,
                biometricConsent: {
                    consentEventId: consentRecord.consentEventId,
                    farmerId: consentRecord.farmerId,
                    farmerName: consentRecord.farmerName,
                    consentTimestamp: consentRecord.consentTimestamp,
                    verificationSessionId: consentRecord.verificationSessionId,
                    faceMatchScore: consentRecord.faceMatchOutcome.matchConfidence,
                    livenessScore: consentRecord.livenessOutcome.livenessScore,
                    overallStatus: consentRecord.overallStatus,
                }
            };

            console.log("Submitting organic finance request with biometric consent:", payload);
            await api.post('/finance-requests', payload);
            alert("Finance request and biometric consent submitted successfully!");

            router.push({ 
                pathname: '/mtgFundingSummary', 
                params: { 
                    groupName, 
                    totalAmount: totalAmount.toString(),
                    bankBalance: bankBalance.toString(),
                    requiredReserve: requiredReserve.toString(),
                    creditScore: creditScore.toString(),
                    allocations: params.allocations,
                    entryMode: params.entryMode,
                    biometricConsentId: consentRecord.consentEventId,
                    farmerName: consentRecord.farmerName,
                } 
            });
        } catch (err) {
            console.error(err);
            router.push({ pathname: '/mtgFundingSummary', params: { groupName, totalAmount: totalAmount.toString(), bankBalance: bankBalance.toString(), requiredReserve: requiredReserve.toString(), biometricConsentId: consentRecord.consentEventId } });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#F9FAFB' }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title="Review Request"
                onBackPress={() => router.navigate({ pathname: '/mtgFundingContributions', params: { groupName, totalAmount: totalAmount.toString(), bankBalance: bankBalance.toString() } })}
                backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                textColor={colors.text}
                iconColor="#065F46"
                blurIntensity={20}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <StepIndicator currentStep={3} />

                {/* Request Summary */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Request Summary</Text>
                        <TouchableOpacity style={styles.editBtn} onPress={() => router.navigate({ pathname: '/mtgFundingInputs', params: { groupName, totalAmount: totalAmount.toString() } })}>
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
                        <Text style={[styles.detailValueGreen]}>{formatCurrency(totalAmount)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>MTG Bank Balance (Reserve)</Text>
                        <Text style={[styles.detailValueGreen, { color: isEligible ? '#065F46' : '#DC2626' }]}>
                            {formatCurrency(bankBalance)} ({reservePercent}%)
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Creditworthiness Status</Text>
                        <Text style={[styles.detailValue, { color: isEligible ? '#059669' : '#D97706', fontWeight: '700' }]}>
                            {isEligible ? `✓ Approved (${creditScore}/100)` : `⚠️ Deficit (${creditScore}/100)`}
                        </Text>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
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
                        reviewItems.map((item) => (
                            <View key={item.id} style={[styles.inputRow, { borderBottomColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                                <Text style={[styles.inputName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={[styles.inputQty, { color: colors.textMuted }]}>{item.qty} {item.unit}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* MTG Bank Account & Reserve Equity */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Bank Reserve & Creditworthiness</Text>
                    <View style={styles.contribSummaryRow}>
                        <View style={styles.contribItem}>
                            <Text style={[styles.contribLabel, { color: colors.textMuted }]}>20% Required</Text>
                            <Text style={[styles.contribValue, { color: colors.text }]}>{formatCurrency(requiredReserve)}</Text>
                        </View>
                        <View style={[styles.contribDivider, { backgroundColor: isDarkMode ? colors.border : '#E5E7EB' }]} />
                        <View style={styles.contribItem}>
                            <Text style={[styles.contribLabel, { color: colors.textMuted }]}>MTG Bank Balance</Text>
                            <Text style={[styles.contribValue, { color: isEligible ? '#065F46' : '#DC2626' }]}>{formatCurrency(bankBalance)}</Text>
                        </View>
                        <View style={[styles.contribDivider, { backgroundColor: isDarkMode ? colors.border : '#E5E7EB' }]} />
                        <View style={styles.contribItem}>
                            <Text style={[styles.contribLabel, { color: colors.textMuted }]}>Credit Score</Text>
                            <Text style={[styles.contribValue, { color: isEligible ? '#059669' : '#D97706' }]}>{creditScore}/100</Text>
                        </View>
                    </View>
                </View>

                {/* Confirmation Notice */}
                <View style={[styles.noticeCard, { borderColor: '#BBF7D0' }]}>
                    <Ionicons name="information-circle-outline" size={20} color="#065F46" />
                    <Text style={styles.noticeText}>
                        By submitting this request, you confirm that all input needs and contribution data are accurate.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Ionicons name="finger-print-outline" size={20} color="white" />
                            <Text style={styles.submitBtnText}>Verify Biometrics & Submit</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Farmer Biometric Consent Modal */}
            <FarmerBiometricConsentModal
                visible={showConsentModal}
                onClose={() => setShowConsentModal(false)}
                farmerId={farmerId}
                farmerName={farmerName}
                groupName={groupName}
                totalAmount={totalAmount}
                items={reviewItems}
                onConsentAffirmed={(record) => {
                    setVerifiedConsent(record);
                    executeSubmission(record);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 155, paddingHorizontal: 16 },
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
        marginBottom: 16,
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
    contribSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    contribItem: { flex: 1, alignItems: 'center', gap: 4 },
    contribLabel: { fontSize: 11 },
    contribValue: { fontSize: 16, fontWeight: '700' },
    contribDivider: { width: 1, height: 36 },
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
    submitBtn: {
        backgroundColor: '#065F46',
        borderRadius: 14,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

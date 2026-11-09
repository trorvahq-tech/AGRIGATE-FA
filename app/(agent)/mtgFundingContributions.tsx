import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { StepIndicator, formatCurrency } from './mtgFundingInputs';

const groupMembers: any[] = [];

export default function MtgFundingContributionsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();

    const groupName = (params.groupName as string) || (params.mtgName as string) || 'MTG Group';
    const totalAmount = Number(params.totalAmount) || 0;
    
    // Rule: Group must hold at least 20% of requested loan in bank account
    const requiredReserve = Math.round(totalAmount * 0.20);
    
    // Group Bank Account Balance State
    const [bankBalance, setBankBalance] = useState(Number(params.bankBalance) || 0);
    const [bankName] = useState((params.bankName as string) || 'Microfinance Bank');
    const [accountNumber] = useState((params.accountNumber as string) || '—');

    const coverageRate = Math.round((bankBalance / requiredReserve) * 100);
    const isCreditworthy = bankBalance >= requiredReserve;
    const surplusOrDeficit = bankBalance - requiredReserve;

    // Credit score dynamically computed based on reserve ratio
    const creditScore = isCreditworthy 
        ? Math.min(98, 75 + Math.round((coverageRate - 100) * 0.2)) 
        : Math.max(30, Math.round(coverageRate * 0.65));

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#F8FAFC' }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title="MTG Bank Balance & 20% Reserve"
                onBackPress={() => router.navigate({ 
                    pathname: '/mtgFundingInputs', 
                    params: { 
                        groupId: params.groupId,
                        groupName, 
                        totalAmount: totalAmount.toString(),
                        allocations: params.allocations,
                        entryMode: params.entryMode
                    } 
                })}
                backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                textColor={colors.text}
                iconColor="#065F46"
                blurIntensity={20}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <StepIndicator currentStep={2} />

                {/* Info Header Banner */}
                <View style={[styles.infoBanner, { backgroundColor: isCreditworthy ? '#ECFDF5' : '#FEF2F2', borderColor: isCreditworthy ? '#A7F3D0' : '#FECACA' }]}>
                    <Ionicons 
                        name={isCreditworthy ? "shield-checkmark" : "alert-circle"} 
                        size={20} 
                        color={isCreditworthy ? "#059669" : "#DC2626"} 
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoBannerTitle, { color: isCreditworthy ? '#065F46' : '#991B1B' }]}>
                            {isCreditworthy ? "20% Equity Reserve Requirement Met" : "Insufficient Bank Balance (20% Required)"}
                        </Text>
                        <Text style={[styles.infoBannerDesc, { color: isCreditworthy ? '#047857' : '#B91C1C' }]}>
                            To establish creditworthiness, the MTG must hold at least 20% ({formatCurrency(requiredReserve)}) of the requested input loan ({formatCurrency(totalAmount)}) in its registered bank account.
                        </Text>
                    </View>
                </View>

                {/* MTG Bank Account & Reserve Verification Card */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#E2E8F0' }]}>
                    <View style={styles.cardHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name="bank" size={20} color="#0E6F6A" />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>MTG Bank Account Balance</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isCreditworthy ? '#D1FAE5' : '#FEE2E2' }]}>
                            <Text style={[styles.statusText, { color: isCreditworthy ? '#065F46' : '#DC2626' }]}>
                                {isCreditworthy ? 'Eligible (20%+)' : 'Shortfall'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.bankNameText, { color: colors.textMuted }]}>
                        {bankName} • Acc: {accountNumber} ({groupName})
                    </Text>

                    {/* Current Balance Display */}
                    <Text style={[styles.bigAmount, { color: isCreditworthy ? '#065F46' : '#DC2626' }]}>
                        {formatCurrency(bankBalance)}
                    </Text>

                    <View style={styles.metricsGrid}>
                        <View style={[styles.metricBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
                            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Total Loan Requested</Text>
                            <Text style={[styles.metaValue, { color: colors.text }]}>{formatCurrency(totalAmount)}</Text>
                        </View>
                        <View style={[styles.metricBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
                            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Required 20% Reserve</Text>
                            <Text style={[styles.metaValue, { color: '#0E6F6A' }]}>{formatCurrency(requiredReserve)}</Text>
                        </View>
                    </View>

                    {/* Reserve Progress Bar */}
                    <View style={{ marginTop: 14 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Reserve Coverage Ratio</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: isCreditworthy ? '#059669' : '#DC2626' }}>
                                {coverageRate}% ({isCreditworthy ? `+${formatCurrency(surplusOrDeficit)} surplus` : `${formatCurrency(Math.abs(surplusOrDeficit))} deficit`})
                            </Text>
                        </View>
                        <View style={[styles.progressBg, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        width: `${Math.min(coverageRate, 100)}%`,
                                        backgroundColor: isCreditworthy ? '#059669' : '#DC2626'
                                    }
                                ]} 
                            />
                        </View>
                    </View>
                </View>

                {/* Creditworthiness Score Card */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#E2E8F0' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Creditworthiness & Loan Eligibility Score</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                        Computed automatically from 20% cash reserve coverage, savings discipline, and attendance.
                    </Text>

                    <View style={styles.scoreRow}>
                        <View style={styles.scoreLeft}>
                            <View style={[styles.scoreIconCircle, { backgroundColor: isCreditworthy ? '#D1FAE5' : '#FEE2E2' }]}>
                                <Ionicons 
                                    name={isCreditworthy ? "checkmark-circle" : "alert-circle"} 
                                    size={24} 
                                    color={isCreditworthy ? "#059669" : "#DC2626"} 
                                />
                            </View>
                            <View>
                                <Text style={[styles.scoreStatusLabel, { color: isCreditworthy ? '#065F46' : '#991B1B' }]}>
                                    {isCreditworthy ? "Approved for Loan" : "Review / Top-up Required"}
                                </Text>
                                <Text style={[styles.scoreSubLabel, { color: colors.textMuted }]}>
                                    {isCreditworthy ? "Meets 20% collateral threshold" : "Group balance below 20% loan value"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.scoreRight}>
                            <Text style={[styles.scoreValue, { color: isCreditworthy ? '#065F46' : '#DC2626' }]}>{creditScore}</Text>
                            <Text style={[styles.scoreTotal, { color: colors.textMuted }]}>/100</Text>
                        </View>
                    </View>

                    <View style={[styles.scoreDivider, { backgroundColor: isDarkMode ? colors.border : '#E2E8F0' }]} />

                    <View style={styles.scoreBreakdown}>
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreItemLabel, { color: colors.textMuted }]}>20% Bank Reserve:</Text>
                            <Text style={[styles.scoreItemValue, { color: isCreditworthy ? '#059669' : '#DC2626' }]}>
                                {isCreditworthy ? 'Satisfied' : 'Shortfall'}
                            </Text>
                        </View>
                        <View style={styles.scoreSep} />
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreItemLabel, { color: colors.textMuted }]}>Repayment History:</Text>
                            <Text style={[styles.scoreItemValue, { color: '#059669' }]}>100% On-Time</Text>
                        </View>
                        <View style={styles.scoreSep} />
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreItemLabel, { color: colors.textMuted }]}>MTG Meetings:</Text>
                            <Text style={[styles.scoreItemValue, { color: '#059669' }]}>96% Active</Text>
                        </View>
                    </View>
                </View>

                {/* Member Savings Breakdown in Group Account */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#E2E8F0' }]}>
                    <View style={styles.memberHeaderRow}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Member Savings Breakdown</Text>
                        <Text style={[styles.memberCount, { color: colors.textMuted }]}>
                            {groupMembers.length > 0 ? `${groupMembers.length} active members` : '0 members'}
                        </Text>
                    </View>

                    {groupMembers.length === 0 ? (
                        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 13 }}>No member savings records registered yet</Text>
                        </View>
                    ) : (
                        groupMembers.map((member) => (
                            <View key={member.id} style={[styles.memberRow, { borderBottomColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                                <View style={[styles.memberAvatar, { backgroundColor: member.bg }]}>
                                    <Text style={[styles.memberInitials, { color: member.color }]}>{member.initials}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                                        Member Share: {bankBalance > 0 ? Math.round((member.savings / bankBalance) * 100) : 0}%
                                    </Text>
                                </View>
                                <Text style={[styles.memberAmount, { color: colors.text }]}>{formatCurrency(member.savings)}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                                    <Text style={[styles.statusText, { color: '#065F46' }]}>Verified</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                <TouchableOpacity
                    style={[styles.nextBtn, !isCreditworthy && { backgroundColor: '#D97706' }]}
                    onPress={() => router.push({ 
                        pathname: '/mtgFundingReview', 
                        params: { 
                            groupId: params.groupId,
                            groupName, 
                            totalAmount: totalAmount.toString(),
                            bankBalance: bankBalance.toString(),
                            requiredReserve: requiredReserve.toString(),
                            creditScore: creditScore.toString(),
                            allocations: params.allocations,
                            entryMode: params.entryMode
                        } 
                    })}
                >
                    <Text style={styles.nextBtnText}>
                        {isCreditworthy ? 'Next: Review Request' : 'Proceed to Review (Notice Applied)'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 155, paddingHorizontal: 16 },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    infoBannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    infoBannerDesc: { fontSize: 11, lineHeight: 16 },
    card: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardTitle: { fontSize: 15, fontWeight: '700' },
    cardSubtitle: { fontSize: 11, marginTop: 2, marginBottom: 12 },
    bankNameText: { fontSize: 11, marginBottom: 10 },
    bigAmount: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
    metricsGrid: { flexDirection: 'row', gap: 10, marginBottom: 6 },
    metricBox: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    metaLabel: { fontSize: 10, marginBottom: 2 },
    metaValue: { fontSize: 14, fontWeight: '700' },
    progressBg: { height: 8, borderRadius: 4 },
    progressFill: { height: 8, borderRadius: 4 },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
    scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    scoreIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    scoreStatusLabel: { fontSize: 13, fontWeight: '700' },
    scoreSubLabel: { fontSize: 10 },
    scoreRight: { flexDirection: 'row', alignItems: 'baseline' },
    scoreValue: { fontSize: 24, fontWeight: '800' },
    scoreTotal: { fontSize: 12 },
    scoreDivider: { height: 1, marginVertical: 10 },
    scoreBreakdown: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    scoreItem: { alignItems: 'center' },
    scoreItemLabel: { fontSize: 10 },
    scoreItemValue: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    scoreSep: { width: 1, height: 20, backgroundColor: '#E2E8F0' },
    memberHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    memberCount: { fontSize: 11 },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        gap: 10,
    },
    memberAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberInitials: { fontSize: 11, fontWeight: '700' },
    memberName: { fontSize: 13, fontWeight: '600' },
    memberAmount: { fontSize: 13, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '700' },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 34,
        borderTopWidth: 1,
    },
    nextBtn: {
        backgroundColor: '#065F46',
        borderRadius: 14,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    nextBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
});

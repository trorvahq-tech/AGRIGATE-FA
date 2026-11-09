import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { draftService, RegistrationDraft } from '../../services/draftService';
import { registrationState } from '../../services/registrationState';

const { width } = Dimensions.get('window');

const STEP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }, // Personal Details
    2: { bg: '#FDF4FF', text: '#A21CAF', border: '#F5D0FE' }, // KYC
    3: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // Farm Details & GPS
    4: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' }, // Survey
    5: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' }, // Final
};

export default function DraftsScreen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const { colors, isDarkMode } = useTheme();
    const [drafts, setDrafts] = useState<RegistrationDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDrafts = useCallback(async () => {
        try {
            const list = await draftService.getDrafts();
            setDrafts(list);
        } catch (err) {
            console.warn('Failed to load drafts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDrafts();
    }, [loadDrafts]);

    const handleResumeDraft = async (draft: RegistrationDraft) => {
        try {
            await draftService.resumeDraft(draft, router, navigation);
        } catch (err) {
            Alert.alert('Error', 'Unable to resume draft. Please try again.');
        }
    };

    const handleDeleteDraft = (draft: RegistrationDraft) => {
        Alert.alert(
            'Delete Draft?',
            `Are you sure you want to discard the saved draft for "${draft.farmerName}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await draftService.deleteDraft(draft.id);
                        loadDrafts();
                    },
                },
            ]
        );
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderDraftItem = ({ item }: { item: RegistrationDraft }) => {
        const stepNum = item.stepNumber || 1;
        const colorStyle = STEP_COLORS[stepNum] || STEP_COLORS[1];
        const progressPct = stepNum * 20;

        return (
            <View style={[styles.card, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
                {/* Top Row: Name & Step Badge */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.farmerName, { color: isDarkMode ? colors.text : '#111827' }]} numberOfLines={1}>
                            {item.farmerName}
                        </Text>
                        <Text style={styles.savedDate}>Last saved: {formatDate(item.lastSaved)}</Text>
                    </View>
                    <View style={[styles.stepBadge, { backgroundColor: colorStyle.bg, borderColor: colorStyle.border }]}>
                        <Text style={[styles.stepBadgeText, { color: colorStyle.text }]}>
                            Step {stepNum} of 5 ({progressPct}%)
                        </Text>
                    </View>
                </View>

                {/* Step Subtitle */}
                <View style={styles.stepTitleRow}>
                    <Ionicons name="git-commit-outline" size={14} color="#6B7280" />
                    <Text style={styles.stepTitleText}>{item.stepTitle || 'Personal Details'}</Text>
                </View>

                {/* Snapshot Details */}
                <View style={styles.detailsRow}>
                    {item.data?.phone ? (
                        <View style={styles.detailPill}>
                            <Ionicons name="call-outline" size={12} color="#4B5563" />
                            <Text style={styles.detailText}>{item.data.phone}</Text>
                        </View>
                    ) : null}
                    {item.data?.primaryCrop ? (
                        <View style={styles.detailPill}>
                            <Ionicons name="leaf-outline" size={12} color="#059669" />
                            <Text style={[styles.detailText, { color: '#059669' }]}>{item.data.primaryCrop}</Text>
                        </View>
                    ) : null}
                    {item.data?.farmSizeHa ? (
                        <View style={styles.detailPill}>
                            <MaterialCommunityIcons name="ruler-square" size={12} color="#2563EB" />
                            <Text style={[styles.detailText, { color: '#2563EB' }]}>{item.data.farmSizeHa} ha</Text>
                        </View>
                    ) : item.data?.farmSizeAcres ? (
                        <View style={styles.detailPill}>
                            <MaterialCommunityIcons name="ruler-square" size={12} color="#2563EB" />
                            <Text style={[styles.detailText, { color: '#2563EB' }]}>{item.data.farmSizeAcres} ac</Text>
                        </View>
                    ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.resumeBtn}
                        onPress={() => handleResumeDraft(item)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="play-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.resumeBtnText}>Resume Registration</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteDraft(item)}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete draft"
                    >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#F9FAFB' }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title="Registration Drafts"
                onBackPress={() => {
                    if (navigation?.canGoBack && navigation.canGoBack()) {
                        navigation.goBack();
                    } else if (router.canGoBack()) {
                        router.back();
                    } else if (navigation?.navigate) {
                        navigation.navigate('farmers');
                    } else {
                        router.navigate('/(agent)/farmers' as any);
                    }
                }}
            />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0E6F6A" />
                </View>
            ) : (
                <FlatList
                    data={drafts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDraftItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadDrafts();
                            }}
                            colors={['#0E6F6A']}
                        />
                    }
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={[styles.headerTextCol, { flex: 1, marginRight: 10 }]}>
                                    <Text style={[styles.headerTitle, { color: isDarkMode ? colors.text : '#111827' }]}>
                                        Saved Drafts ({drafts.length})
                                    </Text>
                                    <Text style={styles.headerSub}>
                                        Resume in-progress farmer registrations at any time. All steps, boundaries, and survey inputs are preserved.
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.headerNewBtn}
                                    onPress={async () => {
                                        try {
                                            await draftService.startNewRegistration();
                                        } catch (e) {
                                            console.warn('startNewRegistration error:', e);
                                        }
                                        if (navigation?.navigate) {
                                            navigation.navigate('register-farmer/personal-details', { isNew: 'true' });
                                        } else {
                                            router.navigate({
                                                pathname: '/(agent)/register-farmer/personal-details',
                                                params: { isNew: 'true' }
                                            } as any);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add" size={16} color="#FFFFFF" />
                                    <Text style={styles.headerNewBtnText}>New</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBg}>
                                <Ionicons name="bookmark-outline" size={36} color="#0E6F6A" />
                            </View>
                            <Text style={[styles.emptyTitle, { color: isDarkMode ? colors.text : '#111827' }]}>
                                No Saved Drafts
                            </Text>
                            <Text style={styles.emptyDesc}>
                                When you are filling out a farmer registration form, tap the bookmark icon at the top right to save your progress as a draft and return to it later.
                            </Text>
                            <TouchableOpacity
                                style={styles.startRegBtn}
                                onPress={async () => {
                                    try {
                                        await draftService.startNewRegistration();
                                    } catch (e) {
                                        console.warn('startNewRegistration error:', e);
                                    }
                                    if (navigation?.navigate) {
                                        navigation.navigate('register-farmer/personal-details', { isNew: 'true' });
                                    } else {
                                        router.navigate({
                                            pathname: '/(agent)/register-farmer/personal-details',
                                            params: { isNew: 'true' }
                                        } as any);
                                    }
                                }}
                            >
                                <Ionicons name="person-add-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.startRegBtnText}>Register New Farmer</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingTop: 155,
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 16,
    },
    headerTextCol: {
        gap: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    headerSub: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
    headerNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0E6F6A',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        gap: 4,
    },
    headerNewBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    farmerName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    savedDate: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    stepBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    stepBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    stepTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        marginBottom: 10,
    },
    stepTitleText: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 14,
    },
    detailPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    detailText: {
        fontSize: 11,
        color: '#374151',
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    resumeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E6F6A',
        paddingVertical: 10,
        borderRadius: 10,
    },
    resumeBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    deleteBtn: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    emptyIconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E2F2E4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    startRegBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0E6F6A',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    startRegBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});

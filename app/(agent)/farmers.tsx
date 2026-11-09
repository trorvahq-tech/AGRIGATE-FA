import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useFarmers, useUpdateFarmer } from '../../hooks/api/useFarmers';
import { useMe } from '../../hooks/api/useAuth';
import { registrationState } from '../../services/registrationState';
import { draftService } from '../../services/draftService';
import { geoService } from '../../services/geoService';

const { width } = Dimensions.get('window');

type FilterKey = 'all' | 'active' | 'inactive' | 'undecided';
const FILTER_KEYS: FilterKey[] = ['all', 'active', 'inactive', 'undecided'];

export default function FarmersScreen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    const { data: apiFarmers, isLoading } = useFarmers();
    const { data: meData } = useMe();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [originFilter, setOriginFilter] = useState<'all' | 'onboarded' | 'assigned'>('all');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    // Season participation states
    const [selectedSeason, setSelectedSeason] = useState<string>('Dry Season 2026');
    const [statusChangeTarget, setStatusChangeTarget] = useState<any | null>(null);
    const [isSavingStatus, setIsSavingStatus] = useState(false);
    const [draftsCount, setDraftsCount] = useState<number>(0);
    const updateFarmerMutation = useUpdateFarmer();

    useFocusEffect(
        useCallback(() => {
            draftService.getDraftsCount().then(setDraftsCount);
        }, [])
    );

    const SEASONS = ['Dry Season 2026', 'Wet Season 2026', 'Dry Season 2027', 'Wet Season 2027'];

    const farmersList = useMemo(() => {
        if (!apiFarmers || !Array.isArray(apiFarmers)) return [];
        return apiFarmers.map((f: any, idx: number) => {
            const initials = (f.fullName || f.name) ? (f.fullName || f.name).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'FR';
            const colorsList = ['#BE185D', '#EA580C', '#DC2626', '#CA8A04', '#059669', '#2563EB', '#7C3AED'];
            const bgsList = ['#FCE7F3', '#FFF7ED', '#FEF2F2', '#FEFCE8', '#ECFDF5', '#EFF6FF', '#F3E8FF'];
            const colorIdx = idx % colorsList.length;
            
            const stateName = f.location?.state?.name || f.metadata?.stateName || '';
            const communityName = f.location?.community || f.community || f.metadata?.community || '';
            const locString = geoService.formatLocationString(communityName, stateName);
            
            // Map season participation status (default to Undecided)
            const statusRaw = f.metadata?.seasons?.[selectedSeason] || 'undecided';
            const statusVal = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);

            const createdBy = f.createdByUserId || f.created_by_user_id || f.metadata?.created_by_user_id || f.metadata?.onboardedByUserId;
            const myUserId = meData?.id;
            const isSelfOnboarded = Boolean(
                (createdBy && myUserId && createdBy === myUserId) ||
                (f.metadata?.onboardedByAgentId && myUserId && f.metadata.onboardedByAgentId === myUserId) ||
                (f.metadata?.registeredByRole === 'vcm' && (!createdBy || createdBy === myUserId))
            );
            const origin: 'onboarded' | 'assigned' = isSelfOnboarded ? 'onboarded' : 'assigned';

            return {
                id: f.id,
                initials,
                initialsBg: bgsList[colorIdx],
                initialsColor: colorsList[colorIdx],
                name: f.fullName || f.name || 'Farmer',
                farm: communityName ? `${communityName} Farm` : (f.metadata?.farmName || '—'),
                crop: f.metadata?.primaryCrop ? (f.metadata?.secondaryCrop ? `${f.metadata.primaryCrop} • ${f.metadata.secondaryCrop}` : f.metadata.primaryCrop) : (f.farms?.[0]?.primaryCrop || f.farms?.[0]?.primary_crop || f.farms?.[0]?.crop || '—'),
                area: f.metadata?.farm_size_hectares ? `${f.metadata.farm_size_hectares} ha` : (f.metadata?.farmSizeHa ? `${f.metadata.farmSizeHa} ha` : (f.farms?.[0]?.sizeHectares ? `${f.farms[0].sizeHectares} ha` : (f.farms?.[0]?.size_hectares ? `${f.farms[0].size_hectares} ha` : (f.metadata?.farm_size_acres ? `${(parseFloat(f.metadata.farm_size_acres) * 0.404686).toFixed(2)} ha` : '—')))),
                phone: f.phone || '—',
                status: statusVal,
                origin,
                location: locString,
                createdAt: f.createdAt,
                rawMetadata: f.metadata || {}
            };
        });
    }, [apiFarmers, selectedSeason, meData]);

    const totalCount = farmersList.length;
    const activeCount = farmersList.filter(f => f.status === 'Active').length;
    const inactiveCount = farmersList.filter(f => f.status === 'Inactive').length;
    const undecidedCount = farmersList.filter(f => f.status === 'Undecided').length;
    const onboardedCount = farmersList.filter(f => f.origin === 'onboarded').length;
    const assignedCount = farmersList.filter(f => f.origin === 'assigned').length;

    const dynamicSummaryCards = useMemo(() => {
        return [
            { title: 'Total Farmers', count: totalCount, subtitle: 'All time', icon: 'people-outline', color: '#065F46', bgColor: '#ECFDF5' },
            { title: 'Active (Season)', count: activeCount, subtitle: selectedSeason, icon: 'people-outline', color: '#065F46', bgColor: '#ECFDF5' },
            { title: 'Inactive (Season)', count: inactiveCount, subtitle: selectedSeason, icon: 'alert-circle-outline', color: '#DC2626', bgColor: '#FEF2F2' },
            { title: 'Undecided (Season)', count: undecidedCount, subtitle: selectedSeason, icon: 'help-circle-outline', color: '#D97706', bgColor: '#FEF3C7' },
        ];
    }, [totalCount, activeCount, inactiveCount, undecidedCount, selectedSeason]);

    const dynamicFilterTabs = useMemo(() => {
        return [
            `All (${totalCount})`,
            `Active (${activeCount})`,
            `Inactive (${inactiveCount})`,
            `Undecided (${undecidedCount})`
        ];
    }, [totalCount, activeCount, inactiveCount, undecidedCount]);

    const crops = useMemo(() => Array.from(new Set(farmersList.map(f => f.crop))), [farmersList]);
    const locations = useMemo(() => Array.from(new Set(farmersList.map(f => f.location))), [farmersList]);

    const displayFarmers = useMemo(() => {
        let filtered = farmersList;
        if (originFilter === 'onboarded') filtered = filtered.filter(f => f.origin === 'onboarded');
        else if (originFilter === 'assigned') filtered = filtered.filter(f => f.origin === 'assigned');

        if (activeFilter === 'active') filtered = filtered.filter(f => f.status === 'Active');
        else if (activeFilter === 'inactive') filtered = filtered.filter(f => f.status === 'Inactive');
        else if (activeFilter === 'undecided') filtered = filtered.filter(f => f.status === 'Undecided');

        if (selectedCrop) {
            filtered = filtered.filter(f => f.crop === selectedCrop);
        }

        if (selectedLocation) {
            filtered = filtered.filter(f => f.location === selectedLocation);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(f =>
                f.name.toLowerCase().includes(q) ||
                f.farm.toLowerCase().includes(q) ||
                f.crop.toLowerCase().includes(q) ||
                f.location.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [farmersList, activeFilter, searchQuery, selectedCrop, selectedLocation]);

    const clearFilters = () => {
        setSelectedCrop(null);
        setSelectedLocation(null);
        setActiveFilter('all');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return '#065F46';
            case 'inactive': return '#B91C1C';
            case 'undecided': return '#D97706';
            default: return '#6B7280';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return '#ECFDF5';
            case 'inactive': return '#FEF2F2';
            case 'undecided': return '#FEF3C7';
            default: return '#F3F4F6';
        }
    };

    const openStatusSelector = (farmer: any) => {
        setStatusChangeTarget(farmer);
    };

    const handleUpdateStatus = async (status: string) => {
        if (!statusChangeTarget) return;
        setIsSavingStatus(true);
        try {
            await updateFarmerMutation.mutateAsync({
                id: statusChangeTarget.id,
                farmerData: {
                    metadata: {
                        ...(statusChangeTarget.rawMetadata || {}),
                        seasons: {
                            ...(statusChangeTarget.rawMetadata?.seasons || {}),
                            [selectedSeason]: status
                        }
                    }
                }
            });
            setStatusChangeTarget(null);
        } catch (err) {
            console.error("Failed to update farmer season status:", err);
        } finally {
            setIsSavingStatus(false);
        }
    };

const AVATAR = require('../../assets/images/whoLogin2.png');

const renderFarmerItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
        style={styles.farmerRow} 
        onPress={() => router.push({ pathname: '/(agent)/farmerDetails', params: { id: item.id } })}
        onLongPress={() => openStatusSelector(item)}
        delayLongPress={300}
        activeOpacity={0.7}
    >
        <View style={styles.farmerAvatarContainer}>
            <Image source={AVATAR} style={styles.farmerAvatar} contentFit="cover" />
            <View style={[styles.avatarOverlay, { backgroundColor: item.initialsColor + '20' }]} />
        </View>
        <View style={styles.farmerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                    <Text style={styles.farmerName}>{item.name}</Text>
                    {item.origin === 'onboarded' ? (
                        <View style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Ionicons name="person-add" size={10} color="#065F46" />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#065F46' }}>Onboarded</Text>
                        </View>
                    ) : (
                        <View style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Ionicons name="business" size={10} color="#1D4ED8" />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}>Assigned by Admin</Text>
                        </View>
                    )}
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoText}>{item.farm}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="leaf-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoText}>{item.crop} • {item.area}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={13} color="#065F46" />
                    <Text style={[styles.infoText, { color: '#065F46', fontWeight: '600' }]}>{item.phone}</Text>
                </View>
            </View>
            <View style={styles.farmerRight}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
                <Text style={styles.locationText} numberOfLines={2}>{item.location}</Text>
                <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="dark" hidden={false} />

            <CustomNavBar textColor={colors.textSecondary} blurIntensity={10} title="" />

            <FlatList
                data={displayFarmers}
                keyExtractor={(item) => item.id}
                renderItem={renderFarmerItem}
                contentContainerStyle={{ paddingTop: 155, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={{ paddingVertical: 40, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#065F46" />
                        </View>
                    ) : (
                        <View style={{ paddingVertical: 40, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: colors.textMuted }}>No farmers found matching filters.</Text>
                        </View>
                    )
                }
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <View style={styles.headerSection}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pageTitle}>Farmers</Text>
                                <Text style={styles.pageSubtitle}>Manage and view all farmers in your network.</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TouchableOpacity 
                                    style={styles.draftsBtn} 
                                    onPress={() => {
                                        if (navigation?.navigate) {
                                            navigation.navigate('drafts');
                                        } else {
                                            router.navigate('/(agent)/drafts' as any);
                                        }
                                    }}
                                >
                                    <Ionicons name="bookmark-outline" size={15} color="#0E6F6A" />
                                    <Text style={styles.draftsBtnText}>
                                        {draftsCount > 0 ? `Drafts (${draftsCount})` : 'Drafts'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.addFarmerBtn} 
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
                                    <Ionicons name="person-add-outline" size={15} color="white" />
                                    <Text style={styles.addFarmerText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Season Selector */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 }}>Active Planting Season</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {SEASONS.map((season) => {
                                    const isSelected = season === selectedSeason;
                                    return (
                                        <TouchableOpacity
                                            key={season}
                                            style={{
                                                backgroundColor: isSelected ? '#065F46' : '#FFFFFF',
                                                borderColor: isSelected ? '#065F46' : '#D1D5DB',
                                                borderWidth: 1,
                                                borderRadius: 20,
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                flexDirection: 'row',
                                                alignItems: 'center'
                                            }}
                                            onPress={() => setSelectedSeason(season)}
                                        >
                                            <Ionicons name="calendar-outline" size={14} color={isSelected ? 'white' : '#6B7280'} style={{ marginRight: 6 }} />
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? 'white' : '#374151' }}>{season}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Origin Filter Segment (All vs Onboarded by Me vs Assigned to Me) */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                            <View style={{ 
                                flexDirection: 'row', 
                                backgroundColor: '#E5E7EB', 
                                borderRadius: 12, 
                                padding: 3 
                            }}>
                                <TouchableOpacity 
                                    onPress={() => setOriginFilter('all')}
                                    style={{ 
                                        flex: 1, 
                                        paddingVertical: 7, 
                                        alignItems: 'center', 
                                        borderRadius: 9,
                                        backgroundColor: originFilter === 'all' ? '#FFFFFF' : 'transparent',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: originFilter === 'all' ? '#065F46' : '#6B7280' }}>
                                        All ({totalCount})
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setOriginFilter('onboarded')}
                                    style={{ 
                                        flex: 1, 
                                        paddingVertical: 7, 
                                        alignItems: 'center', 
                                        borderRadius: 9,
                                        backgroundColor: originFilter === 'onboarded' ? '#FFFFFF' : 'transparent',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: originFilter === 'onboarded' ? '#065F46' : '#6B7280' }}>
                                        Onboarded ({onboardedCount})
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setOriginFilter('assigned')}
                                    style={{ 
                                        flex: 1, 
                                        paddingVertical: 7, 
                                        alignItems: 'center', 
                                        borderRadius: 9,
                                        backgroundColor: originFilter === 'assigned' ? '#FFFFFF' : 'transparent',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: originFilter === 'assigned' ? '#065F46' : '#6B7280' }}>
                                        Assigned ({assignedCount})
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Summary Cards */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.summaryRow}
                        >
                            {dynamicSummaryCards.map((card, idx) => (
                                <View key={idx} style={styles.summaryCard}>
                                    <View style={[styles.summaryIconBg, { backgroundColor: card.bgColor }]}>
                                        <Ionicons name={card.icon as any} size={18} color={card.color} />
                                    </View>
                                    <Text style={[styles.summaryCount, { color: card.color }]}>{card.count}</Text>
                                    <Text style={styles.summaryTitle}>{card.title}</Text>
                                    <Text style={styles.summarySub}>{card.subtitle}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Search + Filter */}
                        <View style={styles.searchRow}>
                            <View style={styles.searchBox}>
                                <Feather name="search" size={18} color="#9CA3AF" />
                                <TextInput
                                    placeholder="Search by name, farm, location or crop..."
                                    style={styles.searchInput}
                                    placeholderTextColor="#9CA3AF"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity 
                                style={[styles.filterDropdown, (selectedCrop || selectedLocation) && { borderColor: '#065F46', backgroundColor: '#ECFDF5' }]} 
                                onPress={() => setFilterModalVisible(true)}
                            >
                                <Ionicons name="filter-outline" size={16} color={(selectedCrop || selectedLocation) ? '#065F46' : '#374151'} />
                                <Text style={[styles.filterDropdownText, (selectedCrop || selectedLocation) && { color: '#065F46' }]}>Filter</Text>
                                <Feather name="chevron-down" size={14} color={(selectedCrop || selectedLocation) ? '#065F46' : '#374151'} />
                            </TouchableOpacity>
                        </View>

                        {/* Filter Tabs */}
                        <View style={styles.tabsContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                                {dynamicFilterTabs.map((tab, idx) => {
                                    const isActive = FILTER_KEYS[idx] === activeFilter;
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.tabItem}
                                            onPress={() => setActiveFilter(FILTER_KEYS[idx])}
                                        >
                                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                                            {isActive && <View style={styles.tabActiveIndicator} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </>
                }
                ListFooterComponent={
                    <View style={styles.paginationFooter}>
                        <View style={styles.paginationRow}>
                            <Ionicons name="people-outline" size={16} color="#6B7280" />
                            <Text style={styles.paginationText}>Showing 1 – {displayFarmers.length} of {totalCount} farmers</Text>
                        </View>
                        <TouchableOpacity style={styles.loadMoreRow}>
                            <Text style={styles.loadMoreText}>Load more</Text>
                            <Feather name="chevron-down" size={14} color="#065F46" />
                        </TouchableOpacity>
                    </View>
                }
            />
            {/* Season Status Selection Modal */}
            <Modal
                isVisible={!!statusChangeTarget}
                onBackdropPress={() => !isSavingStatus && setStatusChangeTarget(null)}
                onBackButtonPress={() => !isSavingStatus && setStatusChangeTarget(null)}
                backdropOpacity={0.5}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                style={{ margin: 0, justifyContent: 'flex-end' }}
                useNativeDriver
                hideModalContentWhileAnimating
            >
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 }}>
                    <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Season Participation</Text>
                            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                Set status for {statusChangeTarget?.name} in {selectedSeason}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => !isSavingStatus && setStatusChangeTarget(null)}>
                            <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {isSavingStatus ? (
                        <View style={{ paddingVertical: 30, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="large" color="#0E6F6A" />
                            <Text style={{ marginTop: 10, color: '#4B5563', fontSize: 14 }}>Saving status...</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 12 }}>
                            {/* Active option */}
                            <TouchableOpacity 
                                style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    backgroundColor: '#ECFDF5', 
                                    padding: 16, 
                                    borderRadius: 12, 
                                    borderWidth: statusChangeTarget?.status === 'Active' ? 2 : 0, 
                                    borderColor: '#065F46' 
                                }}
                                onPress={() => handleUpdateStatus('active')}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                    <Ionicons name="checkmark-circle" size={20} color="#065F46" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#065F46' }}>Active (Practicing)</Text>
                                    <Text style={{ fontSize: 12, color: '#047857' }}>Farmer is active and practicing in this season</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Inactive option */}
                            <TouchableOpacity 
                                style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    backgroundColor: '#FEF2F2', 
                                    padding: 16, 
                                    borderRadius: 12, 
                                    borderWidth: statusChangeTarget?.status === 'Inactive' ? 2 : 0, 
                                    borderColor: '#B91C1C' 
                                }}
                                onPress={() => handleUpdateStatus('inactive')}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                    <Ionicons name="close-circle" size={20} color="#B91C1C" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#B91C1C' }}>Inactive (Not Practicing)</Text>
                                    <Text style={{ fontSize: 12, color: '#B91C1C' }}>Farmer is not participating in this season</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Undecided option */}
                            <TouchableOpacity 
                                style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    backgroundColor: '#FEF3C7', 
                                    padding: 16, 
                                    borderRadius: 12, 
                                    borderWidth: statusChangeTarget?.status === 'Undecided' ? 2 : 0, 
                                    borderColor: '#D97706' 
                                }}
                                onPress={() => handleUpdateStatus('undecided')}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                    <Ionicons name="help-circle" size={20} color="#D97706" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#D97706' }}>Undecided</Text>
                                    <Text style={{ fontSize: 12, color: '#B45309' }}>Participation is undecided or pending review</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Filter Modal */}
            <Modal
                isVisible={isFilterModalVisible}
                onBackdropPress={() => setFilterModalVisible(false)}
                onBackButtonPress={() => setFilterModalVisible(false)}
                backdropOpacity={0.5}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                style={{ margin: 0, justifyContent: 'flex-end' }}
                useNativeDriver
                hideModalContentWhileAnimating
            >
                <View style={[styles.modalContent, { backgroundColor: 'white' }]}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter Farmers</Text>
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.clearAllText}>Clear All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Crop Type</Text>
                            <View style={styles.filterOptions}>
                                {crops.map((crop) => (
                                    <TouchableOpacity
                                        key={crop}
                                        style={[styles.filterChip, selectedCrop === crop && styles.filterChipActive]}
                                        onPress={() => setSelectedCrop(selectedCrop === crop ? null : crop)}
                                    >
                                        <Text style={[styles.filterChipText, selectedCrop === crop && styles.filterChipTextActive]}>
                                            {crop}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Location</Text>
                            <View style={styles.filterOptions}>
                                {locations.map((loc) => (
                                    <TouchableOpacity
                                        key={loc}
                                        style={[styles.filterChip, selectedLocation === loc && styles.filterChipActive]}
                                        onPress={() => setSelectedLocation(selectedLocation === loc ? null : loc)}
                                    >
                                        <Text style={[styles.filterChipText, selectedLocation === loc && styles.filterChipTextActive]}>
                                            {loc}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity 
                        style={styles.applyBtn} 
                        onPress={() => setFilterModalVisible(false)}
                    >
                        <Text style={styles.applyBtnText}>Show {displayFarmers.length} Results</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    headerSection: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    draftsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 5,
    },
    draftsBtnText: {
        color: '#065F46',
        fontSize: 13,
        fontWeight: '700',
    },
    addFarmerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#065F46',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    addFarmerText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    summaryRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
        width: 130,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    summaryIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    summaryCount: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    summaryTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    summarySub: {
        fontSize: 9,
        color: '#9CA3AF',
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 16,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 13,
        color: '#111827',
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        backgroundColor: '#FFFFFF',
    },
    filterDropdownText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    tabsContainer: {
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 8,
    },
    tabsScroll: {
        flexDirection: 'row',
        gap: 24,
    },
    tabItem: {
        paddingVertical: 12,
        position: 'relative',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#065F46',
        fontWeight: '700',
    },
    tabActiveIndicator: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#065F46',
        borderRadius: 3,
    },
    farmerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    farmerAvatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    farmerAvatar: {
        width: '100%',
        height: '100%',
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFill,
    },
    farmerInfo: {
        flex: 1,
    },
    farmerName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    infoText: {
        fontSize: 12,
        color: '#6B7280',
    },
    farmerRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 6,
        maxWidth: 110,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    locationText: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'right',
    },
    paginationFooter: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
    },
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    paginationText: {
        fontSize: 12,
        color: '#6B7280',
    },
    loadMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    loadMoreText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#065F46',
    },
    // Modal Styles
    modalContent: {
        padding: 20,
        paddingBottom: 40,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    clearAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
    filterSection: {
        marginBottom: 24,
    },
    filterSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#065F46',
    },
    filterChipText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#065F46',
        fontWeight: '700',
    },
    applyBtn: {
        backgroundColor: '#065F46',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    applyBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});

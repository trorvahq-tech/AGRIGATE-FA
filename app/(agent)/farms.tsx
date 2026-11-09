import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useFarms } from '../../hooks/api/useFarms';

const { width } = Dimensions.get('window');

interface FarmItem {
    id: string;
    name: string;
    size: string;
    location: string;
    assignedTo: string;
    subPlots: number;
    status: string;
    activitiesCount: number;
    lastActivityDate: string;
    section: string;
    attentionReason?: string;
}

const getStatusColor = (status: string) => {
    if (status === 'Active') return '#4CAF50'; // Green
    if (status === 'In progress') return '#FFC107'; // Yellow
    if (status === 'Needs visit') return '#F44336'; // Red
    return '#9E9E9E'; // Grey
};

const StatusDot = ({ status }: { status: string }) => (
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getStatusColor(status), marginRight: 4 }} />
);

export default function FarmsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const { data: apiFarms, isLoading } = useFarms();
    const [searchQuery, setSearchQuery] = React.useState('');

    const displayFarms: FarmItem[] = React.useMemo(() => {
        if (!apiFarms || !Array.isArray(apiFarms)) return [];
        return apiFarms.map((f: any) => {
            const activitiesCount = f.metadata?.activitiesCount ?? (Array.isArray(f.metadata?.tasks) ? f.metadata.tasks.length : 0);
            const lastActivity = f.metadata?.lastActivityDate || (f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : 'No activity yet');
            const isActive = f.is_active ?? f.isActive ?? true;

            return {
                id: f.id,
                name: f.name || 'Crop Farm',
                size: f.size_hectares ? `${f.size_hectares} ha` : (f.sizeHectares ? `${f.sizeHectares} ha` : '—'),
                location: f.community || [f.lga, f.state].filter(Boolean).join(', ') || 'Kaduna State',
                assignedTo: f.farmer_name || f.farmerName || 'Assigned Farmer',
                subPlots: f.subplots_count || f.subPlotsCount || 0,
                status: isActive ? 'Active' : 'Needs visit',
                activitiesCount,
                lastActivityDate: lastActivity,
                section: isActive ? 'all' : 'attention',
                attentionReason: isActive ? undefined : 'Needs visit'
            };
        });
    }, [apiFarms]);

    const filteredFarms = React.useMemo(() => {
        if (!searchQuery.trim()) return displayFarms;
        const q = searchQuery.toLowerCase();
        return displayFarms.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.location.toLowerCase().includes(q) ||
            f.assignedTo.toLowerCase().includes(q)
        );
    }, [displayFarms, searchQuery]);

    const activeTodayFarms = filteredFarms.filter((f: FarmItem) => f.section === 'active');
    const needsAttentionFarms = filteredFarms.filter((f: FarmItem) => f.section === 'attention');
    const restFarms = filteredFarms.filter((f: FarmItem) => f.section === 'all');

    const renderSmartRow = (farm: FarmItem, subtitle: string, icon: string, iconColor: string) => (
        <TouchableOpacity 
            key={farm.id} 
            style={[styles.smartRow, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
            onPress={() => router.push({ pathname: '/(agent)/farmDetails', params: { id: farm.id } })}
        >
            <View style={styles.smartRowContent}>
                <Text style={[styles.smartRowTitle, { color: colors.text }]}>{farm.name} – {farm.location}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name={icon as any} size={12} color={iconColor} />
                    <Text style={[styles.smartRowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    const renderFarmCard = (farm: FarmItem) => (
        <View key={farm.id} style={[styles.farmCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
            <View style={styles.farmCardImageContainer}>
                <Image
                    source={require('../../assets/images/farmlandImage.png')}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                />
                <View style={styles.farmCardOverlay} />
                <View style={styles.farmCardHeaderOverlay}>
                    <Text style={styles.farmNameOverlay}>{farm.name}</Text>
                    <Text style={styles.farmSizeOverlay}>{farm.size} • {farm.location}</Text>
                </View>
                <View style={[styles.statusBadgeOverlay, { backgroundColor: getStatusColor(farm.status) }]}>
                    <StatusDot status={farm.status} />
                    <Text style={styles.statusTextOverlay}>{farm.status}</Text>
                </View>
            </View>
            
            <View style={styles.farmCardContent}>
                <Text style={[styles.farmerNameText, { color: colors.text }]}>Farmer: {farm.assignedTo}</Text>
                
                <View style={styles.farmMetricsWrapper}>
                    <Text style={[styles.metricText, { color: colors.textSecondary }]}><Text style={styles.metricLabel}>Last Activity:</Text> {farm.lastActivityDate}</Text>
                    <Text style={[styles.metricText, { color: colors.textSecondary }]}><Text style={styles.metricLabel}>Activities:</Text> {farm.activitiesCount}</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.viewFarmButton}
                    onPress={() => router.push({ pathname: '/(agent)/farmDetails', params: { id: farm.id } })}
                >
                    <Text style={styles.viewFarmButtonText}>View Farm Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} hidden={false} />

            <CustomNavBar title={t('farms')} backgroundColor={isDarkMode ? colors.navbarBackground : "#0E6F6A0D"} textColor={colors.textSecondary} blurIntensity={10} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image
                    source={require('../../assets/images/backgroundGradient.png')}
                    style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]}
                    contentFit="cover"
                />

                <View style={styles.contentWrapper}>
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <TextInput
                                placeholder={t('search_farm')}
                                placeholderTextColor={colors.textMuted}
                                style={[styles.searchInput, { color: colors.text }]}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <Feather name="search" size={20} color={colors.textMuted} />
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        {isLoading && (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>Loading farms...</Text>
                            </View>
                        )}

                        {!isLoading && filteredFarms.length === 0 && (
                            <View style={{ padding: 36, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: 12 }}>
                                <Feather name="map" size={44} color={colors.textMuted} style={{ marginBottom: 12 }} />
                                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                                    {searchQuery ? 'No Matching Farms' : 'No Farms Registered'}
                                </Text>
                                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                                    {searchQuery ? 'Try a different search query.' : 'No farm records found. Complete a farmer registration to map and add their farmland.'}
                                </Text>
                            </View>
                        )}

                        {/* Active Today Section */}
                        {activeTodayFarms.length > 0 && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Feather name="check-circle" size={16} color="#4CAF50" />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Today</Text>
                                    </View>
                                </View>
                                {activeTodayFarms.map(f => renderSmartRow(f, f.status === 'In progress' ? 'Visit in progress' : `${f.activitiesCount} activities today`, 'activity', '#4CAF50'))}
                            </View>
                        )}

                        {/* Needs Attention Section */}
                        {needsAttentionFarms.length > 0 && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Feather name="alert-circle" size={16} color="#F44336" />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Needs Attention</Text>
                                    </View>
                                </View>
                                {needsAttentionFarms.map(f => renderSmartRow(f, f.attentionReason || 'Needs attention', 'alert-triangle', '#F44336'))}
                            </View>
                        )}

                        {/* All Farms Section */}
                        {restFarms.length > 0 && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Feather name="list" size={16} color="#0E6F6A" />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Farms ({restFarms.length})</Text>
                                    </View>
                                </View>
                                <View style={styles.farmsColumn}>
                                    {restFarms.map((farm) => renderFarmCard(farm))}
                                </View>
                            </View>
                        )}

                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        paddingBottom: 80,
    },
    contentWrapper: {
        flex: 1,
        paddingVertical: 20,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchBar: {
        height: 48,
        width: '100%',
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    smartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    smartRowContent: {
        flex: 1,
    },
    smartRowTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    smartRowSubtitle: {
        fontSize: 13,
    },
    farmsColumn: {
        flexDirection: 'column',
        gap: 16,
    },
    farmCard: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 8,
    },
    farmCardImageContainer: {
        height: 120,
        width: '100%',
        position: 'relative',
    },
    farmCardOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    farmCardHeaderOverlay: {
        position: 'absolute',
        bottom: 12,
        left: 16,
    },
    farmNameOverlay: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    farmSizeOverlay: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    statusBadgeOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusTextOverlay: {
        fontSize: 11,
        fontWeight: '700',
        color: 'white',
    },
    farmCardContent: {
        padding: 16,
    },
    farmerNameText: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
    },
    farmMetricsWrapper: {
        marginBottom: 16,
        gap: 6,
    },
    metricText: {
        fontSize: 13,
    },
    metricLabel: {
        fontWeight: '600',
    },
    viewFarmButton: {
        width: '100%',
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0E6F6A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    viewFarmButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
});

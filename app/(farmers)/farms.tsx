import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useFarms } from '../../hooks/api/useFarms';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');

export default function FarmerFarmsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const { data: apiFarms, isLoading } = useFarms();

    const farmsList = useMemo(() => {
        if (!apiFarms || !Array.isArray(apiFarms)) return [];
        return apiFarms.map((f: any) => ({
            id: f.id,
            name: f.name || 'Crop Farm',
            size: f.size_hectares ? `${f.size_hectares} ha` : (f.sizeHectares ? `${f.sizeHectares} ha` : '—'),
            assignedTo: f.farmer_name || f.farmerName || 'Registered Farmer',
            subPlots: f.subplots_count || f.subPlotsCount || 0,
        }));
    }, [apiFarms]);

    const filteredFarms = useMemo(() => {
        if (!searchQuery.trim()) return farmsList;
        const q = searchQuery.toLowerCase();
        return farmsList.filter((f) => f.name.toLowerCase().includes(q) || f.assignedTo.toLowerCase().includes(q));
    }, [farmsList, searchQuery]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            <CustomNavBar title="Farm" backgroundColor={colors.navbarBackground} textColor={colors.text} blurIntensity={10} />

            <View className="flex-1 mt-[155px] mx-3 pb-20 rounded-[16px] overflow-hidden" style={{ backgroundColor: colors.card }}>
                <Image
                    source={require('../../assets/images/backgroundGradient.png')}
                    style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]}
                    contentFit="cover"
                />

                <View style={styles.contentWrapper}>
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <TextInput
                                placeholder="Search Farm"
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={[styles.searchInput, { color: colors.text }]}
                            />
                            <Feather name="search" size={20} color={colors.textMuted} />
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {filteredFarms.length === 0 ? (
                            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 20 }}>
                                <Feather name="inbox" size={42} color={colors.textMuted} />
                                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 12 }}>
                                    {isLoading ? 'Loading Farms...' : 'No Farms Found'}
                                </Text>
                                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
                                    {searchQuery ? 'No farm matches your search.' : 'Farms associated with this account will appear here.'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.farmsGrid}>
                                {filteredFarms.map((farm) => (
                                    <TouchableOpacity
                                        key={farm.id}
                                        style={[styles.farmCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
                                        onPress={() => router.push({ pathname: '/(farmers)/farmTabDetails', params: { id: farm.id, name: farm.name, size: farm.size, assignedTo: farm.assignedTo } })}
                                    >
                                        <View style={styles.farmCardHeader}>
                                            <View style={[styles.iconOuterContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                                <View style={[styles.iconInnerContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                                    <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                                </View>
                                            </View>
                                            <View style={styles.farmHeaderInfo}>
                                                <Text style={[styles.farmName, { color: colors.text }]}>{farm.name}</Text>
                                                <Text style={[styles.farmSizeText, { color: colors.textMuted }]}>{farm.size}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.assignedToText, { color: colors.textMuted }]}>Assigned to: {farm.assignedTo}</Text>
                                        <Text style={[styles.farmSubPlotText, { color: colors.textMuted }]}>Sub-plots: {farm.subPlots}</Text>
                                    </TouchableOpacity>
                                ))}
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
        // backgroundColor: 'white',
    },
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#0E6F6A0D',
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
        // backgroundColor: 'white',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        // color: '#0A0C11',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    farmsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    farmCard: {
        width: '48%',
        // backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        height: 112,
        borderWidth: 1,
        // borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    farmCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    iconOuterContainer: {
        width: 36,
        height: 36,
        // backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    iconInnerContainer: {
        width: 32,
        height: 32,
        // backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
    },
    cropIcon: {
        width: 16,
        height: 16,
    },
    farmHeaderInfo: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    farmName: {
        // color: '#0A0C11',
        fontSize: 16,
        fontWeight: '500',
    },
    farmSizeText: {
        // color: '#0A0C11B2',
        fontSize: 12,
        marginTop: 2,
    },
    assignedToText: {
        // color: '#0A0C11B2',
        fontSize: 12,
        marginBottom: 4,
    },
    farmSubPlotText: {
        // color: '#0A0C11B2',
        fontSize: 12,
    },
});

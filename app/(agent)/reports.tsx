import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useCroppingSystems } from '../../hooks/api/useReports';
import { useFarmers, useUpdateFarmer } from '../../hooks/api/useFarmers';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');

/* ── 1 Acre Constants ── */
const ONE_ACRE_M2 = 4046.86;
const ONE_ACRE_SIDE_M = 63.61;
const TOTAL_FURROW_ROWS = 28;

/* ── Crop Catalog Database (Strictly Synced with Web Admin) ── */
export interface CropEntry {
    id: string;
    cropCode?: string;
    name: string;
    category: 'main' | 'border' | 'relay' | 'drop' | 'cover';
    variety?: string;
    defaultSpacingRow: number;
    defaultSpacingPlant: number;
    seedRatePerPlant: number; // grams
    yieldPerPlantLow: number; // grams
    yieldPerPlantHigh: number; // grams
    color: string;
}

export const CROP_CATALOG: Record<string, CropEntry> = {
    maize: {
        id: 'maize',
        cropCode: 'MZ-01',
        name: 'Maize (Grain)',
        category: 'main',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.25,
        seedRatePerPlant: 0.6,
        yieldPerPlantLow: 120,
        yieldPerPlantHigh: 220,
        color: '#EAB308',
    },
    corn: {
        id: 'corn',
        cropCode: 'MZ-01',
        name: 'Corn',
        category: 'main',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.25,
        seedRatePerPlant: 0.6,
        yieldPerPlantLow: 120,
        yieldPerPlantHigh: 220,
        color: '#EAB308',
    },
    sweet_corn: {
        id: 'sweet_corn',
        cropCode: 'SC-01',
        name: 'Sweet Corn',
        category: 'main',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.2,
        seedRatePerPlant: 0.44,
        yieldPerPlantLow: 80,
        yieldPerPlantHigh: 150,
        color: '#FACC15',
    },
    soybean: {
        id: 'soybean',
        cropCode: 'SB-01',
        name: 'Soybean',
        category: 'main',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.1,
        seedRatePerPlant: 0.35,
        yieldPerPlantLow: 25,
        yieldPerPlantHigh: 55,
        color: '#10B981',
    },
    groundnut: {
        id: 'groundnut',
        cropCode: 'GN-01',
        name: 'Groundnut',
        category: 'main',
        defaultSpacingRow: 0.5,
        defaultSpacingPlant: 0.2,
        seedRatePerPlant: 0.7,
        yieldPerPlantLow: 40,
        yieldPerPlantHigh: 85,
        color: '#F97316',
    },
    cowpea: {
        id: 'cowpea',
        cropCode: 'CP-01',
        name: 'Cowpea',
        category: 'main',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.2,
        seedRatePerPlant: 0.4,
        yieldPerPlantLow: 30,
        yieldPerPlantHigh: 65,
        color: '#84CC16',
    },
    cowpea_relay: {
        id: 'cowpea_relay',
        cropCode: 'CP-02',
        name: 'Cowpea (Relay)',
        category: 'relay',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.2,
        seedRatePerPlant: 0.38,
        yieldPerPlantLow: 28,
        yieldPerPlantHigh: 60,
        color: '#A3E635',
    },
    sesame: {
        id: 'sesame',
        cropCode: 'SS-01',
        name: 'Sesame (Beniseed)',
        category: 'main',
        defaultSpacingRow: 0.6,
        defaultSpacingPlant: 0.15,
        seedRatePerPlant: 0.15,
        yieldPerPlantLow: 15,
        yieldPerPlantHigh: 35,
        color: '#38BDF8',
    },
    sesame_relay: {
        id: 'sesame_relay',
        cropCode: 'SS-02',
        name: 'Sesame (Relay)',
        category: 'relay',
        defaultSpacingRow: 0.6,
        defaultSpacingPlant: 0.15,
        seedRatePerPlant: 0.15,
        yieldPerPlantLow: 14,
        yieldPerPlantHigh: 32,
        color: '#0EA5E9',
    },
    sorghum: {
        id: 'sorghum',
        cropCode: 'SR-01',
        name: 'Sorghum',
        category: 'main',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.2,
        seedRatePerPlant: 0.18,
        yieldPerPlantLow: 90,
        yieldPerPlantHigh: 180,
        color: '#D97706',
    },
    egusi: {
        id: 'egusi',
        cropCode: 'EG-01',
        name: 'Egusi (Melon)',
        category: 'main',
        defaultSpacingRow: 1.0,
        defaultSpacingPlant: 1.0,
        seedRatePerPlant: 0.8,
        yieldPerPlantLow: 200,
        yieldPerPlantHigh: 450,
        color: '#065F46',
    },
    zobo: {
        id: 'zobo',
        cropCode: 'ZB-01',
        name: 'Zobo (Hibiscus)',
        category: 'border',
        defaultSpacingRow: 1.0,
        defaultSpacingPlant: 1.0,
        seedRatePerPlant: 0.25,
        yieldPerPlantLow: 80,
        yieldPerPlantHigh: 160,
        color: '#B91C1C',
    },
    chili: {
        id: 'chili',
        cropCode: 'CH-01',
        name: 'Chili Pepper',
        category: 'border',
        defaultSpacingRow: 0.6,
        defaultSpacingPlant: 0.45,
        seedRatePerPlant: 0.08,
        yieldPerPlantLow: 150,
        yieldPerPlantHigh: 350,
        color: '#DC2626',
    },
    moringa: {
        id: 'moringa',
        cropCode: 'MR-01',
        name: 'Moringa (Border)',
        category: 'border',
        defaultSpacingRow: 2.0,
        defaultSpacingPlant: 2.0,
        seedRatePerPlant: 1.2,
        yieldPerPlantLow: 250,
        yieldPerPlantHigh: 600,
        color: '#15803D',
    },
    vetiver: {
        id: 'vetiver',
        cropCode: 'VT-01',
        name: 'Vetiver Grass',
        category: 'border',
        defaultSpacingRow: 0.5,
        defaultSpacingPlant: 0.3,
        seedRatePerPlant: 0.5,
        yieldPerPlantLow: 50,
        yieldPerPlantHigh: 100,
        color: '#047857',
    },
    tomato: {
        id: 'tomato',
        cropCode: 'TM-01',
        name: 'Tomato (Dry Season)',
        category: 'main',
        defaultSpacingRow: 0.6,
        defaultSpacingPlant: 0.4,
        seedRatePerPlant: 0.06,
        yieldPerPlantLow: 600,
        yieldPerPlantHigh: 1400,
        color: '#EF4444',
    },
    onion: {
        id: 'onion',
        cropCode: 'ON-01',
        name: 'Onion (Dry Season)',
        category: 'main',
        defaultSpacingRow: 0.3,
        defaultSpacingPlant: 0.15,
        seedRatePerPlant: 0.05,
        yieldPerPlantLow: 70,
        yieldPerPlantHigh: 150,
        color: '#8B5CF6',
    },
};

const getCrop = (id: string): CropEntry => {
    if (!id) return CROP_CATALOG['maize'];
    const norm = id.toLowerCase().trim();
    if (CROP_CATALOG[norm]) return CROP_CATALOG[norm];

    // Substring fallback search
    const found = Object.values(CROP_CATALOG).find(
        (c) => norm.includes(c.id) || norm.includes(c.name.toLowerCase())
    );
    if (found) return found;

    return {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
        category: 'main',
        defaultSpacingRow: 0.75,
        defaultSpacingPlant: 0.25,
        seedRatePerPlant: 0.5,
        yieldPerPlantLow: 80,
        yieldPerPlantHigh: 180,
        color: '#10B981',
    };
};

/* ── Practice Icons Mapping ── */
const PRACTICE_META: Record<string, { label: string; icon: any; color: string; note: string }> = {
    land_prep: {
        label: 'Land Preparation',
        icon: 'hammer-outline',
        color: '#D97706',
        note: 'Plowing, harrowing & ridging',
    },
    planting: {
        label: 'Planting / Sowing',
        icon: 'leaf-outline',
        color: '#10B981',
        note: 'Primary seed sowing commencement',
    },
    fertilizing: {
        label: 'Fertilization',
        icon: 'flask-outline',
        color: '#8B5CF6',
        note: 'Basal dressing or soil amendment',
    },
    weeding: {
        label: 'Weeding & Care',
        icon: 'cut-outline',
        color: '#3B82F6',
        note: 'First manual weeding or herbicide',
    },
    harvesting: {
        label: 'Harvesting',
        icon: 'cube-outline',
        color: '#EA580C',
        note: 'Physiological maturity harvest',
    },
};

/* ── Tiers Definition ── */
const TIERS = [
    { tier: 1, title: 'Tier 1: Main Season', short: 'Tier 1', icon: 'leaf' },
    { tier: 2, title: 'Tier 2: Relay Season', short: 'Tier 2', icon: 'swap-horizontal' },
    { tier: 3, title: 'Tier 3: Dry Season', short: 'Tier 3', icon: 'water' },
];

const NIGERIAN_STATES = [
    'Adamawa',
    'Kaduna',
    'Nassarawa',
    'Abuja (FCT)',
    'Kano',
    'Bauchi',
    'Benue',
    'Niger',
    'Taraba',
    'Plateau',
];

export default function ReportsScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    const { data: dbSystems, isLoading: isLoadingSystems } = useCroppingSystems();
    const { data: apiFarmers } = useFarmers();
    const updateFarmerMutation = useUpdateFarmer();

    /* ── Navigation State ── */
    const [selectedState, setSelectedState] = useState<string>('Adamawa');
    const [selectedTier, setSelectedTier] = useState<number>(1);
    const [selectedOptionId, setSelectedOptionId] = useState<string>('');
    const [showStateDropdown, setShowStateDropdown] = useState<boolean>(false);
    const [rowOrientation, setRowOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

    /* ── Farmer Selection Modal ── */
    const [isSelectFarmersModalVisible, setSelectFarmersModalVisible] = useState(false);
    const [isSavingFarmers, setIsSavingFarmers] = useState(false);
    const [selectedFarmerIds, setSelectedFarmerIds] = useState<string[]>([]);

    /* ── Active System from Backend ── */
    const activeSystem = useMemo(() => {
        if (!dbSystems || !Array.isArray(dbSystems)) return null;
        const normSelected = selectedState.toLowerCase().replace('state', '').trim();
        return (
            dbSystems.find((s: any) => {
                if (!s || !s.state) return false;
                const normS = s.state.toLowerCase().replace('state', '').trim();
                return normS === normSelected;
            }) || null
        );
    }, [dbSystems, selectedState]);

    /* ── Available State Options ── */
    const availableStates = useMemo(() => {
        const set = new Set<string>();
        if (dbSystems && Array.isArray(dbSystems)) {
            dbSystems.forEach((s: any) => {
                if (s?.state) {
                    const clean = s.state.replace(/\s*state/i, '').trim();
                    set.add(clean);
                }
            });
        }
        NIGERIAN_STATES.forEach((st) => set.add(st));
        return Array.from(set);
    }, [dbSystems]);

    // Auto-select first state with configured calendar if current has none
    useEffect(() => {
        if (dbSystems && Array.isArray(dbSystems) && dbSystems.length > 0) {
            const hasCurrent = dbSystems.some((s: any) => {
                const normS = s?.state?.toLowerCase().replace('state', '').trim();
                const normCur = selectedState.toLowerCase().replace('state', '').trim();
                return normS === normCur;
            });
            if (!hasCurrent && dbSystems[0]?.state) {
                const firstClean = dbSystems[0].state.replace(/\s*state/i, '').trim();
                setSelectedState(firstClean);
            }
        }
    }, [dbSystems]);

    /* ── Options for Selected Tier ── */
    const tierOptions = useMemo(() => {
        if (!activeSystem || !Array.isArray(activeSystem.options)) return [];
        return activeSystem.options.filter((opt: any) => {
            const tNum = opt.tier || 1;
            return tNum === selectedTier;
        });
    }, [activeSystem, selectedTier]);

    /* ── Auto-select Option ── */
    useEffect(() => {
        if (tierOptions.length > 0) {
            if (!selectedOptionId || !tierOptions.some((o: any) => o.id === selectedOptionId)) {
                setSelectedOptionId(tierOptions[0].id);
            }
        } else {
            setSelectedOptionId('');
        }
    }, [tierOptions, selectedOptionId]);

    const activeOption = useMemo(() => {
        if (!tierOptions || tierOptions.length === 0) return null;
        return tierOptions.find((o: any) => o.id === selectedOptionId) || tierOptions[0];
    }, [tierOptions, selectedOptionId]);

    /* ── Crops in Active Option ── */
    const activeCropsList = useMemo(() => {
        if (!activeOption) return ['maize'];
        const mains = activeOption.tier1MainCrops || activeOption.mainCrops || [];
        const drops = activeOption.tier1DropCrops || activeOption.dropCrops || [];
        const all = Array.from(new Set([...mains, ...drops]));
        return all.length > 0 ? all : ['maize'];
    }, [activeOption]);

    /* ── 1-Acre Agronomic Math Engine ── */
    const acreageMath = useMemo(() => {
        const totalAreaM2 = ONE_ACRE_M2;
        const totalSideM = ONE_ACRE_SIDE_M;
        const hasBorder = !!activeSystem?.hasBorder;
        const borderWidth = hasBorder ? Math.min(6, Math.max(1, activeSystem?.borderWidth || 2)) : 0;

        const innerSideM = Math.max(10, totalSideM - 2 * borderWidth);
        const innerAreaM2 = hasBorder ? innerSideM * innerSideM : totalAreaM2;
        const borderAreaM2 = totalAreaM2 - innerAreaM2;

        // Inner crops
        const innerCrops = activeCropsList.map((cropId: string) => {
            const crop = getCrop(cropId);
            const pct = activeOption?.cropAllocations?.[cropId] ?? Math.round(100 / activeCropsList.length);
            const allocatedArea = innerAreaM2 * (pct / 100);
            const rowSp = crop.defaultSpacingRow || 0.75;
            const plantSp = crop.defaultSpacingPlant || 0.25;
            const pop = Math.round(allocatedArea / Math.max(0.01, rowSp * plantSp));
            const seedKg = ((pop * (crop.seedRatePerPlant || 0.25)) / 1000).toFixed(1);
            const yieldLow = Math.round((pop * (crop.yieldPerPlantLow || 80)) / 1000);
            const yieldHigh = Math.round((pop * (crop.yieldPerPlantHigh || 180)) / 1000);

            return {
                id: cropId,
                crop,
                pct,
                allocatedArea: Math.round(allocatedArea),
                population: pop,
                seedKg,
                yieldLow,
                yieldHigh,
                rowSp,
                plantSp,
            };
        });

        // Border crops
        const bList = (activeSystem?.borderCropIds || []) as string[];
        const totalBPct =
            bList.reduce(
                (sum: number, bId: string) => sum + (activeSystem?.borderAllocations?.[bId] || 0),
                0
            ) || 100;

        const borderCrops = bList.map((bId: string, bIdx: number) => {
            const crop = getCrop(bId);
            const pct = activeSystem?.borderAllocations?.[bId] ?? Math.round(100 / (bList.length || 1));
            const allocatedArea = borderAreaM2 * (pct / (totalBPct || 100));
            const rowSp = crop.defaultSpacingRow || 0.6;
            const plantSp = crop.defaultSpacingPlant || 0.3;
            const pop = Math.round(allocatedArea / Math.max(0.01, rowSp * plantSp));
            const seedKg = ((pop * (crop.seedRatePerPlant || 0.1)) / 1000).toFixed(1);
            const yieldLow = Math.round((pop * (crop.yieldPerPlantLow || 80)) / 1000);
            const yieldHigh = Math.round((pop * (crop.yieldPerPlantHigh || 140)) / 1000);
            const stripWidthM = ((borderWidth * pct) / (totalBPct || 100)).toFixed(1);

            return {
                id: bId,
                crop,
                pct,
                allocatedArea: Math.round(allocatedArea),
                population: pop,
                seedKg,
                yieldLow,
                yieldHigh,
                stripWidthM,
                bIdx,
                rowSp,
                plantSp,
            };
        });

        return {
            totalAreaM2: Math.round(totalAreaM2),
            totalSideM: totalSideM.toFixed(1),
            innerSideM: innerSideM.toFixed(1),
            innerAreaM2: Math.round(innerAreaM2),
            borderAreaM2: Math.round(borderAreaM2),
            hasBorder,
            borderWidth,
            innerCrops,
            borderCrops,
            totalBPct,
        };
    }, [activeSystem, activeOption, activeCropsList]);

    /* ── Interleaved Furrow Rows for Intercrop Simulation ── */
    const interleavedFurrowRows = useMemo(() => {
        const crops = acreageMath.innerCrops;
        if (crops.length === 0) return [];
        if (crops.length === 1) {
            return Array(TOTAL_FURROW_ROWS).fill(crops[0]);
        }

        const totalPct = crops.reduce((sum, c) => sum + (c.pct || 0), 0) || 100;
        const counts = crops.map((c) =>
            Math.max(1, Math.round(((c.pct || 0) / totalPct) * TOTAL_FURROW_ROWS))
        );

        let currentSum = counts.reduce((a, b) => a + b, 0);
        while (currentSum > TOTAL_FURROW_ROWS) {
            const maxIdx = counts.indexOf(Math.max(...counts));
            if (counts[maxIdx] > 1) {
                counts[maxIdx]--;
                currentSum--;
            } else break;
        }
        while (currentSum < TOTAL_FURROW_ROWS) {
            const minIdx = counts.indexOf(Math.min(...counts));
            counts[minIdx]++;
            currentSum++;
        }

        const rows: (typeof crops)[0][] = [];
        const accumulated = crops.map(() => 0);

        for (let r = 0; r < TOTAL_FURROW_ROWS; r++) {
            let bestIdx = 0;
            let maxDeficit = -Infinity;
            for (let i = 0; i < crops.length; i++) {
                const target = (counts[i] * (r + 1)) / TOTAL_FURROW_ROWS;
                const deficit = target - accumulated[i];
                if (deficit > maxDeficit) {
                    maxDeficit = deficit;
                    bestIdx = i;
                }
            }
            rows.push(crops[bestIdx]);
            accumulated[bestIdx]++;
        }

        return rows;
    }, [acreageMath.innerCrops]);

    /* ── State Farmers & Calendar Farmers ── */
    const stateFarmers = useMemo(() => {
        if (!apiFarmers || !Array.isArray(apiFarmers)) return [];
        return apiFarmers.filter((f: any) => {
            const farmerState = f.location?.state?.name || f.stateName || '';
            const normFarmer = farmerState.toLowerCase().replace('state', '').trim();
            const normSelected = selectedState.toLowerCase().replace('state', '').trim();
            return normFarmer === normSelected;
        });
    }, [apiFarmers, selectedState]);

    const calendarFarmers = useMemo(() => {
        if (!activeOption?.id) return [];
        return stateFarmers.filter(
            (f: any) => f.metadata?.plantingCalendarOptionId === activeOption.id
        );
    }, [stateFarmers, activeOption?.id]);

    const openSelectFarmersModal = () => {
        setSelectedFarmerIds(calendarFarmers.map((f: any) => f.id));
        setSelectFarmersModalVisible(true);
    };

    const toggleFarmerSelection = (id: string) => {
        setSelectedFarmerIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSaveFarmers = async () => {
        if (!activeOption?.id) return;
        setIsSavingFarmers(true);
        try {
            for (const f of stateFarmers) {
                const wasSelected = calendarFarmers.some((cf: any) => cf.id === f.id);
                const isSelected = selectedFarmerIds.includes(f.id);

                if (isSelected && !wasSelected) {
                    await updateFarmerMutation.mutateAsync({
                        id: f.id,
                        farmerData: {
                            metadata: {
                                ...(f.metadata || {}),
                                plantingCalendarOptionId: activeOption.id,
                            },
                        },
                    });
                } else if (!isSelected && wasSelected) {
                    const nextMetadata = { ...(f.metadata || {}) };
                    delete nextMetadata.plantingCalendarOptionId;

                    await updateFarmerMutation.mutateAsync({
                        id: f.id,
                        farmerData: {
                            metadata: nextMetadata,
                        },
                    });
                }
            }
            setSelectFarmersModalVisible(false);
        } catch (err) {
            console.error('Failed to update farmer assignments', err);
        } finally {
            setIsSavingFarmers(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Custom Navigation Bar with 155px standard clearance */}
            <CustomNavBar title="Season Tracker" />

            <View style={styles.mainContainer}>
                {/* ── Level 1: State & Tier Picker Header ── */}
                <View style={styles.pickerHeader}>
                    <TouchableOpacity
                        style={styles.stateSelectorBtn}
                        onPress={() => setShowStateDropdown(!showStateDropdown)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="location-sharp" size={15} color="#0E6F6A" style={{ marginRight: 4 }} />
                        <Text style={styles.stateSelectorText}>{selectedState}</Text>
                        <Ionicons name="chevron-down" size={14} color="#0E6F6A" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    <Text style={styles.pickerSubtitle}>
                        {activeSystem ? 'Synced with Web Admin' : 'No System Defined'}
                    </Text>
                </View>

                {/* State Dropdown Popover */}
                {showStateDropdown && (
                    <View style={styles.dropdownPopover}>
                        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                            {availableStates.map((st) => {
                                const isSelected = st.toLowerCase() === selectedState.toLowerCase();
                                const isConfigured = dbSystems?.some((s: any) =>
                                    s?.state?.toLowerCase().includes(st.toLowerCase())
                                );
                                return (
                                    <TouchableOpacity
                                        key={st}
                                        style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                                        onPress={() => {
                                            setSelectedState(st);
                                            setShowStateDropdown(false);
                                        }}
                                    >
                                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                                            {st}
                                        </Text>
                                        {isConfigured && (
                                            <View style={styles.configuredBadge}>
                                                <Text style={styles.configuredBadgeText}>Active</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* ── Level 2: Tier Selector Tabs ── */}
                <View style={styles.tierBarContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierScroll}>
                        {TIERS.map((t) => {
                            const isSelected = selectedTier === t.tier;
                            const count = activeSystem?.options?.filter((o: any) => (o.tier || 1) === t.tier).length || 0;
                            return (
                                <TouchableOpacity
                                    key={t.tier}
                                    style={[styles.tierTab, isSelected && styles.tierTabActive]}
                                    onPress={() => setSelectedTier(t.tier)}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name={t.icon as any}
                                        size={14}
                                        color={isSelected ? '#FFFFFF' : '#64748B'}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={[styles.tierTabText, isSelected && styles.tierTabTextActive]}>
                                        {t.title}
                                    </Text>
                                    <View style={[styles.tierCountBadge, isSelected && styles.tierCountBadgeActive]}>
                                        <Text style={[styles.tierCountText, isSelected && styles.tierCountTextActive]}>
                                            {count}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* ── Level 3: Planting Options Selector ── */}
                {tierOptions.length > 0 && (
                    <View style={styles.optionSelectorContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionSelectorScroll}>
                            {tierOptions.map((opt: any, idx: number) => {
                                const isSelected = opt.id === (activeOption?.id || selectedOptionId);
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[styles.optionCardBtn, isSelected && styles.optionCardBtnActive]}
                                        onPress={() => setSelectedOptionId(opt.id)}
                                        activeOpacity={0.85}
                                    >
                                        <View style={[styles.optionBadge, isSelected && styles.optionBadgeActive]}>
                                            <Text style={[styles.optionBadgeText, isSelected && styles.optionBadgeTextActive]}>
                                                Option {idx + 1}
                                            </Text>
                                        </View>
                                        <Text style={[styles.optionTitleText, isSelected && styles.optionTitleTextActive]} numberOfLines={1}>
                                            {opt.title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* ── Main Scroll Content ── */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoadingSystems ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color="#0E6F6A" />
                            <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
                                Fetching planting systems from Admin...
                            </Text>
                        </View>
                    ) : !activeSystem ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="calendar-outline" size={36} color="#0E6F6A" />
                            </View>
                            <Text style={styles.emptyTitle}>No Planting Calendar for {selectedState}</Text>
                            <Text style={styles.emptySubtitle}>
                                There is no cropping system configured for {selectedState} yet on the Web Admin.
                            </Text>
                            <View style={styles.emptyInfoBox}>
                                <Ionicons name="information-circle" size={20} color="#166534" style={{ marginRight: 8 }} />
                                <Text style={styles.emptyInfoText}>
                                    Admins can configure Tier 1 (Main Season), Tier 2 (Relay), and Tier 3 (Dry Season) options on the Web Admin to automatically sync here.
                                </Text>
                            </View>
                        </View>
                    ) : !activeOption ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="layers-outline" size={36} color="#0E6F6A" />
                            </View>
                            <Text style={styles.emptyTitle}>No Options in Tier {selectedTier}</Text>
                            <Text style={styles.emptySubtitle}>
                                Switch to another season tier above or configure this tier on the Web Admin.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* ── 1. ACTIVE OPTION TITLE BANNER ── */}
                            <View style={styles.planCard}>
                                <View style={styles.planBadgeRow}>
                                    <Text style={styles.planOptionCode}>
                                        {activeOption.optionCode || `OPTION ${tierOptions.findIndex((o: any) => o.id === activeOption.id) + 1}`}
                                    </Text>
                                    <Text style={styles.planSystemName}>{activeSystem.systemName}</Text>
                                </View>
                                <Text style={styles.planTitle}>{activeOption.title}</Text>
                                <Text style={styles.planLocation}>
                                    Tier {selectedTier} • {selectedState} Operating Cropping Flow
                                </Text>
                            </View>

                            {/* ══════════════════════════════════════════════════════════
                                2. 1-ACRE SATELLITE GEOMETRIC FIELD CANVAS (MATCHING ADMIN)
                            ══════════════════════════════════════════════════════════ */}
                            <View style={styles.cardSection}>
                                <View style={styles.canvasHeaderRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sectionHeading}>
                                            1-Acre Satellite Farm Parcel View
                                        </Text>
                                        <Text style={styles.sectionSubheading}>
                                            Square parcel (~63.6m × 63.6m) with concentric perimeter &amp; interleaved furrows
                                        </Text>
                                    </View>

                                    {/* Orientation Switcher Button */}
                                    <View style={styles.orientationToggle}>
                                        <TouchableOpacity
                                            style={[
                                                styles.orientationBtn,
                                                rowOrientation === 'horizontal' && styles.orientationBtnActive,
                                            ]}
                                            onPress={() => setRowOrientation('horizontal')}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name="reorder-two-outline"
                                                size={14}
                                                color={rowOrientation === 'horizontal' ? '#0F172A' : '#64748B'}
                                            />
                                            <Text
                                                style={[
                                                    styles.orientationBtnText,
                                                    rowOrientation === 'horizontal' && styles.orientationBtnTextActive,
                                                ]}
                                            >
                                                H
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.orientationBtn,
                                                rowOrientation === 'vertical' && styles.orientationBtnActive,
                                            ]}
                                            onPress={() => setRowOrientation('vertical')}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name="pause-outline"
                                                size={14}
                                                color={rowOrientation === 'vertical' ? '#0F172A' : '#64748B'}
                                            />
                                            <Text
                                                style={[
                                                    styles.orientationBtnText,
                                                    rowOrientation === 'vertical' && styles.orientationBtnTextActive,
                                                ]}
                                            >
                                                V
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Square Satellite Soil Canvas */}
                                <View style={styles.satelliteCanvasWrapper}>
                                    {/* 4 Golden Surveyor Pegs */}
                                    <View style={[styles.surveyorPeg, { top: 6, left: 6 }]}>
                                        <View style={styles.surveyorPegCenter} />
                                    </View>
                                    <View style={[styles.surveyorPeg, { top: 6, right: 6 }]}>
                                        <View style={styles.surveyorPegCenter} />
                                    </View>
                                    <View style={[styles.surveyorPeg, { bottom: 6, left: 6 }]}>
                                        <View style={styles.surveyorPegCenter} />
                                    </View>
                                    <View style={[styles.surveyorPeg, { bottom: 6, right: 6 }]}>
                                        <View style={styles.surveyorPegCenter} />
                                    </View>

                                    {/* North Compass Rose HUD */}
                                    <View style={styles.compassRose}>
                                        <Ionicons name="navigate" size={11} color="#34D399" />
                                        <Text style={styles.compassRoseText}>N</Text>
                                    </View>

                                    {/* Intercrop HUD Badge */}
                                    <View style={styles.intercropHudBadge}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Ionicons name="leaf" size={10} color="#6EE7B7" />
                                            <Text style={styles.intercropHudTitle}>
                                                {activeCropsList.length}-Crop Intercrop
                                            </Text>
                                        </View>
                                        <Text style={styles.intercropHudSub} numberOfLines={1}>
                                            {activeCropsList
                                                .map((id) => `${getCrop(id).name} ${activeOption.cropAllocations?.[id] || 0}%`)
                                                .join(' + ')}
                                        </Text>
                                    </View>

                                    {/* Concentric Border Strips & Interleaved Furrow Parcel */}
                                    {(() => {
                                        // Inner interleaved furrows
                                        const innerField = (
                                            <View
                                                style={[
                                                    styles.innerFurrowField,
                                                    rowOrientation === 'horizontal' ? { flexDirection: 'column' } : { flexDirection: 'row' },
                                                ]}
                                            >
                                                {interleavedFurrowRows.map((rowCrop, idx) => (
                                                    <View
                                                        key={`furrow-${idx}-${rowCrop.id}`}
                                                        style={[
                                                            rowOrientation === 'horizontal'
                                                                ? {
                                                                      width: '100%',
                                                                      height: `${100 / TOTAL_FURROW_ROWS}%`,
                                                                      borderBottomWidth: 0.6,
                                                                      borderBottomColor: 'rgba(0,0,0,0.3)',
                                                                  }
                                                                : {
                                                                      height: '100%',
                                                                      width: `${100 / TOTAL_FURROW_ROWS}%`,
                                                                      borderRightWidth: 0.6,
                                                                      borderRightColor: 'rgba(0,0,0,0.3)',
                                                                  },
                                                            { backgroundColor: rowCrop.crop.color },
                                                        ]}
                                                    />
                                                ))}
                                            </View>
                                        );

                                        if (!acreageMath.hasBorder || acreageMath.borderCrops.length === 0) {
                                            return (
                                                <View style={styles.fieldOuterSoilContainer}>
                                                    {innerField}
                                                </View>
                                            );
                                        }

                                        // Total border width in preview pixels
                                        const totalBorderPx = Math.min(
                                            38,
                                            Math.max(16, Math.round(10 + (acreageMath.borderWidth || 2) * 4))
                                        );
                                        const bCrops = acreageMath.borderCrops;

                                        // Nest concentric rings from innermost to outermost
                                        let content = innerField;

                                        for (let i = bCrops.length - 1; i >= 0; i--) {
                                            const bItem = bCrops[i];
                                            const isOutermost = i === 0;
                                            const isInnermost = i === bCrops.length - 1;
                                            const padPx = Math.max(
                                                6,
                                                Math.round((totalBorderPx * (bItem.pct || 50)) / (acreageMath.totalBPct || 100))
                                            );

                                            content = (
                                                <View
                                                    key={`border-ring-${bItem.id}-${i}`}
                                                    style={[
                                                        styles.concentricBorderRing,
                                                        isOutermost
                                                            ? { borderRadius: 14 }
                                                            : isInnermost
                                                            ? { borderRadius: 8 }
                                                            : { borderRadius: 10 },
                                                        {
                                                            padding: padPx,
                                                            backgroundColor: bItem.crop.color,
                                                        },
                                                    ]}
                                                >
                                                    {content}
                                                </View>
                                            );
                                        }

                                        return content;
                                    })()}

                                    {/* Concentric Border HUD Badge (Bottom Left) */}
                                    {acreageMath.hasBorder && acreageMath.borderCrops.length > 0 && (
                                        <View style={styles.borderHudBadge}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Ionicons name="shield-checkmark" size={10} color="#FDA4AF" />
                                                <Text style={styles.borderHudTitle}>
                                                    {acreageMath.borderCrops.length} Perimeter Strip
                                                    {acreageMath.borderCrops.length > 1 ? 's' : ''} ({acreageMath.borderWidth}m)
                                                </Text>
                                            </View>
                                            <Text style={styles.borderHudSub} numberOfLines={1}>
                                                {acreageMath.borderCrops.map((b) => `${b.crop.name} (${b.pct}%)`).join(', ')}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* ── Legend: Intercrop & Perimeter Rings ── */}
                                <View style={styles.canvasLegendContainer}>
                                    <View style={styles.legendBlock}>
                                        <Text style={styles.legendBlockTitle}>Intercrop Furrow Arrangement:</Text>
                                        <View style={styles.legendChipsWrap}>
                                            {acreageMath.innerCrops.map((c) => {
                                                const rowCount = interleavedFurrowRows.filter((r) => r.id === c.id).length;
                                                return (
                                                    <View key={c.id} style={styles.legendCropChip}>
                                                        <View style={[styles.cropDot, { backgroundColor: c.crop.color }]} />
                                                        <Text style={styles.legendChipText}>{c.crop.name}</Text>
                                                        <Text style={styles.legendChipPct}>{c.pct}%</Text>
                                                        <Text style={styles.legendChipRows}>({rowCount} furrows)</Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    {acreageMath.hasBorder && acreageMath.borderCrops.length > 0 && (
                                        <View style={[styles.legendBlock, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }]}>
                                            <Text style={[styles.legendBlockTitle, { color: '#B91C1C' }]}>
                                                Concentric Border Rings (Outer $\rightarrow$ Inner):
                                            </Text>
                                            <View style={styles.legendChipsWrap}>
                                                {acreageMath.borderCrops.map((b, idx) => (
                                                    <View key={b.id} style={[styles.legendCropChip, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                                                        <Text style={[styles.legendRingTag, { color: '#991B1B' }]}>
                                                            Ring {idx + 1}:
                                                        </Text>
                                                        <View style={[styles.cropDot, { backgroundColor: b.crop.color }]} />
                                                        <Text style={styles.legendChipText}>{b.crop.name}</Text>
                                                        <Text style={[styles.legendChipPct, { color: '#DC2626' }]}>({b.pct}%)</Text>
                                                        <Text style={[styles.legendChipRows, { color: '#991B1B' }]}>~{b.stripWidthM}m</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* ══════════════════════════════════════════════════════════
                                3. 1-ACRE AGRONOMIC REQUIREMENTS & YIELD ESTIMATOR
                            ══════════════════════════════════════════════════════════ */}
                            <View style={styles.cardSection}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={styles.sectionHeading}>
                                        1-Acre Agronomic Yield Estimates
                                    </Text>
                                    <Text style={styles.agronomyAreaSubtitle}>
                                        {acreageMath.innerAreaM2} m² + {acreageMath.borderAreaM2} m² = 4,047 m²
                                    </Text>
                                </View>

                                {/* Inner Crops Agronomics */}
                                <Text style={styles.agronomyGroupTitle}>
                                    Inner Intercrop Field ({acreageMath.innerAreaM2} m²)
                                </Text>
                                {acreageMath.innerCrops.map((item) => (
                                    <View key={item.id} style={styles.agronomyRowCard}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <View style={[styles.cropDot, { backgroundColor: item.crop.color }]} />
                                                <Text style={styles.agronomyCropName}>{item.crop.name}</Text>
                                                <View style={styles.agronomyPctBadge}>
                                                    <Text style={styles.agronomyPctText}>{item.pct}% area</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.agronomyMetaSub}>
                                                ~{item.allocatedArea} m² • Spacing: {item.rowSp}m × {item.plantSp}m
                                            </Text>
                                        </View>
                                        <View style={styles.agronomyStatsCol}>
                                            <Text style={styles.agronomyStatItem}>
                                                Pop: <Text style={styles.boldText}>{item.population.toLocaleString()}</Text>
                                            </Text>
                                            <Text style={styles.agronomyStatItem}>
                                                Seed: <Text style={styles.boldText}>{item.seedKg} kg</Text>
                                            </Text>
                                            <Text style={styles.agronomyYieldText}>
                                                Yield: {item.yieldLow}–{item.yieldHigh} kg
                                            </Text>
                                        </View>
                                    </View>
                                ))}

                                {/* Border Crops Agronomics */}
                                {acreageMath.hasBorder && acreageMath.borderCrops.length > 0 && (
                                    <>
                                        <Text style={[styles.agronomyGroupTitle, { color: '#B91C1C', marginTop: 12 }]}>
                                            Perimeter Strips ({acreageMath.borderAreaM2} m² • {acreageMath.borderWidth}m buffer)
                                        </Text>
                                        {acreageMath.borderCrops.map((item, idx) => (
                                            <View key={item.id} style={[styles.agronomyRowCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                                                <View style={{ flex: 1 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <View style={[styles.cropDot, { backgroundColor: item.crop.color }]} />
                                                        <Text style={[styles.agronomyCropName, { color: '#991B1B' }]}>
                                                            Ring {idx + 1}: {item.crop.name}
                                                        </Text>
                                                        <View style={[styles.agronomyPctBadge, { backgroundColor: '#FEE2E2' }]}>
                                                            <Text style={[styles.agronomyPctText, { color: '#991B1B' }]}>{item.pct}%</Text>
                                                        </View>
                                                    </View>
                                                    <Text style={styles.agronomyMetaSub}>
                                                        ~{item.allocatedArea} m² • ~{item.stripWidthM}m width
                                                    </Text>
                                                </View>
                                                <View style={styles.agronomyStatsCol}>
                                                    <Text style={styles.agronomyStatItem}>
                                                        Pop: <Text style={styles.boldText}>{item.population.toLocaleString()}</Text>
                                                    </Text>
                                                    <Text style={styles.agronomyStatItem}>
                                                        Seed: <Text style={styles.boldText}>{item.seedKg} kg</Text>
                                                    </Text>
                                                    <Text style={[styles.agronomyYieldText, { color: '#B91C1C' }]}>
                                                        Yield: {item.yieldLow}–{item.yieldHigh} kg
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </>
                                )}

                                {/* Grand Totals Footer Card */}
                                <View style={styles.agronomyTotalCard}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Ionicons name="sparkles" size={16} color="#0E6F6A" />
                                        <Text style={styles.agronomyTotalTitle}>Total 1-Acre Estimates:</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.agronomyTotalSeed}>
                                            Total Seed:{' '}
                                            <Text style={styles.boldText}>
                                                {(
                                                    acreageMath.innerCrops.reduce((s, c) => s + parseFloat(c.seedKg), 0) +
                                                    (acreageMath.hasBorder
                                                        ? acreageMath.borderCrops.reduce((s, c) => s + parseFloat(c.seedKg), 0)
                                                        : 0)
                                                ).toFixed(1)}{' '}
                                                kg
                                            </Text>
                                        </Text>
                                        <Text style={styles.agronomyTotalYield}>
                                            Est. Yield:{' '}
                                            {(
                                                acreageMath.innerCrops.reduce((s, c) => s + c.yieldLow, 0) +
                                                (acreageMath.hasBorder
                                                    ? acreageMath.borderCrops.reduce((s, c) => s + c.yieldLow, 0)
                                                    : 0)
                                            ).toLocaleString()}
                                            –
                                            {(
                                                acreageMath.innerCrops.reduce((s, c) => s + c.yieldHigh, 0) +
                                                (acreageMath.hasBorder
                                                    ? acreageMath.borderCrops.reduce((s, c) => s + c.yieldHigh, 0)
                                                    : 0)
                                            ).toLocaleString()}{' '}
                                            kg
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* ══════════════════════════════════════════════════════════
                                4. FARMING CYCLE TIMELINE STEPPER (ACTIVITY DATES)
                            ══════════════════════════════════════════════════════════ */}
                            <View style={styles.cardSection}>
                                <Text style={styles.sectionHeading}>
                                    Farming Cycle Schedule (Activity Dates)
                                </Text>
                                <Text style={styles.sectionSubheading}>
                                    Key agronomic target milestones configured for this option
                                </Text>

                                <View style={styles.practiceDatesList}>
                                    {[
                                        { key: 'land_prep', defaultVal: '2026-04-15' },
                                        { key: 'planting', defaultVal: '2026-05-01' },
                                        { key: 'fertilizing', defaultVal: '2026-05-15' },
                                        { key: 'weeding', defaultVal: '2026-05-25' },
                                        { key: 'harvesting', defaultVal: '2026-08-15' },
                                    ].map((act, idx) => {
                                        const meta = PRACTICE_META[act.key] || {
                                            label: act.key,
                                            icon: 'calendar-outline',
                                            color: '#64748B',
                                            note: '',
                                        };
                                        const dateVal = activeOption.proposedDates?.[act.key] || act.defaultVal;

                                        return (
                                            <View key={act.key} style={styles.practiceDateRow}>
                                                <View style={[styles.practiceIconWrap, { backgroundColor: `${meta.color}18` }]}>
                                                    <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.practiceDateLabel}>{meta.label}</Text>
                                                    <Text style={styles.practiceDateNote}>{meta.note}</Text>
                                                </View>
                                                <View style={styles.practiceDateBadge}>
                                                    <Ionicons name="calendar-outline" size={12} color="#0E6F6A" style={{ marginRight: 4 }} />
                                                    <Text style={styles.practiceDateBadgeText}>{dateVal}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* ══════════════════════════════════════════════════════════
                                5. SCL VCM MANAGEMENT INDICATORS & FARMERS PRACTICING
                            ══════════════════════════════════════════════════════════ */}
                            <View style={styles.cardSection}>
                                <Text style={styles.sectionHeading}>SCL VCM Management Indicators</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                    <View style={styles.indicatorCard}>
                                        <Text style={[styles.indicatorVal, { color: '#16A34A' }]}>
                                            {stateFarmers.length > 0
                                                ? `${Math.round((calendarFarmers.length / stateFarmers.length) * 100)}%`
                                                : '0%'}
                                        </Text>
                                        <Text style={styles.indicatorLabel}>Farmers Confirmed (PS-01)</Text>
                                    </View>
                                    <View style={styles.indicatorCard}>
                                        <Text style={[styles.indicatorVal, { color: '#2563EB' }]}>
                                            {calendarFarmers.length}{' '}
                                            {calendarFarmers.length === 1 ? 'Farmer' : 'Farmers'}
                                        </Text>
                                        <Text style={styles.indicatorLabel}>Enrolled on Calendar (PS-02)</Text>
                                    </View>
                                    <View style={styles.indicatorCard}>
                                        <Text style={[styles.indicatorVal, { color: '#D97706' }]}>
                                            {activeCropsList.length + (acreageMath.hasBorder ? acreageMath.borderCrops.length : 0)} Crops
                                        </Text>
                                        <Text style={styles.indicatorLabel}>Active Species (ES-01)</Text>
                                    </View>
                                    <View style={styles.indicatorCard}>
                                        <Text style={[styles.indicatorVal, { color: '#9333EA' }]}>
                                            1 Acre
                                        </Text>
                                        <Text style={styles.indicatorLabel}>Standard Parcel (LS-02)</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Farmers Practicing This Calendar */}
                            <View style={styles.cardSection}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={styles.sectionHeading}>Farmers on this Calendar</Text>
                                    <TouchableOpacity
                                        style={styles.selectFarmersBtn}
                                        onPress={openSelectFarmersModal}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="people-outline" size={14} color="#0E6F6A" style={{ marginRight: 4 }} />
                                        <Text style={styles.selectFarmersBtnText}>Assign Farmers</Text>
                                    </TouchableOpacity>
                                </View>

                                {calendarFarmers.length === 0 ? (
                                    <View style={styles.emptyFarmersBox}>
                                        <Ionicons name="people-outline" size={24} color="#9CA3AF" style={{ marginBottom: 6 }} />
                                        <Text style={styles.emptyFarmersText}>
                                            No farmers currently assigned to this calendar in {selectedState}. Tap "Assign Farmers" above to enroll farmers.
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={{ gap: 8 }}>
                                        {calendarFarmers.map((f: any) => (
                                            <View key={f.id} style={styles.farmerItemRow}>
                                                <View style={styles.farmerAvatarCircle}>
                                                    <Text style={styles.farmerAvatarText}>
                                                        {f.fullName || f.name
                                                            ? (f.fullName || f.name)
                                                                  .split(' ')
                                                                  .map((n: string) => n[0])
                                                                  .join('')
                                                                  .slice(0, 2)
                                                                  .toUpperCase()
                                                            : 'FR'}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.farmerName}>{f.fullName || f.name}</Text>
                                                    <Text style={styles.farmerSubText}>
                                                        {f.location?.community || 'Main Farm'} • {f.phone || '0800 000 0000'}
                                                    </Text>
                                                </View>
                                                <View style={styles.practicingBadge}>
                                                    <Text style={styles.practicingBadgeText}>Enrolled</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>

            {/* ═══════ SELECT FARMERS MODAL ═══════ */}
            <Modal
                isVisible={isSelectFarmersModalVisible}
                onBackdropPress={() => !isSavingFarmers && setSelectFarmersModalVisible(false)}
                onBackButtonPress={() => !isSavingFarmers && setSelectFarmersModalVisible(false)}
                backdropOpacity={0.5}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                style={{ margin: 0, justifyContent: 'flex-end' }}
                useNativeDriver
                hideModalContentWhileAnimating
            >
                <View style={styles.modalSheetContainer}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>Enroll Farmers</Text>
                            <Text style={styles.modalSubtitle} numberOfLines={1}>
                                {activeOption?.title || 'Option'} ({selectedState})
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => !isSavingFarmers && setSelectFarmersModalVisible(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {stateFarmers.length === 0 ? (
                            <Text style={styles.noFarmersModalText}>
                                No farmers found for {selectedState}. Register farmers in this state first.
                            </Text>
                        ) : (
                            stateFarmers.map((f: any) => {
                                const isSelected = selectedFarmerIds.includes(f.id);
                                return (
                                    <TouchableOpacity
                                        key={f.id}
                                        style={styles.modalFarmerItem}
                                        onPress={() => !isSavingFarmers && toggleFarmerSelection(f.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{ marginRight: 12 }}>
                                            <Ionicons
                                                name={isSelected ? 'checkbox' : 'square-outline'}
                                                size={22}
                                                color={isSelected ? '#0E6F6A' : '#9CA3AF'}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalFarmerName}>{f.fullName || f.name}</Text>
                                            <Text style={styles.modalFarmerCommunity}>
                                                {f.location?.community || 'Main Farm'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.modalSaveBtn, isSavingFarmers && { opacity: 0.6 }]}
                        onPress={handleSaveFarmers}
                        disabled={isSavingFarmers}
                    >
                        <Text style={styles.modalSaveBtnText}>
                            {isSavingFarmers
                                ? 'Saving Enrolments...'
                                : `Save Enrolments (${selectedFarmerIds.length})`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 110,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },

    // ── Picker Header ──
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
        zIndex: 50,
    },
    stateSelectorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4F0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stateSelectorText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    pickerSubtitle: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },

    // Popover dropdown
    dropdownPopover: {
        position: 'absolute',
        top: 52,
        left: 16,
        width: 220,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 4,
    },
    dropdownItemActive: {
        backgroundColor: '#E6F4F0',
    },
    dropdownItemText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    dropdownItemTextActive: {
        color: '#0E6F6A',
        fontWeight: '700',
    },
    configuredBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    configuredBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#166534',
    },

    // ── Tier Bar ──
    tierBarContainer: {
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 8,
    },
    tierScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tierTab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    tierTabActive: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    tierTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    tierTabTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    tierCountBadge: {
        marginLeft: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
    },
    tierCountBadgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    tierCountText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    tierCountTextActive: {
        color: '#FFFFFF',
    },

    // ── Option Selector ──
    optionSelectorContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingVertical: 8,
    },
    optionSelectorScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    optionCardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionCardBtnActive: {
        backgroundColor: '#E6F4F1',
        borderColor: '#0E6F6A',
    },
    optionBadge: {
        backgroundColor: '#94A3B8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginRight: 6,
    },
    optionBadgeActive: {
        backgroundColor: '#0E6F6A',
    },
    optionBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    optionBadgeTextActive: {
        color: '#FFFFFF',
    },
    optionTitleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        maxWidth: 160,
    },
    optionTitleTextActive: {
        color: '#0E6F6A',
        fontWeight: '700',
    },

    // ── Title Card ──
    planCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    planBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    planOptionCode: {
        backgroundColor: '#0E6F6A',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    planSystemName: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
    },
    planTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
        marginBottom: 4,
    },
    planLocation: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '600',
    },

    // ── Card Section Container ──
    cardSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    sectionSubheading: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 12,
    },

    // ── Satellite Geometric Canvas ──
    canvasHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    orientationToggle: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    orientationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    orientationBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    orientationBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    orientationBtnTextActive: {
        color: '#0F172A',
        fontWeight: '800',
    },

    satelliteCanvasWrapper: {
        width: '100%',
        aspectRatio: 1,
        maxWidth: 340,
        alignSelf: 'center',
        backgroundColor: '#14120e',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#292524',
        padding: 10,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    surveyorPeg: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FACC15',
        borderWidth: 1,
        borderColor: '#1C1917',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
    },
    surveyorPegCenter: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
    },
    compassRose: {
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    compassRoseText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    intercropHudBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 30,
        maxWidth: 160,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    intercropHudTitle: {
        color: '#6EE7B7',
        fontSize: 9,
        fontWeight: '800',
    },
    intercropHudSub: {
        color: '#D6D3D1',
        fontSize: 8,
        marginTop: 1,
    },
    borderHudBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        zIndex: 30,
        maxWidth: 180,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    borderHudTitle: {
        color: '#FDA4AF',
        fontSize: 9,
        fontWeight: '800',
    },
    borderHudSub: {
        color: '#D6D3D1',
        fontSize: 8,
        marginTop: 1,
    },

    fieldOuterSoilContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        padding: 4,
        backgroundColor: '#1C1917',
        borderWidth: 1,
        borderColor: '#292524',
    },
    concentricBorderRing: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.3)',
    },
    innerFurrowField: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#292524',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.5)',
    },

    // ── Canvas Legend ──
    canvasLegendContainer: {
        marginTop: 14,
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    legendBlock: {
        gap: 6,
    },
    legendBlockTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
    },
    legendChipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    legendCropChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 4,
    },
    cropDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F172A',
    },
    legendChipPct: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0E6F6A',
    },
    legendChipRows: {
        fontSize: 10,
        color: '#64748B',
    },
    legendRingTag: {
        fontSize: 10,
        fontWeight: '800',
    },

    // ── Agronomy Section ──
    agronomyAreaSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    agronomyGroupTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    agronomyRowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    agronomyCropName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    agronomyPctBadge: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    agronomyPctText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#334155',
    },
    agronomyMetaSub: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
    },
    agronomyStatsCol: {
        alignItems: 'flex-end',
    },
    agronomyStatItem: {
        fontSize: 10,
        color: '#64748B',
    },
    agronomyYieldText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0E6F6A',
        marginTop: 1,
    },
    boldText: {
        fontWeight: '800',
        color: '#0F172A',
    },

    agronomyTotalCard: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E6F4F1',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#BBE3DC',
    },
    agronomyTotalTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0E6F6A',
    },
    agronomyTotalSeed: {
        fontSize: 10,
        color: '#0E6F6A',
    },
    agronomyTotalYield: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0E6F6A',
        marginTop: 1,
    },

    // ── Practice Dates Stepper ──
    practiceDatesList: {
        gap: 8,
    },
    practiceDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
    },
    practiceIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    practiceDateLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    practiceDateNote: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 1,
    },
    practiceDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4F1',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBE3DC',
    },
    practiceDateBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },

    // ── Indicator Cards ──
    indicatorCard: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    indicatorVal: {
        fontSize: 18,
        fontWeight: '800',
    },
    indicatorLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
        marginTop: 2,
    },

    // ── Farmers List ──
    selectFarmersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4F0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    selectFarmersBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    emptyFarmersBox: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        paddingHorizontal: 14,
    },
    emptyFarmersText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 17,
    },
    farmerItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    farmerAvatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E6F4F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    farmerAvatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    farmerName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    farmerSubText: {
        fontSize: 11,
        color: '#64748B',
    },
    practicingBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    practicingBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#166534',
    },

    // ── Empty States ──
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 20,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E6F4F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    emptyInfoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#DCFCE7',
        borderRadius: 14,
        padding: 14,
        width: '100%',
    },
    emptyInfoText: {
        flex: 1,
        fontSize: 12,
        color: '#166534',
        lineHeight: 18,
    },

    // ── Modal Sheet ──
    modalSheetContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 1,
    },
    modalCancelText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    noFarmersModalText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        paddingVertical: 20,
    },
    modalFarmerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalFarmerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    modalFarmerCommunity: {
        fontSize: 11,
        color: '#64748B',
    },
    modalSaveBtn: {
        backgroundColor: '#0E6F6A',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalSaveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});

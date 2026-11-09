import { Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useFarmers } from '../../hooks/api/useFarmers';

const { width } = Dimensions.get('window');

const STEP_LABELS = ['Needs', 'Contributions', 'Review', 'Submit'];

const INPUT_CATALOG = [
    { id: 'seeds', name: 'Organic Seeds (Non-GMO Maize)', unitPrice: 22000, unit: 'bag', icon: 'leaf', iconBg: '#FEF9C3', iconColor: '#A16207' },
    { id: 'npk', name: 'Liquid Bio-Fertilizer (Organic)', unitPrice: 28000, unit: 'bag', icon: 'flask', iconBg: '#DBEAFE', iconColor: '#1D4ED8' },
    { id: 'urea', name: 'Neem Cake Bio-fertilizer', unitPrice: 18000, unit: 'bag', icon: 'water', iconBg: '#D1FAE5', iconColor: '#059669' },
    { id: 'herbicide', name: 'Bio-char Soil Conditioner', unitPrice: 6500, unit: 'Litre', icon: 'beaker', iconBg: '#FCE7F3', iconColor: '#BE185D' },
    { id: 'pesticide', name: 'Neem Oil Biopesticide', unitPrice: 7000, unit: 'Litre', icon: 'bug', iconBg: '#FEF2F2', iconColor: '#DC2626' },
];

type RequestType = 'input' | 'finance' | 'both';

function formatCurrency(amount: number) {
    return '₦' + amount.toLocaleString();
}

function StepIndicator({ currentStep }: { currentStep: number }) {
    const { colors, isDarkMode } = useTheme();
    return (
        <View style={stepStyles.container}>
            {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;
                const circleColor = isActive ? '#065F46' : isCompleted ? '#065F46' : isDarkMode ? '#475569' : '#D1D5DB';
                const textColor = isActive ? '#065F46' : isCompleted ? '#065F46' : isDarkMode ? '#94A3B8' : '#9CA3AF';

                return (
                    <React.Fragment key={idx}>
                        <View style={stepStyles.stepItem}>
                            <View style={[stepStyles.circle, { backgroundColor: circleColor }]}>
                                {isCompleted ? (
                                    <Ionicons name="checkmark" size={14} color="white" />
                                ) : (
                                    <Text style={stepStyles.circleText}>{stepNum}</Text>
                                )}
                            </View>
                            <Text style={[stepStyles.label, { color: textColor, fontWeight: isActive ? '700' : '500' }]}>{label}</Text>
                        </View>
                        {idx < STEP_LABELS.length - 1 && (
                            <View style={[stepStyles.line, { backgroundColor: isCompleted ? '#065F46' : isDarkMode ? '#475569' : '#E5E7EB' }]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

export interface FarmerAllocationItem {
    id: string;
    qty: number;
}

export interface FarmerAllocation {
    id: string;
    name: string;
    sizeHa: string;
    items: FarmerAllocationItem[];
}

export { StepIndicator, formatCurrency };

export default function MtgFundingInputsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();

    const { data: apiFarmers } = useFarmers();
    const groupName = (params.groupName as string) || (params.mtgName as string) || 'MTG Group';
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCatalog = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return INPUT_CATALOG;
        return INPUT_CATALOG.filter(c => c.name.toLowerCase().includes(q));
    }, [searchQuery]);

    const realFarmers = useMemo(() => {
        if (!apiFarmers || !Array.isArray(apiFarmers)) return [];
        return apiFarmers.map((f: any) => ({
            id: f.id,
            name: f.name || f.fullName || f.full_name || 'Farmer',
            sizeHa: f.metadata?.farmSizeHa || f.metadata?.farm_size_hectares || '1.0',
        }));
    }, [apiFarmers]);

    // Track which farmers are toggled ON for this funding request
    const [enabledFarmers, setEnabledFarmers] = useState<Record<string, boolean>>({});
    const [expandedFarmerId, setExpandedFarmerId] = useState<string | null>(null);
    const [farmerRequestTypes, setFarmerRequestTypes] = useState<Record<string, RequestType>>({});
    const [farmerFinance, setFarmerFinance] = useState<Record<string, { amount: string; purpose: string }>>({});
    const [farmerAllocations, setFarmerAllocations] = useState<FarmerAllocation[]>([]);

    useEffect(() => {
        if (realFarmers.length > 0 && farmerAllocations.length === 0) {
            const initEnabled: Record<string, boolean> = {};
            const initTypes: Record<string, RequestType> = {};
            const initFinance: Record<string, { amount: string; purpose: string }> = {};
            const initAlloc: FarmerAllocation[] = realFarmers.map(f => {
                initEnabled[f.id] = true;
                initTypes[f.id] = 'input';
                initFinance[f.id] = { amount: '', purpose: '' };
                return {
                    id: f.id,
                    name: f.name,
                    sizeHa: f.sizeHa,
                    items: []
                };
            });
            setEnabledFarmers(initEnabled);
            setExpandedFarmerId(realFarmers[0]?.id || null);
            setFarmerRequestTypes(initTypes);
            setFarmerFinance(initFinance);
            setFarmerAllocations(initAlloc);
        }
    }, [realFarmers]);

    const toggleFarmer = (farmerId: string) => {
        setEnabledFarmers(prev => {
            const nextVal = !prev[farmerId];
            if (nextVal) {
                setExpandedFarmerId(farmerId);
            } else if (expandedFarmerId === farmerId) {
                setExpandedFarmerId(null);
            }
            return { ...prev, [farmerId]: nextVal };
        });
    };

    // Communal MTG Buffer / Extra Group Quantities
    const [bulkInputs, setBulkInputs] = useState([
        { id: 'seeds', qty: 0 },
        { id: 'npk', qty: 0 },
        { id: 'urea', qty: 0 },
        { id: 'herbicide', qty: 0 },
        { id: 'pesticide', qty: 0 },
    ]);

    const [selectedFarmerForAdd, setSelectedFarmerForAdd] = useState<string | null>(null);
    const [modalSearchQuery, setModalSearchQuery] = useState('');

    const addInputToFarmer = (farmerId: string, inputId: string) => {
        setFarmerAllocations((prev) =>
            prev.map((f: FarmerAllocation) => {
                if (f.id === farmerId) {
                    const exists = f.items.some((item: FarmerAllocationItem) => item.id === inputId);
                    if (exists) return f;
                    return { ...f, items: [...f.items, { id: inputId, qty: 1 }] };
                }
                return f;
            })
        );
        setSelectedFarmerForAdd(null);
        setModalSearchQuery('');
    };

    const updateFarmerQty = (farmerId: string, inputId: string, delta: number) => {
        setFarmerAllocations((prev) =>
            prev.map((f: FarmerAllocation) => {
                if (f.id === farmerId) {
                    const updatedItems = f.items.map((item: FarmerAllocationItem) => {
                        if (item.id === inputId) {
                            return { ...item, qty: Math.max(0, item.qty + delta) };
                        }
                        return item;
                    }).filter((item: FarmerAllocationItem) => item.qty > 0);
                    return { ...f, items: updatedItems };
                }
                return f;
            })
        );
    };

    const getFarmerInputCost = (f: FarmerAllocation) =>
        f.items.reduce((sum: number, item: FarmerAllocationItem) => {
            const cat = INPUT_CATALOG.find(c => c.id === item.id);
            return sum + (cat ? cat.unitPrice * item.qty : 0);
        }, 0);

    const getFarmerFinanceAmount = (farmerId: string): number => {
        const raw = farmerFinance[farmerId]?.amount?.replace(/[^0-9]/g, '') || '0';
        return parseInt(raw, 10) || 0;
    };

    const getFarmerTotalCost = (farmerId: string) => {
        if (!enabledFarmers[farmerId]) return 0;
        const reqType = farmerRequestTypes[farmerId];
        const farmer = farmerAllocations.find(f => f.id === farmerId);
        const inputCost = (reqType === 'input' || reqType === 'both') && farmer ? getFarmerInputCost(farmer) : 0;
        const financeCost = (reqType === 'finance' || reqType === 'both') ? getFarmerFinanceAmount(farmerId) : 0;
        return inputCost + financeCost;
    };

    // Calculate sum of individual items from all enabled farmers
    const individualItemTotals = useMemo(() => {
        const totals: Record<string, number> = {
            seeds: 0,
            npk: 0,
            urea: 0,
            herbicide: 0,
            pesticide: 0,
        };
        farmerAllocations.forEach((f: FarmerAllocation) => {
            if (enabledFarmers[f.id]) {
                const reqType = farmerRequestTypes[f.id];
                if (reqType === 'input' || reqType === 'both') {
                    f.items.forEach((item: FarmerAllocationItem) => {
                        totals[item.id] = (totals[item.id] || 0) + item.qty;
                    });
                }
            }
        });
        return totals;
    }, [farmerAllocations, enabledFarmers, farmerRequestTypes]);

    const aggregateTotals = useMemo(() => {
        let individualInputAmount = 0;
        let individualFinanceAmount = 0;

        farmerAllocations.forEach(f => {
            if (enabledFarmers[f.id]) {
                const reqType = farmerRequestTypes[f.id];
                if (reqType === 'input' || reqType === 'both') individualInputAmount += getFarmerInputCost(f);
                if (reqType === 'finance' || reqType === 'both') individualFinanceAmount += getFarmerFinanceAmount(f.id);
            }
        });

        // Communal buffer amount
        let bulkGroupAmount = 0;
        bulkInputs.forEach(b => {
            const cat = INPUT_CATALOG.find(c => c.id === b.id);
            if (cat) bulkGroupAmount += cat.unitPrice * b.qty;
        });

        const totalIndividualAmount = individualInputAmount + individualFinanceAmount;
        const grandTotal = totalIndividualAmount + bulkGroupAmount;

        const activeFarmersCount = Object.values(enabledFarmers).filter(Boolean).length;

        return {
            individualInputAmount,
            individualFinanceAmount,
            totalIndividualAmount,
            bulkGroupAmount,
            totalAmount: grandTotal,
            activeFarmersCount,
            farmersWithInput: farmerAllocations.filter(f => enabledFarmers[f.id] && (farmerRequestTypes[f.id] === 'input' || farmerRequestTypes[f.id] === 'both')).length,
            farmersWithFinance: farmerAllocations.filter(f => enabledFarmers[f.id] && (farmerRequestTypes[f.id] === 'finance' || farmerRequestTypes[f.id] === 'both')).length,
        };
    }, [farmerAllocations, enabledFarmers, bulkInputs, farmerRequestTypes, farmerFinance]);

    const REQUEST_TYPE_OPTIONS: { key: RequestType; label: string; icon: string; desc: string; activeBg: string; activeText: string }[] = [
        { key: 'input', label: 'Input Only', icon: 'cube', desc: 'Seeds, fertilizers & agrochemicals', activeBg: '#1D4ED8', activeText: '#FFFFFF' },
        { key: 'finance', label: 'Finance Only', icon: 'cash', desc: 'Monetary financial support', activeBg: '#065F46', activeText: '#FFFFFF' },
        { key: 'both', label: 'Input + Finance', icon: 'layers', desc: 'Inputs and cash finance', activeBg: '#6D28D9', activeText: '#FFFFFF' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#F9FAFB' }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title="Create Funding Request"
                onBackPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace('/(agent)/mtgGroups');
                }}
                backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                textColor={colors.text}
                iconColor="#065F46"
                blurIntensity={20}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <StepIndicator currentStep={1} />

                    <View style={[styles.modeCard, { backgroundColor: isDarkMode ? colors.card : '#F0FDF4', borderColor: isDarkMode ? colors.border : '#BBF7D0' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="layers" size={20} color="#065F46" />
                            <Text style={[styles.modeCardTitle, { color: '#065F46', marginBottom: 0 }]}>Unified MTG Requisition Workflow</Text>
                        </View>
                        <Text style={[styles.modeCardSub, { color: isDarkMode ? colors.textMuted : '#047857', marginTop: 4 }]}>
                            1. Allocate specific needs to individual MTG members below.
                            {"\n"}
                            2. Add communal group supplies / buffer stock in the bulk section.
                        </Text>
                    </View>

                    {/* Part 1: Individual Farmer Needs */}
                    <View style={{ gap: 10, marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Individual Farmer Needs</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Per-farmer input allocations and financial needs:</Text>
                            </View>
                            <View style={[styles.summaryPill, { backgroundColor: '#ECFDF5' }]}>
                                <Text style={[styles.summaryPillText, { color: '#065F46' }]}>{farmerAllocations.length} Members</Text>
                            </View>
                        </View>

                        {farmerAllocations.length === 0 ? (
                            <View style={{ paddingVertical: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15, marginBottom: 4 }}>No Farmers Enrolled</Text>
                                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 16 }}>
                                    Farmers registered in this MTG group will appear here to map input and financing needs.
                                </Text>
                            </View>
                        ) : (
                            farmerAllocations.map((farmer) => {
                            const isEnabled = !!enabledFarmers[farmer.id];
                            const isExpanded = isEnabled && expandedFarmerId === farmer.id;
                            const reqType = farmerRequestTypes[farmer.id];
                            const farmerTotal = getFarmerTotalCost(farmer.id);
                            const finData = farmerFinance[farmer.id];
                            const reqTypeOpt = REQUEST_TYPE_OPTIONS.find(o => o.key === reqType)!;

                            return (
                                <View
                                    key={farmer.id}
                                    style={[
                                        styles.farmerAccordionCard,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: isEnabled ? (isDarkMode ? colors.border : '#BBF7D0') : (isDarkMode ? '#334155' : '#E2E8F0'),
                                            opacity: isEnabled ? 1 : 0.75,
                                        }
                                    ]}
                                >
                                    <View style={styles.farmerAccordionHeader}>
                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                                            onPress={() => isEnabled && setExpandedFarmerId(isExpanded ? null : farmer.id)}
                                            activeOpacity={isEnabled ? 0.7 : 1}
                                        >
                                            <View style={[styles.avatarCircle, { backgroundColor: isEnabled ? '#D1FAE5' : (isDarkMode ? '#334155' : '#F3F4F6') }]}>
                                                <Ionicons name="person" size={18} color={isEnabled ? '#065F46' : colors.textMuted} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={[styles.farmerName, { color: isEnabled ? colors.text : colors.textMuted }]}>{farmer.name}</Text>
                                                    {isEnabled && (
                                                        <View style={[styles.reqTypeBadge, { backgroundColor: reqTypeOpt.activeBg + '22' }]}>
                                                            <Ionicons name={reqTypeOpt.icon as any} size={9} color={reqTypeOpt.activeBg} />
                                                            <Text style={[styles.reqTypeBadgeText, { color: reqTypeOpt.activeBg }]}>{reqTypeOpt.label}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={[styles.farmerSubText, { color: colors.textMuted, marginTop: 2 }]}>
                                                    {farmer.id} • {farmer.sizeHa} Ha {isEnabled ? '' : '• (Not Requesting)'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            {isEnabled && (
                                                <TouchableOpacity
                                                    onPress={() => setExpandedFarmerId(isExpanded ? null : farmer.id)}
                                                    style={{ alignItems: 'flex-end', marginRight: 4 }}
                                                >
                                                    <Text style={styles.farmerCostTag}>{farmerTotal > 0 ? formatCurrency(farmerTotal) : 'Configure'}</Text>
                                                    <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                                                </TouchableOpacity>
                                            )}
                                            <Switch
                                                value={isEnabled}
                                                onValueChange={() => toggleFarmer(farmer.id)}
                                                trackColor={{ false: isDarkMode ? '#475569' : '#D1D5DB', true: '#A7F3D0' }}
                                                thumbColor={isEnabled ? '#065F46' : '#9CA3AF'}
                                            />
                                        </View>
                                    </View>

                                    {isEnabled && isExpanded && (
                                        <View>
                                            <View style={styles.stepperDivider} />
                                            <View style={styles.reqTypeSection}>
                                                <Text style={[styles.reqTypeSectionLabel, { color: colors.textMuted }]}>What does this farmer need?</Text>
                                                <View style={styles.reqTypeRow}>
                                                    {REQUEST_TYPE_OPTIONS.map(opt => {
                                                        const isActive = reqType === opt.key;
                                                        return (
                                                            <TouchableOpacity
                                                                key={opt.key}
                                                                style={[
                                                                    styles.reqTypeBtn,
                                                                    { borderColor: isActive ? opt.activeBg : isDarkMode ? colors.border : '#E2E8F0' },
                                                                    isActive && { backgroundColor: opt.activeBg }
                                                                ]}
                                                                onPress={() => setFarmerRequestTypes(prev => ({ ...prev, [farmer.id]: opt.key }))}
                                                            >
                                                                <Ionicons name={opt.icon as any} size={16} color={isActive ? '#FFFFFF' : opt.activeBg} />
                                                                <Text style={[styles.reqTypeBtnLabel, { color: isActive ? '#FFFFFF' : colors.text }]}>{opt.label}</Text>
                                                                <Text style={[styles.reqTypeBtnDesc, { color: isActive ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>{opt.desc}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>

                                            {(reqType === 'input' || reqType === 'both') && (
                                                <View style={styles.inputStepperList}>
                                                    <View style={[styles.subSectionHeader, { backgroundColor: '#EFF6FF' }]}>
                                                        <Ionicons name="cube" size={13} color="#1D4ED8" />
                                                        <Text style={[styles.subSectionHeaderText, { color: '#1D4ED8' }]}>Input Allocation</Text>
                                                        <Text style={[styles.subSectionCost, { color: '#1D4ED8' }]}>{formatCurrency(getFarmerInputCost(farmer))}</Text>
                                                    </View>

                                                    {farmer.items.map((item: FarmerAllocationItem) => {
                                                        const cat = INPUT_CATALOG.find(c => c.id === item.id);
                                                        if (!cat) return null;
                                                        return (
                                                            <View key={item.id} style={styles.stepperRow}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                                                    <View style={[styles.miniIconBg, { backgroundColor: cat.iconBg }]}>
                                                                        <Ionicons name={cat.icon as any} size={14} color={cat.iconColor} />
                                                                    </View>
                                                                    <View style={{ flex: 1 }}>
                                                                        <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                                                                        <Text style={styles.catUnitPrice}>{formatCurrency(cat.unitPrice)} / {cat.unit}</Text>
                                                                    </View>
                                                                </View>
                                                                <View style={styles.stepperBox}>
                                                                    <TouchableOpacity style={styles.stepBtnMinus} onPress={() => updateFarmerQty(farmer.id, item.id, -1)}>
                                                                        <Text style={styles.stepBtnText}>−</Text>
                                                                    </TouchableOpacity>
                                                                    <Text style={styles.stepValText}>{item.qty}</Text>
                                                                    <TouchableOpacity style={styles.stepBtnPlus} onPress={() => updateFarmerQty(farmer.id, item.id, 1)}>
                                                                        <Text style={styles.stepBtnTextPlus}>+</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                    {farmer.items.length === 0 && (
                                                        <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginVertical: 6 }}>No inputs allocated yet.</Text>
                                                    )}
                                                    <TouchableOpacity
                                                        style={[styles.addInputBtn, { borderColor: '#1D4ED8' }]}
                                                        onPress={() => setSelectedFarmerForAdd(farmer.id)}
                                                    >
                                                        <Ionicons name="add-circle" size={16} color="#1D4ED8" />
                                                        <Text style={[styles.addInputBtnText, { color: '#1D4ED8' }]}>Allocate Input Item</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {(reqType === 'finance' || reqType === 'both') && (
                                                <View style={styles.inputStepperList}>
                                                    <View style={[styles.subSectionHeader, { backgroundColor: '#F0FDF4' }]}>
                                                        <Ionicons name="cash" size={13} color="#065F46" />
                                                        <Text style={[styles.subSectionHeaderText, { color: '#065F46' }]}>Finance Request</Text>
                                                        {getFarmerFinanceAmount(farmer.id) > 0 && (
                                                            <Text style={[styles.subSectionCost, { color: '#065F46' }]}>{formatCurrency(getFarmerFinanceAmount(farmer.id))}</Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.financeFieldGroup}>
                                                        <Text style={[styles.financeFieldLabel, { color: colors.textMuted }]}>Financial Implication (₦)</Text>
                                                        <View style={[styles.financeAmountRow, { backgroundColor: isDarkMode ? colors.inputBackground : '#F8FAFC', borderColor: isDarkMode ? colors.border : '#E2E8F0' }]}>
                                                            <Text style={[styles.currencyPrefix, { color: colors.textMuted }]}>₦</Text>
                                                            <TextInput
                                                                style={[styles.financeAmountInput, { color: colors.text }]}
                                                                placeholder="0"
                                                                placeholderTextColor={colors.textMuted}
                                                                keyboardType="numeric"
                                                                value={finData?.amount || ''}
                                                                onChangeText={(val) => setFarmerFinance(prev => ({ ...prev, [farmer.id]: { ...prev[farmer.id], amount: val } }))}
                                                            />
                                                        </View>
                                                    </View>
                                                    <View style={styles.financeFieldGroup}>
                                                        <Text style={[styles.financeFieldLabel, { color: colors.textMuted }]}>Finance Category</Text>
                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                {['Land Preparation', 'Irrigation', 'Labour Cost', 'Equipment Hire', 'Post-Harvest', 'General'].map(cat => {
                                                                    const isSelected = finData?.purpose === cat;
                                                                    return (
                                                                        <TouchableOpacity
                                                                            key={cat}
                                                                            style={[styles.financeCategoryPill, isSelected && styles.financeCategoryPillActive]}
                                                                            onPress={() => setFarmerFinance(prev => ({ ...prev, [farmer.id]: { ...prev[farmer.id], purpose: cat } }))}
                                                                        >
                                                                            <Text style={[styles.financeCategoryPillText, isSelected && { color: '#065F46', fontWeight: '700' }]}>{cat}</Text>
                                                                        </TouchableOpacity>
                                                                    );
                                                                })}
                                                            </View>
                                                        </ScrollView>
                                                    </View>
                                                    <View style={styles.financeFieldGroup}>
                                                        <Text style={[styles.financeFieldLabel, { color: colors.textMuted }]}>Purpose / Description</Text>
                                                        <TextInput
                                                            style={[styles.financePurposeInput, { backgroundColor: isDarkMode ? colors.inputBackground : '#F8FAFC', borderColor: isDarkMode ? colors.border : '#E2E8F0', color: colors.text }]}
                                                            placeholder="Describe what the finance will be used for..."
                                                            placeholderTextColor={colors.textMuted}
                                                            multiline
                                                            numberOfLines={3}
                                                            textAlignVertical="top"
                                                            value={finData?.purpose || ''}
                                                            onChangeText={(val) => setFarmerFinance(prev => ({ ...prev, [farmer.id]: { ...prev[farmer.id], purpose: val } }))}
                                                        />
                                                    </View>
                                                </View>
                                            )}
                                            {farmerTotal > 0 && (
                                                <View style={[styles.farmerTotalRow, { borderTopColor: isDarkMode ? colors.border : '#F1F5F9' }]}>
                                                    {reqType === 'both' && (
                                                        <>
                                                            <View style={styles.farmerTotalPart}>
                                                                <Text style={styles.farmerTotalPartLabel}>Inputs</Text>
                                                                <Text style={[styles.farmerTotalPartVal, { color: '#1D4ED8' }]}>{formatCurrency(getFarmerInputCost(farmer))}</Text>
                                                            </View>
                                                            <View style={styles.farmerTotalSep} />
                                                            <View style={styles.farmerTotalPart}>
                                                                <Text style={styles.farmerTotalPartLabel}>Finance</Text>
                                                                <Text style={[styles.farmerTotalPartVal, { color: '#065F46' }]}>{formatCurrency(getFarmerFinanceAmount(farmer.id))}</Text>
                                                            </View>
                                                            <View style={styles.farmerTotalSep} />
                                                        </>
                                                    )}
                                                    <View style={styles.farmerTotalPart}>
                                                        <Text style={styles.farmerTotalPartLabel}>Total</Text>
                                                        <Text style={[styles.farmerTotalPartVal, { color: '#065F46', fontWeight: '800' }]}>{formatCurrency(farmerTotal)}</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                        )}
                    </View>

                    {/* Part 2: MTG Group Bulk Supplies & Live Member Rollup */}
                    <View style={{ gap: 10, marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Group Bulk & Requisition Rollup</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Member needs sum up here automatically. Add extra communal buffer bags:</Text>
                            </View>
                            <View style={[styles.summaryPill, { backgroundColor: '#EFF6FF' }]}>
                                <Text style={[styles.summaryPillText, { color: '#1D4ED8' }]}>Live Rollup</Text>
                            </View>
                        </View>

                        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF', borderColor: isDarkMode ? colors.border : '#E2E8F0' }]}>
                            <Ionicons name="search" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                            <TextInput
                                placeholder="Search organic inputs..."
                                style={[styles.searchInput, { color: colors.text }]}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {filteredCatalog.map((cat) => {
                            const bulkObj = bulkInputs.find(b => b.id === cat.id) || { qty: 0 };
                            const memberQty = individualItemTotals[cat.id] || 0;
                            const totalItemQty = memberQty + bulkObj.qty;
                            const totalItemCost = cat.unitPrice * totalItemQty;

                            return (
                                <View key={cat.id} style={[styles.inputCard, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                                    <View style={[styles.inputIconBg, { backgroundColor: cat.iconBg }]}>
                                        <Ionicons name={cat.icon as any} size={20} color={cat.iconColor} />
                                    </View>
                                    <View style={styles.inputInfo}>
                                        <Text style={[styles.inputName, { color: colors.text }]}>{cat.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                            <Text style={[styles.inputUnit, { color: colors.textMuted }]}>
                                                Members: <Text style={{ fontWeight: '700', color: '#1D4ED8' }}>{memberQty} {cat.unit}s</Text>
                                            </Text>
                                            <Text style={[styles.inputUnit, { color: colors.textMuted }]}>+</Text>
                                            <Text style={[styles.inputUnit, { color: colors.textMuted }]}>
                                                Buffer: <Text style={{ fontWeight: '700', color: '#D97706' }}>{bulkObj.qty} {cat.unit}s</Text>
                                            </Text>
                                        </View>
                                        {totalItemQty > 0 && (
                                            <Text style={styles.inputTotal}>Total: {totalItemQty} {cat.unit}s ({formatCurrency(totalItemCost)})</Text>
                                        )}
                                    </View>
                                    <View style={{ alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>Buffer</Text>
                                        <View style={styles.qtyControls}>
                                            <TouchableOpacity
                                                style={[styles.qtyBtn, { backgroundColor: isDarkMode ? '#334155' : '#F3F4F6' }]}
                                                onPress={() => setBulkInputs(prev => prev.map(b => b.id === cat.id ? { ...b, qty: Math.max(0, b.qty - 1) } : b))}
                                            >
                                                <Text style={[styles.qtyBtnText, { color: colors.text }]}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.qtyValue, { color: colors.text }]}>{bulkObj.qty}</Text>
                                            <TouchableOpacity
                                                style={[styles.qtyBtn, { backgroundColor: '#065F46' }]}
                                                onPress={() => setBulkInputs(prev => prev.map(b => b.id === cat.id ? { ...b, qty: b.qty + 1 } : b))}
                                            >
                                                <Text style={[styles.qtyBtnText, { color: 'white' }]}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Combined Group Request Summary */}
                    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: isDarkMode ? colors.border : '#E2E8F0' }]}>
                        <Text style={[styles.summaryTitle, { color: colors.text }]}>Total MTG Funding Requisition</Text>
                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryPillsRow}>
                            <View style={[styles.summaryPill, { backgroundColor: '#DBEAFE' }]}>
                                <Ionicons name="people" size={12} color="#1D4ED8" />
                                <Text style={[styles.summaryPillText, { color: '#1D4ED8' }]}>{aggregateTotals.activeFarmersCount} / 5 Active Members</Text>
                            </View>
                            <View style={[styles.summaryPill, { backgroundColor: '#D1FAE5' }]}>
                                <Ionicons name="cube" size={12} color="#065F46" />
                                <Text style={[styles.summaryPillText, { color: '#065F46' }]}>{aggregateTotals.farmersWithInput} Inputs</Text>
                            </View>
                            <View style={[styles.summaryPill, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="cash" size={12} color="#D97706" />
                                <Text style={[styles.summaryPillText, { color: '#D97706' }]}>{aggregateTotals.farmersWithFinance} Finance</Text>
                            </View>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="people" size={14} color="#1D4ED8" />
                                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Individual Member Requests</Text>
                            </View>
                            <Text style={[styles.summaryValue, { color: '#1D4ED8' }]}>{formatCurrency(aggregateTotals.totalIndividualAmount)}</Text>
                        </View>

                        {aggregateTotals.bulkGroupAmount > 0 && (
                            <View style={styles.summaryRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="cube" size={14} color="#D97706" />
                                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Communal Buffer Stock</Text>
                                </View>
                                <Text style={[styles.summaryValue, { color: '#D97706' }]}>{formatCurrency(aggregateTotals.bulkGroupAmount)}</Text>
                            </View>
                        )}

                        <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: isDarkMode ? colors.border : '#E5E7EB', paddingTop: 10, marginTop: 4 }]}>
                            <Text style={[styles.summaryLabel, { color: colors.textMuted, fontWeight: '700' }]}>Grand Total Requisition</Text>
                            <Text style={[styles.summaryValueLarge, { color: '#065F46' }]}>{formatCurrency(aggregateTotals.totalAmount)}</Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: isDarkMode ? colors.border : '#F3F4F6' }]}>
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => router.push({
                        pathname: '/mtgFundingContributions',
                        params: {
                            groupId: params.groupId || '',
                            groupName,
                            totalAmount: aggregateTotals.totalAmount.toString(),
                            allocations: JSON.stringify({
                                farmers: farmerAllocations.filter(f => enabledFarmers[f.id]),
                                bulk: bulkInputs
                            }),
                            entryMode: 'combined'
                        }
                    })}
                >
                    <Text style={styles.nextBtnText}>Next: Verify Bank Balance ({formatCurrency(aggregateTotals.totalAmount)})</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <Modal
                visible={selectedFarmerForAdd !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedFarmerForAdd(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Allocate Input</Text>
                            <TouchableOpacity onPress={() => setSelectedFarmerForAdd(null)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6', borderColor: colors.border, marginBottom: 16 }]}>
                            <Ionicons name="search" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                            <TextInput
                                placeholder="Search organic inputs..."
                                style={[styles.searchInput, { color: colors.text }]}
                                value={modalSearchQuery}
                                onChangeText={setModalSearchQuery}
                                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                            />
                            {modalSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                                    <Ionicons name="close-circle" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                            {INPUT_CATALOG
                                .filter(cat => {
                                    const matchQuery = cat.name.toLowerCase().includes(modalSearchQuery.toLowerCase());
                                    const farmer = farmerAllocations.find(f => f.id === selectedFarmerForAdd);
                                    const alreadyHas = farmer?.items.some((item: FarmerAllocationItem) => item.id === cat.id);
                                    return matchQuery && !alreadyHas;
                                })
                                .map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.modalItemRow, { borderBottomColor: isDarkMode ? colors.border : '#F1F5F9' }]}
                                        onPress={() => addInputToFarmer(selectedFarmerForAdd!, cat.id)}
                                    >
                                        <View style={[styles.miniIconBg, { backgroundColor: cat.iconBg, marginRight: 10 }]}>
                                            <Ionicons name={cat.icon as any} size={14} color={cat.iconColor} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.modalItemName, { color: colors.text }]}>{cat.name}</Text>
                                            <Text style={styles.modalItemSub}>{formatCurrency(cat.unitPrice)} / {cat.unit}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                                    </TouchableOpacity>
                                ))}
                            
                            {INPUT_CATALOG.filter(cat => {
                                const matchQuery = cat.name.toLowerCase().includes(modalSearchQuery.toLowerCase());
                                const farmer = farmerAllocations.find(f => f.id === selectedFarmerForAdd);
                                const alreadyHas = farmer?.items.some((item: FarmerAllocationItem) => item.id === cat.id);
                                return matchQuery && !alreadyHas;
                            }).length === 0 && (
                                <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginVertical: 8 }}>
                                    No unallocated inputs match your search.
                                </Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const stepStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        marginBottom: 20,
        flexDirection: 'row',
    },
    stepItem: {
        alignItems: 'center',
        gap: 6,
    },
    circle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    label: {
        fontSize: 10,
        textAlign: 'center',
    },
    line: {
        flex: 1,
        height: 2,
        marginHorizontal: 4,
        marginBottom: 18,
        borderRadius: 1,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 155,
        paddingHorizontal: 16,
    },

    // Mode Selector Styles
    modeCard: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 16,
        padding: 14,
        marginBottom: 20,
        gap: 6,
    },
    modeCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#065F46',
    },
    modeCardSub: {
        fontSize: 12,
        color: '#475569',
        marginBottom: 6,
    },
    modeToggleRow: {
        flexDirection: 'row',
        gap: 10,
    },
    modeToggleBtn: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#065F46',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    modeToggleBtnActive: {
        backgroundColor: '#065F46',
    },
    modeToggleBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#065F46',
    },
    modeToggleBtnTextActive: {
        color: '#FFFFFF',
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 12,
        marginBottom: 12,
    },

    // Farmer Accordion Styles
    farmerAccordionCard: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    farmerAccordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    farmerName: {
        fontSize: 14,
        fontWeight: '700',
    },
    farmerSubText: {
        fontSize: 11,
    },
    farmerCostTag: {
        fontSize: 13,
        fontWeight: '800',
        color: '#065F46',
    },
    inputStepperList: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        gap: 10,
    },
    stepperDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 4,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    miniIconBg: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catName: {
        fontSize: 12,
        fontWeight: '600',
    },
    catUnitPrice: {
        fontSize: 10,
        color: '#64748B',
    },
    stepperBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    stepBtnMinus: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnPlus: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#065F46',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
    },
    stepBtnTextPlus: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    stepValText: {
        fontSize: 14,
        fontWeight: '700',
        minWidth: 20,
        textAlign: 'center',
    },

    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    inputIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    inputInfo: {
        flex: 1,
        gap: 2,
    },
    inputName: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputUnit: {
        fontSize: 12,
    },
    inputTotal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065F46',
        marginTop: 2,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnText: {
        fontSize: 18,
        fontWeight: '600',
    },
    qtyValue: {
        fontSize: 16,
        fontWeight: '700',
        minWidth: 24,
        textAlign: 'center',
    },
    summaryCard: {
        borderRadius: 16,
        padding: 18,
        marginTop: 8,
        borderWidth: 1,
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    summaryBreakdownGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    breakdownItem: {
        width: '47%',
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    breakdownLabel: {
        fontSize: 10,
        color: '#64748B',
    },
    breakdownValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065F46',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 13,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    summaryValueLarge: {
        fontSize: 20,
        fontWeight: '800',
    },
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
        fontSize: 14,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        height: '100%',
        paddingVertical: 0,
    },
    addInputBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 8,
        height: 38,
        marginTop: 10,
        gap: 6,
    },
    addInputBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#065F46',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    modalItemName: {
        fontSize: 13,
        fontWeight: '600',
    },
    modalItemSub: {
        fontSize: 10,
        color: '#64748B',
    },
    emptyModalText: {
        fontSize: 12,
        textAlign: 'center',
        marginVertical: 20,
    },

    // ── Request Type Selector ──
    reqTypeSection: {
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 6,
    },
    reqTypeSectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 10,
    },
    reqTypeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    reqTypeBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'transparent',
    },
    reqTypeBtnActive: {
        backgroundColor: '#065F46',
    },
    reqTypeBtnLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
    },
    reqTypeBtnDesc: {
        fontSize: 9,
        color: '#6B7280',
        textAlign: 'center',
    },
    reqTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    reqTypeBadgeText: {
        fontSize: 9,
        fontWeight: '700',
    },

    // ── Sub-section headers (Input / Finance) ──
    subSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        marginBottom: 10,
    },
    subSectionHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
    },
    subSectionCost: {
        fontSize: 12,
        fontWeight: '800',
    },

    // ── Finance Fields ──
    financeFieldGroup: {
        marginBottom: 12,
    },
    financeFieldLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 6,
    },
    financeAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        gap: 6,
    },
    currencyPrefix: {
        fontSize: 18,
        fontWeight: '700',
    },
    financeAmountInput: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        paddingVertical: 0,
    },
    financePurposeInput: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        minHeight: 80,
    },
    financeCategoryPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    financeCategoryPillActive: {
        backgroundColor: '#D1FAE5',
        borderColor: '#6EE7B7',
    },
    financeCategoryPillText: {
        fontSize: 11,
        color: '#374151',
        fontWeight: '600',
    },

    // ── Farmer total footer ──
    farmerTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        gap: 12,
    },
    farmerTotalPart: {
        alignItems: 'flex-end',
    },
    farmerTotalPartLabel: {
        fontSize: 9,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    farmerTotalPartVal: {
        fontSize: 13,
        fontWeight: '700',
    },
    farmerTotalSep: {
        width: 1,
        height: 28,
        backgroundColor: '#E5E7EB',
    },

    // ── Summary pills row ──
    summaryPillsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    summaryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    summaryPillText: {
        fontSize: 11,
        fontWeight: '700',
    },
});

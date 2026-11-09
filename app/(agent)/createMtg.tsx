import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';
import { useFarms } from '../../hooks/api/useFarms';
import api from '../../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR = require('../../assets/images/whoLogin2.png');
const MAP_PLACEHOLDER = require('../../assets/images/backgroundGradient.png');

const AVAILABLE_FARMERS: any[] = [];

type Step = 'details' | 'farmers' | 'demoPlot';

export default function CreateMtgScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const { data: apiFarms } = useFarms();

    const demoPlots = useMemo(() => {
        if (!apiFarms || !Array.isArray(apiFarms)) return [];
        return apiFarms
            .filter((f: any) => f.isDemoPlot || f.is_demo_plot || f.type === 'demo' || (f.name && f.name.toLowerCase().includes('demo')))
            .map((f: any) => ({
                id: f.id,
                name: f.name || 'Demonstration Plot',
                size: f.size_hectares ? `${f.size_hectares} ha` : (f.sizeHectares ? `${f.sizeHectares} ha` : '—'),
                location: f.community || [f.lga, f.state].filter(Boolean).join(', ') || 'Kaduna State',
                cropType: f.primary_crop || f.crop || 'Demonstration',
            }));
    }, [apiFarms]);

    const [groupName, setGroupName] = useState('');
    const [region, setRegion] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFarmerIds, setSelectedFarmerIds] = useState<string[]>([]);
    const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
    const [farmerSearch, setFarmerSearch] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [step, setStep] = useState<Step>('details');
    const [farmers, setFarmers] = useState<any[]>(AVAILABLE_FARMERS);
    const [loadingFarmers, setLoadingFarmers] = useState(true);

    useEffect(() => {
        const fetchFarmers = async () => {
            try {
                
                const res = await api.get('/farmers');
                if (res.data && Array.isArray(res.data.data)) {
                    setFarmers(res.data.data.map((f: any) => ({
                        id: f.id,
                        name: f.fullName || f.name,
                        community: f.location?.community || f.community || f.metadata?.community || 'Community',
                        completion: f.activities > 0 ? Math.round((f.activities / 17) * 100) : 0
                    })));
                }
            } catch (err) {
                console.warn("Failed to load farmers for MTG creation:", err);
            } finally {
                setLoadingFarmers(false);
            }
        };
        fetchFarmers();
    }, []);

    const filteredFarmers = farmers.filter((f) =>
        f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
        f.id.toLowerCase().includes(farmerSearch.toLowerCase())
    );

    const toggleFarmer = (id: string) => {
        setSelectedFarmerIds((prev) =>
            prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
        );
    };

    const handleRefactor = () => {
        console.log("lola's function")
    }
    useEffect(() => {
        handleRefactor()
    }, [])
    const handleCreate = async () => {
        try {
            const response = await api.post('/mtgs', {
                name: groupName,
                description: description || undefined,
                community: region,
                stateId: 19,
                lgaId: 347,
                wardId: 4002
            });
            const newMtgId = response.data?.id || response.data?.data?.id;
            if (newMtgId && selectedFarmerIds.length > 0) {
                await api.post(`/mtgs/${newMtgId}/add-farmers`, {
                    farmerIds: selectedFarmerIds
                });
            }
            setShowToast(true);
        } catch (err: any) {
            console.error("Failed to create MTG:", err);
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    const handleBack = () => {
        if (step === 'demoPlot') setStep('farmers');
        else if (step === 'farmers') setStep('details');
        else router.replace('/(agent)/mtgGroups');
    };

    const isDetailsValid = groupName.trim().length > 0 && region.trim().length > 0;

    const renderStepIndicator = () => {
        const steps = [
            { key: 'details', num: '1' },
            { key: 'farmers', num: '2' },
            { key: 'demoPlot', num: '3' },
        ];
        const currentIdx = steps.findIndex(s => s.key === step);

        return (
            <View style={styles.stepRow}>
                {steps.map((s, i) => (
                    <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.stepDot, { backgroundColor: i <= currentIdx ? '#0E6F6A' : colors.border }]}>
                            {i < currentIdx ? (
                                <Feather name="check" size={14} color="white" />
                            ) : (
                                <Text style={[styles.stepNumber, i > currentIdx && { color: colors.textMuted }]}>{s.num}</Text>
                            )}
                        </View>
                        {i < steps.length - 1 && (
                            <View style={[styles.stepLine, { backgroundColor: i < currentIdx ? '#0E6F6A' : colors.border }]} />
                        )}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title={t('mtg_create_group')}
                onBackPress={handleBack}
                backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                textColor={colors.text}
                iconColor={colors.primary}
                blurIntensity={20}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* STEP 1: Group Details */}
                {step === 'details' && (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {renderStepIndicator()}
                        <Text style={[styles.stepLabel, { color: colors.text }]}>Group Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Group Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder="e.g. Makarfi Farmers MTG"
                                placeholderTextColor={colors.textMuted}
                                value={groupName}
                                onChangeText={setGroupName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Region / Location *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder="e.g. Kaduna"
                                placeholderTextColor={colors.textMuted}
                                value={region}
                                onChangeText={setRegion}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Description (optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder="Brief description of this group..."
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, { opacity: isDetailsValid ? 1 : 0.5 }]}
                            disabled={!isDetailsValid}
                            onPress={() => setStep('farmers')}
                        >
                            <Text style={styles.primaryButtonText}>Next: Select Farmers</Text>
                            <Feather name="arrow-right" size={18} color="white" />
                        </TouchableOpacity>
                    </ScrollView>
                )}

                {/* STEP 2: Select Farmers */}
                {step === 'farmers' && (
                    <View style={styles.farmersStep}>
                        <View style={{ paddingHorizontal: 20, paddingTop: 155 }}>
                            {renderStepIndicator()}
                            <Text style={[styles.stepLabel, { color: colors.text }]}>
                                Select Farmers ({selectedFarmerIds.length} selected)
                            </Text>
                        </View>

                        <View style={[styles.farmerSearchBar, { backgroundColor: colors.card, marginHorizontal: 20, borderColor: colors.border }]}>
                            <Feather name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                placeholder="Search farmers..."
                                placeholderTextColor={colors.textMuted}
                                style={{ flex: 1, color: colors.text, fontSize: 14, marginLeft: 10 }}
                                value={farmerSearch}
                                onChangeText={setFarmerSearch}
                            />
                        </View>

                        <FlatList
                            data={filteredFarmers}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const isSelected = selectedFarmerIds.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        onPress={() => toggleFarmer(item.id)}
                                        style={[styles.farmerSelectCard, { backgroundColor: colors.card, borderColor: isSelected ? '#0E6F6A' : colors.border }]}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                                            {isSelected && <Feather name="check" size={14} color="white" />}
                                        </View>
                                        <Image source={AVATAR} style={styles.farmerAvatar} contentFit="cover" />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.farmerName, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={[styles.farmerId, { color: colors.textMuted }]}>{item.id} · {item.community}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.primaryButton, { opacity: selectedFarmerIds.length > 0 ? 1 : 0.5 }]}
                                disabled={selectedFarmerIds.length === 0}
                                onPress={() => setStep('demoPlot')}
                            >
                                <Text style={styles.primaryButtonText}>Next: Select Demo Plot</Text>
                                <Feather name="arrow-right" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* STEP 3: Select Demo Plot */}
                {step === 'demoPlot' && (
                    <View style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
                            {renderStepIndicator()}
                            <Text style={[styles.stepLabel, { color: colors.text }]}>
                                Select Demo Plot
                            </Text>

                            {/* Map New Plot option */}
                            <TouchableOpacity
                                style={styles.mapNewButton}
                                onPress={() => router.navigate({ pathname: '/(agent)/register-farmer/farm-details', params: { flow: 'demo_plot', returnPath: '/(agent)/createMtg' } })}
                            >
                                <Feather name="plus" size={18} color="#0E6F6A" />
                                <Text style={styles.mapNewText}>Map New Demo Plot</Text>
                            </TouchableOpacity>

                            {/* Demo plot cards */}
                            {demoPlots.length === 0 ? (
                                <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 16 }}>
                                        No demo plots available yet. Tap "Map New Demo Plot" to trace boundaries.
                                    </Text>
                                </View>
                            ) : (
                                demoPlots.map((plot) => {
                                    const isSelected = selectedPlotId === plot.id;
                                    return (
                                        <TouchableOpacity
                                            key={plot.id}
                                            onPress={() => setSelectedPlotId(isSelected ? null : plot.id)}
                                            style={[styles.plotCard, { backgroundColor: colors.card, borderColor: isSelected ? '#0E6F6A' : colors.border }]}
                                        >
                                            {/* Map thumbnail */}
                                            <View style={styles.plotMapThumb}>
                                                <Image source={MAP_PLACEHOLDER} style={[StyleSheet.absoluteFill, { opacity: 0.5 }]} contentFit="cover" />
                                                <Feather name="map" size={20} color="white" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.farmerName, { color: colors.text }]}>{plot.name}</Text>
                                                <Text style={[styles.farmerId, { color: colors.textMuted }]}>{plot.size} · {plot.location}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                    <Ionicons name="leaf-outline" size={12} color={colors.textMuted} />
                                                    <Text style={[styles.farmerId, { color: colors.textMuted, marginTop: 0 }]}>{plot.cropType}</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                                {isSelected && <View style={styles.radioInner} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>

                        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleCreate}
                            >
                                <Ionicons name="people" size={20} color="white" />
                                <Text style={styles.primaryButtonText}>
                                    Create Group ({selectedFarmerIds.length} farmers)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>

            <NotificationToast
                visible={showToast}
                onTimerEnd={() => {
                    setShowToast(false);
                    router.replace('/(agent)/mtgGroups');
                }}
                title="Group Created!"
                message={`${groupName} has been created with ${selectedFarmerIds.length} farmers.`}
                duration={2}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 155, paddingHorizontal: 20, paddingBottom: 40 },
    stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    stepNumber: { color: 'white', fontSize: 14, fontWeight: '700' },
    stepLine: { width: 40, height: 2 },
    stepLabel: { fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
    inputGroup: { marginBottom: 20, gap: 8 },
    label: { fontSize: 13, fontWeight: '600' },
    input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, borderWidth: 1.5 },
    textArea: { height: 100, paddingTop: 14 },
    primaryButton: { height: 54, backgroundColor: '#0E6F6A', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
    primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
    farmersStep: { flex: 1 },
    farmerSearchBar: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1, marginBottom: 16 },
    farmerSelectCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12, marginBottom: 8, borderWidth: 1.5 },
    checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: '#0E6F6A', borderColor: '#0E6F6A' },
    farmerAvatar: { width: 36, height: 36, borderRadius: 10 },
    farmerName: { fontSize: 15, fontWeight: '600' },
    farmerId: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
    mapNewButton: { height: 48, borderWidth: 1.5, borderColor: '#0E6F6A', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, borderStyle: 'dashed' },
    mapNewText: { color: '#0E6F6A', fontSize: 15, fontWeight: '700' },
    plotCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12, marginBottom: 8, borderWidth: 1.5 },
    plotMapThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#1a3a2a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
    radioOuterSelected: { borderColor: '#0E6F6A' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0E6F6A' },
});

import React, { useState, useEffect } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Switch, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CustomBackNavBar from '../../../components/ui/CustomBackNavBar';
import { registrationState } from '../../../services/registrationState';
import { draftService } from '../../../services/draftService';
import SaveDraftModal, { SaveDraftInfo } from '../../../components/ui/SaveDraftModal';

const WATER_SOURCES = ['Borehole / Deep Well', 'Pipe-Borne Water', 'Protected Well', 'River / Stream', 'Rainwater Harvesting'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MEAL_FREQUENCIES = ['3 Meals / Day', '2 Meals / Day', '1 Meal / Day'];

export default function FarmerQuestionnaireScreen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const params = useLocalSearchParams();
    const savedData = registrationState.getData();
    const [savedDraftInfo, setSavedDraftInfo] = useState<SaveDraftInfo | null>(null);

    // Form State (Section C, D, E)
    const [householdSize, setHouseholdSize] = useState(savedData.householdSize || '');
    const [dependantsCount, setDependantsCount] = useState(savedData.dependantsCount || '');
    const [schoolingChildren, setSchoolingChildren] = useState(savedData.schoolingChildren || '');

    const [waterSource, setWaterSource] = useState(savedData.waterSource || '');
    const [waterTreatment, setWaterTreatment] = useState(savedData.waterTreatment || '');
    const [mealFrequency, setMealFrequency] = useState(savedData.mealFrequency || '');
    const [shortageMonths, setShortageMonths] = useState<string[]>(savedData.shortageMonths || []);

    const [securityThreat, setSecurityThreat] = useState(savedData.securityThreat ?? false);
    const [conflictLevel, setConflictLevel] = useState(savedData.conflictLevel || '');

    // Re-sync with registrationState whenever resumed or navigation params change
    useEffect(() => {
        const data = registrationState.getData();
        setHouseholdSize(data.householdSize || '');
        setDependantsCount(data.dependantsCount || '');
        setSchoolingChildren(data.schoolingChildren || '');
        setWaterSource(data.waterSource || '');
        setWaterTreatment(data.waterTreatment || '');
        setMealFrequency(data.mealFrequency || '');
        setShortageMonths(data.shortageMonths || []);
        setSecurityThreat(data.securityThreat ?? false);
        setConflictLevel(data.conflictLevel || '');
    }, [params?.isNew, params?.isResume, params?.draftId, params?.ts]);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const toggleMonth = (m: string) => {
        if (shortageMonths.includes(m)) {
            setShortageMonths(shortageMonths.filter(x => x !== m));
        } else {
            setShortageMonths([...shortageMonths, m]);
        }
    };

    const handleProceed = () => {
        registrationState.updateData({
            householdSize,
            dependantsCount,
            schoolingChildren,
            waterSource,
            waterTreatment,
            mealFrequency,
            shortageMonths,
            securityThreat,
            conflictLevel,
        });
        setShowSuccessModal(true);
    };

    const handleSaveDraft = async () => {
        try {
            const draft = await draftService.saveCurrentDraft(
                '/(agent)/register-farmer/questionnaire',
                4,
                'Household & Food Security',
                {
                    householdSize,
                    dependantsCount,
                    schoolingChildren,
                    waterSource,
                    waterTreatment,
                    mealFrequency,
                    shortageMonths,
                    securityThreat,
                    conflictLevel,
                }
            );
            setSavedDraftInfo({
                farmerName: draft.farmerName,
                stepNumber: 4,
                stepTitle: 'Household & Food Security',
            });
        } catch (err) {
            Alert.alert('Error', 'Failed to save draft. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <CustomBackNavBar
                title="Register New Farmer"
                onBackPress={() => {
                    if (navigation?.canGoBack && navigation.canGoBack()) {
                        navigation.goBack();
                    } else if (router.canGoBack()) {
                        router.back();
                    } else if (navigation?.navigate) {
                        navigation.navigate('register-farmer/farm-details');
                    } else {
                        router.navigate('/(agent)/register-farmer/farm-details' as any);
                    }
                }}
                onSaveDraft={handleSaveDraft}
                textColor="#0A0C11"
                backButtonBackgroundColor="white"
                iconColor="#0A0C11"
                backgroundColor="rgba(255,255,255,0.2)"
                blurIntensity={20}
            />

            <View style={styles.contentContainer}>
                {/* Progress Circle Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.progressCircle}>
                        <Svg width="40" height="40" viewBox="0 0 40 40" style={StyleSheet.absoluteFill}>
                            <Circle cx="20" cy="20" r="18" fill="transparent" stroke="#E5E7EB" strokeWidth="3" />
                            <Circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="transparent"
                                stroke="#0E6F6A"
                                strokeWidth="3"
                                strokeDasharray={2 * Math.PI * 18}
                                strokeDashoffset={2 * Math.PI * 18 * (1 - 0.80)} // 80% Step 4
                                strokeLinecap="round"
                                rotation="-90"
                                origin="20, 20"
                            />
                        </Svg>
                        <Text style={styles.progressText}>80%</Text>
                    </View>
                    <View>
                        <Text style={styles.stepLabel}>Step 4 of 5 • Section C, D & E</Text>
                        <Text style={styles.stepTitle}>Household & Food Security Survey</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
                    <Image source={require('../../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

                    {/* Section 1: Household Demographics (Section C) */}
                    <View style={styles.cardBox}>
                        <View style={styles.cardBoxHeader}>
                            <Ionicons name="people-outline" size={20} color="#0E6F6A" />
                            <Text style={styles.cardBoxTitle}>Household Demographics (Section C)</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Total Household Size (Number of members)</Text>
                            <TextInput
                                style={styles.input}
                                value={householdSize}
                                onChangeText={setHouseholdSize}
                                placeholder="e.g. 6"
                                placeholderTextColor="#A0AEC0"
                                keyboardType="number-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Number of Dependants</Text>
                            <TextInput
                                style={styles.input}
                                value={dependantsCount}
                                onChangeText={setDependantsCount}
                                placeholder="e.g. 4"
                                placeholderTextColor="#A0AEC0"
                                keyboardType="number-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Schooling Children Count</Text>
                            <TextInput
                                style={styles.input}
                                value={schoolingChildren}
                                onChangeText={setSchoolingChildren}
                                placeholder="e.g. 3"
                                placeholderTextColor="#A0AEC0"
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    {/* Section 2: Household Water & Food Security (Section D) */}
                    <View style={styles.cardBox}>
                        <View style={styles.cardBoxHeader}>
                            <Ionicons name="water-outline" size={20} color="#0E6F6A" />
                            <Text style={styles.cardBoxTitle}>Water & Food Security (Section D)</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Primary Drinking Water Source</Text>
                            <View style={styles.optionWrap}>
                                {WATER_SOURCES.map((w) => (
                                    <TouchableOpacity
                                        key={w}
                                        style={[styles.chipPill, waterSource === w && styles.chipPillActive]}
                                        onPress={() => setWaterSource(w)}
                                    >
                                        <Text style={[styles.chipText, waterSource === w && styles.chipTextActive]}>{w}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Water Treatment Method</Text>
                            <View style={styles.optionWrap}>
                                {['Boiling', 'Chlorination / Filtration', 'None'].map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.chipPill, waterTreatment === m && styles.chipPillActive]}
                                        onPress={() => setWaterTreatment(m)}
                                    >
                                        <Text style={[styles.chipText, waterTreatment === m && styles.chipTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Average Meal Frequency</Text>
                            <View style={styles.optionWrap}>
                                {MEAL_FREQUENCIES.map((mf) => (
                                    <TouchableOpacity
                                        key={mf}
                                        style={[styles.chipPill, mealFrequency === mf && styles.chipPillActive]}
                                        onPress={() => setMealFrequency(mf)}
                                    >
                                        <Text style={[styles.chipText, mealFrequency === mf && styles.chipTextActive]}>{mf}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Food Shortage Months (Lean Season)</Text>
                            <View style={styles.optionWrap}>
                                {MONTHS.map((m) => {
                                    const selected = shortageMonths.includes(m);
                                    return (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.chipPill, selected && styles.chipPillActive]}
                                            onPress={() => toggleMonth(m)}
                                        >
                                            <Text style={[styles.chipText, selected && styles.chipTextActive]}>{m}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    {/* Section 3: Security & Conflict Assessment (Section E) */}
                    <View style={styles.cardBox}>
                        <View style={styles.cardBoxHeader}>
                            <Ionicons name="shield-outline" size={20} color="#0E6F6A" />
                            <Text style={styles.cardBoxTitle}>Security Threat & Conflict (Section E)</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.rowJustify}>
                                <Text style={styles.label}>Experienced Security Threat in Area?</Text>
                                <Switch
                                    value={securityThreat}
                                    onValueChange={setSecurityThreat}
                                    trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Farmer-Herder Conflict Experience</Text>
                            <View style={styles.optionWrap}>
                                {['None', 'Mild Disruptions', 'Severe Encroachment', 'Displaced'].map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.chipPill, conflictLevel === c && styles.chipPillActive]}
                                        onPress={() => setConflictLevel(c)}
                                    >
                                        <Text style={[styles.chipText, conflictLevel === c && styles.chipTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleProceed}
                    >
                        <Text style={styles.continueButtonText}>Save & Proceed to Step 5 (Livestock & Enumeration)</Text>
                        <Feather name="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.successIconCircle}>
                                <Feather name="check" size={24} color="white" />
                            </View>
                            <Text style={styles.modalTitle}>Step 4 Complete</Text>
                        </View>

                        <View style={styles.completionContainer}>
                            <Text style={styles.completionText}>Household & Security Survey Saved (80%)</Text>
                            <View style={styles.completionBarBackground}>
                                <View style={[styles.completionBarFill, { width: '80%' }]} />
                            </View>
                        </View>

                        <View style={styles.modalDivider} />

                        <View style={styles.nextStepContainer}>
                            <Text style={styles.nextStepLabel}>Final Step:</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="grid-outline" size={16} color="#0E6F6A" />
                                <Text style={styles.nextStepTitle}>Step 5: Livestock, Poultry & Aquaculture Activity</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.startNowButton} 
                            onPress={() => {
                                setShowSuccessModal(false);
                                if (navigation?.navigate) {
                                    navigation.navigate('register-farmer/documents');
                                } else {
                                    router.navigate('/(agent)/register-farmer/documents' as any);
                                }
                            }}
                        >
                            <Text style={styles.startNowText}>Proceed to Step 5 Enumeration</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <SaveDraftModal
                visible={Boolean(savedDraftInfo)}
                draftInfo={savedDraftInfo}
                onKeepEditing={() => setSavedDraftInfo(null)}
                onViewDrafts={() => {
                    setSavedDraftInfo(null);
                    if (navigation?.navigate) {
                        navigation.navigate('drafts');
                    } else {
                        router.navigate('/(agent)/drafts' as any);
                    }
                }}
                onExit={() => {
                    setSavedDraftInfo(null);
                    if (navigation?.navigate) {
                        navigation.navigate('farmers');
                    } else {
                        router.navigate('/(agent)/farmers' as any);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    contentContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 20,
    },
    headerContainer: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressCircle: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0A0C11',
    },
    stepLabel: {
        fontSize: 12,
        color: '#5B616D',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A0C11',
    },
    formContainer: {
        borderRadius: 16,
        padding: 16,
        gap: 16,
        overflow: 'hidden',
    },
    cardBox: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    cardBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardBoxTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
    },
    rowJustify: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chipPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
    },
    chipPillActive: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#334155',
    },
    chipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    continueButton: {
        height: 50,
        backgroundColor: '#0E6F6A',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    continueButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    successIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0A0C11',
    },
    completionContainer: {
        width: '100%',
        marginBottom: 24,
    },
    completionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0E6F6A',
        marginBottom: 8,
        textAlign: 'center',
    },
    completionBarBackground: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        width: '100%',
    },
    completionBarFill: {
        height: 8,
        backgroundColor: '#0E6F6A',
        borderRadius: 4,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        width: '100%',
        marginBottom: 20,
    },
    nextStepContainer: {
        width: '100%',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    nextStepLabel: {
        fontSize: 14,
        color: '#5B616D',
        marginBottom: 4,
    },
    nextStepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    startNowButton: {
        width: '100%',
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startNowText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

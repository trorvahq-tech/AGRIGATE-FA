import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

type AssessmentType = 'vcm_ps04' | 'vcm_ms04' | 'crop_health' | 'agroforestry' | 'soil' | null;

export default function AssessFarmScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const params = useLocalSearchParams();
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType>('vcm_ps04');

    // SCL PS-04 Fields
    const [farmerStatus, setFarmerStatus] = useState<string | null>('Active & Participating');
    const [farmAccessibility, setFarmAccessibility] = useState<string | null>('Accessible');
    const [securityIssue, setSecurityIssue] = useState<string | null>('No Security Issue');
    const [approxArea, setApproxArea] = useState('2.5');
    const [gpsCoordinates, setGpsCoordinates] = useState('8.4902° N, 4.5421° E');

    // SCL MS-04 Fields
    const [cropConditionRating, setCropConditionRating] = useState<string | null>('Good');
    const [mainRiskObserved, setMainRiskObserved] = useState<string | null>('None');
    const [riskSeverity, setRiskSeverity] = useState<string | null>('Low');
    const [areaAffected, setAreaAffected] = useState('0.0');
    const [escalationNeeded, setEscalationNeeded] = useState<string | null>('No');

    // General Assessment fields
    const [cropCondition, setCropCondition] = useState<string | null>(null);
    const [pestObserved, setPestObserved] = useState<string | null>(null);
    const [observedIssue, setObservedIssue] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [healthEvidence, setHealthEvidence] = useState<string | null>(null);

    const [treePresent, setTreePresent] = useState<string | null>(null);
    const [treeDensity, setTreeDensity] = useState<string | null>(null);
    const [agroNotes, setAgroNotes] = useState('');
    const [agroEvidence, setAgroEvidence] = useState<string | null>(null);

    const [soilTexture, setSoilTexture] = useState<string | null>(null);
    const [soilMoisture, setSoilMoisture] = useState<string | null>(null);
    const [soilObservation, setSoilObservation] = useState('');

    const assessmentOptions = [
        { id: 'vcm_ps04', label: 'PS-04 Farm Location & Status (5 pts)' },
        { id: 'vcm_ms04', label: 'MS-04 Crop Condition & Risk (7 pts)' },
        { id: 'crop_health', label: 'General Crop Health' },
        { id: 'agroforestry', label: 'Agroforestry Assessment' },
        { id: 'soil', label: 'Soil Assessment' },
    ];

    const pickImage = async (setFunction: (uri: string | null) => void) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setFunction(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        const assessmentPayload = {
            type: selectedAssessment,
            farmerStatus,
            farmAccessibility,
            securityIssue,
            approxArea,
            gpsCoordinates,
            cropConditionRating,
            mainRiskObserved,
            riskSeverity,
            areaAffected,
            escalationNeeded,
            cropCondition,
            pestObserved,
            observedIssue,
            recommendations,
            healthEvidence,
            treePresent,
            treeDensity,
            agroNotes,
            agroEvidence,
            soilTexture,
            soilMoisture,
            soilObservation,
            assessedAt: new Date().toISOString(),
        };

        try {
            const farmId = (params.farmId as string) || 'farm-1';
            const key = `@farm_assessment_${farmId}`;
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem(key, JSON.stringify(assessmentPayload));

            const { syncService } = require('../../services/syncService');
            await syncService.enqueueMutation({
                type: 'RECORD_FARM_ASSESSMENT',
                description: `Farm Assessment (${selectedAssessment?.toUpperCase() || 'VCM'})`,
                payload: {
                    farmId,
                    assessment: assessmentPayload,
                }
            });
        } catch (e) {
            console.warn('Error saving assessment locally:', e);
        }

        Alert.alert('Assessment Recorded', 'SCL Assessment verification saved to local storage and queued for sync.', [
            { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.push('/(agent)/farmerDetails') },
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={isDarkMode ? 'light' : 'dark'} hidden={false} />

            <CustomBackNavBar title="Assess Farm (SCL VCM Spec)" onBackPress={() => router.back()} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.subplotCard, { backgroundColor: colors.card, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                        <View style={styles.subplotHeader}>
                            <Text style={[styles.subplotName, { color: colors.text }]}>Plot #VCM-PLOT-04</Text>
                            <Text style={[styles.subplotSize, { color: colors.text }]}>2.5 ha</Text>
                        </View>
                        <Text style={[styles.subplotMeta, { color: colors.textMuted }]}>Farmer: Ibrahim Musa (MTG-02)</Text>
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Assessment Type</Text>

                    <View style={[styles.whiteContainer, { backgroundColor: colors.card }]}>
                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                            <View className="px-1 !flex !flex-col !gap-2">
                                {assessmentOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={styles.radioRowVertical}
                                        onPress={() => setSelectedAssessment(option.id as AssessmentType)}
                                    >
                                        <View style={[styles.radioOuter, selectedAssessment === option.id && styles.radioOuterSelected, { borderColor: selectedAssessment === option.id ? '#0E6F6A' : colors.textMuted }]}>
                                            {selectedAssessment === option.id && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={[styles.radioLabel, { color: colors.text, fontWeight: selectedAssessment === option.id ? '700' : '500' }]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* SCL PS-04 Form */}
                        {selectedAssessment === 'vcm_ps04' && (
                            <View style={styles.formSection}>
                                <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>PS-04: Location & Status Verification (5 Points)</Text>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Farm Status & Farmer Participation</Text>
                                    {['Active & Participating', 'Temporarily Inactive', 'Withdrawn'].map((opt) => (
                                        <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setFarmerStatus(opt)}>
                                            <View style={[styles.checkboxOuter, farmerStatus === opt && styles.checkboxOuterSelected, { borderColor: colors.primary }]}>
                                                {farmerStatus === opt && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Farm Accessibility</Text>
                                    {['Accessible', 'Difficult Terrain', 'Inaccessible'].map((opt) => (
                                        <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setFarmAccessibility(opt)}>
                                            <View style={[styles.checkboxOuter, farmAccessibility === opt && styles.checkboxOuterSelected, { borderColor: colors.primary }]}>
                                                {farmAccessibility === opt && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>GPS Verification Point</Text>
                                    <Text style={[styles.gpsText, { color: '#10B981' }]}>Locked: {gpsCoordinates}</Text>
                                </View>
                            </View>
                        )}

                        {/* SCL MS-04 Form */}
                        {selectedAssessment === 'vcm_ms04' && (
                            <View style={styles.formSection}>
                                <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>MS-04: Crop Condition & Early Warning Risk (7 Points)</Text>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Crop Condition Rating</Text>
                                    {['Excellent', 'Good', 'Fair', 'Critical Risk'].map((opt) => (
                                        <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setCropConditionRating(opt)}>
                                            <View style={[styles.checkboxOuter, cropConditionRating === opt && styles.checkboxOuterSelected, { borderColor: colors.primary }]}>
                                                {cropConditionRating === opt && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Main Risk Observed</Text>
                                    {['None', 'Pests & Diseases', 'Drought', 'Flood', 'Livestock Damage', 'Security Issue'].map((opt) => (
                                        <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setMainRiskObserved(opt)}>
                                            <View style={[styles.checkboxOuter, mainRiskObserved === opt && styles.checkboxOuterSelected, { borderColor: colors.primary }]}>
                                                {mainRiskObserved === opt && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Supervisor Escalation Needed?</Text>
                                    {['No', 'Yes - Immediate Action Needed'].map((opt) => (
                                        <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setEscalationNeeded(opt)}>
                                            <View style={[styles.checkboxOuter, escalationNeeded === opt && styles.checkboxOuterSelected, { borderColor: colors.primary }]}>
                                                {escalationNeeded === opt && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* General Crop Health */}
                        {selectedAssessment === 'crop_health' && (
                            <View style={styles.formSection}>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Overall crop condition</Text>
                                    {['Excellent', 'Good', 'Poor'].map((opt) => (
                                        <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setCropCondition(opt)}>
                                            <View style={[styles.checkboxOuter, cropCondition === opt && styles.checkboxOuterSelected, { borderColor: colors.primary }]}>
                                                {cropCondition === opt && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Save Button */}
                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Assessment</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
                </KeyboardAvoidingView>
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
        marginTop: 155, // Clear absolute CustomBackNavBar
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    subplotCard: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    subplotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    subplotName: {
        fontSize: 16,
        fontWeight: '700',
    },
    subplotSize: {
        fontSize: 14,
        fontWeight: '600',
    },
    subplotMeta: {
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },
    whiteContainer: {
        borderRadius: 16,
        padding: 16,
    },
    formSection: {
        marginTop: 10,
    },
    innerContainer: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    gpsText: {
        fontSize: 13,
        fontWeight: '700',
    },
    radioRowVertical: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#0E6F6A',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0E6F6A',
    },
    checkboxOuter: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxOuterSelected: {
        borderColor: '#0E6F6A',
    },
    checkboxInner: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: '#0E6F6A',
    },
    radioLabel: {
        fontSize: 14,
    },
    saveButton: {
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
});

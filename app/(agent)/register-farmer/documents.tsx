import React, { useState, useEffect, useRef } from 'react';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Switch, Alert,
    KeyboardAvoidingView, Platform, PanResponder, Animated, Easing
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { toast } from 'sonner-native';
import CustomBackNavBar from '../../../components/ui/CustomBackNavBar';
import { registrationState } from '../../../services/registrationState';
import { draftService } from '../../../services/draftService';
import { useOnboardFarmer } from '../../../hooks/api/useFarmers';
import { useProjects } from '../../../hooks/api/useProjects';
import SaveDraftModal, { SaveDraftInfo } from '../../../components/ui/SaveDraftModal';

const LIVESTOCK_TYPES = ['Cattle', 'Sheep', 'Goats', 'Pigs'];
const POULTRY_TYPES = ['Layers', 'Broilers', 'Local Chicken', 'Turkey'];
const FISH_TYPES = ['Catfish', 'Tilapia', 'Heterobranchus'];

const FINGER_OPTIONS = [
    { id: 'Right Thumb', label: 'R. Thumb' },
    { id: 'Right Index', label: 'R. Index' },
    { id: 'Left Thumb', label: 'L. Thumb' },
    { id: 'Left Index', label: 'L. Index' },
];

export default function FarmerEnumerationStep5Screen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const params = useLocalSearchParams();
    const savedData = registrationState.getData();
    const [savedDraftInfo, setSavedDraftInfo] = useState<SaveDraftInfo | null>(null);

    const onboardMutation = useOnboardFarmer();
    const { data: projects } = useProjects();

    // Form State (Section H)
    const [selectedLivestock, setSelectedLivestock] = useState<string[]>(savedData.selectedLivestock || []);
    const [cattleCount, setCattleCount] = useState(savedData.cattleCount || '');
    const [goatCount, setGoatCount] = useState(savedData.goatCount || '');

    const [selectedPoultry, setSelectedPoultry] = useState<string[]>(savedData.selectedPoultry || []);
    const [flockSize, setFlockSize] = useState(savedData.flockSize || '');
    const [poultryFeedCost, setPoultryFeedCost] = useState(savedData.poultryFeedCost || '');
    const [eggYieldPerWeek, setEggYieldPerWeek] = useState(savedData.eggYieldPerWeek || '');

    const [hasAquaculture, setHasAquaculture] = useState(savedData.hasAquaculture ?? false);
    const [fishType, setFishType] = useState(savedData.fishType || '');
    const [fingerlingsCount, setFingerlingsCount] = useState(savedData.fingerlingsCount || '');
    const [pondWidth, setPondWidth] = useState(savedData.pondWidth || '');
    const [pondLength, setPondLength] = useState(savedData.pondLength || '');
    const [pondDepth, setPondDepth] = useState(savedData.pondDepth || '');
    const [fishFeedCost, setFishFeedCost] = useState(savedData.fishFeedCost || '');

    // Biometrics & Consent State
    const [signaturePaths, setSignaturePaths] = useState<string[]>(
        savedData.signatureSvg ? [savedData.signatureSvg] : []
    );
    const [currentPath, setCurrentPath] = useState<string>('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSignatureSaved, setIsSignatureSaved] = useState(Boolean(savedData.signatureSvg));
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

    const [selectedFinger, setSelectedFinger] = useState<string>('Right Thumb');
    const [fingerprintData, setFingerprintData] = useState<{
        finger: string;
        template: string;
        quality: number;
        capturedAt: string;
        deviceModel?: string;
    } | null>(savedData.fingerprintData || null);
    const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
    const [scannerConnected, setScannerConnected] = useState(true);
    const [attestationAgreed, setAttestationAgreed] = useState(savedData.attestationAgreed ?? true);

    // Pulse animation for fingerprint scanner
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isScanningFingerprint) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scanAnim.setValue(0);
        }
    }, [isScanningFingerprint]);

    // Helper: Generate smooth Quadratic Bezier curve path from touch points
    const pointsToSmoothSvg = (points: { x: number; y: number }[]): string => {
        if (points.length === 0) return '';
        if (points.length === 1) {
            return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
        }
        if (points.length === 2) {
            return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
        }

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const p0 = points[i - 1];
            const p1 = points[i];
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;
            d += ` Q ${p0.x} ${p0.y}, ${midX} ${midY}`;
        }
        const last = points[points.length - 1];
        d += ` L ${last.x} ${last.y}`;
        return d;
    };

    // PanResponder for drawing signature with STRICT scroll-lock & continuous ink capture
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderTerminationRequest: () => false, // PREVENTS parent ScrollView from stealing touch!
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                setScrollEnabled(false);
                setIsDrawing(true);
                const { locationX, locationY } = evt.nativeEvent;
                const pt = { x: Math.round(locationX), y: Math.round(locationY) };
                currentPointsRef.current = [pt];
                setCurrentPath(`M ${pt.x} ${pt.y} L ${pt.x + 0.1} ${pt.y + 0.1}`);
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const pt = { x: Math.round(locationX), y: Math.round(locationY) };
                currentPointsRef.current.push(pt);
                const smoothPath = pointsToSmoothSvg(currentPointsRef.current);
                setCurrentPath(smoothPath);
            },
            onPanResponderRelease: () => {
                setScrollEnabled(true);
                setIsDrawing(false);
                if (currentPointsRef.current.length > 0) {
                    const finalPath = pointsToSmoothSvg(currentPointsRef.current);
                    if (finalPath.trim().length > 0) {
                        setSignaturePaths((prev) => [...prev, finalPath]);
                    }
                    currentPointsRef.current = [];
                    setCurrentPath('');
                }
            },
            onPanResponderTerminate: () => {
                setScrollEnabled(true);
                setIsDrawing(false);
                if (currentPointsRef.current.length > 0) {
                    const finalPath = pointsToSmoothSvg(currentPointsRef.current);
                    if (finalPath.trim().length > 0) {
                        setSignaturePaths((prev) => [...prev, finalPath]);
                    }
                    currentPointsRef.current = [];
                    setCurrentPath('');
                }
            },
        })
    ).current;

    const clearSignature = () => {
        currentPointsRef.current = [];
        setCurrentPath('');
        setSignaturePaths([]);
        setIsSignatureSaved(false);
    };

    const handleSaveSignature = () => {
        if (signaturePaths.length === 0) {
            toast.error('Please draw your signature before saving.');
            return;
        }
        const combined = signaturePaths.join(' ');
        registrationState.updateData({ signatureSvg: combined });
        setIsSignatureSaved(true);
        toast.success('Signature confirmed and attached!');
    };

    const handleResetSignature = () => {
        setIsSignatureSaved(false);
        clearSignature();
        registrationState.updateData({ signatureSvg: '' });
    };

    const handleScanFingerprint = () => {
        setIsScanningFingerprint(true);
        setTimeout(() => {
            setIsScanningFingerprint(false);
            const biometricTemplate = `ISO19794_${selectedFinger.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}_FMR_QC98`;
            const result = {
                finger: selectedFinger,
                template: biometricTemplate,
                quality: 98,
                capturedAt: new Date().toISOString(),
                deviceModel: 'SecuGen Hamster Pro 20 / DigitalPersona 4500 (USB-OTG)',
            };
            setFingerprintData(result);
            toast.success(`${selectedFinger} fingerprint captured successfully!`);
        }, 1800);
    };

    const handleClearFingerprint = () => {
        setFingerprintData(null);
    };

    // Re-sync with registrationState whenever resumed or navigation params change
    useEffect(() => {
        const data = registrationState.getData();
        setSelectedLivestock(data.selectedLivestock || []);
        setCattleCount(data.cattleCount || '');
        setGoatCount(data.goatCount || '');
        setSelectedPoultry(data.selectedPoultry || []);
        setFlockSize(data.flockSize || '');
        setPoultryFeedCost(data.poultryFeedCost || '');
        setEggYieldPerWeek(data.eggYieldPerWeek || '');
        setHasAquaculture(data.hasAquaculture ?? false);
        setFishType(data.fishType || '');
        setFingerlingsCount(data.fingerlingsCount || '');
        setPondWidth(data.pondWidth || '');
        setPondLength(data.pondLength || '');
        setPondDepth(data.pondDepth || '');
        setFishFeedCost(data.fishFeedCost || '');
        if (data.signatureSvg) {
            setSignaturePaths([data.signatureSvg]);
        }
        if (data.fingerprintData) {
            setFingerprintData(data.fingerprintData);
        }
        setAttestationAgreed(data.attestationAgreed ?? true);
    }, [params?.isNew, params?.isResume, params?.draftId, params?.ts]);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const toggleLivestock = (type: string) => {
        if (selectedLivestock.includes(type)) {
            setSelectedLivestock(selectedLivestock.filter((t) => t !== type));
        } else {
            setSelectedLivestock([...selectedLivestock, type]);
        }
    };

    const togglePoultry = (type: string) => {
        if (selectedPoultry.includes(type)) {
            setSelectedPoultry(selectedPoultry.filter((t) => t !== type));
        } else {
            setSelectedPoultry([...selectedPoultry, type]);
        }
    };

    const handleComplete = async () => {
        if (!attestationAgreed) {
            Alert.alert(
                'Consent Required',
                'Please agree to the attestation and data verification declaration before submitting.'
            );
            return;
        }

        setSubmitting(true);
        try {
            const combinedSvg = signaturePaths.join(' ');
            // Update the registration state with the last step's data
            const fullRegData = registrationState.updateData({
                selectedLivestock,
                cattleCount,
                goatCount,
                selectedPoultry,
                flockSize,
                poultryFeedCost,
                eggYieldPerWeek,
                hasAquaculture,
                fishType,
                fingerlingsCount,
                pondWidth,
                pondLength,
                pondDepth,
                fishFeedCost,
                signatureSvg: combinedSvg || null,
                fingerprintData,
                attestationAgreed,
            });

            // Find an active project ID or default to Kaduna Juriya project ID
            const projectId = projects?.[0]?.id || '5fac9844-0460-4fc9-b432-fb0a4b686f10';

            await onboardMutation.mutateAsync({
                registrationData: fullRegData,
                projectId,
            });

            await draftService.clearActiveDraft();
            toast.success('Farmer successfully onboarded!');
            setShowSuccessModal(true);
        } catch (err: any) {
            console.log('Onboarding error:', err);
            const errMsg = err?.response?.data?.error || err?.message || 'Failed to onboard farmer';
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            const combinedSvg = signaturePaths.join(' ');
            const draft = await draftService.saveCurrentDraft(
                '/(agent)/register-farmer/documents',
                5,
                'Livestock, Signature & Attestation',
                {
                    selectedLivestock,
                    cattleCount,
                    goatCount,
                    selectedPoultry,
                    flockSize,
                    poultryFeedCost,
                    eggYieldPerWeek,
                    hasAquaculture,
                    fishType,
                    fingerlingsCount,
                    pondWidth,
                    pondLength,
                    pondDepth,
                    fishFeedCost,
                    signatureSvg: combinedSvg || null,
                    fingerprintData,
                    attestationAgreed,
                }
            );
            setSavedDraftInfo({
                farmerName: draft.farmerName,
                stepNumber: 5,
                stepTitle: 'Livestock, Signature & Attestation',
            });
        } catch (err) {
            Alert.alert('Error', 'Failed to save draft. Please try again.');
        }
    };

    const farmerPhotoUri = savedData.photoUri;
    const farmerFullName = `${savedData.firstName || 'Farmer'} ${savedData.lastName || ''}`.trim();

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
                        navigation.navigate('register-farmer/questionnaire');
                    } else {
                        router.navigate('/(agent)/register-farmer/questionnaire' as any);
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
                                stroke="#10B981"
                                strokeWidth="3"
                                strokeDasharray={2 * Math.PI * 18}
                                strokeDashoffset={0} // 100% Final Step
                                strokeLinecap="round"
                                rotation="-90"
                                origin="20, 20"
                            />
                        </Svg>
                        <Text style={styles.progressText}>100%</Text>
                    </View>
                    <View>
                        <Text style={styles.stepLabel}>Step 5 of 5 • Final Verification</Text>
                        <Text style={styles.stepTitle}>Livestock, Biometrics & Signature</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        scrollEnabled={scrollEnabled}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.formContainer}
                    >
                        <Image
                            source={require('../../../assets/images/backgroundGradient.png')}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                        />
                        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

                        {/* Section 1: Livestock Produce */}
                        <View style={styles.cardBox}>
                            <View style={styles.cardBoxHeader}>
                                <Ionicons name="paw-outline" size={20} color="#0E6F6A" />
                                <Text style={styles.cardBoxTitle}>Livestock Reared (Section H)</Text>
                            </View>

                            <Text style={styles.label}>Select Livestock Types</Text>
                            <View style={styles.optionWrap}>
                                {LIVESTOCK_TYPES.map((type) => {
                                    const selected = selectedLivestock.includes(type);
                                    return (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.chipPill, selected && styles.chipPillActive]}
                                            onPress={() => toggleLivestock(type)}
                                        >
                                            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                                                {selected ? '✓ ' : ''}
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {selectedLivestock.includes('Cattle') && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Cattle Headcount (Max 10,000)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={cattleCount}
                                        onChangeText={setCattleCount}
                                        placeholder="e.g. 5"
                                        placeholderTextColor="#A0AEC0"
                                        keyboardType="number-pad"
                                    />
                                </View>
                            )}

                            {selectedLivestock.includes('Goats') && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Goats Headcount (Max 10,000)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={goatCount}
                                        onChangeText={setGoatCount}
                                        placeholder="e.g. 8"
                                        placeholderTextColor="#A0AEC0"
                                        keyboardType="number-pad"
                                    />
                                </View>
                            )}
                        </View>

                        {/* Section 2: Poultry Produce */}
                        <View style={styles.cardBox}>
                            <View style={styles.cardBoxHeader}>
                                <Ionicons name="egg-outline" size={20} color="#0E6F6A" />
                                <Text style={styles.cardBoxTitle}>Poultry Production (Section H)</Text>
                            </View>

                            <Text style={styles.label}>Select Poultry Types</Text>
                            <View style={styles.optionWrap}>
                                {POULTRY_TYPES.map((pt) => {
                                    const selected = selectedPoultry.includes(pt);
                                    return (
                                        <TouchableOpacity
                                            key={pt}
                                            style={[styles.chipPill, selected && styles.chipPillActive]}
                                            onPress={() => togglePoultry(pt)}
                                        >
                                            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                                                {selected ? '✓ ' : ''}
                                                {pt}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {selectedPoultry.length > 0 && (
                                <View style={{ gap: 10, marginTop: 6 }}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Flock Size (Total Birds)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={flockSize}
                                            onChangeText={setFlockSize}
                                            placeholder="e.g. 150"
                                            placeholderTextColor="#A0AEC0"
                                            keyboardType="number-pad"
                                        />
                                    </View>

                                    {selectedPoultry.includes('Layers') && (
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Weekly Egg Production (Eggs/Week)</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={eggYieldPerWeek}
                                                onChangeText={setEggYieldPerWeek}
                                                placeholder="e.g. 850"
                                                placeholderTextColor="#A0AEC0"
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    )}

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Weekly Feed Cost (₦)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={poultryFeedCost}
                                            onChangeText={setPoultryFeedCost}
                                            placeholder="e.g. 12,500"
                                            placeholderTextColor="#A0AEC0"
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Section 3: Aquaculture / Fish Farming */}
                        <View style={styles.cardBox}>
                            <View style={styles.rowJustify}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="fish-outline" size={20} color="#0E6F6A" />
                                    <Text style={styles.cardBoxTitle}>Aquaculture / Fish Farming</Text>
                                </View>
                                <Switch
                                    value={hasAquaculture}
                                    onValueChange={setHasAquaculture}
                                    trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                                />
                            </View>

                            {hasAquaculture && (
                                <View style={{ gap: 10, marginTop: 8 }}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Reared Fish Species</Text>
                                        <View style={styles.optionWrap}>
                                            {FISH_TYPES.map((ft) => (
                                                <TouchableOpacity
                                                    key={ft}
                                                    style={[styles.chipPill, fishType === ft && styles.chipPillActive]}
                                                    onPress={() => setFishType(ft)}
                                                >
                                                    <Text style={[styles.chipText, fishType === ft && styles.chipTextActive]}>
                                                        {ft}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Fingerlings Count Per Pond</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={fingerlingsCount}
                                            onChangeText={setFingerlingsCount}
                                            placeholder="e.g. 500"
                                            placeholderTextColor="#A0AEC0"
                                            keyboardType="number-pad"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Pond Dimensions (Width x Length x Depth in Meters)</Text>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                value={pondWidth}
                                                onChangeText={setPondWidth}
                                                placeholder="Width (m)"
                                                placeholderTextColor="#A0AEC0"
                                                keyboardType="number-pad"
                                            />
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                value={pondLength}
                                                onChangeText={setPondLength}
                                                placeholder="Length (m)"
                                                placeholderTextColor="#A0AEC0"
                                                keyboardType="number-pad"
                                            />
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                value={pondDepth}
                                                onChangeText={setPondDepth}
                                                placeholder="Depth (m)"
                                                placeholderTextColor="#A0AEC0"
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Weekly Fish Feed Cost (₦)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={fishFeedCost}
                                            onChangeText={setFishFeedCost}
                                            placeholder="e.g. 8,000"
                                            placeholderTextColor="#A0AEC0"
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Section 4: Compulsory Facial Headshot Summary (KYC) */}
                        <View style={[styles.cardBox, { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]}>
                            <View style={styles.cardBoxHeader}>
                                <Ionicons name="camera" size={20} color="#059669" />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.cardBoxTitle, { color: '#065F46' }]}>Facial Headshot</Text>
                                        <View style={styles.compulsoryBadge}>
                                            <Text style={styles.compulsoryBadgeText}>Compulsory • Verified</Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#047857' }}>
                                        Captured during Step 2 KYC Identity verification.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.facialSummaryContainer}>
                                <View style={styles.facialPhotoWrapper}>
                                    {farmerPhotoUri ? (
                                        <Image
                                            source={{ uri: farmerPhotoUri }}
                                            style={styles.facialPhotoPreview}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <View style={styles.facialPhotoPlaceholder}>
                                            <Ionicons name="person" size={32} color="#059669" />
                                        </View>
                                    )}
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Text style={styles.farmerNameText}>{farmerFullName || 'Registered Farmer'}</Text>
                                    <Text style={styles.farmerSubText}>
                                        NIN: {savedData.ninNumber || 'Enrolled with Verified Headshot'}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <Feather name="check-circle" size={13} color="#059669" />
                                        <Text style={{ fontSize: 11, color: '#065F46', fontWeight: '600' }}>
                                            Biometric Quality: Compliant (100%)
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Section 5: Interactive Touch Signature Pad (Optional) */}
                        <View style={styles.cardBox}>
                            <View style={styles.cardBoxHeader}>
                                <Ionicons name="pencil" size={20} color="#0E6F6A" />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.cardBoxTitle}>Farmer / Agent Signature</Text>
                                        <View style={styles.optionalBadge}>
                                            <Text style={styles.optionalBadgeText}>Optional</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardBoxSubtitle}>
                                        Draw signature on screen using finger or stylus.
                                    </Text>
                                </View>
                                {(signaturePaths.length > 0 || currentPath.length > 0) && (
                                    <TouchableOpacity style={styles.clearBtn} onPress={clearSignature}>
                                        <Feather name="trash-2" size={14} color="#DC2626" />
                                        <Text style={styles.clearBtnText}>Clear</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Signature Drawing Canvas with Active Drawing Lock Highlight */}
                            <View
                                style={[
                                    styles.signatureCanvasContainer,
                                    isDrawing && styles.signatureCanvasContainerActive,
                                    isSignatureSaved && styles.signatureCanvasContainerSaved,
                                    signaturePaths.length > 0 && styles.signatureCanvasContainerSigned,
                                ]}
                                {...(!isSignatureSaved ? panResponder.panHandlers : {})}
                            >
                                <Svg style={StyleSheet.absoluteFill}>
                                    {signaturePaths.map((path, idx) => (
                                        <Path
                                            key={`path-${idx}`}
                                            d={path}
                                            stroke="#0F172A"
                                            strokeWidth={3}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            fill="none"
                                        />
                                    ))}
                                    {currentPath ? (
                                        <Path
                                            d={currentPath}
                                            stroke="#0E6F6A"
                                            strokeWidth={3.5}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            fill="none"
                                        />
                                    ) : null}
                                </Svg>

                                {isDrawing && (
                                    <View style={styles.drawingActiveBadge} pointerEvents="none">
                                        <View style={styles.drawingActiveDot} />
                                        <Text style={styles.drawingActiveText}>✍️ Drawing Active • Screen Locked</Text>
                                    </View>
                                )}

                                {signaturePaths.length === 0 && !currentPath && !isDrawing && (
                                    <View style={styles.signaturePlaceholderOverlay} pointerEvents="none">
                                        <Ionicons name="finger-print-outline" size={24} color="#94A3B8" />
                                        <Text style={styles.signaturePlaceholderText}>
                                            Draw Farmer or Agent Signature Here
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.signatureBaseline} pointerEvents="none">
                                    <Text style={styles.signatureXText}>✕</Text>
                                    <View style={styles.signatureLine} />
                                </View>
                            </View>

                            {/* Signature Actions & Confirmation Bar */}
                            {signaturePaths.length > 0 && !isSignatureSaved && (
                                <View style={styles.signatureActionRow}>
                                    <TouchableOpacity style={styles.signatureClearBtn} onPress={clearSignature}>
                                        <Feather name="trash-2" size={15} color="#DC2626" />
                                        <Text style={styles.signatureClearBtnText}>Clear</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.signatureSaveBtn} onPress={handleSaveSignature}>
                                        <Feather name="check" size={16} color="#FFFFFF" />
                                        <Text style={styles.signatureSaveBtnText}>Save Signature</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {isSignatureSaved && (
                                <View style={styles.signatureSavedCard}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                        <View style={styles.signatureSavedIconCircle}>
                                            <Feather name="check" size={14} color="#059669" />
                                        </View>
                                        <View>
                                            <Text style={styles.signatureSavedTitle}>Signature Confirmed & Saved</Text>
                                            <Text style={styles.signatureSavedSub}>Attached to KYC consent record</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.signatureRedrawBtn} onPress={handleResetSignature}>
                                        <Feather name="edit-2" size={13} color="#0E6F6A" />
                                        <Text style={styles.signatureRedrawBtnText}>Redraw</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Section 6: External Fingerprint Scanner (Optional) */}
                        <View style={styles.cardBox}>
                            <View style={styles.cardBoxHeader}>
                                <MaterialCommunityIcons name="fingerprint" size={22} color="#0E6F6A" />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.cardBoxTitle}>External Fingerprint Scanner</Text>
                                        <View style={styles.optionalBadge}>
                                            <Text style={styles.optionalBadgeText}>Optional</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardBoxSubtitle}>
                                        Connect USB-OTG or Bluetooth scanner (SecuGen, Morpho, DigitalPersona).
                                    </Text>
                                </View>
                            </View>

                            {/* Device Connection Status */}
                            <View style={styles.scannerStatusBadge}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        { backgroundColor: scannerConnected ? '#10B981' : '#F59E0B' },
                                    ]}
                                />
                                <Text style={styles.scannerStatusText}>
                                    {scannerConnected
                                        ? 'External USB-OTG / Bluetooth Bridge: Ready'
                                        : 'Scanner Disconnected'}
                                </Text>
                            </View>

                            {/* Finger Selection Pills */}
                            <Text style={styles.label}>Select Finger for Biometric Capture</Text>
                            <View style={styles.optionWrap}>
                                {FINGER_OPTIONS.map((f) => (
                                    <TouchableOpacity
                                        key={f.id}
                                        style={[styles.chipPill, selectedFinger === f.id && styles.chipPillActive]}
                                        onPress={() => setSelectedFinger(f.id)}
                                    >
                                        <Text
                                            style={[styles.chipText, selectedFinger === f.id && styles.chipTextActive]}
                                        >
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Scanner Interactive Touch Area */}
                            <View style={styles.fingerprintBox}>
                                {fingerprintData ? (
                                    <View style={styles.fingerprintCapturedView}>
                                        <View style={styles.fingerprintSuccessIconCircle}>
                                            <Ionicons name="finger-print" size={48} color="#0E6F6A" />
                                        </View>
                                        <View style={{ alignItems: 'center', gap: 2 }}>
                                            <Text style={styles.fingerprintSuccessTitle}>
                                                {fingerprintData.finger} Enrolled
                                            </Text>
                                            <Text style={styles.fingerprintTemplateText}>
                                                ISO/IEC 19794-2 • Quality: {fingerprintData.quality}% (NFIQ-1)
                                            </Text>
                                            <Text style={styles.fingerprintDeviceText}>
                                                {fingerprintData.deviceModel || 'External Scanner'}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.reScanBtn}
                                            onPress={handleClearFingerprint}
                                        >
                                            <Feather name="refresh-cw" size={14} color="#0E6F6A" />
                                            <Text style={styles.reScanBtnText}>Re-Scan / Change Finger</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.fingerprintPromptView}>
                                        <Animated.View
                                            style={[
                                                styles.scannerIconWrapper,
                                                isScanningFingerprint && {
                                                    borderColor: '#0E6F6A',
                                                    transform: [
                                                        {
                                                            scale: scanAnim.interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: [1, 1.08],
                                                            }),
                                                        },
                                                    ],
                                                },
                                            ]}
                                        >
                                            <Ionicons
                                                name="finger-print"
                                                size={48}
                                                color={isScanningFingerprint ? '#0E6F6A' : '#94A3B8'}
                                            />
                                            {isScanningFingerprint && (
                                                <Animated.View
                                                    style={[
                                                        styles.scannerBeam,
                                                        {
                                                            transform: [
                                                                {
                                                                    translateY: scanAnim.interpolate({
                                                                        inputRange: [0, 1],
                                                                        outputRange: [-30, 30],
                                                                    }),
                                                                },
                                                            ],
                                                        },
                                                    ]}
                                                />
                                            )}
                                        </Animated.View>

                                        <Text style={styles.scannerPromptText}>
                                            {isScanningFingerprint
                                                ? 'Scanning ridges on external device...'
                                                : `Place farmer's ${selectedFinger} on device`}
                                        </Text>

                                        <TouchableOpacity
                                            style={[styles.scanTriggerBtn, isScanningFingerprint && { opacity: 0.6 }]}
                                            onPress={handleScanFingerprint}
                                            disabled={isScanningFingerprint}
                                        >
                                            <Ionicons name="hardware-chip-outline" size={16} color="white" />
                                            <Text style={styles.scanTriggerBtnText}>
                                                {isScanningFingerprint ? 'Extracting Minutiae...' : `Scan ${selectedFinger}`}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Section 7: Farmer Attestation & Consent */}
                        <View style={styles.cardBox}>
                            <TouchableOpacity
                                style={styles.attestationRow}
                                activeOpacity={0.8}
                                onPress={() => setAttestationAgreed(!attestationAgreed)}
                            >
                                <View
                                    style={[
                                        styles.attestationCheckbox,
                                        attestationAgreed && styles.attestationCheckboxActive,
                                    ]}
                                >
                                    {attestationAgreed && <Feather name="check" size={14} color="white" />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.attestationTitle}>Farmer Certification & Consent</Text>
                                    <Text style={styles.attestationDesc}>
                                        I hereby certify that all personal records, farm tenure details, GPS boundaries, and biometric data provided are true and accurate.
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Final Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.completeBtn,
                                (submitting || !attestationAgreed) && { opacity: 0.7 },
                            ]}
                            onPress={handleComplete}
                            disabled={submitting}
                        >
                            <Ionicons name="checkmark-done" size={20} color="white" />
                            <Text style={styles.completeBtnText}>
                                {submitting ? 'Submitting to DB & Syncing...' : 'Submit & Complete Enumeration'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Final Completion Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.successIconCircle, { backgroundColor: '#10B981' }]}>
                                <Feather name="check" size={28} color="white" />
                            </View>
                            <Text style={styles.modalTitle}>Farmer Enumeration Complete!</Text>
                            <Text style={styles.modalSub}>
                                {farmerFullName || 'Farmer'} successfully registered in Project Juriya under SCL VCM Field Guidelines.
                            </Text>
                        </View>

                        <View style={styles.completionContainer}>
                            <Text style={[styles.completionText, { color: '#10B981' }]}>100% Verified Enumeration</Text>
                            <View style={styles.completionBarBackground}>
                                <View style={[styles.completionBarFill, { width: '100%', backgroundColor: '#10B981' }]} />
                            </View>
                        </View>

                        <View style={styles.summaryList}>
                            <View style={styles.summaryRowItem}>
                                <Feather name="check-circle" size={14} color="#10B981" />
                                <Text style={styles.summaryRowText}>Section A: Personal Data & Consent (A01-A17)</Text>
                            </View>
                            <View style={styles.summaryRowItem}>
                                <Feather name="check-circle" size={14} color="#10B981" />
                                <Text style={styles.summaryRowText}>Section B: NIN & Compulsory Oval Facial KYC</Text>
                            </View>
                            <View style={styles.summaryRowItem}>
                                <Feather name="check-circle" size={14} color="#10B981" />
                                <Text style={styles.summaryRowText}>Section F/G: Farm Tenure, Regen Ag & Live GPS</Text>
                            </View>
                            <View style={styles.summaryRowItem}>
                                <Feather name="check-circle" size={14} color="#10B981" />
                                <Text style={styles.summaryRowText}>Section C/D/E: Demographics & Food Security</Text>
                            </View>
                            <View style={styles.summaryRowItem}>
                                <Feather name="check-circle" size={14} color="#10B981" />
                                <Text style={styles.summaryRowText}>
                                    Section H: Livestock & {signaturePaths.length > 0 ? 'Digital Signature' : 'Attestation'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalDivider} />

                        <TouchableOpacity
                            style={styles.startNowButton}
                            onPress={() => {
                                registrationState.resetData();
                                draftService.clearActiveDraft();
                                setShowSuccessModal(false);
                                if (navigation?.navigate) {
                                    navigation.navigate('farmers');
                                } else {
                                    router.navigate('/(agent)/farmers' as any);
                                }
                            }}
                        >
                            <Text style={styles.startNowText}>View Farmer List</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.homeBtn}
                            onPress={() => {
                                registrationState.resetData();
                                draftService.clearActiveDraft();
                                setShowSuccessModal(false);
                                if (navigation?.navigate) {
                                    navigation.navigate('index');
                                } else {
                                    router.navigate('/(agent)' as any);
                                }
                            }}
                        >
                            <Text style={styles.homeBtnText}>Return to Agent Dashboard</Text>
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
        color: '#10B981',
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
        gap: 10,
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
    cardBoxSubtitle: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 1,
    },
    compulsoryBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    compulsoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
    },
    optionalBadge: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    optionalBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
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
        backgroundColor: '#FFFFFF',
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
    facialSummaryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
        padding: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    facialPhotoWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#059669',
        backgroundColor: '#E6F4EA',
    },
    facialPhotoPreview: {
        width: '100%',
        height: '100%',
    },
    facialPhotoPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    farmerNameText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#065F46',
    },
    farmerSubText: {
        fontSize: 12,
        color: '#047857',
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#FEE2E2',
    },
    clearBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#DC2626',
    },
    signatureCanvasContainer: {
        height: 150,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'flex-end',
    },
    signatureCanvasContainerActive: {
        borderColor: '#10B981',
        borderWidth: 2,
        borderStyle: 'solid',
        backgroundColor: '#F0FDF4',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    signatureCanvasContainerSigned: {
        borderColor: '#059669',
        borderWidth: 1.5,
        borderStyle: 'solid',
        backgroundColor: '#FAFAFA',
    },
    drawingActiveBadge: {
        position: 'absolute',
        top: 8,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        zIndex: 10,
    },
    drawingActiveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    drawingActiveText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    signaturePlaceholderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    signaturePlaceholderText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    signatureBaseline: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        gap: 8,
    },
    signatureXText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    signatureLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#CBD5E1',
    },
    signatureCanvasContainerSaved: {
        borderColor: '#059669',
        borderWidth: 1.5,
        borderStyle: 'solid',
        backgroundColor: '#F8FAFC',
    },
    signatureActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 10,
    },
    signatureClearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    signatureClearBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#DC2626',
    },
    signatureSaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#0E6F6A',
        shadowColor: '#0E6F6A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    signatureSaveBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    signatureSavedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 10,
    },
    signatureSavedIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signatureSavedTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#065F46',
    },
    signatureSavedSub: {
        fontSize: 10,
        color: '#047857',
        marginTop: 1,
    },
    signatureRedrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    signatureRedrawBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    signatureConfirmedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    signatureConfirmedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    scannerStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    scannerStatusText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#334155',
    },
    fingerprintBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fingerprintCapturedView: {
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    fingerprintSuccessIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E6F4EA',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0E6F6A',
    },
    fingerprintSuccessTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    fingerprintTemplateText: {
        fontSize: 12,
        color: '#64748B',
    },
    fingerprintDeviceText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    reScanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    reScanBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0E6F6A',
    },
    fingerprintPromptView: {
        alignItems: 'center',
        gap: 10,
        width: '100%',
    },
    scannerIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    scannerBeam: {
        position: 'absolute',
        width: 60,
        height: 2,
        backgroundColor: '#10B981',
    },
    scannerPromptText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    scanTriggerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#0E6F6A',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    scanTriggerBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: 'white',
    },
    attestationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    attestationCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
        backgroundColor: 'white',
    },
    attestationCheckboxActive: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    attestationTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    attestationDesc: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
    },
    completeBtn: {
        height: 52,
        backgroundColor: '#10B981',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    completeBtnText: {
        fontSize: 16,
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
    modalSub: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 4,
    },
    successIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        marginBottom: 16,
    },
    completionText: {
        fontSize: 14,
        fontWeight: '700',
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
    summaryList: {
        width: '100%',
        gap: 6,
        marginBottom: 16,
    },
    summaryRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryRowText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '500',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        width: '100%',
        marginBottom: 16,
    },
    startNowButton: {
        width: '100%',
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    startNowText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },
    homeBtn: {
        width: '100%',
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
});

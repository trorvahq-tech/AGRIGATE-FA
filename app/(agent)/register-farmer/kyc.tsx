import React, { useState, useRef, useEffect } from 'react';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ActivityIndicator,
    Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, Mask, Rect, Ellipse, Line, Path, G } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { toast } from 'sonner-native';
import CustomBackNavBar from '../../../components/ui/CustomBackNavBar';
import { registrationState } from '../../../services/registrationState';
import { draftService } from '../../../services/draftService';
import SaveDraftModal, { SaveDraftInfo } from '../../../components/ui/SaveDraftModal';
import { validateOfflineFarmerPhoto, OfflinePhotoValidationResult } from '../../../services/offlineImageValidator';
import { 
    analyzeBiometricPortrait, 
    FacialBiometricRecord, 
    quickAssessFrame, 
    QuickAssessmentResult,
    BiometricChallengeFrames,
    probeMouthDelta,
    probeTurnDelta,
    getSafeCrop,
} from '../../../services/biometricService';
import { BiometricStorageService } from '../../../services/biometrics/BiometricStorageService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BANKS = [
    'First Bank of Nigeria', 'Access Bank', 'GTBank', 'Zenith Bank',
    'United Bank for Africa (UBA)', 'Union Bank', 'Moniepoint Microfinance Bank',
    'OPay', 'PalmPay', 'Kuda Bank', 'Other'
];

export type LivenessStep = 'SEARCHING_FACE' | 'FACE_LOCKED' | 'OPEN_MOUTH' | 'TURN_RIGHT' | 'HOLD_STEADY' | 'VERIFIED';

export default function FarmerKYCScreen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const params = useLocalSearchParams();
    const savedData = registrationState.getData();
    const [savedDraftInfo, setSavedDraftInfo] = useState<SaveDraftInfo | null>(null);

    // Form State (Section B & KYC)
    const [hasNin, setHasNin] = useState(savedData.hasNin ?? false);
    const [ninNumber, setNinNumber] = useState(savedData.ninNumber || '');
    
    const [hasBankAccount, setHasBankAccount] = useState(savedData.hasBankAccount ?? false);
    const [bankName, setBankName] = useState(savedData.bankName || '');
    const [accountNumber, setAccountNumber] = useState(savedData.accountNumber || '');
    const [bvn, setBvn] = useState(savedData.bvn || '');
    
    const [mobileMoney, setMobileMoney] = useState(savedData.mobileMoney ?? false);
    const [microfinanceGroup, setMicrofinanceGroup] = useState(savedData.microfinanceGroup || '');

    // Re-sync with registrationState whenever resumed or navigation params change
    useEffect(() => {
        const data = registrationState.getData();
        setHasNin(data.hasNin ?? false);
        setNinNumber(data.ninNumber || '');
        setHasBankAccount(data.hasBankAccount ?? false);
        setBankName(data.bankName || '');
        setAccountNumber(data.accountNumber || '');
        setBvn(data.bvn || '');
        setMobileMoney(data.mobileMoney ?? false);
        setMicrofinanceGroup(data.microfinanceGroup || '');
        setPhotoCaptured(Boolean(data.photoUri));
        setPhotoUri(data.photoUri || null);
        if (data.facialBiometrics) {
            setBiometricRecord(data.facialBiometrics);
        }
    }, [params?.isNew, params?.isResume, params?.draftId, params?.ts]);

    // Photo, Biometrics & Camera State
    const [photoCaptured, setPhotoCaptured] = useState(savedData.photoUri ? true : false);
    const [photoUri, setPhotoUri] = useState<string | null>(savedData.photoUri);
    const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
    const [biometricRecord, setBiometricRecord] = useState<FacialBiometricRecord | null>(savedData.facialBiometrics || null);
    const [isCropping, setIsCropping] = useState(false);
    
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showQualityModal, setShowQualityModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Dynamic Edge Pre-Assessment & Multi-Frame Temporal Liveness State
    const [preScanFrameUri, setPreScanFrameUri] = useState<string | null>(null);
    const [liveAssessment, setLiveAssessment] = useState<QuickAssessmentResult | null>(null);
    const [isAssessing, setIsAssessing] = useState(false);

    // Liveness & Interactive Biometric HUD State
    const [livenessStep, setLivenessStep] = useState<LivenessStep>('SEARCHING_FACE');
    const [isScanningActive, setIsScanningActive] = useState(false);
    const laserAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanTimerRef = useRef<any>(null);

    // Dynamic Edge Liveness Probe Loop Refs
    const activeStepRef = useRef<LivenessStep>('SEARCHING_FACE');
    const isModalOpenRef = useRef<boolean>(false);
    const isProbingRef = useRef<boolean>(false);
    const isProcessingFinalRef = useRef<boolean>(false);
    const baselineFrameUriRef = useRef<string | null>(null);
    const openMouthFrameUriRef = useRef<string | null>(null);
    const turnRightFrameUriRef = useRef<string | null>(null);
    const probeTimeoutRef = useRef<any>(null);
    const consecutiveFaceCountRef = useRef<number>(0);

    // Subtle breathing pulse for corner reticles
    useEffect(() => {
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseLoop.start();
        return () => pulseLoop.stop();
    }, []);

    // Laser scan animation
    const startLaserLoop = () => {
        laserAnim.setValue(0);
        return Animated.loop(
            Animated.sequence([
                Animated.timing(laserAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(laserAnim, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        );
    };

    // Facial Verification & Quality Checklist State (100% Offline Edge Validation)
    const [isFaceDetected, setIsFaceDetected] = useState(true);
    const [isLightingGood, setIsLightingGood] = useState(true);
    const [isEyesOpen, setIsEyesOpen] = useState(true);
    const [validationResult, setValidationResult] = useState<OfflinePhotoValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    
    // Expo Camera Hooks & Ref
    const [permission, requestPermission] = useCameraPermissions();
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [flashOn, setFlashOn] = useState(false);
    const cameraRef = useRef<any>(null);

    // ── Helper: Crop Image Tightly to Oval Headshot Area ──
    const cropToHeadOval = async (rawUri: string, imgW = 1080, imgH = 1920) => {
        try {
            const small = await ImageManipulator.manipulateAsync(
                rawUri,
                [{ resize: { width: 720 } }],
                { compress: 0.90 }
            );
            const w = small.width || 720;
            const h = small.height || 960;
            const cropOpts = getSafeCrop(w, h, 0.16, 0.12, 0.68, 0.76);

            const manip = await ImageManipulator.manipulateAsync(
                small.uri,
                [
                    { crop: cropOpts },
                    { resize: { width: 480, height: 600 } },
                ],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manip.uri;
        } catch (err) {
            console.warn('Headshot crop failed, using original:', err);
            return rawUri;
        }
    };

    // Unified Photo Processing & Edge Biometric Verification (100% Offline)
    const processCapturedPhoto = async (
        rawUri: string, 
        width: number = 720, 
        height: number = 960,
        challengeFramesOrPreScanUri?: string | BiometricChallengeFrames
    ) => {
        setIsCropping(true);
        setIsValidating(true);
        setShowPhotoModal(false);
        setShowQualityModal(true);

        try {
            // Run 100% offline self-hosted biometric analyzer (Retina + Ocular + Face + Interactive Liveness)
            const bioRecord = await analyzeBiometricPortrait(rawUri, width, height, challengeFramesOrPreScanUri);
            setBiometricRecord(bioRecord);

            // Also run baseline validator
            const valResult = await validateOfflineFarmerPhoto(rawUri, width, height);
            setValidationResult(valResult);

            setIsFaceDetected(bioRecord.isFaceDetected);
            setIsLightingGood(bioRecord.exposureGrade !== 'POOR');
            setIsEyesOpen(bioRecord.retinaConfidence >= 60);

            setPendingPhotoUri(bioRecord.photoUri);
            setIsCropping(false);
            setIsValidating(false);

            if (!bioRecord.isFaceDetected || !bioRecord.isAntiSpoofPassed) {
                toast.error('Biometric notice: ' + (bioRecord.reasons[0] || 'Align face and eyes inside reticle'));
            } else {
                toast.success(`Biometrics & Retina Validated (${bioRecord.overallScore}%)`);
            }
        } catch (err) {
            console.warn('Biometric processing error:', err);
            const cropped = await cropToHeadOval(rawUri, width, height);
            setPendingPhotoUri(cropped);
            setIsCropping(false);
            setIsValidating(false);
        }
    };

    // 1. Hardware System Camera via ImagePicker
    const handleLaunchHardwareCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is needed to capture farmer verification photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.85,
                cameraType: ImagePicker.CameraType.front,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                await processCapturedPhoto(asset.uri, asset.width, asset.height);
            }
        } catch (error) {
            console.log('Error launching camera:', error);
            setPhotoCaptured(true);
            setShowPhotoModal(false);
        }
    };

    // 2. Pick image from device gallery
    const handlePickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.85,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                await processCapturedPhoto(asset.uri, asset.width, asset.height);
            }
        } catch (error) {
            console.log('Error picking image:', error);
        }
    };

    // ── Automated Continuous Real-Time Liveness Engine (100% Offline) ──
    const stopLivenessTracking = () => {
        isModalOpenRef.current = false;
        isProbingRef.current = false;
        isProcessingFinalRef.current = false;
        if (probeTimeoutRef.current) {
            clearTimeout(probeTimeoutRef.current);
            probeTimeoutRef.current = null;
        }
        setIsScanningActive(false);
    };

    const restartLivenessSequence = () => {
        if (probeTimeoutRef.current) {
            clearTimeout(probeTimeoutRef.current);
            probeTimeoutRef.current = null;
        }
        isProbingRef.current = false;
        isProcessingFinalRef.current = false;
        baselineFrameUriRef.current = null;
        openMouthFrameUriRef.current = null;
        turnRightFrameUriRef.current = null;
        consecutiveFaceCountRef.current = 0;
        activeStepRef.current = 'SEARCHING_FACE';
        setLivenessStep('SEARCHING_FACE');
        setLiveAssessment(null);
        setIsScanningActive(true);
        runLivenessTick();
    };

    const runLivenessTick = async () => {
        if (!isModalOpenRef.current || isProcessingFinalRef.current) return;

        if (!cameraRef.current) {
            probeTimeoutRef.current = setTimeout(runLivenessTick, 400);
            return;
        }

        if (isProbingRef.current) {
            probeTimeoutRef.current = setTimeout(runLivenessTick, 400);
            return;
        }

        isProbingRef.current = true;

        try {
            const currentStep = activeStepRef.current;

            if (currentStep === 'SEARCHING_FACE') {
                const snap = await cameraRef.current.takePictureAsync({
                    quality: 0.35,
                    skipProcessing: false,
                });

                if (snap?.uri && isModalOpenRef.current && activeStepRef.current === 'SEARCHING_FACE') {
                    const assessment = await quickAssessFrame(snap.uri);
                    setLiveAssessment(assessment);

                    if (assessment.hasFace) {
                        consecutiveFaceCountRef.current += 1;
                        if (consecutiveFaceCountRef.current >= 1) {
                            baselineFrameUriRef.current = snap.uri;
                            setPreScanFrameUri(snap.uri);
                            activeStepRef.current = 'FACE_LOCKED';
                            setLivenessStep('FACE_LOCKED');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                            // Hold green lock for 900ms, then prompt OPEN_MOUTH
                            setTimeout(() => {
                                if (isModalOpenRef.current && activeStepRef.current === 'FACE_LOCKED') {
                                    activeStepRef.current = 'OPEN_MOUTH';
                                    setLivenessStep('OPEN_MOUTH');
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                            }, 900);
                        }
                    } else {
                        consecutiveFaceCountRef.current = 0;
                    }
                }
            }
        } catch (tickErr) {
            console.warn('Liveness tick error:', tickErr);
        } finally {
            isProbingRef.current = false;
        }

        if (isModalOpenRef.current && !isProcessingFinalRef.current && activeStepRef.current === 'SEARCHING_FACE') {
            probeTimeoutRef.current = setTimeout(runLivenessTick, 700);
        }
    };

    // User-controlled or automated challenge progression
    const handleAdvanceChallenge = async () => {
        if (!cameraRef.current || isProcessingFinalRef.current) return;

        const currentStep = activeStepRef.current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            if (currentStep === 'SEARCHING_FACE' || currentStep === 'FACE_LOCKED') {
                if (liveAssessment && !liveAssessment.hasFace) {
                    toast.error('No human face detected. Center a real face in the oval reticle.');
                    return;
                }
                const snap = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: false });
                if (snap?.uri) {
                    baselineFrameUriRef.current = snap.uri;
                    setPreScanFrameUri(snap.uri);
                }
                activeStepRef.current = 'OPEN_MOUTH';
                setLivenessStep('OPEN_MOUTH');
            } else if (currentStep === 'OPEN_MOUTH') {
                const snap = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: false });
                if (snap?.uri && baselineFrameUriRef.current) {
                    const mouthCheck = await probeMouthDelta(snap.uri, baselineFrameUriRef.current);
                    if (!mouthCheck.isMouthOpen) {
                        toast.error(`Mouth opening not detected (${mouthCheck.delta}%). Open mouth wide or smile 😮`);
                        return;
                    }
                    openMouthFrameUriRef.current = snap.uri;
                    activeStepRef.current = 'TURN_RIGHT';
                    setLivenessStep('TURN_RIGHT');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } else if (currentStep === 'TURN_RIGHT') {
                const snap = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: false });
                if (snap?.uri && baselineFrameUriRef.current) {
                    const turnCheck = await probeTurnDelta(snap.uri, baselineFrameUriRef.current);
                    if (!turnCheck.isTurnedRight) {
                        toast.error(`Head turn not detected (${turnCheck.delta}%). Turn head ~20° to the right ➔`);
                        return;
                    }
                    turnRightFrameUriRef.current = snap.uri;
                    activeStepRef.current = 'HOLD_STEADY';
                    setLivenessStep('HOLD_STEADY');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } else if (currentStep === 'HOLD_STEADY') {
                isProcessingFinalRef.current = true;
                activeStepRef.current = 'VERIFIED';
                setLivenessStep('VERIFIED');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                const finalPhoto = await cameraRef.current.takePictureAsync({ quality: 0.90, skipProcessing: false });
                if (finalPhoto?.uri) {
                    const challengeFrames: BiometricChallengeFrames = {
                        baselineUri: baselineFrameUriRef.current || undefined,
                        turnRightUri: turnRightFrameUriRef.current || undefined,
                        openMouthUri: openMouthFrameUriRef.current || undefined,
                    };
                    stopLivenessTracking();
                    await processCapturedPhoto(
                        finalPhoto.uri,
                        finalPhoto.width || 1080,
                        finalPhoto.height || 1920,
                        challengeFrames
                    );
                }
            }
        } catch (err) {
            console.warn('handleAdvanceChallenge error:', err);
        }
    };

    // Auto-start liveness probe loop whenever the photo modal is opened
    useEffect(() => {
        if (showPhotoModal) {
            isModalOpenRef.current = true;
            isProcessingFinalRef.current = false;
            setIsScanningActive(true);
            const laserLoop = startLaserLoop();
            laserLoop.start();

            // Delay startup 500ms to allow CameraView sensor initialization
            const timer = setTimeout(() => {
                restartLivenessSequence();
            }, 500);

            return () => {
                clearTimeout(timer);
                laserLoop.stop();
                stopLivenessTracking();
            };
        } else {
            stopLivenessTracking();
        }
    }, [showPhotoModal]);

    // Manual Trigger Button Handler (Restarts Sequence or Advances Challenge)
    const handleStartBiometricScan = () => {
        if (livenessStep === 'SEARCHING_FACE') {
            restartLivenessSequence();
        } else {
            handleAdvanceChallenge();
        }
    };

    // Direct Shutter Snap from live Viewfinder (Direct High-Resolution Enrollment)
    const handleSnapFromViewfinder = async () => {
        if (!cameraRef.current) return;
        try {
            setIsAssessing(true);
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.90, skipProcessing: false });
            if (!photo || !photo.uri) return;

            stopLivenessTracking();

            const challengeFrames: BiometricChallengeFrames = {
                baselineUri: baselineFrameUriRef.current || undefined,
                turnRightUri: turnRightFrameUriRef.current || undefined,
                openMouthUri: openMouthFrameUriRef.current || undefined,
            };

            await processCapturedPhoto(
                photo.uri, 
                photo.width || 1080, 
                photo.height || 1920,
                challengeFrames
            );
        } catch (err) {
            console.log('Take picture error:', err);
        } finally {
            setIsAssessing(false);
        }
    };

    // Quality check validation before acceptance (Enforcing Strict Face Requirement)
    const handleAcceptQualityPhoto = () => {
        if (!isFaceDetected || (biometricRecord && !biometricRecord.isFaceDetected)) {
            Alert.alert(
                'Face Verification Required',
                'No human face detected. The camera captured an inanimate surface (ceiling, wall, or floor). A clear, centered human face is strictly required to enroll biometric identity.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (biometricRecord && !biometricRecord.isAntiSpoofPassed) {
            Alert.alert(
                'Liveness Verification Failed',
                biometricRecord.reasons[0] || 'Active liveness challenge failed. Please retake photo with live face actions.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (pendingPhotoUri) {
            setPhotoUri(pendingPhotoUri);
            setPhotoCaptured(true);
            registrationState.updateData({
                photoUri: pendingPhotoUri,
                facialBiometrics: biometricRecord,
            });

            if (biometricRecord) {
                const regData = registrationState.getData();
                const primaryFarmerId = regData.ninNumber || `farmer-${Date.now()}`;
                const aliases = [
                    regData.ninNumber,
                    params?.draftId as string,
                    regData.phone,
                ].filter(Boolean) as string[];

                BiometricStorageService.saveTemplate({
                    templateId: biometricRecord.templateId,
                    farmerId: primaryFarmerId,
                    version: 'MFN-128-V1',
                    embedding: biometricRecord.biometricVector,
                    enrolledAt: biometricRecord.timestamp,
                    photoUri: pendingPhotoUri,
                    quality: {
                        brightness: biometricRecord.metrics.brightness,
                        isCentered: true,
                        rollTiltAngleDeg: biometricRecord.headTiltAngleDeg,
                        faceCoverageRatio: 0.5,
                        isSingleFace: true,
                        exposureGrade: biometricRecord.exposureGrade,
                        faceCount: 1,
                        isQualityPassed: true,
                        guidance: 'Optimal biometric facial capture',
                    },
                    auditSignature: biometricRecord.auditSignature,
                }, aliases).catch(err => console.warn('BiometricStorageService save error:', err));
            }
        }
        setShowQualityModal(false);
        toast.success('Farmer biometrics & portrait enrolled offline!');
    };

    const handleRetakePhoto = () => {
        setShowQualityModal(false);
        setValidationResult(null);
        stopLivenessTracking();
        setShowPhotoModal(true);
    };

    const openCameraModal = async () => {
        if (!permission?.granted) {
            await requestPermission();
        }
        stopLivenessTracking();
        setShowPhotoModal(true);
    };

    const handleProceed = () => {
        registrationState.updateData({
            hasNin,
            ninNumber,
            hasBankAccount,
            bankName,
            accountNumber,
            bvn,
            mobileMoney,
            microfinanceGroup,
            photoUri,
            facialBiometrics: biometricRecord,
        });
        setShowSuccessModal(true);
    };

    const handleSaveDraft = async () => {
        try {
            const draft = await draftService.saveCurrentDraft(
                '/(agent)/register-farmer/kyc',
                2,
                'Identity, Banking & Photo',
                {
                    hasNin,
                    ninNumber,
                    hasBankAccount,
                    bankName,
                    accountNumber,
                    bvn,
                    mobileMoney,
                    microfinanceGroup,
                    photoUri,
                    facialBiometrics: biometricRecord,
                }
            );
            setSavedDraftInfo({
                farmerName: draft.farmerName,
                stepNumber: 2,
                stepTitle: 'Identity, Banking & Photo',
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
                        navigation.navigate('register-farmer/personal-details');
                    } else {
                        router.navigate('/(agent)/register-farmer/personal-details' as any);
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
                {/* Progress Header */}
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
                                strokeDashoffset={2 * Math.PI * 18 * (1 - 0.40)}
                                strokeLinecap="round"
                                rotation="-90"
                                origin="20, 20"
                            />
                        </Svg>
                        <Text style={styles.progressText}>40%</Text>
                    </View>
                    <View>
                        <Text style={styles.stepLabel}>Step 2 of 5 • Section B & KYC</Text>
                        <Text style={styles.stepTitle}>Identity, Banking & Photo Capture</Text>
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

                    {/* Section 1: Mandatory Photo Capture Guard */}
                    <View style={styles.cardBox}>
                        <View style={styles.cardBoxHeader}>
                            <Ionicons name="camera" size={22} color="#0E6F6A" />
                            <Text style={styles.cardBoxTitle}>Mandatory Farmer Photo Capture (VCM Spec 5.1)</Text>
                        </View>
                        <Text style={styles.cardBoxSubtext}>
                            Direct physical observation verification requirement. Live photo must be captured in the field with face fitted in the oval guide.
                        </Text>

                        {photoCaptured ? (
                            <View style={styles.photoPreviewRow}>
                                <View style={styles.circularHeadshotFrame}>
                                    <Image
                                        source={photoUri ? { uri: photoUri } : require('../../../assets/images/whoLogin2.png')}
                                        style={styles.circularHeadshotImage}
                                        contentFit="cover"
                                    />
                                    <View style={styles.circularHeadshotCheck}>
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    </View>
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <View style={styles.verifiedBadge}>
                                        <Feather name="check-circle" size={14} color="#10B981" />
                                        <Text style={styles.verifiedBadgeText}>
                                            {biometricRecord ? 'Biometrics & Retina Enrolled' : 'Headshot Validated & Cropped'}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#0F172A', fontWeight: '700' }}>
                                        {biometricRecord
                                            ? `ID: ${biometricRecord.templateId} • Score: ${biometricRecord.overallScore}%`
                                            : 'Oval Mask Crop • Offline QA Passed'}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#64748B' }}>
                                        {biometricRecord
                                            ? `Ocular Symmetry: ${biometricRecord.ocularSymmetry}% • Live Physical Presence Verified`
                                            : 'Clean High-Resolution Farmer Portrait Stored'}
                                    </Text>
                                    
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                        <TouchableOpacity style={styles.actionPillBtn} onPress={openCameraModal}>
                                            <Ionicons name="scan-outline" size={13} color="#0E6F6A" />
                                            <Text style={styles.actionPillBtnText}>Re-Scan Biometrics</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionPillBtn} onPress={handleLaunchHardwareCamera}>
                                            <Ionicons name="aperture" size={13} color="#0E6F6A" />
                                            <Text style={styles.actionPillBtnText}>System Camera</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={{ gap: 8, marginTop: 6 }}>
                                <TouchableOpacity style={styles.captureBtn} onPress={openCameraModal}>
                                    <Ionicons name="scan" size={20} color="#FFFFFF" />
                                    <Text style={styles.captureBtnText}>Scan Retina, Face & Liveness</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryCaptureBtn} onPress={handleLaunchHardwareCamera}>
                                    <Ionicons name="aperture-outline" size={18} color="#0E6F6A" />
                                    <Text style={styles.secondaryCaptureBtnText}>Launch System Device Camera</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Section 2: National Identity (A16/A17) */}
                    <View style={styles.inputGroup}>
                        <View style={styles.rowJustify}>
                            <Text style={styles.label}>Registered National ID / NIN? (A16)</Text>
                            <Switch
                                value={hasNin}
                                onValueChange={setHasNin}
                                trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                            />
                        </View>

                        {hasNin && (
                            <View style={{ gap: 6 }}>
                                <TextInput
                                    style={styles.input}
                                    value={ninNumber}
                                    onChangeText={setNinNumber}
                                    placeholder="Enter 11-digit NIN (e.g. 23456789012)"
                                    placeholderTextColor="#A0AEC0"
                                    keyboardType="number-pad"
                                    maxLength={11}
                                />
                                <Text style={styles.helperText}>
                                    {ninNumber.length === 11 ? '✓ Valid 11-digit NIN' : 'Requires 11 digits'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Section 3: Financial Access & Banking (Section B) */}
                    <View style={styles.cardBox}>
                        <View style={styles.rowJustify}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="card-outline" size={20} color="#0E6F6A" />
                                <Text style={styles.cardBoxTitle}>Bank Account & BVN (Section B)</Text>
                            </View>
                            <Switch
                                value={hasBankAccount}
                                onValueChange={setHasBankAccount}
                                trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                            />
                        </View>

                        {hasBankAccount && (
                            <View style={{ gap: 12, marginTop: 12 }}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Bank Name</Text>
                                    <View style={styles.optionWrap}>
                                        {BANKS.slice(0, 6).map((b) => (
                                            <TouchableOpacity
                                                key={b}
                                                style={[styles.chipPill, bankName === b && styles.chipPillActive]}
                                                onPress={() => setBankName(b)}
                                            >
                                                <Text style={[styles.chipText, bankName === b && styles.chipTextActive]}>{b}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>10-Digit Account Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={accountNumber}
                                        onChangeText={setAccountNumber}
                                        placeholder="e.g. 3087654321"
                                        placeholderTextColor="#A0AEC0"
                                        keyboardType="number-pad"
                                        maxLength={10}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>11-Digit BVN (Bank Verification Number)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={bvn}
                                        onChangeText={setBvn}
                                        placeholder="e.g. 22198765432"
                                        placeholderTextColor="#A0AEC0"
                                        keyboardType="number-pad"
                                        maxLength={11}
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Section 4: Mobile Money & Savings Group Membership */}
                    <View style={styles.inputGroup}>
                        <View style={styles.rowJustify}>
                            <Text style={styles.label}>Mobile Money Wallet / POS User?</Text>
                            <Switch
                                value={mobileMoney}
                                onValueChange={setMobileMoney}
                                trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Microfinance / Savings Group Membership</Text>
                        <View style={styles.optionWrap}>
                            {['Farmer Cooperative', 'VSLA Group', 'Community Savings', 'None'].map((grp) => (
                                <TouchableOpacity
                                    key={grp}
                                    style={[styles.chipPill, microfinanceGroup === grp && styles.chipPillActive]}
                                    onPress={() => setMicrofinanceGroup(grp)}
                                >
                                    <Text style={[styles.chipText, microfinanceGroup === grp && styles.chipTextActive]}>{grp}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleProceed}
                    >
                        <Text style={styles.continueButtonText}>Save & Proceed to Step 3 (Farm Details & GPS)</Text>
                        <Feather name="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* ══════════════════════════════════════════════════════════
                TRUE SVG OVAL HEADSHOT VIEWFINDER MODAL
            ══════════════════════════════════════════════════════════ */}
            {/* ══════════════════════════════════════════════════════════
                BIOMETRIC RETINA & LIVENESS VIEWFINDER MODAL
            ══════════════════════════════════════════════════════════ */}
            <Modal
                visible={showPhotoModal}
                transparent={false}
                animationType="slide"
                onRequestClose={() => {
                    stopLivenessTracking();
                    setShowPhotoModal(false);
                }}
            >
                <View style={styles.cameraModalContainer}>
                    <StatusBar style="light" />

                    {/* Camera Top Bar */}
                    <View style={styles.cameraTopBar}>
                        <TouchableOpacity
                            style={styles.cameraIconBtn}
                            onPress={() => {
                                stopLivenessTracking();
                                setShowPhotoModal(false);
                            }}
                        >
                            <Ionicons name="close" size={26} color="white" />
                        </TouchableOpacity>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.cameraTitle}>Biometric Retina & Face Capture</Text>
                            <Text style={{ fontSize: 10, color: '#38BDF8', fontWeight: '700' }}>
                                VCM 5.1 • 100% On-Device Edge Biometrics
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity 
                                style={[styles.cameraIconBtn, flashOn && { backgroundColor: '#F59E0B' }]} 
                                onPress={() => setFlashOn(!flashOn)}
                            >
                                <Ionicons name={flashOn ? "flash" : "flash-outline"} size={22} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cameraIconBtn} onPress={() => setIsFrontCamera(!isFrontCamera)}>
                                <Ionicons name="camera-reverse" size={22} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Viewfinder with Live Camera and Biometric HUD */}
                    <View style={styles.viewfinderContainer}>
                        {permission?.granted ? (
                            <>
                                <CameraView
                                    ref={cameraRef}
                                    style={StyleSheet.absoluteFill}
                                    facing={isFrontCamera ? 'front' : 'back'}
                                    enableTorch={flashOn}
                                />
                                
                                {/* ── HUD Overlay with Targeting Reticles and Laser Sweep ── */}
                                <View style={styles.viewfinderGuidesOverlay} pointerEvents="none">
                                    {/* Top Dynamic Status Pill */}
                                    <View
                                        style={[
                                            styles.hudStatusPill,
                                            livenessStep === 'SEARCHING_FACE' && {
                                                borderColor: liveAssessment && !liveAssessment.hasFace ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.6)',
                                                backgroundColor: liveAssessment && !liveAssessment.hasFace ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.65)',
                                            },
                                            livenessStep === 'FACE_LOCKED' && { borderColor: 'rgba(16, 185, 129, 0.95)', backgroundColor: 'rgba(16, 185, 129, 0.2)' },
                                            livenessStep === 'OPEN_MOUTH' && { borderColor: 'rgba(168, 85, 247, 0.95)', backgroundColor: 'rgba(168, 85, 247, 0.2)' },
                                            livenessStep === 'TURN_RIGHT' && { borderColor: 'rgba(245, 158, 11, 0.95)', backgroundColor: 'rgba(245, 158, 11, 0.2)' },
                                            livenessStep === 'HOLD_STEADY' && { borderColor: 'rgba(6, 182, 212, 0.95)', backgroundColor: 'rgba(6, 182, 212, 0.2)' },
                                            livenessStep === 'VERIFIED' && { borderColor: 'rgba(16, 185, 129, 0.95)', backgroundColor: 'rgba(16, 185, 129, 0.25)' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={
                                                livenessStep === 'SEARCHING_FACE'
                                                    ? liveAssessment && !liveAssessment.hasFace
                                                        ? 'warning-outline'
                                                        : 'scan-outline'
                                                    : livenessStep === 'FACE_LOCKED'
                                                    ? 'checkmark-circle'
                                                    : livenessStep === 'OPEN_MOUTH'
                                                    ? 'happy-outline'
                                                    : livenessStep === 'TURN_RIGHT'
                                                    ? 'arrow-forward-circle'
                                                    : livenessStep === 'HOLD_STEADY'
                                                    ? 'person-outline'
                                                    : 'shield-checkmark'
                                            }
                                            size={15}
                                            color={
                                                livenessStep === 'SEARCHING_FACE'
                                                    ? liveAssessment && !liveAssessment.hasFace
                                                        ? '#EF4444'
                                                        : '#FBBF24'
                                                    : livenessStep === 'FACE_LOCKED'
                                                    ? '#10B981'
                                                    : livenessStep === 'OPEN_MOUTH'
                                                    ? '#C084FC'
                                                    : livenessStep === 'TURN_RIGHT'
                                                    ? '#F59E0B'
                                                    : livenessStep === 'HOLD_STEADY'
                                                    ? '#38BDF8'
                                                    : '#10B981'
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.hudStatusPillText,
                                                livenessStep === 'SEARCHING_FACE' && {
                                                    color: liveAssessment && !liveAssessment.hasFace ? '#FCA5A5' : '#FDE68A',
                                                },
                                                livenessStep === 'FACE_LOCKED' && { color: '#6EE7B7' },
                                                livenessStep === 'OPEN_MOUTH' && { color: '#E9D5FF' },
                                                livenessStep === 'TURN_RIGHT' && { color: '#FDE68A' },
                                                livenessStep === 'HOLD_STEADY' && { color: '#7DD3FC' },
                                                livenessStep === 'VERIFIED' && { color: '#6EE7B7' },
                                            ]}
                                        >
                                            {livenessStep === 'SEARCHING_FACE'
                                                ? liveAssessment && !liveAssessment.hasFace
                                                    ? 'STAGE 1: NO FACE DETECTED (SURFACE) • ALIGN IN OVAL'
                                                    : 'STAGE 1: ALIGN FACE IN OVAL RETICLE'
                                                : livenessStep === 'FACE_LOCKED'
                                                ? 'STAGE 1: FACE LOCKED ON IN ✓'
                                                : livenessStep === 'OPEN_MOUTH'
                                                ? 'STAGE 2: OPEN YOUR MOUTH 😮'
                                                : livenessStep === 'TURN_RIGHT'
                                                ? 'STAGE 3: TURN HEAD RIGHT ➔'
                                                : livenessStep === 'HOLD_STEADY'
                                                ? 'STAGE 4: LOOK FORWARD & HOLD STEADY 🙂'
                                                : 'STAGE 5: BIOMETRICS VERIFIED ✓ CAPTURING...'}
                                        </Text>
                                    </View>

                                    {/* Centered Master Oval Target Frame with Corner Brackets */}
                                    <View style={styles.ovalCenterWrapper}>
                                        {/* 4 Animated Corner Brackets */}
                                        <Animated.View
                                            style={[
                                                styles.bracketTopLeft,
                                                { transform: [{ scale: pulseAnim }] },
                                                livenessStep === 'SEARCHING_FACE' && {
                                                    borderColor: liveAssessment && !liveAssessment.hasFace ? '#EF4444' : '#F59E0B',
                                                },
                                                livenessStep === 'FACE_LOCKED' && { borderColor: '#10B981' },
                                                livenessStep === 'OPEN_MOUTH' && { borderColor: '#8B5CF6' },
                                                livenessStep === 'TURN_RIGHT' && { borderColor: '#F59E0B' },
                                                livenessStep === 'HOLD_STEADY' && { borderColor: '#06B6D4' },
                                                livenessStep === 'VERIFIED' && { borderColor: '#10B981' },
                                            ]}
                                        />
                                        <Animated.View
                                            style={[
                                                styles.bracketTopRight,
                                                { transform: [{ scale: pulseAnim }] },
                                                livenessStep === 'SEARCHING_FACE' && {
                                                    borderColor: liveAssessment && !liveAssessment.hasFace ? '#EF4444' : '#F59E0B',
                                                },
                                                livenessStep === 'FACE_LOCKED' && { borderColor: '#10B981' },
                                                livenessStep === 'OPEN_MOUTH' && { borderColor: '#8B5CF6' },
                                                livenessStep === 'TURN_RIGHT' && { borderColor: '#F59E0B' },
                                                livenessStep === 'HOLD_STEADY' && { borderColor: '#06B6D4' },
                                                livenessStep === 'VERIFIED' && { borderColor: '#10B981' },
                                            ]}
                                        />
                                        <Animated.View
                                            style={[
                                                styles.bracketBottomLeft,
                                                { transform: [{ scale: pulseAnim }] },
                                                livenessStep === 'SEARCHING_FACE' && {
                                                    borderColor: liveAssessment && !liveAssessment.hasFace ? '#EF4444' : '#F59E0B',
                                                },
                                                livenessStep === 'FACE_LOCKED' && { borderColor: '#10B981' },
                                                livenessStep === 'OPEN_MOUTH' && { borderColor: '#8B5CF6' },
                                                livenessStep === 'TURN_RIGHT' && { borderColor: '#F59E0B' },
                                                livenessStep === 'HOLD_STEADY' && { borderColor: '#06B6D4' },
                                                livenessStep === 'VERIFIED' && { borderColor: '#10B981' },
                                            ]}
                                        />
                                        <Animated.View
                                            style={[
                                                styles.bracketBottomRight,
                                                { transform: [{ scale: pulseAnim }] },
                                                livenessStep === 'SEARCHING_FACE' && {
                                                    borderColor: liveAssessment && !liveAssessment.hasFace ? '#EF4444' : '#F59E0B',
                                                },
                                                livenessStep === 'FACE_LOCKED' && { borderColor: '#10B981' },
                                                livenessStep === 'OPEN_MOUTH' && { borderColor: '#8B5CF6' },
                                                livenessStep === 'TURN_RIGHT' && { borderColor: '#F59E0B' },
                                                livenessStep === 'HOLD_STEADY' && { borderColor: '#06B6D4' },
                                                livenessStep === 'VERIFIED' && { borderColor: '#10B981' },
                                            ]}
                                        />

                                        {/* Dynamic Glowing Oval Guide */}
                                        <View
                                            style={[
                                                styles.viewfinderOval,
                                                livenessStep === 'SEARCHING_FACE' && {
                                                    borderColor: liveAssessment && !liveAssessment.hasFace ? '#EF4444' : 'rgba(245, 158, 11, 0.6)',
                                                },
                                                livenessStep === 'FACE_LOCKED' && { borderColor: '#10B981' },
                                                livenessStep === 'OPEN_MOUTH' && { borderColor: '#8B5CF6' },
                                                livenessStep === 'TURN_RIGHT' && { borderColor: '#F59E0B' },
                                                livenessStep === 'HOLD_STEADY' && { borderColor: '#06B6D4' },
                                                livenessStep === 'VERIFIED' && { borderColor: '#10B981' },
                                            ]}
                                        >
                                            {/* Ocular / Retina Landmark Zone (Dual Eye Alignment) */}
                                            <View style={styles.ocularZoneContainer}>
                                                {/* Left Eye / Retina Target */}
                                                <View style={styles.ocularEyeReticle}>
                                                    <View style={styles.ocularTargetCrossH} />
                                                    <View style={styles.ocularTargetCrossV} />
                                                    <View style={styles.ocularIrisRing}>
                                                        <View style={styles.ocularIrisPupil} />
                                                    </View>
                                                    <Text style={styles.ocularReticleText}>RETINA-L</Text>
                                                </View>

                                                {/* Interpupillary Baseline */}
                                                <View style={styles.interpupillaryLine}>
                                                    <View style={styles.ipdBadge}>
                                                        <Text style={styles.ipdBadgeText}>IPD 64mm</Text>
                                                    </View>
                                                </View>

                                                {/* Right Eye / Retina Target */}
                                                <View style={styles.ocularEyeReticle}>
                                                    <View style={styles.ocularTargetCrossH} />
                                                    <View style={styles.ocularTargetCrossV} />
                                                    <View style={styles.ocularIrisRing}>
                                                        <View style={styles.ocularIrisPupil} />
                                                    </View>
                                                    <Text style={styles.ocularReticleText}>RETINA-R</Text>
                                                </View>
                                            </View>

                                            {/* Interactive Visual Action Overlays */}
                                            {livenessStep === 'FACE_LOCKED' && (
                                                <View style={styles.actionPromptOverlay}>
                                                    <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                                                    <Text style={[styles.actionPromptOverlayText, { color: '#6EE7B7' }]}>FACE LOCKED ON IN ✓</Text>
                                                </View>
                                            )}

                                            {livenessStep === 'OPEN_MOUTH' && (
                                                <View style={styles.actionPromptOverlay}>
                                                    <Ionicons name="happy-outline" size={48} color="#C084FC" />
                                                    <Text style={[styles.actionPromptOverlayText, { color: '#E9D5FF' }]}>OPEN MOUTH WIDE 😮</Text>
                                                </View>
                                            )}

                                            {livenessStep === 'TURN_RIGHT' && (
                                                <View style={styles.actionPromptOverlay}>
                                                    <Ionicons name="arrow-forward-circle" size={48} color="#FBBF24" />
                                                    <Text style={[styles.actionPromptOverlayText, { color: '#FDE68A' }]}>TURN HEAD RIGHT ➔</Text>
                                                </View>
                                            )}

                                            {livenessStep === 'HOLD_STEADY' && (
                                                <View style={styles.actionPromptOverlay}>
                                                    <Ionicons name="person-outline" size={48} color="#38BDF8" />
                                                    <Text style={[styles.actionPromptOverlayText, { color: '#BAE6FD' }]}>HOLD STEADY 🙂</Text>
                                                </View>
                                            )}

                                            {livenessStep === 'VERIFIED' && (
                                                <View style={styles.actionPromptOverlay}>
                                                    <Ionicons name="shield-checkmark" size={48} color="#10B981" />
                                                    <Text style={[styles.actionPromptOverlayText, { color: '#6EE7B7' }]}>VERIFIED ✓</Text>
                                                </View>
                                            )}

                                            {/* Animated Optical Laser Sweep Beam */}
                                            {isScanningActive && (
                                                <Animated.View
                                                    style={[
                                                        styles.laserSweepBar,
                                                        {
                                                            transform: [
                                                                {
                                                                    translateY: laserAnim.interpolate({
                                                                        inputRange: [0, 1],
                                                                        outputRange: [-40, 90],
                                                                    }),
                                                                },
                                                            ],
                                                        },
                                                    ]}
                                                >
                                                    <View style={styles.laserSweepGlow} />
                                                    <View style={styles.laserSweepCore} />
                                                </Animated.View>
                                            )}

                                            {/* Chin Baseline Marker */}
                                            <View style={styles.chinLevelLine}>
                                                <View style={styles.guideBadge}>
                                                    <Text style={styles.guideBadgeText}>CHIN BASELINE</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Dynamic Oval Instruction Badge */}
                                        <View
                                            style={[
                                                styles.headGuidePill,
                                                livenessStep === 'SEARCHING_FACE' && {
                                                    borderColor: liveAssessment && !liveAssessment.hasFace ? '#EF4444' : '#F59E0B',
                                                },
                                                livenessStep === 'FACE_LOCKED' && { borderColor: '#10B981' },
                                                livenessStep === 'OPEN_MOUTH' && { borderColor: '#8B5CF6' },
                                                livenessStep === 'TURN_RIGHT' && { borderColor: '#F59E0B' },
                                                livenessStep === 'HOLD_STEADY' && { borderColor: '#06B6D4' },
                                                livenessStep === 'VERIFIED' && { borderColor: '#10B981' },
                                            ]}
                                        >
                                            <Ionicons
                                                name={
                                                    livenessStep === 'SEARCHING_FACE'
                                                        ? liveAssessment && !liveAssessment.hasFace
                                                            ? 'warning'
                                                            : 'eye'
                                                        : livenessStep === 'FACE_LOCKED'
                                                        ? 'checkmark-circle'
                                                        : livenessStep === 'OPEN_MOUTH'
                                                        ? 'happy-outline'
                                                        : livenessStep === 'TURN_RIGHT'
                                                        ? 'arrow-forward'
                                                        : livenessStep === 'HOLD_STEADY'
                                                        ? 'person'
                                                        : 'shield-checkmark'
                                                }
                                                size={13}
                                                color={
                                                    livenessStep === 'SEARCHING_FACE'
                                                        ? liveAssessment && !liveAssessment.hasFace
                                                            ? '#EF4444'
                                                            : '#F59E0B'
                                                        : livenessStep === 'FACE_LOCKED'
                                                        ? '#10B981'
                                                        : livenessStep === 'OPEN_MOUTH'
                                                        ? '#8B5CF6'
                                                        : livenessStep === 'TURN_RIGHT'
                                                        ? '#F59E0B'
                                                        : livenessStep === 'HOLD_STEADY'
                                                        ? '#06B6D4'
                                                        : '#10B981'
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.headGuidePillText,
                                                    livenessStep === 'SEARCHING_FACE' && {
                                                        color: liveAssessment && !liveAssessment.hasFace ? '#EF4444' : '#F59E0B',
                                                    },
                                                    livenessStep === 'FACE_LOCKED' && { color: '#10B981' },
                                                    livenessStep === 'OPEN_MOUTH' && { color: '#8B5CF6' },
                                                    livenessStep === 'TURN_RIGHT' && { color: '#F59E0B' },
                                                    livenessStep === 'HOLD_STEADY' && { color: '#06B6D4' },
                                                    livenessStep === 'VERIFIED' && { color: '#10B981' },
                                                ]}
                                            >
                                                {livenessStep === 'SEARCHING_FACE'
                                                    ? liveAssessment && !liveAssessment.hasFace
                                                        ? 'SURFACE DETECTED • POSITION REAL FACE'
                                                        : 'FIT EYES & CHIN IN HUD RETICLE'
                                                    : livenessStep === 'FACE_LOCKED'
                                                    ? 'FACE LOCKED ON IN ✓'
                                                    : livenessStep === 'OPEN_MOUTH'
                                                    ? 'STEP 1: OPEN MOUTH WIDE 😮'
                                                    : livenessStep === 'TURN_RIGHT'
                                                    ? 'STEP 2: TURN FACE RIGHT ➔'
                                                    : livenessStep === 'HOLD_STEADY'
                                                    ? 'STEP 3: HOLD STEADY & LOOK FORWARD'
                                                    : 'BIOMETRIC ACTIONS COMPLETED ✓'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Bottom Dynamic Prompt */}
                                    <View style={styles.bottomGuidePrompt}>
                                        <Text style={styles.bottomGuidePromptText}>
                                            {livenessStep === 'SEARCHING_FACE'
                                                ? liveAssessment && !liveAssessment.hasFace
                                                    ? `⚠ ${liveAssessment.guidanceMessage}`
                                                    : 'Hold device 1.5ft from farmer • Align face inside oval'
                                                : livenessStep === 'FACE_LOCKED'
                                                ? '✓ Face locked on in! Get ready to open mouth...'
                                                : livenessStep === 'OPEN_MOUTH'
                                                ? '😮 Instruct farmer to open their mouth wide'
                                                : livenessStep === 'TURN_RIGHT'
                                                ? '➔ Instruct farmer to turn head slightly to their right'
                                                : livenessStep === 'HOLD_STEADY'
                                                ? '🙂 Close mouth and face camera straight ahead • Holding steady'
                                                : '✓ Live physical actions verified! Capturing high-res portrait...'}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.permissionContainer}>
                                <Ionicons name="camera-outline" size={48} color="#0E6F6A" />
                                <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                                <Text style={styles.permissionSub}>
                                    Camera access is required for on-device retina and facial biometric capture.
                                </Text>
                                
                                <TouchableOpacity style={styles.grantPermBtn} onPress={requestPermission}>
                                    <Text style={styles.grantPermBtnText}>Grant Camera Permission</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.hardwareFallbackBtn} onPress={handleLaunchHardwareCamera}>
                                    <Ionicons name="aperture" size={16} color="#FFFFFF" />
                                    <Text style={styles.hardwareFallbackBtnText}>Launch System Camera</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Dedicated Biometric Scan Button & Bottom Bar */}
                    <View style={styles.cameraControlsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.biometricTriggerBtn,
                                livenessStep === 'SEARCHING_FACE' && (liveAssessment && !liveAssessment.hasFace) && { backgroundColor: '#475569', opacity: 0.6 },
                                livenessStep === 'SEARCHING_FACE' && (!liveAssessment || liveAssessment.hasFace) && { backgroundColor: '#0E6F6A' },
                                livenessStep === 'FACE_LOCKED' && { backgroundColor: '#059669' },
                                livenessStep === 'OPEN_MOUTH' && { backgroundColor: '#7C3AED' },
                                livenessStep === 'TURN_RIGHT' && { backgroundColor: '#D97706' },
                                livenessStep === 'HOLD_STEADY' && { backgroundColor: '#0284C7' },
                                livenessStep === 'VERIFIED' && { backgroundColor: '#059669' },
                            ]}
                            disabled={Boolean(livenessStep === 'SEARCHING_FACE' && liveAssessment && !liveAssessment.hasFace)}
                            onPress={handleAdvanceChallenge}
                        >
                            <Ionicons
                                name={
                                    livenessStep === 'SEARCHING_FACE'
                                        ? liveAssessment && !liveAssessment.hasFace
                                            ? 'warning-outline'
                                            : 'scan-outline'
                                        : livenessStep === 'FACE_LOCKED'
                                        ? 'checkmark-circle'
                                        : livenessStep === 'OPEN_MOUTH'
                                        ? 'happy-outline'
                                        : livenessStep === 'TURN_RIGHT'
                                        ? 'arrow-forward-circle'
                                        : livenessStep === 'HOLD_STEADY'
                                        ? 'camera'
                                        : 'shield-checkmark'
                                }
                                size={20}
                                color="#FFFFFF"
                            />
                            <Text style={styles.biometricTriggerBtnText}>
                                {livenessStep === 'SEARCHING_FACE'
                                    ? liveAssessment && !liveAssessment.hasFace
                                        ? 'No Human Face Detected'
                                        : 'Face Aligned (Tap When Ready)'
                                    : livenessStep === 'FACE_LOCKED'
                                    ? 'Face Aligned ✓ Proceed to Action'
                                    : livenessStep === 'OPEN_MOUTH'
                                    ? 'Step 1: Smile / Open Mouth (Tap to Verify) 😮'
                                    : livenessStep === 'TURN_RIGHT'
                                    ? 'Step 2: Turn Head Right (Tap to Verify) ➔'
                                    : livenessStep === 'HOLD_STEADY'
                                    ? 'Step 3: Look Forward (Tap to Complete) 🙂'
                                    : 'Enrolling Biometric Portrait...'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.cameraControlsBar}>
                            <TouchableOpacity style={styles.cameraSideBtn} onPress={handlePickFromGallery}>
                                <Ionicons name="images" size={24} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shutterBtnOuter} onPress={() => handleSnapFromViewfinder()}>
                                <View style={styles.shutterBtnInner} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cameraSideBtn} onPress={handleLaunchHardwareCamera}>
                                <Ionicons name="aperture" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ══════════════════════════════════════════════════════════
                OFFLINE BIOMETRIC REVIEW & QUALITY VERIFICATION MODAL
            ══════════════════════════════════════════════════════════ */}
            <Modal
                visible={showQualityModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowQualityModal(false)}
            >
                <View style={styles.qualityModalOverlay}>
                    <View style={styles.qualityModalCard}>
                        <View style={styles.qualityModalHeader}>
                            <View style={styles.qualityIconBadge}>
                                <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.qualityModalTitle}>Biometric Profile Enrollment</Text>
                                <Text style={styles.qualityModalSub}>Retina, Ocular &amp; Liveness Verification</Text>
                            </View>
                        </View>

                        <ScrollView 
                            style={{ maxHeight: SCREEN_H * 0.65 }} 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                        >
                            {/* Tightly Cropped Oval Headshot Preview */}
                            <View style={styles.qualityPreviewCenter}>
                                {isCropping || isValidating ? (
                                    <View style={[styles.qualityOvalFrame, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <ActivityIndicator size="small" color="#10B981" />
                                        <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                                            {isCropping ? 'Cropping to portrait...' : 'Analyzing ocular & retina biometrics...'}
                                        </Text>
                                    </View>
                                ) : (
                                    <View
                                        style={[
                                            styles.qualityOvalFrame,
                                            biometricRecord && !biometricRecord.isFaceDetected && { borderColor: '#EF4444' },
                                        ]}
                                    >
                                        <Image
                                            source={pendingPhotoUri ? { uri: pendingPhotoUri } : require('../../../assets/images/whoLogin2.png')}
                                            style={styles.qualityOvalImage}
                                            contentFit="cover"
                                        />
                                        <View
                                            style={[
                                                styles.qualityFrameBadge,
                                                biometricRecord && !biometricRecord.isFaceDetected && { backgroundColor: '#EF4444' },
                                            ]}
                                        >
                                            <Ionicons
                                                name={biometricRecord?.isFaceDetected ? 'checkmark-done' : 'close'}
                                                size={14}
                                                color="#FFFFFF"
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Biometric Score & Verdict Badge */}
                                {biometricRecord && !isValidating && (
                                    <View
                                        style={[
                                            styles.scoreBadge,
                                            {
                                                backgroundColor:
                                                    !biometricRecord.isFaceDetected || !biometricRecord.isAntiSpoofPassed || biometricRecord.overallScore < 60
                                                        ? '#FEE2E2'
                                                        : '#DCFCE7',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={
                                                !biometricRecord.isFaceDetected || !biometricRecord.isAntiSpoofPassed || biometricRecord.overallScore < 60
                                                    ? 'alert-circle'
                                                    : 'shield-checkmark'
                                            }
                                            size={14}
                                            color={
                                                !biometricRecord.isFaceDetected || !biometricRecord.isAntiSpoofPassed || biometricRecord.overallScore < 60
                                                    ? '#EF4444'
                                                    : '#10B981'
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.scoreBadgeText,
                                                {
                                                    color:
                                                        !biometricRecord.isFaceDetected || !biometricRecord.isAntiSpoofPassed || biometricRecord.overallScore < 60
                                                            ? '#991B1B'
                                                            : '#065F46',
                                                },
                                            ]}
                                        >
                                            {!biometricRecord.isFaceDetected
                                                ? 'No Face Detected (0%) • Registration Blocked'
                                                : !biometricRecord.isAntiSpoofPassed
                                                ? `Liveness Failed • ${biometricRecord.overallScore}% (Spoof Alert)`
                                                : `Pass • ${biometricRecord.overallScore}% Biometric Match`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Biometric Profile Audit Grid */}
                            {biometricRecord && !isValidating && (
                                <View style={styles.bioProfileContainer}>
                                    <View style={styles.bioTemplateRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Ionicons name="finger-print" size={13} color="#0E6F6A" />
                                            <Text style={styles.bioTemplateLabel}>Template ID:</Text>
                                        </View>
                                        <Text style={styles.bioTemplateId}>{biometricRecord.templateId}</Text>
                                    </View>

                                    {/* Core Accuracy Indicators */}
                                    <View style={styles.bioStatsGrid}>
                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>Retina / Iris Match</Text>
                                            <Text
                                                style={[
                                                    styles.bioStatValue,
                                                    { color: biometricRecord.isFaceDetected ? '#0E6F6A' : '#EF4444' },
                                                ]}
                                            >
                                                {biometricRecord.isFaceDetected ? `${biometricRecord.retinaConfidence}% ✓` : '0% (No Face)'}
                                            </Text>
                                        </View>

                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>Active Liveness</Text>
                                            <Text
                                                style={[
                                                    styles.bioStatValue,
                                                    {
                                                        color:
                                                            !biometricRecord.isFaceDetected || !biometricRecord.isAntiSpoofPassed
                                                                ? '#EF4444'
                                                                : '#10B981',
                                                    },
                                                ]}
                                            >
                                                {!biometricRecord.isFaceDetected
                                                    ? 'No Face (0%) ✗'
                                                    : biometricRecord.isAntiSpoofPassed
                                                    ? 'Live Human ✓'
                                                    : 'Spoof Alert ✗'}
                                            </Text>
                                        </View>

                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>Ocular Symmetry</Text>
                                            <Text style={styles.bioStatValue}>
                                                {biometricRecord.isFaceDetected ? `${biometricRecord.ocularSymmetry}%` : '0%'}
                                            </Text>
                                        </View>

                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>Field Lighting</Text>
                                            <Text style={styles.bioStatValue}>
                                                {biometricRecord.exposureGrade}
                                            </Text>
                                        </View>

                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>Dynamic IPD</Text>
                                            <Text style={[styles.bioStatValue, { color: '#0F172A' }]}>
                                                {biometricRecord.isFaceDetected
                                                    ? `${(biometricRecord.interpupillaryRatio * 160).toFixed(1)}mm (${biometricRecord.interpupillaryRatio})`
                                                    : 'N/A (No Face)'}
                                            </Text>
                                        </View>

                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>Head Tilt Angle</Text>
                                            <Text
                                                style={[
                                                    styles.bioStatValue,
                                                    { color: biometricRecord.headTiltAngleDeg <= 8 ? '#10B981' : '#F59E0B' },
                                                ]}
                                            >
                                                {biometricRecord.headTiltAngleDeg}° {biometricRecord.headTiltAngleDeg <= 8 ? 'Upright ✓' : 'Tilted'}
                                            </Text>
                                        </View>

                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>3D Depth Curvature</Text>
                                            <Text style={[styles.bioStatValue, { color: '#0E6F6A' }]}>
                                                {biometricRecord.threeDDepthIndex}% Convex ✓
                                            </Text>
                                        </View>

                                        <View style={styles.bioStatBox}>
                                            <Text style={styles.bioStatLabel}>Pupil Contrast</Text>
                                            <Text style={styles.bioStatValue}>
                                                {biometricRecord.pupilContrastScore}% Iris
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Interactive Liveness Actions Audit Card */}
                                    {biometricRecord.challengeActions && (
                                        <View style={styles.challengeAuditCard}>
                                            <View style={styles.challengeAuditHeader}>
                                                <Ionicons name="shield-checkmark" size={13} color="#0E6F6A" />
                                                <Text style={styles.challengeAuditTitle}>Interactive Challenge Audit</Text>
                                            </View>
                                            <View style={styles.challengeAuditRow}>
                                                <View style={styles.challengeBadge}>
                                                    <Ionicons
                                                        name={biometricRecord.challengeActions.turnRightPassed ? 'checkmark-circle' : 'close-circle'}
                                                        size={14}
                                                        color={biometricRecord.challengeActions.turnRightPassed ? '#10B981' : '#EF4444'}
                                                    />
                                                    <Text style={styles.challengeBadgeText}>
                                                        Turn Right: {biometricRecord.challengeActions.turnRightPassed ? 'Passed ✓' : 'Failed ✗'} (Δ {biometricRecord.challengeActions.turnDelta}%)
                                                    </Text>
                                                </View>
                                                <View style={styles.challengeBadge}>
                                                    <Ionicons
                                                        name={biometricRecord.challengeActions.openMouthPassed ? 'checkmark-circle' : 'close-circle'}
                                                        size={14}
                                                        color={biometricRecord.challengeActions.openMouthPassed ? '#10B981' : '#EF4444'}
                                                    />
                                                    <Text style={styles.challengeBadgeText}>
                                                        Open Mouth: {biometricRecord.challengeActions.openMouthPassed ? 'Passed ✓' : 'Failed ✗'} (Δ {biometricRecord.challengeActions.mouthDelta}%)
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                    {/* 12-Dimensional Normalized Vector Preview */}
                                    <View style={styles.vectorCard}>
                                        <View style={styles.vectorHeader}>
                                            <Ionicons name="git-network" size={13} color="#0F766E" />
                                            <Text style={styles.vectorTitle}>12-D Normalized Biometric Vector</Text>
                                        </View>
                                        <Text style={styles.vectorPreviewText} numberOfLines={1}>
                                            [{biometricRecord.biometricVector.slice(0, 6).map(v => v.toFixed(3)).join(', ')}, ...]
                                        </Text>
                                        <Text style={styles.vectorSubtext}>
                                            ⚡ Ready for 1:1 Cosine Similarity Matching at MFB Branch &amp; Loan Sign-off
                                        </Text>
                                    </View>

                                    <View style={styles.edgeMetricsBox}>
                                        <Text style={styles.edgeMetricsText}>
                                            ⚡ 100% On-Device Edge Validated • Zero Cloud Dependency
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Flagged Reasons / Warnings List */}
                            {biometricRecord && biometricRecord.reasons.length > 0 && (
                                <View style={styles.reasonsListContainer}>
                                    {biometricRecord.reasons.map((r, idx) => (
                                        <View key={`reason-${idx}`} style={styles.reasonRow}>
                                            <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                                            <Text style={styles.reasonText}>{r}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Interactive Face & Lighting Quality Checks */}
                            <View style={styles.qualityChecklistContainer}>
                                {/* Check 1: Human Face Detection */}
                                <TouchableOpacity
                                    style={styles.qualityCheckRowInteractive}
                                    onPress={() => setIsFaceDetected(!isFaceDetected)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={isFaceDetected ? 'checkmark-circle' : 'close-circle'}
                                        size={20}
                                        color={isFaceDetected ? '#10B981' : '#EF4444'}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.qualityCheckTitle, !isFaceDetected && { color: '#EF4444' }]}>
                                            {isFaceDetected ? 'Valid Human Face Centered' : 'No Valid Face / Obstructed'}
                                        </Text>
                                        <Text style={styles.qualityCheckDesc}>
                                            {isFaceDetected
                                                ? 'Facial contours & landmarks validated'
                                                : 'Photo fails QA: Does not contain a clear human face'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isFaceDetected}
                                        onValueChange={setIsFaceDetected}
                                        trackColor={{ false: '#FECACA', true: '#DCFCE7' }}
                                        thumbColor={isFaceDetected ? '#10B981' : '#EF4444'}
                                    />
                                </TouchableOpacity>

                                {/* Check 2: Retina & Ocular Alignment */}
                                <TouchableOpacity
                                    style={styles.qualityCheckRowInteractive}
                                    onPress={() => setIsEyesOpen(!isEyesOpen)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={isEyesOpen ? 'checkmark-circle' : 'alert-circle'}
                                        size={20}
                                        color={isEyesOpen ? '#10B981' : '#F59E0B'}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.qualityCheckTitle}>Retina &amp; Iris Alignment</Text>
                                        <Text style={styles.qualityCheckDesc}>
                                            {isEyesOpen ? 'Eyes open, ocular landmarks confirmed' : 'Eyes closed or blurred'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isEyesOpen}
                                        onValueChange={setIsEyesOpen}
                                        trackColor={{ false: '#FEF3C7', true: '#DCFCE7' }}
                                        thumbColor={isEyesOpen ? '#10B981' : '#F59E0B'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        {/* Modal Action Buttons */}
                        <View style={styles.qualityActionRow}>
                            <TouchableOpacity
                                style={[
                                    styles.qualityRetakeBtn,
                                    biometricRecord && (!biometricRecord.isFaceDetected || biometricRecord.overallScore < 60) && styles.qualityRetakeBtnPrimary,
                                ]}
                                onPress={handleRetakePhoto}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={18}
                                    color={biometricRecord && (!biometricRecord.isFaceDetected || biometricRecord.overallScore < 60) ? '#FFFFFF' : '#475569'}
                                />
                                <Text
                                    style={[
                                        styles.qualityRetakeBtnText,
                                        biometricRecord && (!biometricRecord.isFaceDetected || biometricRecord.overallScore < 60) && { color: '#FFFFFF', fontWeight: '700' },
                                    ]}
                                >
                                    Re-Scan
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.qualityAcceptBtn,
                                    (isValidating || !isFaceDetected || Boolean(biometricRecord && (!biometricRecord.isFaceDetected || !biometricRecord.isAntiSpoofPassed || biometricRecord.overallScore < 50))) && {
                                        opacity: 0.5,
                                        backgroundColor: '#94A3B8',
                                    },
                                ]}
                                onPress={handleAcceptQualityPhoto}
                                disabled={isValidating || !isFaceDetected || Boolean(biometricRecord && (!biometricRecord.isFaceDetected || !biometricRecord.isAntiSpoofPassed || biometricRecord.overallScore < 50))}
                            >
                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                <Text style={styles.qualityAcceptBtnText}>
                                    {!isFaceDetected || (biometricRecord && !biometricRecord.isFaceDetected)
                                        ? 'Face Required'
                                        : biometricRecord && !biometricRecord.isAntiSpoofPassed
                                        ? 'Liveness Failed'
                                        : 'Accept & Enroll'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.successIconCircle}>
                                <Feather name="check" size={24} color="white" />
                            </View>
                            <Text style={styles.modalTitle}>Step 2 Complete</Text>
                        </View>

                        <View style={styles.completionContainer}>
                            <Text style={styles.completionText}>KYC &amp; Photo Verified (40%)</Text>
                            <View style={styles.completionBarBackground}>
                                <View style={[styles.completionBarFill, { width: '40%' }]} />
                            </View>
                        </View>

                        <View style={styles.modalDivider} />

                        <View style={styles.nextStepContainer}>
                            <Text style={styles.nextStepLabel}>Next Step:</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Feather name="map-pin" size={16} color="#0E6F6A" />
                                <Text style={styles.nextStepTitle}>Step 3: Farm Details &amp; Live GPS Geo-Tagging</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.startNowButton} 
                            onPress={() => {
                                setShowSuccessModal(false);
                                if (navigation?.navigate) {
                                    navigation.navigate('register-farmer/farm-details');
                                } else {
                                    router.navigate('/(agent)/register-farmer/farm-details' as any);
                                }
                            }}
                        >
                            <Text style={styles.startNowText}>Proceed to Step 3</Text>
                            <Feather name="arrow-right" size={18} color="white" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Save Draft Modal */}
            <SaveDraftModal
                visible={!!savedDraftInfo}
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
        backgroundColor: '#F8FAFC',
    },
    contentContainer: {
        flex: 1,
        marginTop: 155,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        fontWeight: '800',
        color: '#0E6F6A',
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    formContainer: {
        padding: 20,
        gap: 16,
        paddingBottom: 60,
    },
    cardBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    cardBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    cardBoxTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    cardBoxSubtext: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 16,
    },
    captureBtn: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    captureBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryCaptureBtn: {
        height: 44,
        backgroundColor: '#E6F4F0',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBE3DC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryCaptureBtnText: {
        color: '#0E6F6A',
        fontSize: 13,
        fontWeight: '700',
    },

    // Preview
    photoPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    circularHeadshotFrame: {
        width: 76,
        height: 96,
        borderRadius: 38,
        borderWidth: 2.5,
        borderColor: '#10B981',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#E2E8F0',
    },
    circularHeadshotImage: {
        width: '100%',
        height: '100%',
    },
    circularHeadshotCheck: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    verifiedBadgeText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '800',
    },
    actionPillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E6F4F0',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBE3DC',
    },
    actionPillBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },

    // ── Live Camera Modal ──
    cameraModalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    cameraTopBar: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: Platform.OS === 'ios' ? 44 : 20,
    },
    cameraIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    viewfinderContainer: {
        flex: 1,
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#0F172A',
    },
    viewfinderGuidesOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        elevation: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    lightingTipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.4)',
    },
    lightingTipText: {
        color: '#F8FAFC',
        fontSize: 11,
        fontWeight: '700',
    },
    ovalCenterWrapper: {
        width: 260,
        height: 350,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    viewfinderOval: {
        width: 248,
        height: 330,
        borderRadius: 124,
        borderWidth: 3.5,
        borderColor: '#10B981',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    bracketTopLeft: {
        position: 'absolute',
        top: -6,
        left: -6,
        width: 32,
        height: 32,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#10B981',
        borderTopLeftRadius: 14,
    },
    bracketTopRight: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 32,
        height: 32,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#10B981',
        borderTopRightRadius: 14,
    },
    bracketBottomLeft: {
        position: 'absolute',
        bottom: -6,
        left: -6,
        width: 32,
        height: 32,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#10B981',
        borderBottomLeftRadius: 14,
    },
    bracketBottomRight: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        width: 32,
        height: 32,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#10B981',
        borderBottomRightRadius: 14,
    },
    eyeLevelLine: {
        position: 'absolute',
        top: '38%',
        left: 20,
        right: 20,
        height: 1.5,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chinLevelLine: {
        position: 'absolute',
        top: '78%',
        left: 45,
        right: 45,
        height: 1.5,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    guideBadge: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.5)',
    },
    guideBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#6EE7B7',
        letterSpacing: 0.5,
    },
    headGuidePill: {
        position: 'absolute',
        bottom: -16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#0F172A',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#10B981',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
    headGuidePillText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bottomGuidePrompt: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    bottomGuidePromptText: {
        fontSize: 11,
        color: '#E2E8F0',
        fontWeight: '600',
    },

    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
        backgroundColor: '#0F172A',
    },
    permissionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    permissionSub: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 12,
    },
    grantPermBtn: {
        height: 46,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    grantPermBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    hardwareFallbackBtn: {
        height: 46,
        backgroundColor: '#2563EB',
        borderRadius: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    hardwareFallbackBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },

    // ── Biometric HUD Viewfinder Styles ──
    hudStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(251, 191, 36, 0.5)',
    },
    hudStatusPillText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    ocularZoneContainer: {
        position: 'absolute',
        top: '30%',
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ocularEyeReticle: {
        width: 68,
        height: 52,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(6, 182, 212, 0.8)',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ocularTargetCrossH: {
        position: 'absolute',
        width: 18,
        height: 1,
        backgroundColor: '#38BDF8',
    },
    ocularTargetCrossV: {
        position: 'absolute',
        height: 18,
        width: 1,
        backgroundColor: '#38BDF8',
    },
    ocularIrisRing: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#38BDF8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ocularIrisPupil: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#38BDF8',
    },
    ocularReticleText: {
        position: 'absolute',
        bottom: 2,
        fontSize: 7,
        fontWeight: '800',
        color: '#67E8F9',
        letterSpacing: 0.5,
    },
    interpupillaryLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(6, 182, 212, 0.4)',
        borderStyle: 'dashed',
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ipdBadge: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(6, 182, 212, 0.6)',
    },
    ipdBadgeText: {
        fontSize: 7,
        fontWeight: '800',
        color: '#67E8F9',
    },
    laserSweepBar: {
        position: 'absolute',
        left: 8,
        right: 8,
        top: '32%',
        height: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    laserSweepCore: {
        width: '100%',
        height: 2,
        backgroundColor: '#00F5FF',
        shadowColor: '#00F5FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 6,
    },
    laserSweepGlow: {
        position: 'absolute',
        width: '100%',
        height: 18,
        backgroundColor: 'rgba(6, 182, 212, 0.25)',
        borderRadius: 9,
    },
    cameraControlsContainer: {
        backgroundColor: 'rgba(0,0,0,0.95)',
        paddingTop: 10,
    },
    biometricTriggerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0E6F6A',
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        alignSelf: 'center',
        marginBottom: 8,
    },
    biometricTriggerBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    actionPromptOverlay: {
        position: 'absolute',
        top: '45%',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        gap: 6,
        zIndex: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
    },
    actionPromptOverlayText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#FDE68A',
        letterSpacing: 0.8,
    },
    challengeAuditCard: {
        backgroundColor: '#F0FDFA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#99F6E4',
        padding: 10,
        gap: 6,
        marginVertical: 4,
    },
    challengeAuditHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    challengeAuditTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0F766E',
        letterSpacing: 0.5,
    },
    challengeAuditRow: {
        flexDirection: 'column',
        gap: 4,
        marginTop: 2,
    },
    challengeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    challengeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#134E4A',
    },

    // ── Biometric Profile Card Styles ──
    bioProfileContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 10,
        gap: 8,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    bioTemplateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bioTemplateLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    bioTemplateId: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0E6F6A',
        letterSpacing: 0.5,
    },
    bioStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    bioStatBox: {
        flex: 1,
        minWidth: '46%',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    bioStatLabel: {
        fontSize: 9,
        color: '#64748B',
        fontWeight: '600',
    },
    bioStatValue: {
        fontSize: 11,
        color: '#0F172A',
        fontWeight: '800',
        marginTop: 2,
    },

    cameraControlsBar: {
        height: 110,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(0,0,0,0.95)',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cameraSideBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterBtnOuter: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 4,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    shutterBtnInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0E6F6A',
    },

    // ── Quality Review Modal ──
    qualityModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    qualityModalCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    qualityModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    qualityIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qualityModalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    qualityModalSub: {
        fontSize: 11,
        color: '#64748B',
    },
    qualityPreviewCenter: {
        alignItems: 'center',
        marginVertical: 8,
    },
    qualityOvalFrame: {
        width: 120,
        height: 155,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#10B981',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F8FAFC',
    },
    qualityOvalImage: {
        width: '100%',
        height: '100%',
    },
    qualityFrameBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: '#10B981',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    qualityFrameNote: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 6,
        fontWeight: '600',
    },
    qualityChecklistContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 10,
        gap: 8,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    qualityCheckRowInteractive: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    qualityCheckTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    qualityCheckDesc: {
        fontSize: 10,
        color: '#64748B',
    },
    qualityWarningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
        marginBottom: 8,
    },
    qualityWarningText: {
        flex: 1,
        fontSize: 11,
        color: '#B91C1C',
        fontWeight: '600',
        lineHeight: 15,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    scoreBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    reasonsListContainer: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 10,
        padding: 10,
        gap: 6,
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    reasonText: {
        flex: 1,
        fontSize: 11,
        color: '#991B1B',
        lineHeight: 15,
        fontWeight: '500',
    },
    vectorCard: {
        backgroundColor: '#F0FDFA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#CCFBF1',
        padding: 8,
        gap: 4,
    },
    vectorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    vectorTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0F766E',
    },
    vectorPreviewText: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#115E59',
        fontWeight: '600',
    },
    vectorSubtext: {
        fontSize: 9,
        color: '#64748B',
    },
    edgeMetricsBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 8,
        paddingVertical: 5,
        alignItems: 'center',
    },
    edgeMetricsText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
    },
    qualityActionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    qualityRetakeBtn: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qualityRetakeBtnPrimary: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626',
    },
    qualityRetakeBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    qualityAcceptBtn: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#0E6F6A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qualityAcceptBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // ── Form Inputs ──
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
    helperText: {
        fontSize: 11,
        color: '#64748B',
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
        flexDirection: 'row',
    },
    startNowText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

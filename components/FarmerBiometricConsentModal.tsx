import React, { useState, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Rect, Ellipse, Mask, Defs } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import { useTheme } from '../context/ThemeContext';
import { 
    BiometricStorageService, 
    FaceMatchingService, 
    LivenessDetectionService, 
    FarmerConsentService,
    FarmerInputConsentRecord 
} from '../services/biometrics';
import { analyzeBiometricPortrait } from '../services/biometricService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ConsentItem {
    name: string;
    qty: number;
    unit: string;
}

interface FarmerBiometricConsentModalProps {
    visible: boolean;
    onClose: () => void;
    farmerId: string;
    farmerName: string;
    groupName: string;
    totalAmount: number;
    items: ConsentItem[];
    onConsentAffirmed: (consentRecord: FarmerInputConsentRecord) => void;
}

export default function FarmerBiometricConsentModal({
    visible,
    onClose,
    farmerId,
    farmerName,
    groupName,
    totalAmount,
    items,
    onConsentAffirmed,
}: FarmerBiometricConsentModalProps) {
    const { colors, isDarkMode } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    // Flow State: 'DISCLOSURE' -> 'CAMERA_SCAN' -> 'VERIFIED_REVIEW'
    const [flowStep, setFlowStep] = useState<'DISCLOSURE' | 'CAMERA_SCAN' | 'VERIFIED_REVIEW'>('DISCLOSURE');
    const [isScanning, setIsScanning] = useState(false);
    const [affirmationChecked, setAffirmationChecked] = useState(false);
    const [submittingConsent, setSubmittingConsent] = useState(false);

    // Verification outcomes
    const [verificationOutcome, setVerificationOutcome] = useState<{
        matchScore: number;
        isMatch: boolean;
        similarity: number;
        livenessScore: number;
        isLive: boolean;
        sessionId: string;
    } | null>(null);

    // Laser Animation
    const laserAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setFlowStep('DISCLOSURE');
            setVerificationOutcome(null);
            setAffirmationChecked(false);
            setSubmittingConsent(false);
        }
    }, [visible]);

    const startLaser = () => {
        laserAnim.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(laserAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(laserAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const handleStartBiometricVerification = async () => {
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                toast.error('Camera permission is required for farmer identity verification.');
                return;
            }
        }
        setFlowStep('CAMERA_SCAN');
        startLaser();
    };

    const handleCaptureAndVerify = async () => {
        if (!cameraRef.current || isScanning) return;
        setIsScanning(true);

        try {
            // 1. Capture verification photo
            const snap = await cameraRef.current.takePictureAsync({
                quality: 0.85,
                skipProcessing: false,
            });

            if (!snap?.uri) {
                toast.error('Camera failed to capture frame. Please retry.');
                setIsScanning(false);
                return;
            }

            // 2. Fetch enrolled biometric template from secure store
            const enrolledTemplate = await BiometricStorageService.getTemplateByFarmerId(farmerId);
            const targetVector = enrolledTemplate?.embedding || null;

            if (!targetVector || targetVector.length === 0) {
                toast.error(`No biometric template enrolled on this device for ${farmerName}. Complete KYC enrollment first.`);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setIsScanning(false);
                return;
            }

            // 3. Extract live biometric record (MobileFaceNet 128-d vector)
            const liveRecord = await analyzeBiometricPortrait(snap.uri, snap.width || 720, snap.height || 960);

            // 4. Compute 1:1 Cosine Similarity Match
            const matchResult = FaceMatchingService.verifyMatch(liveRecord.biometricVector, targetVector);

            // 5. Evaluate Presentation-Attack Detection (Liveness)
            const livenessResult = await LivenessDetectionService.assessLiveness(snap.uri);

            const sessionId = `BIO-SESS-${Date.now()}`;

            setVerificationOutcome({
                matchScore: matchResult.matchConfidence,
                isMatch: matchResult.isMatch,
                similarity: matchResult.similarity,
                livenessScore: livenessResult.livenessScore,
                isLive: livenessResult.isLive,
                sessionId,
            });

            if (matchResult.isMatch && livenessResult.isLive) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toast.success(`Biometrics Confirmed (${matchResult.matchConfidence}% Match)`);
                setFlowStep('VERIFIED_REVIEW');
            } else if (!matchResult.isMatch) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                toast.error('Identity mismatch: Face does not match enrolled farmer.');
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                toast.error('Liveness check flagged potential presentation attack.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            toast.error('Biometric verification error. Please retry.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleAffirmAndSubmit = async () => {
        if (!verificationOutcome || !verificationOutcome.isMatch || !verificationOutcome.isLive) {
            toast.error('Biometric verification must pass before recording consent.');
            return;
        }

        if (!affirmationChecked) {
            toast.error('Please tap the checkmark to affirm farmer consent.');
            return;
        }

        setSubmittingConsent(true);
        try {
            const consentRecord = await FarmerConsentService.recordConsent({
                farmerId,
                farmerName,
                inputRequestId: `REQ-${Date.now()}`,
                groupName,
                amountRequested: totalAmount,
                allocatedItems: items,
                verificationSessionId: verificationOutcome.sessionId,
                match: {
                    isMatch: verificationOutcome.isMatch,
                    verdict: 'MATCH',
                    similarity: verificationOutcome.similarity,
                    matchConfidence: verificationOutcome.matchScore,
                    threshold: 0.65,
                    reasons: ['MobileFaceNet 1:1 Cosine match confirmed.'],
                    testedAt: new Date().toISOString(),
                },
                liveness: {
                    isLive: verificationOutcome.isLive,
                    verdict: 'PASSED',
                    livenessScore: verificationOutcome.livenessScore,
                    reasons: ['Zero-shot presentation attack detection passed.'],
                },
                consentAffirmed: true,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success('Farmer consent & biometric proof secured offline!');
            onConsentAffirmed(consentRecord);
            onClose();
        } catch (err: any) {
            console.error('Consent submission error:', err);
            toast.error(err.message || 'Failed to record consent.');
        } finally {
            setSubmittingConsent(false);
        }
    };

    const formattedAmount = '₦' + Number(totalAmount).toLocaleString('en-NG');

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconContainer}>
                            <Ionicons name="finger-print-outline" size={24} color="#0E6F6A" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Farmer Biometric Consent</Text>
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                {groupName} • {farmerName}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* STEP 1: DISCLOSURE */}
                    {flowStep === 'DISCLOSURE' && (
                        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.requisitionSummaryBox}>
                                <Text style={styles.summaryLabel}>Total Input Requisition Value</Text>
                                <Text style={styles.summaryAmount}>{formattedAmount}</Text>
                            </View>

                            <Text style={[styles.sectionHeading, { color: colors.text }]}>Allocated Inputs:</Text>
                            <View style={[styles.itemsListContainer, { borderColor: colors.border }]}>
                                {items.map((item, idx) => (
                                    <View key={idx} style={[styles.itemRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={[styles.itemQty, { color: colors.primary }]}>{item.qty} {item.unit}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.complianceNotice}>
                                <Ionicons name="shield-checkmark" size={18} color="#0E6F6A" style={{ marginTop: 2 }} />
                                <Text style={styles.complianceText}>
                                    Regulatory Requirement: Under MTG microfinance rules, each farmer must complete an on-device facial verification and provide affirmative consent prior to input disbursement.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={handleStartBiometricVerification}
                            >
                                <Ionicons name="camera-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.primaryBtnText}>Verify Farmer Face & Liveness</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}

                    {/* STEP 2: CAMERA SCAN */}
                    {flowStep === 'CAMERA_SCAN' && (
                        <View style={styles.cameraWrapper}>
                            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

                            {/* Oval Reticle SVG Mask */}
                            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                                <Defs>
                                    <Mask id="reticleMask">
                                        <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                                        <Ellipse cx={SCREEN_W * 0.44} cy="150" rx="100" ry="130" fill="black" />
                                    </Mask>
                                </Defs>
                                <Rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#reticleMask)" />
                                <Ellipse
                                    cx={SCREEN_W * 0.44}
                                    cy="150"
                                    rx="100"
                                    ry="130"
                                    stroke="#0E6F6A"
                                    strokeWidth="3"
                                    strokeDasharray="6,4"
                                    fill="none"
                                />
                            </Svg>

                            {/* Animated Laser Scanning Line */}
                            <Animated.View
                                style={[
                                    styles.laserLine,
                                    {
                                        transform: [
                                            {
                                                translateY: laserAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [30, 270],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            />

                            <View style={styles.cameraOverlayControls}>
                                <Text style={styles.cameraGuidanceText}>Position farmer's face inside the oval</Text>

                                <TouchableOpacity
                                    style={[styles.captureBtn, isScanning && { opacity: 0.6 }]}
                                    onPress={handleCaptureAndVerify}
                                    disabled={isScanning}
                                >
                                    {isScanning ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <View style={styles.captureInnerCircle} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* STEP 3: VERIFIED REVIEW & AFFIRMATIVE CONSENT */}
                    {flowStep === 'VERIFIED_REVIEW' && verificationOutcome && (
                        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                            {/* Verification Badge */}
                            <View style={styles.verificationBadge}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.badgeTitle}>Biometric Verification Successful</Text>
                                    <Text style={styles.badgeSubtitle}>
                                        Match Confidence: {verificationOutcome.matchScore}% • Liveness: {verificationOutcome.livenessScore}%
                                    </Text>
                                </View>
                            </View>

                            {/* Explicit Consent Declaration */}
                            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 16 }]}>
                                Affirmative Consent Disclosure:
                            </Text>
                            <View style={[styles.consentWordingCard, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.consentWordingText, { color: colors.text }]}>
                                    {FarmerConsentService.getConsentWording(farmerName, groupName, totalAmount)}
                                </Text>
                            </View>

                            {/* Checkbox Affirmation */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                activeOpacity={0.8}
                                onPress={() => setAffirmationChecked(!affirmationChecked)}
                            >
                                <View style={[styles.checkbox, affirmationChecked && styles.checkboxActive]}>
                                    {affirmationChecked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                                </View>
                                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                                    The farmer has heard this disclosure, confirmed the requested items, and gave explicit affirmative consent.
                                </Text>
                            </TouchableOpacity>

                            {/* Submit Consent Button */}
                            <TouchableOpacity
                                style={[
                                    styles.primaryBtn,
                                    (!affirmationChecked || submittingConsent) && { opacity: 0.5 },
                                    { marginTop: 20 },
                                ]}
                                onPress={handleAffirmAndSubmit}
                                disabled={!affirmationChecked || submittingConsent}
                            >
                                {submittingConsent ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.primaryBtnText}>Affirm Consent & Authorize Inputs</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_H * 0.88,
        paddingBottom: 32,
        borderWidth: 1,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    headerIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: 'rgba(14, 111, 106, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
    },
    contentScroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    requisitionSummaryBox: {
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryLabel: {
        color: '#E0F2F1',
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryAmount: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
        marginTop: 4,
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    itemsListContainer: {
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '500',
    },
    itemQty: {
        fontSize: 13,
        fontWeight: '700',
    },
    complianceNotice: {
        flexDirection: 'row',
        backgroundColor: 'rgba(14, 111, 106, 0.08)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        gap: 10,
    },
    complianceText: {
        flex: 1,
        fontSize: 12,
        color: '#0E6F6A',
        lineHeight: 18,
    },
    primaryBtn: {
        height: 52,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#0E6F6A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    cameraWrapper: {
        height: 380,
        position: 'relative',
        overflow: 'hidden',
    },
    laserLine: {
        position: 'absolute',
        left: SCREEN_W * 0.44 - 90,
        width: 180,
        height: 2,
        backgroundColor: '#0E6F6A',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 6,
    },
    cameraOverlayControls: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    cameraGuidanceText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    captureBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInnerCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#0E6F6A',
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    badgeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#065F46',
    },
    badgeSubtitle: {
        fontSize: 12,
        color: '#047857',
        marginTop: 2,
    },
    consentWordingCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    consentWordingText: {
        fontSize: 13,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 16,
        gap: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxActive: {
        backgroundColor: '#0E6F6A',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});

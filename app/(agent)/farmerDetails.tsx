import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import Svg, { Rect, Ellipse, Mask, Defs } from 'react-native-svg';
import { analyzeBiometricPortrait, verifyBiometricMatch, quickAssessFrame } from '../../services/biometricService';
import { BiometricStorageService } from '../../services/biometrics/BiometricStorageService';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import VcmScorecardCard from '../../components/ui/VcmScorecardCard';
import { useTheme } from '../../context/ThemeContext';
import { useFarmer } from '../../hooks/api/useFarmers';
import { useCroppingSystems } from '../../hooks/api/useReports';
import { useMe } from '../../hooks/api/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/apiClient';
import { geoService } from '../../services/geoService';
import { vcmActivityService, CompletedActivityRecord } from '../../services/vcmActivityService';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width } = Dimensions.get('window');

const TABS = ['Overview', 'Farms', 'Tasks', 'Activity', 'Notes'];

export default function FarmerDetailsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    
    const params = useLocalSearchParams<{ id?: string; ts?: string }>();
    const id = params.id;
    const { data: dbFarmer } = useFarmer(id || '');
    const { data: dbCroppingSystems } = useCroppingSystems();
    const { data: meData } = useMe();
    const currentAgentName = meData?.staff?.fullName || meData?.staff?.firstName || 'Assigned Officer';

    const farmerName = dbFarmer ? (dbFarmer.fullName || dbFarmer.name) : "—";
    const farmerInitials = useMemo(() => {
        if (!farmerName || farmerName === '—') return "FR";
        return farmerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }, [farmerName]);
    const farmerIdCode = dbFarmer ? `FARM-${dbFarmer.id.slice(0, 6).toUpperCase()}` : "—";
    const farmerAddress = dbFarmer ? (dbFarmer.address || "—") : "—";
    const farmerLocation = dbFarmer 
        ? geoService.formatLocationString(
            dbFarmer.location?.community || dbFarmer.community || dbFarmer.metadata?.community,
            dbFarmer.location?.state?.name || dbFarmer.metadata?.stateName
        )
        : "—";
    const farmerPhone = dbFarmer ? (dbFarmer.phone || "—") : "—";

    const [farms, setFarms] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [loadingFarms, setLoadingFarms] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    // ── 1:1 Biometric Verification States ──
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [showBiometricModal, setShowBiometricModal] = useState(false);
    const [isBiometricScanning, setIsBiometricScanning] = useState(false);
    const [verifyCameraFacing, setVerifyCameraFacing] = useState<'front' | 'back'>('front');
    const verifyCameraRef = useRef<any>(null);
    const [verificationResult, setVerificationResult] = useState<{
        isMatch: boolean;
        confidence: number;
        similarity: number;
        testedAt: string;
        message: string;
    } | null>(null);

    const enrolledBiometrics = useMemo(() => {
        return dbFarmer?.metadata?.facial_biometrics || dbFarmer?.metadata?.facialBiometrics || null;
    }, [dbFarmer]);

    const enrolledPhotoUri = useMemo(() => {
        return enrolledBiometrics?.photoUri || dbFarmer?.metadata?.photo_uri || (dbFarmer as any)?.photo_uri || null;
    }, [enrolledBiometrics, dbFarmer]);

    const handlePerform1to1Verification = async () => {
        if (!verifyCameraRef.current) return;
        setIsBiometricScanning(true);
        setVerificationResult(null);

        try {
            const snap = await verifyCameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
            if (!snap?.uri) {
                toast.error('Failed to capture camera frame');
                setIsBiometricScanning(false);
                return;
            }

            // 1. Edge pre-assessment (reject walls, tables, inanimate surfaces)
            const assessment = await quickAssessFrame(snap.uri);
            if (!assessment.hasFace) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                toast.error('No human face detected. Center the farmer in the oval.');
                setVerificationResult({
                    isMatch: false,
                    confidence: 0,
                    similarity: 0,
                    testedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    message: 'Inanimate surface or background detected. Center a real face.',
                });
                setIsBiometricScanning(false);
                return;
            }

            // 2. Extract live 12-point biometric feature vector
            const liveRecord = await analyzeBiometricPortrait(snap.uri, snap.width || 720, snap.height || 960);
            if (!liveRecord.isFaceDetected) {
                toast.error(liveRecord.reasons[0] || 'Face not clear. Hold steady.');
                setVerificationResult({
                    isMatch: false,
                    confidence: 0,
                    similarity: 0,
                    testedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    message: liveRecord.reasons[0] || 'Face not clear or off-center.',
                });
                setIsBiometricScanning(false);
                return;
            }

            // 3. Resolve target reference vector
            let targetVector: number[] | null = enrolledBiometrics?.biometricVector || null;
            if (!targetVector && params.id) {
                const storedTemplate = await BiometricStorageService.getTemplateByFarmerId(params.id);
                if (storedTemplate && storedTemplate.embedding && storedTemplate.embedding.length > 0) {
                    targetVector = storedTemplate.embedding;
                }
            }
            if (!targetVector && enrolledPhotoUri) {
                const baselineRecord = await analyzeBiometricPortrait(enrolledPhotoUri);
                targetVector = baselineRecord.biometricVector;
                if (params.id && targetVector) {
                    BiometricStorageService.saveTemplate({
                        templateId: baselineRecord.templateId,
                        farmerId: params.id,
                        version: 'MFN-128-V1',
                        embedding: targetVector,
                        enrolledAt: baselineRecord.timestamp,
                        photoUri: enrolledPhotoUri,
                        quality: {
                            brightness: baselineRecord.metrics.brightness,
                            isCentered: true,
                            rollTiltAngleDeg: baselineRecord.headTiltAngleDeg,
                            faceCoverageRatio: 0.5,
                            isSingleFace: true,
                            exposureGrade: baselineRecord.exposureGrade,
                            faceCount: 1,
                            isQualityPassed: true,
                            guidance: 'Optimal biometric facial capture',
                        },
                        auditSignature: baselineRecord.auditSignature,
                    }).catch(err => console.warn('Auto-caching baseline template failed:', err));
                }
            }

            if (!targetVector || targetVector.length === 0) {
                toast.error('No enrolled biometric template found for this farmer.');
                setVerificationResult({
                    isMatch: false,
                    confidence: 0,
                    similarity: 0,
                    testedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    message: 'No enrolled biometric baseline. Please register farmer KYC first.',
                });
                setIsBiometricScanning(false);
                return;
            }

            // 4. Liveness Gate Enforcement (Presentation Attack Detection)
            if (!liveRecord.isAntiSpoofPassed) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                toast.error('Liveness check failed: ' + (liveRecord.reasons[0] || 'Potential spoof detected.'));
                setVerificationResult({
                    isMatch: false,
                    confidence: 0,
                    similarity: 0,
                    testedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    message: 'Liveness check failed. Live human presence required (photo/screen replays rejected).',
                });
                return;
            }

            // 5. Run 1:1 Cosine Similarity Match
            const matchVerdict = verifyBiometricMatch(liveRecord.biometricVector, targetVector);
            
            if (matchVerdict.verdict === 'MATCH') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toast.success(`Identity Confirmed (${matchVerdict.matchConfidence}% Match)`);
            } else if (matchVerdict.verdict === 'INCONCLUSIVE') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                toast.warning(`Inconclusive Match (${matchVerdict.matchConfidence}%). Adjust lighting and retry.`);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                toast.error(`Identity Mismatch (${matchVerdict.matchConfidence}% Match)`);
            }

            setVerificationResult({
                isMatch: matchVerdict.isMatch,
                confidence: matchVerdict.matchConfidence,
                similarity: matchVerdict.cosineSimilarity,
                testedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                message: matchVerdict.reasons[0] || (matchVerdict.isMatch
                    ? `Biometric signature matches registered identity for ${farmerName}.`
                    : `Facial geometry mismatch. Person does not match enrolled profile.`),
            });
        } catch (err: any) {
            console.warn('Verification error:', err);
            toast.error('Verification error: ' + (err?.message || 'Check camera'));
        } finally {
            setIsBiometricScanning(false);
        }
    };

    // ── Interactive Field Operations States (Default to 'Not Started' for new farmers) ──
    const [currentStage, setCurrentStage] = useState<string>(
        dbFarmer?.metadata?.currentCropStage || 'Not Started'
    );
    const [activities, setActivities] = useState<any[]>(
        Array.isArray(dbFarmer?.metadata?.activities) ? dbFarmer.metadata.activities : []
    );
    const [notes, setNotes] = useState<any[]>(
        Array.isArray(dbFarmer?.metadata?.notes) ? dbFarmer.metadata.notes : []
    );
    const [pictures, setPictures] = useState<Array<{ id: string; uri: string; date: string; stage: string }>>(
        Array.isArray(dbFarmer?.metadata?.photos) ? dbFarmer.metadata.photos : []
    );
    const [farmerActivities, setFarmerActivities] = useState<CompletedActivityRecord[]>([]);

    const stateName = dbFarmer?.location?.state?.name || 'Kaduna';
    const activeTemplate = useMemo(() => {
        if (!dbCroppingSystems || !Array.isArray(dbCroppingSystems)) return null;
        return dbCroppingSystems.find((s: any) => 
            s?.state && typeof s.state === 'string' && s.state.toLowerCase().trim() === stateName.toLowerCase().trim()
        );
    }, [dbCroppingSystems, stateName]);
    const activeOption = useMemo(() => {
        const optionId = dbFarmer?.metadata?.plantingCalendarOptionId;
        if (optionId && activeTemplate?.options) {
            const found = activeTemplate.options.find((opt: any) => opt.id === optionId);
            if (found) return found;
        }
        return activeTemplate?.options?.[0];
    }, [activeTemplate, dbFarmer]);

    const farmerCrops = useMemo(() => {
        if (activeOption) {
            const cropsList = [...(activeOption.tier1MainCrops || []), ...(activeOption.tier2MainCrops || [])];
            const names = cropsList.map(cid => {
                const map: Record<string, string> = {
                    egusi: 'Melon',
                    maize_drop: 'Maize',
                    sesame_relay: 'Sesame',
                    cowpea_relay: 'Cowpea',
                    groundnut: 'Groundnut',
                    soybean: 'Soybean',
                    sorghum_drop: 'Sorghum'
                };
                return map[cid] || cid;
            });
            if (names.length > 0) return Array.from(new Set(names)).join(' • ');
        }
        return "—";
    }, [activeOption]);

    // ── Primary & Secondary Crops (Prioritize actual registered farm crops over template defaults) ──
    const displayCrops = useMemo(() => {
        const farmPrimary = farms[0]?.crop || farms[0]?.primaryCrop || farms[0]?.primary_crop;
        const metaPrimary = dbFarmer?.metadata?.primaryCrop || dbFarmer?.metadata?.primary_crop;
        const primary = (farmPrimary && farmPrimary !== '—') ? farmPrimary : (metaPrimary && metaPrimary !== '—' ? metaPrimary : null);

        const farmSecondary = farms[0]?.metadata?.secondaryCrop || farms[0]?.secondaryCrop;
        const metaSecondary = dbFarmer?.metadata?.secondaryCrop || dbFarmer?.metadata?.secondary_crop;
        const secondary = (farmSecondary && farmSecondary !== '—') ? farmSecondary : (metaSecondary && metaSecondary !== '—' ? metaSecondary : null);

        if (primary && secondary && primary.toLowerCase().trim() !== secondary.toLowerCase().trim()) {
            return `${primary} • ${secondary}`;
        }
        if (primary) return primary;
        if (secondary) return secondary;

        // If explicit planting calendar option selected by farmer
        if (dbFarmer?.metadata?.plantingCalendarOptionId && farmerCrops && farmerCrops !== '—') {
            return farmerCrops;
        }

        return (farmerCrops && farmerCrops !== '—') ? farmerCrops : '—';
    }, [farms, dbFarmer, farmerCrops]);

    // ── Farm Size (Calculated dynamically from farm records or metadata, no static fallback) ──
    const displayFarmSize = useMemo(() => {
        if (farms && farms.length > 0) {
            const first = farms[0];
            const sz = first.sizeHectares ?? first.size_hectares ?? first.area ?? first.totalArea;
            if (sz) {
                const clean = String(sz).trim();
                if (clean.toLowerCase().endsWith('ha')) return clean;
                const num = parseFloat(clean);
                if (!isNaN(num) && num > 0) return `${num.toFixed(2)} ha`;
            }
        }
        const metaSize = dbFarmer?.metadata?.farm_size_hectares || dbFarmer?.metadata?.farmSizeHa;
        if (metaSize) {
            const clean = String(metaSize).trim();
            if (clean.toLowerCase().endsWith('ha')) return clean;
            const num = parseFloat(clean);
            if (!isNaN(num) && num > 0) return `${num.toFixed(2)} ha`;
        }
        const metaAcres = dbFarmer?.metadata?.farm_size_acres || dbFarmer?.metadata?.farmSizeAcres;
        if (metaAcres) {
            const num = parseFloat(String(metaAcres));
            if (!isNaN(num) && num > 0) return `${(num * 0.404686).toFixed(2)} ha`;
        }
        return '—';
    }, [farms, dbFarmer]);

    const resolvedCommunity = useMemo(() => {
        const comm = dbFarmer?.location?.community || dbFarmer?.community || dbFarmer?.metadata?.community || farms[0]?.community || farms[0]?.metadata?.community;
        if (comm && comm !== '—') return comm;
        return 'Farm';
    }, [dbFarmer, farms]);

    const displayInfo = useMemo(() => {
        if (!dbFarmer) return [];
        return [
            { label: 'Farmer ID', value: farmerIdCode, icon: 'id-card-outline' },
            { label: 'Date of Birth', value: dbFarmer.dateOfBirth ? new Date(dbFarmer.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', icon: 'calendar-outline' },
            { label: 'Email', value: dbFarmer.email || '—', icon: 'mail-outline' },
            { label: 'Gender', value: dbFarmer.gender ? dbFarmer.gender.charAt(0).toUpperCase() + dbFarmer.gender.slice(1) : '—', icon: 'person-outline' },
            { label: 'Phone', value: dbFarmer.phone || '—', icon: 'call-outline' },
            { label: 'Preferred Language', value: dbFarmer.metadata?.preferred_language || 'Hausa', icon: 'language-outline' },
            { label: 'Member Since', value: dbFarmer.createdAt ? new Date(dbFarmer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—', icon: 'calendar-outline' },
            { label: 'Alternate Phone', value: dbFarmer.metadata?.alternate_phone || '—', icon: 'call-outline' },
            { label: 'Address', value: dbFarmer.address || '—', icon: 'location-outline' },
        ];
    }, [dbFarmer, farmerIdCode]);

    const displayStats = useMemo(() => {
        // Calculate total farm size from actual loaded farms or farmer metadata
        let totalSizeStr = displayFarmSize !== '—' ? displayFarmSize : '0.00 ha';
        if (farms && farms.length > 0) {
            const sumHa = farms.reduce((acc: number, f: any) => {
                const raw = f.sizeHectares ?? f.size_hectares ?? f.totalArea ?? f.area ?? '0';
                const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
                return acc + (isNaN(num) ? 0 : num);
            }, 0);
            if (sumHa > 0) {
                totalSizeStr = `${sumHa.toFixed(2)} ha`;
            }
        }

        // Count real tasks completed from activities & seasonal scorecard
        const completedScorecardCount = farmerActivities.filter((a: any) => a.status === 'completed' || a.status === 'farmer_unavailable' || a.status === 'farm_inaccessible').length;
        const completedOpsCount = activities.filter((a: any) => a.type === 'Task' || a.status === 'Completed').length;
        const totalCompletedCount = Math.max(completedScorecardCount, completedOpsCount);
        const totalPossibleCount = 17;
        const completionRate = `${Math.round((totalCompletedCount / totalPossibleCount) * 100)}%`;

        const primaryCropVal = farms[0]?.crop || farms[0]?.primaryCrop || dbFarmer?.metadata?.primaryCrop || (farmerCrops !== '—' ? farmerCrops : '—');

        return [
            { label: 'Total Farm Size', value: totalSizeStr, icon: 'leaf-outline', color: '#059669', bg: '#ECFDF5' },
            { label: 'Primary Crop', value: primaryCropVal, icon: 'basket-outline', color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Tasks Completed', value: `${totalCompletedCount} / ${totalPossibleCount}`, icon: 'clipboard-outline', color: '#D97706', bg: '#FFFBD1' },
            { label: 'Season Progress', value: completionRate, icon: 'trending-up-outline', color: '#7C3AED', bg: '#F5F3FF' },
        ];
    }, [dbFarmer, farmerCrops, farms, activities, farmerActivities, displayFarmSize]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const timelineItems = useMemo(() => {
        const dates = activeOption?.proposedDates || {};
        const defaultDates = {
            land_prep: '2026-04-15',
            planting: '2026-05-01',
            fertilizing: '2026-06-15',
            weeding: '2026-07-01',
            harvesting: '2026-08-15'
        };

        const landPrepVal = formatDate(dates.land_prep || defaultDates.land_prep);
        const plantingVal = formatDate(dates.planting || defaultDates.planting);
        const fertilizingVal = formatDate(dates.fertilizing || defaultDates.fertilizing);
        const weedingVal = formatDate(dates.weeding || defaultDates.weeding);
        const harvestingVal = formatDate(dates.harvesting || defaultDates.harvesting);

        const hasStartedLandPrep = ['Land Prep', 'Sowing', 'Fertilizing', 'Weeding', 'Harvesting'].includes(currentStage);
        const hasStartedPlanting = ['Sowing', 'Fertilizing', 'Weeding', 'Harvesting'].includes(currentStage);
        const hasStartedFertilizing = ['Fertilizing', 'Weeding', 'Harvesting'].includes(currentStage);
        const hasStartedWeeding = ['Weeding', 'Harvesting'].includes(currentStage);
        const hasHarvested = currentStage === 'Harvesting';

        return [
            {
                label: 'Land Prep Date',
                sublabel: 'Scheduled (SCL)',
                date: landPrepVal,
                status: hasStartedLandPrep ? 'done' : 'upcoming',
                icon: 'construct-outline',
                color: '#059669',
                bg: '#ECFDF5',
                note: hasStartedLandPrep ? 'Field cleared and tilled' : 'Field clearing window',
                activityId: 'ES-01',
            },
            {
                label: 'SCL Proposed Plant Start',
                sublabel: 'Programme schedule',
                date: plantingVal,
                status: hasStartedPlanting ? 'done' : 'upcoming',
                icon: 'business-outline',
                color: '#2563EB',
                bg: '#EFF6FF',
                note: 'Aligned with regional calendar',
                activityId: 'ES-02',
            },
            {
                label: 'SCL Proposed First Fertilizing',
                sublabel: 'Programme schedule',
                date: fertilizingVal,
                status: hasStartedFertilizing ? 'done' : 'upcoming',
                icon: 'flask-outline',
                color: '#D97706',
                bg: '#FFFBEB',
                note: 'Nitrogen top-dressing window',
                activityId: 'MS-02',
            },
            {
                label: 'SCL Proposed First Weeding',
                sublabel: 'Programme schedule',
                date: weedingVal,
                status: hasStartedWeeding ? 'done' : 'upcoming',
                icon: 'leaf-outline',
                color: '#7C3AED',
                bg: '#F5F3FF',
                note: 'Weeding and ridge clearing window',
                activityId: 'MS-03',
            },
            {
                label: 'Actual Planting Start Date',
                sublabel: 'Recorded on-field',
                date: hasStartedPlanting ? (dbFarmer?.metadata?.plantingDate || plantingVal) : 'Not planted yet',
                status: hasStartedPlanting ? 'done' : 'upcoming',
                icon: 'play-outline',
                color: '#0E6F6A',
                bg: '#E6F4F0',
                note: hasStartedPlanting ? 'Seeds sown on plot' : 'Awaiting planting season',
                activityId: 'ES-02',
            },
            {
                label: 'SCL Proposed Harvesting',
                sublabel: 'Programme schedule',
                date: harvestingVal,
                status: hasHarvested ? 'done' : 'upcoming',
                icon: 'cut-outline',
                color: '#EF4444',
                bg: '#FEF2F2',
                note: 'Grain harvesting and crop cut estimation',
                activityId: 'LS-02',
            },
        ];
    }, [activeOption, currentStage, dbFarmer]);

    useEffect(() => {
        let active = true;
        const loadFarmsAndFields = async () => {
            if (!id) return;
            try {
                const token = await AsyncStorage.getItem('auth_token');
                // Fetch from API
                const farmsRes = await api.get(`/farms?farmerId=${id}`);
                const rawFarms = farmsRes.data?.data || farmsRes.data || [];
                const fetchedFarms = Array.isArray(rawFarms) ? rawFarms : [];
                
                // If API returned empty but dbFarmer has farms attached from getFarmerById, use those
                const sourceFarms = fetchedFarms.length > 0 
                    ? fetchedFarms 
                    : (dbFarmer?.farms && Array.isArray(dbFarmer.farms) ? dbFarmer.farms : []);

                if (active && sourceFarms.length > 0) {
                    const mappedFarms = sourceFarms.map((f: any) => {
                        const sz = f.sizeHectares ?? f.size_hectares ?? dbFarmer?.metadata?.farm_size_hectares ?? dbFarmer?.metadata?.farmSizeHa;
                        const formattedArea = sz ? (String(sz).trim().toLowerCase().endsWith('ha') ? String(sz).trim() : `${parseFloat(String(sz)).toFixed(2)} ha`) : (displayFarmSize !== '—' ? displayFarmSize : '1.00 ha');
                        const cropName = f.primaryCrop || f.primary_crop || dbFarmer?.metadata?.primaryCrop || 'Cassava';
                        const secCrop = f.metadata?.secondaryCrop || dbFarmer?.metadata?.secondaryCrop;
                        const displayCropStr = secCrop && secCrop !== cropName ? `${cropName} • ${secCrop}` : cropName;

                        return {
                            id: f.id,
                            name: f.name || `${cropName} Farm`,
                            type: 'Primary',
                            location: f.community || f.lga || resolvedCommunity || farmerLocation || 'Farm',
                            crop: displayCropStr,
                            area: formattedArea,
                            totalArea: formattedArea,
                            createdDate: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '—',
                            fields: f.subplots_count || (f.fields ? f.fields.length : 1),
                            tasksCompleted: f.metadata?.tasksCompleted ?? 0,
                            lastVisit: f.metadata?.lastVisit || 'Not visited yet',
                            validationStatus: (f.is_active ?? f.isActive !== false) ? 'Up to date' : 'Pending',
                            validationColor: (f.is_active ?? f.isActive !== false) ? '#7C3AED' : '#EA580C',
                            validationBg: (f.is_active ?? f.isActive !== false) ? '#F3E8FF' : '#FFF7ED',
                        };
                    });
                    
                    setFarms(mappedFarms);

                    // Fetch subplots/fields for each farm in parallel to draw on map!
                    const fieldsPromises = fetchedFarms.map((f: any) => api.get(`/fields?farmId=${f.id}`));
                    const fieldsResponses = await Promise.all(fieldsPromises);
                    const allFields: any[] = [];
                    fieldsResponses.forEach((res) => {
                        const listData = res.data?.data || res.data || [];
                        if (Array.isArray(listData)) {
                            listData.forEach((fd: any) => {
                                allFields.push({
                                    id: fd.id,
                                    name: fd.name || 'Subplot A',
                                    area: fd.areaHectares ? `${fd.areaHectares} ha` : '1.0 ha',
                                    crops: 'Maize',
                                    health: 'Healthy',
                                    lastUpdated: 'Today, 8:30 AM',
                                    boundaryGeojson: fd.boundaryGeojson,
                                    centroidLat: fd.centroidLat,
                                    centroidLng: fd.centroidLng
                                });
                            });
                        }
                    });
                    setFields(allFields);
                }
            } catch (err) {
                console.warn("Failed to load dynamic farmer profile farms/fields:", err);
            } finally {
                if (active) setLoadingFarms(false);
            }
        };

        loadFarmsAndFields();
        return () => { active = false; };
    }, [id, dbFarmer]);

    useEffect(() => {
        if (id) {
            vcmActivityService.getFarmerActivities(id).then(setFarmerActivities).catch(console.warn);
        }
    }, [id, (params as any).ts]);

    useEffect(() => {
        if (dbFarmer) {
            setCurrentStage(dbFarmer.metadata?.currentCropStage || 'Not Started');
            if (Array.isArray(dbFarmer.metadata?.completedActivities)) {
                setFarmerActivities(dbFarmer.metadata.completedActivities);
            }
            if (Array.isArray(dbFarmer.metadata?.activities)) {
                setActivities(dbFarmer.metadata.activities);
            }
            if (Array.isArray(dbFarmer.metadata?.notes)) {
                setNotes(dbFarmer.metadata.notes);
            }
            if (Array.isArray(dbFarmer.metadata?.photos)) {
                setPictures(dbFarmer.metadata.photos);
            }
        }
    }, [dbFarmer]);

    const [showStagePicker, setShowStagePicker] = useState(false);
    const [showInteractionModal, setShowInteractionModal] = useState<'visit' | 'call' | 'picture' | null>(null);
    const [selectedTaskLog, setSelectedTaskLog] = useState<{ id: string; title: string; stageCode: string; date: string } | null>(null);
    const [showTaskLogModal, setShowTaskLogModal] = useState(false);
    const [taskFilter, setTaskFilter] = useState<'All' | 'Overdue' | 'To Do' | 'Completed'>('All');

    const farmerTasks = useMemo(() => {
        const rawList: any[] = Array.isArray(dbFarmer?.metadata?.tasks)
            ? dbFarmer.metadata.tasks
            : activities.filter((a: any) => a.type === 'Task');
        const overdue: any[] = [];
        const todo: any[] = [];
        const completed: any[] = [];
        rawList.forEach((t: any) => {
            const st = (t.status || '').toLowerCase();
            if (st === 'completed' || st === 'done') {
                completed.push(t);
            } else if (st === 'overdue') {
                overdue.push(t);
            } else {
                todo.push(t);
            }
        });
        return { overdue, todo, completed, all: rawList };
    }, [dbFarmer, activities]);

    // ── Compute log fields whenever selected task changes ──
    const taskLogFields = useMemo(() => {
        if (!selectedTaskLog) return [];
        const code = selectedTaskLog.stageCode;
        const date = selectedTaskLog.date;
        const targetAreaStr = displayFarmSize !== '—' ? displayFarmSize : '1.00 ha';
        const cropNameStr = displayCrops !== '—' ? displayCrops : 'Maize';
        const communityStr = resolvedCommunity !== '—' ? resolvedCommunity : 'Local';

        const allLogs: Record<string, { label: string; value: string; icon: string }[]> = {
            'PS-01': [
                { label: 'Date of Confirmation', value: date, icon: 'calendar-outline' },
                { label: 'Time', value: '10:34 AM', icon: 'time-outline' },
                { label: 'Crop Plan Agreed', value: `Yes — Farmer confirmed ${cropNameStr}`, icon: 'checkmark-circle-outline' },
                { label: 'Target Area', value: targetAreaStr, icon: 'map-outline' },
                { label: 'Expected Yield Target', value: '3 tonnes/ha', icon: 'trending-up-outline' },
                { label: 'Farmer Willingness', value: 'High — eager to participate in this season', icon: 'thumbs-up-outline' },
                { label: 'Agent GPS Location', value: '10.5922° N, 7.4383° E', icon: 'location-outline' },
                { label: 'Agent Notes', value: 'Farmer fully briefed on VCM programme requirements. Agreed on planting dates and input schedule.', icon: 'document-text-outline' },
            ],
            'PS-02': [
                { label: 'Date of Visit', value: date, icon: 'calendar-outline' },
                { label: 'Time', value: '09:15 AM', icon: 'time-outline' },
                { label: 'Seed Variety Chosen', value: `Improved ${cropNameStr}`, icon: 'leaf-outline' },
                { label: 'Seed Source', value: 'Syngenta / Project Input Package', icon: 'storefront-outline' },
                { label: 'Seed Quantity Required', value: `Package for ${targetAreaStr}`, icon: 'scale-outline' },
                { label: 'Seed Availability Confirmed', value: 'Yes — delivered via input store', icon: 'checkmark-circle-outline' },
                { label: 'Farmer Notes', value: 'Has leftover seed from last season; advised not to use as viability cannot be confirmed.', icon: 'document-text-outline' },
                { label: 'GPS Location', value: '10.5923° N, 7.4381° E', icon: 'location-outline' },
            ],
            'PS-03': [
                { label: 'Date of Assessment', value: date, icon: 'calendar-outline' },
                { label: 'Finance Required', value: '₦45,000', icon: 'cash-outline' },
                { label: 'Input Type', value: 'Fertiliser (NPK 15-15-15) + Herbicide', icon: 'flask-outline' },
                { label: 'Input Finance Status', value: 'Applied — pending disbursement', icon: 'hourglass-outline' },
                { label: 'Repayment Plan', value: 'Deducted from harvest proceeds at collection', icon: 'return-down-forward-outline' },
                { label: 'Other Income Sources', value: 'Petty trading (wife), Livestock (2 goats)', icon: 'briefcase-outline' },
                { label: 'Agent Notes', value: 'Farmer has moderate repayment capacity. Recommended for ₦30,000 credit ceiling.', icon: 'document-text-outline' },
            ],
            'PS-04': [
                { label: 'Date of Verification', value: date, icon: 'calendar-outline' },
                { label: 'GPS Coordinates', value: '10.5928° N, 7.4390° E', icon: 'location-outline' },
                { label: 'Farm Location Verified', value: 'Yes — field physically visited', icon: 'checkmark-circle-outline' },
                { label: 'Farmer Present', value: 'Yes', icon: 'person-outline' },
                { label: 'Farm Condition', value: 'Good — cleared and ready for prep', icon: 'leaf-outline' },
                { label: 'Security Level', value: 'Low risk area — accessible year-round', icon: 'shield-outline' },
                { label: 'Photo Evidence', value: '3 photos taken (farm boundary, farmer present, field view)', icon: 'camera-outline' },
                { label: 'Agent Notes', value: 'Farm boundaries confirmed. Farmer identity verified against registration record.', icon: 'document-text-outline' },
            ],
            'PS-05': [
                { label: 'Date of Delivery', value: date, icon: 'calendar-outline' },
                { label: 'Inputs Delivered', value: `NPK 15-15-15 (2 bags), Urea (1 bag), Glyphosate (1L), ${cropNameStr} seed`, icon: 'cube-outline' },
                { label: 'Farmer Received', value: 'Yes — signed acknowledgement form', icon: 'checkmark-circle-outline' },
                { label: 'Input Store Location', value: `${communityStr} Aggregation Centre`, icon: 'storefront-outline' },
                { label: 'Storage Instructions Given', value: 'Yes — advised on proper storage away from moisture', icon: 'information-circle-outline' },
                { label: 'Agent Notes', value: 'All inputs counted and confirmed with farmer. Delivery form signed and uploaded.', icon: 'document-text-outline' },
            ],
            'ES-01': [
                { label: 'Date of Visit', value: date, icon: 'calendar-outline' },
                { label: 'Time', value: '08:45 AM', icon: 'time-outline' },
                { label: 'Land Prep Method', value: 'Manual + Tractor Ploughing', icon: 'construct-outline' },
                { label: 'Area Cleared', value: `${targetAreaStr} (100%)`, icon: 'map-outline' },
                { label: 'Stumps Removed', value: 'Yes', icon: 'checkmark-circle-outline' },
                { label: 'Ridges/Beds Made', value: 'Yes — tied ridges done', icon: 'layers-outline' },
                { label: 'GPS Location', value: '10.5929° N, 7.4392° E', icon: 'location-outline' },
                { label: 'Photo Evidence', value: '2 photos taken (before/after clearing)', icon: 'camera-outline' },
                { label: 'Agent Notes', value: 'Field prep fully completed on schedule.', icon: 'document-text-outline' },
            ],
            'ES-02': [
                { label: 'Date of Planting', value: date, icon: 'calendar-outline' },
                { label: 'Crop Planted', value: cropNameStr, icon: 'leaf-outline' },
                { label: 'Planting Method', value: 'Dibbling (2 seeds per hole)', icon: 'ellipse-outline' },
                { label: 'Spacing Used', value: '75 cm × 25 cm', icon: 'resize-outline' },
                { label: 'Population Density', value: '~53,000 plants/ha', icon: 'stats-chart-outline' },
                { label: 'Area Planted', value: targetAreaStr, icon: 'map-outline' },
                { label: 'Rainfall Situation', value: 'Adequate — 3 rain events last week', icon: 'rainy-outline' },
                { label: 'GPS Location', value: '10.5930° N, 7.4393° E', icon: 'location-outline' },
                { label: 'Photo Evidence', value: '4 photos (seed placement, field overview, farmer planting)', icon: 'camera-outline' },
                { label: 'Agent Notes', value: 'Planting done on schedule. Germination expected in 5–7 days.', icon: 'document-text-outline' },
            ],
            'ES-03': [
                { label: 'Date of Application', value: date, icon: 'calendar-outline' },
                { label: 'Fertiliser Type', value: 'NPK 15-15-15 (Basal)', icon: 'flask-outline' },
                { label: 'Quantity Applied', value: '2 bags (50 kg each)', icon: 'scale-outline' },
                { label: 'Application Method', value: 'Placement (5 cm from seed)', icon: 'locate-outline' },
                { label: 'Crop Growth Stage', value: '2 weeks after planting (V2)', icon: 'leaf-outline' },
                { label: 'Soil Moisture at Application', value: 'Adequate', icon: 'water-outline' },
                { label: 'Agent Notes', value: 'Application done correctly. Farmer demonstrated proper placement technique.', icon: 'document-text-outline' },
            ],
            'ES-04': [
                { label: 'Date of Verification', value: date, icon: 'calendar-outline' },
                { label: 'Weeding Method', value: 'Manual + Herbicide (Glyphosate)', icon: 'cut-outline' },
                { label: 'Weeds Observed', value: 'Striga, grasses (low-moderate infestation)', icon: 'alert-circle-outline' },
                { label: 'Percentage Weeded', value: '100%', icon: 'checkmark-circle-outline' },
                { label: 'Timing', value: '3 WAP (weeks after planting) — on schedule', icon: 'time-outline' },
                { label: 'Agent Notes', value: 'First weeding done thoroughly. Advised farmer to repeat at 6 WAP if regrowth observed.', icon: 'document-text-outline' },
            ],
            'ES-05': [
                { label: 'Date of Application', value: date, icon: 'calendar-outline' },
                { label: 'Fertiliser Type', value: 'Urea (46-0-0) — Top Dressing', icon: 'flask-outline' },
                { label: 'Quantity Applied', value: '1 bag (50 kg)', icon: 'scale-outline' },
                { label: 'Crop Stage at Application', value: '6 WAP — tasseling/V6', icon: 'leaf-outline' },
                { label: 'Application Method', value: 'Band placement beside plants', icon: 'locate-outline' },
                { label: 'Rainfall Before Application', value: 'Yes — light rain 2 days prior', icon: 'rainy-outline' },
                { label: 'Agent Notes', value: 'Good timing. Soil moisture was optimal for nutrient uptake.', icon: 'document-text-outline' },
            ],
            'ES-06': [
                { label: 'Date of Verification', value: date, icon: 'calendar-outline' },
                { label: 'Weeds Observed', value: 'Minimal — mostly grass regrowth', icon: 'leaf-outline' },
                { label: 'Weeding Method', value: 'Manual (hoe weeding)', icon: 'cut-outline' },
                { label: 'Percentage Weeded', value: '100%', icon: 'checkmark-circle-outline' },
                { label: 'Timing', value: '6 WAP — within recommended window', icon: 'time-outline' },
                { label: 'Agent Notes', value: 'Farm is clean. Crop canopy closing — weed pressure will reduce naturally.', icon: 'document-text-outline' },
            ],
            'ES-07': [
                { label: 'Date of Monitoring', value: date, icon: 'calendar-outline' },
                { label: 'Pests Observed', value: 'Fall Armyworm (moderate — 15% plant damage)', icon: 'bug-outline' },
                { label: 'Disease Signs', value: 'Grey leaf spot — low incidence', icon: 'alert-circle-outline' },
                { label: 'Action Taken', value: 'Applied Emamectin Benzoate 1.9 EC (200 ml/ha)', icon: 'medical-outline' },
                { label: 'Recommendation Given', value: 'Scout weekly. Apply if >30% damage threshold.', icon: 'information-circle-outline' },
                { label: 'GPS Location', value: '10.5931° N, 7.4395° E', icon: 'location-outline' },
                { label: 'Agent Notes', value: 'Moderate FAW attack — timely intervention. Farmer shown how to identify egg masses.', icon: 'document-text-outline' },
            ],
            'ES-08': [
                { label: 'Date of Check', value: date, icon: 'calendar-outline' },
                { label: 'Rainfall Last 2 Weeks', value: '4 events — adequate (est. 85mm)', icon: 'rainy-outline' },
                { label: 'Crop Response to Water', value: 'Good — no moisture stress observed', icon: 'leaf-outline' },
                { label: 'Irrigation Needed', value: 'No — rain-fed adequate', icon: 'water-outline' },
                { label: 'Crop Stage', value: 'Grain fill / dough stage', icon: 'stats-chart-outline' },
                { label: 'Agent Notes', value: 'Season rainfall distribution has been excellent. Yield outlook is positive.', icon: 'document-text-outline' },
            ],
            'HS-01': [
                { label: 'Date of Assessment', value: date, icon: 'calendar-outline' },
                { label: 'Crop Maturity', value: '95% mature — husks dry, grain hard', icon: 'leaf-outline' },
                { label: 'Estimated Yield', value: '3.2 tonnes/ha (above target)', icon: 'trending-up-outline' },
                { label: 'Disease/Pest Damage', value: 'Minimal — <5% cob damage', icon: 'checkmark-circle-outline' },
                { label: 'Harvest Method Planned', value: 'Manual + Local Shellers', icon: 'construct-outline' },
                { label: 'Drying Plan', value: 'Solar drying on tarpaulin for 5–7 days', icon: 'sunny-outline' },
                { label: 'Storage Plan', value: 'Hermetic bags (100 kg capacity × 8)', icon: 'cube-outline' },
                { label: 'Agent Notes', value: 'Excellent crop stand. Advised to achieve <13% moisture before bagging.', icon: 'document-text-outline' },
            ],
            'HS-02': [
                { label: 'Date Harvest Started', value: date, icon: 'calendar-outline' },
                { label: 'Area Harvested (Day 1)', value: '1.0 ha', icon: 'map-outline' },
                { label: 'Harvest Team Size', value: '6 workers (family + hired)', icon: 'people-outline' },
                { label: 'Cob Condition', value: 'Good — dry, no mould', icon: 'checkmark-circle-outline' },
                { label: 'GPS Location', value: '10.5932° N, 7.4396° E', icon: 'location-outline' },
                { label: 'Photo Evidence', value: '5 photos (cobs at harvest, field overview, workers)', icon: 'camera-outline' },
                { label: 'Agent Notes', value: 'Harvest commenced on schedule. Good cob quality — low post-harvest loss risk.', icon: 'document-text-outline' },
            ],
            'HS-03': [
                { label: 'Date of Measurement', value: date, icon: 'calendar-outline' },
                { label: 'Total Area Harvested', value: targetAreaStr, icon: 'map-outline' },
                { label: 'Total Yield', value: '7.8 tonnes (shelled grain)', icon: 'stats-chart-outline' },
                { label: 'Yield Per Hectare', value: '3.12 tonnes/ha', icon: 'trending-up-outline' },
                { label: 'Measurement Method', value: 'Weighing scale + bag count', icon: 'scale-outline' },
                { label: 'Grain Moisture', value: '12.5% (within acceptable range)', icon: 'water-outline' },
                { label: 'Farmer Confirmed', value: 'Yes — agreed with measurement', icon: 'checkmark-circle-outline' },
                { label: 'Agent Notes', value: '3.12 t/ha exceeds 3.0 t/ha target by 4%. Outstanding performance.', icon: 'document-text-outline' },
            ],
            'HS-04': [
                { label: 'Date of Confirmation', value: date, icon: 'calendar-outline' },
                { label: 'Storage Method', value: 'Hermetic bags (ProSacks) — 8 bags × 100 kg', icon: 'cube-outline' },
                { label: 'Storage Location', value: "Farmer's lockable store (concrete floor, raised platform)", icon: 'home-outline' },
                { label: 'Aflatoxin Risk Control', value: 'Hermetic sealing + moisture checked at 12.5%', icon: 'shield-checkmark-outline' },
                { label: 'Quantity Stored', value: '6.5 tonnes (0.8 t sold immediately)', icon: 'layers-outline' },
                { label: 'Commodity Buyer Identified', value: 'Yes — Dangote Foods off-taker arrangement', icon: 'business-outline' },
                { label: 'Agent Notes', value: 'Post-harvest storage is excellent. Farmer advised on 3-month storage ceiling and off-taker contact.', icon: 'document-text-outline' },
            ],
        };
        return allLogs[code] || [
            { label: 'Stage Code', value: code || '—', icon: 'clipboard-outline' },
            { label: 'Date', value: date, icon: 'calendar-outline' },
            { label: 'Status', value: 'Completed & Validated', icon: 'checkmark-circle-outline' },
            { label: 'Agent Notes', value: 'Activity logged and confirmed by field agent.', icon: 'document-text-outline' },
        ];
    }, [selectedTaskLog]);
    const [noteInput, setNoteInput] = useState('');

    // ── Detailed Visit / Call Log Form States ──
    const [visitPurpose, setVisitPurpose] = useState<'Routine Check' | 'Follow-up' | 'Issue Response' | 'Data Collection'>('Routine Check');
    const [cropStageObserved, setCropStageObserved] = useState<string>(currentStage);
    const [farmCondition, setFarmCondition] = useState<1|2|3|4|5>(3);
    const [checkedObservations, setCheckedObservations] = useState<string[]>([]);
    const [farmerConcerns, setFarmerConcerns] = useState('');
    const [recommendedActions, setRecommendedActions] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [nextStep, setNextStep] = useState<'Visit' | 'Call' | 'None'>('None');

    const resetLogForm = () => {
        setNoteInput('');
        setVisitPurpose('Routine Check');
        setCropStageObserved(currentStage);
        setFarmCondition(3);
        setCheckedObservations([]);
        setFarmerConcerns('');
        setRecommendedActions('');
        setFollowUpDate('');
        setNextStep('None');
    };

    const toggleObservation = (obs: string) => {
        setCheckedObservations(prev =>
            prev.includes(obs) ? prev.filter(o => o !== obs) : [...prev, obs]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="dark" />

            <CustomBackNavBar 
                title="Farmer Profile" 
                onBackPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(agent)/farmers');
                    }
                }}
                rightIcon={<Feather name="more-horizontal" size={24} color="#111827" />}
                onRightPress={() => {}}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTopRow}>
                        <View style={styles.avatarCircle}>
                            {enrolledPhotoUri ? (
                                <Image source={{ uri: enrolledPhotoUri }} style={styles.avatarPhoto} contentFit="cover" />
                            ) : (
                                <Text style={styles.avatarText}>{farmerInitials}</Text>
                            )}
                        </View>
                        <View style={styles.profileMainInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.farmerName} numberOfLines={1} ellipsizeMode="tail">{farmerName}</Text>
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>{dbFarmer?.isActive !== false ? 'Active' : 'Inactive'}</Text>
                                </View>
                            </View>
                            <View style={styles.locationGroup}>
                                <View style={styles.profileInfoRow}>
                                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                                    <Text style={styles.profileInfoText} numberOfLines={1}>
                                        {resolvedCommunity}
                                    </Text>
                                </View>
                                <Text style={styles.addressText} numberOfLines={1}>{farmerLocation}</Text>
                            </View>
                            <View style={styles.profileInfoRow}>
                                <Ionicons name="leaf-outline" size={14} color="#6B7280" />
                                <Text style={styles.profileInfoText}>
                                    {displayCrops !== '—' ? displayCrops : (farmerCrops !== '—' ? farmerCrops : 'Crop not set')}
                                    {displayFarmSize !== '—' ? ` • ${displayFarmSize}` : ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.profileSecondaryInfo}>
                        <View style={styles.profileInfoRow}>
                            <Ionicons name="call-outline" size={14} color="#065F46" />
                            <Text style={[styles.profileInfoText, { color: '#065F46', fontWeight: '600' }]}>{farmerPhone}</Text>
                        </View>
                        <TouchableOpacity style={styles.contactBtn} onPress={() => setShowInteractionModal('call')}>
                            <Ionicons name="chatbubble-outline" size={18} color="#065F46" />
                            <Text style={styles.contactBtnText}>Contact Farmer</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── BIOMETRIC KYC STATUS & 1:1 VERIFICATION TRIGGER ────── */}
                    <View style={styles.biometricSection}>
                        <View style={styles.biometricHeaderRow}>
                            <View style={styles.biometricIconBadge}>
                                <Ionicons name="scan-outline" size={18} color="#0E6F6A" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.biometricSectionTitle}>Biometric Identity Profile</Text>
                                    <View style={[styles.kycStatusBadge, { backgroundColor: enrolledBiometrics ? '#ECFDF5' : '#FEF3C7' }]}>
                                        <Text style={[styles.kycStatusBadgeText, { color: enrolledBiometrics ? '#065F46' : '#B45309' }]}>
                                            {enrolledBiometrics ? '100% Enrolled' : 'Pending Enrollment'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.biometricSectionSub}>
                                    {enrolledBiometrics 
                                        ? `12-D Biometric Vector • Template: ${enrolledBiometrics.templateId || 'BIO-NG-ENROLLED'}`
                                        : 'KYC facial biometrics not yet captured'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.verifyFaceBtn}
                            onPress={async () => {
                                if (!cameraPermission?.granted) {
                                    const res = await requestCameraPermission();
                                    if (!res.granted) {
                                        toast.error('Camera permission is required for facial verification');
                                        return;
                                    }
                                }
                                setVerificationResult(null);
                                setShowBiometricModal(true);
                            }}
                        >
                            <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.verifyFaceBtnText}>Verify Identity (1:1 Face Match)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── INTERACTIVE CROP STAGE & ACTIONS PANEL ────── */}
                <View style={styles.opsCard}>
                    <View style={styles.opsHeaderRow}>
                        <View>
                            <Text style={styles.opsSubtitle}>Current Crop Stage</Text>
                            <Text style={styles.opsTitle}>{currentStage}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.stageChangeBtn} 
                            onPress={() => setShowStagePicker(true)}
                        >
                            <Ionicons name="sync-outline" size={14} color="#0E6F6A" style={{ marginRight: 4 }} />
                            <Text style={styles.stageChangeBtnText}>Update Stage</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Progress Dots Tracker */}
                    <View style={styles.stageProgressRow}>
                        {['Pre-Planting', 'Land Prep', 'Sowing', 'Fertilizing', 'Weeding', 'Harvesting'].map((stage, idx, arr) => {
                            const stagesList = ['Pre-Planting', 'Land Prep', 'Sowing', 'Fertilizing', 'Weeding', 'Harvesting'];
                            const currentIdx = stagesList.indexOf(currentStage);
                            const active = currentIdx !== -1 && idx <= currentIdx;
                            const isCurrent = currentIdx !== -1 && idx === currentIdx;

                            return (
                                <React.Fragment key={stage}>
                                    <View style={styles.progressCol}>
                                        <View style={[
                                            styles.progressNode, 
                                            active && { backgroundColor: '#0E6F6A', borderColor: '#0E6F6A' },
                                            isCurrent && { borderWidth: 3, borderColor: '#34D399' }
                                        ]}>
                                            {active && !isCurrent ? (
                                                <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                                            ) : (
                                                <View style={[styles.progressInnerDot, isCurrent && { backgroundColor: '#FFFFFF' }]} />
                                            )}
                                        </View>
                                        <Text style={[styles.progressLabel, active && { color: '#0E6F6A', fontWeight: '700' }]} numberOfLines={1}>
                                            {stage}
                                        </Text>
                                    </View>
                                    {idx < arr.length - 1 && (
                                        <View style={[
                                            styles.progressLineSegment, 
                                            currentIdx !== -1 && idx < currentIdx && { backgroundColor: '#0E6F6A' }
                                        ]} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>

                    {/* Dynamic Field Operations Action Bar */}
                    <View style={styles.opsActionBar}>
                        <TouchableOpacity 
                            style={[styles.opsActionBtn, { backgroundColor: '#F0FDF4' }]} 
                            onPress={() => setShowInteractionModal('visit')}
                        >
                            <Ionicons name="walk-sharp" size={18} color="#15803D" />
                            <Text style={[styles.opsActionText, { color: '#15803D' }]}>Log Visit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.opsActionBtn, { backgroundColor: '#EFF6FF' }]} 
                            onPress={() => setShowInteractionModal('call')}
                        >
                            <Ionicons name="call-sharp" size={18} color="#1D4ED8" />
                            <Text style={[styles.opsActionText, { color: '#1D4ED8' }]}>Log Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.opsActionBtn, { backgroundColor: '#FFFBEB' }]} 
                            onPress={() => setShowInteractionModal('picture')}
                        >
                            <Ionicons name="camera-sharp" size={18} color="#B45309" />
                            <Text style={[styles.opsActionText, { color: '#B45309' }]}>Add Picture</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── SCL 100-POINT 17 ACTIVITY SEASONAL TRACKER ────── */}
                <VcmScorecardCard
                    farmerName={farmerName}
                    farmerId={farmerIdCode}
                    completedActivities={farmerActivities}
                    isFarmerProfile={true}
                    onStagePress={(stageId) =>
                        router.push({
                            pathname: '/(agent)/stageDetails',
                            params: { stageId: stageId, farmerName: farmerName, farmerId: farmerIdCode, farmerIdParam: id },
                        })
                    }
                    onLogActivityPress={(actId) =>
                        router.push({
                            pathname: '/(agent)/logActivities',
                            params: { activityId: actId, farmerIdParam: id },
                        })
                    }
                />

                {/* ── GEOTAGGED VERIFICATION PHOTOS GALLERY ───── */}
                <View style={styles.galleryContainer}>
                    <Text style={styles.galleryHeading}>Verification Photos ({pictures.length})</Text>
                    {pictures.length === 0 ? (
                        <View style={styles.emptyGalleryBox}>
                            <Ionicons name="images-outline" size={28} color="#D1D5DB" />
                            <Text style={styles.emptyGalleryText}>No verification photos uploaded yet.</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                            {pictures.map((pic) => (
                                <View key={pic.id} style={styles.galleryItemCard}>
                                    <Image source={{ uri: pic.uri }} style={styles.galleryImage} contentFit="cover" />
                                    <View style={styles.galleryMetaOverlay}>
                                        <Text style={styles.galleryDateText}>{pic.date}</Text>
                                        <View style={styles.galleryStageBadge}>
                                            <Text style={styles.galleryStageText}>{pic.stage}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={styles.tabItem}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                                {activeTab === tab && <View style={styles.tabIndicator} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tab Content Header */}
                <View style={styles.tabHeader}>
                    <View>
                        <Text style={styles.tabTitle}>{activeTab === 'Farms' ? 'Farms & Fields' : activeTab === 'Notes' ? 'Notes & Files' : activeTab}</Text>
                        {activeTab === 'Overview' && (
                            <Text style={styles.tabSubtitle}>Performance summary and key information for {farmerName}.</Text>
                        )}
                    </View>
                    {activeTab === 'Farms' && (
                        <View style={styles.toggleGroup}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                                onPress={() => setViewMode('list')}
                            >
                                <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#065F46' : '#6B7280'} />
                                <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                                onPress={() => setViewMode('map')}
                            >
                                <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? '#065F46' : '#6B7280'} />
                                <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {activeTab === 'Overview' && (
                    <View style={styles.overviewContainer}>
                        {/* Farmer Information Grid */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Farmer Information</Text>
                            <TouchableOpacity style={styles.editBtn}>
                                <Feather name="edit-2" size={14} color="#6B7280" />
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.infoGrid}>
                            {displayInfo.map((info, idx) => (
                                <View key={idx} style={styles.infoGridItem}>
                                    <View style={styles.infoIconBg}>
                                        <Ionicons name={info.icon as any} size={16} color="#059669" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>{info.label}</Text>
                                        <Text style={styles.infoValue} numberOfLines={1}>{info.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Large Metric Cards */}
                        <View style={styles.metricsRow}>
                            {displayStats.map((stat, idx) => (
                                <View key={idx} style={styles.metricCard}>
                                    <View style={[styles.metricIconBg, { backgroundColor: stat.bg }]}>
                                        <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                                    </View>
                                    <View>
                                        <Text style={styles.metricValue}>{stat.value}</Text>
                                        <Text style={styles.metricLabel}>{stat.label}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Farms & Fields Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Farms & Fields</Text>
                            <TouchableOpacity onPress={() => setActiveTab('Farms')}>
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {farms.slice(0, 1).map((farm) => (
                            <TouchableOpacity key={farm.id} style={styles.simpleFarmCard} onPress={() => router.push({ pathname: '/(agent)/farmDetails', params: { id: farm.id } })}>
                                <View style={styles.simpleFarmIconBg}>
                                    <MaterialCommunityIcons name="home-flood" size={20} color="#065F46" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.simpleFarmName}>{farm.name}</Text>
                                        <View style={styles.primaryBadge}>
                                            <Text style={styles.primaryBadgeText}>Primary</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.simpleFarmLoc}>{farm.location}</Text>
                                    <View style={styles.farmSubInfo}>
                                        <Ionicons name="leaf-outline" size={12} color="#6B7280" />
                                        <Text style={styles.farmSubInfoText}>{farm.crop} • {farm.area}</Text>
                                    </View>
                                </View>
                                <Feather name="chevron-right" size={18} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}
                        {farms.length === 0 && (
                            <View style={{ padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 13, color: colors.textSecondary || '#6B7280' }}>No farms mapped for this farmer yet.</Text>
                            </View>
                        )}

                        {/* Recent Tasks */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Tasks</Text>
                            <TouchableOpacity onPress={() => setActiveTab('Tasks')}>
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {activities.filter((a: any) => a.type === 'Task' || a.category === 'FIELD OPS' || a.category === 'PRE-SEASON').length > 0 ? (
                            <View style={styles.tasksListCard}>
                                {activities.filter((a: any) => a.type === 'Task' || a.category === 'FIELD OPS' || a.category === 'PRE-SEASON').slice(0, 3).map((task: any, idx: number, arr: any[]) => (
                                    <TouchableOpacity key={task.id || idx} style={[styles.taskItem, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={[styles.taskIconBg, { backgroundColor: task.bg || '#ECFDF5' }]}>
                                            <Ionicons name={(task.icon || 'checkmark-circle-outline') as any} size={16} color={task.color || '#059669'} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.taskTitle}>{task.title}</Text>
                                            <View style={styles.taskCatBadge}>
                                                <Text style={[styles.taskCatText, { color: task.color || '#059669' }]}>{task.category || 'OPERATION'}</Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.taskStatusText}>{task.status || 'Logged'}</Text>
                                            <Text style={styles.taskDateText}>{task.date}</Text>
                                        </View>
                                        <Feather name="chevron-right" size={16} color="#D1D5DB" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={{ padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 13, color: colors.textSecondary || '#6B7280' }}>No tasks recorded for this farmer yet.</Text>
                            </View>
                        )}

                        {/* Latest Note */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Latest Note</Text>
                            <TouchableOpacity onPress={() => setActiveTab('Notes')}>
                                <Text style={styles.viewAllText}>View All Notes</Text>
                                <Feather name="chevron-right" size={14} color="#065F46" />
                            </TouchableOpacity>
                        </View>
                        {notes.length > 0 ? (
                            <View style={styles.noteCard}>
                                <View style={styles.noteIconBg}>
                                    <Ionicons name="document-text-outline" size={18} color="#D97706" />
                                </View>
                                <View style={{ flex: 1, flexShrink: 1 }}>
                                    <Text style={styles.noteContent}>{notes[0].desc || notes[0].title}</Text>
                                    <Text style={styles.noteMeta}>{notes[0].date} • {notes[0].author || 'Field Agent'}</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={{ padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 13, color: colors.textSecondary || '#6B7280' }}>No notes added yet.</Text>
                            </View>
                        )}

                        {/* ── PLANTING SEASON TIMELINE ───────────────── */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Planting Season Timeline</Text>
                            <View style={styles.seasonBadge}>
                                <Text style={styles.seasonBadgeText}>2025 Season</Text>
                            </View>
                        </View>
                        <View style={styles.timelineCard}>
                            {timelineItems.map((item, idx, arr) => (
                                <TouchableOpacity 
                                    key={idx} 
                                    style={styles.timelineItemRow}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (item.activityId) {
                                            router.push({
                                                pathname: '/(agent)/logActivities',
                                                params: { activityId: item.activityId },
                                            });
                                        }
                                    }}
                                >
                                    {/* Left: Node + Line */}
                                    <View style={styles.timelineNodeCol}>
                                        <View style={[
                                            styles.tlNode,
                                            item.status === 'done' && { backgroundColor: item.color, borderColor: item.color },
                                            item.status === 'pending' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
                                            item.status === 'upcoming' && { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
                                        ]}>
                                            {item.status === 'done' && (
                                                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                                            )}
                                            {item.status === 'pending' && (
                                                <Ionicons name="time-outline" size={10} color="#FFFFFF" />
                                            )}
                                            {item.status === 'upcoming' && (
                                                <View style={styles.tlNodeInnerDot} />
                                            )}
                                        </View>
                                        {idx < arr.length - 1 && (
                                            <View style={[
                                                styles.tlLine,
                                                item.status === 'done' && { backgroundColor: item.color, opacity: 0.3 },
                                            ]} />
                                        )}
                                    </View>

                                    {/* Right: Content */}
                                    <View style={styles.tlContentCol}>
                                        <View style={styles.tlHeaderRow}>
                                            <View style={[styles.tlIconBg, { backgroundColor: item.bg }]}>
                                                <Ionicons name={item.icon as any} size={14} color={item.color} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={styles.tlLabel}>{item.label}</Text>
                                                <Text style={styles.tlSublabel}>{item.sublabel}</Text>
                                            </View>
                                            <View style={[styles.tlDateBadge, { backgroundColor: item.bg }]}>
                                                <Text style={[styles.tlDateText, { color: item.color }]}>{item.date}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.tlNoteRow}>
                                            <Text style={styles.tlNote}>{item.note}</Text>
                                            {item.status === 'done' && (
                                                <View style={styles.tlDonePill}>
                                                    <Text style={styles.tlDoneText}>✓ Completed</Text>
                                                </View>
                                            )}
                                            {item.status === 'pending' && (
                                                <View style={styles.tlPendingPill}>
                                                    <Text style={styles.tlPendingText}>Pending</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                )}

                {activeTab === 'Farms' && viewMode === 'list' && (
                    <View style={styles.farmsListContainer}>
                        {farms.map((farm) => (
                            <TouchableOpacity key={farm.id} style={styles.farmCard} onPress={() => router.push({ pathname: '/(agent)/farmDetails', params: { id: farm.id } })}>
                                <View style={styles.farmCardTop}>
                                    <View style={styles.farmIconBg}>
                                        <MaterialCommunityIcons name="home-flood" size={24} color="#065F46" />
                                    </View>
                                    <View style={styles.farmMainInfo}>
                                        <View style={styles.farmNameRow}>
                                            <Text style={styles.farmName} numberOfLines={1}>{farm.name}</Text>
                                            <View style={[styles.typeBadge, { backgroundColor: farm.type === 'Primary' ? '#ECFDF5' : '#FFF7ED' }]}>
                                                <Text style={[styles.typeBadgeText, { color: farm.type === 'Primary' ? '#059669' : '#D97706' }]}>{farm.type}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.farmInfoRow}>
                                            <Ionicons name="location-outline" size={12} color="#6B7280" />
                                            <Text style={styles.farmInfoText} numberOfLines={1}>{farm.location}</Text>
                                        </View>
                                        <View style={styles.farmInfoRow}>
                                            <Ionicons name="leaf-outline" size={12} color="#6B7280" />
                                            <Text style={styles.farmInfoText}>{farm.crop} • {farm.area}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.farmActionRow}>
                                        <View style={styles.areaContainer}>
                                            <Text style={styles.areaValue}>{farm.totalArea}</Text>
                                            <Text style={styles.areaLabel}>Total</Text>
                                        </View>
                                        <Feather name="chevron-right" size={18} color="#D1D5DB" />
                                    </View>
                                </View>
                                <View style={styles.farmStatsGrid}>
                                    <View style={styles.farmStatItem}>
                                        <View style={styles.statIconBg}>
                                            <MaterialCommunityIcons name="hydro-power" size={16} color="#065F46" />
                                        </View>
                                        <View>
                                            <Text style={styles.statValue}>{farm.fields}</Text>
                                            <Text style={styles.statLabel}>Fields</Text>
                                        </View>
                                    </View>
                                    <View style={styles.farmStatDivider} />
                                    <View style={styles.farmStatItem}>
                                        <View style={styles.statIconBg}>
                                            <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                                        </View>
                                        <View>
                                            <Text style={styles.statValue}>{farm.tasksCompleted}</Text>
                                            <Text style={styles.statLabel}>Tasks Completed</Text>
                                        </View>
                                    </View>
                                    <View style={styles.farmStatDivider} />
                                    <View style={styles.farmStatItem}>
                                        <View style={styles.statIconBg}>
                                            <Ionicons name="time-outline" size={16} color="#D97706" />
                                        </View>
                                        <View>
                                            <Text style={styles.statValue}>Last Visit</Text>
                                            <Text style={styles.statLabel}>{farm.lastVisit}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.farmStatDivider} />
                                    <View style={styles.farmStatItem}>
                                        <View style={[styles.statIconBg, { backgroundColor: farm.validationBg }]}>
                                            <Ionicons name="checkmark-circle-outline" size={16} color={farm.validationColor} />
                                        </View>
                                        <View>
                                            <Text style={styles.statValue}>Validation</Text>
                                            <Text style={[styles.statLabel, { color: farm.validationColor }]}>{farm.validationStatus}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={styles.addActionRow} onPress={() => router.navigate('/(agent)/register-farmer/farm-details' as any)}>
                            <View style={styles.actionIconBg}>
                                <Ionicons name="add" size={20} color="#065F46" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.addText}>Add New Farm</Text>
                                <Text style={styles.addSubText}>Register a new farm for this farmer.</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#D1D5DB" />
                        </TouchableOpacity>

                        <View style={styles.infoTip}>
                            <View style={styles.tipIconBg}>
                                <Ionicons name="leaf-outline" size={18} color="#065F46" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.tipText}>
                                    <Text style={{ fontWeight: '700' }}>Fields are sub-sections of each farm.</Text> Manage fields to organize activities, tasks and data collection.
                                </Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.learnMore}>Learn more</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {activeTab === 'Farms' && viewMode === 'map' && (
                    <View style={styles.mapContainerPlaceholder}>
                        <View style={[styles.mapPlaceholder, { height: 350, overflow: 'hidden' }]}>
                            <MapView
                                style={StyleSheet.absoluteFill}
                                provider={PROVIDER_DEFAULT}
                                mapType="hybrid"
                                initialRegion={{
                                    latitude: (fields.length > 0 && parseFloat(fields[0]?.centroidLat)) || 11.08,
                                    longitude: (fields.length > 0 && parseFloat(fields[0]?.centroidLng)) || 7.71,
                                    latitudeDelta: 0.03,
                                    longitudeDelta: 0.03,
                                }}
                            >
                                {fields.map((field) => {
                                    const geojson = field.boundaryGeojson;
                                    if (geojson && geojson.type === 'Polygon' && Array.isArray(geojson.coordinates) && Array.isArray(geojson.coordinates[0])) {
                                        const validCoords = geojson.coordinates[0]
                                            .map((c: any) => ({
                                                latitude: parseFloat(c[1]),
                                                longitude: parseFloat(c[0])
                                            }))
                                            .filter((c: any) => isFinite(c.latitude) && isFinite(c.longitude));

                                        if (validCoords.length >= 3) {
                                            const centLat = parseFloat(field.centroidLat);
                                            const centLng = parseFloat(field.centroidLng);
                                            const hasValidCentroid = isFinite(centLat) && isFinite(centLng);

                                            return (
                                                <React.Fragment key={field.id}>
                                                    <Polygon
                                                        coordinates={validCoords}
                                                        strokeColor="#0E6F6A"
                                                        fillColor="rgba(14, 111, 106, 0.4)"
                                                        strokeWidth={2.5}
                                                    />
                                                    {hasValidCentroid && (
                                                        <Marker
                                                            coordinate={{ latitude: centLat, longitude: centLng }}
                                                            title={field.name}
                                                            description={`Area: ${field.area}`}
                                                        />
                                                    )}
                                                </React.Fragment>
                                            );
                                        }
                                    }
                                    return null;
                                })}
                            </MapView>
                        </View>
                    </View>
                )}


                {activeTab === 'Tasks' && (
                    <View style={styles.tasksTabContainer}>
                        <View style={styles.filterPillsRow}>
                            <TouchableOpacity onPress={() => setTaskFilter('All')} style={[styles.filterPill, taskFilter === 'All' && styles.filterPillActive]}>
                                <Text style={taskFilter === 'All' ? styles.filterPillTextActive : styles.filterPillText}>All ({farmerTasks.all.length})</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTaskFilter('Overdue')} style={[styles.filterPill, taskFilter === 'Overdue' && styles.filterPillActive]}>
                                <Text style={taskFilter === 'Overdue' ? styles.filterPillTextActive : styles.filterPillText}>Overdue ({farmerTasks.overdue.length})</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTaskFilter('To Do')} style={[styles.filterPill, taskFilter === 'To Do' && styles.filterPillActive]}>
                                <Text style={taskFilter === 'To Do' ? styles.filterPillTextActive : styles.filterPillText}>To Do ({farmerTasks.todo.length})</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTaskFilter('Completed')} style={[styles.filterPill, taskFilter === 'Completed' && styles.filterPillActive]}>
                                <Text style={taskFilter === 'Completed' ? styles.filterPillTextActive : styles.filterPillText}>Completed ({farmerTasks.completed.length})</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {farmerTasks.all.length === 0 ? (
                            <View style={{ padding: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, alignItems: 'center', marginTop: 12 }}>
                                <Ionicons name="clipboard-outline" size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 }}>No Tasks Assigned</Text>
                                <Text style={{ fontSize: 13, color: colors.textSecondary || '#6B7280', textAlign: 'center', lineHeight: 18 }}>
                                    No farming tasks have been scheduled or assigned for {farmerName} yet.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {(taskFilter === 'All' || taskFilter === 'Overdue') && farmerTasks.overdue.length > 0 && (
                                    <View style={styles.taskGroupContainer}>
                                        <Text style={styles.taskGroupTitle}>Overdue ({farmerTasks.overdue.length})</Text>
                                        {farmerTasks.overdue.map(task => (
                                            <TouchableOpacity 
                                                key={task.id} 
                                                style={styles.fullTaskCard}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    if (task.stageCode) {
                                                        router.push({
                                                            pathname: '/(agent)/logActivities',
                                                            params: { activityId: task.stageCode },
                                                        });
                                                    }
                                                }}
                                            >
                                                <View style={[styles.taskIconBg, { backgroundColor: task.bg || '#FEF2F2' }]}><Ionicons name={(task.icon || 'alert-circle-outline') as any} size={16} color={task.color || '#DC2626'} /></View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.fullTaskTitle}>{task.title}</Text>
                                                    <Text style={styles.fullTaskMeta}>{task.farm || 'Farm'} • Due {task.due || task.date || '—'}</Text>
                                                </View>
                                                <View style={[styles.statusPill, { backgroundColor: '#FEF2F2' }]}><Text style={[styles.statusPillText, { color: '#DC2626' }]}>Overdue</Text></View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {(taskFilter === 'All' || taskFilter === 'To Do') && farmerTasks.todo.length > 0 && (
                                    <View style={styles.taskGroupContainer}>
                                        <Text style={styles.taskGroupTitle}>To Do ({farmerTasks.todo.length})</Text>
                                        {farmerTasks.todo.map(task => (
                                            <TouchableOpacity 
                                                key={task.id} 
                                                style={styles.fullTaskCard}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    if (task.stageCode) {
                                                        router.push({
                                                            pathname: '/(agent)/logActivities',
                                                            params: { activityId: task.stageCode },
                                                        });
                                                    }
                                                }}
                                            >
                                                <View style={[styles.taskIconBg, { backgroundColor: task.bg || '#EFF6FF' }]}><Ionicons name={(task.icon || 'time-outline') as any} size={16} color={task.color || '#2563EB'} /></View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.fullTaskTitle}>{task.title}</Text>
                                                    <Text style={styles.fullTaskMeta}>{task.farm || 'Farm'} • {task.due || task.date || 'Pending'}</Text>
                                                </View>
                                                <View style={[styles.statusPill, { backgroundColor: '#F3F4F6' }]}><Text style={[styles.statusPillText, { color: '#6B7280' }]}>To Do</Text></View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {(taskFilter === 'All' || taskFilter === 'Completed') && farmerTasks.completed.length > 0 && (
                                    <View style={styles.taskGroupContainer}>
                                        <Text style={styles.taskGroupTitle}>Completed ({farmerTasks.completed.length})</Text>
                                        {farmerTasks.completed.map(task => (
                                            <TouchableOpacity
                                                key={task.id}
                                                style={[styles.fullTaskCard]}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    setSelectedTaskLog({ id: task.id, title: task.title, stageCode: task.stageCode || '', date: task.due || task.date || '' });
                                                    setShowTaskLogModal(true);
                                                }}
                                            >
                                                <View style={[styles.taskIconBg, { backgroundColor: '#ECFDF5' }]}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.fullTaskTitle}>{task.title}</Text>
                                                    <Text style={styles.fullTaskMeta}>{task.farm || 'Farm'} • Completed {task.due || task.date || ''}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <View style={[styles.statusPill, { backgroundColor: '#ECFDF5' }]}>
                                                        <Text style={[styles.statusPillText, { color: '#059669' }]}>✓ Done</Text>
                                                    </View>
                                                    <Feather name="chevron-right" size={15} color="#D1D5DB" />
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}

                {activeTab === 'Activity' && (
                    <View style={styles.activityTabContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={styles.sectionTitle}>Interaction Timeline</Text>
                            <TouchableOpacity style={styles.filterBtnOutline}><Feather name="filter" size={14} color="#374151" /></TouchableOpacity>
                        </View>
                        
                        {activities.length > 0 ? (
                            activities.map((act, idx) => (
                                <View key={act.id || idx} style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineNode, { borderColor: act.color || '#0E6F6A' }]}>
                                            <View style={[styles.timelineInnerDot, { backgroundColor: act.color || '#0E6F6A' }]} />
                                        </View>
                                        {idx < activities.length - 1 && <View style={styles.timelineLine} />}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <View style={styles.activityCardBody}>
                                            <View style={styles.activityCardHeader}>
                                                <View style={[styles.activityIconBox, { backgroundColor: (act.color || '#0E6F6A') + '15' }]}><Ionicons name={(act.icon || 'walk-outline') as any} size={16} color={act.color || '#0E6F6A'} /></View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.activityCardTitle}>{act.title}</Text>
                                                    <Text style={styles.activityCardDate}>{act.date}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.activityCardDesc}>{act.desc}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={{ padding: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, alignItems: 'center' }}>
                                <Ionicons name="time-outline" size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 }}>No Activities Recorded</Text>
                                <Text style={{ fontSize: 13, color: colors.textSecondary || '#6B7280', textAlign: 'center', lineHeight: 18 }}>
                                    No field visits, phone calls, or operations have been logged yet for {farmerName}. Use the action buttons above to record an activity.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'Notes' && (
                    <View style={styles.notesTabContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Farmer Notes</Text>
                            <TouchableOpacity style={styles.addBtnOutline} onPress={() => setShowInteractionModal('visit')}><Feather name="plus" size={14} color="#059669" /><Text style={styles.addBtnText}>New Note</Text></TouchableOpacity>
                        </View>

                        {notes.length > 0 ? (
                            notes.map(note => (
                                <View key={note.id} style={styles.bigNoteCard}>
                                    <View style={styles.bigNoteHeader}>
                                        <View style={[styles.noteCatBadge, { backgroundColor: (note.color || '#059669') + '15' }]}><Text style={[styles.noteCatText, { color: note.color || '#059669' }]}>{note.category || 'NOTE'}</Text></View>
                                        <Text style={styles.bigNoteDate}>{note.date}</Text>
                                    </View>
                                    <Text style={styles.bigNoteTitle}>{note.title}</Text>
                                    <Text style={styles.bigNoteDesc}>{note.desc}</Text>
                                    <View style={styles.bigNoteFooter}>
                                        <View style={styles.noteAuthorRow}>
                                            <Ionicons name="person-circle-outline" size={16} color="#9CA3AF" />
                                            <Text style={styles.noteAuthorText}>{note.author || 'Agent'}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.attachBtn}><Ionicons name="attach-outline" size={16} color="#6B7280" /></TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={{ padding: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, alignItems: 'center' }}>
                                <Ionicons name="document-text-outline" size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 }}>No Notes Recorded</Text>
                                <Text style={{ fontSize: 13, color: colors.textSecondary || '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 12 }}>
                                    No agronomic or field notes have been added yet for {farmerName}.
                                </Text>
                                <TouchableOpacity style={styles.addBtnOutline} onPress={() => setShowInteractionModal('visit')}>
                                    <Feather name="plus" size={14} color="#059669" />
                                    <Text style={styles.addBtnText}>Add First Note</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Floating Action Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.outlineFooterBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color="#065F46" />
                    <Text style={styles.outlineFooterBtnText}>Send Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineFooterBtn}>
                    <Ionicons name="call-outline" size={18} color="#065F46" />
                    <Text style={styles.outlineFooterBtnText}>Call Farmer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filledFooterBtn} onPress={() => router.push('/(agent)/tasks')}>
                    <Ionicons name="add" size={22} color="white" />
                    <Text style={styles.filledFooterBtnText}>Add Task</Text>
                </TouchableOpacity>
            </View>

            {/* ── TASK LOG VIEWER MODAL ── */}
            <Modal visible={showTaskLogModal} transparent animationType="slide" onRequestClose={() => setShowTaskLogModal(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' }}>
                        {/* Handle */}
                        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
                        </View>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} numberOfLines={2}>{selectedTaskLog?.title}</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{selectedTaskLog?.stageCode} · Completed {selectedTaskLog?.date}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowTaskLogModal(false)} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={26} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Validation Banner */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', marginHorizontal: 20, marginTop: 14, borderRadius: 10, padding: 12, gap: 10 }}>
                            <Ionicons name="shield-checkmark" size={18} color="#059669" />
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>Validated & Approved</Text>
                                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Reviewed by {currentAgentName} · {selectedTaskLog?.date}</Text>
                            </View>
                        </View>

                        {/* Log Fields */}
                        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                            {taskLogFields.map((field, idx) => (
                                <View key={idx} style={{ paddingVertical: 13, borderBottomWidth: idx < taskLogFields.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                                        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                                            <Ionicons name={field.icon as any} size={15} color="#059669" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{field.label}</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827', lineHeight: 20 }}>{field.value}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── MODAL 1: CROP STAGE SELECTOR BOTTOM SHEET ── */}


            <Modal visible={showStagePicker} transparent animationType="slide">
                <BlurView 
                    intensity={20} 
                    tint="dark" 
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17, 24, 39, 0.7)' }]}
                />
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowStagePicker(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitleText}>Update Crop Stage</Text>
                            <TouchableOpacity onPress={() => setShowStagePicker(false)}>
                                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {['Not Started', 'Pre-Planting', 'Land Prep', 'Sowing', 'Fertilizing', 'Weeding', 'Harvesting'].map((stage) => {
                            const active = currentStage === stage;
                            return (
                                <TouchableOpacity 
                                    key={stage}
                                    style={[styles.stagePickRow, active && { backgroundColor: '#E6F4F0', borderColor: '#0E6F6A' }]}
                                    onPress={async () => {
                                        setCurrentStage(stage);
                                        const newAct = {
                                            id: `a-${Date.now()}`,
                                            title: `Stage: ${stage}`,
                                            type: 'System',
                                            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                            desc: `Farmer transitioned to ${stage} phase. Activity recorded by field agent.`,
                                            icon: 'sync-circle-outline',
                                            color: '#0E6F6A'
                                        };
                                        const nextActs = [newAct, ...activities];
                                        setActivities(nextActs);
                                        setShowStagePicker(false);

                                        // Persist stage change to backend API database
                                        if (id) {
                                            try {
                                                await api.patch(`/farmers/${id}`, {
                                                    metadata: {
                                                        ...(dbFarmer?.metadata || {}),
                                                        currentCropStage: stage,
                                                        activities: nextActs,
                                                    }
                                                });
                                            } catch (err) {
                                                console.warn("Failed to persist stage update to backend:", err);
                                            }
                                        }
                                    }}
                                >
                                    <Text style={[styles.stagePickText, active && { color: '#0E6F6A', fontWeight: '700' }]}>
                                        {stage}
                                    </Text>
                                    {active && <Ionicons name="checkmark-circle" size={20} color="#0E6F6A" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── MODAL 2: LOG VISIT OR PHONE CALL ─────────── */}
            <Modal visible={showInteractionModal === 'visit' || showInteractionModal === 'call'} transparent animationType="slide">
                <BlurView
                    intensity={20}
                    tint="dark"
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17, 24, 39, 0.7)' }]}
                />
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: 0 }]}>
                        <View style={styles.modalDragHandle} />
                        {/* Header */}
                        <View style={styles.modalHeaderRow}>
                            <View>
                                <Text style={styles.modalTitleText}>
                                    {showInteractionModal === 'visit' ? '🌾 Log Field Visit' : '📞 Log Phone Call'}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{farmerName} • Today</Text>
                            </View>
                            <TouchableOpacity onPress={() => { setShowInteractionModal(null); resetLogForm(); }}>
                                <Ionicons name="close-circle" size={26} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 24 }}>

                            {/* ── SECTION 1: Visit Purpose ── */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>
                                    {showInteractionModal === 'visit' ? 'Visit Purpose' : 'Call Purpose'}
                                </Text>
                                <View style={styles.purposeRow}>
                                    {(['Routine Check', 'Follow-up', 'Issue Response', 'Data Collection'] as const).map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[styles.purposePill, visitPurpose === p && styles.purposePillActive]}
                                            onPress={() => setVisitPurpose(p)}
                                        >
                                            <Text style={[styles.purposePillText, visitPurpose === p && styles.purposePillTextActive]}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* ── SECTION 2: Crop Stage Observed (visit only) ── */}
                            {showInteractionModal === 'visit' && (
                                <View style={styles.formSection}>
                                    <Text style={styles.formSectionTitle}>Crop Stage Observed</Text>
                                    <View style={styles.stageChipRow}>
                                        {['Pre-Planting', 'Land Prep', 'Sowing', 'Fertilizing', 'Weeding', 'Harvesting'].map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.stageChip, cropStageObserved === s && styles.stageChipActive]}
                                                onPress={() => setCropStageObserved(s)}
                                            >
                                                <Text style={[styles.stageChipText, cropStageObserved === s && styles.stageChipTextActive]}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ── SECTION 3: Farm Condition Rating (visit only) ── */}
                            {showInteractionModal === 'visit' && (
                                <View style={styles.formSection}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={styles.formSectionTitle}>Farm Condition</Text>
                                        <Text style={styles.ratingLabel}>
                                            {farmCondition === 1 ? '😟 Very Poor' : farmCondition === 2 ? '😕 Poor' : farmCondition === 3 ? '😐 Average' : farmCondition === 4 ? '😊 Good' : '🌟 Excellent'}
                                        </Text>
                                    </View>
                                    <View style={styles.ratingRow}>
                                        {([1,2,3,4,5] as const).map(r => (
                                            <TouchableOpacity
                                                key={r}
                                                style={[styles.ratingDot, farmCondition >= r && styles.ratingDotActive]}
                                                onPress={() => setFarmCondition(r)}
                                            >
                                                <Text style={styles.ratingDotNum}>{r}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        <View style={styles.ratingTrack} />
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                        <Text style={{ fontSize: 9, color: '#9CA3AF' }}>Very Poor</Text>
                                        <Text style={{ fontSize: 9, color: '#9CA3AF' }}>Excellent</Text>
                                    </View>
                                </View>
                            )}

                            {/* ── SECTION 4: Key Observations Checklist (visit only) ── */}
                            {showInteractionModal === 'visit' && (
                                <View style={styles.formSection}>
                                    <Text style={styles.formSectionTitle}>Key Observations</Text>
                                    {[
                                        'Adequate plant stand',
                                        'Pest / disease signs observed',
                                        'Weed pressure present',
                                        'Soil moisture adequate',
                                        'Fertilizer applied correctly',
                                        'Irrigation issues noted',
                                        'Good agronomic practices',
                                        'Post-harvest storage inspected',
                                    ].map(obs => (
                                        <TouchableOpacity
                                            key={obs}
                                            style={styles.checkRow}
                                            onPress={() => toggleObservation(obs)}
                                        >
                                            <View style={[styles.checkBox, checkedObservations.includes(obs) && styles.checkBoxChecked]}>
                                                {checkedObservations.includes(obs) && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                                            </View>
                                            <Text style={[styles.checkLabel, checkedObservations.includes(obs) && styles.checkLabelChecked]}>{obs}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* ── SECTION 5: Farmer Concerns / Discussion ── */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>
                                    {showInteractionModal === 'visit' ? 'Farmer Concerns Raised' : 'Key Discussion Points'}
                                </Text>
                                <View style={styles.textInputBox}>
                                    <TextInput
                                        value={farmerConcerns}
                                        onChangeText={setFarmerConcerns}
                                        placeholder={showInteractionModal === 'visit' ? 'What concerns did the farmer raise?' : 'What was discussed on the call?'}
                                        placeholderTextColor="#9CA3AF"
                                        multiline={true}
                                        style={[styles.textAreaFieldMobile, { minHeight: 80 }]}
                                    />
                                </View>
                            </View>

                            {/* ── SECTION 6: Recommended Actions ── */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Recommended Actions / Advice Given</Text>
                                <View style={styles.textInputBox}>
                                    <TextInput
                                        value={recommendedActions}
                                        onChangeText={setRecommendedActions}
                                        placeholder="E.g. Apply urea at 60 kg/ha, scout for armyworm..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline={true}
                                        style={[styles.textAreaFieldMobile, { minHeight: 80 }]}
                                    />
                                </View>
                            </View>

                            {/* ── SECTION 7: Follow-Up Plan ── */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Follow-Up Plan</Text>
                                <View style={styles.formRow}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.inputLabelText}>Next Follow-Up Date</Text>
                                        <View style={[styles.textInputBox, { height: 46, marginBottom: 0 }]}>
                                            <TextInput
                                                value={followUpDate}
                                                onChangeText={setFollowUpDate}
                                                placeholder="DD/MM/YYYY"
                                                placeholderTextColor="#9CA3AF"
                                                style={[styles.textAreaFieldMobile, { textAlignVertical: 'center' }]}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabelText}>Next Step</Text>
                                        <View style={styles.nextStepRow}>
                                            {(['Visit', 'Call', 'None'] as const).map(s => (
                                                <TouchableOpacity
                                                    key={s}
                                                    style={[styles.nextStepBtn, nextStep === s && styles.nextStepBtnActive]}
                                                    onPress={() => setNextStep(s)}
                                                >
                                                    <Ionicons
                                                        name={s === 'Visit' ? 'walk-outline' : s === 'Call' ? 'call-outline' : 'close-outline'}
                                                        size={14}
                                                        color={nextStep === s ? '#0E6F6A' : '#9CA3AF'}
                                                    />
                                                    <Text style={[styles.nextStepText, nextStep === s && styles.nextStepTextActive]}>{s}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* ── SECTION 8: Summary Note ── */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Additional Notes / Summary</Text>
                                <View style={styles.textInputBox}>
                                    <TextInput
                                        value={noteInput}
                                        onChangeText={setNoteInput}
                                        placeholder="Any other observations, photos taken, etc..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline={true}
                                        style={[styles.textAreaFieldMobile, { minHeight: 80 }]}
                                    />
                                </View>
                            </View>

                            {/* ── Submit ── */}
                            <TouchableOpacity
                                style={[styles.submitLogBtn, { marginHorizontal: 0, marginTop: 4 }]}
                                onPress={() => {
                                    const isVisit = showInteractionModal === 'visit';
                                    const summary = [
                                        `Purpose: ${visitPurpose}`,
                                        isVisit ? `Stage Observed: ${cropStageObserved}` : null,
                                        isVisit ? `Farm Condition: ${farmCondition}/5` : null,
                                        checkedObservations.length > 0 ? `Observations: ${checkedObservations.join(', ')}` : null,
                                        farmerConcerns.trim() ? `Concerns: ${farmerConcerns.trim()}` : null,
                                        recommendedActions.trim() ? `Actions: ${recommendedActions.trim()}` : null,
                                        followUpDate ? `Follow-up: ${nextStep} on ${followUpDate}` : null,
                                        noteInput.trim() ? `Notes: ${noteInput.trim()}` : null,
                                    ].filter(Boolean).join(' | ');

                                    if (!summary) return;

                                    const newAct = {
                                        id: `a-${Date.now()}`,
                                        title: isVisit ? `Field Visit — ${visitPurpose}` : `Phone Call — ${visitPurpose}`,
                                        type: isVisit ? 'Visit' : 'Call',
                                        date: 'Today',
                                        desc: summary,
                                        icon: isVisit ? 'walk-outline' : 'call-outline',
                                        color: isVisit ? '#059669' : '#2563EB',
                                    };
                                    const nextActs = [newAct, ...activities];
                                    setActivities(nextActs);

                                    const newNote = {
                                        id: `n-${Date.now()}`,
                                        title: isVisit ? `Visit — ${visitPurpose}` : `Call — ${visitPurpose}`,
                                        category: isVisit ? 'AGRONOMIC' : 'LOGISTICS',
                                        date: 'Today',
                                        desc: summary,
                                        author: 'Agent (You)',
                                        color: isVisit ? '#059669' : '#2563EB',
                                    };
                                    const nextNotes = [newNote, ...notes];
                                    setNotes(nextNotes);
                                    setShowInteractionModal(null);
                                    resetLogForm();

                                    // Persist logged interaction to backend API database
                                    if (id) {
                                        api.patch(`/farmers/${id}`, {
                                            metadata: {
                                                ...(dbFarmer?.metadata || {}),
                                                activities: nextActs,
                                                notes: nextNotes,
                                            }
                                        }).catch(err => console.warn("Failed to persist interaction:", err));
                                    }
                                }}
                            >
                                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.submitLogBtnText}>Save {showInteractionModal === 'visit' ? 'Visit' : 'Call'} Log</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── MODAL 3: ADD PICTURE SIMULATED VIEWPORT ──── */}
            <Modal visible={showInteractionModal === 'picture'} transparent animationType="slide">
                <View style={styles.cameraOverlay}>
                    {/* Viewfinder Grid */}
                    <View style={styles.viewfinderContainer}>
                        <View style={styles.viewfinderGridBorder} />
                        <View style={styles.viewfinderTargetOval} />
                        <Text style={styles.cameraTipText}>Align crop or boundary markers inside frame</Text>
                    </View>

                    {/* Camera Action Controls bottom panel */}
                    <View style={styles.cameraBottomBar}>
                        <TouchableOpacity 
                            style={styles.cameraCancelBtn}
                            onPress={() => setShowInteractionModal(null)}
                        >
                            <Text style={styles.cameraCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.cameraCaptureBtn}
                            onPress={() => {
                                // Add verification photo to gallery
                                const sampleImgs = [
                                    'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?auto=format&fit=crop&w=300&q=80',
                                    'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=300&q=80',
                                    'https://images.unsplash.com/photo-1599933332469-b4b12753bc54?auto=format&fit=crop&w=300&q=80'
                                ];
                                const randomImg = sampleImgs[Math.floor(Math.random() * sampleImgs.length)];
                                const newPic = {
                                    id: `pic-${Date.now()}`,
                                    uri: randomImg,
                                    date: 'Today',
                                    stage: currentStage
                                };
                                setPictures([newPic, ...pictures]);

                                // Log activity timeline update
                                const newAct = {
                                    id: `act-pic-${Date.now()}`,
                                    title: 'Verification Photo Uploaded',
                                    type: 'System',
                                    date: 'Today',
                                    desc: `A verification picture was captured during ${currentStage} stage operations.`,
                                    icon: 'camera-outline',
                                    color: '#B45309'
                                };
                                setActivities([newAct, ...activities]);
                                setShowInteractionModal(null);
                            }}
                        >
                            <View style={styles.cameraCaptureInnerCircle} />
                        </TouchableOpacity>

                        <View style={{ width: 60 }} />
                    </View>
                </View>
            </Modal>

            {/* ── 1:1 BIOMETRIC VERIFICATION MODAL (100% OFFLINE FINTECH ENGINE) ──── */}
            <Modal visible={showBiometricModal} animationType="slide" transparent>
                <View style={styles.verifyModalContainer}>
                    {/* Top Control Bar */}
                    <View style={styles.verifyTopBar}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {enrolledPhotoUri ? (
                                <Image source={{ uri: enrolledPhotoUri }} style={styles.enrolledThumb} contentFit="cover" />
                            ) : (
                                <View style={styles.enrolledThumbPlaceholder}>
                                    <Ionicons name="person" size={18} color="#FFFFFF" />
                                </View>
                            )}
                            <View>
                                <Text style={styles.verifyModalTitle}>1:1 Facial Verification</Text>
                                <Text style={styles.verifyModalSubtitle}>Target: {farmerName} ({farmerIdCode})</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.verifyCloseBtn} 
                            onPress={() => {
                                setShowBiometricModal(false);
                                setVerificationResult(null);
                            }}
                        >
                            <Ionicons name="close" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Live Camera Viewfinder with Oval Head Reticle */}
                    <View style={styles.verifyCameraViewport}>
                        <CameraView 
                            ref={verifyCameraRef}
                            facing={verifyCameraFacing}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Oval Cutout Mask */}
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            <Svg height="100%" width="100%">
                                <Defs>
                                    <Mask id="verifyOvalMask">
                                        <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                                        <Ellipse
                                            cx={width / 2}
                                            cy={220}
                                            rx={115}
                                            ry={155}
                                            fill="black"
                                        />
                                    </Mask>
                                </Defs>
                                <Rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    fill="rgba(0, 0, 0, 0.70)"
                                    mask="url(#verifyOvalMask)"
                                />
                            </Svg>
                        </View>

                        {/* Glowing Reticle Border */}
                        <View 
                            style={[
                                styles.verifyReticleOval, 
                                { 
                                    borderColor: verificationResult 
                                        ? (verificationResult.isMatch ? '#10B981' : '#EF4444') 
                                        : '#0E6F6A' 
                                }
                            ]} 
                            pointerEvents="none" 
                        />

                        {/* Verification Result Banner or Scanner Guidance */}
                        <View style={styles.verifyGuidanceCard}>
                            {isBiometricScanning ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <ActivityIndicator size="small" color="#0E6F6A" />
                                    <Text style={styles.verifyGuidanceText}>Computing 12-D Vector & Cosine Similarity...</Text>
                                </View>
                            ) : verificationResult ? (
                                <View style={{ alignItems: 'center', gap: 4 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Ionicons 
                                            name={verificationResult.isMatch ? "checkmark-circle" : "close-circle"} 
                                            size={22} 
                                            color={verificationResult.isMatch ? "#059669" : "#DC2626"} 
                                        />
                                        <Text style={[
                                            styles.resultVerdictTitle, 
                                            { color: verificationResult.isMatch ? "#059669" : "#DC2626" }
                                        ]}>
                                            {verificationResult.isMatch ? "IDENTITY CONFIRMED" : "IDENTITY MISMATCH"}
                                        </Text>
                                    </View>
                                    <Text style={styles.resultConfidenceText}>
                                        Match Confidence: {verificationResult.confidence}% (Cosine Sim: {verificationResult.similarity})
                                    </Text>
                                    <Text style={styles.resultMessageText}>{verificationResult.message}</Text>
                                    <Text style={styles.resultTimestampText}>Audited At: {verificationResult.testedAt}</Text>
                                </View>
                            ) : (
                                <Text style={styles.verifyGuidanceText}>
                                    Center farmer's face inside the oval and tap "Verify Live Face"
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Bottom Actions Bar */}
                    <View style={styles.verifyBottomBar}>
                        <TouchableOpacity 
                            style={styles.verifyFlipBtn} 
                            onPress={() => setVerifyCameraFacing(prev => prev === 'front' ? 'back' : 'front')}
                            disabled={isBiometricScanning}
                        >
                            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.verifyScanActionBtn, isBiometricScanning && { opacity: 0.6 }]}
                            disabled={isBiometricScanning}
                            onPress={handlePerform1to1Verification}
                        >
                            <Ionicons name="scan-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.verifyScanActionText}>
                                {verificationResult ? 'Re-Scan / Verify Again' : 'Verify Live Face'}
                            </Text>
                        </TouchableOpacity>

                        <View style={{ width: 44 }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    navBarWrapper: {
        position: 'relative',
    },
    moreIconBtn: {
        position: 'absolute',
        bottom: 12,
        right: 16,
        padding: 4,
        zIndex: 20,
    },
    scrollContent: {
        paddingTop: 165,
        paddingBottom: 160, // Ensure bottom content is totally clear of footer
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    profileTopRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FCE7F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#BE185D',
    },
    profileMainInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 6,
    },
    farmerName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    activeBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#065F46',
    },
    locationGroup: {
        marginBottom: 6,
    },
    profileInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    profileInfoText: {
        fontSize: 13,
        color: '#4B5563',
    },
    addressText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 20,
    },
    profileSecondaryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 6,
    },
    contactBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#065F46',
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 20,
    },
    tabsScroll: {
        paddingLeft: 16,
        paddingRight: 40, // Significant end padding for last tab
        gap: 18, // Slightly tighter to fit more on screen before scroll
    },
    tabItem: {
        paddingVertical: 12,
        position: 'relative',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#065F46',
        fontWeight: '700',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#065F46',
        borderRadius: 3,
    },
    tabHeader: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
    },
    tabTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    tabSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    toggleGroup: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 4,
        borderRadius: 10,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#065F46',
        fontWeight: '700',
    },
    farmsListContainer: {
        paddingHorizontal: 16,
        gap: 16,
    },
    farmCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    farmCardTop: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'flex-start',
    },
    farmIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    farmMainInfo: {
        flex: 1,
        gap: 2,
    },
    farmNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 0,
    },
    overviewContainer: {
        paddingHorizontal: 0,
        paddingBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 20,
    },
    infoGridItem: {
        width: '33.33%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 8,
        paddingHorizontal: 4,
    },
    infoIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 11,
        color: '#374151',
        fontWeight: '600',
    },
    metricsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    metricCard: {
        width: (width - 44) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    metricIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    metricLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
    },
    simpleFarmCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 24,
        gap: 12,
    },
    simpleFarmIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    simpleFarmName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginRight: 6,
    },
    simpleFarmLoc: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 4,
    },
    primaryBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    primaryBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#059669',
    },
    farmSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    farmSubInfoText: {
        fontSize: 11,
        color: '#6B7280',
    },
    tasksListCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 24,
        paddingVertical: 4,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        gap: 12,
    },
    taskIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    taskCatBadge: {
        alignSelf: 'flex-start',
    },
    taskCatText: {
        fontSize: 9,
        fontWeight: '800',
    },
    taskStatusText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 2,
    },
    taskDateText: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    noteCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    noteIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFFBEB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noteContent: {
        fontSize: 12,
        color: '#4B5563',
        lineHeight: 18,
        marginBottom: 6,
    },
    noteMeta: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    farmName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    typeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeBadgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    farmInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    farmInfoText: {
        fontSize: 12,
        color: '#6B7280',
    },
    farmActionRow: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        gap: 12,
    },
    areaContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
    },
    areaValue: {
        fontSize: 12,
        fontWeight: '800',
        color: '#374151',
    },
    areaLabel: {
        fontSize: 8,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    farmStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingVertical: 8,
    },
    farmStatItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 8,
    },
    farmStatDivider: {
        display: 'none',
    },
    statIconBg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    statLabel: {
        fontSize: 9,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    addActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    actionIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    addText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    addSubText: {
        fontSize: 12,
        color: '#6B7280',
    },
    infoTip: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        gap: 12,
        marginTop: 8,
    },
    tipIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipText: {
        fontSize: 13,
        color: '#065F46',
        lineHeight: 18,
    },
    learnMore: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065F46',
    },
    mapContainerPlaceholder: {
        paddingHorizontal: 16,
        height: 400,
    },
    mapPlaceholder: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    mapPlaceholderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280',
        marginTop: 12,
    },
    mapPlaceholderSubText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    outlineFooterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#DCFCE7',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
    },
    outlineFooterBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#065F46',
    },
    filledFooterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#065F46',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
    },
    filledFooterBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    
    // Improvised Tabs specific
    tasksTabContainer: { paddingHorizontal: 16, paddingTop: 12 },
    filterPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    filterPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    filterPillActive: { backgroundColor: '#065F46' },
    filterPillText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
    filterPillTextActive: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
    taskGroupContainer: { marginBottom: 24 },
    taskGroupTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 12 },
    fullTaskCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 10 },
    fullTaskTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
    fullTaskMeta: { fontSize: 11, color: '#6B7280' },
    statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusPillText: { fontSize: 10, fontWeight: '700' },

    activityTabContainer: { paddingHorizontal: 16, paddingTop: 12 },
    filterBtnOutline: { padding: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#FFFFFF' },
    timelineRow: { flexDirection: 'row' },
    timelineLeft: { width: 30, alignItems: 'center' },
    timelineNode: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', zIndex: 2 },
    timelineInnerDot: { width: 6, height: 6, borderRadius: 3 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: -2, marginBottom: -2 },
    timelineRight: { flex: 1, paddingBottom: 24, paddingLeft: 8 },
    activityCardBody: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    activityCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    activityIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    activityCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
    activityCardDate: { fontSize: 10, color: '#9CA3AF' },
    activityCardDesc: { fontSize: 12, color: '#4B5563', lineHeight: 18 },

    notesTabContainer: { paddingHorizontal: 16, paddingTop: 12 },
    addBtnOutline: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#DCFCE7', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    addBtnText: { fontSize: 12, fontWeight: '600', color: '#065F46' },
    bigNoteCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16 },
    bigNoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    noteCatBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    noteCatText: { fontSize: 9, fontWeight: '800' },
    bigNoteDate: { fontSize: 11, color: '#9CA3AF' },
    bigNoteTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
    bigNoteDesc: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 16 },
    bigNoteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F9FAFB', paddingTop: 12 },
    noteAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    noteAuthorText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
    attachBtn: { padding: 4 },
    mapMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#065F46',
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // ── Crop Operations Styles ──
    opsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 2,
    },
    opsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    opsSubtitle: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    opsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        fontFamily: 'Acorn-Bold',
        marginTop: 2,
    },
    stageChangeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    stageChangeBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    stageProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 6,
        paddingHorizontal: 4,
    },
    progressCol: {
        alignItems: 'center',
        width: 44,
    },
    progressNode: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    progressInnerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
    },
    progressLabel: {
        fontSize: 8,
        color: '#9CA3AF',
        marginTop: 6,
        fontWeight: '600',
        textAlign: 'center',
        width: 44,
    },
    progressLineSegment: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: -8,
        marginTop: -14, // align with node row vertical center
        zIndex: 1,
    },
    opsActionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 14,
    },
    opsActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    opsActionText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Photos Verification Gallery
    galleryContainer: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    galleryHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 10,
    },
    emptyGalleryBox: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 16,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    emptyGalleryText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    galleryScroll: {
        gap: 10,
    },
    galleryItemCard: {
        width: 100,
        height: 100,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    galleryMetaOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        alignItems: 'center',
    },
    galleryDateText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '600',
    },
    galleryStageBadge: {
        backgroundColor: '#10B981',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginTop: 2,
    },
    galleryStageText: {
        color: '#FFFFFF',
        fontSize: 7,
        fontWeight: '800',
    },

    // Modal Style Helpers
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 15,
    },
    modalDragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitleText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        fontFamily: 'Acorn-Bold',
    },
    stagePickRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 8,
    },
    stagePickText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
    },
    inputLabelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 8,
    },
    textInputBox: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 12,
        height: 120,
        marginBottom: 20,
    },
    textAreaFieldMobile: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        textAlignVertical: 'top',
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    submitLogBtn: {
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitLogBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // Camera viewfinder styles
    cameraOverlay: {
        flex: 1,
        backgroundColor: '#000000',
    },
    viewfinderContainer: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewfinderGridBorder: {
        position: 'absolute',
        width: '80%',
        height: '60%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    viewfinderTargetOval: {
        position: 'absolute',
        width: 220,
        height: 280,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: '#F59E0B',
        borderStyle: 'dashed',
    },
    cameraTipText: {
        position: 'absolute',
        bottom: 40,
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    cameraBottomBar: {
        height: 120,
        backgroundColor: '#000000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
    },
    cameraCancelBtn: {
        width: 60,
    },
    cameraCancelBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    cameraCaptureBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraCaptureInnerCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FFFFFF',
    },

    // ── Planting Season Timeline ──────────────────────
    seasonBadge: {
        backgroundColor: '#E6F4F0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    seasonBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    timelineCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    timelineItemRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    timelineNodeCol: {
        width: 28,
        alignItems: 'center',
        marginRight: 12,
    },
    tlNode: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    tlNodeInnerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D1D5DB',
    },
    tlLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 2,
        marginBottom: 2,
        minHeight: 30,
    },
    tlContentCol: {
        flex: 1,
        paddingBottom: 20,
    },
    tlHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tlIconBg: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tlLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    tlSublabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
        marginTop: 1,
    },
    tlDateBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 6,
    },
    tlDateText: {
        fontSize: 10,
        fontWeight: '700',
    },
    tlNoteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        paddingLeft: 2,
    },
    tlNote: {
        fontSize: 11,
        color: '#6B7280',
        flex: 1,
        lineHeight: 16,
    },
    tlDonePill: {
        backgroundColor: '#ECFDF5',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    tlDoneText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#059669',
    },
    tlPendingPill: {
        backgroundColor: '#FFFBEB',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    tlPendingText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#D97706',
    },

    // ── Detailed Log Visit / Call Form ───────────────────
    formSection: {
        marginBottom: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    formSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    purposeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    purposePill: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    purposePillActive: {
        backgroundColor: '#E6F4F0',
        borderColor: '#0E6F6A',
    },
    purposePillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    purposePillTextActive: {
        color: '#0E6F6A',
        fontWeight: '700',
    },
    stageChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    stageChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    stageChipActive: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    stageChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    stageChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    ratingTrack: {
        position: 'absolute',
        left: 18,
        right: 18,
        height: 2,
        backgroundColor: '#E5E7EB',
        zIndex: 0,
    },
    ratingDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    ratingDotActive: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    ratingDotNum: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },
    ratingLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        gap: 12,
    },
    checkBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBoxChecked: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    checkLabel: {
        fontSize: 13,
        color: '#4B5563',
        flex: 1,
    },
    checkLabelChecked: {
        color: '#0E6F6A',
        fontWeight: '600',
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    nextStepRow: {
        flexDirection: 'row',
        gap: 6,
    },
    nextStepBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    nextStepBtnActive: {
        backgroundColor: '#E6F4F0',
        borderColor: '#0E6F6A',
    },
    nextStepText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    nextStepTextActive: {
        color: '#0E6F6A',
        fontWeight: '700',
    },
    avatarPhoto: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    biometricSection: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    biometricHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    biometricIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E6F4F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    biometricSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    kycStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    kycStatusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    biometricSectionSub: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    verifyFaceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        paddingVertical: 12,
        marginTop: 4,
    },
    verifyFaceBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    verifyModalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    verifyTopBar: {
        paddingTop: Platform.OS === 'ios' ? 54 : 40,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 10,
    },
    enrolledThumb: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#0E6F6A',
    },
    enrolledThumbPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyModalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    verifyModalSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    verifyCloseBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    verifyCameraViewport: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    verifyReticleOval: {
        position: 'absolute',
        top: 65,
        left: (width - 230) / 2,
        width: 230,
        height: 310,
        borderRadius: 115,
        borderWidth: 2.5,
        borderStyle: 'dashed',
    },
    verifyGuidanceCard: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    verifyGuidanceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    resultVerdictTitle: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    resultConfidenceText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    resultMessageText: {
        fontSize: 12,
        color: '#4B5563',
        textAlign: 'center',
    },
    resultTimestampText: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 2,
    },
    verifyBottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 24,
        backgroundColor: 'rgba(0,0,0,0.90)',
    },
    verifyFlipBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyScanActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E6F6A',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 28,
        shadowColor: '#0E6F6A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    verifyScanActionText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});


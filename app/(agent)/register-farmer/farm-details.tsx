import React, { useState, useEffect } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Switch, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import CustomBackNavBar from '../../../components/ui/CustomBackNavBar';
import { registrationState } from '../../../services/registrationState';
import { draftService } from '../../../services/draftService';
import { geoService } from '../../../services/geoService';
import FarmBoundaryWalker, { BoundarySaveResult } from '../../../components/ui/FarmBoundaryWalker';
import SaveDraftModal, { SaveDraftInfo } from '../../../components/ui/SaveDraftModal';

const LAND_TENURE_OPTIONS = ['Owned', 'Leased/Rented', 'Inherited', 'Community/Customary'];
const CROP_OPTIONS = ['Maize', 'Rice', 'Cassava', 'Soybean', 'Sorghum', 'Yam', 'Wheat', 'Vegetables', 'Other'];
const REGENERATIVE_PRACTICES = [
    'Crop Rotation', 'Mulching / Cover Cropping', 'Zero/Minimum Tillage',
    'Organic Manure Usage', 'Agroforestry / Tree Planting', 'Soil Contour Barriers'
];

interface GpsPoint {
    id: number;
    latitude: number;
    longitude: number;
    label: string;
}

export default function FarmerFarmDetailsScreen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const params = useLocalSearchParams();
    const savedData = registrationState.getData();
    const [savedDraftInfo, setSavedDraftInfo] = useState<SaveDraftInfo | null>(null);

    // Form State (Section F & G)
    const [landTenure, setLandTenure] = useState(savedData.landTenure || '');
    const [farmSizeHa, setFarmSizeHa] = useState(savedData.farmSizeHa || '');
    const [farmSizeAcres, setFarmSizeAcres] = useState(savedData.farmSizeAcres || '');
    const [boundaryGeojson, setBoundaryGeojson] = useState<any>(savedData.boundaryGeojson || null);
    const [primaryCrop, setPrimaryCrop] = useState(savedData.primaryCrop || '');
    const [secondaryCrop, setSecondaryCrop] = useState(savedData.secondaryCrop || '');
    
    const [selectedRegenPractices, setSelectedRegenPractices] = useState<string[]>(
        savedData.selectedRegenPractices || []
    );

    const [fertilizerUsed, setFertilizerUsed] = useState(savedData.fertilizerUsed ?? false);
    const [agrochemicalsUsed, setAgrochemicalsUsed] = useState(savedData.agrochemicalsUsed ?? false);

    // Live GPS & Polygon Mapping State (VCM Manual Section 5.1)
    const [gpsCaptured, setGpsCaptured] = useState(savedData.gpsLat ? true : false);
    const [gpsLat, setGpsLat] = useState(savedData.gpsLat || '');
    const [gpsLong, setGpsLong] = useState(savedData.gpsLong || '');
    const [gpsAccuracy, setGpsAccuracy] = useState(savedData.gpsAccuracy || '3.5');
    const [perimeterMeters, setPerimeterMeters] = useState(savedData.perimeterMeters || 0);

    // Live Walk-Mapping Modal State
    const [showWalkerModal, setShowWalkerModal] = useState(false);
    const [mappedVertices, setMappedVertices] = useState<any[]>(savedData.mappedVertices || []);

    // Geocoded Location & Community State
    const [community, setCommunity] = useState(savedData.community || '');
    const [lga, setLga] = useState(savedData.lga || '');
    const [stateName, setStateName] = useState(savedData.stateName || '');
    const [address, setAddress] = useState(savedData.address || '');
    const [isResolvingGeo, setIsResolvingGeo] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Re-sync with registrationState whenever resumed or navigation params change
    useEffect(() => {
        const data = registrationState.getData();
        setLandTenure(data.landTenure || '');
        setFarmSizeHa(data.farmSizeHa || '');
        setFarmSizeAcres(data.farmSizeAcres || '');
        setBoundaryGeojson(data.boundaryGeojson || null);
        setPrimaryCrop(data.primaryCrop || '');
        setSecondaryCrop(data.secondaryCrop || '');
        setSelectedRegenPractices(data.selectedRegenPractices || []);
        setFertilizerUsed(data.fertilizerUsed ?? false);
        setAgrochemicalsUsed(data.agrochemicalsUsed ?? false);
        setGpsCaptured(Boolean(data.gpsLat));
        setGpsLat(data.gpsLat || '');
        setGpsLong(data.gpsLong || '');
        setGpsAccuracy(data.gpsAccuracy || '3.5');
        setPerimeterMeters(data.perimeterMeters || 0);
        setMappedVertices(data.mappedVertices || []);
        setCommunity(data.community || '');
        setLga(data.lga || '');
        setStateName(data.stateName || '');
        setAddress(data.address || '');
    }, [params?.isNew, params?.isResume, params?.draftId, params?.ts]);

    // Auto-populate & cross-sync hectares and acres whenever either is present
    useEffect(() => {
        if (!farmSizeAcres && farmSizeHa) {
            const num = parseFloat(farmSizeHa);
            if (!isNaN(num) && num > 0) {
                setFarmSizeAcres((num * 2.47105).toFixed(2));
            }
        } else if (!farmSizeHa && farmSizeAcres) {
            const num = parseFloat(farmSizeAcres);
            if (!isNaN(num) && num > 0) {
                setFarmSizeHa((num / 2.47105).toFixed(2));
            }
        }
    }, []);

    // Reverse geocode coordinates to extract real community, LGA, and State
    const resolveLocationFromCoords = async (latitude: number, longitude: number) => {
        setIsResolvingGeo(true);
        try {
            const result = await geoService.reverseGeocode(latitude, longitude);
            setCommunity(result.community);
            setLga(result.lga);
            setStateName(result.stateName);
            setAddress(result.address);
            registrationState.updateData({
                community: result.community,
                lga: result.lga,
                stateName: result.stateName,
                address: result.address,
            });
        } catch (err) {
            console.warn('[farm-details] Failed to reverse geocode coordinates:', err);
        } finally {
            setIsResolvingGeo(false);
        }
    };

    // Auto reverse geocode on mount if coordinates exist but community is not yet resolved
    useEffect(() => {
        if (gpsLat && gpsLong && !community) {
            const lat = parseFloat(gpsLat);
            const lng = parseFloat(gpsLong);
            if (!isNaN(lat) && !isNaN(lng)) {
                resolveLocationFromCoords(lat, lng);
            }
        }
    }, [gpsLat, gpsLong]);

    // Capture single current GPS point
    const handleCaptureCurrentLocation = async () => {
        try {
            setIsResolvingGeo(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to capture farm coordinates.');
                setIsResolvingGeo(false);
                return;
            }
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const latStr = pos.coords.latitude.toFixed(5);
            const lngStr = pos.coords.longitude.toFixed(5);
            setGpsLat(latStr);
            setGpsLong(lngStr);
            setGpsAccuracy(pos.coords.accuracy?.toFixed(1) || '3.5');
            setGpsCaptured(true);
            registrationState.updateData({
                gpsLat: latStr,
                gpsLong: lngStr,
                gpsAccuracy: pos.coords.accuracy?.toFixed(1) || '3.5',
            });
            await resolveLocationFromCoords(pos.coords.latitude, pos.coords.longitude);
        } catch (e) {
            Alert.alert('Location Error', 'Could not acquire current GPS location. Please check device GPS settings.');
        } finally {
            setIsResolvingGeo(false);
        }
    };

    // Calculate real-time area in acres helper
    const calculateAcres = (haStr: string) => {
        const ha = parseFloat(haStr);
        if (!isNaN(ha) && ha > 0) {
            return (ha * 2.47105).toFixed(2);
        }
        return '0';
    };

    // Filter valid vertices to prevent map/polygon crashes
    const validVertices = (mappedVertices || []).filter(
        (v: any) =>
            v &&
            typeof v.latitude === 'number' &&
            typeof v.longitude === 'number' &&
            isFinite(v.latitude) &&
            isFinite(v.longitude)
    );
    const hasValidPolygon = validVertices.length >= 3;

    // Compute bounding region for satellite map preview - tightly zoomed to the actual parcel
    const getBoundingRegion = (pts: { latitude: number; longitude: number }[]) => {
        if (!pts || pts.length === 0) {
            return {
                latitude: 10.5167,
                longitude: 7.4333,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
            };
        }
        let minLat = pts[0].latitude;
        let maxLat = pts[0].latitude;
        let minLng = pts[0].longitude;
        let maxLng = pts[0].longitude;
        for (const p of pts) {
            if (p.latitude < minLat) minLat = p.latitude;
            if (p.latitude > maxLat) maxLat = p.latitude;
            if (p.longitude < minLng) minLng = p.longitude;
            if (p.longitude > maxLng) maxLng = p.longitude;
        }
        const latSpan = Math.abs(maxLat - minLat);
        const lngSpan = Math.abs(maxLng - minLng);
        // Tight 20% margin around the actual mapped parcel bounds so the land fills the frame
        const latDelta = Math.max(latSpan * 1.25, 0.0004);
        const lngDelta = Math.max(lngSpan * 1.25, 0.0004);
        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
        };
    };

    // Clear mapped boundary and reset calculations
    const handleClearBoundary = () => {
        Alert.alert(
            'Clear Mapped Boundary?',
            'This will clear the recorded boundary polygon, reset area & perimeter calculations, and allow you to re-walk.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setMappedVertices([]);
                        setBoundaryGeojson(null);
                        setGpsCaptured(false);
                        setFarmSizeAcres('');
                        setFarmSizeHa('');
                        setPerimeterMeters(0);
                        setGpsLat('');
                        setGpsLong('');
                        registrationState.updateData({
                            mappedVertices: [],
                            boundaryGeojson: null,
                            farmSizeAcres: '',
                            farmSizeHa: '',
                            perimeterMeters: 0,
                            gpsLat: '',
                            gpsLong: '',
                        });
                    },
                },
            ]
        );
    };

    // Callback when user completes real-time GPS footstep walking & closes boundary
    const handleSaveBoundary = (result: BoundarySaveResult) => {
        setFarmSizeAcres(result.farmSizeAcres);
        setFarmSizeHa(result.farmSizeHa);
        setPerimeterMeters(result.perimeterMeters);
        setGpsLat(result.centroid.latitude.toFixed(5));
        setGpsLong(result.centroid.longitude.toFixed(5));
        setMappedVertices(result.vertices);
        setBoundaryGeojson(result.boundaryGeojson);
        setGpsCaptured(true);
        setShowWalkerModal(false);

        // Auto-save into registration state so area in both acres & hectares are instantly synchronized
        registrationState.updateData({
            farmSizeAcres: result.farmSizeAcres,
            farmSizeHa: result.farmSizeHa,
            perimeterMeters: result.perimeterMeters,
            gpsLat: result.centroid.latitude.toFixed(5),
            gpsLong: result.centroid.longitude.toFixed(5),
            mappedVertices: result.vertices,
            boundaryGeojson: result.boundaryGeojson,
        });

        // Immediately reverse geocode centroid coordinates to populate real community and state
        resolveLocationFromCoords(result.centroid.latitude, result.centroid.longitude);
    };

    const toggleRegenPractice = (practice: string) => {
        if (selectedRegenPractices.includes(practice)) {
            setSelectedRegenPractices(selectedRegenPractices.filter(p => p !== practice));
        } else {
            setSelectedRegenPractices([...selectedRegenPractices, practice]);
        }
    };

    const handleProceed = () => {
        registrationState.updateData({
            landTenure,
            farmSizeHa,
            farmSizeAcres: farmSizeAcres || calculateAcres(farmSizeHa),
            boundaryGeojson,
            primaryCrop,
            secondaryCrop,
            selectedRegenPractices,
            fertilizerUsed,
            agrochemicalsUsed,
            gpsLat,
            gpsLong,
            gpsAccuracy,
            perimeterMeters,
            mappedVertices,
            community,
            lga,
            stateName,
            address: address || geoService.formatLocationString(community, stateName),
        });
        setShowSuccessModal(true);
    };

    const handleSaveDraft = async () => {
        try {
            const draft = await draftService.saveCurrentDraft(
                '/(agent)/register-farmer/farm-details',
                3,
                'Farm Details & GPS',
                {
                    landTenure,
                    farmSizeHa,
                    farmSizeAcres: farmSizeAcres || calculateAcres(farmSizeHa),
                    boundaryGeojson,
                    primaryCrop,
                    secondaryCrop,
                    selectedRegenPractices,
                    fertilizerUsed,
                    agrochemicalsUsed,
                    gpsLat,
                    gpsLong,
                    gpsAccuracy,
                    perimeterMeters,
                    mappedVertices,
                    community,
                    lga,
                    stateName,
                    address: address || geoService.formatLocationString(community, stateName),
                }
            );
            setSavedDraftInfo({
                farmerName: draft.farmerName,
                stepNumber: 3,
                stepTitle: 'Farm Details & GPS',
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
                        navigation.navigate('register-farmer/kyc');
                    } else {
                        router.navigate('/(agent)/register-farmer/kyc' as any);
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
                                strokeDashoffset={2 * Math.PI * 18 * (1 - 0.60)} // 60% Step 3
                                strokeLinecap="round"
                                rotation="-90"
                                origin="20, 20"
                            />
                        </Svg>
                        <Text style={styles.progressText}>60%</Text>
                    </View>
                    <View>
                        <Text style={styles.stepLabel}>Step 3 of 5 • Section F & G</Text>
                        <Text style={styles.stepTitle}>Farm Practice, Regenerative Ag & GPS</Text>
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

                    {/* Section 1: Live Interactive GPS Field Walking & Polygon Boundary Mapper (VCM Spec 5.1) */}
                    <View style={styles.cardBox}>
                        <View style={styles.cardBoxHeader}>
                            <Ionicons name="navigate" size={22} color="#0E6F6A" />
                            <Text style={styles.cardBoxTitle}>Farm Boundary Polygon & GPS Tracking</Text>
                        </View>
                        <Text style={styles.cardBoxSubtext}>
                            Direct field observation requirement. Walk around the farm perimeter and map corner GPS points.
                        </Text>

                        {/* CONDITIONAL PREVIEW: Empty before mapping, Live Satellite Map after mapping */}
                        {!hasValidPolygon ? (
                            <View style={styles.emptyMapContainer}>
                                <View style={styles.emptyMapIconCircle}>
                                    <Ionicons name="map-outline" size={32} color="#0E6F6A" />
                                </View>
                                <Text style={styles.emptyMapTitle}>No Farm Boundary Mapped Yet</Text>
                                <Text style={styles.emptyMapSubtext}>
                                    Field perimeter has not been walked or recorded. Tap below to launch GPS satellite boundary walker and map plot corners.
                                </Text>
                                <TouchableOpacity
                                    style={styles.launchMapToolBtn}
                                    onPress={() => setShowWalkerModal(true)}
                                >
                                    <Ionicons name="footsteps" size={18} color="white" />
                                    <Text style={styles.launchMapToolBtnText}>Walk Field & Map Boundary (Satellite GPS)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.capturePointBtn}
                                    onPress={handleCaptureCurrentLocation}
                                    disabled={isResolvingGeo}
                                >
                                    {isResolvingGeo ? (
                                        <ActivityIndicator size="small" color="#0E6F6A" />
                                    ) : (
                                        <Ionicons name="navigate-outline" size={17} color="#0E6F6A" />
                                    )}
                                    <Text style={styles.capturePointBtnText}>
                                        {isResolvingGeo ? 'Detecting Location...' : 'Capture Current Location (Point GPS)'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Point GPS Captured indicator if available */}
                                {gpsLat && !hasValidPolygon && (
                                    <View style={styles.detectedLocationBox}>
                                        <View style={styles.detectedLocationHeader}>
                                            <Ionicons name="location" size={16} color="#0E6F6A" />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.detectedLocationTitle}>GPS Point Recorded</Text>
                                                <Text style={styles.detectedLocationSubtitle}>
                                                    {gpsLat}°N, {gpsLong}°E • {geoService.formatLocationString(community, stateName)}
                                                </Text>
                                            </View>
                                            {isResolvingGeo && <ActivityIndicator size="small" color="#0E6F6A" />}
                                        </View>
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={styles.communityFieldLabel}>Community / Village Name</Text>
                                            <TextInput
                                                style={styles.communityInput}
                                                value={community}
                                                onChangeText={(txt) => {
                                                    setCommunity(txt);
                                                    registrationState.updateData({ community: txt });
                                                }}
                                                placeholder="e.g. Garki, Maitama, Bwari"
                                                placeholderTextColor="#94A3B8"
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={{ gap: 10 }}>
                                {/* Live Satellite Map View of the farmland just mapped */}
                                <View style={styles.mapContainerCard}>
                                    <MapView
                                        style={StyleSheet.absoluteFill}
                                        provider={PROVIDER_DEFAULT}
                                        mapType="satellite"
                                        region={getBoundingRegion(validVertices)}
                                        scrollEnabled={false}
                                        zoomEnabled={false}
                                        pitchEnabled={false}
                                        rotateEnabled={false}
                                    >
                                        <Polygon
                                            coordinates={validVertices}
                                            strokeColor="#10B981"
                                            fillColor="rgba(16, 185, 129, 0.40)"
                                            strokeWidth={2.5}
                                        />
                                        {validVertices.map((vertex: any, idx: number) => (
                                            <Marker
                                                key={vertex.id || idx}
                                                coordinate={{
                                                    latitude: vertex.latitude,
                                                    longitude: vertex.longitude,
                                                }}
                                                anchor={{ x: 0.5, y: 0.5 }}
                                                title={`Corner P${idx + 1}`}
                                                description={`Lat: ${vertex.latitude.toFixed(6)}, Lng: ${vertex.longitude.toFixed(6)}`}
                                            >
                                                <View style={styles.previewMarkerBadge}>
                                                    <Text style={styles.previewMarkerBadgeText}>{idx + 1}</Text>
                                                </View>
                                            </Marker>
                                        ))}
                                    </MapView>

                                    {/* Overlay Top Badges */}
                                    <View style={styles.mapOverlayBadgeRow}>
                                        <View style={styles.mapBadgeItem}>
                                            <Ionicons name="sparkles" size={12} color="#10B981" />
                                            <Text style={styles.mapBadgeText}>{validVertices.length} Corner Points Recorded</Text>
                                        </View>
                                        <View style={styles.mapBadgeItem}>
                                            <Ionicons name="locate" size={12} color="#38BDF8" />
                                            <Text style={styles.mapBadgeText}>±{gpsAccuracy}m Accuracy</Text>
                                        </View>
                                    </View>

                                    {/* Floating Bottom Metrics Box */}
                                    <View style={styles.mapMetricsBox}>
                                        <View style={styles.metricItem}>
                                            <Text style={styles.metricLabel}>Calculated Area</Text>
                                            <Text style={styles.metricVal}>
                                                {farmSizeAcres || calculateAcres(farmSizeHa)} Acres ({farmSizeHa || '0.00'} Ha)
                                            </Text>
                                        </View>
                                        <View style={styles.metricDivider} />
                                        <View style={styles.metricItem}>
                                            <Text style={styles.metricLabel}>Plot Perimeter</Text>
                                            <Text style={styles.metricVal}>{perimeterMeters} Meters</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Centroid Coordinate Pill */}
                                <View style={styles.centroidRow}>
                                    <View style={styles.centroidBadge}>
                                        <Ionicons name="location" size={13} color="#0E6F6A" />
                                        <Text style={styles.centroidBadgeText}>
                                            GPS Centroid: {gpsLat || validVertices[0].latitude.toFixed(5)}°N, {gpsLong || validVertices[0].longitude.toFixed(5)}°E
                                        </Text>
                                    </View>
                                </View>

                                {/* Detected Location and Editable Community Name */}
                                {(community || stateName || isResolvingGeo) && (
                                    <View style={styles.detectedLocationBox}>
                                        <View style={styles.detectedLocationHeader}>
                                            <Ionicons name="location" size={16} color="#0E6F6A" />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.detectedLocationTitle}>Detected Location (From Coordinates)</Text>
                                                <Text style={styles.detectedLocationSubtitle}>
                                                    {isResolvingGeo
                                                        ? 'Detecting community from GPS coordinates...'
                                                        : geoService.formatLocationString(community, stateName)}
                                                </Text>
                                            </View>
                                            {isResolvingGeo && <ActivityIndicator size="small" color="#0E6F6A" />}
                                        </View>
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={styles.communityFieldLabel}>Community / Village Name</Text>
                                            <TextInput
                                                style={styles.communityInput}
                                                value={community}
                                                onChangeText={(txt) => {
                                                    setCommunity(txt);
                                                    registrationState.updateData({ community: txt });
                                                }}
                                                placeholder="e.g. Garki, Maitama, Bwari"
                                                placeholderTextColor="#94A3B8"
                                            />
                                            <Text style={styles.communityInputHint}>
                                                Auto-populated from coordinates. Edit if you want to specify a particular village or neighborhood.
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Action Buttons: Re-walk or Clear */}
                                <View style={styles.mapActionsRow}>
                                    <TouchableOpacity
                                        style={[styles.launchMapToolBtn, { flex: 1 }]}
                                        onPress={() => setShowWalkerModal(true)}
                                    >
                                        <Ionicons name="footsteps" size={18} color="white" />
                                        <Text style={styles.launchMapToolBtnText}>Re-walk / Edit Boundary</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.clearBoundaryBtn}
                                        onPress={handleClearBoundary}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        <Text style={styles.clearBoundaryBtnText}>Clear</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Recorded Corner Coordinates Breakdown List */}
                                <View style={styles.coordinatesCard}>
                                    <View style={styles.coordinatesHeader}>
                                        <Ionicons name="list" size={15} color="#0E6F6A" />
                                        <Text style={styles.coordinatesHeaderText}>
                                            Recorded Corner Coordinates ({validVertices.length} Points)
                                        </Text>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.coordinatesScroll}
                                    >
                                        {validVertices.map((v: any, idx: number) => (
                                            <View key={v.id || idx} style={styles.coordPill}>
                                                <View style={styles.coordBadgeNum}>
                                                    <Text style={styles.coordBadgeNumText}>P{idx + 1}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.coordLatText}>Lat: {v.latitude.toFixed(6)}</Text>
                                                    <Text style={styles.coordLngText}>Lng: {v.longitude.toFixed(6)}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Section 2: Land Tenure (Section F) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Land Ownership / Tenure Status (Section F)</Text>
                        <View style={styles.optionWrap}>
                            {LAND_TENURE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.chipPill, landTenure === opt && styles.chipPillActive]}
                                    onPress={() => setLandTenure(opt)}
                                >
                                    <Text style={[styles.chipText, landTenure === opt && styles.chipTextActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Total Cultivated Area (Acres & Hectares) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Total Cultivated Farm Size</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.helperText, { marginBottom: 4, fontWeight: '700', color: '#0E6F6A' }]}>Area (Acres)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={farmSizeAcres}
                                    onChangeText={(txt) => {
                                        setFarmSizeAcres(txt);
                                        const num = parseFloat(txt);
                                        if (!isNaN(num) && num > 0) {
                                            setFarmSizeHa((num / 2.47105).toFixed(2));
                                        }
                                    }}
                                    placeholder="e.g. 5.00"
                                    placeholderTextColor="#A0AEC0"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.helperText, { marginBottom: 4, fontWeight: '600' }]}>Area (Hectares)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={farmSizeHa}
                                    onChangeText={(txt) => {
                                        setFarmSizeHa(txt);
                                        const num = parseFloat(txt);
                                        if (!isNaN(num) && num > 0) {
                                            setFarmSizeAcres((num * 2.47105).toFixed(2));
                                        }
                                    }}
                                    placeholder="e.g. 2.02"
                                    placeholderTextColor="#A0AEC0"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                        <Text style={[styles.helperText, { marginTop: 4 }]}>
                            1 Hectare = 2.471 Acres • Values sync automatically when typing or walking field boundary.
                        </Text>
                        {hasValidPolygon && (
                            <View style={styles.autoCalculatedBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#0E6F6A" />
                                <Text style={styles.autoCalculatedBadgeText}>
                                    Auto-calculated from GPS boundary: {farmSizeAcres} Acres ({farmSizeHa} Ha) • {perimeterMeters}m perimeter
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Primary & Secondary Crops */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Primary Crop Grown</Text>
                        <View style={styles.optionWrap}>
                            {CROP_OPTIONS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chipPill, primaryCrop === c && styles.chipPillActive]}
                                    onPress={() => setPrimaryCrop(c)}
                                >
                                    <Text style={[styles.chipText, primaryCrop === c && styles.chipTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Secondary Crop (Intercropped / Rotated)</Text>
                        <View style={styles.optionWrap}>
                            {CROP_OPTIONS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chipPill, secondaryCrop === c && styles.chipPillActive]}
                                    onPress={() => setSecondaryCrop(c)}
                                >
                                    <Text style={[styles.chipText, secondaryCrop === c && styles.chipTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Section 3: Regenerative Agriculture Practices (Section G) */}
                    <View style={styles.cardBox}>
                        <View style={styles.cardBoxHeader}>
                            <Ionicons name="leaf-outline" size={20} color="#0E6F6A" />
                            <Text style={styles.cardBoxTitle}>Regenerative Agriculture Practices (Section G)</Text>
                        </View>
                        <Text style={styles.cardBoxSubtext}>Select all soil & ecological conservation practices implemented on this farm.</Text>

                        <View style={styles.optionWrap}>
                            {REGENERATIVE_PRACTICES.map((p) => {
                                const selected = selectedRegenPractices.includes(p);
                                return (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.chipPill, selected && styles.chipPillActive]}
                                        onPress={() => toggleRegenPractice(p)}
                                    >
                                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                                            {selected ? '✓ ' : ''}{p}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Section 4: Fertilizer & Agrochemical Usage */}
                    <View style={styles.inputGroup}>
                        <View style={styles.rowJustify}>
                            <Text style={styles.label}>Chemical Fertilizer Used?</Text>
                            <Switch
                                value={fertilizerUsed}
                                onValueChange={setFertilizerUsed}
                                trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.rowJustify}>
                            <Text style={styles.label}>Agrochemicals / Pesticides Used?</Text>
                            <Switch
                                value={agrochemicalsUsed}
                                onValueChange={setAgrochemicalsUsed}
                                trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleProceed}
                    >
                        <Text style={styles.continueButtonText}>Save & Proceed to Step 4 (Household & Food Security)</Text>
                        <Feather name="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Live Interactive GPS Field Walking & Satellite Boundary Mapper */}
            <FarmBoundaryWalker
                visible={showWalkerModal}
                initialVertices={mappedVertices}
                onClose={() => setShowWalkerModal(false)}
                onSaveBoundary={handleSaveBoundary}
            />

            {/* Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.successIconCircle}>
                                <Feather name="check" size={24} color="white" />
                            </View>
                            <Text style={styles.modalTitle}>Step 3 Complete</Text>
                        </View>

                        <View style={styles.completionContainer}>
                            <Text style={styles.completionText}>Farm Practice & Polygon Map Saved (60%)</Text>
                            <View style={styles.completionBarBackground}>
                                <View style={[styles.completionBarFill, { width: '60%' }]} />
                            </View>
                        </View>

                        <View style={styles.modalDivider} />

                        <View style={styles.nextStepContainer}>
                            <Text style={styles.nextStepLabel}>Next Step:</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Feather name="users" size={16} color="#0E6F6A" />
                                <Text style={styles.nextStepTitle}>Step 4: Household Demographics & Food Security</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.startNowButton} 
                            onPress={() => {
                                setShowSuccessModal(false);
                                if (navigation?.navigate) {
                                    navigation.navigate('register-farmer/questionnaire');
                                } else {
                                    router.navigate('/(agent)/register-farmer/questionnaire' as any);
                                }
                            }}
                        >
                            <Text style={styles.startNowText}>Proceed to Household Questionnaire</Text>
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
    cardBoxSubtext: {
        fontSize: 12,
        color: '#64748B',
    },

    // Empty Map Container Styles
    emptyMapContainer: {
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginTop: 4,
    },
    emptyMapIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E6F4F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    emptyMapTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    emptyMapSubtext: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 14,
        paddingHorizontal: 10,
    },

    // Map Polygon Display Card Styles
    mapContainerCard: {
        height: 190,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1.5,
        borderColor: '#0E6F6A',
        marginTop: 4,
    },
    mapOverlayBadgeRow: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mapBadgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 16,
    },
    mapBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    mapMetricsBox: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
    },
    metricVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    metricDivider: {
        width: 1,
        height: 22,
        backgroundColor: '#CBD5E1',
    },

    // Marker badge inside MapView
    previewMarkerBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#0E6F6A',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewMarkerBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },

    // Centroid Row
    centroidRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    centroidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#E6F4F2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    centroidBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0E6F6A',
    },

    // Map Actions
    mapActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    launchMapToolBtn: {
        height: 46,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
    },
    launchMapToolBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    clearBoundaryBtn: {
        height: 46,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    clearBoundaryBtnText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    },

    // Coordinates Breakdown List
    coordinatesCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 10,
        gap: 8,
    },
    coordinatesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    coordinatesHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    coordinatesScroll: {
        gap: 8,
        paddingVertical: 2,
    },
    coordPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    coordBadgeNum: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    coordBadgeNumText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    coordLatText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#334155',
    },
    coordLngText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
    },

    // Auto-calculated note in Section 2
    autoCalculatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        backgroundColor: '#E6F4F2',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    autoCalculatedBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0E6F6A',
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
    },
    startNowText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    capturePointBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 10,
    },
    capturePointBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0E6F6A',
    },
    detectedLocationBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        padding: 12,
        marginTop: 10,
    },
    detectedLocationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detectedLocationTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065F46',
    },
    detectedLocationSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#047857',
        marginTop: 1,
    },
    communityFieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
    },
    communityInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
    },
    communityInputHint: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
    },
});

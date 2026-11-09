import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Platform,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import MapView, { Polygon, Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import {
    LatLng,
    calculatePolygonAreaSqMeters,
    sqMetersToAcres,
    sqMetersToHectares,
    calculatePerimeterMeters,
    calculateCentroid,
} from '../../utils/geoCalculations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export interface MappedVertex {
    id: number;
    latitude: number;
    longitude: number;
    label: string;
}

export interface BoundarySaveResult {
    farmSizeAcres: string;
    farmSizeHa: string;
    perimeterMeters: number;
    centroid: LatLng;
    vertices: MappedVertex[];
    boundaryGeojson: any;
}

interface FarmBoundaryWalkerProps {
    visible: boolean;
    initialVertices?: MappedVertex[];
    onClose: () => void;
    onSaveBoundary: (result: BoundarySaveResult) => void;
}

export default function FarmBoundaryWalker({
    visible,
    initialVertices = [],
    onClose,
    onSaveBoundary,
}: FarmBoundaryWalkerProps) {
    const mapRef = useRef<MapView | null>(null);
    const insets = useSafeAreaInsets();
    const topHeaderOffset = Math.max(insets.top, 24) + 10;

    // Map display settings
    const [mapType, setMapType] = useState<'satellite' | 'hybrid' | 'standard'>('satellite');

    // Live GPS tracking state
    const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [gpsPermission, setGpsPermission] = useState<boolean | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(true);
    const [followUser, setFollowUser] = useState<boolean>(true);

    // Walking footsteps breadcrumb trail
    const [footsteps, setFootsteps] = useState<LatLng[]>([]);

    // Corner vertices recorded
    const [vertices, setVertices] = useState<MappedVertex[]>(initialVertices);

    // Boundary closed state
    const [isBoundaryClosed, setIsBoundaryClosed] = useState<boolean>(false);

    // Calculated metrics
    const [acres, setAcres] = useState<string>('0.00');
    const [hectares, setHectares] = useState<string>('0.00');
    const [perimeter, setPerimeter] = useState<number>(0);

    const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

    // Request permissions and start live footstep tracking
    useEffect(() => {
        if (!visible) {
            if (locationSubscriptionRef.current) {
                locationSubscriptionRef.current.remove();
                locationSubscriptionRef.current = null;
            }
            return;
        }

        let isMounted = true;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (!isMounted) return;

                if (status !== 'granted') {
                    setGpsPermission(false);
                    setIsLocating(false);
                    Alert.alert(
                        'Location Permission Required',
                        'AgriGATE needs GPS permission to track your footsteps and map farm boundaries live. You can still tap directly on the satellite map to place corner points.'
                    );
                    return;
                }

                setGpsPermission(true);

                // Get quick initial location
                const initialLoc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                if (isMounted && initialLoc?.coords) {
                    setUserLocation(initialLoc.coords);
                    setIsLocating(false);

                    setFootsteps((prev) => [
                        ...prev,
                        {
                            latitude: initialLoc.coords.latitude,
                            longitude: initialLoc.coords.longitude,
                        },
                    ]);

                    if (mapRef.current) {
                        mapRef.current.animateToRegion(
                            {
                                latitude: initialLoc.coords.latitude,
                                longitude: initialLoc.coords.longitude,
                                latitudeDelta: 0.003,
                                longitudeDelta: 0.003,
                            },
                            800
                        );
                    }
                }

                // Start continuous watching for live footstep tracking
                locationSubscriptionRef.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 1.5, // record footstep every 1.5 meters walked
                        timeInterval: 1500,     // or every 1.5s
                    },
                    (newLoc) => {
                        if (!isMounted || !newLoc?.coords) return;
                        const coords = newLoc.coords;
                        setUserLocation(coords);

                        // Append to walking footsteps path
                        setFootsteps((prev) => {
                            const newPoint = {
                                latitude: coords.latitude,
                                longitude: coords.longitude,
                            };
                            // avoid duplicate points if user stopped
                            if (prev.length > 0) {
                                const last = prev[prev.length - 1];
                                const dist =
                                    Math.abs(last.latitude - newPoint.latitude) +
                                    Math.abs(last.longitude - newPoint.longitude);
                                if (dist < 0.00001) return prev;
                            }
                            return [...prev, newPoint];
                        });

                        // If user has follow mode active, animate map center smoothly
                        if (followUser && mapRef.current) {
                            mapRef.current.animateCamera(
                                {
                                    center: {
                                        latitude: coords.latitude,
                                        longitude: coords.longitude,
                                    },
                                    zoom: 18,
                                },
                                { duration: 600 }
                            );
                        }
                    }
                );
            } catch (err) {
                console.warn('Location tracking error:', err);
                setIsLocating(false);
            }
        })();

        return () => {
            isMounted = false;
            if (locationSubscriptionRef.current) {
                locationSubscriptionRef.current.remove();
                locationSubscriptionRef.current = null;
            }
        };
    }, [visible, followUser]);

    // Recalculate area and perimeter: footsteps define the actual walked contour of the land
    useEffect(() => {
        // If user walked around (footsteps >= 3), walking steps form the true land shape!
        // Vertices represent the corner/turning points.
        const shapePoints: LatLng[] = footsteps.length >= 3
            ? footsteps
            : vertices.map((v) => ({ latitude: v.latitude, longitude: v.longitude }));

        if (shapePoints.length < 3) {
            setAcres('0.00');
            setHectares('0.00');
            setPerimeter(calculatePerimeterMeters(shapePoints));
            return;
        }

        const areaSqM = calculatePolygonAreaSqMeters(shapePoints);
        const acresVal = sqMetersToAcres(areaSqM);
        const haVal = sqMetersToHectares(areaSqM);
        const perimVal = calculatePerimeterMeters(shapePoints);

        setAcres(acresVal.toFixed(2));
        setHectares(haVal.toFixed(2));
        setPerimeter(perimVal);
    }, [vertices, footsteps, isBoundaryClosed]);

    // Pick Corner Point from current walking position
    const handlePickCornerPoint = () => {
        if (!userLocation) {
            Alert.alert(
                'Waiting for GPS',
                'Acquiring live satellite GPS lock. You can also tap directly on the satellite map to place a corner point.'
            );
            return;
        }

        const newVertex: MappedVertex = {
            id: Date.now(),
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            label: `Corner P${vertices.length + 1}`,
        };

        const updated = [...vertices, newVertex];
        setVertices(updated);

        // If >= 4 points, suggest or auto-close option
        if (updated.length >= 3 && !isBoundaryClosed) {
            // Can be closed now
        }
    };

    // Manual map tap to add corner point
    const handleMapPress = (e: any) => {
        if (isBoundaryClosed) return; // ignore taps once closed unless re-opened

        const coord = e.nativeEvent?.coordinate;
        if (!coord || !isFinite(coord.latitude) || !isFinite(coord.longitude)) return;

        const newVertex: MappedVertex = {
            id: Date.now(),
            latitude: coord.latitude,
            longitude: coord.longitude,
            label: `Corner P${vertices.length + 1}`,
        };

        setVertices([...vertices, newVertex]);
    };

    // Toggle Close / Open boundary
    const handleToggleCloseBoundary = () => {
        if (vertices.length < 3 && footsteps.length < 3) {
            Alert.alert(
                'Need at least 3 points',
                'Please walk around the perimeter or place at least 3 corner points to close your farm boundary.'
            );
            return;
        }
        setIsBoundaryClosed(!isBoundaryClosed);
    };

    // Undo last picked corner
    const handleUndoLastPoint = () => {
        if (vertices.length > 0) {
            const next = vertices.slice(0, -1);
            setVertices(next);
            if (next.length < 3) {
                setIsBoundaryClosed(false);
            }
        }
    };

    // Clear all points and restart
    const handleResetAll = () => {
        Alert.alert(
            'Reset Boundary Mapping?',
            'This will clear all recorded corner vertices and your walking trail.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        setVertices([]);
                        setFootsteps([]);
                        setIsBoundaryClosed(false);
                        setAcres('0.00');
                        setHectares('0.00');
                        setPerimeter(0);
                    },
                },
            ]
        );
    };

    // Recenter map on user location
    const handleRecenterOnUser = () => {
        if (userLocation && mapRef.current) {
            setFollowUser(true);
            mapRef.current.animateToRegion(
                {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.0025,
                    longitudeDelta: 0.0025,
                },
                500
            );
        }
    };

    // Save and export final boundary
    const handleSaveAndConfirm = () => {
        const hasEnoughFootsteps = footsteps.length >= 3;
        const hasEnoughVertices = vertices.length >= 3;

        if (!hasEnoughFootsteps && !hasEnoughVertices) {
            Alert.alert(
                'Incomplete Boundary',
                'Please walk around the perimeter or record corner points around the farm parcel before saving.'
            );
            return;
        }

        // The walking steps define the actual shape and perimeter of the land.
        // Corner points (vertices) serve as turning/corner milestones.
        const shapePoints: LatLng[] = hasEnoughFootsteps
            ? footsteps
            : vertices.map((v) => ({
                  latitude: v.latitude,
                  longitude: v.longitude,
              }));

        const areaSqM = calculatePolygonAreaSqMeters(shapePoints);
        const calcAcres = sqMetersToAcres(areaSqM).toFixed(2);
        const calcHa = sqMetersToHectares(areaSqM).toFixed(2);
        const calcPerimeter = Math.round(calculatePerimeterMeters(shapePoints));
        const centroid = calculateCentroid(shapePoints);

        // Build GeoJSON Polygon format: [[lng, lat], ...] closed along the walked shape
        const coordinatesRing = [
            ...shapePoints.map((p) => [p.longitude, p.latitude]),
            [shapePoints[0].longitude, shapePoints[0].latitude],
        ];

        const boundaryGeojson = {
            type: 'Polygon',
            coordinates: [coordinatesRing],
        };

        const result: BoundarySaveResult = {
            farmSizeAcres: calcAcres,
            farmSizeHa: calcHa,
            perimeterMeters: calcPerimeter,
            centroid,
            vertices,
            boundaryGeojson,
        };

        onSaveBoundary(result);
    };

    // Extract valid coordinates for map rendering
    const polygonCoords = vertices
        .filter((v) => isFinite(v.latitude) && isFinite(v.longitude))
        .map((v) => ({
            latitude: v.latitude,
            longitude: v.longitude,
        }));

    const footstepCoords = footsteps.filter(
        (f) => isFinite(f.latitude) && isFinite(f.longitude)
    );

    const defaultRegion = {
        latitude: userLocation?.latitude || 10.5105,
        longitude: userLocation?.longitude || 7.4165,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <StatusBar style="light" />

                {/* Satellite Map Canvas */}
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    provider={PROVIDER_DEFAULT}
                    mapType={mapType}
                    initialRegion={defaultRegion}
                    showsUserLocation={false} // Custom high-contrast walking avatar rendered below
                    showsCompass={true}
                    showsScale={true}
                    onPress={handleMapPress}
                    onPanDrag={() => {
                        // If user manually drags the map, pause follow-me mode
                        if (followUser) setFollowUser(false);
                    }}
                >
                    {/* Footstep Walking Trail (The real contour of the land) */}
                    {footstepCoords.length >= 2 && !isBoundaryClosed && (
                        <Polyline
                            coordinates={footstepCoords}
                            strokeColor="#10B981"
                            strokeWidth={3.5}
                        />
                    )}

                    {/* Unclosed Boundary Polyline (Connecting manual Corner Points only if no footsteps walked) */}
                    {footstepCoords.length < 2 && polygonCoords.length >= 2 && !isBoundaryClosed && (
                        <Polyline
                            coordinates={polygonCoords}
                            strokeColor="#10B981"
                            strokeWidth={3.5}
                        />
                    )}

                    {/* Closed Farm Boundary Polygon - strictly uses exact walked footsteps shape */}
                    {(footstepCoords.length >= 3 || polygonCoords.length >= 3) && isBoundaryClosed && (
                        <Polygon
                            coordinates={footstepCoords.length >= 3 ? footstepCoords : polygonCoords}
                            strokeColor="#10B981"
                            fillColor="rgba(16, 185, 129, 0.35)"
                            strokeWidth={3.5}
                        />
                    )}

                    {/* Corner Turn Milestone Markers */}
                    {vertices.map((vertex, index) => (
                        <Marker
                            key={vertex.id}
                            coordinate={{
                                latitude: vertex.latitude,
                                longitude: vertex.longitude,
                            }}
                            title={`Corner Turn P${index + 1}`}
                            description={`Turn milestone: ${vertex.latitude.toFixed(5)}, ${vertex.longitude.toFixed(5)}`}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.cornerPin}>
                                <Text style={styles.cornerPinText}>P{index + 1}</Text>
                            </View>
                        </Marker>
                    ))}

                    {/* Live Walking User Marker with Pulsing Outer Aura */}
                    {userLocation && (
                        <Marker
                            coordinate={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                            }}
                            anchor={{ x: 0.5, y: 0.5 }}
                            flat={true}
                            rotation={userLocation.heading || 0}
                        >
                            <View style={styles.walkingAvatarContainer}>
                                <View style={styles.walkingPulseAura} />
                                <View style={styles.walkingDot}>
                                    <MaterialCommunityIcons name="walk" size={16} color="#FFFFFF" />
                                </View>
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Top Floating Glass Header */}
                <View style={[styles.topHeader, { top: topHeaderOffset }]}>
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={onClose}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        accessibilityLabel="Close"
                    >
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleBox}>
                        <Text style={styles.headerTitle}>Walk & Map Farm Boundary</Text>
                        <View style={styles.headerStatusRow}>
                            <View
                                style={[
                                    styles.liveDot,
                                    {
                                        backgroundColor:
                                            userLocation?.accuracy && userLocation.accuracy <= 5
                                                ? '#10B981'
                                                : '#F59E0B',
                                    },
                                ]}
                            />
                            <Text style={styles.headerSubtitle}>
                                {userLocation
                                    ? `GPS ±${userLocation.accuracy?.toFixed(1) || '3.5'}m • Offline Ready`
                                    : isLocating
                                    ? 'Acquiring Satellite GPS...'
                                    : 'Tap map to place points'}
                            </Text>
                        </View>
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={handleResetAll}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        accessibilityLabel="Reset"
                    >
                        <Ionicons name="refresh" size={20} color="#F59E0B" />
                    </TouchableOpacity>
                </View>

                {/* Map Controls Floating Right Pill (Satellite / Hybrid / Terrain) */}
                <View style={[styles.floatingRightControls, { top: topHeaderOffset + 68 }]}>
                    <TouchableOpacity
                        style={[styles.mapTypeBtn, mapType === 'satellite' && styles.mapTypeBtnActive]}
                        onPress={() => setMapType('satellite')}
                    >
                        <Text
                            style={[
                                styles.mapTypeBtnText,
                                mapType === 'satellite' && styles.mapTypeBtnTextActive,
                            ]}
                        >
                            Sat
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.mapTypeBtn, mapType === 'hybrid' && styles.mapTypeBtnActive]}
                        onPress={() => setMapType('hybrid')}
                    >
                        <Text
                            style={[
                                styles.mapTypeBtnText,
                                mapType === 'hybrid' && styles.mapTypeBtnTextActive,
                            ]}
                        >
                            Hyb
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.mapTypeBtn, mapType === 'standard' && styles.mapTypeBtnActive]}
                        onPress={() => setMapType('standard')}
                    >
                        <Text
                            style={[
                                styles.mapTypeBtnText,
                                mapType === 'standard' && styles.mapTypeBtnTextActive,
                            ]}
                        >
                            Map
                        </Text>
                    </TouchableOpacity>

                    {/* Recenter GPS Button */}
                    <TouchableOpacity
                        style={[
                            styles.recenterBtn,
                            followUser && { backgroundColor: '#10B981' },
                        ]}
                        onPress={handleRecenterOnUser}
                    >
                        <Ionicons
                            name="locate"
                            size={20}
                            color={followUser ? '#FFFFFF' : '#334155'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Floating Footstep Trail Hint Pill */}
                {footsteps.length > 0 && (
                    <View style={styles.trailBadge}>
                        <MaterialCommunityIcons name="foot-print" size={14} color="#10B981" />
                        <Text style={styles.trailBadgeText}>
                            Walking Steps: {footsteps.length} pts (defines land shape)
                        </Text>
                    </View>
                )}

                {/* Bottom HUD: Live Auto-Calculated Metrics & Controls */}
                <View style={styles.bottomHudContainer}>
                    {/* Live Metric Cards (Acres, Hectares, Perimeter, Vertices) */}
                    <View style={styles.metricsCard}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricSub}>Farm Area</Text>
                            <Text style={styles.metricValueHighlight}>{acres} Acres</Text>
                        </View>

                        <View style={styles.metricDivider} />

                        <View style={styles.metricItem}>
                            <Text style={styles.metricSub}>Hectares</Text>
                            <Text style={styles.metricValue}>{hectares} Ha</Text>
                        </View>

                        <View style={styles.metricDivider} />

                        <View style={styles.metricItem}>
                            <Text style={styles.metricSub}>Perimeter</Text>
                            <Text style={styles.metricValue}>{perimeter} m</Text>
                        </View>

                        <View style={styles.metricDivider} />

                        <View style={styles.metricItem}>
                            <Text style={styles.metricSub}>Corner Turns</Text>
                            <Text style={styles.metricValue}>{vertices.length}</Text>
                        </View>
                    </View>

                    {/* Primary Action Buttons Row */}
                    <View style={styles.actionButtonsRow}>
                        {/* 1. Pick Corner Point */}
                        <TouchableOpacity
                            style={styles.pickPointBtn}
                            onPress={handlePickCornerPoint}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.pickPointBtnText}>
                                Mark Corner Turn (P{vertices.length + 1})
                            </Text>
                        </TouchableOpacity>

                        {/* 2. Close / Reopen Boundary */}
                        <TouchableOpacity
                            style={[
                                styles.closeBoundaryBtn,
                                vertices.length < 3 && styles.btnDisabled,
                                isBoundaryClosed && styles.closeBoundaryBtnActive,
                            ]}
                            onPress={handleToggleCloseBoundary}
                            disabled={vertices.length < 3}
                            activeOpacity={0.8}
                        >
                            <Feather
                                name={isBoundaryClosed ? 'unlock' : 'check-circle'}
                                size={18}
                                color="#FFFFFF"
                            />
                            <Text style={styles.closeBoundaryBtnText}>
                                {isBoundaryClosed ? 'Reopen' : 'Close Boundary'}
                            </Text>
                        </TouchableOpacity>

                        {/* 3. Undo Last */}
                        <TouchableOpacity
                            style={[
                                styles.undoBtn,
                                vertices.length === 0 && styles.btnDisabled,
                            ]}
                            onPress={handleUndoLastPoint}
                            disabled={vertices.length === 0}
                            activeOpacity={0.8}
                        >
                            <Feather name="rotate-ccw" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Save & Confirm Button */}
                    <TouchableOpacity
                        style={[
                            styles.saveBoundaryBtn,
                            (vertices.length < 3 || !isBoundaryClosed) && styles.saveBoundaryBtnDisabled,
                        ]}
                        onPress={handleSaveAndConfirm}
                        disabled={vertices.length < 3 || !isBoundaryClosed}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="checkmark-done-circle" size={22} color="#FFFFFF" />
                        <Text style={styles.saveBoundaryBtnText}>
                            {vertices.length < 3
                                ? 'Walk to 3+ Corners to Save'
                                : !isBoundaryClosed
                                ? 'Tap "Close Boundary" to Finalize Area'
                                : `Save Boundary (${acres} Acres)`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    topHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 36,
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    headerIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleBox: {
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    headerStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    headerSubtitle: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
    },
    floatingRightControls: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        right: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        borderRadius: 12,
        padding: 5,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        elevation: 6,
    },
    mapTypeBtn: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    mapTypeBtnActive: {
        backgroundColor: '#0E6F6A',
    },
    mapTypeBtnText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
    },
    mapTypeBtnTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    recenterBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    trailBadge: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        left: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    trailBadgeText: {
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: '600',
    },
    cornerPin: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#10B981',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
    cornerPinText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    walkingAvatarContainer: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    walkingPulseAura: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1.5,
        borderColor: '#3B82F6',
    },
    walkingDot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#2563EB',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
    },
    bottomHudContainer: {
        position: 'absolute',
        bottom: 20,
        left: 14,
        right: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderRadius: 20,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 12,
    },
    metricsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricSub: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    metricValueHighlight: {
        fontSize: 15,
        fontWeight: '800',
        color: '#10B981',
        marginTop: 2,
    },
    metricValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#F8FAFC',
        marginTop: 2,
    },
    metricDivider: {
        width: 1,
        height: 26,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pickPointBtn: {
        flex: 2,
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#0E6F6A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 4,
    },
    pickPointBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    closeBoundaryBtn: {
        flex: 1.5,
        height: 48,
        backgroundColor: '#2563EB',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    closeBoundaryBtnActive: {
        backgroundColor: '#D97706',
    },
    closeBoundaryBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    undoBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnDisabled: {
        opacity: 0.35,
    },
    saveBoundaryBtn: {
        height: 50,
        backgroundColor: '#10B981',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    saveBoundaryBtnDisabled: {
        backgroundColor: '#334155',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveBoundaryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});

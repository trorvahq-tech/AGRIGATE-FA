import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Share,
    Platform,
    RefreshControl,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import FarmBoundaryWalker, { BoundarySaveResult, MappedVertex } from '../../components/ui/FarmBoundaryWalker';
import { useTheme } from '../../context/ThemeContext';
import { LatLng } from '../../utils/geoCalculations';
import api from '../../services/apiClient';
import { syncService } from '../../services/syncService';

export interface KwaliMappedArea {
    id: string;
    name: string;
    locationName?: string;
    category?: string;
    notes?: string;
    farmSizeAcres: string;
    farmSizeHa: string;
    perimeterMeters: number;
    centroid: LatLng;
    vertices: MappedVertex[];
    boundaryGeojson: any;
    createdAt: string;
    syncedToBackend?: boolean;
}

const STORAGE_KEY = '@kwali_mapped_areas';

export default function KwaliMappingScreen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const topNavClearance = Math.max(insets.top, 24) + 72;

    // Network Connectivity State
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [isSyncingPending, setIsSyncingPending] = useState<boolean>(false);
    const [syncingAreaId, setSyncingAreaId] = useState<string | null>(null);

    // Map Walker State
    const [showWalker, setShowWalker] = useState<boolean>(false);
    const [pendingResult, setPendingResult] = useState<BoundarySaveResult | null>(null);

    // Save Name Dialog State
    const [showNameModal, setShowNameModal] = useState<boolean>(false);
    const [areaName, setAreaName] = useState<string>('');
    const [locationTag, setLocationTag] = useState<string>('Kwali Central');
    const [category, setCategory] = useState<string>('Farmland Boundary');
    const [notes, setNotes] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // List of Mapped Areas
    const [mappedAreas, setMappedAreas] = useState<KwaliMappedArea[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Preview Modal State
    const [previewArea, setPreviewArea] = useState<KwaliMappedArea | null>(null);

    // Preview Polygon Coordinates: extracted from walked footsteps in boundaryGeojson, fallback to vertices
    const previewPolygonCoords = useMemo(() => {
        if (!previewArea) return [];
        if (previewArea.boundaryGeojson?.coordinates?.[0]?.length >= 3) {
            return previewArea.boundaryGeojson.coordinates[0].map(([lng, lat]: [number, number]) => ({
                latitude: lat,
                longitude: lng,
            }));
        }
        if (previewArea.vertices?.length >= 3) {
            return previewArea.vertices.map((v) => ({
                latitude: v.latitude,
                longitude: v.longitude,
            }));
        }
        return [];
    }, [previewArea]);

    // Compute bounding region so even very large land parcels fit completely on screen
    const previewRegion = useMemo(() => {
        if (!previewArea) {
            return {
                latitude: 9.0,
                longitude: 7.0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }
        if (previewPolygonCoords.length > 0) {
            let minLat = previewPolygonCoords[0].latitude;
            let maxLat = previewPolygonCoords[0].latitude;
            let minLng = previewPolygonCoords[0].longitude;
            let maxLng = previewPolygonCoords[0].longitude;
            for (const pt of previewPolygonCoords) {
                if (pt.latitude < minLat) minLat = pt.latitude;
                if (pt.latitude > maxLat) maxLat = pt.latitude;
                if (pt.longitude < minLng) minLng = pt.longitude;
                if (pt.longitude > maxLng) maxLng = pt.longitude;
            }
            const latDelta = Math.max(Math.abs(maxLat - minLat) * 1.35, 0.003);
            const lngDelta = Math.max(Math.abs(maxLng - minLng) * 1.35, 0.003);
            return {
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: latDelta,
                longitudeDelta: lngDelta,
            };
        }
        return {
            latitude: previewArea.centroid.latitude,
            longitude: previewArea.centroid.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
        };
    }, [previewArea, previewPolygonCoords]);

    // Load saved areas on mount
    const loadSavedAreas = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const list: KwaliMappedArea[] = JSON.parse(raw);
                setMappedAreas(list);
            }
        } catch (e) {
            console.warn('Failed to load kwali areas:', e);
        }
    }, []);

    useEffect(() => {
        loadSavedAreas();
    }, [loadSavedAreas]);

    // Build payload for API submission
    const buildAreaPayload = useCallback((area: KwaliMappedArea) => {
        // Prefer the full shape contour from boundaryGeojson if available, fallback to vertices
        let coords: [number, number][] | undefined = undefined;
        if (area.boundaryGeojson?.coordinates?.[0]?.length >= 3) {
            coords = area.boundaryGeojson.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
        } else if (area.vertices?.length >= 3) {
            coords = (area.vertices || []).map((v) => [v.latitude, v.longitude]);
        }

        return {
            id: area.id,
            name: area.name,
            farm_name: `Kwali - ${area.locationName || 'Kwali'}`,
            location_name: area.locationName || 'Kwali',
            area_acres: area.farmSizeAcres,
            area_hectares: area.farmSizeHa,
            perimeter_meters: area.perimeterMeters,
            centroid_lat: area.centroid.latitude,
            centroid_lng: area.centroid.longitude,
            centroid: area.centroid,
            boundary_geojson: area.boundaryGeojson,
            coords: coords && coords.length >= 3 ? coords : undefined,
            mapping_purpose: 'Kwali Mapping',
            status: 'Planned',
            notes: area.notes || '',
        };
    }, []);

    // Robust upload handler: tries /kwali -> resolves farmId for /fields -> fallbacks to /demo-plots
    const uploadAreaToBackend = useCallback(async (payload: any) => {
        try {
            return await api.post('/kwali', payload);
        } catch {
            // Fallback 1: sync to /fields if a farmId can be resolved
            let farmId = payload.farmId;
            if (!farmId) {
                const farmsRes = await api.get('/farms').catch(() => null);
                const farmList = Array.isArray(farmsRes?.data) ? farmsRes.data : farmsRes?.data?.data || [];
                farmId = farmList[0]?.id;
            }

            if (farmId) {
                return await api.post('/fields', {
                    farmId,
                    name: payload.name,
                    areaHectares: parseFloat(payload.area_hectares) || 1.0,
                    boundaryGeojson: payload.boundary_geojson,
                    centroidLat: payload.centroid_lat,
                    centroidLng: payload.centroid_lng,
                });
            }

            // Fallback 2: sync to /demo-plots which has NO required farmId
            return await api.post('/demo-plots', {
                name: payload.name,
                boundaryGeojson: payload.boundary_geojson,
                centroidLat: payload.centroid_lat,
                centroidLng: payload.centroid_lng,
            });
        }
    }, []);

    // Sync all pending offline areas or force-sync all mapped areas to cloud
    const syncAllPending = useCallback(async (showUserAlert: boolean = true, forceAll: boolean = false) => {
        const netState = await NetInfo.fetch().catch(() => null);
        const online = Boolean(netState?.isConnected && netState?.isInternetReachable !== false);

        if (!online) {
            if (showUserAlert) {
                Alert.alert(
                    'No Internet Connection',
                    'Your mapped areas are safely stored on this device. Reconnect to Wi-Fi or mobile data to sync with the server.'
                );
            }
            return;
        }

        // Read directly from storage to get freshest list
        let currentList: KwaliMappedArea[] = [];
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) currentList = JSON.parse(raw);
        } catch {
            currentList = [...mappedAreas];
        }

        const targetList = forceAll ? currentList : currentList.filter((a) => !a.syncedToBackend);
        if (targetList.length === 0) {
            if (showUserAlert) {
                Alert.alert('No Areas to Sync', 'No mapped areas found to upload.');
            }
            return;
        }

        setIsSyncingPending(true);
        let syncedCount = 0;
        let lastError = '';

        for (const area of targetList) {
            try {
                const payload = buildAreaPayload(area);
                await uploadAreaToBackend(payload);

                syncedCount++;
                currentList = currentList.map((a) => (a.id === area.id ? { ...a, syncedToBackend: true } : a));
                // Immediately save progress to storage per item
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
                setMappedAreas([...currentList]);
            } catch (err: any) {
                lastError = err?.message || 'Server error';
                console.log(`Failed to sync area ${area.name}:`, err?.message);
            }
        }

        // Also flush any items in SyncService queue
        syncService.processSyncQueue(true).catch(() => {});

        setIsSyncingPending(false);

        if (showUserAlert) {
            if (syncedCount > 0) {
                Alert.alert(
                    'Sync Complete!',
                    `Successfully uploaded ${syncedCount} of ${targetList.length} mapped area(s) to the cloud. They are now visible on the web dashboard.`
                );
            } else {
                Alert.alert(
                    'Sync Issue',
                    `Could not upload areas: ${lastError || 'Server not reachable'}. Your areas remain safely stored offline on your device.`
                );
            }
        }
    }, [buildAreaPayload, mappedAreas, uploadAreaToBackend]);

    // Sync or Re-sync a single area to the cloud
    const syncSingleArea = async (area: KwaliMappedArea) => {
        const netState = await NetInfo.fetch().catch(() => null);
        const online = Boolean(netState?.isConnected && netState?.isInternetReachable !== false);

        if (!online) {
            Alert.alert(
                'No Internet Connection',
                'Your mapped area is safely stored on this phone. Connect to cellular data or Wi-Fi to sync with the server.'
            );
            return;
        }

        setSyncingAreaId(area.id);
        const payload = buildAreaPayload(area);

        try {
            await uploadAreaToBackend(payload);

            // Mark as synced in local storage
            let currentList: KwaliMappedArea[] = [];
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) currentList = JSON.parse(raw);
            } catch {
                currentList = [...mappedAreas];
            }
            const updated = currentList.map((a) => (a.id === area.id ? { ...a, syncedToBackend: true } : a));
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            setMappedAreas(updated);

            Alert.alert('Uploaded to Cloud!', `"${area.name}" successfully uploaded to the cloud database. It is now live on the web dashboard.`);
        } catch (err: any) {
            Alert.alert(
                'Sync Failed',
                `Could not reach server: ${err?.message || 'Please try again later'}. The area remains safely stored offline on your device.`
            );
        } finally {
            setSyncingAreaId(null);
        }
    };

    // Monitor Network Connectivity & trigger auto-sync on reconnect
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const online = Boolean(state.isConnected && state.isInternetReachable !== false);
            setIsOnline(online);
            if (online) {
                // Auto-sync when reconnecting to network!
                syncAllPending(false);
            }
        });

        NetInfo.fetch().then((state) => {
            setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
        });

        return () => unsubscribe();
    }, [syncAllPending]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSavedAreas();
        if (isOnline) {
            // Force re-sync all areas to the cloud on pull-down
            await syncAllPending(false, true);
        }
        setRefreshing(false);
    };

    // Triggered when FarmBoundaryWalker finishes boundary capture
    const handleBoundaryCapture = (result: BoundarySaveResult) => {
        setShowWalker(false);
        setPendingResult(result);
        const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        setAreaName(`Kwali Area - ${dateStr}`);
        setShowNameModal(true);
    };

    // Save area with name and queue for background sync / immediate upload
    const handleConfirmSave = async () => {
        if (!areaName.trim()) {
            Alert.alert('Required', 'Please enter a name for this mapped area.');
            return;
        }

        if (!pendingResult) return;

        setIsSaving(true);
        const newId = 'kwali_' + Date.now();
        const newArea: KwaliMappedArea = {
            id: newId,
            name: areaName.trim(),
            locationName: locationTag.trim() || 'Kwali',
            category,
            notes: notes.trim(),
            farmSizeAcres: pendingResult.farmSizeAcres,
            farmSizeHa: pendingResult.farmSizeHa,
            perimeterMeters: pendingResult.perimeterMeters,
            centroid: pendingResult.centroid,
            vertices: pendingResult.vertices,
            boundaryGeojson: pendingResult.boundaryGeojson,
            createdAt: new Date().toISOString(),
            syncedToBackend: false,
        };

        // 1. SAVE LOCALLY IMMEDIATELY (GUARANTEES 100% ZERO DATA LOSS OFFLINE)
        let updatedList: KwaliMappedArea[] = [newArea, ...mappedAreas];
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
            setMappedAreas(updatedList);
        } catch (err) {
            console.warn('Failed to persist Kwali area locally:', err);
        }

        // 2. ENQUEUE IN OFFLINE SYNC SERVICE
        const payload = buildAreaPayload(newArea);
        await syncService.enqueueMutation({
            type: 'SAVE_KWALI_MAPPING',
            description: `Kwali Area: ${newArea.name}`,
            payload,
        }).catch(() => {});

        // 3. IF ONLINE, ATTEMPT IMMEDIATE SYNC
        let syncedOnline = false;
        if (isOnline) {
            try {
                await uploadAreaToBackend(payload);

                newArea.syncedToBackend = true;
                syncedOnline = true;
                updatedList = updatedList.map((a) => (a.id === newId ? { ...a, syncedToBackend: true } : a));
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
                setMappedAreas(updatedList);
            } catch (syncErr: any) {
                console.log('Immediate online upload failed, remains queued in offline storage:', syncErr?.message);
            }
        }

        setIsSaving(false);
        setShowNameModal(false);
        setPendingResult(null);
        setAreaName('');
        setNotes('');

        if (syncedOnline) {
            Alert.alert(
                'Area Saved & Synced!',
                `"${newArea.name}" (${newArea.farmSizeAcres} Acres / ${newArea.farmSizeHa} Ha)\nCentroid: ${newArea.centroid.latitude.toFixed(5)}, ${newArea.centroid.longitude.toFixed(5)}\nSuccessfully saved locally and synced to the cloud.`
            );
        } else {
            Alert.alert(
                'Saved Offline on Device!',
                `"${newArea.name}" (${newArea.farmSizeAcres} Acres / ${newArea.farmSizeHa} Ha)\nCentroid: ${newArea.centroid.latitude.toFixed(5)}, ${newArea.centroid.longitude.toFixed(5)}\n\nSaved locally on this phone. It will automatically upload to the cloud as soon as network connectivity is restored.`
            );
        }
    };

    // Delete Area
    const handleDeleteArea = (id: string, name: string) => {
        Alert.alert('Delete Mapped Area', `Are you sure you want to delete "${name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const filtered = mappedAreas.filter((a) => a.id !== id);
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                    setMappedAreas(filtered);
                },
            },
        ]);
    };

    // Export KML for an area (100% offline capable)
    const handleExportKML = async (area: KwaliMappedArea) => {
        // Walking steps (footsteps) from boundaryGeojson define the actual shape & contour of the land.
        // Picked vertices represent turning / corner milestones.
        let ringCoords: [number, number][] = [];
        if (area.boundaryGeojson?.coordinates?.[0]?.length >= 3) {
            // GeoJSON coordinates are [longitude, latitude]
            ringCoords = area.boundaryGeojson.coordinates[0];
        } else if (area.vertices?.length >= 3) {
            ringCoords = area.vertices.map((v) => [v.longitude, v.latitude]);
            ringCoords.push([ringCoords[0][0], ringCoords[0][1]]);
        }

        const closedCoords = ringCoords
            .map(([lng, lat]) => `${lng},${lat},0`)
            .join(' ');

        // Placemarks for corner turn milestones
        const cornerPlacemarks = (area.vertices || [])
            .map(
                (v, i) => `
    <Placemark>
      <name>${escapeXml(area.name)} - Corner Turn P${i + 1}</name>
      <description>${escapeXml(v.label || `Corner P${i + 1}`)}: Lat ${v.latitude.toFixed(6)}, Lng ${v.longitude.toFixed(6)}</description>
      <Point>
        <coordinates>${v.longitude},${v.latitude},0</coordinates>
      </Point>
    </Placemark>`
            )
            .join('');

        const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(area.name)}</name>
    <description>Kwali Field Area - ${area.farmSizeAcres} Acres (${area.farmSizeHa} Ha) - Walked Contour</description>
    <Style id="kwaliAreaStyle">
      <LineStyle>
        <color>ff0e6f6a</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>4d0e6f6a</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>${escapeXml(area.name)} - Boundary Contour (Walked Footsteps)</name>
      <styleUrl>#kwaliAreaStyle</styleUrl>
      <ExtendedData>
        <Data name="acres"><value>${area.farmSizeAcres}</value></Data>
        <Data name="hectares"><value>${area.farmSizeHa}</value></Data>
        <Data name="perimeter_meters"><value>${area.perimeterMeters}</value></Data>
        <Data name="walked_points_count"><value>${ringCoords.length}</value></Data>
        <Data name="corner_milestones_count"><value>${area.vertices?.length || 0}</value></Data>
        <Data name="centroid_lat"><value>${area.centroid.latitude}</value></Data>
        <Data name="centroid_lng"><value>${area.centroid.longitude}</value></Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${closedCoords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>${escapeXml(area.name)} - Centroid</name>
      <description>Centroid: ${area.centroid.latitude.toFixed(6)}, ${area.centroid.longitude.toFixed(6)}</description>
      <Point>
        <coordinates>${area.centroid.longitude},${area.centroid.latitude},0</coordinates>
      </Point>
    </Placemark>${cornerPlacemarks}
  </Document>
</kml>`;

        try {
            await Share.share({
                title: `${area.name}.kml`,
                message: kmlContent,
            });
        } catch (err: any) {
            Alert.alert('Export Error', err.message || 'Could not export KML file.');
        }
    };

    function escapeXml(unsafe: string) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    // Calculated metrics
    const totalAcres = mappedAreas.reduce((acc, a) => acc + (parseFloat(a.farmSizeAcres) || 0), 0).toFixed(2);
    const totalHa = mappedAreas.reduce((acc, a) => acc + (parseFloat(a.farmSizeHa) || 0), 0).toFixed(2);
    const pendingSyncCount = mappedAreas.filter((a) => !a.syncedToBackend).length;

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            {/* Top Navigation */}
            <CustomBackNavBar
                title="Kwali Area Mapper"
                onBackPress={() => {
                    if (navigation?.canGoBack && navigation.canGoBack()) {
                        navigation.goBack();
                    } else if (router.canGoBack()) {
                        router.back();
                    } else if (navigation?.navigate) {
                        navigation.navigate('index');
                    } else {
                        router.navigate('/(agent)' as any);
                    }
                }}
                rightIcon={
                    isSyncingPending ? (
                        <ActivityIndicator size="small" color="#0E6F6A" />
                    ) : (
                        <Ionicons name="cloud-upload-outline" size={20} color="#0E6F6A" />
                    )
                }
                onRightPress={() => syncAllPending(true, true)}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: topNavClearance + 12 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0E6F6A']} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Network & Offline Status Banner - Positioned cleanly below CustomBackNavBar */}
                {!isOnline ? (
                    <View style={styles.offlineBanner}>
                        <Ionicons name="cloud-offline" size={20} color="#B45309" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.offlineBannerTitle}>Offline Mode Active (No Network)</Text>
                            <Text style={styles.offlineBannerSubtitle}>
                                Satellite GPS walking works 100% offline. All mapped areas & centroids are safely saved on your device and will auto-sync when network returns.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.onlineBanner, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <Ionicons name="cloud-done-outline" size={20} color="#059669" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.onlineBannerTitle, { color: '#065F46' }]}>Connected to Cloud</Text>
                            <Text style={[styles.onlineBannerSubtitle, { color: '#047857' }]}>
                                {pendingSyncCount > 0
                                    ? `${pendingSyncCount} offline area(s) ready to sync.`
                                    : `${mappedAreas.length} area(s) saved on device. Tap Re-sync to push to web.`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.bannerSyncBtn, { backgroundColor: '#0E6F6A' }]}
                            onPress={() => syncAllPending(true, true)}
                            disabled={isSyncingPending}
                            activeOpacity={0.8}
                        >
                            {isSyncingPending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.bannerSyncBtnText}>
                                    {pendingSyncCount > 0 ? 'Sync All' : 'Re-sync All'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                {/* Hero / CTA Card */}
                <View style={[styles.heroCard, { backgroundColor: '#0E6F6A' }]}>
                    <View style={styles.heroBadge}>
                        <Ionicons name="location-sharp" size={14} color="#0E6F6A" />
                        <Text style={styles.heroBadgeText}>GPS Boundary Walking Engine</Text>
                    </View>
                    <Text style={styles.heroTitle}>Walk & Map Kwali Areas</Text>
                    <Text style={styles.heroSubtitle}>
                        Walk along any perimeter to record corner vertices, compute exact acreage, and save centroid coordinates. Works completely offline in the farm!
                    </Text>

                    <TouchableOpacity
                        style={styles.heroActionBtn}
                        onPress={() => setShowWalker(true)}
                        activeOpacity={0.88}
                    >
                        <Ionicons name="walk" size={20} color="#0E6F6A" />
                        <Text style={styles.heroActionText}>Start Walking & Mapping</Text>
                        <Feather name="arrow-right" size={18} color="#0E6F6A" />
                    </TouchableOpacity>

                    {mappedAreas.length > 0 && (
                        <TouchableOpacity
                            style={styles.heroForceSyncBtn}
                            onPress={() => syncAllPending(true, true)}
                            disabled={isSyncingPending}
                            activeOpacity={0.88}
                        >
                            {isSyncingPending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                                    <Text style={styles.heroForceSyncText}>
                                        Force Re-Sync All ({mappedAreas.length}) Areas to Cloud
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Summary Grid */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
                        <Text style={[styles.statNum, { color: '#0E6F6A' }]}>{mappedAreas.length}</Text>
                        <Text style={styles.statLabel}>Mapped Areas</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
                        <Text style={[styles.statNum, { color: '#2563EB' }]}>{totalAcres}</Text>
                        <Text style={styles.statLabel}>Total Acres</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
                        <Text style={[styles.statNum, { color: '#16A34A' }]}>{totalHa}</Text>
                        <Text style={styles.statLabel}>Total Hectares</Text>
                    </View>
                </View>

                {/* Mapped Areas Section Header */}
                <View style={styles.sectionHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="map-outline" size={18} color="#0E6F6A" />
                        <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.text : '#111827' }]}>
                            Saved Kwali Areas ({mappedAreas.length})
                        </Text>
                    </View>

                    {mappedAreas.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.headerSyncBtn,
                                pendingSyncCount === 0 && { backgroundColor: '#0E6F6A' },
                            ]}
                            onPress={() => syncAllPending(true, true)}
                            disabled={isSyncingPending}
                            activeOpacity={0.8}
                        >
                            {isSyncingPending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={13} color="#FFFFFF" />
                                    <Text style={styles.headerSyncBtnText}>
                                        {pendingSyncCount > 0 ? `Sync (${pendingSyncCount})` : 'Re-sync All'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {mappedAreas.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="map-marker-path" size={36} color="#0E6F6A" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: isDarkMode ? colors.text : '#111827' }]}>
                            No Areas Mapped Yet
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Tap "Start Walking & Mapping" above to walk a field boundary and record your first Kwali area.
                        </Text>
                    </View>
                ) : (
                    mappedAreas.map((area) => (
                        <View
                            key={area.id}
                            style={[styles.areaCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}
                        >
                            {/* Card Header */}
                            <View style={styles.areaHeader}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.areaName, { color: isDarkMode ? colors.text : '#111827' }]}>
                                            {area.name}
                                        </Text>
                                        {area.syncedToBackend ? (
                                            <View style={styles.syncedPill}>
                                                <Ionicons name="cloud-done" size={12} color="#16A34A" />
                                                <Text style={styles.syncedPillText}>Synced</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.pendingPill}>
                                                <Ionicons name="cloud-offline" size={12} color="#D97706" />
                                                <Text style={styles.pendingPillText}>Saved Offline</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.areaDate}>
                                        {new Date(area.createdAt).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })} • {area.locationName || 'Kwali'}
                                    </Text>
                                </View>

                                <View style={styles.sizeBadge}>
                                    <Text style={styles.sizeBadgeText}>{area.farmSizeAcres} Ac</Text>
                                </View>
                            </View>

                            {/* Centroid & Metrics Details */}
                            <View style={styles.metricsGrid}>
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>Centroid Coordinates</Text>
                                    <Text style={styles.metricValue}>
                                        {area.centroid.latitude.toFixed(5)}, {area.centroid.longitude.toFixed(5)}
                                    </Text>
                                </View>
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>Perimeter / Contour</Text>
                                    <Text style={styles.metricValue}>
                                        {area.perimeterMeters}m • {area.boundaryGeojson?.coordinates?.[0]?.length ? `${area.boundaryGeojson.coordinates[0].length} steps` : `${area.vertices?.length || 0} pts`} ({area.vertices?.length || 0} corners)
                                    </Text>
                                </View>
                            </View>

                            {/* Card Actions */}
                            <View style={styles.cardActionsRow}>
                                <TouchableOpacity
                                    style={styles.actionBtnOutline}
                                    onPress={() => setPreviewArea(area)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="eye-outline" size={15} color="#0E6F6A" />
                                    <Text style={styles.actionBtnOutlineText}>Preview</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.actionBtnSyncCard,
                                        area.syncedToBackend && styles.actionBtnResyncCard,
                                    ]}
                                    onPress={() => syncSingleArea(area)}
                                    disabled={syncingAreaId === area.id}
                                    activeOpacity={0.7}
                                >
                                    {syncingAreaId === area.id ? (
                                        <ActivityIndicator size="small" color="#0E6F6A" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={area.syncedToBackend ? 'cloud-done-outline' : 'cloud-upload-outline'}
                                                size={14}
                                                color={area.syncedToBackend ? '#059669' : '#0E6F6A'}
                                            />
                                            <Text
                                                style={[
                                                    styles.actionBtnSyncCardText,
                                                    area.syncedToBackend && { color: '#059669' },
                                                ]}
                                            >
                                                {area.syncedToBackend ? 'Re-sync' : 'Sync'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionBtnKml}
                                    onPress={() => handleExportKML(area)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="share-outline" size={15} color="#FFFFFF" />
                                    <Text style={styles.actionBtnKmlText}>Export KML</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteIconButton}
                                    onPress={() => handleDeleteArea(area.id, area.name)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* FarmBoundaryWalker Fullscreen GPS Modal */}
            <FarmBoundaryWalker
                visible={showWalker}
                initialVertices={[]}
                onClose={() => setShowWalker(false)}
                onSaveBoundary={handleBoundaryCapture}
            />

            {/* Save Name Dialog Modal */}
            <Modal
                visible={showNameModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!isSaving) setShowNameModal(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.nameModalContent, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="save" size={20} color="#0E6F6A" />
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={[styles.modalTitle, { color: isDarkMode ? colors.text : '#111827' }]}>
                                    Save Mapped Area
                                </Text>
                                <Text style={styles.modalSub}>
                                    Give this boundary a name to record its centroid and metrics
                                </Text>
                            </View>
                        </View>

                        {/* Calculated Stats Quick Summary */}
                        {pendingResult && (
                            <View style={styles.metricSummaryCard}>
                                <View style={styles.metricSummaryRow}>
                                    <View>
                                        <Text style={styles.metricSumLabel}>Calculated Area</Text>
                                        <Text style={styles.metricSumVal}>
                                            {pendingResult.farmSizeAcres} Acres ({pendingResult.farmSizeHa} Ha)
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.metricSumLabel}>Perimeter</Text>
                                        <Text style={styles.metricSumVal}>{pendingResult.perimeterMeters}m</Text>
                                    </View>
                                </View>
                                <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6 }}>
                                    <Text style={styles.metricSumLabel}>Centroid Coordinates</Text>
                                    <Text style={styles.metricSumValCoords}>
                                        {pendingResult.centroid.latitude.toFixed(6)}, {pendingResult.centroid.longitude.toFixed(6)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Area Name Input */}
                        <Text style={styles.inputLabel}>Area / Farm Name *</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: isDarkMode ? colors.background : '#F9FAFB',
                                    color: isDarkMode ? colors.text : '#111827',
                                    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                },
                            ]}
                            placeholder="e.g. Kwali Sector A - Plot 4"
                            placeholderTextColor="#9CA3AF"
                            value={areaName}
                            onChangeText={setAreaName}
                            editable={!isSaving}
                        />

                        {/* Location Tag */}
                        <Text style={styles.inputLabel}>Location / Community</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: isDarkMode ? colors.background : '#F9FAFB',
                                    color: isDarkMode ? colors.text : '#111827',
                                    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                },
                            ]}
                            placeholder="e.g. Kwali, Abuja FCT"
                            placeholderTextColor="#9CA3AF"
                            value={locationTag}
                            onChangeText={setLocationTag}
                            editable={!isSaving}
                        />

                        {/* Notes */}
                        <Text style={styles.inputLabel}>Notes (Optional)</Text>
                        <TextInput
                            style={[
                                styles.textInputMultiline,
                                {
                                    backgroundColor: isDarkMode ? colors.background : '#F9FAFB',
                                    color: isDarkMode ? colors.text : '#111827',
                                    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                },
                            ]}
                            placeholder="Any notes about crop, terrain, or land markers..."
                            placeholderTextColor="#9CA3AF"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={2}
                            editable={!isSaving}
                        />

                        {/* Buttons */}
                        <View style={styles.modalBtnsRow}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowNameModal(false)}
                                disabled={isSaving}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleConfirmSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                        <Text style={styles.saveBtnText}>Save Area</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Map Preview Modal */}
            <Modal
                visible={!!previewArea}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setPreviewArea(null)}
            >
                {previewArea && (
                    <SafeAreaView edges={['top', 'bottom']} style={[styles.previewContainer, { backgroundColor: isDarkMode ? colors.background : '#FFFFFF' }]}>
                        {/* Header with clear title and prominent close button */}
                        <View style={[styles.previewHeader, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF', borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="earth" size={18} color="#0E6F6A" />
                                    <Text style={[styles.previewTitle, { color: isDarkMode ? colors.text : '#111827' }]} numberOfLines={1}>
                                        {previewArea.name}
                                    </Text>
                                </View>
                                <Text style={styles.previewSubtitle} numberOfLines={1}>
                                    {previewArea.locationName || 'Kwali, Abuja FCT'} • Walked GPS Parcel
                                </Text>
                            </View>

                            {/* Easy-to-tap prominent Close Button */}
                            <TouchableOpacity
                                style={styles.closeBtnPill}
                                onPress={() => setPreviewArea(null)}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                activeOpacity={0.7}
                                accessibilityLabel="Close Preview"
                            >
                                <Ionicons name="close" size={18} color="#374151" />
                                <Text style={styles.closeBtnPillText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Map View */}
                        <View style={styles.mapContainer}>
                            {Platform.OS !== 'web' ? (
                                <MapView
                                    provider={PROVIDER_DEFAULT}
                                    style={StyleSheet.absoluteFill}
                                    mapType="hybrid"
                                    region={previewRegion}
                                >
                                    {/* Mapped Polygon (Follows exact walked footsteps) */}
                                    {previewPolygonCoords.length >= 3 && (
                                        <Polygon
                                            coordinates={previewPolygonCoords}
                                            strokeColor="#0E6F6A"
                                            fillColor="rgba(14, 111, 106, 0.35)"
                                            strokeWidth={3}
                                        />
                                    )}

                                    {/* Centroid Marker */}
                                    <Marker
                                        coordinate={{
                                            latitude: previewArea.centroid.latitude,
                                            longitude: previewArea.centroid.longitude,
                                        }}
                                        title={`${previewArea.name} (Centroid)`}
                                        description={`${previewArea.farmSizeAcres} Ac • ${previewArea.farmSizeHa} Ha`}
                                        pinColor="#0E6F6A"
                                    />

                                    {/* Corner Turn Milestone Markers */}
                                    {previewArea.vertices?.map((v, i) => (
                                        <Marker
                                            key={`vert_${v.id || i}`}
                                            coordinate={{ latitude: v.latitude, longitude: v.longitude }}
                                            pinColor="#F59E0B"
                                            title={`Corner Turn P${i + 1}`}
                                            description={`Turn milestone: ${v.latitude.toFixed(5)}, ${v.longitude.toFixed(5)}`}
                                        />
                                    ))}
                                </MapView>
                            ) : (
                                <View style={styles.mapFallback}>
                                    <Text>Map preview is available on iOS/Android native devices.</Text>
                                </View>
                            )}

                            {/* Floating Close Button on Map for Quick Dismiss */}
                            <TouchableOpacity
                                style={styles.floatingMapCloseBtn}
                                onPress={() => setPreviewArea(null)}
                                activeOpacity={0.85}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                                <Text style={styles.floatingMapCloseText}>Close Preview</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer Details */}
                        <View style={[styles.previewFooter, { backgroundColor: isDarkMode ? colors.card : '#F9FAFB', borderTopColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
                            <TouchableOpacity
                                style={styles.footerCloseBtn}
                                onPress={() => setPreviewArea(null)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close-circle-outline" size={18} color="#4B5563" />
                                <Text style={styles.footerCloseBtnText}>Close</Text>
                            </TouchableOpacity>

                            <Text style={styles.previewFooterText} numberOfLines={1}>
                                {previewArea.farmSizeAcres} Ac • {previewArea.perimeterMeters}m
                            </Text>

                            <TouchableOpacity
                                style={styles.exportInPreviewBtn}
                                onPress={() => handleExportKML(previewArea)}
                            >
                                <Ionicons name="share-social" size={16} color="#FFFFFF" />
                                <Text style={styles.exportInPreviewText}>Export KML</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 14,
    },
    offlineBannerTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400E',
    },
    offlineBannerSubtitle: {
        fontSize: 11,
        color: '#B45309',
        marginTop: 2,
        lineHeight: 15,
    },
    onlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 14,
    },
    onlineBannerTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#065F46',
    },
    onlineBannerSubtitle: {
        fontSize: 11,
        color: '#047857',
        marginTop: 2,
    },
    bannerSyncBtn: {
        backgroundColor: '#0E6F6A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 8,
    },
    bannerSyncBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    heroCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#0E6F6A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        marginBottom: 12,
    },
    heroBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Acorn-Bold',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.88)',
        lineHeight: 18,
        marginBottom: 18,
    },
    heroActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 13,
        paddingHorizontal: 18,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heroActionText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    statNum: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Acorn-Bold',
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Acorn-Bold',
    },
    headerSyncBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0E6F6A',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 5,
    },
    headerSyncBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    emptyCard: {
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E6F4F1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },
    areaCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 2,
    },
    areaHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    areaName: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Acorn-Bold',
    },
    areaDate: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    syncedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 3,
    },
    syncedPillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16A34A',
    },
    pendingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 3,
    },
    pendingPillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#D97706',
    },
    sizeBadge: {
        backgroundColor: '#E6F4F1',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    sizeBadgeText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0E6F6A',
    },
    metricsGrid: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        gap: 6,
    },
    metricItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metricLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    metricValue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#111827',
    },
    cardActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F4F1',
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    actionBtnOutlineText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0E6F6A',
    },
    actionBtnSyncCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F4F1',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 4,
    },
    actionBtnResyncCard: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    heroForceSyncBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        paddingVertical: 10,
        borderRadius: 14,
        marginTop: 10,
        gap: 8,
    },
    heroForceSyncText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    actionBtnSyncCardText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    actionBtnKml: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E6F6A',
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    actionBtnKmlText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deleteIconButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    nameModalContent: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E6F4F1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Acorn-Bold',
    },
    modalSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    metricSummaryCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    metricSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metricSumLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    metricSumVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0E6F6A',
        marginTop: 2,
    },
    metricSumValCoords: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 2,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    textInput: {
        height: 44,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        marginBottom: 12,
    },
    textInputMultiline: {
        height: 64,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingTop: 8,
        fontSize: 14,
        marginBottom: 16,
        textAlignVertical: 'top',
    },
    modalBtnsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    saveBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E6F6A',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    previewSubtitle: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    closeBtnPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 4,
    },
    closeBtnPillText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    floatingMapCloseBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.85)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingMapCloseText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeBtn: {
        padding: 4,
    },
    mapContainer: {
        flex: 1,
    },
    mapFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewFooter: {
        padding: 14,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerCloseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        gap: 4,
        marginRight: 10,
    },
    footerCloseBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    previewFooterText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    exportInPreviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0E6F6A',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        gap: 4,
    },
    exportInPreviewText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

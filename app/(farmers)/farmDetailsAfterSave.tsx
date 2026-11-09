import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';

import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');
const MAPPING_ICON = require('../../assets/images/mapping.png');

const FARM_LOCATION = {
    latitude: 10.5105,
    longitude: 7.4165,
};

const subplots: any[] = [];

export default function FarmDetailsAfterSaveScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();
    const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'standard'>('satellite');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation([location.coords.longitude, location.coords.latitude]);
        })();
    }, []);

    const centerLat = userLocation ? userLocation[1] : FARM_LOCATION.latitude;
    const centerLng = userLocation ? userLocation[0] : FARM_LOCATION.longitude;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            <MapView
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_DEFAULT}
                mapType={mapStyle}
                initialRegion={{
                    latitude: centerLat,
                    longitude: centerLng,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                }}
            >
                <Polygon
                    coordinates={[
                        { latitude: centerLat + 0.002, longitude: centerLng - 0.002 },
                        { latitude: centerLat + 0.003, longitude: centerLng + 0.001 },
                        { latitude: centerLat + 0.001, longitude: centerLng + 0.003 },
                        { latitude: centerLat - 0.002, longitude: centerLng + 0.001 },
                        { latitude: centerLat - 0.001, longitude: centerLng - 0.002 },
                    ]}
                    strokeColor="#10B981"
                    fillColor="rgba(16, 185, 129, 0.4)"
                    strokeWidth={2.5}
                />
                {userLocation && (
                    <Marker
                        coordinate={{ latitude: centerLat, longitude: centerLng }}
                        title="Farm Location"
                        description="2.4 ha • Active"
                    />
                )}
            </MapView>


            <CustomBackNavBar
                title={(params.farmerName as string) || (params.farmName as string) || "Farm Parcel"}
                onBackPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace('/(farmers)/farmTabDetails');
                }}
                backgroundColor={colors.glassBackground}
                blurIntensity={20}
                textColor={colors.text}
            />


            <View style={styles.sizeIndicatorRow}>
                <View style={[styles.sizeIndicator, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : '#FFFFFF99' }]}>
                    <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={styles.sizeContent}>
                        <Text style={[styles.sizeValue, { color: colors.text }]}>2.4</Text>
                        <Text style={[styles.sizeUnit, { color: colors.textMuted }]}>ha</Text>
                    </View>
                </View>
                <View style={styles.mapControlsContainer}>
                    <TouchableOpacity onPress={() => setMapStyle('standard')} style={[styles.mapControlButton, { backgroundColor: colors.card }, mapStyle === 'standard' && styles.activeControl]}>
                        <Feather name="map" size={18} color={mapStyle === 'standard' ? colors.primary : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMapStyle('satellite')} style={[styles.mapControlButton, { backgroundColor: colors.card }, mapStyle === 'satellite' && styles.activeControl]}>
                        <Feather name="image" size={18} color={mapStyle === 'satellite' ? colors.primary : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMapStyle('hybrid')} style={[styles.mapControlButton, { backgroundColor: colors.card }, mapStyle === 'hybrid' && styles.activeControl]}>
                        <Feather name="globe" size={18} color={mapStyle === 'hybrid' ? colors.primary : colors.text} />
                    </TouchableOpacity>
                </View>
            </View>


            <View style={styles.bottomContainerWrapper}>
                <View style={[styles.bottomContainer, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : '#FFFFFF99' }]}>
                    <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                    <View style={styles.bottomContent}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Farm details</Text>
                            <TouchableOpacity
                                style={styles.addSubplotsButton}
                                onPress={() => router.push('/(farmers)/addSubplot')}
                            >
                                <Text style={styles.addSubplotsButtonText}>+ Add Subplots</Text>
                            </TouchableOpacity>
                        </View>


                        <View style={[styles.fieldInfo, { backgroundColor: colors.card }]}>
                            <View style={styles.fieldRow}>
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>{(params.farmName as string) || (params.fieldName as string) || 'Farm Parcel'}</Text>
                                <Text style={[styles.fieldArea, { color: colors.textMuted }]}>Area: {(params.size as string) || (params.sizeHa as string) || '—'}</Text>
                            </View>
                            <Text style={[styles.fieldValue, { color: colors.textMuted }]}>{(params.cropType as string) || 'Crop farming'}</Text>
                        </View>


                        <View style={styles.subplotsSection}>
                            <Text style={[styles.subplotsTitle, { color: colors.text }]}>Subplots</Text>
                            <View style={styles.subplotsGrid}>
                                {subplots.length === 0 ? (
                                    <View style={{ paddingVertical: 12, alignItems: 'center', width: '100%' }}>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>No subplots registered yet</Text>
                                    </View>
                                ) : (
                                    subplots.map((subplot) => (
                                        <TouchableOpacity
                                            key={subplot.id}
                                            style={[styles.subplotCard, { backgroundColor: colors.card }]}
                                            onPress={() => router.push('/(farmers)/subplotTabDetails')}
                                        >
                                            <View style={styles.subplotCardContent}>
                                                <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                                    <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                                </View>
                                                <View>
                                                    <Text style={[styles.subplotName, { color: colors.text }]}>{subplot.name}</Text>
                                                    <Text style={[styles.subplotSize, { color: colors.textMuted }]}>{subplot.size}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: 'white',
    },
    map: {
        ...StyleSheet.absoluteFill,
    },
    farmOverlayContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 158,
    },
    farmOverlay: {
        width: width * 0.65,
        height: 180,
    },
    // deleted styles

    sizeIndicatorRow: {
        position: 'absolute',
        bottom: 273,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sizeIndicator: {
        height: 48,
        paddingHorizontal: 16,
        // backgroundColor: '#FFFFFF99',
        borderRadius: 16,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    sizeContent: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    sizeValue: {
        fontSize: 24,
        fontWeight: 'bold',
        // color: '#0A0C11',
    },
    sizeUnit: {
        fontSize: 14,
        // color: '#0A0C11B2',
        marginLeft: 4,
    },
    mappingButton: {
        width: 44,
        height: 44,
        // backgroundColor: '#FFFFFF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mappingIcon: {
        width: 22,
        height: 22,
    },
    mapControlsContainer: {
        gap: 8,
    },
    mapControlButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeControl: {
        borderColor: '#0E6F6A',
    },
    bottomContainerWrapper: {
        position: 'absolute',
        bottom: 20,
        left: 12,
        right: 12,
    },
    bottomContainer: {
        height: 240,
        // backgroundColor: '#FFFFFF99',
        borderRadius: 16,
        overflow: 'hidden',
    },
    bottomContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
    },
    addSubplotsButton: {
        borderWidth: 1,
        borderColor: '#0E6F6A',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 12,
        // fontSize: 16,
    },
    addSubplotsButtonText: {
        color: '#0E6F6A',
        fontSize: 16,
        fontWeight: '500',
    },
    fieldInfo: {
        marginBottom: 12,
        // backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
    },
    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    fieldLabel: {
        // fontSize: 13,
        fontWeight: '500',
        // color: '#0A0C11',
    },
    fieldArea: {
        // fontSize: 11,
        // color: '#0A0C11B2',
    },
    fieldValue: {
        // fontSize: 11,
        // color: '#0A0C11B2',
    },
    subplotsSection: {
        marginTop: 4,
    },
    subplotsTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
        marginBottom: 10,
    },
    subplotsGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    subplotCard: {
        flex: 1,
        // backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
    },
    subplotCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 32,
        height: 32,
        // backgroundColor: 'white',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cropIcon: {
        width: 16,
        height: 16,
    },
    subplotName: {
        fontSize: 12,
        fontWeight: '500',
        // color: '#0A0C11',
    },
    subplotSize: {
        fontSize: 10,
        // color: '#0A0C11B2',
        marginTop: 1,
    },
});

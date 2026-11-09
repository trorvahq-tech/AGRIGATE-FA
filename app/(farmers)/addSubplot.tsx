import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const MAPPING_ICON = require('../../assets/images/mapping.png');

const FARM_LOCATION = {
    latitude: 10.5105,
    longitude: 7.4165,
};

export default function AddSubplotScreen() {
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
                        title="Subplot Location"
                        description="Select parcel boundary"
                    />
                )}
            </MapView>

            <CustomBackNavBar
                title={(params.farmerName as string) || (params.farmName as string) || "Subplot Boundary"}
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
                        <Feather name="map" size={18} color={mapStyle === 'standard' ? colors.primary || '#0E6F6A' : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMapStyle('satellite')} style={[styles.mapControlButton, { backgroundColor: colors.card }, mapStyle === 'satellite' && styles.activeControl]}>
                        <Feather name="image" size={18} color={mapStyle === 'satellite' ? colors.primary || '#0E6F6A' : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMapStyle('hybrid')} style={[styles.mapControlButton, { backgroundColor: colors.card }, mapStyle === 'hybrid' && styles.activeControl]}>
                        <Feather name="globe" size={18} color={mapStyle === 'hybrid' ? colors.primary || '#0E6F6A' : colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.bottomContainerWrapper}>
                <View style={[styles.bottomContainer, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : '#FFFFFF99' }]}>
                    <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                    <View style={styles.bottomContent}>
                        <Text style={[styles.addSubplotsTitle, { color: colors.text }]}>Add Subplots</Text>
                        <Text style={[styles.addSubplotsDescription, { color: colors.textMuted }]}>
                            Sub-plots are sections inside the main farm.{'\n'}
                            Use them to separate crops, livestock, or land use.
                        </Text>

                        <TouchableOpacity
                            style={[styles.startMappingButton, { backgroundColor: '#0E6F6A' }]}
                            onPress={() => router.push('/(farmers)/addSubplotDetails')}
                        >
                            <Text style={styles.startMappingText}>Start Sub-Plot Mapping</Text>
                        </TouchableOpacity>
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
        paddingBottom: 108,
    },
    farmOverlay: {
        width: width * 0.75,
        height: 240,
    },

    sizeIndicatorRow: {
        position: 'absolute',
        bottom: 215,
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
        height: 183,
        // backgroundColor: '#FFFFFF99', // Overridden
        borderRadius: 16,
        overflow: 'hidden',
    },
    bottomContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    addSubplotsTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
    },
    addSubplotsDescription: {
        fontSize: 16,
        // color: '#0A0C11B2',
        lineHeight: 22,
    },
    startMappingButton: {
        // backgroundColor: '#0E6F6A',
        borderRadius: 16,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startMappingText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
});

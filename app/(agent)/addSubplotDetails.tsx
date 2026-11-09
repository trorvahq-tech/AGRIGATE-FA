import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const MAPPING_ICON = require('../../assets/images/mapping.png');

const FARM_LOCATION = {
    latitude: 10.5105,
    longitude: 7.4165,
};

export default function AddSubplotDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();
    const [farmingType, setFarmingType] = useState<'crop' | 'livestock'>('crop');
    const [subplotName, setSubplotName] = useState('');
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

    const handleSave = () => {
        router.push({ pathname: '/(agent)/farmDetailsAfterSave', params: { referrer: params.referrer, farmerIdParam: params.farmerIdParam, activityId: params.activityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} hidden={false} />

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
                        description="2.4 ha • Subplot"
                    />
                )}
            </MapView>

            <CustomBackNavBar title={(params.farmerName as string) || (params.farmName as string) || "Subplot Details"} onBackPress={() => router.replace({ pathname: '/(agent)/addSubplot', params: { referrer: params.referrer, farmerIdParam: params.farmerIdParam, activityId: params.activityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } })} backgroundColor={isDarkMode ? colors.navbarBackground : "#FFFFFF4D"} blurIntensity={20} textColor={isDarkMode ? colors.text : "#0A0C11"} />

            <View style={styles.sizeIndicatorRow}>
                <View style={styles.sizeIndicator}>
                    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                    <View style={styles.sizeContent}>
                        <Text style={styles.sizeValue}>2.4</Text>
                        <Text style={styles.sizeUnit}>ha</Text>
                    </View>
                </View>
                <View style={styles.mapControlsContainer}>
                    <TouchableOpacity onPress={() => setMapStyle('standard')} style={[styles.mapControlButton, { backgroundColor: colors.card || '#FFFFFF' }, mapStyle === 'standard' && styles.activeControl]}>
                        <Feather name="map" size={18} color={mapStyle === 'standard' ? colors.primary || '#0E6F6A' : colors.text || '#0A0C11'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMapStyle('satellite')} style={[styles.mapControlButton, { backgroundColor: colors.card || '#FFFFFF' }, mapStyle === 'satellite' && styles.activeControl]}>
                        <Feather name="image" size={18} color={mapStyle === 'satellite' ? colors.primary || '#0E6F6A' : colors.text || '#0A0C11'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMapStyle('hybrid')} style={[styles.mapControlButton, { backgroundColor: colors.card || '#FFFFFF' }, mapStyle === 'hybrid' && styles.activeControl]}>
                        <Feather name="globe" size={18} color={mapStyle === 'hybrid' ? colors.primary || '#0E6F6A' : colors.text || '#0A0C11'} />
                    </TouchableOpacity>
                </View>
            </View>


            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
                style={styles.bottomContainerWrapper}
            >
                <View style={styles.bottomContainer}>
                    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />

                    <View style={styles.bottomContent}>
                        <Text style={[styles.detailsTitle, { color: '#0A0C11' }]}>Add Subplots details</Text>

                        {/* Farming Type */}
                        <Text style={[styles.fieldLabel, { color: '#0A0C11B2' }]} className='!mb-3'>Farming type</Text>
                        <View style={styles.radioRow}>
                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setFarmingType('crop')}
                            >
                                <View style={[styles.radioCircle, farmingType === 'crop' && styles.radioSelected]}>
                                    {farmingType === 'crop' && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.radioLabel, { color: '#0A0C11' }]}>Crop farming</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setFarmingType('livestock')}
                            >
                                <View style={[styles.radioCircle, farmingType === 'livestock' && styles.radioSelected]}>
                                    {farmingType === 'livestock' && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.radioLabel, { color: '#0A0C11' }]}>Livestock farming</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: '#0A0C11B2' }]}>What do you want to plant on this section</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: '#FFFFFF', color: '#0A0C11', borderColor: '#E0E0E0' }]}
                            placeholder="Name"
                            placeholderTextColor="#0A0C11B2"
                            value={subplotName}
                            onChangeText={setSubplotName}
                        />

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.editPointButton} onPress={() => router.replace({ pathname: '/(agent)/addSubplot', params: { referrer: params.referrer, farmerIdParam: params.farmerIdParam, activityId: params.activityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } })}>
                                <Text style={styles.editPointText}>Edit point</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
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
        paddingBottom: 208,
    },
    farmOverlay: {
        width: width * 0.65,
        height: 200,
    },
    // deleted styles

    sizeIndicatorRow: {
        position: 'absolute',
        bottom: 300,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sizeIndicator: {
        height: 48,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF99',
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
        color: '#0A0C11',
    },
    sizeUnit: {
        fontSize: 14,
        color: '#0A0C11B2',
        marginLeft: 4,
    },
    mappingButton: {
        width: 44,
        height: 44,
        backgroundColor: '#FFFFFF',
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
        height: 268,
        backgroundColor: '#FFFFFF99',
        borderRadius: 16,
        overflow: 'hidden',
    },
    bottomContent: {
        flex: 1,
        padding: 16,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0A0C11',
        marginBottom: 10,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#0A0C11B2',
        marginBottom: 6,
    },
    radioRow: {
        flexDirection: 'row',
        gap: 25,
        marginBottom: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#0E6F6A',
    },
    radioInner: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: '#0E6F6A',
    },
    radioLabel: {
        fontSize: 14,
        color: '#0A0C11',
    },
    inputLabel: {
        fontSize: 12,
        color: '#0A0C11B2',
        marginBottom: 6,
    },
    textInput: {
        height: 44,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 13,
        color: '#0A0C11',
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    editPointButton: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editPointText: {
        color: '#0E6F6A',
        fontSize: 13,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        height: 44,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
});

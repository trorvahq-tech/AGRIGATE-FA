import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');

const farmsForSelection = [
    { id: '1', name: 'Maize farm', size: '12.4 ha', subPlots: 3 },
    { id: '2', name: 'Wheat farm', size: '20.5 ha', subPlots: 3 },
    { id: '3', name: 'Rice field', size: '15.8 ha', subPlots: 3 },
    { id: '4', name: 'Soybean plantation', size: '10.2 ha', subPlots: 3 },
];

export default function SelectFarmScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();
    const [selectedFarm, setSelectedFarm] = useState<string | null>(null);

    const handleSelect = () => {
        if (selectedFarm) {
            router.push({ pathname: '/selectSubplots', params: { farmId: selectedFarm, type: params.type, flow: params.flow, isFromHome: params.isFromHome } });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            {/* <FarmerDetailsBackground /> */}

            <CustomBackNavBar
                title={params.flow === 'assessment' ? 'Assess Farm' : (params.type === 'livestock' ? 'Livestock' : 'Crop farming')}
                onBackPress={() => params.farmerId ? router.replace({ pathname: '/(agent)/farmerDetails', params: { id: params.farmerId } }) : router.replace('/(agent)' as any)}
            />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                {/* Background Gradient */}
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                {/* <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} /> */}

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>{params.flow === 'assessment' ? 'Assess Farm' : 'Choose Farm'}</Text>

                    <View style={styles.listContainer}>
                        {farmsForSelection.map((farm) => (
                            <TouchableOpacity
                                key={farm.id}
                                style={[styles.selectionCard, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }, selectedFarm === farm.id && styles.selectionCardSelected]}
                                onPress={() => setSelectedFarm(farm.id)}
                            >
                                <View style={styles.cardRow}>
                                    <View style={[styles.iconOuterContainer, { backgroundColor: colors.inputBackground, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                        <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.selectionCardTitle, { color: colors.textSecondary }]}>{farm.name}</Text>
                                        <Text style={[styles.selectionCardSubtitle, { color: colors.textSecondary }]}>{farm.size}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.selectionCardDetail, { color: colors.textSecondary }]}>Sub-plots: {farm.subPlots}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSelect}
                    >
                        <Text style={styles.primaryButtonText}>Select</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    // deleted styles

    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    pageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0A0C11E5', // Overridden
        marginBottom: 16,
    },
    listContainer: {
        gap: 12,
        alignItems: 'center',
    },
    selectionCard: {
        width: '100%',
        height: 88,
        backgroundColor: '#FFFFFF', // Overridden
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        shadowColor: '#000', // Overridden
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    selectionCardSelected: {
        borderWidth: 0.8,
        borderColor: '#0E6F6A',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconOuterContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#F5F5F5', // Overridden
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000', // Overridden
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cropIcon: {
        width: 20,
        height: 20,
    },
    cardInfo: {
        flex: 1,
    },
    selectionCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0A0C11B2', // Overridden
    },
    selectionCardSubtitle: {
        fontSize: 12,
        color: '#0A0C11B2', // Overridden
        marginTop: 2,
    },
    selectionCardDetail: {
        fontSize: 12,
        color: '#0A0C11B2', // Overridden
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: '#0E6F6A',
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        width: '100%',
        alignSelf: 'center',
    },
    primaryButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

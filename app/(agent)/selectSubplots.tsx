import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');

const subplotsForSelection = [
    { id: '1', name: 'Maize farm', size: '12.4 ha' },
    { id: '2', name: 'Wheat farm', size: '20.5 ha' },
    { id: '3', name: 'Rice field', size: '15.8 ha' },
    { id: '4', name: 'Soybean plantation', size: '10.2 ha' },
];

export default function SelectSubplotsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();
    const [selectedSubplot, setSelectedSubplot] = useState<string | null>(null);

    const handleSelect = () => {
        if (params.flow === 'assessment') {
            router.push({ pathname: '/assessFarm', params: { subplotId: selectedSubplot, type: params.type } });
        } else {
            router.push({ pathname: '/logActivities', params: { subplotId: selectedSubplot, type: params.type } });
        }
    };


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            {/* <FarmerDetailsBackground /> */}


            <CustomBackNavBar
                title={params.flow === 'assessment' ? 'Assess Farm' : 'Field name'}
                onBackPress={() => {
                    // If we have a farmId but NO flow/type from a specific context, 
                    // it might be better to check how we got here.
                    // For now, let's assume if it came from index -> selectFarm, it should go back to selectFarm.
                    if (params.farmId && !params.isFromHome) {
                         router.replace('/(agent)/farmDetails');
                    } else {
                         router.replace({ pathname: "/(agent)/selectFarm", params: { type: params.type, flow: params.flow } });
                    }
                }}
            />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                {/* Background Gradient */}
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                {/* <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} /> */}

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>{params.flow === 'assessment' ? 'Assess Farm' : 'Choose Subplots'}</Text>

                    <View style={styles.listContainer}>
                        {subplotsForSelection.map((subplot) => (
                            <TouchableOpacity
                                key={subplot.id}
                                style={[styles.selectionCard, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }, selectedSubplot === subplot.id && styles.selectionCardSelected]}
                                onPress={() => setSelectedSubplot(subplot.id)}
                            >
                                <View style={styles.cardRow}>
                                    <View style={[styles.iconOuterContainer, { backgroundColor: colors.inputBackground, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                        <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.selectionCardTitle, { color: colors.textSecondary }]}>{subplot.name}</Text>
                                        <Text style={[styles.selectionCardSubtitle, { color: colors.textSecondary }]}>{subplot.size}</Text>
                                    </View>
                                    <Text style={[styles.selectionCardDetail, { color: colors.textSecondary }]}>Subplot {subplot.id}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSelect}
                    // disabled={!selectedSubplot}
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
        height: 52,
        backgroundColor: '#FFFFFF', // Overridden
        borderRadius: 8,
        padding: 16,
        paddingLeft: 12,
        paddingRight: 12,
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
        fontSize: 10,
        color: '#0A0C11B2', // Overridden
        alignSelf: 'flex-start',
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

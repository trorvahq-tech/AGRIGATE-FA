import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');

const subplots: any[] = [];
const recentActivities: any[] = [];

export default function FarmTabDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();
    const hasActivities = recentActivities.length > 0;

    const farmName = (params.name as string) || 'Farm Details';
    const farmSize = (params.size as string) || '';
    const assignedTo = (params.assignedTo as string) || '';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} hidden={false} />

            <CustomBackNavBar title={farmName} onBackPress={() => router.replace('/(agent)/farms')} backgroundColor={isDarkMode ? colors.navbarBackground : "#FFFFFF4D"} blurIntensity={20} textColor={isDarkMode ? colors.text : "#0A0C11"} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.sectionContainer}>
                        <View style={[styles.profileContainer, { backgroundColor: colors.card }]}>
                            <View style={styles.infoHeader}>
                                <Text style={[styles.nameText, { color: colors.text }]}>{farmName}</Text>
                                {!!farmSize && <Text style={[styles.sizeText, { color: colors.textSecondary }]}>{farmSize}</Text>}
                            </View>
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Subplots: {subplots.length} • Activities: {recentActivities.length}</Text>
                            {!!assignedTo && <Text style={[styles.detailText, { color: colors.textSecondary }]}>Assigned to: {assignedTo}</Text>}
                        </View>
                        <View style={styles.subplotsContainer}>

                            <View style={styles.subplotsHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Subplots</Text>
                                <TouchableOpacity style={styles.addSubplotButton} onPress={() => router.push('/(agent)/addSubplot')}>
                                    <Text style={styles.addSubplotText}>+ Add Subplot</Text>
                                </TouchableOpacity>
                            </View>

                            {subplots.length === 0 ? (
                                <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No subplots mapped for this farm yet</Text>
                                </View>
                            ) : (
                                <View style={styles.farmsGrid}>
                                    {subplots.map((subplot) => (
                                        <TouchableOpacity
                                            key={subplot.id}
                                            style={[styles.farmCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
                                            onPress={() => router.push('/(agent)/subplotTabDetails')}
                                        >
                                            <View style={styles.farmCardHeader}>
                                                <View style={[styles.iconOuterContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                                    <View style={[styles.iconInnerContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                                        <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                                    </View>
                                                </View>
                                                <View style={styles.farmHeaderInfo}>
                                                    <Text style={[styles.farmName, { color: colors.text }]}>{subplot.name}</Text>
                                                    <Text style={[styles.farmSizeText, { color: colors.textSecondary }]}>{subplot.size}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={[styles.recentActivitiesContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader} >
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent activities</Text>
                            {hasActivities && (
                                <TouchableOpacity onPress={() => router.push('/(agent)/allActivities')} style={styles.seeMoreButton}>
                                    <Text style={styles.seeMoreText}>See More</Text>
                                    <Feather name="chevron-right" size={14} color="#0E6F6A" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {hasActivities ? (
                            <View style={styles.activitiesList}>
                                {recentActivities.map((activity) => (
                                    <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                        <View style={styles.activityContentWrapper}>
                                            <View style={[styles.iconOuterContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                                <View style={[styles.iconInnerContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                                    <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                                </View>
                                            </View>
                                            <View>
                                                <Text style={[styles.activityType, { color: colors.text }]}>{activity.type}</Text>
                                                <Text style={[styles.activityCategory, { color: colors.textSecondary }]}>{activity.category}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.time}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={[styles.emptyActivityContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.emptyActivityTitle, { color: colors.text }]}>No activities recorded yet</Text>
                                <Text style={[styles.emptyActivitySubtitle, { color: colors.textMuted }]}>Activities logged on this farm will appear here.</Text>
                            </View>
                        )}
                    </View>

                </ScrollView>
            </View >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white', // Overridden
    },
    // deleted styles

    mainContainer: {
        flex: 1,
        marginTop: 150,
        marginHorizontal: 12,
        marginBottom: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white', // Overridden
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    profileContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 16,
        padding: 12,

        borderRadius: 8,
        backgroundColor: 'white', // Overridden
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
    },
    nameText: {
        color: '#0A0C11', // Overridden
        fontSize: 18,
        fontWeight: 'bold',
    },
    sizeText: {
        color: '#0A0C11B2', // Overridden
        fontSize: 14,
        fontWeight: '600',
    },
    detailText: {
        color: '#0A0C11B2', // Overridden
        fontSize: 12,
        marginTop: 4,
    },
    subplotsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    addSubplotButton: {
        borderWidth: 1,
        borderColor: '#0E6F6A',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    addSubplotText: {
        color: '#0E6F6A',
        fontSize: 12,
        fontWeight: '500',
    },
    farmsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    farmCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 5,
        height: 52,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    farmCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    farmHeaderInfo: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    farmName: {
        color: '#0A0C11',
        fontSize: 14,
        fontWeight: '500',
    },
    farmSizeText: {
        color: '#0A0C11B2',
        fontSize: 12,
        marginTop: 2,
    },
    recentActivitiesContainer: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'white',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#0A0C11E5',
        fontSize: 16,
        fontWeight: '600',
    },
    seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeMoreText: {
        color: '#0E6F6A',
        fontSize: 12,
    },
    activitiesList: {
        gap: 8,
    },
    activityCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    activityContentWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconOuterContainer: {
        width: 36,
        height: 36,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    iconInnerContainer: {
        width: 32,
        height: 32,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
    },
    cropIcon: {
        width: 16,
        height: 16,
    },
    activityType: {
        color: '#0A0C11',
        fontSize: 14,
        fontWeight: '500',
    },
    activityCategory: {
        color: '#0A0C11B2',
        fontSize: 12,
    },
    activityTime: {
        color: '#0A0C11B2',
        fontSize: 12,
    },
    emptyActivityContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    emptyActivityTitle: {
        color: '#0A0C11',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    emptyActivitySubtitle: {
        color: '#0A0C1199',
        fontSize: 12,
        textAlign: 'center',
    },
    subplotsContainer: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'white', // Overridden
    },
});

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');


const recentActivities = [
    { id: '1', type: 'Field visit', category: 'Monitoring', time: '5 mins ago' },
    { id: '2', type: 'Field visit', category: 'Monitoring', time: '10 mins ago' },
    { id: '3', type: 'Field visit', category: 'Monitoring', time: '15 mins ago' },
];

export default function SubplotTabDetailsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const hasActivities = recentActivities.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            {/* <FarmerDetailsBackground /> */}


            <CustomBackNavBar title="Field name" onBackPress={() => router.replace('/(agent)/farmTabDetails')} />
            {/* Main Content Container */}
            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                {/* <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} /> */}

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Subplot Info Section */}
                    <View style={styles.sectionContainer}>
                        <View style={[styles.profileContainer, { backgroundColor: colors.card }]}>
                            <View style={styles.infoHeader}>
                                <Text style={[styles.nameText, { color: colors.text }]}>Subplot field</Text>
                                <Text style={[styles.sizeText, { color: colors.textSecondary }]}>12.4 ha</Text>
                            </View>
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Activities: 6</Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity style={styles.assessButton}>
                                <Text style={styles.assessButtonTextIcon}>+</Text>
                                <Text style={styles.assessButtonText}>Assess Farm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.recordButton}>
                                <Text style={styles.recordButtonTextIcon}>+</Text>
                                <Text style={styles.recordButtonText}>Record Activity</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recent Activities Section */}
                    <View style={[styles.recentActivitiesContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader} >
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent activities</Text>
                            {hasActivities && (
                                <TouchableOpacity style={styles.seeMoreButton}>
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
        // backgroundColor: 'white', // Handled by useTheme
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
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
    },
    nameText: {
        color: '#0A0C11', //Overridden
        fontSize: 18,
        fontWeight: 'bold',
    },
    sizeText: {
        color: '#0A0C11B2', //Overridden
        fontSize: 14,
        fontWeight: '600',
    },
    detailText: {
        color: '#0A0C11B2', //Overridden
        fontSize: 12,
        marginTop: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    assessButton: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    assessButtonTextIcon: {
        color: '#0E6F6A',
        fontSize: 14,
    },
    assessButtonText: {
        color: '#0E6F6A',
        fontWeight: '500',
        fontSize: 14,
    },
    recordButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    recordButtonTextIcon: {
        color: 'white',
        fontSize: 14,
    },
    recordButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#0A0C11E5', //Overridden
        fontSize: 16,
        fontWeight: '600',
    },
    recentActivitiesContainer: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'white', //Overridden
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
        backgroundColor: 'white', //Overridden
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        shadowColor: '#000', //Overridden
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
        backgroundColor: 'white', //Overridden
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        shadowColor: '#000', //Overridden
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    iconInnerContainer: {
        width: 32,
        height: 32,
        backgroundColor: 'white', //Overridden
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        shadowColor: '#000', //Overridden
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
        color: '#0A0C11', //Overridden
        fontSize: 14,
        fontWeight: '500',
    },
    activityCategory: {
        color: '#0A0C11B2', //Overridden
        fontSize: 12,
    },
    activityTime: {
        color: '#0A0C11B2', //Overridden
        fontSize: 12,
    },
    emptyActivityContainer: {
        backgroundColor: 'white', //Overridden
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    emptyActivityTitle: {
        color: '#0A0C11', //Overridden
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    emptyActivitySubtitle: {
        color: '#0A0C1199', //Overridden
        fontSize: 12,
        textAlign: 'center',
    },
});

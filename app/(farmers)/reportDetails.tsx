import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');

export default function ReportDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();

    const reportTitle = (params.farmerName as string)
        ? `${params.farmerName}'s Report`
        : ((params.farmName as string) ? `${params.farmName} Report` : 'Field Report');

    const fieldName = (params.farmName as string) || (params.fieldName as string) || 'Farm Parcel';
    const fieldSize = (params.size as string) || (params.sizeHa as string) || '—';
    const assignedTo = (params.assignedTo as string) || 'Designated Officer';

    const subplots: any[] = [];
    const activities: any[] = [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            <CustomBackNavBar
                title={reportTitle}
                onBackPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace('/reports');
                }}
            />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.fieldInfoCard, { backgroundColor: colors.card }]}>
                        <View style={styles.fieldHeader}>
                            <Text style={[styles.fieldName, { color: colors.text }]}>{fieldName}</Text>
                            <Text style={[styles.fieldSize, { color: colors.text }]}>{fieldSize}</Text>
                        </View>
                        <Text style={[styles.fieldMeta, { color: colors.textMuted }]}>
                            Subplot: {subplots.length} • Activities: {activities.length}
                        </Text>
                        <Text style={[styles.assignedText, { color: colors.textMuted }]}>Assigned to: {assignedTo}</Text>
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Subplots</Text>
                        <View style={styles.subplotsGrid}>
                            {subplots.length === 0 ? (
                                <View style={{ paddingVertical: 12, alignItems: 'center', width: '100%' }}>
                                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>No subplots recorded</Text>
                                </View>
                            ) : (
                                subplots.map((subplot) => (
                                    <View key={subplot.id} style={[styles.subplotCard, { backgroundColor: colors.card }]}>
                                        <View style={styles.subplotContent}>
                                            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                                <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                            </View>
                                            <View>
                                                <Text style={[styles.subplotName, { color: colors.text }]}>{subplot.name}</Text>
                                                <Text style={[styles.subplotSize, { color: colors.textMuted }]}>{subplot.size}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.activitiesHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activities</Text>
                            <TouchableOpacity style={styles.seeMoreButton}>
                                <Text style={styles.seeMoreText}>See More</Text>
                                <Feather name="chevron-right" size={16} color="#0E6F6A" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.activitiesList}>
                            {activities.length === 0 ? (
                                <View style={{ paddingVertical: 12, alignItems: 'center', width: '100%' }}>
                                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>No recent activities logged</Text>
                                </View>
                            ) : (
                                activities.map((activity) => (
                                    <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.card }]}>
                                        <View style={styles.activityContent}>
                                            <View style={[styles.iconOuterContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                                {/* @ts-ignore */}
                                                <View style={[styles.iconInnerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                                    <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                                </View>
                                            </View>
                                            <View>
                                                <Text style={[styles.activityType, { color: colors.text }]}>{activity.type}</Text>
                                                <Text style={[styles.activitySubtype, { color: colors.textMuted }]}>{activity.subtype}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.activityTime, { color: colors.textMuted }]}>{activity.time}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: 'white',
    },
    mainContainer: {
        flex: 1,
        marginTop: 150,
        marginHorizontal: 12,
        marginBottom: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        // backgroundColor: 'white',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    fieldInfoCard: {
        // backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    fieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    fieldName: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
    },
    seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeMoreText: {
        fontSize: 14,
        color: '#0E6F6A',
        fontWeight: '500',
    },
    fieldSize: {
        fontSize: 14,
        // color: '#0A0C11',
        fontWeight: '500',
    },
    fieldMeta: {
        fontSize: 12,
        // color: '#0A0C11B2',
        marginBottom: 4,
    },
    assignedText: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
    section: {
        marginBottom: 20,
        // backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
        // marginBottom: 12,
    },
    subplotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    subplotCard: {
        width: '48%',
        // backgroundColor: 'white',
        borderRadius: 10,
        padding: 12,
        borderWidth: 0, // Removed border as we are using shadow/card style now, or keep it if preferred? Figma shows clean cards.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
    },
    subplotContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconContainer: {
        width: 32,
        height: 32,
        // backgroundColor: '#F5F5F5', // Slightly distinct from white card
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cropIcon: {
        width: 16,
        height: 16,
    },
    subplotName: {
        fontSize: 13,
        fontWeight: '500',
        // color: '#0A0C11',
    },
    subplotSize: {
        fontSize: 11,
        // color: '#0A0C11B2',
        marginTop: 2,
    },
    activitiesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seeMore: {
        fontSize: 12,
        color: '#0E6F6A',
        fontWeight: '500',
    },
    activitiesList: {
        gap: 8,
    },
    activityCard: {
        // backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        // Shadow for activities
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
    },
    activityContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconOuterContainer: {
        width: 36,
        height: 36,
        // backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    iconInnerContainer: { // Simplifying icon structure if needed, but keeping it for now
        width: 32,
        height: 32,
        // backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
    },
    activityType: {
        fontSize: 14,
        fontWeight: '500',
        // color: '#0A0C11',
    },
    activitySubtype: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
    activityTime: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
});

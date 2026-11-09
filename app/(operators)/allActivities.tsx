import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');

const allActivities = [
    { id: '1', type: 'Field visit', category: 'Monitoring', time: '5 mins ago' },
    { id: '2', type: 'Field visit', category: 'Monitoring', time: '6 mins ago' },
    { id: '3', type: 'Field visit', category: 'Monitoring', time: '10 mins ago' },
    { id: '4', type: 'Field visit', category: 'Monitoring', time: '10 mins ago' },
    { id: '5', type: 'Field visit', category: 'Monitoring', time: '15 mins ago' },
    { id: '6', type: 'Field visit', category: 'Monitoring', time: '16 mins ago' },
    { id: '7', type: 'Field visit', category: 'Monitoring', time: '20 mins ago' },
    { id: '8', type: 'Field visit', category: 'Monitoring', time: '20 mins ago' },
    { id: '9', type: 'Field visit', category: 'Monitoring', time: '20 mins ago' },
    { id: '10', type: 'Field visit', category: 'Monitoring', time: '20 mins ago' },
    { id: '11', type: 'Field visit', category: 'Monitoring', time: '20 mins ago' },
];

export default function AllActivitiesScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            {/* <FarmerDetailsBackground /> */}

            <CustomBackNavBar title="Activities" onBackPress={() => router.back()} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.activitiesList}>
                        {allActivities.map((activity) => (
                            <TouchableOpacity
                                key={activity.id}
                                style={[styles.activityCard, { backgroundColor: colors.card }]}
                                onPress={() => router.push('/(operators)/activityDetails')}
                            >
                                <View style={styles.activityContentWrapper}>
                                    <View style={[styles.iconOuterContainer, { backgroundColor: colors.card }]}>
                                        <View style={[styles.iconInnerContainer, { backgroundColor: colors.card }]}>
                                            <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={[styles.activityType, { color: colors.text }]}>{activity.type}</Text>
                                        <Text style={[styles.activityCategory, { color: colors.textMuted }]}>{activity.category}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.activityTime, { color: colors.textMuted }]}>{activity.time}</Text>
                            </TouchableOpacity>
                        ))}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    activitiesList: {
        gap: 8,
        // backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
    },
    activityCard: {
        // backgroundColor: 'white',
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
        // backgroundColor: 'white',
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
        // backgroundColor: 'white',
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
        // color: '#0A0C11',
        fontSize: 14,
        fontWeight: '500',
    },
    activityCategory: {
        // color: '#0A0C11B2',
        fontSize: 12,
    },
    activityTime: {
        // color: '#0A0C11B2',
        fontSize: 12,
    },
});

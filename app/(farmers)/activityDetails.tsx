import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import FarmerDetailsBackground from '../../components/ui/FarmerDetailsBackground';

import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const FARMLAND_IMAGE = require('../../assets/images/farmlandImage.png');

export default function ActivityDetailsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            <FarmerDetailsBackground />

            <CustomBackNavBar title="Activities" onBackPress={() => router.back()} />


            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                {/* <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} /> */}

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.contentCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Land Preparation</Text>

                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Date of Execution</Text>
                            <Text style={[styles.value, { color: colors.text }]}>9th October, 2025</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Time of Execution</Text>
                            <Text style={[styles.value, { color: colors.text }]}>9:00 am</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Type of land preparation</Text>
                            <Text style={[styles.value, { color: colors.text }]}>Clearing</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Method used</Text>
                            <Text style={[styles.value, { color: colors.text }]}>Manual</Text>
                        </View>

                        <View style={styles.evidenceContainer}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Evidence of clearing</Text>
                            <Image
                                source={FARMLAND_IMAGE}
                                style={styles.evidenceImage}
                                contentFit="cover"
                                transition={1000}
                            />
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    contentCard: {
        // backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        // color: '#0A0C11',
        marginBottom: 24,
    },
    detailRow: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        // color: '#0A0C11B2',
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        // color: '#0A0C11',
    },
    evidenceContainer: {
        marginTop: 4,
    },
    evidenceImage: {
        width: '100%',
        height: 500,
        borderRadius: 12,
        marginTop: 8,
    },
});

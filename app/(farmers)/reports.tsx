import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useMemo } from 'react';
import { Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CustomCalendar from '../../components/ui/CustomCalendar';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useFarms } from '../../hooks/api/useFarms';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');

const activityTypes = [
    { id: 'land', label: 'Land Preparation' },
    { id: 'seed', label: 'Seed Selection' },
    { id: 'soil', label: 'Soil Testing' },
    { id: 'planting', label: 'Planting Methods' },
    { id: 'irrigation', label: 'Irrigation Techniques' },
];

export default function ReportsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { data: apiFarms } = useFarms();

    const farmReports = useMemo(() => {
        if (!apiFarms || !Array.isArray(apiFarms)) return [];
        return apiFarms.map((f: any) => ({
            id: String(f.id),
            name: f.name || 'Farm Plot',
            size: f.size_hectares ? `${f.size_hectares} ha` : (f.sizeHectares ? `${f.sizeHectares} ha` : '—'),
            assignedTo: f.assigned_officer || f.agentName || 'Extension Agent',
            harvestLogged: f.harvest_logged ? 'Yes' : 'No',
            lastVisit: f.last_visit ? new Date(f.last_visit).toLocaleDateString() : 'Recent',
            subPlots: Array.isArray(f.subplots) ? f.subplots.length : 0,
        }));
    }, [apiFarms]);

    const reportStats = useMemo(() => ({
        farmVisits: farmReports.length,
        activitiesLogged: 0,
        assessmentsDone: 0,
        harvestLogs: 0,
    }), [farmReports]);
    const [showDateModal, setShowDateModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeDateFilter, setActiveDateFilter] = useState('');
    const [activeActivityFilter, setActiveActivityFilter] = useState('');
    const [activeDateInput, setActiveDateInput] = useState<'start' | 'end' | null>(null);

    const handleDateSelect = (date: string) => {
        if (activeDateInput === 'start') {
            setStartDate(date);
            setActiveDateInput('end');
        } else {
            setEndDate(date);
            setActiveDateInput(null);
        }
    };

    const toggleActivity = (id: string) => {
        setSelectedActivities(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const applyDateFilter = () => {
        if (startDate && endDate) {
            const getOrdinal = (n: number) => {
                const s = ['th', 'st', 'nd', 'rd'];
                const v = n % 100;
                return n + (s[(v - 20) % 10] || s[v] || s[0]);
            };

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const [startD, startM, startY] = startDate.split('-');
            const [endD, endM, endY] = endDate.split('-');

            const startStr = `${getOrdinal(parseInt(startD))} ${months[parseInt(startM) - 1]}`;
            const endStr = `${getOrdinal(parseInt(endD))} ${months[parseInt(endM) - 1]}`;

            if (startY === endY) {
                setActiveDateFilter(`${startStr} - ${endStr} ${endY}`);
            } else {
                setActiveDateFilter(`${startStr} ${startY} - ${endStr} ${endY}`);
            }
        }
        setShowDateModal(false);
    };

    const applyActivityFilter = () => {
        if (selectedActivities.length > 0) {
            const selected = activityTypes.filter(a => selectedActivities.includes(a.id));
            setActiveActivityFilter(selected[0]?.label || '');
        }
        setShowActivityModal(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />


            <CustomNavBar title="Reports" backgroundColor={colors.background} textColor={colors.text} blurIntensity={0} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                {/* Background Gradient removed */}

                <View style={styles.contentWrapper}>
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                            <Feather name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                placeholder="Search Reports"
                                placeholderTextColor={colors.textMuted}
                                style={[styles.searchInput, { color: colors.text }]}
                            />
                        </View>
                    </View>

                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.filterPill, { backgroundColor: colors.card }, activeDateFilter && styles.filterPillActive]}
                            onPress={() => setShowDateModal(true)}
                        >
                            <Text style={[styles.filterPillText, { color: colors.textMuted }, activeDateFilter && styles.filterPillTextActive]}>
                                {activeDateFilter || 'Date range'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterPill, { backgroundColor: colors.card }, activeActivityFilter && styles.filterPillActive]}
                            onPress={() => setShowActivityModal(true)}
                        >
                            <Text style={[styles.filterPillText, { color: colors.textMuted }, activeActivityFilter && styles.filterPillTextActive]}>
                                {activeActivityFilter || 'Activity type'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        style={[styles.statsContainer, { backgroundColor: colors.card }]}
                    >
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: colors.text }]}>Farm Visits:</Text>
                                <Text style={[styles.statValue, { color: colors.text }]}>{reportStats.farmVisits}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: colors.text }]}>Activities Logged:</Text>
                                <Text style={[styles.statValue, { color: colors.text }]}>{reportStats.activitiesLogged}</Text>
                            </View>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: colors.text }]}>Assessments Done:</Text>
                                <Text style={[styles.statValue, { color: colors.text }]}>{reportStats.assessmentsDone}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: colors.text }]}>Harvest Logs:</Text>
                                <Text style={[styles.statValue, { color: colors.text }]}>{reportStats.harvestLogs}</Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {farmReports.length === 0 ? (
                            <View style={{ paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: colors.textMuted, fontSize: 13 }}>No farm reports available</Text>
                            </View>
                        ) : (
                            farmReports.map((report) => (
                                <TouchableOpacity
                                    key={report.id}
                                    style={[styles.reportCard, { backgroundColor: colors.card }]}
                                    onPress={() => router.push({
                                        pathname: '/(farmers)/reportDetails',
                                        params: {
                                            farmName: report.name,
                                            size: report.size,
                                            assignedTo: report.assignedTo,
                                        }
                                    })}
                                >
                                    <View style={styles.reportHeader}>
                                        <View style={styles.reportHeaderLeft}>
                                            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                                <Image source={CROP_ICON} style={styles.cropIcon} contentFit="contain" />
                                            </View>
                                            <View>
                                                <Text style={[styles.reportName, { color: colors.text }]}>{report.name}</Text>
                                                <Text style={[styles.reportSize, { color: colors.textMuted }]}>{report.size}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.reportHeaderRight}>
                                            <Text style={[styles.lastVisitLabel, { color: colors.textMuted }]}>Last Visit: <Text style={[styles.lastVisitValue, { color: colors.textMuted }]}>{report.lastVisit}</Text></Text>
                                        </View>
                                    </View>
                                    <View style={styles.reportDetails}>
                                        <Text style={[styles.reportDetailText, { color: colors.textMuted }]}>Assigned to: {report.assignedTo}</Text>
                                        <Text style={[styles.reportDetailText, { color: colors.textMuted }]}>Sub-plots: {report.subPlots}</Text>
                                    </View>
                                    <Text style={[styles.harvestText, { color: colors.textMuted }]}>Harvest Logged: {report.harvestLogged}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>

            <Modal visible={showDateModal} transparent animationType="slide">
                <BlurView
                    intensity={20}
                    tint={colors.blurTint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(17, 24, 39, 0.7)' }]}
                />
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDateModal(false)}
                >
                    <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? colors.card : '#F9FAFB' }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.closeWrapper}>
                                <View style={styles.eclipseRingWrapper}>
                                    <Svg height="38" width="38" viewBox="0 0 38 38">
                                        <Circle
                                            cx="19"
                                            cy="19"
                                            r="18"
                                            stroke={colors.text}
                                            strokeWidth="2"
                                            fill="transparent"
                                            strokeDasharray="113.1"
                                            strokeDashoffset={113.1 * (1 - 0.41)} // 41% visible
                                            rotation={330} // Rotates the start point to bottom-right properly
                                            origin="19, 19"
                                            strokeLinecap="round"
                                        />
                                    </Svg>
                                </View>
                                <View style={[styles.closeButtonInner, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Ionicons name="close" size={16} color={colors.text} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.dateSectionContainer, activeDateInput === 'start' && styles.dateSectionExpanded]}>
                            <View style={[styles.whiteLabelContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select start date</Text>
                                <TouchableOpacity
                                    style={[styles.dateInputContainer, { backgroundColor: colors.inputBackground }]}
                                    onPress={() => setActiveDateInput(activeDateInput === 'start' ? null : 'start')}
                                >
                                    <Text style={[styles.dateInputText, { color: colors.text }, !startDate && styles.placeholderText]}>
                                        {startDate || 'Enter date'}
                                    </Text>
                                </TouchableOpacity>
                                {activeDateInput === 'start' && (
                                    <View style={styles.calendarWrapper}>
                                        <CustomCalendar
                                            selectedDate={startDate}
                                            onDateSelect={handleDateSelect}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={[styles.dateSectionContainer, activeDateInput === 'end' && styles.dateSectionExpanded]}>
                            <View style={[styles.whiteLabelContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select end date</Text>
                                <TouchableOpacity
                                    style={[styles.dateInputContainer, { backgroundColor: colors.inputBackground }]}
                                    onPress={() => setActiveDateInput(activeDateInput === 'end' ? null : 'end')}
                                >
                                    <Text style={[styles.dateInputText, { color: colors.text }, !endDate && styles.placeholderText]}>
                                        {endDate || 'Enter date'}
                                    </Text>
                                </TouchableOpacity>
                                {activeDateInput === 'end' && (
                                    <View style={styles.calendarWrapper}>
                                        <CustomCalendar
                                            selectedDate={endDate}
                                            onDateSelect={handleDateSelect}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.applyButton, { marginTop: 12 }]} onPress={applyDateFilter}>
                            <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showActivityModal} transparent animationType="slide">
                <BlurView
                    intensity={20}
                    tint={colors.blurTint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: 'rgba(17, 24, 39, 0.7)' }]}
                />
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowActivityModal(false)}
                >
                    <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? colors.card : '#F9FAFB' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>Select Activity type</Text>
                        </View>

                        <View style={styles.checkboxGrid}>
                            {activityTypes.map((activity) => (
                                <TouchableOpacity
                                    key={activity.id}
                                    style={styles.checkboxRow}
                                    onPress={() => toggleActivity(activity.id)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        selectedActivities.includes(activity.id) && styles.checkboxChecked,
                                        { borderColor: selectedActivities.includes(activity.id) ? '#0E6F6A' : colors.border }
                                    ]}>
                                        {selectedActivities.includes(activity.id) && (
                                            <Ionicons name="checkmark" size={14} color="white" />
                                        )}
                                    </View>
                                    <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>{activity.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.applyButton} onPress={applyActivityFilter}>
                            <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 125,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        overflow: 'hidden',
        // backgroundColor: 'white',
    },
    contentWrapper: {
        flex: 1,
        paddingTop: 16,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    searchBar: {
        height: 44,
        width: '100%',
        paddingHorizontal: 14,
        // backgroundColor: 'white',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        // borderColor: '#E0E0E0',
    },
    searchInput: {
        flex: 1,
        // color: '#0A0C11',
        fontSize: 14,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 16,
    },
    filterPill: {
        height: 36,
        paddingHorizontal: 14,
        justifyContent: 'center',
        // backgroundColor: 'white',
        borderRadius: 16,
        // borderWidth: 1,
        // borderColor: '#E0E0E0',
    },
    filterPillActive: {
        // borderColor: '#0E6F6A',
    },
    filterPillText: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
    filterPillTextActive: {
        // color: '#0E6F6A',
    },
    statsContainer: {
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 7,
        // backgroundColor: 'white',
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#0A0C11',
    },
    statValue: {
        fontSize: 12,
        // fontWeight: '600',
        color: '#0A0C11',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 120,
    },
    reportCard: {
        height: 112,
        // backgroundColor: 'white',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        marginTop: -3,
    },
    reportHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconContainer: {
        width: 36,
        height: 36,
        // backgroundColor: '#F5F9F980',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cropIcon: {
        width: 18,
        height: 18,
    },
    reportName: {
        fontSize: 16,
        fontWeight: '500',
        // color: '#0A0C11B2',
    },
    reportSize: {
        fontSize: 12,
        // color: '#0A0C11B2',
        marginTop: 2,
    },
    reportHeaderRight: {
        alignItems: 'flex-end',
    },
    lastVisitLabel: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
    lastVisitValue: {
        fontSize: 12,
        // color: '#0A0C11B2',
        fontWeight: '500',
    },
    reportDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    reportDetailText: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
    harvestText: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#4342421A', // Updated color
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white', // Will be overridden
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        // Shadow for top of modal
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5B616D',
    },
    inputLabel: {
        fontSize: 12,
        color: '#5B616D',
        marginBottom: 8,
    },
    dateSectionContainer: {
        marginBottom: 16,
    },
    dateSectionExpanded: {
        // Optional: Add specific styles if needed for expanded container
    },
    calendarWrapper: {
        marginTop: 10,
        // Ensures clean transition
    },
    closeWrapper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    closeButtonInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eclipseRingWrapper: {
        position: 'absolute',
        width: 38,
        height: 38,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    whiteLabelContainer: {
        // backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dateInputContainer: {
        height: 48,
        // backgroundColor: '#F2F2F4',
        borderRadius: 12, // Reduced to fit inside container nicely or keep consistent
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dateInputActive: {
        borderWidth: 1,
        borderColor: '#0E6F6A',
        // backgroundColor: 'white',
    },
    dateInputText: {
        fontSize: 14,
        // color: '#0A0C11',
    },
    placeholderText: {
        // color: '#0A0C11B2',
    },
    checkboxGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '45%',
        gap: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    checkboxLabel: {
        fontSize: 13,
        color: '#5B616D',
    },
    applyButton: {
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

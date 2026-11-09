import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import CustomCalendar from '../../components/ui/CustomCalendar';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';

export default function ArchivingScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [email, setEmail] = useState('');
    const [dateRange, setDateRange] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Modal State
    const [showDateModal, setShowDateModal] = useState(false);
    const [activeDateInput, setActiveDateInput] = useState<'start' | 'end' | null>(null);

    // Toast State
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastTitle, setToastTitle] = useState('');

    // Validation State
    const [dateError, setDateError] = useState(false);
    const [emailError, setEmailError] = useState(false);

    const validateEmail = (text: string) => {
        // Simple regex for email or phone (just checking length for phone for now or @ for email)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,15}$/;
        return emailRegex.test(text) || phoneRegex.test(text);
    };

    const handleExport = () => {
        let isValid = true;

        if (!startDate || !endDate) {
            setDateError(true);
            isValid = false;
        } else {
            setDateError(false);
        }

        if (!email || !validateEmail(email)) {
            setEmailError(true);
            isValid = false;
        } else {
            setEmailError(false);
        }

        if (isValid) {
            // Simulate processing
            setToastTitle("Preparing Your Report");
            setToastMessage("This may take a few moments.");
            setShowSuccessToast(true);

            setTimeout(() => {
                setToastTitle("Export Successful");
                setToastMessage(`Your report has been generated and sent to ${email}`);
                // In a real app we might show failure randomly or based on API result
            }, 2000);
        }
    };

    const handleDateSelect = (date: string) => {
        if (activeDateInput === 'start') {
            setStartDate(date);
            // Auto switch to end date if start is selected
            setActiveDateInput('end');
        } else {
            setEndDate(date);
            // Close calendar after end date selection
            setActiveDateInput(null);
        }
    };

    const applyDateFilter = () => {
        if (startDate && endDate) {
            setDateRange(`${startDate} - ${endDate}`);
            setDateError(false);
        }
        setShowDateModal(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Archiving & Downloading" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView contentContainerStyle={styles.contentWrapper} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.description, { color: colors.text }]}>
                        Export your activity records for a selected period.
                    </Text>

                    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* Date Range Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Select Date Range</Text>
                            <TouchableOpacity
                                style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }, dateError && styles.inputError]}
                                onPress={() => setShowDateModal(true)}
                            >
                                <Text style={[styles.inputText, { color: colors.text }, !dateRange && styles.placeholderText]}>{dateRange || 'Select date range'}</Text>
                                <Feather name="calendar" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                            {dateError && <Text style={styles.errorText}>No date range selected</Text>}
                        </View>
                    </View>

                    {/* Email Input & Info - Only shown if date range is selected */}
                    {!!dateRange && (
                        <>
                            <View style={[styles.cardContainer, styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Feather name="info" size={14} color={colors.text} style={{ marginTop: 2 }} />
                                <Text style={[styles.infoText, { color: colors.textSecondary }]}>You are exporting only your personal activity records. This does not include data from other users, farms, or departments.</Text>
                            </View>

                            <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email address/ Phone number</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }, emailError && styles.inputError]}>
                                        <TextInput
                                            style={[styles.textInput, { color: colors.text }]}
                                            placeholder="Enter email or phone number"
                                            placeholderTextColor={colors.textMuted}
                                            value={email}
                                            onChangeText={(text) => {
                                                setEmail(text);
                                                setEmailError(false);
                                            }}
                                        />
                                    </View>
                                    {emailError && <Text style={styles.errorText}>Invalid email</Text>}
                                </View>
                            </View>

                            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                                <Text style={styles.exportButtonText}>Export Records</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </View>

            {/* Date Modal */}
            <Modal visible={showDateModal} transparent animationType="slide">
                <BlurView
                    intensity={20}
                    tint="dark"
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
                                <Text style={[styles.modalInputLabel, { color: colors.textMuted }]}>Select start date</Text>
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
                                <Text style={[styles.modalInputLabel, { color: colors.textMuted }]}>Select end date</Text>
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

            {/* Success Toast */}
            <NotificationToast
                visible={showSuccessToast}
                onTimerEnd={() => setShowSuccessToast(false)}
                title={toastTitle}
                message={toastMessage}
                duration={3}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Overridden by useTheme
    },
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
    },
    contentWrapper: {
        padding: 16,
        gap: 16, // Reduced from 24
    },
    description: {
        fontSize: 14,
        color: '#0A0C11', //Overridden
        // lineHeight: 20,
        // backgroundColor: '#F0FDF9', // Light green background based on image
        // padding: 12,
        borderRadius: 8,

        fontWeight: '500',
    },
    cardContainer: {
        backgroundColor: 'white', //Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F2F2F4', // Overridden
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 12,
        color: '#0A0C1199', // Overridden
    },
    inputContainer: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white', //Overridden
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F2F2F4', //Overridden
        paddingHorizontal: 16,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputText: {
        fontSize: 14,
        color: '#0A0C11', //Overridden
    },
    placeholderText: {
        color: '#A3A3A3',
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#0A0C11', //Overridden
        height: '100%',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    infoCard: {
        flexDirection: 'row',
        gap: 8,
        // Optional padding or background if needed for separation
    },
    infoText: {
        fontSize: 12,
        color: '#0A0C11B2', // Updated color
        flex: 1,
        lineHeight: 18,
    },
    exportButton: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    exportButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: '#4342421A',
    },
    modalContainer: {
        backgroundColor: 'white', // Will be overridden
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        shadowColor: '#000', //Overridden
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
        color: '#5B616D', //Overridden
    },
    closeWrapper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    eclipseRingWrapper: {
        position: 'absolute',
        width: 38,
        height: 38,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'white', //Overridden
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: '#000', //Overridden
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dateSectionContainer: {
        marginBottom: 16,
    },
    dateSectionExpanded: {
        // Optional styles
    },
    whiteLabelContainer: {
        backgroundColor: 'white', //Overridden
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000', //Overridden
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    modalInputLabel: {
        fontSize: 12,
        color: '#5B616D', //Overridden
        marginBottom: 8,
    },
    dateInputContainer: {
        height: 48,
        backgroundColor: '#F2F2F4', //Overridden
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dateInputText: {
        fontSize: 14,
        color: '#0A0C11', //Overridden
    },
    calendarWrapper: {
        marginTop: 10,
    },
    applyButton: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

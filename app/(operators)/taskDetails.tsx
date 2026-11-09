import CustomBackNavBar from '@/components/ui/CustomBackNavBar';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function TaskDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();

    // State
    const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');
    const [machineUsed, setMachineUsed] = useState('');
    const [hoursUsed, setHoursUsed] = useState('');
    const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
    const [timer, setTimer] = useState(0); // seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const taskName = (params.name as string) || 'Assigned Task';
    const taskMachine = (params.machine as string) || 'Designated Machine';

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}   ${m.toString().padStart(2, '0')}   ${s.toString().padStart(2, '0')}`;
    };

    const handleStartTask = () => {
        setStatus('In Progress');
        setIsTimerRunning(true);
    };

    const handleSubmit = () => {
        setIsTimerRunning(false);
        setStatus('Completed');
        setShowSuccessToast(true);
        setTimeout(() => {
            setShowSuccessToast(false);
            // Optional: Navigate back
            // router.back();
        }, 3000);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setEvidenceImage(result.assets[0].uri);
        }
    };

    const getStatusBadgeStyle = () => {
        switch (status) {
            case 'Completed': return { bg: '#E6F4F1', text: '#0E6F6A' };
            case 'In Progress': return { bg: '#FFF8E1', text: '#D97706' };
            default: return { bg: '#FFF4E5', text: '#B45309' }; // 'Not Started' -> Orangeish
        }
    };

    const statusStyle = getStatusBadgeStyle();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            {/* Custom Header reusing generic component style or standard internal header */}
            <View className='mb-10'>
                <CustomBackNavBar
                    title="Task"
                    onBackPress={() => router.replace('/tasks')}
                />
            </View>

            <View style={styles.mainContent}>
                <Image
                    source={require('../../assets/images/backgroundGradient.png')}
                    style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]}
                    contentFit="cover"
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Top Card: Task Info & Timer/Start */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                        <View style={styles.taskTitleRow}>
                            <View>
                                <Text style={[styles.taskName, { color: colors.text }]}>{taskName}</Text>
                                <Text style={[styles.machineInfo, { color: colors.textMuted }]}>Machine: {taskMachine}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                <Text style={[styles.statusText, { color: statusStyle.text }]}>{status}</Text>
                            </View>
                        </View>

                        {status === 'Not Started' && (
                            <TouchableOpacity style={styles.startTaskButton} onPress={handleStartTask}>
                                <Feather name="plus" size={18} color="#0E6F6A" />
                                <Text style={styles.startTaskText}>Start Task</Text>
                            </TouchableOpacity>
                        )}

                        {status === 'In Progress' && (
                            <View style={styles.timerRow}>
                                <View style={[styles.timerBox, { backgroundColor: isDarkMode ? colors.inputBackground : '#0E6F6A0D', borderColor: colors.border }]}>
                                    <Text style={[styles.timerText, { color: colors.text }]}>
                                        {Math.floor(timer / 3600).toString().padStart(2, '0')}
                                    </Text>
                                </View>
                                <View style={[styles.timerBox, { backgroundColor: isDarkMode ? colors.inputBackground : '#0E6F6A0D', borderColor: colors.border }]}>
                                    <Text style={[styles.timerText, { color: colors.text }]}>
                                        {Math.floor((timer % 3600) / 60).toString().padStart(2, '0')}
                                    </Text>
                                </View>
                                <View style={[styles.timerBox, { backgroundColor: isDarkMode ? colors.inputBackground : '#0E6F6A0D', borderColor: colors.border }]}>
                                    <Text style={[styles.timerText, { color: colors.text }]}>
                                        {(timer % 60).toString().padStart(2, '0')}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Form Section */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]} className='shadow-0'>
                        <Text style={[styles.sectionHeader, { marginTop: 0, marginBottom: 16, color: colors.text }]}>Fill in information</Text>

                        <View style={{ gap: 16 }}>
                            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Machine used</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                    placeholder="Input machine used"
                                    placeholderTextColor={colors.textMuted}
                                    value={machineUsed}
                                    onChangeText={setMachineUsed}
                                    editable={status !== 'Completed'}
                                />
                            </View>

                            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Hours used</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                    placeholder="Input hours used"
                                    placeholderTextColor={colors.textMuted}
                                    value={hoursUsed}
                                    onChangeText={setHoursUsed}
                                    keyboardType="numeric"
                                    editable={status !== 'Completed'}
                                />
                            </View>

                            {/* Evidence Section */}
                            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Capture land preparation evidence</Text>

                                <TouchableOpacity
                                    style={[styles.photoButton, { backgroundColor: colors.card, borderColor: colors.border }, evidenceImage && { height: 180, borderColor: 'transparent' }]}
                                    onPress={pickImage}
                                    disabled={status === 'Completed'}
                                >
                                    {evidenceImage ? (
                                        <Image source={{ uri: evidenceImage }} style={styles.previewImage} contentFit="cover" />
                                    ) : (
                                        <Text style={styles.photoButtonText}>Take a photo</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    {status !== 'Completed' && (
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>
                </KeyboardAvoidingView>
            </View>

            <NotificationToast
                visible={showSuccessToast}
                message="Report has been generated and sent to samuel.ade@company.com"
                title="Export Successful"
                onTimerEnd={() => setShowSuccessToast(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0A0C11',
    },
    mainContent: {
        flex: 1,
        // backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginHorizontal: 12,
        marginTop: 135, // Increased to clear absolute CustomBackNavBar
        marginBottom: 20,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 20,
        gap: 16,
    },
    card: {
        // backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        // borderColor: '#F1F1F1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    taskTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    taskName: {
        fontSize: 16,
        fontWeight: '700',
        // color: '#0A0C11',
        marginBottom: 4,
    },
    machineInfo: {
        fontSize: 12,
        // color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    startTaskButton: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16, // Pill shape
        borderWidth: 1,
        borderColor: '#0E6F6A',
        gap: 8,
    },
    startTaskText: {
        color: '#0E6F6A',
        fontSize: 14,
        fontWeight: '600',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    timerBox: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: '#0E6F6A0D',
        borderRadius: 12,
        borderWidth: 1,
        // borderColor: '#0000001A',
    },
    timerText: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        // color: '#0A0C11',
        marginTop: 8,
    },
    inputContainer: {
        // backgroundColor: '#F5F9F9',
        borderRadius: 12,
        padding: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputLabel: {
        fontSize: 12,
        // color: '#5B616D',
    },
    input: {
        height: 48,
        // backgroundColor: '#FFFFFF',
        borderWidth: 1,
        // borderColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        // color: '#0A0C11',
    },
    sectionTitle: { // For capture evidence
        fontSize: 14,
        fontWeight: '600',
        // color: '#0A0C11',
    },
    photoButton: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        // borderColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'white',
        overflow: 'hidden',
    },
    photoButtonText: {
        fontSize: 14,
        color: '#0E6F6A',
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    submitButton: {
        height: 52,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

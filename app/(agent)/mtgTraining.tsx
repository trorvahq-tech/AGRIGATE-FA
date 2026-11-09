import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';

const AVATAR = require('../../assets/images/whoLogin2.png');

const GROUP_FARMERS: any[] = [];

const TRAINING_TOPICS = [
    'Soil Health & Testing',
    'Compost Preparation',
    'Cover Cropping',
    'Regenerative Basics',
    'Seed Selection',
    'Pest Management',
    'Water Conservation',
    'Financial Literacy',
];

export default function MtgTrainingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    const groupName = (params.groupName as string) || 'MTG Group';
    const mode = (params.mode as string) || 'training';

    const [trainingTitle, setTrainingTitle] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [attendees, setAttendees] = useState<string[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [step, setStep] = useState<'details' | 'attendance'>(mode === 'attendance' ? 'attendance' : 'details');

    const toggleAttendee = (id: string) => {
        setAttendees((prev) =>
            prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (attendees.length === GROUP_FARMERS.length) {
            setAttendees([]);
        } else {
            setAttendees(GROUP_FARMERS.map(f => f.id));
        }
    };

    const handleSave = () => {
        setShowToast(true);
    };

    const isDetailsValid = (trainingTitle.trim().length > 0 || selectedTopic !== null);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title={step === 'attendance' ? 'Record Attendance' : 'Start Training'}
                onBackPress={() => {
                    if (step === 'attendance' && mode !== 'attendance') setStep('details');
                    else router.replace({ pathname: '/(agent)/mtgDetails', params: { groupId: params.groupId } });
                }}
                backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                textColor={colors.text}
                iconColor={colors.primary}
                blurIntensity={20}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {step === 'details' ? (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Group Badge */}
                        <View style={[styles.groupBadge, { backgroundColor: '#0E6F6A15' }]}>
                            <Feather name="users" size={14} color="#0E6F6A" />
                            <Text style={styles.groupBadgeText}>{groupName}</Text>
                        </View>

                        {/* Training Title */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Training Title</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder="e.g. Soil Health Workshop"
                                placeholderTextColor={colors.textMuted}
                                value={trainingTitle}
                                onChangeText={setTrainingTitle}
                            />
                        </View>

                        {/* Topic Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Training Topic</Text>
                            <View style={styles.topicGrid}>
                                {TRAINING_TOPICS.map((topic) => (
                                    <TouchableOpacity
                                        key={topic}
                                        onPress={() => setSelectedTopic(topic === selectedTopic ? null : topic)}
                                        style={[
                                            styles.topicChip,
                                            {
                                                backgroundColor: selectedTopic === topic ? '#0E6F6A' : isDarkMode ? colors.background : '#F1F5F9',
                                                borderColor: selectedTopic === topic ? '#0E6F6A' : colors.border,
                                            }
                                        ]}
                                    >
                                        <Text style={{ color: selectedTopic === topic ? 'white' : colors.text, fontSize: 13, fontWeight: '600' }}>
                                            {topic}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Notes */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Notes (optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder="Additional notes about this session..."
                                placeholderTextColor={colors.textMuted}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Next: Record Attendance */}
                        <TouchableOpacity
                            style={[styles.primaryButton, { opacity: isDetailsValid ? 1 : 0.5 }]}
                            disabled={!isDetailsValid}
                            onPress={() => setStep('attendance')}
                        >
                            <Text style={styles.primaryButtonText}>Next: Record Attendance</Text>
                            <Feather name="arrow-right" size={18} color="white" />
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    <View style={{ flex: 1 }}>
                        <ScrollView
                            contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Group Badge */}
                            <View style={[styles.groupBadge, { backgroundColor: '#0E6F6A15' }]}>
                                <Feather name="users" size={14} color="#0E6F6A" />
                                <Text style={styles.groupBadgeText}>{groupName}</Text>
                            </View>

                            {/* Attendance Header */}
                            <View style={styles.attendanceHeader}>
                                <Text style={[styles.attendanceTitle, { color: colors.text }]}>
                                    Mark Attendance ({attendees.length}/{GROUP_FARMERS.length})
                                </Text>
                                <TouchableOpacity onPress={selectAll}>
                                    <Text style={styles.selectAllText}>
                                        {attendees.length === GROUP_FARMERS.length ? 'Deselect All' : 'Select All'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Farmer Attendance List */}
                            {GROUP_FARMERS.map((farmer) => {
                                const isPresent = attendees.includes(farmer.id);
                                return (
                                    <TouchableOpacity
                                        key={farmer.id}
                                        onPress={() => toggleAttendee(farmer.id)}
                                        style={[
                                            styles.attendanceCard,
                                            {
                                                backgroundColor: colors.card,
                                                borderColor: isPresent ? '#0E6F6A' : colors.border,
                                            }
                                        ]}
                                    >
                                        <Image source={AVATAR} style={styles.farmerAvatar} contentFit="cover" />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.farmerName, { color: colors.text }]}>{farmer.name}</Text>
                                            <Text style={[styles.farmerId, { color: colors.textMuted }]}>{farmer.id}</Text>
                                        </View>
                                        <View style={[styles.attendanceBadge, { backgroundColor: isPresent ? '#0E6F6A' : colors.border }]}>
                                            {isPresent ? (
                                                <Feather name="check" size={16} color="white" />
                                            ) : (
                                                <Text style={[styles.absentText, { color: colors.textMuted }]}>Absent</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Save Button */}
                        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.primaryButton, { opacity: attendees.length > 0 ? 1 : 0.5 }]}
                                disabled={attendees.length === 0}
                                onPress={handleSave}
                            >
                                <Feather name="check-circle" size={20} color="white" />
                                <Text style={styles.primaryButtonText}>
                                    Save Training ({attendees.length} present)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>

            <NotificationToast
                visible={showToast}
                onTimerEnd={() => {
                    setShowToast(false);
                    router.replace({ pathname: '/(agent)/mtgDetails', params: { groupId: params.groupId } });
                }}
                title="Training Recorded!"
                message={`${selectedTopic || trainingTitle} — ${attendees.length} farmers attended.`}
                duration={2}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 155,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    groupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 24,
    },
    groupBadgeText: {
        color: '#0E6F6A',
        fontSize: 13,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 20,
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 15,
        borderWidth: 1.5,
    },
    textArea: {
        height: 100,
        paddingTop: 14,
    },
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    topicChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    primaryButton: {
        height: 54,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    attendanceTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    selectAllText: {
        color: '#0E6F6A',
        fontSize: 14,
        fontWeight: '600',
    },
    attendanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        gap: 12,
        marginBottom: 8,
        borderWidth: 1.5,
    },
    farmerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
    },
    farmerName: {
        fontSize: 15,
        fontWeight: '600',
    },
    farmerId: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    attendanceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 60,
        alignItems: 'center',
    },
    absentText: {
        fontSize: 12,
        fontWeight: '600',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
    },
});

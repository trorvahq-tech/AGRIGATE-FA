import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

type AssessmentType = 'crop_health' | 'agroforestry' | 'soil' | null;

export default function AssessFarmScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const params = useLocalSearchParams();
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType>(null);


    const [cropCondition, setCropCondition] = useState<string | null>(null);
    const [pestObserved, setPestObserved] = useState<string | null>(null);
    const [observedIssue, setObservedIssue] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [healthEvidence, setHealthEvidence] = useState<string | null>(null);


    const [treePresent, setTreePresent] = useState<string | null>(null);
    const [treeDensity, setTreeDensity] = useState<string | null>(null);
    const [agroNotes, setAgroNotes] = useState('');
    const [agroEvidence, setAgroEvidence] = useState<string | null>(null);

    const [soilTexture, setSoilTexture] = useState<string | null>(null);
    const [soilMoisture, setSoilMoisture] = useState<string | null>(null);
    const [soilObservation, setSoilObservation] = useState('');

    const assessmentOptions = [
        { id: 'crop_health', label: 'Crop Health' },
        { id: 'agroforestry', label: 'Agroforestry' },
        { id: 'soil', label: 'Soil' },
    ];

    const pickImage = async (setFunction: (uri: string | null) => void) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setFunction(result.assets[0].uri);
        }
    };

    const handleSave = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(farmers)/farms');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            {/* <FarmerDetailsBackground /> */}


            <CustomBackNavBar title="Assess Farm" onBackPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(farmers)/farms");
            }} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                {/* <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} /> */}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={[styles.subplotCard, { backgroundColor: colors.card }]}>
                        <View style={styles.subplotHeader}>
                            <Text style={[styles.subplotName, { color: colors.text }]}>Subplot field</Text>
                            <Text style={[styles.subplotSize, { color: colors.text }]}>12.4 ha</Text>
                        </View>
                        <Text style={[styles.subplotMeta, { color: colors.textMuted }]}>Activities: 2</Text>
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Log activities</Text>

                    <View style={[styles.whiteContainer, { backgroundColor: colors.card }]}>

                        <View style={[styles.activityHeaderContainer, { backgroundColor: colors.card }]}>
                            <Text style={[styles.activityHeaderText, { color: colors.textMuted }]}>What would you like to assess?</Text>
                            <Feather name="chevron-down" size={20} color={colors.textMuted} />
                        </View>

                        <View className='px-2'>
                            <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                <View className='px-1 !flex !flex-col !gap-2'>
                                    {assessmentOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={styles.radioRowVertical}
                                            className='!w-full'
                                            onPress={() => setSelectedAssessment(option.id as AssessmentType)}
                                        >
                                            <View style={[styles.radioOuter, selectedAssessment === option.id && styles.radioOuterSelected, { borderColor: selectedAssessment === option.id ? '#0E6F6A' : colors.textMuted }]}>
                                                {selectedAssessment === option.id && <View style={styles.radioInner} />}
                                            </View>
                                            <Text className='!w-full' style={[styles.radioLabel, { color: colors.text }]}>{option.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {selectedAssessment === 'crop_health' && (
                                <View className='mt-1'>
                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Overall crop condition</Text>
                                        <View style={styles.activityListVertical}>
                                            {['Excellent', 'Good', 'Poor'].map((opt) => (
                                                <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setCropCondition(opt)}>
                                                    <View style={[styles.checkboxOuter, cropCondition === opt && styles.checkboxOuterSelected, { borderColor: cropCondition === opt ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                        {cropCondition === opt && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Any pest or disease observed?</Text>
                                        <View style={styles.activityListVertical}>
                                            {['Yes', 'No'].map((opt) => (
                                                <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setPestObserved(opt)}>
                                                    <View style={[styles.checkboxOuter, pestObserved === opt && styles.checkboxOuterSelected, { borderColor: pestObserved === opt ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                        {pestObserved === opt && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Write the observed issue?</Text>
                                        <TextInput
                                            style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                            placeholder="Write here..."
                                            placeholderTextColor={colors.textMuted}
                                            value={observedIssue}
                                            onChangeText={setObservedIssue}
                                        />
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Capture evidence</Text>
                                        {healthEvidence ? (
                                            <TouchableOpacity onPress={() => pickImage(setHealthEvidence)} style={styles.imagePreviewContainer}>
                                                <Image source={{ uri: healthEvidence }} style={styles.imagePreview} />
                                                <View style={styles.editImageOverlay}>
                                                    <Feather name="edit-2" size={16} color="white" />
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={() => pickImage(setHealthEvidence)}>
                                                <Text style={styles.photoButtonText}>Take a photo</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Write Recommendations</Text>
                                        <TextInput
                                            style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                            placeholder="Write here..."
                                            placeholderTextColor={colors.textMuted}
                                            value={recommendations}
                                            onChangeText={setRecommendations}
                                        />
                                    </View>
                                </View>
                            )}

                            {selectedAssessment === 'agroforestry' && (
                                <View className='mt-2'>
                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Tree Present</Text>
                                        <View style={styles.activityListVertical}>
                                            {['Yes', 'No'].map((opt) => (
                                                <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setTreePresent(opt)}>
                                                    <View style={[styles.checkboxOuter, treePresent === opt && styles.checkboxOuterSelected, { borderColor: treePresent === opt ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                        {treePresent === opt && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Tree density</Text>
                                        <View style={styles.activityListVertical}>
                                            {['Sparse', 'Moderate', 'Dense'].map((opt) => (
                                                <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setTreeDensity(opt)}>
                                                    <View style={[styles.checkboxOuter, treeDensity === opt && styles.checkboxOuterSelected, { borderColor: treeDensity === opt ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                        {treeDensity === opt && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                        <TextInput
                                            style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                            placeholder="Add note..."
                                            placeholderTextColor={colors.textMuted}
                                            value={agroNotes}
                                            onChangeText={setAgroNotes}
                                        />
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Capture evidence</Text>
                                        {agroEvidence ? (
                                            <TouchableOpacity onPress={() => pickImage(setAgroEvidence)} style={styles.imagePreviewContainer}>
                                                <Image source={{ uri: agroEvidence }} style={styles.imagePreview} />
                                                <View style={styles.editImageOverlay}>
                                                    <Feather name="edit-2" size={16} color="white" />
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={() => pickImage(setAgroEvidence)}>
                                                <Text style={styles.photoButtonText}>Take a photo</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            )}

                            {selectedAssessment === 'soil' && (
                                <View className='mt-2'>
                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>What is the soil texture</Text>
                                        <View style={styles.activityListVertical}>
                                            {['Sandy', 'Loamy', 'Clay'].map((opt) => (
                                                <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setSoilTexture(opt)}>
                                                    <View style={[styles.checkboxOuter, soilTexture === opt && styles.checkboxOuterSelected, { borderColor: soilTexture === opt ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                        {soilTexture === opt && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Soil moisture</Text>
                                        <View style={styles.activityListVertical}>
                                            {['Dry', 'Moist', 'Water logged'].map((opt) => (
                                                <TouchableOpacity key={opt} style={styles.radioRowVertical} onPress={() => setSoilMoisture(opt)}>
                                                    <View style={[styles.checkboxOuter, soilMoisture === opt && styles.checkboxOuterSelected, { borderColor: soilMoisture === opt ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                        {soilMoisture === opt && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>What do you observe?</Text>
                                        <TextInput
                                            style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                            placeholder="Add note..."
                                            placeholderTextColor={colors.textMuted}
                                            value={soilObservation}
                                            onChangeText={setSoilObservation}
                                        />
                                    </View>
                                </View>
                            )}
                            {selectedAssessment && (
                                <View style={{ paddingVertical: 16 }}>
                                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                        <Text style={styles.saveButtonText}>
                                            {selectedAssessment === 'crop_health' ? 'Save assessment' : 'Save activities'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#F5F5F5',
    },

    mainContainer: {
        flex: 1,
        marginTop: 135,
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
        paddingBottom: 32,
    },
    subplotCard: {
        // backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    subplotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    subplotName: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
    },
    subplotSize: {
        fontSize: 14,
        // color: '#0A0C11',
        fontWeight: '500',
    },
    subplotMeta: {
        fontSize: 12,
        // color: '#0A0C11B2',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
        marginBottom: 12,
    },
    whiteContainer: {
        // backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingBottom: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    activityHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginBottom: 8,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderRadius: 12,
        // marginHorizontal: 8,
    },
    activityHeaderText: {
        fontSize: 16,
        fontWeight: '500',
        // color: '#0A0C11B2',
    },
    activityListVertical: {
        flexDirection: 'column',
        gap: 12,
        marginTop: 8,
    },
    innerContainer: {
        // backgroundColor: '#F5F9F9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '500',
        // color: '#0A0C11B2',
        marginBottom: 12,
    },
    textInput: {
        // backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        // color: '#0A0C11',
        borderWidth: 1,
        // borderColor: '#E0E0E0',
    },
    radioRowVertical: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        // borderColor: '#0A0C1180',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#0E6F6A',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0E6F6A',
    },
    checkboxOuter: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 0.5,
        // borderColor: '#5B616D', // Keep as is or make dynamic if needed, but #5B616D is textMuted
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'white', // Should this be dynamic?
    },
    checkboxOuterSelected: {
        borderColor: '#0E6F6A',
    },
    checkboxInner: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: '#0E6F6A',
    },
    radioLabel: {
        fontSize: 14,
        // color: '#0A0C1199',
    },
    photoButton: {
        // backgroundColor: 'white',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0E6F6A',
    },
    photoButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0E6F6A',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    editImageOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    saveButton: {
        backgroundColor: '#0E6F6A',
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

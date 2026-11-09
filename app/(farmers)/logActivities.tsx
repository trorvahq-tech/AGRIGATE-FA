import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CROP_ICON = require('../../assets/images/crop.png');
const LIVESTOCK_ICON = require('../../assets/images/nutshellImage.png');

type CropActivityType = 'field_visit' | 'land_preparation' | 'planting' | 'chemical_application' | 'pest_disease' | 'weeding' | 'harvest' | null;
type LivestockActivityType = 'lifecycle' | 'health' | 'vaccination' | 'mortality' | null;

export default function LogActivitiesScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const params = useLocalSearchParams();
    const type = params.type as 'crop' | 'livestock' || 'crop';

    const [selectedCropActivity, setSelectedCropActivity] = useState<CropActivityType>(null);
    const [selectedLivestockActivity, setSelectedLivestockActivity] = useState<LivestockActivityType>(null);

    const [purposeOfVisit, setPurposeOfVisit] = useState<string | null>(null);
    const [landPrepType, setLandPrepType] = useState<string | null>(null);
    const [methodUsed, setMethodUsed] = useState<string | null>(null);
    const [cropType, setCropType] = useState('');
    const [notes, setNotes] = useState('');

    const [step, setStep] = useState(1);
    const [permission, requestPermission] = useCameraPermissions();


    const [chemicalUsed, setChemicalUsed] = useState('');
    const [productName, setProductName] = useState('');
    const [quantityUsed, setQuantityUsed] = useState('');
    const [herbicideUsed, setHerbicideUsed] = useState('');
    const [growthStage, setGrowthStage] = useState<string | null>(null);
    const [harvestType, setHarvestType] = useState<'pre_harvest' | 'harvesting' | null>(null);
    const [cropMaturity, setCropMaturity] = useState<string | null>(null);
    const [pestImpact, setPestImpact] = useState<string | null>(null);
    const [estimatedYield, setEstimatedYield] = useState('');
    const [evidenceImage, setEvidenceImage] = useState<string | null>(null);

    const pickImage = async () => {

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        console.log(result);

        if (!result.canceled) {
            setEvidenceImage(result.assets[0].uri);
        }
    };

    const handleSave = () => {
        if (type === 'crop' && selectedCropActivity === 'harvest' && harvestType === 'harvesting') {
            if (step === 1) {
                setStep(2);
                return;
            } else if (step === 2) {
                setStep(3);
                return;
            } else if (step === 3) {
                setStep(4);
                return;
            }
        }
        console.log('Saving activity:', { type, selectedCropActivity, selectedLivestockActivity });
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(farmers)/farms');
        }
    };

    const cropActivityOptions = [
        { id: 'field_visit', label: 'Field visit' },
        { id: 'land_preparation', label: 'Land Preparation' },
        { id: 'planting', label: 'Planting' },
        { id: 'pest_disease', label: 'Pest & Disease control' },
        { id: 'weeding', label: 'Weeding' },
        { id: 'harvest', label: 'Harvest Activity' },
    ];

    const livestockActivityOptions = [
        { id: 'lifecycle', label: 'Lifecycle Tracking' },
        { id: 'health', label: 'Livestock Health Oversight' },
        { id: 'vaccination', label: 'Vaccination Tracking' },
        { id: 'mortality', label: 'Mortality Oversight' },
    ];
    const purposeOptions = ['Monitoring', 'Followup', 'General supervision'];
    const landPrepOptions = ['Clearing', 'Ploughing', 'Ridging'];
    const methodOptions = ['Manual', 'Mechanized'];


    const pestMethodOptions = ['Spraying', 'Spot application', 'Broadcasting'];
    const weedingMethodOptions = ['Manual', 'Chemical', 'Mechanical'];
    const growthStageOptions = ['Early', 'Mid', 'Near harvest'];
    const cropMaturityOptions = ['Not ready', 'Almost Ready', 'Ready'];
    const pestImpactOptions = ['None', 'Low', 'Severe'];
    const harvestMethodOptions = ['Manual', 'Mechanized'];
    const progressOptions = ['Farm - MTG', 'MTG - Ward', 'Ward - LGA', 'LGA - HQ'];
    const pregnancyOptions = ['Not Pregnant', 'Pregnant', 'Delivered'];
    const [progress, setProgress] = useState<string[]>([]);


    const [pregnancyStatus, setPregnancyStatus] = useState<string | null>(null);
    const [offspringCount, setOffspringCount] = useState('');
    const [breedingDate, setBreedingDate] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [conditionObserved, setConditionObserved] = useState('');
    const [treatmentGiven, setTreatmentGiven] = useState('');
    const [vetNotes, setVetNotes] = useState('');
    const [vaccineName, setVaccineName] = useState('');
    const [dateGiven, setDateGiven] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [causeOfDeath, setCauseOfDeath] = useState('');

    const toggleProgress = (item: string) => {
        if (progress.includes(item)) {
            setProgress(progress.filter(i => i !== item));
        } else {
            setProgress([...progress, item]);
        }
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        requestPermission();
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            {/* <FarmerDetailsBackground /> */}

            <CustomBackNavBar title="Log activities" onBackPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(farmers)/selectSubplots");
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
                        {type === 'livestock' ? (
                            <>
                                <Text style={[styles.subplotMeta, { color: colors.textMuted }]}>Total Animals: 124 • Vaccinations Due: 18</Text>
                                <Text style={[styles.subplotMeta, { color: colors.textMuted }]}>Mortality (This Month): 2 • Pregnant: 2</Text>
                            </>
                        ) : (
                            <Text style={[styles.subplotMeta, { color: colors.textMuted }]}>Activities: 2</Text>
                        )}
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Log activities</Text>

                    <View style={[styles.whiteContainer, { backgroundColor: colors.card }]}>
                        {step === 1 && (
                            <>

                                <View style={[styles.activityHeaderContainer, { backgroundColor: colors.card }]}>
                                    <Text style={[styles.activityHeaderText, { color: colors.textMuted }]}>What activity are you doing today?</Text>
                                    <Feather name="chevron-down" size={24} color={colors.textMuted} />
                                </View>

                                <View className='px-2'>


                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        {type === 'crop' ? (
                                            <View style={styles.activityGrid} className='px-1'>
                                                {cropActivityOptions.map((option) => (
                                                    <TouchableOpacity
                                                        key={option.id}
                                                        style={styles.radioRow}
                                                        onPress={() => setSelectedCropActivity(option.id as CropActivityType)}
                                                    >
                                                        <View style={[styles.radioOuter, selectedCropActivity === option.id && styles.radioOuterSelected, { borderColor: selectedCropActivity === option.id ? '#0E6F6A' : colors.textMuted }]}>
                                                            {selectedCropActivity === option.id && <View style={styles.radioInner} />}
                                                        </View>
                                                        <Text style={[styles.radioLabel, { color: colors.text }]}>{option.label}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ) : (
                                            <View className='px-1 !flex !flex-col !gap-2'>
                                                {livestockActivityOptions.map((option) => (
                                                    <TouchableOpacity
                                                        key={option.id}
                                                        style={styles.radioRow}
                                                        className='!w-full'
                                                        onPress={() => setSelectedLivestockActivity(option.id as LivestockActivityType)}
                                                    >
                                                        <View style={[styles.radioOuter, selectedLivestockActivity === option.id && styles.radioOuterSelected, { borderColor: selectedLivestockActivity === option.id ? '#0E6F6A' : colors.textMuted }]}
                                                        >
                                                            {selectedLivestockActivity === option.id && <View style={styles.radioInner} />}
                                                        </View>
                                                        <Text className='!w-full' style={[styles.radioLabel, { color: colors.text }]}>{option.label}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}

                        {step === 2 && (
                            <View className='px-4 pt-4'>
                                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Scan QR Code</Text>
                                <View style={styles.cameraContainer}>
                                    <CameraView style={StyleSheet.absoluteFill} facing="back" />
                                    <View style={styles.cameraControls}>
                                        <TouchableOpacity style={styles.cameraButtonSmall}>
                                            <Feather name="camera" size={20} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.cameraButtonLarge}>
                                            <View style={styles.cameraButtonInner} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.cameraButtonSmall}>
                                            <Feather name="zap-off" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        {step === 3 && (
                            <View className='px-4 pt-4'>
                                <View style={styles.activityHeaderContainerNoShadow}>
                                    <Text style={[styles.activityHeaderText, { color: colors.textMuted }]}>Add Bag details</Text>
                                    <Feather name="chevron-down" size={24} color={colors.textMuted} />
                                </View>
                                <Image
                                    source={require('../../assets/images/nutshellImage.png')} // Placeholder
                                    style={[styles.bagImage, { alignSelf: 'center' }]}
                                />
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                    className='!bg-[#0E6F6A0D] !border-[#0E6F6A0D]'
                                    placeholder="Input Estimated yield in kg"
                                    placeholderTextColor={colors.textMuted}
                                    value={estimatedYield}
                                    onChangeText={setEstimatedYield}
                                    keyboardType="numeric"
                                />

                            </View>
                        )}

                        {step === 4 && (
                            <View className='px-4 pt-4'>
                                <View style={styles.activityHeaderContainerNoShadow}>
                                    <Text style={[styles.activityHeaderText, { color: colors.textMuted }]}>Mark Progress</Text>
                                    <Feather name="chevron-down" size={24} color={colors.textMuted} />
                                </View>
                                <Image
                                    source={require('../../assets/images/nutshellImage.png')} // Placeholder
                                    style={styles.bagImage}
                                />
                                <Text style={[styles.progressTitle, { color: colors.text }]}>Check out progress as you proceed in the chain for this bag</Text>
                                {progressOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.radioRowVertical}
                                        onPress={() => toggleProgress(option)}
                                    >
                                        <View style={[styles.checkboxOuter, progress.includes(option) && styles.checkboxOuterSelected, { borderColor: progress.includes(option) ? '#0E6F6A' : colors.textMuted }]}>
                                            {progress.includes(option) && <View style={styles.checkboxInner} />}
                                        </View>
                                        <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {step === 1 && type === 'crop' && selectedCropActivity === 'field_visit' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]} className=''>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Purpose of visit</Text>
                                    {purposeOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.radioRowVertical}
                                            onPress={() => setPurposeOfVisit(option)}
                                        >
                                            <View style={[styles.checkboxOuter, purposeOfVisit === option && styles.checkboxOuterSelected, { borderColor: purposeOfVisit === option ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                {purposeOfVisit === option && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {step === 1 && type === 'crop' && selectedCropActivity === 'land_preparation' && (
                            <View className='px-2'>
                                <>
                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Type of land preparation</Text>
                                        {landPrepOptions.map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={styles.radioRowVertical}
                                                onPress={() => setLandPrepType(option)}
                                            >
                                                <View style={[styles.checkboxOuter, landPrepType === option && styles.checkboxOuterSelected, { borderColor: landPrepType === option ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                    {landPrepType === option && <View style={styles.checkboxInner} />}
                                                </View>
                                                <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Method used</Text>
                                        {methodOptions.map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={styles.radioRowVertical}
                                                onPress={() => setMethodUsed(option)}
                                            >
                                                <View style={[styles.checkboxOuter, methodUsed === option && styles.checkboxOuterSelected, { borderColor: methodUsed === option ? '#0E6F6A' : colors.textMuted, backgroundColor: colors.card }]}>
                                                    {methodUsed === option && <View style={styles.checkboxInner} />}
                                                </View>
                                                <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Capture land preparation evidence</Text>
                                        {evidenceImage ? (
                                            <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                                <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                                <View style={styles.editImageOverlay}>
                                                    <Feather name="edit-2" size={16} color="white" />
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={pickImage}>
                                                <Text style={styles.photoButtonText}>Take a photo</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                        <TextInput
                                            style={[styles.notesInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                            placeholder="Add note..."
                                            placeholderTextColor={colors.textMuted}
                                            value={notes}
                                            onChangeText={setNotes}
                                            multiline
                                        />
                                    </View>
                                </>
                            </View>
                        )}

                        {step === 1 && type === 'crop' && selectedCropActivity === 'planting' && (
                            <View className='px-2'>
                                <View style={styles.innerContainer}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Type of crop planted</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Enter crop name"
                                        placeholderTextColor={colors.textMuted}
                                        value={cropType}
                                        onChangeText={setCropType}
                                    />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Method used</Text>
                                    {methodOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.radioRowVertical}
                                            onPress={() => setMethodUsed(option)}
                                        >
                                            <View style={[styles.checkboxOuter, methodUsed === option && styles.checkboxOuterSelected, { borderColor: methodUsed === option ? '#0E6F6A' : colors.textMuted }]}>
                                                {methodUsed === option && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Capture planting evidence</Text>
                                    {evidenceImage ? (
                                        <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                            <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                            <View style={styles.editImageOverlay}>
                                                <Feather name="edit-2" size={16} color="white" />
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={pickImage}>
                                            <Text style={styles.photoButtonText}>Take a photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                    <TextInput
                                        style={[styles.notesInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Add note..."
                                        placeholderTextColor={colors.textMuted}
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                    />
                                </View>
                            </View>
                        )}

                        {step === 1 && type === 'crop' && selectedCropActivity === 'pest_disease' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>What was used</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Add note..."
                                        placeholderTextColor={colors.textMuted}
                                        value={chemicalUsed}
                                        onChangeText={setChemicalUsed}
                                    />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Product name</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Add note..."
                                        placeholderTextColor={colors.textMuted}
                                        value={productName}
                                        onChangeText={setProductName}
                                    />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Quantity used</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Add note..."
                                        placeholderTextColor={colors.textMuted}
                                        value={quantityUsed}
                                        onChangeText={setQuantityUsed}
                                    />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Method used</Text>
                                    {pestMethodOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.radioRowVertical}
                                            onPress={() => setMethodUsed(option)}
                                        >
                                            <View style={[styles.checkboxOuter, methodUsed === option && styles.checkboxOuterSelected, { borderColor: methodUsed === option ? '#0E6F6A' : colors.textMuted }]}>
                                                {methodUsed === option && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                    <TextInput
                                        style={[styles.notesInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Add note..."
                                        placeholderTextColor={colors.textMuted}
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                    />
                                </View>
                            </View>
                        )}

                        {step === 1 && type === 'crop' && selectedCropActivity === 'weeding' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Weeding method</Text>
                                    {weedingMethodOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.radioRowVertical}
                                            onPress={() => setMethodUsed(option)}
                                        >
                                            <View style={[styles.checkboxOuter, methodUsed === option && styles.checkboxOuterSelected, { borderColor: methodUsed === option ? '#0E6F6A' : colors.textMuted }]}>
                                                {methodUsed === option && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Herbicide used</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Add note..."
                                        placeholderTextColor={colors.textMuted}
                                        value={herbicideUsed}
                                        onChangeText={setHerbicideUsed}
                                    />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                    <TextInput
                                        style={[styles.notesInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Add note..."
                                        placeholderTextColor={colors.textMuted}
                                        value={notes}
                                        onChangeText={setNotes}
                                        multiline
                                    />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Growth stage</Text>
                                    {growthStageOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.radioRowVertical}
                                            onPress={() => setGrowthStage(option)}
                                        >
                                            <View style={[styles.checkboxOuter, growthStage === option && styles.checkboxOuterSelected, { borderColor: growthStage === option ? '#0E6F6A' : colors.textMuted }]}>
                                                {growthStage === option && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {step === 1 && type === 'crop' && selectedCropActivity === 'harvest' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>What harvest activity</Text>
                                    <TouchableOpacity
                                        style={styles.radioRowVertical}
                                        onPress={() => setHarvestType('pre_harvest')}
                                    >
                                        <View style={[styles.radioOuter, harvestType === 'pre_harvest' && styles.radioOuterSelected, { borderColor: harvestType === 'pre_harvest' ? '#0E6F6A' : colors.textMuted }]}>
                                            {harvestType === 'pre_harvest' && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={[styles.radioLabel, { color: colors.text }]}>Pre-Harvest activity</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.radioRowVertical}
                                        onPress={() => setHarvestType('harvesting')}
                                    >
                                        <View style={[styles.radioOuter, harvestType === 'harvesting' && styles.radioOuterSelected, { borderColor: harvestType === 'harvesting' ? '#0E6F6A' : colors.textMuted }]}>
                                            {harvestType === 'harvesting' && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={[styles.radioLabel, { color: colors.text }]}>Harvesting activity</Text>
                                    </TouchableOpacity>
                                </View>

                                {harvestType === 'pre_harvest' && (
                                    <>
                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Crop Maturity</Text>
                                            {cropMaturityOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={styles.radioRowVertical}
                                                    onPress={() => setCropMaturity(option)}
                                                >
                                                    <View style={[styles.checkboxOuter, cropMaturity === option && styles.checkboxOuterSelected, { borderColor: cropMaturity === option ? '#0E6F6A' : colors.textMuted }]}>
                                                        {cropMaturity === option && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Any pest or disease impact?</Text>
                                            {pestImpactOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={styles.radioRowVertical}
                                                    onPress={() => setPestImpact(option)}
                                                >
                                                    <View style={[styles.checkboxOuter, pestImpact === option && styles.checkboxOuterSelected, { borderColor: pestImpact === option ? '#0E6F6A' : colors.textMuted }]}>
                                                        {pestImpact === option && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                            <TextInput
                                                style={[styles.notesInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                                placeholder="Write here..."
                                                placeholderTextColor={colors.textMuted}
                                                value={notes}
                                                onChangeText={setNotes}
                                                multiline
                                            />
                                        </View>

                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Capture evidence</Text>
                                            {evidenceImage ? (
                                                <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                                    <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                                    <View style={styles.editImageOverlay}>
                                                        <Feather name="edit-2" size={16} color="white" />
                                                    </View>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={pickImage}>
                                                    <Text style={styles.photoButtonText}>Take a photo</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </>
                                )}

                                {harvestType === 'harvesting' && (
                                    <>
                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Harvest method</Text>
                                            {harvestMethodOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={styles.radioRowVertical}
                                                    onPress={() => setMethodUsed(option)}
                                                >
                                                    <View style={[styles.checkboxOuter, methodUsed === option && styles.checkboxOuterSelected, { borderColor: methodUsed === option ? '#0E6F6A' : colors.textMuted }]}>
                                                        {methodUsed === option && <View style={styles.checkboxInner} />}
                                                    </View>
                                                    <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Estimated yield</Text>
                                            <TextInput
                                                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                                placeholder="Input Estimated yield in kg"
                                                placeholderTextColor={colors.textMuted}
                                                value={estimatedYield}
                                                onChangeText={setEstimatedYield}
                                                keyboardType="numeric"
                                            />
                                        </View>

                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                            <TextInput
                                                style={[styles.notesInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                                placeholder="Write here..."
                                                placeholderTextColor={colors.textMuted}
                                                value={notes}
                                                onChangeText={setNotes}
                                                multiline
                                            />
                                        </View>

                                        <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Capture evidence</Text>
                                            {evidenceImage ? (
                                                <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                                    <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                                    <View style={styles.editImageOverlay}>
                                                        <Feather name="edit-2" size={16} color="white" />
                                                    </View>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={pickImage}>
                                                    <Text style={styles.photoButtonText}>Take a photo</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </>
                                )}
                            </View>
                        )}


                        {step === 1 && type === 'livestock' && selectedLivestockActivity === 'lifecycle' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Pregnancy Status</Text>
                                    {pregnancyOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.radioRowVertical}
                                            onPress={() => setPregnancyStatus(option)}
                                        >
                                            <View style={[styles.radioOuter, pregnancyStatus === option && styles.radioOuterSelected, { borderColor: pregnancyStatus === option ? '#0E6F6A' : colors.textMuted }]}>
                                                {pregnancyStatus === option && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={[styles.radioLabel, { color: colors.text }]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Offspring Count</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Input"
                                        placeholderTextColor={colors.textMuted}
                                        value={offspringCount}
                                        onChangeText={setOffspringCount}
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Breeding Date</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={breedingDate} onChangeText={setBreedingDate} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Expected Delivery Date</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={expectedDeliveryDate} onChangeText={setExpectedDeliveryDate} />
                                </View>
                            </View>
                        )}

                        {step === 1 && type === 'livestock' && selectedLivestockActivity === 'health' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Date</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Input" placeholderTextColor={colors.textMuted} value={dateGiven} onChangeText={setDateGiven} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Condition Observed</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={conditionObserved} onChangeText={setConditionObserved} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Treatment Given</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={treatmentGiven} onChangeText={setTreatmentGiven} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Vet Notes (optional)</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={vetNotes} onChangeText={setVetNotes} />
                                </View>
                            </View>
                        )}

                        {step === 1 && type === 'livestock' && selectedLivestockActivity === 'vaccination' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Vaccine Name</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Input" placeholderTextColor={colors.textMuted} value={vaccineName} onChangeText={setVaccineName} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Date Given</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={dateGiven} onChangeText={setDateGiven} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Next Due Date</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={nextDueDate} onChangeText={setNextDueDate} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Evidence (Photo optional)</Text>
                                    {evidenceImage ? (
                                        <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                            <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                            <View style={styles.editImageOverlay}>
                                                <Feather name="edit-2" size={16} color="white" />
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={pickImage}>
                                            <Text style={styles.photoButtonText}>Take a photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        {step === 1 && type === 'livestock' && selectedLivestockActivity === 'mortality' && (
                            <View className='px-2'>
                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Date of death</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Input" placeholderTextColor={colors.textMuted} value={dateOfDeath} onChangeText={setDateOfDeath} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Cause of death (Required)</Text>
                                    <TextInput style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={causeOfDeath} onChangeText={setCauseOfDeath} />
                                </View>

                                <View style={[styles.innerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                                    <TextInput style={[styles.notesInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} placeholder="Add note..." placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline />
                                </View>

                                <View style={styles.innerContainer}>
                                    <Text style={styles.fieldLabel}>Evidence (Photo optional)</Text>
                                    {evidenceImage ? (
                                        <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                            <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                            <View style={styles.editImageOverlay}>
                                                <Feather name="edit-2" size={16} color="white" />
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={pickImage}>
                                            <Text style={styles.photoButtonText}>Take a photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}


                        {step === 1 && (
                            <View className='px-2'>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>
                                        {type === 'crop' && selectedCropActivity === 'harvest' && harvestType === 'harvesting'
                                            ? 'Proceed to bag tagging'
                                            : 'Save activities'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 2 && (
                            <View className='px-2 mt-1'>
                                <TouchableOpacity style={[styles.scanButton, { backgroundColor: colors.card, borderColor: '#0E6F6A' }]} onPress={handleSave}>
                                    <Text style={styles.scanButtonText}>Scan QR Code</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 3 && (
                            <View className='px-2 mt-1'>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save bag</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 4 && (
                            <View className='px-2 mt-4'>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
        backgroundColor: 'white',
    },
    // deleted styles

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
    whiteContainer: {
        // backgroundColor: '#FFFFFF',
        borderRadius: 16,
        // padding: 7,
        paddingTop: 0,
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
    },
    activityHeaderText: {
        fontSize: 16,
        fontWeight: '500',
        // color: '#0A0C11B2',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
        marginBottom: 12,
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
        // borderRadius: 12,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '500',
        // color: '#0A0C11B2',
        marginBottom: 12,
    },
    activityGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '48%',
        marginBottom: 4,
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
        borderColor: '#5B616D',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'white',
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
    textInput: {
        // backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        // color: '#0A0C11',
        borderWidth: 1,
        // borderColor: '#E0E0E0',
    },
    notesInput: {
        // backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        // color: '#0A0C11',
        borderWidth: 1,
        // borderColor: '#E0E0E0',
        // minHeight: 80,
        textAlignVertical: 'top',
    },
    photoButton: {
        backgroundColor: 'background',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0E6F6A',
    },
    activityListVertical: {
        flexDirection: 'column',
        gap: 12,
        marginTop: 8,
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
    cameraContainer: {
        width: '100%',
        height: 340,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 12,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cameraControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 30,
    },
    cameraButtonSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButtonLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButtonInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#0A0C11',
    },
    scanButton: {
        // backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#0E6F6A',
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    scanButtonText: {
        color: '#0E6F6A',
        fontSize: 16,
        fontWeight: '600',
    },
    bagImage: {
        width: '90%',
        height: 300,
        borderRadius: 12,
        marginBottom: 16,
        alignSelf: 'center',
    },
    activityHeaderContainerNoShadow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressTitle: {
        fontSize: 14,
        // color: '#0A0C1199',
        marginBottom: 12,
        marginTop: 12,
    },
});

import React, { useState, useEffect, useCallback } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Switch, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CustomBackNavBar from '../../../components/ui/CustomBackNavBar';
import { registrationState } from '../../../services/registrationState';
import { draftService } from '../../../services/draftService';
import SaveDraftModal, { SaveDraftInfo } from '../../../components/ui/SaveDraftModal';

const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];
const EDUCATION_OPTIONS = ['None', 'Primary', 'Secondary', 'Tertiary'];
const OCCUPATION_OPTIONS = ['Crop Farming', 'Livestock Rearing', 'Trading/Business', 'Artisan/Craft', 'Civil Servant', 'Other'];
const DISABILITY_OPTIONS = [
    'None', 'Difficulty Seeing', 'Difficulty Hearing', 'Difficulty Walking',
    'Difficulty Remembering', 'Difficulty Speaking', 'Difficulty With Hands'
];

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Generates list of birth years from (CurrentYear - 16) down to 1930
const CURRENT_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 16 - i);

export default function FarmerPersonalDetails() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const params = useLocalSearchParams();
    const [showModal, setShowModal] = useState(false);
    const [savedDraftInfo, setSavedDraftInfo] = useState<SaveDraftInfo | null>(null);

    const savedData = registrationState.getData();

    // Form State (Section A)
    const [consent, setConsent] = useState(true);
    const [firstName, setFirstName] = useState(savedData.firstName || '');
    const [middleName, setMiddleName] = useState(savedData.middleName || '');
    const [lastName, setLastName] = useState(savedData.lastName || '');
    const [gender, setGender] = useState<'Male' | 'Female'>(savedData.gender === 'female' ? 'Female' : 'Male');
    const [phone, setPhone] = useState(savedData.phone || '');
    const [alternatePhone, setAlternatePhone] = useState(savedData.alternatePhone || '');
    const [email, setEmail] = useState(savedData.email || '');
    const [preferredLanguage, setPreferredLanguage] = useState(savedData.preferredLanguage || '');
    
    // DoB vs Age Rule (A06/A07)
    const [doesNotKnowDob, setDoesNotKnowDob] = useState(false);
    const [dob, setDob] = useState(savedData.dateOfBirth || '');
    const initialAge = dob ? (CURRENT_YEAR - parseInt(dob.split('-')[0], 10)).toString() : '';
    const [farmerAge, setFarmerAge] = useState(initialAge);

    // Calendar Modal State
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [calYear, setCalYear] = useState(1990);
    const [calMonth, setCalMonth] = useState(0); // 0-indexed (January)
    const [selectedDay, setSelectedDay] = useState(1);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const [maritalStatus, setMaritalStatus] = useState(savedData.maritalStatus || '');
    const [canReadWrite, setCanReadWrite] = useState(savedData.canReadWrite ?? false);
    const [education, setEducation] = useState(savedData.education || '');
    
    const [primaryOcc, setPrimaryOcc] = useState(savedData.primaryOcc || '');
    const [primaryOccOther, setPrimaryOccOther] = useState('');
    const [secondaryOcc, setSecondaryOcc] = useState(savedData.secondaryOcc || '');
    const [secondaryOccOther, setSecondaryOccOther] = useState('');

    const [monthlyIncome, setMonthlyIncome] = useState(savedData.monthlyIncome || '');
    const [incomeControl, setIncomeControl] = useState(savedData.incomeControl ?? false);
    const [selectedDisabilities, setSelectedDisabilities] = useState<string[]>(savedData.selectedDisabilities || []);

    // Re-synchronize on route params change (handles New Registration vs Resume Draft cleanly)
    useEffect(() => {
        if (params?.isNew === 'true') {
            registrationState.resetData();
        }
        const data = registrationState.getData();
        setFirstName(data.firstName || '');
        setMiddleName(data.middleName || '');
        setLastName(data.lastName || '');
        setGender(data.gender === 'female' ? 'Female' : 'Male');
        setPhone(data.phone || '');
        setAlternatePhone(data.alternatePhone || '');
        setEmail(data.email || '');
        setPreferredLanguage(data.preferredLanguage || '');
        setDob(data.dateOfBirth || '');
        const age = data.dateOfBirth ? (CURRENT_YEAR - parseInt(data.dateOfBirth.split('-')[0], 10)).toString() : '';
        setFarmerAge(age);
        setMaritalStatus(data.maritalStatus || '');
        setCanReadWrite(data.canReadWrite ?? false);
        setEducation(data.education || '');
        setPrimaryOcc(data.primaryOcc || '');
        setSecondaryOcc(data.secondaryOcc || '');
        setMonthlyIncome(data.monthlyIncome || '');
        setIncomeControl(data.incomeControl ?? false);
        setSelectedDisabilities(data.selectedDisabilities || []);
    }, [params?.isNew, params?.isResume, params?.draftId]);

    // Helper to calculate DoB from Age input
    const handleAgeChange = (val: string) => {
        setFarmerAge(val);
        const ageNum = parseInt(val, 10);
        if (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) {
            const calculatedYear = CURRENT_YEAR - ageNum;
            setDob(`${calculatedYear}-01-01`);
        }
    };

    // Helper for thousand-separator formatting
    const handleIncomeChange = (val: string) => {
        const cleanDigits = val.replace(/\D/g, '');
        if (cleanDigits) {
            const formatted = parseInt(cleanDigits, 10).toLocaleString();
            setMonthlyIncome(formatted);
        } else {
            setMonthlyIncome('');
        }
    };

    // Calendar Modal Handlers
    const openCalendarModal = () => {
        if (dob) {
            const parts = dob.split('-');
            if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                if (!isNaN(y)) setCalYear(y);
                if (!isNaN(m) && m >= 0 && m < 12) setCalMonth(m);
                if (!isNaN(d)) setSelectedDay(d);
            }
        }
        setShowCalendarModal(true);
    };

    const confirmDateSelection = () => {
        const formattedMonth = String(calMonth + 1).padStart(2, '0');
        const formattedDay = String(selectedDay).padStart(2, '0');
        const newDob = `${calYear}-${formattedMonth}-${formattedDay}`;
        setDob(newDob);
        
        // Auto calculate age
        const calculatedAge = CURRENT_YEAR - calYear;
        setFarmerAge(calculatedAge.toString());

        setShowCalendarModal(false);
    };

    const handlePrevMonth = () => {
        if (calMonth === 0) {
            setCalMonth(11);
            setCalYear(calYear - 1);
        } else {
            setCalMonth(calMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (calMonth === 11) {
            setCalMonth(0);
            setCalYear(calYear + 1);
        } else {
            setCalMonth(calMonth + 1);
        }
    };

    const toggleDisability = (option: string) => {
        if (option === 'None') {
            setSelectedDisabilities(['None']);
            return;
        }
        let updated = selectedDisabilities.filter(d => d !== 'None');
        if (updated.includes(option)) {
            updated = updated.filter(d => d !== option);
        } else {
            updated.push(option);
        }
        if (updated.length === 0) updated = ['None'];
        setSelectedDisabilities(updated);
    };

    const handleSave = () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert("Required Fields", "Please enter the farmer's first and last name.");
            return;
        }
        if (!phone.trim()) {
            Alert.alert("Required Fields", "Please enter the farmer's primary phone number.");
            return;
        }
        registrationState.updateData({
            firstName,
            middleName,
            lastName,
            gender: gender.toLowerCase() as any,
            dateOfBirth: dob,
            phone,
            alternatePhone,
            email,
            preferredLanguage,
            maritalStatus,
            canReadWrite,
            education,
            primaryOcc,
            secondaryOcc,
            monthlyIncome,
            incomeControl,
            selectedDisabilities,
        });
        setShowModal(true);
    };

    const handleSaveDraft = async () => {
        try {
            const draft = await draftService.saveCurrentDraft(
                '/(agent)/register-farmer/personal-details',
                1,
                'Personal Details',
                {
                    firstName,
                    middleName,
                    lastName,
                    gender: gender.toLowerCase() as any,
                    dateOfBirth: dob,
                    phone,
                    alternatePhone,
                    email,
                    preferredLanguage,
                    maritalStatus,
                    canReadWrite,
                    education,
                    primaryOcc,
                    secondaryOcc,
                    monthlyIncome,
                    incomeControl,
                    selectedDisabilities,
                }
            );
            setSavedDraftInfo({
                farmerName: draft.farmerName,
                stepNumber: 1,
                stepTitle: 'Personal Details',
            });
        } catch (err) {
            Alert.alert('Error', 'Failed to save draft. Please try again.');
        }
    };

    // Calendar Days calculation
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <CustomBackNavBar
                title="Register New Farmer"
                onBackPress={() => {
                    if (navigation?.canGoBack && navigation.canGoBack()) {
                        navigation.goBack();
                    } else if (router.canGoBack()) {
                        router.back();
                    } else if (navigation?.navigate) {
                        navigation.navigate('farmers');
                    } else {
                        router.navigate('/(agent)/farmers' as any);
                    }
                }}
                onSaveDraft={handleSaveDraft}
                textColor="#0A0C11"
                backButtonBackgroundColor="white"
                iconColor="#0A0C11"
                backgroundColor="rgba(255,255,255,0.2)"
                blurIntensity={20}
            />

            <View style={styles.contentContainer}>
                {/* Step Indicator Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.progressCircle}>
                        <Svg width="40" height="40" viewBox="0 0 40 40" style={StyleSheet.absoluteFill}>
                            <Circle cx="20" cy="20" r="18" fill="transparent" stroke="#E5E7EB" strokeWidth="3" />
                            <Circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="transparent"
                                stroke="#0E6F6A"
                                strokeWidth="3"
                                strokeDasharray={2 * Math.PI * 18}
                                strokeDashoffset={2 * Math.PI * 18 * (1 - 0.20)}
                                strokeLinecap="round"
                                rotation="-90"
                                origin="20, 20"
                            />
                        </Svg>
                        <Text style={styles.progressText}>20%</Text>
                    </View>
                    <View>
                        <Text style={styles.stepLabel}>Step 1 of 5 • Section A</Text>
                        <Text style={styles.stepTitle}>Farmer Personal Information</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
                    <Image source={require('../../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

                    {/* Consent A01/A02 Notice */}
                    <TouchableOpacity
                        style={[styles.consentBox, consent && styles.consentBoxChecked]}
                        onPress={() => setConsent(!consent)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={consent ? "checkbox" : "square-outline"}
                            size={22}
                            color={consent ? "#0E6F6A" : "#6B7280"}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.consentTitle}>Consent & Data Authorization (A01/A02)</Text>
                            <Text style={styles.consentSubtext}>
                                Farmer explicitly consents to Project Juriya baseline enumeration and data recording.
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Name Fields (A03, A04, A05) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Enter first name"
                            placeholderTextColor="#A0AEC0"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Middle Name</Text>
                        <TextInput
                            style={styles.input}
                            value={middleName}
                            onChangeText={setMiddleName}
                            placeholder="Enter middle name"
                            placeholderTextColor="#A0AEC0"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name / Surname *</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Enter surname"
                            placeholderTextColor="#A0AEC0"
                        />
                    </View>

                    {/* Gender Selection (A06) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender (A06)</Text>
                        <View style={styles.genderRow}>
                            <TouchableOpacity
                                style={[styles.genderPill, gender === 'Male' && styles.genderPillActive]}
                                onPress={() => setGender('Male')}
                            >
                                <Ionicons name="male" size={16} color={gender === 'Male' ? '#FFFFFF' : '#0E6F6A'} />
                                <Text style={[styles.genderPillText, gender === 'Male' && styles.genderPillTextActive]}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.genderPill, gender === 'Female' && styles.genderPillActive]}
                                onPress={() => setGender('Female')}
                            >
                                <Ionicons name="female" size={16} color={gender === 'Female' ? '#FFFFFF' : '#0E6F6A'} />
                                <Text style={[styles.genderPillText, gender === 'Female' && styles.genderPillTextActive]}>Female</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Primary Phone, Alternate Phone, Email, Preferred Language */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Primary Phone Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="e.g. 0803 123 4567"
                            placeholderTextColor="#A0AEC0"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Alternate Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={alternatePhone}
                            onChangeText={setAlternatePhone}
                            placeholder="e.g. 0807 654 3210"
                            placeholderTextColor="#A0AEC0"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="e.g. farmer@example.com"
                            placeholderTextColor="#A0AEC0"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Preferred Communication Language</Text>
                        <View style={styles.optionWrap}>
                            {['Hausa', 'English', 'Yoruba', 'Igbo', 'Other'].map((lang) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[styles.chipPill, preferredLanguage === lang && styles.chipPillActive]}
                                    onPress={() => setPreferredLanguage(lang)}
                                >
                                    <Text style={[styles.chipText, preferredLanguage === lang && styles.chipTextActive]}>{lang}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Date of Birth & Calendar Picker Popup (A07) */}
                    <View style={styles.inputGroup}>
                        <View style={styles.rowJustify}>
                            <Text style={styles.label}>Date of Birth / Age Rule (A07)</Text>
                            <View style={styles.switchRowInline}>
                                <Text style={styles.switchLabel}>Unknown DoB?</Text>
                                <Switch
                                    value={doesNotKnowDob}
                                    onValueChange={(val) => {
                                        setDoesNotKnowDob(val);
                                        if (val && farmerAge) handleAgeChange(farmerAge);
                                    }}
                                    trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                                />
                            </View>
                        </View>

                        {doesNotKnowDob ? (
                            <View style={{ gap: 6 }}>
                                <TextInput
                                    style={styles.input}
                                    value={farmerAge}
                                    onChangeText={handleAgeChange}
                                    placeholder="Enter Farmer's Age in Years (e.g. 38)"
                                    placeholderTextColor="#A0AEC0"
                                    keyboardType="number-pad"
                                />
                                <Text style={styles.helperText}>
                                    Auto-calculated DoB: <Text style={{ fontWeight: '700', color: '#0E6F6A' }}>{dob || 'YYYY-01-01'}</Text> (Rule: Jan 01, CurrentYear - Age)
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.datePickerInputBtn}
                                onPress={openCalendarModal}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Ionicons name="calendar-outline" size={20} color="#0E6F6A" />
                                    <Text style={styles.datePickerInputText}>
                                        {dob ? dob : 'Tap to select Date of Birth'}
                                    </Text>
                                </View>
                                <Feather name="chevron-down" size={18} color="#64748B" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Marital Status (A08) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Marital Status (A08)</Text>
                        <View style={styles.optionWrap}>
                            {MARITAL_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.chipPill, maritalStatus === opt && styles.chipPillActive]}
                                    onPress={() => setMaritalStatus(opt)}
                                >
                                    <Text style={[styles.chipText, maritalStatus === opt && styles.chipTextActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Literacy & Education (A09, A10) */}
                    <View style={styles.inputGroup}>
                        <View style={styles.rowJustify}>
                            <Text style={styles.label}>Can Read & Write? (A09)</Text>
                            <View style={styles.switchRowInline}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: canReadWrite ? '#0E6F6A' : '#6B7280' }}>
                                    {canReadWrite ? 'Yes (Literate)' : 'No'}
                                </Text>
                                <Switch
                                    value={canReadWrite}
                                    onValueChange={setCanReadWrite}
                                    trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Highest Education Level (A10)</Text>
                        <View style={styles.optionWrap}>
                            {EDUCATION_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.chipPill, education === opt && styles.chipPillActive]}
                                    onPress={() => setEducation(opt)}
                                >
                                    <Text style={[styles.chipText, education === opt && styles.chipTextActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Primary & Secondary Occupations (A11, A12) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Primary Occupation (A11)</Text>
                        <View style={styles.optionWrap}>
                            {OCCUPATION_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.chipPill, primaryOcc === opt && styles.chipPillActive]}
                                    onPress={() => setPrimaryOcc(opt)}
                                >
                                    <Text style={[styles.chipText, primaryOcc === opt && styles.chipTextActive]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {primaryOcc === 'Other' && (
                            <TextInput
                                style={[styles.input, { marginTop: 6 }]}
                                value={primaryOccOther}
                                onChangeText={setPrimaryOccOther}
                                placeholder="Specify primary occupation"
                                placeholderTextColor="#A0AEC0"
                            />
                        )}
                    </View>

                    {/* Monthly Income & Financial Control (A13, A14) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Average Monthly Personal Income (₦) (A13)</Text>
                        <TextInput
                            style={styles.input}
                            value={monthlyIncome}
                            onChangeText={handleIncomeChange}
                            placeholder="e.g. 48,000"
                            placeholderTextColor="#A0AEC0"
                            keyboardType="number-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.rowJustify}>
                            <Text style={styles.label}>Control Over Money Earned? (A14)</Text>
                            <View style={styles.switchRowInline}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: incomeControl ? '#0E6F6A' : '#6B7280' }}>
                                    {incomeControl ? 'Yes' : 'No'}
                                </Text>
                                <Switch
                                    value={incomeControl}
                                    onValueChange={setIncomeControl}
                                    trackColor={{ false: '#E2E8F0', true: '#0E6F6A' }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Disability Status (A15) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Disability Status (A15)</Text>
                        <View style={styles.optionWrap}>
                            {DISABILITY_OPTIONS.map((opt) => {
                                const selected = selectedDisabilities.includes(opt);
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.chipPill, selected && styles.chipPillActive]}
                                        onPress={() => toggleDisability(opt)}
                                    >
                                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.continueButtonText}>Save & Proceed to Step 2 (KYC & Photo)</Text>
                        <Feather name="arrow-right" size={18} color="white" />
                    </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Interactive Calendar Pop-up Modal */}
            <Modal
                visible={showCalendarModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCalendarModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModalContent}>
                        {/* Calendar Header with Month/Year Navigation */}
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                                <Feather name="chevron-left" size={22} color="#0F172A" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.monthYearSelector}
                                onPress={() => setShowYearDropdown(!showYearDropdown)}
                            >
                                <Text style={styles.monthYearText}>
                                    {MONTH_NAMES[calMonth]} {calYear}
                                </Text>
                                <Feather name={showYearDropdown ? "chevron-up" : "chevron-down"} size={16} color="#0E6F6A" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                                <Feather name="chevron-right" size={22} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                        {/* Year Selector Dropdown Grid */}
                        {showYearDropdown ? (
                            <View style={styles.yearDropdownContainer}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>
                                    Select Birth Year:
                                </Text>
                                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator>
                                    <View style={styles.yearGrid}>
                                        {YEARS_LIST.map((yr) => (
                                            <TouchableOpacity
                                                key={yr}
                                                style={[styles.yearChip, calYear === yr && styles.yearChipActive]}
                                                onPress={() => {
                                                    setCalYear(yr);
                                                    setShowYearDropdown(false);
                                                }}
                                            >
                                                <Text style={[styles.yearChipText, calYear === yr && styles.yearChipTextActive]}>
                                                    {yr}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        ) : (
                            <>
                                {/* Day of Week Labels */}
                                <View style={styles.dayHeaderRow}>
                                    {DAY_LABELS.map((lbl) => (
                                        <Text key={lbl} style={styles.dayHeaderLabel}>{lbl}</Text>
                                    ))}
                                </View>

                                {/* Day Grid */}
                                <View style={styles.daysGrid}>
                                    {/* Empty padding slots for days before 1st of month */}
                                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                                        <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
                                    ))}

                                    {/* Month Days */}
                                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                                        const d = idx + 1;
                                        const isSelected = selectedDay === d;
                                        return (
                                            <TouchableOpacity
                                                key={d}
                                                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                                                onPress={() => setSelectedDay(d)}
                                            >
                                                <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>
                                                    {d}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {/* Selected Date Summary & Actions */}
                        <View style={styles.calendarFooter}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>Selected Date of Birth:</Text>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0E6F6A' }}>
                                    {MONTH_NAMES[calMonth]} {selectedDay}, {calYear}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={styles.cancelCalBtn}
                                    onPress={() => setShowCalendarModal(false)}
                                >
                                    <Text style={styles.cancelCalBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.confirmCalBtn}
                                    onPress={confirmDateSelection}
                                >
                                    <Text style={styles.confirmCalBtnText}>Confirm Date</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.successIconCircle}>
                                <Feather name="check" size={24} color="white" />
                            </View>
                            <Text style={styles.modalTitle}>Section A Saved</Text>
                        </View>

                        <View style={styles.modalFarmerInfo}>
                            <Text style={styles.modalFarmerName}>{firstName} {lastName}</Text>
                            <Text style={styles.modalFarmerId}>ID: FARM-2026-{Math.floor(1000 + Math.random() * 9000)}</Text>
                        </View>

                        <View style={styles.completionContainer}>
                            <Text style={styles.completionText}>Step 1 Complete (20%)</Text>
                            <View style={styles.completionBarBackground}>
                                <View style={[styles.completionBarFill, { width: '20%' }]} />
                            </View>
                        </View>

                        <View style={styles.modalDivider} />

                        <View style={styles.nextStepContainer}>
                            <Text style={styles.nextStepLabel}>Next Step:</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Feather name="shield" size={16} color="#0E6F6A" />
                                <Text style={styles.nextStepTitle}>Step 2: Identity, Banking & Photo Capture</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.startNowButton} 
                            onPress={() => {
                                setShowModal(false);
                                if (navigation?.navigate) {
                                    navigation.navigate('register-farmer/kyc');
                                } else {
                                    router.navigate('/(agent)/register-farmer/kyc' as any);
                                }
                            }}
                        >
                            <Text style={styles.startNowText}>Proceed to KYC & Photo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <SaveDraftModal
                visible={Boolean(savedDraftInfo)}
                draftInfo={savedDraftInfo}
                onKeepEditing={() => setSavedDraftInfo(null)}
                onViewDrafts={() => {
                    setSavedDraftInfo(null);
                    if (navigation?.navigate) {
                        navigation.navigate('drafts');
                    } else {
                        router.navigate('/(agent)/drafts' as any);
                    }
                }}
                onExit={() => {
                    setSavedDraftInfo(null);
                    if (navigation?.navigate) {
                        navigation.navigate('farmers');
                    } else {
                        router.navigate('/(agent)/farmers' as any);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    contentContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 20,
    },
    headerContainer: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressCircle: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0A0C11',
    },
    stepLabel: {
        fontSize: 12,
        color: '#5B616D',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A0C11',
    },
    formContainer: {
        borderRadius: 16,
        padding: 16,
        gap: 16,
        overflow: 'hidden',
    },
    consentBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    consentBoxChecked: {
        backgroundColor: '#F0FDF4',
        borderColor: '#0E6F6A',
    },
    consentTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    consentSubtext: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
    },
    datePickerInputBtn: {
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    datePickerInputText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 12,
    },
    genderPill: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#0E6F6A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
    },
    genderPillActive: {
        backgroundColor: '#0E6F6A',
    },
    genderPillText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0E6F6A',
    },
    genderPillTextActive: {
        color: '#FFFFFF',
    },
    rowJustify: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    switchRowInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    switchLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    helperText: {
        fontSize: 11,
        color: '#64748B',
    },
    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chipPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
    },
    chipPillActive: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#334155',
    },
    chipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    continueButton: {
        height: 50,
        backgroundColor: '#0E6F6A',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    continueButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },

    // Calendar Modal Styles
    calendarModalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        gap: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    calNavBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthYearSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F0FDF4',
    },
    monthYearText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    yearDropdownContainer: {
        paddingVertical: 10,
    },
    yearGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    yearChip: {
        width: '23%',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
    },
    yearChipActive: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    yearChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    yearChipTextActive: {
        color: '#FFFFFF',
    },
    dayHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    dayHeaderLabel: {
        width: '14%',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCellEmpty: {
        width: '14.28%',
        height: 40,
    },
    dayCell: {
        width: '14.28%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    dayCellSelected: {
        backgroundColor: '#0E6F6A',
    },
    dayCellText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    dayCellTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    calendarFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginTop: 4,
    },
    cancelCalBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    cancelCalBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    confirmCalBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#0E6F6A',
    },
    confirmCalBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    successIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0A0C11',
    },
    modalFarmerInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalFarmerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0A0C11',
        marginBottom: 4,
    },
    modalFarmerId: {
        fontSize: 14,
        color: '#5B616D',
    },
    completionContainer: {
        width: '100%',
        marginBottom: 24,
    },
    completionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0E6F6A',
        marginBottom: 8,
        textAlign: 'center',
    },
    completionBarBackground: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        width: '100%',
    },
    completionBarFill: {
        height: 8,
        backgroundColor: '#0E6F6A',
        borderRadius: 4,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        width: '100%',
        marginBottom: 20,
    },
    nextStepContainer: {
        width: '100%',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    nextStepLabel: {
        fontSize: 14,
        color: '#5B616D',
        marginBottom: 4,
    },
    nextStepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0E6F6A',
    },
    startNowButton: {
        width: '100%',
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startNowText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTheme } from '../../context/ThemeContext';

export default function AccessibilityScreen() {
    const router = useRouter();
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();

    // Toggles
    const [soundEffect, setSoundEffect] = useState(true);

    // Selectors State
    const [mediaQuality, setMediaQuality] = useState('Low');
    const [language, setLanguage] = useState(i18n.language);

    // Expansion State
    const [isMediaExpanded, setIsMediaExpanded] = useState(false);
    const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);

    // Toast State
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const switchTrackColor = { false: isDarkMode ? colors.cardSecondary : "white", true: isDarkMode ? colors.cardSecondary : "white" };

    const mediaOptions = ['Low', 'Medium', 'High'];
    const languageOptions = [
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
        { label: 'Yoruba', value: 'yo' },
        { label: 'Igbo', value: 'ig' },
        { label: 'Hausa', value: 'ha' },
    ];

    const renderSwitch = (value: boolean, setValue: (val: boolean) => void) => (
        <View style={styles.switchWrapper}>
            <Switch
                trackColor={switchTrackColor}
                thumbColor={value ? "#0E6F6A" : "#A3A3A3"}
                ios_backgroundColor={isDarkMode ? colors.cardSecondary : "white"}
                onValueChange={setValue}
                className='shadow-sm'
                value={value}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
        </View>
    );

    const handleDone = () => {
        setShowSuccessToast(true);
        setTimeout(() => {
            setShowSuccessToast(false);
            router.replace('/(agent)/settings');
        }, 2000);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title={t('accessibility')} onBackPress={() => router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView contentContainerStyle={styles.contentWrapper} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.description, { color: colors.text }]}>
                        For your security, please update your password.
                    </Text>

                    {/* Toggles Card */}
                    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.optionRow}>
                            <Text style={[styles.optionLabel, { color: colors.text }]}>{t('switch_dark_mode')}</Text>
                            {renderSwitch(isDarkMode, toggleTheme)}
                        </View>
                        <View style={styles.optionRow}>
                            <Text style={[styles.optionLabel, { color: colors.text }]}>{t('sound_effect')}</Text>
                            {renderSwitch(soundEffect, setSoundEffect)}
                        </View>
                    </View>

                    {/* Media Quality Card */}
                    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity
                            style={styles.selectorHeader}
                            onPress={() => {
                                setIsMediaExpanded(!isMediaExpanded);
                                setIsLanguageExpanded(false); // Close other
                            }}
                        >
                            <Text style={[styles.selectorLabel, { color: colors.text }]}>{t('select_media_quality')}</Text>
                            <View style={styles.selectorRight}>
                                <Text style={[styles.selectedValue, { color: colors.textMuted }]}>{mediaQuality}</Text>
                                <Feather name={isMediaExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
                            </View>
                        </TouchableOpacity>

                        {isMediaExpanded && (
                            <View style={styles.optionsList}>
                                {mediaOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setMediaQuality(option);
                                            setIsMediaExpanded(false);
                                        }}
                                    >
                                        <Text style={[styles.optionText, { color: colors.textSecondary }, mediaQuality === option && [styles.selectedOptionText, { color: colors.text }]]}>{option}</Text>
                                        {mediaQuality === option && <Feather name="check" size={14} color="#0E6F6A" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Language Card */}
                    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity
                            style={styles.selectorHeader}
                            onPress={() => {
                                setIsLanguageExpanded(!isLanguageExpanded);
                                setIsMediaExpanded(false); // Close other
                            }}
                        >
                            <Text style={[styles.selectorLabel, { color: colors.text }]}>{t('select_language')}</Text>
                            <View style={styles.selectorRight}>
                                <Text style={[styles.selectedValue, { color: colors.textMuted }]}>{languageOptions.find(opt => opt.value === language)?.label}</Text>
                                <Feather name={isLanguageExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
                            </View>
                        </TouchableOpacity>

                        {isLanguageExpanded && (
                            <View style={styles.optionsList}>
                                {languageOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={styles.optionItem}
                                        onPress={async () => {
                                            setLanguage(option.value);
                                            setIsLanguageExpanded(false);
                                            await i18n.changeLanguage(option.value);
                                            await AsyncStorage.setItem('language', option.value);
                                        }}
                                    >
                                        <Text style={[styles.optionText, { color: colors.textSecondary }, language === option.value && [styles.selectedOptionText, { color: colors.text }]]}>{option.label}</Text>
                                        {language === option.value && <Feather name="check" size={14} color="#0E6F6A" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                        <Text style={styles.doneButtonText}>{t('done')}</Text>
                    </TouchableOpacity>

                </ScrollView>
            </View>

            {/* Success Toast */}
            <NotificationToast
                visible={showSuccessToast}
                onTimerEnd={() => setShowSuccessToast(false)}
                title={t('saved')}
                message={t('settings_saved')}
                duration={2}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Overridden
    },
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 20,
        backgroundColor: 'white', // Overridden
        borderRadius: 16,
        overflow: 'hidden',
    },
    contentWrapper: {
        padding: 16,
        gap: 16,
    },
    description: {
        fontSize: 16,
        color: '#0A0C11', // Overridden
        marginBottom: 8,
    },
    cardContainer: {
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F2F2F4', // Overridden
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    optionLabel: {
        fontSize: 14,
        color: '#0A0C11', // Overridden
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },

    // Selector Styles
    selectorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectorLabel: {
        fontSize: 14,
        color: '#0A0C11', // Overridden
        fontWeight: '500',
    },
    selectorRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedValue: {
        fontSize: 12,
        color: '#0A0C1199', // Overridden
    },
    optionsList: {
        marginTop: 16,
        gap: 12,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    switchWrapper: {
        // borderRadius: 16, // Typical pill radius
        // borderWidth: 1,
        // borderColor: '#E0E0E0',
        overflow: 'hidden',
        backfaceVisibility: 'hidden',
        // Note: Size isn't strictly fixed, it wraps the switch.
        // We might need padding if the switch clips or looks tight.
        padding: 2,
        backgroundColor: 'transparent',
    },
    optionText: {
        fontSize: 14,
        color: '#0A0C11B2', // Overridden
    },
    selectedOptionText: {
        color: '#0A0C11',
        fontWeight: '600',
    },

    doneButton: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

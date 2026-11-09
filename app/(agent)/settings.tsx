import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    const [accountSwitch, setAccountSwitch] = useState(true);
    const [showAd, setShowAd] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(true);


    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [passwordModalTarget, setPasswordModalTarget] = useState<string | null>(null);
    const [password, setPassword] = useState('');


    const switchTrackColor = { false: isDarkMode ? colors.border : "white", true: isDarkMode ? colors.border : "white" };

    const renderSwitch = (value: boolean, setValue: (val: boolean) => void) => (
        <View style={styles.switchWrapper}>
            <Switch
                trackColor={switchTrackColor}
                thumbColor={value ? "#0E6F6A" : "#A3A3A3"}
                ios_backgroundColor={isDarkMode ? colors.border : "white"}
                className='shadow-sm'
                onValueChange={setValue}
                value={value}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} />

            <CustomNavBar title={t('settings')} backgroundColor={isDarkMode ? colors.navbarBackground : "#0E6F6A0D"} textColor={colors.textSecondary} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                {/* Background Gradient */}
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    <View style={styles.listContainer}>


                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} onPress={() => router.push('/about')}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="user" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textSecondary }]}>{t('about')}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
                            onPress={() => {
                                setPasswordModalTarget('/(agent)/changePassword');
                                setIsPasswordModalVisible(true);
                            }}
                        >
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="lock" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textSecondary }]}>{t('change_password')}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} onPress={() => router.push('/(agent)/notification-settings')}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="bell" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textSecondary }]}>{t('notifications')}</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="user" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textSecondary }]}>{t('account_switch')}</Text>
                            </View>
                            {renderSwitch(accountSwitch, setAccountSwitch)}
                        </View>

                        <TouchableOpacity
                            style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
                            onPress={() => {
                                setPasswordModalTarget('/(agent)/biometrics');
                                setIsPasswordModalVisible(true);
                            }}
                        >
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Ionicons name="finger-print-outline" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textSecondary }]}>{t('biometrics')}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} onPress={() => router.push('/(agent)/archiving')}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="download" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textSecondary }]}>{t('archiving')}</Text>
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} onPress={() => router.push('/(agent)/accessibility')}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="eye" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textSecondary }]}>{t('accessibility')}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Grouped Toggles Container */}
                        <View style={[styles.groupedContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            {/* Show Ad After Login */}
                            <View style={styles.groupedItem}>
                                {/* Added paddingLeft to indent text to match Icon+Gap alignment if desired, or just keep as requested */}
                                <Text style={[styles.listItemLabel, { marginLeft: 0, color: colors.textSecondary }]}>{t('show_ad')}</Text>
                                {renderSwitch(showAd, setShowAd)}
                            </View>

                            {/* Show What's New */}
                            <View style={styles.groupedItem}>
                                <Text style={[styles.listItemLabel, { marginLeft: 0, color: colors.textSecondary }]}>{t('show_whats_new')}</Text>
                                {renderSwitch(showWhatsNew, setShowWhatsNew)}
                            </View>
                        </View>

                    </View>

                    {/* Delete Profile Button */}
                    <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.card, borderColor: colors.textMuted }]} onPress={() => setIsDeleteModalVisible(true)}>
                        <Text style={styles.deleteButtonText}>{t('delete_profile')}</Text>
                    </TouchableOpacity>

                </ScrollView>
            </View>

            {/* Delete Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isDeleteModalVisible}
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
                    <BlurView
                        intensity={20}
                        tint="dark"
                        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}
                    />
                    <View style={[styles.deleteModalContent, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setIsDeleteModalVisible(false)}
                        >
                            <Feather name="x" size={20} color="#0A0C11B2" />
                        </TouchableOpacity>

                        <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>{t('delete_confirmation')}</Text>
                        <Text style={[styles.modalDescription, { color: colors.textMuted }]}>
                            {t('delete_warning')}
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButtonYes, { backgroundColor: colors.inputBackground }]} onPress={() => setIsDeleteModalVisible(false)}>
                                <Text style={[styles.modalButtonYesText, { color: colors.text }]}>{t('yes')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButtonNo} onPress={() => setIsDeleteModalVisible(false)}>
                                <Text style={styles.modalButtonNoText}>{t('no')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isPasswordModalVisible}
                onRequestClose={() => setIsPasswordModalVisible(false)}
            >
                <BlurView
                    intensity={20}
                    tint="dark"
                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                    style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}
                />
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsPasswordModalVisible(false)}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>{t('input_password')}</Text>
                            <TouchableOpacity onPress={() => setIsPasswordModalVisible(false)} style={styles.closeWrapper}>
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

                        <View style={{ width: '100%', gap: 8, marginBottom: 24 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted }}>{t('input_password')}</Text>
                            <TextInput
                                style={[styles.passwordInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder={t('input_password')}
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.passwordSubmitButton}
                            onPress={() => {
                                setIsPasswordModalVisible(false);
                                if (passwordModalTarget) {
                                    router.push(passwordModalTarget as any);
                                }
                                setPassword('');
                            }}
                        >
                            <Text style={styles.passwordSubmitButtonText}>{t('submit')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
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
        backgroundColor: 'white', // Light green bg
        paddingLeft: 10,
        paddingRight: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 16,
        paddingBottom: 40,
    },
    listContainer: {
        gap: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    groupedContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        overflow: 'hidden',
        padding: 10,
        paddingHorizontal: 16,
    },
    groupedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 28, // 28x28
        height: 28,
        borderRadius: 6, // Rectangle with slight radius
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    listItemLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0A0C11B2',
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
    deleteButton: {
        marginTop: 32,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#0A0C1169', // Opaque color
        borderRadius: 12,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#BC3434', // Updated color
        fontSize: 14,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: '#4342421A',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingTop: 16,
        paddingBottom: 40,
        height: 'auto',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
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
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0A0C11B2',
        textAlign: 'left',
    },
    passwordInput: {
        height: 48,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        fontSize: 14,
        color: '#0A0C11',
    },
    passwordSubmitButton: {
        width: '100%',
        height: 52,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    passwordSubmitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    // Delete Modal specifics (reusing above where possible or keeping separate if vastly different)
    deleteModalContent: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        position: 'relative',
        alignSelf: 'center',
        marginTop: height * 0.35, // Centered manually or flex centered in overlay
    },
    closeModalButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    modalDescription: {
        fontSize: 14,
        color: '#0A0C1199',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    modalButtonYes: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonYesText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0A0C11',
    },
    modalButtonNo: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonNoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

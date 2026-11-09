import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    const [accountSwitch, setAccountSwitch] = useState(true);
    const [showAd, setShowAd] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(true);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

    const switchTrackColor = { false: colors.inputBackground, true: colors.inputBackground };

    const renderSwitch = (value: boolean, setValue: (val: boolean) => void) => (
        <View style={styles.switchWrapper}>
            <Switch
                trackColor={switchTrackColor}
                thumbColor={value ? "#0E6F6A" : "#A3A3A3"}
                ios_backgroundColor="white"
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

            <CustomNavBar title="Settings" backgroundColor={colors.navbarBackground} textColor={colors.text} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    <View style={styles.listContainer}>


                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} onPress={() => router.push('/(farmers)/about')}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="user" size={16} color={colors.textMuted} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textMuted }]}>About</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} onPress={() => router.push('/(farmers)/changePassword')}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="lock" size={16} color={colors.textMuted} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textMuted }]}>Change Password</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="bell" size={16} color={colors.textMuted} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textMuted }]}>Notifications</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="user" size={16} color={colors.textMuted} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textMuted }]}>Account on/off switch</Text>
                            </View>
                            {renderSwitch(accountSwitch, setAccountSwitch)}
                        </View>

                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Ionicons name="finger-print-outline" size={16} color={colors.textMuted} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textMuted }]}>Biometrics</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <Feather name="download" size={16} color={colors.textMuted} />
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textMuted }]}>Archiving & Downloading</Text>
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity style={[styles.listItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]} onPress={() => router.push('/(farmers)/accessibility')}>
                            <View style={styles.listItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <View style={{ transform: [{ scaleX: -1 }] }}>
                                        <Feather name="user" size={16} color={colors.textMuted} />
                                    </View>
                                </View>
                                <Text style={[styles.listItemLabel, { color: colors.textMuted }]}>Accessibility, Display and Languages</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Grouped Toggles Container */}
                        <View style={[styles.groupedContainer, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            {/* Show Ad After Login */}
                            <View style={styles.groupedItem}>
                                {/* Added paddingLeft to indent text to match Icon+Gap alignment if desired, or just keep as requested */}
                                <Text style={[styles.listItemLabel, { marginLeft: 0, color: colors.textMuted }]}>Show Ad After Login</Text>
                                {renderSwitch(showAd, setShowAd)}
                            </View>

                            {/* Show What's New */}
                            <View style={styles.groupedItem}>
                                <Text style={[styles.listItemLabel, { marginLeft: 0, color: colors.textMuted }]}>Show What's New</Text>
                                {renderSwitch(showWhatsNew, setShowWhatsNew)}
                            </View>
                        </View>

                    </View>

                    {/* Delete Profile Button */}
                    <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.card, borderColor: colors.textMuted }]} onPress={() => setIsDeleteModalVisible(true)}>
                        <Text style={styles.deleteButtonText}>DELETE PROFILE</Text>
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
                <View style={styles.modalOverlay}>
                    <BlurView
                        intensity={20}
                        tint={isDarkMode ? 'dark' : 'light'}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setIsDeleteModalVisible(false)}
                        >
                            <Feather name="x" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        <Text style={[styles.modalTitle, { color: colors.text }]}>Are you sure you want to delete</Text>
                        <Text style={[styles.modalDescription, { color: colors.textMuted }]}>
                            For security reasons, you need to change your password before continuing.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButtonYes, { backgroundColor: colors.inputBackground }]} onPress={() => setIsDeleteModalVisible(false)}>
                                <Text style={[styles.modalButtonYesText, { color: colors.text }]}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButtonNo} onPress={() => setIsDeleteModalVisible(false)}>
                                <Text style={styles.modalButtonNoText}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 125,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        overflow: 'hidden',
        // backgroundColor: 'white', // Light green bg
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
        // backgroundColor: '#FFFFFF',
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
        // backgroundColor: '#FFFFFF',
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
        // backgroundColor: '#FFFFFF',
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
        // color: '#0A0C11B2',
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
        // backgroundColor: '#FFFFFF',
        borderWidth: 1,
        // borderColor: '#0A0C1169', // Opaque color
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        width: width * 0.85,
        // backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        position: 'relative',
    },
    closeModalButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#0A0C11',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 14,
        // color: '#0A0C1199',
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
        // backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonYesText: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
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

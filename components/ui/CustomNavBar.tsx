import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { useLogout, useMe } from '../../hooks/api/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const AVATAR_IMAGE = require('../../assets/images/whoLogin2.png');

interface CustomNavBarProps {
    title?: string;
    backgroundColor?: string;
    textColor?: string;
    blurIntensity?: number;
}

export default function CustomNavBar({ title, backgroundColor = '#FFFFFF4D', textColor = '#0A0C11B2', blurIntensity = 20 }: CustomNavBarProps) {
    const { toggleSidebar } = useSidebar();
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);

    const { data: meData } = useMe();

    const profileName = React.useMemo(() => {
        const staff = meData?.staff;
        if (staff?.firstName) {
            return `${staff.firstName} ${staff.lastName || ''}`.trim();
        }
        return meData?.email || 'VCM Field Officer';
    }, [meData]);

    const profileRole = meData?.role === 'staff' ? 'Field Agent (VCM)' : meData?.role || 'VCM - AgriGATE';

    const closeAll = () => {
        setShowNotifDropdown(false);
        setShowProfileDropdown(false);
        setShowLocationDropdown(false);
    };

    const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'tasks' | 'system'>('all');

    const logoutMutation = useLogout();

    const handleLogout = () => {
        closeAll();
        Alert.alert(
            t('logout_confirm_title') || 'Logout',
            t('logout_confirm_msg') || 'Are you sure you want to log out?',
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('log_out') || 'Log Out',
                    style: 'destructive',
                    onPress: () => logoutMutation.mutate(),
                },
            ]
        );
    };

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={[styles.shadowContainer, { backgroundColor: Platform.OS === 'android' && blurIntensity > 0 ? 'transparent' : backgroundColor, shadowColor: isDarkMode ? '#FFFFFF' : '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDarkMode ? 0.15 : 0.2, shadowRadius: 12, elevation: 8 }]}>
                <View style={[styles.container]}>
                    <BlurView
                        intensity={Platform.OS === 'android' ? (blurIntensity === 0 ? 0 : 25) : blurIntensity}
                        tint={colors.blurTint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && blurIntensity > 0 && { backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.2)' }]}
                    />

                    <View style={styles.contentContainer}>
                        {/* Left: Hamburger */}
                        <TouchableOpacity onPress={toggleSidebar} style={{ zIndex: 2 }}>
                            <Feather name="menu" size={28} color={textColor} />
                        </TouchableOpacity>

                        {/* Center: Title / Location */}
                        <View style={styles.titleContainer}>
                            <View style={styles.titleContent}>
                                <Text style={[styles.title, { color: textColor }]}>{title || 'AgriGATE'}</Text>
                            </View>
                        </View>

                        {/* Right: Actions */}
                        <View style={styles.rightActions}>
                            {/* Notification Icon */}
                            <TouchableOpacity
                                style={[styles.iconContainer, { backgroundColor: colors.card }]}
                                onPress={() => {
                                    closeAll();
                                    setShowNotifDropdown(!showNotifDropdown);
                                }}
                            >
                                <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
                                <View style={styles.notifBadge}>
                                    <Text style={{ color: 'white', fontSize: 7, fontWeight: 'bold' }}>3</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Avatar */}
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={() => {
                                    closeAll();
                                    setShowProfileDropdown(!showProfileDropdown);
                                }}
                            >
                                <Image
                                    source={meData?.avatarUri ? { uri: meData.avatarUri } : AVATAR_IMAGE}
                                    style={styles.avatar}
                                    contentFit="cover"
                                />
                                <View style={styles.onlineDot} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* LOCATION DROPDOWN */}
            {showLocationDropdown && (
                <View style={[styles.dropdown, styles.locationDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.dropdownTitleHeader} onPress={closeAll}>
                        <Text style={[styles.dropdownTitleText, { color: colors.text }]}>AgriGATE</Text>
                        <Feather name="chevron-up" size={18} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.searchContainer}>
                        <Feather name="search" size={16} color={colors.textMuted} />
                        <TextInput
                            placeholder="Search location"
                            placeholderTextColor={colors.textMuted}
                            style={[styles.searchInput, { color: colors.text }]}
                        />
                    </View>

                    <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                        <View style={styles.locationItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.locationName, { color: colors.text }]}>AgriGATE</Text>
                                <Text style={[styles.locationSub, { color: colors.textMuted }]}>Current Location</Text>
                            </View>
                            <Feather name="check" size={18} color="#0E6F6A" />
                        </View>
                        <View style={styles.locationItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.locationName, { color: colors.text }]}>Giwa Community</Text>
                                <Text style={[styles.locationSub, { color: colors.textMuted }]}>Kaduna State</Text>
                            </View>
                        </View>
                        <View style={styles.locationItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.locationName, { color: colors.text }]}>Gaci Community</Text>
                                <Text style={[styles.locationSub, { color: colors.textMuted }]}>Kaduna State</Text>
                            </View>
                        </View>
                        <View style={styles.locationItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.locationName, { color: colors.text }]}>Rafin Zurfi</Text>
                                <Text style={[styles.locationSub, { color: colors.textMuted }]}>Zaria, Kaduna</Text>
                            </View>
                        </View>
                        <View style={[styles.locationItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <Text style={[styles.locationName, { color: colors.text }]}>All Locations</Text>
                        </View>
                    </ScrollView>

                    <View style={[styles.locationFooter, { borderTopColor: colors.border }]}>
                        <Ionicons name="settings-outline" size={16} color={colors.text} />
                        <Text style={[styles.manageLocText, { color: colors.text }]}>Manage Locations</Text>
                    </View>
                </View>
            )}

            {/* NOTIFICATION DROPDOWN */}
            {showNotifDropdown && (
                <View style={[styles.dropdown, styles.notifDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.dropdownHeader}>
                        <Text style={[styles.dropdownTitle, { color: colors.text }]}>Notifications</Text>
                        <TouchableOpacity><Ionicons name="settings-outline" size={20} color={colors.textMuted} /></TouchableOpacity>
                    </View>

                    <View style={styles.notifTabsRow}>
                        <TouchableOpacity onPress={() => setActiveNotifTab('all')} style={activeNotifTab === 'all' ? styles.notifTabActive : styles.notifTabInactive}>
                            <Text style={activeNotifTab === 'all' ? styles.notifTabActiveText : styles.notifTabInactiveText}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveNotifTab('tasks')} style={activeNotifTab === 'tasks' ? styles.notifTabActive : styles.notifTabInactive}>
                            <Text style={activeNotifTab === 'tasks' ? styles.notifTabActiveText : styles.notifTabInactiveText}>Tasks</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveNotifTab('system')} style={activeNotifTab === 'system' ? styles.notifTabActive : styles.notifTabInactive}>
                            <Text style={activeNotifTab === 'system' ? styles.notifTabActiveText : styles.notifTabInactiveText}>System</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                        <View style={{ padding: 24, alignItems: 'center' }}>
                            <Ionicons name="notifications-outline" size={36} color={colors.textMuted} />
                            <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 13 }}>No unread notifications</Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={[styles.markAllBtn, { borderTopColor: colors.border }]}>
                        <Feather name="check" size={16} color="#065F46" />
                        <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* PROFILE DROPDOWN */}
            {showProfileDropdown && (
                <View style={[styles.dropdown, styles.profileDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 4, marginBottom: 8 }} onPress={closeAll}>
                        <Feather name="x" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={styles.profileHeaderLayout}>
                        <Image source={meData?.avatarUri ? { uri: meData.avatarUri } : AVATAR_IMAGE} style={styles.profileAvatarBig} contentFit="cover" />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.profileNameBold, { color: colors.text }]}>{profileName}</Text>
                            <Text style={[styles.profileRoleText, { color: colors.textMuted }]}>{profileRole}</Text>
                            <TouchableOpacity onPress={() => { closeAll(); router.push('/(agent)/profile'); }}>
                                <Text style={styles.viewProfileGreen}>View Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.profileMenuItem} onPress={() => { closeAll(); router.push('/(agent)/profile'); }}>
                        <Ionicons name="person-outline" size={18} color={colors.text} />
                        <Text style={[styles.profileMenuText, { color: colors.text }]}>My Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileMenuItem}>
                        <Ionicons name="lock-closed-outline" size={18} color={colors.text} />
                        <Text style={[styles.profileMenuText, { color: colors.text }]}>Change Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileMenuItem} onPress={() => { closeAll(); router.push('/(agent)/settings'); }}>
                        <Ionicons name="settings-outline" size={18} color={colors.text} />
                        <Text style={[styles.profileMenuText, { color: colors.text }]}>App Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileMenuItem}>
                        <Ionicons name="globe-outline" size={18} color={colors.text} />
                        <Text style={[styles.profileMenuText, { color: colors.text }]}>Language</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={[styles.profileMenuBadge, { color: colors.textMuted }]}>English</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileMenuItem}>
                        <Ionicons name="help-circle-outline" size={18} color={colors.text} />
                        <Text style={[styles.profileMenuText, { color: colors.text }]}>Help & Support</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileMenuItem}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.text} />
                        <Text style={[styles.profileMenuText, { color: colors.text }]}>About App</Text>
                    </TouchableOpacity>

                    <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.profileMenuItem} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                        <Text style={[styles.profileMenuText, { color: '#EF4444' }]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Backdrop to dismiss */}
            {(showNotifDropdown || showProfileDropdown || showLocationDropdown) && (
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.backdrop}
                    onPress={closeAll}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 10,
    },
    shadowContainer: {
        width: width * 0.95,
        height: 62,
        marginTop: 10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    container: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        position: 'relative',
    },
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    titleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 2,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notifBadge: {
        position: 'absolute',
        top: 6,
        right: 8,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 19,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22C55E',
        borderWidth: 1.5,
        borderColor: 'white',
    },
    // Dropdowns
    backdrop: {
        position: 'absolute',
        top: 0,
        left: -width,
        right: -width,
        bottom: -height * 2,
        zIndex: 98,
    },
    dropdown: {
        position: 'absolute',
        top: 110,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 20,
        zIndex: 99,
        padding: 16,
    },

    // Location Dropdown
    locationDropdown: {
        width: 250,
        alignSelf: 'center',
        top: 80,
    },
    dropdownTitleHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        gap: 6
    },
    dropdownTitleText: {
        fontSize: 16,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
        gap: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        margin: 0,
        padding: 0
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    locationName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2
    },
    locationSub: {
        fontSize: 12,
    },
    locationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 1,
        gap: 8
    },
    manageLocText: {
        fontSize: 13,
        fontWeight: '600'
    },

    // Notification Dropdown
    notifDropdown: {
        width: 300,
        right: 16,
        paddingTop: 20,
        paddingHorizontal: 0,
        paddingBottom: 0
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    notifTabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 12
    },
    notifTabActive: {
        backgroundColor: '#065F46',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    notifTabActiveText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    notifTabInactive: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6
    },
    notifTabInactiveText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '600',
    },
    tabBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800' // Changed to valid weight string
    },
    notifDateHeader: {
        fontSize: 13,
        fontWeight: '700',
        paddingHorizontal: 20,
        marginTop: 4,
        marginBottom: 8
    },
    notifListItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
        alignItems: 'flex-start'
    },
    notifListIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    notifListTitle: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 4
    },
    notifListTime: {
        fontSize: 11,
        color: '#6B7280'
    },
    notifUnreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6
    },
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        marginTop: 8,
        gap: 8
    },
    markAllText: {
        color: '#065F46',
        fontSize: 14,
        fontWeight: '700'
    },

    // Profile Dropdown
    profileDropdown: {
        width: 250,
        right: 16,
        padding: 16,
    },
    profileHeaderLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 16,
    },
    profileAvatarBig: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    profileNameBold: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2
    },
    profileRoleText: {
        fontSize: 12,
        marginBottom: 6
    },
    viewProfileGreen: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16A34A' // Green shade mimicking the design
    },
    profileDivider: {
        height: 1,
        width: '100%',
        marginVertical: 8
    },
    profileMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12
    },
    profileMenuText: {
        fontSize: 14,
        fontWeight: '500'
    },
    profileMenuBadge: {
        fontSize: 12,
    }
});

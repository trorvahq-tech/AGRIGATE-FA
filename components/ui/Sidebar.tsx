import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.65; // Slightly reduced width
const AVATAR_IMAGE = require('../../assets/images/whoLogin2.png');

import Modal from 'react-native-modal';
import { useLogout, useMe } from '../../hooks/api/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncStatus } from '../../services/syncService';

export default function Sidebar() {
    const { isOpen, closeSidebar } = useSidebar();
    const { isDarkMode, colors, setTheme } = useTheme();
    const { t } = useTranslation();
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const router = useRouter();
    const pathname = usePathname();
    const logoutMutation = useLogout();
    const [isLogoutModalVisible, setLogoutModalVisible] = React.useState(false);
    const [isSyncModalVisible, setSyncModalVisible] = React.useState(false);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const syncRotation = useRef(new Animated.Value(0)).current;
    const { lastSyncFull, recordSync } = useSyncStatus();
    const { data: meData } = useMe(true);
    const profileName = React.useMemo(() => {
        const staff = meData?.staff;
        if (staff?.firstName) {
            return `${staff.firstName} ${staff.lastName || ''}`.trim();
        }
        return meData?.email || 'VCM Field Officer';
    }, [meData]);

    const profileEmail = meData?.email || 'officer@agrigate.com';

    const startSyncAnimation = () => {
        syncRotation.setValue(0);
        Animated.loop(
            Animated.timing(syncRotation, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const stopSyncAnimation = () => {
        syncRotation.stopAnimation();
    };

    const handleSync = async () => {
        setIsSyncing(true);
        startSyncAnimation();
        await recordSync();
        setIsSyncing(false);
        stopSyncAnimation();
    };

    const spin = syncRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const isRouteActive = (route: string) => {
        if (route === '/(agent)' && pathname === '/') return true;
        return pathname === route || pathname === route.replace('/(agent)', '');
    };

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const handleNavigation = (route: string) => {
        closeSidebar();
        router.push(route as any);
    };

    const toggleLogoutModal = () => {
        setLogoutModalVisible(!isLogoutModalVisible);
    };

    const confirmLogout = () => {
        toggleLogoutModal();
        closeSidebar();
        logoutMutation.mutate();
    };

    return (
        <View style={[styles.container, !isOpen && { pointerEvents: 'none' }]}>
            {/* Blur Overlay */}
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <BlurView
                    intensity={20}
                    tint="dark"
                    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                    style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={closeSidebar}
                />
            </Animated.View>

            {/* Sidebar Content */}
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }, { backgroundColor: colors.sidebarBackground }]}>
                <View style={styles.sidebarContent}>

                    {/* Header / Profile Card */}
                    <TouchableOpacity 
                        style={[styles.card, { backgroundColor: colors.card }]}
                        onPress={() => handleNavigation('/(agent)/profile')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.profileRow}>
                            <Image source={meData?.avatarUri ? { uri: meData.avatarUri } : AVATAR_IMAGE} style={styles.avatar} />
                            <View style={styles.profileInfo}>
                                 <Text style={[styles.profileName, { color: colors.text }]}>{profileName}</Text>
                                 <Text style={[styles.profileEmail, { color: colors.textMuted }]} numberOfLines={1}>{profileEmail}</Text>
                            </View>
                            <TouchableOpacity onPress={closeSidebar} style={[styles.closeButton, { borderColor: colors.border }]}>
                                <Ionicons name="close" size={16} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>

                    {/* Scrollable Menu Items — Flat list matching field-ops structure */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                        style={{ flex: 1 }}
                    >
                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            {[
                                { route: '/(agent)', label: t('home'), icon: 'home', type: 'feather' as const },
                                { route: '/(agent)/tasks', label: t('tasks'), icon: 'clipboard-outline', type: 'ionicons' as const, badge: 5 },
                                { route: '/(agent)/farmers', label: t('farmers'), icon: 'users', type: 'feather' as const },
                                { route: '/(agent)/farms', label: t('farms'), icon: 'leaf-outline', type: 'ionicons' as const },
                                { route: '/(agent)/reports', label: t('season_tracker'), icon: 'calendar-outline', type: 'ionicons' as const },
                                { route: '/(agent)/vcmScorecard', label: t('scorecard') || 'Scorecard', icon: 'cash-outline', type: 'ionicons' as const },
                                { route: '/(agent)/mtgGroups', label: t('groups_mtg'), icon: 'users', type: 'feather' as const },
                                { route: '/(agent)/demoPlots', label: t('demo_plots'), icon: 'sparkles-outline', type: 'ionicons' as const },
                                { route: '/(agent)/kwali', label: 'Kwali', icon: 'map-outline', type: 'ionicons' as const },
                            ].map((item, index) => {
                                const active = isRouteActive(item.route);
                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[styles.menuItem, active && styles.menuItemActive]} 
                                        onPress={() => handleNavigation(item.route)}
                                    >
                                        {item.type === 'feather' ? (
                                            <Feather name={item.icon as any} size={16} color={active ? colors.primary : colors.textMuted} />
                                        ) : (
                                            <Ionicons name={item.icon as any} size={16} color={active ? colors.primary : colors.textMuted} />
                                        )}
                                        <Text style={[
                                            styles.menuText, 
                                            { 
                                                color: active ? colors.text : colors.textMuted,
                                                fontWeight: active ? '700' : '500'
                                            }
                                        ]}>
                                            {item.label}
                                        </Text>
                                        {item.badge && (
                                            <View style={[styles.menuBadge, { backgroundColor: colors.primary }]}>
                                                <Text style={styles.menuBadgeText}>{item.badge}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                            {/* Notifications */}
                            <TouchableOpacity 
                                style={[styles.menuItem, isRouteActive('/(agent)/notifications') && styles.menuItemActive]} 
                                onPress={() => handleNavigation('/(agent)/notifications')}
                            >
                                <Ionicons name="notifications-outline" size={16} color={isRouteActive('/(agent)/notifications') ? colors.primary : colors.textMuted} />
                                <Text style={[
                                    styles.menuText, 
                                    { 
                                        color: isRouteActive('/(agent)/notifications') ? colors.text : colors.textMuted,
                                        fontWeight: isRouteActive('/(agent)/notifications') ? '700' : '500'
                                    }
                                ]}>
                                    {t('notifications')}
                                </Text>
                                <View style={[styles.menuBadge, { backgroundColor: '#EF4444' }]}>
                                    <Text style={styles.menuBadgeText}>3</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Settings */}
                            <TouchableOpacity 
                                style={[styles.menuItem, isRouteActive('/(agent)/settings') && styles.menuItemActive]} 
                                onPress={() => handleNavigation('/(agent)/settings')}
                            >
                                <Feather name="settings" size={16} color={isRouteActive('/(agent)/settings') ? colors.primary : colors.textMuted} />
                                <Text style={[
                                    styles.menuText, 
                                    { 
                                        color: isRouteActive('/(agent)/settings') ? colors.text : colors.textMuted,
                                        fontWeight: isRouteActive('/(agent)/settings') ? '700' : '500'
                                    }
                                ]}>
                                    {t('settings')}
                                </Text>
                            </TouchableOpacity>

                            {/* Help */}
                            <TouchableOpacity 
                                style={[styles.menuItem, isRouteActive('/(agent)/helpCenter') && styles.menuItemActive]} 
                                onPress={() => handleNavigation('/(agent)/helpCenter')}
                            >
                                <Feather name="help-circle" size={16} color={isRouteActive('/(agent)/helpCenter') ? colors.primary : colors.textMuted} />
                                <Text style={[
                                    styles.menuText, 
                                    { 
                                        color: isRouteActive('/(agent)/helpCenter') ? colors.text : colors.textMuted,
                                        fontWeight: isRouteActive('/(agent)/helpCenter') ? '700' : '500'
                                    }
                                ]}>
                                    {t('help_center')}
                                </Text>
                            </TouchableOpacity>

                        </View>
                    </ScrollView>
                    {/* Sync Now Button */}
                    <TouchableOpacity 
                        style={[styles.syncButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                        onPress={() => setSyncModalVisible(true)}
                    >
                        <Feather name="refresh-cw" size={16} color={colors.text} />
                        <Text style={[styles.syncButtonText, { color: colors.text }]}>{t('sync_now')}</Text>
                    </TouchableOpacity>

                    {/* Help Center - Fixed above footer */}
                    <TouchableOpacity style={[styles.helpCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]} onPress={() => handleNavigation('/(agent)/helpCenter')}>
                        <View style={[styles.helpIconBg, { backgroundColor: colors.card }]}>
                            <Ionicons name="chatbubble-ellipses" size={20} color="#0E6F6A" />
                        </View>
                        <View style={styles.helpContent}>
                            <Text style={[styles.helpTitle, { color: colors.textSecondary }]}>{t('help_center')}</Text>
                            <Text style={[styles.helpSubtitle, { color: colors.textSecondary }]}>{t('answers_here')}</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={[styles.themeToggleContainer, { backgroundColor: colors.cardSecondary }]}>
                            <View style={[styles.themeToggle, { backgroundColor: colors.border }]}>
                                <TouchableOpacity
                                    style={[styles.themeBtn, !isDarkMode && styles.themeBtnActive, !isDarkMode && { backgroundColor: colors.card }]}
                                    onPress={() => setTheme('light')}
                                >
                                    <Feather name="sun" size={14} color={!isDarkMode ? colors.text : colors.textMuted} />
                                    <Text style={!isDarkMode ? [styles.themeTextActive, { color: colors.text }] : [styles.themeText, { color: colors.textMuted }]}>{t('light')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.themeBtn, isDarkMode && styles.themeBtnActive, isDarkMode && { backgroundColor: colors.card }]}
                                    onPress={() => setTheme('dark')}
                                >
                                    <Feather name="moon" size={14} color={isDarkMode ? colors.text : colors.textMuted} />
                                    <Text style={isDarkMode ? [styles.themeTextActive, { color: colors.text }] : [styles.themeText, { color: colors.textMuted }]}>{t('dark')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.logoutBtn, { backgroundColor: colors.cardSecondary }]}
                            onPress={toggleLogoutModal}
                            disabled={logoutMutation.isPending}
                        >
                            <Feather name="log-out" size={20} color="#EF4444" />
                            <Text style={styles.logoutText}>
                                {logoutMutation.isPending ? t('logging_out') + '...' : t('log_out')}
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.versionText, { color: colors.textSecondary }]}>{t('version')} 1.01</Text>
                    </View>

                </View>
            </Animated.View>

            {/* Logout Confirmation Modal */}
            <Modal
                isVisible={isLogoutModalVisible}
                onBackdropPress={toggleLogoutModal}
                onBackButtonPress={toggleLogoutModal}
                backdropOpacity={0.5}
                animationIn="zoomIn"
                animationOut="zoomOut"
                useNativeDriver
                hideModalContentWhileAnimating
            >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <Feather name="log-out" size={28} color="#EF4444" />
                    </View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('logout_confirm_title') || 'Logout'}</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                        {t('logout_confirm_msg') || 'Are you sure you want to log out?'}
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: colors.border }]}
                            onPress={toggleLogoutModal}
                        >
                            <Text style={[styles.modalBtnText, { color: colors.text }]}>{t('cancel') || 'Cancel'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtn, styles.modalBtnLogout]}
                            onPress={confirmLogout}
                        >
                            <Text style={[styles.modalBtnText, { color: 'white' }]}>{t('log_out')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Sync Status Modal */}
            <Modal
                isVisible={isSyncModalVisible}
                onBackdropPress={() => !isSyncing && setSyncModalVisible(false)}
                onBackButtonPress={() => !isSyncing && setSyncModalVisible(false)}
                backdropOpacity={0.4}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                style={{ margin: 0, justifyContent: 'flex-end' }}
                useNativeDriver
                hideModalContentWhileAnimating
            >
                <View style={[styles.syncModalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHandle} />
                    
                    <View style={styles.syncModalHeader}>
                        <Text style={[styles.syncModalTitle, { color: colors.text }]}>Sync Status</Text>
                        {!isSyncing && (
                            <TouchableOpacity onPress={() => setSyncModalVisible(false)}>
                                <Feather name="x" size={22} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.syncStatusBanner, isSyncing && { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
                        <View style={[styles.syncStatusIconBg, isSyncing && { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                            {isSyncing ? (
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Ionicons name="sync" size={24} color={colors.primary} />
                                </Animated.View>
                            ) : (
                                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                            )}
                        </View>
                        <View>
                            <Text style={[styles.syncStatusTitle, { color: colors.text }]}>
                                {isSyncing ? 'Syncing data...' : 'All data is up to date'}
                            </Text>
                            <Text style={[styles.syncStatusSubtitle, { color: colors.textMuted }]}>
                                {isSyncing ? 'Please wait while we update your records' : `Last synced ${lastSyncFull}`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.syncDetailsContainer}>
                        <View style={styles.syncDetailRow}>
                            <Text style={[styles.syncDetailName, { color: colors.text }]}>Farmers</Text>
                            <View style={styles.syncDetailRight}>
                                <Text style={[styles.syncDetailValue, { color: colors.text }]}>128</Text>
                                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                            </View>
                        </View>
                        
                        <View style={styles.syncDetailRow}>
                            <Text style={[styles.syncDetailName, { color: colors.text }]}>Farms</Text>
                            <View style={styles.syncDetailRight}>
                                <Text style={[styles.syncDetailValue, { color: colors.text }]}>156</Text>
                                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                            </View>
                        </View>
                        
                        <View style={[styles.syncDetailRow, { borderBottomWidth: 0 }]}>
                            <Text style={[styles.syncDetailName, { color: colors.text }]}>Activities & Forms</Text>
                            <View style={styles.syncDetailRight}>
                                <Text style={[styles.syncDetailValue, { color: colors.text }]}>431</Text>
                                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.syncNowActionBtn, isSyncing && { opacity: 0.7 }]}
                        onPress={handleSync}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <Text style={styles.syncNowActionText}>Syncing...</Text>
                        ) : (
                            <>
                                <Ionicons name="sync" size={20} color="white" />
                                <Text style={styles.syncNowActionText}>Sync Now</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        elevation: 1000,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // backgroundColor: 'rgba(0,0,0,0.5)', handled by BlurView
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: '#F3F4F6', // Light gray background
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    sidebarContent: {
        flex: 1,
        paddingTop: 50, // Screen top padding
        paddingBottom: 30,
        paddingHorizontal: 16,
        gap: 10, // Gap between cards
    },
    scrollContainer: {
        gap: 12,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 10,
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.05,
        // shadowRadius: 2,
        // elevation: 1,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 20,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 10,
    },
    profileName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0A0C11',
    },
    profileEmail: {
        fontSize: 10,
        color: '#5B616D',
    },
    closeButton: {
        width: 26,
        height: 26,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    section: {
        gap: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 10,
    },
    menuItemActive: {
        backgroundColor: 'rgba(14, 111, 106, 0.1)',
    },
    menuText: {
        fontSize: 13,
        color: '#5B616D',
        fontWeight: '500',
        flex: 1,
    },
    menuBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    menuBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    menuDivider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: 6,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    syncButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        padding: 10,
        marginBottom: 0,
        borderColor: '#E6E7EC',
        borderWidth: 1,
    },
    helpIconBg: {
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    helpContent: {
        flex: 1,
        marginLeft: 10,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    helpSubtitle: {
        fontSize: 12.53,
    },
    footer: {
        marginTop: 4,
        gap: 12,
    },
    themeToggleContainer: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        borderRadius: 15,
        padding: 10,
        marginBottom: 0,
    },
    themeToggle: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 16,
        padding: 3,
    },
    themeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 14,
        gap: 4,
    },
    themeBtnActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    themeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    themeTextActive: {
        fontSize: 11,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 15,
        padding: 12,
        width: '100%',
    },
    logoutText: {
        fontSize: 16,
        color: '#E33E40',
        fontWeight: '500',
    },
    versionText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 0,
    },
    // Modal Styles
    modalContent: {
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnCancel: {
        borderWidth: 1,
    },
    modalBtnLogout: {
        backgroundColor: '#EF4444',
    },
    modalBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Sync Modal Styles
    syncModalContent: {
        padding: 24,
        paddingBottom: 40,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    syncModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    syncModalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 10,
    },
    syncStatusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 24,
    },
    syncStatusIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    syncStatusTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    syncStatusSubtitle: {
        fontSize: 12,
    },
    syncDetailsContainer: {
        marginBottom: 32,
    },
    syncDetailsLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    syncDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    syncDetailName: {
        fontSize: 14,
        fontWeight: '500',
    },
    syncDetailRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    syncDetailValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    syncNowActionBtn: {
        height: 52,
        backgroundColor: '#065F46',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    syncNowActionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});


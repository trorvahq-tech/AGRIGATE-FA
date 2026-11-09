/**
 * CustomTabBar — Polished futuristic curved dome tab bar.
 *
 * REST:   Convex dome (bump UP) with pink + button sitting in it.
 * OPEN:   Dome crossfades to concave dip. + button scales out.
 *         Card slides up with staggered action rows.
 *         Card's bottom has a convex-down dome with X button scaling in.
 */
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
    Dimensions, Platform, Pressable, StyleSheet,
    Animated, Text, View, Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { draftService } from '../../services/draftService';

const { width, height } = Dimensions.get('window');

const H      = 64;
const BUMP_H = 18;
const R      = 28;
const PILL_W = width - 40;
const CX     = PILL_W / 2;
const SHEET_H = 195;

/* ── SVG: Convex dome (bump UP) — rest state ─────────────────── */
const domeUpPath = `
  M ${R} ${BUMP_H}
  L ${CX - 44} ${BUMP_H}
  C ${CX - 26} ${BUMP_H}, ${CX - 24} 0, ${CX} 0
  C ${CX + 24} 0, ${CX + 26} ${BUMP_H}, ${CX + 44} ${BUMP_H}
  L ${PILL_W - R} ${BUMP_H}
  A ${R} ${R} 0 0 1 ${PILL_W} ${BUMP_H + R}
  L ${PILL_W} ${BUMP_H + H - R}
  A ${R} ${R} 0 0 1 ${PILL_W - R} ${BUMP_H + H}
  L ${R} ${BUMP_H + H}
  A ${R} ${R} 0 0 1 0 ${BUMP_H + H - R}
  L 0 ${BUMP_H + R}
  A ${R} ${R} 0 0 1 ${R} ${BUMP_H}
  Z
`;

/* ── SVG: Concave dip (notch DOWN) — open state (unified Y-coordinates) ── */
const domeDownPath = `
  M ${R} ${BUMP_H}
  L ${CX - 44} ${BUMP_H}
  C ${CX - 26} ${BUMP_H}, ${CX - 24} ${BUMP_H + BUMP_H}, ${CX} ${BUMP_H + BUMP_H}
  C ${CX + 24} ${BUMP_H + BUMP_H}, ${CX + 26} ${BUMP_H}, ${CX + 44} ${BUMP_H}
  L ${PILL_W - R} ${BUMP_H}
  A ${R} ${R} 0 0 1 ${PILL_W} ${BUMP_H + R}
  L ${PILL_W} ${BUMP_H + H - R}
  A ${R} ${R} 0 0 1 ${PILL_W - R} ${BUMP_H + H}
  L ${R} ${BUMP_H + H}
  A ${R} ${R} 0 0 1 0 ${BUMP_H + H - R}
  L 0 ${BUMP_H + R}
  A ${R} ${R} 0 0 1 ${R} ${BUMP_H}
  Z
`;

/* ── SVG: Card bottom dome — convex bump DOWN, rounded corners ── */
const CARD_W = PILL_W;
const R_card = 24; // corner radius of the card bottom
const cardBottomDomePath = `
  M 0 0
  L ${CARD_W} 0
  L ${CARD_W} ${32 - R_card}
  A ${R_card} ${R_card} 0 0 1 ${CARD_W - R_card} 32
  L ${CARD_W / 2 + 44} 32
  C ${CARD_W / 2 + 26} 32, ${CARD_W / 2 + 24} ${32 + BUMP_H}, ${CARD_W / 2} ${32 + BUMP_H}
  C ${CARD_W / 2 - 24} ${32 + BUMP_H}, ${CARD_W / 2 - 26} 32, ${CARD_W / 2 - 44} 32
  L ${R_card} 32
  A ${R_card} ${R_card} 0 0 1 0 ${32 - R_card}
  Z
`;

/* ── Hidden routes ───────────────────────────────────────────── */
const HIDDEN = new Set([
    'tasks','needs-visit','needs-call','awaiting-validation','visit-farmer','call-farmer',
    'task-awaiting-validation','farmerDetails','farmDetails','addFarmTask','subplotDetails',
    'farmTabDetails','subplotTabDetails','allActivities','activityDetails','addSubplot',
    'addSubplotDetails','farmDetailsAfterSave','reportDetails','selectFarm','selectSubplots',
    'logActivities','assessFarm','about','legal','helpCenter','ticketChat','myTickets',
    'feedback','accountStatus','devices','biometrics','changePassword','notifications',
    'archiving','accessibility','register-farmer/kyc','register-farmer/personal-details',
    'register-farmer/farm-details','register-farmer/documents',
    'register-farmer/questionnaire','alerts','notification-settings','report-issue/form',
    'report-issue/index','mtgDetails','createMtg','mtgTraining','demoPlots','mtgFundingInputs',
    'mtgFundingContributions','mtgFundingReview','mtgFundingSummary','drafts','stageDetails',
    'vcmScorecard','profile','kwali',
]);

const ICON_MAP: Record<string, [string, string]> = {
    index:     ['home',          'home-outline'],
    farmers:   ['people',        'people-outline'],
    farms:     ['leaf',          'leaf-outline'],
    mtgGroups: ['people-circle', 'people-circle-outline'],
    reports:   ['calendar',      'calendar-outline'],
    settings:  ['settings',      'settings-outline'],
};
const LABEL_MAP: Record<string, string> = {
    index: 'Home', farmers: 'Farmers', farms: 'Farms',
    mtgGroups: 'MTG', reports: 'Season Tracker', settings: 'Settings',
};

/* ── Quick action items ──────────────────────────────────────── */
const ACTIONS = [
    { icon: 'bookmark-outline', bg: '#EDE7F6', ic: '#5E35B1', label: 'Drafts',     path: '/(agent)/drafts' },
    { icon: 'person-add',       bg: '#E2F2E4', ic: '#0E6F6A', label: 'Add Farmer', path: '/(agent)/register-farmer/personal-details' },
    { icon: 'people',           bg: '#FFF8E1', ic: '#F9A825', label: 'Add MTG',    path: '/(agent)/createMtg' },
] as const;

// No AnimatedSvg — wrap SVGs in Animated.View instead

export default function CustomTabBar({ state, descriptors, navigation }: any) {
    const focusedOptions = descriptors?.[state?.routes?.[state?.index]?.key]?.options || {};
    const { isDarkMode } = useTheme();
    const router = useRouter();

    const [menuOpen, setMenuOpen] = useState(false);

    /* ── Animation values ─────────────────────────────────────── */
    // Master transition 0=closed, 1=open
    const domeAnim  = useRef(new Animated.Value(0)).current;
    // Sheet slide
    const sheetY    = useRef(new Animated.Value(SHEET_H)).current;
    const sheetOpac = useRef(new Animated.Value(0)).current;
    // Backdrop
    const bgOpac    = useRef(new Animated.Value(0)).current;
    // Per-row stagger
    const row0      = useRef(new Animated.Value(0)).current;
    const row1      = useRef(new Animated.Value(0)).current;
    const row2      = useRef(new Animated.Value(0)).current;
    const rowAnims  = [row0, row1, row2];

    // Derived interpolations
    const plusScale = domeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const xScale   = domeAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
    const xRotate  = domeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    // Dome crossfade
    const domeUpOpacity   = domeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const domeDownOpacity = domeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    // Ref for stagger timeouts to prevent animation freezing
    const staggerTimeouts = useRef<any[]>([]);

    const clearStaggers = () => {
        staggerTimeouts.current.forEach(t => clearTimeout(t));
        staggerTimeouts.current = [];
    };

    const stopAll = () => {
        clearStaggers();
        domeAnim.stopAnimation();
        sheetY.stopAnimation();
        sheetOpac.stopAnimation();
        bgOpac.stopAnimation();
        rowAnims.forEach(anim => anim.stopAnimation());
    };

    const openSheet = () => {
        stopAll();
        // Reset starting values before opening animation
        domeAnim.setValue(0);
        sheetY.setValue(SHEET_H);
        sheetOpac.setValue(0);
        bgOpac.setValue(0);
        rowAnims.forEach(a => a.setValue(0));

        setMenuOpen(true);

        Animated.parallel([
            // Master dome transition
            Animated.spring(domeAnim, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }),
            // Sheet slide up
            Animated.spring(sheetY, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
            Animated.timing(sheetOpac, { toValue: 1, duration: 120, useNativeDriver: true }),
            // Backdrop
            Animated.timing(bgOpac, { toValue: 0.45, duration: 180, useNativeDriver: true }),
        ]).start();

        // Staggered entry via setTimeout so timeouts can be cleared on double-tap
        rowAnims.forEach((anim, i) => {
            const t = setTimeout(() => {
                Animated.spring(anim, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }).start();
            }, i * 60);
            staggerTimeouts.current.push(t);
        });
    };

    const closeSheet = () => {
        stopAll();

        Animated.parallel([
            Animated.spring(domeAnim, { toValue: 0, friction: 10, tension: 85, useNativeDriver: true }),
            Animated.spring(sheetY, { toValue: SHEET_H, friction: 10, tension: 85, useNativeDriver: true }),
            Animated.timing(sheetOpac, { toValue: 0, duration: 140, useNativeDriver: true }),
            Animated.timing(bgOpac, { toValue: 0, duration: 140, useNativeDriver: true }),
            // Fade rows out together
            ...rowAnims.map(a =>
                Animated.timing(a, { toValue: 0, duration: 100, useNativeDriver: true })
            ),
        ]).start(({ finished }) => {
            if (finished) {
                setMenuOpen(false);
            }
        });
    };

    if ((focusedOptions.tabBarStyle as any)?.display === 'none') return null;

    /* ── Colors ───────────────────────────────────────────────── */
    const pillBg     = isDarkMode ? 'rgba(13, 26, 16, 0.94)' : 'rgba(255, 255, 255, 0.96)';
    const pillBorder = isDarkMode ? 'rgba(14, 111, 106, 0.32)' : 'rgba(14, 111, 106, 0.28)';
    const activeCol  = '#0E6F6A';
    const inactiveCol = isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)';
    const PINK       = '#F4B5C6';
    const CARD_BG    = '#1A1A2E';

    const visibleRoutes = state.routes.filter((r: any) => {
        if (HIDDEN.has(r.name)) return false;
        if ((descriptors[r.key].options as any).href === null) return false;
        return true;
    });
    const leftRoutes  = visibleRoutes.slice(0, 3);
    const rightRoutes = visibleRoutes.slice(3, 6);

    const NavBtn = ({ route }: { route: any }) => {
        const focused = state.routes[state.index].name === route.name;
        const [ai, ii] = ICON_MAP[route.name] ?? ['help-circle', 'help-circle-outline'];
        const color = focused ? activeCol : inactiveCol;
        const label = LABEL_MAP[route.name] ?? route.name;
        const onPress = () => {
            const e = navigation?.emit ? navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }) : null;
            if (!focused && (!e || !e.defaultPrevented)) {
                navigation?.navigate ? navigation.navigate(route.name, route.params) : router.push(route.name === 'index' ? '/(agent)' : `/(agent)/${route.name}` as any);
            }
        };
        return (
            <Pressable onPress={onPress} style={st.tabBtn} accessibilityRole="button">
                <Ionicons name={(focused ? ai : ii) as any} size={22} color={color} />
                <Text style={[st.tabLabel, { color, fontFamily: focused ? 'Acorn-Bold' : 'Acorn-Regular' }]}>{label}</Text>
            </Pressable>
        );
    };

    const handleAction = (item: typeof ACTIONS[number]) => {
        closeSheet();
        setTimeout(async () => {
            if (item.label === 'Add Farmer') {
                try {
                    await draftService.startNewRegistration();
                } catch (e) {
                    console.warn('startNewRegistration error:', e);
                }
                if (navigation?.navigate) {
                    navigation.navigate('register-farmer/personal-details', { isNew: 'true' });
                } else {
                    router.navigate('/(agent)/register-farmer/personal-details' as any);
                }
            } else if (item.label === 'Drafts') {
                if (navigation?.navigate) {
                    navigation.navigate('drafts');
                } else {
                    router.navigate('/(agent)/drafts' as any);
                }
            } else {
                const routeName = item.path.replace('/(agent)/', '');
                if (navigation?.navigate) {
                    navigation.navigate(routeName);
                } else {
                    router.navigate(item.path as any);
                }
            }
        }, 150);
    };

    const bottom = Platform.OS === 'ios' ? 18 : 14;

    return (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>

            {/* ── Backdrop ─────────────────────────────────────── */}
            <Animated.View
                pointerEvents={menuOpen ? 'auto' : 'none'}
                style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: bgOpac, zIndex: 10 }]}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
            </Animated.View>

            {/* ── Quick Actions Card ──────────────────────────── */}
            <Animated.View
                pointerEvents={menuOpen ? 'auto' : 'none'}
                style={[
                    st.sheet,
                    {
                        bottom: bottom + H - 12, // shifted closer to the tab bar for a snugger look
                        left: 20,
                        width: CARD_W,
                        zIndex: 20,
                        transform: [{ translateY: sheetY }],
                        opacity: sheetOpac,
                    },
                ]}
            >
                {/* Card body */}
                <View style={st.cardBody}>
                    <Text style={st.sheetTitle}>Quick Actions</Text>

                    {/* Staggered action columns arranged horizontally */}
                    <View style={st.horizontalActionsContainer}>
                        {ACTIONS.map((item, i) => {
                            const rowAnim = rowAnims[i];
                            const translateY = rowAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
                            const opacity    = rowAnim;
                            return (
                                <Animated.View
                                    key={item.label}
                                    style={[st.horizontalActionCol, { transform: [{ translateY }], opacity }]}
                                >
                                    <Pressable
                                        onPress={() => handleAction(item)}
                                        hitSlop={12}
                                        style={({ pressed }) => [st.actionGridItem, pressed && st.actionGridItemPressed]}
                                    >
                                        <View style={[st.actionIconCircle, { backgroundColor: item.bg }]}>
                                            <Ionicons name={item.icon as any} size={28} color={item.ic} />
                                        </View>
                                        <Text style={st.actionLabel}>{item.label}</Text>
                                    </Pressable>
                                </Animated.View>
                            );
                        })}
                    </View>
                </View>

                {/* Card bottom dome — convex bump DOWN */}
                <View style={st.cardBottomDome}>
                    <Svg width={CARD_W} height={32 + BUMP_H}>
                        <Path d={cardBottomDomePath} fill={CARD_BG} />
                    </Svg>
                    {/* X button scales in from 0 → 1 */}
                    <Animated.View style={[st.xBtnWrap, { transform: [{ scale: xScale }, { rotate: xRotate }] }]}>
                        <Pressable onPress={closeSheet} hitSlop={12} style={st.xBtn}>
                            <Ionicons name="close" size={20} color="#1A1A2E" />
                        </Pressable>
                    </Animated.View>
                </View>
            </Animated.View>

            {/* ── Tab Bar ─────────────────────────────────────── */}
            <View style={[st.pillWrapper, { bottom }]} pointerEvents="box-none">

                {/* Convex dome (rest) — fades out on open */}
                <Animated.View style={[st.svgContainer, { opacity: domeUpOpacity }]}>
                    <Svg width={PILL_W + 4} height={H + BUMP_H + 4} viewBox={`-2 -2 ${PILL_W + 4} ${H + BUMP_H + 4}`}>
                        <Path d={domeUpPath} fill={pillBg} stroke={pillBorder} strokeWidth={1.5} />
                    </Svg>
                </Animated.View>

                {/* Concave dip (open) — fades in on open */}
                <Animated.View style={[st.svgContainer, { opacity: domeDownOpacity }]}>
                    <Svg width={PILL_W + 4} height={H + BUMP_H + 4} viewBox={`-2 -2 ${PILL_W + 4} ${H + BUMP_H + 4}`}>
                        <Path d={domeDownPath} fill={pillBg} stroke={pillBorder} strokeWidth={1.5} />
                    </Svg>
                </Animated.View>

                {/* Tab button row — static margin, never moves or scatters */}
                <View style={[st.tabButtonsRow, { marginTop: BUMP_H }]}>
                    {leftRoutes.map((r: any)  => <NavBtn key={r.key} route={r} />)}
                    <View style={st.gap} />
                    {rightRoutes.map((r: any) => <NavBtn key={r.key} route={r} />)}
                </View>

                {/* + button — scales out to 0 on open */}
                <Animated.View
                    pointerEvents={menuOpen ? 'none' : 'auto'}
                    style={[st.centerSlot, { transform: [{ scale: plusScale }] }]}
                >
                    <Pressable
                        onPress={() => {
                            if (!menuOpen) openSheet();
                        }}
                        hitSlop={12}
                    >
                        <View style={[st.centerBtn, { backgroundColor: PINK, shadowColor: PINK }]}>
                            <Ionicons name="add" size={24} color="#1A1A2E" />
                        </View>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

/* ── Styles ───────────────────────────────────────────────────── */
const st = StyleSheet.create({
    pillWrapper: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: H + BUMP_H,
        zIndex: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    svgContainer: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
    },
    tabButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: H,
        paddingHorizontal: 8,
    },
    tabBtn:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabLabel: { fontSize: 9, marginTop: 3 },
    gap:      { width: 62 },

    centerSlot: {
        position: 'absolute',
        top: 10,
        left: '50%',
        marginLeft: -24,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 25,
        zIndex: 100,
    },
    centerBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 25,
    },

    /* ── Card ── */
    sheet: {
        position: 'absolute',
        height: SHEET_H,
        overflow: 'visible',
    },
    cardBody: {
        flex: 1,
        backgroundColor: '#1A1A2E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 6,
        paddingBottom: 16,
    },
    cardBottomDome: {
        width: CARD_W,
        height: 32 + BUMP_H,
        position: 'relative',
        marginTop: -1, // prevents sub-pixel rendering gaps at the seam
    },
    xBtnWrap: {
        position: 'absolute',
        bottom: 6, // tiny padding gap to prevent bottom overlapping
        left: CARD_W / 2 - 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    xBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F4B5C6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F4B5C6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },

    sheetTitle: {
        fontSize: 18,
        fontFamily: 'Acorn-Bold',
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        paddingTop: 8,
        paddingBottom: 4,
    },
    horizontalActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 6,
    },
    horizontalActionCol: {
        flex: 1,
        alignItems: 'center',
    },
    actionGridItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        width: '90%',
    },
    actionGridItemPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    actionIconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 14,
        fontFamily: 'Acorn-Bold',
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
});

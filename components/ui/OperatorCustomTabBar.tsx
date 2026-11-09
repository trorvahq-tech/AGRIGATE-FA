import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OperatorCustomTabBar({ state, descriptors, navigation }: any) {
    const { colors, isDarkMode } = useTheme();
    const focusedOptions = descriptors[state.routes[state.index].key].options;


    if ((focusedOptions.tabBarStyle as any)?.display === 'none') {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={[styles.shadowContainer, { backgroundColor: colors.tabBarBackground, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                <View style={styles.tabBar}>
                    <BlurView
                        intensity={10}
                        tint={isDarkMode ? 'dark' : 'light'}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                        style={[StyleSheet.absoluteFill, Platform.OS === 'android' && { backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}
                    />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarBackground }]} />
                    {state.routes.map((route: any, index: number) => {
                        const { options } = descriptors[route.key];


                        if (['allActivities', 'activityDetails', 'reportDetails', 'about', 'legal', 'taskDetails', 'report-issue/form', 'report-issue/index'].includes(route.name)) return null;
                        if ((options as any).href === null) return null;

                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation?.emit ? navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            }) : null;

                            if (!isFocused && (!event || !event.defaultPrevented)) {
                                navigation?.navigate?.(route.name, route.params);
                            }
                        };

                        const onLongPress = () => {
                            navigation?.emit?.({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';
                        if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
                        else if (route.name === 'tasks') iconName = isFocused ? 'list' : 'list-outline';
                        else if (route.name === 'reports') iconName = isFocused ? 'clipboard' : 'clipboard-outline';
                        else if (route.name === 'settings') iconName = isFocused ? 'settings' : 'settings-outline';

                        const color = isFocused ? '#0E6F6A' : colors.textMuted;

                        return (
                            <Pressable
                                key={index}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={(options as any).tabBarTestID}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.tabItem}
                            >
                                <Ionicons name={iconName} size={24} color={color} />
                                <Text style={[styles.label, { color }]}>
                                    {typeof label === 'string' ? label : route.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    shadowContainer: {
        width: width * 0.95,
        height: 78,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        backgroundColor: '#F5F9F9',
    },
    tabBar: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        gap: 10,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
    }
});

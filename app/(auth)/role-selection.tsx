import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    useEffect(() => {
        // Automatically redirect to login as this screen is being revamped/bypassed
        router.replace('/login');
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text }}>Redirecting to login...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

/* 
// ORIGINAL UI COMMENTED OUT AS PER REVAMP
const carouselData = [
    { id: '1', image: require('../../assets/images/whoLogin1.png'), badge: 'Field activity logging' },
    { id: '2', image: require('../../assets/images/whoLogin2.png'), badge: 'Harvest tracking' },
    { id: '3', image: require('../../assets/images/whoLogin3.png'), badge: 'GPS mapping' },
];

export default function RoleSelectionScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedRole, setSelectedRole] = useState<'field-agent' | 'farmer' | 'machine-operator' | null>(null);

    const roles = [
        { id: 'field-agent', label: 'Field agent' },
        { id: 'farmer', label: 'Farmer' },
        { id: 'machine-operator', label: 'Machine Operators' },
    ];

    const handleLogin = () => {
        if (selectedRole) {
            router.push({ pathname: '/login', params: { role: selectedRole } });
        }
    };

    const RoleItem = ({ item }: { item: { image: any; badge: string } }) => {
        return (
            <View style={{ width: width, height: '100%', paddingHorizontal: 8 }}>
                <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image
                        source={item.image}
                        style={{ width: '100%', height: '100%', borderRadius: 20 }}
                        contentFit="cover"
                        transition={1000}
                        className='!rounded-[24px]'
                    />
                    <View style={[styles.badgeShadowContainer, Platform.OS === 'android' && styles.androidShadow]}>
                        <View style={styles.badgeContainer}>
                            <BlurView
                                intensity={Platform.OS === 'android' ? 25 : 15}
                                tint="light"
                                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={[styles.badgeContent, Platform.OS === 'android' && { backgroundColor: 'transparent' }]}>
                                <Text style={styles.badgeText}>{item.badge}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <BlobBackground>
            <StatusBar style={colors.statusBarStyle} />
            <View className="flex-1 pt-8">
                <View style={{ flex: 1, marginBottom: 10 }}>
                    <FlatList
                        data={carouselData}
                        renderItem={({ item }) => <RoleItem item={item} />}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={width}
                        decelerationRate="fast"
                        keyExtractor={(item) => item.id}
                        onScroll={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setCurrentIndex(index);
                        }}
                    />
                </View>

                <View className="px-6 pb-6">
                    <Text style={{ color: colors.text }} className="text-3xl font-bold text-center mb-1">
                        Who is{'\n'}logging in?
                    </Text>
                    <Text style={{ color: colors.textMuted }} className="text-center text-base mb-4">
                        Choose your role to continue.
                    </Text>

                    <View style={styles.rolesContainer}>
                        {roles.map((role) => (
                            <Pressable
                                key={role.id}
                                style={[
                                    styles.rolePressable,
                                    selectedRole === role.id && styles.rolePressableSelected
                                ]}
                                onPress={() => setSelectedRole(role.id as any)}
                            >
                                <View style={styles.roleBoxShadow}>
                                    <View style={[
                                        styles.roleBoxInner,
                                        selectedRole === role.id && { borderColor: colors.primary }
                                    ]}>
                                        <BlurView intensity={220} tint={isDarkMode ? 'dark' : 'light'} style={[styles.roleBoxBlur, { backgroundColor: isDarkMode ? colors.glassBackground : 'rgba(245, 249, 249, 0.85)' }]}>
                                            <View style={styles.iconContainer}>
                                                <View style={styles.iconBackground}>
                                                    <Feather name="user" size={24} color={colors.textSecondary} />
                                                </View>
                                            </View>
                                            <Text
                                                style={[styles.roleLabel, { color: colors.textSecondary }]}
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                                minimumFontScale={0.8}
                                            >
                                                {role.label}
                                            </Text>
                                        </BlurView>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable
                        style={[styles.loginButton, { backgroundColor: colors.primary }, !selectedRole && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                    >
                        <Text style={styles.loginButtonText}>
                            {selectedRole
                                ? `Login as ${roles.find(r => r.id === selectedRole)?.label}`
                                : 'Login'}
                        </Text>
                    </Pressable>
                </View>
            </View >
        </BlobBackground >
    );
}

const styles = StyleSheet.create({
    rolesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    rolePressable: {
        flex: 1,
        height: 110,
    },
    roleBoxShadow: {
        flex: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 16,
    },
    roleBoxInner: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roleBoxBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    iconContainer: {
        marginBottom: 12,
    },
    roleLabel: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    loginButton: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    badgeShadowContainer: {
        position: 'absolute',
        top: 17,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 16,
    },
    androidShadow: {
        elevation: 10,
        backgroundColor: 'rgba(0,0,0,0.01)',
    },
    badgeContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    badgeContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 50,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: '300',
    },
});
*/


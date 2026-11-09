import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const AVATAR_IMAGE = require('../../assets/images/whoLogin2.png');

const allTasks: any[] = [];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Completed': return { bg: '#E6F4F1', text: '#0E6F6A' };
        case 'Pending': return { bg: '#FEF3C7', text: '#D97706' };
        case 'Ongoing': return { bg: '#E0F2FE', text: '#0284C7' };
        default: return { bg: '#F3F4F6', text: '#4B5563' };
    }
};


export default function OperatorTasksScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />
            <CustomNavBar title="Tasks" backgroundColor={colors.navbarBackground} textColor={colors.text} blurIntensity={10} />

            <View style={[styles.mainContent, { backgroundColor: colors.card }]}>
                <Image
                    source={require('../../assets/images/backgroundGradient.png')}
                    style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]}
                    contentFit="cover"
                />

                <View style={styles.contentWrapper}>
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                            <Feather name="search" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Search Task"
                                placeholderTextColor={colors.textMuted}
                                style={[styles.searchInput, { color: colors.text }]}
                            />
                            <TouchableOpacity>
                                <Ionicons name="filter" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tasks Grid */}
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.gridContainer}>
                            {allTasks.map((task) => {
                                const statusStyle = getStatusColor(task.status);
                                return (
                                    <TouchableOpacity
                                        key={task.id}
                                        style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}
                                        onPress={() => router.push({
                                            pathname: '/(operators)/taskDetails',
                                            params: {
                                                id: task.id,
                                                status: task.status,
                                                name: task.name,
                                                machine: task.machine
                                            }
                                        })}
                                    >
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>{task.status}</Text>
                                        </View>

                                        <Text style={[styles.taskName, { color: colors.text }]} numberOfLines={2}>{task.name}</Text>

                                        <Text style={[styles.taskMachine, { color: colors.textMuted }]}>Machine: {task.machine}</Text>
                                        <Text style={[styles.taskDuration, { color: colors.textMuted }]}>Duration: {task.duration}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: 'white',
    },
    mainContent: {
        flex: 1,
        marginTop: 135,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        // backgroundColor: 'white',
        overflow: 'hidden',
    },
    contentWrapper: {
        flex: 1,
        paddingTop: 20,
    },
    listHeader: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchBar: {
        height: 48,
        // backgroundColor: 'white',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        // borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        // color: '#0A0C11',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    taskCard: {
        width: '48%',
        // backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        // borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    taskName: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0A0C11',
        marginBottom: 8,
        lineHeight: 22,
    },
    taskMachine: {
        fontSize: 11,
        // color: '#6B7280',
        marginBottom: 2,
    },
    taskDuration: {
        fontSize: 11,
        // color: '#6B7280',
    },
});

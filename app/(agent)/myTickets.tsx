import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const TICKETS = [
    { id: '1', ticketId: '#2341', title: 'App not syncing data', status: 'Open', date: '12 Jun 2026, 9:40 AM', statusColor: '#0E6F6A', statusBg: '#E7F6F5' },
    { id: '2', ticketId: '#2341', title: 'App not syncing data', status: 'Open', date: '12 Jun 2026, 9:40 AM', statusColor: '#0E6F6A', statusBg: '#E7F6F5' },
    { id: '3', ticketId: '#2342', title: 'Error loading user settings', status: 'In Progress', date: '13 Jun 2026, 10:15 AM', statusColor: '#0E6F6A', statusBg: '#E7F6F5' }, // Using similar palette for now
    { id: '4', ticketId: '#2343', title: 'Crashes on startup', status: 'Closed', date: '14 Jun 2026, 11:00 AM', statusColor: '#0E6F6A', statusBg: '#DCFCE7' },
    { id: '5', ticketId: '#2344', title: 'Slow performance issues', status: 'Open', date: '15 Jun 2026, 1:30 PM', statusColor: '#0E6F6A', statusBg: '#E7F6F5' },
    { id: '6', ticketId: '#2345', title: 'Feature request for dark mode', status: 'Resolved', date: '16 Jun 2026, 3:45 PM', statusColor: '#0E6F6A', statusBg: '#E7F6F5' },
];

export default function MyTicketsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="My tickets" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <View style={styles.contentWrapper}>
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                            <Feather name="search" size={20} color={colors.textMuted} />
                            <TextInput
                                placeholder="What can we help you with?"
                                placeholderTextColor={colors.textMuted}
                                style={[styles.searchInput, { color: colors.text }]}
                            />
                        </View>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                        style={{ flex: 1 }}
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.ticketsList}>
                            {TICKETS.map((ticket) => (
                                <TouchableOpacity
                                    key={ticket.id}
                                    style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => router.push('/(agent)/ticketChat')}
                                >
                                    <View style={styles.ticketHeader}>
                                        <Text style={[styles.ticketId, { color: colors.textMuted }]}>Ticket {ticket.ticketId}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: ticket.statusBg || 'transparent' }]}>
                                            <Text style={[styles.statusText, { color: ticket.statusColor }]}>{ticket.status}</Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.ticketTitle, { color: colors.text }]}>{ticket.title}</Text>
                                    <Text style={[styles.ticketDate, { color: colors.textMuted }]}>Submitted: {ticket.date}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background color handled inline
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
        flex: 1,
    },
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        height: 48,
        backgroundColor: '#F9FAFB', // Overridden
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#0A0C11', // Overridden
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    ticketsList: {
        gap: 12,
    },
    ticketCard: {
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.05,
        // shadowRadius: 2,
        // elevation: 1,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ticketId: {
        fontSize: 12,
        color: '#0A0C1199', // Overridden
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    ticketTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11', // Overridden
        marginBottom: 4,
    },
    ticketDate: {
        fontSize: 11,
        color: '#0A0C1199', // Overridden
    },
});

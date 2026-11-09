import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const MESSAGES = [
    { id: '1', text: 'The app saved my activity offline but hasn\'t synced since yesterday', sender: 'user', time: '9:40 AM' },
    { id: '2', text: 'The app saved my activity offline but hasn\'t synced since yesterday', sender: 'admin', time: '9:50 AM' },
];

export default function TicketChatScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="My tickets" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/myTickets')} />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <View style={styles.contentWrapper}>
                    <View style={styles.header}>
                        <Text style={[styles.ticketTitle, { color: colors.text }]}>App not syncing data</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.messagesList}>
                            {MESSAGES.map((msg) => (
                                <View key={msg.id} style={[
                                    styles.messageRow,
                                    msg.sender === 'user' ? styles.userMessageRow : styles.adminMessageRow
                                ]}>
                                    {msg.sender === 'admin' && (
                                        <View style={[styles.avatarContainer, { borderColor: colors.card }]}>
                                            <Image source={require('../../assets/images/farmerWithFork.png')} style={styles.avatar} contentFit="cover" />
                                        </View>
                                    )}
                                    <View style={[
                                        styles.messageBubble,
                                        msg.sender === 'user' ? [styles.userBubble, { backgroundColor: colors.card, borderColor: colors.border }] : [styles.adminBubble, { backgroundColor: colors.card, borderColor: colors.border }]
                                    ]}>
                                        <Text style={[styles.messageText, { color: colors.text }]}>{msg.text}</Text>
                                        <Text style={[
                                            styles.timeText,
                                            { color: colors.textMuted }
                                        ]}>{msg.time}</Text>

                                        {msg.sender === 'user' && (
                                            <View style={styles.userAvatarContainer}>
                                                <Text style={[styles.userAvatarText, { color: colors.textMuted }]}>You</Text>
                                                <View style={[styles.userAvatarWrapper, { borderColor: colors.card }]}>
                                                    <Image source={require('../../assets/images/farmerWithFork.png')} style={styles.avatar} contentFit="cover" />
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                    {msg.sender === 'admin' && (
                                        <Text style={[styles.adminName, { color: colors.textMuted }]}>Admin</Text>
                                    )}
                                </View>
                            ))}
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
    header: {
        padding: 16,
        // borderBottomWidth: 1,
        // borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    ticketTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11', // Overridden
    },
    scrollContent: {
        padding: 16,
    },
    messagesList: {
        gap: 24,
    },
    messageRow: {
        width: '100%',
    },
    adminMessageRow: {
        alignItems: 'flex-start',
        position: 'relative',
        paddingLeft: 30,
        marginBottom: 10, // Added margin for avatar visibility
    },
    userMessageRow: {
        alignItems: 'flex-end',
        marginBottom: 10, // Added margin for avatar visibility
    },
    messageBubble: {
        width: 213,
        height: 100,
        padding: 12,
        borderRadius: 12,
    },
    userBubble: {
        backgroundColor: 'white', // Overridden
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        borderTopRightRadius: 4,
    },
    adminBubble: {
        backgroundColor: 'white', // Overridden
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        borderTopLeftRadius: 4,
    },
    messageText: {
        fontSize: 13,
        color: '#0A0C11', // Overridden
        lineHeight: 18,
        marginBottom: 4,
    },
    timeText: {
        fontSize: 10,
        color: '#0A0C1199', // Overridden
        alignSelf: 'flex-end',
    },
    userTimeText: {},
    adminTimeText: {},
    avatarContainer: {
        position: 'absolute',
        left: -8,
        bottom: -20,
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white', // Overridden in component but good to have fallback
        zIndex: 20, // Increased zIndex
        elevation: 5,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    userAvatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        position: 'absolute',
        right: 0,
        bottom: -26,
        zIndex: 20,
        elevation: 5,
    },
    userAvatarText: {
        fontSize: 10,
        color: '#0A0C1199', // Overridden
    },
    userAvatarWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white', // Overridden in component
    },
    adminName: {
        fontSize: 10,
        color: '#0A0C1199', // Overridden
        position: 'absolute',
        left: 36,
        bottom: -20,
    },
});

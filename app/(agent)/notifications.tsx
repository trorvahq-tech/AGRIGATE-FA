import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/apiClient';

function formatDate(isoStr: string) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        let hour = d.getHours();
        const min = String(d.getMinutes()).padStart(2, '0');
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${day} ${month} ${year} | ${String(hour).padStart(2, '0')}:${min} ${ampm}`;
    } catch (e) {
        return '';
    }
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const fetchAlerts = async () => {
            try {
                const res = await api.get('/alerts');
                if (active && res.data && Array.isArray(res.data.data)) {
                    setNotifications(res.data.data);
                }
            } catch (err) {
                console.warn("Failed to load alerts:", err);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchAlerts();
        return () => {
            active = false;
        };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Notifications" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)')} />

            <View style={[styles.contentContainer, { backgroundColor: colors.card }]}>
                {/* Background Gradient */}
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />
                <BlurView intensity={isDarkMode ? 20 : 80} tint={colors.blurTint} style={StyleSheet.absoluteFill} />

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#0E6F6A" />
                    </View>
                ) : notifications.length > 0 ? (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {notifications.map((item) => {
                            const priority = item.level === 'critical' ? 'High' : item.level === 'warning' ? 'Medium' : 'Low';
                            const priorityColor = item.level === 'critical' ? '#BC3434' : item.level === 'warning' ? '#E59F0B' : '#0E6F6A';
                            return (
                                <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
                                    <View style={styles.cardContent}>
                                        <View style={styles.iconColumn}>
                                            <Feather name="activity" size={20} color="#0E6F6A" />
                                        </View>
                                        <View style={styles.textColumn}>
                                            <View style={styles.headerRow}>
                                                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                                                    {item.title}
                                                </Text>
                                            </View>

                                            <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
                                                {item.body}
                                            </Text>

                                            <View style={styles.footerRow}>
                                                <View style={styles.priorityBadge}>
                                                    <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                                                    <Text style={[styles.priorityText, { color: colors.textMuted }]}>{priority} priority</Text>
                                                </View>
                                                <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(item.time)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>No notifications yet</Text>
                        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>You are all caught up! New updates will appear here.</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Background color handled inline
    },
    contentContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white', // Overridden
    },
    scrollContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F1F1', // Overridden
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        gap: 12,
    },
    iconColumn: {
        marginTop: 2,
    },
    textColumn: {
        flex: 1,
        gap: 6,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 14,
        fontWeight: '700', // Bold title
        color: '#0A0C11', // Overridden
        lineHeight: 20,
    },
    description: {
        fontSize: 12,
        color: '#5B616D', // Overridden
        lineHeight: 18,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#BC3434', // Red for high priority
    },
    priorityText: {
        fontSize: 10,
        color: '#0A0C1199', // Overridden
    },
    dateText: {
        fontSize: 10,
        color: '#0A0C1199', // Overridden
    },
});

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const FAQ_ITEMS = [
    { id: '1', question: 'Why is my data not syncing?', answer: 'Ensure you have internet and tap "Sync Now"' },
    { id: '2', question: 'Why is my data not syncing?', answer: 'Ensure you have internet and tap "Sync Now"' },
];

const ISSUE_TYPES = [
    { id: '1', title: 'App not syncing data', icon: 'download-cloud' },
    { id: '2', title: 'GPS / location not working', icon: 'map-pin' },
    { id: '3', title: 'Unable to upload photos', icon: 'image' },
    { id: '4', title: 'Login or password issues', icon: 'lock' },
    { id: '5', title: 'Task not loading', icon: 'check-circle' },
    { id: '6', title: 'Other', icon: 'help-circle' },
];

export default function HelpCenterScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} />
            <CustomBackNavBar title="Help Center" onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/settings')} />

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

                    <View style={{ flex: 1 }}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                            style={{ flex: 1 }}
                        >
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            {/* Issues List */}
                            <View style={styles.issuesList}>
                                {ISSUE_TYPES.map((issue) => (
                                    <View key={issue.id} style={[styles.issueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <TouchableOpacity
                                            style={[styles.issueHeader, expandedIssue === issue.id && [styles.issueHeaderExpanded, { borderBottomColor: colors.border }]]}
                                            onPress={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                                        >
                                            <View style={styles.issueTitleRow}>
                                                <View style={[styles.iconContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                                    <Feather name={issue.icon as any} size={16} color={colors.text} />
                                                </View>
                                                <Text style={[styles.issueTitle, { color: colors.text }]}>{issue.title}</Text>
                                            </View>
                                            <Feather
                                                name={expandedIssue === issue.id ? "chevron-up" : "chevron-down"}
                                                size={20}
                                                color={colors.textSecondary}
                                            />
                                        </TouchableOpacity>

                                        {/* Expanded Form */}
                                        {expandedIssue === issue.id && (
                                            <View style={[styles.formContainer, { backgroundColor: colors.inputBackground }]}>
                                                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Describe the problem</Text>
                                                <TextInput
                                                    style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                                    placeholder="Explain what happened"
                                                    placeholderTextColor={colors.textMuted}
                                                    multiline
                                                    numberOfLines={4}
                                                    textAlignVertical="top"
                                                />

                                                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Upload Evidence</Text>
                                                <TouchableOpacity style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                                    <Feather name="upload-cloud" size={24} color={colors.textMuted} />
                                                    <Text style={[styles.uploadText, { color: colors.textMuted }]}>Upload Document</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={styles.submitButton} onPress={() => router.push('/(agent)/myTickets')}>
                                                    <Text style={styles.submitButtonText}>Submit</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                            </ScrollView>
                        </KeyboardAvoidingView>

                        {/* FAQs Section - Fixed at bottom of content area */}
                        <View style={[styles.faqsSection, { borderTopColor: colors.border }]}>
                            <Text style={[styles.sectionHeader, { color: colors.text }]}>FAQs</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.faqScroll}>
                                {FAQ_ITEMS.map((faq) => (
                                    <View key={faq.id} style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={[styles.faqHeader, { backgroundColor: isDarkMode ? colors.cardSecondary : '#F5F9F9' }]}>
                                            <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                                        </View>
                                        <View style={styles.faqBody}>
                                            <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>{faq.answer}</Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
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
        // backgroundColor: 'white',
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
    issuesList: {
        gap: 12,
        marginBottom: 24,
    },
    issueCard: {
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        overflow: 'hidden',
    },
    issueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 48,
    },
    issueHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6', // Overridden
    },
    issueTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#F9FAFB', // Overridden
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
    },
    issueTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0A0C11', // Overridden
    },
    formContainer: {
        padding: 16,
        backgroundColor: '#F9FAFB', // Overridden
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#0A0C11B2', // Overridden
        marginBottom: 8,
    },
    textArea: {
        height: 50,
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#0A0C11', // Overridden
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
    },
    uploadBox: {
        height: 90,
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        borderStyle: 'dashed',
        marginBottom: 24,
        gap: 8,
    },
    uploadText: {
        fontSize: 12,
        color: '#0A0C1199', // Overridden
    },
    submitButton: {
        height: 48,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    faqsSection: {
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6', // Overridden
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0A0C11E5', // Overridden
    },
    faqScroll: {
        gap: 12,
        paddingRight: 16, // Add padding to end of horizontal scroll
    },
    faqCard: {
        width: 250,
        height: 140, // Increased height
        backgroundColor: 'white', // Overridden
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6', // Overridden
        overflow: 'hidden',
    },
    faqHeader: {
        backgroundColor: '#F5F9F9', // Overridden
        paddingHorizontal: 12,
        height: 38,
        justifyContent: 'center',
    },
    faqBody: {
        padding: 12,
        flex: 1,
    },
    faqQuestion: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0A0C11', // Overridden
    },
    faqAnswer: {
        fontSize: 11,
        color: '#0A0C1199', // Overridden
        lineHeight: 16,
    },
});

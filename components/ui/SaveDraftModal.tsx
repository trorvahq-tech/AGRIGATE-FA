import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface SaveDraftInfo {
    farmerName: string;
    stepNumber: number;
    stepTitle: string;
}

interface SaveDraftModalProps {
    visible: boolean;
    draftInfo: SaveDraftInfo | null;
    onKeepEditing: () => void;
    onViewDrafts: () => void;
    onExit: () => void;
}

export default function SaveDraftModal({
    visible,
    draftInfo,
    onKeepEditing,
    onViewDrafts,
    onExit,
}: SaveDraftModalProps) {
    const { colors, isDarkMode } = useTheme();

    if (!draftInfo) return null;

    const stepNum = draftInfo.stepNumber || 1;
    const progressPct = stepNum * 20;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onKeepEditing}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onKeepEditing} />

                <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                    {/* Top Icon Circle */}
                    <View style={styles.iconCircle}>
                        <Ionicons name="bookmark" size={24} color="#0E6F6A" />
                    </View>

                    {/* Title & Description */}
                    <Text style={[styles.title, { color: isDarkMode ? colors.text : '#0F172A' }]}>
                        Draft Saved
                    </Text>

                    <Text style={styles.description}>
                        Progress for <Text style={styles.boldText}>{draftInfo.farmerName || 'Farmer'}</Text> has been saved on this device. You can safely return to complete it at any time.
                    </Text>

                    {/* Progress Badge */}
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Feather name="check-circle" size={13} color="#0E6F6A" />
                            <Text style={styles.badgeText}>
                                Step {stepNum} of 5 • {draftInfo.stepTitle} ({progressPct}%)
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonGroup}>
                        {/* Primary: Keep Editing */}
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={onKeepEditing}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryBtnText}>Keep Editing</Text>
                        </TouchableOpacity>

                        {/* Secondary: View All Drafts */}
                        <TouchableOpacity
                            style={[
                                styles.secondaryBtn,
                                {
                                    backgroundColor: isDarkMode ? '#0F766E28' : '#E6F4F1',
                                    borderColor: isDarkMode ? '#0F766E55' : '#CCECE7',
                                },
                            ]}
                            onPress={onViewDrafts}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="albums-outline" size={16} color="#0E6F6A" />
                            <Text style={styles.secondaryBtnText}>View All Drafts</Text>
                        </TouchableOpacity>

                        {/* Ghost: Exit to Farmers */}
                        <TouchableOpacity
                            style={styles.ghostBtn}
                            onPress={onExit}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.ghostBtnText}>Exit to Farmer List</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingTop: 26,
        paddingBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 8,
    },
    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#E6F4F1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 14,
        paddingHorizontal: 6,
    },
    boldText: {
        color: '#0F172A',
        fontWeight: '700',
    },
    badgeRow: {
        marginBottom: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#065F46',
    },
    buttonGroup: {
        width: '100%',
        gap: 8,
    },
    primaryBtn: {
        backgroundColor: '#0E6F6A',
        height: 46,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryBtn: {
        height: 44,
        borderRadius: 13,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    secondaryBtnText: {
        color: '#0E6F6A',
        fontSize: 13,
        fontWeight: '700',
    },
    ghostBtn: {
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghostBtnText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },
});

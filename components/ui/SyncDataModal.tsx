import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSyncStatus } from '../../services/syncService';

interface SyncDataModalProps {
    visible: boolean;
    onClose: () => void;
    pendingCount?: number;
    onSyncComplete?: () => void;
}

export default function SyncDataModal({
    visible,
    onClose,
    onSyncComplete,
}: SyncDataModalProps) {
    const { colors, isDarkMode } = useTheme();
    const { lastSyncFull, pendingCount, isSyncing, queue, processQueue } = useSyncStatus();
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [syncResult, setSyncResult] = useState<{ succeeded: number; failed: number } | null>(null);

    const handleSync = async () => {
        setSyncSuccess(false);
        setSyncResult(null);

        try {
            const res = await processQueue();
            setSyncResult(res);
            setSyncSuccess(true);
            if (onSyncComplete) {
                onSyncComplete();
            }
            setTimeout(() => {
                setSyncSuccess(false);
            }, 3500);
        } catch (e) {
            console.warn('Sync execution error:', e);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={isSyncing ? undefined : onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={isSyncing ? undefined : onClose} />

                <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#0F766E33' : '#E6F4F1' }]}>
                                <Ionicons name="sync-outline" size={20} color="#0E6F6A" />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: isDarkMode ? colors.text : '#0F172A' }]}>
                                    Data Sync
                                </Text>
                                <Text style={styles.subtitle}>Cloud & offline records</Text>
                            </View>
                        </View>
                        {!isSyncing && (
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                                <Feather name="x" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Status Banner */}
                    <View
                        style={[
                            styles.statusBanner,
                            {
                                backgroundColor: syncSuccess
                                    ? isDarkMode ? '#064E3B44' : '#ECFDF5'
                                    : isDarkMode ? '#0F172A' : '#F8FAFC',
                                borderColor: syncSuccess
                                    ? '#A7F3D0'
                                    : isDarkMode ? '#334155' : '#E2E8F0',
                            },
                        ]}
                    >
                        <View style={styles.statusDotRow}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: syncSuccess ? '#10B981' : isSyncing ? '#F59E0B' : pendingCount > 0 ? '#F59E0B' : '#10B981' },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: syncSuccess ? '#065F46' : isDarkMode ? '#CBD5E1' : '#334155' },
                                ]}
                            >
                                {isSyncing
                                    ? 'Synchronizing with SCL Cloud...'
                                    : syncSuccess
                                    ? `Synced ${syncResult?.succeeded || 0} item(s) successfully`
                                    : pendingCount > 0
                                    ? `${pendingCount} record(s) queued for offline sync`
                                    : 'Cloud Connection: Up to date'}
                            </Text>
                        </View>
                        <Text style={styles.lastSyncLabel}>Last synced: {syncSuccess ? 'Just now' : lastSyncFull}</Text>
                    </View>

                    {/* Sync Items List */}
                    <View style={styles.itemsList}>
                        <View style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="people-outline" size={17} color="#64748B" />
                                <Text style={[styles.itemName, { color: isDarkMode ? colors.text : '#1E293B' }]}>
                                    Farmer Registrations
                                </Text>
                            </View>
                            <View style={styles.itemRight}>
                                {queue.some(q => q.type === 'CREATE_FARMER') ? (
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.pendingBadgeText}>
                                            {queue.filter(q => q.type === 'CREATE_FARMER').length} queued
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <Feather name="check" size={14} color="#10B981" />
                                        <Text style={styles.itemStatusText}>Synced</Text>
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="clipboard-outline" size={17} color="#64748B" />
                                <Text style={[styles.itemName, { color: isDarkMode ? colors.text : '#1E293B' }]}>
                                    VCM Activities & Tasks
                                </Text>
                            </View>
                            <View style={styles.itemRight}>
                                {queue.some(q => q.type === 'SAVE_VCM_ACTIVITY' || q.type === 'CREATE_FARM_TASK' || q.type === 'RECORD_FARM_ASSESSMENT') ? (
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.pendingBadgeText}>
                                            {queue.filter(q => q.type === 'SAVE_VCM_ACTIVITY' || q.type === 'CREATE_FARM_TASK' || q.type === 'RECORD_FARM_ASSESSMENT').length} queued
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <Feather name="check" size={14} color="#10B981" />
                                        <Text style={styles.itemStatusText}>Synced</Text>
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="cloud-upload-outline" size={17} color="#64748B" />
                                <Text style={[styles.itemName, { color: isDarkMode ? colors.text : '#1E293B' }]}>
                                    Offline Storage Queue
                                </Text>
                            </View>
                            <View style={styles.itemRight}>
                                {pendingCount > 0 ? (
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.pendingBadgeText}>{pendingCount} total</Text>
                                    </View>
                                ) : (
                                    <>
                                        <Feather name="check" size={14} color="#10B981" />
                                        <Text style={styles.itemStatusText}>All saved</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.syncBtn, isSyncing && { opacity: 0.75 }]}
                        onPress={handleSync}
                        disabled={isSyncing}
                        activeOpacity={0.85}
                    >
                        {isSyncing ? (
                            <View style={styles.btnContent}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text style={styles.syncBtnText}>Syncing Data...</Text>
                            </View>
                        ) : (
                            <View style={styles.btnContent}>
                                <Ionicons name="sync" size={18} color="#FFFFFF" />
                                <Text style={styles.syncBtnText}>Sync Now {pendingCount > 0 ? `(${pendingCount})` : ''}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
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
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 22,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 1,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBanner: {
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    statusDotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    lastSyncLabel: {
        fontSize: 11,
        color: '#94A3B8',
    },
    itemsList: {
        marginBottom: 18,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '500',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    itemStatusText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    pendingBadgeText: {
        fontSize: 11,
        color: '#D97706',
        fontWeight: '700',
    },
    syncBtn: {
        backgroundColor: '#0E6F6A',
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    syncBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});

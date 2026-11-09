import React, { useMemo } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useFarms } from '../../hooks/api/useFarms';

const MAP_PLACEHOLDER = require('../../assets/images/backgroundGradient.png');

export interface DemoPlotItem {
    id: string;
    name: string;
    size: string;
    location: string;
    coordinates: [number, number];
    dateCreated: string;
    cropType: string;
    status: 'active' | 'completed';
}

export default function DemoPlotsScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const { data: apiFarms, isLoading } = useFarms();

    const demoPlots: DemoPlotItem[] = useMemo(() => {
        if (!apiFarms || !Array.isArray(apiFarms)) return [];
        return apiFarms
            .filter((f: any) => f.isDemoPlot || f.is_demo_plot || f.type === 'demo' || (f.name && f.name.toLowerCase().includes('demo')))
            .map((f: any) => ({
                id: String(f.id),
                name: f.name || 'Demonstration Plot',
                size: f.size_hectares ? `${f.size_hectares} ha` : (f.sizeHectares ? `${f.sizeHectares} ha` : '—'),
                location: f.community || f.lga || 'Field Plot',
                coordinates: [f.longitude || 7.4383, f.latitude || 10.5222] as [number, number],
                dateCreated: f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Active',
                cropType: f.primary_crop || f.crop || 'Demonstration',
                status: f.is_active !== false ? 'active' : 'completed',
            }));
    }, [apiFarms]);

    const totalHectares = useMemo(() => {
        const sum = demoPlots.reduce((acc, p) => acc + (parseFloat(p.size) || 0), 0);
        return sum > 0 ? `${sum.toFixed(1)} ha` : '0 ha';
    }, [demoPlots]);

    const renderPlotCard = ({ item }: { item: DemoPlotItem }) => (
        <View style={[styles.plotCard, { backgroundColor: colors.card, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
            {/* Map Preview */}
            <View style={styles.mapPreview}>
                <Image
                    source={MAP_PLACEHOLDER}
                    style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                    contentFit="cover"
                />
                <View style={styles.mapOverlay}>
                    <Feather name="map" size={24} color="white" />
                    <Text style={styles.mapOverlayText}>
                        {item.coordinates[1].toFixed(4)}°N, {item.coordinates[0].toFixed(4)}°E
                    </Text>
                </View>
                <View style={[styles.plotStatusBadge, { backgroundColor: item.status === 'active' ? '#0E6F6A' : '#6B7280' }]}>
                    <Text style={styles.plotStatusText}>{item.status === 'active' ? 'Active' : 'Completed'}</Text>
                </View>
            </View>

            {/* Plot Info */}
            <View style={styles.plotInfo}>
                <Text style={[styles.plotName, { color: colors.text }]}>{item.name}</Text>
                <View style={styles.plotMetaRow}>
                    <View style={styles.plotMeta}>
                        <Feather name="maximize-2" size={12} color={colors.textMuted} />
                        <Text style={[styles.plotMetaText, { color: colors.textMuted }]}>{item.size}</Text>
                    </View>
                    <View style={styles.plotMeta}>
                        <Feather name="map-pin" size={12} color={colors.textMuted} />
                        <Text style={[styles.plotMetaText, { color: colors.textMuted }]}>{item.location}</Text>
                    </View>
                </View>
                <View style={styles.plotMetaRow}>
                    <View style={styles.plotMeta}>
                        <Ionicons name="leaf-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.plotMetaText, { color: colors.textMuted }]}>{item.cropType}</Text>
                    </View>
                    <View style={styles.plotMeta}>
                        <Feather name="calendar" size={12} color={colors.textMuted} />
                        <Text style={[styles.plotMetaText, { color: colors.textMuted }]}>{item.dateCreated}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />

            <CustomBackNavBar
                title={t('demo_plots')}
                onBackPress={() => router.back()}
                backgroundColor={isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                textColor={colors.text}
                iconColor={colors.primary}
                blurIntensity={20}
            />

            <View style={styles.content}>
                {/* Summary */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.card : '#0E6F6A08', borderColor: colors.border }]}>
                        <Text style={[styles.summaryValue, { color: '#0E6F6A' }]}>{demoPlots.length}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Plots</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.card : '#0E6F6A08', borderColor: colors.border }]}>
                        <Text style={[styles.summaryValue, { color: '#0E6F6A' }]}>{demoPlots.filter(p => p.status === 'active').length}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Active</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.card : '#0E6F6A08', borderColor: colors.border }]}>
                        <Text style={[styles.summaryValue, { color: '#0E6F6A' }]}>{totalHectares}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Area</Text>
                    </View>
                </View>

                {/* Map New Plot CTA */}
                <TouchableOpacity
                    style={styles.mapNewButton}
                    onPress={() => router.navigate({ pathname: '/(agent)/register-farmer/farm-details', params: { flow: 'demo_plot', returnPath: '/(agent)/demoPlots' } })}
                >
                    <Feather name="plus" size={20} color="#0E6F6A" />
                    <Text style={styles.mapNewText}>Map New Demo Plot</Text>
                </TouchableOpacity>

                {/* Plot List or Empty State */}
                {demoPlots.length === 0 ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 20 }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Ionicons name="sparkles-outline" size={28} color="#0E6F6A" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>No Demo Plots Yet</Text>
                        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18, maxWidth: 280 }}>
                            Demonstration plots showcase regenerative agriculture best practices. Tap "Map New Demo Plot" to trace boundaries.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={demoPlots}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPlotCard}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: 155,
        paddingHorizontal: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mapNewButton: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#0E6F6A',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        borderStyle: 'dashed',
    },
    mapNewText: {
        color: '#0E6F6A',
        fontSize: 15,
        fontWeight: '700',
    },
    plotCard: {
        borderRadius: 16,
        marginBottom: 14,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    mapPreview: {
        height: 140,
        backgroundColor: '#1a3a2a',
        position: 'relative',
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 10,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    mapOverlayText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },
    plotStatusBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    plotStatusText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    plotInfo: {
        padding: 16,
    },
    plotName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    plotMetaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 6,
    },
    plotMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    plotMetaText: {
        fontSize: 12,
        fontWeight: '500',
    },
});

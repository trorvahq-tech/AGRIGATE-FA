import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../../components/ui/CustomBackNavBar';

const activeMachines: any[] = [];

export default function MachineSelectionScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <CustomBackNavBar title="Report an issue" onBackPress={() => router.back()} />

            <View style={styles.contentContainer}>
                {/* Background Gradient */}
                <Image source={require('../../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {activeMachines.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 20 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A0C11', marginBottom: 8 }}>No Registered Machines Found</Text>
                            <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
                                If your equipment is not yet linked in the registry, you can still submit a manual fault report.
                            </Text>
                            <TouchableOpacity
                                style={{ backgroundColor: '#0E6F6A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 }}
                                onPress={() => router.push({ pathname: '/(operators)/report-issue/form', params: { machineName: 'Manual Entry' } })}
                            >
                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Log Issue Manually</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        activeMachines.map((machine) => (
                            <TouchableOpacity
                                key={machine.id}
                                style={styles.card}
                                onPress={() => router.push({
                                    pathname: '/(operators)/report-issue/form',
                                    params: { machineName: machine.name } // Pass machine info if needed
                                })}
                            >
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{machine.status}</Text>
                                </View>

                                <Text style={styles.machineName}>{machine.name}</Text>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Last Service:</Text>
                                    <Text style={styles.value}>{machine.lastService}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Current Task:</Text>
                                    <Text style={styles.value}>{machine.currentTask}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    contentContainer: {
        flex: 1,
        marginTop: 135,
        marginHorizontal: 12,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    scrollContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F1F1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statusBadge: {
        backgroundColor: '#E6F4F1', // Light green bg
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 10,
        color: '#0E6F6A',
        fontWeight: '600',
    },
    machineName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A0C11',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        color: '#5B616D',
    },
    value: {
        fontSize: 12,
        color: '#0A0C1199',
    },
});

import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import api from '../../services/apiClient';

const { width } = Dimensions.get('window');

const TASK_TYPES = [
    { label: 'Planting', sub: 'Sowing seeds or transplanting seedlings', icon: 'leaf-outline', color: '#059669' },
    { label: 'Fertilization', sub: 'Applying organic or inorganic fertilizers', icon: 'cube-outline', color: '#D97706' },
    { label: 'Weeding', sub: 'Controlling weeds manually or mechanically', icon: 'cut-outline', color: '#2563EB' },
    { label: 'Pest Control', sub: 'Managing insects and pests', icon: 'bug-outline', color: '#DC2626' },
    { label: 'Harvesting', sub: 'Harvesting crops', icon: 'basket-outline', color: '#7C3AED' },
    { label: 'Irrigation', sub: 'Applying water to the field', icon: 'water-outline', color: '#0EA5E9' },
    { label: 'Soil Management', sub: 'Mulching, composting, cover crops, etc.', icon: 'earth-outline', color: '#EA580C' },
    { label: 'Other', sub: 'Other farm activities', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

const CATEGORIES = [
    { label: 'Planting', icon: 'leaf-outline', color: '#059669' },
    { label: 'Fertilization', icon: 'cube-outline', color: '#D97706' },
    { label: 'Weeding', icon: 'cut-outline', color: '#2563EB' },
    { label: 'Pest Control', icon: 'bug-outline', color: '#DC2626' },
    { label: 'Harvesting', icon: 'basket-outline', color: '#7C3AED' },
    { label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

export default function AddFarmTaskScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ farmId?: string }>();
    const [farm, setFarm] = useState<any>(null);
    const [loadingFarm, setLoadingFarm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [taskTitle, setTaskTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [typeSearch, setTypeSearch] = useState('');
    const [assignTo, setAssignTo] = useState<'farm' | 'field'>('farm');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [reminderEnabled, setReminderEnabled] = useState(true);

    useEffect(() => {
        if (!params.farmId) return;
        let active = true;
        setLoadingFarm(true);
        api.get(`/farms/${params.farmId}`)
            .then(res => {
                if (active && res.data) {
                    setFarm(res.data);
                }
            })
            .catch(err => console.warn('Could not load farm for add task:', err))
            .finally(() => { if (active) setLoadingFarm(false); });
        return () => { active = false; };
    }, [params.farmId]);

    const handleSaveTask = async () => {
        if (!taskTitle.trim()) {
            Alert.alert('Required', 'Please enter a task title');
            return;
        }
        setSaving(true);
        const newTask = {
            id: String(Date.now()),
            title: taskTitle.trim(),
            description: description.trim(),
            type: selectedType || 'Other',
            category: selectedCategory || 'General',
            status: 'todo',
            due: 'Upcoming',
            crop: farm?.primaryCrop || 'Maize',
            field: assignTo === 'field' ? 'Field 1' : 'All Fields',
            createdAt: new Date().toISOString()
        };

        try {
            if (params.farmId) {
                const existingTasks = Array.isArray(farm?.metadata?.tasks) ? farm.metadata.tasks : [];
                const updatedTasks = [newTask, ...existingTasks];
                await api.patch(`/farms/${params.farmId}`, {
                    metadata: {
                        ...(farm?.metadata || {}),
                        tasks: updatedTasks,
                    }
                });
            }
            Alert.alert('Success', 'Task saved successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (err: any) {
            console.warn('⚠️ [AddFarmTask] Network offline. Saving task locally and queueing sync:', err?.message || err);
            const { syncService } = require('../../services/syncService');
            await syncService.enqueueMutation({
                type: 'CREATE_FARM_TASK',
                description: `New Task: ${newTask.title}`,
                payload: {
                    farmId: params.farmId || 'farm-1',
                    task: newTask,
                }
            });
            Alert.alert('Saved Offline', 'Task saved locally and added to sync queue.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } finally {
            setSaving(false);
        }
    };

    const filteredTypes = TASK_TYPES.filter(t =>
        t.label.toLowerCase().includes(typeSearch.toLowerCase())
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="dark" />

            {/* Nav Bar */}
            <CustomBackNavBar 
                title="Add Task" 
                onBackPress={() => router.replace('/(agent)/tasks')} 
                rightIcon={<Ionicons name="close" size={22} color="#111827" />}
                onRightPress={() => router.replace('/(agent)/tasks')}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Farm Context Card */}
                {(() => {
                    const farmName = farm?.name || 'Farm';
                    const farmerName = farm?.farmerName || farm?.farmer_name || 'Assigned Farmer';
                    const farmLoc = [farm?.lga, farm?.state].filter(Boolean).join(', ') || 'Kaduna State';
                    const farmCrop = farm?.primaryCrop || 'Primary Crop';
                    const farmArea = farm?.sizeHectares ? `${farm.sizeHectares} ha` : '—';
                    return (
                        <View style={s.farmCard}>
                            <View style={s.farmThumb}>
                                <Image source={require('../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Text style={s.farmName}>{farmName}</Text>
                                    <View style={s.primaryBadge}><Text style={s.primaryBadgeText}>Primary</Text></View>
                                </View>
                                <View style={s.metaRow}><Ionicons name="person-outline" size={11} color="#6B7280" /><Text style={s.metaText}>{farmerName}</Text></View>
                                <View style={s.metaRow}><Ionicons name="location-outline" size={11} color="#6B7280" /><Text style={s.metaText}>{farmLoc}</Text></View>
                                <View style={s.metaRow}><Ionicons name="leaf-outline" size={11} color="#6B7280" /><Text style={s.metaText}>{farmCrop} · {farmArea}</Text></View>
                            </View>
                            <View style={s.areaBadge}>
                                <Text style={s.areaValue}>{farmArea}</Text>
                                <Text style={s.areaLabel}>Total Area</Text>
                            </View>
                        </View>
                    );
                })()}

                {/* 1. Task Details */}
                <Text style={s.sectionNum}>1. Task Details</Text>

                <Text style={s.fieldLabel}>Task Title *</Text>
                <TextInput
                    style={s.textInput}
                    placeholder="Enter task title"
                    placeholderTextColor="#9CA3AF"
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                />
                <Text style={s.hint}>Example: Apply compost, Weed control, Maize planting</Text>

                <Text style={s.fieldLabel}>Task Type *</Text>
                <TouchableOpacity style={s.selectInput} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {selectedType ? (
                            <>
                                <Ionicons name={TASK_TYPES.find(t => t.label === selectedType)?.icon as any} size={16} color={TASK_TYPES.find(t => t.label === selectedType)?.color} />
                                <Text style={s.selectText}>{selectedType}</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="sprout" size={16} color="#6B7280" />
                                <Text style={[s.selectText, { color: '#9CA3AF' }]}>Select task type</Text>
                            </>
                        )}
                    </View>
                    <Feather name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                {showTypeDropdown && (
                    <View style={s.dropdown}>
                        <View style={s.searchRow}>
                            <Ionicons name="search" size={16} color="#9CA3AF" />
                            <TextInput
                                style={s.searchInput}
                                placeholder="Search task types..."
                                placeholderTextColor="#9CA3AF"
                                value={typeSearch}
                                onChangeText={setTypeSearch}
                            />
                        </View>
                        {filteredTypes.map((type) => (
                            <TouchableOpacity
                                key={type.label}
                                style={s.dropdownItem}
                                onPress={() => { setSelectedType(type.label); setShowTypeDropdown(false); setTypeSearch(''); }}
                            >
                                <View style={[s.dropdownIconBg, { backgroundColor: type.color + '15' }]}>
                                    <Ionicons name={type.icon as any} size={16} color={type.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.dropdownLabel}>{type.label}</Text>
                                    <Text style={s.dropdownSub}>{type.sub}</Text>
                                </View>
                                <View style={[s.radio, selectedType === type.label && s.radioActive]} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <Text style={s.fieldLabel}>Description</Text>
                <TextInput
                    style={[s.textInput, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Add details about this task (optional)"
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    maxLength={250}
                />
                <Text style={s.charCount}>{description.length}/250</Text>

                {/* 2. Location */}
                <Text style={s.sectionNum}>2. Location</Text>
                <Text style={s.fieldLabel}>Assign to *</Text>
                <View style={s.locationRow}>
                    <TouchableOpacity style={[s.locationOption, assignTo === 'farm' && s.locationActive]} onPress={() => setAssignTo('farm')}>
                        <View style={[s.radioSmall, assignTo === 'farm' && s.radioSmallActive]} />
                        <View style={s.locationIconBg}><MaterialCommunityIcons name="home-flood" size={18} color="#065F46" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.locationTitle} numberOfLines={1}>Whole Farm</Text>
                            <Text style={s.locationSub}>This task applies to the entire farm</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.locationOption, assignTo === 'field' && s.locationActive]} onPress={() => setAssignTo('field')}>
                        <View style={[s.radioSmall, assignTo === 'field' && s.radioSmallActive]} />
                        <View style={s.locationIconBg}><MaterialCommunityIcons name="sprout" size={18} color="#065F46" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.locationTitle} numberOfLines={1}>Specific Field</Text>
                            <Text style={s.locationSub}>Select one or more fields</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={s.fieldLabel}>Field (optional)</Text>
                <TouchableOpacity style={s.selectInput}>
                    <Text style={[s.selectText, { color: '#9CA3AF' }]}>Select field(s)</Text>
                    <Feather name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <Text style={s.hint}>Choose specific field(s) if task is not for the whole farm</Text>

                {/* 3. Task Timing */}
                <Text style={s.sectionNum}>3. Task Timing</Text>
                <View style={s.twoColRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.fieldLabel}>Due Date *</Text>
                        <TouchableOpacity style={s.selectInput}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                <Text style={[s.selectText, { color: '#9CA3AF' }]}>Select due date</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.fieldLabel}>Priority *</Text>
                        <TouchableOpacity style={s.selectInput}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="flag-outline" size={14} color="#6B7280" />
                                <Text style={[s.selectText, { color: '#9CA3AF' }]}>Select priority</Text>
                            </View>
                            <Feather name="chevron-down" size={16} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={s.twoColRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.fieldLabel}>Estimated Duration (optional)</Text>
                        <TouchableOpacity style={s.selectInput}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="time-outline" size={14} color="#6B7280" />
                                <Text style={[s.selectText, { color: '#9CA3AF' }]}>Select duration</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.fieldLabel}>Best Time (optional)</Text>
                        <TouchableOpacity style={s.selectInput}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="sunny-outline" size={14} color="#6B7280" />
                                <Text style={[s.selectText, { color: '#9CA3AF' }]}>Select best time</Text>
                            </View>
                            <Feather name="chevron-down" size={16} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 4. Task Category */}
                <Text style={s.sectionNum}>4. Task Category</Text>
                <View style={s.categoryRow}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.label}
                            style={[s.categoryChip, selectedCategory === cat.label && { backgroundColor: cat.color + '15', borderColor: cat.color }]}
                            onPress={() => setSelectedCategory(cat.label)}
                        >
                            <Ionicons name={cat.icon as any} size={14} color={selectedCategory === cat.label ? cat.color : '#6B7280'} />
                            <Text style={[s.categoryText, selectedCategory === cat.label && { color: cat.color, fontWeight: '700' }]}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 5. Assign & Reminders */}
                <Text style={s.sectionNum}>5. Assign & Reminders</Text>

                <Text style={s.fieldLabel}>Assign To (optional)</Text>
                <TouchableOpacity style={s.selectInput}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="person-outline" size={14} color="#6B7280" />
                        <Text style={[s.selectText, { color: '#9CA3AF' }]}>Select team member or assign to yourself</Text>
                    </View>
                    <Feather name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                <View style={s.reminderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <Ionicons name="notifications-outline" size={20} color="#374151" />
                        <View>
                            <Text style={s.reminderTitle}>Set Reminder</Text>
                            <Text style={s.reminderSub}>Get notified before the task is due</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[s.toggleSwitch, reminderEnabled && s.toggleSwitchActive]}
                        onPress={() => setReminderEnabled(!reminderEnabled)}
                    >
                        <View style={[s.toggleKnob, reminderEnabled && s.toggleKnobActive]} />
                    </TouchableOpacity>
                </View>

                {/* Buttons */}
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSaveTask} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={s.saveBtnText}>Save Task</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/tasks')}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ── Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    navBarWrapper: { position: 'relative' },
    closeBtn: { position: 'absolute', bottom: 12, right: 16, padding: 4, zIndex: 20 },
    scrollContent: { paddingTop: 155, paddingBottom: 40, paddingHorizontal: 16 },

    // Farm Context
    farmCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: '#F3F4F6', gap: 10, alignItems: 'center' },
    farmThumb: { width: 70, height: 60, borderRadius: 10, backgroundColor: '#E5E7EB', overflow: 'hidden' },
    farmName: { fontSize: 14, fontWeight: '800', color: '#111827' },
    primaryBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    primaryBadgeText: { fontSize: 9, fontWeight: '700', color: '#059669' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    metaText: { fontSize: 10, color: '#6B7280' },
    areaBadge: { alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    areaValue: { fontSize: 12, fontWeight: '800', color: '#059669' },
    areaLabel: { fontSize: 8, color: '#6B7280' },

    // Sections
    sectionNum: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
    hint: { fontSize: 10, color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
    charCount: { fontSize: 10, color: '#9CA3AF', textAlign: 'right', marginTop: 4, marginBottom: 12 },

    // Inputs
    textInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111827' },
    selectInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
    selectText: { fontSize: 13, color: '#111827' },

    // Dropdown
    dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    searchInput: { flex: 1, fontSize: 13, color: '#111827', paddingVertical: 0 },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 12 },
    dropdownIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    dropdownLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
    dropdownSub: { fontSize: 10, color: '#9CA3AF' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB' },
    radioActive: { borderColor: '#059669', backgroundColor: '#059669' },

    // Location
    locationRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    locationOption: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, gap: 8 },
    locationActive: { borderColor: '#059669', backgroundColor: '#F0FDF4' },
    locationIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
    locationTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
    locationSub: { fontSize: 9, color: '#9CA3AF' },
    radioSmall: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D1D5DB' },
    radioSmallActive: { borderColor: '#059669', borderWidth: 5 },

    // Two Column
    twoColRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },

    // Categories
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
    categoryText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },

    // Reminder
    reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 28 },
    reminderTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
    reminderSub: { fontSize: 10, color: '#9CA3AF' },
    toggleSwitch: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', paddingHorizontal: 3 },
    toggleSwitchActive: { backgroundColor: '#059669' },
    toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
    toggleKnobActive: { alignSelf: 'flex-end' },

    // Buttons
    saveBtn: { backgroundColor: '#065F46', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    cancelBtn: { alignItems: 'center', paddingVertical: 12 },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
});

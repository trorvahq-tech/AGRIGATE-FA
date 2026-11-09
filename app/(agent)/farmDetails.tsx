import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/apiClient';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width } = Dimensions.get('window');

const TABS = ['Overview', 'Tasks', 'Activity', 'Data'];
const ACTIVITY_TABS = ['All Activities', 'Visits', 'Tasks', 'Validations', 'Notes', 'Photos'];
const DATA_TABS = ['Summary', 'Soil', 'Crops', 'Weather', 'Productivity', 'Regenerative'];

// ── Component ──────────────────────────────────────────────────────────
export default function FarmDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState('Overview');
    const [activeActivityTab, setActiveActivityTab] = useState('Visits');
    const [activeDataTab, setActiveDataTab] = useState('Summary');
    const [fieldsView, setFieldsView] = useState<'list' | 'map'>('list');
    const [activeTaskFilter, setActiveTaskFilter] = useState('All Tasks');

    const [farm, setFarm] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('hybrid');

    useEffect(() => {
        let active = true;
        const loadFarmDetails = async () => {
            try {
                const fId = params.id as string;
                if (!fId) {
                    setLoading(false);
                    return;
                }

                const farmRes = await api.get(`/farms/${fId}`);
                const fieldsRes = await api.get(`/fields?farmId=${fId}`);

                if (active && farmRes.data) {
                    const f = farmRes.data;
                    setFarm({
                        id: f.id,
                        name: f.name || 'Farm',
                        type: 'Primary',
                        farmer: f.farmerName || f.farmer_name || '—',
                        location: f.location || [f.lga, f.state].filter(Boolean).join(', ') || 'Kaduna State',
                        crop: f.primaryCrop || f.primary_crop || '—',
                        area: f.sizeHectares ? `${f.sizeHectares} ha` : '—',
                        totalArea: f.sizeHectares ? `${f.sizeHectares} ha` : '—',
                        createdDate: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '—',
                        description: f.description || f.metadata?.description || `This farm is used for crop production.`,
                        metadata: f.metadata || {},
                        isActive: f.isActive ?? f.is_active ?? true,
                        soilAnalysis: f.soilAnalysis || f.metadata?.soilAnalysis || {},
                    });
                }

                if (active) {
                    const listData = fieldsRes.data?.data || fieldsRes.data || [];
                    if (Array.isArray(listData)) {
                        setFields(listData.map((fd: any) => ({
                            id: fd.id,
                            name: fd.name || 'Subplot A',
                            area: fd.areaHectares ? `${fd.areaHectares} ha` : '—',
                            crops: farmRes.data?.primaryCrop || '—',
                            health: fd.health || 'Healthy',
                            lastUpdated: fd.updatedAt ? new Date(fd.updatedAt).toLocaleDateString() : 'Recently',
                            boundaryGeojson: fd.boundaryGeojson,
                            centroidLat: fd.centroidLat,
                            centroidLng: fd.centroidLng
                        })));
                    } else {
                        setFields([]);
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch dynamic farm/fields data:", err);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadFarmDetails();
        return () => { active = false; };
    }, [params.id]);

    const statusItems = React.useMemo(() => {
        const tasksCompleted = farm?.metadata?.tasksCompleted ?? (Array.isArray(farm?.metadata?.tasks) ? farm.metadata.tasks.filter((t: any) => t.status === 'completed').length : 0);
        const lastVisit = farm?.metadata?.lastVisit || 'Not visited yet';
        const validation = farm?.isActive ? 'Up to date' : 'Pending';
        return [
            { label: 'Farm Status', value: farm?.isActive ? 'Active' : 'Inactive', dot: farm?.isActive ? '#059669' : '#9CA3AF' },
            { label: 'Last Visit', value: lastVisit, icon: 'time-outline', color: '#D97706' },
            { label: 'Validation', value: validation, icon: 'checkmark-circle-outline', color: '#059669' },
            { label: 'Tasks Completed', value: String(tasksCompleted), icon: 'clipboard-outline', color: '#2563EB' },
        ];
    }, [farm]);

    const infoCards = React.useMemo(() => [
        { label: 'Crop', sub: 'Primary Crop', value: farm?.crop || '—', icon: 'leaf-outline', color: '#059669' },
        { label: 'Planting Date', sub: 'Actual', value: farm?.metadata?.plantingDate || 'Not planted yet', icon: 'calendar-outline', color: '#2563EB' },
        { label: 'Expected Harvest', sub: 'Estimated', value: farm?.metadata?.expectedHarvest || 'TBD', icon: 'calendar-outline', color: '#D97706' },
    ], [farm]);

    const stageProgressMap: Record<string, { pct: number; label: string }> = {
        'Not Started': { pct: 0, label: '• Not started yet' },
        'Pre-Planting': { pct: 10, label: '• Pre-planting planning' },
        'Land Prep': { pct: 25, label: '• Land preparation in progress' },
        'Sowing': { pct: 45, label: '• Sowing in progress' },
        'Planting': { pct: 45, label: '• Planting in progress' },
        'Fertilizing': { pct: 65, label: '• Fertilizer application' },
        'Weeding': { pct: 80, label: '• Weeding in progress' },
        'Harvesting': { pct: 95, label: '• Harvesting in progress' },
        'Completed': { pct: 100, label: '• Season completed' },
    };
    const currentCropStage = farm?.metadata?.currentCropStage || 'Not Started';
    const stageInfo = stageProgressMap[currentCropStage] || { pct: 0, label: '• Not started yet' };

    const progressSteps = React.useMemo(() => {
        const stages = ['Land Preparation', 'Planting', 'Weeding', 'Fertilizer', 'Harvesting'];
        const currentIdx = (() => {
            if (currentCropStage === 'Land Prep') return 0;
            if (['Sowing', 'Planting'].includes(currentCropStage)) return 1;
            if (currentCropStage === 'Weeding') return 2;
            if (['Fertilizing', 'Fertilizer'].includes(currentCropStage)) return 3;
            if (currentCropStage === 'Harvesting') return 4;
            if (currentCropStage === 'Completed') return 5;
            return -1;
        })();

        return stages.map((label, idx) => {
            let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
            if (currentIdx !== -1) {
                if (idx < currentIdx) status = 'completed';
                else if (idx === currentIdx) status = 'in-progress';
            }
            return { label, status };
        });
    }, [currentCropStage]);

    const summaryItems = React.useMemo(() => [
        { label: 'Soil Type', value: farm?.metadata?.soilType || farm?.soilAnalysis?.texture || '—', icon: 'leaf-outline', color: '#D97706' },
        { label: 'Topography', value: farm?.metadata?.topography || '—', icon: 'trending-up-outline', color: '#059669' },
        { label: 'Irrigation', value: farm?.metadata?.irrigation || 'Rainfed', icon: 'water-outline', color: '#2563EB' },
        { label: 'Access', value: farm?.metadata?.access || 'Road Access', icon: 'car-outline', color: '#7C3AED' },
    ], [farm]);

    const farmTasks = React.useMemo(() => {
        const rawList: any[] = Array.isArray(farm?.metadata?.tasks) ? farm.metadata.tasks : [];
        const overdue = rawList.filter((t: any) => (t.status || '').toLowerCase() === 'overdue');
        const todo = rawList.filter((t: any) => !t.status || (t.status || '').toLowerCase() === 'todo' || t.status === 'To Do');
        const inProgress = rawList.filter((t: any) => (t.status || '').toLowerCase() === 'in-progress' || (t.status || '').toLowerCase() === 'in_progress');
        const completed = rawList.filter((t: any) => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'done');
        return { overdue, todo, inProgress, completed, total: rawList.length };
    }, [farm]);

    const totalTasks = farmTasks.total;

    // ── Render Helpers ─────────────────────────────────────────────────
    const renderOverviewTab = () => (
        <View style={s.tabContent}>
            {/* Description */}
            <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Overview</Text>
                <TouchableOpacity style={s.editBtn}>
                    <Feather name="edit-2" size={14} color="#059669" />
                    <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
            </View>
            <Text style={s.descriptionText}>{farm?.description}</Text>

            {/* Info Cards Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.infoCardsRow}>
                {infoCards.map((c, i) => (
                    <View key={i} style={s.infoCard}>
                        <Text style={s.infoCardLabel}>{c.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <Ionicons name={c.icon as any} size={18} color={c.color} />
                            <View>
                                <Text style={s.infoCardValue}>{c.value}</Text>
                                <Text style={s.infoCardSub}>{c.sub}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Farm Progress */}
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>Farm Progress</Text></View>
            <View style={s.progressContainer}>
                <View style={s.progressBarBg}>
                    <View style={[s.progressBarFill, { width: `${stageInfo.pct}%` }]} />
                </View>
                <Text style={s.progressPercent}>{stageInfo.pct}%</Text>
            </View>
            <Text style={s.progressLabel}>{stageInfo.label}</Text>
            <View style={s.milestonesRow}>
                {progressSteps.map((step, i) => (
                    <View key={i} style={s.milestoneItem}>
                        <View style={[
                            s.milestoneIcon,
                            step.status === 'completed' && s.milestoneCompleted,
                            step.status === 'in-progress' && s.milestoneInProgress,
                        ]}>
                            {step.status === 'completed' ? (
                                <Ionicons name="checkmark" size={14} color="#fff" />
                            ) : step.status === 'in-progress' ? (
                                <View style={s.milestoneInnerDot} />
                            ) : (
                                <Ionicons name="lock-closed-outline" size={12} color="#9CA3AF" />
                            )}
                        </View>
                        <Text style={[
                            s.milestoneLabel,
                            step.status === 'completed' && { color: '#059669' },
                            step.status === 'in-progress' && { color: '#D97706', fontWeight: '700' },
                        ]}>{step.label}</Text>
                        <Text style={[
                            s.milestoneStatus,
                            step.status === 'completed' && { color: '#059669' },
                            step.status === 'in-progress' && { color: '#D97706' },
                        ]}>{step.status === 'completed' ? 'Completed' : step.status === 'in-progress' ? 'In Progress' : 'Not Started'}</Text>
                    </View>
                ))}
            </View>

            {/* Farm Summary */}
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>Farm Summary</Text></View>
            <View style={s.summaryGrid}>
                {summaryItems.map((item, i) => (
                    <View key={i} style={s.summaryItem}>
                        <View style={[s.summaryIconBg, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon as any} size={16} color={item.color} />
                        </View>
                        <View>
                            <Text style={s.summaryLabel}>{item.label}</Text>
                            <Text style={s.summaryValue}>{item.value}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Notes */}
            <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Notes</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => setActiveTab('Activity')}>
                    <Text style={s.viewAllLink}>View All Notes</Text>
                    <Feather name="chevron-right" size={14} color="#059669" />
                </TouchableOpacity>
            </View>
            {farm?.metadata?.notes && farm.metadata.notes.length > 0 ? (
                <View style={s.noteCard}>
                    <Text style={s.noteText}>{farm.metadata.notes[0].text || farm.metadata.notes[0].desc}</Text>
                    <Text style={s.noteMeta}>{farm.metadata.notes[0].date || ''} · {farm.metadata.notes[0].author || 'Field Agent'}</Text>
                </View>
            ) : (
                <View style={{ padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>No notes recorded for this farm yet.</Text>
                </View>
            )}

            {/* Subplots / Fields */}
            <View style={[s.sectionHeader, { marginTop: 24 }]}>
                <View>
                    <Text style={s.sectionTitle}>Fields / Subplots ({fields.length})</Text>
                    <Text style={s.sectionSubtitle}>Subplots are rendered as overlays on the header map.</Text>
                </View>
            </View>

            {fields.length === 0 ? (
                <View style={{ padding: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', marginBottom: 16 }}>
                    <MaterialCommunityIcons name="sprout-outline" size={32} color="#9CA3AF" style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>No Fields / Subplots</Text>
                    <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' }}>No subplots registered for this farm yet.</Text>
                </View>
            ) : (
                fields.map((field) => (
                    <TouchableOpacity key={field.id} style={s.fieldCard}>
                        <View style={s.fieldCardTop}>
                            <View style={s.fieldIconBg}>
                                <MaterialCommunityIcons name="sprout" size={20} color="#065F46" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={s.fieldName}>{field.name}</Text>
                                    <Text style={s.fieldArea}>{field.area}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                    <Ionicons name="leaf-outline" size={12} color="#6B7280" />
                                    <Text style={s.fieldCrops}>{field.crops}</Text>
                                </View>
                                {field.maize ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <MaterialCommunityIcons name="chart-bar" size={12} color="#6B7280" />
                                        <Text style={s.fieldCrops}>Maize {field.maize || 100}% {field.cowpea ? ` ·  Cowpea ${field.cowpea}%` : ''}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' }} />
                                    <Text style={s.fieldHealth}>{field.health}</Text>
                                </View>
                                <Text style={s.fieldUpdated}>Last updated</Text>
                                <Text style={s.fieldUpdated}>{field.lastUpdated}</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={16} color="#D1D5DB" style={{ position: 'absolute', right: 12, top: '50%' }} />
                    </TouchableOpacity>
                ))
            )}

            <View style={s.addFieldRow}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="sprout-outline" size={18} color="#065F46" />
                        <Text style={s.addFieldTip}>Intercropping maize with cowpea improves soil fertility, reduces erosion and increases overall yield.</Text>
                    </View>
                </View>
                <TouchableOpacity style={s.addFieldBtn} onPress={() => router.push({ pathname: '/(agent)/addSubplot', params: { farmId: params.id } })}>
                    <Ionicons name="add-circle-outline" size={16} color="#065F46" />
                    <Text style={s.addFieldBtnText}>Add Field</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderTaskItem = (task: any, statusLabel: string, statusColor: string) => (
        <TouchableOpacity key={task.id} style={s.taskItem}>
            <View style={[s.taskDot, { borderColor: statusColor }]}>
                {statusLabel === 'Completed' && <Ionicons name="checkmark" size={12} color={statusColor} />}
                {statusLabel === 'Overdue' && <Ionicons name="alert" size={12} color={statusColor} />}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.taskTitle}>{task.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    {task.type ? <><Ionicons name="construct-outline" size={10} color="#6B7280" /><Text style={s.taskMeta}>{task.type}</Text></> : null}
                    {task.field ? <><MaterialCommunityIcons name="chart-bar" size={10} color="#6B7280" /><Text style={s.taskMeta}>{task.field}</Text></> : null}
                    {task.crop ? <Text style={s.taskMeta}>{task.crop}</Text> : null}
                </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.taskStatus, { color: statusColor }]}>{statusLabel}</Text>
                <Text style={s.taskDue}>{statusLabel === 'Completed' ? `Completed: ${task.due}` : `Due: ${task.due}`}</Text>
            </View>
            <Feather name="chevron-right" size={14} color="#D1D5DB" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
    );

    const renderTasksTab = () => {
        const displayedTasks = activeTaskFilter === 'All Tasks'
            ? [...farmTasks.overdue, ...farmTasks.todo, ...farmTasks.inProgress, ...farmTasks.completed]
            : activeTaskFilter === 'Overdue' ? farmTasks.overdue
            : activeTaskFilter === 'To Do' ? farmTasks.todo
            : activeTaskFilter === 'In Progress' ? farmTasks.inProgress
            : farmTasks.completed;

        return (
            <View style={s.tabContent}>
                <View style={s.sectionHeader}>
                    <View>
                        <Text style={s.sectionTitle}>Tasks ({totalTasks})</Text>
                        <Text style={s.sectionSubtitle}>View and manage all tasks for this farm.</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={s.addTaskBtn} onPress={() => router.push({ pathname: '/(agent)/addFarmTask', params: { farmId: params.id } })}>
                            <Ionicons name="add" size={16} color="#fff" />
                            <Text style={s.addTaskBtnText}>Add Task</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterPillsRow}>
                    {[
                        { label: 'All Tasks', count: totalTasks, color: '#111827' },
                        { label: 'To Do', count: farmTasks.todo.length, color: '#D97706' },
                        { label: 'In Progress', count: farmTasks.inProgress.length, color: '#2563EB' },
                        { label: 'Completed', count: farmTasks.completed.length, color: '#059669' },
                        { label: 'Overdue', count: farmTasks.overdue.length, color: '#DC2626' },
                    ].map((pill) => (
                        <TouchableOpacity
                            key={pill.label}
                            style={[s.filterPill, activeTaskFilter === pill.label && { borderColor: pill.color, backgroundColor: pill.color + '08' }]}
                            onPress={() => setActiveTaskFilter(pill.label)}
                        >
                            <Text style={[s.filterPillLabel, activeTaskFilter === pill.label && { color: pill.color }]}>{pill.label}</Text>
                            <Text style={[s.filterPillCount, { color: pill.color }]}>{pill.count}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {totalTasks === 0 ? (
                    <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 12 }}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#9CA3AF" />
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Tasks Assigned</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                            There are currently no tasks recorded for this farm. Tap "Add Task" to create field operations.
                        </Text>
                    </View>
                ) : displayedTasks.length === 0 ? (
                    <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 12 }}>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>No {activeTaskFilter.toLowerCase()} tasks for this farm.</Text>
                    </View>
                ) : (
                    <View style={s.taskGroup}>
                        {displayedTasks.map((t) => {
                            const status = (t.status || 'To Do').toLowerCase();
                            const statusColor = status === 'completed' ? '#059669' : status === 'overdue' ? '#DC2626' : status.includes('progress') ? '#2563EB' : '#D97706';
                            const statusLabel = status === 'completed' ? 'Completed' : status === 'overdue' ? 'Overdue' : status.includes('progress') ? 'In Progress' : 'To Do';
                            return renderTaskItem(t, statusLabel, statusColor);
                        })}
                    </View>
                )}
            </View>
        );
    };

    const renderActivityTab = () => {
        const visits = Array.isArray(farm?.metadata?.visits) ? farm.metadata.visits : [];
        const validations = Array.isArray(farm?.metadata?.validations) ? farm.metadata.validations : [];
        const notes = Array.isArray(farm?.metadata?.notes) ? farm.metadata.notes : [];
        const photos = Array.isArray(farm?.metadata?.photos) ? farm.metadata.photos : [];

        return (
            <View style={s.tabContent}>
                {/* Activity Nav Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.innerTabsScroll}>
                    {ACTIVITY_TABS.map((tab) => (
                        <TouchableOpacity key={tab} style={[s.innerTabBtn, activeActivityTab === tab && s.innerTabBtnActive]} onPress={() => setActiveActivityTab(tab)}>
                            {tab === 'Photos' ? <Ionicons name="images-outline" size={14} color={activeActivityTab === tab ? '#fff' : '#6B7280'} /> : null}
                            {tab === 'Calendar' ? <Ionicons name="calendar-outline" size={14} color={activeActivityTab === tab ? '#fff' : '#6B7280'} /> : null}
                            {tab !== 'Calendar' && tab !== 'Photos' && <Text style={[s.innerTabText, activeActivityTab === tab && s.innerTabTextActive]}>{tab}</Text>}
                            {tab === 'Photos' && <Text style={[s.innerTabText, activeActivityTab === tab && s.innerTabTextActive]}>Photos</Text>}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {activeActivityTab === 'Visits' && (
                    <View>
                        <View style={s.sectionHeader}>
                            <View>
                                <Text style={s.sectionTitle}>Farm Visits ({visits.length})</Text>
                                <Text style={s.sectionSubtitle}>All visits are geo-tagged and recorded on the map.</Text>
                            </View>
                        </View>
                        <View style={s.statsCardRow}>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F0FDF4' }]}><Ionicons name="person-add-outline" size={16} color="#059669" /></View><Text style={s.statsCardValue}>{visits.length}</Text><Text style={s.statsCardLabel}>Total Visits</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}><Ionicons name="clipboard-outline" size={16} color="#2563EB" /></View><Text style={s.statsCardValue}>{visits.filter((v: any) => v.thisMonth).length}</Text><Text style={s.statsCardLabel}>This Month</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#FFF7ED' }]}><Ionicons name="person-outline" size={16} color="#D97706" /></View><Text style={s.statsCardValue}>{visits.filter((v: any) => v.byUser).length}</Text><Text style={s.statsCardLabel}>By You</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F5F3FF' }]}><Ionicons name="people-outline" size={16} color="#7C3AED" /></View><Text style={s.statsCardValue}>{visits.filter((v: any) => !v.byUser).length}</Text><Text style={s.statsCardLabel}>By Team</Text></View>
                        </View>
                        {visits.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 16 }}>
                                <Ionicons name="location-outline" size={40} color="#9CA3AF" />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Farm Visits Yet</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                                    Geo-tagged field visits logged on this farm will appear here.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={s.listTitle}>Recent Visits</Text>
                                {visits.map((v: any, i: number) => (
                                    <View key={v.id || i} style={s.activityListItem}>
                                        <View style={s.timelineLine} />
                                        <View style={s.timelineDot}><Text style={s.timelineDotText}>{i + 1}</Text></View>
                                        <View style={s.activityContent}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                <Text style={s.activityTitle} numberOfLines={1}>{v.title || 'Field Visit'}</Text>
                                                <View style={[s.roleBadge, v.role === 'Team' && { backgroundColor: '#EFF6FF' }]}>
                                                    <Text style={[s.roleBadgeText, v.role === 'Team' && { color: '#2563EB' }]}>{v.role || 'Agent'}</Text>
                                                </View>
                                            </View>
                                            <Text style={s.activityDesc} numberOfLines={2}>{v.desc || v.notes || 'Routine check conducted.'}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                                <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                                                <Text style={s.activityMeta}>{v.date || 'Recent'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                )}

                {activeActivityTab === 'Validations' && (
                    <View>
                        <View style={s.sectionHeader}>
                            <View>
                                <Text style={s.sectionTitle}>Validations ({validations.length})</Text>
                                <Text style={s.sectionSubtitle}>All validations conducted on this farm.</Text>
                            </View>
                        </View>
                        <View style={s.statsCardRow}>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F0FDF4' }]}><Ionicons name="shield-checkmark-outline" size={16} color="#059669" /></View><Text style={s.statsCardValue}>{validations.length}</Text><Text style={s.statsCardLabel}>Total</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F5F3FF' }]}><Ionicons name="checkmark-circle-outline" size={16} color="#7C3AED" /></View><Text style={s.statsCardValue}>{validations.filter((v: any) => v.status === 'Passed').length}</Text><Text style={s.statsCardLabel}>Passed</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#FFF7ED' }]}><Ionicons name="warning-outline" size={16} color="#D97706" /></View><Text style={s.statsCardValue}>{validations.filter((v: any) => v.needsAction).length}</Text><Text style={s.statsCardLabel}>Needs Action</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#FEF2F2' }]}><Ionicons name="close-circle-outline" size={16} color="#DC2626" /></View><Text style={s.statsCardValue}>{validations.filter((v: any) => v.status === 'Failed').length}</Text><Text style={s.statsCardLabel}>Failed</Text></View>
                        </View>
                        {validations.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 16 }}>
                                <Ionicons name="shield-checkmark-outline" size={40} color="#9CA3AF" />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Validations Conducted</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                                    Farm compliance and agronomic validations will be displayed here.
                                </Text>
                            </View>
                        ) : (
                            validations.map((v: any) => (
                                <View key={v.id} style={s.activityListItemCard}>
                                    <View style={[s.iconBox, { backgroundColor: v.needsAction ? '#FFF7ED' : '#F5F3FF' }]}>
                                        <Ionicons name="shield-checkmark-outline" size={16} color={v.needsAction ? '#D97706' : '#7C3AED'} />
                                    </View>
                                    <View style={[s.activityContent, { paddingLeft: 12 }]}>
                                        <Text style={s.activityTitle} numberOfLines={1}>{v.title}</Text>
                                        <Text style={s.activityDesc} numberOfLines={2}>{v.desc}</Text>
                                        <Text style={s.activityMeta}>{v.date} · By {v.author || 'Validator'}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {activeActivityTab === 'Notes' && (
                    <View>
                        <View style={s.sectionHeader}>
                            <View>
                                <Text style={s.sectionTitle}>Notes ({notes.length})</Text>
                                <Text style={s.sectionSubtitle}>All notes recorded on this farm.</Text>
                            </View>
                        </View>
                        <View style={s.statsCardRow}>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F0FDF4' }]}><Ionicons name="document-text-outline" size={16} color="#059669" /></View><Text style={s.statsCardValue}>{notes.length}</Text><Text style={s.statsCardLabel}>Total Notes</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#FFF7ED' }]}><Ionicons name="calendar-outline" size={16} color="#D97706" /></View><Text style={s.statsCardValue}>{notes.length}</Text><Text style={s.statsCardLabel}>This Month</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F5F3FF' }]}><Ionicons name="person-outline" size={16} color="#7C3AED" /></View><Text style={s.statsCardValue}>{notes.length}</Text><Text style={s.statsCardLabel}>By You</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}><Ionicons name="people-outline" size={16} color="#2563EB" /></View><Text style={s.statsCardValue}>0</Text><Text style={s.statsCardLabel}>By Team</Text></View>
                        </View>
                        {notes.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 16 }}>
                                <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Notes Recorded</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                                    Field agent observations and agronomist notes will appear here.
                                </Text>
                            </View>
                        ) : (
                            notes.map((n: any, idx: number) => (
                                <View key={n.id || idx} style={s.activityListItem}>
                                    <View style={s.timelineLine} />
                                    <View style={[s.timelineDotBox, { backgroundColor: '#05966915', borderColor: '#05966930' }]}>
                                        <Ionicons name="document-text-outline" size={12} color="#059669" />
                                    </View>
                                    <View style={s.activityContent}>
                                        <Text style={s.activityTitle} numberOfLines={1}>{n.title || 'Field Note'}</Text>
                                        <Text style={s.activityDesc} numberOfLines={2}>{n.text || n.desc}</Text>
                                        <Text style={s.activityMeta}>By {n.author || 'Agent'} • {n.date || 'Recent'}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {activeActivityTab === 'Photos' && (
                    <View>
                        <View style={s.sectionHeader}>
                            <View>
                                <Text style={s.sectionTitle}>Photos ({photos.length})</Text>
                                <Text style={s.sectionSubtitle}>All photos captured on this farm.</Text>
                            </View>
                        </View>
                        <View style={s.statsCardRow}>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F0FDF4' }]}><Ionicons name="images-outline" size={16} color="#059669" /></View><Text style={s.statsCardValue}>{photos.length}</Text><Text style={s.statsCardLabel}>Total Photos</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}><Ionicons name="calendar-outline" size={16} color="#2563EB" /></View><Text style={s.statsCardValue}>{photos.length}</Text><Text style={s.statsCardLabel}>This Month</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F5F3FF' }]}><Ionicons name="person-outline" size={16} color="#7C3AED" /></View><Text style={s.statsCardValue}>{photos.length}</Text><Text style={s.statsCardLabel}>By You</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#FFF7ED' }]}><Ionicons name="people-outline" size={16} color="#D97706" /></View><Text style={s.statsCardValue}>0</Text><Text style={s.statsCardLabel}>By Team</Text></View>
                        </View>
                        {photos.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 16 }}>
                                <Ionicons name="images-outline" size={40} color="#9CA3AF" />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Photos Uploaded</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                                    Geo-tagged photos taken during field visits and crop scouting will appear here.
                                </Text>
                            </View>
                        ) : (
                            <View style={s.photoGrid}>
                                {photos.map((p: any, i: number) => (
                                    <View key={i} style={s.photoCard}>
                                        <Image source={{ uri: p.image || p.url }} style={s.photoImage} contentFit="cover" />
                                        <View style={s.photoDetails}>
                                            <Text style={s.photoTitle} numberOfLines={1}>{p.title || 'Farm Photo'}</Text>
                                            <Text style={s.photoAuthor}>By {p.author || 'Agent'} · {p.date || ''}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {activeActivityTab === 'All Activities' && (
                    <View>
                        <Text style={s.listTitle}>Timeline</Text>
                        <Text style={s.sectionSubtitle}>A unified timeline of all farm activities.</Text>
                        {visits.length === 0 && farmTasks.total === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 16 }}>
                                <Ionicons name="time-outline" size={40} color="#9CA3AF" />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Activities Yet</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                                    Visits, validations, and task completions will build this timeline.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 16 }}>
                                {visits.map((v: any, i: number) => (
                                    <View key={v.id || i} style={s.activityListItem}>
                                        <View style={s.timelineLine} />
                                        <View style={s.timelineDot}><Text style={s.timelineDotText}>{i + 1}</Text></View>
                                        <View style={s.activityContent}>
                                            <Text style={s.activityTitle} numberOfLines={1}>{v.title || 'Field Activity'}</Text>
                                            <Text style={s.activityDesc} numberOfLines={2}>{v.desc || 'Activity logged.'}</Text>
                                            <Text style={s.activityMeta}>{v.date || 'Recent'}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {activeActivityTab === 'Tasks' && (
                    <View>
                        <Text style={s.listTitle}>Task Feed</Text>
                        <Text style={s.sectionSubtitle}>Task state changes sorted by latest activity.</Text>
                        {farmTasks.total === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 16 }}>
                                <Ionicons name="checkbox-outline" size={40} color="#9CA3AF" />
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 }}>No Task Feed</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                                    Task events will appear here once tasks are scheduled or completed.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 16 }}>
                                {farmTasks.completed.map((t: any) => (
                                    <View key={t.id} style={s.activityListItem}>
                                        <View style={s.timelineLine} />
                                        <View style={[s.timelineDotBox, { backgroundColor: '#ECFDF5' }]}><Ionicons name="checkmark" size={12} color="#059669" /></View>
                                        <View style={s.activityContent}>
                                            <Text style={s.activityTitle} numberOfLines={1}>{t.title}</Text>
                                            <Text style={s.activityDesc} numberOfLines={2}>Completed: {t.due || 'Done'}</Text>
                                        </View>
                                    </View>
                                ))}
                                {farmTasks.todo.map((t: any) => (
                                    <View key={t.id} style={s.activityListItem}>
                                        <View style={s.timelineLine} />
                                        <View style={[s.timelineDotBox, { backgroundColor: '#FFF7ED', borderColor: '#FFF7ED' }]}><Ionicons name="time" size={12} color="#D97706" /></View>
                                        <View style={s.activityContent}>
                                            <Text style={s.activityTitle} numberOfLines={1}>{t.title}</Text>
                                            <Text style={s.activityDesc} numberOfLines={2}>Due: {t.due || 'Pending'}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {activeActivityTab === 'Calendar' && (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <Ionicons name="calendar-outline" size={64} color="#E5E7EB" />
                        <Text style={[s.emptyTitle, { marginTop: 16 }]}>Calendar View</Text>
                        <Text style={s.emptySub}>A full month calendar visualization marking</Text>
                        <Text style={s.emptySub}>days with recorded activity will appear here.</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderDataTab = () => {
        const soil = farm?.soilAnalysis || {};
        const hasSoilData = Boolean(soil.ph || soil.n || soil.texture || farm?.metadata?.soilHealth);
        const dataRecords: any[] = Array.isArray(farm?.metadata?.dataRecords) ? farm.metadata.dataRecords : [];

        return (
            <View style={s.tabContent}>
                <View style={s.sectionHeader}>
                    <View>
                        <Text style={s.sectionTitle}>Farm Data</Text>
                        <Text style={s.sectionSubtitle}>Key agronomic data collected from this farm.</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.innerTabsScroll, { marginBottom: 20 }]}>
                    {DATA_TABS.map((tab) => (
                        <TouchableOpacity key={tab} style={[s.innerTabBtn, activeDataTab === tab && s.innerTabBtnActive]} onPress={() => setActiveDataTab(tab)}>
                            <Text style={[s.innerTabText, activeDataTab === tab && s.innerTabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {activeDataTab === 'Summary' && (
                    <View>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitleSmall}>Key Indicators</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.indicatorsRow}>
                            <View style={s.indicatorCard}>
                                <Ionicons name="leaf-outline" size={16} color="#059669" />
                                <Text style={s.indicatorValue}>{soil.healthScore || farm?.metadata?.soilHealth || (hasSoilData ? 'Good' : 'Pending')}</Text>
                                <Text style={s.indicatorLabel}>Soil Health Index</Text>
                                <View style={s.indicatorBadge}><Text style={s.indicatorBadgeText}>{hasSoilData ? 'Assessed' : 'Not Tested'}</Text></View>
                            </View>
                            <View style={s.indicatorCard}>
                                <Ionicons name="water-outline" size={16} color="#2563EB" />
                                <Text style={s.indicatorValue}>{soil.moisture || farm?.metadata?.moisture || (hasSoilData ? 'Optimal' : 'Pending')}</Text>
                                <Text style={s.indicatorLabel}>Soil Moisture</Text>
                                <View style={[s.indicatorBadge, { backgroundColor: '#EFF6FF' }]}><Text style={[s.indicatorBadgeText, { color: '#2563EB' }]}>{hasSoilData ? 'Measured' : 'Not Tested'}</Text></View>
                            </View>
                            <View style={s.indicatorCard}>
                                <Ionicons name="leaf-outline" size={16} color="#7C3AED" />
                                <Text style={s.indicatorValue}>{farm?.metadata?.estBiomass || '—'}</Text>
                                <Text style={s.indicatorLabel}>Est. Biomass</Text>
                                <View style={[s.indicatorBadge, { backgroundColor: '#F5F3FF' }]}><Text style={[s.indicatorBadgeText, { color: '#7C3AED' }]}>TBD</Text></View>
                            </View>
                            <View style={s.indicatorCard}>
                                <Ionicons name="cloud-outline" size={16} color="#D97706" />
                                <Text style={s.indicatorValue}>{farm?.metadata?.carbonSequestered || '—'}</Text>
                                <Text style={s.indicatorLabel} numberOfLines={1}>Carbon Sequestered</Text>
                                <Text style={s.indicatorSubtext}>This Season</Text>
                            </View>
                        </ScrollView>

                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitleSmall}>Recent Data Records</Text>
                        </View>
                        {dataRecords.length === 0 ? (
                            <View style={{ padding: 24, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>No Data Records</Text>
                                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                                    Geo-tagged agronomic records and soil readings will appear here once sampled.
                                </Text>
                            </View>
                        ) : (
                            <View style={s.dataRecordsGrid}>
                                <View style={s.dataRecordHeader}>
                                    <Text style={[s.dataRecordCol, { flex: 2 }]}>Data Type</Text>
                                    <Text style={s.dataRecordCol}>Value</Text>
                                    <Text style={s.dataRecordCol}>Date Collected</Text>
                                </View>
                                {dataRecords.map((d: any, idx: number) => (
                                    <View key={d.id || idx} style={s.dataRecordRow}>
                                        <Text style={[s.dataRecordTitle, { flex: 2 }]}>{d.type}</Text>
                                        <Text style={s.dataRecordValue}>{d.value}</Text>
                                        <Text style={s.dataRecordDate}>{d.date}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {activeDataTab === 'Soil' && (
                    <View style={[s.tabContent, { paddingVertical: 20 }]}>
                        <Text style={s.listTitle}>Soil Profile</Text>
                        <View style={s.statsCardRow}>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F0FDF4' }]}><Ionicons name="beaker-outline" size={16} color="#059669" /></View><Text style={s.statsCardValue}>{soil.ph || '—'}</Text><Text style={s.statsCardLabel}>pH Level</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}><Ionicons name="leaf-outline" size={16} color="#2563EB" /></View><Text style={s.statsCardValue}>{soil.n || '—'}</Text><Text style={s.statsCardLabel}>Nitrogen (N)</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#FFF7ED' }]}><Ionicons name="apps-outline" size={16} color="#D97706" /></View><Text style={s.statsCardValue}>{soil.p || '—'}</Text><Text style={s.statsCardLabel}>Phosphorus (P)</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F5F3FF' }]}><Ionicons name="flask-outline" size={16} color="#7C3AED" /></View><Text style={s.statsCardValue}>{soil.k || '—'}</Text><Text style={s.statsCardLabel}>Potassium (K)</Text></View>
                        </View>
                        <View style={{ padding: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 16, alignItems: 'center' }}>
                            <Ionicons name="beaker-outline" size={36} color="#9CA3AF" />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 8 }}>
                                {hasSoilData ? 'Soil Sample Profile' : 'Soil Analysis Pending'}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                                {hasSoilData ? `Texture: ${soil.texture || 'Loam'}` : 'Soil analysis test has not been performed on this farm yet. Dispatch a soil sampling kit to record metrics.'}
                            </Text>
                        </View>
                    </View>
                )}

                {activeDataTab === 'Crops' && (
                    <View style={[s.tabContent, { paddingVertical: 20 }]}>
                        <Text style={s.listTitle}>Growth Stages</Text>
                        <View style={s.statsCardRow}>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F0FDF4' }]}><Ionicons name="leaf-outline" size={16} color="#059669" /></View><Text style={s.statsCardValue}>{currentCropStage}</Text><Text style={s.statsCardLabel}>Current Stage</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#F5F3FF' }]}><Ionicons name="flower-outline" size={16} color="#7C3AED" /></View><Text style={s.statsCardValue}>{farm?.crop || '—'}</Text><Text style={s.statsCardLabel}>Primary Crop</Text></View>
                        </View>
                    </View>
                )}

                {activeDataTab === 'Weather' && (
                    <View style={[s.tabContent, { paddingVertical: 20 }]}>
                        <Text style={s.listTitle}>Current Conditions</Text>
                        <View style={s.statsCardRow}>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#FFF7ED' }]}><Ionicons name="sunny-outline" size={16} color="#D97706" /></View><Text style={s.statsCardValue}>31°C</Text><Text style={s.statsCardLabel}>Temperature</Text></View>
                            <View style={s.statsCard}><View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}><Ionicons name="water-outline" size={16} color="#2563EB" /></View><Text style={s.statsCardValue}>48%</Text><Text style={s.statsCardLabel}>Humidity</Text></View>
                        </View>
                    </View>
                )}

                {activeDataTab === 'Productivity' && (
                    <View style={[s.tabContent, { paddingVertical: 20 }]}>
                        <Text style={s.listTitle}>Yield Tracking</Text>
                        <View style={{ padding: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
                            <Ionicons name="bar-chart-outline" size={36} color="#9CA3AF" />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 8 }}>Yield Projections</Text>
                            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                                {currentCropStage === 'Not Started' || currentCropStage === 'Land Prep'
                                    ? 'Yield estimates will be calculated once sowing and vegetative stages are reached.'
                                    : `Estimated Yield: ${farm?.metadata?.yieldEst || '3.5 - 4.0 t/ha'}`}
                            </Text>
                        </View>
                    </View>
                )}

                {activeDataTab === 'Regenerative' && (
                    <View style={[s.tabContent, { paddingVertical: 20 }]}>
                        <Text style={s.listTitle}>Regenerative Practices</Text>
                        <View style={{ padding: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#065F46', marginBottom: 6 }}>Practices Followed</Text>
                            <Text style={{ fontSize: 12, color: '#4B5563', lineHeight: 18 }}>
                                {farm?.metadata?.regenerativePractices || 'Cover cropping, minimum tillage, crop rotation with legumes to preserve soil biome.'}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // ── Main Render ────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="dark" />

            {/* Nav Bar */}
            <CustomBackNavBar 
                title="Farm Details" 
                onBackPress={() => router.back()} 
                rightIcon={<Feather name="more-horizontal" size={24} color="#111827" />}
                onRightPress={() => {}}
            />

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Dynamic Map Header Card */}
                <View style={s.mapHeaderContainer}>
                    <MapView
                        style={StyleSheet.absoluteFill}
                        provider={PROVIDER_DEFAULT}
                        mapType={mapType}
                        initialRegion={{
                            latitude: (fields.length > 0 && parseFloat(fields[0]?.centroidLat)) || 11.08,
                            longitude: (fields.length > 0 && parseFloat(fields[0]?.centroidLng)) || 7.71,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.015,
                        }}
                    >
                        {fields.map((field) => {
                            const geojson = field.boundaryGeojson;
                            if (geojson && geojson.type === 'Polygon' && Array.isArray(geojson.coordinates) && Array.isArray(geojson.coordinates[0])) {
                                const validCoords = geojson.coordinates[0]
                                    .map((c: any) => ({
                                        latitude: parseFloat(c[1]),
                                        longitude: parseFloat(c[0])
                                    }))
                                    .filter((c: any) => isFinite(c.latitude) && isFinite(c.longitude));

                                if (validCoords.length >= 3) {
                                    const centLat = parseFloat(field.centroidLat);
                                    const centLng = parseFloat(field.centroidLng);
                                    const hasValidCentroid = isFinite(centLat) && isFinite(centLng);

                                    return (
                                        <React.Fragment key={field.id}>
                                            <Polygon
                                                coordinates={validCoords}
                                                strokeColor="#0E6F6A"
                                                fillColor="rgba(14, 111, 106, 0.4)"
                                                strokeWidth={2.5}
                                            />
                                            {hasValidCentroid && (
                                                <Marker
                                                    coordinate={{ latitude: centLat, longitude: centLng }}
                                                    title={field.name}
                                                    description={`Area: ${field.area}`}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                }
                            }
                            return null;
                        })}
                    </MapView>

                    {/* Floating Map Controls */}
                    <View style={s.mapControls}>
                        <TouchableOpacity 
                            style={[s.mapControlBtn, mapType === 'standard' && s.mapControlBtnActive]} 
                            onPress={() => setMapType('standard')}
                        >
                            <Text style={[s.mapControlText, mapType === 'standard' && s.mapControlTextActive]}>Terrain</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[s.mapControlBtn, mapType === 'satellite' && s.mapControlBtnActive]} 
                            onPress={() => setMapType('satellite')}
                        >
                            <Text style={[s.mapControlText, mapType === 'satellite' && s.mapControlTextActive]}>Satellite</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[s.mapControlBtn, mapType === 'hybrid' && s.mapControlBtnActive]} 
                            onPress={() => setMapType('hybrid')}
                        >
                            <Text style={[s.mapControlText, mapType === 'hybrid' && s.mapControlTextActive]}>Hybrid</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Farm Header Card */}
                <View style={s.farmHeaderCard}>
                    <View style={s.farmHeaderRow}>
                        <View style={s.farmThumb}>
                            <Image source={require('../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={s.farmHeaderName}>{farm?.name}</Text>
                                <View style={s.primaryBadge}><Text style={s.primaryBadgeText}>{farm?.type}</Text></View>
                            </View>
                            <View style={s.farmMetaRow}><Ionicons name="person-outline" size={12} color="#6B7280" /><Text style={s.farmMetaText}>{farm?.farmer}</Text></View>
                            <View style={s.farmMetaRow}><Ionicons name="location-outline" size={12} color="#6B7280" /><Text style={s.farmMetaText}>{farm?.location}</Text></View>
                            <View style={s.farmMetaRow}><Ionicons name="leaf-outline" size={12} color="#6B7280" /><Text style={s.farmMetaText}>{farm?.crop} · {farm?.area}</Text></View>
                            <View style={s.farmMetaRow}><Ionicons name="calendar-outline" size={12} color="#6B7280" /><Text style={s.farmMetaText}>Created on {farm?.createdDate}</Text></View>
                        </View>
                        <View style={s.areaBadge}>
                            <Text style={s.areaBadgeValue}>{farm?.totalArea}</Text>
                            <Text style={s.areaBadgeLabel}>Total Area</Text>
                        </View>
                    </View>
                </View>

                {/* Status Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statusBarRow}>
                    {statusItems.map((item, i) => (
                        <View key={i} style={s.statusCard}>
                            {item.dot ? (
                                <View style={[s.statusDot, { backgroundColor: item.dot }]} />
                            ) : (
                                <Ionicons name={item.icon as any} size={18} color={item.color} />
                            )}
                            <Text style={s.statusValue}>{item.value}</Text>
                            <Text style={s.statusLabel}>{item.label}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Tab Navigation */}
                <View style={s.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
                        {TABS.map((tab) => (
                            <TouchableOpacity key={tab} style={s.tabItem} onPress={() => setActiveTab(tab)}>
                                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
                                {activeTab === tab && <View style={s.tabIndicator} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tab Content */}
                {activeTab === 'Overview' && renderOverviewTab()}
                {activeTab === 'Tasks' && renderTasksTab()}
                {activeTab === 'Activity' && renderActivityTab()}
                {activeTab === 'Data' && renderDataTab()}
            </ScrollView>

            {/* Floating Footer */}
            <View style={s.footer}>
                <TouchableOpacity style={s.outlineFooterBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color="#065F46" />
                    <Text style={s.outlineFooterBtnText}>Send Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={s.outlineFooterBtn}
                    onPress={() => router.push({ 
                        pathname: '/(agent)/call-farmer', 
                        params: { 
                            farmerName: farm?.farmer, 
                            farmName: farm?.name, 
                            phone: farm?.metadata?.farmerPhone, 
                            area: farm?.area, 
                            crop: farm?.crop, 
                            location: farm?.location 
                        } 
                    })}
                >
                    <Ionicons name="call-outline" size={18} color="#065F46" />
                    <Text style={s.outlineFooterBtnText}>Call Farmer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={s.filledFooterBtn} 
                    onPress={() => router.push({ pathname: '/(agent)/addFarmTask', params: { farmId: params.id } })}
                >
                    <Ionicons name="add" size={22} color="white" />
                    <Text style={s.filledFooterBtnText}>Add Task</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    navBarWrapper: { position: 'relative' },
    moreBtn: { position: 'absolute', bottom: 12, right: 16, padding: 4, zIndex: 20 },
    scrollContent: { paddingTop: 155, paddingBottom: 160 },

    mapHeaderContainer: {
        height: 280,
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2
    },
    mapControls: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    mapControlBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    mapControlBtnActive: {
        backgroundColor: '#065F46',
    },
    mapControlText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
    },
    mapControlTextActive: {
        color: '#FFFFFF',
    },

    // Farm Header
    farmHeaderCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    farmHeaderRow: { flexDirection: 'row', gap: 12 },
    farmThumb: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#E5E7EB', overflow: 'hidden' },
    farmHeaderName: { fontSize: 16, fontWeight: '800', color: '#111827' },
    primaryBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    primaryBadgeText: { fontSize: 10, fontWeight: '700', color: '#059669' },
    farmMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    farmMetaText: { fontSize: 11, color: '#6B7280' },
    areaBadge: { alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
    areaBadgeValue: { fontSize: 14, fontWeight: '800', color: '#059669' },
    areaBadgeLabel: { fontSize: 9, color: '#6B7280', fontWeight: '500' },

    // Status Bar
    statusBarRow: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    statusCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F3F4F6', minWidth: 85, gap: 4 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
    statusLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '500' },

    // Tabs
    tabsContainer: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 20 },
    tabsScroll: { paddingLeft: 16, paddingRight: 40, gap: 20 },
    tabItem: { paddingVertical: 12, position: 'relative' as const },
    tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    tabTextActive: { color: '#065F46', fontWeight: '700' },
    tabIndicator: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#065F46', borderRadius: 3 },

    // Tab Content / Sections
    tabContent: { paddingHorizontal: 16, paddingBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    sectionSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    editBtnText: { fontSize: 12, fontWeight: '600', color: '#059669' },
    viewAllLink: { fontSize: 13, fontWeight: '600', color: '#059669' },

    // Overview — Description
    descriptionText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 20 },

    // Overview — Info Cards
    infoCardsRow: { gap: 12, marginBottom: 24 },
    infoCard: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#F3F4F6', width: 160 },
    infoCardLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
    infoCardValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
    infoCardSub: { fontSize: 9, color: '#9CA3AF' },

    // Overview — Progress
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    progressBarBg: { flex: 1, height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#059669', borderRadius: 5 },
    progressPercent: { fontSize: 13, fontWeight: '700', color: '#111827' },
    progressLabel: { fontSize: 12, color: '#065F46', fontWeight: '600', marginBottom: 16 },
    milestonesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    milestoneItem: { alignItems: 'center', flex: 1 },
    milestoneIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4, borderWidth: 2, borderColor: '#E5E7EB' },
    milestoneCompleted: { backgroundColor: '#059669', borderColor: '#059669' },
    milestoneInProgress: { borderColor: '#D97706', backgroundColor: '#FFF7ED' },
    milestoneInnerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' },
    milestoneLabel: { fontSize: 9, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
    milestoneStatus: { fontSize: 8, color: '#9CA3AF', fontWeight: '500', textAlign: 'center' },

    // Overview — Summary
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    summaryItem: { width: (width - 44) / 2, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    summaryIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    summaryLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
    summaryValue: { fontSize: 13, fontWeight: '700', color: '#111827' },

    // Overview — Notes
    noteCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 },
    noteText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 6 },
    noteMeta: { fontSize: 10, color: '#9CA3AF' },

    // Fields Tab
    toggleGroup: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 3, borderRadius: 8 },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4 },
    toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    toggleText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
    toggleTextActive: { color: '#065F46' },
    mapPlaceholder: { height: 200, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    mapPlaceholderText: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 8 },
    mapPlaceholderSub: { fontSize: 12, color: '#9CA3AF' },
    fieldCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, position: 'relative' },
    fieldCardTop: { flexDirection: 'row', gap: 10 },
    fieldIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
    fieldName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    fieldArea: { fontSize: 11, fontWeight: '700', color: '#059669' },
    fieldCrops: { fontSize: 10, color: '#6B7280' },
    fieldHealth: { fontSize: 10, fontWeight: '700', color: '#059669' },
    fieldUpdated: { fontSize: 9, color: '#9CA3AF' },
    addFieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 14, borderRadius: 14, gap: 12, marginTop: 4, marginBottom: 20 },
    addFieldTip: { fontSize: 11, color: '#065F46', lineHeight: 16, flex: 1 },
    addFieldBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7', gap: 4 },
    addFieldBtnText: { fontSize: 11, fontWeight: '700', color: '#065F46' },

    // Tasks Tab
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    filterBtnText: { fontSize: 11, fontWeight: '600', color: '#374151' },
    addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#065F46', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    addTaskBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    filterPillsRow: { gap: 8, paddingBottom: 16 },
    filterPill: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    filterPillLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
    filterPillCount: { fontSize: 18, fontWeight: '800' },
    taskGroup: { marginBottom: 20 },
    taskGroupTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
    taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 8, gap: 10 },
    taskDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    taskTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
    taskMeta: { fontSize: 9, color: '#9CA3AF' },
    taskStatus: { fontSize: 10, fontWeight: '700' },
    taskDue: { fontSize: 9, color: '#9CA3AF', marginTop: 2 },
    viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
    viewMoreText: { fontSize: 12, fontWeight: '600', color: '#059669' },

    // Empty states
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 12 },
    emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 12, gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
    outlineFooterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7', borderRadius: 12, paddingVertical: 14, gap: 6 },
    outlineFooterBtnText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
    filledFooterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#065F46', borderRadius: 12, paddingVertical: 14, gap: 6 },
    filledFooterBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

    // Activity & Data Global
    innerTabsScroll: { gap: 8, marginBottom: 16 },
    innerTabBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    innerTabBtnActive: { backgroundColor: '#065F46', borderColor: '#065F46' },
    innerTabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    innerTabTextActive: { color: '#fff' },

    // Visits / Activity Nav
    statsCardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statsCard: { width: (width - 42) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statsCardValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
    statsCardLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
    mapPlaceholderLarge: { height: 180, backgroundColor: '#E5E7EB', borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 24, borderWidth: 1, borderColor: '#D1D5DB' },
    mapLegend: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    legendDotItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 9, fontWeight: '600', color: '#374151' },
    listTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
    activityListItem: { flexDirection: 'row', paddingVertical: 12, paddingRight: 10, position: 'relative', minHeight: 70 },
    timelineLine: { position: 'absolute', left: 13, top: 0, bottom: 0, width: 2, backgroundColor: '#F3F4F6' },
    timelineDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#F9FAFB', zIndex: 2 },
    timelineDotText: { fontSize: 10, fontWeight: '700', color: '#065F46' },
    timelineDotBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', zIndex: 2 },
    activityContent: { flex: 1, paddingLeft: 12, paddingRight: 8 },
    activityTitle: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
    roleBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    roleBadgeText: { fontSize: 9, fontWeight: '700', color: '#059669' },
    activityDesc: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
    activityMeta: { fontSize: 10, color: '#9CA3AF' },
    activityThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F3F4F6' },
    viewAllListBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 16 },
    viewAllListText: { fontSize: 12, fontWeight: '600', color: '#059669' },
    
    // Validations Specific
    activityListItemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 10 },
    scoreBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    scoreBadgeText: { fontSize: 9, fontWeight: '700', color: '#7C3AED' },
    
    // Data Tab
    exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
    sectionTitleSmall: { fontSize: 14, fontWeight: '700', color: '#111827' },
    indicatorsRow: { gap: 12, marginBottom: 24, paddingVertical: 4 },
    indicatorCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, width: 130, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
    indicatorValue: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 10 },
    indicatorLabel: { fontSize: 10, color: '#6B7280', marginTop: 2, marginBottom: 8 },
    indicatorSubtext: { fontSize: 9, color: '#9CA3AF' },
    indicatorBadge: { backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    indicatorBadgeText: { fontSize: 9, fontWeight: '700', color: '#059669' },
    trendsRow: { gap: 12, marginBottom: 24, paddingVertical: 4 },
    trendCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, width: 180, borderWidth: 1, borderColor: '#F3F4F6' },
    trendTitle: { fontSize: 11, fontWeight: '600', color: '#374151' },
    trendValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
    trendMonths: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    trendMonthText: { fontSize: 9, color: '#9CA3AF' },
    dataRecordsGrid: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12 },
    dataRecordHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8, marginBottom: 8 },
    dataRecordCol: { flex: 1, fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
    dataRecordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    iconBoxSmall: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    dataRecordTitle: { fontSize: 11, fontWeight: '600', color: '#374151' },
    dataRecordValue: { flex: 1, fontSize: 11, color: '#111827' },
    dataRecordDate: { flex: 1, fontSize: 10, color: '#6B7280' },
    dataFooterTip: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginHorizontal: 20, marginBottom: 20 },
    
    // Photos Grid Specific
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    photoCard: { width: (width - 44) / 2, height: 160, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#F3F4F6' },
    photoImage: { width: '100%', height: '100%' },
    photoOverlayTop: { position: 'absolute', top: 8, right: 8, zIndex: 2 },
    photoIconBg: { backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    photoOverlayBottom: { position: 'absolute', bottom: 44, left: 8, right: 8, zIndex: 2 },
    photoDate: { color: '#fff', fontSize: 9, fontWeight: '600', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 4 },
    photoDetails: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 6 },
    photoTitle: { fontSize: 10, fontWeight: '700', color: '#111827' },
    photoAuthor: { fontSize: 9, color: '#6B7280', marginTop: 2 },
});

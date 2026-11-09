import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import api from './apiClient';
import { toast } from 'sonner-native';
import { BiometricStorageService } from './biometrics/BiometricStorageService';

const LAST_SYNC_KEY = '@app_last_sync_timestamp';
const SYNC_QUEUE_KEY = '@offline_sync_queue';

export type SyncMutationType =
    | 'CREATE_FARMER'
    | 'SAVE_VCM_ACTIVITY'
    | 'RECORD_FARM_ASSESSMENT'
    | 'CREATE_FARM_TASK'
    | 'UPDATE_FARMER'
    | 'CHANGE_PASSWORD'
    | 'SUBMIT_BIOMETRIC_INPUT_CONSENT'
    | 'SAVE_KWALI_MAPPING'
    | 'GENERIC_POST'
    | 'GENERIC_PATCH';

export interface SyncMutationItem {
    id: string;
    type: SyncMutationType;
    description: string;
    endpoint?: string;
    method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    payload: any;
    timestamp: number;
    retryCount: number;
    status: 'pending' | 'syncing' | 'failed' | 'synced';
    errorMessage?: string;
}

type Listener = (info: {
    short: string;
    full: string;
    timestamp: number;
    pendingCount: number;
    isSyncing: boolean;
    queue: SyncMutationItem[];
}) => void;

class SyncService {
    private lastSyncTimestamp: number = 0;
    private initialized: boolean = false;
    private listeners: Set<Listener> = new Set();
    private timerId: any = null;
    private autoSyncIntervalId: any = null;
    private netInfoUnsubscribe: any = null;
    private isSyncing: boolean = false;
    private queue: SyncMutationItem[] = [];

    /**
     * Formats relative elapsed time in short or full format.
     */
    formatRelativeSyncTime(timestamp: number, style: 'short' | 'full' = 'short'): string {
        if (!timestamp || timestamp <= 0) return style === 'short' ? 'Never' : 'Never synced';
        const diffMs = Math.max(0, Date.now() - timestamp);
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (style === 'short') {
            if (diffSec < 15) return 'Just now';
            if (diffSec < 60) return `${diffSec}s ago`;
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHr < 24) return `${diffHr}h ago`;
            return `${diffDay}d ago`;
        } else {
            if (diffSec < 15) return 'Just now';
            if (diffSec < 60) return `${diffSec} seconds ago`;
            if (diffMin === 1) return '1 minute ago';
            if (diffMin < 60) return `${diffMin} minutes ago`;
            if (diffHr === 1) return '1 hour ago';
            if (diffHr < 24) return `${diffHr} hours ago`;
            if (diffDay === 1) return '1 day ago';
            return `${diffDay} days ago`;
        }
    }

    /**
     * Initializes sync state, loads persistent mutation queue, and attaches network listeners
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            const storedTs = await AsyncStorage.getItem(LAST_SYNC_KEY);
            if (storedTs) {
                const parsed = parseInt(storedTs, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    this.lastSyncTimestamp = parsed;
                }
            } else {
                this.lastSyncTimestamp = Date.now() - 60 * 1000;
            }

            const storedQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            if (storedQueue) {
                const parsedQueue = JSON.parse(storedQueue);
                if (Array.isArray(parsedQueue)) {
                    this.queue = parsedQueue;
                }
            }
        } catch (e) {
            console.warn('Failed to initialize SyncService storage:', e);
        }

        // Attach NetInfo auto-detection listener: "the moment the app gets a whiff of internet it syncs"
        if (!this.netInfoUnsubscribe) {
            this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
                const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
                if (isOnline && !this.isSyncing && this.getPendingCountSync() > 0) {
                    console.log('🌐 [SyncService] Internet connectivity detected! Triggering automatic background sync...');
                    this.processSyncQueue(true);
                }
            });
        }

        // Background periodic heartbeat to check and auto-sync when network is available
        if (!this.autoSyncIntervalId && typeof setInterval !== 'undefined') {
            this.autoSyncIntervalId = setInterval(async () => {
                if (!this.isSyncing && this.getPendingCountSync() > 0) {
                    const netState = await NetInfo.fetch().catch(() => null);
                    if (netState?.isConnected && netState?.isInternetReachable !== false) {
                        console.log('🔄 [SyncService] Background heartbeat auto-sync running...');
                        this.processSyncQueue(true);
                    }
                }
            }, 25000);
        }

        this.initialized = true;
    }

    private getPendingCountSync(): number {
        return this.queue.filter(item => item.status === 'pending' || item.status === 'failed').length;
    }

    async getLastSyncTimestamp(): Promise<number> {
        await this.init();
        return this.lastSyncTimestamp;
    }

    async getQueue(): Promise<SyncMutationItem[]> {
        await this.init();
        return this.queue;
    }

    async getPendingCount(): Promise<number> {
        await this.init();
        return this.getPendingCountSync();
    }

    /**
     * Enqueue a new mutation to be synced when online, and try immediate sync if network is available
     */
    async enqueueMutation(item: Omit<SyncMutationItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<SyncMutationItem> {
        await this.init();

        const newItem: SyncMutationItem = {
            ...item,
            id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            retryCount: 0,
            status: 'pending',
        };

        this.queue.unshift(newItem);
        try {
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.warn('Failed to persist sync queue:', e);
        }

        this.notifyListeners();

        // Attempt background auto-sync immediately if internet is present
        NetInfo.fetch().then(state => {
            if (state.isConnected && state.isInternetReachable !== false && !this.isSyncing) {
                this.processSyncQueue(true);
            }
        }).catch(() => {});

        return newItem;
    }

    /**
     * Remove or mark a queue item as synced
     */
    async markItemSynced(id: string): Promise<void> {
        await this.init();
        this.queue = this.queue.filter(item => item.id !== id);
        try {
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.warn('Failed to update sync queue after sync:', e);
        }
        this.notifyListeners();
    }

    /**
     * Process all pending queued mutations against the live backend
     * @param isAutoSync boolean flag indicating if triggered automatically by internet detection
     */
    async processSyncQueue(isAutoSync: boolean = false): Promise<{ succeeded: number; failed: number }> {
        await this.init();
        if (this.isSyncing) {
            return { succeeded: 0, failed: 0 };
        }

        const pendingItems = this.queue.filter(i => i.status === 'pending' || i.status === 'failed');
        if (pendingItems.length === 0) {
            await this.recordSyncSuccess();
            return { succeeded: 0, failed: 0 };
        }

        this.isSyncing = true;
        this.notifyListeners();

        let succeeded = 0;
        let failed = 0;

        for (const item of pendingItems) {
            try {
                item.status = 'syncing';
                this.notifyListeners();

                if (item.type === 'CREATE_FARMER') {
                    const { farmerPayload, farmPayload, fieldPayload } = item.payload;
                    if (farmerPayload) {
                        const farmerRes = await api.post('/farmers', farmerPayload);
                        const createdFarmer = farmerRes.data;
                        if (createdFarmer?.id) {
                            const localRef = farmerPayload.nin || farmerPayload.id || farmerPayload.tempId;
                            if (localRef) {
                                await BiometricStorageService.linkFarmerId(String(localRef), String(createdFarmer.id)).catch(() => {});
                            }
                        }
                        if (farmPayload && createdFarmer?.id) {
                            farmPayload.farmerId = createdFarmer.id;
                            const farmRes = await api.post('/farms', farmPayload);
                            const createdFarm = farmRes.data;
                            if (fieldPayload && createdFarm?.id) {
                                fieldPayload.farmId = createdFarm.id;
                                await api.post('/fields', fieldPayload);
                            }
                        }
                    }
                } else if (item.type === 'SAVE_VCM_ACTIVITY') {
                    const { farmerId, updatedActivities, currentCropStage, lastLoggedActivityId } = item.payload;
                    await api.patch(`/farmers/${farmerId}`, {
                        metadata: {
                            completedActivities: updatedActivities,
                            currentCropStage,
                            lastLoggedActivityId,
                            lastLoggedAt: new Date().toISOString(),
                        }
                    });
                } else if (item.type === 'RECORD_FARM_ASSESSMENT') {
                    const { farmId, assessment } = item.payload;
                    if (farmId) {
                        await api.patch(`/farms/${farmId}`, {
                            metadata: {
                                lastAssessment: assessment,
                                assessedAt: new Date().toISOString(),
                            }
                        });
                    }
                } else if (item.type === 'CREATE_FARM_TASK') {
                    const { farmId, task } = item.payload;
                    if (farmId && task) {
                        const farmRes = await api.get(`/farms/${farmId}`).catch(() => null);
                        const existingTasks = Array.isArray(farmRes?.data?.metadata?.tasks) ? farmRes.data.metadata.tasks : [];
                        await api.patch(`/farms/${farmId}`, {
                            metadata: {
                                ...(farmRes?.data?.metadata || {}),
                                tasks: [task, ...existingTasks],
                            }
                        });
                    }
                } else if (item.type === 'CHANGE_PASSWORD') {
                    await api.post('/auth/change-password', item.payload);
                } else if (item.type === 'SUBMIT_BIOMETRIC_INPUT_CONSENT') {
                    const consentPayload = item.payload;
                    const reqId = consentPayload.inputRequestId;
                    try {
                        await api.post(`/finance-requests/${reqId}/consent`, consentPayload);
                    } catch (routeErr: any) {
                        // Fallback: update finance-request metadata directly
                        await api.patch(`/finance-requests/${reqId}`, {
                            biometricConsent: consentPayload,
                            biometricallyVerified: true,
                            verifiedAt: consentPayload.consentTimestamp,
                        });
                    }
                } else if (item.type === 'SAVE_KWALI_MAPPING') {
                    const payload = item.payload;
                    try {
                        await api.post('/kwali', payload);
                    } catch (err: any) {
                        // Fallback: sync to /fields (requires farmId) or /demo-plots
                        let farmId = payload.farmId;
                        if (!farmId) {
                            const farmsRes = await api.get('/farms').catch(() => null);
                            const farmList = Array.isArray(farmsRes?.data) ? farmsRes.data : farmsRes?.data?.data || [];
                            farmId = farmList[0]?.id;
                        }

                        if (farmId) {
                            await api.post('/fields', {
                                farmId,
                                name: payload.name,
                                areaHectares: parseFloat(payload.area_hectares) || 1.0,
                                boundaryGeojson: payload.boundary_geojson,
                                centroidLat: payload.centroid_lat,
                                centroidLng: payload.centroid_lng,
                            });
                        } else {
                            await api.post('/demo-plots', {
                                name: payload.name,
                                boundaryGeojson: payload.boundary_geojson,
                                centroidLat: payload.centroid_lat,
                                centroidLng: payload.centroid_lng,
                            });
                        }
                    }

                    // Update synced state in local Kwali storage
                    try {
                        const raw = await AsyncStorage.getItem('@kwali_mapped_areas');
                        if (raw) {
                            const list = JSON.parse(raw);
                            if (Array.isArray(list)) {
                                const updated = list.map((a: any) =>
                                    a.id === payload.id ? { ...a, syncedToBackend: true } : a
                                );
                                await AsyncStorage.setItem('@kwali_mapped_areas', JSON.stringify(updated));
                            }
                        }
                    } catch (storageErr) {
                        console.warn('Failed to update @kwali_mapped_areas on sync:', storageErr);
                    }
                } else if (item.endpoint) {
                    if (item.method === 'POST') {
                        await api.post(item.endpoint, item.payload);
                    } else if (item.method === 'PATCH') {
                        await api.patch(item.endpoint, item.payload);
                    } else if (item.method === 'PUT') {
                        await api.put(item.endpoint, item.payload);
                    }
                }

                // If succeeded, remove from queue
                this.queue = this.queue.filter(q => q.id !== item.id);
                succeeded++;
            } catch (err: any) {
                console.warn(`Sync failed for item ${item.id} (${item.description}):`, err?.message || err);
                item.status = 'failed';
                item.retryCount = (item.retryCount || 0) + 1;
                item.errorMessage = err?.message || 'Sync failed';
                failed++;
            }
        }

        try {
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (_) {}

        await this.recordSyncSuccess();
        this.isSyncing = false;
        this.notifyListeners();

        if (succeeded > 0 && isAutoSync) {
            toast.success(`Cloud Sync: ${succeeded} offline record(s) synced successfully!`);
        }

        return { succeeded, failed };
    }

    /**
     * Record sync timestamp
     */
    async recordSyncSuccess(): Promise<number> {
        const now = Date.now();
        this.lastSyncTimestamp = now;
        this.initialized = true;
        try {
            await AsyncStorage.setItem(LAST_SYNC_KEY, String(now));
        } catch (e) {
            console.warn('Failed to save sync timestamp:', e);
        }
        this.notifyListeners();
        return now;
    }

    /**
     * Subscribe to real-time sync status updates
     */
    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);

        const currentTs = this.lastSyncTimestamp || Date.now();
        const pendingCount = this.getPendingCountSync();

        listener({
            short: this.formatRelativeSyncTime(currentTs, 'short'),
            full: this.formatRelativeSyncTime(currentTs, 'full'),
            timestamp: currentTs,
            pendingCount,
            isSyncing: this.isSyncing,
            queue: this.queue,
        });

        if (!this.timerId && typeof setInterval !== 'undefined') {
            this.timerId = setInterval(() => {
                this.notifyListeners();
            }, 10000);
        }

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0 && this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        };
    }

    private notifyListeners() {
        const ts = this.lastSyncTimestamp || Date.now();
        const pendingCount = this.getPendingCountSync();
        const info = {
            short: this.formatRelativeSyncTime(ts, 'short'),
            full: this.formatRelativeSyncTime(ts, 'full'),
            timestamp: ts,
            pendingCount,
            isSyncing: this.isSyncing,
            queue: this.queue,
        };
        this.listeners.forEach(cb => {
            try {
                cb(info);
            } catch (err) {
                console.warn('SyncService listener error:', err);
            }
        });
    }
}

export const syncService = new SyncService();

/**
 * React Hook to consume live real-time sync status across components
 */
export function useSyncStatus() {
    const [status, setStatus] = useState<{
        short: string;
        full: string;
        timestamp: number;
        pendingCount: number;
        isSyncing: boolean;
        queue: SyncMutationItem[];
    }>({
        short: 'Just now',
        full: 'Just now',
        timestamp: Date.now(),
        pendingCount: 0,
        isSyncing: false,
        queue: [],
    });

    useEffect(() => {
        let isMounted = true;
        syncService.init().then(() => {
            if (isMounted) {
                // Subscribe handles updates
            }
        });

        const unsubscribe = syncService.subscribe((info) => {
            if (isMounted) {
                setStatus(info);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const recordSync = useCallback(async () => {
        return await syncService.recordSyncSuccess();
    }, []);

    const processQueue = useCallback(async () => {
        return await syncService.processSyncQueue(false);
    }, []);

    return {
        lastSyncShort: status.short,
        lastSyncFull: status.full,
        lastSyncTimestamp: status.timestamp,
        pendingCount: status.pendingCount,
        isSyncing: status.isSyncing,
        queue: status.queue,
        recordSync,
        processQueue,
    };
}



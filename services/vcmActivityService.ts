import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ActivityId,
    AttemptStatus,
    SeasonalStage,
    VCM_ACTIVITY_DICTIONARY,
    ATTEMPT_STATUS_CONFIGS,
    SEASONAL_STAGES,
} from '../constants/vcmSeasonalSpec';
import { farmerService } from './farmerService';

export interface CompletedActivityRecord {
    activityId: ActivityId;
    status: AttemptStatus;
    date: string;
    pointsEarned: number;
    notes?: string;
    gps?: string;
    photo?: string;
    inputs?: Record<string, any>;
}

export const ALL_ACTIVITY_SEQUENCE: ActivityId[] = [
    'PS-01', 'PS-02', 'PS-03', 'PS-04',
    'ES-01', 'ES-02', 'ES-03',
    'MS-01', 'MS-02', 'MS-03', 'MS-04',
    'LS-01', 'LS-02',
    'END-01', 'END-02', 'END-03',
];

export const STAGE_ORDER: SeasonalStage[] = [
    'pre_season',
    'early_season',
    'mid_season',
    'late_season',
    'end_season',
];

export const vcmActivityService = {
    /**
     * Fetch completed activities for a farmer from AsyncStorage and metadata
     */
    getFarmerActivities: async (farmerId: string): Promise<CompletedActivityRecord[]> => {
        if (!farmerId) return [];
        try {
            const key = `farmer_activities_${farmerId}`;
            const localData = await AsyncStorage.getItem(key);
            if (localData) {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }

            // Fallback to farmer metadata from API / local cache
            const farmer = await farmerService.getFarmerById(farmerId).catch(() => null);
            if (farmer?.metadata?.completedActivities && Array.isArray(farmer.metadata.completedActivities)) {
                await AsyncStorage.setItem(key, JSON.stringify(farmer.metadata.completedActivities));
                return farmer.metadata.completedActivities;
            }
        } catch (e) {
            console.warn('Error fetching farmer activities:', e);
        }
        return [];
    },

    /**
     * Save an activity log, update progression, unlock next stage & persist to API + AsyncStorage
     */
    saveFarmerActivity: async (
        farmerId: string,
        record: CompletedActivityRecord
    ): Promise<{
        updatedActivities: CompletedActivityRecord[];
        nextActivityId: ActivityId | null;
        nextStageId: SeasonalStage | null;
        nextStageLabel: string;
    }> => {
        const existingActivities = await vcmActivityService.getFarmerActivities(farmerId);
        
        // Remove previous entry for same activity if present (overwrite/update)
        const filtered = existingActivities.filter((a) => a.activityId !== record.activityId);
        const updatedActivities = [...filtered, record];

        // Determine next activity in sequential order
        const currIndex = ALL_ACTIVITY_SEQUENCE.indexOf(record.activityId);
        const nextActivityId = currIndex >= 0 && currIndex < ALL_ACTIVITY_SEQUENCE.length - 1
            ? ALL_ACTIVITY_SEQUENCE[currIndex + 1]
            : null;

        const nextSpec = nextActivityId ? VCM_ACTIVITY_DICTIONARY[nextActivityId] : null;
        const nextStageId = nextSpec ? nextSpec.stage : 'end_season';
        const nextStageObj = SEASONAL_STAGES.find((s) => s.id === nextStageId);
        const nextStageLabel = nextStageObj ? nextStageObj.label : 'Completed';

        // Persist locally first
        const key = `farmer_activities_${farmerId}`;
        await AsyncStorage.setItem(key, JSON.stringify(updatedActivities));

        // Sync with backend API (or auto-enqueues on offline)
        try {
            await farmerService.updateFarmer(farmerId, {
                metadata: {
                    completedActivities: updatedActivities,
                    currentCropStage: nextStageLabel,
                    lastLoggedActivityId: record.activityId,
                    lastLoggedAt: new Date().toISOString(),
                },
            });
        } catch (err) {
            console.warn('Could not sync farmer activity to backend, saved offline:', err);
            const { syncService } = require('./syncService');
            await syncService.enqueueMutation({
                type: 'SAVE_VCM_ACTIVITY',
                description: `VCM Activity ${record.activityId} (Farmer #${farmerId})`,
                payload: {
                    farmerId,
                    updatedActivities,
                    currentCropStage: nextStageLabel,
                    lastLoggedActivityId: record.activityId,
                }
            });
        }

        return {
            updatedActivities,
            nextActivityId,
            nextStageId,
            nextStageLabel,
        };
    },

    /**
     * Check if a specific activity is unlocked for a farmer
     */
    isActivityUnlocked: (
        activityId: ActivityId,
        completedActivities: CompletedActivityRecord[]
    ): boolean => {
        const index = ALL_ACTIVITY_SEQUENCE.indexOf(activityId);
        if (index <= 0) return true; // PS-01 is always unlocked

        const completedMap = new Map(completedActivities.map((a) => [a.activityId, a]));
        const prevActivityId = ALL_ACTIVITY_SEQUENCE[index - 1];
        const prevRecord = completedMap.get(prevActivityId);

        // Previous activity must be completed or attempted
        return !!(prevRecord && ATTEMPT_STATUS_CONFIGS[prevRecord.status]?.countsForPayment);
    },

    /**
     * Check if a seasonal stage is unlocked
     */
    isStageUnlocked: (
        stageId: SeasonalStage,
        completedActivities: CompletedActivityRecord[]
    ): boolean => {
        const idx = STAGE_ORDER.indexOf(stageId);
        if (idx <= 0) return true; // Pre-Season is always unlocked

        const completedMap = new Map(completedActivities.map((a) => [a.activityId, a]));

        for (let i = 0; i < idx; i++) {
            const prevStageId = STAGE_ORDER[i];
            const prevStageActivities = Object.values(VCM_ACTIVITY_DICTIONARY).filter(
                (a) => a.stage === prevStageId
            );

            const allDone = prevStageActivities.every((a) => {
                const rec = completedMap.get(a.id);
                return rec && ATTEMPT_STATUS_CONFIGS[rec.status]?.countsForPayment;
            });

            if (!allDone) return false;
        }

        return true;
    },
};

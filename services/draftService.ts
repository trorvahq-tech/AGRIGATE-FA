import AsyncStorage from '@react-native-async-storage/async-storage';
import { FarmerRegistrationData, registrationState } from './registrationState';

export interface RegistrationDraft {
    id: string;
    farmerName: string;
    phone: string;
    stepRoute: string;
    stepNumber: number;
    stepTitle: string;
    lastSaved: string;
    data: FarmerRegistrationData;
}

const DRAFTS_KEY = '@farmer_registration_drafts_v1';
const ACTIVE_DRAFT_KEY = '@active_registration_draft_id_v1';

export const draftService = {
    /**
     * Start a fresh new registration (resets form data & clears active draft pointer)
     */
    startNewRegistration: async (): Promise<void> => {
        registrationState.resetData();
        try {
            await AsyncStorage.removeItem(ACTIVE_DRAFT_KEY);
        } catch (err) {
            console.warn('Failed to clear active draft key:', err);
        }
    },

    /**
     * Get all saved farmer registration drafts
     */
    getDrafts: async (): Promise<RegistrationDraft[]> => {
        try {
            const raw = await AsyncStorage.getItem(DRAFTS_KEY);
            if (!raw) return [];
            const list: RegistrationDraft[] = JSON.parse(raw);
            if (!Array.isArray(list)) return [];
            return list
                .filter(item => item && typeof item === 'object' && item.id)
                .map(item => ({
                    ...item,
                    data: item.data || ({} as any),
                }))
                .sort((a, b) => new Date(b.lastSaved || 0).getTime() - new Date(a.lastSaved || 0).getTime());
        } catch (err) {
            console.warn('Failed to load drafts:', err);
            return [];
        }
    },

    /**
     * Get count of saved drafts
     */
    getDraftsCount: async (): Promise<number> => {
        try {
            const list = await draftService.getDrafts();
            return list.length;
        } catch {
            return 0;
        }
    },

    /**
     * Get single draft by ID
     */
    getDraftById: async (id: string): Promise<RegistrationDraft | null> => {
        try {
            const drafts = await draftService.getDrafts();
            return drafts.find(d => d.id === id) || null;
        } catch (err) {
            console.warn('Failed to get draft by id:', err);
            return null;
        }
    },

    /**
     * Save or update current registration progress as a draft.
     * Preserves all other drafts in storage.
     */
    saveCurrentDraft: async (
        stepRoute: string,
        stepNumber: number,
        stepTitle: string,
        currentStepUpdates?: Partial<FarmerRegistrationData>
    ): Promise<RegistrationDraft> => {
        // Synchronize in-memory registration state first
        if (currentStepUpdates) {
            registrationState.updateData(currentStepUpdates);
        }
        const fullData = registrationState.getData();

        const existingDrafts = await draftService.getDrafts();

        const nameParts = [fullData.firstName, fullData.middleName, fullData.lastName].filter(Boolean);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const farmerName = nameParts.length > 0
            ? nameParts.join(' ')
            : `Draft #${existingDrafts.length + 1} (${timeStr})`;
            
        const phone = fullData.phone || fullData.alternatePhone || 'No phone entered';

        // Check if an existing draft is currently active
        let draftId = await AsyncStorage.getItem(ACTIVE_DRAFT_KEY);
        if (!draftId) {
            draftId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            await AsyncStorage.setItem(ACTIVE_DRAFT_KEY, draftId);
        }

        const draftItem: RegistrationDraft = {
            id: draftId,
            farmerName,
            phone,
            stepRoute,
            stepNumber,
            stepTitle,
            lastSaved: now.toISOString(),
            data: fullData,
        };

        const filtered = existingDrafts.filter(d => d.id !== draftId);
        const updated = [draftItem, ...filtered];

        await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
        return draftItem;
    },

    /**
     * Resume a saved draft: populates registrationState, sets active draft ID, and navigates to the saved step
     */
    resumeDraft: async (draft: RegistrationDraft, router: any, navigation?: any): Promise<void> => {
        registrationState.resetData();
        if (draft.data) {
            registrationState.updateData(draft.data);
        }
        await AsyncStorage.setItem(ACTIVE_DRAFT_KEY, draft.id);
        const routeName = (draft.stepRoute || '').replace('/(agent)/', '');
        if (navigation?.navigate && routeName) {
            navigation.navigate(routeName, { draftId: draft.id, isResume: 'true' });
        } else if (router?.navigate) {
            router.navigate({
                pathname: draft.stepRoute as any,
                params: { draftId: draft.id, isResume: 'true' }
            });
        } else {
            router.push({
                pathname: draft.stepRoute as any,
                params: { draftId: draft.id, isResume: 'true' }
            });
        }
    },

    /**
     * Delete a saved draft
     */
    deleteDraft: async (draftId: string): Promise<void> => {
        try {
            const existing = await draftService.getDrafts();
            const filtered = existing.filter(d => d.id !== draftId);
            await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));

            const activeId = await AsyncStorage.getItem(ACTIVE_DRAFT_KEY);
            if (activeId === draftId) {
                await AsyncStorage.removeItem(ACTIVE_DRAFT_KEY);
            }
        } catch (err) {
            console.warn('Failed to delete draft:', err);
        }
    },

    /**
     * Clear the active draft ID (call this when a farmer registration completes successfully)
     */
    clearActiveDraft: async (): Promise<void> => {
        try {
            const activeId = await AsyncStorage.getItem(ACTIVE_DRAFT_KEY);
            if (activeId) {
                const existing = await draftService.getDrafts();
                const filtered = existing.filter(d => d.id !== activeId);
                await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
                await AsyncStorage.removeItem(ACTIVE_DRAFT_KEY);
            }
            registrationState.resetData();
        } catch (err) {
            console.warn('Failed to clear active draft:', err);
        }
    },
};

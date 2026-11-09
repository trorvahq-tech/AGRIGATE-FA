import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BiometricTemplate } from './types';

const SECURE_PREFIX = 'vcm_bio_tmpl_';
const ALIAS_MAP_KEY = '@vcm_bio_alias_index';
const ENROLLED_INDEX_KEY = '@vcm_bio_enrolled_index';

export class BiometricStorageService {
    /**
     * Checks if platform hardware-backed encryption (Keystore / Keychain) is available
     */
    static async isHardwareEncryptionAvailable(): Promise<boolean> {
        try {
            return await SecureStore.isAvailableAsync();
        } catch {
            return false;
        }
    }

    /**
     * Sanitizes a farmer ID into a valid SecureStore key (alphanumeric, ., -, _)
     */
    private static getSecureKey(farmerId: string): string {
        const cleanId = String(farmerId).replace(/[^a-zA-Z0-9._-]/g, '_');
        return `${SECURE_PREFIX}${cleanId}`;
    }

    /**
     * Stores an enrolled farmer biometric template securely using hardware-backed encryption.
     * Supports optional secondary aliases (e.g. NIN, national ID, or local registration draft ID).
     */
    static async saveTemplate(template: BiometricTemplate, aliases: string[] = []): Promise<void> {
        if (!template.farmerId) {
            throw new Error('BiometricStorageService: farmerId is required to store template');
        }

        const secureKey = this.getSecureKey(template.farmerId);
        const serialized = JSON.stringify(template);
        const isSecure = await this.isHardwareEncryptionAvailable();

        if (isSecure) {
            await SecureStore.setItemAsync(secureKey, serialized, {
                keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
            });
            // If legacy unencrypted copy exists, clean it up
            try {
                await AsyncStorage.removeItem(`@vcm_bio_template:${template.farmerId}`);
            } catch {}
        } else {
            console.warn('[BiometricStorageService] SecureStore unavailable, falling back to local persistent store');
            await AsyncStorage.setItem(`@vcm_bio_template:${template.farmerId}`, serialized);
        }

        // Update Enrolled Primary Index
        try {
            const rawIndex = await AsyncStorage.getItem(ENROLLED_INDEX_KEY);
            const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
            if (!index.includes(template.farmerId)) {
                index.push(template.farmerId);
                await AsyncStorage.setItem(ENROLLED_INDEX_KEY, JSON.stringify(index));
            }
        } catch (idxErr) {
            console.warn('[BiometricStorageService] Failed to update enrolled primary index:', idxErr);
        }

        // Register Aliases (NIN, draft IDs, etc.)
        const allAliases = Array.from(new Set([template.farmerId, ...aliases].filter(Boolean)));
        try {
            const rawMap = await AsyncStorage.getItem(ALIAS_MAP_KEY);
            const aliasMap: Record<string, string> = rawMap ? JSON.parse(rawMap) : {};
            allAliases.forEach(alias => {
                aliasMap[alias] = template.farmerId;
            });
            await AsyncStorage.setItem(ALIAS_MAP_KEY, JSON.stringify(aliasMap));
        } catch (aliasErr) {
            console.warn('[BiometricStorageService] Failed to register biometric aliases:', aliasErr);
        }
    }

    /**
     * Retrieves the enrolled biometric template for a given farmer ID or any associated alias (NIN, draftId)
     */
    static async getTemplateByFarmerId(farmerIdOrAlias: string): Promise<BiometricTemplate | null> {
        if (!farmerIdOrAlias) return null;

        // Step 1: Check Alias Map to resolve to primary ID
        let primaryId = farmerIdOrAlias;
        try {
            const rawMap = await AsyncStorage.getItem(ALIAS_MAP_KEY);
            if (rawMap) {
                const aliasMap: Record<string, string> = JSON.parse(rawMap);
                if (aliasMap[farmerIdOrAlias]) {
                    primaryId = aliasMap[farmerIdOrAlias];
                }
            }
        } catch (aliasLookupErr) {
            console.warn('[BiometricStorageService] Alias lookup bypassed:', aliasLookupErr);
        }

        // Step 2: Try SecureStore
        const isSecure = await this.isHardwareEncryptionAvailable();
        if (isSecure) {
            try {
                const secureKey = this.getSecureKey(primaryId);
                const rawSecure = await SecureStore.getItemAsync(secureKey);
                if (rawSecure) {
                    return JSON.parse(rawSecure) as BiometricTemplate;
                }
            } catch (secErr) {
                console.warn('[BiometricStorageService] Error reading from SecureStore:', secErr);
            }
        }

        // Step 3: Migration / Fallback check from AsyncStorage
        try {
            const legacyKey = `@vcm_bio_template:${primaryId}`;
            const rawLegacy = await AsyncStorage.getItem(legacyKey);
            if (rawLegacy) {
                const parsed = JSON.parse(rawLegacy) as BiometricTemplate;
                // Automatically migrate to SecureStore if secure hardware is now available
                if (isSecure) {
                    this.saveTemplate(parsed).catch(() => {});
                }
                return parsed;
            }
        } catch (legacyErr) {
            console.warn('[BiometricStorageService] Error reading legacy template store:', legacyErr);
        }

        return null;
    }

    /**
     * Links an existing offline registration ID (or NIN) to a newly generated backend UUID
     * Ensures subsequent verifications by backend UUID find the enrolled biometrics seamlessly.
     */
    static async linkFarmerId(existingIdOrAlias: string, newBackendUuid: string): Promise<void> {
        if (!existingIdOrAlias || !newBackendUuid) return;

        const template = await this.getTemplateByFarmerId(existingIdOrAlias);
        if (!template) {
            console.warn(`[BiometricStorageService] Cannot link: template not found for ${existingIdOrAlias}`);
            return;
        }

        // Register new backend UUID as alias pointing to this primary ID
        try {
            const rawMap = await AsyncStorage.getItem(ALIAS_MAP_KEY);
            const aliasMap: Record<string, string> = rawMap ? JSON.parse(rawMap) : {};
            aliasMap[newBackendUuid] = template.farmerId;
            aliasMap[existingIdOrAlias] = template.farmerId;
            await AsyncStorage.setItem(ALIAS_MAP_KEY, JSON.stringify(aliasMap));
        } catch (err) {
            console.warn('[BiometricStorageService] Failed to link newBackendUuid in alias map:', err);
        }
    }

    /**
     * Deletes the biometric template for a farmer (e.g. on NDPR/GDPR erasure request)
     */
    static async deleteTemplate(farmerIdOrAlias: string): Promise<void> {
        if (!farmerIdOrAlias) return;

        const template = await this.getTemplateByFarmerId(farmerIdOrAlias);
        const primaryId = template?.farmerId || farmerIdOrAlias;

        const isSecure = await this.isHardwareEncryptionAvailable();
        if (isSecure) {
            try {
                const secureKey = this.getSecureKey(primaryId);
                await SecureStore.deleteItemAsync(secureKey);
            } catch {}
        }

        try {
            await AsyncStorage.removeItem(`@vcm_bio_template:${primaryId}`);
        } catch {}

        // Remove from primary index
        try {
            const rawIndex = await AsyncStorage.getItem(ENROLLED_INDEX_KEY);
            if (rawIndex) {
                const index: string[] = JSON.parse(rawIndex);
                const updated = index.filter(id => id !== primaryId);
                await AsyncStorage.setItem(ENROLLED_INDEX_KEY, JSON.stringify(updated));
            }
        } catch {}

        // Remove from alias map
        try {
            const rawMap = await AsyncStorage.getItem(ALIAS_MAP_KEY);
            if (rawMap) {
                const aliasMap: Record<string, string> = JSON.parse(rawMap);
                for (const key of Object.keys(aliasMap)) {
                    if (aliasMap[key] === primaryId || key === primaryId) {
                        delete aliasMap[key];
                    }
                }
                await AsyncStorage.setItem(ALIAS_MAP_KEY, JSON.stringify(aliasMap));
            }
        } catch {}
    }

    /**
     * Lists all farmer IDs that currently have biometric templates enrolled on this device
     */
    static async listAllEnrolledFarmerIds(): Promise<string[]> {
        try {
            const rawIndex = await AsyncStorage.getItem(ENROLLED_INDEX_KEY);
            return rawIndex ? JSON.parse(rawIndex) : [];
        } catch {
            return [];
        }
    }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { syncService } from '../syncService';
import { BiometricMatchResult, LivenessVerdictResult } from './types';

const CONSENT_STORAGE_KEY = '@vcm_farmer_input_consents';

export interface FarmerInputConsentRecord {
    consentEventId: string;        // Unique idempotent UUID
    farmerId: string;
    farmerName: string;
    inputRequestId: string;
    groupName: string;
    amountRequested: number;
    allocatedItems: any[];
    consentTimestamp: string;
    consentWordingVersion: string; // 'VCM-INPUT-CONSENT-V1.0'
    consentAffirmed: boolean;
    verificationSessionId: string;
    faceMatchOutcome: {
        isMatch: boolean;
        verdict: 'MATCH' | 'MISMATCH' | 'INCONCLUSIVE';
        similarity: number;
        matchConfidence: number;
    };
    livenessOutcome: {
        isLive: boolean;
        verdict: 'PASSED' | 'SUSPICIOUS' | 'FAILED';
        livenessScore: number;
    };
    overallStatus: 'APPROVED' | 'REVIEW_PENDING' | 'REJECTED';
    deviceInfo: {
        platform: string;
        appVersion: string;
    };
    syncStatus: 'pending' | 'synced';
}

export class FarmerConsentService {
    static readonly CONSENT_VERSION = 'VCM-INPUT-CONSENT-V1.0';

    /**
     * Standard consent statement legally required under Nigerian agricultural microfinance rules
     */
    static getConsentWording(farmerName: string, groupName: string, amount: number): string {
        const formattedAmount = '₦' + Number(amount).toLocaleString('en-NG');
        return `I, ${farmerName}, hereby confirm my biometric identity and give my explicit consent to the requisition of agricultural inputs under Mutual Trust Group "${groupName}" valued at ${formattedAmount}. I acknowledge receipt authorization and understand this requisition will be debited to our group allocation.`;
    }

    /**
     * Records an auditable biometric consent event for an input request
     */
    static async recordConsent(params: {
        farmerId: string;
        farmerName: string;
        inputRequestId: string;
        groupName: string;
        amountRequested: number;
        allocatedItems: any[];
        verificationSessionId: string;
        match: BiometricMatchResult;
        liveness: LivenessVerdictResult;
        consentAffirmed: boolean;
    }): Promise<FarmerInputConsentRecord> {
        // Enforce guard: never record approval if verification failed or farmer declined
        if (!params.consentAffirmed) {
            throw new Error('Farmer consent was not affirmed. Transaction cancelled.');
        }

        if (!params.match.isMatch) {
            throw new Error('Cannot record consent: Face verification failed.');
        }

        if (!params.liveness.isLive) {
            throw new Error('Cannot record consent: Liveness verification failed presentation-attack check.');
        }

        const consentEventId = `CONSENT-${params.farmerId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const consentTimestamp = new Date().toISOString();

        const record: FarmerInputConsentRecord = {
            consentEventId,
            farmerId: params.farmerId,
            farmerName: params.farmerName,
            inputRequestId: params.inputRequestId,
            groupName: params.groupName,
            amountRequested: params.amountRequested,
            allocatedItems: params.allocatedItems,
            consentTimestamp,
            consentWordingVersion: this.CONSENT_VERSION,
            consentAffirmed: true,
            verificationSessionId: params.verificationSessionId,
            faceMatchOutcome: {
                isMatch: params.match.isMatch,
                verdict: params.match.verdict,
                similarity: params.match.similarity,
                matchConfidence: params.match.matchConfidence,
            },
            livenessOutcome: {
                isLive: params.liveness.isLive,
                verdict: params.liveness.verdict,
                livenessScore: params.liveness.livenessScore,
            },
            overallStatus: 'APPROVED',
            deviceInfo: {
                platform: Platform.OS,
                appVersion: '1.0.0',
            },
            syncStatus: 'pending',
        };

        // 1. Save locally in persistent store
        try {
            const raw = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
            const list: FarmerInputConsentRecord[] = raw ? JSON.parse(raw) : [];
            list.unshift(record);
            await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(list));
        } catch (storageErr) {
            console.warn('Failed to save consent locally:', storageErr);
        }

        // 2. Enqueue idempotent offline mutation for background synchronization
        try {
            await syncService.enqueueMutation({
                type: 'SUBMIT_BIOMETRIC_INPUT_CONSENT' as any,
                description: `Biometric consent for ${params.farmerName} - ${params.groupName}`,
                endpoint: `/finance-requests/${params.inputRequestId}/consent`,
                method: 'POST',
                payload: record,
            });
        } catch (syncErr) {
            console.warn('Failed to enqueue consent mutation into syncService:', syncErr);
        }

        return record;
    }

    /**
     * Retrieves all consent records for audit
     */
    static async getConsentHistory(): Promise<FarmerInputConsentRecord[]> {
        try {
            const raw = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }
}

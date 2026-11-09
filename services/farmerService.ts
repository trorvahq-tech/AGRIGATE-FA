import api from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geoService } from './geoService';

export interface Farmer {
    id: string;
    name: string;
    community: string;
    group: string;
    farms: number;
    activities: number;
    fullName?: string;
    phone?: string;
    email?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    location?: {
        state?: { id: string | number; name: string } | null;
        lga?: { id: string | number; name: string } | null;
        ward?: { id: string | number; name: string } | null;
        community?: string;
    } | null;
    isActive?: boolean;
    metadata?: Record<string, any> | null;
    createdAt?: string;
}

export const farmerService = {
    getFarmers: async (): Promise<Farmer[]> => {
        const response = await api.get<any>('/farmers?limit=1000');
        const list = response.data?.data || response.data?.farmers || (Array.isArray(response.data) ? response.data : []);
        return list;
    },

    getFarmerById: async (id: string): Promise<Farmer> => {
        const response = await api.get<any>(`/farmers/${id}`);
        return response.data?.data || response.data;
    },

    createFarmer: async (farmerData: Omit<Farmer, 'id'>): Promise<Farmer> => {
        const response = await api.post<Farmer>('/farmers', farmerData);
        return response.data;
    },

    onboardFarmer: async (registrationData: any, projectId: string): Promise<Farmer> => {
        // Resolve dynamic location from captured community, LGA, State, and GPS coordinates
        const lat = parseFloat(registrationData.gpsLat);
        const lng = parseFloat(registrationData.gpsLong);
        const resolvedLoc = await geoService.resolveBackendLocation({
            stateName: registrationData.stateName,
            lgaName: registrationData.lga,
            community: registrationData.community,
            latitude: !isNaN(lat) ? lat : undefined,
            longitude: !isNaN(lng) ? lng : undefined,
        });

        // 1. Prepare structured Farmer payload
        const farmerPayload = {
            projectId,
            fullName: `${registrationData.firstName} ${registrationData.middleName ? registrationData.middleName + ' ' : ''}${registrationData.lastName}`,
            phone: registrationData.phone || '08031234567',
            email: registrationData.email || `${registrationData.firstName.toLowerCase()}.${registrationData.lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@agrigate-farmer.com`,
            gender: registrationData.gender || 'unknown',
            dateOfBirth: registrationData.dateOfBirth,
            address: resolvedLoc.address,
            location: {
                stateId: resolvedLoc.stateId,
                lgaId: resolvedLoc.lgaId,
                wardId: resolvedLoc.wardId,
                community: resolvedLoc.community
            },
            metadata: {
                alternate_phone: registrationData.alternatePhone || '',
                preferred_language: registrationData.preferredLanguage || 'Hausa',
                community: resolvedLoc.community,
                stateName: resolvedLoc.stateName,
                lgaName: resolvedLoc.lgaName,
                primaryCrop: registrationData.primaryCrop || 'Maize',
                secondaryCrop: registrationData.secondaryCrop || '',
                farm_size_hectares: registrationData.farmSizeHa || '1.00',
                farmSizeHa: registrationData.farmSizeHa || '1.00',
                farmSizeAcres: registrationData.farmSizeAcres || '0.00',
                maritalStatus: registrationData.maritalStatus,
                education: registrationData.education,
                householdSize: registrationData.householdSize,
                dependantsCount: registrationData.dependantsCount,
                schoolingChildren: registrationData.schoolingChildren,
                waterSource: registrationData.waterSource,
                waterTreatment: registrationData.waterTreatment,
                mealFrequency: registrationData.mealFrequency,
                shortageMonths: registrationData.shortageMonths,
                securityThreat: registrationData.securityThreat,
                conflictLevel: registrationData.conflictLevel,
                selectedLivestock: registrationData.selectedLivestock,
                cattleCount: registrationData.cattleCount,
                goatCount: registrationData.goatCount,
                selectedPoultry: registrationData.selectedPoultry,
                flockSize: registrationData.flockSize,
                poultryFeedCost: registrationData.poultryFeedCost,
                eggYieldPerWeek: registrationData.eggYieldPerWeek,
                hasAquaculture: registrationData.hasAquaculture,
                fishType: registrationData.fishType,
                fingerlingsCount: registrationData.fingerlingsCount,
                pondWidth: registrationData.pondWidth,
                pondLength: registrationData.pondLength,
                pondDepth: registrationData.pondDepth,
                fishFeedCost: registrationData.fishFeedCost,
                photo_uri: registrationData.photoUri || null,
                facial_biometrics: registrationData.facialBiometrics || null,
                signature_svg: registrationData.signatureSvg || null,
                signature_uri: registrationData.signatureUri || null,
                fingerprint_data: registrationData.fingerprintData || null,
                attestation_agreed: registrationData.attestationAgreed ?? true,
                currentCropStage: 'Not Started',
                activities: [],
                notes: [],
                photos: [],
            }
        };

        // 2. Prepare Farm payload
        const farmPayload = {
            farmerId: '',
            name: `${registrationData.primaryCrop || 'General'} Farm`,
            sizeHectares: parseFloat(registrationData.farmSizeHa) || 1.0,
            primaryCrop: registrationData.primaryCrop || 'Maize',
            community: resolvedLoc.community,
            metadata: {
                community: resolvedLoc.community,
                stateName: resolvedLoc.stateName,
                lgaName: resolvedLoc.lgaName,
                farmSizeAcres: registrationData.farmSizeAcres,
                perimeterMeters: registrationData.perimeterMeters,
                mappedVertices: registrationData.mappedVertices,
                landTenure: registrationData.landTenure,
                secondaryCrop: registrationData.secondaryCrop,
                selectedRegenPractices: registrationData.selectedRegenPractices,
                fertilizerUsed: registrationData.fertilizerUsed,
                agrochemicalsUsed: registrationData.agrochemicalsUsed,
                currentCropStage: 'Not Started',
                tasks: [],
                visits: [],
                validations: [],
                notes: [],
                photos: [],
            }
        };

        // 3. Prepare Field payload
        const vertices = registrationData.mappedVertices || [];
        const boundaryGeojson: any = {
            type: "Polygon",
            coordinates: [[]]
        };

        if (vertices.length > 0) {
            boundaryGeojson.coordinates[0] = vertices.map((v: any) => [parseFloat(v.longitude) || 7.4333, parseFloat(v.latitude) || 10.5167]);
            boundaryGeojson.coordinates[0].push([parseFloat(vertices[0].longitude) || 7.4333, parseFloat(vertices[0].latitude) || 10.5167]);
        } else {
            const lat = parseFloat(registrationData.gpsLat) || 10.5167;
            const lng = parseFloat(registrationData.gpsLong) || 7.4333;
            boundaryGeojson.coordinates[0] = [
                [lng - 0.001, lat - 0.001],
                [lng + 0.001, lat - 0.001],
                [lng + 0.001, lat + 0.001],
                [lng - 0.001, lat + 0.001],
                [lng - 0.001, lat - 0.001]
            ];
        }

        const fieldPayload = {
            farmId: '',
            name: 'Subplot A',
            areaHectares: parseFloat(registrationData.farmSizeHa) || 1.0,
            boundaryGeojson,
            centroidLat: parseFloat(registrationData.gpsLat) || 10.5167,
            centroidLng: parseFloat(registrationData.gpsLong) || 7.4333
        };

        try {
            const farmerResponse = await api.post<Farmer>('/farmers', farmerPayload);
            const farmer = farmerResponse.data;

            farmPayload.farmerId = farmer.id;
            const farmResponse = await api.post<any>('/farms', farmPayload);
            const farm = farmResponse.data;

            fieldPayload.farmId = farm.id;
            await api.post<any>('/fields', fieldPayload);

            return farmer;
        } catch (err: any) {
            console.warn('⚠️ [Farmer Onboarding] Network error / offline. Saving locally and queueing for sync:', err?.message || err);
            
            const localFarmerId = 'offline_farmer_' + Date.now();
            const localFarmer: Farmer = {
                id: localFarmerId,
                name: farmerPayload.fullName,
                community: resolvedLoc.community,
                group: `${resolvedLoc.community} Farmers`,
                farms: 1,
                activities: 0,
                fullName: farmerPayload.fullName,
                phone: farmerPayload.phone,
                email: farmerPayload.email,
                gender: farmerPayload.gender,
                dateOfBirth: farmerPayload.dateOfBirth,
                address: resolvedLoc.address,
                location: {
                    state: { id: resolvedLoc.stateId, name: resolvedLoc.stateName },
                    lga: { id: resolvedLoc.lgaId, name: resolvedLoc.lgaName },
                    community: resolvedLoc.community
                },
                isActive: true,
                metadata: farmerPayload.metadata,
                createdAt: new Date().toISOString()
            };

            // Save to local storage cache so farmer appears instantly on all mobile screens
            try {
                const stored = await AsyncStorage.getItem('offline_farmers_cache');
                let list: Farmer[] = stored ? JSON.parse(stored) : [];
                list.unshift(localFarmer);
                await AsyncStorage.setItem('offline_farmers_cache', JSON.stringify(list));
            } catch (_) {}

            // Enqueue to background sync queue
            const { syncService } = require('./syncService');
            await syncService.enqueueMutation({
                type: 'CREATE_FARMER',
                description: `Farmer Onboarding: ${farmerPayload.fullName}`,
                payload: {
                    farmerPayload,
                    farmPayload,
                    fieldPayload
                }
            });

            return localFarmer;
        }
    },

    updateFarmer: async (id: string, farmerData: Partial<Farmer>): Promise<Farmer> => {
        try {
            const response = await api.patch<Farmer>(`/farmers/${id}`, farmerData);
            return response.data;
        } catch (err: any) {
            console.warn(`⚠️ [updateFarmer] Offline/Network error for farmer ${id}. Saving locally & queueing sync:`, err?.message || err);
            
            // Update local storage
            try {
                const stored = await AsyncStorage.getItem('offline_farmers_cache');
                if (stored) {
                    const list: Farmer[] = JSON.parse(stored);
                    const idx = list.findIndex(f => f.id === id);
                    if (idx !== -1) {
                        list[idx] = {
                            ...list[idx],
                            ...farmerData,
                            metadata: {
                                ...(list[idx].metadata || {}),
                                ...(farmerData.metadata || {})
                            }
                        };
                        await AsyncStorage.setItem('offline_farmers_cache', JSON.stringify(list));
                    }
                }
            } catch (_) {}

            // Enqueue to background sync queue
            const { syncService } = require('./syncService');
            await syncService.enqueueMutation({
                type: 'UPDATE_FARMER',
                description: `Update Farmer #${id}`,
                endpoint: `/farmers/${id}`,
                method: 'PATCH',
                payload: farmerData
            });

            return {
                id,
                name: farmerData.name || farmerData.fullName || 'Farmer',
                community: '',
                group: '',
                farms: 1,
                activities: 0,
                ...farmerData
            } as Farmer;
        }
    }
};

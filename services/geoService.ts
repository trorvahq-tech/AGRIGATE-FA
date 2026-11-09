import * as Location from 'expo-location';
import api from './apiClient';

export interface ReverseGeocodeResult {
    community: string;
    lga: string;
    stateName: string;
    country: string;
    address: string;
    source: 'expo-location' | 'nominatim' | 'offline-bounding-box';
}

export interface ResolvedBackendLocation {
    stateId: number;
    stateName: string;
    lgaId: number;
    lgaName: string;
    wardId: number;
    community: string;
    address: string;
}

// Built-in map of Nigerian states with exact database IDs to guarantee instant offline / fast fallback
export const NIGERIA_STATES_MAP: { id: number; name: string; defaultLgaId: number; defaultWardId: number; defaultLgaName: string }[] = [
    { id: 1, name: 'Abia', defaultLgaId: 1, defaultWardId: 1, defaultLgaName: 'Aba North' },
    { id: 2, name: 'Federal Capital Territory', defaultLgaId: 23, defaultWardId: 235, defaultLgaName: 'Municipal' },
    { id: 3, name: 'Adamawa', defaultLgaId: 24, defaultWardId: 245, defaultLgaName: 'Demsa' },
    { id: 4, name: 'Akwa Ibom', defaultLgaId: 45, defaultWardId: 460, defaultLgaName: 'Abak' },
    { id: 5, name: 'Anambra', defaultLgaId: 76, defaultWardId: 770, defaultLgaName: 'Aguata' },
    { id: 6, name: 'Bauchi', defaultLgaId: 97, defaultWardId: 980, defaultLgaName: 'Bauchi' },
    { id: 7, name: 'Bayelsa', defaultLgaId: 117, defaultWardId: 1180, defaultLgaName: 'Yenagoa' },
    { id: 8, name: 'Benue', defaultLgaId: 125, defaultWardId: 1260, defaultLgaName: 'Makurdi' },
    { id: 9, name: 'Borno', defaultLgaId: 148, defaultWardId: 1490, defaultLgaName: 'Maiduguri' },
    { id: 10, name: 'Cross River', defaultLgaId: 175, defaultWardId: 1760, defaultLgaName: 'Calabar Municipal' },
    { id: 11, name: 'Delta', defaultLgaId: 193, defaultWardId: 1940, defaultLgaName: 'Warri South' },
    { id: 12, name: 'Ebonyi', defaultLgaId: 218, defaultWardId: 2190, defaultLgaName: 'Abakaliki' },
    { id: 13, name: 'Edo', defaultLgaId: 231, defaultWardId: 2320, defaultLgaName: 'Oredo' },
    { id: 14, name: 'Ekiti', defaultLgaId: 249, defaultWardId: 2500, defaultLgaName: 'Ado-Ekiti' },
    { id: 15, name: 'Enugu', defaultLgaId: 265, defaultWardId: 2660, defaultLgaName: 'Enugu North' },
    { id: 16, name: 'Gombe', defaultLgaId: 282, defaultWardId: 2830, defaultLgaName: 'Gombe' },
    { id: 17, name: 'Imo', defaultLgaId: 293, defaultWardId: 2940, defaultLgaName: 'Owerri Municipal' },
    { id: 18, name: 'Jigawa', defaultLgaId: 320, defaultWardId: 3210, defaultLgaName: 'Dutse' },
    { id: 19, name: 'Kaduna', defaultLgaId: 347, defaultWardId: 4002, defaultLgaName: 'Zaria' },
    { id: 20, name: 'Kano', defaultLgaId: 370, defaultWardId: 3710, defaultLgaName: 'Kano Municipal' },
    { id: 21, name: 'Katsina', defaultLgaId: 414, defaultWardId: 4150, defaultLgaName: 'Katsina' },
    { id: 22, name: 'Kebbi', defaultLgaId: 448, defaultWardId: 4490, defaultLgaName: 'Birnin Kebbi' },
    { id: 23, name: 'Kogi', defaultLgaId: 469, defaultWardId: 4700, defaultLgaName: 'Lokoja' },
    { id: 24, name: 'Kwara', defaultLgaId: 490, defaultWardId: 4910, defaultLgaName: 'Ilorin West' },
    { id: 25, name: 'Lagos', defaultLgaId: 506, defaultWardId: 5070, defaultLgaName: 'Ikeja' },
    { id: 26, name: 'Nassarawa', defaultLgaId: 526, defaultWardId: 5270, defaultLgaName: 'Lafia' },
    { id: 27, name: 'Niger', defaultLgaId: 539, defaultWardId: 5400, defaultLgaName: 'Chanchaga' },
    { id: 28, name: 'Ogun', defaultLgaId: 564, defaultWardId: 5650, defaultLgaName: 'Abeokuta South' },
    { id: 29, name: 'Ondo', defaultLgaId: 584, defaultWardId: 5850, defaultLgaName: 'Akure South' },
    { id: 30, name: 'Osun', defaultLgaId: 602, defaultWardId: 6030, defaultLgaName: 'Osogbo' },
    { id: 31, name: 'Oyo', defaultLgaId: 632, defaultWardId: 6330, defaultLgaName: 'Ibadan North' },
    { id: 32, name: 'Plateau', defaultLgaId: 665, defaultWardId: 6660, defaultLgaName: 'Jos North' },
    { id: 33, name: 'Rivers', defaultLgaId: 682, defaultWardId: 6830, defaultLgaName: 'Port Harcourt' },
    { id: 34, name: 'Sokoto', defaultLgaId: 705, defaultWardId: 7060, defaultLgaName: 'Sokoto South' },
    { id: 35, name: 'Taraba', defaultLgaId: 728, defaultWardId: 7290, defaultLgaName: 'Jalingo' },
    { id: 36, name: 'Yobe', defaultLgaId: 744, defaultWardId: 7450, defaultLgaName: 'Damaturu' },
    { id: 37, name: 'Zamfara', defaultLgaId: 761, defaultWardId: 7620, defaultLgaName: 'Gusau' }
];

export const geoService = {
    /**
     * Formats Nigerian state name cleanly (e.g. avoid 'Federal Capital Territory State')
     */
    formatStateDisplay(stateName?: string): string {
        if (!stateName) return '';
        const trimmed = stateName.trim();
        const lower = trimmed.toLowerCase();
        if (lower.includes('territory') || lower.includes('state') || lower.includes('fct')) {
            return trimmed;
        }
        return `${trimmed} State`;
    },

    /**
     * Formats full location string (e.g. 'Garki, Federal Capital Territory' or 'Dambo, Kaduna State')
     */
    formatLocationString(community?: string, stateName?: string): string {
        const comm = (community || '').trim();
        const st = geoService.formatStateDisplay(stateName);
        if (comm && st) return `${comm}, ${st}`;
        return comm || st || '—';
    },

    /**
     * Reverse geocodes coordinates (lat, lng) to community, LGA, State, and address
     */
    reverseGeocode: async (latitude: number, longitude: number): Promise<ReverseGeocodeResult> => {
        if (!isFinite(latitude) || !isFinite(longitude)) {
            return {
                community: 'Community',
                lga: 'LGA',
                stateName: 'Federal Capital Territory',
                country: 'Nigeria',
                address: 'Abuja, Nigeria',
                source: 'offline-bounding-box'
            };
        }

        // 1. Primary: Try native Expo Location reverseGeocodeAsync
        try {
            const results = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (results && results.length > 0) {
                const loc = results[0];
                const region = (loc.region || '').trim();
                const subregion = (loc.subregion || '').trim();
                const district = (loc.district || '').trim();
                const city = (loc.city || '').trim();
                const street = (loc.street || '').trim();
                const name = (loc.name || '').trim();

                // Determine state name
                let stateName = region;
                if (!stateName || stateName.toLowerCase().includes('abuja')) {
                    if (latitude >= 8.25 && latitude <= 9.35 && longitude >= 6.75 && longitude <= 7.80) {
                        stateName = 'Federal Capital Territory';
                    }
                }

                // Determine community: prioritize neighborhood/district/city
                let community = district || name || city || subregion || street || 'Community';
                // If community is just numbers or street address, use city/district
                if (/^\d+/.test(community) && city) {
                    community = city;
                }

                // Determine LGA: subregion or district
                let lga = subregion || district || city || 'Municipal';

                const stateDisplay = geoService.formatStateDisplay(stateName);
                const address = [community, lga, stateDisplay, 'Nigeria']
                    .filter((part, idx, arr) => part && arr.indexOf(part) === idx)
                    .join(', ');

                return {
                    community,
                    lga,
                    stateName: stateName || 'Federal Capital Territory',
                    country: loc.country || 'Nigeria',
                    address,
                    source: 'expo-location'
                };
            }
        } catch (expoErr) {
            console.warn('[geoService] expo-location reverse geocode error:', expoErr);
        }

        // 2. Secondary: Try OpenStreetMap Nominatim reverse geocoder
        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = setTimeout(() => controller?.abort(), 3500);

            const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
            const resp = await fetch(url, {
                headers: { 'User-Agent': 'SmallholdersFarmManager/1.0' },
                signal: controller?.signal
            });
            clearTimeout(timeoutId);

            if (resp.ok) {
                const data = await resp.json();
                const addr = data.address || {};
                const stateName = addr.state || (latitude >= 8.25 && latitude <= 9.35 ? 'Federal Capital Territory' : 'Kaduna');
                const lga = addr.county || addr.suburb || addr.city || 'Municipal';
                const community = addr.suburb || addr.neighbourhood || addr.district || addr.quarter || addr.city || addr.village || addr.town || 'Community';
                const stateDisplay = geoService.formatStateDisplay(stateName);
                const fullAddress = [community, lga, stateDisplay, 'Nigeria']
                    .filter((part, idx, arr) => part && arr.indexOf(part) === idx)
                    .join(', ');

                return {
                    community,
                    lga,
                    stateName,
                    country: addr.country || 'Nigeria',
                    address: fullAddress,
                    source: 'nominatim'
                };
            }
        } catch (nomErr) {
            console.warn('[geoService] Nominatim reverse geocode error:', nomErr);
        }

        // 3. Tertiary: Offline Nigerian Bounding Box fallback
        return geoService.getOfflineNigerianLocation(latitude, longitude);
    },

    /**
     * Offline coordinate-to-state lookup based on Nigeria's geographic coordinates
     */
    getOfflineNigerianLocation: (lat: number, lng: number): ReverseGeocodeResult => {
        // Federal Capital Territory (Abuja) bounding box
        if (lat >= 8.25 && lat <= 9.35 && lng >= 6.75 && lng <= 7.80) {
            return {
                community: 'Abuja Municipal',
                lga: 'Municipal',
                stateName: 'Federal Capital Territory',
                country: 'Nigeria',
                address: 'Abuja Municipal, Federal Capital Territory, Nigeria',
                source: 'offline-bounding-box'
            };
        }

        // Kaduna State bounding box
        if (lat >= 9.00 && lat <= 11.50 && lng >= 6.10 && lng <= 8.80) {
            const isZaria = lat >= 10.90 && lat <= 11.25 && lng >= 7.60 && lng <= 7.85;
            return {
                community: isZaria ? 'Zaria Community' : 'Kaduna Community',
                lga: isZaria ? 'Zaria' : 'Kaduna North',
                stateName: 'Kaduna',
                country: 'Nigeria',
                address: `${isZaria ? 'Zaria' : 'Kaduna'}, Kaduna State, Nigeria`,
                source: 'offline-bounding-box'
            };
        }

        // Kano State bounding box
        if (lat >= 11.20 && lat <= 12.60 && lng >= 7.80 && lng <= 9.40) {
            return {
                community: 'Kano Municipal',
                lga: 'Kano Municipal',
                stateName: 'Kano',
                country: 'Nigeria',
                address: 'Kano Municipal, Kano State, Nigeria',
                source: 'offline-bounding-box'
            };
        }

        // Lagos State bounding box
        if (lat >= 6.35 && lat <= 6.75 && lng >= 2.70 && lng <= 4.40) {
            return {
                community: 'Ikeja',
                lga: 'Ikeja',
                stateName: 'Lagos',
                country: 'Nigeria',
                address: 'Ikeja, Lagos State, Nigeria',
                source: 'offline-bounding-box'
            };
        }

        // Oyo State bounding box
        if (lat >= 7.00 && lat <= 8.50 && lng >= 3.50 && lng <= 5.50) {
            return {
                community: 'Ibadan North',
                lga: 'Ibadan North',
                stateName: 'Oyo',
                country: 'Nigeria',
                address: 'Ibadan North, Oyo State, Nigeria',
                source: 'offline-bounding-box'
            };
        }

        // Default to Abuja/FCT if near central Nigeria or fallback
        return {
            community: 'Community',
            lga: 'Municipal',
            stateName: 'Federal Capital Territory',
            country: 'Nigeria',
            address: 'Federal Capital Territory, Nigeria',
            source: 'offline-bounding-box'
        };
    },

    /**
     * Resolves valid stateId, lgaId, wardId, and community matching backend database schema
     */
    resolveBackendLocation: async (params: {
        stateName?: string;
        lgaName?: string;
        community?: string;
        latitude?: number;
        longitude?: number;
    }): Promise<ResolvedBackendLocation> => {
        let stateName = params.stateName || '';
        let lgaName = params.lgaName || '';
        let community = params.community || '';

        // If coordinates provided and community/state missing, reverse geocode first
        if ((!stateName || !community) && params.latitude && params.longitude) {
            const geo = await geoService.reverseGeocode(params.latitude, params.longitude);
            if (!stateName) stateName = geo.stateName;
            if (!lgaName) lgaName = geo.lga;
            if (!community || community === 'Community') community = geo.community;
        }

        // Normalize state search
        const normInput = (stateName || '').toLowerCase().replace(/state/g, '').trim();
        let matched = NIGERIA_STATES_MAP.find((s) => {
            const sName = s.name.toLowerCase();
            if (normInput.includes('abuja') || normInput.includes('fct') || normInput.includes('capital')) {
                return s.id === 2; // Federal Capital Territory
            }
            return sName.includes(normInput) || normInput.includes(sName);
        });

        if (!matched) {
            matched = NIGERIA_STATES_MAP.find(s => s.id === 2) || NIGERIA_STATES_MAP[0];
        }

        let stateId = matched.id;
        let finalStateName = matched.name;
        let lgaId = matched.defaultLgaId;
        let finalLgaName = matched.defaultLgaName;
        let wardId = matched.defaultWardId;

        // Try querying live backend for accurate dynamic LGA and Ward IDs
        try {
            const lgasRes = await api.get(`/geo/nigeria/states/${stateId}/lgas`);
            const lgasList = lgasRes.data?.data || lgasRes.data || [];
            if (Array.isArray(lgasList) && lgasList.length > 0) {
                let foundLga = null;
                if (lgaName) {
                    const cleanLga = lgaName.toLowerCase().replace(/local government|lga|area council/g, '').trim();
                    foundLga = lgasList.find((l: any) =>
                        l.name?.toLowerCase().includes(cleanLga) || cleanLga.includes(l.name?.toLowerCase())
                    );
                }
                const chosenLga = foundLga || lgasList[0];
                lgaId = chosenLga.id;
                finalLgaName = chosenLga.name;

                // Fetch ward for this LGA
                const wardsRes = await api.get(`/geo/nigeria/lgas/${lgaId}/wards`);
                const wardsList = wardsRes.data?.data || wardsRes.data || [];
                if (Array.isArray(wardsList) && wardsList.length > 0) {
                    wardId = wardsList[0].id;
                }
            }
        } catch (apiErr) {
            console.warn('[geoService] Live backend geo resolution fallback used:', apiErr);
        }

        const finalCommunity = community && community !== 'Community' ? community : `${finalLgaName} Community`;
        const stateDisplay = geoService.formatStateDisplay(finalStateName);
        const address = `${finalCommunity}, ${stateDisplay}, Nigeria`;

        return {
            stateId,
            stateName: finalStateName,
            lgaId,
            lgaName: finalLgaName,
            wardId,
            community: finalCommunity,
            address
        };
    }
};

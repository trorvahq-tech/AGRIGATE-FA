export type SeasonalStage = 'pre_season' | 'early_season' | 'mid_season' | 'late_season' | 'end_season';

export type ActivityId =
    | 'PS-01'
    | 'PS-02'
    | 'PS-03'
    | 'PS-04'
    | 'ES-01'
    | 'ES-02'
    | 'ES-03'
    | 'MS-01'
    | 'MS-02'
    | 'MS-03'
    | 'MS-04'
    | 'LS-01'
    | 'LS-02'
    | 'END-01'
    | 'END-02'
    | 'END-03';

export type AttemptStatus =
    | 'completed'
    | 'farmer_unavailable'
    | 'farm_inaccessible'
    | 'farmer_refused'
    | 'crop_abandoned'
    | 'no_attempt';

export type MeasurementUnit = 'kg' | 'bags' | 'mudu' | 'tonnes' | 'litres' | 'sachets' | 'bundles';

export interface ActivitySpec {
    id: ActivityId;
    stage: SeasonalStage;
    formId: string;
    title: string;
    objective: string;
    points: number;
    phoneOrMeeting: boolean;
    visit: boolean;
    gpsRequired: boolean;
    photoRecommended: boolean;
    managementIndicator: string;
}

export interface AttemptStatusConfig {
    id: AttemptStatus;
    label: string;
    description: string;
    countsForPayment: boolean;
    requiresReason: boolean;
    badgeColor: string;
    badgeBg: string;
}

export const SEASONAL_STAGES: { id: SeasonalStage; label: string; description: string }[] = [
    { id: 'pre_season', label: 'Pre-season', description: 'Crop plan, seed, finance, farm location' },
    { id: 'early_season', label: 'Early season', description: 'Land prep, planting verification, germination' },
    { id: 'mid_season', label: 'Mid-season', description: 'Bio-inputs, crop management, risk monitoring' },
    { id: 'late_season', label: 'Late season', description: 'Harvest start and harvest yield verification' },
    { id: 'end_season', label: 'End season', description: 'Storage, aggregation, and Juriya market sales' },
];

export const VCM_ACTIVITY_DICTIONARY: Record<ActivityId, ActivitySpec> = {
    'PS-01': {
        id: 'PS-01',
        stage: 'pre_season',
        formId: 'VCM-01',
        title: 'Farmer Crop Plan Confirmation',
        objective: 'Confirm intended crops and planned cultivation area per farmer.',
        points: 5,
        phoneOrMeeting: true,
        visit: false,
        gpsRequired: false,
        photoRecommended: false,
        managementIndicator: '% farmers with confirmed crop plans',
    },
    'PS-02': {
        id: 'PS-02',
        stage: 'pre_season',
        formId: 'VCM-01',
        title: 'Seed Requirement & Availability',
        objective: 'Estimate seed demand and identify farmers with seed gaps before planting.',
        points: 5,
        phoneOrMeeting: true,
        visit: false,
        gpsRequired: false,
        photoRecommended: false,
        managementIndicator: 'Total seed demand and seed gap',
    },
    'PS-03': {
        id: 'PS-03',
        stage: 'pre_season',
        formId: 'VCM-01',
        title: 'Finance & Input Assessment',
        objective: 'Confirm individual and MTG group finance and input requirements.',
        points: 5,
        phoneOrMeeting: true,
        visit: false,
        gpsRequired: false,
        photoRecommended: false,
        managementIndicator: 'Finance demand and input demand by MTG',
    },
    'PS-04': {
        id: 'PS-04',
        stage: 'pre_season',
        formId: 'VCM-02',
        title: 'Farm Location & Status Verification',
        objective: 'Confirm farmer active status and plot location accessibility with GPS.',
        points: 5,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: false,
        managementIndicator: '% assigned farmers with verified farm locations',
    },
    'ES-01': {
        id: 'ES-01',
        stage: 'early_season',
        formId: 'VCM-03',
        title: 'Land Preparation Confirmation',
        objective: 'Verify farm preparation method and readiness prior to planting.',
        points: 6,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: true,
        managementIndicator: '% farms prepared on time',
    },
    'ES-02': {
        id: 'ES-02',
        stage: 'early_season',
        formId: 'VCM-03',
        title: 'Planting Verification',
        objective: 'Confirm planting date, seed variety, and actual planted area.',
        points: 10,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: true,
        managementIndicator: '% farmers planted & average planting date',
    },
    'ES-03': {
        id: 'ES-03',
        stage: 'early_season',
        formId: 'VCM-04',
        title: 'Germination Assessment',
        objective: 'Assess crop establishment rate and identify replanting needs.',
        points: 10,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: true,
        managementIndicator: '% farms with satisfactory germination',
    },
    'MS-01': {
        id: 'MS-01',
        stage: 'mid_season',
        formId: 'VCM-05',
        title: 'Bio-Input Supply Confirmation',
        objective: 'Verify delivery of organic/bio-inputs to farmer/MTG.',
        points: 5,
        phoneOrMeeting: true,
        visit: true,
        gpsRequired: false,
        photoRecommended: false,
        managementIndicator: 'Quantity of bio-input supplied',
    },
    'MS-02': {
        id: 'MS-02',
        stage: 'mid_season',
        formId: 'VCM-05',
        title: 'Bio-Input Application Verification',
        objective: 'Confirm supplied bio-inputs were correctly applied on the field.',
        points: 7,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: true,
        managementIndicator: '% supplied inputs applied correctly',
    },
    'MS-03': {
        id: 'MS-03',
        stage: 'mid_season',
        formId: 'VCM-05',
        title: 'Farm Management Practice Monitoring',
        objective: 'Track weeding, thinning, gap filling, mulching, and pest management.',
        points: 8,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: false,
        managementIndicator: '% farms completing core management practices',
    },
    'MS-04': {
        id: 'MS-04',
        stage: 'mid_season',
        formId: 'VCM-05',
        title: 'Crop Condition & Risk Assessment',
        objective: 'Provide early warning on crop health, pests, drought, or flood risks.',
        points: 7,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: true,
        managementIndicator: '% farms at risk & risk distribution',
    },
    'LS-01': {
        id: 'LS-01',
        stage: 'late_season',
        formId: 'VCM-06',
        title: 'Harvest Start Confirmation',
        objective: 'Confirm harvest start date and expected harvest completion.',
        points: 5,
        phoneOrMeeting: true,
        visit: true,
        gpsRequired: false,
        photoRecommended: false,
        managementIndicator: '% farmers that have started harvest',
    },
    'LS-02': {
        id: 'LS-02',
        stage: 'late_season',
        formId: 'VCM-06',
        title: 'Harvest Quantity Verification',
        objective: 'Verify total harvested yield, units, and quality observations.',
        points: 10,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: true,
        managementIndicator: 'Total production & yield per farmer/ha',
    },
    'END-01': {
        id: 'END-01',
        stage: 'end_season',
        formId: 'VCM-07',
        title: 'Storage Confirmation',
        objective: 'Confirm harvested produce is safely stored, labelled, and traceable.',
        points: 5,
        phoneOrMeeting: false,
        visit: true,
        gpsRequired: true,
        photoRecommended: true,
        managementIndicator: 'Quantity stored and storage compliance',
    },
    'END-02': {
        id: 'END-02',
        stage: 'end_season',
        formId: 'VCM-07',
        title: 'Aggregation Record',
        objective: 'Record produce delivered into MTG/Juriya aggregation channels.',
        points: 4,
        phoneOrMeeting: true,
        visit: true,
        gpsRequired: false,
        photoRecommended: false,
        managementIndicator: 'Quantity aggregated per farmer/MTG',
    },
    'END-03': {
        id: 'END-03',
        stage: 'end_season',
        formId: 'VCM-07',
        title: 'Juriya Market Sales Outcome',
        objective: 'Measure marketing outcomes, unit price, and total revenue received.',
        points: 3,
        phoneOrMeeting: true,
        visit: true,
        gpsRequired: false,
        photoRecommended: false,
        managementIndicator: 'Average price, farmer revenue, % sold via Juriya',
    },
};

export const ATTEMPT_STATUS_CONFIGS: Record<AttemptStatus, AttemptStatusConfig> = {
    completed: {
        id: 'completed',
        label: 'Completed',
        description: 'Activity completed and evidence submitted successfully.',
        countsForPayment: true,
        requiresReason: false,
        badgeColor: '#10B981',
        badgeBg: '#10B9811A',
    },
    farmer_unavailable: {
        id: 'farmer_unavailable',
        label: 'Farmer Unavailable',
        description: 'Call or visit attempt recorded; farmer was away or unreachable.',
        countsForPayment: true,
        requiresReason: true,
        badgeColor: '#F59E0B',
        badgeBg: '#F59E0B1A',
    },
    farm_inaccessible: {
        id: 'farm_inaccessible',
        label: 'Farm Inaccessible',
        description: 'Visit attempted; road blocked, flooded, or security constraint.',
        countsForPayment: true,
        requiresReason: true,
        badgeColor: '#EC4899',
        badgeBg: '#EC48991A',
    },
    farmer_refused: {
        id: 'farmer_refused',
        label: 'Farmer Refused',
        description: 'Farmer declined verification; supervisor escalation triggered.',
        countsForPayment: true,
        requiresReason: true,
        badgeColor: '#EF4444',
        badgeBg: '#EF44441A',
    },
    crop_abandoned: {
        id: 'crop_abandoned',
        label: 'Crop/Farm Abandoned',
        description: 'Plot abandoned due to climate/pest loss; verified by VCM.',
        countsForPayment: true,
        requiresReason: true,
        badgeColor: '#6B7280',
        badgeBg: '#6B72801A',
    },
    no_attempt: {
        id: 'no_attempt',
        label: 'No Attempt Made',
        description: 'Activity window missed or skipped without attempt.',
        countsForPayment: false,
        requiresReason: false,
        badgeColor: '#9CA3AF',
        badgeBg: '#9CA3AF1A',
    },
};

export const STANDARD_UNITS: { id: MeasurementUnit; label: string; category: 'mass' | 'volume' | 'container' }[] = [
    { id: 'kg', label: 'Kilograms (kg)', category: 'mass' },
    { id: 'bags', label: 'Bags (100kg std)', category: 'container' },
    { id: 'mudu', label: 'Mudu (approx 1.3kg)', category: 'container' },
    { id: 'tonnes', label: 'Metric Tonnes (t)', category: 'mass' },
    { id: 'litres', label: 'Litres (L)', category: 'volume' },
    { id: 'sachets', label: 'Sachets', category: 'container' },
    { id: 'bundles', label: 'Bundles', category: 'container' },
];

export const TOTAL_VCM_SEASONAL_POINTS = 100;
export const CONTRACTED_VCM_FEE_NAIRA = 10000;

export function calculateVcmPayment(pointsEarned: number, baseFee: number = CONTRACTED_VCM_FEE_NAIRA): {
    pointsEarned: number;
    totalPossible: number;
    completionPercentage: number;
    paymentNaira: number;
    formattedPayment: string;
} {
    const safePoints = Math.min(Math.max(0, pointsEarned), TOTAL_VCM_SEASONAL_POINTS);
    const completionPercentage = Math.round((safePoints / TOTAL_VCM_SEASONAL_POINTS) * 100);
    const paymentNaira = Math.round((safePoints / TOTAL_VCM_SEASONAL_POINTS) * baseFee);
    const formattedPayment = `₦${paymentNaira.toLocaleString()}`;

    return {
        pointsEarned: safePoints,
        totalPossible: TOTAL_VCM_SEASONAL_POINTS,
        completionPercentage,
        paymentNaira,
        formattedPayment,
    };
}

export type FarmingCycleStep =
    | '1_seed_acquisition'
    | '2_land_preparation'
    | '3_planting'
    | '4_germination'
    | '5_crop_management'
    | '6_harvest';

export const FARMING_CYCLE_SEQUENCE: {
    id: FarmingCycleStep;
    stepNumber: number;
    title: string;
    description: string;
    activityIds: ActivityId[];
}[] = [
    {
        id: '1_seed_acquisition',
        stepNumber: 1,
        title: '1. Seed Acquisition',
        description: 'Track seed demand, variety selection, seed quality & gap estimation.',
        activityIds: ['PS-01', 'PS-02', 'PS-03'],
    },
    {
        id: '2_land_preparation',
        stepNumber: 2,
        title: '2. Land Preparation',
        description: 'Track land clearing, tillage method, readiness & GPS location.',
        activityIds: ['PS-04', 'ES-01'],
    },
    {
        id: '3_planting',
        stepNumber: 3,
        title: '3. Planting',
        description: 'Track sowing date, seed variety, spacing density & bio-input delivery.',
        activityIds: ['ES-02', 'MS-01'],
    },
    {
        id: '4_germination',
        stepNumber: 4,
        title: '4. Germination',
        description: 'Assess seedling emergence %, germination rate & initial weeding.',
        activityIds: ['ES-03', 'MS-02'],
    },
    {
        id: '5_crop_management',
        stepNumber: 5,
        title: '5. Crop Management',
        description: 'Track top-dressing bio-inputs, weeding, pest scouring & risk warnings.',
        activityIds: ['MS-03', 'MS-04', 'LS-01'],
    },
    {
        id: '6_harvest',
        stepNumber: 6,
        title: '6. Harvest & Aggregation',
        description: 'Record harvest yields, storage compliance & Juriya market sales.',
        activityIds: ['LS-02', 'END-01', 'END-02', 'END-03'],
    },
];

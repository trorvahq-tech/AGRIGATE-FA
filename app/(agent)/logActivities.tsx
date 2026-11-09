import { Feather, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Dimensions, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../components/ui/CustomBackNavBar';
import { useTheme } from '../../context/ThemeContext';
import {
    ActivityId,
    ATTEMPT_STATUS_CONFIGS,
    AttemptStatus,
    FARMING_CYCLE_SEQUENCE,
    FarmingCycleStep,
    MeasurementUnit,
    SEASONAL_STAGES,
    SeasonalStage,
    STANDARD_UNITS,
    VCM_ACTIVITY_DICTIONARY,
} from '../../constants/vcmSeasonalSpec';
import { vcmActivityService, CompletedActivityRecord } from '../../services/vcmActivityService';

const { width } = Dimensions.get('window');

const RECORDED_INPUTS_DB: Record<string, {
    quantity?: string;
    unit?: string;
    attemptStatus?: AttemptStatus;
    reason?: string;
    variety?: string;
    intercrop?: string;
    spacing?: string;
    seedQty?: string;
    germRate?: string;
    vigor?: string;
    density?: string;
    weed?: string;
    weedMethod?: string;
    bioInput?: string;
    health?: string;
    harvestEvent?: string;
    harvestQty?: string;
    yieldEstimate?: string;
    gps?: string;
    evidencePhoto?: string;
    notes?: string;

    // Detailed activity inputs
    intendedCropPlan?: string;
    plannedCropArea?: string;
    seedDemandKg?: string;
    seedGapStatus?: string;
    financeNaira?: string;
    financeInputsNeeded?: string[];
    plotAccessibility?: string;
    plotCultivationStatus?: string;
    landPrepMethod?: string;
    soilMoisture?: string;
    bioInputDelivered?: string;
    bioInputDeliveryStatus?: string;
    bioInputAppMethod?: string;
    bioInputAppDate?: string;
    practicesObserved?: string[];
    pestDensity?: string;
    cropHealthRating?: string;
    riskWarningType?: string;
    expectedHarvestDate?: string;
    intendedStorageChannel?: string;
    storageCompliance?: string;
    storageBagsCount?: string;
    aggregationHub?: string;
    aggregationTransport?: string;
    salesPricePerUnit?: string;
    salesTransactionId?: string;
    ps02SelectedItems?: { id: string; name: string; qty: string; unit: string }[];
    landPrepStartedDate?: string;
    landPrepEndedDate?: string;
    plantingStartedDate?: string;
    plantingDescription?: string;
    harvestStartedDate?: string;
}> = {
    'PS-01': {
        intendedCropPlan: 'Kaduna Option 1: Soybean + Drop Maize -> Sesame Relay',
        plannedCropArea: '2.5',
        notes: 'Farmer confirmed their crop plan and requested land layout review.',
        attemptStatus: 'completed',
        gps: '8.4902° N, 4.5421° E',
    },
    'PS-02': {
        seedDemandKg: '50',
        seedGapStatus: 'Seed Available (No Gap)',
        notes: 'Improved SAMMAZ 52 maize seeds sourced.',
        attemptStatus: 'completed',
        gps: '8.4921° N, 4.5448° E',
        ps02SelectedItems: [
            { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', qty: '50', unit: 'kg' },
            { id: 'npk-blend', name: 'NPK 15:15:15 Organic Blend', qty: '2', unit: 'bags' }
        ]
    },
    'PS-03': {
        financeNaira: '150,000',
        financeInputsNeeded: ['Fertilizer', 'Seeds'],
        notes: 'Cooperative MTG finance approved and seed credits disbursed.',
        attemptStatus: 'completed',
        gps: '8.4905° N, 4.5432° E',
    },
    'PS-04': {
        plotAccessibility: 'Fully Accessible',
        plotCultivationStatus: 'Active Farming',
        notes: 'Active farming plot located with clear road access.',
        attemptStatus: 'completed',
        gps: '8.4908° N, 4.5429° E',
    },
    'ES-01': {
        landPrepMethod: 'Tractor Tillage',
        soilMoisture: 'Optimal Moisture',
        notes: 'Tractor plowing completed successfully. Soil moisture ready for planting.',
        attemptStatus: 'completed',
        gps: '8.4912° N, 4.5428° E',
    },
    'ES-02': {
        quantity: '25',
        unit: 'kg',
        variety: 'Maize (SAMMAZ 52)',
        intercrop: 'Monocropping (Single Crop)',
        spacing: '75cm x 25cm (Ridge Row)',
        seedQty: '25',
        attemptStatus: 'completed',
        gps: '8.4909° N, 4.5430° E',
        evidencePhoto: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500',
        notes: 'Planting verification finished. Seeds planted at standard depth.',
    },
    'ES-03': {
        germRate: '> 85% Excellent',
        vigor: 'Strong Uniform Stand',
        density: '53,333 plants/ha (Maize Standard)',
        attemptStatus: 'completed',
        gps: '8.4910° N, 4.5429° E',
        notes: 'Excellent germination rate with highly uniform sprout density.',
    },
    'MS-01': {
        bioInputDelivered: 'Organic Liquid Fertilizer',
        bioInputDeliveryStatus: 'Delivered & Confirmed',
        notes: 'Liquid organic fertilizer supplied to VCM group lead.',
        attemptStatus: 'completed',
        gps: '8.4911° N, 4.5427° E',
    },
    'MS-02': {
        bioInputAppMethod: 'Foliar Spraying',
        bioInputAppDate: '2026-07-02',
        notes: 'Foliar spray applied correctly during early growth stage.',
        attemptStatus: 'completed',
        gps: '8.4915° N, 4.5435° E',
    },
    'MS-03': {
        practicesObserved: ['First weeding done', 'Thinning complete'],
        pestDensity: 'Clean / No Pests',
        notes: 'First weeding done and crop thinning completed.',
        attemptStatus: 'completed',
        gps: '8.4918° N, 4.5438° E',
    },
    'MS-04': {
        cropHealthRating: 'Excellent vigor',
        riskWarningType: 'None',
        notes: 'Crop condition healthy. Dark green foliage. Low risk warning.',
        attemptStatus: 'completed',
        gps: '8.4919° N, 4.5439° E',
    },
    'LS-01': {
        expectedHarvestDate: '2026-08-15',
        intendedStorageChannel: 'Hermetic PICS Bags',
        notes: 'Harvest expected to commence next week.',
        attemptStatus: 'completed',
        gps: '8.4920° N, 4.5440° E',
    },
    'LS-02': {
        harvestEvent: 'Harvest Event #1 (First Pick)',
        harvestQty: '1,200',
        yieldEstimate: '4.8 MT / Ha (High Yield)',
        attemptStatus: 'completed',
        gps: '8.4921° N, 4.5441° E',
        notes: 'Harvest quantity verified on site by VCM agent.',
    },
    'END-01': {
        storageCompliance: 'Dry & Well-Ventilated',
        storageBagsCount: '30',
        notes: 'Bags loaded in a dry, ventilated storage space.',
        attemptStatus: 'completed',
        gps: '8.4922° N, 4.5445° E',
    },
    'END-02': {
        aggregationHub: 'Kano Hub',
        aggregationTransport: 'Small Truck',
        notes: 'Delivered to Kano hub using local delivery truck.',
        attemptStatus: 'completed',
    },
    'END-03': {
        salesPricePerUnit: '450',
        salesTransactionId: 'TXN-JUR-8839',
        notes: 'Juriya premium buyer paid invoice details.',
        attemptStatus: 'completed',
    },
};

const PS02_CATALOG = [
    { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'egusi-seed', name: 'Improved Egusi (Melon) Seed', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'soy-seed', name: 'Soybean Seed (TGX-1448-2E)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'sorghum-seed', name: 'Sorghum Seed (SAMSORG-45)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'rice-seed', name: 'Rice Seed (FARO-44)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'cowpea-seed', name: 'Cowpea Seed (SAMPEA-11)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'bio-fert', name: 'Bio-Fertilizer (Liquid Organics)', category: 'Bio-Inputs', defaultUnit: 'litres' },
    { id: 'npk-blend', name: 'NPK 15:15:15 Organic Blend', category: 'Fertilizers', defaultUnit: 'bags' },
    { id: 'urea', name: 'Urea Fertilizer', category: 'Fertilizers', defaultUnit: 'bags' },
    { id: 'neem-pest', name: 'Neem Extract Bio-Pesticide', category: 'Bio-Inputs', defaultUnit: 'litres' },
    { id: 'tricho-fung', name: 'Trichoderma Bio-Fungicide', category: 'Bio-Inputs', defaultUnit: 'sachets' },
    { id: 'pics-bags', name: 'Hermetic PICS Bags', category: 'Equipment', defaultUnit: 'bags' },
    { id: 'tractor-credit', name: 'Tractor Prep Voucher', category: 'Services', defaultUnit: 'bundles' },
];

export interface PlantingCalendarOption {
    id: string;
    state: string;
    code: string;
    title: string;
    season: string;
    tier1: string;
    tier2: string;
    recommendedSpacing: string;
}

export const PLANTING_CALENDAR_OPTIONS: PlantingCalendarOption[] = [
    // Kaduna
    {
        id: 'kad-opt1',
        state: 'Kaduna',
        code: 'Option 1',
        title: 'Kaduna Option 1: Soybean + Drop Maize -> Sesame Relay',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Sep): Soybean + Drop Maize (SAMMAZ 52)',
        tier2: 'Tier 2 (Sep-Dec): Sesame Relay into standing crop',
        recommendedSpacing: '75cm x 25cm'
    },
    {
        id: 'kad-opt2',
        state: 'Kaduna',
        code: 'Option 2',
        title: 'Kaduna Option 2: Groundnut + Drop Sorghum -> Cowpea Relay',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Sep): Groundnut + Drop Sorghum (SAMSORG 45)',
        tier2: 'Tier 2 (Sep-Nov): Cowpea Relay (SAMPEA 11)',
        recommendedSpacing: '60cm x 20cm'
    },
    {
        id: 'kad-mono-maize',
        state: 'Kaduna',
        code: 'Monocrop',
        title: 'Kaduna: Maize Monocrop (SAMMAZ 52 / TELA High-Yield)',
        season: 'Main Season 2026',
        tier1: 'Tier 1 (May-Aug): High-Yield Field Maize Monocrop',
        tier2: 'Post-Harvest Organic Mulching & Residue Retention',
        recommendedSpacing: '75cm x 25cm'
    },
    {
        id: 'kad-mono-rice',
        state: 'Kaduna',
        code: 'Lowland',
        title: 'Kaduna: Rice Lowland (FARO 44 Paddy)',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Oct): Lowland Irrigated / Basin Rice',
        tier2: 'Off-Season Vegetable Rotation',
        recommendedSpacing: '25cm x 25cm'
    },
    // Abuja (FCT)
    {
        id: 'abj-opt1',
        state: 'Abuja (FCT)',
        code: 'Option 1',
        title: 'Abuja Option 1: Groundnut + Drop Maize -> Sesame Relay',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (May-Aug): Groundnut + Drop Maize',
        tier2: 'Tier 2 (Aug-Nov): Sesame / Sorghum Relay',
        recommendedSpacing: '70cm x 25cm'
    },
    {
        id: 'abj-opt2',
        state: 'Abuja (FCT)',
        code: 'Relay',
        title: 'Abuja Option 2: Cassava (TME 419) + Legume Relay',
        season: 'Annual Season 2026',
        tier1: 'Tier 1 (Apr-Dec): High-Dry-Matter Cassava',
        tier2: 'Intercropped Legumes / Groundnut Soil Enrichment',
        recommendedSpacing: '1m x 1m'
    },
    // Adamawa
    {
        id: 'ada-opt1',
        state: 'Adamawa',
        code: 'Option 1',
        title: 'Adamawa Option 1: Egusi + Drop Corn -> Sesame / Cowpea Relay',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (May-Jul): Improved Egusi + Drop Corn',
        tier2: 'Tier 2 (Aug-Nov): Sesame / Cowpea Relay',
        recommendedSpacing: '75cm x 25cm'
    },
    {
        id: 'ada-opt2',
        state: 'Adamawa',
        code: 'Option 2',
        title: 'Adamawa Option 2: Groundnut -> Sesame Relay',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Aug): Groundnut Monoculture',
        tier2: 'Tier 2 (Aug-Nov): Sesame Relay Crop',
        recommendedSpacing: '60cm x 20cm'
    },
    {
        id: 'ada-opt3',
        state: 'Adamawa',
        code: 'Option 3',
        title: 'Adamawa Option 3: Soybean + Drop Corn (Single Season)',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Oct): Soybean + Drop Corn Full Cycle',
        tier2: 'Post-Harvest Living Mulch',
        recommendedSpacing: '75cm x 25cm'
    },
    // Kano
    {
        id: 'kan-opt1',
        state: 'Kano',
        code: 'Option 1',
        title: 'Kano Option 1: Sorghum + Drop Cowpea (Sudan Savanna Mix)',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Sep): Drought-Resistant Sorghum + Drop Cowpea',
        tier2: 'Tier 2 (Aug-Nov): Sesame Drought-Tolerant Relay',
        recommendedSpacing: '75cm x 25cm'
    },
    {
        id: 'kan-opt2',
        state: 'Kano',
        code: 'Option 2',
        title: 'Kano Option 2: Millet + Groundnut Intercrop',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Aug): Pearl Millet + Groundnut',
        tier2: 'Post-Harvest Stover Mulch & Organic Cover',
        recommendedSpacing: '60cm x 20cm'
    },
    {
        id: 'kan-opt3',
        state: 'Kano',
        code: 'Fadama',
        title: 'Kano Option 3: Fadama Irrigated Wheat & Tomato',
        season: 'Dry Season 2026-2027',
        tier1: 'Tier 3 (Nov-Mar): Irrigated Lowland Wheat + Tomato',
        tier2: 'Compost & Bio-Fertilizer Soil Enrichment',
        recommendedSpacing: '20cm x 15cm'
    },
    // Nassarawa
    {
        id: 'nas-opt1',
        state: 'Nassarawa',
        code: 'Option 1',
        title: 'Nassarawa Option 1: Sesame + Drop Corn Intercrop',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (May-Aug): Sesame + Drop Corn',
        tier2: 'Tier 2 (Aug-Nov): Cowpea Relay after Maize',
        recommendedSpacing: '75cm x 25cm'
    },
    {
        id: 'nas-opt2',
        state: 'Nassarawa',
        code: 'Option 2',
        title: 'Nassarawa Option 2: Yam + Maize Mound Intercrop',
        season: 'Annual Season 2026',
        tier1: 'Tier 1 (Apr-Nov): White Yam Mound System + Early Maize',
        tier2: 'Living Cover Crop & Organic Mulch Retention',
        recommendedSpacing: '1m x 1m'
    },
    // Benue
    {
        id: 'ben-opt1',
        state: 'Benue',
        code: 'Option 1',
        title: 'Benue Option 1: Soybean Monocrop (Food Basket Standard)',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Oct): High-Yield Soybean Monocrop',
        tier2: 'Tier 2 (Sep-Dec): Sesame Relay into Soybean Field',
        recommendedSpacing: '60cm x 20cm'
    },
    {
        id: 'ben-opt2',
        state: 'Benue',
        code: 'Option 2',
        title: 'Benue Option 2: Cassava + Maize Intercrop',
        season: 'Annual Season 2026',
        tier1: 'Tier 1 (Apr-Dec): High-Yield Cassava + Early Sweet Corn',
        tier2: 'Residual Moisture Legume Cover Crop',
        recommendedSpacing: '1m x 1m'
    },
    // Plateau
    {
        id: 'plt-opt1',
        state: 'Plateau',
        code: 'Option 1',
        title: 'Plateau Option 1: Irish Potato + Green Beans (Highland Specialty)',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Apr-Jul): High-Value Irish Potato + Bush Beans',
        tier2: 'Tier 2 (Jul-Oct): Second Season Highland Maize & Tomato',
        recommendedSpacing: '75cm x 30cm'
    },
    {
        id: 'plt-opt2',
        state: 'Plateau',
        code: 'Fadama',
        title: 'Plateau Option 2: Dry Season High-Value Vegetable Irrigation',
        season: 'Dry Season 2026-2027',
        tier1: 'Tier 3 (Nov-Feb): Irrigated Tomato, Carrot & Green Beans',
        tier2: 'Organic Compost Beds',
        recommendedSpacing: '50cm x 25cm'
    },
    // Niger
    {
        id: 'nig-opt1',
        state: 'Niger',
        code: 'Option 1',
        title: 'Niger Option 1: Lowland Paddy Rice (Bida Basin FARO 44)',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Oct): Irrigated Lowland Rice Paddy',
        tier2: 'Tier 2 (Oct-Dec): Residual Moisture Cowpea Relay',
        recommendedSpacing: '20cm x 20cm'
    },
    {
        id: 'nig-opt2',
        state: 'Niger',
        code: 'Option 2',
        title: 'Niger Option 2: Maize + Sorghum Savanna Intercrop',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Sep): Improved Maize + Drop Sorghum',
        tier2: 'Post-Harvest Living Mulch',
        recommendedSpacing: '75cm x 25cm'
    },
    // Bauchi
    {
        id: 'bau-opt1',
        state: 'Bauchi',
        code: 'Option 1',
        title: 'Bauchi Option 1: Groundnut + Millet Sahel Resilient Mix',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (Jun-Sep): Drought-Tolerant Groundnut + Millet',
        tier2: 'Tier 2 (Aug-Nov): Sesame Late Season Relay',
        recommendedSpacing: '60cm x 20cm'
    },
    // Taraba
    {
        id: 'tar-opt1',
        state: 'Taraba',
        code: 'Option 1',
        title: 'Taraba Option 1: Maize + Soybean High-Biomass Mix',
        season: 'Wet Season 2026',
        tier1: 'Tier 1 (May-Aug): High-Biomass Maize + Soybean',
        tier2: 'Tier 2 (Aug-Nov): Sesame Export Relay',
        recommendedSpacing: '75cm x 25cm'
    },
];

type ActivityMode = 'vcm_seasonal' | 'crop_general' | 'livestock';

export default function LogActivitiesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const type = (params.type as 'crop' | 'livestock') || 'crop';

    const [selectedSequenceStep, setSelectedSequenceStep] = useState<FarmingCycleStep | 'all'>('all');

    // VCM Seasonal State
    const [activityMode, setActivityMode] = useState<ActivityMode>('vcm_seasonal');
    const [selectedStage, setSelectedStage] = useState<SeasonalStage>('pre_season');
    const [selectedActivityId, setSelectedActivityId] = useState<ActivityId>('PS-01');
    const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>('completed');
    const [attemptReason, setAttemptReason] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit>('kg');

    // GPS & Validation
    const [gpsCoordinates, setGpsCoordinates] = useState<string | null>('8.4902° N, 4.5421° E');
    const [isCapturingGps, setIsCapturingGps] = useState(false);

    // Form inputs
    const [purposeOfVisit, setPurposeOfVisit] = useState<string | null>(null);
    const [landPrepType, setLandPrepType] = useState<string | null>(null);
    const [methodUsed, setMethodUsed] = useState<string | null>(null);
    const [cropType, setCropType] = useState('Maize');
    const [cropVariety, setCropVariety] = useState('SAMMAZ-15');
    const [plannedArea, setPlannedArea] = useState('2.5');
    const [quantityValue, setQuantityValue] = useState('');
    const [notes, setNotes] = useState('');
    const [step, setStep] = useState(1);
    const [evidenceImage, setEvidenceImage] = useState<string | null>(null);

    // Specialized Planting Verification State (ES-02 Specification)
    const [intercroppingCombo, setIntercroppingCombo] = useState('Monocropping (Single Crop)');
    const [plantingPattern, setPlantingPattern] = useState('75cm x 25cm (Ridge Row)');
    const [seedQtyUsed, setSeedQtyUsed] = useState('25');
    const [plantingRegenPractices, setPlantingRegenPractices] = useState<string[]>([
        'Zero/Minimum Tillage',
        'Mulching / Organic Cover Crop',
        'Compost / Organic Manure Pre-Planting'
    ]);

    // Specialized Germination Assessment State (ES-03 Specification)
    const [germinationRate, setGerminationRate] = useState('> 85% Excellent');
    const [cropEstablishment, setCropEstablishment] = useState('Strong Uniform Stand');
    const [cropPopulationDensity, setCropPopulationDensity] = useState('53,333 plants/ha (Maize Standard)');
    const [germinationRegenPractices, setGerminationRegenPractices] = useState<string[]>([
        'Gap-Filling with Bio-Treated Seed',
        'Thinning & Organic Weed Mulch',
        'Post-Germination Soil Aeration'
    ]);

    // Specialized Crop Growth Monitoring State (MS-01 / MS-02 Specification)
    const [weedStatus, setWeedStatus] = useState('Clean Field (No Weeds)');
    const [weedingMethod, setWeedingMethod] = useState('Manual Hoe & Mulch Cover');
    const [bioInputApplied, setBioInputApplied] = useState('Bio-Fertilizer (Liquid Organics)');
    const [cropHealthStatus, setCropHealthStatus] = useState('Healthy Vigor / Dark Green');
    const [cropGrowthRegenPractices, setCropGrowthRegenPractices] = useState<string[]>([
        'Integrated Pest Management (IPM)',
        'Organic Foliar Feed Spray',
        'Living Cover Crop Maintenance'
    ]);

    // Specialized Multi-Event Harvest & Yield Verification State (END-01/02 Spec)
    const [harvestEventNumber, setHarvestEventNumber] = useState('Harvest Event #1 (First Pick)');
    const [harvestDate, setHarvestDate] = useState('2026-08-15');
    const [eventHarvestQty, setEventHarvestQty] = useState('1,200');
    const [estimatedYieldPerHa, setEstimatedYieldPerHa] = useState('4.8 MT / Ha');
    const [harvestRegenPractices, setHarvestRegenPractices] = useState<string[]>([
        'Crop Residue Retention / Soil Mulch Re-integration',
        'Selective Picking / Zero-Waste Harvesting',
        'Zero-Chemical Eco Bag Storage (PICS)'
    ]);

    // New VCM Specific Form States for 17 activities
    const [cropPlanStateFilter, setCropPlanStateFilter] = useState<string>('All');
    const [intendedCropPlan, setIntendedCropPlan] = useState('Kaduna Option 1: Soybean + Drop Maize -> Sesame Relay');
    const [plannedCropArea, setPlannedCropArea] = useState('2.5');
    const [seedDemandKg, setSeedDemandKg] = useState('50');
    const [seedGapStatus, setSeedGapStatus] = useState('Seed Available (No Gap)');
    const [financeNaira, setFinanceNaira] = useState('150,000');
    const [financeInputsNeeded, setFinanceInputsNeeded] = useState<string[]>(['Fertilizer', 'Seeds']);
    const [plotAccessibility, setPlotAccessibility] = useState('Fully Accessible');
    const [plotCultivationStatus, setPlotCultivationStatus] = useState('Active Farming');
    const [landPrepMethod, setLandPrepMethod] = useState('Tractor Tillage');
    const [soilMoisture, setSoilMoisture] = useState('Optimal Moisture');
    const [bioInputDelivered, setBioInputDelivered] = useState('Organic Liquid Fertilizer');
    const [bioInputDeliveryStatus, setBioInputDeliveryStatus] = useState('Delivered & Confirmed');
    const [bioInputAppMethod, setBioInputAppMethod] = useState('Foliar Spraying');
    const [bioInputAppDate, setBioInputAppDate] = useState('2026-07-02');
    const [practicesObserved, setPracticesObserved] = useState<string[]>(['First weeding done', 'Thinning complete']);
    const [pestDensity, setPestDensity] = useState('Clean / No Pests');
    const [cropHealthRating, setCropHealthRating] = useState('Excellent vigor');
    const [riskWarningType, setRiskWarningType] = useState('None');
    const [expectedHarvestDate, setExpectedHarvestDate] = useState('2026-08-15');
    const [intendedStorageChannel, setIntendedStorageChannel] = useState('Hermetic PICS Bags');
    const [storageCompliance, setStorageCompliance] = useState('Dry & Well-Ventilated');
    const [storageBagsCount, setStorageBagsCount] = useState('30');
    const [aggregationHub, setAggregationHub] = useState('Kano Hub');
    const [aggregationTransport, setAggregationTransport] = useState('Small Truck');
    const [salesPricePerUnit, setSalesPricePerUnit] = useState('450');
    const [salesTransactionId, setSalesTransactionId] = useState('TXN-JUR-8839');

    // Custom Date Picker Modal State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeDatePickerField, setActiveDatePickerField] = useState<'landPrepStarted' | 'landPrepEnded' | 'plantingStarted' | 'bioInputApp' | 'expectedHarvest' | 'actualHarvest' | 'harvest' | null>(null);
    const [pickerYear, setPickerYear] = useState(2026);
    const [pickerMonth, setPickerMonth] = useState(4); // May (0-indexed)

    const formatPickerDate = (y: number, m: number, d: number) => {
        const mm = (m + 1).toString().padStart(2, '0');
        const dd = d.toString().padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    };

    const openDatePicker = (field: typeof activeDatePickerField, currentVal: string) => {
        setActiveDatePickerField(field);
        const parts = (currentVal || '').split('-');
        if (parts.length === 3) {
            setPickerYear(parseInt(parts[0], 10));
            setPickerMonth(parseInt(parts[1], 10) - 1);
        } else {
            const now = new Date();
            setPickerYear(now.getFullYear());
            setPickerMonth(now.getMonth());
        }
        setIsDatePickerOpen(true);
    };

    // Activity Timestamps & Descriptions
    const [landPrepStartedDate, setLandPrepStartedDate] = useState('2026-05-10');
    const [landPrepEndedDate, setLandPrepEndedDate] = useState('2026-05-15');
    const [plantingStartedDate, setPlantingStartedDate] = useState('2026-05-20');
    const [plantingDescription, setPlantingDescription] = useState('Planting completed under optimal moisture conditions.');
    const [harvestStartedDate, setHarvestStartedDate] = useState('2026-08-15');

    // PS-02 Dynamic Input Requirements & Gaps
    const [ps02SearchQuery, setPs02SearchQuery] = useState('');
    const [ps02SelectedItems, setPs02SelectedItems] = useState<{ id: string; name: string; qty: string; unit: string }[]>([
        { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', qty: '50', unit: 'kg' }
    ]);
    const [ps02AddingItem, setPs02AddingItem] = useState<{ id: string; name: string; category: string; defaultUnit: string } | null>(null);
    const [ps02AddingQty, setPs02AddingQty] = useState('');
    const [ps02AddingUnit, setPs02AddingUnit] = useState('kg');

    const togglePlantingRegenPractice = (p: string) => {
        if (plantingRegenPractices.includes(p)) {
            setPlantingRegenPractices(plantingRegenPractices.filter(item => item !== p));
        } else {
            setPlantingRegenPractices([...plantingRegenPractices, p]);
        }
    };

    const toggleGerminationRegenPractice = (p: string) => {
        if (germinationRegenPractices.includes(p)) {
            setGerminationRegenPractices(germinationRegenPractices.filter(item => item !== p));
        } else {
            setGerminationRegenPractices([...germinationRegenPractices, p]);
        }
    };

    const toggleCropGrowthRegenPractice = (p: string) => {
        if (cropGrowthRegenPractices.includes(p)) {
            setCropGrowthRegenPractices(cropGrowthRegenPractices.filter(item => item !== p));
        } else {
            setCropGrowthRegenPractices([...cropGrowthRegenPractices, p]);
        }
    };

    const toggleHarvestRegenPractice = (p: string) => {
        if (harvestRegenPractices.includes(p)) {
            setHarvestRegenPractices(harvestRegenPractices.filter(item => item !== p));
        } else {
            setHarvestRegenPractices([...harvestRegenPractices, p]);
        }
    };

    const [permission, requestPermission] = useCameraPermissions();

    React.useEffect(() => {
        if (params.activityId) {
            const actId = params.activityId as ActivityId;
            setSelectedActivityId(actId);
            
            // Auto-align stage
            const spec = VCM_ACTIVITY_DICTIONARY[actId];
            if (spec) {
                setSelectedStage(spec.stage);
            }
            
            // Auto-align sequence step
            const matchingCycleStep = FARMING_CYCLE_SEQUENCE.find(s => s.activityIds.includes(actId));
            if (matchingCycleStep) {
                setSelectedSequenceStep(matchingCycleStep.id);
            }

            // Hydrate previously recorded inputs if they exist
            const recorded = RECORDED_INPUTS_DB[actId];
            if (recorded) {
                if (recorded.quantity) setQuantityValue(recorded.quantity);
                if (recorded.unit) setSelectedUnit(recorded.unit as any);
                if (recorded.attemptStatus) setAttemptStatus(recorded.attemptStatus);
                if (recorded.reason) setAttemptReason(recorded.reason);
                if (recorded.variety) setCropVariety(recorded.variety);
                if (recorded.intercrop) setIntercroppingCombo(recorded.intercrop);
                if (recorded.spacing) setPlantingPattern(recorded.spacing);
                if (recorded.seedQty) setSeedQtyUsed(recorded.seedQty);
                if (recorded.germRate) setGerminationRate(recorded.germRate);
                if (recorded.vigor) setCropEstablishment(recorded.vigor);
                if (recorded.density) setCropPopulationDensity(recorded.density);
                if (recorded.weed) setWeedStatus(recorded.weed);
                if (recorded.weedMethod) setWeedingMethod(recorded.weedMethod);
                if (recorded.bioInput) setBioInputApplied(recorded.bioInput);
                if (recorded.health) setCropHealthStatus(recorded.health);
                if (recorded.gps) setGpsCoordinates(recorded.gps);
                if (recorded.evidencePhoto) setEvidenceImage(recorded.evidencePhoto);
                if (recorded.notes) setNotes(recorded.notes);

                // Hydrate detailed activity inputs
                if (recorded.intendedCropPlan) setIntendedCropPlan(recorded.intendedCropPlan);
                if (recorded.plannedCropArea) setPlannedCropArea(recorded.plannedCropArea);
                if (recorded.seedDemandKg) setSeedDemandKg(recorded.seedDemandKg);
                if (recorded.seedGapStatus) setSeedGapStatus(recorded.seedGapStatus);
                if (recorded.financeNaira) setFinanceNaira(recorded.financeNaira);
                if (recorded.financeInputsNeeded) setFinanceInputsNeeded(recorded.financeInputsNeeded);
                if (recorded.plotAccessibility) setPlotAccessibility(recorded.plotAccessibility);
                if (recorded.plotCultivationStatus) setPlotCultivationStatus(recorded.plotCultivationStatus);
                if (recorded.landPrepMethod) setLandPrepMethod(recorded.landPrepMethod);
                if (recorded.soilMoisture) setSoilMoisture(recorded.soilMoisture);
                if (recorded.bioInputDelivered) setBioInputDelivered(recorded.bioInputDelivered);
                if (recorded.bioInputDeliveryStatus) setBioInputDeliveryStatus(recorded.bioInputDeliveryStatus);
                if (recorded.bioInputAppMethod) setBioInputAppMethod(recorded.bioInputAppMethod);
                if (recorded.bioInputAppDate) setBioInputAppDate(recorded.bioInputAppDate);
                if (recorded.practicesObserved) setPracticesObserved(recorded.practicesObserved);
                if (recorded.pestDensity) setPestDensity(recorded.pestDensity);
                if (recorded.cropHealthRating) setCropHealthRating(recorded.cropHealthRating);
                if (recorded.riskWarningType) setRiskWarningType(recorded.riskWarningType);
                if (recorded.expectedHarvestDate) setExpectedHarvestDate(recorded.expectedHarvestDate);
                if (recorded.intendedStorageChannel) setIntendedStorageChannel(recorded.intendedStorageChannel);
                if (recorded.storageCompliance) setStorageCompliance(recorded.storageCompliance);
                if (recorded.storageBagsCount) setStorageBagsCount(recorded.storageBagsCount);
                if (recorded.aggregationHub) setAggregationHub(recorded.aggregationHub);
                if (recorded.aggregationTransport) setAggregationTransport(recorded.aggregationTransport);
                if (recorded.salesPricePerUnit) setSalesPricePerUnit(recorded.salesPricePerUnit);
                if (recorded.salesTransactionId) setSalesTransactionId(recorded.salesTransactionId);
                if (recorded.ps02SelectedItems) setPs02SelectedItems(recorded.ps02SelectedItems);
                if (recorded.landPrepStartedDate) setLandPrepStartedDate(recorded.landPrepStartedDate);
                if (recorded.landPrepEndedDate) setLandPrepEndedDate(recorded.landPrepEndedDate);
                if (recorded.plantingStartedDate) setPlantingStartedDate(recorded.plantingStartedDate);
                if (recorded.plantingDescription) setPlantingDescription(recorded.plantingDescription);
                if (recorded.harvestStartedDate) setHarvestStartedDate(recorded.harvestStartedDate);
            } else {
                // Reset to empty / defaults for recording new activities
                setQuantityValue('');
                setSelectedUnit('kg');
                setAttemptStatus('completed');
                setAttemptReason('');
                setCropVariety('SAMMAZ-15');
                setIntercroppingCombo('Monocropping (Single Crop)');
                setPlantingPattern('75cm x 25cm (Ridge Row)');
                setSeedQtyUsed('');
                setGerminationRate('> 85% Excellent');
                setCropEstablishment('Strong Uniform Stand');
                setCropPopulationDensity('53,333 plants/ha (Maize Standard)');
                setWeedStatus('Clean Field (No Weeds)');
                setWeedingMethod('Manual Hoe & Mulch Cover');
                setBioInputApplied('Bio-Input (Neem Extract)');
                setCropHealthStatus('Healthy Vigor / Dark Green');
                setGpsCoordinates(spec && spec.gpsRequired ? '8.4902° N, 4.5421° E' : null);
                setEvidenceImage(null);
                setNotes('');

                // Reset detailed activity inputs
                setIntendedCropPlan('Option 1: Egusi + Drop Corn → Sesame / Cowpea Relay');
                setPlannedCropArea('2.5');
                setSeedDemandKg('50');
                setSeedGapStatus('Seed Available (No Gap)');
                setFinanceNaira('150,000');
                setFinanceInputsNeeded(['Fertilizer', 'Seeds']);
                setPlotAccessibility('Fully Accessible');
                setPlotCultivationStatus('Active Farming');
                setLandPrepMethod('Tractor Tillage');
                setSoilMoisture('Optimal Moisture');
                setBioInputDelivered('Organic Liquid Fertilizer');
                setBioInputDeliveryStatus('Delivered & Confirmed');
                setBioInputAppMethod('Foliar Spraying');
                setBioInputAppDate('2026-07-02');
                setPracticesObserved(['First weeding done', 'Thinning complete']);
                setPestDensity('Clean / No Pests');
                setCropHealthRating('Excellent vigor');
                setRiskWarningType('None');
                setExpectedHarvestDate('2026-08-15');
                setIntendedStorageChannel('Hermetic PICS Bags');
                setStorageCompliance('Dry & Well-Ventilated');
                setStorageBagsCount('30');
                setAggregationHub('Kano Hub');
                setAggregationTransport('Small Truck');
                setSalesPricePerUnit('450');
                setSalesTransactionId('');
                setLandPrepStartedDate('2026-05-10');
                setLandPrepEndedDate('2026-05-15');
                setPlantingStartedDate('2026-05-20');
                setPlantingDescription('Planting completed under optimal moisture conditions.');
                setHarvestStartedDate('2026-08-15');
                setPs02SelectedItems([
                    { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', qty: '50', unit: 'kg' }
                ]);
                setPs02SearchQuery('');
                setPs02AddingItem(null);
            }
        }
    }, [params.activityId]);

    React.useEffect(() => {
        if (params.stage && !params.activityId) {
            const stg = params.stage as SeasonalStage;
            setSelectedStage(stg);
            setActivityMode('vcm_seasonal');
            
            // Auto-align first activity of that stage
            const firstSpec = Object.values(VCM_ACTIVITY_DICTIONARY).find((a) => a.stage === stg);
            if (firstSpec) {
                setSelectedActivityId(firstSpec.id);
            }
        }
    }, [params.stage, params.activityId]);



    const activeSpec = VCM_ACTIVITY_DICTIONARY[selectedActivityId];

    const pickImage = async () => {
        Alert.alert(
            'Photo Verification',
            'Capture live photo from field or select from gallery:',
            [
                {
                    text: 'Take Photo (Camera)',
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('Permission Denied', 'Camera permission is required to capture verification evidence.');
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                allowsEditing: true,
                                aspect: [4, 3],
                                quality: 0.8,
                            });
                            if (!result.canceled && result.assets?.[0]?.uri) {
                                setEvidenceImage(result.assets[0].uri);
                            }
                        } catch (e) {
                            console.error('Camera error:', e);
                        }
                    },
                },
                {
                    text: 'Choose from Gallery',
                    onPress: async () => {
                        try {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                allowsEditing: true,
                                aspect: [4, 3],
                                quality: 0.8,
                            });
                            if (!result.canceled && result.assets?.[0]?.uri) {
                                setEvidenceImage(result.assets[0].uri);
                            }
                        } catch (e) {
                            console.error('Gallery error:', e);
                        }
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleCaptureGps = async () => {
        setIsCapturingGps(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const latStr = `${Math.abs(loc.coords.latitude).toFixed(4)}° ${loc.coords.latitude >= 0 ? 'N' : 'S'}`;
                const lngStr = `${Math.abs(loc.coords.longitude).toFixed(4)}° ${loc.coords.longitude >= 0 ? 'E' : 'W'}`;
                const accStr = loc.coords.accuracy ? ` (±${loc.coords.accuracy.toFixed(1)}m)` : '';
                setGpsCoordinates(`${latStr}, ${lngStr}${accStr}`);
                setIsCapturingGps(false);
                return;
            }
        } catch (e) {
            console.log('Location error:', e);
        }
        // Fallback simulation if permission or location unavailable
        setTimeout(() => {
            setGpsCoordinates('11.0854° N, 7.7199° E (±3.5m)');
            setIsCapturingGps(false);
        }, 800);
    };

    const handleSave = async () => {
        if (activityMode === 'vcm_seasonal') {
            // Check GPS guard
            if (activeSpec.gpsRequired && !gpsCoordinates && attemptStatus === 'completed') {
                Alert.alert('GPS Required', 'SCL specification requires GPS capture before submitting farm visit activities.');
                return;
            }

            // Check Attempt reason guard
            const statusConfig = ATTEMPT_STATUS_CONFIGS[attemptStatus];
            if (statusConfig.requiresReason && !attemptReason.trim()) {
                Alert.alert('Reason Required', `Please state the reason for status: "${statusConfig.label}".`);
                return;
            }

            const isEditMode = !!(selectedActivityId && RECORDED_INPUTS_DB[selectedActivityId]);

            const currentInputs = {
                intendedCropPlan,
                plannedCropArea,
                seedDemandKg,
                seedGapStatus,
                ps02SelectedItems, // save dynamic gaps
                financeNaira,
                financeInputsNeeded,
                plotAccessibility,
                plotCultivationStatus,
                landPrepMethod,
                soilMoisture,
                bioInputDelivered,
                bioInputDeliveryStatus,
                bioInputAppMethod,
                bioInputAppDate,
                practicesObserved,
                pestDensity,
                cropHealthRating,
                riskWarningType,
                expectedHarvestDate,
                intendedStorageChannel,
                storageCompliance,
                storageBagsCount,
                aggregationHub,
                aggregationTransport,
                salesPricePerUnit,
                salesTransactionId,
                landPrepStartedDate,
                landPrepEndedDate,
                plantingStartedDate,
                plantingDescription,
                harvestStartedDate,
            };

            // Save to memory cache
            RECORDED_INPUTS_DB[selectedActivityId] = {
                ...RECORDED_INPUTS_DB[selectedActivityId],
                attemptStatus,
                reason: attemptReason,
                notes: notes || undefined,
                gps: gpsCoordinates || undefined,
                evidencePhoto: evidenceImage || undefined,
                ...currentInputs,
            };

            // Save to persistent storage and sync with farmer record
            const targetFarmerId = (params.farmerIdParam as string) || (params.farmerId as string) || '1';
            const record: CompletedActivityRecord = {
                activityId: selectedActivityId,
                status: attemptStatus,
                date: new Date().toISOString().split('T')[0],
                pointsEarned: statusConfig.countsForPayment ? activeSpec.points : 0,
                notes: notes || undefined,
                gps: gpsCoordinates || undefined,
                photo: evidenceImage || undefined,
                inputs: currentInputs,
            };

            let progressionInfo: { nextActivityId: ActivityId | null; nextStageId: SeasonalStage | null; nextStageLabel: string } = {
                nextActivityId: null,
                nextStageId: null,
                nextStageLabel: 'Next Stage',
            };

            try {
                progressionInfo = await vcmActivityService.saveFarmerActivity(targetFarmerId, record);
            } catch (err) {
                console.warn('Activity save sync error:', err);
            }

            const pointsEarned = statusConfig.countsForPayment ? activeSpec.points : 0;
            const nextUnlockMsg = progressionInfo.nextActivityId
                ? `\n\n🎉 Unlocked next activity: ${progressionInfo.nextActivityId} (${progressionInfo.nextStageLabel})`
                : '';

            Alert.alert(
                isEditMode ? 'VCM Activity Updated' : 'VCM Activity Recorded',
                isEditMode 
                    ? `The logged details for activity ${selectedActivityId} have been updated successfully.`
                    : `Activity ${selectedActivityId} saved (${statusConfig.label}). Earned +${pointsEarned} points toward VCM Fee.${nextUnlockMsg}`,
                [{
                    text: 'OK',
                    onPress: () => {
                        const targetStageId = progressionInfo.nextStageId || (params.stage as SeasonalStage) || 'pre_season';
                        if (params.stage) {
                            router.replace({
                                pathname: '/(agent)/stageDetails',
                                params: {
                                    stageId: targetStageId,
                                    farmerName: params.farmerName,
                                    farmerId: params.farmerId,
                                    farmerIdParam: params.farmerIdParam,
                                    ts: Date.now().toString(),
                                }
                            });
                        } else if (params.farmerIdParam) {
                            router.replace({
                                pathname: '/(agent)/farmerDetails',
                                params: { id: params.farmerIdParam, ts: Date.now().toString() }
                            });
                        } else {
                            router.replace('/(agent)/farmers');
                        }
                    }
                }]
            );
            return;
        }

        if (params.stage) {
            router.replace({
                pathname: '/(agent)/stageDetails',
                params: {
                    stageId: params.stage,
                    farmerName: params.farmerName,
                    farmerId: params.farmerId,
                    farmerIdParam: params.farmerIdParam
                }
            });
        } else if (params.farmerIdParam) {
            router.replace({
                pathname: '/(agent)/farmerDetails',
                params: { id: params.farmerIdParam }
            });
        } else {
            router.replace('/(agent)/farmers');
        }
    };

    const { colors, isDarkMode } = useTheme();

    if (!permission) {
        return <View />;
    }
    if (!permission.granted) {
        requestPermission();
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colors.statusBarStyle} hidden={false} />

            <CustomBackNavBar 
                title={params.stage 
                    ? `Log ${SEASONAL_STAGES.find(s => s.id === params.stage)?.label || ''} Activities` 
                    : "Log Activities (VCM Spec)"
                } 
                onBackPress={() => {
                    if (params.stage) {
                        router.replace({
                            pathname: '/(agent)/stageDetails',
                            params: {
                                stageId: params.stage,
                                farmerName: params.farmerName,
                                farmerId: params.farmerId,
                                farmerIdParam: params.farmerIdParam
                            }
                        });
                    } else if (params.farmerIdParam) {
                        router.replace({
                            pathname: '/(agent)/farmerDetails',
                            params: { id: params.farmerIdParam }
                        });
                    } else {
                        router.replace('/(agent)/farmers');
                    }
                }} 
            />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                <Image source={require('../../assets/images/backgroundGradient.png')} style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} contentFit="cover" />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Header Card */}
                    <View style={[styles.subplotCard, { backgroundColor: colors.card, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                        <View style={styles.subplotHeader}>
                            <Text style={[styles.subplotName, { color: colors.text }]}>Plot #VCM-PLOT-04</Text>
                            <Text style={[styles.subplotSize, { color: colors.textSecondary }]}>2.5 ha • Maize</Text>
                        </View>
                        <Text style={[styles.subplotMeta, { color: colors.textSecondary }]}>Assigned Farmer: Ibrahim Musa (MTG-02)</Text>
                    </View>

                    {/* Mode Selector */}
                    {!params.stage && (
                        <View style={styles.modeContainer}>
                            <TouchableOpacity
                                style={[styles.modeTab, activityMode === 'vcm_seasonal' && { backgroundColor: colors.primary }]}
                                onPress={() => setActivityMode('vcm_seasonal')}
                            >
                                <Text style={[styles.modeTabText, { color: activityMode === 'vcm_seasonal' ? '#FFF' : colors.textSecondary }]}>
                                    SCL VCM Spec (17 Activity IDs)
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modeTab, activityMode === 'crop_general' && { backgroundColor: colors.primary }]}
                                onPress={() => setActivityMode('crop_general')}
                            >
                                <Text style={[styles.modeTabText, { color: activityMode === 'crop_general' ? '#FFF' : colors.textSecondary }]}>
                                    General Log
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activityMode === 'vcm_seasonal' ? (
                        <View style={[styles.whiteContainer, { backgroundColor: colors.card }]}>
                            {!params.stage && (
                                <>
                                    {/* 6-Step Farming Activity Cycle Header */}
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>1. Farming Activity Cycle Step</Text>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
                                        Track dynamic seasonal data across the 6 core activity sequence steps:
                                    </Text>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                        <TouchableOpacity
                                            style={[
                                                styles.stagePill,
                                                {
                                                    backgroundColor: selectedSequenceStep === 'all' ? colors.primary : isDarkMode ? '#1E293B' : '#F1F5F9',
                                                },
                                            ]}
                                            onPress={() => setSelectedSequenceStep('all')}
                                        >
                                            <Text style={[styles.stagePillText, { color: selectedSequenceStep === 'all' ? '#FFF' : colors.text }]}>
                                                All 6 Steps
                                            </Text>
                                        </TouchableOpacity>

                                        {FARMING_CYCLE_SEQUENCE.map((step) => {
                                            const isSelected = selectedSequenceStep === step.id;
                                            return (
                                                <TouchableOpacity
                                                    key={step.id}
                                                    style={[
                                                        styles.stagePill,
                                                        {
                                                            backgroundColor: isSelected ? colors.primary : isDarkMode ? '#1E293B' : '#F1F5F9',
                                                        },
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedSequenceStep(step.id);
                                                        if (step.activityIds.length > 0) {
                                                            setSelectedActivityId(step.activityIds[0]);
                                                        }
                                                    }}
                                                >
                                                    <Text style={[styles.stagePillText, { color: isSelected ? '#FFF' : colors.text }]}>
                                                        {step.title}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* Seasonal Stage Selector */}
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>2. Select Seasonal Stage</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
                                        {SEASONAL_STAGES.map((stg) => {
                                            const isSelected = selectedStage === stg.id;
                                            return (
                                                <TouchableOpacity
                                                    key={stg.id}
                                                    style={[
                                                        styles.stagePill,
                                                        {
                                                            backgroundColor: isSelected ? colors.primary : isDarkMode ? '#1E293B' : '#F1F5F9',
                                                        },
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedStage(stg.id);
                                                        const firstSpec = Object.values(VCM_ACTIVITY_DICTIONARY).find((a) => a.stage === stg.id);
                                                        if (firstSpec) setSelectedActivityId(firstSpec.id);
                                                    }}
                                                >
                                                    <Text style={[styles.stagePillText, { color: isSelected ? '#FFF' : colors.text }]}>
                                                        {stg.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </>
                            )}

                            {/* 3. SCL Activity ID Dropdown / Selector */}
                            {params.activityId ? (
                                <View style={[
                                    styles.activitySpecBox,
                                    {
                                        backgroundColor: colors.primary + '08',
                                        borderColor: colors.primary,
                                        marginTop: 10,
                                        marginBottom: 16,
                                    },
                                ]}>
                                    <View style={styles.specHeaderRow}>
                                        <View style={styles.specTitleGroup}>
                                            <Text style={[styles.specIdBadge, { color: colors.primary, fontSize: 14 }]}>{activeSpec.id}</Text>
                                            <Text style={[styles.specTitle, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>{activeSpec.title}</Text>
                                        </View>
                                        <View style={[styles.pointsBadge, { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4 }]}>
                                            <Text style={styles.pointsBadgeText}>+{activeSpec.points} pts</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.specObjective, { color: colors.textSecondary, marginTop: 6, fontSize: 12, lineHeight: 16 }]}>
                                        {activeSpec.objective}
                                    </Text>
                                    <Text style={{ fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, marginTop: 4 }}>
                                        Indicator: {activeSpec.managementIndicator}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: params.stage ? 4 : 14 }]}>
                                        {params.stage 
                                            ? `Select ${SEASONAL_STAGES.find(s => s.id === params.stage)?.label || ''} Activity to Record` 
                                            : "3. Select Activity ID to Record"
                                        }
                                    </Text>
                                    <View style={styles.activityPickerList}>
                                        {Object.values(VCM_ACTIVITY_DICTIONARY)
                                            .filter((act) => {
                                                if (selectedSequenceStep === 'all') return act.stage === selectedStage;
                                                const matchingCycleStep = FARMING_CYCLE_SEQUENCE.find(s => s.id === selectedSequenceStep);
                                                return matchingCycleStep ? matchingCycleStep.activityIds.includes(act.id) : true;
                                            })
                                            .map((act) => {
                                                const isSelected = selectedActivityId === act.id;
                                                return (
                                                    <TouchableOpacity
                                                        key={act.id}
                                                        style={[
                                                            styles.activitySpecBox,
                                                            {
                                                                backgroundColor: isSelected ? colors.primary + '14' : isDarkMode ? '#0F172A' : '#F8FAFC',
                                                                borderColor: isSelected ? colors.primary : isDarkMode ? '#1E293B' : '#E2E8F0',
                                                            },
                                                        ]}
                                                        onPress={() => setSelectedActivityId(act.id)}
                                                    >
                                                        <View style={styles.specHeaderRow}>
                                                            <View style={styles.specTitleGroup}>
                                                                <Text style={[styles.specIdBadge, { color: colors.primary }]}>{act.id}</Text>
                                                                <Text style={[styles.specTitle, { color: colors.text }]}>{act.title}</Text>
                                                            </View>
                                                            <View style={[styles.pointsBadge, { backgroundColor: colors.primary }]}>
                                                                <Text style={styles.pointsBadgeText}>+{act.points} pts</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={[styles.specObjective, { color: colors.textSecondary }]}>{act.objective}</Text>

                                                        <View style={styles.specPillRow}>
                                                            {act.gpsRequired && (
                                                                <View style={styles.reqPill}>
                                                                    <Feather name="map-pin" size={10} color="#0E6F6A" />
                                                                    <Text style={styles.reqPillText}>GPS Mandatory</Text>
                                                                </View>
                                                            )}
                                                            {act.photoRecommended && (
                                                                <View style={styles.reqPill}>
                                                                    <Feather name="camera" size={10} color="#0E6F6A" />
                                                                    <Text style={styles.reqPillText}>Photo Recommended</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                    </View>
                                </>
                            )}

                                                        {/* PS-01 Crop Plan Confirmation */}
                            {/* PS-01 Crop Plan Confirmation */}
                            {selectedActivityId === 'PS-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Crop Plan Confirmation (Planting Calendar)</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginBottom: 6 }]}>• Select Cropping System from Approved Planting Calendar</Text>
                                    
                                    {/* State Filter Tabs */}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                                        {['All', 'Kaduna', 'Abuja (FCT)', 'Adamawa', 'Kano', 'Nassarawa', 'Benue', 'Plateau', 'Niger', 'Bauchi', 'Taraba'].map(st => (
                                            <TouchableOpacity
                                                key={st}
                                                style={[
                                                    styles.chipPill,
                                                    cropPlanStateFilter === st && styles.chipPillActive,
                                                    { height: 32, paddingHorizontal: 12 }
                                                ]}
                                                onPress={() => setCropPlanStateFilter(st)}
                                            >
                                                <Text style={[styles.chipText, cropPlanStateFilter === st && styles.chipTextActive, { fontSize: 11 }]}>{st}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <View style={{ gap: 8, marginBottom: 12 }}>
                                        {PLANTING_CALENDAR_OPTIONS
                                            .filter(cr => cropPlanStateFilter === 'All' || cr.state === cropPlanStateFilter)
                                            .map(cr => {
                                                const active = intendedCropPlan === cr.title;
                                                return (
                                                    <TouchableOpacity 
                                                        key={cr.id} 
                                                        style={[
                                                            styles.chipPill, 
                                                            active && styles.chipPillActive,
                                                            { 
                                                                width: '100%', 
                                                                flexDirection: 'column',
                                                                alignItems: 'flex-start', 
                                                                paddingVertical: 10, 
                                                                paddingHorizontal: 12,
                                                                borderRadius: 10,
                                                                height: 'auto',
                                                                borderWidth: 1,
                                                                borderColor: active ? colors.primary : (isDarkMode ? '#334155' : '#CBD5E1')
                                                            }
                                                        ]} 
                                                        onPress={() => setIntendedCropPlan(cr.title)}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 4 }}>
                                                            <View style={[styles.radioOuter, { borderColor: active ? '#FFF' : colors.textMuted, marginRight: 8, width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' }]}>
                                                                {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />}
                                                            </View>
                                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                                <View style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : (isDarkMode ? '#334155' : '#E2E8F0'), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                    <Text style={{ fontSize: 9, fontWeight: '700', color: active ? '#FFF' : colors.primary }}>{cr.state}</Text>
                                                                </View>
                                                                <Text style={[styles.chipText, active && styles.chipTextActive, { fontSize: 12, fontWeight: '700', flex: 1 }]}>{cr.title}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={{ paddingLeft: 24, gap: 2 }}>
                                                            <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.9)' : colors.textSecondary }}>• {cr.tier1}</Text>
                                                            <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.9)' : colors.textSecondary }}>• {cr.tier2}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                                        <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Planned Cultivation Area Size (Hectares)</Text>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Mapped Area: 2.5 ha</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 2.5"
                                        value={plannedCropArea}
                                        onChangeText={setPlannedCropArea}
                                        keyboardType="numeric"
                                    />

                                    {/* Action button to Map New Subplot Area / Piece of Land */}
                                    <TouchableOpacity 
                                        style={{ 
                                            flexDirection: 'row', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: 6, 
                                            marginTop: 10, 
                                            paddingVertical: 10, 
                                            borderWidth: 1.5, 
                                            borderColor: colors.primary, 
                                            borderRadius: 10,
                                            borderStyle: 'dashed',
                                            backgroundColor: isDarkMode ? 'rgba(14, 111, 106, 0.05)' : '#F0FDF4'
                                        }}
                                        onPress={() => {
                                            Alert.alert(
                                                "Map New Subplot Area", 
                                                "Open farm mapping flow to add a piece of land elsewhere? This will navigate to the subplot registration board.",
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    { text: "Continue", onPress: () => router.push({ pathname: '/(agent)/addSubplot', params: { referrer: '/(agent)/logActivities', farmerIdParam: params.farmerIdParam, activityId: selectedActivityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } }) }
                                                ]
                                            );
                                        }}
                                    >
                                        <Feather name="map" size={14} color={colors.primary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                            + Map New Subplot / Piece of Land
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                                                        {/* PS-02 Seed Gaps & Input Requirements */}
                            {selectedActivityId === 'PS-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Input Demand & Seed Requirements</Text>
                                    
                                    {/* 1. Search Box */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginBottom: 4 }]}>• Search for Input Needs (Seeds, Bio-Inputs, etc.)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 8 }}>
                                        <Feather name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                                        <TextInput
                                            style={{ flex: 1, color: colors.text, fontSize: 13, height: '100%', padding: 0 }}
                                            placeholder="Type to search (e.g. maize, bio-input...)"
                                            placeholderTextColor={colors.textMuted}
                                            value={ps02SearchQuery}
                                            onChangeText={setPs02SearchQuery}
                                        />
                                        {ps02SearchQuery.length > 0 && (
                                            <TouchableOpacity onPress={() => setPs02SearchQuery('')}>
                                                <Feather name="x" size={16} color={colors.textSecondary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* 2. Search Results list */}
                                    {ps02SearchQuery.trim().length > 0 && (
                                        <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: 10, padding: 8, gap: 6, marginBottom: 12 }}>
                                            {PS02_CATALOG.filter(item => 
                                                item.name.toLowerCase().includes(ps02SearchQuery.toLowerCase()) ||
                                                item.category.toLowerCase().includes(ps02SearchQuery.toLowerCase())
                                            ).slice(0, 4).map(item => (
                                                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }}>
                                                    <View style={{ flex: 1, marginRight: 8 }}>
                                                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{item.name}</Text>
                                                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Category: {item.category}</Text>
                                                    </View>
                                                    <TouchableOpacity 
                                                        style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                                                        onPress={() => {
                                                            setPs02AddingItem(item);
                                                            setPs02AddingQty('');
                                                            setPs02AddingUnit(item.defaultUnit);
                                                        }}
                                                    >
                                                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>+ Select</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                            {PS02_CATALOG.filter(item => 
                                                item.name.toLowerCase().includes(ps02SearchQuery.toLowerCase()) ||
                                                item.category.toLowerCase().includes(ps02SearchQuery.toLowerCase())
                                            ).length === 0 && (
                                                <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', fontStyle: 'italic', paddingVertical: 4 }}>No matching inputs found.</Text>
                                            )}
                                        </View>
                                    )}

                                    {/* 3. Add Item Configuration Row */}
                                    {ps02AddingItem && (
                                        <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.primary + '33', marginBottom: 12 }}>
                                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                                                Adding: {ps02AddingItem.name}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {/* Quantity Input */}
                                                <View style={{ flex: 1.5 }}>
                                                    <TextInput
                                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, height: 38, paddingHorizontal: 8, fontSize: 12 }]}
                                                        placeholder="Qty (e.g. 50)"
                                                        placeholderTextColor={colors.textMuted}
                                                        value={ps02AddingQty}
                                                        onChangeText={setPs02AddingQty}
                                                        keyboardType="numeric"
                                                    />
                                                </View>

                                                {/* Metric/Unit Selector */}
                                                <View style={{ flex: 2, flexDirection: 'row', backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 8, height: 38, padding: 2, gap: 2 }}>
                                                    {['kg', 'litres', 'bags', 'sachets', 'bundles'].map(u => {
                                                        const selected = ps02AddingUnit === u;
                                                        return (
                                                            <TouchableOpacity 
                                                                key={u} 
                                                                style={{ 
                                                                    flex: 1,
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    borderRadius: 6,
                                                                    backgroundColor: selected ? colors.primary : 'transparent'
                                                                }}
                                                                onPress={() => setPs02AddingUnit(u)}
                                                            >
                                                                <Text style={{ color: selected ? '#FFF' : colors.textSecondary, fontSize: 9, fontWeight: '700' }}>
                                                                    {u}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>

                                                {/* Add Button */}
                                                <TouchableOpacity 
                                                    style={{ backgroundColor: colors.primary, height: 38, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                                                    onPress={() => {
                                                        if (!ps02AddingQty.trim() || isNaN(parseFloat(ps02AddingQty))) {
                                                            Alert.alert("Invalid Quantity", "Please enter a valid numeric quantity.");
                                                            return;
                                                        }
                                                        const exists = ps02SelectedItems.some(i => i.id === ps02AddingItem.id);
                                                        if (exists) {
                                                            setPs02SelectedItems(ps02SelectedItems.map(i => 
                                                                i.id === ps02AddingItem.id ? { ...i, qty: ps02AddingQty, unit: ps02AddingUnit } : i
                                                            ));
                                                        } else {
                                                            setPs02SelectedItems([...ps02SelectedItems, {
                                                                id: ps02AddingItem.id,
                                                                name: ps02AddingItem.name,
                                                                qty: ps02AddingQty,
                                                                unit: ps02AddingUnit
                                                            }]);
                                                        }
                                                        setPs02AddingItem(null);
                                                        setPs02SearchQuery('');
                                                    }}
                                                >
                                                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Add</Text>
                                                </TouchableOpacity>

                                                {/* Cancel Button */}
                                                <TouchableOpacity 
                                                    style={{ borderColor: colors.border, borderWidth: 1, height: 38, width: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inputBackground }}
                                                    onPress={() => setPs02AddingItem(null)}
                                                >
                                                    <Feather name="x" size={14} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}

                                    {/* 4. Selected Inputs Gaps List */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8, marginBottom: 6, fontWeight: '700' }]}>• Registered Input Gaps & Requirements</Text>
                                    <View style={{ gap: 8 }}>
                                        {ps02SelectedItems.map((item, idx) => {
                                            const cat = PS02_CATALOG.find(c => c.id === item.id)?.category || 'Input';
                                            return (
                                                <View key={item.id + '_' + idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }}>
                                                    <View style={{ flex: 1, marginRight: 8 }}>
                                                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{item.name}</Text>
                                                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Category: {cat} • Quantity: <Text style={{ fontWeight: '700', color: colors.primary }}>{item.qty} {item.unit}</Text></Text>
                                                    </View>
                                                    <TouchableOpacity 
                                                        style={{ padding: 6 }} 
                                                        onPress={() => {
                                                            setPs02SelectedItems(ps02SelectedItems.filter(i => i.id !== item.id));
                                                        }}
                                                    >
                                                        <Feather name="trash-2" size={15} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                        {ps02SelectedItems.length === 0 && (
                                            <View style={{ padding: 16, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center' }}>
                                                <Text style={{ color: colors.textMuted, fontSize: 11, fontStyle: 'italic', textAlign: 'center' }}>No input gaps currently listed. Type in search bar above to add seeds or bio-inputs requirements.</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* PS-03 Finance & Input */}
                            {selectedActivityId === 'PS-03' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Finance & Input Assessment Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Estimated Capital/Finance Required (₦)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 150,000"
                                        value={financeNaira}
                                        onChangeText={setFinanceNaira}
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Inputs Needed this Season</Text>
                                    <View style={styles.optionWrap}>
                                        {['Fertilizer', 'Seeds', 'Herbicides', 'Tractor Credit'].map(input => {
                                            const active = financeInputsNeeded.includes(input);
                                            return (
                                                <TouchableOpacity key={input} style={[styles.chipPill, active && styles.chipPillActive]} onPress={() => {
                                                    if (active) setFinanceInputsNeeded(financeInputsNeeded.filter(i => i !== input));
                                                    else setFinanceInputsNeeded([...financeInputsNeeded, input]);
                                                }}>
                                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{input}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* PS-04 Plot Location */}
                            {selectedActivityId === 'PS-04' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Farm Location accessibility questions</Text>
                                    
                                    {/* Already Mapped Land Area */}
                                    <View style={{ 
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        backgroundColor: isDarkMode ? '#1E293B' : '#F0FDFA', 
                                        borderWidth: 1, 
                                        borderColor: '#0D948833', 
                                        borderRadius: 8, 
                                        padding: 10, 
                                        marginBottom: 12,
                                        gap: 8 
                                    }}>
                                        <Feather name="map" size={16} color="#0D9488" />
                                        <View>
                                            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Already Mapped Land Area</Text>
                                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>2.5 Hectares (ha)</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Plot Accessibility Status</Text>
                                    <View style={styles.optionWrap}>
                                        {['Fully Accessible', 'Poor Road Access', 'Flooded/Waterlogged', 'High Security Risk'].map(acc => (
                                            <TouchableOpacity key={acc} style={[styles.chipPill, plotAccessibility === acc && styles.chipPillActive]} onPress={() => setPlotAccessibility(acc)}>
                                                <Text style={[styles.chipText, plotAccessibility === acc && styles.chipTextActive]}>{acc}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Cultivation Status</Text>
                                    <View style={styles.optionWrap}>
                                        {['Active Farming', 'Fallow Land', 'Abandoned / Not Used'].map(st => (
                                            <TouchableOpacity key={st} style={[styles.chipPill, plotCultivationStatus === st && styles.chipPillActive]} onPress={() => setPlotCultivationStatus(st)}>
                                                <Text style={[styles.chipText, plotCultivationStatus === st && styles.chipTextActive]}>{st}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ES-01 Land preparation */}
                            {selectedActivityId === 'ES-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Land Preparation Questions</Text>
                                    
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Started Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('landPrepStarted', landPrepStartedDate)}
                                    >
                                        <Text style={{ color: landPrepStartedDate ? colors.text : colors.textMuted }}>{landPrepStartedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Ended Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('landPrepEnded', landPrepEndedDate)}
                                    >
                                        <Text style={{ color: landPrepEndedDate ? colors.text : colors.textMuted }}>{landPrepEndedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>

                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Preparation Method</Text>
                                    <View style={styles.optionWrap}>
                                        {['Tractor Tillage', 'Power Tiller', 'Manual Hoe Clearing', 'Zero-Till Prep'].map(method => (
                                            <TouchableOpacity key={method} style={[styles.chipPill, landPrepMethod === method && styles.chipPillActive]} onPress={() => setLandPrepMethod(method)}>
                                                <Text style={[styles.chipText, landPrepMethod === method && styles.chipTextActive]}>{method}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Soil Moisture Readiness</Text>
                                    <View style={styles.optionWrap}>
                                        {['Optimal Moisture', 'Dry & Hard Soil', 'Waterlogged / Too Wet'].map(moist => (
                                            <TouchableOpacity key={moist} style={[styles.chipPill, soilMoisture === moist && styles.chipPillActive]} onPress={() => setSoilMoisture(moist)}>
                                                <Text style={[styles.chipText, soilMoisture === moist && styles.chipTextActive]}>{moist}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ES-02 Planting Verification */}
                            {selectedActivityId === 'ES-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <View style={styles.specHeaderRow}>
                                        <Ionicons name="leaf" size={18} color="#0E6F6A" />
                                        <Text style={[styles.cardBoxTitle, { color: colors.text }]}>Planting Verification Data (ES-02 Spec)</Text>
                                    </View>

                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planting Started Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('plantingStarted', plantingStartedDate)}
                                    >
                                        <Text style={{ color: plantingStartedDate ? colors.text : colors.textMuted }}>{plantingStartedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• What Has Been Done / Planting Status</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, height: 60, textAlignVertical: 'top', marginBottom: 8 }]}
                                        placeholder="e.g. Sowed seeds, applied initial organic fertilizer."
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        value={plantingDescription}
                                        onChangeText={setPlantingDescription}
                                    />

                                    {/* 1. Crops Planted & Variety */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Primary Crop & Seed Variety Planted</Text>
                                    <View style={styles.optionWrap}>
                                        {['Maize (SAMMAZ 52)', 'Rice (FARO 44)', 'Soybean (TGX 1904)', 'Groundnut (SAMNUT 24)', 'Sesame (NCRIB)', 'Sorghum (SAMSORG 45)', 'Cassava (TME 419)', 'Egusi (Melon)'].map((cr) => (
                                            <TouchableOpacity key={cr} style={[styles.chipPill, cropVariety === cr && styles.chipPillActive]} onPress={() => setCropVariety(cr)}>
                                                <Text style={[styles.chipText, cropVariety === cr && styles.chipTextActive]}>{cr}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 2. Intercropping Combinations */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Intercropping Combination</Text>
                                    <View style={styles.optionWrap}>
                                        {['Monocropping (Single Crop)', 'Soybean + Drop Maize (Relay)', 'Groundnut + Drop Sorghum (Relay)', 'Egusi + Drop Corn (Relay)', 'Cassava + Legume Relay', 'Maize + Cowpea Intercrop'].map((combo) => (
                                            <TouchableOpacity key={combo} style={[styles.chipPill, intercroppingCombo === combo && styles.chipPillActive]} onPress={() => setIntercroppingCombo(combo)}>
                                                <Text style={[styles.chipText, intercroppingCombo === combo && styles.chipTextActive]}>{combo}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 3. Planting Patterns & Spacing */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planting Pattern & Grid Spacing</Text>
                                    <View style={styles.optionWrap}>
                                        {['75cm x 25cm (Ridge Row)', '50cm x 20cm (Flat Bed)', '1m x 1m (Mounds)', 'Random / Broadcast Sowing'].map((pat) => (
                                            <TouchableOpacity key={pat} style={[styles.chipPill, plantingPattern === pat && styles.chipPillActive]} onPress={() => setPlantingPattern(pat)}>
                                                <Text style={[styles.chipText, plantingPattern === pat && styles.chipTextActive]}>{pat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 4. Seed Quantities Used */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Seed Quantity Used (kg/bags)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 25 kg hybrid seed"
                                        placeholderTextColor={colors.textMuted}
                                        value={seedQtyUsed}
                                        onChangeText={setSeedQtyUsed}
                                        keyboardType="numeric"
                                    />

                                    {/* 5. Adoption of Regenerative Agriculture Practices */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Adoption of Regenerative Agriculture Practices</Text>
                                    <View style={styles.optionWrap}>
                                        {['Zero/Minimum Tillage', 'Mulching / Organic Cover Crop', 'Compost / Organic Manure Pre-Planting', 'Soil Contour Barriers / Terracing', 'Bio-Pesticide Seed Treatment', 'Crop Rotation Sequence'].map((practice) => {
                                            const active = plantingRegenPractices.includes(practice);
                                            return (
                                                <TouchableOpacity
                                                    key={practice}
                                                    style={[styles.chipPill, active && styles.chipPillActive]}
                                                    onPress={() => togglePlantingRegenPractice(practice)}
                                                >
                                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                                        {practice}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* ES-03 Germination */}
                            {selectedActivityId === 'ES-03' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <View style={styles.specHeaderRow}>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#0E6F6A" />
                                        <Text style={[styles.cardBoxTitle, { color: colors.text }]}>Germination & Crop Establishment Data (ES-03 Spec)</Text>
                                    </View>

                                    {/* 1. Germination Success Rate */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Germination Success Rate (%)</Text>
                                    <View style={styles.optionWrap}>
                                        {[
                                            '> 85% Excellent',
                                            '70 - 85% Good',
                                            '50 - 70% Moderate (Gap Filling Needed)',
                                            '< 50% Poor (Replanting Required)'
                                        ].map((rate) => (
                                            <TouchableOpacity
                                                key={rate}
                                                style={[styles.chipPill, germinationRate === rate && styles.chipPillActive]}
                                                onPress={() => setGerminationRate(rate)}
                                            >
                                                <Text style={[styles.chipText, germinationRate === rate && styles.chipTextActive]}>{rate}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 2. Crop Establishment Status */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Seedling Vigor & Establishment</Text>
                                    <View style={styles.optionWrap}>
                                        {[
                                            'Strong Uniform Stand',
                                            'Uneven / Irregular Stand',
                                            'Stunted Seedling Emergence',
                                            'Pest / Flood Damaged Shoots'
                                        ].map((est) => (
                                            <TouchableOpacity
                                                key={est}
                                                style={[styles.chipPill, cropEstablishment === est && styles.chipPillActive]}
                                                onPress={() => setCropEstablishment(est)}
                                            >
                                                <Text style={[styles.chipText, cropEstablishment === est && styles.chipTextActive]}>{est}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 3. Crop Population Levels */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Estimated Plant Population Density</Text>
                                    <View style={styles.optionWrap}>
                                        {[
                                            '53,333 plants/ha (Maize Standard)',
                                            '250,000 plants/ha (Soybean)',
                                            '10,000 stands/ha (Cassava)',
                                            'Custom Density'
                                        ].map((pop) => (
                                            <TouchableOpacity
                                                key={pop}
                                                style={[styles.chipPill, cropPopulationDensity === pop && styles.chipPillActive]}
                                                onPress={() => setCropPopulationDensity(pop)}
                                            >
                                                <Text style={[styles.chipText, cropPopulationDensity === pop && styles.chipTextActive]}>{pop}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 4. Adoption of Regenerative Agriculture Practices */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Adoption of Post-Germination Regenerative Practices</Text>
                                    <View style={styles.optionWrap}>
                                        {[
                                            'Gap-Filling with Bio-Treated Seed',
                                            'Thinning & Organic Weed Mulch',
                                            'Post-Germination Soil Aeration',
                                            'Bio-Stimulant Foliar Spray',
                                            'Soil Moisture Retention Barriers'
                                        ].map((practice) => {
                                            const active = germinationRegenPractices.includes(practice);
                                            return (
                                                <TouchableOpacity
                                                    key={practice}
                                                    style={[styles.chipPill, active && styles.chipPillActive]}
                                                    onPress={() => toggleGerminationRegenPractice(practice)}
                                                >
                                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                                        {practice}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Specialized Crop Growth & Health Monitoring Fields */}
                            
                            {/* MS-01 Bio-Input Supply */}
                            {selectedActivityId === 'MS-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Bio-Input Delivery Status Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Delivered Bio-Input Type</Text>
                                    <View style={styles.optionWrap}>
                                        {['Organic Liquid Fertilizer', 'Neem Bio-Pesticide', 'Compost Booster Bags', 'Trichoderma Fungal Powder'].map(bio => (
                                            <TouchableOpacity key={bio} style={[styles.chipPill, bioInputDelivered === bio && styles.chipPillActive]} onPress={() => setBioInputDelivered(bio)}>
                                                <Text style={[styles.chipText, bioInputDelivered === bio && styles.chipTextActive]}>{bio}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Delivered Status</Text>
                                    <View style={styles.optionWrap}>
                                        {['Delivered & Confirmed', 'Pending Delivery', 'Incorrect Items Supplied'].map(st => (
                                            <TouchableOpacity key={st} style={[styles.chipPill, bioInputDeliveryStatus === st && styles.chipPillActive]} onPress={() => setBioInputDeliveryStatus(st)}>
                                                <Text style={[styles.chipText, bioInputDeliveryStatus === st && styles.chipTextActive]}>{st}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* MS-02 Bio-Input Application */}
                            {selectedActivityId === 'MS-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Bio-Input Application Verification Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Applied Method</Text>
                                    <View style={styles.optionWrap}>
                                        {['Foliar Spraying', 'Soil Drenching / Wetting', 'Side Basal Dressing', 'Seed Dress Pre-Planting'].map(method => (
                                            <TouchableOpacity key={method} style={[styles.chipPill, bioInputAppMethod === method && styles.chipPillActive]} onPress={() => setBioInputAppMethod(method)}>
                                                <Text style={[styles.chipText, bioInputAppMethod === method && styles.chipTextActive]}>{method}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Application Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 }]}
                                        onPress={() => openDatePicker('bioInputApp', bioInputAppDate)}
                                    >
                                        <Text style={{ color: bioInputAppDate ? colors.text : colors.textMuted }}>{bioInputAppDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* MS-03 Management Practices */}
                            {selectedActivityId === 'MS-03' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Weeding & Management Practice Audits</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Weeding & Maintenance Actions Observed</Text>
                                    <View style={styles.optionWrap}>
                                        {['First weeding done', 'Second weeding done', 'Thinning complete', 'Gap filling complete', 'Mulching active'].map(action => {
                                            const active = practicesObserved.includes(action);
                                            return (
                                                <TouchableOpacity key={action} style={[styles.chipPill, active && styles.chipPillActive]} onPress={() => {
                                                    if (active) setPracticesObserved(practicesObserved.filter(a => a !== action));
                                                    else setPracticesObserved([...practicesObserved, action]);
                                                }}>
                                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{action}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Pest Density Level</Text>
                                    <View style={styles.optionWrap}>
                                        {['Clean / No Pests', 'Mild Infestation (Safe)', 'Severe Infestation (Urgent Action Required)'].map(pest => (
                                            <TouchableOpacity key={pest} style={[styles.chipPill, pestDensity === pest && styles.chipPillActive]} onPress={() => setPestDensity(pest)}>
                                                <Text style={[styles.chipText, pestDensity === pest && styles.chipTextActive]}>{pest}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* MS-04 Crop Condition & Risk */}
                            {selectedActivityId === 'MS-04' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Crop Health & Risk Alerts Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Health Rating & Symptoms</Text>
                                    <View style={styles.optionWrap}>
                                        {['Excellent vigor', 'Moderate growth', 'Yellowing / Nutrient Deficient', 'Stunted emergence', 'Pest Damage shoots'].map(rating => (
                                            <TouchableOpacity key={rating} style={[styles.chipPill, cropHealthRating === rating && styles.chipPillActive]} onPress={() => setCropHealthRating(rating)}>
                                                <Text style={[styles.chipText, cropHealthRating === rating && styles.chipTextActive]}>{rating}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Immediate Risk Warning Type</Text>
                                    <View style={styles.optionWrap}>
                                        {['None', 'Drought Wilting', 'Flooding Waterlogged', 'Insects/Armyworms Attack', 'Disease / Blight Spots'].map(risk => (
                                            <TouchableOpacity key={risk} style={[styles.chipPill, riskWarningType === risk && styles.chipPillActive]} onPress={() => setRiskWarningType(risk)}>
                                                <Text style={[styles.chipText, riskWarningType === risk && styles.chipTextActive]}>{risk}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* LS-01 Harvest Start Confirmation */}
                            {selectedActivityId === 'LS-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Harvest Commencement Questions</Text>
                                    
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Actual Harvest Commencement Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('actualHarvest', harvestStartedDate)}
                                    >
                                        <Text style={{ color: harvestStartedDate ? colors.text : colors.textMuted }}>{harvestStartedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>

                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Expected / Actual Harvest Commencement Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 }]}
                                        onPress={() => openDatePicker('expectedHarvest', expectedHarvestDate)}
                                    >
                                        <Text style={{ color: expectedHarvestDate ? colors.text : colors.textMuted }}>{expectedHarvestDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planned Storage Channel</Text>
                                    <View style={styles.optionWrap}>
                                        {['Hermetic PICS Bags', 'Traditional Open Granary', 'Cooperative Warehouse', 'Direct Sale to Trader'].map(ch => (
                                            <TouchableOpacity key={ch} style={[styles.chipPill, intendedStorageChannel === ch && styles.chipPillActive]} onPress={() => setIntendedStorageChannel(ch)}>
                                                <Text style={[styles.chipText, intendedStorageChannel === ch && styles.chipTextActive]}>{ch}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* LS-02 Harvest Quantity Verification */}
                            {selectedActivityId === 'LS-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#FEF3C7', borderColor: '#F59E0B', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Harvest & Multi-Event Yield Data (LS-02 Spec)</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Harvest Event Sequence (Multiple Event Tracking)</Text>
                                    <View style={styles.optionWrap}>
                                        {['Harvest Event #1 (First Pick)', 'Harvest Event #2 (Mid Season Pick)', 'Harvest Event #3 (Third Pick)', 'Final Flush Harvest'].map((ev) => (
                                            <TouchableOpacity key={ev} style={[styles.chipPill, harvestEventNumber === ev && styles.chipPillActive]} onPress={() => setHarvestEventNumber(ev)}>
                                                <Text style={[styles.chipText, harvestEventNumber === ev && styles.chipTextActive]}>{ev}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Harvest Date</Text>
                                            <TouchableOpacity 
                                                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 }]}
                                                onPress={() => openDatePicker('harvest', harvestDate)}
                                            >
                                                <Text style={{ color: harvestDate ? colors.text : colors.textMuted }}>{harvestDate || 'Select Date'}</Text>
                                                <Feather name="calendar" size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Quantity (This Event)</Text>
                                            <TextInput
                                                style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                                value={eventHarvestQty}
                                                onChangeText={setEventHarvestQty}
                                                placeholder="e.g. 1,200 kg"
                                                placeholderTextColor={colors.textMuted}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Estimated Yield Rating (Per Hectare)</Text>
                                    <View style={styles.optionWrap}>
                                        {['4.8 MT / Ha (High Yield)', '3.5 MT / Ha (Standard Target)', '2.2 MT / Ha (Moderate Yield)', '1.0 MT / Ha (Below Average)'].map((yld) => (
                                            <TouchableOpacity key={yld} style={[styles.chipPill, estimatedYieldPerHa === yld && styles.chipPillActive]} onPress={() => setEstimatedYieldPerHa(yld)}>
                                                <Text style={[styles.chipText, estimatedYieldPerHa === yld && styles.chipTextActive]}>{yld}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Adoption of Harvest & Post-Harvest Regenerative Practices</Text>
                                    <View style={styles.optionWrap}>
                                        {['Crop Residue Retention / Soil Mulch Re-integration', 'Selective Picking / Zero-Waste Harvesting', 'Zero-Chemical Eco Bag Storage (PICS)', 'Solar Grain Drying / Cold Storage', 'Post-Harvest Organic Composting'].map((practice) => {
                                            const active = harvestRegenPractices.includes(practice);
                                            return (
                                                <TouchableOpacity key={practice} style={[styles.chipPill, active && styles.chipPillActive]} onPress={() => toggleHarvestRegenPractice(practice)}>
                                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{practice}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* END-01 Storage Confirmation */}
                            {selectedActivityId === 'END-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Warehouse Storage Compliance Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Storage Facility Compliance Level</Text>
                                    <View style={styles.optionWrap}>
                                        {['Dry & Well-Ventilated', 'Damp / High Moisture Risk', 'Unsecured / Pest Vulnerable'].map(cmp => (
                                            <TouchableOpacity key={cmp} style={[styles.chipPill, storageCompliance === cmp && styles.chipPillActive]} onPress={() => setStorageCompliance(cmp)}>
                                                <Text style={[styles.chipText, storageCompliance === cmp && styles.chipTextActive]}>{cmp}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Total Stored Bags Count (Hermetic standard)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 30"
                                        value={storageBagsCount}
                                        onChangeText={setStorageBagsCount}
                                        keyboardType="numeric"
                                    />
                                </View>
                            )}

                            {/* END-02 Aggregation Record */}
                            {selectedActivityId === 'END-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Local Hub Aggregation Record</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Target Hub Location</Text>
                                    <View style={styles.optionWrap}>
                                        {['Kano Hub', 'Kaduna Hub', 'Zaria Hub', 'Gombe Hub'].map(hub => (
                                            <TouchableOpacity key={hub} style={[styles.chipPill, aggregationHub === hub && styles.chipPillActive]} onPress={() => setAggregationHub(hub)}>
                                                <Text style={[styles.chipText, aggregationHub === hub && styles.chipTextActive]}>{hub}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Aggregation Transport Mode</Text>
                                    <View style={styles.optionWrap}>
                                        {['Small Truck', 'Tricycle (Keke Cargo)', 'Tractor Trailer', 'Manual Carrier / Handcart'].map(tr => (
                                            <TouchableOpacity key={tr} style={[styles.chipPill, aggregationTransport === tr && styles.chipPillActive]} onPress={() => setAggregationTransport(tr)}>
                                                <Text style={[styles.chipText, aggregationTransport === tr && styles.chipTextActive]}>{tr}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* END-03 Juriya Sales Outcome */}
                            {selectedActivityId === 'END-03' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Market Outlets & Revenue Results</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Average Price Realized Per kg (₦)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 450"
                                        value={salesPricePerUnit}
                                        onChangeText={setSalesPricePerUnit}
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Juriya Buyer Transaction / Invoice Reference</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. TXN-JUR-8839"
                                        value={salesTransactionId}
                                        onChangeText={setSalesTransactionId}
                                    />
                                </View>
                            )}

                            {/* 4. Attempt Status Selector */}
                            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>4. Attempt Status (SCL Matrix)</Text>
                            <View style={styles.attemptGrid}>
                                {Object.values(ATTEMPT_STATUS_CONFIGS).map((cfg) => {
                                    const isSelected = attemptStatus === cfg.id;
                                    return (
                                        <TouchableOpacity
                                            key={cfg.id}
                                            style={[
                                                styles.attemptCard,
                                                {
                                                    backgroundColor: isSelected ? cfg.badgeBg : isDarkMode ? '#0F172A' : '#F8FAFC',
                                                    borderColor: isSelected ? cfg.badgeColor : isDarkMode ? '#1E293B' : '#E2E8F0',
                                                },
                                            ]}
                                            onPress={() => setAttemptStatus(cfg.id)}
                                        >
                                            <View style={styles.attemptRadioRow}>
                                                <View style={[styles.radioOuter, { borderColor: cfg.badgeColor }]}>
                                                    {isSelected && <View style={[styles.radioInner, { backgroundColor: cfg.badgeColor }]} />}
                                                </View>
                                                <Text style={[styles.attemptTitle, { color: colors.text }]}>{cfg.label}</Text>
                                            </View>
                                            <Text style={[styles.attemptDesc, { color: colors.textSecondary }]}>{cfg.description}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Require Reason Input if not completed */}
                            {ATTEMPT_STATUS_CONFIGS[attemptStatus].requiresReason && (
                                <View style={styles.reasonBox}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Reason for "{ATTEMPT_STATUS_CONFIGS[attemptStatus].label}"</Text>
                                    <TextInput
                                        style={[styles.notesInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="Enter detailed reason for supervisor review..."
                                        placeholderTextColor={colors.textMuted}
                                        value={attemptReason}
                                        onChangeText={setAttemptReason}
                                        multiline
                                    />
                                </View>
                            )}


{false && (
                                <>
                                    {/* 5. Quantity & Unit Selection */}
                                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>5. Quantity & Controlled Measurement Unit</Text>
                                    <View style={styles.unitRow}>
                                        <TextInput
                                            style={[styles.textInput, { flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                            placeholder="Enter quantity (e.g. 50)"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="numeric"
                                            value={quantityValue}
                                            onChangeText={setQuantityValue}
                                        />
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                                            {STANDARD_UNITS.map((u) => (
                                                <TouchableOpacity
                                                    key={u.id}
                                                    style={[
                                                        styles.unitPill,
                                                        {
                                                            backgroundColor: selectedUnit === u.id ? colors.primary : isDarkMode ? '#1E293B' : '#E2E8F0',
                                                        },
                                                    ]}
                                                    onPress={() => setSelectedUnit(u.id)}
                                                >
                                                    <Text style={[styles.unitPillText, { color: selectedUnit === u.id ? '#FFF' : colors.text }]}>
                                                        {u.id}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </>
                            )}

                            {/* 6. GPS Verification Guard */}
                            {activeSpec.gpsRequired && (
                                <View style={[styles.gpsGuardCard, { backgroundColor: isDarkMode ? '#0F172A' : '#EFF6FF', borderColor: colors.primary + '33' }]}>
                                    <View style={styles.gpsHeader}>
                                        <Feather name="map-pin" size={18} color={colors.primary} />
                                        <Text style={[styles.gpsTitle, { color: colors.text }]}>GPS Verification (Mandatory for {selectedActivityId})</Text>
                                    </View>

                                    <Text style={[styles.gpsCoordinates, { color: gpsCoordinates ? '#10B981' : '#EF4444' }]}>
                                        {gpsCoordinates ? `Location Locked: ${gpsCoordinates}` : 'No GPS Location Captured'}
                                    </Text>

                                    <TouchableOpacity style={[styles.gpsBtn, { backgroundColor: colors.primary }]} onPress={handleCaptureGps} disabled={isCapturingGps}>
                                        <Text style={styles.gpsBtnText}>{isCapturingGps ? 'Locking Coordinates...' : 'Re-capture GPS Location'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeSpec.photoRecommended && (
                                <>
                                    {/* 7. Photo Evidence */}
                                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>7. Verification Evidence Photo</Text>
                                    {evidenceImage ? (
                                        <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                            <Image source={{ uri: evidenceImage || undefined }} style={styles.imagePreview} />
                                            <View style={styles.editImageOverlay}>
                                                <Feather name="edit-2" size={16} color="white" />
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary }]} onPress={pickImage}>
                                            <Text style={[styles.photoButtonText, { color: colors.primary }]}>Take / Upload Photo Evidence</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

                            {/* Save Button */}
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 20 }]} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>
                                    {!!(selectedActivityId && RECORDED_INPUTS_DB[selectedActivityId]) 
                                        ? `Update VCM Activity (${selectedActivityId})` 
                                        : `Submit VCM Activity (${selectedActivityId})`
                                    }
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.whiteContainer, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>General Activity Logging</Text>
                            <TextInput
                                style={[styles.notesInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder="Add custom field observation notes..."
                                placeholderTextColor={colors.textMuted}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                            />
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 20 }]} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Save Log</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Custom Premium Calendar Date Picker Modal */}
            <Modal
                visible={isDatePickerOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDatePickerOpen(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 340, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 }}>
                        
                        {/* Modal Title */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Select Date</Text>
                            <TouchableOpacity onPress={() => setIsDatePickerOpen(false)}>
                                <Feather name="x" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Month Navigator Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 8 }}>
                            <TouchableOpacity 
                                onPress={() => {
                                    if (pickerMonth === 0) {
                                        setPickerMonth(11);
                                        setPickerYear(pickerYear - 1);
                                    } else {
                                        setPickerMonth(pickerMonth - 1);
                                    }
                                }}
                                style={{ padding: 6 }}
                            >
                                <Feather name="chevron-left" size={18} color={colors.primary} />
                            </TouchableOpacity>
                            
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                {new Date(pickerYear, pickerMonth).toLocaleString('default', { month: 'long' })} {pickerYear}
                            </Text>
                            
                            <TouchableOpacity 
                                onPress={() => {
                                    if (pickerMonth === 11) {
                                        setPickerMonth(0);
                                        setPickerYear(pickerYear + 1);
                                    } else {
                                        setPickerMonth(pickerMonth + 1);
                                    }
                                }}
                                style={{ padding: 6 }}
                            >
                                <Feather name="chevron-right" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Weekdays Row */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <View key={day} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 4 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>{day}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Days Grid */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {/* Empty cells before first day */}
                            {Array.from({ length: new Date(pickerYear, pickerMonth, 1).getDay() }).map((_, i) => (
                                <View key={`empty-${i}`} style={{ width: '14.28%', height: 36 }} />
                            ))}
                            
                            {/* Month days */}
                            {Array.from({ length: new Date(pickerYear, pickerMonth + 1, 0).getDate() }).map((_, i) => {
                                const dayNum = i + 1;
                                const dateString = formatPickerDate(pickerYear, pickerMonth, dayNum);
                                
                                // Check if selected
                                let isSelected = false;
                                if (activeDatePickerField === 'landPrepStarted') isSelected = landPrepStartedDate === dateString;
                                else if (activeDatePickerField === 'landPrepEnded') isSelected = landPrepEndedDate === dateString;
                                else if (activeDatePickerField === 'plantingStarted') isSelected = plantingStartedDate === dateString;
                                else if (activeDatePickerField === 'bioInputApp') isSelected = bioInputAppDate === dateString;
                                else if (activeDatePickerField === 'expectedHarvest') isSelected = expectedHarvestDate === dateString;
                                else if (activeDatePickerField === 'actualHarvest') isSelected = harvestStartedDate === dateString;
                                else if (activeDatePickerField === 'harvest') isSelected = harvestDate === dateString;

                                return (
                                    <TouchableOpacity 
                                        key={`day-${dayNum}`} 
                                        onPress={() => {
                                            if (activeDatePickerField === 'landPrepStarted') setLandPrepStartedDate(dateString);
                                            else if (activeDatePickerField === 'landPrepEnded') setLandPrepEndedDate(dateString);
                                            else if (activeDatePickerField === 'plantingStarted') setPlantingStartedDate(dateString);
                                            else if (activeDatePickerField === 'bioInputApp') setBioInputAppDate(dateString);
                                            else if (activeDatePickerField === 'expectedHarvest') setExpectedHarvestDate(dateString);
                                            else if (activeDatePickerField === 'actualHarvest') setHarvestStartedDate(dateString);
                                            else if (activeDatePickerField === 'harvest') setHarvestDate(dateString);
                                            
                                            setIsDatePickerOpen(false);
                                        }}
                                        style={{ 
                                            width: '14.28%', 
                                            height: 36, 
                                            justifyContent: 'center', 
                                            alignItems: 'center', 
                                            borderRadius: 18, 
                                            backgroundColor: isSelected ? colors.primary : 'transparent',
                                            marginVertical: 1
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.text }}>
                                            {dayNum}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        marginTop: 155, // Clear absolute CustomBackNavBar
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    subplotCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 14,
    },
    subplotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subplotName: {
        fontSize: 16,
        fontWeight: '700',
    },
    subplotSize: {
        fontSize: 13,
        fontWeight: '600',
    },
    subplotMeta: {
        fontSize: 12,
        marginTop: 4,
    },
    modeContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    modeTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#0E6F6A33',
    },
    modeTabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    whiteContainer: {
        borderRadius: 16,
        padding: 16,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    stageScroll: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    stagePill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    stagePillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    activityPickerList: {
        gap: 8,
    },
    activitySpecBox: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    specHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    specTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    specIdBadge: {
        fontSize: 13,
        fontWeight: '800',
    },
    specTitle: {
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
    },
    pointsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    pointsBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    specObjective: {
        fontSize: 11,
        marginBottom: 6,
    },
    specPillRow: {
        flexDirection: 'row',
        gap: 6,
    },
    reqPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#0E6F6A14',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    reqPillText: {
        fontSize: 10,
        color: '#0E6F6A',
        fontWeight: '700',
    },
    attemptGrid: {
        gap: 8,
    },
    attemptCard: {
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    attemptRadioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    radioOuter: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    attemptTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    attemptDesc: {
        fontSize: 11,
        marginLeft: 24,
    },
    reasonBox: {
        marginTop: 10,
    },
    notesInput: {
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        minHeight: 70,
        textAlignVertical: 'top',
        borderWidth: 1,
    },
    unitRow: {
        gap: 8,
    },
    textInput: {
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        borderWidth: 1,
    },
    unitScroll: {
        flexDirection: 'row',
        marginTop: 6,
    },
    unitPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 6,
    },
    unitPillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    gpsGuardCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 14,
    },
    gpsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    gpsTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    gpsCoordinates: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10,
    },
    gpsBtn: {
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    gpsBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    photoButton: {
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
    },
    photoButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    editImageOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 16,
        padding: 6,
    },
    saveButton: {
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    cardBox: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    cardBoxTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    subFieldLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chipPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
    },
    chipPillActive: {
        backgroundColor: '#0E6F6A',
        borderColor: '#0E6F6A',
    },
    chipText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#334155',
    },
    chipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

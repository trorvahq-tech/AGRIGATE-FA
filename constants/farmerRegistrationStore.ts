export interface FarmerRegistrationData {
    // Section A: Personal Data & Consent
    consentGiven: boolean;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: 'Male' | 'Female' | '';
    dob: string;
    doesNotKnowDob: boolean;
    farmerAge: string;
    maritalStatus: string;
    canReadAndWrite: boolean;
    educationLevel: string;
    primaryOccupation: string;
    primaryOccupationOther: string;
    secondaryOccupation: string;
    secondaryOccupationOther: string;
    monthlyIncome: string;
    incomeControl: boolean;
    disabilities: string[];

    // Section B & KYC: Finance, Banking & Photo
    hasNin: boolean;
    ninNumber: string;
    hasBankAccount: boolean;
    bankName: string;
    accountNumber: string;
    bvn: string;
    mobileMoneyWallet: boolean;
    microfinanceMember: boolean;
    farmerPhotoUri: string;

    // Section F & G: Farm Practice, Regenerative Ag & GPS
    landTenure: string;
    farmSizeHa: string;
    primaryCrop: string;
    secondaryCrop: string;
    regenerativePractices: string[];
    fertilizerUsed: boolean;
    agrochemicalsUsed: boolean;
    gpsLat: number | null;
    gpsLong: number | null;
    gpsAccuracy: number | null;

    // Section C, D, E: Household, Water, Security
    householdSize: string;
    dependantsCount: string;
    schoolingChildren: string;
    waterSource: string;
    waterTreatment: string;
    mealFrequency: string;
    foodShortageMonths: string[];
    securityThreat: boolean;
    conflictExperience: string;

    // Section H: Livestock, Poultry & Aquaculture
    livestockTypes: string[];
    cattleCount: string;
    sheepCount: string;
    goatCount: string;
    pigCount: string;
    poultryTypes: string[];
    poultryFlockSize: string;
    poultryFeedCostPerWeek: string;
    poultryEggYieldPerWeek: string;
    aquacultureReared: boolean;
    fishTypes: string[];
    fingerlingsCount: string;
    pondWidth: string;
    pondLength: string;
    pondDepth: string;
    fishFeedCostPerWeek: string;
}

export const initialRegistrationData: FarmerRegistrationData = {
    // Section A
    consentGiven: true,
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    doesNotKnowDob: false,
    farmerAge: '',
    maritalStatus: 'Married',
    canReadAndWrite: true,
    educationLevel: 'Secondary',
    primaryOccupation: 'Crop Farming',
    primaryOccupationOther: '',
    secondaryOccupation: 'Trading',
    secondaryOccupationOther: '',
    monthlyIncome: '48,000',
    incomeControl: true,
    disabilities: [],

    // Section B & KYC
    hasNin: true,
    ninNumber: '',
    hasBankAccount: true,
    bankName: 'First Bank of Nigeria',
    accountNumber: '',
    bvn: '',
    mobileMoneyWallet: true,
    microfinanceMember: false,
    farmerPhotoUri: '',

    // Section F & G
    landTenure: 'Owned',
    farmSizeHa: '2.5',
    primaryCrop: 'Maize',
    secondaryCrop: 'Soybean',
    regenerativePractices: ['Crop Rotation', 'Mulching', 'Organic Manure'],
    fertilizerUsed: true,
    agrochemicalsUsed: true,
    gpsLat: 10.5167,
    gpsLong: 7.4333,
    gpsAccuracy: 4.2,

    // Section C, D, E
    householdSize: '6',
    dependantsCount: '4',
    schoolingChildren: '3',
    waterSource: 'Borehole',
    waterTreatment: 'Boiling',
    mealFrequency: '3 Meals/Day',
    foodShortageMonths: [],
    securityThreat: false,
    conflictExperience: 'None',

    // Section H
    livestockTypes: ['Cattle', 'Goats'],
    cattleCount: '5',
    sheepCount: '0',
    goatCount: '8',
    pigCount: '0',
    poultryTypes: ['Layers'],
    poultryFlockSize: '150',
    poultryFeedCostPerWeek: '12,500',
    poultryEggYieldPerWeek: '850',
    aquacultureReared: false,
    fishTypes: [],
    fingerlingsCount: '0',
    pondWidth: '0',
    pondLength: '0',
    pondDepth: '0',
    fishFeedCostPerWeek: '0',
};

// Global in-memory draft data store for active session
let currentDraftData: FarmerRegistrationData = { ...initialRegistrationData };

export const getDraftRegistrationData = (): FarmerRegistrationData => {
    return currentDraftData;
};

export const updateDraftRegistrationData = (fields: Partial<FarmerRegistrationData>) => {
    currentDraftData = { ...currentDraftData, ...fields };
    return currentDraftData;
};

export const resetDraftRegistrationData = () => {
    currentDraftData = { ...initialRegistrationData };
    return currentDraftData;
};

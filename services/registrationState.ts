export interface FarmerRegistrationData {
    // Step 1: Personal Details
    firstName: string;
    middleName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other' | 'unknown';
    dateOfBirth: string | null;
    phone: string;
    alternatePhone: string;
    email: string;
    preferredLanguage: string;
    maritalStatus: string;
    canReadWrite: boolean;
    education: string;
    primaryOcc: string;
    secondaryOcc: string;
    monthlyIncome: string;
    incomeControl: boolean;
    selectedDisabilities: string[];

    // Step 2: KYC & Identity
    hasNin: boolean;
    ninNumber: string;
    hasBankAccount: boolean;
    bankName: string;
    accountNumber: string;
    bvn: string;
    mobileMoney: boolean;
    microfinanceGroup: string;
    photoUri: string | null;
    facialBiometrics?: any | null;

    // Step 3: Farm Details & GPS
    landTenure: string;
    farmSizeHa: string;
    farmSizeAcres: string;
    boundaryGeojson?: any;
    primaryCrop: string;
    secondaryCrop: string;
    selectedRegenPractices: string[];
    fertilizerUsed: boolean;
    agrochemicalsUsed: boolean;
    gpsLat: string;
    gpsLong: string;
    gpsAccuracy: string;
    perimeterMeters: number;
    mappedVertices: any[];
    community?: string;
    lga?: string;
    stateName?: string;
    address?: string;

    // Step 4: Household & Food Security
    householdSize: string;
    dependantsCount: string;
    schoolingChildren: string;
    waterSource: string;
    waterTreatment: string;
    mealFrequency: string;
    shortageMonths: string[];
    securityThreat: boolean;
    conflictLevel: string;

    // Step 5: Livestock & Enumeration
    selectedLivestock: string[];
    cattleCount: string;
    goatCount: string;
    selectedPoultry: string[];
    flockSize: string;
    poultryFeedCost: string;
    eggYieldPerWeek: string;
    hasAquaculture: boolean;
    fishType: string;
    fingerlingsCount: string;
    pondWidth: string;
    pondLength: string;
    pondDepth: string;
    fishFeedCost: string;

    // Step 5: Attestation, Signature & Biometrics
    signatureUri: string | null;
    signatureSvg: string | null;
    fingerprintData: {
        finger: string;
        template: string;
        quality: number;
        capturedAt: string;
        deviceModel?: string;
    } | null;
    attestationAgreed: boolean;
}

let registrationData: FarmerRegistrationData = {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'unknown',
    dateOfBirth: null,
    phone: '',
    alternatePhone: '',
    email: '',
    preferredLanguage: '',
    maritalStatus: '',
    canReadWrite: false,
    education: '',
    primaryOcc: '',
    secondaryOcc: '',
    monthlyIncome: '',
    incomeControl: false,
    selectedDisabilities: [],

    hasNin: false,
    ninNumber: '',
    hasBankAccount: false,
    bankName: '',
    accountNumber: '',
    bvn: '',
    mobileMoney: false,
    microfinanceGroup: '',
    photoUri: null,
    facialBiometrics: null,

    landTenure: '',
    farmSizeHa: '',
    farmSizeAcres: '',
    boundaryGeojson: null,
    primaryCrop: '',
    secondaryCrop: '',
    selectedRegenPractices: [],
    fertilizerUsed: false,
    agrochemicalsUsed: false,
    gpsLat: '',
    gpsLong: '',
    gpsAccuracy: '',
    perimeterMeters: 0,
    mappedVertices: [],
    community: '',
    lga: '',
    stateName: '',
    address: '',

    householdSize: '',
    dependantsCount: '',
    schoolingChildren: '',
    waterSource: '',
    waterTreatment: '',
    mealFrequency: '',
    shortageMonths: [],
    securityThreat: false,
    conflictLevel: '',

    selectedLivestock: [],
    cattleCount: '',
    goatCount: '',
    selectedPoultry: [],
    flockSize: '',
    poultryFeedCost: '',
    eggYieldPerWeek: '',
    hasAquaculture: false,
    fishType: '',
    fingerlingsCount: '',
    pondWidth: '',
    pondLength: '',
    pondDepth: '',
    fishFeedCost: '',
    signatureUri: null,
    signatureSvg: null,
    fingerprintData: null,
    attestationAgreed: true,
};

export const registrationState = {
    getData: () => ({ ...registrationData }),
    updateData: (updates: Partial<FarmerRegistrationData>) => {
        registrationData = { ...registrationData, ...updates };
        return registrationData;
    },
    resetData: () => {
        registrationData = {
            firstName: '',
            middleName: '',
            lastName: '',
            gender: 'unknown',
            dateOfBirth: null,
            phone: '',
            alternatePhone: '',
            email: '',
            preferredLanguage: '',
            maritalStatus: '',
            canReadWrite: false,
            education: '',
            primaryOcc: '',
            secondaryOcc: '',
            monthlyIncome: '',
            incomeControl: false,
            selectedDisabilities: [],

            hasNin: false,
            ninNumber: '',
            hasBankAccount: false,
            bankName: '',
            accountNumber: '',
            bvn: '',
            mobileMoney: false,
            microfinanceGroup: '',
            photoUri: null,
            facialBiometrics: null,

            landTenure: '',
            farmSizeHa: '',
            farmSizeAcres: '',
            boundaryGeojson: null,
            primaryCrop: '',
            secondaryCrop: '',
            selectedRegenPractices: [],
            fertilizerUsed: false,
            agrochemicalsUsed: false,
            gpsLat: '',
            gpsLong: '',
            gpsAccuracy: '',
            perimeterMeters: 0,
            mappedVertices: [],
            community: '',
            lga: '',
            stateName: '',
            address: '',

            householdSize: '',
            dependantsCount: '',
            schoolingChildren: '',
            waterSource: '',
            waterTreatment: '',
            mealFrequency: '',
            shortageMonths: [],
            securityThreat: false,
            conflictLevel: '',

            selectedLivestock: [],
            cattleCount: '',
            goatCount: '',
            selectedPoultry: [],
            flockSize: '',
            poultryFeedCost: '',
            eggYieldPerWeek: '',
            hasAquaculture: false,
            fishType: '',
            fingerlingsCount: '',
            pondWidth: '',
            pondLength: '',
            pondDepth: '',
            fishFeedCost: '',
            signatureUri: null,
            signatureSvg: null,
            fingerprintData: null,
            attestationAgreed: true,
        };
    }
};

/**
 * Biometric Types & Standards for Offline Farmer Verification (VCM Platform)
 * 
 * Standards adhered to:
 * - 128-dimensional L2-normalized float feature representation (MobileFaceNet)
 * - Cosine distance matching with configurable decision boundary
 * - Separate liveness verdict from face matching outcome
 */

export interface FaceEmbedding {
    vector: number[];              // 128-dimensional unit vector (norm = 1.0)
    dimension: number;             // 128
    model: 'MobileFaceNet-V1';
    modelVersion: string;          // '1.0.0'
    engine?: 'tflite-native' | 'fallback-calibrated';
    inferenceTimeMs?: number;
}

export interface FaceDetectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FaceLandmarks {
    leftEye?: { x: number; y: number };
    rightEye?: { x: number; y: number };
    noseBase?: { x: number; y: number };
    mouthLeft?: { x: number; y: number };
    mouthRight?: { x: number; y: number };
}

export interface BiometricQualityMetrics {
    brightness: number;            // 0 - 255
    isCentered: boolean;
    rollTiltAngleDeg: number;      // -45 to +45 deg (Z axis: head tilt)
    yawTiltAngleDeg?: number;      // -45 to +45 deg (Y axis: head turn)
    pitchTiltAngleDeg?: number;    // -45 to +45 deg (X axis: look up/down)
    faceCoverageRatio: number;     // 0.0 - 1.0 (proportion of frame occupied by face)
    isSingleFace: boolean;
    faceCount: number;             // Count of detected faces in frame
    exposureGrade: 'OPTIMAL' | 'ACCEPTABLE' | 'POOR';
    isQualityPassed: boolean;      // Holistic quality gate pass/fail
    guidance: string;              // Actionable instruction for the agent / farmer
    boundingBox?: FaceDetectionBox;
    landmarks?: FaceLandmarks;
    eyeOpenConfidence?: {
        left: number;
        right: number;
    };
}

export interface BiometricTemplate {
    templateId: string;            // Unique UUID / deterministically hashed ID
    farmerId: string;              // Associated unique farmer ID
    version: string;               // e.g. 'MFN-128-V1'
    embedding: number[];           // 128-d normalized vector
    enrolledAt: string;            // ISO 8601
    photoUri: string;              // Normalized reference portrait URI
    quality: BiometricQualityMetrics;
    auditSignature: string;        // Cryptographic integrity signature
}

export type BiometricMatchVerdict = 'MATCH' | 'MISMATCH' | 'INCONCLUSIVE';

export interface BiometricMatchResult {
    isMatch: boolean;
    verdict: BiometricMatchVerdict;
    similarity: number;            // Cosine similarity: -1.0 to +1.0
    matchConfidence: number;       // Scaled percentage 0 - 100%
    threshold: number;             // Configured match boundary (default 0.65)
    reasons: string[];
    testedAt: string;
}

export interface LivenessVerdictResult {
    isLive: boolean;
    verdict: 'PASSED' | 'SUSPICIOUS' | 'FAILED';
    livenessScore: number;         // 0 - 100%
    reasons: string[];
    challengeActions?: {
        turnRightPassed: boolean;
        openMouthPassed: boolean;
    };
}

export interface VerificationSessionResult {
    sessionId: string;
    farmerId: string;
    match: BiometricMatchResult;
    liveness: LivenessVerdictResult;
    overallStatus: 'VERIFIED' | 'REVIEW_REQUIRED' | 'REJECTED';
    timestamp: string;
}

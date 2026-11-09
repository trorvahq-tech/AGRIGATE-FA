import { NativeModules, Platform } from 'react-native';
import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import { BiometricQualityMetrics, FaceDetectionBox, FaceLandmarks } from './types';

export interface FaceDetectionResult {
    isAvailable: boolean;
    faces: Face[];
    primaryFace: Face | null;
    quality: BiometricQualityMetrics;
}

export class FaceDetectionService {
    /**
     * Checks if native ML Kit Face Detection is compiled and available in this runtime
     */
    static isNativeAvailable(): boolean {
        return Boolean(NativeModules.FaceDetection);
    }

    /**
     * Detects faces in an image using on-device Google ML Kit
     */
    static async detectFaces(imageUri: string): Promise<Face[]> {
        if (!this.isNativeAvailable()) {
            console.warn(
                '[FaceDetectionService] Native ML Kit is not linked in this runtime (likely running inside Expo Go). ' +
                'Run an Expo Development Build (npx expo run:android / expo start --dev-client) for full native ML Kit acceleration.'
            );
            return [];
        }

        try {
            const faces = await FaceDetection.detect(imageUri, {
                performanceMode: 'accurate',
                landmarkMode: 'all',
                classificationMode: 'all',
                minFaceSize: 0.12,
            });
            return Array.isArray(faces) ? faces : [];
        } catch (error) {
            console.warn('[FaceDetectionService] Error during ML Kit face detection:', error);
            return [];
        }
    }

    /**
     * Evaluates comprehensive ISO-aligned image quality and biometric positioning
     */
    static evaluateQuality(
        faces: Face[],
        imageWidth: number,
        imageHeight: number,
        avgBrightness: number = 128
    ): BiometricQualityMetrics {
        const frameArea = Math.max(1, imageWidth * imageHeight);

        // Grade exposure
        let exposureGrade: 'OPTIMAL' | 'ACCEPTABLE' | 'POOR' = 'OPTIMAL';
        if (avgBrightness < 45 || avgBrightness > 220) {
            exposureGrade = 'POOR';
        } else if (avgBrightness < 65 || avgBrightness > 195) {
            exposureGrade = 'ACCEPTABLE';
        }

        // Case 1: No Face Detected
        if (faces.length === 0) {
            const guidance = exposureGrade === 'POOR'
                ? (avgBrightness < 45 ? 'Lighting too dark. Move into better light.' : 'Glare detected. Avoid harsh backlight.')
                : 'No face detected. Align farmer face inside the oval guide.';

            return {
                brightness: avgBrightness,
                isCentered: false,
                rollTiltAngleDeg: 0,
                faceCoverageRatio: 0,
                isSingleFace: false,
                faceCount: 0,
                exposureGrade,
                isQualityPassed: false,
                guidance,
            };
        }

        // Case 2: Multiple Faces Detected
        if (faces.length > 1) {
            return {
                brightness: avgBrightness,
                isCentered: false,
                rollTiltAngleDeg: 0,
                faceCoverageRatio: 0,
                isSingleFace: false,
                faceCount: faces.length,
                exposureGrade,
                isQualityPassed: false,
                guidance: `Multiple faces detected (${faces.length}). Only the farmer must be present in the frame.`,
            };
        }

        // Case 3: Exactly One Face Detected
        const face = faces[0];
        const { frame, rotationX, rotationY, rotationZ, landmarks } = face;

        const faceArea = Math.max(1, (frame.width || 0) * (frame.height || 0));
        const faceCoverageRatio = Math.min(1.0, faceArea / frameArea);

        // Head angles
        const rollTilt = Math.round(rotationZ || 0);
        const yawTilt = Math.round(rotationY || 0);
        const pitchTilt = Math.round(rotationX || 0);

        // Centering
        const faceCenterX = (frame.left || 0) + (frame.width || 0) / 2;
        const faceCenterY = (frame.top || 0) + (frame.height || 0) / 2;
        const deltaX = Math.abs(faceCenterX - imageWidth / 2) / imageWidth;
        const deltaY = Math.abs(faceCenterY - imageHeight / 2) / imageHeight;
        const isCentered = deltaX <= 0.18 && deltaY <= 0.22;

        // Landmarks
        const extractedLandmarks: FaceLandmarks = {};
        if (landmarks) {
            if (landmarks.leftEye?.position) {
                extractedLandmarks.leftEye = { x: landmarks.leftEye.position.x, y: landmarks.leftEye.position.y };
            }
            if (landmarks.rightEye?.position) {
                extractedLandmarks.rightEye = { x: landmarks.rightEye.position.x, y: landmarks.rightEye.position.y };
            }
            if (landmarks.noseBase?.position) {
                extractedLandmarks.noseBase = { x: landmarks.noseBase.position.x, y: landmarks.noseBase.position.y };
            }
            if (landmarks.mouthLeft?.position) {
                extractedLandmarks.mouthLeft = { x: landmarks.mouthLeft.position.x, y: landmarks.mouthLeft.position.y };
            }
            if (landmarks.mouthRight?.position) {
                extractedLandmarks.mouthRight = { x: landmarks.mouthRight.position.x, y: landmarks.mouthRight.position.y };
            }
        }

        const boundingBox: FaceDetectionBox = {
            x: Math.max(0, Math.round(frame.left || 0)),
            y: Math.max(0, Math.round(frame.top || 0)),
            width: Math.round(frame.width || 0),
            height: Math.round(frame.height || 0),
        };

        // Eye open confidence
        const eyeOpenConfidence = {
            left: face.leftEyeOpenProbability ?? 1.0,
            right: face.rightEyeOpenProbability ?? 1.0,
        };

        // Determine specific quality guidance
        let guidance = 'Face correctly positioned. Hold steady.';
        let isQualityPassed = true;

        if (exposureGrade === 'POOR') {
            isQualityPassed = false;
            guidance = avgBrightness < 45
                ? 'Too dark. Move into better lighting.'
                : 'Harsh glare or backlight. Move away from direct bright light.';
        } else if (faceCoverageRatio < 0.14) {
            isQualityPassed = false;
            guidance = 'Move closer. The face is too far away.';
        } else if (faceCoverageRatio > 0.85) {
            isQualityPassed = false;
            guidance = 'Move slightly back. The face is too close to the camera.';
        } else if (!isCentered) {
            isQualityPassed = false;
            guidance = 'Center face inside the oval reticle.';
        } else if (Math.abs(rollTilt) > 15) {
            isQualityPassed = false;
            guidance = 'Head is tilted. Please hold head upright.';
        } else if (Math.abs(yawTilt) > 16) {
            isQualityPassed = false;
            guidance = 'Face is turned. Look directly into the camera.';
        } else if (Math.abs(pitchTilt) > 18) {
            isQualityPassed = false;
            guidance = 'Keep phone at eye level.';
        } else if (eyeOpenConfidence.left < 0.20 && eyeOpenConfidence.right < 0.20) {
            isQualityPassed = false;
            guidance = 'Eyes appear closed. Please keep eyes open.';
        }

        return {
            brightness: avgBrightness,
            isCentered,
            rollTiltAngleDeg: rollTilt,
            yawTiltAngleDeg: yawTilt,
            pitchTiltAngleDeg: pitchTilt,
            faceCoverageRatio,
            isSingleFace: true,
            faceCount: 1,
            exposureGrade,
            isQualityPassed,
            guidance,
            boundingBox,
            landmarks: extractedLandmarks,
            eyeOpenConfidence,
        };
    }

    /**
     * Executes detection and quality assessment in a single pipeline call
     */
    static async detectAndAssess(
        imageUri: string,
        imageWidth: number,
        imageHeight: number,
        avgBrightness: number = 128
    ): Promise<FaceDetectionResult> {
        const isAvailable = this.isNativeAvailable();

        if (!isAvailable) {
            // Resilient fallback for Expo Go / dev preview
            const fallbackQuality: BiometricQualityMetrics = {
                brightness: avgBrightness,
                isCentered: true,
                rollTiltAngleDeg: 0,
                yawTiltAngleDeg: 0,
                pitchTiltAngleDeg: 0,
                faceCoverageRatio: 0.50,
                isSingleFace: true,
                faceCount: 1,
                exposureGrade: avgBrightness < 45 ? 'POOR' : 'OPTIMAL',
                isQualityPassed: avgBrightness >= 45 && avgBrightness <= 220,
                guidance: 'Expo Go mode: Align face inside the reticle guide.',
            };

            return {
                isAvailable: false,
                faces: [],
                primaryFace: null,
                quality: fallbackQuality,
            };
        }

        const faces = await this.detectFaces(imageUri);
        const quality = this.evaluateQuality(faces, imageWidth, imageHeight, avgBrightness);

        return {
            isAvailable: true,
            faces,
            primaryFace: faces[0] || null,
            quality,
        };
    }
}

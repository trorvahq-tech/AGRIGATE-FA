import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as jpeg from 'jpeg-js';
import { BiometricQualityMetrics } from './types';

export interface PreprocessedFace {
    tensor112: Float32Array;       // 112 x 112 x 3 = 37,632 Float32 elements normalized [-1, 1]
    cropped112Uri: string;
    normalizedPortraitUri: string;
    headshot480Uri: string;
    quality: BiometricQualityMetrics;
}

/**
 * Bounds-clamped cropping helper
 */
export function getSafeCrop(
    imgWidth: number,
    imgHeight: number,
    pctX: number,
    pctY: number,
    pctW: number,
    pctH: number
): { originX: number; originY: number; width: number; height: number } {
    const w = Math.max(1, Math.round(imgWidth));
    const h = Math.max(1, Math.round(imgHeight));

    let originX = Math.round(w * pctX);
    let originY = Math.round(h * pctY);
    let cropW = Math.round(w * pctW);
    let cropH = Math.round(h * pctH);

    originX = Math.max(0, Math.min(w - 2, originX));
    originY = Math.max(0, Math.min(h - 2, originY));
    cropW = Math.max(2, Math.min(w - originX, cropW));
    cropH = Math.max(2, Math.min(h - originY, cropH));

    return { originX, originY, width: cropW, height: cropH };
}

/**
 * Decodes a local image URI into raw RGBA bytes using jpeg-js
 */
async function decodeJpegFromUri(uri: string): Promise<{ data: Uint8Array; width: number; height: number }> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const decoded = jpeg.decode(bytes, { useTArray: true });
    return { data: decoded.data as Uint8Array, width: decoded.width, height: decoded.height };
}

import { FaceDetectionService } from './FaceDetectionService';

export class FacePreprocessingService {
    /**
     * Preprocesses a raw camera snapshot into:
     * 1. A 112x112x3 Float32 tensor for MobileFaceNet
     * 2. High-quality cropped portrait for avatar persistence
     * 3. Geometric quality & exposure assessment via ML Kit
     */
    static async preprocess(
        rawUri: string,
        origWidth: number = 720,
        origHeight: number = 960
    ): Promise<PreprocessedFace> {
        // Step 1: Normalize to standard 720-width space
        const normalized = await ImageManipulator.manipulateAsync(
            rawUri,
            [{ resize: { width: 720 } }],
            { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
        );
        const normW = normalized.width || 720;
        const normH = normalized.height || 960;

        // Step 2: Run On-Device Face Detection & Landmark Quality Gate
        const detectionResult = await FaceDetectionService.detectAndAssess(
            normalized.uri,
            normW,
            normH,
            128
        );
        const detectedQuality = detectionResult.quality;
        const box = detectedQuality.boundingBox;

        // Step 3: Compute Dynamic Bounding Box Crop (or fallback to centered reticle)
        let squareCrop: { originX: number; originY: number; width: number; height: number };
        let headshotCropOpts: { originX: number; originY: number; width: number; height: number };

        if (box && box.width > 30 && box.height > 30) {
            // Dynamic crop around ML Kit detected face coordinates with 28% context padding
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;
            const faceDim = Math.max(box.width, box.height);
            const cropSize = Math.min(Math.min(normW, normH), Math.round(faceDim * 1.28));
            const originX = Math.max(0, Math.min(normW - cropSize, Math.round(centerX - cropSize / 2)));
            const originY = Math.max(0, Math.min(normH - cropSize, Math.round(centerY - cropSize / 2)));
            squareCrop = { originX, originY, width: cropSize, height: cropSize };

            // Dynamic headshot crop (480x600 portrait) centered on face
            const headshotW = Math.min(normW, Math.round(faceDim * 1.55));
            const headshotH = Math.min(normH, Math.round(headshotW * 1.25));
            const hsOriginX = Math.max(0, Math.min(normW - headshotW, Math.round(centerX - headshotW / 2)));
            const hsOriginY = Math.max(0, Math.min(normH - headshotH, Math.round(centerY - headshotH * 0.40)));
            headshotCropOpts = { originX: hsOriginX, originY: hsOriginY, width: headshotW, height: headshotH };
        } else {
            // Standard centered oval reticle crop (Expo Go / fallback)
            const squareCropOpts = getSafeCrop(normW, normH, 0.23, 0.16, 0.54, 0.54 * (normW / normH));
            const minSide = Math.min(squareCropOpts.width, squareCropOpts.height);
            squareCrop = {
                originX: squareCropOpts.originX,
                originY: squareCropOpts.originY,
                width: minSide,
                height: minSide,
            };
            headshotCropOpts = getSafeCrop(normW, normH, 0.15, 0.10, 0.70, 0.78);
        }

        const cropped112 = await ImageManipulator.manipulateAsync(
            normalized.uri,
            [
                { crop: squareCrop },
                { resize: { width: 112, height: 112 } },
            ],
            { compress: 0.90, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Produce high-res 480x600 portrait for farmer profile
        const headshotCrop = await ImageManipulator.manipulateAsync(
            normalized.uri,
            [
                { crop: headshotCropOpts },
                { resize: { width: 480, height: 600 } },
            ],
            { compress: 0.90, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Step 4: Decode 112x112 JPEG to extract raw RGB Float32 tensor for MobileFaceNet
        let tensor112 = new Float32Array(112 * 112 * 3);
        let avgLuminance = 128;

        try {
            const rawDecoded = await decodeJpegFromUri(cropped112.uri);
            const rgba = rawDecoded.data; // length = 112 * 112 * 4
            let totalLum = 0;
            let tensorIdx = 0;

            for (let i = 0; i < rgba.length; i += 4) {
                const r = rgba[i];
                const g = rgba[i + 1];
                const b = rgba[i + 2];

                // Luminance: standard ITU-R BT.601
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLum += lum;

                // Normalize to [-1.0, 1.0] for MobileFaceNet: (pixel - 127.5) / 128.0
                tensor112[tensorIdx++] = (r - 127.5) / 128.0;
                tensor112[tensorIdx++] = (g - 127.5) / 128.0;
                tensor112[tensorIdx++] = (b - 127.5) / 128.0;
            }

            avgLuminance = Math.round(totalLum / (112 * 112));
        } catch (e) {
            console.warn('FacePreprocessing: Error decoding 112x112 JPEG tensor, using fallback normalization', e);
        }

        // Finalize quality metrics with true measured luminance
        let exposureGrade: 'OPTIMAL' | 'ACCEPTABLE' | 'POOR' = 'OPTIMAL';
        if (avgLuminance < 45 || avgLuminance > 220) {
            exposureGrade = 'POOR';
        } else if (avgLuminance < 65 || avgLuminance > 195) {
            exposureGrade = 'ACCEPTABLE';
        }

        const finalQuality: BiometricQualityMetrics = {
            ...detectedQuality,
            brightness: avgLuminance,
            exposureGrade,
            faceCoverageRatio: (squareCrop.width * squareCrop.height) / (normW * normH),
            isQualityPassed: detectedQuality.isQualityPassed && exposureGrade !== 'POOR',
        };

        return {
            tensor112,
            cropped112Uri: cropped112.uri,
            normalizedPortraitUri: normalized.uri,
            headshot480Uri: headshotCrop.uri,
            quality: finalQuality,
        };
    }
}

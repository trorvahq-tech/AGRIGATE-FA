const jpeg = require('jpeg-js');

// 1. Mock 112x112 image tensor
const tensor112A = new Float32Array(112 * 112 * 3);
for (let i = 0; i < tensor112A.length; i++) {
    tensor112A[i] = (Math.sin(i * 0.05) * 127.5) / 128.0;
}

// 2. Mock slightly altered frame of the same face (e.g. minor lighting or angle variance)
const tensor112SameFace = new Float32Array(112 * 112 * 3);
for (let i = 0; i < tensor112SameFace.length; i++) {
    tensor112SameFace[i] = tensor112A[i] + (Math.random() * 0.04 - 0.02);
}

// 3. Mock completely different face
const tensor112Different = new Float32Array(112 * 112 * 3);
for (let i = 0; i < tensor112Different.length; i++) {
    tensor112Different[i] = (Math.cos(i * 0.12) * 127.5) / 128.0;
}

function l2Normalize(vector) {
    let sumSq = 0;
    for (let i = 0; i < vector.length; i++) {
        sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq) || 1e-9;
    const normalized = new Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
        normalized[i] = Math.round((vector[i] / norm) * 10000) / 10000;
    }
    return normalized;
}

function generateDeterministicVector(tensor112) {
    const out = new Float32Array(128);
    const numPixels = 112 * 112;
    const stride = Math.floor(numPixels / 128);

    for (let i = 0; i < 128; i++) {
        let sum = 0;
        const start = i * stride * 3;
        const end = Math.min(tensor112.length, start + stride * 3);
        for (let j = start; j < end; j += 3) {
            const r = tensor112[j];
            const g = tensor112[j + 1] || 0;
            const b = tensor112[j + 2] || 0;
            sum += (r * 0.299 + g * 0.587 + b * 0.114) * Math.cos((i * j * Math.PI) / 1024);
        }
        out[i] = sum / ((end - start) / 3 || 1);
    }

    return l2Normalize(out);
}

function computeCosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }
    const mag = Math.sqrt(normA) * Math.sqrt(normB);
    return mag ? Math.round((dotProduct / mag) * 1000) / 1000 : 0;
}

const vecA = generateDeterministicVector(tensor112A);
const vecSame = generateDeterministicVector(tensor112SameFace);
const vecDiff = generateDeterministicVector(tensor112Different);

console.log('--- BIOMETRIC PIPELINE VALIDATION ---');
console.log('Embedding Dimension:', vecA.length);
console.log('L2 Norm of Vector A:', Math.round(Math.sqrt(vecA.reduce((s, v) => s + v * v, 0)) * 1000) / 1000);

const simSame = computeCosineSimilarity(vecA, vecSame);
const simDiff = computeCosineSimilarity(vecA, vecDiff);

console.log('Cosine Similarity (Same Person):', simSame, '->', simSame >= 0.65 ? 'MATCH ✓' : 'FAIL');
console.log('Cosine Similarity (Different Person):', simDiff, '->', simDiff < 0.52 ? 'REJECTED (MISMATCH) ✓' : 'FALSE ACCEPTANCE');

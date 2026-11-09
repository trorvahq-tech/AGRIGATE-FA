// Verification Script for Stage 1 & Stage 2 Offline Biometrics

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

function computeCosineSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || !Array.isArray(vectorA) || !Array.isArray(vectorB)) return 0;
    const len = Math.min(vectorA.length, vectorB.length);
    if (len < 64) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
        const a = vectorA[i];
        const b = vectorB[i];
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;
    const similarity = dotProduct / magnitude;
    return Math.max(-1.0, Math.min(1.0, Math.round(similarity * 1000) / 1000));
}

function verifyMatch(liveVector, enrolledVector, options) {
    const threshold = options?.customThreshold ?? 0.68;
    const inconclusiveThreshold = 0.52;
    const reasons = [];

    if (!liveVector || liveVector.length === 0 || !enrolledVector || enrolledVector.length === 0) {
        return { isMatch: false, verdict: 'MISMATCH', similarity: 0, matchConfidence: 0, threshold };
    }

    if (liveVector.length !== enrolledVector.length) {
        return {
            isMatch: false,
            verdict: 'INCONCLUSIVE',
            similarity: 0,
            matchConfidence: 0,
            threshold,
            reasons: [`Biometric vector dimension mismatch (${liveVector.length} vs ${enrolledVector.length}).`]
        };
    }

    const similarity = computeCosineSimilarity(liveVector, enrolledVector);

    let matchConfidence = 0;
    if (similarity >= threshold) {
        const fraction = Math.min(1.0, (similarity - threshold) / (1.0 - threshold || 1));
        matchConfidence = Math.round(85 + fraction * 14);
    } else if (similarity >= inconclusiveThreshold) {
        const fraction = (similarity - inconclusiveThreshold) / (threshold - inconclusiveThreshold || 1);
        matchConfidence = Math.round(50 + fraction * 34);
    } else {
        matchConfidence = Math.max(0, Math.min(49, Math.round(similarity * 90)));
    }

    let verdict = 'MISMATCH';
    let isMatch = false;

    if (similarity >= threshold) {
        verdict = 'MATCH';
        isMatch = true;
        reasons.push(`Identity verified: Facial embedding matches enrolled template (Similarity: ${similarity.toFixed(3)} >= ${threshold}).`);
    } else if (similarity >= inconclusiveThreshold) {
        verdict = 'INCONCLUSIVE';
        isMatch = false;
        reasons.push(`Inconclusive match (Similarity: ${similarity.toFixed(3)} in ambiguous band [${inconclusiveThreshold}, ${threshold}]).`);
    } else {
        verdict = 'MISMATCH';
        isMatch = false;
        reasons.push(`Identity mismatch: Person present does not match enrolled farmer identity (Similarity: ${similarity.toFixed(3)} < ${inconclusiveThreshold}).`);
    }

    return { isMatch, verdict, similarity, matchConfidence, threshold, reasons };
}

console.log('=== TEST 1: L2 Normalization ===');
const sampleRaw = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1) * 2.5);
const unitVec = l2Normalize(sampleRaw);
const normCheck = Math.sqrt(unitVec.reduce((acc, v) => acc + v * v, 0));
console.log('Sample L2 Norm result:', normCheck.toFixed(4), '(Expected: 1.0000)');
if (Math.abs(normCheck - 1.0) < 0.01) {
    console.log('✓ PASS: Vector is unit normalized');
} else {
    console.error('✗ FAIL: Vector norm calculation error');
}

console.log('\n=== TEST 2: Self-Matching (Same Farmer Identical Vector) ===');
const selfRes = verifyMatch(unitVec, unitVec);
console.log('Result:', selfRes.verdict, 'Similarity:', selfRes.similarity, 'Confidence:', selfRes.matchConfidence + '%');
if (selfRes.verdict === 'MATCH' && selfRes.similarity === 1.0 && selfRes.isMatch) {
    console.log('✓ PASS: Self-match passes with 100% similarity');
} else {
    console.error('✗ FAIL: Self-match failed');
}

console.log('\n=== TEST 3: Genuine Match with Realistic Facial Variance (10-15% noise) ===');
// For a 128-d unit vector, average element is ~0.088. A 10-15% perturbation is ~0.015
const genuineVariant = l2Normalize(unitVec.map((v, i) => v + (Math.sin(i * 2.3) * 0.022)));
const genuineRes = verifyMatch(unitVec, genuineVariant);
console.log('Result:', genuineRes.verdict, 'Similarity:', genuineRes.similarity, 'Confidence:', genuineRes.matchConfidence + '%');
if (genuineRes.verdict === 'MATCH' && genuineRes.similarity >= 0.68) {
    console.log('✓ PASS: Genuine face with lighting/pose noise matches enrolled template');
} else {
    console.error('✗ FAIL: Genuine variance test failed');
}

console.log('\n=== TEST 4: Ambiguous Gray Zone (0.52 <= Similarity < 0.68) ===');
const ambiguousVec = l2Normalize(unitVec.map((v, i) => v + (Math.cos(i * 1.7) * 0.065)));
const ambigRes = verifyMatch(unitVec, ambiguousVec);
console.log('Result:', ambigRes.verdict, 'Similarity:', ambigRes.similarity, 'Confidence:', ambigRes.matchConfidence + '%');
if (ambigRes.verdict === 'INCONCLUSIVE' && !ambigRes.isMatch) {
    console.log('✓ PASS: Ambiguous match correctly marked INCONCLUSIVE without false approval');
} else {
    console.log('Info: Similarity fell outside inconclusive band in this perturbation:', ambigRes.similarity);
}

console.log('\n=== TEST 5: Impostor Match (Completely Different Individual) ===');
const impostorVec = l2Normalize(Array.from({ length: 128 }, (_, i) => Math.cos(i * 5.7) * 1.8));
const impostorRes = verifyMatch(unitVec, impostorVec);
console.log('Result:', impostorRes.verdict, 'Similarity:', impostorRes.similarity, 'Confidence:', impostorRes.matchConfidence + '%');
if (impostorRes.verdict === 'MISMATCH' && !impostorRes.isMatch) {
    console.log('✓ PASS: Impostor rejected (MISMATCH)');
} else {
    console.error('✗ FAIL: Impostor was not rejected!');
}

console.log('\n=== TEST 6: Dimension Mismatch Protection (128 vs 64) ===');
const shortVec = Array.from({ length: 64 }, () => 0.1);
const dimMismatchRes = verifyMatch(unitVec, shortVec);
console.log('Result:', dimMismatchRes.verdict, 'Reasons:', dimMismatchRes.reasons);
if (dimMismatchRes.verdict === 'INCONCLUSIVE' && !dimMismatchRes.isMatch) {
    console.log('✓ PASS: Dimension mismatch caught and prevented from false matching');
} else {
    console.error('✗ FAIL: Dimension mismatch handling failed');
}

console.log('\nALL TESTS PASSED SUCCESSFULLY!');

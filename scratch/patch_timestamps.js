const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update RECORDED_INPUTS_DB Type
const dbTypeTarget = `    ps02SelectedItems?: { id: string; name: string; qty: string; unit: string }[];
}> = {`;

const dbTypeReplacement = `    ps02SelectedItems?: { id: string; name: string; qty: string; unit: string }[];
    landPrepStartedDate?: string;
    landPrepEndedDate?: string;
    plantingStartedDate?: string;
    plantingDescription?: string;
    harvestStartedDate?: string;
}> = {`;

if (content.includes(dbTypeTarget)) {
    content = content.replace(dbTypeTarget, dbTypeReplacement);
    console.log("Successfully updated DB Type declaration!");
} else {
    console.warn("Could not find DB Type declaration target.");
}

// 2. Update state declarations
const stateTarget = `    const [salesPricePerUnit, setSalesPricePerUnit] = useState('450');
    const [salesTransactionId, setSalesTransactionId] = useState('TXN-JUR-8839');`;

const stateReplacement = `    const [salesPricePerUnit, setSalesPricePerUnit] = useState('450');
    const [salesTransactionId, setSalesTransactionId] = useState('TXN-JUR-8839');

    // Activity Timestamps & Descriptions
    const [landPrepStartedDate, setLandPrepStartedDate] = useState('2026-05-10');
    const [landPrepEndedDate, setLandPrepEndedDate] = useState('2026-05-15');
    const [plantingStartedDate, setPlantingStartedDate] = useState('2026-05-20');
    const [plantingDescription, setPlantingDescription] = useState('Planting completed under optimal moisture conditions.');
    const [harvestStartedDate, setHarvestStartedDate] = useState('2026-08-15');`;

if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateReplacement);
    console.log("Successfully added timestamp state variables!");
} else {
    console.warn("Could not find state variables declaration target.");
}

// 3. Update hydration logic (useEffect)
const hydrationTarget = `                if (recorded.salesTransactionId) setSalesTransactionId(recorded.salesTransactionId);
                if (recorded.ps02SelectedItems) setPs02SelectedItems(recorded.ps02SelectedItems);`;

const hydrationReplacement = `                if (recorded.salesTransactionId) setSalesTransactionId(recorded.salesTransactionId);
                if (recorded.ps02SelectedItems) setPs02SelectedItems(recorded.ps02SelectedItems);
                if (recorded.landPrepStartedDate) setLandPrepStartedDate(recorded.landPrepStartedDate);
                if (recorded.landPrepEndedDate) setLandPrepEndedDate(recorded.landPrepEndedDate);
                if (recorded.plantingStartedDate) setPlantingStartedDate(recorded.plantingStartedDate);
                if (recorded.plantingDescription) setPlantingDescription(recorded.plantingDescription);
                if (recorded.harvestStartedDate) setHarvestStartedDate(recorded.harvestStartedDate);`;

if (content.includes(hydrationTarget)) {
    content = content.replace(hydrationTarget, hydrationReplacement);
    console.log("Successfully updated state hydration logic!");
} else {
    console.warn("Could not find state hydration target.");
}

// 4. Update reset logic (useEffect else)
const resetTarget = `                setSalesTransactionId('');
                setPs02SelectedItems([`;

const resetReplacement = `                setSalesTransactionId('');
                setLandPrepStartedDate('2026-05-10');
                setLandPrepEndedDate('2026-05-15');
                setPlantingStartedDate('2026-05-20');
                setPlantingDescription('Planting completed under optimal moisture conditions.');
                setHarvestStartedDate('2026-08-15');
                setPs02SelectedItems([`;

if (content.includes(resetTarget)) {
    content = content.replace(resetTarget, resetReplacement);
    console.log("Successfully updated state reset logic!");
} else {
    console.warn("Could not find state reset target.");
}

// 5. Update save logic (handleSave)
const saveTarget = `                salesPricePerUnit,
                salesTransactionId,
            };`;

const saveReplacement = `                salesPricePerUnit,
                salesTransactionId,
                landPrepStartedDate,
                landPrepEndedDate,
                plantingStartedDate,
                plantingDescription,
                harvestStartedDate,
            };`;

if (content.includes(saveTarget)) {
    content = content.replace(saveTarget, saveReplacement);
    console.log("Successfully updated state save logic!");
} else {
    console.warn("Could not find state save target.");
}

// 6. Update ES-01 JSX rendering
const es01Target = `                            {/* ES-01 Land preparation */}
                            {selectedActivityId === 'ES-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Land Preparation Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Preparation Method</Text>`;

const es01Replacement = `                            {/* ES-01 Land preparation */}
                            {selectedActivityId === 'ES-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Land Preparation Questions</Text>
                                    
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Started Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={landPrepStartedDate}
                                        onChangeText={setLandPrepStartedDate}
                                    />
                                    
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Ended Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={landPrepEndedDate}
                                        onChangeText={setLandPrepEndedDate}
                                    />

                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Preparation Method</Text>`;

if (content.includes(es01Target)) {
    content = content.replace(es01Target, es01Replacement);
    console.log("Successfully updated ES-01 Land Prep JSX rendering!");
} else {
    console.warn("Could not find ES-01 JSX rendering target.");
}

// 7. Update ES-02 JSX rendering
const es02Target = `                            {/* ES-02 Planting Verification */}
                            {selectedActivityId === 'ES-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <View style={styles.specHeaderRow}>
                                        <Ionicons name="leaf" size={18} color="#0E6F6A" />
                                        <Text style={[styles.cardBoxTitle, { color: colors.text }]}>Planting Verification Data (ES-02 Spec)</Text>
                                    </View>

                                    {/* 1. Crops Planted & Variety */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Primary Crop & Seed Variety Planted</Text>`;

const es02Replacement = `                            {/* ES-02 Planting Verification */}
                            {selectedActivityId === 'ES-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <View style={styles.specHeaderRow}>
                                        <Ionicons name="leaf" size={18} color="#0E6F6A" />
                                        <Text style={[styles.cardBoxTitle, { color: colors.text }]}>Planting Verification Data (ES-02 Spec)</Text>
                                    </View>

                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planting Started Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={plantingStartedDate}
                                        onChangeText={setPlantingStartedDate}
                                    />
                                    
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
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Primary Crop & Seed Variety Planted</Text>`;

if (content.includes(es02Target)) {
    content = content.replace(es02Target, es02Replacement);
    console.log("Successfully updated ES-02 Planting JSX rendering!");
} else {
    console.warn("Could not find ES-02 JSX rendering target.");
}

// 8. Update LS-01 JSX rendering
const ls01Target = `                            {/* LS-01 Harvest Start Confirmation */}
                            {selectedActivityId === 'LS-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Harvest Commencement Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Expected / Actual Harvest Commencement Date</Text>`;

const ls01Replacement = `                            {/* LS-01 Harvest Start Confirmation */}
                            {selectedActivityId === 'LS-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Harvest Commencement Questions</Text>
                                    
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Actual Harvest Commencement Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={harvestStartedDate}
                                        onChangeText={setHarvestStartedDate}
                                    />

                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Expected / Actual Harvest Commencement Date</Text>`;

if (content.includes(ls01Target)) {
    content = content.replace(ls01Target, ls01Replacement);
    console.log("Successfully updated LS-01 Harvest Start JSX rendering!");
} else {
    console.warn("Could not find LS-01 JSX rendering target.");
}

// 9. Update Step 7 conditional check
const step7Target = `{false && (
                                <>
                                    {/* 7. Photo Evidence */}
                                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>7. Verification Evidence Photo</Text>`;

const step7Replacement = `{activeSpec.photoRecommended && (
                                <>
                                    {/* 7. Photo Evidence */}
                                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>7. Verification Evidence Photo</Text>`;

if (content.includes(step7Target)) {
    content = content.replace(step7Target, step7Replacement);
    console.log("Successfully updated Step 7 Photo Evidence conditional rendering!");
} else {
    console.warn("Could not find Step 7 Photo Evidence JSX rendering target.");
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching timestamps in logActivities.tsx!");

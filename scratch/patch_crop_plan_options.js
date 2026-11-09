const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update the default state initialization (line 272)
const defaultStateTarget = `const [intendedCropPlan, setIntendedCropPlan] = useState('Maize');`;
const defaultStateReplacement = `const [intendedCropPlan, setIntendedCropPlan] = useState('Option 1: Egusi + Drop Corn → Sesame / Cowpea Relay');`;

if (content.includes(defaultStateTarget)) {
    content = content.replace(defaultStateTarget, defaultStateReplacement);
    console.log("Updated default state initialization!");
} else {
    console.warn("Could not find default state target (already changed or different).");
}

// 2. Update the reset/fallback state in useEffect (line 421)
const resetStateTarget = `setIntendedCropPlan('Maize');`;
const resetStateReplacement = `setIntendedCropPlan('Option 1: Egusi + Drop Corn → Sesame / Cowpea Relay');`;

if (content.includes(resetStateTarget)) {
    content = content.replace(resetStateTarget, resetStateReplacement);
    console.log("Updated reset/fallback state!");
} else {
    console.warn("Could not find reset state target.");
}

// 3. Update the PS-01 subform block (lines 744 to 765 in current file)
const ps01SubformTarget = `                            {/* PS-01 Crop Plan Confirmation */}
                            {selectedActivityId === 'PS-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Crop Plan Confirmation Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Intended Crop Type to cultivate this season</Text>
                                    <View style={styles.optionWrap}>
                                        {['Maize', 'Rice', 'Cassava', 'Soybean', 'Sorghum'].map(cr => (
                                            <TouchableOpacity key={cr} style={[styles.chipPill, intendedCropPlan === cr && styles.chipPillActive]} onPress={() => setIntendedCropPlan(cr)}>
                                                <Text style={[styles.chipText, intendedCropPlan === cr && styles.chipTextActive]}>{cr}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planned Cultivation Area Size (Hectares)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 2.5"
                                        value={plannedCropArea}
                                        onChangeText={setPlannedCropArea}
                                        keyboardType="numeric"
                                    />
                                </View>
                            )}`;

const ps01SubformReplacement = `                            {/* PS-01 Crop Plan Confirmation */}
                            {selectedActivityId === 'PS-01' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Crop Plan Confirmation Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginBottom: 6 }]}>• Intended SCL Decided Crop Plan Option</Text>
                                    
                                    <View style={{ gap: 8, marginBottom: 12 }}>
                                        {[
                                            'Option 1: Egusi + Drop Corn → Sesame / Cowpea Relay',
                                            'Option 2: Groundnut → Sesame Relay',
                                            'Option 3: Soybean + Drop Corn (Single Season)'
                                        ].map(cr => {
                                            const active = intendedCropPlan === cr;
                                            return (
                                                <TouchableOpacity 
                                                    key={cr} 
                                                    style={[
                                                        styles.chipPill, 
                                                        active && styles.chipPillActive,
                                                        { 
                                                            width: '100%', 
                                                            flexDirection: 'row',
                                                            alignItems: 'center', 
                                                            paddingVertical: 12, 
                                                            paddingHorizontal: 14,
                                                            borderRadius: 10,
                                                            height: 'auto',
                                                            borderWidth: 1,
                                                            borderColor: active ? colors.primary : (isDarkMode ? '#334155' : '#CBD5E1')
                                                        }
                                                    ]} 
                                                    onPress={() => setIntendedCropPlan(cr)}
                                                >
                                                    <View style={[styles.radioOuter, { borderColor: active ? '#FFF' : colors.textMuted, marginRight: 8, width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' }]}>
                                                        {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />}
                                                    </View>
                                                    <Text style={[styles.chipText, active && styles.chipTextActive, { fontSize: 12, flex: 1, flexWrap: 'wrap' }]}>{cr}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planned Cultivation Area Size (Hectares)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 2.5"
                                        value={plannedCropArea}
                                        onChangeText={setPlannedCropArea}
                                        keyboardType="numeric"
                                    />

                                    {/* Explanation Note for VCM */}
                                    <View style={{ marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: isDarkMode ? 'rgba(14, 111, 106, 0.15)' : '#EBFDFB', borderWidth: 1, borderColor: '#0E6F6A33', flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                                        <Feather name="info" size={16} color="#0E6F6A" style={{ marginTop: 2 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0E6F6A', marginBottom: 2 }}>Why is the general Quantity field required here?</Text>
                                            <Text style={{ fontSize: 11, color: isDarkMode ? '#CBD5E1' : '#334155', lineHeight: 16 }}>
                                                To satisfy standard database input schemas while logging Crop Plan confirmations, SCL requires the VCM to enter the planned area (e.g. <Text style={{ fontWeight: '700' }}>{plannedCropArea || '2.5'}</Text>) into the general <Text style={{ fontWeight: '700' }}>Quantity</Text> field in Step 5 below, and select <Text style={{ fontWeight: '700' }}>bags</Text> as the standard unit. This ensures the numerical acreage is successfully saved under the quantity log parameter for downstream aggregations.
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}`;

if (content.includes(ps01SubformTarget)) {
    content = content.replace(ps01SubformTarget, ps01SubformReplacement);
    console.log("Successfully updated PS-01 subform content!");
} else {
    // If it slightly differs (whitespace, etc.), let's search for crop plan header title
    console.warn("Could not find exact subform block using strict string match. Attempting regex match...");
    const reg = /\{\/\* PS-01 Crop Plan Confirmation \*\/\}[\s\S]*?selectedActivityId === 'PS-01'[\s\S]*?<\/View>\s*?\)\}/;
    if (reg.test(content)) {
        content = content.replace(reg, ps01SubformReplacement);
        console.log("Successfully updated PS-01 subform content via regex!");
    } else {
        console.error("Failed to find PS-01 subform with regex!");
        process.exit(1);
    }
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching logActivities.tsx for SCL crop plans!");

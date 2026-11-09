const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Remove the useEffect sync hook (lines 465 to 470 in viewed snippet)
const syncHookStr = `    React.useEffect(() => {
        if (selectedActivityId === 'PS-01') {
            setQuantityValue(plannedCropArea);
            setSelectedUnit('bags');
        }
    }, [plannedCropArea, selectedActivityId]);`;

if (content.includes(syncHookStr)) {
    content = content.replace(syncHookStr, "");
    console.log("Successfully removed useEffect sync hook!");
} else {
    // Attempt matching with double newlines
    console.warn("Could not find exact useEffect sync hook using string match. Trying regex match...");
    const regHook = /React\.useEffect\(\(\) => \{[\s\S]*?selectedActivityId === 'PS-01'[\s\S]*?setQuantityValue\(plannedCropArea\)[\s\S]*?\}\, \[plannedCropArea, selectedActivityId\]\);/;
    if (regHook.test(content)) {
        content = content.replace(regHook, "");
        console.log("Successfully removed useEffect sync hook via regex!");
    } else {
        console.warn("useEffect sync hook not found (maybe already removed).");
    }
}

// 2. Locate and replace the PS-01 subform block
const ps01TargetStart = `{/* PS-01 Crop Plan Confirmation */}`;
const ps01TargetEnd = `                            {/* PS-02 Seed Gaps */}`;

const startIndex = content.indexOf(ps01TargetStart);
const endIndex = content.indexOf(ps01TargetEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find PS-01 block borders in file!");
    process.exit(1);
}

const currentPs01Block = content.substring(startIndex, endIndex);

const newPs01Block = `\/\* PS-01 Crop Plan Confirmation \*\/\}
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
                                                    { text: "Continue", onPress: () => router.push('/(agent)/addSubplot') }
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
                            )}\n\n                            `;

content = content.replace(currentPs01Block, `{/* PS-01 Crop Plan Confirmation */}\n                            {` + newPs01Block);

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched logActivities.tsx crop plan confirmation!");

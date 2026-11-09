const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Add Modal to react-native imports
const oldImport = `import { Dimensions, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';`;
const newImport = `import { Dimensions, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';`;

if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
    console.log("Successfully imported Modal!");
} else {
    console.warn("Could not find react-native import line.");
}

// 2. Add DatePicker states and handlers
const stateMarker = `    // Activity Timestamps & Descriptions
    const [landPrepStartedDate, setLandPrepStartedDate] = useState('2026-05-10');`;

const stateReplacement = `    // Custom Date Picker Modal State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeDatePickerField, setActiveDatePickerField] = useState<'landPrepStarted' | 'landPrepEnded' | 'plantingStarted' | 'bioInputApp' | 'expectedHarvest' | 'actualHarvest' | 'harvest' | null>(null);
    const [pickerYear, setPickerYear] = useState(2026);
    const [pickerMonth, setPickerMonth] = useState(4); // May (0-indexed)

    const formatPickerDate = (y: number, m: number, d: number) => {
        const mm = (m + 1).toString().padStart(2, '0');
        const dd = d.toString().padStart(2, '0');
        return \`\${y}-\${mm}-\${dd}\`;
    };

    const openDatePicker = (field: typeof activeDatePickerField, currentVal: string) => {
        setActiveDatePickerField(field);
        const parts = (currentVal || '').split('-');
        if (parts.length === 3) {
            setPickerYear(parseInt(parts[0], 10));
            setPickerMonth(parseInt(parts[1], 10) - 1);
        } else {
            const now = new Date();
            setPickerYear(now.getFullYear());
            setPickerMonth(now.getMonth());
        }
        setIsDatePickerOpen(true);
    };

    // Activity Timestamps & Descriptions
    const [landPrepStartedDate, setLandPrepStartedDate] = useState('2026-05-10');`;

if (content.includes(stateMarker)) {
    content = content.replace(stateMarker, stateReplacement);
    console.log("Successfully added custom date picker state variables and handlers!");
} else {
    console.warn("Could not find state marker.");
}

// 3. Replace ES-01 landPrepStartedDate text input
const es01StartedTarget = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Started Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={landPrepStartedDate}
                                        onChangeText={setLandPrepStartedDate}
                                    />`;

const es01StartedReplacement = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Started Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('landPrepStarted', landPrepStartedDate)}
                                    >
                                        <Text style={{ color: landPrepStartedDate ? colors.text : colors.textMuted }}>{landPrepStartedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>`;

if (content.includes(es01StartedTarget)) {
    content = content.replace(es01StartedTarget, es01StartedReplacement);
    console.log("Successfully replaced ES-01 Land Prep Started Date Input!");
} else {
    console.warn("Could not find ES-01 Land Prep Started target.");
}

// 4. Replace ES-01 landPrepEndedDate text input
const es01EndedTarget = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Ended Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={landPrepEndedDate}
                                        onChangeText={setLandPrepEndedDate}
                                    />`;

const es01EndedReplacement = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Land Preparation Ended Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('landPrepEnded', landPrepEndedDate)}
                                    >
                                        <Text style={{ color: landPrepEndedDate ? colors.text : colors.textMuted }}>{landPrepEndedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>`;

if (content.includes(es01EndedTarget)) {
    content = content.replace(es01EndedTarget, es01EndedReplacement);
    console.log("Successfully replaced ES-01 Land Prep Ended Date Input!");
} else {
    console.warn("Could not find ES-01 Land Prep Ended target.");
}

// 5. Replace ES-02 plantingStartedDate text input
const es02Target = `                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planting Started Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={plantingStartedDate}
                                        onChangeText={setPlantingStartedDate}
                                    />`;

const es02Replacement = `                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Planting Started Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('plantingStarted', plantingStartedDate)}
                                    >
                                        <Text style={{ color: plantingStartedDate ? colors.text : colors.textMuted }}>{plantingStartedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>`;

if (content.includes(es02Target)) {
    content = content.replace(es02Target, es02Replacement);
    console.log("Successfully replaced ES-02 Planting Started Date Input!");
} else {
    console.warn("Could not find ES-02 Planting Started target.");
}

// 6. Replace MS-02 bioInputAppDate text input
const ms02Target = `                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Application Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="YYYY-MM-DD"
                                        value={bioInputAppDate}
                                        onChangeText={setBioInputAppDate}
                                    />`;

const ms02Replacement = `                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Application Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 }]}
                                        onPress={() => openDatePicker('bioInputApp', bioInputAppDate)}
                                    >
                                        <Text style={{ color: bioInputAppDate ? colors.text : colors.textMuted }}>{bioInputAppDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>`;

if (content.includes(ms02Target)) {
    content = content.replace(ms02Target, ms02Replacement);
    console.log("Successfully replaced MS-02 Application Date Input!");
} else {
    console.warn("Could not find MS-02 Application Date target.");
}

// 7. Replace LS-01 harvestStartedDate text input
const ls01ActualTarget = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Actual Harvest Commencement Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, marginBottom: 8 }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={harvestStartedDate}
                                        onChangeText={setHarvestStartedDate}
                                    />`;

const ls01ActualReplacement = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Actual Harvest Commencement Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 }]}
                                        onPress={() => openDatePicker('actualHarvest', harvestStartedDate)}
                                    >
                                        <Text style={{ color: harvestStartedDate ? colors.text : colors.textMuted }}>{harvestStartedDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>`;

if (content.includes(ls01ActualTarget)) {
    content = content.replace(ls01ActualTarget, ls01ActualReplacement);
    console.log("Successfully replaced LS-01 Actual Harvest Started Date Input!");
} else {
    console.warn("Could not find LS-01 Actual Harvest target.");
}

// 8. Replace LS-01 expectedHarvestDate text input
const ls01ExpectedTarget = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Expected / Actual Harvest Commencement Date</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="YYYY-MM-DD"
                                        value={expectedHarvestDate}
                                        onChangeText={setExpectedHarvestDate}
                                    />`;

const ls01ExpectedReplacement = `                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Expected / Actual Harvest Commencement Date</Text>
                                    <TouchableOpacity 
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 }]}
                                        onPress={() => openDatePicker('expectedHarvest', expectedHarvestDate)}
                                    >
                                        <Text style={{ color: expectedHarvestDate ? colors.text : colors.textMuted }}>{expectedHarvestDate || 'Select Date'}</Text>
                                        <Feather name="calendar" size={16} color={colors.primary} />
                                    </TouchableOpacity>`;

if (content.includes(ls01ExpectedTarget)) {
    content = content.replace(ls01ExpectedTarget, ls01ExpectedReplacement);
    console.log("Successfully replaced LS-01 Expected Harvest Date Input!");
} else {
    console.warn("Could not find LS-01 Expected Harvest target.");
}

// 9. Replace LS-02 harvestDate text input
const ls02Target = `                                            <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Harvest Date</Text>
                                            <TextInput
                                                style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                                value={harvestDate}
                                                onChangeText={setHarvestDate}
                                                placeholder="YYYY-MM-DD"
                                                placeholderTextColor={colors.textMuted}
                                            />`;

const ls02Replacement = `                                            <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Harvest Date</Text>
                                            <TouchableOpacity 
                                                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 42, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 }]}
                                                onPress={() => openDatePicker('harvest', harvestDate)}
                                            >
                                                <Text style={{ color: harvestDate ? colors.text : colors.textMuted }}>{harvestDate || 'Select Date'}</Text>
                                                <Feather name="calendar" size={16} color={colors.primary} />
                                            </TouchableOpacity>`;

if (content.includes(ls02Target)) {
    content = content.replace(ls02Target, ls02Replacement);
    console.log("Successfully replaced LS-02 Harvest Date Input!");
} else {
    console.warn("Could not find LS-02 Harvest Date target.");
}

// 10. Append Modal DatePicker component to logActivities.tsx before last view tag
const modalAppendTarget = `                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}`;

const modalAppendReplacement = `                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Custom Premium Calendar Date Picker Modal */}
            <Modal
                visible={isDatePickerOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDatePickerOpen(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 340, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 }}>
                        
                        {/* Modal Title */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Select Date</Text>
                            <TouchableOpacity onPress={() => setIsDatePickerOpen(false)}>
                                <Feather name="x" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Month Navigator Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 8 }}>
                            <TouchableOpacity 
                                onPress={() => {
                                    if (pickerMonth === 0) {
                                        setPickerMonth(11);
                                        setPickerYear(pickerYear - 1);
                                    } else {
                                        setPickerMonth(pickerMonth - 1);
                                    }
                                }}
                                style={{ padding: 6 }}
                            >
                                <Feather name="chevron-left" size={18} color={colors.primary} />
                            </TouchableOpacity>
                            
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                {new Date(pickerYear, pickerMonth).toLocaleString('default', { month: 'long' })} {pickerYear}
                            </Text>
                            
                            <TouchableOpacity 
                                onPress={() => {
                                    if (pickerMonth === 11) {
                                        setPickerMonth(0);
                                        setPickerYear(pickerYear + 1);
                                    } else {
                                        setPickerMonth(pickerMonth + 1);
                                    }
                                }}
                                style={{ padding: 6 }}
                            >
                                <Feather name="chevron-right" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Weekdays Row */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <View key={day} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 4 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>{day}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Days Grid */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {/* Empty cells before first day */}
                            {Array.from({ length: new Date(pickerYear, pickerMonth, 1).getDay() }).map((_, i) => (
                                <View key={\`empty-\${i}\`} style={{ width: '14.28%', height: 36 }} />
                            ))}
                            
                            {/* Month days */}
                            {Array.from({ length: new Date(pickerYear, pickerMonth + 1, 0).getDate() }).map((_, i) => {
                                const dayNum = i + 1;
                                const dateString = formatPickerDate(pickerYear, pickerMonth, dayNum);
                                
                                // Check if selected
                                let isSelected = false;
                                if (activeDatePickerField === 'landPrepStarted') isSelected = landPrepStartedDate === dateString;
                                else if (activeDatePickerField === 'landPrepEnded') isSelected = landPrepEndedDate === dateString;
                                else if (activeDatePickerField === 'plantingStarted') isSelected = plantingStartedDate === dateString;
                                else if (activeDatePickerField === 'bioInputApp') isSelected = bioInputAppDate === dateString;
                                else if (activeDatePickerField === 'expectedHarvest') isSelected = expectedHarvestDate === dateString;
                                else if (activeDatePickerField === 'actualHarvest') isSelected = harvestStartedDate === dateString;
                                else if (activeDatePickerField === 'harvest') isSelected = harvestDate === dateString;

                                return (
                                    <TouchableOpacity 
                                        key={\`day-\${dayNum}\`} 
                                        onPress={() => {
                                            if (activeDatePickerField === 'landPrepStarted') setLandPrepStartedDate(dateString);
                                            else if (activeDatePickerField === 'landPrepEnded') setLandPrepEndedDate(dateString);
                                            else if (activeDatePickerField === 'plantingStarted') setPlantingStartedDate(dateString);
                                            else if (activeDatePickerField === 'bioInputApp') setBioInputAppDate(dateString);
                                            else if (activeDatePickerField === 'expectedHarvest') setExpectedHarvestDate(dateString);
                                            else if (activeDatePickerField === 'actualHarvest') setHarvestStartedDate(dateString);
                                            else if (activeDatePickerField === 'harvest') setHarvestDate(dateString);
                                            
                                            setIsDatePickerOpen(false);
                                        }}
                                        style={{ 
                                            width: '14.28%', 
                                            height: 36, 
                                            justifyContent: 'center', 
                                            alignItems: 'center', 
                                            borderRadius: 18, 
                                            backgroundColor: isSelected ? colors.primary : 'transparent',
                                            marginVertical: 1
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.text }}>
                                            {dayNum}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                    </View>
                </View>
            </Modal>
        </View>
    );
}`;

if (content.includes(modalAppendTarget)) {
    content = content.replace(modalAppendTarget, modalAppendReplacement);
    console.log("Successfully appended custom date picker Modal component!");
} else {
    console.error("Could not find modal append target.");
    process.exit(1);
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching custom date picker in logActivities.tsx!");

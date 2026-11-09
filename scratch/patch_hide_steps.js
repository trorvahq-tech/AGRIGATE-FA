const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Wrap Step 5: Quantity & Unit Selection
const step5Target = `{/* 5. Quantity & Unit Selection */}
                            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>5. Quantity & Controlled Measurement Unit</Text>
                            <View style={styles.unitRow}>
                                <TextInput
                                    style={[styles.textInput, { flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Enter quantity (e.g. 50)"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    value={quantityValue}
                                    onChangeText={setQuantityValue}
                                />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                                    {STANDARD_UNITS.map((u) => (
                                        <TouchableOpacity
                                            key={u.id}
                                            style={[
                                                styles.unitPill,
                                                {
                                                    backgroundColor: selectedUnit === u.id ? colors.primary : isDarkMode ? '#1E293B' : '#E2E8F0',
                                                },
                                            ]}
                                            onPress={() => setSelectedUnit(u.id)}
                                        >
                                            <Text style={[styles.unitPillText, { color: selectedUnit === u.id ? '#FFF' : colors.text }]}>
                                                {u.id}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>`;

const step5Replacement = `{selectedActivityId !== 'PS-01' && (
                                <>
                                    {/* 5. Quantity & Unit Selection */}
                                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>5. Quantity & Controlled Measurement Unit</Text>
                                    <View style={styles.unitRow}>
                                        <TextInput
                                            style={[styles.textInput, { flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                            placeholder="Enter quantity (e.g. 50)"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="numeric"
                                            value={quantityValue}
                                            onChangeText={setQuantityValue}
                                        />
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                                            {STANDARD_UNITS.map((u) => (
                                                <TouchableOpacity
                                                    key={u.id}
                                                    style={[
                                                        styles.unitPill,
                                                        {
                                                            backgroundColor: selectedUnit === u.id ? colors.primary : isDarkMode ? '#1E293B' : '#E2E8F0',
                                                        },
                                                    ]}
                                                    onPress={() => setSelectedUnit(u.id)}
                                                >
                                                    <Text style={[styles.unitPillText, { color: selectedUnit === u.id ? '#FFF' : colors.text }]}>
                                                        {u.id}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </>
                            )}`;

if (content.includes(step5Target)) {
    content = content.replace(step5Target, step5Replacement);
    console.log("Successfully wrapped Step 5!");
} else {
    console.error("Could not find Step 5 target in file!");
    process.exit(1);
}

// 2. Wrap Step 7: Photo Evidence
const step7Target = `                            {/* 7. Photo Evidence */}
                            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>7. Verification Evidence Photo</Text>
                            {evidenceImage ? (
                                <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                    <View style={styles.editImageOverlay}>
                                        <Feather name="edit-2" size={16} color="white" />
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary }]} onPress={pickImage}>
                                    <Text style={[styles.photoButtonText, { color: colors.primary }]}>Take / Upload Photo Evidence</Text>
                                </TouchableOpacity>
                            )}`;

const step7Replacement = `                            {selectedActivityId !== 'PS-01' && (
                                <>
                                    {/* 7. Photo Evidence */}
                                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>7. Verification Evidence Photo</Text>
                                    {evidenceImage ? (
                                        <TouchableOpacity onPress={pickImage} style={styles.imagePreviewContainer}>
                                            <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />
                                            <View style={styles.editImageOverlay}>
                                                <Feather name="edit-2" size={16} color="white" />
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity style={[styles.photoButton, { borderColor: colors.primary }]} onPress={pickImage}>
                                            <Text style={[styles.photoButtonText, { color: colors.primary }]}>Take / Upload Photo Evidence</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}`;

if (content.includes(step7Target)) {
    content = content.replace(step7Target, step7Replacement);
    console.log("Successfully wrapped Step 7!");
} else {
    console.error("Could not find Step 7 target in file!");
    process.exit(1);
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed hiding Step 5 and Step 7 for PS-01!");
